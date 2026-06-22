/**
 * Hebrew font-pairing library — the typographic half of the genome. Each
 * pairing is a {body, heading, display} triple chosen to read well together
 * for a full book interior, tagged by personality. All families are loaded by
 * the GOOGLE_FONTS_HREF in DesignedBookView (keep that list in sync when adding
 * a new family here).
 */

export type FontTag =
  | 'serif'
  | 'sans'
  | 'classic'
  | 'modern'
  | 'editorial'
  | 'minimal'
  | 'playful'
  | 'bold'
  | 'elegant'
  | 'romantic'
  | 'friendly'
  | 'quiet';

export interface FontPairing {
  id: string;
  body: string;
  heading: string;
  display: string;
  tags: FontTag[];
}

export const FONT_PAIRINGS: FontPairing[] = [
  { id: 'classic-warm', body: 'Frank Ruhl Libre', heading: 'Heebo', display: 'Suez One', tags: ['serif', 'classic'] },
  { id: 'editorial-serif', body: 'David Libre', heading: 'Frank Ruhl Libre', display: 'Bellefair', tags: ['serif', 'classic', 'editorial'] },
  { id: 'modern-sans', body: 'Heebo', heading: 'Assistant', display: 'Secular One', tags: ['sans', 'modern', 'minimal'] },
  { id: 'nordic-clean', body: 'Assistant', heading: 'Heebo', display: 'Heebo', tags: ['sans', 'minimal'] },
  { id: 'rounded-friendly', body: 'Varela Round', heading: 'Varela Round', display: 'Secular One', tags: ['sans', 'playful', 'friendly'] },
  { id: 'bold-statement', body: 'Assistant', heading: 'Suez One', display: 'Suez One', tags: ['sans', 'bold', 'editorial'] },
  { id: 'elegant-serif', body: 'Frank Ruhl Libre', heading: 'Bellefair', display: 'Bellefair', tags: ['serif', 'elegant', 'romantic'] },
  { id: 'noto-serif', body: 'Noto Serif Hebrew', heading: 'Heebo', display: 'Suez One', tags: ['serif', 'classic', 'editorial'] },
  { id: 'noto-sans', body: 'Noto Sans Hebrew', heading: 'Rubik', display: 'Secular One', tags: ['sans', 'modern'] },
  { id: 'rubik-modern', body: 'Rubik', heading: 'Rubik', display: 'Secular One', tags: ['sans', 'modern', 'bold'] },
  { id: 'condensed-zine', body: 'Heebo', heading: 'Karantina', display: 'Karantina', tags: ['sans', 'playful', 'bold'] },
  { id: 'handwritten-poetry', body: 'Frank Ruhl Libre', heading: 'Amatic SC', display: 'Amatic SC', tags: ['serif', 'playful', 'romantic'] },
  { id: 'miriam-modern', body: 'Miriam Libre', heading: 'Heebo', display: 'Secular One', tags: ['sans', 'modern'] },
  { id: 'alef-quiet', body: 'Alef', heading: 'Assistant', display: 'Bellefair', tags: ['sans', 'minimal', 'quiet'] },
];

/** Pairings carrying ANY of the requested tags (OR); falls back to all. */
export function pairingsByTags(tags: FontTag[]): FontPairing[] {
  if (!tags.length) return FONT_PAIRINGS;
  const out = FONT_PAIRINGS.filter((p) => p.tags.some((t) => tags.includes(t)));
  return out.length ? out : FONT_PAIRINGS;
}
