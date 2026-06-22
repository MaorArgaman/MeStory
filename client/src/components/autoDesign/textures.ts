/**
 * Subtle page background treatments. Each returns a CSSProperties `background`
 * (and optionally backgroundBlendMode) that prints cleanly — no heavy raster
 * images, just CSS gradients/patterns tuned to read as "paper", "linen",
 * "dot-grid", or a soft tonal wash. Systems pick one to add depth so pages
 * never read as a flat color block.
 */

import type { CSSProperties } from 'react';
import { rgba } from './designTokens';

export type TextureKind =
  | 'paper'
  | 'linen'
  | 'dot-grid'
  | 'wash'
  | 'flat'
  | 'crosshatch'
  | 'halftone'
  | 'speckle'
  | 'grid-lines'
  | 'diagonal-wash'
  | 'vellum'
  | 'deckle'
  | 'graph';

export function pageTexture(kind: TextureKind, bg: string, muted: string): CSSProperties {
  switch (kind) {
    case 'crosshatch':
      // Tighter woven crosshatch than linen — a touch more present.
      return {
        background: `
          repeating-linear-gradient(45deg, ${rgba(muted, 0.05)} 0 1px, transparent 1px 4px),
          repeating-linear-gradient(-45deg, ${rgba(muted, 0.045)} 0 1px, transparent 1px 4px),
          ${bg}`,
      };
    case 'halftone':
      // Print-style halftone dots, offset rows, very faint.
      return {
        background: `
          radial-gradient(${rgba(muted, 0.10)} 1px, transparent 1.4px) 0 0 / 10px 10px,
          radial-gradient(${rgba(muted, 0.07)} 1px, transparent 1.4px) 5px 5px / 10px 10px,
          ${bg}`,
      };
    case 'speckle':
      // Scattered organic speckle (handmade-paper feel) at three phases.
      return {
        background: `
          radial-gradient(${rgba(muted, 0.07)} 0.5px, transparent 0.7px) 0 0 / 7px 9px,
          radial-gradient(${rgba(muted, 0.05)} 0.5px, transparent 0.7px) 4px 3px / 11px 7px,
          radial-gradient(${rgba(muted, 0.04)} 0.5px, transparent 0.7px) 2px 6px / 9px 13px,
          ${bg}`,
      };
    case 'grid-lines':
      // Architectural ledger grid — thin lines every 16px.
      return {
        background: `
          repeating-linear-gradient(0deg, ${rgba(muted, 0.06)} 0 1px, transparent 1px 16px),
          repeating-linear-gradient(90deg, ${rgba(muted, 0.05)} 0 1px, transparent 1px 16px),
          ${bg}`,
      };
    case 'graph':
      // Fine engineering graph: minor + major lines.
      return {
        background: `
          repeating-linear-gradient(0deg, ${rgba(muted, 0.04)} 0 1px, transparent 1px 8px),
          repeating-linear-gradient(90deg, ${rgba(muted, 0.04)} 0 1px, transparent 1px 8px),
          repeating-linear-gradient(0deg, ${rgba(muted, 0.08)} 0 1px, transparent 1px 40px),
          repeating-linear-gradient(90deg, ${rgba(muted, 0.08)} 0 1px, transparent 1px 40px),
          ${bg}`,
      };
    case 'diagonal-wash':
      // Two-stop diagonal tonal wash, stronger than 'wash'.
      return {
        background: `linear-gradient(120deg, ${bg} 0%, ${rgba(muted, 0.04)} 55%, ${rgba(muted, 0.10)} 100%)`,
      };
    case 'vellum':
      // Soft cloudy vellum — broad off-center radial lightening.
      return {
        background: `
          radial-gradient(120% 90% at 30% 20%, ${rgba('#ffffff', 0.5)} 0%, transparent 55%),
          radial-gradient(100% 80% at 80% 90%, ${rgba(muted, 0.08)} 0%, transparent 60%),
          ${bg}`,
      };
    case 'deckle':
      // Subtle edge-darkening like a hand-torn deckle border + faint grain.
      return {
        background: `
          radial-gradient(${rgba(muted, 0.04)} 0.5px, transparent 0.6px) 0 0 / 5px 5px,
          radial-gradient(140% 140% at 50% 50%, transparent 78%, ${rgba(muted, 0.10)} 100%),
          ${bg}`,
      };
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
