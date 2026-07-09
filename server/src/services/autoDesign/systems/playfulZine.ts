/**
 * playful-zine — loud, colorful, energetic. Chunky display type, saturated
 * accents, bold rules, halftone energy. For humor, youth content, creative
 * personal projects that want to feel like an indie magazine.
 */

import { SystemModule } from './types';

export const playfulZine: SystemModule = {
  id: 'playful-zine',
  labelHe: 'צבעוני ושובב',
  descriptionHe:
    'עיצוב זין אינדי — טיפוגרפיה שמנה ונועזת, צבעים רוויים, קווים עבים ואנרגיה של קולאז׳. לספרים מצחיקים, נעורים, ופרויקטים אישיים עם חוצפה.',
  bestFor:
    'humor books, youth/teen content, creative zines, opinionated personal projects — where energy and boldness beat elegance',
  variants: [
    {
      id: 'pop',
      labelHe: 'פופ',
      mood: 'near-black on white with an electric magenta accent — loud, confident, fun',
      palette: { text: '#141414', background: '#FFFFFF', accent: '#E42A88', muted: '#8A8A8A' },
    },
    {
      id: 'citrus',
      labelHe: 'הדרים',
      mood: 'deep charcoal on lemon-tinted white with a juicy orange accent — zesty, upbeat',
      palette: { text: '#232016', background: '#FFFDF2', accent: '#F2701D', muted: '#98917B' },
    },
    {
      id: 'electric',
      labelHe: 'חשמלי',
      mood: 'ink on cool white with a cobalt-electric accent — techy, punchy',
      palette: { text: '#101828', background: '#FAFBFF', accent: '#2D50E6', muted: '#8792A8' },
    },
  ],
  defaultScaleRatio: 'perfect-fifth',
  allowedScaleRatios: ['augmented-fourth', 'perfect-fifth', 'minor-sixth'],
  fonts: { body: 'Rubik', heading: 'Karantina', display: 'Karantina' },
  baseSizePt: 11.5,
  leading: 1.55,
  marginsMm: { top: 18, bottom: 22, start: 16, end: 16 },
  openerTemplates: ['vertical-title', 'rule-stack', 'image-overlay'],
  imageTreatments: ['sketch', 'polaroid', 'duotone', 'rounded', 'plain'],
  docxOrnaments: { rule: '■ ■ ■', ornament: '✖ ✖ ✖', stars: '★ ☆ ★' },
  dropCapMultiplier: 3.2,
};
