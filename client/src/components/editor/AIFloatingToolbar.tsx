/**
 * AIFloatingToolbar Component
 * Floating AI toolbar that appears on text selection
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, Minus, PlayCircle, Loader2, Check, X } from 'lucide-react';
import { Editor } from '@tiptap/react';
import { EnhanceAction } from '../../types/analysis';
import { useLanguage } from '../../contexts/LanguageContext';

interface AIFloatingToolbarProps {
  editor: Editor;
  onEnhance: (action: EnhanceAction, selectedText: string) => Promise<void>;
  isLoading: boolean;
  loadingAction: EnhanceAction | null;
}

interface ActionButton {
  action: EnhanceAction;
  icon: React.ReactNode;
  labelEn: string;
  labelHe: string;
  descriptionEn: string;
  descriptionHe: string;
}

const actions: ActionButton[] = [
  {
    action: 'continue',
    icon: <PlayCircle className="w-4 h-4" />,
    labelEn: 'Continue',
    labelHe: 'המשך',
    descriptionEn: 'Continue writing from here',
    descriptionHe: 'המשך לכתוב מכאן',
  },
  {
    action: 'shorten',
    icon: <Minus className="w-4 h-4" />,
    labelEn: 'Shorten',
    labelHe: 'קצר',
    descriptionEn: 'Condense while preserving meaning',
    descriptionHe: 'קצר תוך שמירה על המשמעות',
  },
  {
    action: 'expand',
    icon: <Plus className="w-4 h-4" />,
    labelEn: 'Expand',
    labelHe: 'הרחב',
    descriptionEn: 'Add details and descriptions',
    descriptionHe: 'הוסף פרטים ותיאורים',
  },
  {
    action: 'improve',
    icon: <Sparkles className="w-4 h-4" />,
    labelEn: 'Improve',
    labelHe: 'שפר',
    descriptionEn: 'Enhance expression and clarity',
    descriptionHe: 'שפר את הביטוי והבהירות',
  },
];

export default function AIFloatingToolbar({
  editor,
  onEnhance,
  isLoading,
  loadingAction,
}: AIFloatingToolbarProps) {
  const [hoveredAction, setHoveredAction] = useState<EnhanceAction | null>(null);
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  const handleAction = (action: EnhanceAction) => {
    if (isLoading) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    if (selectedText.trim().length < 5) {
      return; // Don't process very short selections
    }

    onEnhance(action, selectedText);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-0.5 sm:gap-1 p-1 sm:p-1.5 rounded-xl bg-deep-space/95 backdrop-blur-md border border-white/20 shadow-xl shadow-black/20 max-w-[calc(100vw-16px)] overflow-x-auto"
    >
      {/* AI Badge - hidden on very small screens to make room for actions */}
      <div className="hidden xs:flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 mr-0.5 sm:mr-1 flex-shrink-0">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span className="text-[10px] sm:text-xs font-medium text-indigo-300">AI</span>
      </div>

      {/* Divider */}
      <div className="hidden xs:block w-px h-6 bg-white/10 flex-shrink-0" />

      {/* Action Buttons */}
      {actions.map((action) => (
        <div key={action.action} className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAction(action.action)}
            onMouseEnter={() => setHoveredAction(action.action)}
            onMouseLeave={() => setHoveredAction(null)}
            disabled={isLoading}
            aria-label={isHebrew ? action.labelHe : action.labelEn}
            className={`
              flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 rounded-lg transition-all duration-200 touch-manipulation flex-shrink-0
              ${
                isLoading && loadingAction === action.action
                  ? 'bg-indigo-500/30 text-indigo-300'
                  : 'hover:bg-white/10 active:bg-white/20 text-gray-300 hover:text-white'
              }
              disabled:cursor-not-allowed
            `}
          >
            {isLoading && loadingAction === action.action ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              action.icon
            )}
            {/* Hide labels on smallest screens; show on sm+ */}
            <span className="hidden sm:inline text-sm font-medium whitespace-nowrap">{isHebrew ? action.labelHe : action.labelEn}</span>
          </motion.button>

          {/* Tooltip */}
          <AnimatePresence>
            {hoveredAction === action.action && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full right-0 mt-2 px-3 py-2 rounded-lg bg-gray-800 border border-white/10 shadow-lg whitespace-nowrap z-50"
              >
                <p className="text-xs text-gray-300">{isHebrew ? action.descriptionHe : action.descriptionEn}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </motion.div>
  );
}

/**
 * Preview Modal for AI enhancement results
 */
interface AIEnhancePreviewProps {
  isOpen: boolean;
  originalText: string;
  enhancedText: string;
  explanation: string;
  action: EnhanceAction;
  onApply: () => void;
  onCancel: () => void;
  isApplying: boolean;
}

export function AIEnhancePreview({
  isOpen,
  originalText,
  enhancedText,
  explanation,
  action,
  onApply,
  onCancel,
  isApplying,
}: AIEnhancePreviewProps) {
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  if (!isOpen) return null;

  const actionLabels: Record<EnhanceAction, { en: string; he: string }> = {
    improve: { en: 'Improvement', he: 'שיפור' },
    expand: { en: 'Expansion', he: 'הרחבה' },
    shorten: { en: 'Shortening', he: 'קיצור' },
    continue: { en: 'Continuation', he: 'המשך' },
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-deep-space/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
          dir={isHebrew ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {isHebrew ? 'תצוגה מקדימה' : 'Preview'} - {isHebrew ? actionLabels[action].he : actionLabels[action].en}
                </h3>
                <p className="text-sm text-gray-400">{explanation}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Original Text */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">
                {isHebrew ? 'טקסט מקורי' : 'Original Text'}
              </label>
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-gray-300 text-sm leading-relaxed">
                {originalText}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <span className="text-gray-500">↓</span>
              </div>
            </div>

            {/* Enhanced Text */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">
                {isHebrew ? 'טקסט משופר' : 'Enhanced Text'}
              </label>
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-white text-sm leading-relaxed">
                {enhancedText}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
            >
              {isHebrew ? 'ביטול' : 'Cancel'}
            </button>
            <button
              onClick={onApply}
              disabled={isApplying}
              className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isApplying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isHebrew ? 'החל שינויים' : 'Apply Changes'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
