/**
 * TensionArcChart Component
 * Visual tension arc chart using Recharts
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  Loader2,
  RefreshCw,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { TensionAnalysis, ChapterTension } from '../../types/analysis';
import { analyzeTension } from '../../services/analysisApi';

interface TensionArcChartProps {
  bookId: string;
  chapterCount: number;
  currentChapterIndex?: number;
  onChapterClick?: (index: number) => void;
}

const arcLabels: Record<string, string> = {
  classic: 'קלאסי',
  episodic: 'אפיזודי',
  building: 'בונה',
  flat: 'שטוח',
  irregular: 'לא סדיר',
};

const typeColors: Record<string, string> = {
  rising: '#22c55e',
  falling: '#ef4444',
  peak: '#f59e0b',
  valley: '#3b82f6',
  stable: '#6b7280',
};

export default function TensionArcChart({
  bookId,
  chapterCount,
  currentChapterIndex,
  onChapterClick,
}: TensionArcChartProps) {
  const [analysis, setAnalysis] = useState<TensionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    if (chapterCount === 0) return;

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeTension(bookId);
      setAnalysis(result);
    } catch (err) {
      console.error('Failed to analyze tension:', err);
      setError('שגיאה בניתוח רמות המתח');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookId && chapterCount > 0) {
      fetchAnalysis();
    }
  }, [bookId, chapterCount]);

  // Prepare chart data
  const chartData = analysis?.chapters.map((ch) => ({
    name: `פרק ${ch.chapterIndex + 1}`,
    shortName: `${ch.chapterIndex + 1}`,
    tension: ch.tensionLevel,
    type: ch.type,
    title: ch.title,
    chapterIndex: ch.chapterIndex,
    color: typeColors[ch.type] || '#6b7280',
  })) || [];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-white/20 rounded-lg p-3 shadow-xl" dir="rtl">
          <p className="text-white font-medium text-sm">{data.title}</p>
          <p className="text-gray-400 text-xs">פרק {data.chapterIndex + 1}</p>
          <div className="mt-2 flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-white text-sm">מתח: {data.tension}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Handle chart click
  const handleChartClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.chapterIndex !== undefined) {
      onChapterClick?.(data.activePayload[0].payload.chapterIndex);
    }
  };

  if (chapterCount === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm" dir="rtl">
        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>כתוב לפחות פרק אחד כדי לראות את עקומת המתח</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-400" />
          עקומת מתח
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
          <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Chart */}
      {analysis && chartData.length > 0 && (
        <div className="space-y-4">
          {/* Arc Type Badge */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
            <span className="text-xs text-gray-400">סוג עקומה:</span>
            <span className="text-xs font-medium text-orange-400">
              {arcLabels[analysis.overallArc] || analysis.overallArc}
            </span>
          </div>

          {/* Chart Container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-48 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={handleChartClick}
              >
                <defs>
                  <linearGradient id="tensionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="shortName"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                  ticks={[0, 25, 50, 75, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                {currentChapterIndex !== undefined && (
                  <ReferenceLine
                    x={`${currentChapterIndex + 1}`}
                    stroke="#6366f1"
                    strokeDasharray="3 3"
                    strokeWidth={2}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="tension"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#tensionGradient)"
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const isCurrentChapter = payload.chapterIndex === currentChapterIndex;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isCurrentChapter ? 6 : 4}
                        fill={isCurrentChapter ? '#6366f1' : payload.color}
                        stroke={isCurrentChapter ? '#fff' : 'none'}
                        strokeWidth={2}
                        style={{ cursor: 'pointer' }}
                      />
                    );
                  }}
                  activeDot={{
                    r: 6,
                    fill: '#f59e0b',
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center">
            {Object.entries(typeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-400">
                  {type === 'rising' && 'עולה'}
                  {type === 'falling' && 'יורד'}
                  {type === 'peak' && 'שיא'}
                  {type === 'valley' && 'שפל'}
                  {type === 'stable' && 'יציב'}
                </span>
              </div>
            ))}
          </div>

          {/* Click hint */}
          <p className="text-xs text-gray-500 text-center">
            לחץ על נקודה לניווט לפרק
          </p>

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <p className="text-xs font-medium text-orange-300 mb-2">הצעות לשיפור:</p>
              <ul className="text-xs text-gray-300 space-y-1">
                {analysis.suggestions.map((sug, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-orange-400">•</span>
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
