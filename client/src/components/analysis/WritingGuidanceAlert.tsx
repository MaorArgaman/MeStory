/**
 * WritingGuidanceAlert Component
 * Real-time writing guidance notifications
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Info,
  Lightbulb,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { WritingGuidance } from '../../types/analysis';

interface WritingGuidanceAlertProps {
  guidance: WritingGuidance | null;
  onDismiss: () => void;
  onApplySuggestion?: (suggestion: string, insertable?: string) => void;
}

const typeConfig = {
  deviation: {
    icon: AlertCircle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'Topic Deviation',
  },
  structure: {
    icon: Info,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    label: 'Structure',
  },
  tension: {
    icon: Sparkles,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    label: 'Tension',
  },
  character: {
    icon: Info,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    label: 'Character',
  },
  pacing: {
    icon: Info,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    label: 'Pacing',
  },
  theme: {
    icon: Lightbulb,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    label: 'Theme',
  },
};

const severityConfig = {
  info: {
    icon: Info,
    textColor: 'text-blue-300',
  },
  warning: {
    icon: AlertCircle,
    textColor: 'text-yellow-300',
  },
  suggestion: {
    icon: Lightbulb,
    textColor: 'text-green-300',
  },
};

export default function WritingGuidanceAlert({
  guidance,
  onDismiss,
  onApplySuggestion,
}: WritingGuidanceAlertProps) {
  if (!guidance) return null;

  const config = typeConfig[guidance.type] || typeConfig.structure;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`
          ${config.bgColor} ${config.borderColor}
          border rounded-xl p-4 shadow-lg backdrop-blur-sm
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium ${config.color} px-2 py-0.5 rounded-full ${config.bgColor} border ${config.borderColor}`}>
                  {config.label}
                </span>
                <span className={`text-xs ${severityConfig[guidance.severity].textColor}`}>
                  {guidance.severity === 'warning' && '⚠️'}
                  {guidance.severity === 'info' && 'ℹ️'}
                  {guidance.severity === 'suggestion' && '💡'}
                </span>
              </div>
              <p className="text-sm text-white">{guidance.message}</p>
              {guidance.context && (
                <p className="text-xs text-gray-400 mt-1">{guidance.context}</p>
              )}
            </div>
          </div>
          {guidance.dismissible && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Suggestions */}
        {guidance.suggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            {guidance.suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => onApplySuggestion?.(suggestion.text, suggestion.insertable)}
                className={`
                  w-full p-2 rounded-lg text-right
                  ${config.bgColor} hover:bg-white/10
                  border ${config.borderColor}
                  transition-colors group
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${config.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <span className="text-xs text-gray-300">{suggestion.text}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </div>
                {suggestion.insertable && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    Insert: "{suggestion.insertable.slice(0, 50)}..."
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook for writing guidance
 * Monitors editor content and checks for guidance
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { checkWritingGuidance } from '../../services/analysisApi';

export function useWritingGuidance(
  bookId: string | undefined,
  chapterIndex: number,
  content: string,
  enabled: boolean = true
) {
  const [guidance, setGuidance] = useState<WritingGuidance | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const lastCheckedRef = useRef<string>('');
  const dismissedRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout>();

  const checkGuidance = useCallback(async () => {
    if (!bookId || !content || content.length < 100) {
      return;
    }

    // Get last 500 characters
    const recentText = content.slice(-500);

    // Skip if already checked this text
    if (lastCheckedRef.current === recentText) {
      return;
    }

    setIsChecking(true);
    try {
      const result = await checkWritingGuidance(bookId, chapterIndex, recentText);
      lastCheckedRef.current = recentText;

      // Skip if dismissed
      if (result && !dismissedRef.current.has(result.message)) {
        setGuidance(result);
      }
    } catch (error) {
      console.error('Failed to check guidance:', error);
    } finally {
      setIsChecking(false);
    }
  }, [bookId, chapterIndex, content]);

  // Debounced check on content change
  useEffect(() => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check every 30 seconds or 500 characters
    timeoutRef.current = setTimeout(() => {
      checkGuidance();
    }, 30000);

    // Also check on significant content changes
    const contentLength = content.length;
    const lastLength = lastCheckedRef.current.length;
    if (contentLength - lastLength >= 500) {
      checkGuidance();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, enabled, checkGuidance]);

  const dismiss = useCallback(() => {
    if (guidance) {
      dismissedRef.current.add(guidance.message);
    }
    setGuidance(null);
  }, [guidance]);

  const refresh = useCallback(() => {
    lastCheckedRef.current = '';
    checkGuidance();
  }, [checkGuidance]);

  return {
    guidance,
    isChecking,
    dismiss,
    refresh,
  };
}
