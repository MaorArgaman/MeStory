/**
 * Client-side registry of SystemVisual implementations. Fully-built systems
 * map to their hand-crafted module; everything else falls back to a generic
 * visual that still respects palette/typography.
 */

import type { DesignSystemId } from '../designPlanTypes';
import type { SystemVisual } from './types';
import memoirWarmVisual from './memoirWarm';
import { makeGenericVisual } from './generic';
import { makeSystemVisual } from './systemFactory';
import {
  editorialModernSpec,
  romanticVintageSpec,
  minimalistNordicSpec,
  fairytaleClassicSpec,
  storybookIllustratedSpec,
  playfulZineSpec,
  academicFormalSpec,
  boldMagazineSpec,
  poetryQuietSpec,
} from './factorySpecs';

// All 10 systems are now fully built (mirrors server SYSTEM_MODULES);
// the generic fallback below only guards against unknown ids.
const BUILT: Partial<Record<DesignSystemId, SystemVisual>> = {
  'memoir-warm': memoirWarmVisual,
  'editorial-modern': makeSystemVisual(editorialModernSpec),
  'romantic-vintage': makeSystemVisual(romanticVintageSpec),
  'minimalist-nordic': makeSystemVisual(minimalistNordicSpec),
  'fairytale-classic': makeSystemVisual(fairytaleClassicSpec),
  'storybook-illustrated': makeSystemVisual(storybookIllustratedSpec),
  'playful-zine': makeSystemVisual(playfulZineSpec),
  'academic-formal': makeSystemVisual(academicFormalSpec),
  'bold-magazine': makeSystemVisual(boldMagazineSpec),
  'poetry-quiet': makeSystemVisual(poetryQuietSpec),
};

const genericCache = new Map<string, SystemVisual>();

export function getSystemVisual(id: DesignSystemId): SystemVisual {
  const built = BUILT[id];
  if (built) return built;
  let g = genericCache.get(id);
  if (!g) {
    g = makeGenericVisual(id);
    genericCache.set(id, g);
  }
  return g;
}
