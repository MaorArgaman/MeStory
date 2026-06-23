/**
 * SERVER MIRROR of client/src/components/autoDesign/palettes.ts — kept
 * byte-identical (same array order) so the DOCX renderer composes the SAME
 * genome the client preview does. If you edit one copy, edit the other.
 */

import type { Palette } from './designPlanSchema';

export type PaletteTag =
  | 'warm'
  | 'cool'
  | 'neutral'
  | 'earth'
  | 'jewel'
  | 'pastel'
  | 'vivid'
  | 'muted'
  | 'mono'
  | 'dark'
  | 'sepia'
  | 'romantic'
  | 'fresh';

export interface TaggedPalette extends Palette {
  id: string;
  tags: PaletteTag[];
}

export const PALETTES: TaggedPalette[] = [
  // --- warm / earth / sepia (memoir, vintage, fairytale) -------------------
  { id: 'autumn', text: '#2A1B0F', background: '#FBF6EE', accent: '#B8651A', muted: '#8C7A66', tags: ['warm', 'earth'] },
  { id: 'sepia', text: '#3B2E22', background: '#F6EFE3', accent: '#9C6B3F', muted: '#9A8A78', tags: ['warm', 'sepia', 'muted'] },
  { id: 'terracotta', text: '#2E1E16', background: '#FAF1E9', accent: '#C0562E', muted: '#9C8170', tags: ['warm', 'earth'] },
  { id: 'amber', text: '#241A0C', background: '#FCF7EA', accent: '#C8901F', muted: '#9B8A66', tags: ['warm', 'earth'] },
  { id: 'clay', text: '#262320', background: '#F6F3EE', accent: '#B5663F', muted: '#A39B90', tags: ['warm', 'earth', 'muted'] },
  { id: 'rust', text: '#2B1712', background: '#F8F0E8', accent: '#A8431F', muted: '#9C8478', tags: ['warm', 'earth'] },
  { id: 'gold-ink', text: '#2A1D0E', background: '#FAF2DC', accent: '#B08A2E', muted: '#9A8758', tags: ['warm', 'jewel'] },
  { id: 'honey', text: '#33260F', background: '#FDF8E7', accent: '#D09A2C', muted: '#A89567', tags: ['warm'] },

  // --- romantic / pastel (romance, poetry) ---------------------------------
  { id: 'rose', text: '#3A2A2E', background: '#FBF2EE', accent: '#9C4A63', muted: '#A98B90', tags: ['romantic', 'warm'] },
  { id: 'blush', text: '#3C2C30', background: '#FCF4F2', accent: '#C06A82', muted: '#B299A0', tags: ['romantic', 'pastel'] },
  { id: 'lavender', text: '#322B3A', background: '#F7F4F2', accent: '#7A5A86', muted: '#988FA0', tags: ['romantic', 'cool', 'pastel'] },
  { id: 'dusk', text: '#2E2330', background: '#F7F1F0', accent: '#8A5A6E', muted: '#928693', tags: ['romantic', 'muted'] },
  { id: 'plum', text: '#2A1E2C', background: '#F8F2F5', accent: '#7C3F63', muted: '#9A8694', tags: ['romantic', 'jewel'] },
  { id: 'mauve', text: '#2F2730', background: '#F6F1F3', accent: '#92667E', muted: '#9B909A', tags: ['romantic', 'muted', 'pastel'] },

  // --- fresh / sage / botanical --------------------------------------------
  { id: 'garden', text: '#26301F', background: '#F6F4EA', accent: '#A65A3C', muted: '#7E8770', tags: ['fresh', 'earth'] },
  { id: 'sage', text: '#2C322A', background: '#F6F5EC', accent: '#A65C6E', muted: '#8B9183', tags: ['fresh', 'muted'] },
  { id: 'eucalyptus', text: '#1E2A24', background: '#F2F6F1', accent: '#3E7D62', muted: '#7E938A', tags: ['fresh', 'cool'] },
  { id: 'olive', text: '#25271A', background: '#F7F6EC', accent: '#7A7B2E', muted: '#8C8C72', tags: ['fresh', 'earth'] },
  { id: 'moss', text: '#1F2A1C', background: '#F4F6EE', accent: '#5C7A33', muted: '#828C76', tags: ['fresh', 'earth'] },

  // --- cool / nordic / blue ------------------------------------------------
  { id: 'snow', text: '#1A1A1A', background: '#FFFFFF', accent: '#2D5BFF', muted: '#9A9A9A', tags: ['cool', 'fresh', 'vivid'] },
  { id: 'fog', text: '#2A2D30', background: '#F4F5F6', accent: '#5B6166', muted: '#A7ABAE', tags: ['cool', 'neutral', 'muted'] },
  { id: 'slate', text: '#1C2024', background: '#FCFCFA', accent: '#2E4A6B', muted: '#74777C', tags: ['cool', 'neutral'] },
  { id: 'glacier', text: '#16242B', background: '#F1F7F8', accent: '#1F7A8C', muted: '#7C949A', tags: ['cool', 'fresh'] },
  { id: 'denim', text: '#16202E', background: '#F4F6F9', accent: '#34598C', muted: '#7E8A99', tags: ['cool'] },
  { id: 'midnight', text: '#1B2138', background: '#FAF4E4', accent: '#C09A3E', muted: '#7C82A0', tags: ['cool', 'jewel'] },
  { id: 'teal-ink', text: '#102826', background: '#F0F6F4', accent: '#0F766E', muted: '#79938E', tags: ['cool', 'jewel', 'fresh'] },

  // --- forest / deep green -------------------------------------------------
  { id: 'forest', text: '#161A16', background: '#FBFBF6', accent: '#2C5A3A', muted: '#6F756C', tags: ['fresh', 'neutral'] },
  { id: 'pine', text: '#13211A', background: '#F3F6F2', accent: '#1E5E45', muted: '#76877E', tags: ['fresh', 'jewel'] },

  // --- vivid / editorial / bold --------------------------------------------
  { id: 'ink-red', text: '#111111', background: '#FFFFFF', accent: '#C8102E', muted: '#6B6B6B', tags: ['vivid', 'mono'] },
  { id: 'tangerine', text: '#1A1A2E', background: '#FFF8F0', accent: '#E94560', muted: '#7C7C8A', tags: ['vivid'] },
  { id: 'persimmon', text: '#0A0A0A', background: '#FFFFFF', accent: '#FF4500', muted: '#5A5A5A', tags: ['vivid', 'mono'] },
  { id: 'magenta', text: '#16121A', background: '#FFFAFC', accent: '#C42E86', muted: '#8A7E88', tags: ['vivid', 'jewel'] },
  { id: 'electric', text: '#101014', background: '#FAFAFF', accent: '#5B2DFF', muted: '#82828E', tags: ['vivid', 'cool'] },
  { id: 'sunburst', text: '#221A06', background: '#FFFBEE', accent: '#F2A104', muted: '#9A8E66', tags: ['vivid', 'warm'] },

  // --- neutral / mono / minimal --------------------------------------------
  { id: 'ink', text: '#141414', background: '#FCFCFC', accent: '#3A3A3A', muted: '#9A9A9A', tags: ['mono', 'neutral'] },
  { id: 'graphite', text: '#1E1E1E', background: '#F5F5F4', accent: '#555550', muted: '#9C9C98', tags: ['mono', 'neutral', 'muted'] },
  { id: 'oat', text: '#262420', background: '#F7F4ED', accent: '#6B5A4A', muted: '#9C968C', tags: ['neutral', 'warm', 'muted'] },
  { id: 'stone', text: '#2C2C2C', background: '#FCFCFA', accent: '#6B5A4A', muted: '#9C9C98', tags: ['neutral', 'muted'] },
  { id: 'paper-noir', text: '#1A1A1A', background: '#FAFAF8', accent: '#8A2B2B', muted: '#8C8C88', tags: ['neutral', 'mono'] },

  // --- jewel / dramatic ----------------------------------------------------
  { id: 'burgundy', text: '#1F1012', background: '#FAF3F1', accent: '#7A1F2B', muted: '#9A8284', tags: ['jewel', 'warm', 'dark'] },
  { id: 'emerald', text: '#0F1A14', background: '#F1F6F2', accent: '#1B6B4B', muted: '#7A8C82', tags: ['jewel', 'fresh'] },
  { id: 'sapphire', text: '#0E1626', background: '#F2F4FA', accent: '#1E3A8A', muted: '#7C84A0', tags: ['jewel', 'cool'] },
  { id: 'aubergine', text: '#1C141F', background: '#F6F1F6', accent: '#5B2A5E', muted: '#8C8090', tags: ['jewel', 'dark'] },
  { id: 'copper', text: '#211511', background: '#F9F1EB', accent: '#A0522D', muted: '#9A857A', tags: ['jewel', 'warm', 'earth'] },
];

/** Palettes that carry every requested tag (AND). Falls back to all if empty. */
export function palettesByTags(tags: PaletteTag[]): TaggedPalette[] {
  if (!tags.length) return PALETTES;
  const out = PALETTES.filter((p) => tags.every((t) => p.tags.includes(t)));
  return out.length ? out : PALETTES.filter((p) => tags.some((t) => p.tags.includes(t)));
}

/** Palettes carrying ANY of the requested tags (OR). */
export function palettesByAnyTag(tags: PaletteTag[]): TaggedPalette[] {
  if (!tags.length) return PALETTES;
  const out = PALETTES.filter((p) => p.tags.some((t) => tags.includes(t)));
  return out.length ? out : PALETTES;
}
