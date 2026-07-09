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

export const storybookIllustratedSpec: SystemSpec = {
  id: 'storybook-illustrated',
  variants: {
    sunshine: { text: '#4A3220', background: '#FFF9EC', accent: '#F0A82E', muted: '#B39B76' },
    sky: { text: '#28344A', background: '#F5FAFF', accent: '#4A9BD8', muted: '#93A5BB' },
    meadow: { text: '#2F4030', background: '#F7FBF2', accent: '#5FA860', muted: '#96AC94' },
    berry: { text: '#462C38', background: '#FFF7F6', accent: '#D8567B', muted: '#B694A2' },
  },
  ornamentFamily: 'celestial',
  texture: 'wash',
  dropCap: 'color-block',
  framePages: true,
  numeralStyle: 'circled',
};

export const playfulZineSpec: SystemSpec = {
  id: 'playful-zine',
  variants: {
    pop: { text: '#141414', background: '#FFFFFF', accent: '#E42A88', muted: '#8A8A8A' },
    citrus: { text: '#232016', background: '#FFFDF2', accent: '#F2701D', muted: '#98917B' },
    electric: { text: '#101828', background: '#FAFBFF', accent: '#2D50E6', muted: '#8792A8' },
  },
  ornamentFamily: 'bauhaus',
  texture: 'halftone',
  dropCap: 'color-block',
  framePages: false,
  numeralStyle: 'outlined',
  headingTracking: '0.02em',
};

export const academicFormalSpec: SystemSpec = {
  id: 'academic-formal',
  variants: {
    oxford: { text: '#15181D', background: '#FFFFFF', accent: '#1F3A5F', muted: '#6E7480' },
    parchment: { text: '#2B2013', background: '#FAF6EC', accent: '#7A2E2E', muted: '#8F846E' },
    graphite: { text: '#22262A', background: '#FCFDFD', accent: '#2E6B66', muted: '#7E868C' },
  },
  ornamentFamily: 'rule',
  texture: 'flat',
  dropCap: 'plain',
  framePages: false,
  numeralStyle: 'numeral',
  headingTracking: '0',
};

export const boldMagazineSpec: SystemSpec = {
  id: 'bold-magazine',
  variants: {
    noir: { text: '#0A0A0A', background: '#FFFFFF', accent: '#D5232E', muted: '#707070' },
    tangerine: { text: '#241A12', background: '#FCF8F3', accent: '#E05E10', muted: '#93856F' },
    cobalt: { text: '#0E1218', background: '#FBFCFE', accent: '#1D4ED8', muted: '#77808F' },
  },
  ornamentFamily: 'deco',
  texture: 'diagonal-wash',
  dropCap: 'raised',
  framePages: false,
  numeralStyle: 'outlined',
  headingTracking: '0.02em',
};

export const poetryQuietSpec: SystemSpec = {
  id: 'poetry-quiet',
  variants: {
    mist: { text: '#33373B', background: '#FDFDFC', accent: '#5E6B78', muted: '#A5AAAE' },
    blush: { text: '#3D3436', background: '#FDFAF9', accent: '#B07682', muted: '#B0A2A5' },
    sand: { text: '#3A342B', background: '#FCFAF4', accent: '#9A7B4F', muted: '#ABA28F' },
  },
  ornamentFamily: 'asterism',
  texture: 'vellum',
  dropCap: 'plain',
  framePages: false,
  numeralStyle: 'roman',
  headingTracking: '0.08em',
};
