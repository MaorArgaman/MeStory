import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PenTool,
  Palette,
  LayoutGrid,
  Send,
  Check,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface BookProgress {
  hasContent: boolean;      // Has at least one chapter with content
  hasDesign: boolean;       // Has cover design
  hasLayout: boolean;       // Has page layout configured
  isPublished: boolean;     // Is published
  wordCount: number;
  chapterCount: number;
}

interface BookProgressStepperProps {
  bookId: string;
  progress: BookProgress;
  currentStep: 'editor' | 'design' | 'layout' | 'publish';
}

export default function BookProgressStepper({ bookId, progress, currentStep }: BookProgressStepperProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  const steps = [
    {
      id: 'editor',
      label: isHebrew ? 'כתיבה' : 'Writing',
      icon: PenTool,
      path: `/editor/${bookId}`,
      completed: progress.hasContent,
      details: progress.hasContent
        ? (isHebrew ? `${progress.wordCount.toLocaleString()} מילים, ${progress.chapterCount} פרקים` : `${progress.wordCount.toLocaleString()} words, ${progress.chapterCount} chapters`)
        : (isHebrew ? 'התחל לכתוב' : 'Start writing'),
    },
    {
      id: 'design',
      label: isHebrew ? 'עיצוב' : 'Design',
      icon: Palette,
      path: `/design/${bookId}`,
      completed: progress.hasDesign,
      details: progress.hasDesign
        ? (isHebrew ? 'כריכה מוכנה' : 'Cover ready')
        : (isHebrew ? 'עצב כריכה' : 'Design cover'),
    },
    {
      id: 'layout',
      label: isHebrew ? 'פריסה' : 'Layout',
      icon: LayoutGrid,
      path: `/layout/${bookId}`,
      completed: progress.hasLayout,
      details: progress.hasLayout
        ? (isHebrew ? 'פריסה מוכנה' : 'Layout ready')
        : (isHebrew ? 'הגדר פריסה' : 'Set layout'),
    },
    {
      id: 'publish',
      label: isHebrew ? 'פרסום' : 'Publish',
      icon: Send,
      path: `/publish/${bookId}`,
      completed: progress.isPublished,
      details: progress.isPublished
        ? (isHebrew ? 'פורסם!' : 'Published!')
        : (isHebrew ? 'פרסם לחנות' : 'Publish to store'),
    },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3">
      {/* Mobile: Compact horizontal stepper */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">
            {isHebrew ? 'שלב' : 'Step'} {currentStepIndex + 1} / {steps.length}
          </span>
          <span className="text-sm font-medium text-white">
            {steps[currentStepIndex].label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-3">
          {steps.map((step, index) => (
            <motion.button
              key={step.id}
              onClick={() => navigate(step.path)}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                index < currentStepIndex
                  ? 'bg-green-500'
                  : index === currentStepIndex
                  ? 'bg-purple-500'
                  : 'bg-white/20'
              }`}
              whileTap={{ scale: 0.95 }}
            />
          ))}
        </div>

        {/* Current step details */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => currentStepIndex > 0 && navigate(steps[currentStepIndex - 1].path)}
            disabled={currentStepIndex === 0}
            className={`p-2 rounded-lg transition-colors ${
              currentStepIndex === 0
                ? 'opacity-30 cursor-not-allowed'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            {isHebrew ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <div className="text-center flex-1">
            <p className="text-xs text-gray-400">{steps[currentStepIndex].details}</p>
          </div>

          <button
            onClick={() => currentStepIndex < steps.length - 1 && navigate(steps[currentStepIndex + 1].path)}
            disabled={currentStepIndex === steps.length - 1}
            className={`p-2 rounded-lg transition-colors ${
              currentStepIndex === steps.length - 1
                ? 'opacity-30 cursor-not-allowed'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            {isHebrew ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Desktop: Compact horizontal stepper */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-center gap-1" dir={isHebrew ? 'rtl' : 'ltr'}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.completed;
            const isPast = index < currentStepIndex;

            return (
              <div key={step.id} className="flex items-center">
                {/* Step */}
                <motion.button
                  onClick={() => navigate(step.path)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                    isActive
                      ? 'bg-purple-500/20 border border-purple-500/50'
                      : 'hover:bg-white/5'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Icon with status */}
                  <div className={`relative w-6 h-6 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-500/20 text-green-400'
                      : isActive
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-white/10 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Label */}
                  <span className={`text-xs font-medium ${
                    isActive ? 'text-purple-300' : isCompleted ? 'text-green-300' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </motion.button>

                {/* Connector line (except last) */}
                {index < steps.length - 1 && (
                  <div className={`w-6 h-0.5 mx-0.5 rounded-full ${
                    isPast || isCompleted ? 'bg-green-500/50' : 'bg-white/10'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
