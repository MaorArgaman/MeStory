/**
 * fairytale-classic — ornate, warm, story-time grandeur. Heavy display serif,
 * gold/jewel palettes, woodcut ornaments, illuminated initials inside frames,
 * decorative borders. For fairy tales, fantasy, children's keepsakes, grandparent books.
 */

import { SystemModule } from './types';

export const fairytaleClassic: SystemModule = {
  id: 'fairytale-classic',
  labelHe: 'אגדה קלאסית',
  descriptionHe:
    'פאר של שעת-סיפור — serif כבד ומוצהר, פלטות זהב ואבני-חן, מפרידי-עץ-חרוט, אותיות-פתיחה מוארות במסגרת, ומסגרות מעוטרות. לאגדות, פנטזיה, ספרי-מתנה לילדים ולסבים.',
  bestFor:
    'fairy tales, fantasy, illustrated childrens stories, grandparent-to-grandchild keepsakes, mythology — ornate and warm',
  variants: [
    {
      id: 'gold',
      labelHe: 'זהב',
      mood: 'deep walnut-brown on warm parchment with antique-gold ornament — classic storybook',
      palette: { text: '#2A1D0E', background: '#FAF2DC', accent: '#B08A2E', muted: '#9A8758' },
    },
    {
      id: 'midnight',
      labelHe: 'חצות',
      mood: 'ink-blue on candle-cream with old-gold accent — bedtime, mysterious, magical',
      palette: { text: '#1B2138', background: '#FAF4E4', accent: '#C09A3E', muted: '#7C82A0' },
    },
    {
      id: 'forest',
      labelHe: 'יער-קסם',
      mood: 'deep pine-green on parchment with burnished-gold accent — enchanted woodland',
      palette: { text: '#1E2C1F', background: '#F8F3E2', accent: '#A98432', muted: '#7D8A72' },
    },
  ],
  defaultScaleRatio: 'perfect-fifth',
  allowedScaleRatios: ['perfect-fourth', 'perfect-fifth', 'golden'],
  fonts: { body: 'David Libre', heading: 'Suez One', display: 'Suez One' },
  baseSizePt: 12,
  leading: 1.62,
  marginsMm: { top: 26, bottom: 28, start: 24, end: 24 },
  openerTemplates: ['image-overlay', 'numeral-ornament', 'rule-stack'],
  imageTreatments: ['framed', 'vignette', 'rounded', 'postcard'],
  docxOrnaments: { rule: '✶ ─── ✶', ornament: '❈  ✦  ❈', stars: '✶ ✶ ✶' },
  dropCapMultiplier: 3.2,
};
