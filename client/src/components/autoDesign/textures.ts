/**
 * Subtle page background treatments. Each returns a CSSProperties `background`
 * (and optionally backgroundBlendMode) that prints cleanly — no heavy raster
 * images, just CSS gradients/patterns tuned to read as "paper", "linen",
 * "dot-grid", or a soft tonal wash. Systems pick one to add depth so pages
 * never read as a flat color block.
 */

import type { CSSProperties } from 'react';
import { rgba } from './designTokens';

export type TextureKind = 'paper' | 'linen' | 'dot-grid' | 'wash' | 'flat';

export function pageTexture(kind: TextureKind, bg: string, muted: string): CSSProperties {
  switch (kind) {
    case 'paper':
      // Faint warm grain via layered low-contrast radial speckles + top wash.
      return {
        background: `
          radial-gradient(${rgba(muted, 0.05)} 0.5px, transparent 0.6px) 0 0 / 4px 4px,
          radial-gradient(${rgba(muted, 0.04)} 0.5px, transparent 0.6px) 2px 2px / 4px 4px,
          linear-gradient(180deg, ${bg} 0%, ${rgba(muted, 0.05)} 100%)`,
      };
    case 'linen':
      // Woven feel — fine crosshatch of near-invisible lines.
      return {
        background: `
          repeating-linear-gradient(0deg, ${rgba(muted, 0.045)} 0 1px, transparent 1px 3px),
          repeating-linear-gradient(90deg, ${rgba(muted, 0.04)} 0 1px, transparent 1px 3px),
          ${bg}`,
      };
    case 'dot-grid':
      // Editorial/architectural dot grid, very faint.
      return {
        background: `radial-gradient(${rgba(muted, 0.10)} 0.7px, transparent 0.8px) 0 0 / 12px 12px, ${bg}`,
      };
    case 'wash':
      // Soft diagonal tonal wash — gentle depth, nothing else.
      return {
        background: `linear-gradient(135deg, ${bg} 0%, ${rgba(muted, 0.07)} 100%)`,
      };
    case 'flat':
    default:
      return { background: bg };
  }
}
