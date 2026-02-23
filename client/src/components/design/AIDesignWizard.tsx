import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const STEP_INFO = {
  intro: {
    icon: Wand2,
    titleEn: 'AI Design Wizard',
    titleHe: 'אשף עיצוב AI',
    descEn: 'Let AI analyze your book and create a perfect design',
    descHe: 'תן ל-AI לנתח את הספר שלך וליצור עיצוב מושלם',
  },
  analyzing: {
    icon: BookOpen,
    titleEn: 'Analyzing Your Book',
    titleHe: 'מנתח את הספר שלך',
    descEn: 'Reading chapters and understanding your story...',
    descHe: 'קורא פרקים ומבין את הסיפור שלך...',
  },
  generating: {
    icon: Palette,
    titleEn: 'Generating Design',
    titleHe: 'מייצר עיצוב',
    descEn: 'Creating typography, layout, and color scheme...',
    descHe: 'יוצר טיפוגרפיה, פריסה וסכמת צבעים...',
  },
  images: {
    icon: ImageIcon,
    titleEn: 'Creating Images',
    titleHe: 'יוצר תמונות',
    descEn: 'Generating cover and interior images with AI...',
    descHe: 'מייצר כריכה ותמונות פנימיות עם AI...',
  },
  preview: {
    icon: Check,
    titleEn: 'Design Ready!',
    titleHe: 'העיצוב מוכן!',
    descEn: 'Review your AI-generated design',
    descHe: 'סקור את העיצוב שנוצר',
  },
  error: {
    icon: X,
    titleEn: 'Error Occurred',
    titleHe: 'אירעה שגיאה',
    descEn: 'Something went wrong during design generation',
    descHe: 'משהו השתבש במהלך יצירת העיצוב',
  },
};

export default function AIDesignWizard({
  bookId,
  book,
  onComplete,
  onClose,
  language = 'en',
}: AIDesignWizardProps) {
  const isHebrew = language === 'he';

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

  const stepInfo = STEP_INFO[step];
  const StepIcon = stepInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <StepIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {isHebrew ? stepInfo.titleHe : stepInfo.titleEn}
                </h2>
                <p className="text-white/80 text-sm">
                  {isHebrew ? stepInfo.descHe : stepInfo.descEn}
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <AnimatePresence mode="wait">
            {/* Intro Step */}
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Book Info */}
                <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-16 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{book?.title || 'Your Book'}</h3>
                    <p className="text-gray-400 text-sm">
                      {book?.chapters?.length || 0} {isHebrew ? 'פרקים' : 'chapters'} •
                      {book?.genre || (isHebrew ? 'כללי' : 'General')}
                    </p>
                  </div>
                </div>

                {/* What AI Will Do */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">
                    {isHebrew ? 'מה ה-AI יעשה:' : 'What AI will do:'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FeatureCard
                      icon={Type}
                      title={isHebrew ? 'טיפוגרפיה' : 'Typography'}
                      description={isHebrew
                        ? 'בחירת גופנים, גדלים וצבעים מתאימים'
                        : 'Select matching fonts, sizes, and colors'
                      }
                    />
                    <FeatureCard
                      icon={Layout}
                      title={isHebrew ? 'פריסה' : 'Layout'}
                      description={isHebrew
                        ? 'שוליים, עמודות, מספרי עמודים'
                        : 'Margins, columns, page numbers'
                      }
                    />
                    <FeatureCard
                      icon={Palette}
                      title={isHebrew ? 'כריכה' : 'Cover'}
                      description={isHebrew
                        ? 'עיצוב כריכה קדמית, אחורית ושדרה'
                        : 'Front, back, and spine design'
                      }
                    />
                    <FeatureCard
                      icon={ImageLucide}
                      title={isHebrew ? 'תמונות' : 'Images'}
                      description={isHebrew
                        ? 'הצעות למיקום ויצירת תמונות AI'
                        : 'Placement suggestions and AI generation'
                      }
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
                        {isHebrew ? 'צור תמונות עם AI' : 'Generate images with AI'}
                      </span>
                      <p className="text-sm text-gray-400">
                        {isHebrew
                          ? 'Nano Banana Pro ייצור תמונות כריכה ופנים הספר'
                          : 'Nano Banana Pro will create cover and interior images'
                        }
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
                  {isHebrew ? 'התחל עיצוב AI' : 'Start AI Design'}
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
                  {progress?.stepName || (isHebrew ? 'מעבד...' : 'Processing...')}
                </h3>

                <p className="mt-2 text-gray-400 text-center max-w-md">
                  {step === 'analyzing' && (isHebrew
                    ? 'קורא את תוכן הספר ומנתח את הסגנון, הז\'אנר והטון...'
                    : 'Reading book content and analyzing style, genre, and tone...'
                  )}
                  {step === 'generating' && (isHebrew
                    ? 'יוצר טיפוגרפיה, פריסה וסכמת צבעים מותאמת...'
                    : 'Creating custom typography, layout, and color scheme...'
                  )}
                  {step === 'images' && (isHebrew
                    ? 'מייצר תמונות כריכה ותמונות פנימיות עם Nano Banana Pro...'
                    : 'Generating cover and interior images with Nano Banana Pro...'
                  )}
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
                      {isHebrew ? 'אווירת העיצוב' : 'Design Mood'}
                    </h4>
                    <p className="text-gray-300">{design.moodDescription}</p>
                  </div>
                )}

                {/* Preview Tabs */}
                <div className="flex gap-2 border-b border-gray-700 pb-2">
                  {[
                    { key: 'typography', icon: Type, labelEn: 'Typography', labelHe: 'טיפוגרפיה' },
                    { key: 'layout', icon: Layout, labelEn: 'Layout', labelHe: 'פריסה' },
                    { key: 'covers', icon: Palette, labelEn: 'Covers', labelHe: 'כריכות' },
                    { key: 'images', icon: ImageLucide, labelEn: 'Images', labelHe: 'תמונות' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setPreviewTab(tab.key as any)}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                        previewTab === tab.key
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {isHebrew ? tab.labelHe : tab.labelEn}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="bg-gray-800 rounded-xl p-6">
                  {previewTab === 'typography' && design.typography && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-400">
                            {isHebrew ? 'גופן גוף' : 'Body Font'}
                          </label>
                          <p className="font-medium">{design.typography.bodyFont}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">
                            {isHebrew ? 'גופן כותרות' : 'Heading Font'}
                          </label>
                          <p className="font-medium">{design.typography.headingFont}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">
                            {isHebrew ? 'גודל טקסט' : 'Font Size'}
                          </label>
                          <p className="font-medium">{design.typography.fontSize}px</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">
                            {isHebrew ? 'גובה שורה' : 'Line Height'}
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-400">
                            {isHebrew ? 'עמודות' : 'Columns'}
                          </label>
                          <p className="font-medium">{design.layout.columns}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">
                            {isHebrew ? 'יישור טקסט' : 'Text Align'}
                          </label>
                          <p className="font-medium">{design.layout.textAlign}</p>
                        </div>
                      </div>

                      {design.layout.margins && (
                        <div>
                          <label className="text-sm text-gray-400">
                            {isHebrew ? 'שוליים' : 'Margins'}
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
                            {isHebrew ? 'כריכה קדמית' : 'Front Cover'}
                          </h4>
                          {design.covers.front.generatedImageUrl ? (
                            <img
                              src={design.covers.front.generatedImageUrl}
                              alt="Front Cover"
                              className="w-48 h-72 object-cover rounded-lg"
                            />
                          ) : (
                            <div
                              className="w-48 h-72 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: design.covers.front.backgroundColor }}
                            >
                              <span className="text-sm text-gray-400">
                                {isHebrew ? 'תמונה תיווצר' : 'Image will be generated'}
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
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                                {isHebrew ? `פרק ${img.chapterIndex + 1}` : `Chapter ${img.chapterIndex + 1}`}
                                {' - '}{img.pagePosition}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-center py-8">
                          {isHebrew ? 'לא נבחרו תמונות פנימיות' : 'No interior images selected'}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setStep('intro');
                      setDesign(null);
                    }}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                    {isHebrew ? 'צור מחדש' : 'Regenerate'}
                  </button>
                  <button
                    onClick={handleApplyDesign}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Check className="w-5 h-5" />
                    {isHebrew ? 'החל עיצוב' : 'Apply Design'}
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
                  {isHebrew ? 'שגיאה ביצירת העיצוב' : 'Design Generation Failed'}
                </h3>

                <p className="mt-2 text-gray-400 text-center max-w-md">
                  {error || (isHebrew ? 'אירעה שגיאה לא צפויה' : 'An unexpected error occurred')}
                </p>

                <button
                  onClick={() => {
                    setStep('intro');
                    setError(null);
                  }}
                  className="mt-6 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  {isHebrew ? 'נסה שוב' : 'Try Again'}
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
