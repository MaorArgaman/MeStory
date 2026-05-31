/**
 * Critic agent — a cheap second opinion on the planner's output.
 *
 * Runs the deterministic `validateDesignPlan` first (catches schema-level
 * errors the planner sometimes makes despite the JSON schema, e.g.
 * referring to a nonexistent imageId). Then sends the plan + book
 * metadata to Gemini flash for one judgment pass on the aesthetic /
 * coherence quality.
 *
 * Gemini, not Claude, deliberately:
 *   - the JSON-schema enforcement we need is already done by the planner
 *   - this is a cheap "did the planner do something silly?" check
 *   - keeps the bulk of LLM cost on Sonnet (planner) where it matters
 *
 * The critic only ever returns "pass" or "block" — there is no warn-only
 * path that lets the plan through with notes. (Warn issues from the
 * deterministic check are surfaced but don't trigger revision.)
 */

import { generateWithBreaker } from '../geminiClient';
import { IBook } from '../../models/Book';
import { DesignPlan, validateDesignPlan, ValidationIssue } from './designPlanSchema';
import { collectBookImages } from './collectImages';

export interface CriticInput {
  book: IBook;
  plan: DesignPlan;
}

export interface CriticOutput {
  pass: boolean;
  issues: ValidationIssue[];
}

/**
 * Run the critic. Combines deterministic checks with one Gemini call.
 * If the deterministic check finds ANY block-severity issue, we skip
 * the LLM call (it can't override a structural failure).
 */
export async function critiquePlan(input: CriticInput): Promise<CriticOutput> {
  const { book, plan } = input;

  // Images are referenced by stable index id over the UNIFIED image list
  // (pageImages + pageLayout pages) — same scheme the planner is given.
  const availableImageIds = new Set(collectBookImages(book).map((img) => img.id));
  const chapterCount = book.chapters?.length || 0;

  const deterministicIssues = validateDesignPlan(plan, {
    chapterCount,
    availableImageIds,
  });

  const hasBlocking = deterministicIssues.some((i) => i.severity === 'block');
  if (hasBlocking) {
    // No point asking Gemini — structural failure must be fixed first.
    return { pass: false, issues: deterministicIssues };
  }

  // Ask Gemini for an aesthetic / coherence judgment. We only escalate
  // to "block" on a clearly broken plan; nitpicks are kept as warnings.
  const llmIssues = await runLlmCritique(book, plan);
  const allIssues = [...deterministicIssues, ...llmIssues];
  const stillBlocking = allIssues.some((i) => i.severity === 'block');

  return { pass: !stillBlocking, issues: allIssues };
}

async function runLlmCritique(book: IBook, plan: DesignPlan): Promise<ValidationIssue[]> {
  const prompt = buildCriticPrompt(book, plan);

  let text: string;
  try {
    const result = await generateWithBreaker(prompt);
    text = result.response.text();
  } catch (err: any) {
    // If Gemini is down, don't block the user — degrade gracefully and
    // let the plan through. The deterministic check already passed.
    console.warn('[autoDesign/critic] Gemini critique failed, allowing plan through:', err?.message);
    return [];
  }

  return parseCriticResponse(text);
}

function buildCriticPrompt(book: IBook, plan: DesignPlan): string {
  // Compact summary — Gemini doesn't need every paragraph, just enough
  // to judge fit and basic sanity.
  const pageSummary = plan.pages.map((p, i) => {
    const blockTypes = p.blocks.map((b) => b.type).join(',');
    return `  page ${i}: kind=${p.kind}${p.chapterIndex !== undefined ? ` ch=${p.chapterIndex}` : ''} blocks=[${blockTypes}]`;
  }).join('\n');

  return `You are reviewing a book design plan produced by another AI for the following Hebrew book:

Book: "${book.title}"
Genre: ${book.genre}
Audience: ${book.targetAudience || 'unspecified'}
Chapter count: ${book.chapters?.length || 0}
Total word count: ${book.statistics?.wordCount || 0}
Description: ${book.description || '(none)'}

Plan summary:
- designSystem: ${plan.designSystem}
- tone tag: ${plan.tone}
- palette: text=${plan.palette.text} bg=${plan.palette.background} accent=${plan.palette.accent}
- typography: body="${plan.typography.bodyFamily}" heading="${plan.typography.headingFamily}" size=${plan.typography.baseSize}pt leading=${plan.typography.leading}
- pages (${plan.pages.length} total):
${pageSummary}

Judge the plan on these dimensions:
1. Is the chosen designSystem a good match for the book's genre and audience? (e.g. memoir-warm for a memoir = good; bold-magazine for a children's book = bad fit)
2. Is the pacing reasonable? (e.g. wall of body pages with no breaks = bad; pull-quotes/image-features used sensibly = good)
3. Any obvious mismatch — palette inappropriate for tone, typography that won't render in Hebrew, etc.?

Respond with a single JSON object, NO markdown, NO prose, no code fences:
{ "issues": [ {"severity":"block"|"warn", "message":"..."} ] }

Use "block" sparingly — only when the plan would visibly embarrass the user. Use "warn" for stylistic concerns. Empty issues array = perfect plan. Maximum 4 issues total.`;
}

function parseCriticResponse(text: string): ValidationIssue[] {
  // Strip code fences if Gemini snuck them in despite instructions.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try to extract the first { ... } block.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      console.warn('[autoDesign/critic] Gemini returned unparseable response, allowing plan.');
      return [];
    }
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return [];
    }
  }

  const rawIssues = Array.isArray(parsed?.issues) ? parsed.issues : [];
  return rawIssues
    .filter((i: any) => typeof i?.message === 'string')
    .slice(0, 4)
    .map((i: any) => ({
      severity: i.severity === 'block' ? 'block' : 'warn',
      message: String(i.message).slice(0, 300),
    }));
}
