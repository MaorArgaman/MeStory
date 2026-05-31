/**
 * memoir-warm — the first fully-built design system. Warm, intimate,
 * photo-friendly typesetting for family memoirs and personal histories.
 *
 * Four palette variants give genuine variety across regenerates; the
 * planner picks one by mood, and the seed can rotate among them. The
 * client module (systems/memoirWarm.tsx) implements the actual visuals
 * (illuminated drop caps, diamond ornaments, paper-tinted margins, framed
 * & polaroid photos, image-overlay chapter openers).
 */

import { SystemModule } from './types';

export const memoirWarm: SystemModule = {
  id: 'memoir-warm',
  labelHe: 'זיכרון חם',
  descriptionHe:
    'עיצוב חמים ואישי לזיכרונות משפחתיים. ארבע פלטות (סתיו / ספיה / דמדומים / גן), טיפוגרפיית serif חמה, שוליים נדיבים בגוון נייר, תמונות ממוסגרות בסגנון אלבום, ופתיחות פרק עם תמונה גדולה וכותרת מעליה.',
  bestFor:
    'family memoirs, biographical books, books written for loved ones, personal histories, memorial books — warmth and intimacy over visual punch',

  variants: [
    {
      id: 'autumn',
      labelHe: 'סתיו',
      mood: 'warm browns and burnt sienna on cream — nostalgic, grounded, the default memoir feel',
      palette: { text: '#2A1B0F', background: '#FBF6EE', accent: '#B8651A', muted: '#8C7A66' },
    },
    {
      id: 'sepia',
      labelHe: 'ספיה',
      mood: 'monochrome warm sepia — old-photograph nostalgia, quiet and timeless',
      palette: { text: '#3B2E22', background: '#F6EFE3', accent: '#9C6B3F', muted: '#9A8A78' },
    },
    {
      id: 'dusk',
      labelHe: 'דמדומים',
      mood: 'muted mauve and plum on warm ivory — reflective, tender, slightly melancholic',
      palette: { text: '#2E2330', background: '#F7F1F0', accent: '#8A5A6E', muted: '#928693' },
    },
    {
      id: 'garden',
      labelHe: 'גן',
      mood: 'soft sage green with terracotta on cream — alive, hopeful, outdoorsy memories',
      palette: { text: '#26301F', background: '#F6F4EA', accent: '#A65A3C', muted: '#7E8770' },
    },
  ],

  defaultScaleRatio: 'major-third',
  allowedScaleRatios: ['minor-third', 'major-third', 'perfect-fourth'],

  fonts: {
    body: 'Frank Ruhl Libre',
    heading: 'Heebo',
    display: 'Suez One',
  },
  baseSizePt: 11.5,
  leading: 1.62,
  marginsMm: { top: 24, bottom: 28, start: 22, end: 22 },

  // memoir-warm leans on intimate, classic openers — image-overlay when a
  // chapter has a strong lead photo, otherwise numeral + ornament.
  openerTemplates: ['numeral-ornament', 'image-overlay', 'rule-stack'],

  // Album-style photo treatments first.
  imageTreatments: ['framed', 'polaroid', 'postcard', 'plain', 'duotone'],

  docxOrnaments: {
    rule: '— ◆ —',
    ornament: '◆  ◆  ◆',
    stars: '✦  ✦  ✦',
  },
  dropCapMultiplier: 2.6,
};
