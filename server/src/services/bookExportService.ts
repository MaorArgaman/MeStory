import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, AlignmentType, ImageRun, Header, Footer, PageNumber } from 'docx';
import { Book, IChapter, ICharacter, IPageImage, IStoryContext } from '../models/Book';
import { User } from '../models/User';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

// ============================================================================
// INTERFACES
// ============================================================================

interface ChapterData {
  title: string;
  content: string;
  formattedContent: FormattedSegment[]; // Rich text segments with formatting
  wordCount: number;
  images: PageImageData[];
}

// Text segment with formatting information
interface FormattedSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  isHeading?: boolean;
  headingLevel?: number;
  isListItem?: boolean;
  isParagraphBreak?: boolean;
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
// MAIN EXPORT FUNCTION
// ============================================================================

export interface ExportResult {
  buffer: Buffer;
  mimeType: string;
  filename: string;
  warnings: string[];
}

/**
 * Main export function - generates PDF or DOCX based on format
 */
export async function exportBook(bookId: string, format: 'pdf' | 'docx'): Promise<ExportResult> {
  const warnings: string[] = [];

  try {
    if (format === 'pdf') {
      const buffer = await generatePDF(bookId);
      if (!buffer) {
        throw new Error('PDF generation returned empty buffer');
      }
      return {
        buffer,
        mimeType: 'application/pdf',
        filename: `book-${bookId}.pdf`,
        warnings,
      };
    } else if (format === 'docx') {
      const buffer = await generateDOCX(bookId);
      if (!buffer) {
        throw new Error('DOCX generation returned empty buffer');
      }
      return {
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        filename: `book-${bookId}.docx`,
        warnings,
      };
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error: any) {
    console.error(`Export failed for book ${bookId} (${format}):`, error);
    throw error;
  }
}

// ============================================================================
// I18N LABELS
// ============================================================================

const i18nLabels = {
  he: {
    allRightsReserved: 'כל הזכויות שמורות',
    createdWith: 'נוצר באמצעות MeStory',
    tableOfContents: 'תוכן עניינים',
    bookCharacters: 'דמויות הספר',
    characters: 'דמויות',
    chapter: 'פרק',
    chapterWithoutName: 'פרק ללא שם',
    unknownAuthor: 'מחבר לא ידוע',
    fiction: 'סיפורת',
    age: 'גיל',
    traits: 'תכונות',
    backstory: 'רקע',
    goals: 'מטרות',
    arc: 'התפתחות',
    storyBehindBook: 'הסיפור מאחורי הספר',
    mainTheme: 'נושא מרכזי',
    storyWorld: 'עולם הסיפור',
    conflict: 'הקונפליקט',
    keyPoints: 'נקודות מפתח',
    climax: 'שיא הסיפור',
    ending: 'הסיום',
    words: 'מילים',
    chapters: 'פרקים',
    interviewResponses: 'תשובות מהראיון',
    question: 'שאלה',
    aboutAuthor: 'על המחבר',
    aboutBook: 'אודות הספר',
  },
  en: {
    allRightsReserved: 'All Rights Reserved',
    createdWith: 'Created with MeStory',
    tableOfContents: 'Table of Contents',
    bookCharacters: 'Book Characters',
    characters: 'Characters',
    chapter: 'Chapter',
    chapterWithoutName: 'Untitled Chapter',
    unknownAuthor: 'Unknown Author',
    fiction: 'Fiction',
    age: 'Age',
    traits: 'Traits',
    backstory: 'Backstory',
    goals: 'Goals',
    arc: 'Character Arc',
    storyBehindBook: 'The Story Behind the Book',
    mainTheme: 'Main Theme',
    storyWorld: 'Story World',
    conflict: 'The Conflict',
    keyPoints: 'Key Points',
    climax: 'Story Climax',
    ending: 'The Ending',
    words: 'words',
    chapters: 'chapters',
    interviewResponses: 'Interview Responses',
    question: 'Question',
    aboutAuthor: 'About the Author',
    aboutBook: 'About the Book',
  },
};

type LangKey = keyof typeof i18nLabels;

function getLabels(language: string) {
  const lang: LangKey = language === 'he' ? 'he' : 'en';
  return i18nLabels[lang];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Strip HTML tags from content while preserving paragraph structure
 * Used for plain text extraction (word count, simple display)
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
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  return text
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
    .replace(/&ndash;/g, '–');
}

/**
 * Parse HTML content and extract formatted segments
 * Preserves bold, italic, underline, headings, and list formatting
 */
function parseHtmlToFormattedSegments(html: string): FormattedSegment[] {
  if (!html) return [];

  const segments: FormattedSegment[] = [];

  // Normalize line breaks
  let content = html
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Process block-level elements
  const blocks = content.split(/<\/(?:p|div|h[1-6]|li)>/gi);

  for (let block of blocks) {
    if (!block.trim()) continue;

    // Check for heading
    const headingMatch = block.match(/<h([1-6])[^>]*>/i);
    const isHeading = !!headingMatch;
    const headingLevel = headingMatch ? parseInt(headingMatch[1]) : undefined;

    // Check for list item
    const isListItem = /<li[^>]*>/i.test(block);

    // Remove opening block tags
    block = block.replace(/<(?:p|div|h[1-6]|li)[^>]*>/gi, '');

    // Handle line breaks within block
    block = block.replace(/<br\s*\/?>/gi, '\n');

    // Parse inline formatting
    const inlineSegments = parseInlineFormatting(block);

    for (const seg of inlineSegments) {
      segments.push({
        ...seg,
        isHeading,
        headingLevel,
        isListItem: isListItem && seg === inlineSegments[0],
      });
    }

    // Add paragraph break after block
    segments.push({ text: '', isParagraphBreak: true });
  }

  return segments;
}

/**
 * Parse inline formatting (bold, italic, underline) from HTML
 */
function parseInlineFormatting(html: string): FormattedSegment[] {
  const segments: FormattedSegment[] = [];

  // Simple regex-based parsing for common formatting tags
  // This handles nested tags by processing from innermost to outermost

  interface TextNode {
    text: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
  }

  const nodes: TextNode[] = [];
  let remaining = html;

  // Pattern to match formatting tags with their content
  const tagPattern = /<(strong|b|em|i|u|span[^>]*style[^>]*(?:font-weight:\s*bold|font-style:\s*italic|text-decoration:\s*underline)[^>]*)>([^<]*)<\/\1>/gi;

  // First pass: extract all plain text and formatted segments
  let lastIndex = 0;
  const matches: Array<{index: number, length: number, text: string, tag: string}> = [];

  // Find all formatting tags
  let match;
  const strongPattern = /<(strong|b)>(.*?)<\/\1>/gis;
  const emPattern = /<(em|i)>(.*?)<\/\1>/gis;
  const uPattern = /<u>(.*?)<\/u>/gis;

  // Process the HTML by splitting on tags and tracking state
  const processedText = html
    // First, mark formatting boundaries
    .replace(/<(strong|b)>/gi, '{{BOLD_START}}')
    .replace(/<\/(strong|b)>/gi, '{{BOLD_END}}')
    .replace(/<(em|i)>/gi, '{{ITALIC_START}}')
    .replace(/<\/(em|i)>/gi, '{{ITALIC_END}}')
    .replace(/<u>/gi, '{{UNDERLINE_START}}')
    .replace(/<\/u>/gi, '{{UNDERLINE_END}}')
    // Remove other tags
    .replace(/<[^>]*>/g, '');

  // Parse the marked text
  let currentBold = false;
  let currentItalic = false;
  let currentUnderline = false;
  let currentText = '';

  const parts = processedText.split(/({{(?:BOLD|ITALIC|UNDERLINE)_(?:START|END)}})/);

  for (const part of parts) {
    switch (part) {
      case '{{BOLD_START}}':
        if (currentText) {
          segments.push({
            text: decodeHtmlEntities(currentText),
            bold: currentBold,
            italic: currentItalic,
            underline: currentUnderline,
          });
          currentText = '';
        }
        currentBold = true;
        break;
      case '{{BOLD_END}}':
        if (currentText) {
          segments.push({
            text: decodeHtmlEntities(currentText),
            bold: currentBold,
            italic: currentItalic,
            underline: currentUnderline,
          });
          currentText = '';
        }
        currentBold = false;
        break;
      case '{{ITALIC_START}}':
        if (currentText) {
          segments.push({
            text: decodeHtmlEntities(currentText),
            bold: currentBold,
            italic: currentItalic,
            underline: currentUnderline,
          });
          currentText = '';
        }
        currentItalic = true;
        break;
      case '{{ITALIC_END}}':
        if (currentText) {
          segments.push({
            text: decodeHtmlEntities(currentText),
            bold: currentBold,
            italic: currentItalic,
            underline: currentUnderline,
          });
          currentText = '';
        }
        currentItalic = false;
        break;
      case '{{UNDERLINE_START}}':
        if (currentText) {
          segments.push({
            text: decodeHtmlEntities(currentText),
            bold: currentBold,
            italic: currentItalic,
            underline: currentUnderline,
          });
          currentText = '';
        }
        currentUnderline = true;
        break;
      case '{{UNDERLINE_END}}':
        if (currentText) {
          segments.push({
            text: decodeHtmlEntities(currentText),
            bold: currentBold,
            italic: currentItalic,
            underline: currentUnderline,
          });
          currentText = '';
        }
        currentUnderline = false;
        break;
      default:
        currentText += part;
        break;
    }
  }

  // Add remaining text
  if (currentText) {
    segments.push({
      text: decodeHtmlEntities(currentText),
      bold: currentBold,
      italic: currentItalic,
      underline: currentUnderline,
    });
  }

  // Filter out empty segments
  return segments.filter(s => s.text.length > 0 || s.isParagraphBreak);
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

// Global warnings collector for export process
let exportWarnings: string[] = [];

/**
 * Clear export warnings
 */
function clearExportWarnings(): void {
  exportWarnings = [];
}

/**
 * Add export warning
 */
function addExportWarning(warning: string): void {
  exportWarnings.push(warning);
  console.warn(`[Export Warning] ${warning}`);
}

/**
 * Get all export warnings
 */
function getExportWarnings(): string[] {
  return [...exportWarnings];
}

/**
 * Fetch image from URL and return as buffer
 * Logs warnings when images fail to load
 */
async function fetchImageAsBuffer(url: string, context?: string): Promise<Buffer | null> {
  try {
    if (!url) return null;

    // Handle relative URLs
    if (url.startsWith('/')) {
      const localPath = path.join(__dirname, '../../public', url);
      if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath);
      } else {
        addExportWarning(`Image not found: ${url} ${context ? `(${context})` : ''}`);
        return null;
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
  } catch (error: any) {
    const errorMsg = error.message || 'Unknown error';
    addExportWarning(`Failed to load image: ${url} - ${errorMsg} ${context ? `(${context})` : ''}`);
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
 * Process RTL text for proper PDF rendering
 * For Hebrew text, we just return the text as-is and let the font handle RTL
 * The font (Rubik/NotoSans) has proper RTL support with correct glyph ordering
 */
function processRTLText(text: string, isRTL: boolean): string {
  // Return text as-is - don't manipulate RTL text manually
  // Modern Unicode fonts handle bidirectional text correctly
  return text || '';
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
  const book = await Book.findById(bookId);
  if (!book) {
    throw new Error('Book not found');
  }

  // Get author details separately (Supabase doesn't support populate)
  const author = await User.findById(book.author);

  // Extract cover design data - prioritize AI design if completed (matching UI behavior)
  const coverDesignData = book.coverDesign as any;
  const aiDesignData = book.aiDesignState?.design as any;
  const aiDesignCompleted = book.aiDesignState?.status === 'completed';

  // Helper to clean CSS font-family strings to simple font names
  const cleanFontName = (font: string): string => {
    if (!font) return 'Helvetica';
    // Remove quotes and get first font in the list
    return font.replace(/["']/g, '').split(',')[0].trim() || 'Helvetica';
  };

  const getCoverColor = (): string => {
    // AI design takes priority when completed
    if (aiDesignCompleted && aiDesignData?.covers?.front?.backgroundColor) {
      return aiDesignData.covers.front.backgroundColor;
    }
    if (coverDesignData?.coverColor) return coverDesignData.coverColor;
    if (coverDesignData?.backgroundColor) return coverDesignData.backgroundColor;
    if (coverDesignData?.front?.backgroundColor) return coverDesignData.front.backgroundColor;
    if (aiDesignData?.covers?.front?.backgroundColor) return aiDesignData.covers.front.backgroundColor;
    return '#1a1a2e';
  };

  const getTextColor = (): string => {
    // AI design takes priority when completed
    if (aiDesignCompleted && aiDesignData?.typography?.colors?.text) {
      return aiDesignData.typography.colors.text;
    }
    if (coverDesignData?.textColor) return coverDesignData.textColor;
    if (coverDesignData?.front?.title?.color) return coverDesignData.front.title.color;
    if (aiDesignData?.typography?.colors?.text) return aiDesignData.typography.colors.text;
    return '#ffffff';
  };

  const getFontFamily = (): string => {
    // AI design takes priority when completed
    if (aiDesignCompleted && aiDesignData?.typography?.titleFont) {
      return cleanFontName(aiDesignData.typography.titleFont);
    }
    if (coverDesignData?.fontFamily) return cleanFontName(coverDesignData.fontFamily);
    if (coverDesignData?.titleFont) return cleanFontName(coverDesignData.titleFont);
    if (coverDesignData?.front?.title?.font) return cleanFontName(coverDesignData.front.title.font);
    if (aiDesignData?.typography?.bodyFont) return cleanFontName(aiDesignData.typography.bodyFont);
    return 'Helvetica';
  };

  const getFrontImageUrl = (): string | undefined => {
    // AI design takes priority when completed
    if (aiDesignCompleted && aiDesignData?.covers?.front?.generatedImageUrl) {
      return aiDesignData.covers.front.generatedImageUrl;
    }
    if (coverDesignData?.imageUrl) return coverDesignData.imageUrl;
    if (coverDesignData?.front?.imageUrl) return coverDesignData.front.imageUrl;
    if (aiDesignData?.covers?.front?.generatedImageUrl) return aiDesignData.covers.front.generatedImageUrl;
    return undefined;
  };

  const getBackImageUrl = (): string | undefined => {
    // AI design takes priority when completed
    if (aiDesignCompleted && aiDesignData?.covers?.back?.generatedImageUrl) {
      return aiDesignData.covers.back.generatedImageUrl;
    }
    if (coverDesignData?.back?.imageUrl) return coverDesignData.back.imageUrl;
    if (aiDesignData?.covers?.back?.generatedImageUrl) return aiDesignData.covers.back.generatedImageUrl;
    return undefined;
  };

  // Get author name - prioritize actual user profile, then fallback to saved design data
  const getAuthorName = (): string => {
    // Priority 1: Actual author name from User table
    if (author?.name) return author.name;
    // displayName might exist even though it's not in the type definition
    if ((author as any)?.displayName) return (author as any).displayName;
    // Priority 2: Saved design data (may be outdated)
    if (coverDesignData?.front?.authorName?.text) return coverDesignData.front.authorName.text;
    if (coverDesignData?.authorName) return coverDesignData.authorName;
    if (aiDesignData?.covers?.front?.author) return aiDesignData.covers.front.author;
    // Priority 3: Email fallback
    return author?.email?.split('@')[0] || labels.unknownAuthor;
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

  // Add images from pageLayout.pages (the primary source - what user sees in UI)
  const layoutPages = book.pageLayout?.pages || [];
  layoutPages.forEach((page: any) => {
    if (page.chapterIndex !== undefined && page.images && Array.isArray(page.images)) {
      const images = chapterImagesMap.get(page.chapterIndex) || [];
      page.images.forEach((img: any) => {
        if (img.url) {
          images.push({
            url: img.url,
            x: img.x || 0,
            y: img.y || 0,
            width: img.width || 100,
            height: img.height || 100,
            isAiGenerated: false,
          });
        }
      });
      if (images.length > 0) {
        chapterImagesMap.set(page.chapterIndex, images);
      }
    }
  });

  // Also add legacy pageImages (fallback - treating pageIndex as chapter index)
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

  // Get language-aware labels
  const labels = getLabels(book.language || 'he');

  // Extract chapters with images and formatted content
  const chapters: ChapterData[] = (book.chapters || []).map((ch: IChapter, index: number) => ({
    title: ch.title || labels.chapterWithoutName,
    content: stripHtml(ch.content || ''),
    formattedContent: parseHtmlToFormattedSegments(ch.content || ''),
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
    authorName: getAuthorName(),
    genre: book.genre || labels.fiction,
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

  // Get language-aware labels
  const labels = getLabels(bookData.language);

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
  const frontCoverImage = await fetchImageAsBuffer(bookData.coverDesign.frontImageUrl || '', 'Front Cover');
  const backCoverImage = await fetchImageAsBuffer(bookData.coverDesign.backImageUrl || '', 'Back Cover');

  // Fetch chapter images
  const chapterImages: Map<number, Buffer[]> = new Map();
  for (let i = 0; i < bookData.chapters.length; i++) {
    const chapter = bookData.chapters[i];
    const images: Buffer[] = [];
    // Safely iterate over chapter images (may be undefined)
    const chapterImgs = chapter.images || [];
    for (let j = 0; j < chapterImgs.length; j++) {
      const img = chapterImgs[j];
      const buffer = await fetchImageAsBuffer(img.url, `Chapter ${i + 1} "${chapter.title}" - Image ${j + 1}`);
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

    // Register Hebrew fonts - Rubik has full Hebrew + Latin + numbers support
    const fontPath = path.join(__dirname, '../assets/fonts/Rubik-Regular.ttf');
    const boldFontPath = path.join(__dirname, '../assets/fonts/Rubik-Bold.ttf');
    // Fallback to NotoSans (full Unicode support) if Rubik not available
    const fallbackFontPath = path.join(__dirname, '../assets/fonts/NotoSans-Regular.ttf');
    const fallbackBoldFontPath = path.join(__dirname, '../assets/fonts/NotoSans-Bold.ttf');

    // Sanity-check that a font file is a real TTF/OTF before handing it to PDFKit.
    // We hit a case where someone downloaded an HTML error page as `.ttf`, fs.existsSync
    // returned true, and registerFont crashed with "Unknown font format".
    // Valid magic: 00 01 00 00 (TTF), 74 72 75 65 ("true"), 4F 54 54 4F ("OTTO").
    const isValidFontFile = (p: string): boolean => {
      try {
        const fd = fs.openSync(p, 'r');
        const buf = Buffer.alloc(4);
        fs.readSync(fd, buf, 0, 4, 0);
        fs.closeSync(fd);
        const magic = buf.toString('hex');
        return magic === '00010000' || magic === '74727565' || magic === '4f54544f';
      } catch {
        return false;
      }
    };

    let mainFont = 'Helvetica';
    let boldFont = 'Helvetica-Bold';
    let hebrewFontAvailable = false;

    if (isValidFontFile(fontPath)) {
      doc.registerFont('Hebrew', fontPath);
      mainFont = 'Hebrew';
      hebrewFontAvailable = true;
    } else if (isValidFontFile(fallbackFontPath)) {
      doc.registerFont('Hebrew', fallbackFontPath);
      mainFont = 'Hebrew';
      hebrewFontAvailable = true;
      addExportWarning('Rubik font not available or invalid, using NotoSans as fallback.');
    } else {
      addExportWarning('Hebrew font not found. Using Helvetica as fallback - Hebrew text may not display correctly.');
    }
    if (isValidFontFile(boldFontPath)) {
      doc.registerFont('Hebrew-Bold', boldFontPath);
      boldFont = 'Hebrew-Bold';
    } else if (isValidFontFile(fallbackBoldFontPath)) {
      doc.registerFont('Hebrew-Bold', fallbackBoldFontPath);
      boldFont = 'Hebrew-Bold';
    } else if (hebrewFontAvailable) {
      addExportWarning('Hebrew bold font not found. Bold text will use regular Hebrew font.');
      boldFont = 'Hebrew';
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

    // Add cover image if available - position at top third of page
    let titleYPosition = 200; // Default position when no image
    const coverImageY = 60;
    const maxImageHeight = pageDims.height * 0.4; // Max 40% of page height

    if (frontCoverImage) {
      try {
        const imgWidth = pageDims.width * 0.55;
        const imgX = (pageDims.width - imgWidth) / 2;
        doc.image(frontCoverImage, imgX, coverImageY, {
          width: imgWidth,
          fit: [imgWidth, maxImageHeight],
          align: 'center',
        });
        // Position title below the image with padding
        titleYPosition = coverImageY + maxImageHeight + 30;
      } catch (e) {
        console.error('Error adding cover image:', e);
      }
    }

    // Title - positioned below image or at default location
    doc.fillColor(`rgb(${textColor.r}, ${textColor.g}, ${textColor.b})`)
      .font(boldFont)
      .fontSize(36)
      .text(processRTLText(bookData.title, isRTL), margins.left, titleYPosition, {
        align: 'center',
        width: contentWidth,
      });

    // Subtitle (genre)
    doc.font(mainFont)
      .fontSize(14)
      .text(processRTLText(bookData.genre, isRTL), margins.left, doc.y + 15, {
        align: 'center',
        width: contentWidth,
      });

    // Author - at bottom of page
    doc.font(mainFont)
      .fontSize(20)
      .text(processRTLText(bookData.authorName, isRTL), margins.left, pageDims.height - 120, {
        align: 'center',
        width: contentWidth,
      });

    // ========== TITLE PAGE ==========
    doc.addPage();
    pageNum++;

    doc.fillColor('black')
      .font(boldFont)
      .fontSize(32)
      .text(processRTLText(bookData.title, isRTL), margins.left, pageDims.height / 3, {
        align: 'center',
        width: contentWidth,
      });

    doc.font(mainFont)
      .fontSize(18)
      .text(processRTLText(bookData.authorName, isRTL), margins.left, doc.y + 40, {
        align: 'center',
        width: contentWidth,
      });

    doc.fontSize(12)
      .text(processRTLText(bookData.genre, isRTL), margins.left, doc.y + 20, {
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
    doc.text(`© ${year} ${processRTLText(bookData.authorName, isRTL)}`, margins.left, pageDims.height - 200, {
      align: 'center',
      width: contentWidth,
    });
    doc.text(labels.allRightsReserved, margins.left, doc.y + 15, {
      align: 'center',
      width: contentWidth,
    });
    doc.text(labels.createdWith, margins.left, doc.y + 15, {
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
        .text(processRTLText(bookData.dedication, isRTL), margins.left, pageDims.height / 3, {
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
        .text(labels.tableOfContents, margins.left, margins.top, {
          align: 'center',
          width: contentWidth,
        });

      doc.moveDown(2);
      doc.font(mainFont).fontSize(12);

      bookData.chapters.forEach((chapter, index) => {
        const chapterEntry = isRTL ? `${processRTLText(chapter.title, isRTL)} .${index + 1}` : `${index + 1}. ${chapter.title}`;
        doc.text(chapterEntry, margins.left, doc.y, {
          continued: false,
          align: isRTL ? 'right' : 'left',
          width: contentWidth,
        });
        doc.moveDown(0.5);
      });

      // Add characters to TOC if any
      if (bookData.characters.length > 0) {
        doc.moveDown(1);
        doc.text(labels.characters, margins.left, doc.y, {
          align: isRTL ? 'right' : 'left',
          width: contentWidth,
        });
      }
    }

    // ========== CHAPTERS ==========
    bookData.chapters.forEach((chapter, chapterIndex) => {
      doc.addPage();
      pageNum++;

      // Chapter title - check if title already contains chapter number/word
      const titleHasChapter = chapter.title.toLowerCase().includes('chapter') ||
                              chapter.title.includes('פרק') ||
                              /^\d+[\.\)\-\s]/.test(chapter.title);

      // Only show chapter number if title doesn't already include it
      if (!titleHasChapter) {
        doc.fillColor('#666666')
          .font(mainFont)
          .fontSize(12)
          .text(`${labels.chapter} ${chapterIndex + 1}`, margins.left, margins.top, {
            align: 'center',
            width: contentWidth,
          });
      }

      // Chapter title
      doc.fillColor('black')
        .font(boldFont)
        .fontSize(20)
        .text(processRTLText(chapter.title, isRTL), margins.left, titleHasChapter ? margins.top : doc.y + 10, {
          align: 'center',
          width: contentWidth,
        });

      doc.moveDown(2);

      // Chapter images at the beginning
      const images = chapterImages.get(chapterIndex);
      if (images && images.length > 0) {
        const maxImageWidth = contentWidth * 0.75;
        const maxImageHeight = pageDims.height * 0.35; // Max 35% of page height per image

        for (const imgBuffer of images) {
          try {
            const currentY = doc.y;

            // Check if we need a new page before adding image
            if (currentY > pageDims.height - margins.bottom - maxImageHeight - 50) {
              doc.addPage();
              pageNum++;
            }

            const imgX = margins.left + (contentWidth - maxImageWidth) / 2;
            const imgY = doc.y;

            // Add image with fit constraint
            const imgInfo = doc.image(imgBuffer, imgX, imgY, {
              fit: [maxImageWidth, maxImageHeight],
              align: 'center',
              valign: 'center',
            });

            // Calculate actual rendered height based on fit dimensions
            // PDFKit returns the image info which we can use
            // For safety, move by the max height plus padding
            doc.y = imgY + maxImageHeight + 30;

            // Add some space after image
            doc.moveDown(1);
          } catch (e) {
            console.error('Error adding chapter image:', e);
            // Continue with text even if image fails
          }
        }
      }

      // Chapter content - combine all segments into unified paragraphs for proper rendering
      doc.fillColor('black');
      const fontSize = bookData.pageLayout.fontSize;
      const lineGap = (bookData.pageLayout.lineHeight - 1) * fontSize;

      // Combine segments into paragraphs to avoid fragmentation
      const paragraphs: string[] = [];
      let currentParagraph = '';

      for (const segment of chapter.formattedContent) {
        if (segment.isParagraphBreak) {
          if (currentParagraph.trim()) {
            paragraphs.push(currentParagraph.trim());
          }
          currentParagraph = '';
          continue;
        }

        if (segment.isListItem) {
          if (currentParagraph.trim()) {
            paragraphs.push(currentParagraph.trim());
          }
          currentParagraph = '• ';
          continue;
        }

        if (segment.text && segment.text.trim()) {
          currentParagraph += segment.text;
        }
      }

      // Don't forget the last paragraph
      if (currentParagraph.trim()) {
        paragraphs.push(currentParagraph.trim());
      }

      // Render each paragraph as a single text block
      doc.font(mainFont).fontSize(fontSize);

      const textOptions: any = {
        align: isRTL ? 'right' : 'justify',
        width: contentWidth,
        lineGap: lineGap,
      };

      for (const paragraph of paragraphs) {
        // Only add a manual page break if we're near the bottom AND not already
        // at the top of a fresh page (to avoid double page-breaks after PDFKit auto-flow)
        const nearBottom = doc.y > pageDims.height - margins.bottom - 80;
        const alreadyAtTop = doc.y <= margins.top + 20;
        if (nearBottom && !alreadyAtTop) {
          doc.addPage();
          pageNum++;
        }

        doc.text(processRTLText(paragraph, isRTL), margins.left, doc.y, textOptions);
        doc.moveDown(0.5);
      }

      // Add spacing after chapter
      doc.moveDown(1);
    });

    // ========== CHARACTERS SECTION ==========
    if (bookData.characters.length > 0) {
      doc.addPage();
      pageNum++;

      doc.fillColor('black')
        .font(boldFont)
        .fontSize(24)
        .text(labels.bookCharacters, margins.left, margins.top, {
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
        const charNameText = character.age
          ? (isRTL ? `(${character.age} ${labels.age}) ${processRTLText(character.name, isRTL)}` : `${character.name} (${labels.age} ${character.age})`)
          : processRTLText(character.name, isRTL);
        doc.font(boldFont)
          .fontSize(16)
          .text(charNameText, margins.left, doc.y, {
            align: isRTL ? 'right' : 'left',
            width: contentWidth,
          });

        doc.moveDown(0.5);
        doc.font(mainFont).fontSize(11);

        // Description
        if (character.description) {
          doc.text(processRTLText(character.description, isRTL), margins.left, doc.y, {
            align: isRTL ? 'right' : 'justify',
            width: contentWidth,
          });
          doc.moveDown(0.5);
        }

        // Traits
        if (character.traits && character.traits.length > 0) {
          const traitsText = processRTLText(character.traits.join(', '), isRTL);
          if (isRTL) {
            doc.font(mainFont).fontSize(10).text(traitsText, { continued: true });
            doc.font(boldFont).text(` :${labels.traits}`);
          } else {
            doc.font(boldFont).fontSize(10).text(`${labels.traits}: `, { continued: true });
            doc.font(mainFont).text(traitsText);
          }
          doc.moveDown(0.3);
        }

        // Backstory
        if (character.backstory) {
          const backstoryText = processRTLText(character.backstory, isRTL);
          if (isRTL) {
            doc.font(mainFont).fontSize(10).text(backstoryText, { continued: true });
            doc.font(boldFont).text(` :${labels.backstory}`);
          } else {
            doc.font(boldFont).fontSize(10).text(`${labels.backstory}: `, { continued: true });
            doc.font(mainFont).text(backstoryText);
          }
          doc.moveDown(0.3);
        }

        // Goals
        if (character.goals) {
          const goalsText = processRTLText(character.goals, isRTL);
          if (isRTL) {
            doc.font(mainFont).fontSize(10).text(goalsText, { continued: true });
            doc.font(boldFont).text(` :${labels.goals}`);
          } else {
            doc.font(boldFont).fontSize(10).text(`${labels.goals}: `, { continued: true });
            doc.font(mainFont).text(goalsText);
          }
          doc.moveDown(0.3);
        }

        // Arc
        if (character.arc) {
          const arcText = processRTLText(character.arc, isRTL);
          if (isRTL) {
            doc.font(mainFont).fontSize(10).text(arcText, { continued: true });
            doc.font(boldFont).text(` :${labels.arc}`);
          } else {
            doc.font(boldFont).fontSize(10).text(`${labels.arc}: `, { continued: true });
            doc.font(mainFont).text(arcText);
          }
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
        .text(labels.storyBehindBook, margins.left, margins.top, {
          align: 'center',
          width: contentWidth,
        });

      doc.moveDown(2);
      doc.font(mainFont).fontSize(11);

      const contextSections = [
        { title: labels.mainTheme, content: bookData.storyContext.theme },
        { title: labels.storyWorld, content: bookData.storyContext.setting },
        { title: labels.conflict, content: bookData.storyContext.conflict },
        { title: labels.keyPoints, content: bookData.storyContext.keyPoints },
        { title: labels.climax, content: bookData.storyContext.climax },
        { title: labels.ending, content: bookData.storyContext.resolution },
      ];

      contextSections.forEach((section) => {
        if (section.content) {
          if (doc.y > pageDims.height - margins.bottom - 80) {
            doc.addPage();
            pageNum++;
          }

          doc.font(boldFont)
            .fontSize(14)
            .text(processRTLText(section.title, isRTL), margins.left, doc.y, {
              align: isRTL ? 'right' : 'left',
              width: contentWidth,
            });

          doc.moveDown(0.5);
          doc.font(mainFont)
            .fontSize(11)
            .text(processRTLText(section.content, isRTL), margins.left, doc.y, {
              align: isRTL ? 'right' : 'justify',
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
          .text(labels.interviewResponses, margins.left, doc.y, {
            align: 'center',
            width: contentWidth,
          });

        doc.moveDown(1);

        bookData.storyContext.voiceInterview.responses.forEach((response) => {
          if (doc.y > pageDims.height - margins.bottom - 80) {
            doc.addPage();
            pageNum++;
          }

          const questionText = isRTL
            ? `${processRTLText(response.question, isRTL)} :${labels.question}`
            : `${labels.question}: ${response.question}`;
          doc.font(boldFont)
            .fontSize(11)
            .fillColor('#444444')
            .text(questionText, margins.left, doc.y, {
              align: isRTL ? 'right' : 'left',
              width: contentWidth,
            });

          doc.moveDown(0.3);
          doc.font(mainFont)
            .fillColor('black')
            .text(processRTLText(response.answer, isRTL), margins.left, doc.y, {
              align: isRTL ? 'right' : 'justify',
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

    // Back cover image - larger size (70% width for better visibility)
    let backSynopsisY = 80;
    if (backCoverImage) {
      try {
        const imgWidth = pageDims.width * 0.7; // Larger image - 70% of page width
        const imgX = (pageDims.width - imgWidth) / 2;
        const maxBackImageHeight = pageDims.height * 0.45; // 45% of page height
        doc.image(backCoverImage, imgX, 40, {
          fit: [imgWidth, maxBackImageHeight],
          align: 'center',
        });
        backSynopsisY = 40 + maxBackImageHeight + 30;
      } catch (e) {
        console.error('Error adding back cover image:', e);
      }
    }

    // Synopsis - ensure text color is set
    const synopsisText = bookData.synopsis || bookData.description;
    if (synopsisText) {
      doc.fillColor(`rgb(${textColor.r}, ${textColor.g}, ${textColor.b})`)
        .font(mainFont)
        .fontSize(11)
        .text(synopsisText, margins.left, backSynopsisY, {
          align: isRTL ? 'right' : 'justify',
          width: contentWidth,
        });
    }

    // Author bio - ensure text color is maintained
    if (bookData.coverDesign.authorBio) {
      doc.moveDown(1.5);
      doc.fillColor(`rgb(${textColor.r}, ${textColor.g}, ${textColor.b})`)
        .font(boldFont)
        .fontSize(11)
        .text(labels.aboutAuthor, margins.left, doc.y, {
          align: 'center',
          width: contentWidth,
        });
      doc.moveDown(0.5);
      doc.font(mainFont)
        .fontSize(10)
        .text(bookData.coverDesign.authorBio, margins.left, doc.y, {
          align: isRTL ? 'right' : 'justify',
          width: contentWidth,
        });
    }

    // Stats at bottom - ensure text color
    const locale = bookData.language === 'he' ? 'he-IL' : 'en-US';
    const statsText = isRTL
      ? `${labels.chapters} ${bookData.statistics.chapterCount} • ${labels.words} ${bookData.statistics.wordCount.toLocaleString(locale)}`
      : `${bookData.statistics.wordCount.toLocaleString(locale)} ${labels.words} • ${bookData.statistics.chapterCount} ${labels.chapters}`;
    doc.fillColor(`rgb(${textColor.r}, ${textColor.g}, ${textColor.b})`)
      .fontSize(10)
      .text(statsText, margins.left, pageDims.height - 100, {
        align: 'center',
        width: contentWidth,
      });

    // Author name
    doc.font(boldFont)
      .fontSize(14)
      .text(bookData.authorName, margins.left, pageDims.height - 70, {
        align: 'center',
        width: contentWidth,
      });

    // MeStory branding - slightly lighter version of text color
    doc.font(mainFont)
      .fontSize(8)
      .fillColor(`rgb(${Math.min(textColor.r + 50, 255)}, ${Math.min(textColor.g + 50, 255)}, ${Math.min(textColor.b + 50, 255)})`)
      .text(labels.createdWith, margins.left, pageDims.height - 40, {
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

  // Get language-aware labels
  const labels = getLabels(bookData.language);

  // Get page dimensions
  const pageDims = getDocxPageDimensions(bookData.pageLayout.pageSize);
  const marginTwips = {
    top: mmToTwips(bookData.pageLayout.margins.top),
    bottom: mmToTwips(bookData.pageLayout.margins.bottom),
    left: mmToTwips(bookData.pageLayout.margins.left),
    right: mmToTwips(bookData.pageLayout.margins.right),
  };

  // Fetch cover images for DOCX
  const frontCoverImage = await fetchImageAsBuffer(bookData.coverDesign.frontImageUrl || '', 'DOCX Front Cover');

  // Fetch chapter images
  const chapterImageBuffers: Map<number, Buffer[]> = new Map();
  for (let i = 0; i < bookData.chapters.length; i++) {
    const chapter = bookData.chapters[i];
    const buffers: Buffer[] = [];
    // Safely iterate over chapter images (may be undefined)
    const chapterImgs = chapter.images || [];
    for (let j = 0; j < chapterImgs.length; j++) {
      const img = chapterImgs[j];
      const buffer = await fetchImageAsBuffer(img.url, `DOCX Chapter ${i + 1} "${chapter.title}" - Image ${j + 1}`);
      if (buffer) {
        buffers.push(buffer);
      }
    }
    if (buffers.length > 0) {
      chapterImageBuffers.set(i, buffers);
    }
  }

  // Font configuration - use consistent fonts based on language
  const defaultFont = isRTL ? 'David' : 'Georgia';
  const bodyFont = bookData.coverDesign.fontFamily || bookData.pageLayout.bodyFont || bookData.aiDesign?.typography?.bodyFont || defaultFont;
  const headingFont = bookData.coverDesign.fontFamily || bookData.aiDesign?.typography?.headingFont || defaultFont;
  const fontSize = bookData.pageLayout.fontSize * 2; // Half-points

  // Color configuration for DOCX (hex without #)
  const titleTextColor = bookData.coverDesign.textColor?.replace('#', '') || '000000';

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
          color: titleTextColor,
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
          color: titleTextColor,
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
          color: titleTextColor,
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
          text: labels.allRightsReserved,
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
          text: labels.createdWith,
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
            text: labels.tableOfContents,
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
            text: `${labels.chapter} ${chapterIndex + 1}`,
            size: 28,
            font: bodyFont,
            color: '666666',
          }),
        ],
        alignment: AlignmentType.CENTER,
        bidirectional: isRTL,
      })
    );

    // Chapter title - using design heading color
    const headingColor = bookData.aiDesign?.typography?.colors?.heading?.replace('#', '') || titleTextColor;
    chapterPages.push(
      new Paragraph({
        children: [
          new TextRun({
            text: chapter.title,
            bold: true,
            size: 40,
            font: headingFont,
            color: headingColor,
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

  // ========== BACK MATTER / BACK COVER ==========
  // Get design colors for back cover (convert to hex without #)
  const coverTextColorHex = bookData.coverDesign.textColor?.replace('#', '') || '000000';

  const backMatter: Paragraph[] = [
    new Paragraph({ children: [new PageBreak()] }),
    // Book title on back cover
    new Paragraph({
      children: [
        new TextRun({
          text: bookData.title,
          bold: true,
          size: 48,
          font: headingFont,
          color: coverTextColorHex,
        }),
      ],
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      bidirectional: isRTL,
      spacing: { before: 200, after: 200 },
    }),
    // About the Book heading
    new Paragraph({
      children: [
        new TextRun({
          text: labels.aboutBook,
          bold: true,
          size: 32,
          font: headingFont,
          color: coverTextColorHex,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
      bidirectional: isRTL,
    }),
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
            color: coverTextColorHex,
          }),
        ],
        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
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
            text: labels.aboutAuthor,
            bold: true,
            size: 28,
            font: headingFont,
            color: coverTextColorHex,
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
            color: coverTextColorHex,
          }),
        ],
        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
        spacing: { before: 200, after: 400 },
        bidirectional: isRTL,
      })
    );
  }

  // Statistics
  const wordCount = bookData.statistics?.wordCount || 0;
  const chapterCount = bookData.statistics?.chapterCount || bookData.chapters.length;
  const statsLocale = bookData.language === 'he' ? 'he-IL' : 'en-US';
  backMatter.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${wordCount.toLocaleString(statsLocale)} ${labels.words} • ${chapterCount} ${labels.chapters}`,
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
          text: labels.createdWith,
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
            ],          }),
        } : undefined,
        children: [...titlePageContent, ...chapterPages, ...charactersSection, ...backMatter],
      },
    ],
  });

  // Serialize to buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
