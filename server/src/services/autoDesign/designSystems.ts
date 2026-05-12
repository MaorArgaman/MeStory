/**
 * The 10 design systems the planner agent picks from. Each system is a
 * "scaffold" — defaults for palette, typography, grid, and ornamental
 * SVGs. The planner is free to override the palette and typography to
 * fit the specific book, but the system's identity guides those choices.
 *
 * Only `memoir-warm` is fully implemented in this initial slice. The
 * other 9 are stubs with sensible defaults so the planner can still
 * choose them; we'll flesh them out once the end-to-end loop is proven.
 */

import { DesignSystemId, Palette, Typography, Grid } from './designPlanSchema';

export interface DesignSystem {
  id: DesignSystemId;
  /** Short Hebrew label shown to users. */
  labelHe: string;
  /** Longer Hebrew description — used in the planner prompt to help
   *  Claude choose well. */
  descriptionHe: string;
  /** When the planner should prefer this system (English, fed to Claude). */
  bestFor: string;
  /** Default palette — planner may tweak per-book. */
  defaultPalette: Palette;
  defaultTypography: Typography;
  defaultGrid: Grid;
  /** Ornaments available — inline SVG strings, keyed for selection by the
   *  planner's `divider.style`. Renderers pick one based on the seed. */
  ornaments: {
    rule: string;
    ornament: string;
    stars: string;
  };
  /** Drop-cap style: how a paragraph-with-dropCap renders. */
  dropCapStyle: 'serif-large' | 'illuminated' | 'block-accent' | 'script';
  /** Whether this system uses page-number ornaments in the footer. */
  pageNumberStyle: 'plain' | 'centered-ornament' | 'side-rule';
}

// ---------------------------------------------------------------------------
// memoir-warm — the fully-implemented system for this slice
// ---------------------------------------------------------------------------

const MEMOIR_WARM: DesignSystem = {
  id: 'memoir-warm',
  labelHe: 'זיכרון חם',
  descriptionHe:
    'עיצוב חמים ואישי לזיכרונות משפחתיים. פלטה חרדל-קרם-חמרה, טיפוגרפיה מעורבת serif בכותרות ו-sans נעים בגוף, שוליים נדיבים, מקום לתמונות משפחתיות עם מסגרות עדינות.',
  bestFor:
    'family memoirs, biographical books, books written for loved ones, personal histories — anything where warmth and intimacy matter more than visual punch',
  defaultPalette: {
    text: '#2A1B0F',        // dark warm brown
    background: '#FBF6EE',   // cream
    accent: '#B8651A',       // burnt sienna
    muted: '#8C7A66',        // taupe
  },
  defaultTypography: {
    bodyFamily: 'Frank Ruhl Libre',  // Hebrew-supporting serif, warm
    headingFamily: 'Heebo',           // clean sans for contrast
    displayFamily: 'Suez One',        // bold display for chapter numbers
    baseSize: 11.5,
    leading: 1.6,
    scale: [11.5, 9.5, 16, 22, 32],
  },
  defaultGrid: {
    columns: 1,
    marginsMm: { top: 24, bottom: 28, start: 22, end: 22 },
    gutterMm: 0,
  },
  ornaments: {
    // Centered horizontal rule with a small diamond accent.
    rule: `<svg viewBox="0 0 200 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <line x1="20" y1="8" x2="92" y2="8" stroke="currentColor" stroke-width="0.6"/>
  <path d="M100 4 L104 8 L100 12 L96 8 Z" fill="currentColor"/>
  <line x1="108" y1="8" x2="180" y2="8" stroke="currentColor" stroke-width="0.6"/>
</svg>`,
    // Three diamonds — the standard "section break" ornament for memoirs.
    ornament: `<svg viewBox="0 0 120 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M40 6 L46 10 L40 14 L34 10 Z" fill="currentColor"/>
  <path d="M60 4 L68 10 L60 16 L52 10 Z" fill="currentColor"/>
  <path d="M80 6 L86 10 L80 14 L74 10 Z" fill="currentColor"/>
</svg>`,
    // Three asterisks (typographic), used when a softer break is wanted.
    stars: `<svg viewBox="0 0 120 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <text x="60" y="14" font-family="Frank Ruhl Libre, serif" font-size="14" fill="currentColor" text-anchor="middle" letter-spacing="6">* * *</text>
</svg>`,
  },
  dropCapStyle: 'serif-large',
  pageNumberStyle: 'centered-ornament',
};

// ---------------------------------------------------------------------------
// Stubs for the other 9. These are minimally functional — the planner can
// pick them, the renderers render them, but the visual identity is
// generic until we replace each one with a hand-crafted system.
// ---------------------------------------------------------------------------

function stub(
  id: DesignSystemId,
  labelHe: string,
  descriptionHe: string,
  bestFor: string,
  overrides: Partial<Omit<DesignSystem, 'id' | 'labelHe' | 'descriptionHe' | 'bestFor'>> = {}
): DesignSystem {
  return {
    id,
    labelHe,
    descriptionHe,
    bestFor,
    defaultPalette: overrides.defaultPalette || MEMOIR_WARM.defaultPalette,
    defaultTypography: overrides.defaultTypography || MEMOIR_WARM.defaultTypography,
    defaultGrid: overrides.defaultGrid || MEMOIR_WARM.defaultGrid,
    ornaments: overrides.ornaments || MEMOIR_WARM.ornaments,
    dropCapStyle: overrides.dropCapStyle || 'serif-large',
    pageNumberStyle: overrides.pageNumberStyle || 'plain',
  };
}

const SYSTEMS: Record<DesignSystemId, DesignSystem> = {
  'memoir-warm': MEMOIR_WARM,
  'editorial-modern': stub(
    'editorial-modern',
    'מגזין רציני',
    'סגנון מגזין — Serif קלאסי, grid נקי, תמונות גדולות. למאמרים, ביוגרפיות, רומנים רציניים.',
    'serious literary novels, biographies, long-form magazine-style books',
    {
      defaultPalette: { text: '#0F0F0F', background: '#FFFFFF', accent: '#C8102E', muted: '#666666' },
    }
  ),
  'storybook-illustrated': stub(
    'storybook-illustrated',
    'ספר ילדים מאויר',
    'אותיות גדולות חמות, איורים על כל עמוד, מסגרות עדינות, dropcaps מאוירים. לילדים.',
    "children's picture books, illustrated tales, books with many illustrations",
    {
      defaultPalette: { text: '#3D2914', background: '#FFF9E8', accent: '#E07B39', muted: '#A88B6E' },
      dropCapStyle: 'illuminated',
    }
  ),
  'playful-zine': stub(
    'playful-zine',
    'צבעוני ושובב',
    'צבעוני, אסימטרי, משחקי טיפוגרפיה. לילדים בוגרים, יומני נסיעות, ספרי הומור.',
    'travel journals, humor books, teen/YA, books with visual personality',
    {
      defaultPalette: { text: '#1A1A2E', background: '#FFF8F0', accent: '#E94560', muted: '#7C7C8A' },
      dropCapStyle: 'block-accent',
    }
  ),
  'romantic-vintage': stub(
    'romantic-vintage',
    'רומנטי ונוסטלגי',
    'סקריפט, אלמנטים פלורליים, פלטה רכה. לסיפורי אהבה, שירה, ספרים אישיים.',
    'romance novels, poetry collections, intimate memoirs, love letters',
    {
      defaultPalette: { text: '#3A2A2E', background: '#F8F0EA', accent: '#A04060', muted: '#9C8A8E' },
      dropCapStyle: 'script',
    }
  ),
  'minimalist-nordic': stub(
    'minimalist-nordic',
    'מינימליסטי נורדי',
    'לבן הרבה, sans-serif בלבד, גאומטרי. לסיפורת מודרנית, פרוזה מינימליסטית.',
    'modern literary fiction, minimalist prose, contemplative essays',
    {
      defaultPalette: { text: '#1C1C1C', background: '#FAFAFA', accent: '#4A6FA5', muted: '#8A8A8A' },
      defaultTypography: {
        ...MEMOIR_WARM.defaultTypography,
        bodyFamily: 'Heebo',
        headingFamily: 'Assistant',
      },
    }
  ),
  'academic-formal': stub(
    'academic-formal',
    'אקדמי קלאסי',
    'Serif קלאסי לעברית, טקסט מיושר משני הצדדים, הערות בשוליים. לעיון, היסטוריה.',
    'academic books, non-fiction, history, formal biographies',
    {
      defaultPalette: { text: '#1A1A1A', background: '#FBFAF7', accent: '#5C4A2E', muted: '#7A7068' },
      defaultTypography: {
        ...MEMOIR_WARM.defaultTypography,
        bodyFamily: 'David Libre',
        headingFamily: 'Frank Ruhl Libre',
      },
    }
  ),
  'bold-magazine': stub(
    'bold-magazine',
    'מגזין נועז',
    'טיפוגרפיה ענקית, grid אסימטרי, תמונות full-bleed עם overlay טקסט. לזיכרונות בולטים.',
    'bold memoirs, photo-heavy documentary books, statement-piece books',
    {
      defaultPalette: { text: '#0A0A0A', background: '#FFFFFF', accent: '#FF4500', muted: '#5A5A5A' },
      defaultTypography: {
        ...MEMOIR_WARM.defaultTypography,
        bodyFamily: 'Assistant',
        headingFamily: 'Suez One',
        scale: [11, 9, 18, 28, 48],
      },
      dropCapStyle: 'block-accent',
    }
  ),
  'fairytale-classic': stub(
    'fairytale-classic',
    'אגדה קלאסית',
    'אותיות פתיחה מאוירות, מסגרות זהב, מפרידי ornament בין פרקים. לאגדות, סיפורי דמיון.',
    'fairy tales, fantasy stories, books for grandchildren, illustrated classics',
    {
      defaultPalette: { text: '#2A1F0E', background: '#FBF4E0', accent: '#B8860B', muted: '#9C8654' },
      dropCapStyle: 'illuminated',
    }
  ),
  'poetry-quiet': stub(
    'poetry-quiet',
    'שירה שקטה',
    'שוליים רחבים, טקסט במרכז, נשימה רבה. לשירה, פרוזה לירית, מסות.',
    'poetry collections, lyrical prose, contemplative essays, short reflections',
    {
      defaultPalette: { text: '#2C2C2C', background: '#FCFCFA', accent: '#6B5A4A', muted: '#9C9C98' },
      defaultGrid: {
        columns: 1,
        marginsMm: { top: 36, bottom: 36, start: 38, end: 38 },
        gutterMm: 0,
      },
    }
  ),
};

export function getDesignSystem(id: DesignSystemId): DesignSystem {
  return SYSTEMS[id];
}

export function listDesignSystems(): DesignSystem[] {
  return Object.values(SYSTEMS);
}

/**
 * Compact description used in the planner prompt. Includes name + bestFor
 * for each system so Claude can match book→system intelligently.
 */
export function plannerSystemsCatalog(): string {
  return listDesignSystems()
    .map((s) => `- "${s.id}": ${s.bestFor}`)
    .join('\n');
}
