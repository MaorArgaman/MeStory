import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import {
  ArrowLeft,
  Save,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  Type,
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
  Wand2,
  LayoutTemplate,
  BookOpenCheck,
  Check,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PageImage {
  id: string;
  url: string;
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage of page width
  height: number; // percentage of page height
  rotation: number;
}

// AI Design interfaces
interface TypographyDesign {
  titleFont: { family: string; size: number; weight: string; color: string };
  bodyFont: { family: string; size: number; weight: string; color: string; lineHeight: number };
  chapterTitleFont: { family: string; size: number; weight: string; color: string };
  headerFont: { family: string; size: number; weight: string; color: string };
}

interface PageLayoutDesign {
  margins: { top: number; bottom: number; inner: number; outer: number };
  pageNumbers: { position: 'bottom-center' | 'bottom-outside' | 'top-outside' | 'none'; startFrom: number };
  chapterStart: 'right' | 'any' | 'new-spread';
  lineSpacing: number;
  paragraphSpacing: number;
  firstLineIndent: number;
  dropCaps: boolean;
}

interface CoverDesign {
  frontCover: {
    background: { type: 'solid' | 'gradient' | 'image'; value: string; imageUrl?: string };
    titlePosition: { x: number; y: number; align: 'center' | 'left' | 'right' };
    authorPosition: { x: number; y: number; align: 'center' | 'left' | 'right' };
    decorativeElements: string[];
  };
  backCover: {
    background: { type: 'solid' | 'gradient' | 'blurred-front'; value: string };
    synopsisStyle: { maxWords: number; fontSize: number; lineHeight: number };
    authorBioPosition: 'bottom' | 'none';
    barcodePosition: { x: number; y: number };
  };
  spine: {
    background: string;
    titleOrientation: 'vertical-up' | 'vertical-down' | 'horizontal';
    includeAuthor: boolean;
  };
}

interface ImagePlacementSuggestion {
  chapterIndex: number;
  position: 'after-paragraph' | 'full-page' | 'half-page' | 'chapter-header';
  paragraphIndex?: number;
  suggestedPrompt: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
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

// Default page layout settings
const defaultSettings = {
  fontSize: 14,
  lineHeight: 1.6,
  fontFamily: 'David Libre',
  margins: { top: 60, bottom: 60, left: 50, right: 50 },
  showPageNumbers: true,
  includeToc: true,
  includeBackCover: true,
};

export default function BookLayoutPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
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
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');

  // AI Design state
  const [showAIDesignModal, setShowAIDesignModal] = useState(false);
  const [generatingDesign, setGeneratingDesign] = useState(false);
  const [aiDesign, setAiDesign] = useState<CompleteBookDesign | null>(null);
  const [aiDesignTab, setAiDesignTab] = useState<'typography' | 'layout' | 'cover' | 'images'>('typography');
  const [selectedDesignElements, setSelectedDesignElements] = useState({
    typography: true,
    layout: true,
    cover: true,
    images: true,
  });
  const [generatingCoverImage, setGeneratingCoverImage] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

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

  const loadBook = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/books/${bookId}`);
      if (response.data.success) {
        const bookData = response.data.data.book;
        setBook(bookData);

        // Load existing layout or generate new one
        if (bookData.pageLayout?.pages) {
          setPages(bookData.pageLayout.pages);
          setSettings({ ...defaultSettings, ...bookData.pageLayout.settings });
        } else {
          generatePagesFromChapters(bookData);
        }
      }
    } catch (error) {
      console.error('Failed to load book:', error);
      toast.error('שגיאה בטעינת הספר');
      navigate('/dashboard');
    } finally {
      setLoading(false);
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

    // Table of contents (if enabled)
    if (settings.includeToc && bookData.chapters.length > 1) {
      const tocContent = bookData.chapters
        .map((ch, i) => `<div class="toc-item"><span class="toc-title">${ch.title}</span><span class="toc-page">${i * 2 + 5}</span></div>`)
        .join('');
      newPages.push({
        id: `page-toc`,
        type: 'toc',
        content: `<h2 class="toc-header">${bookIsRTL ? 'תוכן העניינים' : 'Table of Contents'}</h2>${tocContent}`,
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

    // Chapter pages
    bookData.chapters.forEach((chapter, index) => {
      newPages.push({
        id: `page-chapter-${index}`,
        type: 'chapter',
        chapterIndex: index,
        content: `<h2 class="chapter-title">${chapter.title}</h2>${chapter.content}`,
        images: [],
      });
    });

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
      const response = await api.put(`/books/${bookId}`, {
        pageLayout: {
          pages,
          settings,
        },
      });

      if (response.data.success) {
        setLastSaved(new Date());
        if (!isAutoSave) {
          toast.success('העימוד נשמר בהצלחה!');
        }
      }
    } catch (error) {
      console.error('Failed to save layout:', error);
      if (!isAutoSave) {
        toast.error('שגיאה בשמירת העימוד');
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedPageIndex === null) return;

    if (!file.type.startsWith('image/')) {
      toast.error('יש לבחור קובץ תמונה');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('גודל התמונה חייב להיות עד 10MB');
      return;
    }

    try {
      toast.loading('מעלה תמונה...', { id: 'upload-image' });

      const formData = new FormData();
      formData.append('image', file);
      formData.append('pageIndex', String(selectedPageIndex));

      const response = await api.post(`/books/${bookId}/page-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        const newImage: PageImage = {
          id: `img-${Date.now()}`,
          url: response.data.data.imageUrl,
          x: 25,
          y: 25,
          width: 50,
          height: 40,
          rotation: 0,
        };

        const updatedPages = [...pages];
        updatedPages[selectedPageIndex].images.push(newImage);
        setPages(updatedPages);

        toast.success('התמונה הועלתה בהצלחה!', { id: 'upload-image' });
        setShowImageModal(false);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'שגיאה בהעלאת התמונה', { id: 'upload-image' });
    }
  };

  // Generate image with AI
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || selectedPageIndex === null) return;

    setGeneratingImage(true);
    try {
      toast.loading('יוצר תמונה עם AI...', { id: 'generate-image' });

      const response = await api.post('/ai/generate-image', {
        prompt: imagePrompt,
        bookId,
        style: book?.genre || 'general',
      });

      if (response.data.success) {
        const newImage: PageImage = {
          id: `img-${Date.now()}`,
          url: response.data.data.imageUrl,
          x: 25,
          y: 25,
          width: 50,
          height: 40,
          rotation: 0,
        };

        const updatedPages = [...pages];
        updatedPages[selectedPageIndex].images.push(newImage);
        setPages(updatedPages);

        toast.success('התמונה נוצרה בהצלחה!', { id: 'generate-image' });
        setShowImageModal(false);
        setImagePrompt('');
      }
    } catch (error: any) {
      console.error('Generate image error:', error);
      toast.error(error.response?.data?.error || 'שגיאה ביצירת התמונה', { id: 'generate-image' });
    } finally {
      setGeneratingImage(false);
    }
  };

  // Update image position/size
  const updateImagePosition = (pageIndex: number, imageId: string, updates: Partial<PageImage>) => {
    const updatedPages = [...pages];
    const imageIndex = updatedPages[pageIndex].images.findIndex(img => img.id === imageId);
    if (imageIndex !== -1) {
      updatedPages[pageIndex].images[imageIndex] = {
        ...updatedPages[pageIndex].images[imageIndex],
        ...updates,
      };
      setPages(updatedPages);
    }
  };

  // Delete image
  const deleteImage = (pageIndex: number, imageId: string) => {
    const updatedPages = [...pages];
    updatedPages[pageIndex].images = updatedPages[pageIndex].images.filter(img => img.id !== imageId);
    setPages(updatedPages);
    setSelectedImageId(null);
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
    toast.success('עמוד ריק נוסף');
  };

  // Remove page
  const removePage = (index: number) => {
    if (pages[index].type === 'blank') {
      const updatedPages = pages.filter((_, i) => i !== index);
      setPages(updatedPages);
      toast.success('העמוד הוסר');
    } else {
      toast.error('ניתן להסיר רק עמודים ריקים');
    }
  };

  // Toggle TOC
  const toggleToc = () => {
    const hasToc = pages.some(p => p.type === 'toc');
    if (hasToc) {
      setPages(pages.filter(p => p.type !== 'toc'));
      setSettings({ ...settings, includeToc: false });
      toast.success('תוכן העניינים הוסר');
    } else {
      if (book) {
        generatePagesFromChapters(book);
      }
      setSettings({ ...settings, includeToc: true });
      toast.success('תוכן העניינים נוסף');
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

  // Generate AI Design
  const generateAIDesign = async () => {
    if (!book) return;

    setGeneratingDesign(true);
    setAiDesign(null);
    setCoverImageUrl(null);

    try {
      toast.loading('מייצר עיצוב AI מלא...', { id: 'ai-design' });

      const response = await api.post(`/ai/design-book/${bookId}`);

      if (response.data.success) {
        setAiDesign(response.data.data.design);
        toast.success('העיצוב נוצר בהצלחה!', { id: 'ai-design' });
      }
    } catch (error: any) {
      console.error('AI Design error:', error);
      toast.error(error.response?.data?.error || 'שגיאה ביצירת העיצוב', { id: 'ai-design' });
    } finally {
      setGeneratingDesign(false);
    }
  };

  // Generate cover image from AI design
  const generateCoverImage = async () => {
    if (!book || !aiDesign) return;

    setGeneratingCoverImage(true);

    try {
      toast.loading('מייצר תמונת כריכה...', { id: 'cover-image' });

      const response = await api.post('/ai/generate-cover', {
        synopsis: book.synopsis || book.description || '',
        genre: book.genre,
        title: book.title,
      });

      if (response.data.success) {
        setCoverImageUrl(response.data.data.imageUrl);
        toast.success('תמונת הכריכה נוצרה בהצלחה!', { id: 'cover-image' });
      }
    } catch (error: any) {
      console.error('Cover image error:', error);
      toast.error(error.response?.data?.error || 'שגיאה ביצירת תמונת הכריכה', { id: 'cover-image' });
    } finally {
      setGeneratingCoverImage(false);
    }
  };

  // Apply selected AI design elements
  const applyAIDesign = async () => {
    if (!book || !aiDesign) return;

    setSaving(true);

    try {
      toast.loading('מחיל עיצוב...', { id: 'apply-design' });

      const response = await api.post(`/ai/apply-design/${bookId}`, {
        design: aiDesign,
        applyTypography: selectedDesignElements.typography,
        applyLayout: selectedDesignElements.layout,
        applyCover: selectedDesignElements.cover,
        applyImageSuggestions: selectedDesignElements.images,
      });

      if (response.data.success) {
        // Update local state with applied design
        if (selectedDesignElements.typography || selectedDesignElements.layout) {
          const newSettings = { ...settings };
          if (selectedDesignElements.typography) {
            newSettings.fontFamily = aiDesign.typography.bodyFont.family;
            newSettings.fontSize = aiDesign.typography.bodyFont.size;
            newSettings.lineHeight = aiDesign.typography.bodyFont.lineHeight;
          }
          if (selectedDesignElements.layout) {
            newSettings.margins = {
              top: aiDesign.layout.margins.top,
              bottom: aiDesign.layout.margins.bottom,
              left: aiDesign.layout.margins.inner,
              right: aiDesign.layout.margins.outer,
            };
          }
          setSettings(newSettings);
        }

        if (selectedDesignElements.cover && coverImageUrl) {
          // Update book cover
          setBook({
            ...book,
            coverDesign: {
              ...book.coverDesign,
              coverColor: aiDesign.cover.frontCover.background.value,
              textColor: aiDesign.typography.titleFont.color,
              fontFamily: aiDesign.typography.titleFont.family,
              imageUrl: coverImageUrl,
            },
          });
        }

        toast.success('העיצוב הוחל בהצלחה!', { id: 'apply-design' });
        setShowAIDesignModal(false);

        // Reload book to get updated data
        loadBook();
      }
    } catch (error: any) {
      console.error('Apply design error:', error);
      toast.error(error.response?.data?.error || 'שגיאה בהחלת העיצוב', { id: 'apply-design' });
    } finally {
      setSaving(false);
    }
  };

  // Generate contextual image for a specific placement suggestion
  const generateContextualImage = async (suggestion: ImagePlacementSuggestion) => {
    if (!book) return;

    try {
      toast.loading('מייצר תמונה...', { id: `img-${suggestion.chapterIndex}` });

      const response = await api.post('/ai/generate-contextual-image', {
        bookId,
        chapterIndex: suggestion.chapterIndex,
        customPrompt: suggestion.suggestedPrompt,
      });

      if (response.data.success) {
        toast.success('התמונה נוצרה בהצלחה!', { id: `img-${suggestion.chapterIndex}` });
        // The image URL can be used to add to a page
        return response.data.data.imageUrl;
      }
    } catch (error: any) {
      console.error('Contextual image error:', error);
      toast.error(error.response?.data?.error || 'שגיאה ביצירת התמונה', { id: `img-${suggestion.chapterIndex}` });
    }
    return null;
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
      <div className="glass-strong border-b border-white/10 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/editor/${bookId}`)}
              className="btn-ghost flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              חזרה לעורך
            </button>
            <div className="h-6 w-px bg-gray-700" />
            <h1 className="text-xl font-semibold text-white">{book.title}</h1>
            <span className="px-2 py-1 rounded bg-magic-gold/20 text-magic-gold text-xs font-medium">
              {isBookRTL ? 'עברית (RTL)' : 'English (LTR)'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-save indicator */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>שומר...</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>נשמר {lastSaved.toLocaleTimeString('he-IL')}</span>
                </>
              ) : null}
            </div>

            {/* AI Design Button */}
            <button
              onClick={() => {
                setShowAIDesignModal(true);
                if (!aiDesign) {
                  generateAIDesign();
                }
              }}
              className="btn-gold flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              עיצוב AI מלא
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`btn-ghost p-2 ${showSettings ? 'bg-white/10' : ''}`}
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Save Button */}
            <button
              onClick={() => saveLayout()}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              שמור עימוד
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Page Thumbnails */}
        <div className="w-48 glass-strong border-r border-white/10 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">עמודים</h3>
          <div className="space-y-2">
            {/* Cover */}
            <button
              onClick={() => setCurrentSpread(0)}
              className={`w-full aspect-[3/4] rounded-lg border-2 transition-all ${
                currentSpread === 0
                  ? 'border-magic-gold bg-magic-gold/20'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-center h-full text-xs text-gray-400">
                כריכה
              </div>
            </button>

            {/* Page pairs */}
            {Array.from({ length: Math.ceil(pages.length / 2) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSpread(i + 1)}
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
              className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
            >
              <List className="w-4 h-4" />
              {settings.includeToc ? 'הסר תוכן עניינים' : 'הוסף תוכן עניינים'}
            </button>
          </div>
        </div>

        {/* Center - Page Spread View */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
          {/* Navigation */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={isBookRTL ? goToNextSpread : goToPrevSpread}
              disabled={isBookRTL ? currentSpread >= totalSpreads - 1 : currentSpread === 0}
              className="btn-ghost p-2 disabled:opacity-30"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <span className="text-gray-400">
              {currentSpread === 0 ? 'כריכה' : `עמודים ${(currentSpread - 1) * 2 + 1}-${(currentSpread - 1) * 2 + 2}`}
            </span>
            <button
              onClick={isBookRTL ? goToPrevSpread : goToNextSpread}
              disabled={isBookRTL ? currentSpread === 0 : currentSpread >= totalSpreads - 1}
              className="btn-ghost p-2 disabled:opacity-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          {/* Book Spread */}
          <div
            className={`flex ${isBookRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 perspective-1000`}
            style={{ maxHeight: 'calc(100vh - 300px)' }}
          >
            {/* Left Page */}
            <div
              className={`relative bg-white rounded-lg shadow-2xl overflow-hidden ${
                currentSpread === 0 ? 'opacity-30' : ''
              }`}
              style={{
                width: '350px',
                height: '500px',
                direction: isBookRTL ? 'rtl' : 'ltr',
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
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300 text-sm">
                  {currentSpread === 0 ? '' : 'עמוד ריק'}
                </div>
              )}
            </div>

            {/* Spine */}
            <div className="w-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded shadow-inner" />

            {/* Right Page */}
            <div
              className="relative bg-white rounded-lg shadow-2xl overflow-hidden"
              style={{
                width: '350px',
                height: '500px',
                direction: isBookRTL ? 'rtl' : 'ltr',
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
                <CoverPreview book={book} />
              ) : spreadPages.right ? (
                <PageRenderer
                  page={spreadPages.right}
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
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300 text-sm">
                  עמוד ריק
                </div>
              )}
            </div>
          </div>

          {/* Page Actions */}
          {selectedPageIndex !== null && (
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => {
                  setShowImageModal(true);
                }}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                הוסף תמונה
              </button>
              <button
                onClick={() => addBlankPage(selectedPageIndex)}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                הוסף עמוד ריק
              </button>
              {pages[selectedPageIndex]?.type === 'blank' && (
                <button
                  onClick={() => removePage(selectedPageIndex)}
                  className="btn-secondary text-sm flex items-center gap-2 text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  הסר עמוד
                </button>
              )}
            </div>
          )}

          {/* Keyboard shortcuts hint */}
          <div className="mt-4 text-xs text-gray-500">
            Ctrl+Enter = הוסף עמוד | Ctrl+S = שמור | חיצים = ניווט
          </div>
        </div>

        {/* Right Sidebar - Settings */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="glass-strong border-l border-white/10 overflow-hidden"
            >
              <div className="p-6 w-80">
                <h3 className="text-lg font-semibold text-white mb-6">הגדרות עימוד</h3>

                {/* Font Size */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-300 mb-2">גודל גופן</label>
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
                  <label className="block text-sm text-gray-300 mb-2">גובה שורה</label>
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
                  <label className="block text-sm text-gray-300 mb-2">גופן</label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                    className="input w-full"
                  >
                    <option value="David Libre">David Libre</option>
                    <option value="Heebo">Heebo</option>
                    <option value="Rubik">Rubik</option>
                    <option value="Frank Ruhl Libre">Frank Ruhl Libre</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times New Roman</option>
                  </select>
                </div>

                {/* Margins */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-300 mb-2">שוליים</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400">עליון</label>
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
                      <label className="text-xs text-gray-400">תחתון</label>
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
                      <label className="text-xs text-gray-400">שמאל</label>
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
                      <label className="text-xs text-gray-400">ימין</label>
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
                    <span className="text-sm text-gray-300">הצג מספרי עמודים</span>
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
                    <span className="text-sm text-gray-300">כלול תוכן עניינים</span>
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
                    <span className="text-sm text-gray-300">כלול עמוד אחורי עם תקציר</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSaveEnabled}
                      onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-white/10"
                    />
                    <span className="text-sm text-gray-300">שמירה אוטומטית</span>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-strong rounded-2xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">הוסף תמונה</h2>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="btn-ghost p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Upload Option */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">העלה תמונה</h3>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-magic-gold transition">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-400">לחץ להעלאת תמונה</span>
                  <span className="text-xs text-gray-500">PNG, JPG עד 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-deep-space text-gray-400 text-sm">או</span>
                </div>
              </div>

              {/* AI Generation Option */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">צור תמונה עם AI</h3>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="תאר את התמונה שברצונך ליצור..."
                  className="input w-full h-24 resize-none mb-3"
                  dir="rtl"
                />
                <button
                  onClick={handleGenerateImage}
                  disabled={generatingImage || !imagePrompt.trim()}
                  className="btn-gold w-full flex items-center justify-center gap-2"
                >
                  {generatingImage ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      יוצר...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      צור תמונה
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Design Modal */}
      <AnimatePresence>
        {showAIDesignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAIDesignModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-strong rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-magic-gold/20 rounded-lg">
                    <Wand2 className="w-6 h-6 text-magic-gold" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">עיצוב AI מלא</h2>
                    <p className="text-sm text-gray-400">עיצוב אוטומטי של טיפוגרפיה, פריסה וכריכה</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIDesignModal(false)}
                  className="btn-ghost p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Loading State */}
              {generatingDesign && (
                <div className="flex-1 flex flex-col items-center justify-center p-12">
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-magic-gold/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-magic-gold border-t-transparent animate-spin" />
                    <Wand2 className="absolute inset-0 m-auto w-10 h-10 text-magic-gold animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">מייצר עיצוב מותאם אישית...</h3>
                  <p className="text-sm text-gray-400 text-center max-w-md">
                    הבינה המלאכותית מנתחת את הספר שלך ויוצרת עיצוב מקצועי הכולל טיפוגרפיה, פריסת עמודים, כריכה והמלצות לתמונות
                  </p>
                </div>
              )}

              {/* Design Preview */}
              {!generatingDesign && aiDesign && (
                <>
                  {/* Tabs */}
                  <div className="flex border-b border-white/10">
                    {[
                      { id: 'typography', label: 'טיפוגרפיה', icon: Type },
                      { id: 'layout', label: 'פריסה', icon: LayoutTemplate },
                      { id: 'cover', label: 'כריכה', icon: BookOpenCheck },
                      { id: 'images', label: 'תמונות', icon: ImageIcon },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setAiDesignTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all ${
                          aiDesignTab === tab.id
                            ? 'text-magic-gold border-b-2 border-magic-gold bg-magic-gold/10'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        <label className="flex items-center ml-2">
                          <input
                            type="checkbox"
                            checked={selectedDesignElements[tab.id as keyof typeof selectedDesignElements]}
                            onChange={(e) => setSelectedDesignElements({
                              ...selectedDesignElements,
                              [tab.id]: e.target.checked,
                            })}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-gray-600 bg-white/10"
                          />
                        </label>
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {/* Typography Tab */}
                    {aiDesignTab === 'typography' && (
                      <div className="space-y-6">
                        <div className="bg-white/5 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">סגנון כללי</h3>
                          <p className="text-gray-300">{aiDesign.overallStyle}</p>
                          <p className="text-sm text-gray-400 mt-2">{aiDesign.moodDescription}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="bg-white/5 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3">גופן כותרת</h4>
                            <div
                              className="p-4 bg-white rounded-lg mb-3"
                              style={{
                                fontFamily: aiDesign.typography.titleFont.family,
                                fontSize: `${Math.min(aiDesign.typography.titleFont.size, 32)}px`,
                                fontWeight: aiDesign.typography.titleFont.weight,
                                color: aiDesign.typography.titleFont.color,
                              }}
                            >
                              {book?.title || 'כותרת הספר'}
                            </div>
                            <div className="text-xs text-gray-400 space-y-1">
                              <p>משפחה: {aiDesign.typography.titleFont.family}</p>
                              <p>גודל: {aiDesign.typography.titleFont.size}px</p>
                              <p>משקל: {aiDesign.typography.titleFont.weight}</p>
                            </div>
                          </div>

                          <div className="bg-white/5 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3">גופן גוף הטקסט</h4>
                            <div
                              className="p-4 bg-white rounded-lg mb-3"
                              style={{
                                fontFamily: aiDesign.typography.bodyFont.family,
                                fontSize: `${aiDesign.typography.bodyFont.size}px`,
                                fontWeight: aiDesign.typography.bodyFont.weight,
                                color: aiDesign.typography.bodyFont.color,
                                lineHeight: aiDesign.typography.bodyFont.lineHeight,
                              }}
                            >
                              {isBookRTL
                                ? 'זהו טקסט לדוגמה שמדגים את הגופן של גוף הטקסט בספר. הגופן נבחר בקפידה כדי להתאים לז׳אנר ולאווירה של הספר.'
                                : 'This is sample text demonstrating the body font selected for the book. The font was carefully chosen to match the genre and mood.'}
                            </div>
                            <div className="text-xs text-gray-400 space-y-1">
                              <p>משפחה: {aiDesign.typography.bodyFont.family}</p>
                              <p>גודל: {aiDesign.typography.bodyFont.size}px</p>
                              <p>גובה שורה: {aiDesign.typography.bodyFont.lineHeight}</p>
                            </div>
                          </div>

                          <div className="bg-white/5 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3">גופן כותרת פרק</h4>
                            <div
                              className="p-4 bg-white rounded-lg mb-3"
                              style={{
                                fontFamily: aiDesign.typography.chapterTitleFont.family,
                                fontSize: `${Math.min(aiDesign.typography.chapterTitleFont.size, 24)}px`,
                                fontWeight: aiDesign.typography.chapterTitleFont.weight,
                                color: aiDesign.typography.chapterTitleFont.color,
                              }}
                            >
                              {isBookRTL ? 'פרק ראשון' : 'Chapter One'}
                            </div>
                            <div className="text-xs text-gray-400 space-y-1">
                              <p>משפחה: {aiDesign.typography.chapterTitleFont.family}</p>
                              <p>גודל: {aiDesign.typography.chapterTitleFont.size}px</p>
                            </div>
                          </div>

                          <div className="bg-white/5 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3">גופן כותרות משנה</h4>
                            <div
                              className="p-4 bg-white rounded-lg mb-3"
                              style={{
                                fontFamily: aiDesign.typography.headerFont.family,
                                fontSize: `${Math.min(aiDesign.typography.headerFont.size, 20)}px`,
                                fontWeight: aiDesign.typography.headerFont.weight,
                                color: aiDesign.typography.headerFont.color,
                              }}
                            >
                              {isBookRTL ? 'כותרת משנה' : 'Subheading'}
                            </div>
                            <div className="text-xs text-gray-400 space-y-1">
                              <p>משפחה: {aiDesign.typography.headerFont.family}</p>
                              <p>גודל: {aiDesign.typography.headerFont.size}px</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Layout Tab */}
                    {aiDesignTab === 'layout' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="bg-white/5 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-gray-400 mb-4">שוליים</h4>
                            <div className="relative bg-white rounded-lg aspect-[3/4] max-w-[200px] mx-auto">
                              <div
                                className="absolute bg-gray-200 rounded"
                                style={{
                                  top: `${aiDesign.layout.margins.top / 2}px`,
                                  bottom: `${aiDesign.layout.margins.bottom / 2}px`,
                                  left: `${aiDesign.layout.margins.inner / 2}px`,
                                  right: `${aiDesign.layout.margins.outer / 2}px`,
                                }}
                              >
                                <div className="absolute inset-2 flex items-center justify-center text-xs text-gray-500">
                                  אזור תוכן
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 text-xs text-gray-400 space-y-1 text-center">
                              <p>עליון: {aiDesign.layout.margins.top}px | תחתון: {aiDesign.layout.margins.bottom}px</p>
                              <p>פנימי: {aiDesign.layout.margins.inner}px | חיצוני: {aiDesign.layout.margins.outer}px</p>
                            </div>
                          </div>

                          <div className="bg-white/5 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-gray-400 mb-4">הגדרות נוספות</h4>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">מספרי עמודים</span>
                                <span className="text-sm text-white">{
                                  aiDesign.layout.pageNumbers.position === 'bottom-center' ? 'מרכז תחתון' :
                                  aiDesign.layout.pageNumbers.position === 'bottom-outside' ? 'חיצוני תחתון' :
                                  aiDesign.layout.pageNumbers.position === 'top-outside' ? 'חיצוני עליון' : 'ללא'
                                }</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">התחלת פרק</span>
                                <span className="text-sm text-white">{
                                  aiDesign.layout.chapterStart === 'right' ? 'עמוד ימני' :
                                  aiDesign.layout.chapterStart === 'any' ? 'כל עמוד' : 'פריסה חדשה'
                                }</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">ריווח שורות</span>
                                <span className="text-sm text-white">{aiDesign.layout.lineSpacing}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">ריווח פסקאות</span>
                                <span className="text-sm text-white">{aiDesign.layout.paragraphSpacing}px</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">הזחת שורה ראשונה</span>
                                <span className="text-sm text-white">{aiDesign.layout.firstLineIndent}px</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">אות פתיחה מעוצבת</span>
                                <span className="text-sm text-white">{aiDesign.layout.dropCaps ? 'כן' : 'לא'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cover Tab */}
                    {aiDesignTab === 'cover' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-6">
                          {/* Front Cover */}
                          <div className="bg-white/5 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3">כריכה קדמית</h4>
                            <div
                              className="aspect-[2/3] rounded-lg relative overflow-hidden flex flex-col items-center justify-center"
                              style={{
                                background: aiDesign.cover.frontCover.background.type === 'gradient'
                                  ? aiDesign.cover.frontCover.background.value
                                  : aiDesign.cover.frontCover.background.value,
                              }}
                            >
                              {coverImageUrl && (
                                <img
                                  src={coverImageUrl}
                                  alt="Cover"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              <div className="relative z-10 p-4 text-center">
                                <h3
                                  className="font-bold mb-2 drop-shadow-lg"
                                  style={{
                                    fontFamily: aiDesign.typography.titleFont.family,
                                    color: aiDesign.typography.titleFont.color,
                                    fontSize: '18px',
                                  }}
                                >
                                  {book?.title}
                                </h3>
                                <p
                                  className="drop-shadow-lg"
                                  style={{
                                    fontFamily: aiDesign.typography.bodyFont.family,
                                    color: aiDesign.typography.titleFont.color,
                                    fontSize: '12px',
                                  }}
                                >
                                  {book?.author?.name}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={generateCoverImage}
                              disabled={generatingCoverImage}
                              className="w-full mt-3 btn-secondary text-sm flex items-center justify-center gap-2"
                            >
                              {generatingCoverImage ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  מייצר...
                                </>
                              ) : coverImageUrl ? (
                                <>
                                  <RefreshCw className="w-4 h-4" />
                                  צור תמונה חדשה
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4" />
                                  צור תמונת כריכה
                                </>
                              )}
                            </button>
                          </div>

                          {/* Spine */}
                          <div className="bg-white/5 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3">שדרה</h4>
                            <div
                              className="w-12 mx-auto aspect-[1/6] rounded flex items-center justify-center"
                              style={{ background: aiDesign.cover.spine.background }}
                            >
                              <span
                                className="transform -rotate-90 whitespace-nowrap text-xs font-medium"
                                style={{
                                  fontFamily: aiDesign.typography.titleFont.family,
                                  color: aiDesign.typography.titleFont.color,
                                }}
                              >
                                {book?.title}
                              </span>
                            </div>
                            <div className="mt-3 text-xs text-gray-400 text-center">
                              <p>כיוון: {aiDesign.cover.spine.titleOrientation === 'vertical-up' ? 'למעלה' : 'למטה'}</p>
                              <p>כולל מחבר: {aiDesign.cover.spine.includeAuthor ? 'כן' : 'לא'}</p>
                            </div>
                          </div>

                          {/* Back Cover */}
                          <div className="bg-white/5 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3">כריכה אחורית</h4>
                            <div
                              className="aspect-[2/3] rounded-lg relative overflow-hidden flex flex-col p-4"
                              style={{
                                background: aiDesign.cover.backCover.background.type === 'blurred-front' && coverImageUrl
                                  ? `url(${coverImageUrl})`
                                  : aiDesign.cover.backCover.background.value,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }}
                            >
                              {aiDesign.cover.backCover.background.type === 'blurred-front' && coverImageUrl && (
                                <div className="absolute inset-0 backdrop-blur-md bg-black/40" />
                              )}
                              <div className="relative z-10 flex-1 flex flex-col">
                                <p
                                  className="text-xs leading-relaxed flex-1 overflow-hidden"
                                  style={{
                                    fontFamily: aiDesign.typography.bodyFont.family,
                                    color: '#ffffff',
                                  }}
                                >
                                  {(book?.synopsis || book?.description || '').slice(0, 200)}...
                                </p>
                                <div className="mt-auto pt-4 border-t border-white/20">
                                  <p className="text-xs text-white/80">{book?.author?.name}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Images Tab */}
                    {aiDesignTab === 'images' && (
                      <div className="space-y-4">
                        <div className="bg-white/5 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-gray-400 mb-2">המלצות למיקום תמונות</h4>
                          <p className="text-xs text-gray-500">הבינה המלאכותית מצאה מיקומים מומלצים להוספת תמונות בספר</p>
                        </div>

                        {aiDesign.imagePlacements.length === 0 ? (
                          <div className="text-center py-12 text-gray-400">
                            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>לא נמצאו המלצות למיקום תמונות</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {aiDesign.imagePlacements.map((suggestion, index) => (
                              <div
                                key={index}
                                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-magic-gold/50 transition"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        suggestion.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                        suggestion.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-blue-500/20 text-blue-400'
                                      }`}>
                                        {suggestion.priority === 'high' ? 'עדיפות גבוהה' :
                                         suggestion.priority === 'medium' ? 'עדיפות בינונית' : 'עדיפות נמוכה'}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        פרק {suggestion.chapterIndex + 1}
                                        {book?.chapters[suggestion.chapterIndex]?.title && ` - ${book.chapters[suggestion.chapterIndex].title}`}
                                      </span>
                                    </div>
                                    <p className="text-sm text-white">{suggestion.rationale}</p>
                                  </div>
                                  <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {suggestion.position === 'full-page' ? 'עמוד מלא' :
                                     suggestion.position === 'half-page' ? 'חצי עמוד' :
                                     suggestion.position === 'chapter-header' ? 'כותרת פרק' : 'אחרי פסקה'}
                                  </span>
                                </div>
                                <div className="bg-black/30 rounded-lg p-3 mb-3">
                                  <p className="text-xs text-gray-300 italic">"{suggestion.suggestedPrompt}"</p>
                                </div>
                                <button
                                  onClick={async () => {
                                    const imageUrl = await generateContextualImage(suggestion);
                                    if (imageUrl) {
                                      // Find the page for this chapter
                                      const pageIndex = pages.findIndex(
                                        p => p.type === 'chapter' && p.chapterIndex === suggestion.chapterIndex
                                      );
                                      if (pageIndex !== -1) {
                                        const newImage: PageImage = {
                                          id: `img-${Date.now()}`,
                                          url: imageUrl,
                                          x: 10,
                                          y: suggestion.position === 'chapter-header' ? 10 : 50,
                                          width: suggestion.position === 'full-page' ? 80 : 40,
                                          height: suggestion.position === 'full-page' ? 60 : 30,
                                          rotation: 0,
                                        };
                                        const updatedPages = [...pages];
                                        updatedPages[pageIndex].images.push(newImage);
                                        setPages(updatedPages);
                                      }
                                    }
                                  }}
                                  className="btn-secondary text-sm flex items-center gap-2"
                                >
                                  <Sparkles className="w-4 h-4" />
                                  צור והוסף תמונה
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-between p-6 border-t border-white/10 bg-white/5">
                    <button
                      onClick={generateAIDesign}
                      disabled={generatingDesign}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      צור עיצוב חדש
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowAIDesignModal(false)}
                        className="btn-ghost"
                      >
                        ביטול
                      </button>
                      <button
                        onClick={applyAIDesign}
                        disabled={saving || !Object.values(selectedDesignElements).some(v => v)}
                        className="btn-gold flex items-center gap-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            מחיל...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            החל עיצוב נבחר
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Empty State */}
              {!generatingDesign && !aiDesign && (
                <div className="flex-1 flex flex-col items-center justify-center p-12">
                  <Wand2 className="w-16 h-16 text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">לא נוצר עיצוב עדיין</h3>
                  <p className="text-sm text-gray-400 text-center mb-6">
                    לחץ על הכפתור למטה כדי ליצור עיצוב מותאם אישית לספר שלך
                  </p>
                  <button
                    onClick={generateAIDesign}
                    className="btn-gold flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    צור עיצוב AI
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Page Renderer Component
interface PageRendererProps {
  page: PageContent;
  settings: typeof defaultSettings;
  isRTL: boolean;
  isSelected: boolean;
  onImageSelect: (id: string | null) => void;
  selectedImageId: string | null;
  onImageUpdate: (imageId: string, updates: Partial<PageImage>) => void;
  onImageDelete: (imageId: string) => void;
}

function PageRenderer({
  page,
  settings,
  isRTL,
  isSelected,
  onImageSelect,
  selectedImageId,
  onImageUpdate,
  onImageDelete,
}: PageRendererProps) {
  const [_isDragging, setIsDragging] = useState(false);
  const [_isResizing, setIsResizing] = useState(false);
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

  return (
    <div
      ref={containerRef}
      className={`relative h-full ${isSelected ? 'ring-2 ring-magic-gold' : ''}`}
      style={{
        padding: `${settings.margins.top}px ${settings.margins.right}px ${settings.margins.bottom}px ${settings.margins.left}px`,
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
        direction: isRTL ? 'rtl' : 'ltr',
        textAlign: isRTL ? 'right' : 'left',
      }}
    >
      {/* Page Content */}
      <div
        className="h-full overflow-hidden text-gray-900 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: page.content }}
        style={{
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      />

      {/* Images */}
      {page.images.map((image) => (
        <div
          key={image.id}
          className={`absolute cursor-move ${
            selectedImageId === image.id ? 'ring-2 ring-blue-500' : ''
          }`}
          style={{
            left: `${image.x}%`,
            top: `${image.y}%`,
            width: `${image.width}%`,
            height: `${image.height}%`,
            transform: `rotate(${image.rotation}deg)`,
          }}
          onMouseDown={(e) => handleImageMouseDown(e, image, 'drag')}
        >
          <img
            src={image.url}
            alt=""
            className="w-full h-full object-cover rounded"
            draggable={false}
          />

          {/* Resize handle */}
          {selectedImageId === image.id && (
            <>
              <div
                className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize rounded-tl"
                onMouseDown={(e) => handleImageMouseDown(e, image, 'resize')}
              />
              <button
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  onImageDelete(image.id);
                }}
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </>
          )}
        </div>
      ))}

      {/* Page type indicator */}
      {page.type === 'blank' && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">
          עמוד ריק
        </div>
      )}
    </div>
  );
}

// Cover Preview Component
function CoverPreview({ book }: { book: BookData }) {
  const coverDesign = book.coverDesign || {
    coverColor: '#1a1a2e',
    textColor: '#ffffff',
    fontFamily: 'Arial',
  };

  return (
    <div
      className="h-full flex flex-col items-center justify-center p-8"
      style={{
        background: coverDesign.coverColor,
        color: coverDesign.textColor,
        fontFamily: coverDesign.fontFamily,
      }}
    >
      {coverDesign.imageUrl && (
        <img
          src={coverDesign.imageUrl}
          alt="Cover"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
      )}
      <h1 className="text-2xl font-bold text-center relative z-10 mb-4">
        {book.title}
      </h1>
      <p className="text-lg relative z-10">
        {book.author?.name}
      </p>
    </div>
  );
}
