/**
 * Registry of fully-built design-system modules. As each of the 10 systems
 * graduates from "stub" (generic defaults in designSystems.ts) to "real"
 * (its own module here with variants, openers, treatments), it gets added
 * to SYSTEM_MODULES.
 *
 * The planner uses these to offer richer choices (palette variants, opener
 * templates) for built systems. For systems not yet here, the planner
 * falls back to the generic scaffold in designSystems.ts.
 */

import { DesignSystemId } from '../designPlanSchema';
import { SystemModule, SystemVariant } from './types';
import { memoirWarm } from './memoirWarm';
import { editorialModern } from './editorialModern';
import { romanticVintage } from './romanticVintage';
import { minimalistNordic } from './minimalistNordic';
import { fairytaleClassic } from './fairytaleClassic';
import { buildTypeScale, SCALE_RATIOS, ScaleRatioName } from '../tokens';

export const SYSTEM_MODULES: Partial<Record<DesignSystemId, SystemModule>> = {
  'memoir-warm': memoirWarm,
  'editorial-modern': editorialModern,
  'romantic-vintage': romanticVintage,
  'minimalist-nordic': minimalistNordic,
  'fairytale-classic': fairytaleClassic,
};

export function getSystemModule(id: DesignSystemId): SystemModule | undefined {
  return SYSTEM_MODULES[id];
}

export function isFullyBuilt(id: DesignSystemId): boolean {
  return !!SYSTEM_MODULES[id];
}

/** Resolve a variant by id, falling back to the first variant. */
export function resolveVariant(module: SystemModule, variantId?: string): SystemVariant {
  if (variantId) {
    const found = module.variants.find((v) => v.id === variantId);
    if (found) return found;
  }
  return module.variants[0];
}

/**
 * Catalog block describing the built systems' variants + opener templates,
 * appended to the planner prompt so Claude can choose intelligently.
 */
export function plannerBuiltSystemsDetail(): string {
  const parts: string[] = [];
  for (const module of Object.values(SYSTEM_MODULES)) {
    if (!module) continue;
    const variants = module.variants
      .map((v) => `      • "${v.id}": ${v.mood}`)
      .join('\n');
    parts.push(
      `  "${module.id}" — ${module.bestFor}\n` +
        `    palette variants (pick the one matching the book's mood, set plan.variant):\n${variants}\n` +
        `    opener templates available: ${module.openerTemplates.join(', ')}\n` +
        `    image treatments available: ${module.imageTreatments.join(', ')}\n` +
        `    fonts: body="${module.fonts.body}" heading="${module.fonts.heading}" display="${module.fonts.display}"\n` +
        `    suggested base size: ${module.baseSizePt}pt, leading: ${module.leading}, scale ratios: ${module.allowedScaleRatios.join('/')}`
    );
  }
  return parts.join('\n\n');
}

/**
 * Produce a ready-to-use typography block for a built system given a chosen
 * scale ratio. Lets the planner (or a fallback) get a coherent scale without
 * hand-computing five sizes.
 */
export function typographyForSystem(
  module: SystemModule,
  scaleRatioName?: ScaleRatioName
): {
  bodyFamily: string;
  headingFamily: string;
  displayFamily: string;
  baseSize: number;
  leading: number;
  scale: [number, number, number, number, number];
} {
  const ratioName = scaleRatioName && SCALE_RATIOS[scaleRatioName]
    ? scaleRatioName
    : module.defaultScaleRatio;
  const ratio = SCALE_RATIOS[ratioName];
  return {
    bodyFamily: module.fonts.body,
    headingFamily: module.fonts.heading,
    displayFamily: module.fonts.display,
    baseSize: module.baseSizePt,
    leading: module.leading,
    scale: buildTypeScale(module.baseSizePt, ratio),
  };
}
