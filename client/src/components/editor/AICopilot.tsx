import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BarChart3, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [analysis, setAnalysis] = useState<QualityAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const handleGetSuggestions = async () => {
    if (!currentText || currentText.length < 50) {
      toast.error('Write at least 50 characters to get suggestions');
      return;
    }

    setLoadingSuggestions(true);
    try {
      const result = await getAiSuggestions({
        currentText,
        genre,
        context: {
          bookTitle,
          chapterTitle,
        },
      });
      setSuggestions(result.suggestions);
      toast.success('Got 3 suggestions for you!');
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      toast.error('Failed to get suggestions. Please try again.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAnalyze = async () => {
    if (!currentText || currentText.length < 100) {
      toast.error('Write at least 100 characters to analyze');
      return;
    }

    setLoadingAnalysis(true);
    try {
      const result = await getQualityAnalysis({ text: currentText });
      setAnalysis(result);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Failed to analyze:', error);
      toast.error('Failed to analyze text. Please try again.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleInsertSuggestion = (suggestion: string) => {
    onInsertText('\n\n' + suggestion);
    toast.success('Suggestion inserted!');
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
          <h2 className="text-sm font-semibold text-gray-300">AI CO-PILOT</h2>
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
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Inspire Me
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
                  Pick a continuation:
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
                      Click to insert
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {!suggestions.length && !loadingSuggestions && (
            <div className="text-center py-4 text-gray-500 text-sm">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Get AI suggestions to continue your story</p>
            </div>
          )}
        </div>
      </div>

      {/* Quality Analysis */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-semibold text-gray-300">QUALITY ANALYSIS</h2>
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
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                Analyze Chapter
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

              {/* Score Breakdown */}
              <div className="space-y-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Breakdown:</p>
                {Object.entries(analysis.scores).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-xs text-gray-300">{value}/100</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className={`h-full bg-gradient-to-r ${getProgressColor(value)}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Feedback */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">{analysis.feedback}</p>
                </div>
              </div>

              {/* Suggestions */}
              {analysis.suggestions && analysis.suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Improvement Tips:
                  </p>
                  <ul className="space-y-1">
                    {analysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-xs text-gray-400 flex items-start gap-2">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Analyze your chapter to see quality scores</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
