/**
 * SystemVisual — the contract every client-side design system implements.
 * DesignedBookView owns page geometry (boxes, margins, RTL, columns,
 * pagination) and delegates all DECORATIVE / system-specific visuals to a
 * SystemVisual: backgrounds, ornaments, drop caps, chapter openers, image
 * treatments. This is what makes "memoir-warm" look nothing like
 * "editorial-modern" even though both run through the same renderer.
 */

import type { CSSProperties, ReactNode } from 'react';
import type { ColorRoles } from '../designTokens';
import type {
  ChapterOpenerTemplate,
  ImageTreatment,
  PageKind,
  Palette,
  Typography,
} from '../designPlanTypes';

export interface OpenerProps {
  chapterIndex: number;
  title: string;
  epigraph?: string;
  imageUrl?: string | null;
  template?: ChapterOpenerTemplate;
  roles: ColorRoles;
  typography: Typography;
  seed: number;
}

export interface ImageTreatmentResult {
  /** Style for the wrapping <figure>. */
  figureStyle: CSSProperties;
  /** Style for the <img> itself. */
  imgStyle: CSSProperties;
  /** Style for the <figcaption>, if a caption is present. */
  captionStyle: CSSProperties;
  /** Optional overlay element rendered above the image (vignette, duotone tint). */
  overlay?: ReactNode;
}

export interface SystemVisual {
  id: string;
  /** Resolve the chosen variant + any plan palette overrides into derived
   *  color roles (surfaces, scrims, hairlines). */
  resolveRoles(variantId: string | undefined, planPalette: Palette): ColorRoles;
  /** Page background + frame CSS for a given page kind. */
  pageBackground(roles: ColorRoles, kind: PageKind): CSSProperties;
  /** Decorative divider / section-break ornament. */
  Ornament(props: {
    style: 'rule' | 'ornament' | 'stars' | 'none';
    roles: ColorRoles;
    seed: number;
  }): ReactNode;
  /** Drop-cap initial. */
  DropCap(props: { letter: string; roles: ColorRoles; typography: Typography }): ReactNode;
  /** Chapter-opener composition (full page). */
  ChapterOpener(props: OpenerProps): ReactNode;
  /** Resolve an image treatment into style fragments. */
  imageTreatment(
    treatment: ImageTreatment | undefined,
    roles: ColorRoles,
    seed: number
  ): ImageTreatmentResult;
}
