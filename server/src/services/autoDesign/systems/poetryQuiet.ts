/**
 * poetry-quiet — air and silence. Small refined type, vast margins, centered
 * axis, hairline ornaments. The page recedes so the words carry everything.
 * For poetry, prayers, short prose fragments, eulogy and remembrance books.
 */

import { SystemModule } from './types';

export const poetryQuiet: SystemModule = {
  id: 'poetry-quiet',
  labelHe: 'שירה שקטה',
  descriptionHe:
    'עיצוב לשירה — אוויר לבן נדיב, טיפוגרפיה עדינה, ציר מרכזי ושקט. הדף נסוג והמילים נושאות הכול. גם לתפילות, קטעי פרוזה קצרים וספרי זיכרון.',
  bestFor:
    'poetry collections, prayers and blessings, short prose fragments, remembrance/eulogy books — where whitespace and quiet reverence matter',
  variants: [
    {
      id: 'mist',
      labelHe: 'ערפל',
      mood: 'soft graphite on porcelain white with a pale slate accent — hushed, contemplative',
      palette: { text: '#33373B', background: '#FDFDFC', accent: '#5E6B78', muted: '#A5AAAE' },
    },
    {
      id: 'blush',
      labelHe: 'סומק',
      mood: 'warm gray-brown on blush-white with a dusty rose accent — tender, intimate',
      palette: { text: '#3D3436', background: '#FDFAF9', accent: '#B07682', muted: '#B0A2A5' },
    },
    {
      id: 'sand',
      labelHe: 'חול',
      mood: 'deep taupe on warm sand-white with a muted bronze accent — desert-calm, timeless',
      palette: { text: '#3A342B', background: '#FCFAF4', accent: '#9A7B4F', muted: '#ABA28F' },
    },
  ],
  defaultScaleRatio: 'minor-third',
  allowedScaleRatios: ['major-second', 'minor-third', 'major-third'],
  fonts: { body: 'Frank Ruhl Libre', heading: 'Bellefair', display: 'Bellefair' },
  baseSizePt: 11.5,
  leading: 1.85,
  marginsMm: { top: 30, bottom: 34, start: 26, end: 26 },
  openerTemplates: ['rule-stack', 'numeral-ornament'],
  imageTreatments: ['plain', 'vignette', 'sepia'],
  docxOrnaments: { rule: '·', ornament: '⁂', stars: '· · ·' },
  dropCapMultiplier: 2.4,
};
