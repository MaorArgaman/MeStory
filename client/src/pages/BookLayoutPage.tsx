import { useState, useEffect, useRef, forwardRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore - react-pageflip has incomplete types
import HTMLFlipBook from 'react-pageflip';
import { api } from '../services/api';
import { exportBookAsPdfAsync } from '../utils/asyncExport';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { useLanguage } from '../contexts/LanguageContext';
import TemplateGallery from '../components/design/TemplateGallery';
import { BookTemplate, textColorPresets, availableFonts } from '../data/bookTemplates';
import { applyTemplate, loadGoogleFonts, PageLayoutSettings } from '../services/templateService';
import {
  loadDesignFonts,
} from '../services/designApplicationService';
import type { AICompleteDesign } from '../types/templates';
import ImageEditToolbar from '../components/layout/ImageEditToolbar';
import ImagePlaceholder from '../components/layout/ImagePlaceholder';
import AICompleteDesignWizard from '../components/design/AICompleteDesignWizard';
import BrandWatermark from '../components/common/BrandWatermark';
import BookProgressStepper from '../components/common/BookProgressStepper';
import { RotateCcw } from 'lucide-react';
import BookFlipReader from '../components/reader/BookFlipReader';

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
  const availableWidth = PAGE_WIDTH_PX - settings.margins.left - settings.margins.right;
  const availableHeight = PAGE_HEIGHT_PX - settings.margins.top - settings.margins.bottom;

  // Hebrew characters are wider than Latin - use 0.6 for Hebrew, 0.5 for Latin
  const avgCharWidth = settings.fontSize * (isHebrew ? 0.65 : 0.5);
  const charsPerLine = Math.floor(availableWidth / avgCharWidth);

  // Estimate lines per page
  const lineHeightPx = settings.fontSize * settings.lineHeight;
  const linesPerPage = Math.floor(availableHeight / lineHeightPx);

  // More conservative buffer for better accuracy (0.55 instead of 0.7)
  return Math.floor(charsPerLine * linesPerPage * 0.55);
};

// Split HTML content into pages while preserving HTML structure
const splitContentIntoPages = (
  htmlContent: string,
  charsPerPage: number,
  isFirstPage: boolean = true
): string[] => {
  const pages: string[] = [];

  // If content is short enough, return as single page
  if (htmlContent.length <= charsPerPage) {
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
  fontSize: 14,
  lineHeight: 1.6,
  fontFamily: 'David Libre',
  titleFont: 'David Libre',
  headerFont: 'David Libre',
  margins: { top: 60, bottom: 60, left: 50, right: 50 },
  showPageNumbers: true,
  includeToc: true,
  includeBackCover: false,
  textColor: '#000000',
  backgroundColor: '#ffffff',
  accentColor: '#6366f1',
  columns: 1 as 1 | 2 | 3 | 4,
  paragraphIndent: 0,
  paragraphSpacing: 12,
  pageNumberPosition: 'bottom-center' as 'top-left' | 'top-right' | 'bottom-center' | 'bottom-outside' | 'none',
  templateId: undefined as string | undefined,
  imagePlaceholders: [] as ImagePlaceholderPosition[],
  imageFrameStyle: 'shadow' as 'none' | 'thin-border' | 'shadow' | 'rounded' | 'decorative',
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
  const [showFlipReader, setShowFlipReader] = useState(false);

  // Publish/Export state (moved from DesignStudioPage)
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx'>('pdf');
  const [pricingStrategy, setPricingStrategy] = useState<PricingStrategy | null>(null);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [isFree, setIsFree] = useState(true);

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

  // Debug RTL detection
  console.log('RTL Debug:', {
    bookTitle: book?.title,
    bookLanguage: book?.language,
    isRTLResult: book ? isRTL(book.title) : null,
    isBookRTL
  });

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
          // Ensure each page has an images array (for backwards compatibility)
          const pagesWithImages = bookData.pageLayout.pages.map((page: any, pageIndex: number) => {
            // Merge any pageImages from the server for this page
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

            // Combine existing images with server images (avoid duplicates)
            const existingImages = page.images || [];
            const existingIds = new Set(existingImages.map((img: any) => img.id));
            const newImages = serverImages.filter((img: any) => !existingIds.has(img.id));

            return {
              ...page,
              images: [...existingImages, ...newImages],
            };
          });
          // Ensure summary page exists if includeBackCover is enabled
          const loadedSettings = { ...defaultSettings, ...bookData.pageLayout.settings };
          const hasSummaryPage = pagesWithImages.some((p: any) => p.type === 'summary');
          if (loadedSettings.includeBackCover && !hasSummaryPage) {
            pagesWithImages.push({
              id: `page-summary`,
              type: 'summary',
              content: bookData.synopsis || bookData.description || '',
              images: [],
            });
          }
          setPages(pagesWithImages);
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
              (import.meta.env.PROD ? 'https://me-story-server-7wdx.vercel.app/api' : 'http://localhost:5001/api');
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
      console.error('Failed to load book:', error);
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
        imagePlacements: (design.imagePlacements || []).map((p: any) => ({
          chapterIndex: p.chapterIndex,
          position: p.pagePosition as 'chapter-start' | 'mid-chapter' | 'chapter-end',
          textContext: '',
          suggestedPrompt: p.prompt || '',
          importance: 'medium' as const,
          reasoning: 'Suggested by AI',
          generatedImageUrl: p.generatedImageUrl || p.imageUrl,
          prompt: p.prompt || '',
        })),
        overallStyle: 'AI Generated Design',
        moodDescription: 'Custom AI-generated design for this book',
        generatedAt: new Date(),
      });

      console.log('Applied stored AI design:', design);
    } catch (error) {
      console.error('Error applying stored AI design:', error);
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
        dropCapStyle: aiDesign?.layout?.dropCaps ? 'classic' : 'none',
        headerDecoration: aiDesign?.layout?.headerStyle !== 'none' ? 'line' : 'none',
        dividerStyle: 'ornament',
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

      const response = await api.post('/templates', templateData);

      if (response.data.success) {
        toast.success(language === 'he' ? 'התבנית נשמרה בהצלחה!' : 'Template saved successfully!');
        setShowSaveTemplateModal(false);
        setTemplateName('');
        setTemplateNameHe('');
      } else {
        throw new Error(response.data.error || 'Failed to save template');
      }
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.message || (language === 'he' ? 'שגיאה בשמירת התבנית' : 'Failed to save template'));
    } finally {
      setSavingTemplate(false);
    }
  };

  // Generate pages from chapters
  const generatePagesFromChapters = (bookData: BookData) => {
    const newPages: PageContent[] = [];
    const bookIsRTL = isRTL(bookData.title) || bookData.language === 'he';

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
      // Account for: title page (1), blank page (1), TOC (2 if enabled)
      const basePages = settings.includeToc && bookData.chapters.length > 1 ? 4 : 2;
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
        .map((ch, i) => `<div class="toc-item"><span class="toc-title">${ch.title}</span><span class="toc-page">${chapterStartPages[i] || ''}</span></div>`)
        .join('');
      newPages.push({
        id: `page-toc`,
        type: 'toc',
        content: `<h2 class="toc-header">Table of Contents</h2>${tocContent}`,
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
      console.error('Failed to load pricing strategy:', error);
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
      console.error('Failed to publish book:', error);
      toast.error(error.response?.data?.error || 'Error publishing book');
    } finally {
      setPublishing(false);
    }
  };

  // Handle export book
  const handleExport = async () => {
    if (!book) return;
    setExporting(true);
    try {
      await saveLayout();
      toast.loading(`Creating ${exportFormat.toUpperCase()} file...`, { id: 'export' });

      if (exportFormat === 'pdf') {
        // PDF goes through the background job queue; large books no longer block or time out.
        await exportBookAsPdfAsync({
          bookId: bookId!,
          bookTitle: book.title,
          onProgress: (progress, message) => {
            toast.loading(`${message} (${progress}%)`, { id: 'export' });
          },
        });
      } else {
        // DOCX / other formats still stream from the sync endpoint
        const response = await api.get(`/books/${bookId}/export/${exportFormat}`, { responseType: 'blob' });
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${book.title}.${exportFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast.success('File downloaded successfully!', { id: 'export' });
      setShowExportModal(false);
    } catch (error: any) {
      console.error('Failed to export book:', error);
      toast.error(error?.message || error.response?.data?.error || 'Error exporting book', { id: 'export' });
    } finally {
      setExporting(false);
    }
  };

  const saveLayout = async (isAutoSave = false) => {
    if (!book) return;

    setSaving(true);
    try {
      // Preserve image URLs (including base64) so images persist across reloads.
      // The previous code stripped base64 and relied on a separate pageImages
      // collection that was never populated for AI-generated images.
      const pagesForSave = pages.map(page => ({
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
        })).filter(img => img.url), // Drop entries without URL
      }));

      const response = await api.put(`/books/${bookId}`, {
        pageLayout: {
          pages: pagesForSave,
          settings,
        },
        coverDesign: book.coverDesign,
      });

      if (response.data.success) {
        setLastSaved(new Date());
        setAutoSaveFailed(false); // Clear any previous failure state
        if (!isAutoSave) {
          toast.success(t('book_layout.messages.save_success', 'Layout saved successfully!'));
        }
      }
    } catch (error) {
      console.error('Failed to save layout:', error);
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
      console.error('Failed to save chapter content:', error);
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

    // Save immediately with the new settings
    if (book) {
      setSaving(true);
      try {
        // Preserve image URLs (including base64) so images persist across reloads
        const pagesForSave = pages.map(page => ({
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
        console.log('Payload size:', JSON.stringify(payload).length, 'bytes');
        const response = await api.put(`/books/${bookId}`, payload);

        if (response.data.success) {
          setLastSaved(new Date());
          toast.success(`תבנית "${template.name}" הוחלה ונשמרה בהצלחה!`);
        }
      } catch (error: any) {
        console.error('Failed to save template:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
        console.error('Error details:', error.response?.data);
        toast.error(`התבנית הוחלה אך השמירה נכשלה: ${errorMessage}`);
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
    // Apply typography settings
    const newSettings = {
      ...settings,
      fontFamily: design.typography.bodyFont,
      titleFont: design.typography.titleFont,
      headerFont: design.typography.headingFont,
      fontSize: design.typography.fontSize,
      lineHeight: design.typography.lineHeight,
      textColor: design.typography.colors.text,
      accentColor: design.typography.colors.accent,
      margins: {
        top: design.layout.margins.top,
        bottom: design.layout.margins.bottom,
        left: design.layout.margins.inner,
        right: design.layout.margins.outer,
      },
      showPageNumbers: design.layout.pageNumberPosition !== 'none',
      pageNumberPosition: design.layout.pageNumberPosition,
      chapterStartStyle: design.layout.chapterStartStyle,
      headerStyle: design.layout.headerStyle,
      dropCapEnabled: design.layout.dropCaps,
    };

    setSettings(newSettings);
    loadGoogleFonts(newSettings as PageLayoutSettings);

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

    // Add image placeholders based on AI suggestions
    if (design.imagePlacements && design.imagePlacements.length > 0) {
      const updatedPages = [...pages];
      design.imagePlacements.forEach((placement: any) => {
        const chapterPages = updatedPages.filter(p => p.type === 'chapter' && p.chapterIndex === placement.chapterIndex);
        if (chapterPages.length > 0) {
          const targetPage = placement.position === 'chapter-start' ? chapterPages[0] :
                            placement.position === 'chapter-end' ? chapterPages[chapterPages.length - 1] :
                            chapterPages[Math.floor(chapterPages.length / 2)];

          if (targetPage) {
            const pageIndex = updatedPages.findIndex(p => p.id === targetPage.id);
            if (pageIndex !== -1) {
              // Add image placeholder info to settings
              const existingPlaceholders = (newSettings as any).imagePlaceholders || [];
              (newSettings as any).imagePlaceholders = [
                ...existingPlaceholders,
                {
                  pageIndex,
                  x: 60,
                  y: placement.position === 'chapter-start' ? 10 : placement.position === 'mid-chapter' ? 40 : 70,
                  width: 35,
                  height: 25,
                  shape: 'rounded',
                  prompt: placement.suggestedPrompt,
                },
              ];
            }
          }
        }
      });
      setPages(updatedPages);
      setSettings(newSettings);
    }

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
        toast.success(language === 'he' ? 'העיצוב הוחל ונשמר!' : 'Design applied and saved!');
      } catch (error) {
        console.error('Failed to save AI design:', error);
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
      const selectedPage = pages[selectedPageIndex];
      console.log('Uploading image to page:', selectedPageIndex, 'Page ID:', selectedPage?.id, 'Type:', selectedPage?.type);
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
      console.error('Upload error:', error);
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
      console.error('Generate image error:', error);
      toast.error(error.response?.data?.error || 'Error generating image', { id: 'generate-image' });
    } finally {
      setGeneratingImage(false);
    }
  };

  // Update image position/size
  const updateImagePosition = (pageIndex: number, imageId: string, updates: Partial<PageImage>) => {
    console.log('updateImagePosition called:', { pageIndex, imageId, updates });

    setPages(prevPages => {
      // Handle empty pages array
      if (!prevPages || prevPages.length === 0) {
        console.error('Pages array is empty');
        return prevPages;
      }
      const updatedPages = [...prevPages];
      if (!updatedPages[pageIndex]) {
        console.error('Page not found at index:', pageIndex);
        return prevPages;
      }
      // Ensure images array exists
      if (!updatedPages[pageIndex].images) {
        updatedPages[pageIndex].images = [];
        return prevPages;
      }
      const imageIndex = updatedPages[pageIndex].images.findIndex(img => img.id === imageId);
      console.log('Found image at index:', imageIndex);

      if (imageIndex !== -1) {
        updatedPages[pageIndex].images[imageIndex] = {
          ...updatedPages[pageIndex].images[imageIndex],
          ...updates,
        };
        console.log('Updated image:', updatedPages[pageIndex].images[imageIndex]);
        return updatedPages;
      }
      console.error('Image not found with id:', imageId);
      return prevPages;
    });
  };

  // Delete image
  const deleteImage = (pageIndex: number, imageId: string) => {
    // Handle empty pages array
    if (!pages || pages.length === 0 || !pages[pageIndex]) {
      console.error('Invalid page index or empty pages array');
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
      console.error('Invalid page index or empty pages array');
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
      console.error('Invalid page index');
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
    toast.success(t('book_layout.blank_page_added', 'Blank page added'));
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
      toast.success(t('book_layout.page_removed', 'Page removed'));
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
      toast.success(t('book_layout.toc_removed', 'Table of Contents removed'));
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
        .map((ch, i) => `<div class="toc-item"><span class="toc-title">${ch.title}</span><span class="toc-page">${chapterStartPages[i] || ''}</span></div>`)
        .join('');

      const tocPage: PageContent = {
        id: `page-toc`,
        type: 'toc',
        content: `<h2 class="toc-header">${t('book_layout.table_of_contents', 'Table of Contents')}</h2>${tocContent}`,
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
      toast.success(t('book_layout.toc_added', 'Table of Contents added'));
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

  // Flipbook navigation helpers
  const flipNext = () => flipBookRef.current?.pageFlip()?.flipNext();
  const flipPrev = () => flipBookRef.current?.pageFlip()?.flipPrev();
  const readNext = isBookRTL ? flipPrev : flipNext;
  const readPrev = isBookRTL ? flipNext : flipPrev;

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
    flipBookRef.current?.pageFlip()?.flip(Math.max(0, Math.min(domPage, totalDomPages - 1)));
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-memorial-gold" />
      </div>
    );
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
                src="/img/MeStory-Logo.png"
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
              title={isBookRTL ? 'מצב קריאה' : 'Reader mode'}
            >
              <BookOpen className="w-4 h-4 text-memorial-gold" />
              <span className="hidden sm:inline text-memorial-gold">
                {isBookRTL ? 'קריאה' : 'Read'}
              </span>
            </button>

            {/* Export Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="btn-secondary flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
              title="Export book"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">{t('design_studio.export_to_file', 'Export')}</span>
            </button>

            {/* Publish Button */}
            <button
              onClick={openPublishModal}
              className="btn-gold flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 shadow-glow-gold"
              title="Publish to store"
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
          ${isUIRTL ? 'right-0 lg:right-auto' : 'left-0 lg:left-auto'}
          w-[180px] sm:w-48 h-full max-h-screen
          glass-strong ${isUIRTL ? 'border-l' : 'border-r'} border-white/10 p-3 sm:p-4 overflow-y-auto
          transition-transform duration-300 ease-in-out
        `}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">Pages</h3>
            <button
              onClick={() => setShowMobilePages(false)}
              className="lg:hidden btn-ghost p-3 min-w-[44px] min-h-[44px]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {/* Cover */}
            <button
              onClick={() => {
                jumpToSpread(0);
                setShowMobilePages(false);
              }}
              className={`w-full aspect-[3/4] rounded-lg border-2 transition-all ${
                currentSpread === 0
                  ? 'border-memorial-gold bg-memorial-gold/20'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-center h-full text-xs text-gray-400">
                Cover
              </div>
            </button>

            {/* Page pairs */}
            {Array.from({ length: Math.ceil(pages.length / 2) }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  jumpToSpread(i + 1);
                  setShowMobilePages(false);
                }}
                className={`w-full aspect-[3/4] rounded-lg border-2 transition-all ${
                  currentSpread === i + 1
                    ? 'border-memorial-gold bg-memorial-gold/20'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-center h-full text-xs text-gray-400">
                  {i * 2 + 1} - {i * 2 + 2}
                </div>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 space-y-2">
            <button
              onClick={toggleToc}
              className="w-full btn-secondary text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2"
            >
              <List className="w-4 h-4" />
              <span className="truncate">{settings.includeToc ? t('book_layout.remove_toc') : t('book_layout.add_toc')}</span>
            </button>
          </div>
        </div>

        {/* Center - Page Spread View (BookFlipReader-style chrome) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-deep-space via-[#0a0a1f] to-cosmic-purple/30 rounded-xl">

          {/* Top bar — compact */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/30 backdrop-blur-sm border-b border-memorial-gold/20">
            {/* Left: back to cover */}
            <button
              onClick={() => jumpToSpread(0)}
              disabled={currentSpread === 0}
              className="flex items-center gap-2 text-memorial-gold hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={isBookRTL ? 'חזרה להתחלה' : 'Back to start'}
            >
              <RotateCcw className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">
                {isBookRTL ? 'חזרה להתחלה' : 'Back to start'}
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

          {/* Flipbook content area */}
          <div className="flex-1 flex flex-col items-center justify-center p-1 sm:p-2 lg:p-4 overflow-hidden min-h-0">

          {/* react-pageflip book with editing — 350×500 base, auto-scales via size="stretch" */}
          <div className="relative w-full h-full max-h-[50vh] flex items-center justify-center">
            <HTMLFlipBook
              ref={flipBookRef}
              width={350}
              height={500}
              size="stretch"
              minWidth={250}
              maxWidth={450}
              minHeight={350}
              maxHeight={600}
              maxShadowOpacity={0.5}
              showCover={true}
              mobileScrollSupport={false}
              drawShadow={true}
              flippingTime={900}
              usePortrait={false}
              autoSize={true}
              clickEventForward={true}
              useMouseEvents={true}
              swipeDistance={50}
              showPageCorners={true}
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
                if (idx === -1 && page.type !== 'blank') return null;
                const actualIdx = idx === -1 ? pages.length : idx;

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
                        {t('book_layout.blank_page', 'Blank page')}
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
          </div>

          {/* Reading Direction Indicator - shows for RTL books */}
          {currentSpread > 0 && isBookRTL && (
            <div className="flex items-center justify-center gap-4 mt-1 text-memorial-gold/70 text-[10px] animate-pulse">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                {t('book_layout.start_reading', 'התחל כאן')}
              </span>
              <div className="flex items-center gap-1">
                <span>←</span>
                <span>←</span>
                <span>←</span>
              </div>
              <span>{t('book_layout.continue_reading', 'המשך')}</span>
            </div>
          )}

          {/* Page Labels - show which page is which in the spread */}
          {currentSpread > 0 && (
            <div className="flex items-center justify-center mt-1">
              <div className="flex items-center gap-4" style={{ width: '716px' }}>
                {/* Left page label */}
                <div className="flex-1 text-center">
                  <span className="text-gray-400 text-xs px-2 py-1 rounded bg-deep-space/50">
                    {isBookRTL
                      ? `עמוד ${(currentSpread - 1) * 2 + 2} (זוגי)`
                      : `Page ${(currentSpread - 1) * 2 + 1} (odd)`
                    }
                  </span>
                </div>
                {/* Spine space */}
                <div className="w-5"></div>
                {/* Right page label */}
                <div className="flex-1 text-center">
                  <span className="text-gray-400 text-xs px-2 py-1 rounded bg-deep-space/50">
                    {isBookRTL
                      ? `עמוד ${(currentSpread - 1) * 2 + 1} (אי-זוגי)`
                      : `Page ${(currentSpread - 1) * 2 + 2} (even)`
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Page Actions */}
          {selectedPageIndex !== null && (
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 mt-1 sm:mt-2">
              <button
                onClick={() => {
                  setShowImageModal(true);
                }}
                className="btn-secondary text-xs sm:text-sm flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5"
              >
                <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add Image</span>
                <span className="sm:hidden">Image</span>
              </button>
              <button
                onClick={() => addBlankPage(selectedPageIndex)}
                className="btn-secondary text-xs sm:text-sm flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add Page</span>
                <span className="sm:hidden">Page</span>
              </button>
              {pages[selectedPageIndex]?.type === 'blank' && (
                <button
                  onClick={() => removePage(selectedPageIndex)}
                  className="btn-secondary text-xs sm:text-sm flex items-center gap-1 sm:gap-2 text-red-400 px-2 sm:px-3 py-1.5"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Remove</span>
                </button>
              )}
            </div>
          )}

          {/* Keyboard shortcuts hint - hidden to save space, accessible via title */}
          <div className="hidden lg:block mt-1 text-[10px] text-gray-600">
            Ctrl+Enter = Add page | Ctrl+S = Save | Arrows = Navigate
          </div>
          </div>

          {/* Bottom bar — compact navigation */}
          <div className="flex items-center justify-center gap-4 px-4 py-2 bg-black/30 backdrop-blur-sm border-t border-memorial-gold/20">
            <button
              onClick={isBookRTL ? readNext : readPrev}
              disabled={isBookRTL ? currentSpread >= totalSpreads - 1 : currentSpread === 0}
              className="p-2 rounded-full bg-memorial-gold/10 hover:bg-memorial-gold/20 text-memorial-gold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title={isBookRTL ? 'הדף הבא' : 'Previous'}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={isBookRTL ? readPrev : readNext}
              disabled={isBookRTL ? currentSpread === 0 : currentSpread >= totalSpreads - 1}
              className="p-2 rounded-full bg-memorial-gold/10 hover:bg-memorial-gold/20 text-memorial-gold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title={isBookRTL ? 'הדף הקודם' : 'Next'}
            >
              <ChevronRight className="w-6 h-6" />
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
                      <span className="text-lg">→</span>
                      <span className="text-lg">→</span>
                      <span className="text-lg">→</span>
                      <span className="font-medium">כיוון הקריאה</span>
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
                      Using: {settings.templateId}
                    </p>
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
                  <h2 className="text-lg sm:text-xl font-bold text-white">Add Image</h2>
                  {selectedPageIndex !== null && (
                    <p className="text-xs text-memorial-gold mt-1">
                      Adding to: Page {selectedPageIndex + 1} ({pages[selectedPageIndex]?.type || 'unknown'})
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

              {/* Upload Option */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-2 sm:mb-3">Upload Image</h3>
                <label className="flex flex-col items-center justify-center w-full h-28 sm:h-32 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-memorial-gold transition">
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mb-2" />
                  <span className="text-xs sm:text-sm text-gray-400">Click to upload image</span>
                  <span className="text-xs text-gray-500">PNG, JPG up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>

              <div className="relative mb-4 sm:mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-deep-space text-gray-400 text-xs sm:text-sm">or</span>
                </div>
              </div>

              {/* AI Generation Option */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2 sm:mb-3">Generate Image with AI</h3>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the image you want to create..."
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
                    placeholder="My Custom Template"
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

      {/* Brand Watermark - Marketing */}
      <BrandWatermark
        position="bottom-right"
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

                <button
                  onClick={() => setExportFormat('pdf')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-right ${exportFormat === 'pdf' ? 'border-memorial-gold bg-memorial-gold/20' : 'border-gray-700 hover:border-gray-600'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${exportFormat === 'pdf' ? 'bg-red-500' : 'bg-red-500/50'}`}>
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">PDF</p>
                      <p className="text-sm text-gray-400">{t('design_studio.export_modal.pdf_desc', 'Ready for printing')}</p>
                    </div>
                    {exportFormat === 'pdf' && <CheckCircle2 className="w-6 h-6 text-memorial-gold" />}
                  </div>
                </button>

                <button
                  onClick={() => setExportFormat('docx')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-right ${exportFormat === 'docx' ? 'border-memorial-gold bg-memorial-gold/20' : 'border-gray-700 hover:border-gray-600'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${exportFormat === 'docx' ? 'bg-blue-500' : 'bg-blue-500/50'}`}>
                      <FileType className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">{t('design_studio.export_modal.docx_title', 'Word (DOCX)')}</p>
                      <p className="text-sm text-gray-400">{t('design_studio.export_modal.docx_desc', 'Editable in Word')}</p>
                    </div>
                    {exportFormat === 'docx' && <CheckCircle2 className="w-6 h-6 text-memorial-gold" />}
                  </div>
                </button>

                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="w-full btn-primary py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {exporting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />{t('design_studio.export_modal.exporting', 'Exporting...')}</>
                  ) : (
                    <><Download className="w-5 h-5" />{t('design_studio.export_modal.download', 'Download')} {exportFormat.toUpperCase()}</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

  return (
    <div
      ref={containerRef}
      className={`relative h-full ${isSelected ? 'ring-2 ring-memorial-gold' : ''}`}
      style={{
        padding: `${settings.margins.top}px ${settings.margins.right}px ${settings.margins.bottom}px ${settings.margins.left}px`,
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
        color: settings.textColor || '#000000',
        backgroundColor: settings.backgroundColor || '#ffffff',
        direction: isRTL ? 'rtl' : 'ltr',
        textAlign: isRTL ? 'right' : 'left',
      }}
    >
      {/* Header */}
      {showHeader && headerStyle !== 'none' && page.type !== 'title' && page.type !== 'toc' && (
        <div
          className="absolute top-2 left-0 right-0 text-center"
          style={{
            fontSize: '9px',
            color: '#6b7280',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            fontFamily: settings.fontFamily,
          }}
        >
          {getHeaderText()}
        </div>
      )}

      {/* Page Content */}
      {editingPageIndex === pageIndex ? (
        // Editable mode — stop propagation so react-pageflip doesn't intercept events
        <div
          className="relative h-full"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
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
          <div className="absolute bottom-2 right-2 flex gap-2 z-50" onMouseDown={(e) => e.stopPropagation()}>
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
            className="h-full overflow-y-auto overflow-x-hidden book-page-content prose prose-sm max-w-none relative flex flex-col"
            style={{
              color: settings.textColor || '#000000',
              direction: isRTL ? 'rtl' : 'ltr',
              paddingTop: showHeader ? '15px' : '0',
              paddingBottom: settings.showPageNumbers ? '20px' : '0',
              zIndex: 5,
              ...getContentLayoutStyle(),
            }}
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
            <div className="flex-1 overflow-hidden" dangerouslySetInnerHTML={{ __html: page.content }} />
          </div>
          {/* Edit button for chapter pages */}
          {page.type === 'chapter' && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartEditing(pageIndex); }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 bg-memorial-gold/90 hover:bg-memorial-gold text-black rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-30"
              title={t('book_layout.edit_content', 'Edit content')}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* User-Added Images */}
      {(page.images || []).map((image) => {
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

        return (
          <div
            key={image.id}
            className={`absolute cursor-move transition-shadow ${
              selectedImageId === image.id ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-transparent' : ''
            }`}
            style={imageStyles}
            onMouseDown={(e) => handleImageMouseDown(e, image, 'drag')}
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

      {/* Page Number Footer */}
      {settings.showPageNumbers && pageNumber !== undefined && page.type !== 'title' && (
        <div
          className="absolute bottom-3 left-0 right-0 text-center"
          style={{
            fontSize: '10px',
            color: '#6b7280',
            fontFamily: settings.fontFamily,
          }}
        >
          {pageNumber}
        </div>
      )}

      {/* Page type indicator */}
      {page.type === 'blank' && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">
          Blank page
        </div>
      )}
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

  // Get positions with defaults (center for title, bottom-center for author)
  const titlePosition = coverDesign.titlePosition || coverDesign.front?.title?.position || { x: 50, y: 30 };
  const authorPosition = coverDesign.authorPosition || coverDesign.front?.authorName?.position || { x: 50, y: 85 };

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
      {/* Dark overlay for text readability */}
      {imageUrl && (
        <div className="absolute inset-0 bg-black/30" />
      )}

      {/* Draggable Title */}
      <DraggableCoverText
        position={titlePosition}
        onPositionChange={onTitlePositionChange || (() => {})}
        containerRef={containerRef as React.RefObject<HTMLDivElement>}
        className="z-10"
      >
        <h1
          className="font-bold text-center text-white drop-shadow-lg"
          style={{
            fontSize: book.title.length > 30 ? '0.875rem' : book.title.length > 20 ? '1rem' : '1.25rem',
            lineHeight: '1.3',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            maxWidth: '90%',
            wordBreak: 'keep-all',
          }}
        >
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
        <p
          className="text-white drop-shadow-lg text-center"
          style={{ fontSize: 'clamp(0.75rem, 3vw, 1rem)' }}
        >
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

      {/* Dark overlay for text readability */}
      {backImageUrl && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      {/* Synopsis content - auto-scaling font to fit all text */}
      <div className="relative z-10 h-full flex flex-col p-6">
        <div className="flex-1 flex items-center justify-center">
          {(() => {
            const text = displaySynopsis || (language === 'he' ? 'תקציר הספר יופיע כאן...' : 'Book synopsis will appear here...');
            const len = text.length;
            const fontSize = len < 200 ? '0.95rem' : len < 350 ? '0.85rem' : len < 500 ? '0.78rem' : '0.72rem';
            const lineHeight = len < 200 ? 1.7 : len < 350 ? 1.6 : 1.5;
            return (
              <p
                className="text-white/90 drop-shadow-md break-words"
                style={{
                  fontSize,
                  lineHeight,
                  userSelect: 'none',
                  whiteSpace: 'pre-wrap',
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {text}
              </p>
            );
          })()}
        </div>

        {/* Author at bottom */}
        <div className="pt-4 border-t border-white/20 mt-4">
          <p className="text-sm text-white/80">
            {language === 'he' ? 'מאת: ' : 'By: '}{book.author?.name || (language === 'he' ? 'מחבר לא ידוע' : 'Unknown Author')}
          </p>
        </div>
      </div>
    </div>
  );
}
