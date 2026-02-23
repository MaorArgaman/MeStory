import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Check, X, Wand2, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { BookTemplate, getTemplateById } from '../../data/bookTemplates';
import { applyTemplate, loadGoogleFonts, PageLayoutSettings } from '../../services/templateService';

interface AIDesignResult {
  templateId: string;
  template: BookTemplate;
  coverImageUrl?: string;
  coverPrompt?: string;
  settings: PageLayoutSettings;
  reasoning: string;
}

interface AIDesignButtonProps {
  bookId: string;
  bookTitle: string;
  bookGenre: string;
  bookSynopsis?: string;
  currentSettings: PageLayoutSettings;
  onDesignApplied: (settings: PageLayoutSettings, coverImageUrl?: string) => void;
  className?: string;
}

export default function AIDesignButton({
  bookId,
  bookTitle,
  bookGenre,
  bookSynopsis,
  currentSettings,
  onDesignApplied,
  className = '',
}: AIDesignButtonProps) {
  const { language } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [result, setResult] = useState<AIDesignResult | null>(null);

  const generateDesign = async () => {
    setIsGenerating(true);

    try {
      const response = await api.post('/ai/design/complete', {
        bookId,
        bookTitle,
        bookGenre,
        bookSynopsis,
        language,
      });

      if (response.data.success) {
        const data = response.data.data;

        // Get the template from our local templates
        const template = getTemplateById(data.templateId);
        if (!template) {
          throw new Error('Invalid template returned from AI');
        }

        // Apply template to current settings
        const newSettings = applyTemplate(currentSettings, template);

        setResult({
          templateId: data.templateId,
          template,
          coverImageUrl: data.coverImageUrl,
          coverPrompt: data.coverPrompt,
          settings: newSettings,
          reasoning: data.reasoning,
        });

        setShowPreview(true);
      } else {
        throw new Error(response.data.message || 'Failed to generate design');
      }
    } catch (err: unknown) {
      console.error('AI Design generation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate AI design';
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyDesign = () => {
    if (!result) return;

    // Load Google Fonts for the selected template
    loadGoogleFonts(result.settings);

    // Apply the design
    onDesignApplied(result.settings, result.coverImageUrl);

    toast.success(
      language === 'he'
        ? `עיצוב "${result.template.nameHe}" הוחל בהצלחה!`
        : `Design "${result.template.name}" applied successfully!`
    );

    setShowPreview(false);
    setResult(null);
  };

  const regenerate = () => {
    setResult(null);
    generateDesign();
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={generateDesign}
        disabled={isGenerating}
        className={`flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {language === 'he' ? 'יוצר עיצוב...' : 'Generating...'}
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            {language === 'he' ? 'עיצוב AI' : 'AI Design'}
          </>
        )}
      </motion.button>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && result && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-10 z-50 flex items-center justify-center"
            >
              <div className="w-full max-w-3xl max-h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Wand2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {language === 'he' ? 'עיצוב AI מומלץ' : 'AI Design Recommendation'}
                      </h2>
                      <p className="text-sm text-white/60">
                        {language === 'he' ? result.template.nameHe : result.template.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/70" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Template Preview */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Cover Preview */}
                    <div>
                      <h3 className="text-sm font-medium text-white/70 mb-3">
                        {language === 'he' ? 'תצוגה מקדימה של הכריכה' : 'Cover Preview'}
                      </h3>
                      <div
                        className="aspect-[2/3] rounded-xl overflow-hidden"
                        style={{ background: result.template.previewGradient }}
                      >
                        {result.coverImageUrl ? (
                          <img
                            src={result.coverImageUrl}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6">
                            <div
                              className="text-center mb-4"
                              style={{
                                fontFamily: result.template.fonts.title,
                                color: result.template.coverStyle.titleColor,
                              }}
                            >
                              <div className="text-2xl font-bold">{bookTitle}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Settings Preview */}
                    <div>
                      <h3 className="text-sm font-medium text-white/70 mb-3">
                        {language === 'he' ? 'הגדרות עיצוב' : 'Design Settings'}
                      </h3>
                      <div className="bg-white/5 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">
                            {language === 'he' ? 'תבנית' : 'Template'}
                          </span>
                          <span className="text-white font-medium">
                            {language === 'he' ? result.template.nameHe : result.template.name}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">
                            {language === 'he' ? 'גופן' : 'Font'}
                          </span>
                          <span className="text-white font-medium">
                            {result.template.fonts.body}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">
                            {language === 'he' ? 'גודל גופן' : 'Font Size'}
                          </span>
                          <span className="text-white font-medium">
                            {result.template.fontSize}px
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">
                            {language === 'he' ? 'עמודות' : 'Columns'}
                          </span>
                          <span className="text-white font-medium">
                            {result.template.columns}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-white/60">
                            {language === 'he' ? 'צבע טקסט' : 'Text Color'}
                          </span>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded border border-white/20"
                              style={{ backgroundColor: result.template.textColor }}
                            />
                            <span className="text-white font-medium text-xs">
                              {result.template.textColor}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* AI Reasoning */}
                      {result.reasoning && (
                        <div className="mt-4 bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                          <h4 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            {language === 'he' ? 'נימוק AI' : 'AI Reasoning'}
                          </h4>
                          <p className="text-sm text-white/70">{result.reasoning}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-slate-900/50">
                  <button
                    onClick={regenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    {language === 'he' ? 'צור מחדש' : 'Regenerate'}
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowPreview(false)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                      {language === 'he' ? 'ביטול' : 'Cancel'}
                    </button>
                    <button
                      onClick={applyDesign}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      {language === 'he' ? 'החל עיצוב' : 'Apply Design'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
