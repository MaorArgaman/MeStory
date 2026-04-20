/**
 * BookGeneratingScreen
 * Full-screen animated overlay shown while AI generates a complete book.
 * Shows progress steps with a book-building animation.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, FileText, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface BookGeneratingScreenProps {
  isVisible: boolean;
  currentStep: string;
  progress: number;
  onComplete?: () => void;
}

// Only the steps that actually run — we build the foundation (no chapter/cover/image generation here)
const STEPS_HE = [
  { icon: Sparkles, label: 'מסכם את הראיון...' },
  { icon: FileText, label: 'שומר את תשתית הספר...' },
  { icon: Check, label: 'התשתית מוכנה — ממשיכים לכתיבה!' },
];

const STEPS_EN = [
  { icon: Sparkles, label: 'Summarizing the interview...' },
  { icon: FileText, label: 'Saving book foundation...' },
  { icon: Check, label: 'Foundation ready — on to writing!' },
];

export default function BookGeneratingScreen({ isVisible, currentStep, progress, onComplete }: BookGeneratingScreenProps) {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const steps = isHebrew ? STEPS_HE : STEPS_EN;
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Track completed steps based on progress
  useEffect(() => {
    const stepIndex = Math.floor((progress / 100) * steps.length);
    const newCompleted = Array.from({ length: stepIndex }, (_, i) => i);
    setCompletedSteps(newCompleted);
  }, [progress, steps.length]);

  useEffect(() => {
    if (progress >= 100 && onComplete) {
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  if (!isVisible) return null;

  const currentStepIndex = Math.min(
    Math.floor((progress / 100) * steps.length),
    steps.length - 1
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-deep-space/95 backdrop-blur-xl"
      >
        <div className="text-center max-w-lg px-6">
          {/* Animated book icon */}
          <motion.div
            animate={{
              rotateY: [0, 10, -10, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-memorial-gold to-yellow-600 flex items-center justify-center shadow-glow-gold"
          >
            <BookOpen className="w-12 h-12 text-deep-space" />
          </motion.div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {isHebrew ? 'בונים את התשתית לספר שלך' : 'Building Your Book Foundation'}
          </h2>
          <p className="text-gray-400 mb-8">
            {isHebrew ? 'שומר את הסיכום מהראיון. בעוד רגע נמשיך לכתיבה.' : 'Saving the interview summary. We\'ll continue to writing in a moment.'}
          </p>

          {/* Current step label */}
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-memorial-gold text-lg font-medium mb-6"
          >
            {currentStep || steps[currentStepIndex]?.label}
          </motion.p>

          {/* Progress bar */}
          <div className="w-full h-2 bg-white/10 rounded-full mb-8 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-memorial-gold to-yellow-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Steps list */}
          <div className="space-y-3" dir={isHebrew ? 'rtl' : 'ltr'}>
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isCompleted = completedSteps.includes(idx);
              const isCurrent = idx === currentStepIndex;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: isHebrew ? 20 : -20 }}
                  animate={{ opacity: idx <= currentStepIndex ? 1 : 0.3, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex items-center gap-3 text-sm ${
                    isCompleted ? 'text-green-400' :
                    isCurrent ? 'text-memorial-gold' :
                    'text-gray-500'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted ? 'bg-green-500/20' :
                    isCurrent ? 'bg-memorial-gold/20' :
                    'bg-white/5'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>
                  <span>{step.label}</span>
                </motion.div>
              );
            })}
          </div>

          {/* Progress percentage */}
          <p className="text-gray-500 text-sm mt-6">{Math.round(progress)}%</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
