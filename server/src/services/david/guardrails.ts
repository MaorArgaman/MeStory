/**
 * Guardrails for everything David publishes. Two layers:
 *   1. A fast heuristic scan for obvious red flags (promises, guarantees,
 *      percentages, commitment language) in Hebrew and English.
 *   2. An LLM reviewer that catches nuance the regex can't.
 *
 * Hard rules (from the product owner):
 *   - No number the company commits to (stats about MeStory, counts of
 *     users/books/sales, percentages, "ranked #1", etc.).
 *   - No invented facts about the company (features, history, partnerships).
 *   - No promises or guarantees about MeStory or its results.
 *
 * Generic, evergreen, educational content about memorial books, writing,
 * grief, and heritage is fine — claims/numbers ABOUT US are not.
 */

import { ArticleBody } from './types';
import { anthropicStructured } from './llmClients';

export interface GuardrailResult {
  ok: boolean;
  violations: string[];
}

// Promise / guarantee / commitment language.
const PROMISE_PATTERNS: RegExp[] = [
  /\bguarantee(d|s)?\b/i,
  /\bwe promise\b/i,
  /\bguaranteed results?\b/i,
  /\bwill (?:definitely|certainly|always)\b/i,
  /\b100% (?:guaranteed|success|satisfaction)\b/i,
  /\bbest (?:platform|service) (?:in the world|ever)\b/i,
  /מבטיח(?:ים|ה)?/,
  /מתחייב(?:ים|ת|ה)?/,
  /מובטח/,
  /הבטחה/,
  /ערבים לכך/,
  /אחריות מלאה/,
  /התוצאה מובטחת/,
];

// Numeric commitment flags. A standalone percentage, or a large round
// count, is almost always a claim — flag for the LLM/owner to confirm.
const NUMBER_PATTERNS: RegExp[] = [
  /\d+\s?%/,           // any percentage
  /\d{4,}/,            // 1000+ (e.g. "10,000 users")
  /אלפי/,              // "thousands of"
  /מאות אלפי/,         // "hundreds of thousands"
  /מיליוני/,           // "millions of"
  /\bthousands of\b/i,
  /\bmillions of\b/i,
  /\b#1\b/,
  /(?:מספר|מקום)\s*1\b/,
];

function collectText(body: ArticleBody | undefined, title: string, description: string): string {
  const b = body || ({} as Partial<ArticleBody>);
  const parts: string[] = [title || '', description || '', b.intro || '', b.conclusion || ''];
  for (const s of b.sections || []) {
    parts.push(s.heading || '');
    parts.push(...(s.paragraphs || []));
  }
  for (const f of b.faq || []) {
    parts.push(f.q || '', f.a || '');
  }
  return parts.join('\n');
}

/** Layer 1 — cheap, deterministic. */
export function heuristicScan(
  body: ArticleBody,
  title: string,
  description: string,
): GuardrailResult {
  const text = collectText(body, title, description);
  const violations: string[] = [];

  for (const re of PROMISE_PATTERNS) {
    const m = text.match(re);
    if (m) violations.push(`Promise/guarantee language: "${m[0]}"`);
  }
  for (const re of NUMBER_PATTERNS) {
    const m = text.match(re);
    if (m) violations.push(`Possible numeric/ranking claim: "${m[0]}"`);
  }

  return { ok: violations.length === 0, violations };
}

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', description: 'true only if the article violates NONE of the rules' },
    violations: {
      type: 'array',
      items: { type: 'string' },
      description: 'Each rule violation as a short, specific quote + reason. Empty if ok.',
    },
  },
  required: ['ok', 'violations'],
  additionalProperties: false,
};

/** Layer 2 — LLM reviewer for nuance the regex misses. */
export async function llmReview(
  body: ArticleBody,
  title: string,
  description: string,
): Promise<GuardrailResult> {
  const text = collectText(body, title, description);
  const system = `You are a strict compliance reviewer for MeStory, a platform for creating memorial books and autobiographies. You review marketing/SEO articles BEFORE publication.

REJECT (ok=false) the article if it does ANY of these:
1. States a specific NUMBER as a company claim/commitment — e.g. number of users, books created, sales, satisfaction %, ranking ("#1", "leading by X"), growth rates, or any statistic about MeStory.
2. Invents a FACT about the company — a feature that may not exist, a price, a partnership, an award, a date/history, a person, or a capability you cannot be certain MeStory has.
3. Makes a PROMISE or GUARANTEE about MeStory or about results the reader will get.

ALLOW (ok=true) generic, evergreen, educational content: how to write a memorial book, tips for interviewing relatives, dealing with grief, preserving heritage, general benefits of writing — as long as it makes no specific company claims, numbers, or promises. Mentioning that MeStory exists and helps with these tasks in general terms is fine.

Return ok=false with the offending quotes if in doubt.`;

  const res = await anthropicStructured<GuardrailResult>({
    system,
    prompt: `Review this article.\n\nTITLE: ${title}\nDESCRIPTION: ${description}\n\nBODY:\n${text}`,
    toolName: 'submit_review',
    schema: REVIEW_SCHEMA,
    maxTokens: 800,
  });

  // If the reviewer is unavailable, fail open ONLY for the LLM layer — the
  // heuristic layer still ran. The caller combines both.
  if (!res) return { ok: true, violations: [] };
  return { ok: !!res.ok, violations: res.violations || [] };
}

/** Combined check used before publishing. */
export async function reviewArticle(
  body: ArticleBody,
  title: string,
  description: string,
): Promise<GuardrailResult> {
  const h = heuristicScan(body, title, description);
  const l = await llmReview(body, title, description);
  return {
    ok: h.ok && l.ok,
    violations: [...h.violations, ...l.violations],
  };
}
