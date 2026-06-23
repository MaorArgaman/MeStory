import { useState, useEffect, useRef, forwardRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore - react-pageflip has incomplete types
import HTMLFlipBook from 'react-pageflip';
import { api } from '../services/api';
import BookLoader from '../components/common/BookLoader';
import AutoDesignModal from '../components/autoDesign/AutoDesignModal';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  List,
  Layers,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Upload,
  Trash2,
  Settings,
  CheckCircle2,
  X,
  Layout,
  Palette,
  Edit3,
  AlertTriangle,
  BookOpen,
  Rocket,
  Download,
  FileText,
  FileType,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { useLanguage } from '../contexts/LanguageContext';
import TemplateGallery from '../components/design/TemplateGallery';
import { BookTemplate, textColorPresets, availableFonts, saveCustomTemplate } from '../data/bookTemplates';
import { applyTemplate, loadGoogleFonts, PageLayoutSettings } from '../services/templateService';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import {
  loadDesignFonts,
} from '../services/designApplicationService';
import type { AICompleteDesign } from '../types/templates';
import ImageEditToolbar from '../components/layout/ImageEditToolbar';
import ImagePlaceholder from '../components/layout/ImagePlaceholder';
import AICompleteDesignWizard from '../components/design/AICompleteDesignWizard';
import BrandWatermark from '../components/common/BrandWatermark';
import PrintOrderModal from '../components/print/PrintOrderModal';
import BookProgressStepper from '../components/common/BookProgressStepper';
import { RotateCcw } from 'lucide-react';
import BookFlipReader from '../components/reader/BookFlipReader';
import {
  FRONT_OVERLAY, BACK_OVERLAY,
  DEFAULT_TITLE_POS, DEFAULT_AUTHOR_POS,
  titleStyle, authorStyle, synopsisStyle, backAuthorStyle,
} from '../utils/coverStyles';

interface PageImage {
  id: string;
  url: string;
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage of page width
  height: number; // percentage of page height
  rotation: number;
  // New styling properties
  opacity?: number;
  borderRadius?: number;
  fadeEdges?: boolean;
  fadeAmount?: number;
  textWrap?: 'none' | 'behind' | 'front' | 'wrap';
  flipH?: boolean;
  flipV?: boolean;
  shadow?: boolean;
  border?: {
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
  };
}

// AI Design interfaces - matches server's TypographyDesign structure
interface TypographyDesign {
  bodyFont: string;
  headingFont: string;
  titleFont: string;
  fontSize: number;
  lineHeight: number;
  chapterTitleSize: number;
  pageNumberSize: number;
  colors: {
    text: string;
    heading: string;
    accent: string;
  };
  reasoning: string;
}

interface PageLayoutDesign {
  margins: { top: number; bottom: number; inner: number; outer: number };
  chapterStartStyle: 'same-page' | 'new-page' | 'new-page-centered';
  pageNumberPosition: 'bottom-center' | 'bottom-outer' | 'top-outer' | 'none';
  headerStyle: 'none' | 'book-title' | 'chapter-title' | 'author-name';
  dropCaps: boolean;
  ornaments: boolean;
  reasoning: string;
}

interface CoverDesign {
  front: {
    imagePrompt: string;
    imageUrl?: string;
    title: {
      text: string;
      font: string;
      size: number;
      color: string;
      position: 'top' | 'center' | 'bottom';
      alignment: 'left' | 'center' | 'right';
    };
    author: {
      text: string;
      font: string;
      size: number;
      color: string;
      position: 'top' | 'bottom';
    };
    colorPalette: string[];
  };
  back: {
    imagePrompt: string;
    imageUrl?: string;
    synopsis: {
      text: string;
      font: string;
      size: number;
      color: string;
    };
    author: {
      text: string;
      font: string;
      size: number;
      color: string;
    };
    backgroundColor: string;
  };
  spine: {
    title: string;
    author: string;
    font: string;
    color: string;
    backgroundColor: string;
  };
  reasoning: string;
}

interface ImagePlacementSuggestion {
  chapterIndex: number;
  position: 'chapter-start' | 'mid-chapter' | 'chapter-end';
  textContext: string;
  suggestedPrompt: string;
  importance: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface CompleteBookDesign {
  typography: TypographyDesign;
  layout: PageLayoutDesign;
  cover: CoverDesign;
  imagePlacements: ImagePlacementSuggestion[];
  overallStyle: string;
  moodDescription: string;
  generatedAt: Date;
}

interface PageContent {
  id: string;
  type: 'chapter' | 'blank' | 'toc' | 'title' | 'dedication' | 'summary';
  chapterIndex?: number;
  pageIndex?: number;
  content: string;
  images: PageImage[];
}

interface BookData {
  id: string;
  title: string;
  genre: string;
  language: string;
  description?: string;
  synopsis?: string;
  author?: {
    _id: string;
    name: string;
  };
  chapters: Array<{
    _id?: string;
    title: string;
    content: string;
    wordCount: number;
  }>;
  coverDesign?: {
    coverColor: string;
    textColor: string;
    fontFamily: string;
    imageUrl?: string;
    titlePosition?: { x: number; y: number };
    authorPosition?: { x: number; y: number };
    back?: {
      backgroundColor?: string;
      text?: string;
      imageUrl?: string;
    };
  };
  pageLayout?: {
    pages: PageContent[];
    settings: {
      fontSize: number;
      lineHeight: number;
      fontFamily: string;
      margins: { top: number; bottom: number; left: number; right: number };
      showPageNumbers: boolean;
      includeToc: boolean;
      includeBackCover: boolean;
    };
  };
  statistics?: {
    wordCount: number;
    chapterCount: number;
  };
}

// Detect if text is RTL (Hebrew, Arabic, etc.)
const isRTL = (text: string): boolean => {
  const rtlChars = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F]/;
  return rtlChars.test(text);
};

// Page dimensions for content estimation (based on A5-like page)
const PAGE_WIDTH_PX = 400; // Approximate page width in pixels
const PAGE_HEIGHT_PX = 560; // Approximate page height in pixels

// Estimate how many characters fit on a page based on settings
const estimateCharsPerPage = (settings: typeof defaultSettings, isHebrew: boolean = true): number => {
  // Account for frame inset (royal/art-deco frames take ~14px each side)
  const frameInset = (settings.pageFrame === 'royal' || settings.pageFrame === 'art-deco') ? 14 :
                     (settings.pageFrame === 'elegant' || settings.pageFrame === 'ornate') ? 8 :
                     (settings.pageFrame !== 'none') ? 4 : 0;

  const availableWidth = PAGE_WIDTH_PX - settings.margins.left - settings.margins.right - frameInset * 2;

  // Reserve space for header banner (~22px) and page number (~18px)
  const headerSpace = (settings.headerDecoration && settings.headerDecoration !== 'none') ? 22 : 0;
  const pageNumSpace = settings.showPageNumbers ? 18 : 0;
  const availableHeight = PAGE_HEIGHT_PX - settings.margins.top - settings.margins.bottom - headerSpace - pageNumSpace - frameInset * 2;

  // Hebrew characters are wider than Latin
  const avgCharWidth = settings.fontSize * (isHebrew ? 0.65 : 0.5);
  const charsPerLine = Math.floor(availableWidth / avgCharWidth);

  // Estimate lines per page — account for paragraph spacing
  const lineHeightPx = settings.fontSize * settings.lineHeight;
  // Each paragraph (~5 lines avg) adds extra spacing; estimate ~3-4px per line as overhead
  const effectiveLineHeight = lineHeightPx + (settings.paragraphSpacing || 0) / 5;
  const linesPerPage = Math.floor(availableHeight / effectiveLineHeight);

  // Buffer accounts for HTML tags, spacing, chapter titles
  return Math.floor(charsPerLine * linesPerPage * 0.55);
};

/**
 * After images are injected into pages, some pages may have more text than
 * can fit (because the image takes up part of the page height). This function
 * walks the pages array and splits any overflowing chapter pages into two,
 * pushing the excess text into a new continuation page.
 */
const repaginateForImages = (
  pages: PageContent[],
  settings: typeof defaultSettings,
  isHebrew: boolean
): PageContent[] => {
  const baseCharsPerPage = estimateCharsPerPage(settings, isHebrew);
  const result: PageContent[] = [];

  for (const page of pages) {
    if (page.type !== 'chapter' || !page.images?.length) {
      result.push(page);
      continue;
    }

    // Estimate how much vertical space images take (percentage → fraction)
    const totalImageHeightPct = page.images.reduce((sum, img) => sum + (img.height || 0), 0);
    const reductionFactor = Math.max(0.2, 1 - totalImageHeightPct / 100);
    const adjustedCharsPerPage = Math.floor(baseCharsPerPage * reductionFactor);

    // Strip HTML to measure text length
    const textLength = (page.content || '').replace(/<[^>]*>/g, '').length;

    if (textLength <= adjustedCharsPerPage) {
      result.push(page);
      continue;
    }

    // Need to split: keep what fits on this page, overflow goes to a new page
    const splitPages = splitContentIntoPages(page.content, adjustedCharsPerPage, true);

    // First part stays on the original page (with images)
    result.push({ ...page, content: splitPages[0] || page.content });

    // Remaining parts become new continuation pages (without images)
    for (let i = 1; i < splitPages.length; i++) {
      result.push({
        id: `${page.id}-overflow-${i}`,
        type: 'chapter',
        chapterIndex: page.chapterIndex,
        content: splitPages[i],
        images: [],
      });
    }
  }

  return result;
};

// Split HTML content into pages while preserving HTML structure
const splitContentIntoPages = (
  htmlContent: string,
  charsPerPage: number,
  isFirstPage: boolean = true
): string[] => {
  const pages: string[] = [];

  // If text content is short enough, return as single page
  // Compare text-only length (strip HTML tags) against the chars-per-page budget
  const textOnly = htmlContent.replace(/<[^>]*>/g, '');
  if (textOnly.length <= charsPerPage) {
    return [htmlContent];
  }

  // Split by paragraphs (works for both <p> tags and text with line breaks)
  const paragraphRegex = /<p[^>]*>[\s\S]*?<\/p>|<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>|<blockquote[^>]*>[\s\S]*?<\/blockquote>|<ul[^>]*>[\s\S]*?<\/ul>|<ol[^>]*>[\s\S]*?<\/ol>|[^<]+(?=<|$)/g;
  const paragraphs = htmlContent.match(paragraphRegex) || [htmlContent];

  let currentPage = '';
  let currentLength = 0;
  const titleBuffer = isFirstPage ? charsPerPage * 0.15 : 0; // Reserve space for title on first page
  const effectiveCharsPerPage = charsPerPage - titleBuffer;

  for (const paragraph of paragraphs) {
    const paragraphText = paragraph.replace(/<[^>]*>/g, ''); // Get text without tags
    const paragraphLength = paragraphText.length;

    // If this single paragraph is longer than a page, split it
    if (paragraphLength > effectiveCharsPerPage) {
      // Save current page if it has content
      if (currentPage.trim()) {
        pages.push(currentPage);
        currentPage = '';
        currentLength = 0;
      }

      // Split long paragraph by sentences
      const sentences = paragraphText.match(/[^.!?]+[.!?]+\s*/g) || [paragraphText];
      let longParagraphPart = '';
      let partLength = 0;

      for (const sentence of sentences) {
        if (partLength + sentence.length > effectiveCharsPerPage && longParagraphPart.trim()) {
          pages.push(`<p>${longParagraphPart.trim()}</p>`);
          longParagraphPart = sentence;
          partLength = sentence.length;
        } else {
          longParagraphPart += sentence;
          partLength += sentence.length;
        }
      }

      if (longParagraphPart.trim()) {
        currentPage = `<p>${longParagraphPart.trim()}</p>`;
        currentLength = partLength;
      }
    } else if (currentLength + paragraphLength > effectiveCharsPerPage) {
      // Start new page
      if (currentPage.trim()) {
        pages.push(currentPage);
      }
      currentPage = paragraph;
      currentLength = paragraphLength;
    } else {
      // Add to current page
      currentPage += paragraph;
      currentLength += paragraphLength;
    }
  }

  // Don't forget the last page
  if (currentPage.trim()) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [htmlContent];
};

interface PricingStrategy {
  recommendedPrice: number;
  recommendFree: boolean;
  reasoning: string;
  authorStats: {
    totalBooks: number;
    publishedBooks: number;
    totalSales: number;
    averageRating: number;
  };
  marketAnalysis: {
    genreAveragePrice: number;
    competitorPriceRange: { min: number; max: number };
    demandLevel: 'low' | 'medium' | 'high';
  };
  strategyTips: string[];
}

// Default page layout settings
// Image placeholder position from template
interface ImagePlaceholderPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  frameStyle?: 'none' | 'thin-border' | 'shadow' | 'rounded' | 'decorative';
  label?: string;
}

const defaultSettings = {
  fontSize: 11,
  lineHeight: 1.6,
  fontFamily: 'David Libre',
  titleFont: 'Cinzel',
  headerFont: 'David Libre',
  margins: { top: 32, bottom: 30, left: 28, right: 28 },
  showPageNumbers: true,
  includeToc: true,
  includeBackCover: true,
  textColor: '#1a1a1a',
  backgroundColor: '#fefdfb',
  accentColor: '#8b6914',
  columns: 1 as 1 | 2 | 3 | 4,
  paragraphIndent: 0,
  paragraphSpacing: 8,
  pageNumberPosition: 'bottom-center' as 'top-left' | 'top-right' | 'bottom-center' | 'bottom-outside' | 'none',
  templateId: undefined as string | undefined,
  imagePlaceholders: [] as ImagePlaceholderPosition[],
  imageFrameStyle: 'shadow' as 'none' | 'thin-border' | 'shadow' | 'rounded' | 'decorative',
  // Page size
  pageSize: 'A5' as 'A4' | 'A5' | 'B5' | 'Letter' | '6x9' | '5x8' | 'Square' | 'Pocket' | 'Custom',
  customPageSize: undefined as { width: number; height: number } | undefined,
  // Design elements
  dropCapStyle: 'none' as 'none' | 'classic' | 'decorative' | 'box' | 'modern',
  dividerStyle: 'none' as 'none' | 'line' | 'ornament' | 'stars' | 'dots' | 'wave',
  pullQuoteStyle: 'none' as 'none' | 'bordered' | 'background' | 'side-accent' | 'centered',
  pageFrame: 'none' as 'none' | 'simple' | 'double' | 'ornate' | 'rounded' | 'dashed' | 'dotted' | 'gradient' | 'royal' | 'elegant' | 'art-deco',
  frameColor: '#8b6914' as string,
  backgroundPattern: 'none' as 'none' | 'dots' | 'stripes' | 'grid' | 'waves' | 'confetti' | 'stars' | 'hearts' | 'geometric',
  headerDecoration: 'none' as 'none' | 'line' | 'ornament' | 'gradient-line' | 'dots' | 'banner',
  sectionDivider: '' as string,
  cornerDecorations: 'none' as 'none' | 'flourish' | 'geometric' | 'floral' | 'stars' | 'hearts' | 'leaves',
  titleUnderline: 'none' as 'none' | 'simple' | 'double' | 'wavy' | 'dotted' | 'gradient' | 'ornate',
  // Rich backgrounds
  backgroundGradient: undefined as string | undefined,
  backgroundTexture: 'none' as 'none' | 'paper' | 'parchment' | 'linen',
  backgroundTextureOpacity: 0.15,
};

// Page wrapper required by react-pageflip (must be forwardRef)
const FlipPage = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string; onClick?: () => void }>(
  ({ children, className = '', onClick }, ref) => (
    <div
      ref={ref}
      className={`overflow-hidden ${className}`}
      style={{ width: '100%', height: '100%' }}
      onClick={onClick}
    >
      {children}
    </div>
  )
);
FlipPage.displayName = 'FlipPage';

export default function BookLayoutPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { isRTL: isUIRTL, language } = useLanguage();
  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveFailed, setAutoSaveFailed] = useState(false);

  // Page navigation
  const [currentSpread, setCurrentSpread] = useState(0); // 0 = cover, 1 = pages 1-2, etc.
  const [isFlipping, setIsFlipping] = useState<'left' | 'right' | null>(null); // Page flip animation direction
  const [pages, setPages] = useState<PageContent[]>([]);

  // react-pageflip ref and state
  const flipBookRef = useRef<any>(null);
  const [settings, setSettings] = useState(defaultSettings);

  // Compute page aspect ratio from selected page size — drives both preview and export
  const pageDimensions = useMemo(() => {
    const sizes: Record<string, { width: number; height: number }> = {
      A4:     { width: 210, height: 297 },
      A5:     { width: 148, height: 210 },
      B5:     { width: 176, height: 250 },
      Letter: { width: 216, height: 279 },
      '6x9':  { width: 152, height: 229 },
      '5x8':  { width: 127, height: 203 },
      Square: { width: 210, height: 210 },
      Pocket: { width: 127, height: 178 },
    };
    const size = settings.pageSize === 'Custom' && settings.customPageSize
      ? settings.customPageSize
      : (sizes[settings.pageSize] || sizes.A5);
    const baseH = 400;
    const ratio = size.width / size.height;
    const pageW = Math.round(baseH * ratio);
    return { pageW, pageH: baseH, mmW: size.width, mmH: size.height };
  }, [settings.pageSize, settings.customPageSize]);

  // Custom swipe gesture state — separate from flipbook to avoid conflicts with image drag
  const swipeRef = useRef<{ startX: number; startY: number; startTime: number } | null>(null);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showBookStructureHelp, setShowBookStructureHelp] = useState(false); // RTL book structure help overlay
  const [showImageModal, setShowImageModal] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');

  // AI Design state (for applying stored designs)
  const [aiDesign, setAiDesign] = useState<CompleteBookDesign | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [backCoverImageUrl, setBackCoverImageUrl] = useState<string | null>(null);
  const [showAIDesignWizard, setShowAIDesignWizard] = useState(false);
  const [showAutoDesignModal, setShowAutoDesignModal] = useState(false);
  const [showFlipReader, setShowFlipReader] = useState(false);

  // Publish/Export state (moved from DesignStudioPage)
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pricingStrategy, setPricingStrategy] = useState<PricingStrategy | null>(null);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [isFree, setIsFree] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Save as Template state
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateNameHe, setTemplateNameHe] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [showMobilePages, setShowMobilePages] = useState(false);

  // Editing state
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const editableRef = useRef<HTMLDivElement>(null);

  // Determine text direction from ALL text we know about the book.
  // We concatenate every piece of text and check once - any Hebrew/Arabic char → RTL.
  const isBookRTL = (() => {
    if (!book) return false;
    if (book.language === 'he' || book.language === 'ar') return true;
    const combinedText = [
      book.title || '',
      book.description || '',
      book.synopsis || '',
      ...(book.chapters || []).slice(0, 3).flatMap((ch: any) => [
        ch.title || '',
        (ch.content || '').substring(0, 1000),
      ]),
    ].join(' ');
    return isRTL(combinedText);
  })();

  // Auto-save timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load book data
  useEffect(() => {
    if (bookId) {
      loadBook();
    }
  }, [bookId]);

  // Auto-save effect
  useEffect(() => {
    if (autoSaveEnabled && book && pages.length > 0) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        saveLayout(true);
      }, 30000); // Auto-save every 30 seconds
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [pages, settings, autoSaveEnabled]);

  // Load Google Fonts when fontFamily changes
  useEffect(() => {
    if (settings.fontFamily) {
      loadGoogleFonts(settings);
    }
  }, [settings.fontFamily, settings.titleFont, settings.headerFont]);

  const loadBook = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/books/${bookId}`);
      if (response.data.success) {
        const bookData = response.data.data.book;
        setBook(bookData);

        // Load existing layout or generate new one
        if (bookData.pageLayout?.pages) {
          const rawSettings = { ...defaultSettings, ...bookData.pageLayout.settings };
          // Migrate old books with oversized fonts/margins — they caused text overflow
          const loadedSettings = {
            ...rawSettings,
            fontSize: rawSettings.fontSize > 13 ? Math.round(rawSettings.fontSize * 0.78) : rawSettings.fontSize,
            margins: {
              top: rawSettings.margins.top > 45 ? Math.round(rawSettings.margins.top * 0.65) : rawSettings.margins.top,
              bottom: rawSettings.margins.bottom > 45 ? Math.round(rawSettings.margins.bottom * 0.65) : rawSettings.margins.bottom,
              left: rawSettings.margins.left > 40 ? Math.round(rawSettings.margins.left * 0.65) : rawSettings.margins.left,
              right: rawSettings.margins.right > 40 ? Math.round(rawSettings.margins.right * 0.65) : rawSettings.margins.right,
            },
          };

          // Content is NOT saved to the server (stripped in saveLayout to keep payload small).
          // Regenerate page content from chapters, then merge saved images back.
          const bookIsRTLCheck = isRTL(bookData.title) || bookData.language === 'he';
          const charsPerPage = estimateCharsPerPage(loadedSettings, bookIsRTLCheck);
          const savedPages = bookData.pageLayout.pages;

          // Build a map of saved page id -> images (what was persisted)
          const savedImagesMap = new Map<string, any[]>();
          savedPages.forEach((page: any, pageIndex: number) => {
            const serverImages = (bookData.pageImages || [])
              .filter((img: any) => img.pageIndex === pageIndex)
              .map((img: any) => ({
                id: img._id || `img-${img.createdAt || Date.now()}`,
                url: img.url,
                x: img.x || 10,
                y: img.y || 10,
                width: img.width || 30,
                height: img.height || 30,
                rotation: img.rotation || 0,
              }));
            const existingImages = page.images || [];
            const existingIds = new Set(existingImages.map((img: any) => img.id));
            const newImages = serverImages.filter((img: any) => !existingIds.has(img.id));
            savedImagesMap.set(page.id, [...existingImages, ...newImages]);
          });

          // Regenerate pages with content from chapters
          const freshPages: PageContent[] = [];

          // RTL books: blank page first (inside front cover)
          if (bookIsRTLCheck) {
            freshPages.push({
              id: `page-blank-0`,
              type: 'blank',
              content: '',
              images: savedImagesMap.get('page-blank-0') || [],
            });
          }

          // Title page
          freshPages.push({
            id: `page-title`,
            type: 'title',
            content: `<h1 class="book-title">${bookData.title}</h1><p class="book-author">${bookData.author?.name || ''}</p>`,
            images: savedImagesMap.get('page-title') || [],
          });

          // Blank page after title
          freshPages.push({
            id: `page-blank-1`,
            type: 'blank',
            content: '',
            images: savedImagesMap.get('page-blank-1') || [],
          });

          // Chapter pages
          const chapterPages: PageContent[] = [];
          const chapterStartPages: number[] = [];

          bookData.chapters.forEach((chapter: any, index: number) => {
            const chapterContent = chapter.content || '';
            const rtlExtra = bookIsRTLCheck ? 1 : 0;
            const basePages = (loadedSettings.includeToc && bookData.chapters.length > 1 ? 4 : 2) + rtlExtra;
            chapterStartPages.push(basePages + chapterPages.length + 1);

            const contentPages = splitContentIntoPages(chapterContent, charsPerPage, true);
            contentPages.forEach((pageContent: string, pageIndex: number) => {
              const isFirstPageOfChapter = pageIndex === 0;
              const pageId = pageIndex === 0
                ? `page-chapter-${index}`
                : `page-chapter-${index}-cont-${pageIndex}`;

              chapterPages.push({
                id: pageId,
                type: 'chapter',
                chapterIndex: index,
                content: isFirstPageOfChapter
                  ? `<h2 class="chapter-title">${chapter.title}</h2>${pageContent}`
                  : pageContent,
                images: savedImagesMap.get(pageId) || [],
              });
            });
          });

          // TOC
          if (loadedSettings.includeToc && bookData.chapters.length > 1) {
            const tocContent = bookData.chapters
              .map((ch: any, i: number) => `<div class="toc-item"><span class="toc-title">${ch.title}</span><span class="toc-page" dir="ltr">${chapterStartPages[i] || ''}</span></div>`)
              .join('');
            freshPages.push({
              id: `page-toc`,
              type: 'toc',
              content: `<h2 class="toc-header">${bookIsRTLCheck ? 'תוכן עניינים' : 'Table of Contents'}</h2>${tocContent}`,
              images: savedImagesMap.get('page-toc') || [],
            });
            freshPages.push({
              id: `page-blank-2`,
              type: 'blank',
              content: '',
              images: savedImagesMap.get('page-blank-2') || [],
            });
          }

          freshPages.push(...chapterPages);

          // Back cover
          if (loadedSettings.includeBackCover) {
            freshPages.push({
              id: `page-summary`,
              type: 'summary',
              content: bookData.synopsis || bookData.description || '',
              images: savedImagesMap.get('page-summary') || [],
            });
          }

          const pagesWithImages = freshPages;
          // Inject AI-generated images from aiDesignState.design.imagePlacements
          // into the matching chapter pages BEFORE the first render.
          const aiPlacements = bookData.aiDesignState?.design?.imagePlacements || [];
          if (aiPlacements.length > 0) {
            for (const placement of aiPlacements) {
              const imgUrl = placement.generatedImageUrl || placement.imageUrl;
              if (!imgUrl) continue;
              const chIdx = placement.chapterIndex ?? 0;
              let targetPage = pagesWithImages.find(
                (p: any) => p.type === 'chapter' && p.chapterIndex === chIdx
              );
              if (!targetPage) {
                const chPages = pagesWithImages.filter((p: any) => p.type === 'chapter');
                targetPage = chPages[chIdx] || chPages[0];
              }
              if (!targetPage) continue;
              if (!targetPage.images) targetPage.images = [];
              if (targetPage.images.some((img: any) => img.url === imgUrl)) continue;
              targetPage.images.push({
                id: `ai-design-${chIdx}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                url: imgUrl,
                x: 10,
                y: 5,
                width: 80,
                height: 35,
                rotation: 0,
              });
            }
          }

          // Re-paginate: if images reduced available text space on a page,
          // split the overflow into a new continuation page so text isn't cut off.
          const finalPages = repaginateForImages(pagesWithImages, loadedSettings, bookIsRTLCheck);
          setPages(finalPages);
          setSettings(loadedSettings);
        } else {
          generatePagesFromChapters(bookData);
        }

        // Apply AI design if available
        if (bookData.aiDesignState?.status === 'completed' && bookData.aiDesignState?.design) {
          await applyStoredAIDesign(bookData.aiDesignState.design);
        }

        // Also apply coverDesign from DesignStudioPage (if no AI design or as fallback)
        if (bookData.coverDesign) {
          const cd = bookData.coverDesign;

          // Apply cover settings
          const resolvedImageUrl = cd.imageUrl || cd.front?.imageUrl || null;
          if (resolvedImageUrl) {
            setCoverImageUrl(resolvedImageUrl);
          }
          // Load back cover image URL
          let resolvedBackCoverUrl = cd.back?.imageUrl || null;
          if (resolvedBackCoverUrl && !resolvedBackCoverUrl.startsWith('http') && !resolvedBackCoverUrl.startsWith('data:')) {
            // Convert relative URL to absolute
            const apiUrl = import.meta.env.VITE_API_URL ||
              (import.meta.env.PROD ? 'https://api.mestory-ai.com/api' : 'http://localhost:5001/api');
            const serverBaseUrl = apiUrl.replace('/api', '');
            resolvedBackCoverUrl = `${serverBaseUrl}${resolvedBackCoverUrl}`;
          }
          if (resolvedBackCoverUrl) {
            setBackCoverImageUrl(resolvedBackCoverUrl);
          }
          // Update book state with cover design (including back cover)
          setBook(prev => prev ? {
            ...prev,
            coverDesign: {
              ...prev.coverDesign,
              coverColor: cd.coverColor || cd.front?.backgroundColor || prev.coverDesign?.coverColor,
              textColor: cd.textColor || cd.front?.title?.color || prev.coverDesign?.textColor,
              fontFamily: cd.fontFamily || cd.front?.title?.font || prev.coverDesign?.fontFamily,
              imageUrl: resolvedImageUrl || prev.coverDesign?.imageUrl,
              back: cd.back || prev.coverDesign?.back, // Include back cover data
            },
          } : null);
        }

        // Apply pageLayout settings if available
        if (bookData.pageLayout) {
          const pl = bookData.pageLayout;
          setSettings(prev => ({
            ...prev,
            fontFamily: pl.bodyFont || prev.fontFamily,
            fontSize: pl.fontSize || prev.fontSize,
            lineHeight: pl.lineHeight || prev.lineHeight,
            margins: pl.margins ? {
              top: pl.margins.top || prev.margins.top,
              bottom: pl.margins.bottom || prev.margins.bottom,
              left: pl.margins.left || prev.margins.left,
              right: pl.margins.right || prev.margins.right,
            } : prev.margins,
            showPageNumbers: pl.headerFooter?.includePageNumbers ?? prev.showPageNumbers,
          }));
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to load book:', error);
      toast.error('Error loading book');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Apply AI design from book's stored aiDesignState
  const applyStoredAIDesign = async (design: AICompleteDesign) => {
    try {
      // Load fonts first
      if (design.typography) {
        await loadDesignFonts(design.typography);
      }

      // Apply typography settings
      if (design.typography) {
        setSettings(prev => ({
          ...prev,
          fontFamily: design.typography.bodyFont || prev.fontFamily,
          fontSize: design.typography.fontSize || prev.fontSize,
          lineHeight: design.typography.lineHeight || prev.lineHeight,
          textColor: design.typography.colors?.text || prev.textColor,
        }));
      }

      // Apply layout settings
      if (design.layout?.margins) {
        setSettings(prev => ({
          ...prev,
          margins: {
            top: design.layout.margins.top || prev.margins.top,
            bottom: design.layout.margins.bottom || prev.margins.bottom,
            left: design.layout.margins.inner || prev.margins.left,
            right: design.layout.margins.outer || prev.margins.right,
          },
          showPageNumbers: design.layout.pageNumbers?.show ?? prev.showPageNumbers,
        }));
      }

      // Apply cover design
      if (design.covers?.front && book) {
        setCoverImageUrl(design.covers.front.generatedImageUrl || null);
        setBook(prev => prev ? {
          ...prev,
          coverDesign: {
            ...prev.coverDesign,
            coverColor: design.covers?.front?.backgroundColor || prev.coverDesign?.coverColor || '#1a1a2e',
            textColor: design.covers?.front?.title?.color || prev.coverDesign?.textColor || '#ffffff',
            fontFamily: design.typography?.titleFont || prev.coverDesign?.fontFamily || 'David Libre',
            imageUrl: design.covers?.front?.generatedImageUrl || prev.coverDesign?.imageUrl,
          },
        } : null);
      }

      // Store the complete design for reference
      setAiDesign({
        typography: {
          bodyFont: design.typography?.bodyFont || '',
          headingFont: design.typography?.headingFont || '',
          titleFont: design.typography?.titleFont || '',
          fontSize: design.typography?.fontSize || 14,
          lineHeight: design.typography?.lineHeight || 1.6,
          chapterTitleSize: design.typography?.chapterTitleSize || 24,
          pageNumberSize: 10,
          colors: {
            text: design.typography?.colors?.text || '#000000',
            heading: design.typography?.colors?.heading || '#000000',
            accent: design.typography?.colors?.accent || '#007bff',
          },
          reasoning: 'Applied from stored AI design',
        },
        layout: {
          margins: design.layout?.margins || { top: 60, bottom: 60, inner: 50, outer: 50 },
          chapterStartStyle: 'same-page',
          pageNumberPosition: (design.layout?.pageNumbers?.position as any) || 'bottom-center',
          headerStyle: design.layout?.headers?.show ? 'book-title' : 'none',
          dropCaps: false,
          ornaments: false,
          reasoning: 'Applied from stored AI design',
        },
        cover: {
          front: {
            imagePrompt: design.covers?.front?.imagePrompt || '',
            imageUrl: design.covers?.front?.generatedImageUrl,
            title: {
              text: book?.title || '',
              font: design.typography?.titleFont || 'David Libre',
              size: design.typography?.chapterTitleSize || 48,
              color: design.covers?.front?.title?.color || '#ffffff',
              position: 'center',
              alignment: 'center',
            },
            author: {
              text: book?.author?.name || '',
              font: design.typography?.bodyFont || 'David Libre',
              size: 18,
              color: design.covers?.front?.author?.color || '#ffffff',
              position: 'bottom',
            },
            colorPalette: design.covers?.front?.gradientColors || [design.covers?.front?.backgroundColor || '#1a1a2e'],
          },
          back: {
            imagePrompt: design.covers?.back?.imagePrompt || '',
            imageUrl: design.covers?.back?.generatedImageUrl,
            synopsis: {
              text: book?.synopsis || '',
              font: design.typography?.bodyFont || 'David Libre',
              size: 12,
              color: '#ffffff',
            },
            author: {
              text: book?.author?.name || '',
              font: design.typography?.bodyFont || 'David Libre',
              size: 14,
              color: '#ffffff',
            },
            backgroundColor: design.covers?.back?.backgroundColor || '#1a1a2e',
          },
          spine: {
            title: book?.title || '',
            author: book?.author?.name || '',
            font: design.typography?.titleFont || 'David Libre',
            color: design.covers?.spine?.textColor || '#ffffff',
            backgroundColor: design.covers?.spine?.backgroundColor || '#1a1a2e',
          },
          reasoning: 'Applied from stored AI design',
        },
        // AI image placements are now injected directly into page.images[]
        // during the loading phase (before first render). Setting them here
        // too would cause duplicates AND push text down (this path renders
        // in-flow, not absolute-positioned). Only keep placements that
        // DON'T have a generated image — those are just suggestions/prompts.
        imagePlacements: (design.imagePlacements || [])
          .filter((p: any) => !(p.generatedImageUrl || p.imageUrl))
          .map((p: any) => ({
            chapterIndex: p.chapterIndex ?? 0,
            position: (p.pagePosition || p.position || 'chapter-start') as 'chapter-start' | 'mid-chapter' | 'chapter-end',
            textContext: '',
            suggestedPrompt: p.prompt || '',
            importance: 'medium' as const,
            reasoning: 'Suggested by AI',
            generatedImageUrl: undefined,
            prompt: p.prompt || '',
          })),
        overallStyle: 'AI Generated Design',
        moodDescription: 'Custom AI-generated design for this book',
        generatedAt: new Date(),
      });

    } catch (error) {
      if (import.meta.env.DEV) console.error('Error applying stored AI design:', error);
    }
  };

  // Save current design as a custom template
  const handleSaveAsTemplate = async () => {
    if (!templateName.trim() || !templateNameHe.trim()) {
      toast.error(language === 'he' ? 'נא להזין שם לתבנית' : 'Please enter a template name');
      return;
    }

    if (!aiDesign && !settings) {
      toast.error(language === 'he' ? 'אין עיצוב לשמור' : 'No design to save');
      return;
    }

    setSavingTemplate(true);

    try {
      const templateData = {
        name: templateName.trim(),
        nameHe: templateNameHe.trim(),
        description: `Custom template based on ${book?.title || 'AI Design'}`,
        descriptionHe: `תבנית מותאמת אישית מבוססת על ${book?.title || 'עיצוב AI'}`,
        category: 'custom',
        // Typography
        fonts: {
          title: aiDesign?.typography?.titleFont || settings.fontFamily || 'Inter',
          body: aiDesign?.typography?.bodyFont || settings.fontFamily || 'Inter',
          headers: aiDesign?.typography?.headingFont || settings.fontFamily || 'Inter',
        },
        headerSizes: {
          h1: aiDesign?.typography?.chapterTitleSize || 24,
          h2: 20,
          h3: 16,
        },
        fontSize: aiDesign?.typography?.fontSize || settings.fontSize || 14,
        lineHeight: aiDesign?.typography?.lineHeight || settings.lineHeight || 1.6,
        // Layout
        columns: settings.columns || 1,
        paragraphStyle: 'vertical',
        pageNumberPosition: settings.showPageNumbers
          ? (aiDesign?.layout?.pageNumberPosition || 'bottom-center')
          : 'none',
        margins: settings.margins || { top: 50, bottom: 50, left: 50, right: 50 },
        paragraphIndent: settings.paragraphIndent || 0,
        paragraphSpacing: settings.paragraphSpacing || 12,
        // Advanced features
        chapterStartStyle: aiDesign?.layout?.chapterStartStyle || 'new-page',
        dropCapStyle: (settings as any).dropCapStyle || (aiDesign?.layout?.dropCaps ? 'classic' : 'none'),
        headerDecoration: (settings as any).headerDecoration || (aiDesign?.layout?.headerStyle !== 'none' ? 'line' : 'none'),
        dividerStyle: (settings as any).dividerStyle || 'none',
        // Decorative elements
        decorativeElements: {
          pageFrame: (settings as any).pageFrame || 'none',
          frameColor: (settings as any).frameColor || settings.accentColor,
          backgroundPattern: (settings as any).backgroundPattern || 'none',
          cornerDecorations: (settings as any).cornerDecorations || 'none',
          titleUnderline: (settings as any).titleUnderline || 'none',
          sectionDivider: (settings as any).sectionDivider || '',
        },
        // Images
        imagePositions: ['top', 'center', 'bottom'],
        imageFrameStyle: 'shadow',
        imageLayout: 'single',
        // Cover
        coverStyle: {
          backgroundColor: settings.backgroundColor || '#1a1a2e',
          gradientColors: [settings.backgroundColor || '#1a1a2e'],
          titlePosition: 'center',
          titleAlignment: 'center',
          titleColor: settings.textColor || '#ffffff',
          authorColor: settings.accentColor || '#cccccc',
        },
        // Colors
        textColor: aiDesign?.typography?.colors?.text || settings.textColor || '#000000',
        accentColor: aiDesign?.typography?.colors?.accent || settings.accentColor || '#6366f1',
        backgroundColor: settings.backgroundColor || '#ffffff',
        previewGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        // Include AI design data if available
        aiDesignData: aiDesign ? {
          typography: aiDesign.typography,
          layout: aiDesign.layout,
          imagePlacements: aiDesign.imagePlacements,
          moodDescription: aiDesign.moodDescription,
        } : undefined,
      };

      // Also save to localStorage for instant availability in Template Gallery
      try {
        saveCustomTemplate({
          ...templateData,
          id: `custom-${Date.now()}`,
          previewGradient: `linear-gradient(135deg, ${settings.backgroundColor || '#fff'} 0%, ${settings.accentColor || '#6366f1'} 100%)`,
        } as any);
      } catch (localErr) {
        if (import.meta.env.DEV) console.warn('localStorage template save failed:', localErr);
      }

      const response = await api.post('/templates', templateData);

      if (response.data.success) {
        toast.success(language === 'he' ? '✓ התבנית נשמרה בהצלחה!' : '✓ Template saved successfully!');
        setShowSaveTemplateModal(false);
        setTemplateName('');
        setTemplateNameHe('');
      } else {
        throw new Error(response.data.error || 'Failed to save template');
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error saving template:', error);
      toast.error(error.message || (language === 'he' ? 'שגיאה בשמירת התבנית' : 'Failed to save template'));
    } finally {
      setSavingTemplate(false);
    }
  };

  // Generate pages from chapters
  const generatePagesFromChapters = (bookData: BookData) => {
    const newPages: PageContent[] = [];
    const bookIsRTL = isRTL(bookData.title) || bookData.language === 'he';

    // In RTL books: blank page first (inside front cover on RIGHT),
    // then title page on LEFT side of the spread
    if (bookIsRTL) {
      newPages.push({
        id: `page-blank-0`,
        type: 'blank',
        content: '',
        images: [],
      });
    }

    // Title page
    newPages.push({
      id: `page-title`,
      type: 'title',
      content: `<h1 class="book-title">${bookData.title}</h1><p class="book-author">${bookData.author?.name || ''}</p>`,
      images: [],
    });

    // Blank page after title (for proper spread)
    newPages.push({
      id: `page-blank-1`,
      type: 'blank',
      content: '',
      images: [],
    });

    // Chapter pages - split long chapters into multiple pages
    const charsPerPage = estimateCharsPerPage(settings, bookIsRTL);
    const chapterPages: PageContent[] = [];
    const chapterStartPages: number[] = []; // Track where each chapter starts

    bookData.chapters.forEach((chapter, index) => {
      const chapterContent = chapter.content || '';

      // Track the page number where this chapter starts
      // Account for: RTL blank (1 if RTL), title page (1), blank page (1), TOC (2 if enabled)
      const rtlExtra = isRTL(bookData.title) || bookData.language === 'he' ? 1 : 0;
      const basePages = (settings.includeToc && bookData.chapters.length > 1 ? 4 : 2) + rtlExtra;
      chapterStartPages.push(basePages + chapterPages.length + 1);

      // Split content into pages if needed
      const contentPages = splitContentIntoPages(chapterContent, charsPerPage, true);

      contentPages.forEach((pageContent, pageIndex) => {
        const isFirstPageOfChapter = pageIndex === 0;
        const pageId = pageIndex === 0
          ? `page-chapter-${index}`
          : `page-chapter-${index}-cont-${pageIndex}`;

        chapterPages.push({
          id: pageId,
          type: 'chapter',
          chapterIndex: index,
          content: isFirstPageOfChapter
            ? `<h2 class="chapter-title">${chapter.title}</h2>${pageContent}`
            : pageContent,
          images: [],
        });
      });
    });

    // Table of contents (if enabled) - now with correct page numbers
    if (settings.includeToc && bookData.chapters.length > 1) {
      const tocContent = bookData.chapters
        .map((ch, i) => `<div class="toc-item"><span class="toc-title">${ch.title}</span><span class="toc-page" dir="ltr">${chapterStartPages[i] || ''}</span></div>`)
        .join('');
      newPages.push({
        id: `page-toc`,
        type: 'toc',
        content: `<h2 class="toc-header">${isBookRTL ? 'תוכן עניינים' : 'Table of Contents'}</h2>${tocContent}`,
        images: [],
      });

      // Blank page after TOC
      newPages.push({
        id: `page-blank-2`,
        type: 'blank',
        content: '',
        images: [],
      });
    }

    // Add all chapter pages
    newPages.push(...chapterPages);

    // Back cover with summary
    if (settings.includeBackCover) {
      newPages.push({
        id: `page-summary`,
        type: 'summary',
        content: bookData.synopsis || bookData.description || '',
        images: [],
      });
    }

    setPages(newPages);
  };

  // Save layout
  // Load pricing strategy from AI
  const loadPricingStrategy = async () => {
    if (!book) return;
    setLoadingStrategy(true);
    try {
      const response = await api.get(`/books/${bookId}/pricing-strategy`);
      if (response.data.success) {
        const strategy = response.data.data;
        setPricingStrategy(strategy);
        setIsFree(strategy.recommendFree);
        setSelectedPrice(strategy.recommendedPrice);
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Failed to load pricing strategy:', error);
      setPricingStrategy({
        recommendedPrice: 0,
        recommendFree: true,
        reasoning: 'This is your first book! We recommend starting free to build a reader base and get your first reviews.',
        authorStats: { totalBooks: 1, publishedBooks: 0, totalSales: 0, averageRating: 0 },
        marketAnalysis: {
          genreAveragePrice: 25,
          competitorPriceRange: { min: 0, max: 50 },
          demandLevel: 'medium',
        },
        strategyTips: [
          'A free first book helps build a loyal reader base',
          'Collect positive reviews before moving to paid books',
          'Consider offering your first book for free for a limited time',
        ],
      });
      setIsFree(true);
      setSelectedPrice(0);
    } finally {
      setLoadingStrategy(false);
    }
  };

  // Open publish modal
  const openPublishModal = () => {
    setShowPublishModal(true);
    loadPricingStrategy();
  };

  // Handle publish book
  const handlePublish = async () => {
    if (!book) return;
    const qs = (book as any).qualityScore;
    if (!qs || qs.overallScore < 70) {
      toast.error('A quality score of at least 70 is required for publishing. Run quality analysis in the editor.');
      return;
    }
    setPublishing(true);
    try {
      await saveLayout();
      await api.put(`/books/${bookId}`, {
        publishingStatus: { price: isFree ? 0 : selectedPrice, isFree },
      });
      const response = await api.post(`/books/${bookId}/publish`);
      if (response.data.success) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#DAA520', '#FFD700', '#FFA500', '#FF6B6B'] });
        setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#DAA520', '#FFD700'] }), 200);
        setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#FFA500', '#FF6B6B'] }), 400);
        toast.success('Book published successfully!');
        setShowPublishModal(false);
        navigate('/marketplace');
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Failed to publish book:', error);
      toast.error(error.response?.data?.error || 'Error publishing book');
    } finally {
      setPublishing(false);
    }
  };

  // Which design pipeline the user last built with — decides what every
  // export renders so the file matches the preview ("export === what you see").
  const getActiveDesign = (): 'manual' | 'auto' => {
    const b: any = book;
    const stored = b?.aiDesignState?.activeDesign;
    if (stored === 'auto' && b?.autoDesignPlan) return 'auto';
    if (stored === 'manual') return 'manual';
    if (b?.autoDesignPlan && !(b?.pageLayout?.pages?.length)) return 'auto';
    return 'manual';
  };

  // PDF export. Routes by active design:
  //   manual   → open /print/:id (browser "Save as PDF" — perfect fidelity)
  //   designed → download the server-rendered PDF of /print/:id/designed (WYSIWYG)
  const handleBrowserPdf = async () => {
    if (!book) return;
    setExporting(true);
    try {
      await saveLayout();
      if (getActiveDesign() === 'auto') {
        toast.loading(language === 'he' ? 'יוצר PDF מהעימוד...' : 'Rendering designed PDF...', { id: 'export' });
        const res = await api.get(`/auto-design/${bookId}/export.pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${book.title}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success(language === 'he' ? 'ה-PDF הורד בהצלחה' : 'PDF downloaded', { id: 'export' });
      } else {
        toast.success(
          language === 'he'
            ? 'דף ההדפסה נפתח — בחר "שמור כ-PDF" בחלון ההדפסה'
            : 'Print page opened — choose "Save as PDF" in the print dialog',
          { id: 'export' },
        );
        window.open(`/print/${bookId}?print=1`, '_blank');
      }
      setShowExportModal(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || 'Error exporting PDF', { id: 'export' });
    } finally {
      setExporting(false);
    }
  };

  // Server-side DOCX export. Routes by active design: designed → the
  // auto-design renderer (typeset plan + cover); manual → pageLayout renderer.
  const handleDocxExport = async () => {
    if (!book) return;
    setExporting(true);
    try {
      await saveLayout();
      toast.loading(language === 'he' ? 'יוצר קובץ Word...' : 'Creating Word file...', { id: 'export' });
      const docxEndpoint = getActiveDesign() === 'auto'
        ? `/auto-design/${bookId}/export.docx`
        : `/books/${bookId}/export/docx`;
      const response = await api.get(docxEndpoint, { responseType: 'blob' });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${book.title}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(language === 'he' ? 'הקובץ הורד בהצלחה' : 'File downloaded successfully', { id: 'export' });
      setShowExportModal(false);
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Failed to export book:', error);
      toast.error(error?.message || error.response?.data?.error || 'Error exporting book', { id: 'export' });
    } finally {
      setExporting(false);
    }
  };

  // Compress a base64 image to reduce payload size (max 600px wide, JPEG quality 0.7)
  const compressBase64 = (dataUrl: string): Promise<string> =>
    new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const MAX_W = 600;
        let w = img.width;
        let h = img.height;
        if (w > MAX_W) { h = Math.round((h * MAX_W) / w); w = MAX_W; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.70));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });

  // Try to upload a base64 image to the server; returns server URL or null
  const uploadBase64Image = async (dataUrl: string, pageIndex: number): Promise<string | null> => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `image-${Date.now()}.png`, { type: blob.type || 'image/png' });
      const formData = new FormData();
      formData.append('image', file);
      formData.append('pageIndex', String(pageIndex));

      // Use native fetch (not Axios) so the browser sets multipart/form-data
      // with boundary automatically — Axios's default Content-Type: application/json
      // would otherwise prevent multer from parsing the file on the server.
      const serverBase = import.meta.env.VITE_API_URL ||
        (import.meta.env.PROD
          ? 'https://api.mestory-ai.com/api'
          : 'http://localhost:5001/api');
      const token = localStorage.getItem('token');
      const fetchRes = await fetch(`${serverBase}/books/${bookId}/page-image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
        body: formData,
      });
      if (!fetchRes.ok) return null;
      const json = await fetchRes.json();
      if (json.success) {
        const d = json.data?.image || json.data;
        return d?.url || json.data?.imageUrl || null;
      }
      return null;
    } catch {
      return null;
    }
  };

  const saveLayout = async (isAutoSave = false) => {
    if (!book) return;

    setSaving(true);
    try {
      // Process images: try to upload base64 ones to get server URLs.
      // If upload fails, compress them so the PUT payload stays under Vercel's 4.5MB limit.
      const processedPages = await Promise.all(
        pages.map(async (page, pi) => ({
          ...page,
          images: await Promise.all(
            (page.images || [])
              .filter(img => img.url)
              .map(async img => {
                if (!img.url.startsWith('data:')) return img;
                const serverUrl = await uploadBase64Image(img.url, pi);
                const finalUrl = serverUrl ?? await compressBase64(img.url);
                return { ...img, url: finalUrl };
              })
          ),
        }))
      );

      // Send layout fields INCLUDING content — the export/print renderers read
      // page content from pageLayout.pages, so it must be persisted.
      let pagesForSave = processedPages.map(page => ({
        id: page.id,
        type: page.type,
        chapterIndex: page.chapterIndex,
        pageIndex: page.pageIndex,
        content: page.content || '',
        images: (page.images || []).map(img => ({
          id: img.id,
          url: img.url || '',
          x: img.x,
          y: img.y,
          width: img.width,
          height: img.height,
          rotation: img.rotation,
          opacity: img.opacity,
          borderRadius: img.borderRadius,
          fadeEdges: img.fadeEdges,
          fadeAmount: img.fadeAmount,
          textWrap: img.textWrap,
          flipH: img.flipH,
          flipV: img.flipV,
        })),
      }));

      // Vercel has a 4.5MB body limit. If any base64 images remain (upload failed),
      // strip their data so the PUT doesn't 413 — layout/position metadata is kept.
      const VERCEL_LIMIT = 3.5 * 1024 * 1024; // 3.5MB safety margin
      if (new Blob([JSON.stringify(pagesForSave)]).size > VERCEL_LIMIT) {
        pagesForSave = pagesForSave.map(page => ({
          ...page,
          images: page.images.map(img =>
            img.url.startsWith('data:') ? { ...img, url: '' } : img
          ),
        }));
      }

      // Don't send coverDesign during layout saves — it hasn't changed here,
      // and sending a shallow copy strips image URLs, overwriting the real ones
      // saved by DesignStudioPage.

      const fullPayload = JSON.stringify({
        pageLayout: { pages: pagesForSave, settings },
      });

      // Final check — if still over limit, strip ALL base64 from pages
      if (new Blob([fullPayload]).size > VERCEL_LIMIT) {
        pagesForSave = pagesForSave.map(page => ({
          ...page,
          images: page.images.map(img =>
            img.url.startsWith('data:') ? { ...img, url: '' } : img
          ),
        }));
      }

      const response = await api.put(`/books/${bookId}`, {
        pageLayout: {
          pages: pagesForSave,
          settings,
        },
      });

      if (response.data.success) {
        setLastSaved(new Date());
        setAutoSaveFailed(false); // Clear any previous failure state
        if (!isAutoSave) {
          toast.success(t('book_layout.messages.save_success', 'Layout saved successfully!'));
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to save layout:', error);
      if (isAutoSave) {
        setAutoSaveFailed(true); // Set failure state for persistent warning
      } else {
        toast.error(t('book_layout.messages.save_error', 'Error saving layout'));
      }
    } finally {
      setSaving(false);
    }
  };

  // Start editing a page
  const handleStartEditing = (pageIndex: number) => {
    const page = pages[pageIndex];
    if (!page || page.type !== 'chapter') return;

    setEditingPageIndex(pageIndex);
    setEditingContent(page.content);

    // Auto-focus the contentEditable after React re-renders
    setTimeout(() => {
      if (editableRef.current) {
        editableRef.current.focus();
      }
    }, 100);
  };

  // Finish editing and save changes
  const handleFinishEditing = async () => {
    if (editingPageIndex === null || !book || !editableRef.current) return;

    const page = pages[editingPageIndex];
    if (!page || page.type !== 'chapter' || page.chapterIndex === undefined) {
      setEditingPageIndex(null);
      return;
    }

    // Get the edited HTML content
    const editedHtml = editableRef.current.innerHTML;

    // Extract just the content without the chapter title
    let contentWithoutTitle = editedHtml;
    const titleMatch = editedHtml.match(/<h2[^>]*class="chapter-title"[^>]*>.*?<\/h2>/i);
    if (titleMatch) {
      contentWithoutTitle = editedHtml.replace(titleMatch[0], '').trim();
    }

    // Update the chapter content
    const chapterIndex = page.chapterIndex;
    const updatedChapters = [...book.chapters];

    // For multi-page chapters, we need to collect all pages of the same chapter
    const chapterPages = pages.filter(p => p.type === 'chapter' && p.chapterIndex === chapterIndex);

    if (chapterPages.length === 1) {
      // Simple case: chapter fits on one page
      updatedChapters[chapterIndex] = {
        ...updatedChapters[chapterIndex],
        content: contentWithoutTitle,
      };
    } else {
      // Multi-page chapter: only update the specific page's content
      // and rebuild the full chapter content
      const pageIndexInChapter = chapterPages.findIndex(p => p.id === page.id);
      const updatedPageContents = chapterPages.map((p, idx) => {
        if (idx === pageIndexInChapter) {
          return contentWithoutTitle;
        }
        // Remove chapter title from other pages too
        let content = p.content;
        const match = content.match(/<h2[^>]*class="chapter-title"[^>]*>.*?<\/h2>/i);
        if (match) {
          content = content.replace(match[0], '').trim();
        }
        return content;
      });

      updatedChapters[chapterIndex] = {
        ...updatedChapters[chapterIndex],
        content: updatedPageContents.join('\n'),
      };
    }

    // Update book state
    const updatedBook = {
      ...book,
      chapters: updatedChapters,
    };
    setBook(updatedBook);

    // Update the page content locally
    const updatedPages = [...pages];
    updatedPages[editingPageIndex] = {
      ...page,
      content: editedHtml,
    };
    setPages(updatedPages);

    // Clear editing state
    setEditingPageIndex(null);
    setEditingContent('');

    // Save to server
    try {
      await api.put(`/books/${bookId}`, {
        chapters: updatedChapters,
      });
      toast.success(t('book_layout.content_saved', 'Content saved'));
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to save chapter content:', error);
      toast.error(t('book_layout.messages.save_failed', 'Failed to save content'));
    }
  };

  // Cancel editing
  const handleCancelEditing = () => {
    setEditingPageIndex(null);
    setEditingContent('');
  };

  // Handle cover title position change
  const handleTitlePositionChange = (pos: { x: number; y: number }) => {
    if (!book) return;
    setBook(prev => prev ? {
      ...prev,
      coverDesign: {
        ...prev.coverDesign,
        coverColor: prev.coverDesign?.coverColor || '#1a1a2e',
        textColor: prev.coverDesign?.textColor || '#ffffff',
        fontFamily: prev.coverDesign?.fontFamily || 'Arial',
        titlePosition: pos,
      },
    } : null);
  };

  // Handle cover author position change
  const handleAuthorPositionChange = (pos: { x: number; y: number }) => {
    if (!book) return;
    setBook(prev => prev ? {
      ...prev,
      coverDesign: {
        ...prev.coverDesign,
        coverColor: prev.coverDesign?.coverColor || '#1a1a2e',
        textColor: prev.coverDesign?.textColor || '#ffffff',
        fontFamily: prev.coverDesign?.fontFamily || 'Arial',
        authorPosition: pos,
      },
    } : null);
  };

  // Handle template selection
  const handleTemplateSelect = async (template: BookTemplate) => {
    const newSettings = applyTemplate(settings as PageLayoutSettings, template);
    setSettings(newSettings as typeof settings);
    loadGoogleFonts(newSettings);
    setShowTemplateGallery(false);

    // Remap existing page images to the new template's placeholder positions
    // so images don't disappear when switching templates
    const newPlaceholders = (newSettings.imagePlaceholders || []);
    const remappedPages = pages.map(page => {
      const existingImages = (page.images || []).filter(img => img.url);
      if (existingImages.length === 0 || newPlaceholders.length === 0) return page;
      const remapped = existingImages.map((img, idx) => {
        const target = newPlaceholders[idx];
        if (!target) return img;
        return { ...img, x: target.x, y: target.y, width: target.width, height: target.height };
      });
      return { ...page, images: remapped };
    });
    setPages(remappedPages);

    // Save immediately with the new settings
    if (book) {
      setSaving(true);
      try {
        // Preserve image URLs (including base64) so images persist across reloads
        const pagesForSave = remappedPages.map(page => ({
          ...page,
          images: (page.images || []).map(img => ({
            id: img.id,
            url: img.url,
            x: img.x,
            y: img.y,
            width: img.width,
            height: img.height,
            rotation: img.rotation,
            opacity: img.opacity,
            borderRadius: img.borderRadius,
            fadeEdges: img.fadeEdges,
            fadeAmount: img.fadeAmount,
            textWrap: img.textWrap,
            flipH: img.flipH,
            flipV: img.flipV,
          })).filter(img => img.url),
        }));

        const payload = {
          pageLayout: {
            pages: pagesForSave,
            settings: newSettings,
          },
        };
        const response = await api.put(`/books/${bookId}`, payload);

        if (response.data.success) {
          setLastSaved(new Date());
          toast.success(`תבנית "${template.name}" הוחלה ונשמרה בהצלחה!`);
        }
      } catch (error: any) {
        if (import.meta.env.DEV) {
          console.error('Failed to save template:', error);
          console.error('Error details:', error.response?.data);
        }
        toast.error(`התבנית הוחלה אך השמירה נכשלה: ${error.response?.data?.error || error.message || 'Unknown error'}`);
      } finally {
        setSaving(false);
      }
    }
  };

  // Handle AI Complete Design
  const handleAIDesignComplete = async (
    design: any,
    coverImageUrls: { front?: string; back?: string }
  ) => {
    // Apply typography settings — safe access with fallbacks
    const typo = design.typography || {} as any;
    const layout = design.layout || {} as any;
    const colors = typo.colors || {} as any;
    const designMargins = layout.margins || {} as any;

    // Clamp margins to reasonable values for screen display (max ~40% of page dimension)
    const clampMargin = (val: number | undefined, fallback: number, max: number) =>
      val !== undefined ? Math.min(val, max) : fallback;

    const newSettings = {
      ...settings,
      fontFamily: typo.bodyFont || settings.fontFamily,
      titleFont: typo.titleFont || settings.titleFont,
      headerFont: typo.headingFont || settings.headerFont,
      fontSize: Math.min(typo.fontSize || settings.fontSize, 13),
      lineHeight: typo.lineHeight || settings.lineHeight,
      textColor: colors.text || settings.textColor,
      accentColor: colors.accent || settings.accentColor,
      margins: {
        top: clampMargin(designMargins.top, settings.margins.top, 45),
        bottom: clampMargin(designMargins.bottom, settings.margins.bottom, 45),
        left: clampMargin(designMargins.inner ?? designMargins.left, settings.margins.left, 40),
        right: clampMargin(designMargins.outer ?? designMargins.right, settings.margins.right, 40),
      },
      showPageNumbers: layout.pageNumberPosition !== 'none',
      pageNumberPosition: layout.pageNumberPosition || settings.pageNumberPosition,
      chapterStartStyle: layout.chapterStartStyle || 'new-page-centered',
      headerStyle: layout.headerStyle || 'none',
      dropCapEnabled: layout.dropCaps || false,
      // Design elements — rich defaults from AI design
      dropCapStyle: design.dropCapStyle || 'classic',
      dividerStyle: design.dividerStyle || 'ornament',
      pageFrame: design.pageFrame || 'elegant',
      frameColor: design.frameColor || colors.accent || settings.accentColor,
      backgroundPattern: design.backgroundPattern || 'none',
      headerDecoration: design.headerDecoration || 'banner',
      cornerDecorations: design.cornerDecorations || 'flourish',
      sectionDivider: design.sectionDivider || '',
      titleUnderline: design.titleUnderline || 'gradient',
      pageSize: design.pageSize || settings.pageSize || 'A5',
      // Clean warm background — subtle, not muddy
      backgroundGradient: design.backgroundGradient || `linear-gradient(180deg, #fffdf7 0%, #faf6ee 100%)`,
      backgroundTexture: design.backgroundTexture || 'paper',
      backgroundTextureOpacity: design.backgroundTextureOpacity ?? 0.08,
    };

    setSettings(newSettings);
    loadGoogleFonts(newSettings as PageLayoutSettings);

    // Re-paginate with new settings (font size, margins changed → text per page changes)
    if (book) {
      const bookIsRTLLocal = isRTL(book.title) || book.language === 'he';
      const newCharsPerPage = estimateCharsPerPage(newSettings, bookIsRTLLocal);
      const freshPages: PageContent[] = [];

      // RTL books: blank page first (inside front cover)
      if (bookIsRTLLocal) {
        freshPages.push({
          id: 'page-blank-0',
          type: 'blank',
          content: '',
          images: [],
        });
      }

      // Title page
      freshPages.push({
        id: 'page-title',
        type: 'title',
        content: `<h1 class="book-title">${book.title}</h1><p class="book-author">${book.author?.name || ''}</p>`,
        images: pages.find(p => p.id === 'page-title')?.images || [],
      });
      freshPages.push({
        id: 'page-blank-1',
        type: 'blank',
        content: '',
        images: [],
      });

      // Collect ALL existing images per chapter before re-paginating
      const existingImagesByChapter = new Map<number, any[]>();
      for (const p of pages) {
        if (p.type === 'chapter' && p.chapterIndex !== undefined && p.images?.length) {
          const imgs = existingImagesByChapter.get(p.chapterIndex) || [];
          imgs.push(...p.images);
          existingImagesByChapter.set(p.chapterIndex, imgs);
        }
      }

      // Chapters
      const chapterPages: PageContent[] = [];
      const chapterStartPages: number[] = [];

      book.chapters.forEach((chapter: any, index: number) => {
        const chapterContent = chapter.content || '';
        const basePages = (newSettings.includeToc && book.chapters.length > 1 ? 4 : 2) + (bookIsRTLLocal ? 1 : 0);
        chapterStartPages.push(basePages + chapterPages.length + 1);

        const contentPages = splitContentIntoPages(chapterContent, newCharsPerPage, true);
        // Preserve all images from this chapter — place on first page
        const chapterImages = existingImagesByChapter.get(index) || [];

        contentPages.forEach((pageContent: string, pageIndex: number) => {
          const isFirstPageOfChapter = pageIndex === 0;
          const pageId = pageIndex === 0
            ? `page-chapter-${index}`
            : `page-chapter-${index}-cont-${pageIndex}`;

          chapterPages.push({
            id: pageId,
            type: 'chapter',
            chapterIndex: index,
            content: isFirstPageOfChapter
              ? `<h2 class="chapter-title">${chapter.title}</h2>${pageContent}`
              : pageContent,
            images: isFirstPageOfChapter ? chapterImages : [],
          });
        });
      });

      // TOC
      if (newSettings.includeToc && book.chapters.length > 1) {
        const tocContent = book.chapters
          .map((ch: any, i: number) => `<div class="toc-item"><span class="toc-title">${ch.title}</span><span class="toc-page" dir="ltr">${chapterStartPages[i] || ''}</span></div>`)
          .join('');
        freshPages.push({
          id: 'page-toc',
          type: 'toc',
          content: `<h2 class="toc-header">${bookIsRTLLocal ? 'תוכן עניינים' : 'Table of Contents'}</h2>${tocContent}`,
          images: [],
        });
        freshPages.push({ id: 'page-blank-2', type: 'blank', content: '', images: [] });
      }

      freshPages.push(...chapterPages);

      if (newSettings.includeBackCover) {
        freshPages.push({
          id: 'page-summary',
          type: 'summary',
          content: book.synopsis || book.description || '',
          images: [],
        });
      }

      const finalPages = repaginateForImages(freshPages, newSettings, bookIsRTLLocal);
      setPages(finalPages);
    }

    // Set cover image if generated
    if (coverImageUrls.front) {
      setCoverImageUrl(coverImageUrls.front);
      setBook(prev => prev ? {
        ...prev,
        coverDesign: {
          coverColor: prev.coverDesign?.coverColor || '#1a1a2e',
          textColor: prev.coverDesign?.textColor || '#ffffff',
          fontFamily: prev.coverDesign?.fontFamily || 'Inter',
          titlePosition: prev.coverDesign?.titlePosition,
          authorPosition: prev.coverDesign?.authorPosition,
          imageUrl: coverImageUrls.front,
        },
      } : null);
    }

    // Store AI design for save-as-template feature
    setAiDesign({
      typography: design.typography,
      layout: design.layout,
      cover: design.cover,
      imagePlacements: design.imagePlacements,
      overallStyle: design.overallStyle,
      moodDescription: design.moodDescription,
      generatedAt: new Date(),
    } as CompleteBookDesign);

    // Add AI-generated images to chapter pages (or placeholders if no image was generated)
    if (design.imagePlacements && design.imagePlacements.length > 0) {
      const updatedPages = [...pages];
      design.imagePlacements.forEach((placement: any) => {
        const chapterPages = updatedPages.filter(p => p.type === 'chapter' && p.chapterIndex === placement.chapterIndex);
        if (chapterPages.length === 0) return;

        const targetPage = placement.position === 'chapter-start' ? chapterPages[0] :
                          placement.position === 'chapter-end' ? chapterPages[chapterPages.length - 1] :
                          chapterPages[Math.floor(chapterPages.length / 2)];
        if (!targetPage) return;

        const pageIndex = updatedPages.findIndex(p => p.id === targetPage.id);
        if (pageIndex === -1) return;

        if (placement.generatedImageUrl) {
          // Actual AI-generated image — add to page images array
          if (!updatedPages[pageIndex].images) updatedPages[pageIndex].images = [];
          const alreadyExists = updatedPages[pageIndex].images.some(
            (img: any) => img.url === placement.generatedImageUrl
          );
          if (!alreadyExists) {
            updatedPages[pageIndex].images.push({
              id: `ai-wizard-${placement.chapterIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              url: placement.generatedImageUrl,
              x: 10, y: 5, width: 80, height: 35, rotation: 0,
            });
          }
        } else {
          // No generated image — add placeholder in settings
          const existingPlaceholders = (newSettings as any).imagePlaceholders || [];
          (newSettings as any).imagePlaceholders = [
            ...existingPlaceholders,
            {
              pageIndex,
              x: 60,
              y: placement.position === 'chapter-start' ? 10 : placement.position === 'mid-chapter' ? 40 : 70,
              width: 35, height: 25, shape: 'rounded',
              prompt: placement.suggestedPrompt,
            },
          ];
        }
      });

      // Re-paginate to account for images reducing available text space
      const bookIsRTLLocal = isRTL(book?.title || '') || book?.language === 'he';
      const rePaginated = repaginateForImages(updatedPages, newSettings, bookIsRTLLocal);
      setPages(rePaginated);
      setSettings(newSettings);
    }

    // ── Auto-save as user template ────────────────────────────────────────────
    // Build a reusable BookTemplate from the AI design so the user can apply
    // the same style to future books from the Template Gallery.
    const autoTemplateName = book?.title
      ? `${book.title} – AI`
      : (language === 'he' ? 'עיצוב AI' : 'AI Design');
    const autoTemplateNameHe = book?.title
      ? `${book.title} – עיצוב AI`
      : 'עיצוב AI';

    const autoTemplate: BookTemplate = {
      id: `ai-auto-${Date.now()}`,
      name: autoTemplateName,
      nameHe: autoTemplateNameHe,
      description: design.moodDescription || 'Auto-saved from AI Design Wizard',
      descriptionHe: design.moodDescription || 'נשמר אוטומטית מאשף עצב לי הכל',
      category: 'custom',
      previewGradient: `linear-gradient(135deg, ${newSettings.backgroundColor || '#fff'} 0%, ${newSettings.accentColor || '#6366f1'} 100%)`,
      fonts: {
        title: design.typography.titleFont || newSettings.fontFamily,
        body: design.typography.bodyFont || newSettings.fontFamily,
        headers: design.typography.headingFont || newSettings.fontFamily,
      },
      headerSizes: {
        h1: design.typography.chapterTitleSize || 24,
        h2: 20,
        h3: 16,
      },
      fontSize: newSettings.fontSize,
      lineHeight: newSettings.lineHeight,
      columns: (newSettings.columns || 1) as 1 | 2 | 3 | 4,
      paragraphStyle: 'vertical',
      pageNumberPosition: (newSettings.pageNumberPosition || 'bottom-center') as any,
      margins: newSettings.margins,
      paragraphIndent: newSettings.paragraphIndent || 0,
      paragraphSpacing: newSettings.paragraphSpacing || 12,
      textColor: newSettings.textColor || '#000000',
      accentColor: newSettings.accentColor || '#6366f1',
      backgroundColor: newSettings.backgroundColor || '#ffffff',
      chapterStartStyle: (design.layout?.chapterStartStyle || 'new-page') as any,
      dropCapStyle: (newSettings.dropCapStyle || 'none') as any,
      headerDecoration: (newSettings.headerDecoration || 'none') as any,
      dividerStyle: (newSettings.dividerStyle || 'none') as any,
      imagePositions: ['top', 'center', 'bottom'],
      imageFrameStyle: 'shadow',
      imageLayout: 'single',
      coverStyle: {
        backgroundColor: newSettings.backgroundColor || '#1a1a2e',
        gradientColors: [newSettings.accentColor || '#6366f1'],
        titlePosition: 'center',
        titleAlignment: 'center',
        titleColor: newSettings.textColor || '#ffffff',
        authorColor: newSettings.accentColor || '#cccccc',
      },
      decorativeElements: {
        pageFrame: (newSettings.pageFrame || 'none') as any,
        frameColor: newSettings.frameColor || newSettings.accentColor,
        backgroundPattern: (newSettings.backgroundPattern || 'none') as any,
        cornerDecorations: (newSettings.cornerDecorations || 'none') as any,
        titleUnderline: (newSettings.titleUnderline || 'none') as any,
        sectionDivider: newSettings.sectionDivider || '',
      },
    } as any;

    // 1. Save locally (instant, works offline)
    try {
      saveCustomTemplate(autoTemplate);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Could not save template to localStorage:', err);
    }

    // 2. Save to server (background, best-effort)
    api.post('/templates', {
      name: autoTemplateName,
      nameHe: autoTemplateNameHe,
      description: autoTemplate.description,
      descriptionHe: autoTemplate.descriptionHe,
      category: 'custom',
      fonts: autoTemplate.fonts,
      headerSizes: autoTemplate.headerSizes,
      fontSize: autoTemplate.fontSize,
      lineHeight: autoTemplate.lineHeight,
      columns: autoTemplate.columns,
      paragraphStyle: autoTemplate.paragraphStyle,
      pageNumberPosition: autoTemplate.pageNumberPosition,
      margins: autoTemplate.margins,
      paragraphIndent: autoTemplate.paragraphIndent,
      paragraphSpacing: autoTemplate.paragraphSpacing,
      textColor: autoTemplate.textColor,
      accentColor: autoTemplate.accentColor,
      backgroundColor: autoTemplate.backgroundColor,
      coverStyle: autoTemplate.coverStyle,
      previewGradient: autoTemplate.previewGradient,
      dropCapStyle: autoTemplate.dropCapStyle,
      headerDecoration: autoTemplate.headerDecoration,
      dividerStyle: autoTemplate.dividerStyle,
      decorativeElements: autoTemplate.decorativeElements,
      aiDesignData: { typography: design.typography, layout: design.layout },
    }).catch(err => { if (import.meta.env.DEV) console.warn('Could not save template to server:', err); });
    // ─────────────────────────────────────────────────────────────────────────

    // Save to database
    if (book) {
      setSaving(true);
      try {
        const payload = {
          pageLayout: {
            pages,
            settings: newSettings,
          },
          coverDesign: coverImageUrls.front ? {
            ...book.coverDesign,
            imageUrl: coverImageUrls.front,
          } : book.coverDesign,
        };
        await api.put(`/books/${bookId}`, payload);
        setLastSaved(new Date());
        toast.success(
          language === 'he'
            ? '✨ העיצוב הוחל ונשמר! התבנית נוספה לגלריה שלך'
            : '✨ Design applied! Template saved to your gallery'
        );
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to save AI design:', error);
        toast.error(language === 'he' ? 'העיצוב הוחל אך השמירה נכשלה' : 'Design applied but save failed');
      } finally {
        setSaving(false);
      }
    }

    setShowAIDesignWizard(false);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedPageIndex === null) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be up to 10MB');
      return;
    }

    try {
      toast.loading(`Uploading image to page ${selectedPageIndex + 1}...`, { id: 'upload-image' });

      const formData = new FormData();
      formData.append('image', file);
      formData.append('pageIndex', String(selectedPageIndex));

      const response = await api.post(`/books/${bookId}/page-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        // Server returns image object with url property, or direct imageUrl
        const imageData = response.data.data.image || response.data.data;
        const imageUrl = imageData.url || response.data.data.imageUrl;

        const newImage: PageImage = {
          id: imageData._id || `img-${Date.now()}`,
          url: imageUrl,
          x: imageData.x || 25,
          y: imageData.y || 25,
          width: imageData.width || 50,
          height: imageData.height || 40,
          rotation: imageData.rotation || 0,
        };

        const updatedPages = [...pages];
        // Ensure images array exists
        if (!updatedPages[selectedPageIndex].images) {
          updatedPages[selectedPageIndex].images = [];
        }
        updatedPages[selectedPageIndex].images.push(newImage);
        setPages(updatedPages);

        // Auto-save after adding image
        saveLayout(true);

        toast.success('Image uploaded successfully!', { id: 'upload-image' });
        setShowImageModal(false);
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Error uploading image', { id: 'upload-image' });
    }
  };

  // Generate image with AI
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || selectedPageIndex === null) return;

    setGeneratingImage(true);
    try {
      toast.loading('Generating image with AI...', { id: 'generate-image' });

      // IMPORTANT: send pageIndex so server saves image to pageImages collection.
      // Without this, base64 URLs get stripped on save and images disappear on reload.
      const response = await api.post('/ai/generate-image', {
        prompt: imagePrompt,
        bookId,
        pageIndex: selectedPageIndex,
        style: book?.genre || 'general',
      });

      if (response.data.success) {
        // Support both response formats
        const imageUrl = response.data.data.imageUrl || response.data.data.image?.url;

        const newImage: PageImage = {
          id: `img-${Date.now()}`,
          url: imageUrl,
          x: 25,
          y: 25,
          width: 50,
          height: 40,
          rotation: 0,
        };

        const updatedPages = [...pages];
        // Ensure images array exists
        if (!updatedPages[selectedPageIndex].images) {
          updatedPages[selectedPageIndex].images = [];
        }
        updatedPages[selectedPageIndex].images.push(newImage);
        setPages(updatedPages);

        // Auto-save after adding image
        saveLayout(true);

        toast.success('Image generated successfully!', { id: 'generate-image' });
        setShowImageModal(false);
        setImagePrompt('');
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Generate image error:', error);
      toast.error(error.response?.data?.error || 'Error generating image', { id: 'generate-image' });
    } finally {
      setGeneratingImage(false);
    }
  };

  // Update image position/size
  const updateImagePosition = (pageIndex: number, imageId: string, updates: Partial<PageImage>) => {

    setPages(prevPages => {
      // Handle empty pages array
      if (!prevPages || prevPages.length === 0) {
        if (import.meta.env.DEV) console.error('Pages array is empty');
        return prevPages;
      }
      const updatedPages = [...prevPages];
      if (!updatedPages[pageIndex]) {
        if (import.meta.env.DEV) console.error('Page not found at index:', pageIndex);
        return prevPages;
      }
      // Ensure images array exists
      if (!updatedPages[pageIndex].images) {
        updatedPages[pageIndex].images = [];
        return prevPages;
      }
      const imageIndex = updatedPages[pageIndex].images.findIndex(img => img.id === imageId);

      if (imageIndex !== -1) {
        updatedPages[pageIndex].images[imageIndex] = {
          ...updatedPages[pageIndex].images[imageIndex],
          ...updates,
        };
        return updatedPages;
      }
      if (import.meta.env.DEV) console.error('Image not found with id:', imageId);
      return prevPages;
    });
  };

  // Delete image
  const deleteImage = (pageIndex: number, imageId: string) => {
    // Handle empty pages array
    if (!pages || pages.length === 0 || !pages[pageIndex]) {
      if (import.meta.env.DEV) console.error('Invalid page index or empty pages array');
      return;
    }
    const updatedPages = [...pages];
    // Ensure images array exists
    if (!updatedPages[pageIndex].images) {
      updatedPages[pageIndex].images = [];
      return;
    }
    updatedPages[pageIndex].images = updatedPages[pageIndex].images.filter(img => img.id !== imageId);
    setPages(updatedPages);
    setSelectedImageId(null);
  };

  // Duplicate image
  const duplicateImage = (pageIndex: number, imageId: string) => {
    // Handle empty pages array
    if (!pages || pages.length === 0 || !pages[pageIndex]) {
      if (import.meta.env.DEV) console.error('Invalid page index or empty pages array');
      return;
    }
    const updatedPages = [...pages];
    // Ensure images array exists
    if (!updatedPages[pageIndex].images) {
      updatedPages[pageIndex].images = [];
      return;
    }
    const originalImage = updatedPages[pageIndex].images.find(img => img.id === imageId);
    if (originalImage) {
      const newImage: PageImage = {
        ...originalImage,
        id: `img-${Date.now()}`,
        x: Math.min(originalImage.x + 5, 90),
        y: Math.min(originalImage.y + 5, 90),
      };
      updatedPages[pageIndex].images.push(newImage);
      setPages(updatedPages);
      setSelectedImageId(newImage.id);
      toast.success(language === 'he' ? 'התמונה שוכפלה' : 'Image duplicated');
    }
  };

  // Move image to a different page
  const moveImageToPage = (fromPageIndex: number, imageId: string, toPageIndex: number) => {
    if (!pages || pages.length === 0 || !pages[fromPageIndex] || !pages[toPageIndex]) {
      if (import.meta.env.DEV) console.error('Invalid page index for move');
      return;
    }
    if (fromPageIndex === toPageIndex) return;

    const updatedPages = [...pages];
    const sourceImages = updatedPages[fromPageIndex].images || [];
    const image = sourceImages.find(img => img.id === imageId);
    if (!image) return;

    // Remove from source page
    updatedPages[fromPageIndex].images = sourceImages.filter(img => img.id !== imageId);

    // Add to target page
    if (!updatedPages[toPageIndex].images) {
      updatedPages[toPageIndex].images = [];
    }
    updatedPages[toPageIndex].images.push({ ...image });

    setPages(updatedPages);
    setSelectedImageId(null);
    toast.success(language === 'he' ? `התמונה הועברה לעמוד ${toPageIndex + 1}` : `Image moved to page ${toPageIndex + 1}`);
  };

  // Handle image added from placeholder
  const handleImageFromPlaceholder = (pageIndex: number, imageUrl: string, imageData: {
    x: number;
    y: number;
    width: number;
    height: number;
    isAiGenerated: boolean;
    prompt?: string;
  }) => {
    if (!pages || pages.length === 0 || !pages[pageIndex]) {
      if (import.meta.env.DEV) console.error('Invalid page index');
      return;
    }

    const newImage: PageImage = {
      id: `img-${Date.now()}`,
      url: imageUrl,
      x: imageData.x,
      y: imageData.y,
      width: imageData.width,
      height: imageData.height,
      rotation: 0,
    };

    const updatedPages = [...pages];
    if (!updatedPages[pageIndex].images) {
      updatedPages[pageIndex].images = [];
    }
    updatedPages[pageIndex].images.push(newImage);
    setPages(updatedPages);
    setSelectedImageId(newImage.id);

    // Auto-save after adding image
    saveLayout(true);
  };

  // Add page break / blank page
  const addBlankPage = (afterIndex: number) => {
    // Handle empty pages array
    if (!pages) {
      return;
    }
    const newPage: PageContent = {
      id: `page-blank-${Date.now()}`,
      type: 'blank',
      content: '',
      images: [],
    };
    const updatedPages = [...pages];
    updatedPages.splice(afterIndex + 1, 0, newPage);
    setPages(updatedPages);
    toast.success(language === 'he' ? 'דף ריק נוסף' : 'Blank page added');
  };

  // Remove page
  const removePage = (index: number) => {
    // Handle empty pages array
    if (!pages || pages.length === 0 || !pages[index]) {
      return;
    }
    if (pages[index].type === 'blank') {
      const updatedPages = pages.filter((_, i) => i !== index);
      setPages(updatedPages);
      toast.success(language === 'he' ? 'הדף הוסר' : 'Page removed');
    } else {
      toast.error(t('book_layout.only_blank_removable', 'Only blank pages can be removed'));
    }
  };

  // Toggle TOC - only add/remove TOC pages without regenerating chapter pages
  const toggleToc = () => {
    if (!book) return;

    const hasToc = pages.some(p => p.type === 'toc');
    if (hasToc) {
      // Remove TOC pages (toc and the blank page after it) without affecting other pages
      const tocIndex = pages.findIndex(p => p.type === 'toc');
      const updatedPages = pages.filter((p, index) => {
        // Remove TOC page
        if (p.type === 'toc') return false;
        // Remove blank page immediately after TOC (if it exists)
        if (tocIndex >= 0 && index === tocIndex + 1 && p.type === 'blank' && p.id.includes('blank-2')) return false;
        return true;
      });
      setPages(updatedPages);
      setSettings({ ...settings, includeToc: false });
      toast.success(language === 'he' ? 'תוכן עניינים הוסר' : 'Table of Contents removed');
    } else {
      // Add TOC pages after title/blank pages without regenerating chapter pages
      // Find where to insert TOC (after title page and first blank page)
      const titleIndex = pages.findIndex(p => p.type === 'title');
      const insertIndex = titleIndex >= 0 ? titleIndex + 2 : 2; // After title and first blank

      // Calculate page numbers for TOC entries
      const chapterStartPages: number[] = [];
      let currentPage = insertIndex + 3; // After title, blank, toc, blank

      const seenChapters = new Set<number>();
      pages.forEach(p => {
        if (p.type === 'chapter' && p.chapterIndex !== undefined && !seenChapters.has(p.chapterIndex)) {
          seenChapters.add(p.chapterIndex);
          chapterStartPages.push(currentPage);
        }
        if (p.type === 'chapter') currentPage++;
      });

      // Generate TOC content
      const tocContent = book.chapters
        .map((ch, i) => `<div class="toc-item"><span class="toc-title">${ch.title}</span><span class="toc-page" dir="ltr">${chapterStartPages[i] || ''}</span></div>`)
        .join('');

      const tocPage: PageContent = {
        id: `page-toc`,
        type: 'toc',
        content: `<h2 class="toc-header">${language === 'he' ? 'תוכן עניינים' : 'Table of Contents'}</h2>${tocContent}`,
        images: [],
      };

      const blankAfterToc: PageContent = {
        id: `page-blank-2`,
        type: 'blank',
        content: '',
        images: [],
      };

      const updatedPages = [...pages];
      updatedPages.splice(insertIndex, 0, tocPage, blankAfterToc);
      setPages(updatedPages);
      setSettings({ ...settings, includeToc: true });
      toast.success(language === 'he' ? 'תוכן עניינים נוסף' : 'Table of Contents added');
    }
  };

  // Update page content (for future use with editable pages)
  const _updatePageContent = (index: number, content: string) => {
    const updatedPages = [...pages];
    updatedPages[index].content = content;
    setPages(updatedPages);
  };
  void _updatePageContent; // Suppress unused warning

  // Flipbook page count: front cover + content pages + back cover
  // Filter out 'summary' pages from content — they're rendered as the back cover
  const contentPages = pages.filter(p => p.type !== 'summary');
  const normalizedPages = contentPages.length % 2 === 0 ? contentPages : [...contentPages, { id: 'blank-pad', content: '', type: 'blank' as const } as PageContent];
  const totalDomPages = normalizedPages.length + 2; // + front cover + back cover
  const orderedContentPages = isBookRTL ? [...normalizedPages].reverse() : normalizedPages;
  const initialFlipPage = isBookRTL ? totalDomPages - 1 : 0;

  // Flipbook navigation — use jumpToSpread which syncs both flipbook and UI state
  const readNext = () => jumpToSpread(Math.min(totalSpreads - 1, currentSpread + 1));
  const readPrev = () => jumpToSpread(Math.max(0, currentSpread - 1));

  // Custom swipe gesture handlers — works on the flipbook container without
  // conflicting with image drag (which uses stopPropagation on the image elements)
  const handleSwipeStart = (clientX: number, clientY: number) => {
    swipeRef.current = { startX: clientX, startY: clientY, startTime: Date.now() };
  };
  const handleSwipeEnd = (clientX: number, clientY: number) => {
    if (!swipeRef.current) return;
    const { startX, startY, startTime } = swipeRef.current;
    swipeRef.current = null;

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    const elapsed = Date.now() - startTime;

    // Must be horizontal, fast enough, and long enough
    if (Math.abs(deltaX) < 40 || Math.abs(deltaY) > Math.abs(deltaX) || elapsed > 600) return;

    if (deltaX > 0) {
      // Swiped right → in Hebrew (RTL) = next page, in LTR = prev page
      isBookRTL ? readNext() : readPrev();
    } else {
      // Swiped left → in Hebrew (RTL) = prev page, in LTR = next page
      isBookRTL ? readPrev() : readNext();
    }
  };

  const handleFlipBookFlip = (e: any) => {
    const idx = e.data;
    const readingPos = isBookRTL ? totalDomPages - 1 - idx : idx;
    setCurrentSpread(readingPos === 0 ? 0 : Math.ceil(readingPos / 2));
  };

  const jumpToSpread = (spreadIdx: number) => {
    setCurrentSpread(spreadIdx);
    const domPage = isBookRTL
      ? totalDomPages - 1 - spreadIdx * 2
      : spreadIdx === 0 ? 0 : (spreadIdx - 1) * 2 + 1;
    const targetPage = Math.max(0, Math.min(domPage, totalDomPages - 1));
    // turnToPage jumps directly; flip animates one page toward the target
    flipBookRef.current?.pageFlip()?.turnToPage(targetPage);
  };

  // Navigate spreads with page flip animation
  const totalSpreads = Math.ceil(((pages?.length || 0) + 1) / 2); // +1 for cover
  const goToNextSpread = () => {
    if (currentSpread < totalSpreads - 1 && !isFlipping) {
      // For LTR: flip left page to the left; For RTL: flip right page to the right
      setIsFlipping(isBookRTL ? 'right' : 'left');
      setTimeout(() => {
        setCurrentSpread(currentSpread + 1);
        setTimeout(() => setIsFlipping(null), 300);
      }, 300);
    }
  };
  const goToPrevSpread = () => {
    if (currentSpread > 0 && !isFlipping) {
      // For LTR: flip right page to the right; For RTL: flip left page to the left
      setIsFlipping(isBookRTL ? 'left' : 'right');
      setTimeout(() => {
        setCurrentSpread(currentSpread - 1);
        setTimeout(() => setIsFlipping(null), 300);
      }, 300);
    }
  };

  // Get pages for current spread
  // "left" and "right" are VISUAL slots (left page, right page on screen).
  // For Hebrew/RTL books: odd page (1,3,5...) on the RIGHT, even page on the LEFT
  // For English/LTR books: odd page on the RIGHT, even page on the LEFT (same parity,
  // but reading starts from the left in LTR).
  const getSpreadPages = (): { left: PageContent | null; right: PageContent | null; isCover: boolean } => {
    if (!pages || pages.length === 0) {
      return { left: null, right: null, isCover: currentSpread === 0 };
    }
    if (currentSpread === 0) {
      return { left: null, right: null, isCover: true };
    }
    const startIndex = (currentSpread - 1) * 2;
    const firstPage = pages[startIndex] || null;   // Odd page (1, 3, 5...)
    const secondPage = pages[startIndex + 1] || null; // Even page (2, 4, 6...)

    if (isBookRTL) {
      // Hebrew/Arabic: odd page on RIGHT, even page on LEFT
      return {
        left: secondPage,
        right: firstPage,
        isCover: false,
      };
    }
    // English/LTR: even page on LEFT, odd page on RIGHT
    // (Standard convention: page 1 is a right-hand page, page 2 is the next left-hand page)
    return {
      left: secondPage,
      right: firstPage,
      isCover: false,
    };
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (selectedPageIndex !== null) {
          addBlankPage(selectedPageIndex);
        }
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveLayout();
      }
      if (e.key === 'ArrowRight') {
        isBookRTL ? goToPrevSpread() : goToNextSpread();
      }
      if (e.key === 'ArrowLeft') {
        isBookRTL ? goToNextSpread() : goToPrevSpread();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSpread, selectedPageIndex, isBookRTL]);

  if (loading) {
    return <BookLoader variant="fullscreen" />;
  }

  if (!book) return null;

  const spreadPages = getSpreadPages();
  void spreadPages; // kept for potential future use (e.g., page labels); flipbook manages its own rendering

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-deep-space via-deep-space to-cosmic-purple/20">
      {/* Top Toolbar */}
      <div className="glass-strong border-b border-memorial-gold/20 px-3 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Logo */}
            <button
              onClick={() => navigate('/dashboard')}
              className="hidden sm:flex items-center hover:opacity-80 transition-opacity"
            >
              <img
                src="/img/new/logo-mestory-small.png"
                alt="MeStory"
                className="h-8 sm:h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(255,215,0,0.3)]"
              />
            </button>
            <div className="hidden sm:block h-6 w-px bg-memorial-gold/30" />

            {/* Mobile Pages Toggle */}
            <button
              onClick={() => setShowMobilePages(!showMobilePages)}
              className="lg:hidden btn-ghost p-2"
            >
              <Layers className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate(`/editor/${bookId}`)}
              className="btn-ghost flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
            >
              {isUIRTL ? <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />}
              <span className="hidden sm:inline">{t('editor.toolbar.back')}</span>
            </button>
            <div className="hidden sm:block h-6 w-px bg-gray-700" />
            <h1 className="hidden md:block text-lg sm:text-xl font-semibold text-white truncate max-w-[200px]">{book.title}</h1>
            <span className="hidden lg:inline px-2 py-1 rounded bg-memorial-gold/20 text-memorial-gold text-xs font-medium">
              {isBookRTL ? t('book_layout.hebrew_rtl') : t('book_layout.english_ltr')}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            {/* Auto-save indicator - hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('book_layout.saving', 'Saving...')}</span>
                </>
              ) : autoSaveFailed ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400">{t('book_layout.auto_save_failed', 'Auto-save failed')}</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="hidden lg:inline">{t('book_layout.saved', 'Saved')} {lastSaved.toLocaleTimeString()}</span>
                </>
              ) : null}
            </div>

            {/* Book Structure Help Button - shows for RTL books */}
            {isBookRTL && (
              <button
                onClick={() => setShowBookStructureHelp(true)}
                className="btn-ghost p-1.5 sm:p-2 text-memorial-gold hover:bg-memorial-gold/20"
                title="הסבר מבנה הספר"
              >
                <span className="text-xs font-bold">?</span>
              </button>
            )}

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`btn-ghost p-1.5 sm:p-2 ${showSettings ? 'bg-white/10' : ''}`}
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Reader Mode Button */}
            <button
              onClick={() => setShowFlipReader(true)}
              disabled={pages.length === 0}
              className="btn-ghost flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 border border-memorial-gold/40 hover:bg-memorial-gold/10 disabled:opacity-30"
              title={language === 'he' ? 'מצב קריאה' : 'Reader mode'}
            >
              <BookOpen className="w-4 h-4 text-memorial-gold" />
              <span className="hidden sm:inline text-memorial-gold">
                {language === 'he' ? 'קריאה' : 'Read'}
              </span>
            </button>

            {/* Export Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="btn-secondary flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
              title={language === 'he' ? 'ייצוא הספר' : 'Export book'}
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">{t('design_studio.export_to_file', 'Export')}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={() => setShowPrintModal(true)}
              className="btn-secondary flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
              title={language === 'he' ? 'הדפסת ספר פיזי' : 'Print physical book'}
            >
              <Printer className="w-4 h-4" />
              <span className="hidden lg:inline">{language === 'he' ? 'הדפסה' : 'Print'}</span>
            </button>

            {/* Publish Button */}
            <button
              onClick={openPublishModal}
              className="btn-gold flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 shadow-glow-gold"
              title={language === 'he' ? 'פרסום בחנות' : 'Publish to store'}
            >
              <Rocket className="w-4 h-4" />
              <span className="hidden lg:inline">{t('design_studio.publish_to_store', 'Publish')}</span>
            </button>

            {/* Save Button */}
            <button
              onClick={() => saveLayout()}
              disabled={saving}
              className="btn-primary flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{t('book_layout.save')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="px-3 sm:px-6 py-2">
        <BookProgressStepper
          bookId={bookId || ''}
          currentStep="layout"
          progress={{
            hasContent: (book.chapters || []).some((ch: any) => ch.content && ch.content.length > 50),
            hasDesign: !!((book as any).coverDesign?.front?.imageUrl || (book as any).coverDesign?.coverColor || (book as any).aiDesignState?.status === 'completed'),
            hasLayout: !!(book as any).pageLayout || pages.length > 0,
            isPublished: (book as any).publishingStatus?.status === 'published',
            wordCount: (book.chapters || []).reduce((acc: number, ch: any) => acc + (ch.wordCount || 0), 0),
            chapterCount: (book.chapters || []).length,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Floating Toggle Buttons */}
        <div className="lg:hidden fixed bottom-6 left-4 z-40 flex flex-col gap-3">
          <button
            onClick={() => setShowMobilePages(!showMobilePages)}
            className="glass-strong p-4 rounded-full border border-memorial-gold/30 shadow-lg shadow-memorial-gold/10 active:scale-95 transition-transform"
            aria-label="Pages"
          >
            <Layers className="w-6 h-6 text-memorial-gold" />
          </button>
        </div>
        <div className="lg:hidden fixed bottom-6 right-4 z-40 flex flex-col gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="glass-strong p-4 rounded-full border border-indigo-500/30 shadow-lg shadow-indigo-500/10 active:scale-95 transition-transform"
            aria-label="Settings"
          >
            <Settings className="w-6 h-6 text-indigo-400" />
          </button>
        </div>

        {/* Mobile Pages Overlay */}
        {showMobilePages && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMobilePages(false)}
          />
        )}

        {/* Left Sidebar - Page Thumbnails (Right in RTL) */}
        <div className={`
          ${showMobilePages ? 'translate-x-0' : isUIRTL ? 'translate-x-full' : '-translate-x-full'}
          lg:translate-x-0
          fixed lg:relative z-50 lg:z-auto
          top-0 bottom-0
          ${isUIRTL ? 'right-0 lg:right-auto' : 'left-0 lg:left-auto'}
          w-[75vw] max-w-[280px] sm:w-48 lg:w-48 h-full max-h-screen
          glass-strong ${isUIRTL ? 'border-l' : 'border-r'} border-white/10 p-3 sm:p-4 overflow-y-auto
          transition-transform duration-300 ease-in-out
        `}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">{language === 'he' ? 'עמודים' : 'Pages'}</h3>
            <button
              onClick={() => setShowMobilePages(false)}
              className="lg:hidden btn-ghost p-3 min-w-[44px] min-h-[44px]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {/* ── Cover Spread ── */}
            <button
              onClick={() => { jumpToSpread(0); setShowMobilePages(false); }}
              className={`w-full rounded-lg border-2 transition-all overflow-hidden ${
                currentSpread === 0
                  ? 'border-memorial-gold shadow-sm shadow-memorial-gold/30'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              {/* Mini open-book: back cover left + front cover right */}
              <div className="flex" style={{ aspectRatio: '3/2' }}>
                {/* Left side – actual back cover preview */}
                <div
                  className="flex-1 flex flex-col items-center justify-center px-1 py-1 relative overflow-hidden"
                  style={{
                    background: backCoverImageUrl
                      ? `url(${backCoverImageUrl}) center/cover`
                      : `linear-gradient(160deg, ${book?.coverDesign?.coverColor || '#1a0a3e'}cc, ${book?.coverDesign?.coverColor || '#0d0820'})`,
                  }}
                >
                  {backCoverImageUrl && <div className="absolute inset-0 bg-black/25" />}
                  <p className="relative text-[4px] text-center opacity-70 line-clamp-3 leading-tight"
                    style={{ color: book?.coverDesign?.textColor || '#fff' }}>
                    {(book?.synopsis || book?.description || '').slice(0, 60)}
                  </p>
                </div>
                {/* Spine */}
                <div className="w-[3px] flex-shrink-0 bg-gradient-to-b from-black/60 via-gray-500/40 to-black/60" />
                {/* Right side – front cover */}
                <div
                  className="flex-1 flex flex-col items-center justify-center px-1 py-1 relative overflow-hidden"
                  style={{
                    background: book?.coverDesign?.imageUrl
                      ? `url(${book.coverDesign.imageUrl}) center/cover`
                      : `linear-gradient(160deg, ${book?.coverDesign?.coverColor || '#2d1b69'}, ${(book?.coverDesign?.coverColor || '#1a0a3e')}bb)`,
                  }}
                >
                  {book?.coverDesign?.imageUrl && <div className="absolute inset-0 bg-black/10" />}
                  <p className="relative text-[6px] font-bold text-center leading-tight line-clamp-2 w-full"
                    style={{ color: book?.coverDesign?.textColor || '#fff', fontFamily: book?.coverDesign?.fontFamily }}>
                    {book?.title}
                  </p>
                  <p className="relative text-[4px] mt-0.5 opacity-60 truncate w-full text-center"
                    style={{ color: book?.coverDesign?.textColor || '#fff' }}>
                    {book?.author?.name}
                  </p>
                </div>
              </div>
              <div className="bg-black/30 py-0.5 text-center" style={{ fontSize: '8px', color: '#888' }}>
                {language === 'he' ? 'כריכה' : 'Cover'}
              </div>
            </button>

            {/* ── Content Spreads ── */}
            {Array.from({ length: Math.ceil(pages.length / 2) }).map((_, i) => {
              const spreadIdx = i + 1;
              const p1 = pages[i * 2];
              const p2 = pages[i * 2 + 1];
              // RTL books: right page is page 1 (odd), left is page 2 (even)
              const leftPage = isBookRTL ? p2 : p1;
              const rightPage = isBookRTL ? p1 : p2;
              const leftNum  = isBookRTL ? i * 2 + 2 : i * 2 + 1;
              const rightNum = isBookRTL ? i * 2 + 1 : i * 2 + 2;

              // Render a single mini page cell showing actual content
              const miniPage = (page: PageContent | undefined) => {
                const bg = '#f5f0e8';
                if (!page || page.type === 'blank') {
                  return <div className="flex-1" style={{ background: bg }} />;
                }
                const firstImgUrl = page.images?.[0]?.url;
                const textSnippet = page.content
                  ? page.content.replace(/<[^>]+>/g, '').replace(/&[a-zA-Z]+;/g, ' ').trim().slice(0, 120)
                  : '';

                if (page.type === 'toc') return (
                  <div className="flex-1 flex flex-col p-1 gap-0.5" style={{ background: bg }}>
                    <div className="h-[2px] w-3/4 rounded mx-auto mb-1" style={{ background: '#aaa' }} />
                    {[70,50,70,60,65,45].map((w, j) => (
                      <div key={j} className="flex justify-between">
                        <div className="h-[1.5px] rounded" style={{ background: '#ccc', width: `${w}%` }} />
                        <div className="h-[1.5px] w-2 rounded ml-1" style={{ background: '#ccc' }} />
                      </div>
                    ))}
                  </div>
                );
                if (page.type === 'title') return (
                  <div className="flex-1 flex flex-col items-center justify-center gap-1 p-1" style={{ background: bg }}>
                    <div className="h-[2px] w-3/4 rounded" style={{ background: '#aaa' }} />
                    {textSnippet && (
                      <p style={{ fontSize: '3.5px', color: '#666', textAlign: 'center', lineHeight: 1.3, direction: isBookRTL ? 'rtl' : 'ltr' }}>
                        {textSnippet.slice(0, 40)}
                      </p>
                    )}
                  </div>
                );
                if (page.type === 'dedication') return (
                  <div className="flex-1 flex flex-col items-center justify-center p-1" style={{ background: bg }}>
                    <span style={{ fontSize: '8px', color: '#bbb' }}>❝</span>
                    {textSnippet && (
                      <p style={{ fontSize: '3px', color: '#888', textAlign: 'center', lineHeight: 1.3, marginTop: 1, direction: isBookRTL ? 'rtl' : 'ltr' }}>
                        {textSnippet.slice(0, 60)}
                      </p>
                    )}
                  </div>
                );
                // chapter / summary / continuation — show real image + text
                return (
                  <div className="flex-1 flex flex-col overflow-hidden" style={{ background: bg }}>
                    {firstImgUrl ? (
                      <>
                        <div style={{ height: '45%', flexShrink: 0 }}>
                          <img
                            src={firstImgUrl}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 p-0.5 overflow-hidden" style={{ direction: isBookRTL ? 'rtl' : 'ltr' }}>
                          <p style={{ fontSize: '3px', color: '#444', lineHeight: 1.4, wordBreak: 'break-word' }}>
                            {textSnippet}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 p-1 overflow-hidden" style={{ direction: isBookRTL ? 'rtl' : 'ltr' }}>
                        <div className="h-[2px] w-2/3 rounded mb-1" style={{ background: '#999' }} />
                        <p style={{ fontSize: '3px', color: '#444', lineHeight: 1.4, wordBreak: 'break-word' }}>
                          {textSnippet}
                        </p>
                      </div>
                    )}
                  </div>
                );
              };

              return (
                <button
                  key={i}
                  onClick={() => { jumpToSpread(spreadIdx); setShowMobilePages(false); }}
                  className={`w-full rounded-lg border-2 transition-all overflow-hidden ${
                    currentSpread === spreadIdx
                      ? 'border-memorial-gold shadow-sm shadow-memorial-gold/30'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex" style={{ aspectRatio: '3/2' }}>
                    {miniPage(leftPage)}
                    {/* Book spine */}
                    <div className="w-[3px] flex-shrink-0 bg-gradient-to-b from-black/50 via-gray-500/30 to-black/50" />
                    {miniPage(rightPage)}
                  </div>
                  {/* Page number label — one place only */}
                  <div className="bg-black/30 py-0.5 text-center" style={{ fontSize: '8px', color: '#888' }}>
                    {leftNum}–{Math.min(rightNum, pages.length)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 space-y-2">
            <button
              onClick={toggleToc}
              className="w-full btn-secondary text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2"
            >
              <List className="w-4 h-4" />
              <span className="truncate">{settings.includeToc ? (language === 'he' ? 'הסר תוכן עניינים' : t('book_layout.remove_toc')) : (language === 'he' ? 'הוסף תוכן עניינים' : t('book_layout.add_toc'))}</span>
            </button>
          </div>
        </div>

        {/* Center - Page Spread View (BookFlipReader-style chrome with desk texture) */}
        <div
          className="flex-1 flex flex-col overflow-hidden rounded-xl"
          style={{
            backgroundImage: 'linear-gradient(to bottom right, rgba(10,10,31,0.92), rgba(10,10,31,0.85), rgba(88,28,135,0.15)), url(/img/new/texture-desk-library.png)',
            backgroundSize: 'cover, cover',
            backgroundPosition: 'center, center',
          }}
        >

          {/* Top bar — compact */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/30 backdrop-blur-sm border-b border-memorial-gold/20">
            {/* Left: back to cover */}
            <button
              onClick={() => jumpToSpread(0)}
              disabled={currentSpread === 0}
              className="flex items-center gap-2 text-memorial-gold hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={language === 'he' ? 'חזרה להתחלה' : 'Back to start'}
            >
              <RotateCcw className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">
                {language === 'he' ? 'חזרה להתחלה' : 'Back to start'}
              </span>
            </button>

            {/* Center: page counter like BookFlipReader "8 / 10" */}
            <div className="text-memorial-gold/80 text-sm font-medium tracking-wide" dir="ltr">
              {currentSpread === 0
                ? t('book_layout.front_cover')
                : `${Math.min((currentSpread - 1) * 2 + 2, pages.length)} / ${pages.length}`
              }
            </div>

            {/* Right: close / back button */}
            <button
              onClick={() => navigate(`/editor/${bookId}`)}
              className="flex items-center gap-2 text-memorial-gold hover:text-white transition-colors"
            >
              <span className="text-sm font-medium">{isBookRTL ? 'סגור' : 'Close'}</span>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Flipbook content area — with custom swipe gesture support */}
          <div
            className="flex-1 flex flex-col items-center justify-center p-1 sm:p-2 lg:p-4 overflow-hidden min-h-0"
            onTouchStart={(e) => handleSwipeStart(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={(e) => handleSwipeEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
            onMouseDown={(e) => handleSwipeStart(e.clientX, e.clientY)}
            onMouseUp={(e) => handleSwipeEnd(e.clientX, e.clientY)}
          >

          {/* react-pageflip book — key on page count forces clean remount when TOC added/removed */}
          <div key={`flipbook-${orderedContentPages.length}`} className="flex-1 min-h-0 flex items-center justify-center overflow-hidden" style={{ width: '100%' }}>
            <HTMLFlipBook
              ref={flipBookRef}
              width={pageDimensions.pageW}
              height={pageDimensions.pageH}
              size="stretch"
              minWidth={Math.round(pageDimensions.pageW * 0.5)}
              maxWidth={Math.round(pageDimensions.pageW * 1.2)}
              minHeight={Math.round(pageDimensions.pageH * 0.5)}
              maxHeight={Math.round(pageDimensions.pageH * 1.1)}
              maxShadowOpacity={0.5}
              showCover={true}
              mobileScrollSupport={false}
              drawShadow={true}
              flippingTime={900}
              usePortrait={false}
              autoSize={true}
              clickEventForward={true}
              useMouseEvents={true}
              swipeDistance={200}
              showPageCorners={false}
              disableFlipByClick={true}
              startPage={initialFlipPage}
              startZIndex={0}
              className="book-flip"
              style={{}}
              onFlip={handleFlipBookFlip}
            >
              {/* First DOM page: Front cover (LTR) or Back cover (RTL) */}
              {isBookRTL ? (
                <FlipPage className="back-cover">
                  <BackCoverPreview
                    book={book}
                    backCoverImageUrl={backCoverImageUrl}
                    synopsis={pages.find(p => p.type === 'summary')?.content || book.synopsis || book.description}
                    language={language}
                  />
                </FlipPage>
              ) : (
                <FlipPage className="front-cover">
                  <CoverPreview
                    book={book}
                    coverImageUrl={coverImageUrl}
                    onTitlePositionChange={handleTitlePositionChange}
                    onAuthorPositionChange={handleAuthorPositionChange}
                  />
                </FlipPage>
              )}

              {/* Content pages — each renders full PageRenderer with editing */}
              {orderedContentPages.map((page) => {
                const idx = pages.findIndex(p => p.id === page.id);
                const actualIdx = idx === -1 ? pages.length : idx;

                if (idx === -1 && page.type !== 'blank') {
                  return (
                    <FlipPage key={page.id}>
                      <div className="w-full h-full flex items-center justify-center bg-white text-gray-300 text-sm">
                        {t('book_layout.blank_page', 'עמוד ריק')}
                      </div>
                    </FlipPage>
                  );
                }

                if (page.type === 'summary') {
                  return (
                    <FlipPage key={page.id}>
                      <BackCoverPreview
                        book={book}
                        backCoverImageUrl={backCoverImageUrl}
                        synopsis={page.content}
                        language={language}
                      />
                    </FlipPage>
                  );
                }

                if (page.type === 'blank' && page.id === 'blank-pad') {
                  return (
                    <FlipPage key="blank-pad">
                      <div className="w-full h-full flex items-center justify-center bg-white text-gray-300 text-sm">
                        {t('book_layout.blank_page', 'עמוד ריק')}
                      </div>
                    </FlipPage>
                  );
                }

                return (
                  <FlipPage
                    key={page.id}
                    onClick={() => setSelectedPageIndex(actualIdx)}
                  >
                    <div
                      key={`page-${page.id}-${editingPageIndex === actualIdx ? 'edit' : 'view'}`}
                      className="w-full h-full"
                      style={{ backgroundColor: settings.backgroundColor || '#ffffff' }}
                    >
                      <PageRenderer
                        page={page}
                        pageIndex={actualIdx}
                        settings={settings}
                        isRTL={isBookRTL}
                        isSelected={selectedPageIndex === actualIdx}
                        onImageSelect={setSelectedImageId}
                        selectedImageId={selectedImageId}
                        onImageUpdate={(imageId, updates) => updateImagePosition(actualIdx, imageId, updates)}
                        onImageDelete={(imageId) => deleteImage(actualIdx, imageId)}
                        onImageDuplicate={(imageId) => duplicateImage(actualIdx, imageId)}
                        onMoveToPage={(imageId, toPageIndex) => moveImageToPage(actualIdx, imageId, toPageIndex)}
                        totalPages={pages.length}
                        pageNumber={actualIdx + 1}
                        bookTitle={book.title}
                        showHeader={aiDesign?.layout?.headerStyle !== 'none'}
                        headerStyle={aiDesign?.layout?.headerStyle as 'book-title' | 'chapter-title' | 'none'}
                        aiImagePlacements={
                          page.type === 'chapter' && page.chapterIndex !== undefined
                            ? (aiDesign?.imagePlacements || []).filter((p: any) => p.chapterIndex === page.chapterIndex)
                            : []
                        }
                        language={language}
                        editingPageIndex={editingPageIndex}
                        editingContent={editingContent}
                        editableRef={editableRef}
                        onStartEditing={handleStartEditing}
                        onFinishEditing={handleFinishEditing}
                        onCancelEditing={handleCancelEditing}
                        onImageAdded={(imageUrl, imageData) => handleImageFromPlaceholder(actualIdx, imageUrl, imageData)}
                        bookId={bookId}
                        bookContext={{
                          title: book.title,
                          genre: book.genre,
                          chapterTitle: page.chapterIndex !== undefined ? book.chapters[page.chapterIndex]?.title : undefined,
                        }}
                      />
                    </div>
                  </FlipPage>
                );
              })}

              {/* Last DOM page: Back cover (LTR) or Front cover (RTL) */}
              {isBookRTL ? (
                <FlipPage className="front-cover">
                  <CoverPreview
                    book={book}
                    coverImageUrl={coverImageUrl}
                    onTitlePositionChange={handleTitlePositionChange}
                    onAuthorPositionChange={handleAuthorPositionChange}
                  />
                </FlipPage>
              ) : (
                <FlipPage className="back-cover">
                  <BackCoverPreview
                    book={book}
                    backCoverImageUrl={backCoverImageUrl}
                    synopsis={book.synopsis || book.description}
                    language={language}
                  />
                </FlipPage>
              )}
            </HTMLFlipBook>
          </div>{/* end centering flex wrapper */}

          {/* Book reflection effect */}
          <div
            className="w-full h-8 opacity-20 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)',
              filter: 'blur(4px)',
              transform: 'scaleY(-0.3)',
              maskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
            }}
          />

          {/* Page info shown in top bar — no duplicate labels needed here */}

          {/* Page Actions */}
          <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
            {selectedPageIndex !== null && (
              <>
                <button
                  onClick={() => {
                    setShowImageModal(true);
                  }}
                  className="btn-secondary text-xs sm:text-sm flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5"
                >
                  <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{language === 'he' ? 'תמונה' : 'Image'}</span>
                </button>
                <button
                  onClick={() => addBlankPage(selectedPageIndex)}
                  className="btn-secondary text-xs sm:text-sm flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{language === 'he' ? 'עמוד' : 'Page'}</span>
                </button>
                {pages[selectedPageIndex]?.type === 'blank' && (
                  <button
                    onClick={() => removePage(selectedPageIndex)}
                    className="btn-secondary text-xs sm:text-sm flex items-center gap-1 sm:gap-2 text-red-400 px-2 sm:px-3 py-1.5"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{language === 'he' ? 'מחק' : 'Remove'}</span>
                  </button>
                )}
              </>
            )}
            {/* TOC toggle — always visible for mobile access */}
            <button
              onClick={toggleToc}
              className="btn-secondary text-xs sm:text-sm flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 lg:hidden"
            >
              <List className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{settings.includeToc ? (language === 'he' ? 'הסר תוכן' : 'Remove TOC') : (language === 'he' ? 'הוסף תוכן' : 'Add TOC')}</span>
            </button>
          </div>

          {/* Keyboard shortcuts: Ctrl+Enter=Add page, Ctrl+S=Save, Arrows=Navigate */}
          </div>

          {/* Bottom bar — compact navigation with safe distance from URL bar */}
          <div className="flex items-center justify-center gap-4 px-4 py-3 pb-safe bg-black/30 backdrop-blur-sm border-t border-memorial-gold/20" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <button
              onClick={readPrev}
              className="p-3 rounded-full bg-memorial-gold/10 hover:bg-memorial-gold/20 text-memorial-gold transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
              title={language === 'he' ? 'הדף הקודם' : 'Previous'}
            >
              {isBookRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>

            <button
              onClick={readNext}
              className="p-3 rounded-full bg-memorial-gold/10 hover:bg-memorial-gold/20 text-memorial-gold transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
              title={language === 'he' ? 'הדף הבא' : 'Next'}
            >
              {isBookRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Book Structure Help Overlay for RTL books */}
        <AnimatePresence>
          {showBookStructureHelp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={() => setShowBookStructureHelp(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-deep-space border border-memorial-gold/30 rounded-2xl p-6 max-w-2xl w-full"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
              >
                <h2 className="text-2xl font-bold text-memorial-gold mb-4 text-center">
                  מבנה ספר עברי - דו-צדדי
                </h2>

                <div className="space-y-4 text-white">
                  {/* Visual explanation */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex justify-center items-center gap-4 mb-4">
                      {/* Mini book spread visualization */}
                      <div className="flex gap-1">
                        <div className="w-20 h-28 bg-white rounded border-2 border-memorial-gold/50 flex flex-col items-center justify-center text-deep-space text-xs p-1">
                          <span className="font-bold text-sm">2</span>
                          <span className="text-[8px]">(זוגי)</span>
                          <span className="text-[8px] text-gray-500">צד שמאל</span>
                        </div>
                        <div className="w-2 h-28 bg-gradient-to-r from-amber-600 to-amber-800 rounded"></div>
                        <div className="w-20 h-28 bg-white rounded border-2 border-green-500 flex flex-col items-center justify-center text-deep-space text-xs p-1">
                          <span className="font-bold text-sm">1</span>
                          <span className="text-[8px]">(אי-זוגי)</span>
                          <span className="text-[8px] text-green-600">התחל כאן!</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-memorial-gold animate-pulse">
                      <span className="font-medium">כיוון הקריאה</span>
                      <span className="text-lg">←</span>
                      <span className="text-lg">←</span>
                      <span className="text-lg">←</span>
                    </div>
                  </div>

                  {/* Explanation points */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shrink-0">1</span>
                      <p>בספר עברי, הקריאה מתחילה מ<strong>עמוד 1 בצד ימין</strong> (אי-זוגי)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-memorial-gold text-deep-space flex items-center justify-center text-sm font-bold shrink-0">2</span>
                      <p>כשהופכים דף, <strong>עמוד 2 (זוגי) יופיע משמאל</strong></p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0">3</span>
                      <p>בהדפסה דו-צדדית: <strong>עמודים אי-זוגיים מודפסים מימין, זוגיים משמאל</strong></p>
                    </div>
                  </div>

                  {/* Print note */}
                  <div className="bg-memorial-gold/10 border border-memorial-gold/30 rounded-lg p-3 text-sm">
                    <span className="text-memorial-gold font-bold">טיפ להדפסה: </span>
                    כשתייצא את הספר ל-PDF ותדפיס דו-צדדי, העמודים יסודרו אוטומטית בצורה נכונה!
                  </div>
                </div>

                <button
                  onClick={() => setShowBookStructureHelp(false)}
                  className="mt-6 w-full btn-primary py-3 text-lg"
                >
                  הבנתי, תודה!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Overlay for mobile */}
        {showSettings && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowSettings(false)}
          />
        )}

        {/* Right Sidebar - Settings (Left in RTL) */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ x: isUIRTL ? '-100%' : '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isUIRTL ? '-100%' : '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed lg:relative ${isUIRTL ? 'left-0' : 'right-0'} top-0 lg:top-auto h-full z-50 lg:z-auto glass-strong ${isUIRTL ? 'border-r' : 'border-l'} border-white/10 overflow-hidden w-4/5 max-w-[320px] sm:w-80`}
            >
              <div className="p-4 sm:p-6 w-full h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    {language === 'he' ? 'הגדרות פריסה' : 'Layout Settings'}
                  </h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="lg:hidden btn-ghost p-3 min-w-[44px] min-h-[44px]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* AI Complete Design - One Button for Everything */}
                <div className="mb-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAIDesignWizard(true)}
                    className="w-full relative overflow-hidden rounded-xl p-4 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-lg shadow-orange-500/25"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-pink-400/20 animate-pulse" />
                    <div className="relative flex flex-col items-center justify-center gap-2">
                      <Sparkles className="w-8 h-8" />
                      <div className="text-center">
                        <div className="font-bold text-xl">
                          {language === 'he' ? 'עצב לי הכל' : 'Design Everything'}
                        </div>
                        <div className="text-xs text-white/80 mt-1">
                          {language === 'he' ? 'צבעים, גופנים ותמונות עטיפה בלחיצה אחת' : 'Colors, fonts and cover images in one click'}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </div>

                {/* Premium Auto-Design — multi-agent typesetting (planner + critic + revision) */}
                <div className="mb-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAutoDesignModal(true)}
                    className="w-full relative overflow-hidden rounded-xl p-4 bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700 text-white shadow-lg shadow-violet-700/25"
                  >
                    <div className="relative flex flex-col items-center justify-center gap-2">
                      <Sparkles className="w-7 h-7" />
                      <div className="text-center">
                        <div className="font-bold text-lg">
                          {language === 'he' ? 'עיצוב פרימיום (אייג׳נטים)' : 'Premium Auto-Design (Agents)'}
                        </div>
                        <div className="text-xs text-white/85 mt-1">
                          {language === 'he'
                            ? 'אייג׳נטים בוחרים סגנון, פלטה ופריסת עמודים. עד 3 גרסאות לכל ספר.'
                            : 'Agents pick style, palette and page layout. Up to 3 versions per book.'}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </div>

                {/* Auto-design status — surfaces the saved designed result in the
                    layout so the user sees it exists and can open the preview. */}
                {(book as any)?.autoDesignPlan && (
                  <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm text-emerald-200">
                        {language === 'he' ? 'עיצוב אוטומטי מוכן ושמור' : 'Auto-design saved'}
                        {(book as any)?.autoDesignPlan?.designSystem && (
                          <span className="opacity-75"> · {(book as any).autoDesignPlan.designSystem}</span>
                        )}
                      </div>
                      <button
                        onClick={() => setShowAutoDesignModal(true)}
                        className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        {language === 'he' ? 'צפה בעיצוב' : 'View design'}
                      </button>
                    </div>
                    <iframe
                      src={`/print/${bookId}/designed`}
                      title="designed-preview"
                      className="mt-3 w-full rounded-lg border border-white/10 bg-white"
                      style={{ height: 420 }}
                    />
                  </div>
                )}

                {/* Template Selection */}
                <div className="mb-6 space-y-3">
                  <button
                    onClick={() => setShowTemplateGallery(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white font-medium transition-all"
                  >
                    <Layout className="w-5 h-5" />
                    {language === 'he' ? 'בחר תבנית' : 'Choose Template'}
                  </button>

                  {/* Save as Template button - only show when AI design is applied */}
                  {aiDesign && (
                    <button
                      onClick={() => setShowSaveTemplateModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-xl text-white font-medium transition-all"
                    >
                      <Save className="w-5 h-5" />
                      {language === 'he' ? 'שמור כתבנית' : 'Save as Template'}
                    </button>
                  )}

                  {settings.templateId && (
                    <p className="text-xs text-indigo-400 mt-2 text-center">
                      {language === 'he' ? '✓ תבנית מוחלת' : '✓ Template applied'}
                    </p>
                  )}
                </div>

                <div className="border-b border-white/10 mb-4" />

                {/* Page Size Selector */}
                <div className="mb-5">
                  <label className="block text-sm text-gray-300 mb-2 font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-memorial-gold" />
                    {language === 'he' ? 'גודל עמוד' : 'Page Size'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {([
                      { key: 'A5', label: 'A5', sub: '148×210', icon: '📄' },
                      { key: 'A4', label: 'A4', sub: '210×297', icon: '📋' },
                      { key: 'B5', label: 'B5', sub: '176×250', icon: '📖' },
                      { key: 'Letter', label: 'Letter', sub: '216×279', icon: '📝' },
                      { key: '6x9', label: '6×9"', sub: '152×229', icon: '📗' },
                      { key: '5x8', label: '5×8"', sub: '127×203', icon: '📒' },
                      { key: 'Square', label: language === 'he' ? 'מרובע' : 'Square', sub: '210×210', icon: '🖼️' },
                      { key: 'Pocket', label: language === 'he' ? 'כיס' : 'Pocket', sub: '127×178', icon: '📔' },
                      { key: 'Custom', label: language === 'he' ? 'מותאם' : 'Custom', sub: '...', icon: '✏️' },
                    ] as { key: typeof settings.pageSize; label: string; sub: string; icon: string }[]).map(({ key, label, sub, icon }) => (
                      <button
                        key={key}
                        onClick={() => setSettings({ ...settings, pageSize: key })}
                        className={`flex flex-col items-center p-2 rounded-lg border transition-all text-xs ${
                          settings.pageSize === key
                            ? 'border-memorial-gold bg-memorial-gold/20 text-memorial-gold'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30'
                        }`}
                      >
                        <span className="text-base mb-0.5">{icon}</span>
                        <span className="font-semibold">{label}</span>
                        <span className="text-[9px] opacity-60">{sub}</span>
                      </button>
                    ))}
                  </div>
                  {settings.pageSize === 'Custom' && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">{language === 'he' ? 'רוחב (מ"מ)' : 'Width (mm)'}</label>
                        <input
                          type="number"
                          min="80" max="400"
                          value={settings.customPageSize?.width || 148}
                          onChange={(e) => setSettings({ ...settings, customPageSize: { width: parseInt(e.target.value) || 148, height: settings.customPageSize?.height || 210 } })}
                          className="input w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">{language === 'he' ? 'גובה (מ"מ)' : 'Height (mm)'}</label>
                        <input
                          type="number"
                          min="100" max="600"
                          value={settings.customPageSize?.height || 210}
                          onChange={(e) => setSettings({ ...settings, customPageSize: { width: settings.customPageSize?.width || 148, height: parseInt(e.target.value) || 210 } })}
                          className="input w-full text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-b border-white/10 mb-4" />

                {/* Font Size */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-300 mb-2">{language === 'he' ? 'גודל גופן' : 'Font Size'}</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSettings({ ...settings, fontSize: Math.max(10, settings.fontSize - 1) })}
                      className="btn-ghost p-2"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-white font-medium w-12 text-center">{settings.fontSize}px</span>
                    <button
                      onClick={() => setSettings({ ...settings, fontSize: Math.min(24, settings.fontSize + 1) })}
                      className="btn-ghost p-2"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Line Height */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-300 mb-2">{language === 'he' ? 'גובה שורה' : 'Line Height'}</label>
                  <input
                    type="range"
                    min="1.2"
                    max="2.5"
                    step="0.1"
                    value={settings.lineHeight}
                    onChange={(e) => setSettings({ ...settings, lineHeight: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">{settings.lineHeight}</span>
                </div>

                {/* Font Family */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-300 mb-2">{language === 'he' ? 'גופן' : 'Font'}</label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                    className="input w-full"
                  >
                    {availableFonts.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                {/* Text Color */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-300 mb-2 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    {language === 'he' ? 'צבע טקסט' : 'Text Color'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {textColorPresets.map(preset => (
                      <button
                        key={preset.color}
                        onClick={() => setSettings({ ...settings, textColor: preset.color })}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          settings.textColor === preset.color
                            ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-110'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.textColor || '#000000'}
                      onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <span className="text-xs text-gray-400">{language === 'he' ? 'צבע מותאם' : 'Custom color'}</span>
                  </div>
                </div>

                {/* Background Color */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-300 mb-2 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    {language === 'he' ? 'צבע רקע' : 'Background Color'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { color: '#ffffff', name: 'White', nameHe: 'לבן' },
                      { color: '#faf8f5', name: 'Cream', nameHe: 'קרם' },
                      { color: '#f5f0e6', name: 'Parchment', nameHe: 'קלף' },
                      { color: '#fffbeb', name: 'Warm', nameHe: 'חם' },
                      { color: '#f0fdf4', name: 'Mint', nameHe: 'מנטה' },
                      { color: '#fdf2f8', name: 'Rose', nameHe: 'ורוד' },
                      { color: '#f8fafc', name: 'Cool', nameHe: 'קר' },
                      { color: '#1a1a1a', name: 'Dark', nameHe: 'כהה' },
                    ].map(preset => (
                      <button
                        key={preset.color}
                        onClick={() => setSettings({ ...settings, backgroundColor: preset.color })}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          settings.backgroundColor === preset.color
                            ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-110'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={language === 'he' ? preset.nameHe : preset.name}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.backgroundColor || '#ffffff'}
                      onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <span className="text-xs text-gray-400">{language === 'he' ? 'צבע מותאם' : 'Custom color'}</span>
                  </div>
                </div>

                {/* Margins */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-300 mb-2">{language === 'he' ? 'שוליים' : 'Margins'}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400">{language === 'he' ? 'למעלה' : 'Top'}</label>
                      <input
                        type="number"
                        value={settings.margins.top}
                        onChange={(e) => setSettings({
                          ...settings,
                          margins: { ...settings.margins, top: parseInt(e.target.value) || 0 },
                        })}
                        className="input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">{language === 'he' ? 'למטה' : 'Bottom'}</label>
                      <input
                        type="number"
                        value={settings.margins.bottom}
                        onChange={(e) => setSettings({
                          ...settings,
                          margins: { ...settings.margins, bottom: parseInt(e.target.value) || 0 },
                        })}
                        className="input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">{language === 'he' ? 'שמאל' : 'Left'}</label>
                      <input
                        type="number"
                        value={settings.margins.left}
                        onChange={(e) => setSettings({
                          ...settings,
                          margins: { ...settings.margins, left: parseInt(e.target.value) || 0 },
                        })}
                        className="input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">{language === 'he' ? 'ימין' : 'Right'}</label>
                      <input
                        type="number"
                        value={settings.margins.right}
                        onChange={(e) => setSettings({
                          ...settings,
                          margins: { ...settings.margins, right: parseInt(e.target.value) || 0 },
                        })}
                        className="input w-full text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showPageNumbers}
                      onChange={(e) => setSettings({ ...settings, showPageNumbers: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-white/10"
                    />
                    <span className="text-sm text-gray-300">{language === 'he' ? 'הצג מספרי עמודים' : 'Show page numbers'}</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.includeToc}
                      onChange={() => {
                        // Use toggleToc which preserves user edits
                        toggleToc();
                      }}
                      className="w-4 h-4 rounded border-gray-600 bg-white/10"
                    />
                    <span className="text-sm text-gray-300">{language === 'he' ? 'כלול תוכן עניינים' : 'Include Table of Contents'}</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.includeBackCover}
                      onChange={(e) => {
                        const include = e.target.checked;
                        setSettings({ ...settings, includeBackCover: include });
                        // Toggle back cover without regenerating all pages
                        if (include) {
                          // Add back cover if not present
                          const hasSummary = pages?.some(p => p.type === 'summary');
                          if (!hasSummary && book) {
                            const summaryPage: PageContent = {
                              id: `page-summary`,
                              type: 'summary',
                              content: book.synopsis || book.description || '',
                              images: [],
                            };
                            setPages(prev => [...(prev || []), summaryPage]);
                          }
                        } else {
                          // Remove back cover
                          setPages(prev => (prev || []).filter(p => p.type !== 'summary'));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-600 bg-white/10"
                    />
                    <span className="text-sm text-gray-300">{language === 'he' ? 'כלול כריכה אחורית עם תקציר' : 'Include back cover with summary'}</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSaveEnabled}
                      onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-white/10"
                    />
                    <span className="text-sm text-gray-300">{language === 'he' ? 'שמירה אוטומטית' : 'Auto-save'}</span>
                  </label>
                </div>

                <div className="border-b border-white/10 my-4" />

                {/* ── Design Elements ── */}
                <div className="mb-2">
                  <h4 className="text-sm font-semibold text-memorial-gold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {language === 'he' ? 'אלמנטים עיצוביים' : 'Design Elements'}
                  </h4>

                  {/* Columns */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-2">{language === 'he' ? 'עמודות' : 'Columns'}</label>
                    <div className="grid grid-cols-4 gap-1">
                      {([1,2,3,4] as const).map(col => (
                        <button
                          key={col}
                          onClick={() => setSettings({ ...settings, columns: col })}
                          className={`py-1.5 rounded-lg text-xs font-medium transition-all border ${settings.columns === col ? 'border-memorial-gold bg-memorial-gold/20 text-memorial-gold' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30'}`}
                        >{col}</button>
                      ))}
                    </div>
                  </div>

                  {/* Drop Cap */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-2">{language === 'he' ? 'אות ראשונה גדולה' : 'Drop Cap'}</label>
                    <div className="grid grid-cols-2 gap-1">
                      {([
                        { v: 'none', label: language === 'he' ? 'ללא' : 'None' },
                        { v: 'classic', label: language === 'he' ? 'קלאסי' : 'Classic' },
                        { v: 'decorative', label: language === 'he' ? 'מעוטר' : 'Decorative' },
                        { v: 'box', label: language === 'he' ? 'מסגרת' : 'Box' },
                      ] as { v: typeof settings.dropCapStyle; label: string }[]).map(({ v, label }) => (
                        <button key={v} onClick={() => setSettings({ ...settings, dropCapStyle: v })}
                          className={`py-1.5 rounded-lg text-xs font-medium transition-all border ${settings.dropCapStyle === v ? 'border-memorial-gold bg-memorial-gold/20 text-memorial-gold' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30'}`}
                        >{label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Section Divider */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-2">{language === 'he' ? 'מפריד פרק' : 'Section Divider'}</label>
                    <div className="grid grid-cols-3 gap-1">
                      {([
                        { v: 'none', label: language === 'he' ? 'ללא' : 'None' },
                        { v: 'line', label: language === 'he' ? 'קו' : 'Line' },
                        { v: 'dots', label: language === 'he' ? 'נקודות' : 'Dots' },
                        { v: 'stars', label: language === 'he' ? 'כוכבים' : 'Stars' },
                        { v: 'wave', label: language === 'he' ? 'גל' : 'Wave' },
                        { v: 'ornament', label: language === 'he' ? 'עיטור' : 'Ornament' },
                      ] as { v: typeof settings.dividerStyle; label: string }[]).map(({ v, label }) => (
                        <button key={v} onClick={() => setSettings({ ...settings, dividerStyle: v })}
                          className={`py-1.5 rounded-lg text-xs font-medium transition-all border ${settings.dividerStyle === v ? 'border-memorial-gold bg-memorial-gold/20 text-memorial-gold' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30'}`}
                        >{label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Page Frame */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-2">{language === 'he' ? 'מסגרת עמוד' : 'Page Frame'}</label>
                    <div className="grid grid-cols-3 gap-1">
                      {([
                        { v: 'none', label: language === 'he' ? 'ללא' : 'None' },
                        { v: 'simple', label: language === 'he' ? 'פשוט' : 'Simple' },
                        { v: 'double', label: language === 'he' ? 'כפול' : 'Double' },
                        { v: 'ornate', label: language === 'he' ? 'מפואר' : 'Ornate' },
                        { v: 'rounded', label: language === 'he' ? 'עגול' : 'Rounded' },
                        { v: 'gradient', label: language === 'he' ? 'גרדיאנט' : 'Gradient' },
                      ] as { v: typeof settings.pageFrame; label: string }[]).map(({ v, label }) => (
                        <button key={v} onClick={() => setSettings({ ...settings, pageFrame: v })}
                          className={`py-1.5 rounded-lg text-xs font-medium transition-all border ${settings.pageFrame === v ? 'border-memorial-gold bg-memorial-gold/20 text-memorial-gold' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30'}`}
                        >{label}</button>
                      ))}
                    </div>
                    {settings.pageFrame !== 'none' && (
                      <div className="mt-2 flex items-center gap-2">
                        <input type="color" value={settings.frameColor || '#8b6914'}
                          onChange={(e) => setSettings({ ...settings, frameColor: e.target.value })}
                          className="w-7 h-7 rounded cursor-pointer border-0"
                        />
                        <span className="text-xs text-gray-400">{language === 'he' ? 'צבע מסגרת' : 'Frame color'}</span>
                      </div>
                    )}
                  </div>

                  {/* Background Pattern */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-2">{language === 'he' ? 'תבנית רקע' : 'Background Pattern'}</label>
                    <div className="grid grid-cols-3 gap-1">
                      {([
                        { v: 'none', label: language === 'he' ? 'ללא' : 'None' },
                        { v: 'dots', label: language === 'he' ? 'נקודות' : 'Dots' },
                        { v: 'grid', label: language === 'he' ? 'רשת' : 'Grid' },
                        { v: 'waves', label: language === 'he' ? 'גלים' : 'Waves' },
                        { v: 'stripes', label: language === 'he' ? 'פסים' : 'Stripes' },
                        { v: 'geometric', label: language === 'he' ? 'גאומטרי' : 'Geometric' },
                      ] as { v: typeof settings.backgroundPattern; label: string }[]).map(({ v, label }) => (
                        <button key={v} onClick={() => setSettings({ ...settings, backgroundPattern: v })}
                          className={`py-1.5 rounded-lg text-xs font-medium transition-all border ${settings.backgroundPattern === v ? 'border-memorial-gold bg-memorial-gold/20 text-memorial-gold' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30'}`}
                        >{label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Header Decoration */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-2">{language === 'he' ? 'עיטור כותרת פרק' : 'Chapter Header Decoration'}</label>
                    <div className="grid grid-cols-3 gap-1">
                      {([
                        { v: 'none', label: language === 'he' ? 'ללא' : 'None' },
                        { v: 'line', label: language === 'he' ? 'קו' : 'Line' },
                        { v: 'gradient-line', label: language === 'he' ? 'גרדיאנט' : 'Gradient' },
                        { v: 'ornament', label: language === 'he' ? 'עיטור' : 'Ornament' },
                        { v: 'dots', label: language === 'he' ? 'נקודות' : 'Dots' },
                      ] as { v: typeof settings.headerDecoration; label: string }[]).map(({ v, label }) => (
                        <button key={v} onClick={() => setSettings({ ...settings, headerDecoration: v })}
                          className={`py-1.5 rounded-lg text-xs font-medium transition-all border ${settings.headerDecoration === v ? 'border-memorial-gold bg-memorial-gold/20 text-memorial-gold' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30'}`}
                        >{label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Corner Decorations */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-2">{language === 'he' ? 'עיטורי פינות' : 'Corner Decorations'}</label>
                    <div className="grid grid-cols-3 gap-1">
                      {([
                        { v: 'none', label: language === 'he' ? 'ללא' : 'None' },
                        { v: 'flourish', label: language === 'he' ? 'פריחה' : 'Flourish' },
                        { v: 'geometric', label: language === 'he' ? 'גאומטרי' : 'Geometric' },
                        { v: 'floral', label: language === 'he' ? 'פרחוני' : 'Floral' },
                        { v: 'stars', label: language === 'he' ? 'כוכבים' : 'Stars' },
                        { v: 'leaves', label: language === 'he' ? 'עלים' : 'Leaves' },
                      ] as { v: typeof settings.cornerDecorations; label: string }[]).map(({ v, label }) => (
                        <button key={v} onClick={() => setSettings({ ...settings, cornerDecorations: v })}
                          className={`py-1.5 rounded-lg text-xs font-medium transition-all border ${settings.cornerDecorations === v ? 'border-memorial-gold bg-memorial-gold/20 text-memorial-gold' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30'}`}
                        >{label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Title Underline */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-2">{language === 'he' ? 'קו תחת כותרת' : 'Title Underline'}</label>
                    <div className="grid grid-cols-3 gap-1">
                      {([
                        { v: 'none', label: language === 'he' ? 'ללא' : 'None' },
                        { v: 'simple', label: language === 'he' ? 'פשוט' : 'Simple' },
                        { v: 'double', label: language === 'he' ? 'כפול' : 'Double' },
                        { v: 'wavy', label: language === 'he' ? 'גלי' : 'Wavy' },
                        { v: 'gradient', label: language === 'he' ? 'גרדיאנט' : 'Gradient' },
                        { v: 'ornate', label: language === 'he' ? 'מעוטר' : 'Ornate' },
                      ] as { v: typeof settings.titleUnderline; label: string }[]).map(({ v, label }) => (
                        <button key={v} onClick={() => setSettings({ ...settings, titleUnderline: v })}
                          className={`py-1.5 rounded-lg text-xs font-medium transition-all border ${settings.titleUnderline === v ? 'border-memorial-gold bg-memorial-gold/20 text-memorial-gold' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30'}`}
                        >{label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-2">{language === 'he' ? 'צבע הדגשה' : 'Accent Color'}</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {['#8b6914','#1a365d','#6b5b95','#c0392b','#16a085','#2c3e50','#e74c3c','#8e44ad'].map(c => (
                        <button key={c} onClick={() => setSettings({ ...settings, accentColor: c })}
                          className={`w-7 h-7 rounded-lg border-2 transition-all ${settings.accentColor === c ? 'border-white scale-110' : 'border-transparent hover:border-white/40'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="color" value={settings.accentColor || '#8b6914'}
                        onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                        className="w-7 h-7 rounded cursor-pointer border-0"
                      />
                      <span className="text-xs text-gray-400">{language === 'he' ? 'מותאם' : 'Custom'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Image Upload/Generate Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-strong rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">{language === 'he' ? 'הוספת תמונה' : 'Add Image'}</h2>
                  {selectedPageIndex !== null && (
                    <p className="text-xs text-memorial-gold mt-1">
                      {language === 'he' ? `מוסיף לעמוד ${selectedPageIndex + 1}` : `Adding to: Page ${selectedPageIndex + 1}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="btn-ghost p-1.5 sm:p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Upload Option — single or multiple */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-2 sm:mb-3">
                  {language === 'he' ? 'העלאת תמונות' : 'Upload Images'}
                </h3>

                {/* Single upload to specific page */}
                <label className="flex flex-col items-center justify-center w-full h-24 sm:h-28 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-memorial-gold transition mb-2">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 mb-1" />
                  <span className="text-xs sm:text-sm text-gray-400">
                    {language === 'he' ? 'לחץ להעלאת תמונה לעמוד הנוכחי' : 'Upload to current page'}
                  </span>
                  <span className="text-xs text-gray-500">PNG, JPG — 10MB max</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>

                {/* Bulk upload — auto-distribute across chapter pages */}
                <label className="flex flex-col items-center justify-center w-full h-24 sm:h-28 border-2 border-dashed border-memorial-gold/30 rounded-xl cursor-pointer hover:border-memorial-gold/60 hover:bg-memorial-gold/5 transition">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-memorial-gold" />
                    <span className="text-xs sm:text-sm text-memorial-gold font-medium">
                      {language === 'he' ? 'העלאת אלבום — מיקום אוטומטי' : 'Album upload — auto-placement'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {language === 'he' ? 'בחר כמה תמונות, ה-AI ימקם אותן בפרקים' : 'Select multiple, AI places them in chapters'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      if (files.length > 20) {
                        toast.error(language === 'he' ? 'מקסימום 20 תמונות' : 'Maximum 20 images');
                        return;
                      }

                      toast.loading(
                        language === 'he' ? `מעלה ${files.length} תמונות...` : `Uploading ${files.length} images...`,
                        { id: 'bulk-upload' }
                      );

                      // Distribute images across chapter pages
                      const chapterPages = pages
                        .map((p, idx) => ({ page: p, index: idx }))
                        .filter(p => p.page.type === 'chapter');

                      if (chapterPages.length === 0) {
                        toast.error(language === 'he' ? 'אין פרקים בספר' : 'No chapters found', { id: 'bulk-upload' });
                        return;
                      }

                      let uploadedCount = 0;
                      for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) continue;

                        // Distribute evenly across chapter pages
                        const targetChapter = chapterPages[i % chapterPages.length];
                        const pageIndex = targetChapter.index;

                        try {
                          const formData = new FormData();
                          formData.append('image', file);
                          formData.append('pageIndex', String(pageIndex));

                          const response = await api.post(`/books/${bookId}/page-image`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                          });

                          if (response.data.success) {
                            const imageData = response.data.data.image || response.data.data;
                            const imageUrl = imageData.url || response.data.data.imageUrl;

                            const newImage = {
                              id: imageData._id || `img-${Date.now()}-${i}`,
                              url: imageUrl,
                              x: 15 + (i % 3) * 25,
                              y: 20 + Math.floor(i / 3) * 25,
                              width: 40,
                              height: 35,
                              rotation: 0,
                            };

                            setPages(prev => {
                              const updated = [...prev];
                              if (!updated[pageIndex].images) updated[pageIndex].images = [];
                              updated[pageIndex].images.push(newImage as any);
                              return updated;
                            });
                            uploadedCount++;
                          }
                        } catch (err) {
                          if (import.meta.env.DEV) console.error(`Failed to upload image ${i + 1}:`, err);
                        }
                      }

                      if (uploadedCount > 0) {
                        saveLayout(true);
                        toast.success(
                          language === 'he'
                            ? `${uploadedCount} תמונות הועלו ומוקמו בפרקים!`
                            : `${uploadedCount} images uploaded and placed!`,
                          { id: 'bulk-upload' }
                        );
                        setShowImageModal(false);
                      } else {
                        toast.error(language === 'he' ? 'לא הצלחנו להעלות תמונות' : 'Failed to upload images', { id: 'bulk-upload' });
                      }
                    }}
                  />
                </label>
              </div>

              <div className="relative mb-4 sm:mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-deep-space text-gray-400 text-xs sm:text-sm">{language === 'he' ? 'או' : 'or'}</span>
                </div>
              </div>

              {/* AI Generation Option */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2 sm:mb-3">{language === 'he' ? 'יצירת תמונה עם AI' : 'Generate Image with AI'}</h3>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder={language === 'he' ? 'תאר את התמונה שאתה רוצה ליצור...' : 'Describe the image you want to create...'}
                  className="input w-full h-20 sm:h-24 resize-none mb-2 sm:mb-3 text-sm"
                />
                <button
                  onClick={handleGenerateImage}
                  disabled={generatingImage || !imagePrompt.trim()}
                  className="btn-gold w-full flex items-center justify-center gap-2 text-sm"
                >
                  {generatingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      Generate Image
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Gallery Modal */}
      <TemplateGallery
        isOpen={showTemplateGallery}
        onClose={() => setShowTemplateGallery(false)}
        onSelect={handleTemplateSelect}
        currentTemplateId={settings.templateId}
      />

      {/* AI Complete Design Wizard */}
      {book && (
        <AICompleteDesignWizard
          isOpen={showAIDesignWizard}
          onClose={() => setShowAIDesignWizard(false)}
          bookId={bookId || ''}
          book={{
            title: book.title,
            genre: book.genre,
            synopsis: book.synopsis,
            description: book.description,
            chapters: book.chapters,
            author: book.author,
          }}
          onDesignComplete={handleAIDesignComplete}
        />
      )}

      {/* Premium Auto-Design Modal (multi-agent typesetting) */}
      {bookId && (
        <AutoDesignModal
          bookId={bookId}
          isOpen={showAutoDesignModal}
          onClose={() => setShowAutoDesignModal(false)}
        />
      )}

      {/* Save as Template Modal */}
      <AnimatePresence>
        {showSaveTemplateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !savingTemplate && setShowSaveTemplateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl max-w-md w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              dir={language === 'he' ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Save className="w-6 h-6 text-amber-400" />
                  {language === 'he' ? 'שמור כתבנית' : 'Save as Template'}
                </h3>
                <button
                  onClick={() => setShowSaveTemplateModal(false)}
                  disabled={savingTemplate}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {language === 'he' ? 'שם התבנית (אנגלית)' : 'Template Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder={isBookRTL ? 'שם התבנית שלי' : 'My Custom Template'}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    disabled={savingTemplate}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {language === 'he' ? 'שם התבנית (עברית)' : 'Template Name (Hebrew)'}
                  </label>
                  <input
                    type="text"
                    value={templateNameHe}
                    onChange={(e) => setTemplateNameHe(e.target.value)}
                    placeholder="התבנית שלי"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    disabled={savingTemplate}
                    dir="rtl"
                  />
                </div>

                {aiDesign && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <p className="text-amber-400 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {language === 'he'
                        ? 'העיצוב שנוצר על ידי AI יישמר בתבנית זו'
                        : 'AI-generated design will be saved in this template'}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSaveTemplateModal(false)}
                  disabled={savingTemplate}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors"
                >
                  {language === 'he' ? 'ביטול' : 'Cancel'}
                </button>
                <button
                  onClick={handleSaveAsTemplate}
                  disabled={savingTemplate || !templateName.trim() || !templateNameHe.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {savingTemplate ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {language === 'he' ? 'שומר...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {language === 'he' ? 'שמור תבנית' : 'Save Template'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brand Watermark - opposite side from the page-thumbnails sidebar */}
      <BrandWatermark
        position={isUIRTL ? 'bottom-left' : 'bottom-right'}
        size="small"
        opacity={0.12}
        className="hidden lg:block"
      />

      {/* Flip Book Reader */}
      {showFlipReader && book && (
        <BookFlipReader
          book={{
            id: book.id,
            title: book.title,
            author: book.author,
            language: book.language,
            synopsis: book.synopsis,
            description: book.description,
            coverDesign: book.coverDesign,
          }}
          pages={pages}
          frontCoverImageUrl={coverImageUrl}
          backCoverImageUrl={backCoverImageUrl}
          isRTL={isBookRTL}
          designSettings={{
            fontFamily: settings.fontFamily,
            fontSize: settings.fontSize,
            lineHeight: settings.lineHeight,
            textColor: settings.textColor,
            accentColor: settings.accentColor,
            backgroundColor: settings.backgroundColor,
            columns: settings.columns,
            dropCapStyle: (settings as any).dropCapStyle,
            dividerStyle: (settings as any).dividerStyle,
            pageFrame: (settings as any).pageFrame,
            frameColor: (settings as any).frameColor,
            backgroundPattern: (settings as any).backgroundPattern,
            headerDecoration: (settings as any).headerDecoration,
            sectionDivider: (settings as any).sectionDivider,
            cornerDecorations: (settings as any).cornerDecorations,
            titleUnderline: (settings as any).titleUnderline,
            margins: settings.margins,
            showPageNumbers: settings.showPageNumbers,
          }}
          onClose={() => setShowFlipReader(false)}
        />
      )}

      {/* Publish Modal */}
      <AnimatePresence>
        {showPublishModal && book && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPublishModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-strong rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-memorial-gold to-yellow-600 flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-deep-space" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-2xl font-bold gradient-gold">{t('design_studio.publish_modal.title', 'Publish Book')}</h2>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">{book.title}</p>
                  </div>
                </div>
                <button onClick={() => setShowPublishModal(false)} className="p-2 rounded-lg hover:bg-white/10 transition">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {loadingStrategy ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-memorial-gold mx-auto mb-4" />
                  <p className="text-gray-300">{t('design_studio.publish_modal.analyzing', 'Analyzing pricing strategy...')}</p>
                </div>
              ) : pricingStrategy ? (
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-memorial-gold/10 to-yellow-500/10 border border-memorial-gold/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-6 h-6 text-memorial-gold flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-white mb-1">{t('design_studio.publish_modal.ai_recommendation', 'AI Recommendation')}</h3>
                        <p className="text-gray-300 text-sm">{pricingStrategy.reasoning}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="glass rounded-lg p-3 text-center">
                      <BookOpen className="w-5 h-5 text-memorial-gold mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white">{pricingStrategy.authorStats.publishedBooks}</p>
                      <p className="text-xs text-gray-400">{t('design_studio.publish_modal.published_books', 'Published')}</p>
                    </div>
                    <div className="glass rounded-lg p-3 text-center">
                      <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white">{pricingStrategy.authorStats.totalSales}</p>
                      <p className="text-xs text-gray-400">{t('design_studio.publish_modal.sales', 'Sales')}</p>
                    </div>
                    <div className="glass rounded-lg p-3 text-center">
                      <TrendingUp className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white">${pricingStrategy.marketAnalysis.genreAveragePrice}</p>
                      <p className="text-xs text-gray-400">{t('design_studio.publish_modal.genre_avg_price', 'Genre avg')}</p>
                    </div>
                    <div className="glass rounded-lg p-3 text-center">
                      <Sparkles className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white capitalize">{pricingStrategy.marketAnalysis.demandLevel}</p>
                      <p className="text-xs text-gray-400">{t('design_studio.publish_modal.demand_level', 'Demand')}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-3">{t('design_studio.publish_modal.select_pricing', 'Select Pricing')}</h3>
                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={() => { setIsFree(true); setSelectedPrice(0); }}
                        className={`flex-1 py-4 px-4 rounded-xl border-2 transition-all ${isFree ? 'border-memorial-gold bg-memorial-gold/20 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}
                      >
                        <span className="text-lg font-bold">{t('design_studio.publish_modal.free', 'Free')}</span>
                        {pricingStrategy.recommendFree && (<span className="block text-xs text-memorial-gold mt-1">{t('design_studio.publish_modal.recommended_by_ai', 'AI recommended')}</span>)}
                      </button>
                      <button
                        onClick={() => { setIsFree(false); setSelectedPrice(pricingStrategy.recommendedPrice || 20); }}
                        className={`flex-1 py-4 px-4 rounded-xl border-2 transition-all ${!isFree ? 'border-memorial-gold bg-memorial-gold/20 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}
                      >
                        <span className="text-lg font-bold">{t('design_studio.publish_modal.paid', 'Paid')}</span>
                        {!pricingStrategy.recommendFree && (<span className="block text-xs text-memorial-gold mt-1">{t('design_studio.publish_modal.recommended_by_ai', 'AI recommended')}</span>)}
                      </button>
                    </div>

                    {!isFree && (
                      <div className="space-y-3">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                          <input
                            type="number" min="0" max="25" step="0.01"
                            value={selectedPrice}
                            onChange={(e) => setSelectedPrice(parseFloat(e.target.value) || 0)}
                            className={`input pl-10 text-lg font-bold ${selectedPrice > 25 ? 'border-red-500 focus:border-red-500' : ''}`}
                            placeholder="0"
                          />
                        </div>
                        <div className="flex gap-2">
                          {[5, 10, 15, 25].map((price) => (
                            <button
                              key={price}
                              onClick={() => setSelectedPrice(price)}
                              className={`flex-1 py-2 rounded-lg text-sm transition ${selectedPrice === price ? 'bg-memorial-gold/30 text-memorial-gold border border-memorial-gold/50' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                              ${price}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {(!(book as any).qualityScore || (book as any).qualityScore.overallScore < 70) && (
                    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-300 font-medium">{t('design_studio.publish_modal.low_quality_title', 'Quality score too low')}</p>
                        <p className="text-sm text-red-400/80">{t('design_studio.publish_modal.low_quality_desc', 'A quality score of at least 70 is required. Run analysis in the editor.')}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handlePublish}
                    disabled={publishing || !(book as any).qualityScore || (book as any).qualityScore.overallScore < 70 || (!isFree && selectedPrice > 25)}
                    className="w-full btn-gold py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {publishing ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />{t('design_studio.publish_modal.publishing', 'Publishing...')}</>
                    ) : (
                      <><Rocket className="w-5 h-5" />{isFree ? t('design_studio.publish_modal.publish_free', 'Publish for Free') : `${t('design_studio.publish_modal.publish_for', 'Publish for ')}$${selectedPrice}`}</>
                    )}
                  </button>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && book && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-strong rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto mx-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-cosmic-purple to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Download className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-2xl font-bold text-white truncate">{t('design_studio.export_modal.title', 'Export Book')}</h2>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">{book.title}</p>
                  </div>
                </div>
                <button onClick={() => setShowExportModal(false)} className="p-2 rounded-lg hover:bg-white/10 transition">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-white">{t('design_studio.export_modal.select_format', 'Select Format')}</h3>

                {/* Active-design indicator — tells the user (and guarantees) that
                    the export reflects exactly the design they built. */}
                <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <Sparkles className="w-4 h-4 text-memorial-gold flex-shrink-0" />
                  <p className="text-xs text-gray-300">
                    {language === 'he' ? 'מעוצב עם: ' : 'Designed with: '}
                    <span className="font-semibold text-white">
                      {getActiveDesign() === 'auto'
                        ? (language === 'he' ? 'עימוד אוטומטי' : 'Auto-design')
                        : (language === 'he' ? 'עיצוב ידני' : 'Manual layout')}
                    </span>
                    {language === 'he' ? ' — הייצוא יהיה זהה לתצוגה.' : ' — the export matches this preview.'}
                  </p>
                </div>

                {/* Primary: Browser PDF — perfect fidelity */}
                <button
                  onClick={handleBrowserPdf}
                  disabled={exporting}
                  className="w-full p-4 rounded-xl border-2 border-memorial-gold bg-memorial-gold/20 transition-all text-right"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-red-500">
                      <Printer className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">
                        {language === 'he' ? 'שמור כ-PDF (מומלץ)' : 'Save as PDF (Recommended)'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {language === 'he' ? 'עיצוב מלא, כריכה, תמונות, פונטים ועימוד' : 'Full design: cover, images, fonts & layout'}
                      </p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-memorial-gold" />
                  </div>
                </button>

                {/* Word DOCX — server-side export */}
                <button
                  onClick={handleDocxExport}
                  disabled={exporting}
                  className="w-full p-4 rounded-xl border-2 border-gray-700 hover:border-gray-600 transition-all text-right"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-500">
                      <FileType className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">
                        {t('design_studio.export_modal.docx_title', 'Word (DOCX)')}
                      </p>
                      <p className="text-sm text-gray-400">
                        {language === 'he' ? 'קובץ עריכה ב־Microsoft Word' : 'Editable Microsoft Word file'}
                      </p>
                    </div>
                    {exporting ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Set expectations: PDF is the exact visual copy; Word is an
                    editable file with the typography + cover but not the
                    print-only decorations Word can't represent. */}
                <p className="text-[11px] text-gray-500 leading-relaxed pt-1">
                  {language === 'he'
                    ? 'PDF = עותק ויזואלי מדויק (כולל כריכה, תמונות, מסגרות ועיצוב). Word = קובץ עריכה — טקסט, טיפוגרפיה וכריכה; קישוטים ותמונות ממוקמות עשויים להיראות שונה.'
                    : 'PDF = exact visual copy (cover, images, frames & design). Word = editable file — text, typography & cover; decorations and positioned images may look different.'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Order Modal */}
      {book && (
        <PrintOrderModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          bookId={bookId || ''}
          bookTitle={book.title}
          pageCount={pages.length}
          hasCover={!!(book as any).coverDesign?.imageUrl || !!coverImageUrl}
        />
      )}
    </div>
  );
}

// AI Image Placement interface
interface AIImagePlacementLocal {
  chapterIndex: number;
  position: 'chapter-start' | 'mid-chapter' | 'chapter-end';
  generatedImageUrl?: string;
  prompt?: string;
}

// Page Renderer Component
interface PageRendererProps {
  page: PageContent;
  pageIndex: number;
  settings: typeof defaultSettings;
  isRTL: boolean;
  isSelected: boolean;
  onImageSelect: (id: string | null) => void;
  selectedImageId: string | null;
  onImageUpdate: (imageId: string, updates: Partial<PageImage>) => void;
  onImageDelete: (imageId: string) => void;
  onImageDuplicate: (imageId: string) => void;
  onMoveToPage: (imageId: string, toPageIndex: number) => void;
  totalPages: number;
  pageNumber?: number;
  bookTitle?: string;
  showHeader?: boolean;
  headerStyle?: 'book-title' | 'chapter-title' | 'none';
  aiImagePlacements?: AIImagePlacementLocal[];
  language?: string;
  // Text editing props
  editingPageIndex: number | null;
  editingContent: string;
  editableRef: React.RefObject<HTMLDivElement>;
  onStartEditing: (pageIndex: number) => void;
  onFinishEditing: () => void;
  onCancelEditing: () => void;
  // Image placeholder props
  onImageAdded?: (imageUrl: string, imageData: {
    x: number;
    y: number;
    width: number;
    height: number;
    isAiGenerated: boolean;
    prompt?: string;
  }) => void;
  bookId?: string;
  bookContext?: {
    title: string;
    genre: string;
    chapterTitle?: string;
  };
}

function PageRenderer({
  page,
  pageIndex,
  settings,
  isRTL,
  isSelected,
  onImageSelect,
  selectedImageId,
  onImageUpdate,
  onImageDelete,
  onImageDuplicate,
  onMoveToPage,
  totalPages,
  pageNumber,
  bookTitle,
  showHeader = false,
  headerStyle = 'book-title',
  aiImagePlacements = [],
  language = 'he',
  editingPageIndex,
  editingContent,
  editableRef,
  onStartEditing,
  onFinishEditing,
  onCancelEditing,
  onImageAdded,
  bookId,
  bookContext,
}: PageRendererProps) {
  const { t } = useTranslation('common');
  const [_isDragging, setIsDragging] = useState(false);
  const [_isResizing, setIsResizing] = useState(false);
  const [showEditToolbar, setShowEditToolbar] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  void _isDragging; void _isResizing; // For future visual feedback

  // Calculate content layout adjustments based on image/placeholder positions
  const getContentLayoutStyle = (): React.CSSProperties => {
    const allImages = page.images || [];
    const placeholders = settings.imagePlaceholders || [];
    const style: React.CSSProperties = {};

    // Check for images/placeholders at different positions
    const topImages = [...allImages, ...placeholders].filter(img => img.y < 30);
    const bottomImages = [...allImages, ...placeholders].filter(img => img.y > 60);
    const _leftImages = [...allImages, ...placeholders].filter(img => img.x < 30 && img.y >= 30 && img.y <= 60);
    const _rightImages = [...allImages, ...placeholders].filter(img => img.x > 60 && img.y >= 30 && img.y <= 60);
    void _leftImages; void _rightImages; // Reserved for future side image layout

    // Reserve space for images at top
    if (topImages.length > 0) {
      const maxHeight = Math.max(...topImages.map(img => (img.y + img.height)));
      style.paddingTop = `${Math.max(maxHeight + 5, 0)}%`;
    }

    // Reserve space for images at bottom
    if (bottomImages.length > 0) {
      const minTop = Math.min(...bottomImages.map(img => img.y));
      const reserveSpace = 100 - minTop;
      style.paddingBottom = `${Math.max(reserveSpace + 5, 0)}%`;
    }

    return style;
  };

  // Generate floating elements for side images
  const getFloatingImageElements = () => {
    const allImages = page.images || [];
    const placeholders = (settings.imagePlaceholders || []).filter(p => {
      // Don't show placeholder if image already exists at that position
      return !allImages.some(img =>
        Math.abs(img.x - p.x) < 10 && Math.abs(img.y - p.y) < 10
      );
    });

    return [...allImages, ...placeholders].filter(img => {
      // Side images (for text wrapping)
      const isSideImage = (img.x < 35 || img.x > 55) && img.y >= 20 && img.y <= 70;
      const shouldWrap = (img as any).textWrap === 'wrap' || isSideImage;
      return shouldWrap && !(img as any).url; // Only for placeholders
    }).map((img, idx) => ({
      ...img,
      float: img.x < 50 ? (isRTL ? 'right' : 'left') : (isRTL ? 'left' : 'right'),
      key: `float-${idx}`,
    }));
  };

  const handleImageMouseDown = (e: React.MouseEvent, image: PageImage, action: 'drag' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    onImageSelect(image.id);

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startImageX = image.x;
    const startImageY = image.y;
    const startWidth = image.width;
    const startHeight = image.height;

    if (action === 'drag') {
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }

    const handleMouseMove = (moveE: MouseEvent) => {
      const deltaX = ((moveE.clientX - startX) / rect.width) * 100;
      const deltaY = ((moveE.clientY - startY) / rect.height) * 100;

      if (action === 'drag') {
        const newX = Math.max(0, Math.min(100 - image.width, startImageX + deltaX));
        const newY = Math.max(0, Math.min(100 - image.height, startImageY + deltaY));
        onImageUpdate(image.id, { x: newX, y: newY });
      } else {
        const newWidth = Math.max(10, Math.min(100 - startImageX, startWidth + deltaX));
        const newHeight = Math.max(10, Math.min(100 - startImageY, startHeight + deltaY));
        onImageUpdate(image.id, { width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Determine header text based on style
  const getHeaderText = () => {
    if (headerStyle === 'chapter-title' && page.type === 'chapter') {
      // Extract chapter title from content
      const match = page.content.match(/<h2[^>]*>(.*?)<\/h2>/);
      return match ? match[1].replace(/<[^>]*>/g, '') : '';
    }
    return bookTitle || '';
  };

  // Scale font size and margins based on actual container width — reactive to resize/rotation.
  // Pages render at ~200-350px wide on small screens, so template sizes need scaling.
  const [containerWidth, setContainerWidth] = useState(0);
  const lastWidthRef = useRef(0);
  useEffect(() => {
    if (!containerRef.current) return;
    let rafId: number;
    const observer = new ResizeObserver((entries) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        for (const entry of entries) {
          // Only update if width changed by more than 10px to prevent
          // resize → re-render → font change → reflow → resize loop
          const w = Math.round(entry.contentRect.width);
          if (Math.abs(w - lastWidthRef.current) > 10) {
            lastWidthRef.current = w;
            setContainerWidth(w);
          }
        }
      });
    });
    observer.observe(containerRef.current);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  // Scale proportionally: 350px container = full size, smaller = proportionally smaller
  const scaleFactor = containerWidth > 0 ? Math.min(1, Math.max(0.5, containerWidth / 350)) : 1;
  const scaledFontSize = Math.max(7, Math.round(settings.fontSize * scaleFactor));
  const scaledMargins = {
    top: Math.round(settings.margins.top * scaleFactor),
    bottom: Math.round(settings.margins.bottom * scaleFactor),
    left: Math.round(settings.margins.left * scaleFactor),
    right: Math.round(settings.margins.right * scaleFactor),
  };

  // Compute background pattern style
  const getPagePatternStyle = (): React.CSSProperties => {
    const pattern = settings.backgroundPattern;
    const accentColor = settings.accentColor || '#8b6914';
    if (!pattern || pattern === 'none') return {};
    const hex = accentColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) || 139;
    const g = parseInt(hex.slice(2, 4), 16) || 105;
    const b = parseInt(hex.slice(4, 6), 16) || 20;
    const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;
    switch (pattern) {
      case 'dots': return { backgroundImage: `radial-gradient(circle, ${rgba(0.1)} 1px, transparent 1px)`, backgroundSize: '18px 18px' };
      case 'grid': return { backgroundImage: `linear-gradient(${rgba(0.04)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(0.04)} 1px, transparent 1px)`, backgroundSize: '22px 22px' };
      case 'stripes': return { backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 26px, ${rgba(0.05)} 26px, ${rgba(0.05)} 27px)` };
      default: return {};
    }
  };

  // Compute page frame style
  const getPageFrameStyle = (): React.CSSProperties => {
    const frame = settings.pageFrame;
    const c = settings.frameColor || settings.accentColor || '#8b6914';
    if (!frame || frame === 'none') return {};
    switch (frame) {
      case 'simple': return { boxShadow: `inset 0 0 0 1px ${c}60` };
      case 'double': return { boxShadow: `inset 0 0 0 1px ${c}60, inset 0 0 0 3px ${c}30` };
      case 'ornate': return { boxShadow: `inset 0 0 0 1.5px ${c}70, inset 0 0 0 3.5px ${c}30, inset 0 0 0 5px ${c}15` };
      case 'dashed': return { outline: `1.5px dashed ${c}60`, outlineOffset: '-5px' };
      case 'dotted': return { outline: `1.5px dotted ${c}60`, outlineOffset: '-5px' };
      case 'rounded': return { boxShadow: `inset 0 0 0 1.5px ${c}60`, borderRadius: '6px', overflow: 'hidden' };
      case 'royal': return { boxShadow: `inset 0 0 0 3px ${c}, inset 0 0 0 6px ${c}20, inset 0 0 0 8px ${c}cc, inset 0 0 0 10px ${c}20, inset 0 0 0 14px ${c}10` };
      case 'elegant': return { boxShadow: `inset 0 0 0 1.5px ${c}90, inset 0 0 0 5px ${c}15, inset 0 0 0 6.5px ${c}90` };
      case 'art-deco': return { boxShadow: `inset 0 0 0 4px ${c}, inset 0 0 0 7px transparent, inset 0 0 0 8px ${c}80, inset 0 0 0 12px ${c}18` };
      case 'gradient': return { border: '3px solid transparent', borderImage: `linear-gradient(135deg, ${c}, ${c}20, ${c}) 1`, borderImageSlice: 1 } as React.CSSProperties;
      default: return {};
    }
  };

  // Texture URL helper
  const getTextureUrl = (texture: string): string | null => {
    switch (texture) {
      case 'paper': return '/img/new/texture-paper.jpeg';
      case 'parchment': return '/img/new/texture-paper-2.jpeg';
      case 'linen': return '/img/new/texture-paper-3.jpeg';
      default: return null;
    }
  };

  // Corner decoration SVG by type — rich, detailed ornaments
  const getCornerSVG = (type: string, _rotate: number) => {
    const accent = settings.accentColor || '#8b6914';
    const size = 50;
    const svgContent: Record<string, string> = {
      flourish: `<path d="M2,2 L45,2 L45,3.5 L3.5,3.5 L3.5,45 L2,45 Z" fill="${accent}" opacity="0.4"/><path d="M7,7 Q7,22 7,34 Q22,7 34,7" stroke="${accent}" stroke-width="1.5" fill="none" opacity="0.8"/><path d="M10,10 Q10,18 10,26 Q18,10 26,10" stroke="${accent}" stroke-width="0.8" fill="none" opacity="0.4"/><circle cx="7" cy="7" r="2.5" fill="${accent}" opacity="0.7"/>`,
      geometric: `<polyline points="0,40 0,0 40,0" stroke="${accent}" stroke-width="2.5" fill="none"/><polyline points="0,28 0,6 6,0 28,0" stroke="${accent}" stroke-width="1" fill="none" opacity="0.4"/><rect x="2" y="2" width="8" height="8" fill="${accent}" opacity="0.25"/><rect x="12" y="2" width="5" height="5" fill="${accent}" opacity="0.12"/>`,
      floral: `<path d="M0,0 L44,0 L44,2 L2,2 L2,44 L0,44 Z" fill="${accent}" opacity="0.4"/><circle cx="12" cy="12" r="5.5" stroke="${accent}" stroke-width="1.2" fill="none"/><circle cx="12" cy="12" r="2.5" fill="${accent}" opacity="0.6"/><path d="M17.5,12 Q23,7 28,12" stroke="${accent}" stroke-width="1" fill="none"/><path d="M12,17.5 Q7,23 12,28" stroke="${accent}" stroke-width="1" fill="none"/>`,
      stars: `<text x="2" y="18" font-size="16" fill="${accent}" opacity="0.7">✦</text><text x="18" y="34" font-size="10" fill="${accent}" opacity="0.45">✧</text><text x="30" y="12" font-size="7" fill="${accent}" opacity="0.3">✦</text>`,
      hearts: `<text x="2" y="20" font-size="18" fill="${accent}" opacity="0.6">♥</text><text x="20" y="34" font-size="10" fill="${accent}" opacity="0.35">♥</text>`,
      leaves: `<path d="M6,6 Q16,3 26,10 Q16,17 6,6 Z" fill="${accent}" opacity="0.2" stroke="${accent}" stroke-width="0.8"/><path d="M6,6 L16,10" stroke="${accent}" stroke-width="0.6" opacity="0.4"/><path d="M10,18 Q16,24 24,26 Q16,28 10,18 Z" fill="${accent}" opacity="0.15" stroke="${accent}" stroke-width="0.6"/>`,
      royal: `<path d="M0,0 L52,0 L52,2.5 L2.5,2.5 L2.5,52 L0,52 Z" fill="${accent}" opacity="0.5"/><path d="M5,5 L44,5 L44,6.5 L6.5,6.5 L6.5,44 L5,44 Z" fill="${accent}" opacity="0.2"/><path d="M10,10 Q10,24 10,34 Q24,10 34,10" stroke="${accent}" stroke-width="1.8" fill="none" opacity="0.7"/><path d="M10,10 L13,7 L16,10 L13,13 Z" fill="${accent}" opacity="0.5"/><path d="M34,10 Q40,9 44,12" stroke="${accent}" stroke-width="1" fill="none" opacity="0.4"/><path d="M10,34 Q9,40 12,44" stroke="${accent}" stroke-width="1" fill="none" opacity="0.4"/><circle cx="44" cy="12" r="1.2" fill="${accent}" opacity="0.35"/>`,
      vine: `<path d="M4,4 Q4,26 7,38 Q10,44 16,47 Q26,50 38,47" stroke="${accent}" stroke-width="1.5" fill="none" opacity="0.6"/><path d="M4,4 Q14,4 26,7 Q36,10 42,16 Q48,26 48,38" stroke="${accent}" stroke-width="1.5" fill="none" opacity="0.6"/><path d="M8,16 Q13,11 18,16 Q13,21 8,16 Z" fill="${accent}" opacity="0.2" stroke="${accent}" stroke-width="0.6"/><path d="M16,8 Q21,3 26,8 Q21,13 16,8 Z" fill="${accent}" opacity="0.2" stroke="${accent}" stroke-width="0.6"/><circle cx="4" cy="4" r="2.5" fill="${accent}" opacity="0.45"/>`,
    };
    const content = svgContent[type] || svgContent.geometric;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${content}</svg>`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative h-full overflow-hidden ${isSelected ? 'ring-2 ring-memorial-gold' : ''}`}
      onClick={() => {
        // Click on page background deselects any selected image
        if (selectedImageId) onImageSelect(null);
      }}
      style={{
        padding: `${scaledMargins.top}px ${scaledMargins.right}px ${scaledMargins.bottom}px ${scaledMargins.left}px`,
        fontFamily: settings.fontFamily,
        fontSize: `${scaledFontSize}px`,
        lineHeight: settings.lineHeight,
        color: settings.textColor || '#000000',
        backgroundColor: settings.backgroundColor || '#ffffff',
        ...(settings.backgroundGradient ? { background: settings.backgroundGradient } : {}),
        direction: isRTL ? 'rtl' : 'ltr',
        textAlign: isRTL ? 'right' : 'left',
        '--accent-color': settings.accentColor || '#8b6914',
        '--frame-color': settings.frameColor || settings.accentColor || '#8b6914',
        ...getPagePatternStyle(),
        ...getPageFrameStyle(),
      } as React.CSSProperties}
    >
      {/* Texture overlay */}
      {settings.backgroundTexture && settings.backgroundTexture !== 'none' && getTextureUrl(settings.backgroundTexture) && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${getTextureUrl(settings.backgroundTexture)})`,
          backgroundSize: 'cover',
          opacity: settings.backgroundTextureOpacity ?? 0.15,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }} />
      )}

      {/* Corner Decorations — use physical positioning (not RTL-aware CSS classes) */}
      {settings.cornerDecorations && settings.cornerDecorations !== 'none' && (
        <>
          {[
            { key: 'tl', pos: { top: 8, left: 8 },     transform: 'none' },
            { key: 'tr', pos: { top: 8, right: 8 },    transform: 'scaleX(-1)' },
            { key: 'bl', pos: { bottom: 8, left: 8 },  transform: 'scaleY(-1)' },
            { key: 'br', pos: { bottom: 8, right: 8 }, transform: 'scale(-1)' },
          ].map(({ key, pos, transform }) => (
            <div
              key={key}
              className="book-corner-decoration"
              dangerouslySetInnerHTML={{ __html: getCornerSVG(settings.cornerDecorations, 0) }}
              style={{
                ...pos,
                transform,
                '--accent-color': settings.accentColor || '#8b6914',
              } as unknown as React.CSSProperties}
            />
          ))}
        </>
      )}

      {/* Decorative header — banner style or classic */}
      {showHeader && settings.headerDecoration === 'banner' && page.type !== 'title' && page.type !== 'toc' ? (
        <div className="absolute top-0 left-0 right-0 hidden sm:block" style={{
          background: `linear-gradient(180deg, ${settings.accentColor || '#8b6914'}15 0%, transparent 100%)`,
          borderBottom: `1px solid ${settings.accentColor || '#8b6914'}30`,
          padding: `4px ${settings.margins.right}px 3px`,
        }}>
          <div className="flex items-center justify-center gap-1">
            <div style={{ flex: 1, maxWidth: 30, height: '0.5px', background: `linear-gradient(to right, transparent, ${settings.accentColor}40)` }} />
            <span style={{
              fontSize: '5.5px',
              color: `${settings.accentColor}cc`,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontWeight: 500,
              fontFamily: settings.titleFont || settings.fontFamily,
            }}>
              ✦ {getHeaderText()} ✦
            </span>
            <div style={{ flex: 1, maxWidth: 30, height: '0.5px', background: `linear-gradient(to left, transparent, ${settings.accentColor}40)` }} />
          </div>
        </div>
      ) : showHeader && headerStyle !== 'none' && page.type !== 'title' && page.type !== 'toc' && (
        <div className="absolute top-0 left-0 right-0 hidden sm:block" style={{ padding: `0 ${settings.margins.right}px` }}>
          <div
            className={`flex items-center gap-3 pt-3 pb-2 ${
              settings.headerDecoration === 'gradient-line' ? 'book-chapter-header header-gradient-line' :
              settings.headerDecoration === 'ornament' ? 'book-chapter-header header-decorated' :
              ''
            }`}
            style={{
              borderBottom: settings.headerDecoration === 'line' || settings.headerDecoration === 'dots'
                ? `0.5px solid ${settings.accentColor || 'rgba(0,0,0,0.15)'}${settings.headerDecoration === 'dots' ? '' : ''}`
                : '0.5px solid rgba(0,0,0,0.12)',
            }}
          >
            <div className="flex-1 h-[0.5px]" style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.08))' }} />
            <span style={{
              fontSize: '7px',
              color: settings.headerDecoration !== 'none' ? (settings.accentColor || '#9ca3af') : '#9ca3af',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontFamily: settings.fontFamily,
              fontWeight: 300,
            }}>
              {getHeaderText()}
            </span>
            <div className="flex-1 h-[0.5px]" style={{ background: 'linear-gradient(to left, transparent, rgba(0,0,0,0.08))' }} />
          </div>
        </div>
      )}

      {/* Page number — elegant bottom placement */}
      {settings.showPageNumbers && pageNumber && (
        <div
          className="absolute bottom-2 left-0 right-0 text-center"
          style={{
            fontSize: '8px',
            color: '#b0b0b0',
            letterSpacing: '1px',
            fontFamily: settings.fontFamily,
          }}
        >
          — {pageNumber} —
        </div>
      )}

      {/* Page Content */}
      {editingPageIndex === pageIndex ? (
        // Editable mode — stop ALL event propagation so react-pageflip doesn't intercept
        <div
          className="relative h-full"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          onKeyPress={(e) => e.stopPropagation()}
          onInput={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{ pointerEvents: 'all', zIndex: 50 }}
        >
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            className="h-full overflow-auto book-page-content prose prose-sm max-w-none outline-none focus:ring-2 focus:ring-memorial-gold/50 rounded relative cursor-text"
            dangerouslySetInnerHTML={{ __html: editingContent }}
            style={{
              color: settings.textColor || '#000000',
              direction: isRTL ? 'rtl' : 'ltr',
              paddingTop: showHeader ? '15px' : '0',
              paddingBottom: settings.showPageNumbers ? '20px' : '0',
              zIndex: 50,
              userSelect: 'text',
              WebkitUserSelect: 'text',
            }}
          />
          {/* Editing controls */}
          <div className="absolute bottom-2 left-2 flex gap-2 z-50" onMouseDown={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); onCancelEditing(); }}
              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded shadow"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onFinishEditing(); }}
              className="px-2 py-1 bg-memorial-gold hover:bg-yellow-500 text-black text-xs rounded shadow font-medium"
            >
              {t('common.save', 'Save')}
            </button>
          </div>
        </div>
      ) : (
        // View mode with edit button for chapter pages
        <div className="relative h-full group">
          <div
            className={[
              'h-full overflow-y-auto overflow-x-hidden book-page-content prose prose-sm max-w-none relative flex flex-col',
              // Drop cap class based on template setting
              page.type === 'chapter' && settings.dropCapStyle === 'classic' ? 'book-drop-cap' : '',
              page.type === 'chapter' && settings.dropCapStyle === 'decorative' ? 'book-drop-cap-decorative' : '',
              page.type === 'chapter' && settings.dropCapStyle === 'box' ? 'book-drop-cap-box' : '',
              // Multi-column class
              settings.columns === 2 ? 'book-columns-2 book-column-rule' : '',
              settings.columns === 3 ? 'book-columns-3 book-column-rule' : '',
              settings.columns === 4 ? 'book-columns-4 book-column-rule' : '',
              // Title underline class
              settings.titleUnderline && settings.titleUnderline !== 'none' ? `page-title-underline-${settings.titleUnderline}` : '',
              // Divider style class
              settings.dividerStyle && settings.dividerStyle !== 'none' ? `page-divider-${settings.dividerStyle}` : '',
            ].filter(Boolean).join(' ')}
            style={{
              color: settings.textColor || '#000000',
              direction: isRTL ? 'rtl' : 'ltr',
              paddingTop: showHeader ? '15px' : '0',
              paddingBottom: settings.showPageNumbers ? '20px' : '0',
              zIndex: 5,
              '--accent-color': settings.accentColor || '#8b6914',
              '--frame-color': settings.frameColor || settings.accentColor || '#8b6914',
              ...getContentLayoutStyle(),
            } as React.CSSProperties}
          >
            {/* AI-Generated Chapter Image (at top of chapter page) */}
            {page.type === 'chapter' && aiImagePlacements.filter(p => p.generatedImageUrl && p.position === 'chapter-start').length > 0 && (
              <div className="flex-shrink-0 mb-3">
                {aiImagePlacements
                  .filter(p => p.generatedImageUrl && p.position === 'chapter-start')
                  .map((placement, idx) => (
                    <div
                      key={`ai-img-${idx}`}
                      className="relative w-full rounded-lg overflow-hidden shadow-md"
                      style={{ height: '140px' }}
                    >
                      <img
                        src={placement.generatedImageUrl}
                        alt={placement.prompt || 'AI-generated illustration'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
              </div>
            )}

            {/* Floating elements for side images/placeholders */}
            {getFloatingImageElements().map((floatEl) => (
              <div
                key={floatEl.key}
                style={{
                  float: floatEl.float as 'left' | 'right',
                  width: `${floatEl.width}%`,
                  height: `${floatEl.height}%`,
                  margin: floatEl.float === 'left' ? '0 12px 12px 0' : '0 0 12px 12px',
                  shapeOutside: 'margin-box',
                }}
              />
            ))}
            <div className="flex-1 overflow-hidden" dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }} />
          </div>
          {/* Edit button for chapter pages */}
          {page.type === 'chapter' && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartEditing(pageIndex); }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 bg-memorial-gold/90 hover:bg-memorial-gold text-black rounded-full shadow-lg transition-opacity z-30 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              title={t('book_layout.edit_content', 'Edit content')}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* User-Added Images — deduplicate against AI placements to avoid showing same image twice */}
      {(page.images || []).filter((image) => {
        // Skip images that are already rendered by AI chapter-start placements above.
        // Compare by filename (last URL segment) to handle domain/path variations.
        const getFilename = (url: string) => url?.split('/').pop()?.split('?')[0] || url;
        const aiFilenames = aiImagePlacements
          .filter(p => p.generatedImageUrl && p.position === 'chapter-start')
          .map(p => getFilename(p.generatedImageUrl!));
        const imageFilename = getFilename(image.url);
        return !aiFilenames.includes(imageFilename) && !aiFilenames.some(af => image.url?.includes(af) || af?.includes(imageFilename));
      }).map((image) => {
        // Calculate styles based on image properties
        const imageStyles: React.CSSProperties = {
          left: `${image.x}%`,
          top: `${image.y}%`,
          width: `${image.width}%`,
          height: `${image.height}%`,
          transform: `rotate(${image.rotation || 0}deg) ${image.flipH ? 'scaleX(-1)' : ''} ${image.flipV ? 'scaleY(-1)' : ''}`.trim(),
          opacity: image.opacity ?? 1,
          zIndex: image.textWrap === 'behind' ? 0 : image.textWrap === 'front' ? 20 : 10,
        };

        const imgStyles: React.CSSProperties = {
          borderRadius: image.borderRadius ? `${image.borderRadius}%` : undefined,
          boxShadow: image.shadow ? '0 4px 20px rgba(0,0,0,0.3)' : undefined,
          border: image.border ? `${image.border.width}px ${image.border.style} ${image.border.color}` : undefined,
          // Fade edges effect using mask
          maskImage: image.fadeEdges
            ? `radial-gradient(ellipse at center, black ${100 - (image.fadeAmount || 20)}%, transparent 100%)`
            : undefined,
          WebkitMaskImage: image.fadeEdges
            ? `radial-gradient(ellipse at center, black ${100 - (image.fadeAmount || 20)}%, transparent 100%)`
            : undefined,
        };

        const isSelected = selectedImageId === image.id;
        return (
          <div
            key={image.id}
            className={`absolute transition-shadow ${
              isSelected ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-transparent cursor-move' : 'cursor-pointer'
            }`}
            style={imageStyles}
            onClick={(e) => {
              if (!isSelected) {
                // First click: select the image (don't start dragging)
                e.stopPropagation();
                onImageSelect(image.id);
              }
            }}
            onMouseDown={(e) => {
              if (isSelected) {
                // Already selected: start dragging
                handleImageMouseDown(e, image, 'drag');
              }
              // Not selected: let event bubble to react-pageflip for page flipping
            }}
            onDoubleClick={() => setShowEditToolbar(true)}
          >
            <img
              src={image.url}
              alt=""
              className="w-full h-full object-cover"
              style={imgStyles}
              draggable={false}
            />

            {/* Edit Toolbar */}
            {selectedImageId === image.id && showEditToolbar && (
              <ImageEditToolbar
                image={{ ...image, pageIndex: page.pageIndex || 0 }}
                onUpdate={(updates) => onImageUpdate(image.id, updates)}
                onDelete={() => onImageDelete(image.id)}
                onDuplicate={() => onImageDuplicate(image.id)}
                onMoveToPage={(toPageIndex) => onMoveToPage(image.id, toPageIndex)}
                currentPageIndex={pageIndex}
                totalPages={totalPages}
                onClose={() => setShowEditToolbar(false)}
                language={language}
              />
            )}

            {/* Selection handles */}
            {selectedImageId === image.id && (
              <>
                {/* Corner resize handles */}
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 bg-amber-500 cursor-se-resize rounded-tl"
                  onMouseDown={(e) => handleImageMouseDown(e, image, 'resize')}
                />
                <div className="absolute top-0 left-0 w-2 h-2 bg-amber-500 rounded-full cursor-nw-resize" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full cursor-ne-resize" />
                <div className="absolute bottom-0 left-0 w-2 h-2 bg-amber-500 rounded-full cursor-sw-resize" />

                {/* Edit button */}
                <button
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-amber-500 rounded text-xs text-white font-medium hover:bg-amber-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditToolbar(!showEditToolbar);
                  }}
                >
                  {language === 'he' ? 'עריכה' : 'Edit'}
                </button>
              </>
            )}
          </div>
        );
      })}

      {/* Image Placeholders from Template */}
      {page.type === 'chapter' && settings.imagePlaceholders && settings.imagePlaceholders.length > 0 && onImageAdded && (
        settings.imagePlaceholders.map((placeholder, idx) => {
          // Check if there's already an image at this approximate position
          const hasImageAtPosition = (page.images || []).some(img =>
            Math.abs(img.x - placeholder.x) < 10 &&
            Math.abs(img.y - placeholder.y) < 10
          );

          if (hasImageAtPosition) return null;

          return (
            <ImagePlaceholder
              key={`placeholder-${idx}`}
              x={placeholder.x}
              y={placeholder.y}
              width={placeholder.width}
              height={placeholder.height}
              frameStyle={placeholder.frameStyle || settings.imageFrameStyle || 'shadow'}
              onImageAdded={onImageAdded}
              bookId={bookId}
              chapterIndex={page.chapterIndex}
              pageIndex={page.pageIndex}
              bookContext={bookContext}
              label={placeholder.label}
              isRTL={isRTL}
            />
          );
        })
      )}

      {/* Page Number Footer — single source of truth, kept here only */}

      {/* Blank page — no text overlay (looks like printed blank page) */}
    </div>
  );
}

// Draggable Cover Text Component
function DraggableCoverText({
  children,
  position,
  onPositionChange,
  containerRef,
  className,
}: {
  children: React.ReactNode;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  className?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setStartPos({ x: position.x, y: position.y });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setStartPos({ x: position.x, y: position.y });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number, clientY: number) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = ((clientX - dragStart.x) / rect.width) * 100;
      const deltaY = ((clientY - dragStart.y) / rect.height) * 100;

      const newX = Math.max(0, Math.min(100, startPos.x + deltaX));
      const newY = Math.max(0, Math.min(100, startPos.y + deltaY));

      onPositionChange({ x: newX, y: newY });
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragStart, startPos, containerRef, onPositionChange]);

  return (
    <div
      ref={elementRef}
      className={`absolute cursor-move select-none touch-none ${isDragging ? 'opacity-80' : ''} ${className || ''}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className={`${isDragging ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-transparent rounded px-2' : ''}`}>
        {children}
      </div>
    </div>
  );
}

// Cover Preview Component
function CoverPreview({
  book,
  coverImageUrl,
  onTitlePositionChange,
  onAuthorPositionChange,
}: {
  book: BookData;
  coverImageUrl?: string | null;
  onTitlePositionChange?: (pos: { x: number; y: number }) => void;
  onAuthorPositionChange?: (pos: { x: number; y: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Use consistent font - prefer Hebrew fonts for Hebrew books
  const defaultFont = book.language === 'he' ? 'David Libre' : 'Georgia';
  const coverDesign = book.coverDesign as any || {
    coverColor: '#1a1a2e',
    textColor: '#ffffff',
    fontFamily: defaultFont,
  };

  // Resolved values for shared style functions
  const textColor = coverDesign.textColor || coverDesign.front?.title?.color || '#ffffff';
  const fontUsed = coverDesign.fontFamily || coverDesign.front?.title?.font || defaultFont;

  // Get positions with defaults (center for title, bottom-center for author)
  const titlePosition = coverDesign.titlePosition || coverDesign.front?.title?.position || DEFAULT_TITLE_POS;
  const authorPosition = coverDesign.authorPosition || coverDesign.front?.authorName?.position || DEFAULT_AUTHOR_POS;

  // Get image URL from multiple sources
  const imageUrl = coverImageUrl || coverDesign.imageUrl || coverDesign.front?.imageUrl;

  return (
    <div
      ref={containerRef}
      className="h-full w-full relative overflow-hidden"
      style={{
        background: imageUrl ? 'transparent' : (coverDesign.coverColor || coverDesign.front?.backgroundColor || '#1a1a2e'),
        color: coverDesign.textColor || coverDesign.front?.title?.color || '#ffffff',
        fontFamily: coverDesign.fontFamily || coverDesign.front?.title?.font || defaultFont,
      }}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Cover"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {/* Overlay for text readability */}
      {imageUrl && (
        <div className="absolute inset-0" style={{ background: FRONT_OVERLAY }} />
      )}

      {/* Draggable Title */}
      <DraggableCoverText
        position={titlePosition}
        onPositionChange={onTitlePositionChange || (() => {})}
        containerRef={containerRef as React.RefObject<HTMLDivElement>}
        className="z-10"
      >
        <h1 style={{ ...titleStyle(book.title, textColor, fontUsed), maxWidth: '85%' }}>
          {book.title}
        </h1>
      </DraggableCoverText>

      {/* Draggable Author */}
      <DraggableCoverText
        position={authorPosition}
        onPositionChange={onAuthorPositionChange || (() => {})}
        containerRef={containerRef as React.RefObject<HTMLDivElement>}
        className="z-10"
      >
        <p style={authorStyle(textColor, fontUsed)}>
          {book.author?.name || (book.coverDesign as any)?.front?.authorName?.text || ''}
        </p>
      </DraggableCoverText>
    </div>
  );
}

// Back Cover Preview Component (for summary pages)
function BackCoverPreview({
  book,
  backCoverImageUrl,
  synopsis,
  language,
}: {
  book: BookData;
  backCoverImageUrl?: string | null;
  synopsis?: string;
  language?: string;
}) {
  const coverDesign = book.coverDesign as any || {};
  const isRTL = language === 'he' || language === 'ar';

  // Use consistent font - prefer Hebrew fonts for Hebrew books
  const defaultFont = isRTL ? 'David Libre' : 'Georgia';

  // Get back cover settings - also check coverDesign.back.imageUrl directly
  const backImageUrl = backCoverImageUrl || coverDesign.back?.imageUrl;
  const backColor = coverDesign.back?.backgroundColor || coverDesign.coverColor || '#1a1a2e';
  const textColor = coverDesign.textColor || coverDesign.front?.title?.color || '#ffffff';
  const fontFamily = coverDesign.fontFamily || coverDesign.front?.title?.font || defaultFont;

  // Use book's synopsis or the passed synopsis
  const displaySynopsis = synopsis || book.synopsis || book.description || '';

  return (
    <div
      className="h-full w-full relative overflow-hidden"
      style={{
        background: backImageUrl ? 'transparent' : backColor,
        color: textColor,
        fontFamily: fontFamily,
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      {/* Back cover image */}
      {backImageUrl && (
        <img
          src={backImageUrl}
          alt="Back Cover"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Overlay for text readability */}
      <div className="absolute inset-0" style={{ background: BACK_OVERLAY }} />

      {/* Synopsis content - auto-scaling font */}
      <div className="relative z-10 h-full flex flex-col p-6">
        <div className="flex-1 flex items-center justify-center">
          {(() => {
            const text = displaySynopsis || (language === 'he' ? 'תקציר הספר יופיע כאן...' : 'Book synopsis will appear here...');
            return (
              <p className="break-words" style={synopsisStyle(text, textColor, fontFamily, isRTL)}>
                {text}
              </p>
            );
          })()}
        </div>

        {/* Author at bottom */}
        <div className="pt-3 border-t border-white/20 mt-4">
          <p style={backAuthorStyle(textColor, fontFamily, isRTL)}>
            {language === 'he' ? 'מאת: ' : 'By: '}{book.author?.name || (language === 'he' ? 'מחבר לא ידוע' : 'Unknown Author')}
          </p>
        </div>
      </div>
    </div>
  );
}
