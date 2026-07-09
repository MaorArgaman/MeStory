/**
 * storybook-illustrated — warm, rounded, picture-forward typesetting for
 * children's books and illustrated stories. Big friendly type, generous
 * leading, playful-but-legible display, images as first-class citizens.
 */

import { SystemModule } from './types';

export const storybookIllustrated: SystemModule = {
  id: 'storybook-illustrated',
  labelHe: 'ספר ילדים מאויר',
  descriptionHe:
    'עיצוב לספרי ילדים וסיפורים מאוירים — אותיות גדולות ועגולות, ריווח נדיב, צבעים חמים ושמחים, והתמונות במרכז הבמה. כל כפולה מרגישה כמו איור.',
  bestFor:
    'children\'s books, illustrated stories, picture-heavy family books, bedtime tales — where warmth, big type, and images lead',
  variants: [
    {
      id: 'sunshine',
      labelHe: 'שמש',
      mood: 'deep warm brown on soft cream with a marigold-yellow accent — sunny, huggable',
      palette: { text: '#4A3220', background: '#FFF9EC', accent: '#F0A82E', muted: '#B39B76' },
    },
    {
      id: 'sky',
      labelHe: 'שמיים',
      mood: 'ink navy on pale blue-white with a friendly sky-blue accent — airy, adventurous',
      palette: { text: '#28344A', background: '#F5FAFF', accent: '#4A9BD8', muted: '#93A5BB' },
    },
    {
      id: 'meadow',
      labelHe: 'אחו',
      mood: 'warm forest on mint-cream with a fresh leaf-green accent — outdoorsy, gentle',
      palette: { text: '#2F4030', background: '#F7FBF2', accent: '#5FA860', muted: '#96AC94' },
    },
    {
      id: 'berry',
      labelHe: 'פטל',
      mood: 'plum-brown on blush-white with a raspberry accent — sweet, storybook-cozy',
      palette: { text: '#462C38', background: '#FFF7F6', accent: '#D8567B', muted: '#B694A2' },
    },
  ],
  defaultScaleRatio: 'perfect-fourth',
  allowedScaleRatios: ['major-third', 'perfect-fourth', 'perfect-fifth'],
  fonts: { body: 'Varela Round', heading: 'Secular One', display: 'Secular One' },
  baseSizePt: 13,
  leading: 1.7,
  marginsMm: { top: 20, bottom: 24, start: 18, end: 18 },
  openerTemplates: ['image-overlay', 'numeral-ornament', 'rule-stack'],
  imageTreatments: ['rounded', 'soft-shadow', 'framed', 'plain', 'polaroid'],
  docxOrnaments: { rule: '• • •', ornament: '✿ ✿ ✿', stars: '★ ★ ★' },
  dropCapMultiplier: 3.0,
};
