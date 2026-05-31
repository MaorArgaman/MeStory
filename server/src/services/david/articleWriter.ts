/**
 * Generates one evergreen, SEO/AEO-optimised article as structured JSON.
 * The structure (intro / sections / FAQ / conclusion) renders safely on the
 * site and maps directly to Article + FAQ schema for AI search engines.
 *
 * The guardrail rules are baked into the system prompt as the first line of
 * defence; davidAgent additionally runs reviewArticle() before publishing.
 */

import { anthropicStructured } from './llmClients';
import { ArticleBody, Lang, Competitor } from './types';

export interface GeneratedArticle {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  body: ArticleBody;
}

const ARTICLE_SCHEMA = {
  type: 'object',
  properties: {
    slug: {
      type: 'string',
      description: 'URL slug, lowercase a-z/0-9/hyphens only, 3-8 words, English even for Hebrew articles',
    },
    title: { type: 'string', description: 'Compelling H1, under 65 chars, no brand suffix' },
    description: { type: 'string', description: 'Meta description, 120-160 chars' },
    keywords: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 10 },
    body: {
      type: 'object',
      properties: {
        intro: { type: 'string', description: '2-3 sentence opening that answers the core question immediately (good for AEO snippets)' },
        sections: {
          type: 'array',
          minItems: 3,
          maxItems: 7,
          items: {
            type: 'object',
            properties: {
              heading: { type: 'string' },
              paragraphs: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4 },
            },
            required: ['heading', 'paragraphs'],
            additionalProperties: false,
          },
        },
        faq: {
          type: 'array',
          minItems: 3,
          maxItems: 6,
          description: 'Real questions a reader would ask, with concise answers (powers FAQ schema / AEO)',
          items: {
            type: 'object',
            properties: { q: { type: 'string' }, a: { type: 'string' } },
            required: ['q', 'a'],
            additionalProperties: false,
          },
        },
        conclusion: { type: 'string' },
      },
      required: ['intro', 'sections', 'faq', 'conclusion'],
      additionalProperties: false,
    },
  },
  required: ['slug', 'title', 'description', 'keywords', 'body'],
  additionalProperties: false,
};

function buildSystem(lang: Lang): string {
  const langName = lang === 'he' ? 'Hebrew' : 'English';
  return `You are David, the content lead for MeStory — a platform that helps families create memorial books, autobiographies, and heritage/family-story books with AI-guided writing and respectful design.

You write ONE evergreen, genuinely helpful article in ${langName}. Goal: rank well on Google (SEO), get cited by AI assistants (GEO/AEO), and earn the reader's trust on the topic of memorial books, autobiography and life-story writing.

HARD RULES — breaking any of these makes the article unusable:
- Do NOT state any number as a claim about MeStory: no user counts, books-created counts, sales, percentages, ratings, rankings ("#1", "leading"), or growth figures.
- Do NOT invent facts about MeStory: no specific features you're unsure exist, no prices, partnerships, awards, dates, or history.
- Do NOT make promises or guarantees about MeStory or about the results the reader will get.
- You MAY mention MeStory in general terms as a tool that helps with guided writing and design — naturally, not as a hard sell, and at most lightly.

QUALITY RULES:
- Write for a real human in warm, respectful, clear ${langName}. The subject is often sensitive (loss, bereavement) — be dignified, never salesy or flippant.
- Open by directly answering the core question in the first 2-3 sentences (AEO).
- Use concrete, practical, specific advice — interview questions, structure tips, examples — not fluff.
- The FAQ must contain real questions people search for, with concise, self-contained answers.
- ${lang === 'he' ? 'Avoid em-dashes (—) in Hebrew copy; use commas or short sentences.' : 'Write natural idiomatic English.'}

Return the article via the submit_article tool.`;
}

export async function generateArticle(opts: {
  query: string;
  lang: Lang;
  existingTitles: string[];
  competitors: Competitor[];
  fixViolations?: string[];
}): Promise<GeneratedArticle | null> {
  const avoid =
    opts.existingTitles.length > 0
      ? `\n\nWe already published articles on these topics — pick a DISTINCT angle, do not duplicate:\n${opts.existingTitles
          .slice(0, 40)
          .map((t) => `- ${t}`)
          .join('\n')}`
      : '';

  const competitorContext =
    opts.competitors.length > 0
      ? `\n\nContext (do NOT name or disparage them): people researching this topic also look at ${opts.competitors
          .map((c) => c.name)
          .join(', ')}. Make our article more genuinely useful and complete than typical content out there.`
      : '';

  const fix = opts.fixViolations?.length
    ? `\n\nA previous draft was REJECTED for these compliance issues — you MUST avoid them this time:\n${opts.fixViolations
        .map((v) => `- ${v}`)
        .join('\n')}`
    : '';

  const prompt = `Write the article that best answers this search query / question:\n\n"${opts.query}"\n\nMake it the most helpful, trustworthy resource on this exact topic.${avoid}${competitorContext}${fix}`;

  const result = await anthropicStructured<GeneratedArticle>({
    system: buildSystem(opts.lang),
    prompt,
    toolName: 'submit_article',
    schema: ARTICLE_SCHEMA,
    maxTokens: 8000,
  });

  // Reject incomplete generations (e.g. truncated tool output) so the
  // caller can skip cleanly rather than publish a half-written article.
  if (!result || !result.body || !Array.isArray(result.body.sections) || result.body.sections.length === 0) {
    return null;
  }
  // Normalise optional arrays so downstream code never hits undefined.
  result.body.faq = result.body.faq || [];
  result.keywords = result.keywords || [];
  return result;
}
