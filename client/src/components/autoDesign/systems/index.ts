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
} from './factorySpecs';

const BUILT: Partial<Record<DesignSystemId, SystemVisual>> = {
  'memoir-warm': memoirWarmVisual,
  'editorial-modern': makeSystemVisual(editorialModernSpec),
  'romantic-vintage': makeSystemVisual(romanticVintageSpec),
  'minimalist-nordic': makeSystemVisual(minimalistNordicSpec),
  'fairytale-classic': makeSystemVisual(fairytaleClassicSpec),
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
