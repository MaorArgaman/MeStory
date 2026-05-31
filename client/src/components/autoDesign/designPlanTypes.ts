/**
 * Client-side mirror of the server's designPlan DSL. Kept as loose
 * structural types — the server has the authoritative JSON schema and
 * runtime validator. Here we just need enough shape to render.
 *
 * If the server schema changes (new block types, palette fields, etc.),
 * update this file too. The render code in DesignedBookView gracefully
 * skips unknown block types, so stale clients won't crash on newer plans.
 */

export type DesignSystemId =
  | 'editorial-modern'
  | 'storybook-illustrated'
  | 'playful-zine'
  | 'romantic-vintage'
  | 'minimalist-nordic'
  | 'academic-formal'
  | 'bold-magazine'
  | 'fairytale-classic'
  | 'memoir-warm'
  | 'poetry-quiet';

export type ImagePlacement =
  | 'inline'
  | 'full-bleed'
  | 'full-bleed-top'
  | 'full-bleed-bottom'
  | 'side-left'
  | 'side-right'
  | 'framed-center';

export type ImageTreatment =
  | 'plain'
  | 'framed'
  | 'polaroid'
  | 'rounded'
  | 'duotone'
  | 'vignette'
  | 'postcard';

export type ChapterOpenerTemplate =
  | 'numeral-ornament'
  | 'image-overlay'
  | 'vertical-title'
  | 'rule-stack';

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string; align?: 'start' | 'center' | 'end' }
  | {
      type: 'paragraph';
      text: string;
      dropCap?: boolean;
      lead?: boolean;
      align?: 'start' | 'justify' | 'center';
      runInHead?: string;
    }
  | {
      type: 'image';
      imageId: string;
      placement: ImagePlacement;
      widthFraction?: number;
      caption?: string;
      treatment?: ImageTreatment;
    }
  | {
      type: 'layered';
      imageId: string;
      scrim: 'dark' | 'light' | 'gradient-bottom' | 'gradient-top' | 'none';
      align: 'center' | 'bottom' | 'top';
      overlay: Array<
        | { type: 'heading'; level: 1 | 2 | 3; text: string }
        | { type: 'paragraph'; text: string }
      >;
      heightFraction?: number;
    }
  | { type: 'margin-note'; text: string }
  | { type: 'accent-bar'; widthFraction?: number; thicknessPt?: number }
  | { type: 'pull-quote'; text: string; attribution?: string }
  | { type: 'divider'; style: 'rule' | 'ornament' | 'stars' | 'none' }
  | { type: 'callout'; text: string; tone: 'note' | 'warning' | 'quote' }
  | { type: 'spacer'; sizeMm: number }
  | { type: 'page-break' }
  | { type: 'toc' }
  | { type: 'title-page'; title: string; subtitle?: string; author: string }
  | {
      type: 'chapter-opener';
      chapterIndex: number;
      epigraph?: string;
      template?: ChapterOpenerTemplate;
      imageId?: string;
    };

export type PageKind =
  | 'title'
  | 'toc'
  | 'chapter-opener'
  | 'body'
  | 'image-feature'
  | 'spread'
  | 'pull-quote'
  | 'blank';

export interface Page {
  kind: PageKind;
  chapterIndex?: number;
  blocks: Block[];
}

export interface Palette {
  text: string;
  background: string;
  accent: string;
  muted: string;
}

export interface Typography {
  bodyFamily: string;
  headingFamily: string;
  displayFamily?: string;
  baseSize: number;
  leading: number;
  scale: [number, number, number, number, number]; // [body, small, h3, h2, h1]
}

export interface Grid {
  columns: 1 | 2;
  marginsMm: { top: number; bottom: number; start: number; end: number };
  gutterMm: number;
}

export interface DesignPlan {
  version: 1;
  seed: number;
  designSystem: DesignSystemId;
  variant?: string;
  scaleRatio?: string;
  tone: string;
  palette: Palette;
  typography: Typography;
  grid: Grid;
  pages: Page[];
}

export interface BookImageRef {
  _id?: string;
  url: string;
  pageIndex: number;
}

export interface BookForRender {
  id: string;
  title: string;
  author?: { name?: string };
  chapters?: Array<{ title: string; content: string }>;
  pageImages?: BookImageRef[];
  /** Manual-layout pages may also hold placed images; the renderer merges
   *  these with pageImages (same order as the server planner). */
  pageLayout?: { pages?: Array<{ images?: Array<{ url?: string }> }> };
}
