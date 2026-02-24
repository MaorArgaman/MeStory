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
  Layout,
  Palette,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TemplateGallery from '../components/design/TemplateGallery';
import { BookTemplate, textColorPresets, availableFonts } from '../data/bookTemplates';
import { applyTemplate, loadGoogleFonts, PageLayoutSettings } from '../services/templateService';
import {
  loadDesignFonts,
} from '../services/designApplicationService';
import type { AICompleteDesign } from '../types/templates';

interface PageImage {
  id: string;
  url: string;
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage of page width
  height: number; // percentage of page height
  rotation: number;
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
  textColor: '#000000',
  templateId: undefined as string | undefined,
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
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
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

  // Mobile UI state
  const [showMobilePages, setShowMobilePages] = useState(false);

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
          // Ensure each page has an images array (for backwards compatibility)
          const pagesWithImages = bookData.pageLayout.pages.map((page: any) => ({
            ...page,
            images: page.images || [],
          }));
          setPages(pagesWithImages);
          setSettings({ ...defaultSettings, ...bookData.pageLayout.settings });
        } else {
          generatePagesFromChapters(bookData);
        }

        // Apply AI design if available
        if (bookData.aiDesignState?.status === 'completed' && bookData.aiDesignState?.design) {
          await applyStoredAIDesign(bookData.aiDesignState.design);
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

    // Table of contents (if enabled)
    if (settings.includeToc && bookData.chapters.length > 1) {
      const tocContent = bookData.chapters
        .map((ch, i) => `<div class="toc-item"><span class="toc-title">${ch.title}</span><span class="toc-page">${i * 2 + 5}</span></div>`)
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
        const response = await api.put(`/books/${bookId}`, {
          pageLayout: {
            pages,
            settings: newSettings,
          },
        });

        if (response.data.success) {
          setLastSaved(new Date());
          toast.success(`תבנית "${template.name}" הוחלה ונשמרה בהצלחה!`);
        }
      } catch (error) {
        console.error('Failed to save template:', error);
        toast.error('התבנית הוחלה אך השמירה נכשלה');
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
      toast.loading('Uploading image...', { id: 'upload-image' });

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
        // Ensure images array exists
        if (!updatedPages[selectedPageIndex].images) {
          updatedPages[selectedPageIndex].images = [];
        }
        updatedPages[selectedPageIndex].images.push(newImage);
        setPages(updatedPages);

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
        // Ensure images array exists
        if (!updatedPages[selectedPageIndex].images) {
          updatedPages[selectedPageIndex].images = [];
        }
        updatedPages[selectedPageIndex].images.push(newImage);
        setPages(updatedPages);

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

  // Generate AI Design
  const generateAIDesign = async () => {
    if (!book) return;

    setGeneratingDesign(true);
    setAiDesign(null);
    setCoverImageUrl(null);

    try {
      toast.loading('Generating complete AI design...', { id: 'ai-design' });

      const response = await api.post(`/ai/design-book/${bookId}`);

      if (response.data.success) {
        setAiDesign(response.data.data.design);
        toast.success('Design generated successfully!', { id: 'ai-design' });
      }
    } catch (error: any) {
      console.error('AI Design error:', error);
      toast.error(error.response?.data?.error || 'Error generating design', { id: 'ai-design' });
    } finally {
      setGeneratingDesign(false);
    }
  };

  // Generate cover image from AI design
  const generateCoverImage = async () => {
    if (!book || !aiDesign) return;

    setGeneratingCoverImage(true);

    try {
      toast.loading('Generating cover image...', { id: 'cover-image' });

      const response = await api.post('/ai/generate-cover', {
        synopsis: book.synopsis || book.description || '',
        genre: book.genre,
        title: book.title,
      });

      if (response.data.success) {
        setCoverImageUrl(response.data.data.imageUrl);
        toast.success('Cover image generated successfully!', { id: 'cover-image' });
      }
    } catch (error: any) {
      console.error('Cover image error:', error);
      toast.error(error.response?.data?.error || 'Error generating cover image', { id: 'cover-image' });
    } finally {
      setGeneratingCoverImage(false);
    }
  };

  // Apply selected AI design elements
  const applyAIDesign = async () => {
    if (!book || !aiDesign) return;

    setSaving(true);

    try {
      toast.loading('Applying design...', { id: 'apply-design' });

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
            newSettings.fontFamily = aiDesign.typography.bodyFont;
            newSettings.fontSize = aiDesign.typography.fontSize;
            newSettings.lineHeight = aiDesign.typography.lineHeight;
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
              coverColor: aiDesign.cover.front.colorPalette?.[0] || '#1a1a2e',
              textColor: aiDesign.typography.colors.heading,
              fontFamily: aiDesign.typography.titleFont,
              imageUrl: coverImageUrl,
            },
          });
        }

        toast.success('Design applied successfully!', { id: 'apply-design' });
        setShowAIDesignModal(false);

        // Reload book to get updated data
        loadBook();
      }
    } catch (error: any) {
      console.error('Apply design error:', error);
      toast.error(error.response?.data?.error || 'Error applying design', { id: 'apply-design' });
    } finally {
      setSaving(false);
    }
  };

  // Generate contextual image for a specific placement suggestion
  const generateContextualImage = async (suggestion: ImagePlacementSuggestion) => {
    if (!book) return;

    try {
      toast.loading('Generating image...', { id: `img-${suggestion.chapterIndex}` });

      const response = await api.post('/ai/generate-contextual-image', {
        bookId,
        chapterIndex: suggestion.chapterIndex,
        customPrompt: suggestion.suggestedPrompt,
      });

      if (response.data.success) {
        toast.success('Image generated successfully!', { id: `img-${suggestion.chapterIndex}` });
        // The image URL can be used to add to a page
        return response.data.data.imageUrl;
      }
    } catch (error: any) {
      console.error('Contextual image error:', error);
      toast.error(error.response?.data?.error || 'Error generating image', { id: `img-${suggestion.chapterIndex}` });
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
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Back to Editor</span>
            </button>
            <div className="hidden sm:block h-6 w-px bg-gray-700" />
            <h1 className="hidden md:block text-lg sm:text-xl font-semibold text-white truncate max-w-[200px]">{book.title}</h1>
            <span className="hidden lg:inline px-2 py-1 rounded bg-magic-gold/20 text-magic-gold text-xs font-medium">
              {isBookRTL ? 'Hebrew (RTL)' : 'English (LTR)'}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            {/* Auto-save indicator - hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="hidden lg:inline">Saved {lastSaved.toLocaleTimeString('en-US')}</span>
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
              className="btn-gold flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
            >
              <Wand2 className="w-4 h-4" />
              <span className="hidden sm:inline">AI Design</span>
            </button>

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
              <span className="hidden sm:inline">Save</span>
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

        {/* Left Sidebar - Page Thumbnails */}
        <div className={`
          ${showMobilePages ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          fixed lg:relative z-50 lg:z-auto
          w-[200px] sm:w-48 h-full
          glass-strong border-r border-white/10 p-3 sm:p-4 overflow-y-auto
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
              <span className="truncate">{settings.includeToc ? 'Remove TOC' : 'Add TOC'}</span>
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
              {currentSpread === 0 ? 'Cover' : `${(currentSpread - 1) * 2 + 1}-${(currentSpread - 1) * 2 + 2}`}
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
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300 text-sm">
                  {currentSpread === 0 ? '' : 'Blank page'}
                </div>
              )}
            </div>

            {/* Spine */}
            <div className="w-2 sm:w-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded shadow-inner" />

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

        {/* Right Sidebar - Settings */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed lg:relative right-0 top-0 lg:top-auto h-full z-50 lg:z-auto glass-strong border-l border-white/10 overflow-hidden w-[85%] sm:w-80"
            >
              <div className="p-4 sm:p-6 w-full sm:w-80 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Layout Settings</h3>
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
                    Choose Template
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
                  <label className="block text-sm text-gray-300 mb-2">Font Size</label>
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
                  <label className="block text-sm text-gray-300 mb-2">Line Height</label>
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
                  <label className="block text-sm text-gray-300 mb-2">Font</label>
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
                    Text Color
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
                    <span className="text-xs text-gray-400">Custom color</span>
                  </div>
                </div>

                {/* Margins */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-300 mb-2">Margins</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400">Top</label>
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
                      <label className="text-xs text-gray-400">Bottom</label>
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
                      <label className="text-xs text-gray-400">Left</label>
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
                      <label className="text-xs text-gray-400">Right</label>
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
                    <span className="text-sm text-gray-300">Show page numbers</span>
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
                    <span className="text-sm text-gray-300">Include Table of Contents</span>
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
                    <span className="text-sm text-gray-300">Include back cover with summary</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSaveEnabled}
                      onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-white/10"
                    />
                    <span className="text-sm text-gray-300">Auto-save</span>
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
                <h2 className="text-lg sm:text-xl font-bold text-white">Add Image</h2>
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

      {/* AI Design Modal */}
      <AnimatePresence>
        {showAIDesignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAIDesignModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-strong rounded-xl sm:rounded-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-3 sm:p-6 border-b border-white/10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-magic-gold/20 rounded-lg">
                    <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 text-magic-gold" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-xl font-bold text-white">AI Design</h2>
                    <p className="hidden sm:block text-sm text-gray-400">Automatic design of typography, layout and cover</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIDesignModal(false)}
                  className="btn-ghost p-1.5 sm:p-2"
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
                  <h3 className="text-lg font-semibold text-white mb-2">Generating custom design...</h3>
                  <p className="text-sm text-gray-400 text-center max-w-md">
                    AI is analyzing your book and creating a professional design including typography, page layout, cover and image recommendations
                  </p>
                </div>
              )}

              {/* Design Preview */}
              {!generatingDesign && aiDesign && (
                <>
                  {/* Tabs */}
                  <div className="flex border-b border-white/10 overflow-x-auto scrollbar-hide">
                    {[
                      { id: 'typography', label: 'Typography', shortLabel: 'Type', icon: Type },
                      { id: 'layout', label: 'Layout', shortLabel: 'Layout', icon: LayoutTemplate },
                      { id: 'cover', label: 'Cover', shortLabel: 'Cover', icon: BookOpenCheck },
                      { id: 'images', label: 'Images', shortLabel: 'Images', icon: ImageIcon },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setAiDesignTab(tab.id as any)}
                        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                          aiDesignTab === tab.id
                            ? 'text-magic-gold border-b-2 border-magic-gold bg-magic-gold/10'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.shortLabel}</span>
                        <label className="flex items-center ml-1 sm:ml-2">
                          <input
                            type="checkbox"
                            checked={selectedDesignElements[tab.id as keyof typeof selectedDesignElements]}
                            onChange={(e) => setSelectedDesignElements({
                              ...selectedDesignElements,
                              [tab.id]: e.target.checked,
                            })}
                            onClick={(e) => e.stopPropagation()}
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded border-gray-600 bg-white/10"
                          />
                        </label>
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                    {/* Typography Tab */}
                    {aiDesignTab === 'typography' && (
                      <div className="space-y-4 sm:space-y-6">
                        <div className="bg-white/5 rounded-xl p-4 sm:p-6">
                          <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-4">Overall Style</h3>
                          <p className="text-sm sm:text-base text-gray-300">{aiDesign.overallStyle}</p>
                          <p className="text-xs sm:text-sm text-gray-400 mt-2">{aiDesign.moodDescription}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <div className="bg-white/5 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3">Title Font</h4>
                            <div
                              className="p-4 bg-white rounded-lg mb-3"
                              style={{
                                fontFamily: aiDesign.typography.titleFont,
                                fontSize: '28px',
                                fontWeight: 'bold',
                                color: aiDesign.typography.colors.heading,
                              }}
                            >
                              {book?.title || 'Book Title'}
                            </div>
                            <div className="text-xs text-gray-400 space-y-1">
                              <p>Family: {aiDesign.typography.titleFont}</p>
                              <p>Color: {aiDesign.typography.colors.heading}</p>
                            </div>
                          </div>

                          <div className="bg-white/5 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3">Body Text Font</h4>
                            <div
                              className="p-4 bg-white rounded-lg mb-3"
                              style={{
                                fontFamily: aiDesign.typography.bodyFont,
                                fontSize: `${aiDesign.typography.fontSize}px`,
                                fontWeight: 'normal',
                                color: aiDesign.typography.colors.text,
                                lineHeight: aiDesign.typography.lineHeight,
                              }}
                            >
                              This is sample text demonstrating the body font selected for the book. The font was carefully chosen to match the genre and mood.
                            </div>
                            <div className="text-xs text-gray-400 space-y-1">
                              <p>Family: {aiDesign.typography.bodyFont}</p>
                              <p>Size: {aiDesign.typography.fontSize}px</p>
                              <p>Line Height: {aiDesign.typography.lineHeight}</p>
                            </div>
                          </div>

                          <div className="bg-white/5 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3">Chapter Title Font</h4>
                            <div
                              className="p-4 bg-white rounded-lg mb-3"
                              style={{
                                fontFamily: aiDesign.typography.headingFont,
                                fontSize: `${Math.min(aiDesign.typography.chapterTitleSize, 24)}px`,
                                fontWeight: 'bold',
                                color: aiDesign.typography.colors.heading,
                              }}
                            >
                              Chapter One
                            </div>
                            <div className="text-xs text-gray-400 space-y-1">
                              <p>Family: {aiDesign.typography.headingFont}</p>
                              <p>Size: {aiDesign.typography.chapterTitleSize}px</p>
                            </div>
                          </div>

                          <div className="bg-white/5 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3">Subheading Font</h4>
                            <div
                              className="p-4 bg-white rounded-lg mb-3"
                              style={{
                                fontFamily: aiDesign.typography.headingFont,
                                fontSize: '18px',
                                fontWeight: '600',
                                color: aiDesign.typography.colors.heading,
                              }}
                            >
                              Subheading
                            </div>
                            <div className="text-xs text-gray-400 space-y-1">
                              <p>Family: {aiDesign.typography.headingFont}</p>
                              <p>Color: {aiDesign.typography.colors.heading}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Layout Tab */}
                    {aiDesignTab === 'layout' && (
                      <div className="space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <div className="bg-white/5 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-gray-400 mb-4">Margins</h4>
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
                                  Content Area
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 text-xs text-gray-400 space-y-1 text-center">
                              <p>Top: {aiDesign.layout.margins.top}px | Bottom: {aiDesign.layout.margins.bottom}px</p>
                              <p>Inner: {aiDesign.layout.margins.inner}px | Outer: {aiDesign.layout.margins.outer}px</p>
                            </div>
                          </div>

                          <div className="bg-white/5 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-gray-400 mb-4">Additional Settings</h4>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">Page Numbers</span>
                                <span className="text-sm text-white">{
                                  aiDesign.layout.pageNumberPosition === 'bottom-center' ? 'Bottom Center' :
                                  aiDesign.layout.pageNumberPosition === 'bottom-outer' ? 'Bottom Outer' :
                                  aiDesign.layout.pageNumberPosition === 'top-outer' ? 'Top Outer' : 'None'
                                }</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">Chapter Start</span>
                                <span className="text-sm text-white">{
                                  aiDesign.layout.chapterStartStyle === 'new-page' ? 'New Page' :
                                  aiDesign.layout.chapterStartStyle === 'new-page-centered' ? 'New Page (Centered)' : 'Same Page'
                                }</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">Header Style</span>
                                <span className="text-sm text-white">{
                                  aiDesign.layout.headerStyle === 'book-title' ? 'Book Title' :
                                  aiDesign.layout.headerStyle === 'chapter-title' ? 'Chapter Title' :
                                  aiDesign.layout.headerStyle === 'author-name' ? 'Author Name' : 'None'
                                }</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">Drop Caps</span>
                                <span className="text-sm text-white">{aiDesign.layout.dropCaps ? 'Yes' : 'No'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">Ornaments</span>
                                <span className="text-sm text-white">{aiDesign.layout.ornaments ? 'Yes' : 'No'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cover Tab */}
                    {aiDesignTab === 'cover' && (
                      <div className="space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                          {/* Front Cover */}
                          <div className="bg-white/5 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3">Front Cover</h4>
                            <div
                              className="aspect-[2/3] rounded-lg relative overflow-hidden flex flex-col items-center justify-center"
                              style={{
                                background: aiDesign.cover.front.colorPalette?.[0] || '#1a1a2e',
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
                                    fontFamily: aiDesign.typography.titleFont,
                                    color: aiDesign.cover.front.title.color,
                                    fontSize: '18px',
                                  }}
                                >
                                  {book?.title}
                                </h3>
                                <p
                                  className="drop-shadow-lg"
                                  style={{
                                    fontFamily: aiDesign.typography.bodyFont,
                                    color: aiDesign.cover.front.author.color,
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
                                  Generating...
                                </>
                              ) : coverImageUrl ? (
                                <>
                                  <RefreshCw className="w-4 h-4" />
                                  Generate New Image
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4" />
                                  Generate Cover Image
                                </>
                              )}
                            </button>
                          </div>

                          {/* Spine */}
                          <div className="bg-white/5 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3">Spine</h4>
                            <div
                              className="w-12 mx-auto aspect-[1/6] rounded flex items-center justify-center"
                              style={{ background: aiDesign.cover.spine.backgroundColor }}
                            >
                              <span
                                className="transform -rotate-90 whitespace-nowrap text-xs font-medium"
                                style={{
                                  fontFamily: aiDesign.cover.spine.font,
                                  color: aiDesign.cover.spine.color,
                                }}
                              >
                                {book?.title}
                              </span>
                            </div>
                            <div className="mt-3 text-xs text-gray-400 text-center">
                              <p>Font: {aiDesign.cover.spine.font}</p>
                              <p>Author: {aiDesign.cover.spine.author || book?.author?.name}</p>
                            </div>
                          </div>

                          {/* Back Cover */}
                          <div className="bg-white/5 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3">Back Cover</h4>
                            <div
                              className="aspect-[2/3] rounded-lg relative overflow-hidden flex flex-col p-4"
                              style={{
                                background: coverImageUrl
                                  ? `url(${coverImageUrl})`
                                  : aiDesign.cover.back.backgroundColor,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }}
                            >
                              {coverImageUrl && (
                                <div className="absolute inset-0 backdrop-blur-md bg-black/40" />
                              )}
                              <div className="relative z-10 flex-1 flex flex-col">
                                <p
                                  className="text-xs leading-relaxed flex-1 overflow-hidden"
                                  style={{
                                    fontFamily: aiDesign.cover.back.synopsis.font,
                                    color: aiDesign.cover.back.synopsis.color,
                                  }}
                                >
                                  {(book?.synopsis || book?.description || '').slice(0, 200)}...
                                </p>
                                <div className="mt-auto pt-4 border-t border-white/20">
                                  <p className="text-xs" style={{ color: aiDesign.cover.back.author.color }}>{book?.author?.name}</p>
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
                          <h4 className="text-sm font-semibold text-gray-400 mb-2">Image Placement Recommendations</h4>
                          <p className="text-xs text-gray-500">AI found recommended locations for adding images to the book</p>
                        </div>

                        {aiDesign.imagePlacements.length === 0 ? (
                          <div className="text-center py-12 text-gray-400">
                            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No image placement recommendations found</p>
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
                                        suggestion.importance === 'high' ? 'bg-red-500/20 text-red-400' :
                                        suggestion.importance === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-blue-500/20 text-blue-400'
                                      }`}>
                                        {suggestion.importance === 'high' ? 'High Priority' :
                                         suggestion.importance === 'medium' ? 'Medium Priority' : 'Low Priority'}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        Chapter {suggestion.chapterIndex + 1}
                                        {book?.chapters[suggestion.chapterIndex]?.title && ` - ${book.chapters[suggestion.chapterIndex].title}`}
                                      </span>
                                    </div>
                                    <p className="text-sm text-white">{suggestion.reasoning}</p>
                                  </div>
                                  <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {suggestion.position === 'chapter-start' ? 'Chapter Start' :
                                     suggestion.position === 'mid-chapter' ? 'Mid Chapter' : 'Chapter End'}
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
                                          y: suggestion.position === 'chapter-start' ? 10 : 50,
                                          width: 40,
                                          height: 30,
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
                                  Generate and Add Image
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 p-3 sm:p-6 border-t border-white/10 bg-white/5">
                    <button
                      onClick={generateAIDesign}
                      disabled={generatingDesign}
                      className="btn-secondary flex items-center justify-center gap-2 text-xs sm:text-sm order-2 sm:order-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="hidden sm:inline">Generate New Design</span>
                      <span className="sm:hidden">Regenerate</span>
                    </button>

                    <div className="flex items-center gap-2 sm:gap-3 order-1 sm:order-2">
                      <button
                        onClick={() => setShowAIDesignModal(false)}
                        className="btn-ghost text-xs sm:text-sm flex-1 sm:flex-none"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={applyAIDesign}
                        disabled={saving || !Object.values(selectedDesignElements).some(v => v)}
                        className="btn-gold flex items-center justify-center gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">Applying...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span className="hidden sm:inline">Apply Design</span>
                            <span className="sm:hidden">Apply</span>
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
                  <h3 className="text-lg font-semibold text-white mb-2">No design generated yet</h3>
                  <p className="text-sm text-gray-400 text-center mb-6">
                    Click the button below to create a custom design for your book
                  </p>
                  <button
                    onClick={generateAIDesign}
                    className="btn-gold flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generate AI Design
                  </button>
                </div>
              )}
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
  settings: typeof defaultSettings;
  isRTL: boolean;
  isSelected: boolean;
  onImageSelect: (id: string | null) => void;
  selectedImageId: string | null;
  onImageUpdate: (imageId: string, updates: Partial<PageImage>) => void;
  onImageDelete: (imageId: string) => void;
  pageNumber?: number;
  bookTitle?: string;
  showHeader?: boolean;
  headerStyle?: 'book-title' | 'chapter-title' | 'none';
  aiImagePlacements?: AIImagePlacementLocal[];
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
  pageNumber,
  bookTitle,
  showHeader = false,
  headerStyle = 'book-title',
  aiImagePlacements = [],
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
      <div
        className="h-full overflow-hidden text-gray-900 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: page.content }}
        style={{
          direction: isRTL ? 'rtl' : 'ltr',
          paddingTop: showHeader ? '15px' : '0',
          paddingBottom: settings.showPageNumbers ? '20px' : '0',
        }}
      />

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
