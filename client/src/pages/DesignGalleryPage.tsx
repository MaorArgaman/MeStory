/**
 * DesignGalleryPage — internal visual-QA surface for the auto-design engine.
 *
 * Renders ALL 10 design systems side by side (chapter opener + a body page
 * each) over a fixed sample text, in genome mode with a controllable seed.
 * No LLM call, no database, no auth — pure client rendering, which makes it:
 *   - the fastest way to eyeball every system's DNA at once (the Canva bar)
 *   - the surface golden-file screenshots will capture (Puppeteer-friendly)
 *   - free to re-roll: changing the seed re-composes every system's genome
 *
 * Route: /design-gallery (public internal page, synthetic content only).
 */

import { useMemo, useState } from 'react';
import DesignedBookView from '../components/autoDesign/DesignedBookView';
import type {
  BookForRender,
  DesignPlan,
  DesignSystemId,
} from '../components/autoDesign/designPlanTypes';

const SYSTEMS: Array<{ id: DesignSystemId; labelHe: string }> = [
  { id: 'memoir-warm', labelHe: 'זיכרון חם' },
  { id: 'editorial-modern', labelHe: 'מגזין רציני' },
  { id: 'storybook-illustrated', labelHe: 'ספר ילדים מאויר' },
  { id: 'playful-zine', labelHe: 'צבעוני ושובב' },
  { id: 'romantic-vintage', labelHe: 'רומנטי ונוסטלגי' },
  { id: 'minimalist-nordic', labelHe: 'מינימליסטי נורדי' },
  { id: 'academic-formal', labelHe: 'אקדמי קלאסי' },
  { id: 'bold-magazine', labelHe: 'מגזין נועז' },
  { id: 'fairytale-classic', labelHe: 'אגדה קלאסית' },
  { id: 'poetry-quiet', labelHe: 'שירה שקטה' },
];

const SAMPLE_BOOK: BookForRender = {
  id: 'design-gallery-sample',
  title: 'שורשים בחצר האחורית',
  author: { name: 'מאור ארגמן' },
  chapters: [
    { title: 'הבית עם הגג האדום', content: '' },
    { title: 'שיעורי הבוקר של סבתא', content: '' },
  ],
  pageImages: [],
};

const P1 =
  'הבית שבו גדלתי עמד בקצה המושב, אחרון בשורה של בתים לבנים עם גגות רעפים אדומים. מהחלון של חדרי אפשר היה לראות את הפרדס של משפחת לוי, ומעבר לו את הגבעה שבחורף התכסתה כלניות. אבא בנה את הבית בשתי ידיו, לבנה אחרי לבנה.';
const P2 =
  'המטבח היה לב הבית: שולחן עץ גדול שסבא הביא מהעלייה, שישה כיסאות שאף אחד מהם לא תאם לאחרים, ותנור אפייה שאמא הפעילה בכל יום שישי מחמש בבוקר. ריח החלות היה מעיר אותי לפני השעון המעורר.';
const P3 =
  'בחצר האחורית עמד עץ התות הענק. בשבילי הוא היה ספינה, מבצר ומגדל שמירה — תלוי בגיל ובמשחק. הענף הנמוך, זה שהתעקל כמו מרפק, היה המקום שבו למדתי לקרוא בשקט.';

/** A tiny fixed plan: opener page + a body page that exercises the DNA
 *  surface (drop cap, run-in head, pull-quote, divider, margin note,
 *  accent bar). Genome mode overrides palette/typography per system. */
function buildPlan(system: DesignSystemId, seed: number): DesignPlan {
  return {
    version: 1,
    seed,
    designSystem: system,
    tone: 'gallery-sample',
    genomeMode: true,
    palette: { text: '#222222', background: '#FFFFFF', accent: '#888888', muted: '#AAAAAA' },
    typography: {
      bodyFamily: 'Frank Ruhl Libre',
      headingFamily: 'Heebo',
      baseSize: 11.5,
      leading: 1.6,
      scale: [11.5, 9.5, 15, 19, 25],
    },
    grid: { columns: 1, marginsMm: { top: 24, bottom: 28, start: 22, end: 22 }, gutterMm: 5 },
    pages: [
      {
        kind: 'chapter-opener',
        chapterIndex: 0,
        blocks: [
          {
            type: 'chapter-opener',
            chapterIndex: 0,
            epigraph: 'שורשים לא רואים מלמעלה — רק כשעוקרים משהו מבינים כמה עמוק הוא אחז.',
          } as any,
        ],
      },
      {
        kind: 'body',
        chapterIndex: 0,
        blocks: [
          { type: 'paragraph', text: P1, dropCap: true, lead: true } as any,
          { type: 'paragraph', text: P2, runInHead: 'המטבח.' } as any,
          { type: 'divider', style: 'ornament' } as any,
          { type: 'pull-quote', text: 'יש דברים שעושים לאט — טעם של סבלנות אי אפשר לקנות.' } as any,
          { type: 'margin-note', text: 'קיץ 1987, המושב' } as any,
          { type: 'accent-bar', widthFraction: 0.25 } as any,
          { type: 'paragraph', text: P3 } as any,
        ],
      },
    ],
  };
}

export default function DesignGalleryPage() {
  // ?seed=N makes a specific roll shareable/linkable (and lets the golden
  // screenshot harness sweep seeds).
  const initialSeed = (() => {
    const p = new URLSearchParams(window.location.search).get('seed');
    const n = p ? Number(p) : NaN;
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 20260709;
  })();
  const [seed, setSeed] = useState(initialSeed);
  const plans = useMemo(
    () => SYSTEMS.map((s) => ({ ...s, plan: buildPlan(s.id, seed) })),
    [seed]
  );

  return (
    <div dir="rtl" style={{ background: '#2B2B2B', minHeight: '100vh', padding: '24px 12px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            color: '#EEE',
            fontFamily: 'Heebo, sans-serif',
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>גלריית מערכות העיצוב</h1>
            <p style={{ fontSize: 13, color: '#AAA', margin: '4px 0 0' }}>
              כל 10 המערכות על אותו תוכן, seed {seed}. שינוי ה-seed מלחין מחדש את כולן.
            </p>
          </div>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            seed:
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value) || 0)}
              style={{
                width: 120,
                padding: '6px 8px',
                borderRadius: 8,
                border: '1px solid #555',
                background: '#1E1E1E',
                color: '#EEE',
              }}
            />
            <button
              onClick={() => setSeed(Math.floor(Math.random() * 2147483647))}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                background: '#E0653A',
                color: '#FFF',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              הגרלה
            </button>
          </label>
        </div>

        <div
          className="design-gallery-grid"
          style={{
            display: 'grid',
            // Two A5 pages side by side at 0.62 scale ≈ 720px — the min keeps
            // cards wide enough that pages never crop.
            gridTemplateColumns: 'repeat(auto-fill, minmax(780px, 1fr))',
            gap: 28,
          }}
        >
          {plans.map(({ id, labelHe, plan }) => (
            <section
              key={id}
              data-system={id}
              style={{
                background: '#3A3A3A',
                borderRadius: 14,
                padding: '14px 14px 4px',
              }}
            >
              <h2
                style={{
                  color: '#EEE',
                  fontFamily: 'Heebo, sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                  margin: '0 0 10px 4px',
                }}
              >
                {labelHe} <span style={{ color: '#999', fontSize: 12 }}>({id})</span>
              </h2>
              {/* Scale the A5 pages down so two fit side by side per card */}
              <div style={{ transform: 'scale(0.62)', transformOrigin: 'top right', height: 520 }}>
                <div style={{ display: 'flex', gap: 16, flexDirection: 'row', width: 1160 }}>
                  <DesignedBookView book={SAMPLE_BOOK} plan={plan} embedded />
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
