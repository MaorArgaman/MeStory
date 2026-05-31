/**
 * editorial-modern — serious, magazine-grade typesetting. Clean grid, large
 * confident headline scale, thin rules, generous margins, justified body,
 * minimal decoration. For literary novels, biographies, long-form non-fiction.
 */

import { SystemModule } from './types';

export const editorialModern: SystemModule = {
  id: 'editorial-modern',
  labelHe: 'מגזין רציני',
  descriptionHe:
    'עיצוב מגזין ספרותי — Serif קלאסי, גריד נקי, סקאלת כותרות גדולה ובטוחה, קווים דקים, שוליים נדיבים, וטקסט מיושר. כמעט בלי קישוט; ההיררכיה והאוויר עושים את העבודה.',
  bestFor:
    'serious literary novels, biographies, long-form non-fiction, essays, journalistic books — where restraint and confident hierarchy matter',
  variants: [
    {
      id: 'ink',
      labelHe: 'דיו',
      mood: 'near-black on white with a single editorial red accent — classic, authoritative',
      palette: { text: '#111111', background: '#FFFFFF', accent: '#C8102E', muted: '#6B6B6B' },
    },
    {
      id: 'slate',
      labelHe: 'צפחה',
      mood: 'charcoal on warm white with a deep slate-blue accent — calm, intellectual',
      palette: { text: '#1C2024', background: '#FCFCFA', accent: '#2E4A6B', muted: '#74777C' },
    },
    {
      id: 'forest',
      labelHe: 'יער',
      mood: 'dark ink on ivory with a deep forest-green accent — grounded, timeless',
      palette: { text: '#161A16', background: '#FBFBF6', accent: '#2C5A3A', muted: '#6F756C' },
    },
  ],
  defaultScaleRatio: 'perfect-fourth',
  allowedScaleRatios: ['major-third', 'perfect-fourth', 'augmented-fourth'],
  fonts: { body: 'Frank Ruhl Libre', heading: 'Heebo', display: 'Heebo' },
  baseSizePt: 11,
  leading: 1.58,
  marginsMm: { top: 26, bottom: 30, start: 24, end: 24 },
  openerTemplates: ['rule-stack', 'numeral-ornament', 'vertical-title'],
  imageTreatments: ['plain', 'framed', 'duotone'],
  docxOrnaments: { rule: '———', ornament: '— § —', stars: '* * *' },
  dropCapMultiplier: 2.8,
};
