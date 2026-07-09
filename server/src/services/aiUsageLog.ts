/**
 * AI usage log — records every LLM call with token counts and computed
 * USD cost, into the ai_usage_log table (migration 013).
 *
 * Why: margins depend on knowing the real AI cost per generation and per
 * user (docs/BUSINESS_STRATEGY.md §7). Without this table there is no way
 * to see cloud spend per feature or to alert when a day's cost spikes.
 *
 * Fire-and-forget by design: logAiUsage never throws and never blocks the
 * user-facing flow — a lost log row is better than a failed design.
 */

import { supabaseAdmin } from '../config/supabase';

/**
 * USD per MILLION tokens. Anthropic prices per https://platform.claude.com/docs/en/pricing
 * (verified 2026-07-09). Cache read ≈ 10% of input price; cache write (5-min
 * TTL) = 1.25x input price. Gemini prices are approximate — Google bills us
 * separately; update if the invoice diverges.
 */
const PRICES_PER_MTOK: Record<
  string,
  { input: number; output: number; cacheRead: number; cacheWrite: number }
> = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-haiku-4-5': { input: 1.0, output: 5.0, cacheRead: 0.1, cacheWrite: 1.25 },
  'gemini-2.5-flash': { input: 0.3, output: 2.5, cacheRead: 0.075, cacheWrite: 0.3 },
};

export interface AiUsageEntry {
  feature: string; // e.g. 'auto_design_planner'
  provider: 'anthropic' | 'google';
  model: string;
  userId?: string | null;
  bookId?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  metadata?: Record<string, unknown>;
}

/** Compute the call's USD cost from the price table. Unknown model → 0 with a warn. */
export function computeCostUsd(entry: AiUsageEntry): number {
  const prices = PRICES_PER_MTOK[entry.model];
  if (!prices) {
    console.warn(`[aiUsageLog] no price entry for model "${entry.model}" — logging cost 0`);
    return 0;
  }
  const cost =
    ((entry.inputTokens || 0) * prices.input +
      (entry.outputTokens || 0) * prices.output +
      (entry.cacheReadTokens || 0) * prices.cacheRead +
      (entry.cacheWriteTokens || 0) * prices.cacheWrite) /
    1_000_000;
  return Math.round(cost * 1_000_000) / 1_000_000; // 6 decimal places, matches NUMERIC(12,6)
}

export async function logAiUsage(entry: AiUsageEntry): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('ai_usage_log').insert({
      feature: entry.feature,
      provider: entry.provider,
      model: entry.model,
      user_id: entry.userId || null,
      book_id: entry.bookId || null,
      input_tokens: entry.inputTokens || 0,
      output_tokens: entry.outputTokens || 0,
      cache_read_tokens: entry.cacheReadTokens || 0,
      cache_write_tokens: entry.cacheWriteTokens || 0,
      cost_usd: computeCostUsd(entry),
      metadata: entry.metadata || null,
    });
    if (error) {
      console.warn('[aiUsageLog] insert failed:', error.message);
    }
  } catch (err: any) {
    console.warn('[aiUsageLog] insert threw:', err?.message);
  }
}
