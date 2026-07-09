/**
 * importService — turns an uploaded manuscript into a chapter structure.
 *
 * Three detection layers, cheapest first (IMPLEMENTATION_PLAN §א.3):
 *   1. 'headings' — Word heading styles from mammoth's HTML output. Free,
 *      deterministic, and right for most well-formed DOCX files.
 *   2. 'markers'  — the regex splitter ("פרק N" / "Chapter N" / numbered
 *      headings). Free. Moved here from bookController.
 *   3. 'ai'       — Claude Haiku, ONLY when the free layers produced a single
 *      long chapter. It sees candidate heading LINES (never the full text),
 *      so the call stays small and cheap. Logged to ai_usage_log.
 *
 * Every layer can fail without breaking the upload — worst case the book
 * imports as a single chapter and the structure-review screen offers manual
 * splitting.
 */

import Anthropic from '@anthropic-ai/sdk';
import { logAiUsage } from '../aiUsageLog';

export interface ImportedChapter {
  title: string;
  content: string;
}

export interface DetectedStructure {
  chapters: ImportedChapter[];
  method: 'headings' | 'markers' | 'ai' | 'single';
  confidence: 'high' | 'low';
}

const AI_MODEL = 'claude-haiku-4-5';
/** Below this, a single-chapter import is plausibly just a short story. */
const AI_REFINE_MIN_WORDS = 3000;

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

/* ------------------------------------------------------------------ */
/* Layer 1: Word heading styles (mammoth convertToHtml output)         */
/* ------------------------------------------------------------------ */

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/** Convert a mammoth HTML fragment to plain text with paragraph breaks. */
function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|h[1-6]|li|blockquote|div)>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Split on Word heading styles. Uses h1 when the document has 2+ of them,
 * otherwise h1+h2 together. Returns null when there aren't enough headings
 * to describe a structure.
 */
export function splitByDocxHeadings(html: string): ImportedChapter[] | null {
  const headingRegex = /<h([12])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const found: Array<{ level: string; title: string; start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = headingRegex.exec(html)) !== null) {
    const title = htmlToText(m[2]).replace(/\s+/g, ' ').trim();
    if (title) found.push({ level: m[1], title, start: m.index, end: m.index + m[0].length });
  }
  if (found.length === 0) return null;

  const h1s = found.filter((h) => h.level === '1');
  const headings = h1s.length >= 2 ? h1s : found;
  if (headings.length < 2) return null;

  const chapters: ImportedChapter[] = [];

  // Front matter before the first heading (title page text, dedication…).
  const preface = htmlToText(html.slice(0, headings[0].start));
  if (preface.length > 100) {
    chapters.push({ title: 'פתיחה', content: preface });
  }

  for (let i = 0; i < headings.length; i++) {
    const bodyEnd = i + 1 < headings.length ? headings[i + 1].start : html.length;
    const content = htmlToText(html.slice(headings[i].end, bodyEnd));
    if (content.length > 0) {
      chapters.push({ title: headings[i].title.slice(0, 120), content });
    }
  }

  return chapters.length >= 2 ? chapters : null;
}

/* ------------------------------------------------------------------ */
/* Layer 2: explicit chapter markers (regex)                           */
/* ------------------------------------------------------------------ */

/**
 * Split on explicit markers: "Chapter X", "פרק X", "חלק X", numbered
 * headings. Single "Imported Content" chapter when nothing matches.
 * (Moved verbatim from bookController.splitTextIntoChapters.)
 */
export function splitByMarkers(text: string): ImportedChapter[] {
  const splitRegex =
    /\n\s*(?:(?:chapter|part|פרק|חלק)\s+(?:\d+|[ivxlcdm]+|[א-ת]{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?:\s*[-:.]?\s*.{0,100})?)\s*\n/gi;

  const hasChapterMarkers = splitRegex.test(text);
  splitRegex.lastIndex = 0;

  if (!hasChapterMarkers) {
    return [{ title: 'Imported Content', content: text }];
  }

  const parts = text.split(splitRegex);
  const matches = text.match(splitRegex) || [];
  const chapters: ImportedChapter[] = [];

  if (parts[0] && parts[0].trim().length > 100) {
    chapters.push({ title: 'Introduction', content: parts[0].trim() });
  }

  for (let i = 0; i < matches.length; i++) {
    const chapterTitle = matches[i].trim().replace(/\n/g, ' ');
    const chapterContent = parts[i + 1] ? parts[i + 1].trim() : '';
    if (chapterContent.length > 0) {
      chapters.push({ title: chapterTitle || `Chapter ${i + 1}`, content: chapterContent });
    }
  }

  if (chapters.length === 0) {
    return [{ title: 'Imported Content', content: text }];
  }
  return chapters;
}

/* ------------------------------------------------------------------ */
/* Layer 3: Claude Haiku on candidate heading lines                    */
/* ------------------------------------------------------------------ */

const SUBMIT_TOOL = 'submit_chapter_headings';

/** A line can plausibly be a chapter heading: short, no sentence ending. */
function isHeadingCandidate(line: string): boolean {
  const t = line.trim();
  if (t.length < 2 || t.length > 80) return false;
  if (t.split(/\s+/).length > 12) return false;
  if (/[,;:]$/.test(t)) return false;
  return true;
}

export async function refineSplitWithAi(
  text: string,
  opts: { userId?: string }
): Promise<ImportedChapter[] | null> {
  const c = getClient();
  if (!c) return null;

  const lines = text.split('\n');
  const candidates = lines
    .map((line, index) => ({ index, text: line.trim() }))
    .filter((l) => isHeadingCandidate(l.text))
    .slice(0, 300);
  if (candidates.length === 0) return null;

  try {
    const response = await c.messages.create({
      model: AI_MODEL,
      max_tokens: 2000,
      system:
        'You identify chapter headings in a manuscript. You are given candidate LINES ' +
        '(index + text) from a book whose automatic chapter detection failed. Decide which ' +
        'candidates are real chapter/section headings (openings of a new chapter), not ' +
        'sentences, names, or dialogue fragments. Prefer consistency: real heading sets ' +
        'share a style. If none look like headings, return an empty list. Respond ONLY via ' +
        `the ${SUBMIT_TOOL} tool.`,
      tools: [
        {
          name: SUBMIT_TOOL,
          description: 'Submit the line indexes that are chapter headings, in ascending order.',
          input_schema: {
            type: 'object' as const,
            properties: {
              headings: {
                type: 'array',
                maxItems: 80,
                items: {
                  type: 'object',
                  properties: {
                    line: { type: 'integer' },
                    title: { type: 'string' },
                  },
                  required: ['line', 'title'],
                },
              },
            },
            required: ['headings'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: SUBMIT_TOOL },
      messages: [
        {
          role: 'user',
          content:
            `Candidate lines (format: [line-index] text):\n` +
            candidates.map((l) => `[${l.index}] ${l.text}`).join('\n'),
        },
      ],
    });

    void logAiUsage({
      feature: 'import_structure',
      provider: 'anthropic',
      model: AI_MODEL,
      userId: opts.userId || null,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      metadata: { candidateCount: candidates.length },
    });

    const toolBlock = response.content.find(
      (b: any) => b.type === 'tool_use' && b.name === SUBMIT_TOOL
    ) as any;
    if (!toolBlock) return null;

    const candidateIndexes = new Set(candidates.map((l) => l.index));
    const headingLines: number[] = Array.from(
      new Set(
        (toolBlock.input?.headings || [])
          .map((h: any) => Number(h?.line))
          .filter((n: number) => Number.isInteger(n) && candidateIndexes.has(n))
      )
    ).sort((a, b) => (a as number) - (b as number)) as number[];

    if (headingLines.length < 2) return null;

    const chapters: ImportedChapter[] = [];
    const preface = lines.slice(0, headingLines[0]).join('\n').trim();
    if (preface.length > 100) {
      chapters.push({ title: 'פתיחה', content: preface });
    }
    for (let i = 0; i < headingLines.length; i++) {
      const from = headingLines[i];
      const to = i + 1 < headingLines.length ? headingLines[i + 1] : lines.length;
      const content = lines.slice(from + 1, to).join('\n').trim();
      if (content.length > 0) {
        chapters.push({ title: lines[from].trim().slice(0, 120), content });
      }
    }
    return chapters.length >= 2 ? chapters : null;
  } catch (err: any) {
    console.warn('[importService] AI split failed, falling back:', err?.message);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Orchestrator                                                        */
/* ------------------------------------------------------------------ */

export async function detectStructure(opts: {
  text: string;
  /** mammoth convertToHtml output — only for DOCX uploads. */
  docxHtml?: string | null;
  userId?: string;
}): Promise<DetectedStructure> {
  const { text, docxHtml, userId } = opts;

  if (docxHtml) {
    const byHeadings = splitByDocxHeadings(docxHtml);
    if (byHeadings) {
      return { chapters: byHeadings, method: 'headings', confidence: 'high' };
    }
  }

  const byMarkers = splitByMarkers(text);
  if (byMarkers.length > 1) {
    return {
      chapters: byMarkers,
      method: 'markers',
      confidence: byMarkers.length >= 2 ? 'high' : 'low',
    };
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > AI_REFINE_MIN_WORDS) {
    const byAi = await refineSplitWithAi(text, { userId });
    if (byAi) {
      return {
        chapters: byAi,
        method: 'ai',
        confidence: byAi.length >= 3 ? 'high' : 'low',
      };
    }
  }

  return {
    chapters: [{ title: 'Imported Content', content: text }],
    method: 'single',
    confidence: 'low',
  };
}
