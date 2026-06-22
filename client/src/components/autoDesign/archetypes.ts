/**
 * Archetypes — the taste matrix. Each of the 10 design families maps to the
 * pools of choices the genome sampler may draw from. These pools are the
 * guardrails: a memoir's pool never contains neon or a condensed zine font, so
 * every sampled combination stays coherent even though there are thousands of
 * them. Widen a pool → that family gains variety; the cost is one array entry.
 */

import type { DesignSystemId } from './designPlanTypes';
import type { Archetype } from './genome';
import { palettesByAnyTag, type PaletteTag } from './palettes';
import { pairingsByTags, type FontTag } from './fontPairings';

interface ArchetypeSpec extends Omit<Archetype, 'id' | 'palettes' | 'fontPairings'> {
  paletteTags: PaletteTag[];
  fontTags: FontTag[];
}

const SPECS: Record<DesignSystemId, ArchetypeSpec> = {
  'memoir-warm': {
    ornaments: ['diamond', 'floral', 'botanical', 'asterism', 'rule'],
    textures: ['paper', 'linen', 'vellum', 'speckle', 'deckle'],
    dropCaps: ['framed', 'raised', 'plain'],
    numeralStyles: ['word', 'numeral', 'roman'],
    framePagesChoices: [false, true],
    headingTrackings: ['0', '0.04em', '0.1em'],
    scaleRatios: ['minor-third', 'major-third', 'perfect-fourth'],
    paletteTags: ['warm', 'earth', 'sepia', 'romantic'],
    fontTags: ['serif', 'classic', 'elegant'],
    baseSizePt: [11, 12],
    leading: [1.55, 1.7],
    margins: { top: [22, 28], bottom: [24, 30], start: [20, 26], end: [20, 26] },
    columns: [1],
    openerTemplates: ['numeral-ornament', 'image-overlay', 'rule-stack'],
    imageTreatments: ['framed', 'polaroid', 'postcard', 'sepia', 'plain', 'duotone'],
  },
  'editorial-modern': {
    ornaments: ['geometric', 'rule', 'asterism', 'bauhaus'],
    textures: ['flat', 'dot-grid', 'graph', 'grid-lines'],
    dropCaps: ['plain', 'underline', 'color-block'],
    numeralStyles: ['numeral', 'outlined'],
    framePagesChoices: [false],
    headingTrackings: ['0', '0.01em', '-0.01em'],
    scaleRatios: ['perfect-fourth', 'augmented-fourth', 'perfect-fifth'],
    paletteTags: ['mono', 'neutral', 'vivid', 'cool'],
    fontTags: ['serif', 'editorial', 'modern'],
    baseSizePt: [10.5, 12],
    leading: [1.45, 1.6],
    margins: { top: [18, 24], bottom: [20, 26], start: [18, 24], end: [18, 24] },
    columns: [1, 2],
    openerTemplates: ['rule-stack', 'vertical-title', 'numeral-ornament', 'image-overlay'],
    imageTreatments: ['framed', 'duotone', 'plain', 'soft-shadow', 'blueprint'],
  },
  'storybook-illustrated': {
    ornaments: ['woodcut', 'botanical', 'celestial', 'floral'],
    textures: ['paper', 'vellum', 'speckle'],
    dropCaps: ['framed', 'raised', 'color-block'],
    numeralStyles: ['word', 'circled'],
    framePagesChoices: [true, false],
    headingTrackings: ['0', '0.04em'],
    scaleRatios: ['major-third', 'perfect-fourth', 'perfect-fifth'],
    paletteTags: ['warm', 'fresh', 'vivid', 'pastel'],
    fontTags: ['playful', 'friendly', 'serif'],
    baseSizePt: [12, 13.5],
    leading: [1.5, 1.65],
    margins: { top: [18, 24], bottom: [20, 26], start: [18, 24], end: [18, 24] },
    columns: [1],
    openerTemplates: ['image-overlay', 'numeral-ornament', 'rule-stack'],
    imageTreatments: ['rounded', 'framed', 'polaroid', 'plain', 'soft-shadow'],
  },
  'playful-zine': {
    ornaments: ['bauhaus', 'deco', 'wave', 'brushstroke', 'celestial'],
    textures: ['flat', 'halftone', 'dot-grid', 'diagonal-wash'],
    dropCaps: ['color-block', 'raised', 'plain'],
    numeralStyles: ['outlined', 'circled', 'numeral'],
    framePagesChoices: [false],
    headingTrackings: ['0', '0.02em', '0.08em'],
    scaleRatios: ['perfect-fifth', 'golden', 'major-sixth'],
    paletteTags: ['vivid', 'jewel', 'cool'],
    fontTags: ['playful', 'bold', 'modern'],
    baseSizePt: [11, 12.5],
    leading: [1.45, 1.6],
    margins: { top: [16, 22], bottom: [18, 24], start: [16, 22], end: [16, 22] },
    columns: [1, 2],
    openerTemplates: ['vertical-title', 'image-overlay', 'rule-stack', 'numeral-ornament'],
    imageTreatments: ['duotone', 'rounded', 'soft-shadow', 'blueprint', 'plain'],
  },
  'romantic-vintage': {
    ornaments: ['floral', 'artnouveau', 'botanical', 'asterism'],
    textures: ['paper', 'linen', 'vellum', 'deckle'],
    dropCaps: ['framed', 'raised'],
    numeralStyles: ['word', 'roman'],
    framePagesChoices: [true, false],
    headingTrackings: ['0', '0.04em', '0.1em'],
    scaleRatios: ['minor-third', 'major-third', 'perfect-fourth'],
    paletteTags: ['romantic', 'warm', 'pastel', 'muted'],
    fontTags: ['elegant', 'serif', 'romantic'],
    baseSizePt: [11, 12],
    leading: [1.55, 1.72],
    margins: { top: [22, 30], bottom: [24, 32], start: [22, 28], end: [22, 28] },
    columns: [1],
    openerTemplates: ['numeral-ornament', 'rule-stack', 'image-overlay'],
    imageTreatments: ['polaroid', 'postcard', 'framed', 'sepia', 'vignette', 'plain'],
  },
  'minimalist-nordic': {
    ornaments: ['geometric', 'rule', 'wave'],
    textures: ['flat', 'dot-grid', 'vellum'],
    dropCaps: ['plain', 'underline'],
    numeralStyles: ['numeral', 'outlined'],
    framePagesChoices: [false],
    headingTrackings: ['0', '-0.01em', '-0.02em'],
    scaleRatios: ['major-second', 'minor-third', 'major-third'],
    paletteTags: ['cool', 'neutral', 'mono', 'fresh'],
    fontTags: ['minimal', 'sans', 'modern'],
    baseSizePt: [10.5, 11.5],
    leading: [1.5, 1.65],
    margins: { top: [26, 34], bottom: [28, 36], start: [24, 32], end: [24, 32] },
    columns: [1],
    openerTemplates: ['rule-stack', 'vertical-title', 'numeral-ornament'],
    imageTreatments: ['plain', 'soft-shadow', 'duotone', 'rounded'],
  },
  'academic-formal': {
    ornaments: ['rule', 'asterism', 'geometric', 'diamond'],
    textures: ['flat', 'vellum', 'graph', 'grid-lines'],
    dropCaps: ['plain', 'underline'],
    numeralStyles: ['numeral', 'roman'],
    framePagesChoices: [false],
    headingTrackings: ['0', '0.01em'],
    scaleRatios: ['minor-third', 'major-third', 'perfect-fourth'],
    paletteTags: ['neutral', 'mono', 'earth', 'cool'],
    fontTags: ['serif', 'classic', 'editorial'],
    baseSizePt: [10.5, 11.5],
    leading: [1.5, 1.62],
    margins: { top: [22, 28], bottom: [24, 30], start: [24, 34], end: [22, 30] },
    columns: [1],
    openerTemplates: ['rule-stack', 'numeral-ornament', 'vertical-title'],
    imageTreatments: ['framed', 'plain', 'duotone', 'soft-shadow'],
  },
  'bold-magazine': {
    ornaments: ['deco', 'bauhaus', 'geometric', 'brushstroke'],
    textures: ['flat', 'halftone', 'diagonal-wash'],
    dropCaps: ['color-block', 'raised', 'plain'],
    numeralStyles: ['outlined', 'numeral'],
    framePagesChoices: [false],
    headingTrackings: ['0', '0.02em', '0.06em'],
    scaleRatios: ['perfect-fifth', 'golden', 'major-sixth', 'major-seventh'],
    paletteTags: ['vivid', 'mono', 'jewel', 'dark'],
    fontTags: ['bold', 'editorial', 'modern'],
    baseSizePt: [10.5, 12],
    leading: [1.4, 1.55],
    margins: { top: [16, 22], bottom: [18, 24], start: [16, 22], end: [16, 22] },
    columns: [1, 2],
    openerTemplates: ['vertical-title', 'image-overlay', 'rule-stack'],
    imageTreatments: ['duotone', 'blueprint', 'soft-shadow', 'framed', 'plain'],
  },
  'fairytale-classic': {
    ornaments: ['woodcut', 'floral', 'artnouveau', 'celestial', 'botanical'],
    textures: ['linen', 'paper', 'vellum', 'deckle'],
    dropCaps: ['framed', 'raised'],
    numeralStyles: ['word', 'roman', 'circled'],
    framePagesChoices: [true, false],
    headingTrackings: ['0', '0.04em', '0.08em'],
    scaleRatios: ['major-third', 'perfect-fourth', 'augmented-fourth'],
    paletteTags: ['jewel', 'warm', 'earth'],
    fontTags: ['elegant', 'serif', 'classic'],
    baseSizePt: [11.5, 13],
    leading: [1.5, 1.66],
    margins: { top: [22, 30], bottom: [24, 32], start: [22, 28], end: [22, 28] },
    columns: [1],
    openerTemplates: ['numeral-ornament', 'image-overlay', 'rule-stack'],
    imageTreatments: ['framed', 'vignette', 'sepia', 'polaroid', 'plain'],
  },
  'poetry-quiet': {
    ornaments: ['rule', 'asterism', 'wave', 'geometric'],
    textures: ['flat', 'vellum', 'paper'],
    dropCaps: ['plain', 'underline'],
    numeralStyles: ['word', 'numeral', 'roman'],
    framePagesChoices: [false],
    headingTrackings: ['0', '0.06em', '0.12em'],
    scaleRatios: ['minor-second', 'major-second', 'minor-third'],
    paletteTags: ['muted', 'neutral', 'cool', 'pastel'],
    fontTags: ['quiet', 'minimal', 'elegant'],
    baseSizePt: [11, 12.5],
    leading: [1.6, 1.8],
    margins: { top: [30, 40], bottom: [30, 40], start: [30, 40], end: [30, 40] },
    columns: [1],
    openerTemplates: ['numeral-ornament', 'rule-stack', 'vertical-title'],
    imageTreatments: ['plain', 'soft-shadow', 'vignette', 'duotone'],
  },
};

const cache = new Map<DesignSystemId, Archetype>();

/** Resolve a design family into its full Archetype (with palette + font pools). */
export function getArchetype(id: DesignSystemId): Archetype {
  const cached = cache.get(id);
  if (cached) return cached;
  const spec = SPECS[id] || SPECS['memoir-warm'];
  const { paletteTags, fontTags, ...rest } = spec;
  const archetype: Archetype = {
    id,
    ...rest,
    palettes: palettesByAnyTag(paletteTags),
    fontPairings: pairingsByTags(fontTags),
  };
  cache.set(id, archetype);
  return archetype;
}
