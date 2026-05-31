/**
 * Puppeteer-based PDF export.
 *
 * Instead of trying to replicate the book's visual styling with low-level
 * PDFKit drawing (which is how bookExportService.ts currently works and why
 * Hebrew bidi breaks, fonts are wrong, etc.), we just open the book in a real
 * headless Chrome, let the browser render it exactly like the user sees it,
 * and convert the rendered DOM to PDF.
 *
 * The client exposes a dedicated `/print/:bookId` route that strips all the
 * editor UI and only renders the pages. We load that URL with the user's JWT
 * in a query param so the browser can authenticate.
 *
 * Local dev: uses your system Chrome (auto-detected by puppeteer-core).
 * Production (Vercel):       uses @sparticuz/chromium — a slimmed-down build
 * that fits inside Vercel's 50 MB function limit.
 */

import type { Browser, LaunchOptions } from 'puppeteer-core';

// We import puppeteer-core lazily inside the launch function so that importing
// this module at server startup doesn't force Chromium to download.
async function launchBrowser(): Promise<Browser> {
  const puppeteer = (await import('puppeteer-core')).default;
  const isServerless =
    process.env.VERCEL === '1' ||
    process.env.VERCEL === 'true' ||
    process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

  if (isServerless) {
    // Production / Vercel: use the serverless-optimized Chromium build
    const chromium = (await import('@sparticuz/chromium')).default as any;
    const opts: LaunchOptions = {
      args: [...chromium.args, '--font-render-hinting=none'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    };
    return puppeteer.launch(opts);
  }

  // Local development: try common Chrome install paths
  const fs = await import('fs');
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean) as string[];

  const executablePath = candidates.find((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });

  if (!executablePath) {
    throw new Error(
      'No Chrome executable found for local PDF export. ' +
        'Install Google Chrome or set PUPPETEER_EXECUTABLE_PATH environment variable.'
    );
  }

  return puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
    ],
  });
}

export interface PuppeteerPdfOptions {
  bookId: string;
  /** JWT token that the print page will use to fetch /api/books/:id */
  authToken: string;
  /** Base URL where the React app is hosted (http://localhost:5173 in dev) */
  clientUrl?: string;
  /** Paper size — A5 matches the current book layout */
  format?: 'A4' | 'A5' | 'Letter';
  /**
   * Which on-screen print page to render:
   *   'manual'   → /print/:id          (pageLayout + coverDesign editor)
   *   'designed' → /print/:id/designed (auto-design / עימוד DesignPlan)
   * Both pages set body.print-ready, so the wait logic is identical.
   */
  variant?: 'manual' | 'designed';
  /** Called with a coarse progress percent [0,100] */
  onProgress?: (pct: number, message: string) => void | Promise<void>;
}

/**
 * Render a book to a PDF buffer using headless Chrome.
 */
export async function renderBookToPdf(opts: PuppeteerPdfOptions): Promise<Buffer> {
  const {
    bookId,
    authToken,
    format = 'A5',
    variant = 'manual',
    onProgress,
  } = opts;

  // Resolve clientUrl with sensible Vercel fallbacks
  let clientUrl = opts.clientUrl || process.env.CLIENT_URL || '';
  if (!clientUrl || clientUrl.includes('localhost')) {
    if (process.env.VERCEL_URL) {
      clientUrl = `https://${process.env.VERCEL_URL}`;
    } else if (!clientUrl) {
      clientUrl = 'http://localhost:5173';
    }
  }

  await onProgress?.(5, 'Launching browser...');
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();

    // A5 at 96 dpi ≈ 559 × 794 px. Use a generous viewport so the layout
    // behaves exactly like the editor preview.
    await page.setViewport({ width: 800, height: 1120, deviceScaleFactor: 2 });

    const printPath = variant === 'designed' ? `/print/${bookId}/designed` : `/print/${bookId}`;
    const url = `${clientUrl}${printPath}?token=${encodeURIComponent(authToken)}`;

    await onProgress?.(20, 'Loading book...');
    // Use `domcontentloaded` instead of `networkidle0` — the latter waits for
    // ALL network requests to settle which can be slow with React SPAs.
    // We have the explicit `print-ready` signal below so we know when content
    // is actually ready.
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });

    // Wait for the PrintBookPage to mark itself as ready (book loaded, images
    // settled). Pass as string so TypeScript doesn't look up `document` in the
    // Node typings.
    await onProgress?.(60, 'Waiting for render...');
    await page.waitForFunction(
      `document.body.classList.contains('print-ready')`,
      { timeout: 90_000 }
    );

    await onProgress?.(80, 'Rendering PDF...');
    const pdfBytes = await page.pdf({
      format,
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
