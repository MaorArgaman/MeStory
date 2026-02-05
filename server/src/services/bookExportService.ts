import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, ImageRun, AlignmentType } from 'docx';
import Book from '../models/Book';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';

interface ChapterData {
  title: string;
  content: string;
  wordCount: number;
}

interface BookExportData {
  title: string;
  authorName: string;
  genre: string;
  description: string;
  chapters: ChapterData[];
  coverDesign: {
    coverColor: string;
    textColor: string;
    fontFamily: string;
    imageUrl?: string;
  };
  statistics: {
    wordCount: number;
    chapterCount: number;
  };
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Download image from URL and return as buffer
 */
async function downloadImage(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    try {
      const protocol = url.startsWith('https') ? https : http;
      protocol.get(url, (response) => {
        if (response.statusCode === 200) {
          const chunks: Buffer[] = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', () => resolve(null));
        } else {
          resolve(null);
        }
      }).on('error', () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 26, g: 26, b: 46 }; // Default dark blue
}

/**
 * Generate PDF from book data
 */
export async function generatePDF(bookId: string): Promise<Buffer> {
  const book = await Book.findById(bookId).populate('author', 'name');
  if (!book) {
    throw new Error('Book not found');
  }

  const bookData: BookExportData = {
    title: book.title,
    authorName: (book.author as any)?.name || 'Unknown Author',
    genre: book.genre || 'Fiction',
    description: book.description || '',
    chapters: (book.chapters || []).map((ch: any) => ({
      title: ch.title || 'Untitled Chapter',
      content: stripHtml(ch.content || ''),
      wordCount: ch.wordCount || 0,
    })),
    coverDesign: book.coverDesign || {
      coverColor: '#1a1a2e',
      textColor: '#ffffff',
      fontFamily: 'Helvetica',
    },
    statistics: book.statistics || { wordCount: 0, chapterCount: 0 },
  };

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: 'A5', // Standard book size
      margins: {
        top: 72,
        bottom: 72,
        left: 72,
        right: 72,
      },
      info: {
        Title: bookData.title,
        Author: bookData.authorName,
        Subject: bookData.genre,
      },
    });

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Register Hebrew-friendly font if available, otherwise use Helvetica
    const fontPath = path.join(__dirname, '../assets/fonts/NotoSansHebrew-Regular.ttf');
    const boldFontPath = path.join(__dirname, '../assets/fonts/NotoSansHebrew-Bold.ttf');

    let mainFont = 'Helvetica';
    let boldFont = 'Helvetica-Bold';

    if (fs.existsSync(fontPath)) {
      doc.registerFont('Hebrew', fontPath);
      mainFont = 'Hebrew';
    }
    if (fs.existsSync(boldFontPath)) {
      doc.registerFont('Hebrew-Bold', boldFontPath);
      boldFont = 'Hebrew-Bold';
    }

    const coverColor = hexToRgb(bookData.coverDesign.coverColor);
    const textColor = hexToRgb(bookData.coverDesign.textColor);

    // === FRONT COVER ===
    doc.rect(0, 0, doc.page.width, doc.page.height)
      .fill(`rgb(${coverColor.r}, ${coverColor.g}, ${coverColor.b})`);

    // Title
    doc.fillColor(`rgb(${textColor.r}, ${textColor.g}, ${textColor.b})`)
      .font(boldFont)
      .fontSize(36)
      .text(bookData.title, 72, 200, {
        align: 'center',
        width: doc.page.width - 144,
      });

    // Author
    doc.font(mainFont)
      .fontSize(18)
      .text(bookData.authorName, 72, 300, {
        align: 'center',
        width: doc.page.width - 144,
      });

    // Genre tag
    doc.fontSize(12)
      .text(bookData.genre, 72, 400, {
        align: 'center',
        width: doc.page.width - 144,
      });

    // === TITLE PAGE ===
    doc.addPage();
    doc.fillColor('black')
      .font(boldFont)
      .fontSize(28)
      .text(bookData.title, 72, 200, {
        align: 'center',
        width: doc.page.width - 144,
      });

    doc.font(mainFont)
      .fontSize(16)
      .text(`by ${bookData.authorName}`, 72, 260, {
        align: 'center',
        width: doc.page.width - 144,
      });

    // === TABLE OF CONTENTS ===
    if (bookData.chapters.length > 1) {
      doc.addPage();
      doc.font(boldFont)
        .fontSize(20)
        .text('Table of Contents', { align: 'center' });

      doc.moveDown(2);
      doc.font(mainFont).fontSize(12);

      bookData.chapters.forEach((chapter, index) => {
        doc.text(`${index + 1}. ${chapter.title}`, {
          continued: false,
        });
        doc.moveDown(0.5);
      });
    }

    // === CHAPTERS ===
    bookData.chapters.forEach((chapter, index) => {
      doc.addPage();

      // Chapter title
      doc.font(boldFont)
        .fontSize(22)
        .text(`Chapter ${index + 1}`, { align: 'center' });

      doc.font(boldFont)
        .fontSize(18)
        .text(chapter.title, { align: 'center' });

      doc.moveDown(2);

      // Chapter content
      doc.font(mainFont)
        .fontSize(11)
        .text(chapter.content, {
          align: 'justify',
          lineGap: 4,
          paragraphGap: 12,
        });
    });

    // === BACK COVER ===
    doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height)
      .fill(`rgb(${coverColor.r}, ${coverColor.g}, ${coverColor.b})`);

    // Synopsis/Description
    if (bookData.description) {
      doc.fillColor(`rgb(${textColor.r}, ${textColor.g}, ${textColor.b})`)
        .font(mainFont)
        .fontSize(12)
        .text(bookData.description, 72, 100, {
          align: 'justify',
          width: doc.page.width - 144,
        });
    }

    // Stats at bottom
    doc.fontSize(10)
      .text(
        `${bookData.statistics.wordCount.toLocaleString()} words • ${bookData.statistics.chapterCount} chapters`,
        72,
        doc.page.height - 100,
        {
          align: 'center',
          width: doc.page.width - 144,
        }
      );

    // Author name
    doc.font(boldFont)
      .fontSize(14)
      .text(bookData.authorName, 72, doc.page.height - 70, {
        align: 'center',
        width: doc.page.width - 144,
      });

    doc.end();
  });
}

/**
 * Generate DOCX from book data
 */
export async function generateDOCX(bookId: string): Promise<Buffer> {
  const book = await Book.findById(bookId).populate('author', 'name');
  if (!book) {
    throw new Error('Book not found');
  }

  const bookData: BookExportData = {
    title: book.title,
    authorName: (book.author as any)?.name || 'Unknown Author',
    genre: book.genre || 'Fiction',
    description: book.description || '',
    chapters: (book.chapters || []).map((ch: any) => ({
      title: ch.title || 'Untitled Chapter',
      content: stripHtml(ch.content || ''),
      wordCount: ch.wordCount || 0,
    })),
    coverDesign: book.coverDesign || {
      coverColor: '#1a1a2e',
      textColor: '#ffffff',
      fontFamily: 'Calibri',
    },
    statistics: book.statistics || { wordCount: 0, chapterCount: 0 },
  };

  const sections: any[] = [];

  // === TITLE PAGE ===
  const titlePage: Paragraph[] = [
    new Paragraph({
      children: [],
      spacing: { before: 3000 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: bookData.title,
          bold: true,
          size: 72,
          font: 'Calibri',
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [],
      spacing: { before: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `by ${bookData.authorName}`,
          size: 32,
          font: 'Calibri',
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [],
      spacing: { before: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: bookData.genre,
          size: 24,
          italics: true,
          font: 'Calibri',
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new PageBreak()],
    }),
  ];

  // === TABLE OF CONTENTS ===
  const tocPage: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: 'Table of Contents',
          bold: true,
          size: 40,
          font: 'Calibri',
        }),
      ],
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [],
      spacing: { before: 400 },
    }),
  ];

  bookData.chapters.forEach((chapter, index) => {
    tocPage.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}. ${chapter.title}`,
            size: 24,
            font: 'Calibri',
          }),
        ],
        spacing: { before: 100, after: 100 },
      })
    );
  });

  tocPage.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // === CHAPTERS ===
  const chapterPages: Paragraph[] = [];

  bookData.chapters.forEach((chapter, index) => {
    // Chapter header
    chapterPages.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Chapter ${index + 1}`,
            bold: true,
            size: 32,
            font: 'Calibri',
          }),
        ],
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
      })
    );

    chapterPages.push(
      new Paragraph({
        children: [
          new TextRun({
            text: chapter.title,
            bold: true,
            size: 28,
            font: 'Calibri',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Chapter content - split by paragraphs
    const paragraphs = chapter.content.split(/\n\n+/);
    paragraphs.forEach((para) => {
      if (para.trim()) {
        chapterPages.push(
          new Paragraph({
            children: [
              new TextRun({
                text: para.trim(),
                size: 24,
                font: 'Calibri',
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200, line: 360 },
          })
        );
      }
    });

    // Page break after each chapter (except last)
    if (index < bookData.chapters.length - 1) {
      chapterPages.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }
  });

  // === ABOUT/BACK MATTER ===
  const backMatter: Paragraph[] = [
    new Paragraph({
      children: [new PageBreak()],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'About This Book',
          bold: true,
          size: 32,
          font: 'Calibri',
        }),
      ],
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [],
      spacing: { before: 400 },
    }),
  ];

  if (bookData.description) {
    backMatter.push(
      new Paragraph({
        children: [
          new TextRun({
            text: bookData.description,
            size: 24,
            font: 'Calibri',
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 400 },
      })
    );
  }

  backMatter.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${bookData.statistics.wordCount.toLocaleString()} words • ${bookData.statistics.chapterCount} chapters`,
          size: 20,
          italics: true,
          font: 'Calibri',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    })
  );

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 8391, // A5 width in twips
              height: 11906, // A5 height in twips
            },
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          ...titlePage,
          ...tocPage,
          ...chapterPages,
          ...backMatter,
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

/**
 * Export book to specified format
 */
export async function exportBook(
  bookId: string,
  format: 'pdf' | 'docx'
): Promise<Buffer> {
  if (format === 'pdf') {
    return generatePDF(bookId);
  } else {
    return generateDOCX(bookId);
  }
}
