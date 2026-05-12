/**
 * DOCX renderer — turns a DesignPlan into a .docx Buffer suitable for
 * download. Uses the `docx` package (already a dependency). The output
 * mirrors what the HTML/PDF renderer produces, within the limits of
 * what Word can represent (no SVG ornaments, no float-around-text
 * images, no absolute positioning).
 *
 * For things Word can't do well, we degrade gracefully:
 *   - SVG dividers → typographic ornament (◆ ◆ ◆ etc.)
 *   - full-bleed image → image scaled to page width + caption below
 *   - side-anchored image → centered image (no real text wrap support)
 *   - drop cap → first letter wrapped in a TextRun with size *3
 *
 * Hebrew RTL is set via `bidirectional: true` on every paragraph and
 * docProperties.lang = 'he-IL'.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  PageBreak,
  ImageRun,
  HeadingLevel,
  Footer,
  PageNumber,
  LevelFormat,
} from 'docx';
import axios from 'axios';
import { IBook, IPageImage } from '../../models/Book';
import { DesignPlan, Block, Page } from './designPlanSchema';

const HEBREW_RTL = { bidirectional: true } as const;

const PT = (n: number) => Math.round(n * 2); // docx fontSize uses half-points

export interface RenderDocxOptions {
  /** If true, omit images entirely (faster export). */
  skipImages?: boolean;
}

/**
 * Render the whole plan to a Buffer. Fetches each referenced image once
 * (parallel). On image fetch failure, the image is skipped silently
 * rather than failing the entire export.
 */
export async function renderDesignedBookDocx(
  book: IBook,
  plan: DesignPlan,
  options: RenderDocxOptions = {}
): Promise<Buffer> {
  // Pre-fetch all referenced images. We do this up front so each image
  // is downloaded once even if the plan references it multiple times,
  // and so the rest of the renderer can be synchronous.
  const imageBuffers = options.skipImages
    ? new Map<string, Buffer>()
    : await prefetchImages(book, plan);

  const children: Paragraph[] = [];

  plan.pages.forEach((page, pageIdx) => {
    const isLastPage = pageIdx === plan.pages.length - 1;
    page.blocks.forEach((block, blockIdx) => {
      const isLastBlock = blockIdx === page.blocks.length - 1;
      const paragraphs = renderBlock(block, plan, book, imageBuffers);
      children.push(...paragraphs);
      // Page break between pages (but not after the very last page).
      if (isLastBlock && !isLastPage) {
        children.push(
          new Paragraph({
            ...HEBREW_RTL,
            children: [new PageBreak()],
          })
        );
      }
    });
  });

  const doc = new Document({
    creator: 'MeStory',
    title: book.title,
    description: 'Auto-designed by MeStory',
    styles: {
      default: {
        document: {
          run: {
            font: plan.typography.bodyFamily,
            size: PT(plan.typography.baseSize),
            color: stripHash(plan.palette.text),
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 8400, height: 11900 }, // A5 in twentieths-of-a-point (148×210mm)
            margin: {
              top: mmToTwip(plan.grid.marginsMm.top),
              bottom: mmToTwip(plan.grid.marginsMm.bottom),
              // RTL: start = right margin in Word terms
              right: mmToTwip(plan.grid.marginsMm.start),
              left: mmToTwip(plan.grid.marginsMm.end),
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                ...HEBREW_RTL,
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    color: stripHash(plan.palette.muted),
                    size: PT(plan.typography.scale[1]),
                    font: plan.typography.bodyFamily,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

// ---------------------------------------------------------------------------
// Block → Paragraph[] translation
// ---------------------------------------------------------------------------

function renderBlock(
  block: Block,
  plan: DesignPlan,
  book: IBook,
  images: Map<string, Buffer>
): Paragraph[] {
  switch (block.type) {
    case 'heading':
      return [renderHeading(block, plan)];
    case 'paragraph':
      return [renderParagraph(block, plan)];
    case 'image':
      return renderImage(block, plan, images);
    case 'pull-quote':
      return renderPullQuote(block, plan);
    case 'divider':
      return [renderDivider(block, plan)];
    case 'callout':
      return [renderCallout(block, plan)];
    case 'spacer':
      return [renderSpacer(block)];
    case 'page-break':
      return [new Paragraph({ ...HEBREW_RTL, children: [new PageBreak()] })];
    case 'title-page':
      return renderTitlePage(block, plan);
    case 'chapter-opener':
      return renderChapterOpener(block, plan, book);
    case 'toc':
      return renderToc(book, plan);
    default:
      return [];
  }
}

function renderHeading(block: Extract<Block, { type: 'heading' }>, plan: DesignPlan): Paragraph {
  const sizeIdx = block.level === 1 ? 4 : block.level === 2 ? 3 : 2;
  return new Paragraph({
    ...HEBREW_RTL,
    heading: block.level === 1 ? HeadingLevel.HEADING_1 : block.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
    alignment:
      block.align === 'center' ? AlignmentType.CENTER : block.align === 'end' ? AlignmentType.LEFT : AlignmentType.RIGHT,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text: block.text,
        bold: true,
        size: PT(plan.typography.scale[sizeIdx]),
        font: plan.typography.headingFamily,
        color: stripHash(plan.palette.text),
      }),
    ],
  });
}

function renderParagraph(
  block: Extract<Block, { type: 'paragraph' }>,
  plan: DesignPlan
): Paragraph {
  const align =
    block.align === 'center' ? AlignmentType.CENTER : block.align === 'justify' ? AlignmentType.JUSTIFIED : AlignmentType.RIGHT;
  const fontSize = block.lead ? plan.typography.scale[2] : plan.typography.baseSize;

  const runs: TextRun[] = [];
  if (block.dropCap && block.text.length > 0) {
    runs.push(
      new TextRun({
        text: block.text.charAt(0),
        font: plan.typography.displayFamily || plan.typography.headingFamily,
        color: stripHash(plan.palette.accent),
        size: PT(fontSize * 2.5),
        bold: true,
      })
    );
    runs.push(
      new TextRun({
        text: block.text.slice(1),
        font: plan.typography.bodyFamily,
        size: PT(fontSize),
      })
    );
  } else {
    runs.push(
      new TextRun({
        text: block.text,
        font: plan.typography.bodyFamily,
        size: PT(fontSize),
      })
    );
  }

  return new Paragraph({
    ...HEBREW_RTL,
    alignment: align,
    spacing: { line: Math.round(plan.typography.leading * 240), after: 120 },
    indent: block.dropCap ? undefined : { firstLine: 360 },
    children: runs,
  });
}

function renderImage(
  block: Extract<Block, { type: 'image' }>,
  plan: DesignPlan,
  images: Map<string, Buffer>
): Paragraph[] {
  const buffer = images.get(block.imageId);
  if (!buffer) return []; // Image missing or fetch failed — silently skip.

  // Word doesn't do real full-bleed; we use the page-width minus margins
  // for "full-bleed" and ~60% for framed/inline.
  const isWide = block.placement === 'full-bleed' || block.placement === 'full-bleed-top' || block.placement === 'full-bleed-bottom';
  const widthFraction = isWide ? 1.0 : block.widthFraction ?? 0.6;

  // Available page width in mm = 148 - margins.start - margins.end
  const availableMm = 148 - plan.grid.marginsMm.start - plan.grid.marginsMm.end;
  const imgWidthMm = Math.round(availableMm * widthFraction);
  // Heuristic height — assume 3:2 if we don't know the actual aspect.
  const imgHeightMm = Math.round(imgWidthMm * 0.7);

  const paragraphs: Paragraph[] = [
    new Paragraph({
      ...HEBREW_RTL,
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      children: [
        new ImageRun({
          data: buffer,
          transformation: { width: mmToPx(imgWidthMm), height: mmToPx(imgHeightMm) },
        } as any),
      ],
    }),
  ];

  if (block.caption) {
    paragraphs.push(
      new Paragraph({
        ...HEBREW_RTL,
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: block.caption,
            italics: true,
            size: PT(plan.typography.scale[1]),
            font: plan.typography.bodyFamily,
            color: stripHash(plan.palette.muted),
          }),
        ],
      })
    );
  }

  return paragraphs;
}

function renderPullQuote(
  block: Extract<Block, { type: 'pull-quote' }>,
  plan: DesignPlan
): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      ...HEBREW_RTL,
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: block.attribution ? 60 : 240 },
      indent: { left: 720, right: 720 },
      children: [
        new TextRun({
          text: `« ${block.text} »`,
          italics: true,
          size: PT(plan.typography.scale[2]),
          font: plan.typography.headingFamily,
          color: stripHash(plan.palette.accent),
        }),
      ],
    }),
  ];
  if (block.attribution) {
    paragraphs.push(
      new Paragraph({
        ...HEBREW_RTL,
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: `— ${block.attribution}`,
            size: PT(plan.typography.scale[1]),
            font: plan.typography.bodyFamily,
            color: stripHash(plan.palette.muted),
          }),
        ],
      })
    );
  }
  return paragraphs;
}

function renderDivider(block: Extract<Block, { type: 'divider' }>, plan: DesignPlan): Paragraph {
  if (block.style === 'none') {
    return new Paragraph({ ...HEBREW_RTL, spacing: { before: 120, after: 120 }, children: [] });
  }
  const glyph = block.style === 'stars' ? '✦  ✦  ✦' : block.style === 'ornament' ? '◆  ◆  ◆' : '— — —';
  return new Paragraph({
    ...HEBREW_RTL,
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 240 },
    children: [
      new TextRun({
        text: glyph,
        size: PT(plan.typography.scale[1]),
        color: stripHash(plan.palette.accent),
        font: plan.typography.displayFamily || plan.typography.headingFamily,
      }),
    ],
  });
}

function renderCallout(block: Extract<Block, { type: 'callout' }>, plan: DesignPlan): Paragraph {
  return new Paragraph({
    ...HEBREW_RTL,
    alignment: AlignmentType.RIGHT,
    indent: { left: 720 },
    spacing: { before: 180, after: 180 },
    children: [
      new TextRun({
        text: block.text,
        italics: block.tone === 'quote',
        size: PT(plan.typography.baseSize),
        font: plan.typography.bodyFamily,
        color: stripHash(plan.palette.text),
      }),
    ],
  });
}

function renderSpacer(block: Extract<Block, { type: 'spacer' }>): Paragraph {
  // 1mm ≈ 56.7 twips, used to set `spacing.after`.
  return new Paragraph({
    ...HEBREW_RTL,
    spacing: { after: Math.round(block.sizeMm * 56.7) },
    children: [],
  });
}

function renderTitlePage(
  block: Extract<Block, { type: 'title-page' }>,
  plan: DesignPlan
): Paragraph[] {
  return [
    new Paragraph({
      ...HEBREW_RTL,
      alignment: AlignmentType.CENTER,
      spacing: { before: 3000, after: 240 },
      children: [
        new TextRun({
          text: block.title,
          bold: true,
          size: PT(plan.typography.scale[4] * 1.4),
          font: plan.typography.displayFamily || plan.typography.headingFamily,
          color: stripHash(plan.palette.text),
        }),
      ],
    }),
    ...(block.subtitle
      ? [
          new Paragraph({
            ...HEBREW_RTL,
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
            children: [
              new TextRun({
                text: block.subtitle,
                size: PT(plan.typography.scale[2]),
                font: plan.typography.headingFamily,
                color: stripHash(plan.palette.muted),
              }),
            ],
          }),
        ]
      : []),
    new Paragraph({
      ...HEBREW_RTL,
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200 },
      children: [
        new TextRun({
          text: block.author,
          size: PT(plan.typography.scale[2]),
          font: plan.typography.bodyFamily,
          color: stripHash(plan.palette.text),
        }),
      ],
    }),
  ];
}

function renderChapterOpener(
  block: Extract<Block, { type: 'chapter-opener' }>,
  plan: DesignPlan,
  book: IBook
): Paragraph[] {
  const chapter = book.chapters?.[block.chapterIndex];
  const title = chapter?.title || `פרק ${block.chapterIndex + 1}`;
  const result: Paragraph[] = [
    new Paragraph({
      ...HEBREW_RTL,
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 120 },
      children: [
        new TextRun({
          text: `פרק ${block.chapterIndex + 1}`,
          size: PT(plan.typography.scale[2]),
          color: stripHash(plan.palette.accent),
          font: plan.typography.displayFamily || plan.typography.headingFamily,
          characterSpacing: 50,
        }),
      ],
    }),
    new Paragraph({
      ...HEBREW_RTL,
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 360 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: PT(plan.typography.scale[4]),
          font: plan.typography.headingFamily,
          color: stripHash(plan.palette.text),
        }),
      ],
    }),
  ];
  if (block.epigraph) {
    result.push(
      new Paragraph({
        ...HEBREW_RTL,
        alignment: AlignmentType.CENTER,
        indent: { left: 720, right: 720 },
        spacing: { after: 360 },
        children: [
          new TextRun({
            text: block.epigraph,
            italics: true,
            size: PT(plan.typography.scale[1]),
            font: plan.typography.bodyFamily,
            color: stripHash(plan.palette.muted),
          }),
        ],
      })
    );
  }
  return result;
}

function renderToc(book: IBook, plan: DesignPlan): Paragraph[] {
  const chapters = book.chapters || [];
  return [
    new Paragraph({
      ...HEBREW_RTL,
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 360 },
      children: [
        new TextRun({
          text: 'תוכן עניינים',
          bold: true,
          size: PT(plan.typography.scale[3]),
          font: plan.typography.headingFamily,
          color: stripHash(plan.palette.text),
        }),
      ],
    }),
    ...chapters.map(
      (ch, i) =>
        new Paragraph({
          ...HEBREW_RTL,
          alignment: AlignmentType.RIGHT,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: `${ch.title}`,
              size: PT(plan.typography.baseSize),
              font: plan.typography.bodyFamily,
              color: stripHash(plan.palette.text),
            }),
            new TextRun({
              text: `\t${i + 1}`,
              size: PT(plan.typography.baseSize),
              font: plan.typography.bodyFamily,
              color: stripHash(plan.palette.muted),
            }),
          ],
        })
    ),
  ];
}

// ---------------------------------------------------------------------------
// Image prefetch
// ---------------------------------------------------------------------------

async function prefetchImages(book: IBook, plan: DesignPlan): Promise<Map<string, Buffer>> {
  const out = new Map<string, Buffer>();
  const usedIds = new Set<string>();
  plan.pages.forEach((p: Page) => {
    p.blocks.forEach((b) => {
      if (b.type === 'image') usedIds.add(b.imageId);
    });
  });
  if (usedIds.size === 0) return out;

  const urlById = new Map<string, string>();
  (book.pageImages || []).forEach((img: IPageImage) => {
    if (img._id && img.url) urlById.set(img._id, img.url);
  });

  await Promise.all(
    Array.from(usedIds).map(async (id) => {
      const url = urlById.get(id);
      if (!url) return;
      try {
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20_000 });
        out.set(id, Buffer.from(res.data));
      } catch (err: any) {
        console.warn(`[autoDesign/docx] image fetch failed for ${id}: ${err?.message}`);
      }
    })
  );
  return out;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripHash(hex: string): string {
  return hex.startsWith('#') ? hex.slice(1) : hex;
}

function mmToTwip(mm: number): number {
  // 1mm = 56.6929 twips (1 twip = 1/1440 inch, 1mm = 0.03937 inch)
  return Math.round(mm * 56.6929);
}

function mmToPx(mm: number): number {
  // docx ImageRun.transformation uses pixels at 96 DPI (1mm ≈ 3.7795 px).
  return Math.round(mm * 3.7795);
}
