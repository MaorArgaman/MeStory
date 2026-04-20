/**
 * First-time Onboarding Modal
 * 3-step welcome flow for new users
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { BookOpen, Mic, Users, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';

const ONBOARDING_KEY = 'mestory-onboarding-complete';

interface OnboardingModalProps {
  onComplete: () => void;
}

interface Step {
  titleHe: string;
  titleEn: string;
  descHe: string;
  descEn: string;
  icon: React.ReactNode;
  gradient: string;
}

const steps: Step[] = [
  {
    titleHe: 'ברוכים הבאים ל-MeStory!',
    titleEn: 'Welcome to MeStory!',
    descHe: 'הפלטפורמה שמאפשרת לכם לכתוב, לעצב ולפרסם את הסיפור שלכם, עם עזרת בינה מלאכותית. כאן כל זיכרון הופך לספר שמועבר מדור לדור.',
    descEn: 'The platform that lets you write, design and publish your story, powered by AI. Here every memory becomes a book passed through generations.',
    icon: <Sparkles className="w-12 h-12 text-memorial-gold" />,
    gradient: 'from-memorial-gold/20 to-yellow-600/10',
  },
  {
    titleHe: 'כתיבה בדרך שלך',
    titleEn: 'Write Your Way',
    descHe: 'כתבו ישירות, ספרו בקול, צלמו תמונות ישנות, או ענו על שאלות מנחות. הבינה המלאכותית מלאה תהפוך הכל לספר יפה ומוגמר.',
    descEn: 'Write directly, speak your memories, scan old photos, or answer guiding questions. Our AI will turn everything into a beautiful finished book.',
    icon: (
      <div className="flex gap-3">
        <BookOpen className="w-10 h-10 text-indigo-400" />
        <Mic className="w-10 h-10 text-purple-400" />
      </div>
    ),
    gradient: 'from-indigo-500/20 to-purple-500/10',
  },
  {
    titleHe: 'שתפו ושמרו לנצח',
    titleEn: 'Share & Preserve Forever',
    descHe: 'הדפיסו ספרים אמיתיים, שתפו קישורים עם המשפחה, מכרו בחנות שלנו. הסיפור שלכם ראוי לחיות לנצח.',
    descEn: 'Print real books, share links with family, sell in our marketplace. Your story deserves to live forever.',
    icon: <Users className="w-12 h-12 text-pink-400" />,
    gradient: 'from-pink-500/20 to-rose-500/10',
  },
];

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const { t } = useTranslation('common');
  const { language, isRTL } = useLanguage();

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const goNext = () => {
    if (animating) return;
    if (isLast) {
      handleComplete();
      return;
    }
    setAnimating(true);
    setCurrentStep(prev => prev + 1);
    setTimeout(() => setAnimating(false), 300);
  };

  const goPrev = () => {
    if (animating || currentStep === 0) return;
    setAnimating(true);
    setCurrentStep(prev => prev - 1);
    setTimeout(() => setAnimating(false), 300);
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  const title = language === 'he' ? step.titleHe : step.titleEn;
  const desc = language === 'he' ? step.descHe : step.descEn;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative w-full max-w-lg bg-gradient-to-br from-[#0d0d1f] to-[#0a0a18] rounded-2xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden"
      >
        {/* Skip button */}
        <button
          onClick={handleComplete}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
          aria-label="Skip onboarding"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 pt-6 pb-2">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === currentStep ? 24 : 8 }}
              transition={{ duration: 0.3 }}
              className={`h-2 rounded-full transition-colors ${
                i === currentStep
                  ? 'bg-memorial-gold'
                  : i < currentStep
                  ? 'bg-memorial-gold/40'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 30 : -30 }}
            transition={{ duration: 0.25 }}
            className={`px-8 py-6 text-center bg-gradient-to-b ${step.gradient} to-transparent`}
          >
            {/* Icon */}
            <div className="flex justify-center mb-6 mt-2">
              <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                {step.icon}
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>

            {/* Description */}
            <p className="text-gray-300 leading-relaxed text-base">{desc}</p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="px-8 pb-8 pt-4 flex items-center justify-between gap-4">
          {/* Back button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={goPrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-0 disabled:pointer-events-none"
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {t('common.back', 'חזרה')}
          </motion.button>

          {/* Step counter */}
          <span className="text-xs text-gray-500">
            {currentStep + 1} / {steps.length}
          </span>

          {/* Next / Finish button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={goNext}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-memorial-gold to-yellow-500 text-deep-space hover:shadow-glow-gold transition-all"
          >
            {isLast
              ? (language === 'he' ? 'בואו נתחיל!' : "Let's Start!")
              : (language === 'he' ? 'המשך' : 'Next')}
            {!isLast && (isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Hook to manage onboarding state.
 * Returns true if onboarding should be shown.
 */
export function useOnboarding(isNewUser: boolean): {
  showOnboarding: boolean;
  completeOnboarding: () => void;
} {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isNewUser && !localStorage.getItem(ONBOARDING_KEY)) {
      // Small delay so the dashboard renders first
      const timer = setTimeout(() => setShowOnboarding(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isNewUser]);

  const completeOnboarding = () => setShowOnboarding(false);

  return { showOnboarding, completeOnboarding };
}
