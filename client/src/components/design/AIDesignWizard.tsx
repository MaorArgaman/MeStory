import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '../../hooks/useModal';
import {
  Loader2,
  Sparkles,
  BookOpen,
  Palette,
  ImageIcon,
  Check,
  X,
  RefreshCw,
  Wand2,
  Type,
  Layout,
  Image as ImageLucide,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import {
  AIDesignState,
  AICompleteDesign,
  AIDesignProgress,
} from '../../types/templates';

interface AIDesignWizardProps {
  bookId: string;
  book: any;
  onComplete: (design: AICompleteDesign) => void;
  onClose: () => void;
  language?: string;
}

type WizardStep = 'intro' | 'analyzing' | 'generating' | 'images' | 'preview' | 'error';

const STEP_ICONS = {
  intro: Wand2,
  analyzing: BookOpen,
  generating: Palette,
  images: ImageIcon,
  preview: Check,
  error: X,
};

export default function AIDesignWizard({
  bookId,
  book,
  onComplete,
  onClose,
}: AIDesignWizardProps) {
  const { t } = useTranslation('common');

  // Use modal hook for ESC key and scroll lock
  useModal(true, onClose);

  const [step, setStep] = useState<WizardStep>('intro');
  const [progress, setProgress] = useState<AIDesignProgress | null>(null);
  const [design, setDesign] = useState<AICompleteDesign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generateImages, setGenerateImages] = useState(true);
  const [previewTab, setPreviewTab] = useState<'typography' | 'layout' | 'covers' | 'images'>('typography');

  // Start design generation
  const startDesign = useCallback(async () => {
    try {
      setStep('analyzing');
      setError(null);
      setProgress({ currentStep: 1, totalSteps: 4, stepName: 'Analyzing book content' });

      // Call the complete design endpoint
      const response = await api.post(`/ai/design-complete/${bookId}`, {
        generateImages,
      });

      if (response.data.success) {
        setDesign(response.data.design);
        setStep('preview');
      } else {
        throw new Error(response.data.error || 'Failed to generate design');
      }
    } catch (err: any) {
      console.error('AI Design error:', err);
      setError(err.message || 'Failed to generate design');
      setStep('error');
    }
  }, [bookId, generateImages]);

  // Poll for design state (for long-running operations)
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    if (step === 'analyzing' || step === 'generating' || step === 'images') {
      pollInterval = setInterval(async () => {
        try {
          const response = await api.get(`/ai/design-state/${bookId}`);
          if (response.data.success && response.data.state) {
            const state: AIDesignState = response.data.state;

            if (state.progress) {
              setProgress(state.progress);
            }

            // Update step based on status
            switch (state.status) {
              case 'analyzing':
                setStep('analyzing');
                break;
              case 'generating-design':
                setStep('generating');
                break;
              case 'generating-images':
                setStep('images');
                break;
              case 'completed':
                if (state.design) {
                  setDesign(state.design);
                  setStep('preview');
                }
                break;
              case 'error':
                setError(state.error || 'Unknown error');
                setStep('error');
                break;
            }
          }
        } catch (err) {
          // Ignore polling errors
        }
      }, 2000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [step, bookId]);

  // Handle apply design
  const handleApplyDesign = async () => {
    if (!design) return;

    try {
      await api.post(`/ai/apply-complete-design/${bookId}`, { design });
      onComplete(design);
    } catch (err: any) {
      setError(err.message || 'Failed to apply design');
    }
  };

  const StepIcon = STEP_ICONS[step];

  // Get step title and description from translations
  const getStepInfo = (stepKey: WizardStep) => {
    const stepTranslationKeys: Record<WizardStep, { title: string; desc: string }> = {
      intro: { title: 'ai_design_wizard.title', desc: 'ai_design_wizard.desc' },
      analyzing: { title: 'ai_design_wizard.analyzing_title', desc: 'ai_design_wizard.analyzing_desc' },
      generating: { title: 'ai_design_wizard.generating_title', desc: 'ai_design_wizard.generating_desc' },
      images: { title: 'ai_design_wizard.images_title', desc: 'ai_design_wizard.images_desc' },
      preview: { title: 'ai_design_wizard.preview_title', desc: 'ai_design_wizard.preview_desc' },
      error: { title: 'ai_design_wizard.error_title', desc: 'ai_design_wizard.error_desc' },
    };
    return {
      title: t(stepTranslationKeys[stepKey].title),
      desc: t(stepTranslationKeys[stepKey].desc),
    };
  };

  const stepInfo = getStepInfo(step);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-design-wizard-title"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl mx-2 sm:mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <StepIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 id="ai-design-wizard-title" className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">
                  {stepInfo.title}
                </h2>
                <p className="text-white/80 text-xs sm:text-sm line-clamp-2">
                  {stepInfo.desc}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>

          {/* Progress Bar */}
          {(step === 'analyzing' || step === 'generating' || step === 'images') && progress && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-white/80 mb-2">
                <span>{progress.stepName}</span>
                <span>{progress.currentStep}/{progress.totalSteps}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress.currentStep / progress.totalSteps) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-160px)] sm:max-h-[calc(90vh-200px)]">
          <AnimatePresence mode="wait">
            {/* Intro Step */}
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 sm:space-y-6"
              >
                {/* Book Info */}
                <div className="bg-gray-800 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-16 sm:w-16 sm:h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base sm:text-lg truncate">{book?.title || 'Your Book'}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      {book?.chapters?.length || 0} {t('ai_design_wizard.chapters')} •
                      {book?.genre || t('ai_design_wizard.general')}
                    </p>
                  </div>
                </div>

                {/* What AI Will Do */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">
                    {t('ai_design_wizard.what_ai_will_do')}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FeatureCard
                      icon={Type}
                      title={t('ai_design_wizard.typography')}
                      description={t('ai_design_wizard.typography_desc')}
                    />
                    <FeatureCard
                      icon={Layout}
                      title={t('ai_design_wizard.layout')}
                      description={t('ai_design_wizard.layout_desc')}
                    />
                    <FeatureCard
                      icon={Palette}
                      title={t('ai_design_wizard.cover')}
                      description={t('ai_design_wizard.cover_desc')}
                    />
                    <FeatureCard
                      icon={ImageLucide}
                      title={t('ai_design_wizard.images')}
                      description={t('ai_design_wizard.images_desc')}
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="bg-gray-800 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateImages}
                      onChange={(e) => setGenerateImages(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                    />
                    <div>
                      <span className="font-medium">
                        {t('ai_design_wizard.generate_images')}
                      </span>
                      <p className="text-sm text-gray-400">
                        {t('ai_design_wizard.generate_images_desc')}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Start Button */}
                <button
                  onClick={startDesign}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all"
                >
                  <Sparkles className="w-6 h-6" />
                  {t('ai_design_wizard.start_ai_design')}
                </button>
              </motion.div>
            )}

            {/* Processing Steps */}
            {(step === 'analyzing' || step === 'generating' || step === 'images') && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="relative">
                  <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-purple-500/30"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>

                <h3 className="mt-8 text-xl font-semibold">
                  {progress?.stepName || t('ai_design_wizard.processing')}
                </h3>

                <p className="mt-2 text-gray-400 text-center max-w-md">
                  {step === 'analyzing' && t('ai_design_wizard.reading_content')}
                  {step === 'generating' && t('ai_design_wizard.creating_design')}
                  {step === 'images' && t('ai_design_wizard.generating_images')}
                </p>

                {/* Step Indicators */}
                <div className="flex items-center gap-2 mt-8">
                  {['analyzing', 'generating', 'images', 'preview'].map((s, i) => (
                    <div
                      key={s}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        s === step
                          ? 'bg-purple-500'
                          : ['analyzing', 'generating', 'images', 'preview'].indexOf(step) > i
                            ? 'bg-green-500'
                            : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Preview Step */}
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
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      {t('ai_design_wizard.design_mood')}
                    </h4>
                    <p className="text-gray-300">{design.moodDescription}</p>
                  </div>
                )}

                {/* Preview Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2 overflow-x-auto">
                  {[
                    { key: 'typography', icon: Type, label: t('ai_design_wizard.typography') },
                    { key: 'layout', icon: Layout, label: t('ai_design_wizard.layout') },
                    { key: 'covers', icon: Palette, label: t('ai_design_wizard.cover') },
                    { key: 'images', icon: ImageLucide, label: t('ai_design_wizard.images') },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setPreviewTab(tab.key as any)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-colors text-sm sm:text-base whitespace-nowrap ${
                        previewTab === tab.key
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
                  {previewTab === 'typography' && design.typography && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="text-sm text-gray-400">
                            {t('ai_design_wizard.body_font')}
                          </label>
                          <p className="font-medium">{design.typography.bodyFont}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">
                            {t('ai_design_wizard.heading_font')}
                          </label>
                          <p className="font-medium">{design.typography.headingFont}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">
                            {t('ai_design_wizard.font_size')}
                          </label>
                          <p className="font-medium">{design.typography.fontSize}px</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">
                            {t('ai_design_wizard.line_height')}
                          </label>
                          <p className="font-medium">{design.typography.lineHeight}</p>
                        </div>
                      </div>

                      {design.typography.colors && (
                        <div className="flex gap-4 mt-4">
                          {Object.entries(design.typography.colors).map(([key, color]) => (
                            <div key={key} className="text-center">
                              <div
                                className="w-10 h-10 rounded-lg border border-gray-600"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-xs text-gray-400 mt-1">{key}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {previewTab === 'layout' && design.layout && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="text-sm text-gray-400">
                            {t('ai_design_wizard.columns')}
                          </label>
                          <p className="font-medium">{design.layout.columns}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">
                            {t('ai_design_wizard.text_align')}
                          </label>
                          <p className="font-medium">{design.layout.textAlign}</p>
                        </div>
                      </div>

                      {design.layout.margins && (
                        <div>
                          <label className="text-sm text-gray-400">
                            {t('ai_design_wizard.margins')}
                          </label>
                          <p className="font-medium">
                            {Object.entries(design.layout.margins).map(([k, v]) => `${k}: ${v}mm`).join(' | ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {previewTab === 'covers' && design.covers && (
                    <div className="space-y-4">
                      {design.covers.front && (
                        <div>
                          <h4 className="font-medium mb-2">
                            {t('ai_design_wizard.front_cover')}
                          </h4>
                          {design.covers.front.generatedImageUrl ? (
                            <img
                              src={design.covers.front.generatedImageUrl}
                              alt="Front Cover"
                              className="w-32 h-48 sm:w-40 sm:h-60 md:w-48 md:h-72 object-cover rounded-lg"
                            />
                          ) : (
                            <div
                              className="w-32 h-48 sm:w-40 sm:h-60 md:w-48 md:h-72 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: design.covers.front.backgroundColor }}
                            >
                              <span className="text-xs sm:text-sm text-gray-400 text-center px-2">
                                {t('ai_design_wizard.image_will_be_generated')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {previewTab === 'images' && (
                    <div className="space-y-4">
                      {design.imagePlacements && design.imagePlacements.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                          {design.imagePlacements.map((img, i) => (
                            <div key={i} className="bg-gray-700 rounded-lg p-3">
                              {img.generatedImageUrl ? (
                                <img
                                  src={img.generatedImageUrl}
                                  alt={`Image ${i + 1}`}
                                  className="w-full h-32 object-cover rounded"
                                />
                              ) : (
                                <div className="w-full h-32 bg-gray-600 rounded flex items-center justify-center">
                                  <ImageLucide className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                                {t('ai_design_wizard.chapter_num', { num: img.chapterIndex + 1 })}
                                {' - '}{img.pagePosition}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-center py-8">
                          {t('ai_design_wizard.no_interior_images')}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={() => {
                      setStep('intro');
                      setDesign(null);
                    }}
                    className="flex-1 py-2.5 sm:py-3 bg-gray-700 hover:bg-gray-600 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                  >
                    <RefreshCw className="w-5 h-5" />
                    {t('ai_design_wizard.regenerate')}
                  </button>
                  <button
                    onClick={handleApplyDesign}
                    className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 transition-all text-sm sm:text-base"
                  >
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    {t('ai_design_wizard.apply_design')}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Error Step */}
            {step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                  <X className="w-10 h-10 text-red-500" />
                </div>

                <h3 className="mt-6 text-xl font-semibold text-red-400">
                  {t('ai_design_wizard.design_failed')}
                </h3>

                <p className="mt-2 text-gray-400 text-center max-w-md">
                  {error || t('ai_design_wizard.unexpected_error')}
                </p>

                <button
                  onClick={() => {
                    setStep('intro');
                    setError(null);
                  }}
                  className="mt-6 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  {t('ai_design_wizard.try_again')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Feature Card Component
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-purple-400" />
      </div>
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  );
}
