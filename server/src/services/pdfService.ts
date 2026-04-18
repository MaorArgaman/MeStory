import PDFDocument from 'pdfkit';
import { Book } from '../models/Book';
import { User } from '../models/User';
import type { Browser, LaunchOptions } from 'puppeteer-core';

// ─── Page size definitions (in mm) ─────────────────────────────────────────────
const PAGE_SIZES_MM: Record<string, { width: number; height: number }> = {
  A4:     { width: 210, height: 297 },
  A5:     { width: 148, height: 210 },
  B5:     { width: 176, height: 250 },
  Letter: { width: 216, height: 279 },
  '6x9':  { width: 152, height: 229 },
  '5x8':  { width: 127, height: 203 },
  Square: { width: 210, height: 210 },
  Pocket: { width: 127, height: 178 },
};

// ─── Puppeteer browser launcher (mirrors puppeteerExportService) ────────────────
async function launchBrowser(): Promise<Browser> {
  const puppeteer = (await import('puppeteer-core')).default;
  const isServerless =
    process.env.VERCEL === '1' ||
    process.env.VERCEL === 'true' ||
    process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

  if (isServerless) {
    const chromium = (await import('@sparticuz/chromium')).default as any;
    const opts: LaunchOptions = {
      args: [...chromium.args, '--font-render-hinting=none'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    };
    return puppeteer.launch(opts);
  }

  const fs = await import('fs');
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean) as string[];

  const executablePath = candidates.find((p) => {
    try { return fs.existsSync(p); } catch { return false; }
  });

  if (!executablePath) {
    throw new Error(
      'No Chrome executable found. Install Google Chrome or set PUPPETEER_EXECUTABLE_PATH.',
    );
  }

  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });
}

// ─── Helper: convert hex to rgba ───────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const c = (hex || '#8b6914').replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) || 139;
  const g = parseInt(c.slice(2, 4), 16) || 105;
  const b = parseInt(c.slice(4, 6), 16) || 20;
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Helper: background-pattern CSS ────────────────────────────────────────────
function buildPatternCSS(pattern: string, accentColor: string): string {
  if (!pattern || pattern === 'none') return '';
  const c = (a: number) => hexToRgba(accentColor, a);
  const enc = encodeURIComponent;
  switch (pattern) {
    case 'dots':
      return `background-image: radial-gradient(circle, ${c(0.12)} 1px, transparent 1px); background-size: 20px 20px;`;
    case 'stripes':
      return `background-image: repeating-linear-gradient(0deg, transparent, transparent 27px, ${c(0.06)} 27px, ${c(0.06)} 28px);`;
    case 'grid':
      return `background-image: linear-gradient(${c(0.05)} 1px, transparent 1px), linear-gradient(90deg, ${c(0.05)} 1px, transparent 1px); background-size: 24px 24px;`;
    case 'waves': {
      const svg = enc(`<svg xmlns='http://www.w3.org/2000/svg' width='100' height='20'><path d='M0,10 Q25,2 50,10 Q75,18 100,10' fill='none' stroke='${c(0.07)}' stroke-width='1.5'/></svg>`);
      return `background-image: url("data:image/svg+xml,${svg}"); background-size: 100px 20px;`;
    }
    case 'geometric': {
      const svg = enc(`<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect x='0' y='0' width='40' height='40' fill='none' stroke='${c(0.05)}' stroke-width='1'/></svg>`);
      return `background-image: url("data:image/svg+xml,${svg}"); background-size: 40px 40px;`;
    }
    default: return '';
  }
}

// ─── Helper: page-frame CSS ─────────────────────────────────────────────────────
function buildFrameCSS(frame: string, color: string): string {
  const c = color || '#8b6914';
  switch (frame) {
    case 'simple':   return `box-shadow: inset 0 0 0 1px ${c};`;
    case 'double':   return `box-shadow: inset 0 0 0 1px ${c}, inset 0 0 0 3px ${c}80;`;
    case 'ornate':   return `box-shadow: inset 0 0 0 1.5px ${c}, inset 0 0 0 3.5px ${c}40, inset 0 0 0 5px ${c}20;`;
    case 'dashed':   return `outline: 2px dashed ${c}; outline-offset: -6px;`;
    case 'dotted':   return `outline: 2px dotted ${c}; outline-offset: -6px;`;
    case 'rounded':  return `box-shadow: inset 0 0 0 1.5px ${c}; border-radius: 8px; overflow: hidden;`;
    case 'gradient': return `box-shadow: inset 0 0 0 2px ${c};`;
    default:         return '';
  }
}

// ─── Helper: drop-cap CSS ───────────────────────────────────────────────────────
function buildDropCapCSS(style: string, accentColor: string, isRtl: boolean): string {
  if (!style || style === 'none') return '';
  const floatDir = isRtl ? 'right' : 'left';
  const marginSide = isRtl ? 'margin-left' : 'margin-right';
  const acc = accentColor || '#8b6914';
  if (style === 'classic' || style === 'modern') {
    return `.drop-cap .page-body p:first-of-type::first-letter { float: ${floatDir}; font-size: 4.2em; line-height: 0.85; font-weight: bold; ${marginSide}: 8px; margin-bottom: 0; color: ${acc}; }`;
  }
  if (style === 'decorative') {
    return `.drop-cap .page-body p:first-of-type::first-letter { float: ${floatDir}; font-size: 4.5em; line-height: 0.8; font-weight: bold; ${marginSide}: 10px; padding: 4px 8px; border: 2px solid ${acc}; color: ${acc}; background: #faf6ef; }`;
  }
  if (style === 'box') {
    return `.drop-cap .page-body p:first-of-type::first-letter { float: ${floatDir}; font-size: 3.8em; line-height: 0.85; font-weight: bold; ${marginSide}: 10px; padding: 6px 10px; background: ${acc}; color: white; }`;
  }
  return '';
}

// ─── Helper: build a complete design-aware HTML document ───────────────────────
function buildBookHtml(book: any, authorName: string): string {
  const pl = book.pageLayout || {};
  const pages: any[] = pl.pages || [];
  const s: Record<string, any> = pl.settings || {};

  const isRtl = (book.language || '').startsWith('he') || /[\u0590-\u05FF]/.test(book.title || '');

  const pageSizeKey = s.pageSize || 'A5';
  const pageDims =
    pageSizeKey === 'Custom' && s.customPageSize
      ? s.customPageSize
      : PAGE_SIZES_MM[pageSizeKey] || PAGE_SIZES_MM.A5;

  const acc         = s.accentColor    || '#8b6914';
  const frameColor  = s.frameColor     || acc;
  const textColor   = s.textColor      || '#1a1a1a';
  const bgColor     = s.backgroundColor || '#ffffff';
  const fs          = Number(s.fontSize)         || 14;
  const lh          = Number(s.lineHeight)        || 1.7;
  const pSpacing    = Number(s.paragraphSpacing)  || 12;
  const colCount    = Number(s.columns)           || 1;
  const m           = s.margins || { top: 50, bottom: 50, left: 45, right: 45 };

  const bodyFontRaw  = (s.fontFamily || 'David Libre').replace(/['"]/g, '').split(',')[0].trim();
  const titleFontRaw = (s.titleFont  || bodyFontRaw).replace(/['"]/g, '').split(',')[0].trim();
  const fontStack      = `"${bodyFontRaw}", "David Libre", "Frank Ruhl Libre", Georgia, serif`;
  const titleFontStack = `"${titleFontRaw}", "Playfair Display", serif`;

  const patternCSS   = buildPatternCSS(s.backgroundPattern, acc);
  const frameCSS     = buildFrameCSS(s.pageFrame, frameColor);
  const dropCapCSS   = buildDropCapCSS(s.dropCapStyle, acc, isRtl);

  // Cover design
  const cover        = book.coverDesign || {};
  const coverBg      = cover.coverColor || cover.front?.colorPalette?.[0] || '#1a1a2e';
  const coverImg     = cover.imageUrl   || cover.front?.imageUrl || '';
  const coverTitleC  = cover.textColor  || cover.front?.title?.color || '#ffffff';

  // Helper: render a single page block
  const renderPage = (page: any, idx: number): string => {
    const isChapter = page.type === 'chapter';
    const isBlank   = page.type === 'blank';
    const isSpecial = page.type === 'title' || page.type === 'toc' || page.type === 'cover';
    const showHeader = !isSpecial && !isBlank && s.headerDecoration && s.headerDecoration !== 'none';
    const showNum    = s.showPageNumbers !== false && !isBlank;
    const dropClass  = isChapter && s.dropCapStyle && s.dropCapStyle !== 'none' ? 'drop-cap' : '';

    const headerHtml = showHeader
      ? `<div class="page-header">${s.headerDecoration === 'ornament' ? `✦ ${book.title} ✦` : book.title}</div>`
      : '';

    const dividerHtml =
      isChapter && s.dividerStyle && s.dividerStyle !== 'none'
        ? `<div class="section-divider">${s.dividerStyle === 'dots' ? '• • • • •' : s.sectionDivider || '⸻ ✦ ⸻'}</div>`
        : '';

    const numHtml = showNum ? `<div class="page-number">— ${idx + 1} —</div>` : '';

    return `<div class="print-page ${dropClass}">${headerHtml}<div class="page-body">${page.content || ''}</div>${dividerHtml}${numHtml}</div>`;
  };

  const pagesHtml = pages.map((p, i) => renderPage(p, i)).join('\n');

  const coverHtml = `
    <div class="cover-page" style="background:${coverBg}">
      ${coverImg ? `<img class="cover-img" src="${coverImg}" crossorigin="anonymous" alt="" />` : ''}
      <div class="cover-overlay"></div>
      <div class="cover-text">
        <h1 class="cover-title" style="color:${coverTitleC}">${book.title}</h1>
        ${authorName ? `<div class="cover-author" style="color:${coverTitleC}">${isRtl ? `מאת ${authorName}` : `by ${authorName}`}</div>` : ''}
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html dir="${isRtl ? 'rtl' : 'ltr'}" lang="${book.language || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@300;400;500;700;900&family=David+Libre:wght@400;700&family=Heebo:wght@300;400;500;700&family=Assistant:wght@300;400;600;700&family=Playfair+Display:wght@400;600;700;900&family=Cormorant+Garamond:wght@300;400;600;700&family=Lora:wght@400;600;700&family=Cinzel:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: ${pageDims.width}mm ${pageDims.height}mm;
      margin: 0;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      background: #e5e7eb;
      font-family: ${fontStack};
      color: ${textColor};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-page {
      width: ${pageDims.width}mm;
      height: ${pageDims.height}mm;
      background: ${bgColor};
      color: ${textColor};
      padding: ${m.top}px ${m.right}px ${m.bottom}px ${m.left}px;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
      direction: ${isRtl ? 'rtl' : 'ltr'};
      margin: 0 auto 8mm;
      --accent-color: ${acc};
      ${patternCSS}
      ${frameCSS}
    }
    .print-page:last-child { page-break-after: auto; }
    .page-header {
      position: absolute; top: 10px; left: 0; right: 0;
      text-align: center; font-size: 9px;
      color: ${acc}90; letter-spacing: 1px; text-transform: uppercase;
    }
    .page-number {
      position: absolute; bottom: 14px; left: 0; right: 0;
      text-align: center; font-size: 10px; color: ${textColor}60; letter-spacing: 1px;
    }
    .page-body {
      font-size: ${fs}px; line-height: ${lh};
      padding-top: 22px; padding-bottom: 30px;
      height: 100%; overflow: hidden;
      text-align: ${isRtl ? 'right' : 'justify'};
      ${colCount >= 2 ? `columns: ${colCount}; column-gap: 1.5em;` : ''}
    }
    .page-body h1, .page-body h2, .page-body h3 {
      font-family: ${titleFontStack};
      font-weight: 700; margin: 0 0 14px 0; text-align: center;
    }
    .page-body h1 { font-size: ${Math.round(fs * 1.6)}px; }
    .page-body h2 { font-size: ${Math.round(fs * 1.3)}px; }
    .page-body h3 { font-size: ${Math.round(fs * 1.1)}px; }
    .page-body p  { margin: 0 0 ${pSpacing}px 0; }
    ${dropCapCSS}
    .section-divider {
      position: absolute; bottom: 28px; left: 0; right: 0;
      text-align: center; color: ${acc}; font-size: 0.85em;
      letter-spacing: 0.5em; opacity: 0.7; direction: ltr;
    }
    .cover-page {
      width: ${pageDims.width}mm; height: ${pageDims.height}mm;
      position: relative; overflow: hidden;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      page-break-after: always; break-after: page;
      margin: 0 auto 8mm; color: #fff;
    }
    .cover-img {
      position: absolute; inset: 0;
      width: 100%; height: 100%; object-fit: cover; z-index: 0;
    }
    .cover-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%);
      z-index: 1;
    }
    .cover-text { position: relative; z-index: 2; text-align: center; padding: 0 24px; }
    .cover-title {
      font-family: ${titleFontStack};
      font-size: 34px; font-weight: 700; margin: 0 0 16px 0;
      text-shadow: 0 2px 8px rgba(0,0,0,0.6);
    }
    .cover-author { font-size: 16px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.9; }
    @media print {
      html, body { background: #fff; }
      .print-page, .cover-page { margin: 0; }
    }
  </style>
</head>
<body>
${coverHtml}
${pagesHtml}
</body>
</html>`;
}

// ─── Public: HTML-to-PDF via Puppeteer ─────────────────────────────────────────
export interface GenerateBookPdfFromHtmlOptions {
  bookId: string;
  onProgress?: (pct: number, message: string) => void | Promise<void>;
}

/**
 * Generate a PDF by building a self-contained HTML document with all design
 * settings applied (fonts, colours, drop caps, background patterns, page
 * frames, multi-column layouts, etc.) and rendering it with headless Chrome.
 *
 * This is the WYSIWYG approach: the output matches what the user sees in the
 * editor preview.
 */
export async function generateBookPdfFromHtml(
  opts: GenerateBookPdfFromHtmlOptions,
): Promise<Buffer> {
  const { bookId, onProgress } = opts;

  await onProgress?.(5, 'Loading book data...');
  const book = await Book.findById(bookId);
  if (!book) throw new Error('Book not found');

  const author = await User.findById(book.author);
  const authorName = author?.name || '';

  await onProgress?.(15, 'Building HTML...');
  const html = buildBookHtml(book, authorName);

  await onProgress?.(25, 'Launching browser...');
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    // Generous viewport — fonts and layout are driven by mm/@page, not pixels
    await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 2 });

    await onProgress?.(35, 'Loading fonts and rendering...');
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60_000 });

    // Extra wait for Google Fonts to fully load
    // Wait for Google Fonts to fully swap in (waitForTimeout removed in newer puppeteer-core)
    await new Promise<void>((r) => setTimeout(r, 1_500));

    await onProgress?.(75, 'Rendering PDF...');
    const pdfBytes = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await onProgress?.(95, 'Finalizing...');
    return Buffer.from(pdfBytes);
  } finally {
    await browser.close().catch(() => {});
  }
}

/**
 * Generate a PDF for a book
 * Section 16.1: PDF Export
 */
export async function generateBookPDF(bookId: string): Promise<PDFKit.PDFDocument> {
  // Fetch book data
  const book = await Book.findById(bookId);

  if (!book) {
    throw new Error('Book not found');
  }

  // Get author details separately (Supabase doesn't support populate)
  const author = await User.findById(book.author);
  const authorName = author?.name || 'Unknown Author';

  // Create PDF document
  const doc = new PDFDocument({
    size: 'A5',
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50,
    },
    info: {
      Title: book.title,
      Author: authorName,
      Subject: book.genre,
      Keywords: `book, ${book.genre}`,
      Creator: 'MeStory Platform',
    },
  });

  // === TITLE PAGE ===
  doc.fontSize(32)
    .font('Helvetica-Bold')
    .text(book.title, {
      align: 'center',
    });

  doc.moveDown(2);

  doc.fontSize(18)
    .font('Helvetica')
    .text(`by ${authorName}`, {
      align: 'center',
    });

  doc.moveDown(3);

  doc.fontSize(12)
    .font('Helvetica-Oblique')
    .text(book.genre, {
      align: 'center',
    });

  // === COPYRIGHT PAGE ===
  doc.addPage();

  doc.fontSize(10)
    .font('Helvetica')
    .text(`${book.title}`, {
      align: 'center',
    });

  doc.moveDown(1);

  doc.text(`Copyright © ${new Date().getFullYear()} by ${authorName}`, {
    align: 'center',
  });

  doc.moveDown(1);

  doc.text('All rights reserved. No part of this book may be reproduced or used in any manner without written permission of the copyright owner except for the use of quotations in a book review.', {
    align: 'center',
  });

  doc.moveDown(2);

  doc.text('Published by MeStory Platform', {
    align: 'center',
  });

  doc.moveDown(1);

  doc.text('www.mestory.com', {
    align: 'center',
  });

  // === TABLE OF CONTENTS (if chapters exist) ===
  if (book.chapters && book.chapters.length > 0) {
    doc.addPage();

    doc.fontSize(24)
      .font('Helvetica-Bold')
      .text('Table of Contents', {
        align: 'center',
      });

    doc.moveDown(2);

    doc.fontSize(12)
      .font('Helvetica');

    book.chapters.forEach((chapter, index) => {
      doc.text(`${index + 1}. ${chapter.title}`, {
        continued: false,
      });
      doc.moveDown(0.5);
    });
  }

  // === CHAPTERS ===
  if (book.chapters && book.chapters.length > 0) {
    book.chapters.forEach((chapter, index) => {
      // New page for each chapter
      doc.addPage();

      // Chapter number and title
      doc.fontSize(10)
        .font('Helvetica')
        .text(`CHAPTER ${index + 1}`, {
          align: 'center',
        });

      doc.moveDown(0.5);

      doc.fontSize(20)
        .font('Helvetica-Bold')
        .text(chapter.title, {
          align: 'center',
        });

      doc.moveDown(2);

      // Chapter content
      doc.fontSize(12)
        .font('Helvetica')
        .text(chapter.content || '', {
          align: 'justify',
          lineGap: 4,
        });

      // Add page numbers at the bottom
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(10)
          .font('Helvetica')
          .text(
            `${i + 1}`,
            50,
            doc.page.height - 50,
            {
              align: 'center',
            }
          );
      }
    });
  }

  // === BACK MATTER ===
  doc.addPage();

  doc.fontSize(12)
    .font('Helvetica-Oblique')
    .text('Thank you for reading!', {
      align: 'center',
    });

  doc.moveDown(2);

  if (book.statistics?.wordCount) {
    doc.fontSize(10)
      .font('Helvetica')
      .text(`Total Words: ${book.statistics.wordCount.toLocaleString()}`, {
        align: 'center',
      });
  }

  doc.moveDown(1);

  doc.text('Created with MeStory - AI-Powered Book Writing Platform', {
    align: 'center',
  });

  // Finalize the PDF
  doc.end();

  return doc;
}

/**
 * Generate a simple preview PDF (first chapter only)
 */
export async function generatePreviewPDF(bookId: string): Promise<PDFKit.PDFDocument> {
  const book = await Book.findById(bookId);

  if (!book) {
    throw new Error('Book not found');
  }

  // Get author details separately (Supabase doesn't support populate)
  const author = await User.findById(book.author);
  const authorName = author?.name || 'Unknown Author';

  const doc = new PDFDocument({
    size: 'A5',
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50,
    },
  });

  // Title page
  doc.fontSize(28)
    .font('Helvetica-Bold')
    .text(book.title, {
      align: 'center',
    });

  doc.moveDown(1);

  doc.fontSize(16)
    .font('Helvetica')
    .text(`by ${authorName}`, {
      align: 'center',
    });

  doc.moveDown(3);

  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('FREE PREVIEW', {
      align: 'center',
    });

  // First chapter only
  if (book.chapters && book.chapters.length > 0) {
    const firstChapter = book.chapters[0];

    doc.addPage();

    doc.fontSize(18)
      .font('Helvetica-Bold')
      .text(firstChapter.title, {
        align: 'center',
      });

    doc.moveDown(2);

    doc.fontSize(12)
      .font('Helvetica')
      .text(firstChapter.content || '', {
        align: 'justify',
        lineGap: 4,
      });
  }

  doc.addPage();

  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('Continue Reading', {
      align: 'center',
    });

  doc.moveDown(1);

  doc.fontSize(12)
    .font('Helvetica')
    .text('Purchase the full book on MeStory to read all chapters!', {
      align: 'center',
    });

  doc.end();

  return doc;
}
