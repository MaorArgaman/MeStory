/**
 * Simple in-memory Circuit Breaker.
 *
 * Goal: stop hammering a failing upstream (Gemini, OpenAI, DALL-E, Whisper…)
 * and give the user a fast, clear "service unavailable" instead of 30s timeouts.
 *
 * States:
 *   CLOSED  — normal, requests pass through
 *   OPEN    — too many failures; reject immediately for `cooldownMs`
 *   HALF    — cooldown elapsed; allow ONE probe request to test recovery
 *
 * Usage:
 *   const breaker = new CircuitBreaker({ name: 'gemini' });
 *   const result = await breaker.exec(() => gemini.generate(...));
 */

export interface CircuitBreakerOptions {
  name: string;
  failureThreshold?: number; // consecutive failures before opening
  cooldownMs?: number;       // how long to stay OPEN before probing
  timeoutMs?: number;        // per-call hard timeout
}

export class CircuitBreakerOpenError extends Error {
  constructor(name: string, retryInMs: number) {
    super(`Circuit breaker "${name}" is OPEN. Retry in ~${Math.ceil(retryInMs / 1000)}s.`);
    this.name = 'CircuitBreakerOpenError';
  }
}

type State = 'CLOSED' | 'OPEN' | 'HALF';

export class CircuitBreaker {
  private state: State = 'CLOSED';
  private failures = 0;
  private openedAt = 0;

  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly timeoutMs: number;

  constructor(opts: CircuitBreakerOptions) {
    this.name = opts.name;
    this.failureThreshold = opts.failureThreshold ?? 3;
    this.cooldownMs = opts.cooldownMs ?? 60_000;
    this.timeoutMs = opts.timeoutMs ?? 30_000;
  }

  async exec<T>(fn: () => Promise<T>): Promise<T> {
    // If OPEN, check whether cooldown has elapsed
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - this.openedAt;
      if (elapsed < this.cooldownMs) {
        throw new CircuitBreakerOpenError(this.name, this.cooldownMs - elapsed);
      }
      // Cooldown elapsed — move to HALF and allow one probe
      this.state = 'HALF';
    }

    try {
      const result = await this.withTimeout(fn());
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private withTimeout<T>(p: Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`${this.name} call timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
      p.then((v) => { clearTimeout(timer); resolve(v); })
       .catch((e) => { clearTimeout(timer); reject(e); });
    });
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures += 1;
    if (this.state === 'HALF' || this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.openedAt = Date.now();
      console.warn(`[CircuitBreaker:${this.name}] OPENED after ${this.failures} failures`);
    }
  }

  getState(): { state: State; failures: number; name: string } {
    return { state: this.state, failures: this.failures, name: this.name };
  }
}

// Shared breakers for upstream services. Imported by services that call them.
export const geminiBreaker = new CircuitBreaker({
  name: 'gemini',
  failureThreshold: 3,
  cooldownMs: 60_000,
  timeoutMs: 45_000,
});

export const openaiBreaker = new CircuitBreaker({
  name: 'openai',
  failureThreshold: 3,
  cooldownMs: 60_000,
  timeoutMs: 45_000,
});

export const dalleBreaker = new CircuitBreaker({
  name: 'dalle',
  failureThreshold: 3,
  cooldownMs: 120_000,
  timeoutMs: 60_000,
});

export const whisperBreaker = new CircuitBreaker({
  name: 'whisper',
  failureThreshold: 3,
  cooldownMs: 30_000,
  timeoutMs: 60_000,
});
