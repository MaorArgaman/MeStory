import PDFDocument from 'pdfkit';
import { Book } from '../models/Book';

/**
 * Generate a PDF for a book
 * Section 16.1: PDF Export
 */
export async function generateBookPDF(bookId: string): Promise<PDFKit.PDFDocument> {
  // Fetch book data
  const book = await Book.findById(bookId).populate('author', 'name');

  if (!book) {
    throw new Error('Book not found');
  }

  // Get author name with type safety
  const authorName = (book.author as any)?.name || 'Unknown Author';

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
  const book = await Book.findById(bookId).populate('author', 'name');

  if (!book) {
    throw new Error('Book not found');
  }

  const authorName = (book.author as any)?.name || 'Unknown Author';

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
