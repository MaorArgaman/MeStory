/**
 * Specs for the four factory-built design systems. Each spec gives the system
 * its distinct DNA (ornament family, page texture, drop-cap style, opener
 * flavor, palettes). Palettes mirror the server modules so a named variant
 * renders identically whether or not the planner copied the palette.
 */

import type { SystemSpec } from './systemFactory';

export const editorialModernSpec: SystemSpec = {
  id: 'editorial-modern',
  variants: {
    ink: { text: '#111111', background: '#FFFFFF', accent: '#C8102E', muted: '#6B6B6B' },
    slate: { text: '#1C2024', background: '#FCFCFA', accent: '#2E4A6B', muted: '#74777C' },
    forest: { text: '#161A16', background: '#FBFBF6', accent: '#2C5A3A', muted: '#6F756C' },
  },
  ornamentFamily: 'geometric',
  texture: 'dot-grid',
  dropCap: 'plain',
  framePages: false,
  numeralStyle: 'numeral',
  headingTracking: '0.01em',
};

export const romanticVintageSpec: SystemSpec = {
  id: 'romantic-vintage',
  variants: {
    rose: { text: '#3A2A2E', background: '#FBF2EE', accent: '#9C4A63', muted: '#A98B90' },
    lavender: { text: '#322B3A', background: '#F7F4F2', accent: '#7A5A86', muted: '#988FA0' },
    sage: { text: '#2C322A', background: '#F6F5EC', accent: '#A65C6E', muted: '#8B9183' },
  },
  ornamentFamily: 'floral',
  texture: 'paper',
  dropCap: 'framed',
  framePages: true,
  numeralStyle: 'word',
};

export const minimalistNordicSpec: SystemSpec = {
  id: 'minimalist-nordic',
  variants: {
    snow: { text: '#1A1A1A', background: '#FFFFFF', accent: '#2D5BFF', muted: '#9A9A9A' },
    fog: { text: '#2A2D30', background: '#F4F5F6', accent: '#5B6166', muted: '#A7ABAE' },
    clay: { text: '#262320', background: '#F6F3EE', accent: '#B5663F', muted: '#A39B90' },
  },
  ornamentFamily: 'geometric',
  texture: 'flat',
  dropCap: 'plain',
  framePages: false,
  numeralStyle: 'numeral',
  headingTracking: '-0.01em',
};

export const fairytaleClassicSpec: SystemSpec = {
  id: 'fairytale-classic',
  variants: {
    gold: { text: '#2A1D0E', background: '#FAF2DC', accent: '#B08A2E', muted: '#9A8758' },
    midnight: { text: '#1B2138', background: '#FAF4E4', accent: '#C09A3E', muted: '#7C82A0' },
    forest: { text: '#1E2C1F', background: '#F8F3E2', accent: '#A98432', muted: '#7D8A72' },
  },
  ornamentFamily: 'woodcut',
  texture: 'linen',
  dropCap: 'framed',
  framePages: true,
  numeralStyle: 'word',
};
