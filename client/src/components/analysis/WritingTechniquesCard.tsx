/**
 * WritingTechniquesCard Component
 * Dashboard for writing techniques scores
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenTool,
  Loader2,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { TechniquesAnalysis, TechniqueScore } from '../../types/analysis';
import { analyzeWritingTechniques } from '../../services/analysisApi';

interface WritingTechniquesCardProps {
  bookId: string;
  chapterCount: number;
}

const techniqueLabels: Record<string, { name: string; icon: string }> = {
  tensionCreation: { name: 'Tension Creation', icon: '⚡' },
  problemResolution: { name: 'Problem Resolution', icon: '🎯' },
  characterDevelopment: { name: 'Character Development', icon: '👤' },
  motifsThemes: { name: 'Motifs & Themes', icon: '🔄' },
  dialogueQuality: { name: 'Dialogue Quality', icon: '💬' },
  pacing: { name: 'Pacing', icon: '⏱️' },
};

export default function WritingTechniquesCard({
  bookId,
  chapterCount,
}: WritingTechniquesCardProps) {
  const [analysis, setAnalysis] = useState<TechniquesAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    if (chapterCount === 0) return;

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeWritingTechniques(bookId);
      setAnalysis(result);
    } catch (err) {
      console.error('Failed to analyze techniques:', err);
      setError('Error analyzing writing techniques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookId && chapterCount > 0) {
      fetchAnalysis();
    }
  }, [bookId, chapterCount]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-blue-500 to-cyan-500';
    if (score >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-3 h-3 text-green-400" />;
      case 'declining':
        return <TrendingDown className="w-3 h-3 text-red-400" />;
      default:
        return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'improving': return 'Improving';
      case 'declining': return 'Declining';
      default: return 'Stable';
    }
  };

  if (chapterCount === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        <PenTool className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Write at least one chapter to analyze writing techniques</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <PenTool className="w-4 h-4 text-purple-400" />
          Writing Techniques
        </h3>
        <button
          onClick={fetchAnalysis}
          disabled={loading}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading State */}
      {loading && !analysis && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Analysis Content */}
      {analysis && (
        <div className="space-y-4">
          {/* Overall Score */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Overall Score</span>
              <span className={`text-2xl font-bold ${
                analysis.overallScore >= 80 ? 'text-green-400' :
                analysis.overallScore >= 60 ? 'text-blue-400' :
                analysis.overallScore >= 40 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {analysis.overallScore}
              </span>
            </div>
            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analysis.overallScore}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full bg-gradient-to-r ${getScoreColor(analysis.overallScore)}`}
              />
            </div>
          </div>

          {/* Techniques List */}
          <div className="space-y-2">
            {(Object.entries(analysis.techniques) as [string, TechniqueScore][]).map(([key, technique]) => {
              const label = techniqueLabels[key];
              if (!label) return null;

              const isExpanded = expandedTechnique === key;

              return (
                <div key={key} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                  {/* Header */}
                  <button
                    onClick={() => setExpandedTechnique(isExpanded ? null : key)}
                    className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{label.icon}</span>
                      <span className="text-sm text-gray-300">{label.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {getTrendIcon(technique.trend)}
                        <span className="text-xs text-gray-500">{getTrendLabel(technique.trend)}</span>
                      </div>
                      <span className={`text-sm font-medium ${
                        technique.score >= 80 ? 'text-green-400' :
                        technique.score >= 60 ? 'text-blue-400' :
                        technique.score >= 40 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {technique.score}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Progress Bar */}
                  <div className="px-3 pb-2">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${technique.score}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full bg-gradient-to-r ${getScoreColor(technique.score)}`}
                      />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/10"
                      >
                        <div className="p-3 space-y-3">
                          {/* Examples */}
                          {technique.examples.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-400 mb-2">Examples from text:</p>
                              <div className="space-y-2">
                                {technique.examples.slice(0, 2).map((ex, idx) => (
                                  <div
                                    key={idx}
                                    className={`p-2 rounded-lg text-xs ${
                                      ex.quality === 'excellent' ? 'bg-green-500/10 border border-green-500/20' :
                                      ex.quality === 'good' ? 'bg-blue-500/10 border border-blue-500/20' :
                                      'bg-yellow-500/10 border border-yellow-500/20'
                                    }`}
                                  >
                                    <p className="text-gray-300 italic">"{ex.excerpt}"</p>
                                    <p className="text-gray-500 mt-1">Chapter {ex.chapterIndex + 1} - {ex.analysis}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Suggestions */}
                          {technique.suggestions.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Improvement suggestions:</p>
                              <ul className="text-xs text-gray-300 space-y-0.5">
                                {technique.suggestions.map((sug, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span className="text-purple-400">•</span>
                                    {sug}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* General Improvements */}
          {analysis.improvements.length > 0 && (
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <p className="text-xs font-medium text-purple-300 mb-2">General Suggestions:</p>
              <ul className="text-xs text-gray-300 space-y-1">
                {analysis.improvements.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-purple-400">•</span>
                    {imp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
