/**
 * romantic-vintage — tender, ornamental, nostalgic. Elegant serif display,
 * soft palettes, floral fleurons, framed/vignetted photos, ornate drop caps.
 * For love stories, poetry, intimate memoirs, anniversary & wedding books.
 */

import { SystemModule } from './types';

export const romanticVintage: SystemModule = {
  id: 'romantic-vintage',
  labelHe: 'רומנטי ונוסטלגי',
  descriptionHe:
    'עיצוב רך ורגשי — טיפוגרפיית serif אלגנטית, פלטות עדינות, מפרידים פלורליים, תמונות בווינייטה/מסגרת, ואות-פתיחה מעוטרת. לסיפורי אהבה, שירה, זיכרונות אינטימיים וספרי-מתנה.',
  bestFor:
    'love stories, romance, poetry collections, intimate/anniversary memoirs, wedding & keepsake books — tender and ornamental',
  variants: [
    {
      id: 'rose',
      labelHe: 'ורד',
      mood: 'dusty rose & blush on warm ivory with a deep wine accent — tender, nostalgic',
      palette: { text: '#3A2A2E', background: '#FBF2EE', accent: '#9C4A63', muted: '#A98B90' },
    },
    {
      id: 'lavender',
      labelHe: 'לבנדר',
      mood: 'soft lavender-grey on cream with a muted plum accent — dreamy, gentle',
      palette: { text: '#322B3A', background: '#F7F4F2', accent: '#7A5A86', muted: '#988FA0' },
    },
    {
      id: 'sage',
      labelHe: 'מרווה',
      mood: 'soft sage green on ivory with a dusty-rose accent — fresh vintage, garden-romance',
      palette: { text: '#2C322A', background: '#F6F5EC', accent: '#A65C6E', muted: '#8B9183' },
    },
  ],
  defaultScaleRatio: 'major-third',
  allowedScaleRatios: ['minor-third', 'major-third'],
  fonts: { body: 'Frank Ruhl Libre', heading: 'Bellefair', display: 'Bellefair' },
  baseSizePt: 11.5,
  leading: 1.66,
  marginsMm: { top: 28, bottom: 30, start: 24, end: 24 },
  openerTemplates: ['numeral-ornament', 'image-overlay', 'rule-stack'],
  imageTreatments: ['vignette', 'framed', 'postcard', 'rounded'],
  docxOrnaments: { rule: '⁕', ornament: '❦  ❧  ❦', stars: '✿ ✿ ✿' },
  dropCapMultiplier: 3.0,
};
