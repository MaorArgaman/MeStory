/**
 * Planner agent — calls Claude Sonnet 4.6 with tool-use to produce a
 * schema-valid DesignPlan for a given book.
 *
 * Why tool-use instead of free-form JSON: Claude's tool-use path enforces
 * the input_schema at the model level, so the response is guaranteed
 * to parse and conform to designPlanJsonSchema. We still run
 * validateDesignPlan() afterwards for semantic checks the JSON schema
 * can't express.
 *
 * The planner does NOT loop or call other tools. It produces one plan in
 * one call. Revision (if the critic rejects) is a separate `revise()`
 * call with the prior plan + critique as additional context.
 */

import Anthropic from '@anthropic-ai/sdk';
import { IBook, IChapter, IPageImage } from '../../models/Book';
import {
  DesignPlan,
  designPlanJsonSchema,
  ValidationIssue,
} from './designPlanSchema';
import { plannerSystemsCatalog, getDesignSystem } from './designSystems';
import { plannerBuiltSystemsDetail } from './systems';
import { collectBookImages } from './collectImages';
import { logAiUsage } from '../aiUsageLog';

const MODEL = 'claude-sonnet-4-6';
// Output cap kept at 12k (down from 16k): a design plan JSON fits comfortably,
// and the tighter cap bounds worst-case Claude cost so auto_design_premium
// (90 credits) keeps profit >= 4x even on a 2-call revision. See creditCosts.ts.
const MAX_OUTPUT_TOKENS = 12000;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set — auto-design feature requires it');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

const SUBMIT_TOOL_NAME = 'submit_design_plan';

export interface PlannerInput {
  book: IBook;
  /** 1 on the first try, 2 or 3 on regenerate. Used to vary seed and
   *  forbid previously-picked systems. */
  attemptNumber: 1 | 2 | 3;
  /** Systems used on prior attempts on this book — planner should pick
   *  a different one for variety. */
  previousSystems: string[];
  /** If the critic rejected an earlier attempt within this same generate,
   *  the issues are passed back so the revision pass can fix them. */
  priorRevisionIssues?: ValidationIssue[];
  priorPlan?: DesignPlan;
}

export interface PlannerOutput {
  plan: DesignPlan;
  /** The planner's one-sentence rationale for system + tone. Stored on
   *  the book row for debugging and shown in the UI tooltip. */
  reasoning: string;
  /** Token usage for telemetry. */
  usage: { input: number; output: number };
}

/**
 * Build the system prompt. Static — does not depend on the specific book.
 * IMPORTANT: keep it static (no dates, no per-book text) — planDesign puts a
 * prompt-cache breakpoint on it. Because tools render before system in the
 * prompt, that single breakpoint caches the (also static) design-plan JSON
 * schema together with this text; cached reads bill at ~10% of input price.
 */
function buildSystemPrompt(): string {
  return `You are a senior book designer producing typesetting plans for Hebrew books on the MeStory platform.

You output a DesignPlan via the ${SUBMIT_TOOL_NAME} tool. The plan is then rendered by two engines: an HTML/CSS engine for the web preview and PDF export, and a DOCX engine for Word export. The two engines render the same plan, so what you describe must be expressible in both — no exotic layouts that only work in one.

You must:
1. Choose ONE design system from the catalog. Match the book's tone, genre, and audience. If the book is a personal memoir, prefer memoir-warm. If it's a children's story, prefer storybook-illustrated or fairytale-classic. If it's poetry, prefer poetry-quiet.
2. Produce a sequence of pages that covers every chapter. Each chapter must have EXACTLY ONE page with a "chapter-opener" block (where the chapter title and chapter number live). The next pages for that chapter are "body" pages that contain its prose.
3. Vary pagination — don't make every page look identical. Use pull-quote pages, image-feature pages, dividers, and spacers to give the book rhythm.
4. IMAGES: when the book provides images, you MUST use them — a designed book that ignores the author's photos/illustrations is a failure. Aim to place EVERY available image at least once, and use at least one image-feature, layered, or image-overlay-opener page for roughly every 2-3 images. Spread them across chapters near relevant content. Reference images ONLY by the exact ids listed in the user prompt (e.g. "img-0"); never invent ids. If (and only if) the book has no images, produce no image blocks.
5. Respect these rules:
   - No paragraph block may exceed 2000 characters. Split long paragraphs across multiple paragraph blocks.
   - A page with a "full-bleed" image cannot contain more than a tiny caption — no body paragraphs.
   - The first page is always a title page (kind="title", with one title-page block).
   - The second page may be a TOC if the book has 3+ chapters.
6. Pick a palette and typography that fits the system. You may customize from the system's defaults — but stay coherent (no neon green in memoir-warm).
7. Set "seed" to any integer 0..2147483647. Renderers use it to vary ornament rotation and similar tiny details so two regenerates of the same plan still differ.
8. Set "tone" to a short tag like "intimate-warm" or "playful-bright" — used for analytics only.

RICH DESIGN VOCABULARY — use these to reach a professional, varied result (don't just stack body paragraphs):
- For FULLY-BUILT systems (detailed below) you MUST set "variant" to the id of the palette variant whose mood best matches the book, and copy that variant's exact palette into "palette". Also set "scaleRatio" to one of the system's allowed ratios. EXCEPTION: if the user prompt contains a COVER DESIGN block, pick the variant CLOSEST to the cover colors and you may nudge the copied palette toward the cover's hues so the interior and cover match — visual unity with the cover takes priority over using a variant's defaults verbatim.
- chapter-opener: set "template" to one of the system's opener templates. Use "image-overlay" (and set its "imageId") ONLY when that chapter has a strong lead photo — it makes a dramatic full-page opening. Otherwise use "numeral-ornament" or the system's other templates. VARY the template across chapters so openings don't feel repetitive.
- image: set "treatment" (e.g. framed, polaroid, postcard, duotone, vignette, rounded) from the system's supported treatments. Choose treatments that suit the mood (polaroid/postcard feel personal; duotone/vignette feel cinematic). Use "placement" to vary: framed-center, side-left/right (text wraps), full-bleed, full-bleed-top.
- layered: a full/partial-page image with a few short overlay texts on top, behind a scrim (use "gradient-bottom" or "dark" so text stays legible). Perfect for a dramatic spread or feature page (kind="spread" or "image-feature"). NEVER put long body text in a layered overlay — only a heading + maybe one short line.
- pull-quote: lift a powerful sentence from the chapter onto its own page (kind="pull-quote") or inline for rhythm.
- paragraph.runInHead: a short bold lead phrase that opens a paragraph (editorial touch). paragraph.dropCap: true on the FIRST body paragraph of a chapter only. paragraph.lead: true for an intro paragraph.
- divider (ornament/rule/stars), accent-bar, spacer, margin-note: use for rhythm and breathing room. A great book varies its pages.

PACING: think like a designer. Open each chapter with a designed opener page, let the first body page breathe (lead paragraph + drop cap), break long stretches with a pull-quote or a feature image, and use dividers between scenes. Aim for visual rhythm, not uniformity.

If attemptNumber > 1, you MUST pick a different designSystem than any in previousSystems. The same content gets a fresh visual identity on regenerate. Also pick a different variant and opener-template mix so it feels genuinely new.

If priorRevisionIssues are present, you are revising a previous plan. Fix every "block" severity issue. Keep what was working.

Design systems catalog (all 10):
${plannerSystemsCatalog()}

FULLY-BUILT systems — these have palette variants and richer rendering. Prefer them when they fit, and follow their variant/opener/treatment options exactly:
${plannerBuiltSystemsDetail()}

Return ONLY through the ${SUBMIT_TOOL_NAME} tool. Do not produce any free text.`;
}

/**
 * Extract the cover's colors + title font so the planner can harmonize the
 * interior palette/typography with the cover the user already designed.
 * Returns '' when there's no cover to match. This is what makes the cover and
 * the typeset interior feel like ONE designed object instead of two unrelated
 * designs.
 */
function buildCoverHarmonyBlock(book: any): string {
  const front = book?.coverDesign?.front;
  if (!front) return '';
  const colors: string[] = [];
  if (front.backgroundColor) colors.push(`background ${front.backgroundColor}`);
  if (Array.isArray(front.gradientColors) && front.gradientColors.length) {
    colors.push(`gradient [${front.gradientColors.join(', ')}]`);
  }
  if (front.title?.color) colors.push(`title text ${front.title.color}`);
  if (front.authorName?.color) colors.push(`author text ${front.authorName.color}`);
  if (book?.coverDesign?.back?.backgroundColor) colors.push(`back-cover ${book.coverDesign.back.backgroundColor}`);
  const titleFont = front.title?.font;
  if (colors.length === 0 && !titleFont) return '';

  return `

COVER DESIGN — the user already designed the cover. The interior MUST visually match it so the book feels like one cohesive object:
- Cover colors: ${colors.join(', ') || '(none specified)'}${titleFont ? `\n- Cover title font: ${titleFont}` : ''}
Choose the palette VARIANT whose colors are closest to the cover, and tune your "palette" toward these cover hues (same color family / tasteful complement) while staying readable. If a cover title font is given, prefer a heading font that pairs naturally with it. Do NOT pick a palette that clashes with the cover (e.g. a cool blue interior for a warm brown cover).`;
}

/**
 * Build the per-book user prompt. Includes everything Claude needs:
 * metadata, chapters with summaries (not full text — that's too long),
 * available images, attempt context.
 */
function buildUserPrompt(input: PlannerInput): string {
  const { book, attemptNumber, previousSystems, priorRevisionIssues, priorPlan } = input;

  const chaptersSummary = (book.chapters || [])
    .map((ch: IChapter, i: number) => {
      // Use the first 400 chars of content as a "summary" — gives Claude
      // a sense of the chapter's tone without bloating the prompt.
      const preview = (ch.content || '').replace(/\s+/g, ' ').slice(0, 400);
      return `Chapter ${i}: "${ch.title}" (${ch.wordCount || 0} words)\n   preview: ${preview}${(ch.content?.length || 0) > 400 ? '…' : ''}`;
    })
    .join('\n');

  // Images are referenced by STABLE INDEX id ("img-0", …) over a UNIFIED list
  // that merges book.pageImages + pageLayout.pages[].images (collectBookImages).
  // Index is the only reliable handle — page_images entries often lack any _id.
  const collected = collectBookImages(book);
  const imagesSummary =
    collected
      .map((img) => {
        const desc = img.prompt ? `, depicts: ${img.prompt.replace(/\s+/g, ' ').slice(0, 90)}` : '';
        return `- id="${img.id}" (${img.isAiGenerated ? 'AI-generated illustration' : 'photo'}${desc})`;
      })
      .join('\n') || '(no images available)';

  let revisionBlock = '';
  if (priorRevisionIssues && priorRevisionIssues.length > 0 && priorPlan) {
    const issuesText = priorRevisionIssues
      .map((iss) => `- [${iss.severity}]${iss.page !== undefined ? ` page ${iss.page}:` : ''} ${iss.message}`)
      .join('\n');
    revisionBlock = `

REVISION REQUIRED — previous attempt had these issues:
${issuesText}

The previous designSystem was "${priorPlan.designSystem}". You may keep the same system if it was a good fit; only fix what was broken. Or pick a different one if the system itself was wrong for the book.`;
  }

  const previousSystemsBlock =
    attemptNumber > 1 && previousSystems.length > 0
      ? `\n\nThis is attempt ${attemptNumber}. You MUST NOT use any of these previously-tried systems: ${previousSystems.join(', ')}.`
      : '';

  return `Book metadata:
- Title: ${book.title}
- Genre: ${book.genre}
- Target audience: ${book.targetAudience || 'unspecified'}
- Writing goal: ${book.writingGoal || 'unspecified'}
- Description: ${book.description || '(none)'}
- Language: ${book.language}
- Chapter count: ${book.chapters?.length || 0}
- Total word count: ${book.statistics?.wordCount || 0}

Chapters (${book.chapters?.length || 0}):
${chaptersSummary || '(no chapters)'}

Available images:
${imagesSummary}${buildCoverHarmonyBlock(book)}${previousSystemsBlock}${revisionBlock}

Produce a complete DesignPlan via ${SUBMIT_TOOL_NAME}.`;
}

/**
 * Plan a design for the given book. Single LLM call. The caller is the
 * orchestrator, which handles retry/critique/revision.
 */
export async function planDesign(input: PlannerInput): Promise<PlannerOutput> {
  const c = getClient();
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(input);

  const response = await c.messages.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    // System as a block array so we can set a cache breakpoint. Tools render
    // before system, so this one marker caches the JSON schema + catalog +
    // instructions (~all the static tokens). Cast: SDK 0.30.x doesn't type
    // cache_control on the GA path yet, but the API accepts it.
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ] as any,
    tools: [
      {
        name: SUBMIT_TOOL_NAME,
        description:
          'Submit the final DesignPlan for the book. The plan will be rendered by both the web preview engine and the DOCX export engine.',
        input_schema: designPlanJsonSchema as any,
      },
    ],
    tool_choice: { type: 'tool', name: SUBMIT_TOOL_NAME },
    messages: [{ role: 'user', content: userPrompt }],
  });

  // Cache fields are absent from SDK 0.30.x types; present in the API response.
  const usageRaw = response.usage as any;
  const cacheReadTokens = usageRaw.cache_read_input_tokens || 0;
  const cacheWriteTokens = usageRaw.cache_creation_input_tokens || 0;

  // Cost visibility (docs/BUSINESS_STRATEGY.md) — fire-and-forget.
  void logAiUsage({
    feature: 'auto_design_planner',
    provider: 'anthropic',
    model: MODEL,
    userId: input.book.author || null,
    bookId: input.book.id || input.book._id || null,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens,
    cacheWriteTokens,
    metadata: {
      attemptNumber: input.attemptNumber,
      isRevision: Boolean(input.priorRevisionIssues?.length),
    },
  });

  // Extract the tool_use block — with tool_choice forced, there is
  // exactly one and it is the design plan.
  const toolBlock = response.content.find(
    (b: any) => b.type === 'tool_use' && b.name === SUBMIT_TOOL_NAME
  ) as any;

  if (!toolBlock) {
    throw new Error(
      `Planner did not return a ${SUBMIT_TOOL_NAME} tool call. Stop reason: ${response.stop_reason}`
    );
  }

  const plan = toolBlock.input as DesignPlan;

  // The system / planner is meant to ALSO return a one-sentence reasoning
  // in the tool input… but our schema doesn't include it (would break
  // the renderers). Take it from the system field instead — Claude may
  // surface its reasoning as a leading text block before the tool call,
  // even though the prompt tells it not to. If absent, fall back.
  const textBlock = response.content.find((b: any) => b.type === 'text') as any;
  const reasoning = textBlock?.text?.trim() || `${plan.designSystem} chosen for ${plan.tone}`;

  return {
    plan,
    reasoning,
    usage: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}

/**
 * Quick sanity check that the chosen design system exists. Defensive —
 * the JSON schema enum already enforces this, but renderers do too.
 */
export function planUsesKnownSystem(plan: DesignPlan): boolean {
  try {
    getDesignSystem(plan.designSystem);
    return true;
  } catch {
    return false;
  }
}
