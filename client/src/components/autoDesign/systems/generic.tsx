/**
 * Generic SystemVisual — the fallback used by the 9 design systems that are
 * still stubs (everything except memoir-warm in Phase A). It renders cleanly
 * and respects the plan's palette/typography, but without the hand-crafted
 * per-system DNA (real ornaments, image-overlay openers, photo treatments).
 *
 * As each system graduates to a real module, add it to the registry in
 * index.ts so it stops falling back here.
 */

import type { CSSProperties, ReactNode } from 'react';
import { deriveColorRoles, rgba, type ColorRoles } from '../designTokens';
import type { Palette } from '../designPlanTypes';
import type { ImageTreatmentResult, OpenerProps, SystemVisual } from './types';

export function makeGenericVisual(id: string): SystemVisual {
  return {
    id,
    resolveRoles(_variantId: string | undefined, planPalette: Palette): ColorRoles {
      return deriveColorRoles(
        planPalette || { text: '#1a1a1a', background: '#ffffff', accent: '#888', muted: '#888' }
      );
    },
    pageBackground(roles): CSSProperties {
      return { background: roles.background };
    },
    Ornament({ style, roles }): ReactNode {
      if (style === 'none') return <div style={{ height: '8pt' }} />;
      const glyph = style === 'stars' ? '✦ ✦ ✦' : style === 'ornament' ? '◆ ◆ ◆' : '———';
      return (
        <div
          style={{
            textAlign: 'center',
            margin: '14pt 0',
            color: roles.accent,
            letterSpacing: '0.4em',
            fontSize: '11pt',
          }}
        >
          {glyph}
        </div>
      );
    },
    DropCap({ letter, roles, typography }): ReactNode {
      return (
        <span
          style={{
            float: 'right',
            fontFamily: typography.displayFamily || typography.headingFamily,
            color: roles.accent,
            fontSize: `${typography.baseSize * 3.2}pt`,
            lineHeight: 0.9,
            marginLeft: '4pt',
            marginTop: '2pt',
          }}
        >
          {letter}
        </span>
      );
    },
    ChapterOpener({ chapterIndex, title, epigraph, roles, typography }: OpenerProps): ReactNode {
      return (
        <div style={{ marginTop: '20mm', textAlign: 'center' }}>
          <div
            style={{
              fontFamily: typography.displayFamily || typography.headingFamily,
              fontSize: `${typography.scale[3]}pt`,
              color: roles.accent,
              letterSpacing: '0.2em',
            }}
          >
            פרק {chapterIndex + 1}
          </div>
          <h2
            style={{
              fontFamily: typography.headingFamily,
              fontSize: `${typography.scale[4]}pt`,
              color: roles.text,
              margin: '6pt 0 14pt 0',
              lineHeight: 1.2,
            }}
          >
            {title}
          </h2>
          {epigraph && (
            <p
              style={{
                fontFamily: typography.bodyFamily,
                fontSize: `${typography.scale[1]}pt`,
                color: roles.muted,
                fontStyle: 'italic',
                maxWidth: '70%',
                margin: '0 auto',
              }}
            >
              {epigraph}
            </p>
          )}
          <div style={{ width: '40%', height: '1px', background: roles.accent, margin: '14pt auto 0' }} />
        </div>
      );
    },
    imageTreatment(treatment, roles): ImageTreatmentResult {
      const captionStyle: CSSProperties = {
        marginTop: '4pt',
        color: roles.muted,
        fontStyle: 'italic',
        textAlign: 'center',
        fontSize: '9pt',
      };
      if (treatment === 'framed' || treatment === 'postcard') {
        return {
          figureStyle: { margin: '6pt auto', padding: '6pt', border: `1px solid ${roles.muted}` },
          imgStyle: { width: '100%', height: 'auto', display: 'block' },
          captionStyle,
        };
      }
      if (treatment === 'rounded') {
        return {
          figureStyle: { margin: '6pt auto', borderRadius: '3mm', overflow: 'hidden' },
          imgStyle: { width: '100%', height: 'auto', display: 'block' },
          captionStyle,
        };
      }
      if (treatment === 'duotone') {
        return {
          figureStyle: { margin: '6pt auto', position: 'relative', overflow: 'hidden' },
          imgStyle: { width: '100%', height: 'auto', display: 'block', filter: 'grayscale(1)' },
          captionStyle,
          overlay: (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: rgba(roles.accent, 0.4),
                mixBlendMode: 'color',
              }}
            />
          ),
        };
      }
      return {
        figureStyle: { margin: '6pt auto' },
        imgStyle: { width: '100%', height: 'auto', display: 'block' },
        captionStyle,
      };
    },
  };
}
