/**
 * Shared ornament library — the craft multiplier. A curated set of
 * high-quality SVG ornaments, organized into motif families, all drawn in
 * `currentColor` so each design system colors them with its accent. Systems
 * pick a family that fits their genre (florals for romance, geometric for
 * modern, woodcut for fairytale) instead of hand-rolling decoration.
 *
 * Every divider returns an inline SVG sized to ~a text column; callers wrap
 * it and set color + margins.
 */

import type { ReactNode } from 'react';

export type OrnamentFamily =
  | 'diamond' // memoir / classic — small lozenges
  | 'floral' // romantic / vintage — fleuron sprigs
  | 'geometric' // modern / nordic — thin lines + dot
  | 'deco' // bold / art-deco fans + chevrons
  | 'woodcut' // fairytale — sun/star burst
  | 'asterism' // literary — three asterisks
  | 'rule'; // plain hairline

// --- Section dividers (centered scene/section breaks) -----------------------

export function Divider({ family, width = 200 }: { family: OrnamentFamily; width?: number }): ReactNode {
  const h = 22;
  switch (family) {
    case 'floral':
      return (
        <svg viewBox="0 0 240 22" width={width} height={(width * h) / 240} aria-hidden="true">
          <line x1="20" y1="11" x2="96" y2="11" stroke="currentColor" strokeWidth="0.6" />
          <path
            d="M120 4 C116 8 110 8 108 11 C110 14 116 14 120 18 C124 14 130 14 132 11 C130 8 124 8 120 4 Z"
            fill="currentColor"
            opacity="0.9"
          />
          <circle cx="120" cy="11" r="1.6" fill="currentColor" />
          <path d="M104 11 q-5 -4 -10 0 q5 4 10 0Z" fill="currentColor" opacity="0.7" />
          <path d="M136 11 q5 -4 10 0 q-5 4 -10 0Z" fill="currentColor" opacity="0.7" />
          <line x1="144" y1="11" x2="220" y2="11" stroke="currentColor" strokeWidth="0.6" />
        </svg>
      );
    case 'geometric':
      return (
        <svg viewBox="0 0 240 22" width={width} height={(width * h) / 240} aria-hidden="true">
          <line x1="40" y1="11" x2="110" y2="11" stroke="currentColor" strokeWidth="0.8" />
          <rect x="116" y="7" width="8" height="8" transform="rotate(45 120 11)" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <line x1="130" y1="11" x2="200" y2="11" stroke="currentColor" strokeWidth="0.8" />
        </svg>
      );
    case 'deco':
      return (
        <svg viewBox="0 0 240 22" width={width} height={(width * h) / 240} aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={120 - 24 + i * 12} y1="4" x2={120} y2="11" stroke="currentColor" strokeWidth="0.9" />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={`b${i}`} x1={120 - 24 + i * 12} y1="18" x2={120} y2="11" stroke="currentColor" strokeWidth="0.9" />
          ))}
          <circle cx="120" cy="11" r="2.2" fill="currentColor" />
        </svg>
      );
    case 'woodcut':
      return (
        <svg viewBox="0 0 240 26" width={width} height={(width * 26) / 240} aria-hidden="true">
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const r1 = 5;
            const r2 = i % 2 === 0 ? 11 : 8;
            return (
              <line
                key={i}
                x1={120 + Math.cos(a) * r1}
                y1={13 + Math.sin(a) * r1}
                x2={120 + Math.cos(a) * r2}
                y2={13 + Math.sin(a) * r2}
                stroke="currentColor"
                strokeWidth="1.1"
              />
            );
          })}
          <circle cx="120" cy="13" r="4" fill="none" stroke="currentColor" strokeWidth="1.1" />
        </svg>
      );
    case 'asterism':
      return (
        <svg viewBox="0 0 240 22" width={width} height={(width * h) / 240} aria-hidden="true">
          <text x="120" y="17" textAnchor="middle" fontSize="18" fill="currentColor" fontFamily="serif" letterSpacing="6">
            ⁂
          </text>
        </svg>
      );
    case 'rule':
      return (
        <svg viewBox="0 0 240 6" width={width} height={(width * 6) / 240} aria-hidden="true">
          <line x1="40" y1="3" x2="200" y2="3" stroke="currentColor" strokeWidth="0.6" />
        </svg>
      );
    case 'diamond':
    default:
      return (
        <svg viewBox="0 0 240 20" width={width} height={(width * 20) / 240} aria-hidden="true">
          <path d="M92 6 L98 10 L92 14 L86 10 Z" fill="currentColor" />
          <path d="M120 3 L128 10 L120 17 L112 10 Z" fill="currentColor" />
          <path d="M148 6 L154 10 L148 14 L142 10 Z" fill="currentColor" />
        </svg>
      );
  }
}

// --- Decorative corner pieces (for framed pages) ----------------------------

export function Corner({ family, size = 60 }: { family: OrnamentFamily; size?: number }): ReactNode {
  switch (family) {
    case 'floral':
      return (
        <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden="true">
          <path d="M4 4 L4 30 Q4 12 30 4 Z" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M8 8 q14 -2 20 6 q-10 -2 -14 8 q-2 -10 -6 -14Z" fill="currentColor" opacity="0.8" />
          <circle cx="9" cy="9" r="2" fill="currentColor" />
        </svg>
      );
    case 'deco':
      return (
        <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden="true">
          <path d="M4 4 H40 M4 4 V40" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <path d="M10 10 H30 M10 10 V30" stroke="currentColor" strokeWidth="0.8" fill="none" />
          <circle cx="4" cy="4" r="2.4" fill="currentColor" />
        </svg>
      );
    case 'woodcut':
      return (
        <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden="true">
          <path d="M4 4 H44 M4 4 V44" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M4 4 L20 20" stroke="currentColor" strokeWidth="1" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden="true">
          <path d="M4 4 H38 M4 4 V38" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      );
  }
}

// --- Illuminated drop-cap frame (sits behind a large initial) ---------------

export function InitialFrame({
  family,
  size = 70,
  bg = 'transparent',
}: {
  family: OrnamentFamily;
  size?: number;
  bg?: string;
}): ReactNode {
  if (family === 'floral') {
    return (
      <svg viewBox="0 0 70 70" width={size} height={size} aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
        <rect x="2" y="2" width="66" height="66" fill={bg} stroke="currentColor" strokeWidth="1" />
        <path d="M2 18 q6 -10 16 -16 M68 18 q-6 -10 -16 -16 M2 52 q6 10 16 16 M68 52 q-6 10 -16 16" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.7" />
      </svg>
    );
  }
  if (family === 'deco' || family === 'woodcut') {
    return (
      <svg viewBox="0 0 70 70" width={size} height={size} aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
        <rect x="2" y="2" width="66" height="66" fill={bg} stroke="currentColor" strokeWidth={family === 'woodcut' ? 2 : 1.2} />
        {family === 'deco' && <rect x="7" y="7" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="0.5" />}
      </svg>
    );
  }
  return null;
}
