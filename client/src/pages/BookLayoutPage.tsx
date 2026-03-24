import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  List,
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
  Layers,
  Edit3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import TemplateGallery from '../components/design/TemplateGallery';
import { BookTemplate, textColorPresets, availableFonts } from '../data/bookTemplates';
import { applyTemplate, loadGoogleFonts, PageLayoutSettings } from '../services/templateService';
import {
  loadDesignFonts,
} from '../services/designApplicationService';
import type { AICompleteDesign } from '../types/templates';
import ImageEditToolbar from '../components/layout/ImageEditToolbar';

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

// Default page layout settings
const defaultSettings = {
  fontSize: 14,
  lineHeight: 1.6,
  fontFamily: 'David Libre',
  titleFont: 'David Libre',
  headerFont: 'David Libre',
  margins: { top: 60, bottom: 60, left: 50, right: 50 },
  showPageNumbers: true,
  includeToc: true,
  includeBackCover: true,
  textColor: '#000000',
  backgroundColor: '#ffffff',
  accentColor: '#6366f1',
  columns: 1 as 1 | 2 | 3 | 4,
  paragraphIndent: 0,
  paragraphSpacing: 12,
  pageNumberPosition: 'bottom-center' as 'top-left' | 'top-right' | 'bottom-center' | 'bottom-outside' | 'none',
  templateId: undefined as string | undefined,
};

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

  // Page navigation
  const [currentSpread, setCurrentSpread] = useState(0); // 0 = cover, 1 = pages 1-2, etc.
  const [pages, setPages] = useState<PageContent[]>([]);
  const [settings, setSettings] = useState(defaultSettings);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');

  // AI Design state (for applying stored designs)
  const [aiDesign, setAiDesign] = useState<CompleteBookDesign | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  // Mobile UI state
  const [showMobilePages, setShowMobilePages] = useState(false);

  // Editing state
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const editableRef = useRef<HTMLDivElement>(null);

  // Determine text direction based on book language
  const isBookRTL = book ? isRTL(book.title) || book.language === 'he' || book.language === 'ar' : false;

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
          setPages(pagesWithImages);
          setSettings({ ...defaultSettings, ...bookData.pageLayout.settings });
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
          console.log('📚 Loading coverDesign from database:', cd);
          console.log('📚 imageUrl:', cd.imageUrl);
          console.log('📚 front?.imageUrl:', cd.front?.imageUrl);

          // Apply cover settings
          const resolvedImageUrl = cd.imageUrl || cd.front?.imageUrl || null;
          if (resolvedImageUrl) {
            console.log('📚 Setting coverImageUrl to:', resolvedImageUrl);
            setCoverImageUrl(resolvedImageUrl);
          }
          // Update book state with cover design
          setBook(prev => prev ? {
            ...prev,
            coverDesign: {
              ...prev.coverDesign,
              coverColor: cd.coverColor || cd.front?.backgroundColor || prev.coverDesign?.coverColor,
              textColor: cd.textColor || cd.front?.title?.color || prev.coverDesign?.textColor,
              fontFamily: cd.fontFamily || cd.front?.title?.font || prev.coverDesign?.fontFamily,
              imageUrl: resolvedImageUrl || prev.coverDesign?.imageUrl,
            },
          } : null);
        } else {
          console.log('📚 No coverDesign found in book data');
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
        imagePlacements: (design.imagePlacements || []).map(p => ({
          chapterIndex: p.chapterIndex,
          position: p.pagePosition as 'chapter-start' | 'mid-chapter' | 'chapter-end',
          textContext: '',
          suggestedPrompt: p.prompt || '',
          importance: 'medium' as const,
          reasoning: 'Suggested by AI',
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
  const saveLayout = async (isAutoSave = false) => {
    if (!book) return;

    setSaving(true);
    try {
      // Strip base64 image URLs from pages to reduce payload size
      // Images are stored separately in pageImages collection
      const pagesForSave = pages.map(page => ({
        ...page,
        images: (page.images || []).map(img => ({
          id: img.id,
          x: img.x,
          y: img.y,
          width: img.width,
          height: img.height,
          rotation: img.rotation,
          // Only include URL if it's not a base64 data URL
          url: img.url?.startsWith('data:') ? undefined : img.url,
        })).filter(img => img.url || img.id), // Keep images with URL or ID
      }));

      const response = await api.put(`/books/${bookId}`, {
        pageLayout: {
          pages: pagesForSave,
          settings,
        },
      });

      if (response.data.success) {
        setLastSaved(new Date());
        if (!isAutoSave) {
          toast.success('Layout saved successfully!');
        }
      }
    } catch (error) {
      console.error('Failed to save layout:', error);
      if (!isAutoSave) {
        toast.error('Error saving layout');
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
        // Strip base64 image URLs to reduce payload size
        const pagesForSave = pages.map(page => ({
          ...page,
          images: (page.images || []).map(img => ({
            id: img.id,
            x: img.x,
            y: img.y,
            width: img.width,
            height: img.height,
            rotation: img.rotation,
            url: img.url?.startsWith('data:') ? undefined : img.url,
          })).filter(img => img.url || img.id),
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

      const response = await api.post('/ai/generate-image', {
        prompt: imagePrompt,
        bookId,
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
      const updatedPages = [...prevPages];
      if (!updatedPages[pageIndex]) {
        console.error('Page not found at index:', pageIndex);
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
    const updatedPages = [...pages];
    updatedPages[pageIndex].images = updatedPages[pageIndex].images.filter(img => img.id !== imageId);
    setPages(updatedPages);
    setSelectedImageId(null);
  };

  // Duplicate image
  const duplicateImage = (pageIndex: number, imageId: string) => {
    const updatedPages = [...pages];
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

  // Add page break / blank page
  const addBlankPage = (afterIndex: number) => {
    const newPage: PageContent = {
      id: `page-blank-${Date.now()}`,
      type: 'blank',
      content: '',
      images: [],
    };
    const updatedPages = [...pages];
    updatedPages.splice(afterIndex + 1, 0, newPage);
    setPages(updatedPages);
    toast.success('Blank page added');
  };

  // Remove page
  const removePage = (index: number) => {
    if (pages[index].type === 'blank') {
      const updatedPages = pages.filter((_, i) => i !== index);
      setPages(updatedPages);
      toast.success('Page removed');
    } else {
      toast.error('Only blank pages can be removed');
    }
  };

  // Toggle TOC
  const toggleToc = () => {
    const hasToc = pages.some(p => p.type === 'toc');
    if (hasToc) {
      setPages(pages.filter(p => p.type !== 'toc'));
      setSettings({ ...settings, includeToc: false });
      toast.success('Table of Contents removed');
    } else {
      if (book) {
        generatePagesFromChapters(book);
      }
      setSettings({ ...settings, includeToc: true });
      toast.success('Table of Contents added');
    }
  };

  // Update page content (for future use with editable pages)
  const _updatePageContent = (index: number, content: string) => {
    const updatedPages = [...pages];
    updatedPages[index].content = content;
    setPages(updatedPages);
  };
  void _updatePageContent; // Suppress unused warning

  // Navigate spreads
  const totalSpreads = Math.ceil((pages.length + 1) / 2); // +1 for cover
  const goToNextSpread = () => {
    if (currentSpread < totalSpreads - 1) {
      setCurrentSpread(currentSpread + 1);
    }
  };
  const goToPrevSpread = () => {
    if (currentSpread > 0) {
      setCurrentSpread(currentSpread - 1);
    }
  };

  // Get pages for current spread
  const getSpreadPages = (): { left: PageContent | null; right: PageContent | null; isCover: boolean } => {
    if (currentSpread === 0) {
      return { left: null, right: null, isCover: true };
    }
    const startIndex = (currentSpread - 1) * 2;
    return {
      left: pages[startIndex] || null,
      right: pages[startIndex + 1] || null,
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
        <Loader2 className="w-12 h-12 animate-spin text-magic-gold" />
      </div>
    );
  }

  if (!book) return null;

  const spreadPages = getSpreadPages();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-deep-space via-deep-space to-cosmic-purple/20">
      {/* Top Toolbar */}
      <div className="glass-strong border-b border-white/10 px-3 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
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
            <span className="hidden lg:inline px-2 py-1 rounded bg-magic-gold/20 text-magic-gold text-xs font-medium">
              {isBookRTL ? t('book_layout.hebrew_rtl') : t('book_layout.english_ltr')}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            {/* Auto-save indicator - hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('book_layout.saving')}</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="hidden lg:inline">{t('book_layout.saved')} {lastSaved.toLocaleTimeString()}</span>
                </>
              ) : null}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`btn-ghost p-1.5 sm:p-2 ${showSettings ? 'bg-white/10' : ''}`}
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
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

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
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
          w-[200px] sm:w-48 h-full
          glass-strong ${isUIRTL ? 'border-l' : 'border-r'} border-white/10 p-3 sm:p-4 overflow-y-auto
          transition-transform duration-300 ease-in-out
        `}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">Pages</h3>
            <button
              onClick={() => setShowMobilePages(false)}
              className="lg:hidden btn-ghost p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {/* Cover */}
            <button
              onClick={() => {
                setCurrentSpread(0);
                setShowMobilePages(false);
              }}
              className={`w-full aspect-[3/4] rounded-lg border-2 transition-all ${
                currentSpread === 0
                  ? 'border-magic-gold bg-magic-gold/20'
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
                  setCurrentSpread(i + 1);
                  setShowMobilePages(false);
                }}
                className={`w-full aspect-[3/4] rounded-lg border-2 transition-all ${
                  currentSpread === i + 1
                    ? 'border-magic-gold bg-magic-gold/20'
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

        {/* Center - Page Spread View */}
        <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 lg:p-8 overflow-hidden">
          {/* Navigation */}
          <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
            <button
              onClick={isBookRTL ? goToNextSpread : goToPrevSpread}
              disabled={isBookRTL ? currentSpread >= totalSpreads - 1 : currentSpread === 0}
              className="btn-ghost p-1.5 sm:p-2 disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <span className="text-gray-400 text-xs sm:text-sm">
              {currentSpread === 0 ? t('book_layout.cover') : `${(currentSpread - 1) * 2 + 1}-${(currentSpread - 1) * 2 + 2}`}
            </span>
            <button
              onClick={isBookRTL ? goToPrevSpread : goToNextSpread}
              disabled={isBookRTL ? currentSpread === 0 : currentSpread >= totalSpreads - 1}
              className="btn-ghost p-1.5 sm:p-2 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Book Spread - responsive scaling */}
          <div
            className={`flex ${isBookRTL ? 'flex-row-reverse' : 'flex-row'} gap-1 sm:gap-2 perspective-1000 transform scale-[0.45] sm:scale-[0.65] md:scale-[0.8] lg:scale-100 origin-center`}
          >
            {/* Left Page */}
            <div
              className={`relative rounded-lg shadow-2xl overflow-hidden ${
                currentSpread === 0 ? 'opacity-30' : ''
              }`}
              style={{
                width: '350px',
                height: '500px',
                direction: isBookRTL ? 'rtl' : 'ltr',
                backgroundColor: settings.backgroundColor || '#ffffff',
              }}
              onClick={() => {
                if (spreadPages.left && typeof spreadPages.left !== 'string') {
                  const idx = pages.findIndex(p => p.id === spreadPages.left?.id);
                  setSelectedPageIndex(idx);
                }
              }}
            >
              {spreadPages.left && typeof spreadPages.left !== 'string' ? (
                <PageRenderer
                  page={spreadPages.left}
                  pageIndex={pages.findIndex(p => p.id === spreadPages.left?.id)}
                  settings={settings}
                  isRTL={isBookRTL}
                  isSelected={selectedPageIndex === pages.findIndex(p => p.id === spreadPages.left?.id)}
                  onImageSelect={setSelectedImageId}
                  selectedImageId={selectedImageId}
                  onImageUpdate={(imageId, updates) => {
                    const idx = pages.findIndex(p => p.id === spreadPages.left?.id);
                    if (idx !== -1) updateImagePosition(idx, imageId, updates);
                  }}
                  onImageDelete={(imageId) => {
                    const idx = pages.findIndex(p => p.id === spreadPages.left?.id);
                    if (idx !== -1) deleteImage(idx, imageId);
                  }}
                  onImageDuplicate={(imageId) => {
                    const idx = pages.findIndex(p => p.id === spreadPages.left?.id);
                    if (idx !== -1) duplicateImage(idx, imageId);
                  }}
                  pageNumber={currentSpread > 0 ? (currentSpread - 1) * 2 + 1 : undefined}
                  bookTitle={book.title}
                  showHeader={aiDesign?.layout?.headerStyle !== 'none'}
                  headerStyle={aiDesign?.layout?.headerStyle as 'book-title' | 'chapter-title' | 'none'}
                  aiImagePlacements={
                    spreadPages.left?.type === 'chapter' && spreadPages.left?.chapterIndex !== undefined
                      ? (aiDesign?.imagePlacements || []).filter(
                          (p: any) => p.chapterIndex === spreadPages.left?.chapterIndex
                        )
                      : []
                  }
                  language={language}
                  editingPageIndex={editingPageIndex}
                  editingContent={editingContent}
                  editableRef={editableRef}
                  onStartEditing={handleStartEditing}
                  onFinishEditing={handleFinishEditing}
                  onCancelEditing={handleCancelEditing}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300 text-sm">
                  {currentSpread === 0 ? '' : t('book_layout.blank_page')}
                </div>
              )}
            </div>

            {/* Spine */}
            <div className="w-2 sm:w-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded shadow-inner" />

            {/* Right Page */}
            <div
              className="relative rounded-lg shadow-2xl overflow-hidden"
              style={{
                width: '350px',
                height: '500px',
                direction: isBookRTL ? 'rtl' : 'ltr',
                backgroundColor: settings.backgroundColor || '#ffffff',
              }}
              onClick={() => {
                if (spreadPages.isCover) {
                  // Cover page
                } else if (spreadPages.right) {
                  const idx = pages.findIndex(p => p.id === spreadPages.right!.id);
                  setSelectedPageIndex(idx);
                }
              }}
            >
              {spreadPages.isCover ? (
                <CoverPreview book={book} coverImageUrl={coverImageUrl} />
              ) : spreadPages.right ? (
                <PageRenderer
                  page={spreadPages.right}
                  pageIndex={pages.findIndex(p => p.id === spreadPages.right!.id)}
                  settings={settings}
                  isRTL={isBookRTL}
                  isSelected={selectedPageIndex === pages.findIndex(p => p.id === spreadPages.right!.id)}
                  onImageSelect={setSelectedImageId}
                  selectedImageId={selectedImageId}
                  onImageUpdate={(imageId, updates) => {
                    const idx = pages.findIndex(p => p.id === spreadPages.right!.id);
                    if (idx !== -1) updateImagePosition(idx, imageId, updates);
                  }}
                  onImageDelete={(imageId) => {
                    const idx = pages.findIndex(p => p.id === spreadPages.right!.id);
                    if (idx !== -1) deleteImage(idx, imageId);
                  }}
                  onImageDuplicate={(imageId) => {
                    const idx = pages.findIndex(p => p.id === spreadPages.right!.id);
                    if (idx !== -1) duplicateImage(idx, imageId);
                  }}
                  pageNumber={currentSpread > 0 ? (currentSpread - 1) * 2 + 2 : undefined}
                  bookTitle={book.title}
                  showHeader={aiDesign?.layout?.headerStyle !== 'none'}
                  headerStyle={aiDesign?.layout?.headerStyle as 'book-title' | 'chapter-title' | 'none'}
                  aiImagePlacements={
                    spreadPages.right?.type === 'chapter' && spreadPages.right?.chapterIndex !== undefined
                      ? (aiDesign?.imagePlacements || []).filter(
                          (p: any) => p.chapterIndex === spreadPages.right?.chapterIndex
                        )
                      : []
                  }
                  language={language}
                  editingPageIndex={editingPageIndex}
                  editingContent={editingContent}
                  editableRef={editableRef}
                  onStartEditing={handleStartEditing}
                  onFinishEditing={handleFinishEditing}
                  onCancelEditing={handleCancelEditing}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300 text-sm">
                  Blank page
                </div>
              )}
            </div>
          </div>

          {/* Page Actions */}
          {selectedPageIndex !== null && (
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 mt-2 sm:mt-4">
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

          {/* Keyboard shortcuts hint - hidden on mobile */}
          <div className="hidden sm:block mt-4 text-xs text-gray-500">
            Ctrl+Enter = Add page | Ctrl+S = Save | Arrows = Navigate
          </div>
        </div>

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
              className={`fixed lg:relative ${isUIRTL ? 'left-0' : 'right-0'} top-0 lg:top-auto h-full z-50 lg:z-auto glass-strong ${isUIRTL ? 'border-r' : 'border-l'} border-white/10 overflow-hidden w-[85%] sm:w-80`}
            >
              <div className="p-4 sm:p-6 w-full sm:w-80 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    {language === 'he' ? 'הגדרות פריסה' : 'Layout Settings'}
                  </h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="lg:hidden btn-ghost p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Template Selection */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowTemplateGallery(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white font-medium transition-all"
                  >
                    <Layout className="w-5 h-5" />
                    {language === 'he' ? 'בחר תבנית' : 'Choose Template'}
                  </button>
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
                      onChange={(e) => {
                        setSettings({ ...settings, includeToc: e.target.checked });
                        if (book) generatePagesFromChapters(book);
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
                        setSettings({ ...settings, includeBackCover: e.target.checked });
                        if (book) generatePagesFromChapters(book);
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
                    <p className="text-xs text-magic-gold mt-1">
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
                <label className="flex flex-col items-center justify-center w-full h-28 sm:h-32 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-magic-gold transition">
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
}: PageRendererProps) {
  const { t } = useTranslation('common');
  const [_isDragging, setIsDragging] = useState(false);
  const [_isResizing, setIsResizing] = useState(false);
  const [showEditToolbar, setShowEditToolbar] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  void _isDragging; void _isResizing; // For future visual feedback

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
      className={`relative h-full ${isSelected ? 'ring-2 ring-magic-gold' : ''}`}
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
        // Editable mode
        <div className="relative h-full">
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            className="h-full overflow-auto book-page-content prose prose-sm max-w-none outline-none focus:ring-2 focus:ring-magic-gold/50 rounded"
            dangerouslySetInnerHTML={{ __html: editingContent }}
            style={{
              color: settings.textColor || '#000000',
              direction: isRTL ? 'rtl' : 'ltr',
              paddingTop: showHeader ? '15px' : '0',
              paddingBottom: settings.showPageNumbers ? '20px' : '0',
            }}
          />
          {/* Editing controls */}
          <div className="absolute bottom-2 right-2 flex gap-2 z-30">
            <button
              onClick={onCancelEditing}
              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded shadow"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              onClick={onFinishEditing}
              className="px-2 py-1 bg-magic-gold hover:bg-yellow-500 text-black text-xs rounded shadow font-medium"
            >
              {t('common.save', 'Save')}
            </button>
          </div>
        </div>
      ) : (
        // View mode with edit button for chapter pages
        <div className="relative h-full group">
          <div
            className="h-full overflow-hidden book-page-content prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
            style={{
              color: settings.textColor || '#000000',
              direction: isRTL ? 'rtl' : 'ltr',
              paddingTop: showHeader ? '15px' : '0',
              paddingBottom: settings.showPageNumbers ? '20px' : '0',
            }}
          />
          {/* Edit button for chapter pages */}
          {page.type === 'chapter' && (
            <button
              onClick={() => onStartEditing(pageIndex)}
              className="absolute top-2 right-2 p-1.5 bg-magic-gold/90 hover:bg-magic-gold text-black rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-30"
              title={t('book_layout.edit_content', 'Edit content')}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* AI-Generated Interior Images */}
      {page.type === 'chapter' && aiImagePlacements.length > 0 && (
        <div className="relative mb-4">
          {aiImagePlacements
            .filter(p => p.generatedImageUrl && p.position === 'chapter-start')
            .map((placement, idx) => (
              <div
                key={`ai-img-${idx}`}
                className="relative w-full mb-4 rounded-lg overflow-hidden shadow-md"
                style={{ maxHeight: '150px' }}
              >
                <img
                  src={placement.generatedImageUrl}
                  alt={placement.prompt || 'AI-generated illustration'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <span className="text-xs text-white/80 italic">
                    {placement.prompt ? placement.prompt.slice(0, 50) + '...' : 'AI illustration'}
                  </span>
                </div>
              </div>
            ))}
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

// Cover Preview Component
function CoverPreview({ book, coverImageUrl }: { book: BookData; coverImageUrl?: string | null }) {
  const coverDesign = book.coverDesign as any || {
    coverColor: '#1a1a2e',
    textColor: '#ffffff',
    fontFamily: 'Arial',
  };

  // Get image URL from multiple sources
  const imageUrl = coverImageUrl || coverDesign.imageUrl || coverDesign.front?.imageUrl;

  return (
    <div
      className="h-full flex flex-col items-center justify-center p-8 relative overflow-hidden"
      style={{
        background: imageUrl ? 'transparent' : (coverDesign.coverColor || coverDesign.front?.backgroundColor || '#1a1a2e'),
        color: coverDesign.textColor || coverDesign.front?.title?.color || '#ffffff',
        fontFamily: coverDesign.fontFamily || coverDesign.front?.title?.font || 'Arial',
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
      <h1 className="text-2xl font-bold text-center relative z-10 mb-4 text-white drop-shadow-lg">
        {book.title}
      </h1>
      <p className="text-lg relative z-10 text-white drop-shadow-lg">
        {book.author?.name}
      </p>
    </div>
  );
}
