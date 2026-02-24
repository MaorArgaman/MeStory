import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, AlignmentType, ImageRun, Header, Footer, PageNumber } from 'docx';
import { Book, IChapter, ICharacter, IPageImage, IStoryContext } from '../models/Book';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

// ============================================================================
// INTERFACES
// ============================================================================

interface ChapterData {
  title: string;
  content: string;
  wordCount: number;
  images: PageImageData[];
}

interface PageImageData {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isAiGenerated: boolean;
  caption?: string;
}

interface CharacterData {
  name: string;
  age?: number;
  description: string;
  traits: string[];
  backstory?: string;
  goals?: string;
  motivations?: string;
  arc?: string;
}

interface StoryContextData {
  theme?: string;
  characters?: string;
  conflict?: string;
  climax?: string;
  resolution?: string;
  setting?: string;
  keyPoints?: string;
  narrativeArc?: string;
  voiceInterview?: {
    responses: Array<{
      topic: string;
      question: string;
      answer: string;
    }>;
    summary?: {
      theme?: {
        mainTheme?: string;
        subThemes?: string[];
        tone?: string;
      };
      plot?: {
        premise?: string;
        conflict?: string;
        stakes?: string;
        keyEvents?: string[];
      };
      setting?: {
        world?: string;
        timePeriod?: string;
        atmosphere?: string;
        locations?: string[];
      };
    };
  };
}

interface CoverDesignData {
  coverColor: string;
  textColor: string;
  fontFamily: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  synopsis?: string;
  authorBio?: string;
}

interface PageLayoutData {
  bodyFont: string;
  fontSize: number;
  lineHeight: number;
  pageSize: 'A4' | 'A5' | 'Letter' | 'Custom';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  includeTableOfContents: boolean;
  includePageNumbers: boolean;
  pageNumberPosition: 'top' | 'bottom' | 'none';
  includeHeader: boolean;
  includeFooter: boolean;
}

interface AIDesignData {
  typography?: {
    bodyFont?: string;
    headingFont?: string;
    fontSize?: number;
    lineHeight?: number;
    colors?: {
      text?: string;
      heading?: string;
      accent?: string;
      background?: string;
    };
  };
  covers?: {
    front?: {
      generatedImageUrl?: string;
      backgroundColor?: string;
    };
    back?: {
      generatedImageUrl?: string;
    };
  };
  imagePlacements?: Array<{
    chapterIndex: number;
    generatedImageUrl?: string;
    caption?: string;
  }>;
}

interface BookExportData {
  title: string;
  authorName: string;
  genre: string;
  description: string;
  synopsis: string;
  language: string;
  chapters: ChapterData[];
  characters: CharacterData[];
  storyContext?: StoryContextData;
  coverDesign: CoverDesignData;
  pageLayout: PageLayoutData;
  aiDesign?: AIDesignData;
  statistics: {
    wordCount: number;
    chapterCount: number;
    pageCount: number;
    characterCount: number;
  };
  dedication?: string;
  acknowledgments?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Strip HTML tags from content while preserving paragraph structure
 */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
 * Fetch image from URL and return as buffer
 */
async function fetchImageAsBuffer(url: string): Promise<Buffer | null> {
  try {
    if (!url) return null;

    // Handle relative URLs
    if (url.startsWith('/')) {
      const localPath = path.join(__dirname, '../../public', url);
      if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath);
      }
    }

    // Handle data URLs
    if (url.startsWith('data:')) {
      const base64Data = url.split(',')[1];
      return Buffer.from(base64Data, 'base64');
    }

    // Fetch from remote URL
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'MeStory-Export/1.0',
      },
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error fetching image:', url, error);
    return null;
  }
}

/**
 * Check if text contains Hebrew characters
 */
function containsHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

/**
 * Get page dimensions in points based on page size
 */
function getPageDimensions(pageSize: string): { width: number; height: number } {
  switch (pageSize) {
    case 'A4':
      return { width: 595.28, height: 841.89 };
    case 'Letter':
      return { width: 612, height: 792 };
    case 'A5':
    default:
      return { width: 419.53, height: 595.28 };
  }
}

/**
 * Get page dimensions in twips for DOCX (1 inch = 1440 twips)
 */
function getDocxPageDimensions(pageSize: string): { width: number; height: number } {
  switch (pageSize) {
    case 'A4':
      return { width: 11906, height: 16838 };
    case 'Letter':
      return { width: 12240, height: 15840 };
    case 'A5':
    default:
      return { width: 8391, height: 11906 };
  }
}

/**
 * Convert mm to points (for PDF)
 */
function mmToPoints(mm: number): number {
  return mm * 2.83465;
}

/**
 * Convert mm to twips (for DOCX)
 */
function mmToTwips(mm: number): number {
  return Math.round(mm * 56.6929);
}

// ============================================================================
// DATA EXTRACTION
// ============================================================================

/**
 * Extract all book data for export
 */
async function extractBookData(bookId: string): Promise<BookExportData> {
  const book = await Book.findById(bookId).populate('author', 'name');
  if (!book) {
    throw new Error('Book not found');
  }

  // Extract cover design data
  const coverDesignData = book.coverDesign as any;
  const aiDesignData = book.aiDesignState?.design as any;

  const getCoverColor = (): string => {
    if (coverDesignData?.coverColor) return coverDesignData.coverColor;
    if (coverDesignData?.front?.backgroundColor) return coverDesignData.front.backgroundColor;
    if (aiDesignData?.covers?.front?.backgroundColor) return aiDesignData.covers.front.backgroundColor;
    return '#1a1a2e';
  };

  const getTextColor = (): string => {
    if (coverDesignData?.textColor) return coverDesignData.textColor;
    if (coverDesignData?.front?.title?.color) return coverDesignData.front.title.color;
    if (aiDesignData?.typography?.colors?.text) return aiDesignData.typography.colors.text;
    return '#ffffff';
  };

  const getFontFamily = (): string => {
    if (coverDesignData?.fontFamily) return coverDesignData.fontFamily;
    if (coverDesignData?.front?.title?.font) return coverDesignData.front.title.font;
    if (aiDesignData?.typography?.bodyFont) return aiDesignData.typography.bodyFont;
    return 'Helvetica';
  };

  const getFrontImageUrl = (): string | undefined => {
    if (coverDesignData?.imageUrl) return coverDesignData.imageUrl;
    if (coverDesignData?.front?.imageUrl) return coverDesignData.front.imageUrl;
    if (aiDesignData?.covers?.front?.generatedImageUrl) return aiDesignData.covers.front.generatedImageUrl;
    return undefined;
  };

  const getBackImageUrl = (): string | undefined => {
    if (coverDesignData?.back?.imageUrl) return coverDesignData.back.imageUrl;
    if (aiDesignData?.covers?.back?.generatedImageUrl) return aiDesignData.covers.back.generatedImageUrl;
    return undefined;
  };

  // Extract page layout
  const pageLayoutData = book.pageLayout as any;
  const pageLayout: PageLayoutData = {
    bodyFont: pageLayoutData?.bodyFont || aiDesignData?.typography?.bodyFont || 'Georgia',
    fontSize: pageLayoutData?.fontSize || aiDesignData?.typography?.fontSize || 12,
    lineHeight: pageLayoutData?.lineHeight || aiDesignData?.typography?.lineHeight || 1.6,
    pageSize: pageLayoutData?.pageSize || 'A5',
    margins: {
      top: pageLayoutData?.margins?.top || 25,
      bottom: pageLayoutData?.margins?.bottom || 25,
      left: pageLayoutData?.margins?.left || 25,
      right: pageLayoutData?.margins?.right || 25,
    },
    includeTableOfContents: pageLayoutData?.includeTableOfContents !== false,
    includePageNumbers: pageLayoutData?.headerFooter?.includePageNumbers !== false,
    pageNumberPosition: pageLayoutData?.headerFooter?.pageNumberPosition || 'bottom',
    includeHeader: pageLayoutData?.headerFooter?.includeHeader || false,
    includeFooter: pageLayoutData?.headerFooter?.includeFooter !== false,
  };

  // Extract page images and map them to chapters
  const pageImages = book.pageImages || [];
  const aiImagePlacements = aiDesignData?.imagePlacements || [];

  // Create a map of chapter index to images
  const chapterImagesMap = new Map<number, PageImageData[]>();

  // Add page images
  pageImages.forEach((img: IPageImage) => {
    const images = chapterImagesMap.get(img.pageIndex) || [];
    images.push({
      url: img.url,
      x: img.x,
      y: img.y,
      width: img.width,
      height: img.height,
      isAiGenerated: img.isAiGenerated,
    });
    chapterImagesMap.set(img.pageIndex, images);
  });

  // Add AI-generated images
  aiImagePlacements.forEach((placement: any) => {
    if (placement.generatedImageUrl) {
      const images = chapterImagesMap.get(placement.chapterIndex) || [];
      images.push({
        url: placement.generatedImageUrl,
        x: 10,
        y: 10,
        width: 80,
        height: 40,
        isAiGenerated: true,
        caption: placement.caption,
      });
      chapterImagesMap.set(placement.chapterIndex, images);
    }
  });

  // Extract chapters with images
  const chapters: ChapterData[] = (book.chapters || []).map((ch: IChapter, index: number) => ({
    title: ch.title || 'פרק ללא שם',
    content: stripHtml(ch.content || ''),
    wordCount: ch.wordCount || 0,
    images: chapterImagesMap.get(index) || [],
  }));

  // Extract characters
  const characters: CharacterData[] = (book.characters || []).map((char: ICharacter) => ({
    name: char.name,
    age: char.age,
    description: char.description,
    traits: char.traits || [],
    backstory: char.backstory,
    goals: char.goals,
    motivations: char.motivations,
    arc: char.arc,
  }));

  // Extract story context
  const storyContext = book.storyContext as IStoryContext | undefined;
  let storyContextData: StoryContextData | undefined;
  if (storyContext) {
    storyContextData = {
      theme: storyContext.theme,
      characters: storyContext.characters,
      conflict: storyContext.conflict,
      climax: storyContext.climax,
      resolution: storyContext.resolution,
      setting: storyContext.setting,
      keyPoints: storyContext.keyPoints,
      narrativeArc: storyContext.narrativeArc,
    };
    if (storyContext.voiceInterview) {
      storyContextData.voiceInterview = {
        responses: storyContext.voiceInterview.responses || [],
        summary: storyContext.voiceInterview.summary,
      };
    }
  }

  return {
    title: book.title,
    authorName: (book.author as any)?.name || 'מחבר לא ידוע',
    genre: book.genre || 'סיפורת',
    description: book.description || '',
    synopsis: book.synopsis || coverDesignData?.back?.synopsis || '',
    language: book.language || 'he',
    chapters,
    characters,
    storyContext: storyContextData,
    coverDesign: {
      coverColor: getCoverColor(),
      textColor: getTextColor(),
      fontFamily: getFontFamily(),
      frontImageUrl: getFrontImageUrl(),
      backImageUrl: getBackImageUrl(),
      synopsis: coverDesignData?.back?.synopsis,
      authorBio: coverDesignData?.back?.authorBio,
    },
    pageLayout,
    aiDesign: aiDesignData ? {
      typography: aiDesignData.typography,
      covers: aiDesignData.covers,
      imagePlacements: aiDesignData.imagePlacements,
    } : undefined,
    statistics: {
      wordCount: book.statistics?.wordCount || 0,
      chapterCount: book.statistics?.chapterCount || chapters.length,
      pageCount: book.statistics?.pageCount || 0,
      characterCount: book.statistics?.characterCount || characters.length,
    },
  };
}

// ============================================================================
// PDF GENERATION
// ============================================================================

/**
 * Generate professional PDF from book data
 */
export async function generatePDF(bookId: string): Promise<Buffer> {
  const bookData = await extractBookData(bookId);

  // Determine if book is RTL (Hebrew)
  const isRTL = bookData.language === 'he' || containsHebrew(bookData.title);

  // Get page dimensions
  const pageDims = getPageDimensions(bookData.pageLayout.pageSize);
  const margins = {
    top: mmToPoints(bookData.pageLayout.margins.top),
    bottom: mmToPoints(bookData.pageLayout.margins.bottom),
    left: mmToPoints(bookData.pageLayout.margins.left),
    right: mmToPoints(bookData.pageLayout.margins.right),
  };

  // Fetch cover images
  const frontCoverImage = await fetchImageAsBuffer(bookData.coverDesign.frontImageUrl || '');
  const backCoverImage = await fetchImageAsBuffer(bookData.coverDesign.backImageUrl || '');

  // Fetch chapter images
  const chapterImages: Map<number, Buffer[]> = new Map();
  for (let i = 0; i < bookData.chapters.length; i++) {
    const chapter = bookData.chapters[i];
    const images: Buffer[] = [];
    for (const img of chapter.images) {
      const buffer = await fetchImageAsBuffer(img.url);
      if (buffer) {
        images.push(buffer);
      }
    }
    if (images.length > 0) {
      chapterImages.set(i, images);
    }
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: [pageDims.width, pageDims.height],
      margins: margins,
      bufferPages: true,
      info: {
        Title: bookData.title,
        Author: bookData.authorName,
        Subject: bookData.genre,
        Creator: 'MeStory',
        Producer: 'MeStory Book Export',
      },
    });

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Register Hebrew fonts
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
    const contentWidth = pageDims.width - margins.left - margins.right;

    // Track page numbers
    let pageNum = 0;
    const startContentPage = 4; // After cover, title, copyright, TOC

    // ========== FRONT COVER ==========
    doc.rect(0, 0, pageDims.width, pageDims.height)
      .fill(`rgb(${coverColor.r}, ${coverColor.g}, ${coverColor.b})`);

    // Add cover image if available
    if (frontCoverImage) {
      try {
        const imgWidth = pageDims.width * 0.6;
        const imgX = (pageDims.width - imgWidth) / 2;
        doc.image(frontCoverImage, imgX, 80, {
          width: imgWidth,
          align: 'center',
        });
      } catch (e) {
        console.error('Error adding cover image:', e);
      }
    }

    // Title
    doc.fillColor(`rgb(${textColor.r}, ${textColor.g}, ${textColor.b})`)
      .font(boldFont)
      .fontSize(36)
      .text(bookData.title, margins.left, frontCoverImage ? 350 : 200, {
        align: 'center',
        width: contentWidth,
      });

    // Subtitle (genre)
    doc.font(mainFont)
      .fontSize(14)
      .text(bookData.genre, margins.left, doc.y + 20, {
        align: 'center',
        width: contentWidth,
      });

    // Author
    doc.font(mainFont)
      .fontSize(20)
      .text(bookData.authorName, margins.left, pageDims.height - 150, {
        align: 'center',
        width: contentWidth,
      });

    // ========== TITLE PAGE ==========
    doc.addPage();
    pageNum++;

    doc.fillColor('black')
      .font(boldFont)
      .fontSize(32)
      .text(bookData.title, margins.left, pageDims.height / 3, {
        align: 'center',
        width: contentWidth,
      });

    doc.font(mainFont)
      .fontSize(18)
      .text(bookData.authorName, margins.left, doc.y + 40, {
        align: 'center',
        width: contentWidth,
      });

    doc.fontSize(12)
      .text(bookData.genre, margins.left, doc.y + 20, {
        align: 'center',
        width: contentWidth,
      });

    // ========== COPYRIGHT PAGE ==========
    doc.addPage();
    pageNum++;

    doc.font(mainFont)
      .fontSize(10)
      .fillColor('#666666');

    const year = new Date().getFullYear();
    doc.text(`© ${year} ${bookData.authorName}`, margins.left, pageDims.height - 200, {
      align: 'center',
      width: contentWidth,
    });
    doc.text('כל הזכויות שמורות', margins.left, doc.y + 15, {
      align: 'center',
      width: contentWidth,
    });
    doc.text('נוצר באמצעות MeStory', margins.left, doc.y + 15, {
      align: 'center',
      width: contentWidth,
    });

    // ========== DEDICATION PAGE (if exists) ==========
    if (bookData.dedication) {
      doc.addPage();
      pageNum++;

      doc.fillColor('black')
        .font(mainFont)
        .fontSize(14)
        .text(bookData.dedication, margins.left, pageDims.height / 3, {
          align: 'center',
          width: contentWidth,
        });
    }

    // ========== TABLE OF CONTENTS ==========
    if (bookData.pageLayout.includeTableOfContents && bookData.chapters.length > 1) {
      doc.addPage();
      pageNum++;

      doc.fillColor('black')
        .font(boldFont)
        .fontSize(24)
        .text('תוכן עניינים', margins.left, margins.top, {
          align: 'center',
          width: contentWidth,
        });

      doc.moveDown(2);
      doc.font(mainFont).fontSize(12);

      bookData.chapters.forEach((chapter, index) => {
        doc.text(`${index + 1}. ${chapter.title}`, margins.left, doc.y, {
          continued: false,
          align: isRTL ? 'right' : 'left',
          width: contentWidth,
        });
        doc.moveDown(0.5);
      });

      // Add characters to TOC if any
      if (bookData.characters.length > 0) {
        doc.moveDown(1);
        doc.text('דמויות', margins.left, doc.y, {
          align: isRTL ? 'right' : 'left',
          width: contentWidth,
        });
      }
    }

    // ========== CHAPTERS ==========
    bookData.chapters.forEach((chapter, chapterIndex) => {
      doc.addPage();
      pageNum++;

      // Chapter number
      doc.fillColor('#666666')
        .font(mainFont)
        .fontSize(12)
        .text(`פרק ${chapterIndex + 1}`, margins.left, margins.top, {
          align: 'center',
          width: contentWidth,
        });

      // Chapter title
      doc.fillColor('black')
        .font(boldFont)
        .fontSize(20)
        .text(chapter.title, margins.left, doc.y + 10, {
          align: 'center',
          width: contentWidth,
        });

      doc.moveDown(2);

      // Chapter images at the beginning
      const images = chapterImages.get(chapterIndex);
      if (images && images.length > 0) {
        for (const imgBuffer of images) {
          try {
            const imgWidth = contentWidth * 0.8;
            const imgX = margins.left + (contentWidth - imgWidth) / 2;
            doc.image(imgBuffer, imgX, doc.y, {
              width: imgWidth,
              align: 'center',
            });
            doc.moveDown(1);
          } catch (e) {
            console.error('Error adding chapter image:', e);
          }
        }
        doc.moveDown(1);
      }

      // Chapter content
      doc.font(mainFont)
        .fontSize(bookData.pageLayout.fontSize)
        .fillColor('black');

      const paragraphs = chapter.content.split(/\n\n+/);
      paragraphs.forEach((para, paraIndex) => {
        if (para.trim()) {
          // Check if we need a new page
          if (doc.y > pageDims.height - margins.bottom - 50) {
            doc.addPage();
            pageNum++;
          }

          doc.text(para.trim(), margins.left, doc.y, {
            align: 'justify',
            width: contentWidth,
            lineGap: (bookData.pageLayout.lineHeight - 1) * bookData.pageLayout.fontSize,
            paragraphGap: 12,
          });

          if (paraIndex < paragraphs.length - 1) {
            doc.moveDown(0.5);
          }
        }
      });
    });

    // ========== CHARACTERS SECTION ==========
    if (bookData.characters.length > 0) {
      doc.addPage();
      pageNum++;

      doc.fillColor('black')
        .font(boldFont)
        .fontSize(24)
        .text('דמויות הספר', margins.left, margins.top, {
          align: 'center',
          width: contentWidth,
        });

      doc.moveDown(2);

      bookData.characters.forEach((character, index) => {
        if (doc.y > pageDims.height - margins.bottom - 100) {
          doc.addPage();
          pageNum++;
        }

        // Character name
        doc.font(boldFont)
          .fontSize(16)
          .text(character.name + (character.age ? ` (גיל ${character.age})` : ''), margins.left, doc.y, {
            align: isRTL ? 'right' : 'left',
            width: contentWidth,
          });

        doc.moveDown(0.5);
        doc.font(mainFont).fontSize(11);

        // Description
        if (character.description) {
          doc.text(character.description, margins.left, doc.y, {
            align: 'justify',
            width: contentWidth,
          });
          doc.moveDown(0.5);
        }

        // Traits
        if (character.traits && character.traits.length > 0) {
          doc.font(boldFont).fontSize(10).text('תכונות: ', { continued: true });
          doc.font(mainFont).text(character.traits.join(', '));
          doc.moveDown(0.3);
        }

        // Backstory
        if (character.backstory) {
          doc.font(boldFont).fontSize(10).text('רקע: ', { continued: true });
          doc.font(mainFont).text(character.backstory);
          doc.moveDown(0.3);
        }

        // Goals
        if (character.goals) {
          doc.font(boldFont).fontSize(10).text('מטרות: ', { continued: true });
          doc.font(mainFont).text(character.goals);
          doc.moveDown(0.3);
        }

        // Arc
        if (character.arc) {
          doc.font(boldFont).fontSize(10).text('התפתחות: ', { continued: true });
          doc.font(mainFont).text(character.arc);
        }

        doc.moveDown(1.5);

        // Separator
        if (index < bookData.characters.length - 1) {
          doc.strokeColor('#cccccc')
            .lineWidth(0.5)
            .moveTo(margins.left + 50, doc.y)
            .lineTo(margins.left + contentWidth - 50, doc.y)
            .stroke();
          doc.moveDown(1);
        }
      });
    }

    // ========== STORY CONTEXT / INTERVIEW SECTION ==========
    if (bookData.storyContext) {
      doc.addPage();
      pageNum++;

      doc.fillColor('black')
        .font(boldFont)
        .fontSize(24)
        .text('הסיפור מאחורי הספר', margins.left, margins.top, {
          align: 'center',
          width: contentWidth,
        });

      doc.moveDown(2);
      doc.font(mainFont).fontSize(11);

      const contextSections = [
        { title: 'נושא מרכזי', content: bookData.storyContext.theme },
        { title: 'עולם הסיפור', content: bookData.storyContext.setting },
        { title: 'הקונפליקט', content: bookData.storyContext.conflict },
        { title: 'נקודות מפתח', content: bookData.storyContext.keyPoints },
        { title: 'שיא הסיפור', content: bookData.storyContext.climax },
        { title: 'הסיום', content: bookData.storyContext.resolution },
      ];

      contextSections.forEach((section) => {
        if (section.content) {
          if (doc.y > pageDims.height - margins.bottom - 80) {
            doc.addPage();
            pageNum++;
          }

          doc.font(boldFont)
            .fontSize(14)
            .text(section.title, margins.left, doc.y, {
              align: isRTL ? 'right' : 'left',
              width: contentWidth,
            });

          doc.moveDown(0.5);
          doc.font(mainFont)
            .fontSize(11)
            .text(section.content, margins.left, doc.y, {
              align: 'justify',
              width: contentWidth,
            });

          doc.moveDown(1.5);
        }
      });

      // Voice interview responses
      if (bookData.storyContext.voiceInterview?.responses?.length) {
        if (doc.y > pageDims.height - margins.bottom - 100) {
          doc.addPage();
          pageNum++;
        }

        doc.font(boldFont)
          .fontSize(16)
          .text('תשובות מהראיון', margins.left, doc.y, {
            align: 'center',
            width: contentWidth,
          });

        doc.moveDown(1);

        bookData.storyContext.voiceInterview.responses.forEach((response) => {
          if (doc.y > pageDims.height - margins.bottom - 80) {
            doc.addPage();
            pageNum++;
          }

          doc.font(boldFont)
            .fontSize(11)
            .fillColor('#444444')
            .text(`שאלה: ${response.question}`, margins.left, doc.y, {
              align: isRTL ? 'right' : 'left',
              width: contentWidth,
            });

          doc.moveDown(0.3);
          doc.font(mainFont)
            .fillColor('black')
            .text(response.answer, margins.left, doc.y, {
              align: 'justify',
              width: contentWidth,
            });

          doc.moveDown(1);
        });
      }
    }

    // ========== BACK COVER ==========
    doc.addPage();
    doc.rect(0, 0, pageDims.width, pageDims.height)
      .fill(`rgb(${coverColor.r}, ${coverColor.g}, ${coverColor.b})`);

    // Back cover image
    if (backCoverImage) {
      try {
        const imgWidth = pageDims.width * 0.4;
        const imgX = (pageDims.width - imgWidth) / 2;
        doc.image(backCoverImage, imgX, 50, {
          width: imgWidth,
          align: 'center',
        });
      } catch (e) {
        console.error('Error adding back cover image:', e);
      }
    }

    // Synopsis
    const synopsisText = bookData.synopsis || bookData.description;
    if (synopsisText) {
      doc.fillColor(`rgb(${textColor.r}, ${textColor.g}, ${textColor.b})`)
        .font(mainFont)
        .fontSize(12)
        .text(synopsisText, margins.left, backCoverImage ? 250 : 100, {
          align: 'justify',
          width: contentWidth,
        });
    }

    // Author bio
    if (bookData.coverDesign.authorBio) {
      doc.moveDown(2);
      doc.font(boldFont)
        .fontSize(12)
        .text('על המחבר', margins.left, doc.y, {
          align: 'center',
          width: contentWidth,
        });
      doc.moveDown(0.5);
      doc.font(mainFont)
        .fontSize(10)
        .text(bookData.coverDesign.authorBio, margins.left, doc.y, {
          align: 'justify',
          width: contentWidth,
        });
    }

    // Stats at bottom
    doc.fontSize(10)
      .text(
        `${bookData.statistics.wordCount.toLocaleString('he-IL')} מילים • ${bookData.statistics.chapterCount} פרקים`,
        margins.left,
        pageDims.height - 100,
        {
          align: 'center',
          width: contentWidth,
        }
      );

    // Author name
    doc.font(boldFont)
      .fontSize(14)
      .text(bookData.authorName, margins.left, pageDims.height - 70, {
        align: 'center',
        width: contentWidth,
      });

    // MeStory branding
    doc.font(mainFont)
      .fontSize(8)
      .fillColor(`rgb(${Math.min(textColor.r + 50, 255)}, ${Math.min(textColor.g + 50, 255)}, ${Math.min(textColor.b + 50, 255)})`)
      .text('נוצר באמצעות MeStory', margins.left, pageDims.height - 40, {
        align: 'center',
        width: contentWidth,
      });

    // ========== ADD PAGE NUMBERS ==========
    if (bookData.pageLayout.includePageNumbers) {
      const pages = doc.bufferedPageRange();
      for (let i = startContentPage; i < pages.count; i++) {
        doc.switchToPage(i);

        const pageNumber = i - startContentPage + 1;
        const yPos = bookData.pageLayout.pageNumberPosition === 'top'
          ? margins.top - 20
          : pageDims.height - margins.bottom + 10;

        doc.font(mainFont)
          .fontSize(10)
          .fillColor('#666666')
          .text(
            pageNumber.toString(),
            0,
            yPos,
            {
              align: 'center',
              width: pageDims.width,
            }
          );
      }
    }

    doc.end();
  });
}

// ============================================================================
// DOCX GENERATION
// ============================================================================

/**
 * Generate professional DOCX from book data
 */
export async function generateDOCX(bookId: string): Promise<Buffer> {
  let bookData;
  try {
    bookData = await extractBookData(bookId);
  } catch (error: any) {
    console.error('Failed to extract book data for DOCX:', error);
    throw new Error(`Failed to extract book data: ${error.message}`);
  }

  // Validate we have chapters
  if (!bookData.chapters || bookData.chapters.length === 0) {
    throw new Error('Cannot export book without chapters');
  }

  // Determine if book is RTL (Hebrew)
  const isRTL = bookData.language === 'he' || containsHebrew(bookData.title);

  // Get page dimensions
  const pageDims = getDocxPageDimensions(bookData.pageLayout.pageSize);
  const marginTwips = {
    top: mmToTwips(bookData.pageLayout.margins.top),
    bottom: mmToTwips(bookData.pageLayout.margins.bottom),
    left: mmToTwips(bookData.pageLayout.margins.left),
    right: mmToTwips(bookData.pageLayout.margins.right),
  };

  // Fetch cover images for DOCX
  const frontCoverImage = await fetchImageAsBuffer(bookData.coverDesign.frontImageUrl || '');

  // Fetch chapter images
  const chapterImageBuffers: Map<number, Buffer[]> = new Map();
  for (let i = 0; i < bookData.chapters.length; i++) {
    const chapter = bookData.chapters[i];
    const buffers: Buffer[] = [];
    for (const img of chapter.images) {
      const buffer = await fetchImageAsBuffer(img.url);
      if (buffer) {
        buffers.push(buffer);
      }
    }
    if (buffers.length > 0) {
      chapterImageBuffers.set(i, buffers);
    }
  }

  // Font configuration
  const bodyFont = bookData.pageLayout.bodyFont || 'David';
  const headingFont = bookData.aiDesign?.typography?.headingFont || 'David';
  const fontSize = bookData.pageLayout.fontSize * 2; // Half-points

  // ========== TITLE PAGE ==========
  const titlePageContent: Paragraph[] = [
    new Paragraph({ children: [], spacing: { before: 2000 } }),
  ];

  // Add cover image if available
  if (frontCoverImage) {
    try {
      titlePageContent.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: frontCoverImage,
              transformation: {
                width: 300,
                height: 400,
              },
            }),
          ],
          alignment: AlignmentType.CENTER,
        })
      );
      titlePageContent.push(new Paragraph({ children: [], spacing: { before: 400 } }));
    } catch (e) {
      console.error('Error adding cover image to DOCX:', e);
    }
  }

  titlePageContent.push(
    new Paragraph({
      children: [
        new TextRun({
          text: bookData.title,
          bold: true,
          size: 72,
          font: headingFont,
        }),
      ],
      alignment: AlignmentType.CENTER,
      bidirectional: isRTL,
    }),
    new Paragraph({ children: [], spacing: { before: 400 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: bookData.authorName,
          size: 36,
          font: bodyFont,
        }),
      ],
      alignment: AlignmentType.CENTER,
      bidirectional: isRTL,
    }),
    new Paragraph({ children: [], spacing: { before: 200 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: bookData.genre,
          size: 24,
          italics: true,
          font: bodyFont,
        }),
      ],
      alignment: AlignmentType.CENTER,
      bidirectional: isRTL,
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ========== COPYRIGHT PAGE ==========
  const copyrightPage: Paragraph[] = [
    new Paragraph({ children: [], spacing: { before: 6000 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: `© ${new Date().getFullYear()} ${bookData.authorName}`,
          size: 20,
          font: bodyFont,
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      bidirectional: isRTL,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'כל הזכויות שמורות',
          size: 20,
          font: bodyFont,
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      bidirectional: isRTL,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'נוצר באמצעות MeStory',
          size: 18,
          font: bodyFont,
          color: '999999',
        }),
      ],
      alignment: AlignmentType.CENTER,
      bidirectional: isRTL,
    }),
    new Paragraph({ children: [new PageBreak()] })
  ];

  // ========== TABLE OF CONTENTS ==========
  const tocPage: Paragraph[] = [];
  if (bookData.pageLayout.includeTableOfContents && bookData.chapters.length > 1) {
    tocPage.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'תוכן עניינים',
            bold: true,
            size: 48,
            font: headingFont,
          }),
        ],
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        bidirectional: isRTL,
      }),
      new Paragraph({ children: [], spacing: { before: 400 } })
    );

    bookData.chapters.forEach((chapter, index) => {
      tocPage.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${chapter.title}`,
              size: 24,
              font: bodyFont,
            }),
          ],
          spacing: { before: 100, after: 100 },
          alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
          bidirectional: isRTL,
        })
      );
    });

    // Add characters and story context to TOC
    if (bookData.characters.length > 0) {
      tocPage.push(
        new Paragraph({ children: [], spacing: { before: 200 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'דמויות הספר',
              size: 24,
              font: bodyFont,
            }),
          ],
          alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
          bidirectional: isRTL,
        })
      );
    }

    if (bookData.storyContext) {
      tocPage.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'הסיפור מאחורי הספר',
              size: 24,
              font: bodyFont,
            }),
          ],
          alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
          bidirectional: isRTL,
        })
      );
    }

    tocPage.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // ========== CHAPTERS ==========
  const chapterPages: Paragraph[] = [];

  bookData.chapters.forEach((chapter, chapterIndex) => {
    // Chapter number
    chapterPages.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `פרק ${chapterIndex + 1}`,
            size: 28,
            font: bodyFont,
            color: '666666',
          }),
        ],
        alignment: AlignmentType.CENTER,
        bidirectional: isRTL,
      })
    );

    // Chapter title
    chapterPages.push(
      new Paragraph({
        children: [
          new TextRun({
            text: chapter.title,
            bold: true,
            size: 40,
            font: headingFont,
          }),
        ],
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400 },
        bidirectional: isRTL,
      })
    );

    // Chapter images
    const imgBuffers = chapterImageBuffers.get(chapterIndex);
    if (imgBuffers && imgBuffers.length > 0) {
      for (const imgBuffer of imgBuffers) {
        try {
          chapterPages.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imgBuffer,
                  transformation: {
                    width: 400,
                    height: 300,
                  },
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 200 },
            })
          );
        } catch (e) {
          console.error('Error adding chapter image to DOCX:', e);
        }
      }
    }

    // Chapter content
    const paragraphs = chapter.content.split(/\n\n+/);
    paragraphs.forEach((para) => {
      if (para.trim()) {
        chapterPages.push(
          new Paragraph({
            children: [
              new TextRun({
                text: para.trim(),
                size: fontSize,
                font: bodyFont,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              after: 200,
              line: Math.round(bookData.pageLayout.lineHeight * 240),
            },
            bidirectional: isRTL,
          })
        );
      }
    });

    // Page break after each chapter (except last)
    if (chapterIndex < bookData.chapters.length - 1) {
      chapterPages.push(new Paragraph({ children: [new PageBreak()] }));
    }
  });

  // ========== CHARACTERS SECTION ==========
  const charactersSection: Paragraph[] = [];
  if (bookData.characters.length > 0) {
    charactersSection.push(
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'דמויות הספר',
            bold: true,
            size: 48,
            font: headingFont,
          }),
        ],
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        bidirectional: isRTL,
      }),
      new Paragraph({ children: [], spacing: { before: 400 } })
    );

    bookData.characters.forEach((character) => {
      // Character name
      charactersSection.push(
        new Paragraph({
          children: [
            new TextRun({
              text: character.name + (character.age ? ` (גיל ${character.age})` : ''),
              bold: true,
              size: 32,
              font: headingFont,
            }),
          ],
          alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
          spacing: { before: 300 },
          bidirectional: isRTL,
        })
      );

      // Description
      if (character.description) {
        charactersSection.push(
          new Paragraph({
            children: [
              new TextRun({
                text: character.description,
                size: fontSize,
                font: bodyFont,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 100, after: 100 },
            bidirectional: isRTL,
          })
        );
      }

      // Traits
      if (character.traits && character.traits.length > 0) {
        charactersSection.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'תכונות: ',
                bold: true,
                size: 22,
                font: bodyFont,
              }),
              new TextRun({
                text: character.traits.join(', '),
                size: 22,
                font: bodyFont,
              }),
            ],
            bidirectional: isRTL,
          })
        );
      }

      // Backstory
      if (character.backstory) {
        charactersSection.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'רקע: ',
                bold: true,
                size: 22,
                font: bodyFont,
              }),
              new TextRun({
                text: character.backstory,
                size: 22,
                font: bodyFont,
              }),
            ],
            bidirectional: isRTL,
          })
        );
      }

      // Goals
      if (character.goals) {
        charactersSection.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'מטרות: ',
                bold: true,
                size: 22,
                font: bodyFont,
              }),
              new TextRun({
                text: character.goals,
                size: 22,
                font: bodyFont,
              }),
            ],
            bidirectional: isRTL,
          })
        );
      }

      // Arc
      if (character.arc) {
        charactersSection.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'התפתחות: ',
                bold: true,
                size: 22,
                font: bodyFont,
              }),
              new TextRun({
                text: character.arc,
                size: 22,
                font: bodyFont,
              }),
            ],
            spacing: { after: 200 },
            bidirectional: isRTL,
          })
        );
      }
    });
  }

  // ========== STORY CONTEXT SECTION ==========
  const storyContextSection: Paragraph[] = [];
  if (bookData.storyContext) {
    storyContextSection.push(
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'הסיפור מאחורי הספר',
            bold: true,
            size: 48,
            font: headingFont,
          }),
        ],
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        bidirectional: isRTL,
      }),
      new Paragraph({ children: [], spacing: { before: 400 } })
    );

    const contextSections = [
      { title: 'נושא מרכזי', content: bookData.storyContext.theme },
      { title: 'עולם הסיפור', content: bookData.storyContext.setting },
      { title: 'הקונפליקט', content: bookData.storyContext.conflict },
      { title: 'נקודות מפתח', content: bookData.storyContext.keyPoints },
      { title: 'שיא הסיפור', content: bookData.storyContext.climax },
      { title: 'הסיום', content: bookData.storyContext.resolution },
    ];

    contextSections.forEach((section) => {
      if (section.content) {
        storyContextSection.push(
          new Paragraph({
            children: [
              new TextRun({
                text: section.title,
                bold: true,
                size: 28,
                font: headingFont,
              }),
            ],
            alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
            spacing: { before: 300 },
            bidirectional: isRTL,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: section.content,
                size: fontSize,
                font: bodyFont,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 100, after: 200 },
            bidirectional: isRTL,
          })
        );
      }
    });

    // Voice interview responses
    if (bookData.storyContext.voiceInterview?.responses?.length) {
      storyContextSection.push(
        new Paragraph({ children: [], spacing: { before: 400 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'תשובות מהראיון',
              bold: true,
              size: 32,
              font: headingFont,
            }),
          ],
          alignment: AlignmentType.CENTER,
          bidirectional: isRTL,
        }),
        new Paragraph({ children: [], spacing: { before: 200 } })
      );

      bookData.storyContext.voiceInterview.responses.forEach((response) => {
        storyContextSection.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `שאלה: ${response.question}`,
                bold: true,
                size: 22,
                font: bodyFont,
                color: '444444',
              }),
            ],
            spacing: { before: 200 },
            bidirectional: isRTL,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: response.answer,
                size: fontSize,
                font: bodyFont,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 50, after: 150 },
            bidirectional: isRTL,
          })
        );
      });
    }
  }

  // ========== BACK MATTER ==========
  const backMatter: Paragraph[] = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'אודות הספר',
          bold: true,
          size: 40,
          font: headingFont,
        }),
      ],
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      bidirectional: isRTL,
    }),
    new Paragraph({ children: [], spacing: { before: 400 } }),
  ];

  // Synopsis
  const synopsisText = bookData.synopsis || bookData.description;
  if (synopsisText) {
    backMatter.push(
      new Paragraph({
        children: [
          new TextRun({
            text: synopsisText,
            size: fontSize,
            font: bodyFont,
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 400 },
        bidirectional: isRTL,
      })
    );
  }

  // Author bio
  if (bookData.coverDesign.authorBio) {
    backMatter.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'על המחבר',
            bold: true,
            size: 28,
            font: headingFont,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        bidirectional: isRTL,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: bookData.coverDesign.authorBio,
            size: fontSize,
            font: bodyFont,
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 200, after: 400 },
        bidirectional: isRTL,
      })
    );
  }

  // Statistics
  const wordCount = bookData.statistics?.wordCount || 0;
  const chapterCount = bookData.statistics?.chapterCount || bookData.chapters.length;
  backMatter.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${wordCount.toLocaleString('he-IL')} מילים • ${chapterCount} פרקים`,
          size: 20,
          italics: true,
          font: bodyFont,
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      bidirectional: isRTL,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'נוצר באמצעות MeStory',
          size: 18,
          font: bodyFont,
          color: '999999',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      bidirectional: isRTL,
    })
  );

  // ========== CREATE DOCUMENT ==========
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: pageDims.width,
              height: pageDims.height,
            },
            margin: marginTwips,
          },
        },
        headers: bookData.pageLayout.includeHeader ? {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: bookData.title,
                    size: 18,
                    font: bodyFont,
                    color: '999999',
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        } : undefined,
        footers: bookData.pageLayout.includePageNumbers ? {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    font: bodyFont,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        } : undefined,
        children: [
          ...titlePageContent,
          ...copyrightPage,
          ...tocPage,
          ...chapterPages,
          ...charactersSection,
          ...storyContextSection,
          ...backMatter,
        ],
      },
    ],
  });

  try {
    return await Packer.toBuffer(doc);
  } catch (error: any) {
    console.error('Failed to generate DOCX buffer:', error);
    throw new Error(`Failed to generate DOCX: ${error.message}`);
  }
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

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
