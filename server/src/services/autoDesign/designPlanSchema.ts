/**
 * Design-plan DSL — the single source of truth shared between the
 * preview (HTML→PDF via Puppeteer) and the export (DOCX via the `docx`
 * package). The planner agent produces an instance of this; both
 * renderers consume the same instance.
 *
 * The DSL is structural and semantic, not visual. A block says "heading,
 * level 1, centered" — not "Heebo 36px, color #2A1B0F". Visual
 * resolution happens at render time, by combining (designSystem,
 * palette, typography) with each block's role.
 */

// ---------------------------------------------------------------------------
// Block types
// ---------------------------------------------------------------------------

export type BlockHeading = {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
  align?: 'start' | 'center' | 'end';
};

export type BlockParagraph = {
  type: 'paragraph';
  text: string;
  dropCap?: boolean;
  lead?: boolean; // larger, lighter — used for first paragraph after a chapter opener
  align?: 'start' | 'justify' | 'center';
  /** Optional bold lead phrase that runs into the start of the paragraph
   *  (a "run-in head"). Classic editorial device — the first few words set
   *  in the heading face, the rest flows as body. */
  runInHead?: string;
};

export type ImagePlacement =
  | 'inline' // flows with text, sized by widthFraction
  | 'full-bleed' // entire page (no text on this page)
  | 'full-bleed-top' // top half of page; text fills bottom half
  | 'full-bleed-bottom'
  | 'side-left'
  | 'side-right'
  | 'framed-center'; // centered, framed/captioned, ~60% page width

/** Visual treatment applied to an image. The system module decides the
 *  exact look (e.g. how a polaroid frame is drawn); the plan just names it. */
export type ImageTreatment =
  | 'plain' // no frame, square corners
  | 'framed' // thin keyline frame in the accent/hairline color
  | 'polaroid' // white border, slight rotation, soft shadow
  | 'rounded' // rounded corners
  | 'duotone' // recolored into the palette (accent ↔ background)
  | 'vignette' // soft darkened edges
  | 'postcard'; // framed + caption set as a handwritten-style note

export type BlockImage = {
  type: 'image';
  imageId: string; // refers to a page_image's _id on the book row
  placement: ImagePlacement;
  widthFraction?: number; // 0..1, only meaningful for inline/framed/side
  caption?: string;
  /** Visual treatment. Defaults to system's preferred treatment if omitted. */
  treatment?: ImageTreatment;
};

/** A full-page (or half-page) image with text composited ON TOP, behind a
 *  controlled scrim so text stays legible. This is how we get dramatic
 *  chapter openers and feature spreads WITHOUT text accidentally landing
 *  on a busy image — the scrim guarantees contrast. */
export type BlockLayered = {
  type: 'layered';
  imageId: string;
  /** Contrast layer between image and text. */
  scrim: 'dark' | 'light' | 'gradient-bottom' | 'gradient-top' | 'none';
  /** Where the text block sits within the image. */
  align: 'center' | 'bottom' | 'top';
  /** The text composited over the image. Limited to a few short blocks. */
  overlay: Array<
    | { type: 'heading'; level: 1 | 2 | 3; text: string }
    | { type: 'paragraph'; text: string }
  >;
  /** Fraction of page height the layered area occupies (0.5..1). */
  heightFraction?: number;
};

/** A short note set in the outer margin, aligned to nearby body text.
 *  Editorial/academic device — annotations, dates, asides. */
export type BlockMarginNote = {
  type: 'margin-note';
  text: string;
};

/** A purely decorative accent bar/rule — structural punctuation in the
 *  accent color. Used to open sections or frame a heading. */
export type BlockAccentBar = {
  type: 'accent-bar';
  widthFraction?: number; // 0..1 of the text column, default 0.25
  thicknessPt?: number; // default 3
};

export type BlockPullQuote = {
  type: 'pull-quote';
  text: string;
  attribution?: string;
};

export type BlockDivider = {
  type: 'divider';
  style: 'rule' | 'ornament' | 'stars' | 'none';
};

export type BlockCallout = {
  type: 'callout';
  text: string;
  tone: 'note' | 'warning' | 'quote';
};

export type BlockSpacer = {
  type: 'spacer';
  sizeMm: number; // vertical whitespace, 1..40
};

export type BlockPageBreak = { type: 'page-break' };

export type BlockToc = { type: 'toc' };

export type BlockTitlePage = {
  type: 'title-page';
  title: string;
  subtitle?: string;
  author: string;
};

/** How a chapter's opening page is composed. The system module owns the
 *  actual visual; the planner picks the template that fits the chapter
 *  (e.g. image-overlay only when the chapter has a strong lead image). */
export type ChapterOpenerTemplate =
  | 'numeral-ornament' // large chapter numeral + ornament + centered title
  | 'image-overlay' // full-bleed lead image with title composited over it
  | 'vertical-title' // title set vertically along the outer edge, big numeral
  | 'rule-stack'; // stacked hairline rules, accent numeral, left-set title

export type BlockChapterOpener = {
  type: 'chapter-opener';
  chapterIndex: number; // 0-based index into book.chapters
  epigraph?: string;
  /** Which opener composition to use. Defaults to 'numeral-ornament'. */
  template?: ChapterOpenerTemplate;
  /** Lead image for the 'image-overlay' template. Must be a real imageId. */
  imageId?: string;
};

export type Block =
  | BlockHeading
  | BlockParagraph
  | BlockImage
  | BlockLayered
  | BlockMarginNote
  | BlockAccentBar
  | BlockPullQuote
  | BlockDivider
  | BlockCallout
  | BlockSpacer
  | BlockPageBreak
  | BlockToc
  | BlockTitlePage
  | BlockChapterOpener;

// ---------------------------------------------------------------------------
// Page + plan
// ---------------------------------------------------------------------------

export type PageKind =
  | 'title' // book title page
  | 'toc' // table of contents
  | 'chapter-opener' // first page of a chapter — sets the tone
  | 'body' // regular body text
  | 'image-feature' // image-dominant page
  | 'spread' // edge-to-edge dramatic page (usually a layered block)
  | 'pull-quote' // single quote, centered, lots of space
  | 'blank'; // intentional whitespace

export interface Page {
  kind: PageKind;
  /** 0-based index of the chapter this page belongs to (omit for title/toc). */
  chapterIndex?: number;
  blocks: Block[];
}

export interface Palette {
  /** Primary text color. */
  text: string;
  /** Page background. */
  background: string;
  /** Accent — used on rules, ornaments, chapter numbers, drop caps. */
  accent: string;
  /** Muted — captions, page numbers, secondary text. */
  muted: string;
}

export interface Typography {
  /** Font family for body text (must be a Hebrew-supporting webfont). */
  bodyFamily: string;
  /** Font family for headings. */
  headingFamily: string;
  /** Font family for display elements (chapter numbers, drop caps). */
  displayFamily?: string;
  /** Body text size in pt. */
  baseSize: number;
  /** Line height as a unitless multiplier of baseSize. */
  leading: number;
  /** Type scale in pt: [body, small, h3, h2, h1]. */
  scale: [number, number, number, number, number];
}

export interface Grid {
  columns: 1 | 2;
  /** All margins in mm. Hebrew RTL: `start` = right, `end` = left. */
  marginsMm: { top: number; bottom: number; start: number; end: number };
  gutterMm: number; // only used when columns > 1
}

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

export interface DesignPlan {
  /** Schema version. Bumped on breaking changes. */
  version: 1;
  /** PRNG seed used by renderers for variation (e.g. ornament rotation). */
  seed: number;
  /** Which of the 10 systems the planner chose. Renderers may use this to
   *  select ornament glyphs, drop-cap style, etc. */
  designSystem: DesignSystemId;
  /** The chosen variant id within the system (e.g. memoir-warm's "autumn"
   *  vs "dusk"). Drives palette + ornament-set selection. The planner picks
   *  it; renderers look up the system module for the visual implementation. */
  variant?: string;
  /** Modular-scale ratio name the type scale was built from. Analytics +
   *  lets renderers derive intermediate sizes coherently. */
  scaleRatio?: string;
  /** Short human-readable tone tag. Free-form, used for analytics only. */
  tone: string;
  palette: Palette;
  typography: Typography;
  grid: Grid;
  /** Ordered pages. The renderers do not paginate — the planner already
   *  decided what goes on each page. */
  pages: Page[];
}

// ---------------------------------------------------------------------------
// JSON schema (consumed by Claude via tool-use forced output)
// ---------------------------------------------------------------------------

/**
 * Returned to the Anthropic SDK as the `input_schema` of a tool. When the
 * tool is forced (tool_choice = "submit_design_plan"), Claude must produce
 * input matching this schema, giving us a JSON-validated DesignPlan.
 *
 * Kept in sync MANUALLY with the TS types above — if you add a block type
 * or palette field, update both. (The render-time validator in
 * validateDesignPlan checks structural invariants; this JSON schema only
 * checks shape.)
 */
export const designPlanJsonSchema = {
  type: 'object',
  required: ['version', 'seed', 'designSystem', 'tone', 'palette', 'typography', 'grid', 'pages'],
  additionalProperties: false,
  properties: {
    version: { type: 'integer', enum: [1] },
    seed: { type: 'integer', minimum: 0, maximum: 2147483647 },
    variant: { type: 'string', maxLength: 40 },
    scaleRatio: { type: 'string', maxLength: 40 },
    designSystem: {
      type: 'string',
      enum: [
        'editorial-modern',
        'storybook-illustrated',
        'playful-zine',
        'romantic-vintage',
        'minimalist-nordic',
        'academic-formal',
        'bold-magazine',
        'fairytale-classic',
        'memoir-warm',
        'poetry-quiet',
      ],
    },
    tone: { type: 'string', maxLength: 60 },
    palette: {
      type: 'object',
      required: ['text', 'background', 'accent', 'muted'],
      additionalProperties: false,
      properties: {
        text: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        background: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        accent: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        muted: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
      },
    },
    typography: {
      type: 'object',
      required: ['bodyFamily', 'headingFamily', 'baseSize', 'leading', 'scale'],
      additionalProperties: false,
      properties: {
        bodyFamily: { type: 'string', maxLength: 60 },
        headingFamily: { type: 'string', maxLength: 60 },
        displayFamily: { type: 'string', maxLength: 60 },
        baseSize: { type: 'number', minimum: 8, maximum: 16 },
        leading: { type: 'number', minimum: 1.1, maximum: 2.0 },
        scale: {
          type: 'array',
          minItems: 5,
          maxItems: 5,
          items: { type: 'number', minimum: 6, maximum: 96 },
        },
      },
    },
    grid: {
      type: 'object',
      required: ['columns', 'marginsMm', 'gutterMm'],
      additionalProperties: false,
      properties: {
        columns: { type: 'integer', enum: [1, 2] },
        gutterMm: { type: 'number', minimum: 0, maximum: 20 },
        marginsMm: {
          type: 'object',
          required: ['top', 'bottom', 'start', 'end'],
          additionalProperties: false,
          properties: {
            top: { type: 'number', minimum: 8, maximum: 40 },
            bottom: { type: 'number', minimum: 8, maximum: 40 },
            start: { type: 'number', minimum: 8, maximum: 40 },
            end: { type: 'number', minimum: 8, maximum: 40 },
          },
        },
      },
    },
    pages: {
      type: 'array',
      minItems: 1,
      maxItems: 400,
      items: {
        type: 'object',
        required: ['kind', 'blocks'],
        additionalProperties: false,
        properties: {
          kind: {
            type: 'string',
            enum: ['title', 'toc', 'chapter-opener', 'body', 'image-feature', 'pull-quote', 'blank'],
          },
          chapterIndex: { type: 'integer', minimum: 0 },
          blocks: {
            type: 'array',
            maxItems: 30,
            items: {
              // We accept any of the 11 block shapes — schema-level
              // discrimination is by the `type` field which each shape
              // requires. Claude returns one of these; the runtime
              // validator narrows further.
              type: 'object',
              required: ['type'],
              properties: { type: { type: 'string' } },
            },
          },
        },
      },
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Runtime validator
// ---------------------------------------------------------------------------

export interface ValidationIssue {
  severity: 'block' | 'warn';
  page?: number;
  message: string;
}

/**
 * Structural + semantic validation that the JSON schema alone can't enforce.
 * Returns issues; an empty array means valid. Callers (Critic, route
 * handler) decide what to do with each severity.
 *
 *   - "block" issues mean the plan cannot be rendered safely.
 *   - "warn" issues are aesthetics-only — render but flag.
 *
 * Constraints checked:
 *   - every chapter has exactly one chapter-opener page
 *   - imageId refers to a real image on the book
 *   - paragraph length ≤ 2000 chars
 *   - no full-bleed image on a page with > 300 chars of paragraph text
 */
export function validateDesignPlan(
  plan: DesignPlan,
  context: { chapterCount: number; availableImageIds: Set<string> }
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Every chapter must have exactly one opener.
  const openersByChapter = new Map<number, number>();
  plan.pages.forEach((page, i) => {
    page.blocks.forEach((block) => {
      if (block.type === 'chapter-opener') {
        openersByChapter.set(
          block.chapterIndex,
          (openersByChapter.get(block.chapterIndex) ?? 0) + 1
        );
      }
    });
    // Image references must exist on the book — across every block type
    // that can carry an imageId (image, layered, image-overlay opener).
    page.blocks.forEach((block) => {
      const refs: string[] = [];
      if (block.type === 'image') refs.push(block.imageId);
      if (block.type === 'layered') refs.push(block.imageId);
      if (block.type === 'chapter-opener' && block.imageId) refs.push(block.imageId);
      for (const ref of refs) {
        if (!context.availableImageIds.has(ref)) {
          issues.push({
            severity: 'block',
            page: i,
            message: `block "${block.type}" references missing imageId "${ref}"`,
          });
        }
      }
      // An image-overlay opener with no image can't render its template.
      if (block.type === 'chapter-opener' && block.template === 'image-overlay' && !block.imageId) {
        issues.push({
          severity: 'block',
          page: i,
          message: `chapter-opener uses 'image-overlay' template but has no imageId`,
        });
      }
    });
    // Paragraph length cap.
    page.blocks.forEach((block) => {
      if (block.type === 'paragraph' && block.text.length > 2000) {
        issues.push({
          severity: 'block',
          page: i,
          message: `paragraph exceeds 2000 chars (${block.text.length})`,
        });
      }
    });
    // Full-bleed overflow check.
    const fullBleed = page.blocks.find(
      (b) => b.type === 'image' && b.placement === 'full-bleed'
    );
    if (fullBleed) {
      const textChars = page.blocks
        .filter((b): b is BlockParagraph => b.type === 'paragraph')
        .reduce((sum, b) => sum + b.text.length, 0);
      if (textChars > 300) {
        issues.push({
          severity: 'block',
          page: i,
          message: `full-bleed image cannot share a page with ${textChars} chars of body text`,
        });
      }
    }
  });

  for (let ci = 0; ci < context.chapterCount; ci++) {
    const count = openersByChapter.get(ci) ?? 0;
    if (count === 0) {
      issues.push({ severity: 'block', message: `chapter ${ci} has no chapter-opener page` });
    } else if (count > 1) {
      issues.push({
        severity: 'warn',
        message: `chapter ${ci} has ${count} chapter-opener pages (expected 1)`,
      });
    }
  }

  return issues;
}
