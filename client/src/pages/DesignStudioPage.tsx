import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import {
  ArrowLeft,
  Palette,
  Type,
  Image as ImageIcon,
  Sparkles,
  Save,
  Loader2,
  Rocket,
  Download,
  FileText,
  FileType,
  X,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  BookOpen,
  AlertCircle,
  LayoutGrid,
  Menu,
  Settings,
  Eye,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import Book3DPreview from '../components/design/Book3DPreview';
import { useLanguage } from '../contexts/LanguageContext';
import { loadDesignFonts } from '../services/designApplicationService';
import type { AICompleteDesign } from '../types/templates';

interface CoverDesign {
  coverColor?: string;
  textColor?: string;
  fontFamily?: string;
  imageUrl?: string;
  front?: {
    type?: string;
    imageUrl?: string;
    backgroundColor?: string;
    gradientColors?: string[];
    title?: {
      text: string;
      font: string;
      size: number;
      color: string;
    };
    authorName?: {
      text: string;
      font: string;
      size: number;
      color: string;
    };
  };
}

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

interface BookData {
  id: string;
  title: string;
  genre?: string;
  synopsis?: string;
  description?: string;
  author?: {
    _id: string;
    name: string;
  };
  coverDesign?: CoverDesign;
  chapters?: Array<{ title: string; content: string; wordCount: number }>;
  statistics?: {
    wordCount: number;
    chapterCount: number;
  };
  qualityScore?: {
    overallScore: number;
    ratingLabel: string;
  };
  publishingStatus?: {
    status: string;
    price: number;
    isFree: boolean;
  };
}

// Available font options
const FONT_OPTIONS = [
  { name: 'Playfair Display', value: '"Playfair Display", serif', category: 'Serif' },
  { name: 'Inter', value: '"Inter", sans-serif', category: 'Sans-Serif' },
  { name: 'Bebas Neue', value: '"Bebas Neue", cursive', category: 'Display' },
  { name: 'Caveat', value: '"Caveat", cursive', category: 'Handwriting' },
  { name: 'JetBrains Mono', value: '"JetBrains Mono", monospace', category: 'Monospace' },
];

// Preset color palettes
const COLOR_PRESETS = [
  { name: 'Midnight', cover: '#1a1a2e', text: '#ffffff' },
  { name: 'Royal', cover: '#4a148c', text: '#ffffff' },
  { name: 'Ocean', cover: '#006064', text: '#ffffff' },
  { name: 'Forest', cover: '#1b5e20', text: '#ffffff' },
  { name: 'Sunset', cover: '#e65100', text: '#ffffff' },
  { name: 'Rose', cover: '#880e4f', text: '#ffffff' },
];

export default function DesignStudioPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { language } = useLanguage();
  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Design state
  const [coverColor, setCoverColor] = useState('#1a1a2e');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [imageUrl, setImageUrl] = useState<string>('');


  // Publish modal state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [pricingStrategy, setPricingStrategy] = useState<PricingStrategy | null>(null);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [isFree, setIsFree] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx'>('pdf');
  const [exporting, setExporting] = useState(false);

  // Mobile state
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

  // Load book data
  useEffect(() => {
    if (bookId) {
      loadBook();
    }
  }, [bookId]);

  const loadBook = async () => {
    try {
      const response = await api.get(`/books/${bookId}`);
      if (response.data.success) {
        const bookData = response.data.data.book;
        setBook(bookData);

        // Check for AI design state first (takes priority)
        if (bookData.aiDesignState?.status === 'completed' && bookData.aiDesignState?.design) {
          await applyAIDesignState(bookData.aiDesignState.design);
        }
        // Load existing cover design if available and no AI design
        else if (bookData.coverDesign) {
          // Support both old format (flat) and new format (with front object)
          const coverDesign = bookData.coverDesign;
          setCoverColor(coverDesign.front?.backgroundColor || coverDesign.coverColor || '#1a1a2e');
          setTextColor(coverDesign.front?.title?.color || coverDesign.textColor || '#ffffff');
          setFontFamily(coverDesign.front?.title?.font || coverDesign.fontFamily || FONT_OPTIONS[0].value);

          // Handle image URL - check both new format (front.imageUrl) and old format (imageUrl)
          let existingImageUrl = coverDesign.front?.imageUrl || coverDesign.imageUrl || '';
          if (existingImageUrl && !existingImageUrl.startsWith('http') && !existingImageUrl.startsWith('data:')) {
            const apiUrl = import.meta.env.VITE_API_URL ||
              (import.meta.env.PROD ? 'https://me-story-server-7wdx.vercel.app/api' : 'http://localhost:5001/api');
            const serverBaseUrl = apiUrl.replace('/api', '');
            existingImageUrl = `${serverBaseUrl}${existingImageUrl}`;
          }
          setImageUrl(existingImageUrl);
        }
      }
    } catch (error) {
      console.error('Failed to load book:', error);
      toast.error('Failed to load book');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Apply AI design state from book's aiDesignState
  const applyAIDesignState = async (design: AICompleteDesign) => {
    try {
      // Load fonts
      if (design.typography) {
        await loadDesignFonts(design.typography);
      }

      // Apply cover colors
      if (design.covers?.front) {
        setCoverColor(design.covers.front.backgroundColor || '#1a1a2e');
        setTextColor(design.covers.front.title?.color || '#ffffff');
        if (design.covers.front.generatedImageUrl) {
          setImageUrl(design.covers.front.generatedImageUrl);
        }
      }

      // Apply font
      if (design.typography?.titleFont) {
        setFontFamily(`"${design.typography.titleFont}", serif`);
      }

      console.log('Applied AI design state to Design Studio:', design);
    } catch (error) {
      console.error('Error applying AI design state:', error);
    }
  };

  const saveDesign = async () => {
    if (!book) return;

    setSaving(true);
    try {
      const coverDesign: CoverDesign = {
        coverColor,
        textColor,
        fontFamily,
        imageUrl: imageUrl || undefined,
        front: {
          type: 'uploaded',
          imageUrl: imageUrl || undefined,
          backgroundColor: coverColor,
          title: {
            text: book.title,
            font: fontFamily,
            size: 32,
            color: textColor,
          },
          authorName: {
            text: book.author?.name || '',
            font: fontFamily,
            size: 18,
            color: textColor,
          },
        },
      };

      const response = await api.put(`/books/${bookId}`, {
        title: book.title,
        coverDesign,
      });

      if (response.data.success) {
        toast.success(t('design_studio.messages.design_saved'));
        setBook(response.data.data.book);
      }
    } catch (error) {
      console.error('Failed to save design:', error);
      toast.error(t('design_studio.messages.save_failed'));
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setCoverColor(preset.cover);
    setTextColor(preset.text);
  };

  // AI Design Wizard progress state
  const [wizardProgress, setWizardProgress] = useState<{
    show: boolean;
    currentStep: number;
    totalSteps: number;
    stepName: string;
  }>({
    show: false,
    currentStep: 0,
    totalSteps: 6,
    stepName: '',
  });

  // Handle AI Design Wizard (complete design with all images)
  const handleAIDesignWizard = async () => {
    if (!book) return;

    setWizardProgress({
      show: true,
      currentStep: 1,
      totalSteps: 6,
      stepName: language === 'he' ? 'מנתח את הספר...' : 'Analyzing book...',
    });

    try {
      // Start the wizard - poll for progress
      const progressInterval = setInterval(async () => {
        try {
          const stateResponse = await api.get(`/ai/design-state/${bookId}`);
          if (stateResponse.data.success && stateResponse.data.data.aiDesignState?.progress) {
            const progress = stateResponse.data.data.aiDesignState.progress;
            setWizardProgress(prev => ({
              ...prev,
              currentStep: progress.currentStep,
              totalSteps: progress.totalSteps,
              stepName: progress.stepName,
            }));
          }
        } catch (e) {
          // Ignore polling errors
        }
      }, 2000);

      const response = await api.post(`/ai/design-wizard/${bookId}`, {
        generateInteriorImages: false,
      });

      clearInterval(progressInterval);

      if (response.data.success) {
        // Apply the design to local state
        const { coverDesign } = response.data.data;

        if (coverDesign?.front) {
          setCoverColor(coverDesign.front.backgroundColor || coverColor);
          setTextColor(coverDesign.front.title?.color || textColor);
          if (coverDesign.front.title?.font) {
            setFontFamily(`"${coverDesign.front.title.font}", serif`);
          }
          if (coverDesign.front.imageUrl) {
            setImageUrl(coverDesign.front.imageUrl);
          }
        }

        // Reload book to get all changes
        loadBook();

        toast.success(
          language === 'he'
            ? '🎨 אשף העיצוב הושלם בהצלחה!'
            : '🎨 AI Design Wizard completed successfully!'
        );
      }
    } catch (error: any) {
      console.error('AI Design Wizard failed:', error);
      toast.error(
        language === 'he'
          ? 'אשף העיצוב נכשל'
          : 'Design Wizard failed'
      );
    } finally {
      setWizardProgress(prev => ({ ...prev, show: false }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    try {
      toast.loading('Uploading image...', { id: 'upload' });

      const formData = new FormData();
      formData.append('cover', file);

      const response = await api.post(`/books/${bookId}/upload-cover`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const imageUrlPath = response.data.data.imageUrl;

        // Handle different URL types:
        // - Base64 data URLs (data:image/...) - use directly
        // - Absolute URLs (http/https) - use directly
        // - Relative paths (/uploads/...) - prepend server base URL
        let fullImageUrl: string;
        if (imageUrlPath.startsWith('data:') || imageUrlPath.startsWith('http')) {
          fullImageUrl = imageUrlPath;
        } else {
          const apiUrl = import.meta.env.VITE_API_URL ||
            (import.meta.env.PROD ? 'https://me-story-server-7wdx.vercel.app/api' : 'http://localhost:5001/api');
          const serverBaseUrl = apiUrl.replace('/api', '');
          fullImageUrl = `${serverBaseUrl}${imageUrlPath}`;
        }
        setImageUrl(fullImageUrl);

        // Auto-save the cover design with the new image
        try {
          const coverDesign: CoverDesign = {
            coverColor,
            textColor,
            fontFamily,
            imageUrl: fullImageUrl,
          };
          await api.put(`/books/${bookId}`, { coverDesign });
          toast.success('Image uploaded and saved!', { id: 'upload' });
        } catch (saveError) {
          console.error('Failed to auto-save image:', saveError);
          toast.success('Image uploaded! Click Save to persist.', { id: 'upload' });
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload image', { id: 'upload' });
    }
  };

  // Load AI pricing strategy
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
      // Set default strategy if endpoint doesn't exist yet
      setPricingStrategy({
        recommendedPrice: 0,
        recommendFree: true,
        reasoning: 'This is your first book! We recommend starting free to build a reader base and get your first reviews.',
        authorStats: {
          totalBooks: 1,
          publishedBooks: 0,
          totalSales: 0,
          averageRating: 0,
        },
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

  // Handle publish book
  const handlePublish = async () => {
    if (!book) return;

    // Check if book has quality score
    if (!book.qualityScore || book.qualityScore.overallScore < 70) {
      toast.error('A quality score of at least 70 is required for publishing. Run quality analysis in the editor.');
      return;
    }

    setPublishing(true);
    try {
      // First save the design
      await saveDesign();

      // Update book with pricing
      await api.put(`/books/${bookId}`, {
        publishingStatus: {
          price: isFree ? 0 : selectedPrice,
          isFree,
        },
      });

      // Publish the book
      const response = await api.post(`/books/${bookId}/publish`);

      if (response.data.success) {
        // Trigger confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#DAA520', '#FFD700', '#FFA500', '#FF6B6B'],
        });

        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#DAA520', '#FFD700'],
          });
        }, 200);

        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#FFA500', '#FF6B6B'],
          });
        }, 400);

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
      // First save the design
      await saveDesign();

      toast.loading(`Creating ${exportFormat.toUpperCase()} file...`, { id: 'export' });

      const response = await api.get(`/books/${bookId}/export/${exportFormat}`, {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: exportFormat === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${book.title}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`File downloaded successfully!`, { id: 'export' });
      setShowExportModal(false);
    } catch (error: any) {
      console.error('Failed to export book:', error);
      toast.error(error.response?.data?.error || 'Error exporting book', { id: 'export' });
    } finally {
      setExporting(false);
    }
  };

  // Open publish modal and load strategy
  const openPublishModal = () => {
    setShowPublishModal(true);
    loadPricingStrategy();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!book) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="glass-strong border-b border-white/10 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate(`/editor/${bookId}`)}
              className="btn-ghost flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{t('design_studio.back_to_editor')}</span>
            </button>
            <div className="hidden sm:block h-6 w-px bg-gray-700" />
            <h1 className="text-sm sm:text-lg lg:text-xl font-semibold text-white truncate max-w-[120px] sm:max-w-none">
              <span className="hidden sm:inline">{t('design_studio.title')}</span>
              <span className="sm:hidden">{t('design_studio.design')}</span>
            </h1>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Save Design Button */}
            <button
              onClick={saveDesign}
              disabled={saving}
              className="btn-secondary flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('design_studio.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t('design_studio.save_design')}
                </>
              )}
            </button>

            {/* Book Layout Button */}
            <button
              onClick={() => navigate(`/layout/${bookId}`)}
              className="btn-secondary flex items-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              {t('design_studio.page_design')}
            </button>

            {/* Export Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('design_studio.export_to_file')}
            </button>

            {/* Publish Button */}
            <button
              onClick={openPublishModal}
              className="btn-gold flex items-center gap-2 shadow-glow-gold"
            >
              <Rocket className="w-4 h-4" />
              {t('design_studio.publish_to_store')}
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={saveDesign}
              disabled={saving}
              className="btn-ghost p-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowMobileActions(!showMobileActions)}
              className="btn-ghost p-2"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Actions Dropdown */}
        <AnimatePresence>
          {showMobileActions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden mt-3 space-y-2 overflow-hidden"
            >
              <button
                onClick={() => { navigate(`/layout/${bookId}`); setShowMobileActions(false); }}
                className="w-full btn-secondary flex items-center justify-center gap-2 py-3"
              >
                <LayoutGrid className="w-4 h-4" />
                {t('design_studio.page_design')}
              </button>
              <button
                onClick={() => { setShowExportModal(true); setShowMobileActions(false); }}
                className="w-full btn-secondary flex items-center justify-center gap-2 py-3"
              >
                <Download className="w-4 h-4" />
                {t('design_studio.export_to_file')}
              </button>
              <button
                onClick={() => { openPublishModal(); setShowMobileActions(false); }}
                className="w-full btn-gold flex items-center justify-center gap-2 py-3 shadow-glow-gold"
              >
                <Rocket className="w-4 h-4" />
                {t('design_studio.publish_to_store')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Controls Toggle */}
      <div className="lg:hidden fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setShowMobileControls(!showMobileControls)}
          className="glass-strong p-3 rounded-full border border-white/10 shadow-lg"
        >
          {showMobileControls ? <Eye className="w-5 h-5 text-indigo-400" /> : <Settings className="w-5 h-5 text-indigo-400" />}
        </button>
      </div>

      {/* Mobile Controls Overlay */}
      {showMobileControls && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMobileControls(false)}
        />
      )}

      {/* Split Screen Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel - Controls */}
        <div className={`
          ${showMobileControls ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:relative z-50 lg:z-auto
          w-[85%] sm:w-80 lg:w-80 xl:w-96 h-full
          glass-strong border-r border-white/10 p-4 sm:p-6 overflow-y-auto
          transition-transform duration-300 ease-in-out
        `}>
          {/* Mobile Close Button */}
          <div className="lg:hidden flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-300">{t('design_studio.design_controls')}</span>
            <button onClick={() => setShowMobileControls(false)} className="btn-ghost p-2">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-6">
            {/* Book Info */}
            <div>
              <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Type className="w-4 h-4" />
                {t('design_studio.book_info')}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{t('design_studio.title_label')}</label>
                  <input
                    type="text"
                    value={book.title}
                    onChange={(e) => setBook({ ...book, title: e.target.value })}
                    className="input bg-white/5"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{t('design_studio.author_label')}</label>
                  <input
                    type="text"
                    value={book.author?.name || ''}
                    onChange={(e) => setBook({ ...book, author: { ...book.author, name: e.target.value } })}
                    className="input bg-white/5"
                    placeholder={t('design_studio.unknown_author')}
                  />
                </div>
              </div>
            </div>

            {/* AI Design - One Button for Everything */}
            <div>
              <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {language === 'he' ? 'עיצוב אוטומטי' : 'AI DESIGN'}
              </h2>
              <div className="space-y-3">
                {/* Main AI Design Button */}
                <button
                  onClick={handleAIDesignWizard}
                  disabled={wizardProgress.show}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-400 hover:via-orange-400 hover:to-pink-400 rounded-xl text-white font-bold text-lg shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {wizardProgress.show ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {language === 'he' ? 'מעצב...' : 'Designing...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {language === 'he' ? 'עצב לי הכל' : 'Design Everything'}
                    </>
                  )}
                </button>
                <p className="text-xs text-center text-gray-400">
                  {language === 'he'
                    ? 'צבעים, גופנים ותמונת עטיפה בלחיצה אחת'
                    : 'Colors, fonts & cover image in one click'}
                </p>

              </div>
            </div>

            {/* Manual Customization - Collapsible */}
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-300 mb-3 hover:text-white transition-colors">
                <Palette className="w-4 h-4" />
                {language === 'he' ? 'התאמה ידנית' : 'Manual Customization'}
                <ChevronDown className="w-4 h-4 ml-auto transition-transform group-open:rotate-180" />
              </summary>

              {/* Color Presets - Compact */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">{language === 'he' ? 'ערכות צבע מהירות' : 'Quick color presets'}</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      title={preset.name}
                      className="w-full aspect-square rounded-lg shadow-lg hover:ring-2 hover:ring-indigo-500 transition-all"
                      style={{ background: preset.cover }}
                    />
                  ))}
                </div>
              </div>

              {/* Custom Colors - Compact */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={coverColor}
                    onChange={(e) => setCoverColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-white/10"
                  />
                  <span className="text-xs text-gray-400 flex-1">{language === 'he' ? 'רקע' : 'Background'}</span>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-white/10"
                  />
                  <span className="text-xs text-gray-400">{language === 'he' ? 'טקסט' : 'Text'}</span>
                </div>

                {/* Font Selection - Compact */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">{language === 'he' ? 'גופן' : 'Font'}</p>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="input w-full text-sm"
                    style={{ fontFamily: fontFamily }}
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </details>

            {/* Cover Image - Manual Upload Only */}
            <div>
              <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                {language === 'he' ? 'תמונת עטיפה (ידנית)' : 'Cover Image (Manual)'}
              </h2>
              <div className="space-y-2">
                <label className="btn-secondary w-full flex items-center justify-center gap-2 cursor-pointer">
                  <ImageIcon className="w-4 h-4" />
                  {t('design_studio.upload_image')}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                {imageUrl && (
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <span className="text-xs text-green-400 truncate flex-1">
                      {language === 'he' ? 'תמונה נטענה' : 'Image loaded'}
                    </span>
                    <button
                      onClick={() => setImageUrl('')}
                      className="text-xs text-red-400 hover:text-red-300 ml-2"
                    >
                      {language === 'he' ? 'הסר' : 'Remove'}
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 text-center">
                  {language === 'he' ? 'או השתמש בעיצוב אוטומטי למעלה' : 'Or use AI Design above'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - 3D Preview Stage */}
        <div className="flex-1 relative overflow-hidden pb-16 lg:pb-0">
          {/* Studio background with gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 70%),
                radial-gradient(circle at 20% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
                linear-gradient(to bottom, #0a0a1f, #111122)
              `,
            }}
          />

          {/* Grid overlay for studio effect */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* 3D Book Preview */}
          <div className="relative z-10 h-full flex items-center justify-center p-4 sm:p-8">
            <div className="transform scale-75 sm:scale-90 lg:scale-100">
              <Book3DPreview
                title={book.title}
                author={book.author?.name || t('design_studio.unknown_author')}
                coverColor={coverColor}
                textColor={textColor}
                fontFamily={fontFamily}
                imageUrl={imageUrl}
                synopsis={book.synopsis || book.description || ''}
                language={language}
              />
            </div>
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 text-center px-4">
            <p className="text-xs sm:text-sm text-gray-400">
              {t('design_studio.preview_hint')}
            </p>
          </div>
        </div>
      </div>

      {/* AI Design Wizard Progress Modal */}
      <AnimatePresence>
        {wizardProgress.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-strong rounded-2xl p-8 max-w-md w-full text-center"
            >
              {/* Animated Icon */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 rounded-full animate-spin-slow opacity-50 blur-xl" />
                <div className="relative w-24 h-24 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-white animate-pulse" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white mb-2">
                {language === 'he' ? 'אשף העיצוב עובד...' : 'Design Wizard Working...'}
              </h2>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>
                    {language === 'he' ? 'שלב' : 'Step'} {wizardProgress.currentStep}/{wizardProgress.totalSteps}
                  </span>
                  <span>{Math.round((wizardProgress.currentStep / wizardProgress.totalSteps) * 100)}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(wizardProgress.currentStep / wizardProgress.totalSteps) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Current Step */}
              <p className="text-gray-300 text-lg">
                {wizardProgress.stepName}
              </p>

              {/* Sub-text */}
              <p className="text-gray-500 text-sm mt-4">
                {language === 'he'
                  ? 'יוצר עיצוב מקצועי מלא עבור הספר שלך'
                  : 'Creating a complete professional design for your book'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publish Modal */}
      <AnimatePresence>
        {showPublishModal && (
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
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-magic-gold to-yellow-600 flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-deep-space" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-2xl font-bold gradient-gold">{t('design_studio.publish_modal.title')}</h2>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">{book.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {loadingStrategy ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-magic-gold mx-auto mb-4" />
                  <p className="text-gray-300">{t('design_studio.publish_modal.analyzing')}</p>
                </div>
              ) : pricingStrategy ? (
                <div className="space-y-6">
                  {/* AI Recommendation */}
                  <div className="p-4 bg-gradient-to-r from-magic-gold/10 to-yellow-500/10 border border-magic-gold/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-6 h-6 text-magic-gold flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-white mb-1">{t('design_studio.publish_modal.ai_recommendation')}</h3>
                        <p className="text-gray-300 text-sm">{pricingStrategy.reasoning}</p>
                      </div>
                    </div>
                  </div>

                  {/* Author Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="glass rounded-lg p-3 text-center">
                      <BookOpen className="w-5 h-5 text-magic-gold mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white">{pricingStrategy.authorStats.publishedBooks}</p>
                      <p className="text-xs text-gray-400">{t('design_studio.publish_modal.published_books')}</p>
                    </div>
                    <div className="glass rounded-lg p-3 text-center">
                      <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white">{pricingStrategy.authorStats.totalSales}</p>
                      <p className="text-xs text-gray-400">{t('design_studio.publish_modal.sales')}</p>
                    </div>
                    <div className="glass rounded-lg p-3 text-center">
                      <TrendingUp className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white">${pricingStrategy.marketAnalysis.genreAveragePrice}</p>
                      <p className="text-xs text-gray-400">{t('design_studio.publish_modal.genre_avg_price')}</p>
                    </div>
                    <div className="glass rounded-lg p-3 text-center">
                      <Sparkles className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white capitalize">{pricingStrategy.marketAnalysis.demandLevel}</p>
                      <p className="text-xs text-gray-400">{t('design_studio.publish_modal.demand_level')}</p>
                    </div>
                  </div>

                  {/* Pricing Selection */}
                  <div>
                    <h3 className="font-semibold text-white mb-3">{t('design_studio.publish_modal.select_pricing')}</h3>
                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={() => {
                          setIsFree(true);
                          setSelectedPrice(0);
                        }}
                        className={`flex-1 py-4 px-4 rounded-xl border-2 transition-all ${
                          isFree
                            ? 'border-magic-gold bg-magic-gold/20 text-white'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <span className="text-lg font-bold">{t('design_studio.publish_modal.free')}</span>
                        {pricingStrategy.recommendFree && (
                          <span className="block text-xs text-magic-gold mt-1">{t('design_studio.publish_modal.recommended_by_ai')}</span>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsFree(false);
                          setSelectedPrice(pricingStrategy.recommendedPrice || 20);
                        }}
                        className={`flex-1 py-4 px-4 rounded-xl border-2 transition-all ${
                          !isFree
                            ? 'border-magic-gold bg-magic-gold/20 text-white'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <span className="text-lg font-bold">{t('design_studio.publish_modal.paid')}</span>
                        {!pricingStrategy.recommendFree && (
                          <span className="block text-xs text-magic-gold mt-1">{t('design_studio.publish_modal.recommended_by_ai')}</span>
                        )}
                      </button>
                    </div>

                    {!isFree && (
                      <div className="space-y-3">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                          <input
                            type="number"
                            min="5"
                            max="200"
                            step="5"
                            value={selectedPrice}
                            onChange={(e) => setSelectedPrice(parseFloat(e.target.value) || 0)}
                            className="input pl-10 text-lg font-bold"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex gap-2">
                          {[10, 20, 30, 50].map((price) => (
                            <button
                              key={price}
                              onClick={() => setSelectedPrice(price)}
                              className={`flex-1 py-2 rounded-lg text-sm transition ${
                                selectedPrice === price
                                  ? 'bg-magic-gold/30 text-magic-gold border border-magic-gold/50'
                                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              ${price}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400">
                          {t('design_studio.publish_modal.genre_price_range')}: ${pricingStrategy.marketAnalysis.competitorPriceRange.min} - ${pricingStrategy.marketAnalysis.competitorPriceRange.max}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Strategy Tips */}
                  <div>
                    <h3 className="font-semibold text-white mb-3">{t('design_studio.publish_modal.strategy_tips')}</h3>
                    <div className="space-y-2">
                      {pricingStrategy.strategyTips.map((tip, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quality Check Warning */}
                  {(!book.qualityScore || book.qualityScore.overallScore < 70) && (
                    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-300 font-medium">{t('design_studio.publish_modal.low_quality_title')}</p>
                        <p className="text-sm text-red-400/80">
                          {t('design_studio.publish_modal.low_quality_desc')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Publish Button */}
                  <button
                    onClick={handlePublish}
                    disabled={publishing || !book.qualityScore || book.qualityScore.overallScore < 70}
                    className="w-full btn-gold py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {publishing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('design_studio.publish_modal.publishing')}
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5" />
                        {isFree ? t('design_studio.publish_modal.publish_free') : `${t('design_studio.publish_modal.publish_for')}$${selectedPrice}`}
                      </>
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
        {showExportModal && (
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
              className="glass-strong rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cosmic-purple to-purple-600 flex items-center justify-center">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{t('design_studio.export_modal.title')}</h2>
                    <p className="text-gray-400 text-sm">{book.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Format Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white">{t('design_studio.export_modal.select_format')}</h3>

                <button
                  onClick={() => setExportFormat('pdf')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-right ${
                    exportFormat === 'pdf'
                      ? 'border-magic-gold bg-magic-gold/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      exportFormat === 'pdf' ? 'bg-red-500' : 'bg-red-500/50'
                    }`}>
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">PDF</p>
                      <p className="text-sm text-gray-400">
                        {t('design_studio.export_modal.pdf_desc')}
                      </p>
                    </div>
                    {exportFormat === 'pdf' && (
                      <CheckCircle2 className="w-6 h-6 text-magic-gold" />
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setExportFormat('docx')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-right ${
                    exportFormat === 'docx'
                      ? 'border-magic-gold bg-magic-gold/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      exportFormat === 'docx' ? 'bg-blue-500' : 'bg-blue-500/50'
                    }`}>
                      <FileType className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">{t('design_studio.export_modal.docx_title')}</p>
                      <p className="text-sm text-gray-400">
                        {t('design_studio.export_modal.docx_desc')}
                      </p>
                    </div>
                    {exportFormat === 'docx' && (
                      <CheckCircle2 className="w-6 h-6 text-magic-gold" />
                    )}
                  </div>
                </button>

                {/* Export includes */}
                <div className="p-4 bg-white/5 rounded-xl">
                  <h4 className="font-semibold text-white mb-3">{t('design_studio.export_modal.includes_title')}</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>{t('design_studio.export_modal.includes_cover_front_back')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>{t('design_studio.export_modal.includes_all_chapters')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>{t('design_studio.export_modal.includes_design_fonts')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>{t('design_studio.export_modal.includes_synopsis')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>{t('design_studio.export_modal.includes_print_quality')}</span>
                    </div>
                  </div>
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="w-full btn-primary py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('design_studio.export_modal.exporting')}
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      {t('design_studio.export_modal.download')} {exportFormat.toUpperCase()}
                    </>
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
