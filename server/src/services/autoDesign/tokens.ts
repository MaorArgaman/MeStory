/**
 * Design tokens & primitives — the foundation layer that turns "generic
 * output" into "typeset". Everything visual in the auto-design pipeline
 * is composed from these primitives rather than hardcoded per-renderer.
 *
 * This module is pure (no I/O, no deps) so it can be mirrored verbatim
 * on the client (client/src/components/autoDesign/designTokens.ts). Keep
 * the two copies in sync — if you change a function here, change it there.
 */

// ---------------------------------------------------------------------------
// Modular scale — the single most important typographic primitive.
// A type scale built from one ratio reads as intentional; ad-hoc sizes
// read as amateur. Common ratios and their "feel":
//   1.200 minor-third  — calm, tight (memoirs, body-heavy books)
//   1.250 major-third  — balanced, classic
//   1.333 perfect-4th  — confident, editorial
//   1.414 aug-4th      — dramatic
//   1.500 perfect-5th  — bold, magazine
//   1.618 golden       — expressive, display-led
// ---------------------------------------------------------------------------

export const SCALE_RATIOS = {
  'minor-second': 1.067,
  'major-second': 1.125,
  'minor-third': 1.2,
  'major-third': 1.25,
  'perfect-fourth': 1.333,
  'augmented-fourth': 1.414,
  'perfect-fifth': 1.5,
  'minor-sixth': 1.6,
  golden: 1.618,
  'major-sixth': 1.667,
  'major-seventh': 1.875,
} as const;

export type ScaleRatioName = keyof typeof SCALE_RATIOS;

/**
 * Build a 5-step type scale [body, small, h3, h2, h1] in pt from a base
 * size and a ratio. `small` is one step DOWN from body; headings climb up.
 */
export function buildTypeScale(
  baseSize: number,
  ratio: number
): [number, number, number, number, number] {
  const up = (steps: number) => round1(baseSize * Math.pow(ratio, steps));
  return [
    round1(baseSize), // body
    round1(baseSize / ratio), // small (captions, page numbers)
    up(1.5), // h3
    up(2.5), // h2
    up(3.5), // h1 (chapter titles)
  ];
}

// ---------------------------------------------------------------------------
// Spacing scale — vertical rhythm. All vertical gaps come from one scale
// so whitespace feels deliberate. Expressed in mm (renderers convert).
// ---------------------------------------------------------------------------

export const SPACING = {
  xs: 1.5,
  sm: 3,
  md: 6,
  lg: 10,
  xl: 16,
  xxl: 26,
} as const;

export type SpacingToken = keyof typeof SPACING;

// ---------------------------------------------------------------------------
// Baseline grid — text sits on a fixed baseline so columns and facing
// pages align. The baseline unit is derived from body leading.
// ---------------------------------------------------------------------------

export function baselineMm(baseSizePt: number, leading: number): number {
  // pt → mm (1pt = 0.352778mm), times leading.
  return round2(baseSizePt * 0.352778 * leading);
}

/** Snap a mm value to the nearest baseline multiple (keeps rhythm). */
export function snapToBaseline(mm: number, baseline: number): number {
  if (baseline <= 0) return mm;
  return round2(Math.round(mm / baseline) * baseline);
}

// ---------------------------------------------------------------------------
// Color roles — a palette is more than 4 hexes. From the 4 base roles we
// derive surfaces, scrims, tints and hairlines so systems can build depth
// (tinted callout backgrounds, image scrims, hairline rules) coherently.
// ---------------------------------------------------------------------------

export interface ColorRoles {
  text: string;
  background: string;
  accent: string;
  muted: string;
  /** Slightly off-background surface for cards/callouts. */
  surface: string;
  /** Accent at low alpha — tint washes. */
  accentTint: string;
  /** Dark scrim for text-on-image (light text). */
  scrimDark: string;
  /** Light scrim for text-on-image (dark text). */
  scrimLight: string;
  /** Hairline rule color. */
  hairline: string;
}

export function deriveColorRoles(base: {
  text: string;
  background: string;
  accent: string;
  muted: string;
}): ColorRoles {
  return {
    ...base,
    surface: mix(base.background, base.text, 0.04),
    accentTint: rgba(base.accent, 0.1),
    scrimDark: 'rgba(0,0,0,0.42)',
    scrimLight: 'rgba(255,255,255,0.55)',
    hairline: mix(base.muted, base.background, 0.45),
  };
}

// ---------------------------------------------------------------------------
// Seeded PRNG — deterministic variation. Same seed ⇒ same choices, so a
// saved plan always renders identically, but a regenerate (new seed) gets
// a different look. Mulberry32 — tiny, fast, good enough for layout dice.
// ---------------------------------------------------------------------------

export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one element from arr deterministically given an rng. */
export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const c = (hex || '#000000').replace('#', '');
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
  return {
    r: parseInt(full.slice(0, 2), 16) || 0,
    g: parseInt(full.slice(2, 4), 16) || 0,
    b: parseInt(full.slice(4, 6), 16) || 0,
  };
}

export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Linear mix of two hex colors. amount=0 → a, amount=1 → b. */
export function mix(a: string, b: string, amount: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const t = Math.max(0, Math.min(1, amount));
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const bch = Math.round(ca.b + (cb.b - ca.b) * t);
  return `#${[r, g, bch].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

/** Relative luminance — used to decide light vs dark text over an image. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
