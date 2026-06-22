/**
 * Style genome — the heart of the generative design engine.
 *
 * An ARCHETYPE (derived from the plan's designSystem) declares the *pools* of
 * tasteful choices per visual axis — the guardrails that keep combinatorial
 * variety from turning ugly. A deterministic seeded sampler, composeGenome,
 * draws one value per axis from those pools to produce a concrete StyleGenome.
 *
 * Same (archetype, seed) ⇒ identical genome, always. A fresh seed ⇒ a fresh,
 * coherent design. That is what turns "10 fixed looks" into thousands: the
 * number of distinct outputs is the PRODUCT of the axis pool sizes, not their
 * sum. "Generate another variation" is just a new seed — free, instant,
 * client-side, with no LLM call.
 */

import type { OrnamentFamily } from './ornaments';
import type { TextureKind } from './textures';
import type {
  ChapterOpenerTemplate,
  ImageTreatment,
  Palette,
  Typography,
} from './designPlanTypes';
import { SCALE_RATIOS, type ScaleRatioName, buildTypeScale, makeRng, pick, shuffle } from './designTokens';
import type { FontPairing } from './fontPairings';

export type DropCapStyle = 'plain' | 'underline' | 'framed' | 'raised' | 'color-block';
export type NumeralStyle = 'word' | 'numeral' | 'roman' | 'circled' | 'outlined';

export interface Margins {
  top: number;
  bottom: number;
  start: number;
  end: number;
}
type Range = [number, number];
interface MarginRanges {
  top: Range;
  bottom: Range;
  start: Range;
  end: Range;
}

/** A concrete, fully-resolved visual identity sampled from an archetype. */
export interface StyleGenome {
  ornamentFamily: OrnamentFamily;
  texture: TextureKind;
  dropCap: DropCapStyle;
  numeralStyle: NumeralStyle;
  framePages: boolean;
  headingTracking: string;
  scaleRatio: ScaleRatioName;
  palette: Palette;
  typography: Typography;
  marginsMm: Margins;
  columns: 1 | 2;
  /** Ordered rotation of opener templates; chapter N uses rotation[N % len]. */
  openerRotation: ChapterOpenerTemplate[];
  /** Pool of image treatments; each image draws one deterministically. */
  imageTreatmentPool: ImageTreatment[];
}

/** The allowed-choice pools for one design family. */
export interface Archetype {
  id: string;
  ornaments: OrnamentFamily[];
  textures: TextureKind[];
  dropCaps: DropCapStyle[];
  numeralStyles: NumeralStyle[];
  framePagesChoices: boolean[];
  headingTrackings: string[];
  scaleRatios: ScaleRatioName[];
  palettes: Palette[];
  fontPairings: FontPairing[];
  baseSizePt: Range;
  leading: Range;
  margins: MarginRanges;
  columns: (1 | 2)[];
  openerTemplates: ChapterOpenerTemplate[];
  imageTreatments: ImageTreatment[];
}

function lerpStep(rng: () => number, [lo, hi]: Range, step: number): number {
  if (hi <= lo) return lo;
  const steps = Math.round((hi - lo) / step);
  const k = Math.floor(rng() * (steps + 1));
  return Math.round((lo + k * step) * 100) / 100;
}

/**
 * Deterministically sample a full StyleGenome from an archetype + seed.
 * The order of rng draws is FIXED — never reorder, or saved seeds would
 * render differently after an edit.
 */
export function composeGenome(archetype: Archetype, seed: number): StyleGenome {
  const rng = makeRng(seed >>> 0);

  const ornamentFamily = pick(rng, archetype.ornaments);
  const texture = pick(rng, archetype.textures);
  const dropCap = pick(rng, archetype.dropCaps);
  const numeralStyle = pick(rng, archetype.numeralStyles);
  const framePages = pick(rng, archetype.framePagesChoices);
  const headingTracking = pick(rng, archetype.headingTrackings);
  const scaleRatio = pick(rng, archetype.scaleRatios);
  const basePalette = pick(rng, archetype.palettes);
  const pairing = pick(rng, archetype.fontPairings);

  const baseSize = lerpStep(rng, archetype.baseSizePt, 0.5);
  const leading = lerpStep(rng, archetype.leading, 0.02);
  const columns = pick(rng, archetype.columns);
  const marginsMm: Margins = {
    top: lerpStep(rng, archetype.margins.top, 1),
    bottom: lerpStep(rng, archetype.margins.bottom, 1),
    start: lerpStep(rng, archetype.margins.start, 1),
    end: lerpStep(rng, archetype.margins.end, 1),
  };

  const palette: Palette = {
    text: basePalette.text,
    background: basePalette.background,
    accent: basePalette.accent,
    muted: basePalette.muted,
  };

  const typography: Typography = {
    bodyFamily: pairing.body,
    headingFamily: pairing.heading,
    displayFamily: pairing.display,
    baseSize,
    leading,
    scale: buildTypeScale(baseSize, SCALE_RATIOS[scaleRatio]),
  };

  const openerRotation = shuffle(rng, archetype.openerTemplates);
  const imageTreatmentPool = shuffle(rng, archetype.imageTreatments);

  return {
    ornamentFamily,
    texture,
    dropCap,
    numeralStyle,
    framePages,
    headingTracking,
    scaleRatio,
    palette,
    typography,
    marginsMm,
    columns,
    openerRotation: openerRotation.length ? openerRotation : ['numeral-ornament'],
    imageTreatmentPool: imageTreatmentPool.length ? imageTreatmentPool : ['plain'],
  };
}
