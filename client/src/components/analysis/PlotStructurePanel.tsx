/**
 * PlotStructurePanel Component
 * Visual representation of book three-act structure
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Target,
} from 'lucide-react';
import { PlotAnalysis } from '../../types/analysis';
import { analyzePlotStructure } from '../../services/analysisApi';

interface PlotStructurePanelProps {
  bookId: string;
  chapterCount: number;
  onChapterClick?: (index: number) => void;
}

const actLabels = {
  act1: { name: 'התחלה', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30' },
  act2: { name: 'אמצע', color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30' },
  act3: { name: 'סוף', color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30' },
};

export default function PlotStructurePanel({
  bookId,
  chapterCount,
  onChapterClick,
}: PlotStructurePanelProps) {
  const [analysis, setAnalysis] = useState<PlotAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAct, setExpandedAct] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    if (chapterCount === 0) return;

    setLoading(true);
    setError(null);

    try {
      const result = await analyzePlotStructure(bookId);
      setAnalysis(result);
    } catch (err) {
      console.error('Failed to analyze plot:', err);
      setError('שגיאה בניתוח מבנה העלילה');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookId && chapterCount > 0) {
      fetchAnalysis();
    }
  }, [bookId, chapterCount]);

  const getBalanceLabel = (balance: string) => {
    switch (balance) {
      case 'balanced': return 'מאוזן';
      case 'front-heavy': return 'כבד בהתחלה';
      case 'back-heavy': return 'כבד בסוף';
      case 'middle-heavy': return 'כבד באמצע';
      default: return balance;
    }
  };

  const getBalanceColor = (balance: string) => {
    return balance === 'balanced' ? 'text-green-400' : 'text-yellow-400';
  };

  if (chapterCount === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm" dir="rtl">
        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>כתוב לפחות פרק אחד כדי לנתח את מבנה העלילה</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-400" />
          מבנה שלושת המערכות
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
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
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
          {/* Three-Act Bar */}
          <div className="space-y-2">
            <div className="flex h-8 rounded-lg overflow-hidden">
              {Object.entries(analysis.threeActStructure).map(([actKey, act]) => (
                <motion.div
                  key={actKey}
                  initial={{ width: 0 }}
                  animate={{ width: `${act.percentage}%` }}
                  transition={{ duration: 0.5 }}
                  className={`relative bg-gradient-to-r ${actLabels[actKey as keyof typeof actLabels].color} cursor-pointer hover:brightness-110 transition-all`}
                  onClick={() => setExpandedAct(expandedAct === actKey ? null : actKey)}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white drop-shadow">
                      {actLabels[actKey as keyof typeof actLabels].name}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Percentage Labels */}
            <div className="flex text-xs text-gray-500">
              {Object.entries(analysis.threeActStructure).map(([actKey, act]) => (
                <div key={actKey} style={{ width: `${act.percentage}%` }} className="text-center">
                  {act.percentage}%
                </div>
              ))}
            </div>
          </div>

          {/* Balance Indicator */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <span className="text-sm text-gray-400">איזון מבנה:</span>
            <span className={`text-sm font-medium ${getBalanceColor(analysis.balance)}`}>
              {getBalanceLabel(analysis.balance)}
              {analysis.balance === 'balanced' && (
                <CheckCircle className="w-4 h-4 inline-block mr-1" />
              )}
            </span>
          </div>

          {/* Act Details (Expandable) */}
          <AnimatePresence>
            {expandedAct && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {Object.entries(analysis.threeActStructure).map(([actKey, act]) => {
                  if (actKey !== expandedAct) return null;
                  const actInfo = actLabels[actKey as keyof typeof actLabels];

                  return (
                    <div
                      key={actKey}
                      className={`p-4 rounded-xl ${actInfo.bgColor} border ${actInfo.borderColor}`}
                    >
                      <h4 className="font-medium text-white mb-3 flex items-center justify-between">
                        {actInfo.name}
                        <button onClick={() => setExpandedAct(null)}>
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        </button>
                      </h4>

                      {/* Chapters */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 mb-1">פרקים:</p>
                        <div className="flex flex-wrap gap-1">
                          {act.chapters.map((chapIdx) => (
                            <button
                              key={chapIdx}
                              onClick={() => onChapterClick?.(chapIdx)}
                              className="px-2 py-0.5 text-xs rounded bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              {chapIdx + 1}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Completeness */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">שלמות:</span>
                          <span className="text-white">{act.completeness}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${act.completeness}%` }}
                            className={`h-full bg-gradient-to-r ${actInfo.color}`}
                          />
                        </div>
                      </div>

                      {/* Elements */}
                      {act.elements.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-400 mb-1">אלמנטים שנמצאו:</p>
                          <ul className="text-xs text-gray-300 space-y-0.5">
                            {act.elements.map((el, idx) => (
                              <li key={idx} className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-400" />
                                {el}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Suggestions */}
                      {act.suggestions.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">הצעות לשיפור:</p>
                          <ul className="text-xs text-gray-300 space-y-0.5">
                            {act.suggestions.map((sug, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-yellow-400">•</span>
                                {sug}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Click hint */}
          {!expandedAct && (
            <p className="text-xs text-gray-500 text-center">
              לחץ על מערכה לפרטים נוספים
            </p>
          )}

          {/* Plot Points */}
          {(analysis.plotPoints.incitingIncident || analysis.plotPoints.midpoint || analysis.plotPoints.climax) && (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
              <p className="text-xs font-medium text-gray-300 mb-2">נקודות עלילה:</p>

              {analysis.plotPoints.incitingIncident && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">אירוע מעורר (פרק {analysis.plotPoints.incitingIncident.chapter + 1})</p>
                    <p className="text-xs text-gray-300">{analysis.plotPoints.incitingIncident.description}</p>
                  </div>
                </div>
              )}

              {analysis.plotPoints.midpoint && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">נקודת אמצע (פרק {analysis.plotPoints.midpoint.chapter + 1})</p>
                    <p className="text-xs text-gray-300">{analysis.plotPoints.midpoint.description}</p>
                  </div>
                </div>
              )}

              {analysis.plotPoints.climax && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">שיא (פרק {analysis.plotPoints.climax.chapter + 1})</p>
                    <p className="text-xs text-gray-300">{analysis.plotPoints.climax.description}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* General Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
              <p className="text-xs font-medium text-indigo-300 mb-2">הצעות כלליות:</p>
              <ul className="text-xs text-gray-300 space-y-1">
                {analysis.suggestions.map((sug, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-indigo-400">•</span>
                    {sug}
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
