/**
 * academic-formal — restrained scholarly typesetting. Classic serif, modest
 * scale, wide measure discipline, hairline rules, zero playfulness. For
 * research, textbooks, professional and religious non-fiction.
 */

import { SystemModule } from './types';

export const academicFormal: SystemModule = {
  id: 'academic-formal',
  labelHe: 'אקדמי קלאסי',
  descriptionHe:
    'עיצוב אקדמי מוקפד — Serif קלאסי, סקאלה מאופקת, קווי שיער עדינים ומשמעת טיפוגרפית. שום קישוט מיותר; סמכות שקטה.',
  bestFor:
    'academic works, textbooks, professional non-fiction, Torah/religious study books, reference works — where authority and clarity matter most',
  variants: [
    {
      id: 'oxford',
      labelHe: 'אוקספורד',
      mood: 'near-black on white with a deep navy accent — canonical, authoritative',
      palette: { text: '#15181D', background: '#FFFFFF', accent: '#1F3A5F', muted: '#6E7480' },
    },
    {
      id: 'parchment',
      labelHe: 'קלף',
      mood: 'dark sepia on warm parchment with an oxblood accent — traditional, beit-midrash',
      palette: { text: '#2B2013', background: '#FAF6EC', accent: '#7A2E2E', muted: '#8F846E' },
    },
    {
      id: 'graphite',
      labelHe: 'גרפיט',
      mood: 'charcoal on cool white with a muted teal accent — contemporary-academic, precise',
      palette: { text: '#22262A', background: '#FCFDFD', accent: '#2E6B66', muted: '#7E868C' },
    },
  ],
  defaultScaleRatio: 'major-third',
  allowedScaleRatios: ['minor-third', 'major-third', 'perfect-fourth'],
  fonts: { body: 'Noto Serif Hebrew', heading: 'Frank Ruhl Libre', display: 'Frank Ruhl Libre' },
  baseSizePt: 11,
  leading: 1.55,
  marginsMm: { top: 26, bottom: 30, start: 25, end: 25 },
  openerTemplates: ['numeral-ornament', 'rule-stack'],
  imageTreatments: ['plain', 'framed'],
  docxOrnaments: { rule: '―――', ornament: '§', stars: '· · ·' },
  dropCapMultiplier: 2.4,
};
