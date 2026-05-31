/**
 * Checks whether MeStory shows up for a given question/keyword:
 *   - AEO/GEO: do ChatGPT / Claude / Gemini mention MeStory when asked the
 *     question plainly?
 *   - GEO/SEO: does mestory-ai.com appear among the sources Google returns
 *     (via Gemini grounded search)?
 * Also spots which competitors appear, and can discover likely competitors
 * when none are configured.
 */

import { askAllAssistants, geminiGroundedSearch } from './llmClients';
import { Competitor, Lang, RankResult } from './types';

const BRAND_PATTERNS = [/mestory/i, /mestory-ai/i, /מי\s?סטורי/];

function mentionsBrand(text: string): boolean {
  return BRAND_PATTERNS.some((re) => re.test(text));
}

function findCompetitors(text: string, competitors: Competitor[]): string[] {
  const seen = new Set<string>();
  const lower = text.toLowerCase();
  for (const c of competitors) {
    if (c.name && lower.includes(c.name.toLowerCase())) seen.add(c.name);
    if (c.domain && lower.includes(c.domain.toLowerCase().replace(/^www\./, ''))) seen.add(c.name);
  }
  return [...seen];
}

export async function checkQuery(
  query: string,
  lang: Lang,
  competitors: Competitor[],
): Promise<RankResult> {
  // 1. AEO — ask the assistants the question as a real user would.
  const answers = await askAllAssistants(query);
  const byModel: Record<string, boolean> = {};
  let competitorsSeen = new Set<string>();
  for (const [model, text] of Object.entries(answers)) {
    byModel[model] = mentionsBrand(text);
    findCompetitors(text, competitors).forEach((c) => competitorsSeen.add(c));
  }
  const aiPresent = Object.values(byModel).some(Boolean);

  // 2. GEO/SEO — grounded Google search presence.
  let googlePresent: boolean | null = null;
  const grounded = await geminiGroundedSearch(
    lang === 'he'
      ? `חפש בגוגל: ${query}. אילו אתרים ומותגים מופיעים בתוצאות?`
      : `Search Google for: ${query}. Which websites and brands appear in the results?`,
  );
  if (grounded) {
    const domainHit = grounded.sourceDomains.some((d) => d.includes('mestory'));
    googlePresent = domainHit || mentionsBrand(grounded.text);
    findCompetitors(grounded.text, competitors).forEach((c) => competitorsSeen.add(c));
    // Also treat cited domains matching a competitor domain as "seen".
    for (const c of competitors) {
      if (c.domain && grounded.sourceDomains.some((d) => d.includes(c.domain!.toLowerCase().replace(/^www\.|\.com$|\.co\.il$/g, '')))) {
        competitorsSeen.add(c.name);
      }
    }
  }

  return {
    query,
    lang,
    aiPresent,
    byModel,
    googlePresent,
    competitorsSeen: [...competitorsSeen],
  };
}

/**
 * Best-effort competitor discovery when the config list is empty, so David
 * is useful on day one. Uses grounded search; returns a small candidate list.
 */
export async function discoverCompetitors(): Promise<Competitor[]> {
  const grounded = await geminiGroundedSearch(
    'מהן הפלטפורמות והאתרים המובילים ליצירת ספרי הנצחה, ספרי זיכרון ואוטוביוגרפיה בישראל ובעולם? ציין שמות ודומיינים.',
  );
  if (!grounded) return [];
  const out: Competitor[] = [];
  const seen = new Set<string>();
  for (const d of grounded.sourceDomains) {
    if (d.includes('mestory')) continue;
    if (seen.has(d)) continue;
    seen.add(d);
    out.push({ name: d, domain: d, note: 'auto-discovered' });
    if (out.length >= 6) break;
  }
  return out;
}
