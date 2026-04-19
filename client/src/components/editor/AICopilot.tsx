import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BarChart3, Loader2, CheckCircle } from 'lucide-react';
import { getAiSuggestions, getQualityAnalysis, QualityAnalysis } from '../../services/aiApi';
import toast from 'react-hot-toast';

interface AICopilotProps {
  currentText: string;
  genre: string;
  bookTitle?: string;
  chapterTitle?: string;
  onInsertText: (text: string) => void;
}

export default function AICopilot({
  currentText,
  genre,
  bookTitle,
  chapterTitle,
  onInsertText,
}: AICopilotProps) {
  const { t } = useTranslation('common');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [analysis, setAnalysis] = useState<QualityAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const isEmptyChapter = !currentText || currentText.trim().length < 20;

  const handleGetSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const result = await getAiSuggestions({
        currentText: currentText || '',
        genre,
        context: {
          bookTitle,
          chapterTitle,
          isChapterOpening: isEmptyChapter,
        },
      });
      setSuggestions(result.suggestions);
      toast.success(t('editor.ai_copilot.suggestions_success'));
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      toast.error(t('editor.ai_copilot.suggestions_failed'));
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAnalyze = async () => {
    if (!currentText || currentText.length < 100) {
      toast.error(t('editor.ai_copilot.min_chars_error'));
      return;
    }

    setLoadingAnalysis(true);
    try {
      const result = await getQualityAnalysis({ text: currentText });
      setAnalysis(result);
      toast.success(t('editor.ai_copilot.suggestions_success'));
    } catch (error) {
      console.error('Failed to analyze:', error);
      toast.error(t('editor.ai_copilot.analysis_failed'));
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleInsertSuggestion = (suggestion: string) => {
    onInsertText(isEmptyChapter ? suggestion : '\n\n' + suggestion);
    toast.success(isEmptyChapter ? 'הפרק נפתח!' : 'Suggestion inserted!');
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-yellow-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'from-yellow-500 to-amber-500';
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 70) return 'from-blue-500 to-cyan-500';
    if (score >= 60) return 'from-orange-500 to-yellow-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="space-y-6">
      {/* Writer's Block Solver */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-semibold text-gray-300">{t('editor.ai_copilot.title')}</h2>
        </div>

        <div className="card p-4 space-y-4">
          <button
            onClick={handleGetSuggestions}
            disabled={loadingSuggestions}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loadingSuggestions ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('editor.ai_copilot.thinking')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {isEmptyChapter
                  ? (t('editor.ai_copilot.start_chapter') || 'פתח לי את הפרק')
                  : t('editor.ai_copilot.inspire_me')}
              </>
            )}
          </button>

          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  {t('editor.ai_copilot.pick_continuation')}
                </p>
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleInsertSuggestion(suggestion)}
                    className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 transition-all group"
                  >
                    <p className="text-sm text-gray-300 line-clamp-3 group-hover:text-white">
                      {suggestion}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle className="w-3 h-3" />
                      {t('editor.ai_copilot.click_to_insert')}
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {!suggestions.length && !loadingSuggestions && (
            <div className="text-center py-4 text-gray-500 text-sm">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{t('editor.ai_copilot.get_suggestions')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quality Analysis */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-semibold text-gray-300">{t('editor.ai_copilot.quality_analysis')}</h2>
        </div>

        <div className="card p-4 space-y-4">
          <button
            onClick={handleAnalyze}
            disabled={loadingAnalysis}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            {loadingAnalysis ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('editor.ai_copilot.analyzing')}
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                {t('editor.ai_copilot.analyze_chapter')}
              </>
            )}
          </button>

          {analysis ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Circular Score */}
              <div className="flex flex-col items-center py-4">
                <div className="relative w-32 h-32">
                  {/* Background circle */}
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-700"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#scoreGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 56 * (1 - analysis.overallScore / 100)
                      }`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop
                          offset="0%"
                          className={`${getProgressColor(analysis.overallScore)}`}
                          style={{ stopColor: 'currentColor' }}
                        />
                        <stop
                          offset="100%"
                          className={`${getProgressColor(analysis.overallScore)}`}
                          style={{ stopColor: 'currentColor' }}
                        />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Score text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                      {analysis.overallScore}
                    </span>
                    <span className="text-xs text-gray-400">/ 100</span>
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < analysis.rating
                            ? 'text-yellow-400 text-lg'
                            : 'text-gray-600 text-lg'
                        }
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <p className={`text-sm font-semibold mt-1 ${getScoreColor(analysis.overallScore)}`}>
                    {analysis.ratingLabel}
                  </p>
                </div>
              </div>

              {/* Single actionable tip — most useful feedback only */}
              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {analysis.feedback ||
                      (analysis.suggestions && analysis.suggestions[0]) ||
                      t('editor.ai_copilot.great_writing')}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{t('editor.ai_copilot.analyze_placeholder')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
