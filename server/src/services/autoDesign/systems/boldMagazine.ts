/**
 * bold-magazine — high-contrast editorial drama. Massive display scale,
 * heavy rules, confident color blocking, deco energy. For manifestos,
 * business books, memoirs with attitude.
 */

import { SystemModule } from './types';

export const boldMagazine: SystemModule = {
  id: 'bold-magazine',
  labelHe: 'מגזין נועז',
  descriptionHe:
    'עיצוב מגזין דרמטי — כותרות ענק, קונטרסט גבוה, קווים כבדים ובלוקים של צבע. לספרים עם עמדה: מניפסטים, ספרי עסקים, זיכרונות עם אופי.',
  bestFor:
    'manifestos, business/leadership books, opinionated memoirs, sports stories — where drama and confidence sell the message',
  variants: [
    {
      id: 'noir',
      labelHe: 'נואר',
      mood: 'true black on white with a signal-red accent — maximum contrast, fearless',
      palette: { text: '#0A0A0A', background: '#FFFFFF', accent: '#D5232E', muted: '#707070' },
    },
    {
      id: 'tangerine',
      labelHe: 'טנג׳רין',
      mood: 'espresso on warm off-white with a burnt tangerine accent — energetic, modern',
      palette: { text: '#241A12', background: '#FCF8F3', accent: '#E05E10', muted: '#93856F' },
    },
    {
      id: 'cobalt',
      labelHe: 'קובלט',
      mood: 'ink-black on cool paper with a saturated cobalt accent — sharp, executive',
      palette: { text: '#0E1218', background: '#FBFCFE', accent: '#1D4ED8', muted: '#77808F' },
    },
  ],
  defaultScaleRatio: 'minor-sixth',
  allowedScaleRatios: ['perfect-fifth', 'minor-sixth', 'golden'],
  fonts: { body: 'Assistant', heading: 'Suez One', display: 'Suez One' },
  baseSizePt: 11,
  leading: 1.5,
  marginsMm: { top: 20, bottom: 26, start: 18, end: 18 },
  openerTemplates: ['vertical-title', 'image-overlay', 'rule-stack'],
  imageTreatments: ['duotone', 'plain', 'framed', 'vignette'],
  docxOrnaments: { rule: '━━━', ornament: '▮ ▮ ▮', stars: '✦ ✦ ✦' },
  dropCapMultiplier: 3.2,
};
