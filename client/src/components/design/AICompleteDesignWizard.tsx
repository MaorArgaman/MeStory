/**
 * AI Complete Design Wizard
 *
 * Premium AI-powered book design that creates:
 * - Custom typography (fonts, sizes, colors)
 * - Page layout (margins, columns, chapter style)
 * - Complete cover design (front, back, spine)
 * - Smart image placeholders in chapters
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  BookOpen,
  Palette,
  Image as ImageIcon,
  Check,
  Loader2,
  RefreshCw,
  Type,
  Layout,
  Wand2,
  ChevronRight,
  Play,
  Eye,
  ArrowRight,
  BookMarked,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useModal } from '../../hooks/useModal';
import { api } from '../../services/api';
import { BookTemplate, saveCustomTemplate } from '../../data/bookTemplates';
import toast from 'react-hot-toast';

interface CoverDesign {
  front: {
    imagePrompt: string;
    imageUrl?: string;
    title: { text: string; font: string; size: number; color: string; position: string };
    author: { text: string; font: string; size: number; color: string };
    colorPalette: string[];
  };
  back: {
    imagePrompt: string;
    imageUrl?: string;
    synopsis: { text: string; font: string; size: number; color: string };
    author: { text: string; font: string; size: number; color: string };
    backgroundColor: string;
  };
  spine: {
    title: string;
    author: string;
    font: string;
    color: string;
    backgroundColor: string;
  };
}

interface ImagePlacement {
  chapterIndex: number;
  position: 'chapter-start' | 'mid-chapter' | 'chapter-end';
  textContext: string;
  suggestedPrompt: string;
  importance: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface Typography {
  bodyFont: string;
  headingFont: string;
  titleFont: string;
  fontSize: number;
  lineHeight: number;
  chapterTitleSize: number;
  colors: {
    text: string;
    heading: string;
    accent: string;
  };
}

interface PageLayout {
  margins: { top: number; bottom: number; inner: number; outer: number };
  chapterStartStyle: 'same-page' | 'new-page' | 'new-page-centered';
  pageNumberPosition: 'bottom-center' | 'bottom-outer' | 'top-outer' | 'none';
  headerStyle: 'none' | 'book-title' | 'chapter-title' | 'author-name';
  dropCaps: boolean;
}

interface CompleteDesign {
  typography: Typography;
  layout: PageLayout;
  cover: CoverDesign;
  imagePlacements: ImagePlacement[];
  overallStyle: string;
  moodDescription: string;
}

interface AICompleteDesignWizardProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  book: {
    title: string;
    genre: string;
    synopsis?: string;
    description?: string;
    chapters?: Array<{ title: string; content: string }>;
    author?: { name: string };
  };
  onDesignComplete: (design: CompleteDesign, coverImageUrls: { front?: string; back?: string }) => void;
}

type Step = 'intro' | 'analyzing' | 'typography' | 'layout' | 'cover' | 'images' | 'preview';

const STEP_INFO = {
  intro: { icon: Wand2, titleHe: 'עיצוב AI מלא', titleEn: 'Complete AI Design' },
  analyzing: { icon: BookOpen, titleHe: 'מנתח את הספר...', titleEn: 'Analyzing book...' },
  typography: { icon: Type, titleHe: 'יוצר טיפוגרפיה...', titleEn: 'Creating typography...' },
  layout: { icon: Layout, titleHe: 'מעצב פריסה...', titleEn: 'Designing layout...' },
  cover: { icon: Palette, titleHe: 'מעצב כריכה...', titleEn: 'Designing cover...' },
  images: { icon: ImageIcon, titleHe: 'ממקם תמונות...', titleEn: 'Placing images...' },
  preview: { icon: Eye, titleHe: 'תצוגה מקדימה', titleEn: 'Preview' },
};

export default function AICompleteDesignWizard({
  isOpen,
  onClose,
  bookId,
  book,
  onDesignComplete,
}: AICompleteDesignWizardProps) {
  const { t, i18n } = useTranslation('common');
  const isHebrew = i18n.language === 'he';

  useModal(isOpen, onClose);

  const [step, setStep] = useState<Step>('intro');
  const [design, setDesign] = useState<CompleteDesign | null>(null);
  const [coverImages, setCoverImages] = useState<{ front?: string; back?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [generateCoverImages, setGenerateCoverImages] = useState(true);
  const [generateInteriorImages, setGenerateInteriorImages] = useState(true);
  const [previewTab, setPreviewTab] = useState<'cover' | 'typography' | 'layout' | 'images'>('cover');

  const startDesign = useCallback(async () => {
    try {
      setError(null);
      setStep('analyzing');

      // Call premium design endpoint
      const response = await api.post(`/ai/premium-design/${bookId}`, {
        generateCoverImages,
        generateInteriorImages,
        maxInteriorImages: 5,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to generate design');
      }

      const data = response.data.data;

      // Process the design response
      const processedDesign: CompleteDesign = {
        typography: data.typography || {
          bodyFont: 'David Libre',
          headingFont: 'Secular One',
          titleFont: 'Suez One',
          fontSize: 14,
          lineHeight: 1.7,
          chapterTitleSize: 28,
          colors: { text: '#1a1a2e', heading: '#2c3e50', accent: '#6366f1' },
        },
        layout: data.layout || {
          margins: { top: 50, bottom: 50, inner: 60, outer: 40 },
          chapterStartStyle: 'new-page-centered',
          pageNumberPosition: 'bottom-center',
          headerStyle: 'chapter-title',
          dropCaps: true,
        },
        cover: data.coverDesign || data.cover || {
          front: {
            imagePrompt: `Professional book cover for "${book.title}"`,
            title: { text: book.title, font: 'Suez One', size: 48, color: '#ffffff', position: 'center' },
            author: { text: book.author?.name || '', font: 'David Libre', size: 18, color: '#ffffff' },
            colorPalette: ['#6366f1', '#8b5cf6', '#a855f7'],
          },
          back: {
            imagePrompt: 'Blurred background matching front cover',
            synopsis: { text: book.synopsis || book.description || '', font: 'David Libre', size: 14, color: '#ffffff' },
            author: { text: book.author?.name || '', font: 'David Libre', size: 16, color: '#ffffff' },
            backgroundColor: '#1a1a2e',
          },
          spine: {
            title: book.title,
            author: book.author?.name || '',
            font: 'David Libre',
            color: '#ffffff',
            backgroundColor: '#6366f1',
          },
        },
        imagePlacements: data.imagePlacements || [],
        overallStyle: data.overallStyle || 'professional',
        moodDescription: data.moodDescription || data.theme?.primaryTheme || '',
      };

      setDesign(processedDesign);

      // Set cover images if generated
      if (data.covers) {
        setCoverImages({
          front: data.covers.frontImageUrl,
          back: data.covers.backImageUrl,
        });
      }

      setStep('preview');

    } catch (err: any) {
      console.error('AI Design error:', err);
      setError(err.message || 'Failed to generate design');
      setStep('intro');
    }
  }, [bookId, book, generateCoverImages, generateInteriorImages]);

  const handleApply = async () => {
    if (!design) return;

    try {
      // Create a custom template from the design
      const customTemplate: BookTemplate = {
        id: `ai-custom-${Date.now()}`,
        name: `AI Design for ${book.title}`,
        nameHe: `עיצוב AI עבור ${book.title}`,
        description: `Custom AI-generated design`,
        descriptionHe: `עיצוב מותאם אישית שנוצר על ידי AI`,
        category: 'custom',
        fonts: {
          title: design.typography.titleFont,
          body: design.typography.bodyFont,
          headers: design.typography.headingFont,
        },
        headerSizes: { h1: design.typography.chapterTitleSize, h2: 22, h3: 18 },
        fontSize: design.typography.fontSize,
        lineHeight: design.typography.lineHeight,
        columns: 1,
        paragraphStyle: 'vertical',
        pageNumberPosition: design.layout.pageNumberPosition,
        margins: {
          top: design.layout.margins.top,
          bottom: design.layout.margins.bottom,
          left: design.layout.margins.inner,
          right: design.layout.margins.outer,
        },
        paragraphIndent: 0,
        paragraphSpacing: 12,
        chapterStartStyle: design.layout.chapterStartStyle,
        dropCapStyle: design.layout.dropCaps ? 'classic' : 'none',
        headerDecoration: 'ornament',
        dividerStyle: 'ornament',
        imagePositions: ['top', 'center'],
        imageFrameStyle: 'rounded',
        textColor: design.typography.colors.text,
        accentColor: design.typography.colors.accent,
        backgroundColor: '#ffffff',
        previewGradient: `linear-gradient(135deg, ${design.typography.colors.accent}40, ${design.typography.colors.heading}40)`,
        coverStyle: {
          backgroundColor: design.cover.spine.backgroundColor,
          titleColor: design.cover.front.title.color,
          authorColor: design.cover.front.author.color,
          pattern: 'none',
        },
        // Store image placements
        creativeImageLayout: {
          pattern: 'custom' as any,
          imageCount: design.imagePlacements.length,
          customPositions: design.imagePlacements.map((p, i) => ({
            x: 10,
            y: p.position === 'chapter-start' ? 10 : p.position === 'mid-chapter' ? 40 : 70,
            width: 40,
            height: 30,
            rotation: 0,
          })),
        },
      };

      // Save custom template
      saveCustomTemplate(customTemplate);

      // Call the callback with design data
      onDesignComplete(design, coverImages);

      toast.success(isHebrew ? 'העיצוב הוחל בהצלחה!' : 'Design applied successfully!');
      onClose();

    } catch (err: any) {
      console.error('Apply design error:', err);
      toast.error(err.message || 'Failed to apply design');
    }
  };

  const StepIcon = STEP_INFO[step].icon;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-purple-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <motion.div
                animate={step !== 'intro' && step !== 'preview' ? { rotate: 360 } : {}}
                transition={{ duration: 2, repeat: step !== 'intro' && step !== 'preview' ? Infinity : 0, ease: 'linear' }}
                className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center"
              >
                <StepIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {isHebrew ? STEP_INFO[step].titleHe : STEP_INFO[step].titleEn}
                </h2>
                <p className="text-white/70 text-sm">
                  {isHebrew ? 'עיצוב מקצועי מלא לספר שלך' : 'Complete professional design for your book'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Progress Steps */}
          {step !== 'intro' && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {(['analyzing', 'typography', 'layout', 'cover', 'images', 'preview'] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full transition-colors ${
                      s === step
                        ? 'bg-white scale-125'
                        : ['analyzing', 'typography', 'layout', 'cover', 'images', 'preview'].indexOf(step) > i
                        ? 'bg-green-400'
                        : 'bg-white/30'
                    }`}
                  />
                  {i < 5 && <div className="w-6 h-0.5 bg-white/30 mx-1" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
          <AnimatePresence mode="wait">
            {/* Intro */}
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Book Preview */}
                <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-16 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{book.title}</h3>
                    <p className="text-white/60 text-sm">{book.genre} • {book.chapters?.length || 0} {isHebrew ? 'פרקים' : 'chapters'}</p>
                  </div>
                </div>

                {/* What AI Will Do */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FeatureCard
                    icon={Type}
                    title={isHebrew ? 'טיפוגרפיה מושלמת' : 'Perfect Typography'}
                    description={isHebrew ? 'גופנים, גדלים וצבעים מותאמים לז\'אנר' : 'Fonts, sizes and colors matched to genre'}
                  />
                  <FeatureCard
                    icon={Layout}
                    title={isHebrew ? 'פריסת עמודים' : 'Page Layout'}
                    description={isHebrew ? 'שוליים, כותרות פרקים, מספרי עמודים' : 'Margins, chapter headers, page numbers'}
                  />
                  <FeatureCard
                    icon={BookMarked}
                    title={isHebrew ? 'כריכה מלאה' : 'Complete Cover'}
                    description={isHebrew ? 'פנים, גב ושדרה עם תמונות AI' : 'Front, back and spine with AI images'}
                  />
                  <FeatureCard
                    icon={ImageIcon}
                    title={isHebrew ? 'תמונות חכמות' : 'Smart Images'}
                    description={isHebrew ? 'מיקומי תמונות על פי תוכן הפרקים' : 'Image placements based on chapter content'}
                  />
                </div>

                {/* Options */}
                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateCoverImages}
                      onChange={(e) => setGenerateCoverImages(e.target.checked)}
                      className="w-5 h-5 rounded border-purple-500 bg-white/10 text-purple-500 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-white font-medium flex items-center gap-2">
                        <Palette className="w-4 h-4 text-purple-400" />
                        {isHebrew ? 'צור תמונות לכריכה' : 'Generate cover images'}
                      </span>
                      <p className="text-sm text-white/50">
                        {isHebrew ? 'AI יצור תמונות לפנים ולגב הכריכה' : 'AI will create images for front and back covers'}
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateInteriorImages}
                      onChange={(e) => setGenerateInteriorImages(e.target.checked)}
                      className="w-5 h-5 rounded border-purple-500 bg-white/10 text-purple-500 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-white font-medium flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-purple-400" />
                        {isHebrew ? 'הצע מיקומי תמונות' : 'Suggest image placements'}
                      </span>
                      <p className="text-sm text-white/50">
                        {isHebrew ? 'AI ינתח את הפרקים וימליץ היכן לשים תמונות' : 'AI will analyze chapters and suggest where to place images'}
                      </p>
                    </div>
                  </label>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300">
                    {error}
                  </div>
                )}

                {/* Start Button */}
                <button
                  onClick={startDesign}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-500/25"
                >
                  <Play className="w-6 h-6" />
                  {isHebrew ? 'התחל עיצוב AI' : 'Start AI Design'}
                </button>
              </motion.div>
            )}

            {/* Processing */}
            {(step === 'analyzing' || step === 'typography' || step === 'layout' || step === 'cover' || step === 'images') && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
                  >
                    <Loader2 className="w-12 h-12 text-white" />
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-purple-500/30"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>

                <h3 className="mt-8 text-2xl font-bold text-white">
                  {isHebrew ? STEP_INFO[step].titleHe : STEP_INFO[step].titleEn}
                </h3>

                <p className="mt-2 text-white/60 text-center max-w-md">
                  {isHebrew
                    ? 'AI מנתח את הספר שלך ויוצר עיצוב מקצועי מותאם אישית...'
                    : 'AI is analyzing your book and creating a custom professional design...'}
                </p>
              </motion.div>
            )}

            {/* Preview */}
            {step === 'preview' && design && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Mood Description */}
                {design.moodDescription && (
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <span className="font-medium text-white">
                        {isHebrew ? 'סגנון העיצוב' : 'Design Style'}
                      </span>
                    </div>
                    <p className="text-white/80">{design.moodDescription}</p>
                  </div>
                )}

                {/* Preview Tabs */}
                <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
                  {[
                    { key: 'cover', icon: BookMarked, label: isHebrew ? 'כריכה' : 'Cover' },
                    { key: 'typography', icon: Type, label: isHebrew ? 'טיפוגרפיה' : 'Typography' },
                    { key: 'layout', icon: Layout, label: isHebrew ? 'פריסה' : 'Layout' },
                    { key: 'images', icon: ImageIcon, label: isHebrew ? 'תמונות' : 'Images' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setPreviewTab(tab.key as any)}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
                        previewTab === tab.key
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white/5 rounded-xl p-6">
                  {/* Cover Tab */}
                  {previewTab === 'cover' && (
                    <div className="space-y-6">
                      {/* Full Cover Preview */}
                      <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-2">
                        {/* Back Cover */}
                        <div className="relative w-48 h-72 rounded-lg overflow-hidden shadow-xl order-2 lg:order-1" style={{ backgroundColor: design.cover.back.backgroundColor }}>
                          {coverImages.back ? (
                            <img src={coverImages.back} alt="Back Cover" className="w-full h-full object-cover opacity-60" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10" />
                          )}
                          <div className="absolute inset-0 p-4 flex flex-col justify-center items-center text-center">
                            <p className="text-white/90 text-xs leading-relaxed mb-4 line-clamp-6" style={{ fontFamily: design.cover.back.synopsis.font }}>
                              {design.cover.back.synopsis.text || book.synopsis || book.description || ''}
                            </p>
                            <p className="text-white/70 text-sm mt-auto" style={{ fontFamily: design.cover.back.author.font }}>
                              {design.cover.back.author.text || book.author?.name}
                            </p>
                          </div>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white rounded px-2 py-1">
                            <div className="w-16 h-8 bg-black/10 flex items-center justify-center text-[8px] text-black/50">
                              BARCODE
                            </div>
                          </div>
                        </div>

                        {/* Spine */}
                        <div
                          className="w-8 h-72 rounded-sm shadow-xl flex items-center justify-center order-3 lg:order-2"
                          style={{ backgroundColor: design.cover.spine.backgroundColor }}
                        >
                          <div
                            className="transform -rotate-90 whitespace-nowrap text-sm font-medium"
                            style={{ color: design.cover.spine.color, fontFamily: design.cover.spine.font }}
                          >
                            {design.cover.spine.title} • {design.cover.spine.author}
                          </div>
                        </div>

                        {/* Front Cover */}
                        <div className="relative w-48 h-72 rounded-lg overflow-hidden shadow-xl order-1 lg:order-3">
                          {coverImages.front ? (
                            <img src={coverImages.front} alt="Front Cover" className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className="w-full h-full"
                              style={{ background: `linear-gradient(135deg, ${design.cover.front.colorPalette?.[0] || '#6366f1'}, ${design.cover.front.colorPalette?.[1] || '#8b5cf6'})` }}
                            />
                          )}
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                            <h3
                              className="text-xl font-bold mb-2 drop-shadow-lg"
                              style={{
                                fontFamily: design.cover.front.title.font,
                                color: design.cover.front.title.color
                              }}
                            >
                              {design.cover.front.title.text}
                            </h3>
                            <p
                              className="text-sm drop-shadow"
                              style={{
                                fontFamily: design.cover.front.author.font,
                                color: design.cover.front.author.color
                              }}
                            >
                              {design.cover.front.author.text || book.author?.name}
                            </p>
                          </div>
                        </div>
                      </div>

                      <p className="text-center text-white/50 text-sm">
                        {isHebrew ? 'תצוגה מקדימה של הכריכה המלאה: גב, שדרה ופנים' : 'Full cover preview: back, spine and front'}
                      </p>
                    </div>
                  )}

                  {/* Typography Tab */}
                  {previewTab === 'typography' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-white/50">{isHebrew ? 'גופן גוף' : 'Body Font'}</label>
                        <p className="text-white font-medium" style={{ fontFamily: design.typography.bodyFont }}>
                          {design.typography.bodyFont}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-white/50">{isHebrew ? 'גופן כותרות' : 'Heading Font'}</label>
                        <p className="text-white font-medium" style={{ fontFamily: design.typography.headingFont }}>
                          {design.typography.headingFont}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-white/50">{isHebrew ? 'גודל גופן' : 'Font Size'}</label>
                        <p className="text-white font-medium">{design.typography.fontSize}px</p>
                      </div>
                      <div>
                        <label className="text-sm text-white/50">{isHebrew ? 'גובה שורה' : 'Line Height'}</label>
                        <p className="text-white font-medium">{design.typography.lineHeight}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm text-white/50 mb-2 block">{isHebrew ? 'צבעים' : 'Colors'}</label>
                        <div className="flex gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: design.typography.colors.text }} />
                            <span className="text-sm text-white/70">{isHebrew ? 'טקסט' : 'Text'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: design.typography.colors.heading }} />
                            <span className="text-sm text-white/70">{isHebrew ? 'כותרות' : 'Headings'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: design.typography.colors.accent }} />
                            <span className="text-sm text-white/70">{isHebrew ? 'הדגשה' : 'Accent'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Layout Tab */}
                  {previewTab === 'layout' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-white/50">{isHebrew ? 'סגנון פרק' : 'Chapter Style'}</label>
                        <p className="text-white font-medium">
                          {design.layout.chapterStartStyle === 'new-page-centered'
                            ? (isHebrew ? 'עמוד חדש במרכז' : 'New page centered')
                            : design.layout.chapterStartStyle === 'new-page'
                            ? (isHebrew ? 'עמוד חדש' : 'New page')
                            : (isHebrew ? 'באותו עמוד' : 'Same page')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-white/50">{isHebrew ? 'מספרי עמודים' : 'Page Numbers'}</label>
                        <p className="text-white font-medium">{design.layout.pageNumberPosition}</p>
                      </div>
                      <div>
                        <label className="text-sm text-white/50">{isHebrew ? 'כותרת עליונה' : 'Header'}</label>
                        <p className="text-white font-medium">{design.layout.headerStyle}</p>
                      </div>
                      <div>
                        <label className="text-sm text-white/50">{isHebrew ? 'אות ראשונה גדולה' : 'Drop Caps'}</label>
                        <p className="text-white font-medium">{design.layout.dropCaps ? (isHebrew ? 'כן' : 'Yes') : (isHebrew ? 'לא' : 'No')}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm text-white/50">{isHebrew ? 'שוליים' : 'Margins'}</label>
                        <p className="text-white/70 text-sm">
                          {isHebrew ? 'עליון' : 'Top'}: {design.layout.margins.top}px,
                          {isHebrew ? ' פנימי' : ' Inner'}: {design.layout.margins.inner}px,
                          {isHebrew ? ' חיצוני' : ' Outer'}: {design.layout.margins.outer}px,
                          {isHebrew ? ' תחתון' : ' Bottom'}: {design.layout.margins.bottom}px
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Images Tab */}
                  {previewTab === 'images' && (
                    <div className="space-y-4">
                      {design.imagePlacements.length > 0 ? (
                        <>
                          <p className="text-white/70 text-sm mb-4">
                            {isHebrew
                              ? `נמצאו ${design.imagePlacements.length} מיקומים מומלצים לתמונות:`
                              : `Found ${design.imagePlacements.length} recommended image placements:`}
                          </p>
                          {design.imagePlacements.slice(0, 5).map((placement, i) => (
                            <div key={i} className="bg-white/5 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-medium">
                                  {isHebrew ? `פרק ${placement.chapterIndex + 1}` : `Chapter ${placement.chapterIndex + 1}`}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  placement.importance === 'high' ? 'bg-red-500/30 text-red-300' :
                                  placement.importance === 'medium' ? 'bg-yellow-500/30 text-yellow-300' :
                                  'bg-green-500/30 text-green-300'
                                }`}>
                                  {placement.importance}
                                </span>
                              </div>
                              <p className="text-white/60 text-sm">{placement.suggestedPrompt}</p>
                            </div>
                          ))}
                        </>
                      ) : (
                        <p className="text-white/50 text-center py-8">
                          {isHebrew ? 'לא נמצאו המלצות לתמונות' : 'No image recommendations found'}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Apply Button */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    onClick={() => { setStep('intro'); setDesign(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {isHebrew ? 'צור מחדש' : 'Regenerate'}
                  </button>

                  <button
                    onClick={handleApply}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl text-white font-bold transition-all shadow-lg shadow-green-500/25"
                  >
                    <Check className="w-5 h-5" />
                    {isHebrew ? 'החל עיצוב' : 'Apply Design'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-purple-400" />
      </div>
      <div>
        <h4 className="text-white font-medium">{title}</h4>
        <p className="text-white/50 text-sm">{description}</p>
      </div>
    </div>
  );
}
