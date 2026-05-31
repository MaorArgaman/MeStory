/**
 * minimalist-nordic — extreme whitespace, sans-only, geometric restraint,
 * near-monochrome with one quiet accent. Tiny refined details, big margins,
 * a confident type scale. For modern literary fiction, essays, design-minded books.
 */

import { SystemModule } from './types';

export const minimalistNordic: SystemModule = {
  id: 'minimalist-nordic',
  labelHe: 'מינימליסטי נורדי',
  descriptionHe:
    'הרבה לובן, sans-serif בלבד, גאומטריה מאופקת, כמעט מונוכרום עם דגש שקט אחד. שוליים רחבים, סקאלה בטוחה, ופרטים זעירים ומדויקים. לסיפורת מודרנית, מסות וספרים עיצוביים.',
  bestFor:
    'modern literary fiction, contemplative essays, minimalist prose, design-minded or architectural books — restraint and whitespace',
  variants: [
    {
      id: 'snow',
      labelHe: 'שלג',
      mood: 'ink on pure white with a single cobalt accent — crisp, contemporary',
      palette: { text: '#1A1A1A', background: '#FFFFFF', accent: '#2D5BFF', muted: '#9A9A9A' },
    },
    {
      id: 'fog',
      labelHe: 'ערפל',
      mood: 'graphite on soft grey-white, tonal and quiet — no color, pure structure',
      palette: { text: '#2A2D30', background: '#F4F5F6', accent: '#5B6166', muted: '#A7ABAE' },
    },
    {
      id: 'clay',
      labelHe: 'חמר',
      mood: 'warm charcoal on bone with a muted terracotta accent — soft Scandinavian warmth',
      palette: { text: '#262320', background: '#F6F3EE', accent: '#B5663F', muted: '#A39B90' },
    },
  ],
  defaultScaleRatio: 'augmented-fourth',
  allowedScaleRatios: ['perfect-fourth', 'augmented-fourth', 'perfect-fifth'],
  fonts: { body: 'Assistant', heading: 'Assistant', display: 'Rubik' },
  baseSizePt: 10.5,
  leading: 1.7,
  marginsMm: { top: 34, bottom: 36, start: 32, end: 26 },
  openerTemplates: ['vertical-title', 'numeral-ornament', 'rule-stack'],
  imageTreatments: ['plain', 'duotone', 'rounded'],
  docxOrnaments: { rule: '—', ornament: '·  ·  ·', stars: '·  ·  ·' },
  dropCapMultiplier: 2.4,
};
