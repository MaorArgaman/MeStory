/**
 * Shared cover styling — single source of truth for all cover renderers.
 *
 * Used by:
 *   - Book3DPreview.tsx         (Design Studio, variant "studio")
 *   - BookLayoutPage.tsx        (CoverPreview / BackCoverPreview, variant "flat")
 *   - BookFlipReader.tsx        (reader modal, variant "flat", scale ~1.4)
 *   - PrintBookPage.tsx         (PDF export, variant "print", scale ~2)
 *
 * When changing a value here it updates every consumer automatically.
 */
import type { CSSProperties } from 'react';

// ── Variants ──────────────────────────────────────────────────────
// "studio" = 3D view (perspective + glow offset the darker overlay)
// "flat"   = 2D screen preview (lighter overlay, no 3D brightness)
// "print"  = PDF / paper export (tuned for print readability)
export type CoverVariant = 'studio' | 'flat' | 'print';

// ── Scale presets for known container sizes ────────────────────────
// Base is 280×400 (Book3DPreview). Other sizes scale proportionally.
export const COVER_SCALE = {
  studio: 1,       // 280×400
  layout: 1,       // ~282×400
  reader: 1.43,    // 400×560
  print:  2,       // ~560×794  (A5 at 96 dpi)
} as const;

// ── Overlay gradients ─────────────────────────────────────────────
export const FRONT_OVERLAY: Record<CoverVariant, string> = {
  studio: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5))',
  flat:   'linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.25))',
  print:  'linear-gradient(to bottom, rgba(0,0,0,0.10), rgba(0,0,0,0.35))',
};

export const BACK_OVERLAY: Record<CoverVariant, string> = {
  studio: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7))',
  flat:   'linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.55))',
  print:  'linear-gradient(to bottom, rgba(0,0,0,0.40), rgba(0,0,0,0.60))',
};

// ── Default text positions (percentage) ───────────────────────────
export const DEFAULT_TITLE_POS    = { x: 50, y: 20 };
export const DEFAULT_AUTHOR_POS   = { x: 50, y: 85 };
export const DEFAULT_SYNOPSIS_POS = { x: 50, y: 40 };

// ── Title ─────────────────────────────────────────────────────────
// `scale` adjusts px values for containers larger than the base 280×400.
export function titleStyle(
  title: string,
  textColor: string,
  fontFamily: string,
  scale = 1,
): CSSProperties {
  const base = title.length > 30 ? 16 : title.length > 20 ? 20 : 26;
  return {
    fontFamily,
    fontSize: `${Math.round(base * scale)}px`,
    fontWeight: 'bold',
    color: textColor,
    textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
    lineHeight: '1.3',
    textAlign: 'center',
    display: '-webkit-box',
    WebkitLineClamp: 4,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    wordBreak: 'keep-all' as const,
  };
}

// ── Author (front cover) ─────────────────────────────────────────
export function authorStyle(
  textColor: string,
  fontFamily: string,
  scale = 1,
): CSSProperties {
  return {
    fontFamily,
    fontSize: `${Math.round(18 * scale)}px`,
    color: textColor,
    textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
    opacity: 0.9,
    textAlign: 'center',
  };
}

// ── Synopsis (back cover) ────────────────────────────────────────
export function synopsisStyle(
  text: string,
  textColor: string,
  fontFamily: string,
  isRTL: boolean,
  scale = 1,
): CSSProperties {
  const len = text.length;
  const base = len < 150 ? 11 : len < 300 ? 9.5 : len < 450 ? 8 : 7;
  const lh   = len < 150 ? '1.5' : len < 300 ? '1.45' : '1.4';
  return {
    fontFamily,
    fontSize: `${Math.round(base * scale * 10) / 10}px`,
    lineHeight: lh,
    color: textColor,
    textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
    opacity: 0.95,
    userSelect: 'none',
    whiteSpace: 'pre-wrap',
    textAlign: isRTL ? 'right' : 'left',
  };
}

// ── Author line on back cover ────────────────────────────────────
export function backAuthorStyle(
  textColor: string,
  fontFamily: string,
  isRTL: boolean,
  scale = 1,
): CSSProperties {
  return {
    fontFamily,
    fontSize: `${Math.round(10 * scale)}px`,
    color: textColor,
    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
    opacity: 0.85,
    textAlign: isRTL ? 'right' : 'left',
  };
}
