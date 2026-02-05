import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import Book3DPreview from '../components/design/Book3DPreview';

interface CoverDesign {
  coverColor: string;
  textColor: string;
  fontFamily: string;
  imageUrl?: string;
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

        // Load existing design if available
        if (bookData.coverDesign) {
          setCoverColor(bookData.coverDesign.coverColor || '#1a1a2e');
          setTextColor(bookData.coverDesign.textColor || '#ffffff');
          setFontFamily(bookData.coverDesign.fontFamily || FONT_OPTIONS[0].value);
          setImageUrl(bookData.coverDesign.imageUrl || '');
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

  const saveDesign = async () => {
    if (!book) return;

    setSaving(true);
    try {
      const coverDesign: CoverDesign = {
        coverColor,
        textColor,
        fontFamily,
        imageUrl: imageUrl || undefined,
      };

      const response = await api.put(`/books/${bookId}`, {
        coverDesign,
      });

      if (response.data.success) {
        toast.success('Design saved successfully!');
        setBook(response.data.data.book);
      }
    } catch (error) {
      console.error('Failed to save design:', error);
      toast.error('Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setCoverColor(preset.cover);
    setTextColor(preset.text);
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
        setImageUrl(`http://localhost:5001${response.data.data.imageUrl}`);
        toast.success('Image uploaded successfully!', { id: 'upload' });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload image', { id: 'upload' });
    }
  };

  const handleAIColorGeneration = async () => {
    if (!book) return;

    try {
      toast.loading('Generating AI color scheme...', { id: 'ai-colors' });

      const response = await api.post('/ai/generate-cover-colors', {
        title: book.title,
        genre: book.genre || book.author?.name || 'Fiction',
      });

      if (response.data.success) {
        const colorScheme = response.data.data;
        setCoverColor(colorScheme.backgroundColor);
        setTextColor(colorScheme.titleColor);
        toast.success(`AI Suggestion: ${colorScheme.suggestion}`, {
          id: 'ai-colors',
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error('AI color error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate colors', {
        id: 'ai-colors',
      });
    }
  };

  const handleAICoverGeneration = async () => {
    if (!book) return;

    // Generate a synopsis from book content if not available
    let synopsis = book.synopsis || book.description || '';

    if (!synopsis && book.chapters && book.chapters.length > 0) {
      // Extract first 500 characters from first chapter as synopsis
      const firstChapterContent = book.chapters[0]?.content || '';
      synopsis = firstChapterContent.slice(0, 500);
    }

    if (!synopsis || synopsis.length < 50) {
      toast.error('Please add some content or a description to your book first');
      return;
    }

    try {
      toast.loading('AI is designing your book cover...', { id: 'ai-cover' });

      const response = await api.post('/ai/generate-cover', {
        synopsis,
        genre: book.genre || 'Fiction',
        title: book.title,
      });

      if (response.data.success) {
        const coverDesign = response.data.data;

        // Apply the generated design
        setCoverColor(coverDesign.backgroundColor);

        if (coverDesign.type === 'gradient' && coverDesign.gradientColors) {
          // Create a gradient background
          const gradientCSS = `linear-gradient(135deg, ${coverDesign.gradientColors.join(', ')})`;
          setCoverColor(gradientCSS.includes('#') ? coverDesign.backgroundColor : gradientCSS);
        }

        // Apply overlay if specified
        if (coverDesign.overlayOpacity) {
          setTextColor('#ffffff'); // Ensure text is readable
        }

        toast.success(`AI Cover Created! ${coverDesign.suggestion}`, {
          id: 'ai-cover',
          duration: 6000,
        });
      }
    } catch (error: any) {
      console.error('AI cover error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate cover design', {
        id: 'ai-cover',
      });
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
        reasoning: 'זה הספר הראשון שלך! מומלץ להתחיל בחינם כדי לבנות קהל קוראים ולקבל ביקורות ראשונות.',
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
          'ספר ראשון בחינם עוזר לבנות בסיס קוראים נאמן',
          'אסוף ביקורות חיוביות לפני שתעבור לספרים בתשלום',
          'שקול להציע את הספר הראשון בחינם לתקופה מוגבלת',
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
      toast.error('נדרש ציון איכות של 70 לפחות לפרסום. הרץ ניתוח איכות בעורך.');
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

        toast.success('הספר פורסם בהצלחה!');
        setShowPublishModal(false);
        navigate('/marketplace');
      }
    } catch (error: any) {
      console.error('Failed to publish book:', error);
      toast.error(error.response?.data?.error || 'שגיאה בפרסום הספר');
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

      toast.loading(`יוצר קובץ ${exportFormat.toUpperCase()}...`, { id: 'export' });

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

      toast.success(`הקובץ הורד בהצלחה!`, { id: 'export' });
      setShowExportModal(false);
    } catch (error: any) {
      console.error('Failed to export book:', error);
      toast.error(error.response?.data?.error || 'שגיאה בייצוא הספר', { id: 'export' });
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
      <div className="glass-strong border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/editor/${bookId}`)}
              className="btn-ghost flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Editor
            </button>
            <div className="h-6 w-px bg-gray-700" />
            <h1 className="text-xl font-semibold text-white">Cover Design Studio</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Save Design Button */}
            <button
              onClick={saveDesign}
              disabled={saving}
              className="btn-secondary flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  שמור עיצוב
                </>
              )}
            </button>

            {/* Book Layout Button */}
            <button
              onClick={() => navigate(`/layout/${bookId}`)}
              className="btn-secondary flex items-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              עיצוב עמודים
            </button>

            {/* Export Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              ייצוא לקובץ
            </button>

            {/* Publish Button */}
            <button
              onClick={openPublishModal}
              className="btn-gold flex items-center gap-2 shadow-glow-gold"
            >
              <Rocket className="w-4 h-4" />
              פרסום בחנות
            </button>
          </div>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls */}
        <div className="w-96 glass-strong border-r border-white/10 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Book Info */}
            <div>
              <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Type className="w-4 h-4" />
                BOOK INFORMATION
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={book.title}
                    disabled
                    className="input bg-white/5 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Author</label>
                  <input
                    type="text"
                    value={book.author?.name || 'Unknown Author'}
                    disabled
                    className="input bg-white/5 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                COLOR PRESETS
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 transition-all group"
                  >
                    <div
                      className="w-12 h-12 rounded-lg shadow-lg"
                      style={{ background: preset.cover }}
                    />
                    <span className="text-xs text-gray-400 group-hover:text-white">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div>
              <h2 className="text-sm font-semibold text-gray-300 mb-3">CUSTOM COLORS</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Cover Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={coverColor}
                      onChange={(e) => setCoverColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/10"
                    />
                    <input
                      type="text"
                      value={coverColor}
                      onChange={(e) => setCoverColor(e.target.value)}
                      className="input flex-1"
                      placeholder="#1a1a2e"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Text Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/10"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="input flex-1"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Font Selection */}
            <div>
              <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Type className="w-4 h-4" />
                FONT FAMILY
              </h2>
              <div className="space-y-2">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => setFontFamily(font.value)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      fontFamily === font.value
                        ? 'bg-indigo-500/20 border-indigo-500'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className="text-white font-semibold"
                          style={{ fontFamily: font.value }}
                        >
                          {font.name}
                        </p>
                        <p className="text-xs text-gray-400">{font.category}</p>
                      </div>
                      {fontFamily === font.value && (
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                COVER IMAGE
              </h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="input"
                  placeholder="Enter image URL or upload..."
                />
                <div className="flex gap-2">
                  <label className="btn-secondary flex-1 flex items-center justify-center gap-2 cursor-pointer">
                    <ImageIcon className="w-4 h-4" />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  <button
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    onClick={handleAIColorGeneration}
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Colors
                  </button>
                </div>
                {/* AI Cover Generation Button */}
                <button
                  className="btn-gold w-full flex items-center justify-center gap-2 shadow-glow-gold"
                  onClick={handleAICoverGeneration}
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Cover with AI
                </button>
                {imageUrl && (
                  <button
                    onClick={() => setImageUrl('')}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Clear Image
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - 3D Preview Stage */}
        <div className="flex-1 relative overflow-hidden">
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
          <div className="relative z-10 h-full flex items-center justify-center">
            <Book3DPreview
              title={book.title}
              author={book.author?.name || 'Unknown Author'}
              coverColor={coverColor}
              textColor={textColor}
              fontFamily={fontFamily}
              imageUrl={imageUrl}
            />
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
            <p className="text-sm text-gray-400">
              תצוגה מקדימה בזמן אמת • שינויים מתעדכנים אוטומטית
            </p>
          </div>
        </div>
      </div>

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
              className="glass-strong rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-magic-gold to-yellow-600 flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-deep-space" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold gradient-gold">פרסום בחנות</h2>
                    <p className="text-gray-400 text-sm">{book.title}</p>
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
                  <p className="text-gray-300">מנתח אסטרטגיית תמחור...</p>
                </div>
              ) : pricingStrategy ? (
                <div className="space-y-6">
                  {/* AI Recommendation */}
                  <div className="p-4 bg-gradient-to-r from-magic-gold/10 to-yellow-500/10 border border-magic-gold/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-6 h-6 text-magic-gold flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-white mb-1">המלצת AI</h3>
                        <p className="text-gray-300 text-sm">{pricingStrategy.reasoning}</p>
                      </div>
                    </div>
                  </div>

                  {/* Author Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="glass rounded-lg p-3 text-center">
                      <BookOpen className="w-5 h-5 text-magic-gold mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white">{pricingStrategy.authorStats.publishedBooks}</p>
                      <p className="text-xs text-gray-400">ספרים שפורסמו</p>
                    </div>
                    <div className="glass rounded-lg p-3 text-center">
                      <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white">{pricingStrategy.authorStats.totalSales}</p>
                      <p className="text-xs text-gray-400">מכירות</p>
                    </div>
                    <div className="glass rounded-lg p-3 text-center">
                      <TrendingUp className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white">₪{pricingStrategy.marketAnalysis.genreAveragePrice}</p>
                      <p className="text-xs text-gray-400">מחיר ממוצע בז'אנר</p>
                    </div>
                    <div className="glass rounded-lg p-3 text-center">
                      <Sparkles className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white capitalize">{pricingStrategy.marketAnalysis.demandLevel}</p>
                      <p className="text-xs text-gray-400">רמת ביקוש</p>
                    </div>
                  </div>

                  {/* Pricing Selection */}
                  <div>
                    <h3 className="font-semibold text-white mb-3">בחר תמחור</h3>
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
                        <span className="text-lg font-bold">חינם</span>
                        {pricingStrategy.recommendFree && (
                          <span className="block text-xs text-magic-gold mt-1">מומלץ ע"י AI</span>
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
                        <span className="text-lg font-bold">בתשלום</span>
                        {!pricingStrategy.recommendFree && (
                          <span className="block text-xs text-magic-gold mt-1">מומלץ ע"י AI</span>
                        )}
                      </button>
                    </div>

                    {!isFree && (
                      <div className="space-y-3">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₪</span>
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
                              ₪{price}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400">
                          טווח מחירים בז'אנר: ₪{pricingStrategy.marketAnalysis.competitorPriceRange.min} - ₪{pricingStrategy.marketAnalysis.competitorPriceRange.max}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Strategy Tips */}
                  <div>
                    <h3 className="font-semibold text-white mb-3">טיפים לאסטרטגיה</h3>
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
                        <p className="text-red-300 font-medium">ציון איכות נמוך</p>
                        <p className="text-sm text-red-400/80">
                          נדרש ציון איכות של 70 לפחות לפרסום. הרץ ניתוח איכות בעורך.
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
                        מפרסם...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5" />
                        פרסם את הספר {isFree ? 'בחינם' : `ב-₪${selectedPrice}`}
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
                    <h2 className="text-2xl font-bold text-white">ייצוא לקובץ</h2>
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
                <h3 className="font-semibold text-white">בחר פורמט</h3>

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
                        מושלם לדפוס ולשיתוף דיגיטלי. שומר על כל העיצוב והתמונות.
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
                      <p className="font-bold text-white">Word (DOCX)</p>
                      <p className="text-sm text-gray-400">
                        ניתן לעריכה נוספת. מתאים לעורכים ובתי הוצאה לאור.
                      </p>
                    </div>
                    {exportFormat === 'docx' && (
                      <CheckCircle2 className="w-6 h-6 text-magic-gold" />
                    )}
                  </div>
                </button>

                {/* Export includes */}
                <div className="p-4 bg-white/5 rounded-xl">
                  <h4 className="font-semibold text-white mb-3">הקובץ יכלול:</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>כריכה מעוצבת (קדמית ואחורית)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>כל הפרקים והתוכן</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>עיצוב, פונטים ותמונות</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>תקציר בגב הספר</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>איכות מותאמת לדפוס</span>
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
                      יוצר קובץ...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      הורד {exportFormat.toUpperCase()}
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
