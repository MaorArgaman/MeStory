/**
 * AIHelpMenu — "Help me write" floating menu for non-writers.
 * Shows 5 clear, Hebrew-friendly options instead of technical AI jargon.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageCircle, Wand2, ArrowRight, PenTool, Eye, Loader2, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface AIHelpMenuProps {
  onAction: (action: string, context?: string) => void;
  isLoading?: boolean;
  hasContent: boolean; // Does the editor have text?
}

const ACTIONS_HE = [
  {
    id: 'start',
    icon: MessageCircle,
    label: 'עזור לי להתחיל',
    description: 'אני לא יודע מאיפה להתחיל — תכתוב לי פסקת פתיחה',
    color: 'from-blue-500 to-indigo-600',
    requiresContent: false,
  },
  {
    id: 'continue',
    icon: ArrowRight,
    label: 'תמשיך את הסיפור',
    description: 'קח את מה שכתבתי ותמשיך מאיפה שעצרתי',
    color: 'from-emerald-500 to-teal-600',
    requiresContent: true,
  },
  {
    id: 'improve',
    icon: Wand2,
    label: 'תשפר את מה שכתבתי',
    description: 'תהפוך את הטקסט ליותר ספרותי ויפה',
    color: 'from-purple-500 to-violet-600',
    requiresContent: true,
  },
  {
    id: 'sensory',
    icon: Eye,
    label: 'תוסיף עומק ופרטים',
    description: 'תוסיף ריחות, צלילים, רגשות — תגרום לקורא להרגיש שם',
    color: 'from-amber-500 to-orange-600',
    requiresContent: true,
  },
  {
    id: 'rephrase',
    icon: PenTool,
    label: 'יש לי רעיון, תעזור לנסח',
    description: 'ספר בקצרה מה אתה רוצה לכתוב ואני אנסח',
    color: 'from-rose-500 to-pink-600',
    requiresContent: false,
  },
];

const ACTIONS_EN = [
  {
    id: 'start',
    icon: MessageCircle,
    label: 'Help me start',
    description: "I don't know where to begin — write an opening paragraph",
    color: 'from-blue-500 to-indigo-600',
    requiresContent: false,
  },
  {
    id: 'continue',
    icon: ArrowRight,
    label: 'Continue the story',
    description: 'Pick up where I left off and keep writing',
    color: 'from-emerald-500 to-teal-600',
    requiresContent: true,
  },
  {
    id: 'improve',
    icon: Wand2,
    label: 'Improve my writing',
    description: 'Make the text more literary and polished',
    color: 'from-purple-500 to-violet-600',
    requiresContent: true,
  },
  {
    id: 'sensory',
    icon: Eye,
    label: 'Add depth and details',
    description: 'Add smells, sounds, emotions — make the reader feel it',
    color: 'from-amber-500 to-orange-600',
    requiresContent: true,
  },
  {
    id: 'rephrase',
    icon: PenTool,
    label: 'I have an idea, help me write it',
    description: 'Briefly tell me what you want to say and I\'ll draft it',
    color: 'from-rose-500 to-pink-600',
    requiresContent: false,
  },
];

export default function AIHelpMenu({ onAction, isLoading, hasContent }: AIHelpMenuProps) {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const actions = isHebrew ? ACTIONS_HE : ACTIONS_EN;
  const [isOpen, setIsOpen] = useState(false);
  const [rephraseInput, setRephraseInput] = useState('');
  const [showRephraseInput, setShowRephraseInput] = useState(false);

  const handleAction = (actionId: string) => {
    if (actionId === 'rephrase') {
      setShowRephraseInput(true);
      return;
    }
    onAction(actionId);
    setIsOpen(false);
  };

  const handleRephraseSubmit = () => {
    if (rephraseInput.trim()) {
      onAction('rephrase', rephraseInput.trim());
      setRephraseInput('');
      setShowRephraseInput(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg ${
          isOpen
            ? 'bg-indigo-600 text-white shadow-indigo-500/30'
            : 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-200 hover:from-indigo-500/30 hover:to-purple-500/30'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {isHebrew ? 'עזור לי' : 'Help me'}
      </motion.button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute bottom-full mb-2 w-80 glass-strong rounded-xl p-3 shadow-2xl border border-white/10 z-50"
            style={{ [isHebrew ? 'right' : 'left']: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                {isHebrew ? 'איך אני יכול לעזור?' : 'How can I help?'}
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            {/* Rephrase input mode */}
            {showRephraseInput ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 px-1">
                  {isHebrew ? 'ספר בכמה מילים מה אתה רוצה לכתוב:' : 'Briefly describe what you want to write:'}
                </p>
                <textarea
                  value={rephraseInput}
                  onChange={(e) => setRephraseInput(e.target.value)}
                  placeholder={isHebrew ? 'למשל: אני רוצה לספר על היום שאבא לקח אותי לים בפעם הראשונה...' : 'e.g.: I want to tell about the day my dad took me to the beach for the first time...'}
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-gray-500 resize-none focus:border-indigo-500/50 focus:outline-none"
                  dir={isHebrew ? 'rtl' : 'ltr'}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRephraseInput(false)}
                    className="flex-1 py-2 text-sm text-gray-400 hover:bg-white/5 rounded-lg transition"
                  >
                    {isHebrew ? 'חזור' : 'Back'}
                  </button>
                  <button
                    onClick={handleRephraseSubmit}
                    disabled={!rephraseInput.trim() || isLoading}
                    className="flex-1 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      isHebrew ? 'כתוב לי' : 'Write for me'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Action buttons */
              <div className="space-y-1.5">
                {actions.map((action) => {
                  const Icon = action.icon;
                  const disabled = action.requiresContent && !hasContent;

                  return (
                    <button
                      key={action.id}
                      onClick={() => handleAction(action.id)}
                      disabled={disabled || isLoading}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg text-right transition-all ${
                        disabled
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-white/5 active:bg-white/10'
                      }`}
                      dir={isHebrew ? 'rtl' : 'ltr'}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{action.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{action.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
