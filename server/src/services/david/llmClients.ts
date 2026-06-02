/**
 * Thin LLM wrappers used by David. Each helper is defensive: on any
 * failure it returns null/empty rather than throwing, so one provider
 * being down never aborts the daily run.
 *
 * Uses the keys already configured for the platform:
 *   ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY.
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import axios from 'axios';
import { generateWithBreaker } from '../geminiClient';

const ANTHROPIC_MODEL = process.env.DAVID_ANTHROPIC_MODEL || 'claude-sonnet-4-6';
const OPENAI_MODEL = process.env.DAVID_OPENAI_MODEL || 'gpt-4o-mini';
const GEMINI_REST_MODEL = process.env.DAVID_GEMINI_MODEL || 'gemini-2.5-flash';

let anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropic;
}

let openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

// ---------------------------------------------------------------------
// Plain text answers (used for AEO presence checks)
// ---------------------------------------------------------------------

export async function askAnthropic(prompt: string, maxTokens = 700): Promise<string | null> {
  const c = getAnthropic();
  if (!c) return null;
  try {
    const res = await c.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    return res.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n')
      .trim();
  } catch (err: any) {
    console.error('[David] askAnthropic failed:', err.message || err);
    return null;
  }
}

export async function askOpenAI(prompt: string, maxTokens = 700): Promise<string | null> {
  const c = getOpenAI();
  if (!c) return null;
  try {
    const res = await c.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    return res.choices[0]?.message?.content?.trim() || null;
  } catch (err: any) {
    console.error('[David] askOpenAI failed:', err.message || err);
    return null;
  }
}

export async function askGemini(prompt: string): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const res = await generateWithBreaker(prompt);
    return res.response.text()?.trim() || null;
  } catch (err: any) {
    console.error('[David] askGemini failed:', err.message || err);
    return null;
  }
}

/**
 * Ask all three assistants the same question in parallel.
 * Returns a map of provider -> answer text (missing providers omitted).
 */
export async function askAllAssistants(prompt: string): Promise<Record<string, string>> {
  const [a, o, g] = await Promise.all([askAnthropic(prompt), askOpenAI(prompt), askGemini(prompt)]);
  const out: Record<string, string> = {};
  if (a) out.anthropic = a;
  if (o) out.openai = o;
  if (g) out.gemini = g;
  return out;
}

// ---------------------------------------------------------------------
// Grounded Google search (best-effort, via Gemini REST + google_search tool)
// ---------------------------------------------------------------------

/**
 * Returns the grounded answer text plus the list of source domains Gemini
 * actually cited from Google. Returns null if grounding is unavailable.
 */
export async function geminiGroundedSearch(
  query: string,
): Promise<{ text: string; sourceDomains: string[] } | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_REST_MODEL}:generateContent?key=${key}`;
  try {
    const res = await axios.post(
      url,
      {
        contents: [{ role: 'user', parts: [{ text: query }] }],
        tools: [{ google_search: {} }],
      },
      { timeout: 25000, validateStatus: () => true },
    );
    if (res.status >= 400 || !res.data) {
      console.warn('[David] grounded search HTTP', res.status, JSON.stringify(res.data)?.slice(0, 200));
      return null;
    }
    const cand = res.data?.candidates?.[0];
    const text: string =
      cand?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('\n') || '';
    // Grounding metadata carries the actual web sources Google returned.
    const chunks = cand?.groundingMetadata?.groundingChunks || [];
    const domains = new Set<string>();
    for (const ch of chunks) {
      const uri: string | undefined = ch?.web?.uri || ch?.web?.url;
      const domain: string | undefined = ch?.web?.domain || ch?.web?.title;
      if (domain && /\./.test(domain)) domains.add(stripDomain(domain));
      else if (uri) {
        try {
          domains.add(stripDomain(new URL(uri).hostname));
        } catch { /* ignore */ }
      }
    }
    return { text, sourceDomains: [...domains] };
  } catch (err: any) {
    console.warn('[David] geminiGroundedSearch failed:', err.message || err);
    return null;
  }
}

function stripDomain(host: string): string {
  return host.replace(/^www\./, '').toLowerCase();
}

// ---------------------------------------------------------------------
// Structured JSON output via Anthropic tool-use (article + guardrails)
// ---------------------------------------------------------------------

export async function anthropicStructured<T>(opts: {
  system: string;
  prompt: string;
  toolName: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T | null> {
  const c = getAnthropic();
  if (!c) return null;
  try {
    const res = await c.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: opts.maxTokens || 4000,
      system: opts.system,
      tools: [{ name: opts.toolName, description: 'Submit the result', input_schema: opts.schema as any }],
      tool_choice: { type: 'tool', name: opts.toolName },
      messages: [{ role: 'user', content: opts.prompt }],
    });
    const toolUse = res.content.find((b: any) => b.type === 'tool_use') as any;
    return (toolUse?.input as T) ?? null;
  } catch (err: any) {
    console.error('[David] anthropicStructured failed:', err.message || err);
    return null;
  }
}
