/**
 * SERVER MIRROR of client/src/components/autoDesign/genome.ts.
 *
 * composeGenome MUST stay byte-identical in draw ORDER and array contents to
 * the client copy, so the DOCX renderer reproduces the exact same genome the
 * preview/PDF show for a given (archetype, seed). The visual-only axes
 * (ornamentFamily/texture/dropCap/numeralStyle) are typed as string here since
 * the server doesn't import the client's ornament/texture modules — it only
 * needs the chosen values, not the rendering.
 */

import type { ChapterOpenerTemplate, ImageTreatment, Palette, Typography } from './designPlanSchema';
import { SCALE_RATIOS, type ScaleRatioName, buildTypeScale, makeRng, pick, shuffle } from './tokens';
import type { FontPairing } from './fontPairings';

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

export interface StyleGenome {
  ornamentFamily: string;
  texture: string;
  dropCap: string;
  numeralStyle: string;
  framePages: boolean;
  headingTracking: string;
  scaleRatio: ScaleRatioName;
  palette: Palette;
  typography: Typography;
  marginsMm: Margins;
  columns: 1 | 2;
  openerRotation: ChapterOpenerTemplate[];
  imageTreatmentPool: ImageTreatment[];
}

export interface Archetype {
  id: string;
  ornaments: string[];
  textures: string[];
  dropCaps: string[];
  numeralStyles: string[];
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
  if (!(step > 0)) return lo; // guard step<=0/NaN → avoids Infinity/NaN sizing
  const steps = Math.round((hi - lo) / step);
  const k = Math.floor(rng() * (steps + 1));
  return Math.round((lo + k * step) * 100) / 100;
}

/** Deterministically sample a full StyleGenome from an archetype + seed.
 *  The order of rng draws is FIXED — must match the client copy exactly. */
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
