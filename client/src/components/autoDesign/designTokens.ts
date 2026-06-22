/**
 * Client mirror of server/src/services/autoDesign/tokens.ts. Pure helpers
 * — keep in sync with the server copy. (No build-time sharing between
 * client and server in this repo, same as designPlanTypes ↔ schema.)
 */

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
 * Mirror of server tokens.buildTypeScale — keep in sync.
 */
export function buildTypeScale(
  baseSize: number,
  ratio: number
): [number, number, number, number, number] {
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const up = (steps: number) => r1(baseSize * Math.pow(ratio, steps));
  return [r1(baseSize), r1(baseSize / ratio), up(1.5), up(2.5), up(3.5)];
}

export interface ColorRoles {
  text: string;
  background: string;
  accent: string;
  muted: string;
  surface: string;
  accentTint: string;
  scrimDark: string;
  scrimLight: string;
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

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

/** Deterministic Fisher-Yates shuffle (returns a new array). */
export function shuffle<T>(rng: () => number, arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Small stable string hash → int, for per-id deterministic variation. */
export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

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

export function mix(a: string, b: string, amount: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const t = Math.max(0, Math.min(1, amount));
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const bch = Math.round(ca.b + (cb.b - ca.b) * t);
  return `#${[r, g, bch].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}
