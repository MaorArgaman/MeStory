import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, X, Sparkles, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

interface InterviewWizardProps {
  onClose: () => void;
  onSuccess: (bookId: string) => void;
}

interface InterviewAnswers {
  theme: string;
  characters: string;
  conflict: string;
  climax: string;
  resolution: string;
  setting: string;
  keyPoints: string;
  narrativeArc: string;
}

const QUESTIONS = [
  {
    id: 'theme',
    title: 'Core Theme & Premise',
    question: 'What is the core theme or premise of your story?',
    placeholder: 'Example: A coming-of-age story about finding courage in the face of adversity...',
    hint: 'Think about the central idea or message you want to convey.',
  },
  {
    id: 'characters',
    title: 'Main Characters',
    question: 'Who are the main characters and protagonist?',
    placeholder: 'Example: Sarah, a 16-year-old introvert who discovers she has magical abilities...',
    hint: 'Describe your protagonist and key supporting characters.',
  },
  {
    id: 'conflict',
    title: 'Central Conflict',
    question: 'What is the central conflict or problem?',
    placeholder: 'Example: Sarah must prevent an ancient evil from destroying her town while keeping her powers secret...',
    hint: 'What challenge or obstacle drives your story forward?',
  },
  {
    id: 'climax',
    title: 'Planned Climax',
    question: 'What is the planned climax of your story?',
    placeholder: 'Example: Sarah faces the ancient evil in a final confrontation at the old lighthouse...',
    hint: 'Describe the peak moment of tension and action.',
  },
  {
    id: 'resolution',
    title: 'Resolution',
    question: 'How does your story resolve?',
    placeholder: 'Example: Sarah defeats the evil but chooses to give up her powers to live a normal life...',
    hint: 'How do things settle after the climax?',
  },
  {
    id: 'setting',
    title: 'Setting & World',
    question: 'Describe the setting and world of your story.',
    placeholder: 'Example: A small coastal town in Maine, modern day, with hidden magical elements...',
    hint: 'Where and when does your story take place?',
  },
  {
    id: 'keyPoints',
    title: 'Key Plot Points',
    question: 'What are the key plot points or milestones?',
    placeholder: 'Example: 1. Sarah discovers her powers, 2. She meets her mentor, 3. First encounter with the evil...',
    hint: 'List the major events that structure your narrative.',
  },
  {
    id: 'narrativeArc',
    title: 'Narrative Arc & Tone',
    question: 'What is your desired narrative arc and tone?',
    placeholder: 'Example: Dark fantasy with moments of hope; character-driven with fast pacing...',
    hint: 'Describe the overall feel and structure of your story.',
  },
];

export default function InterviewWizard({ onClose, onSuccess }: InterviewWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<InterviewAnswers>({
    theme: '',
    characters: '',
    conflict: '',
    climax: '',
    resolution: '',
    setting: '',
    keyPoints: '',
    narrativeArc: '',
  });
  const [bookTitle, setBookTitle] = useState('');
  const [bookGenre, setBookGenre] = useState('Fiction');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = QUESTIONS[currentStep];
  const isLastQuestion = currentStep === QUESTIONS.length - 1;
  const isFinalStep = currentStep === QUESTIONS.length;
  const progress = ((currentStep + 1) / (QUESTIONS.length + 1)) * 100;

  const handleNext = () => {
    const currentAnswer = answers[currentQuestion.id as keyof InterviewAnswers];

    if (!currentAnswer || currentAnswer.trim().length < 20) {
      toast.error('Please provide a more detailed answer (at least 20 characters)');
      return;
    }

    if (isLastQuestion) {
      setCurrentStep(QUESTIONS.length); // Move to final step
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAnswerChange = (value: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value,
    });
  };

  const handleSubmit = async () => {
    if (!bookTitle.trim()) {
      toast.error('Please enter a book title');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create book with storyContext
      const response = await api.post('/books', {
        title: bookTitle.trim(),
        genre: bookGenre,
        storyContext: {
          theme: answers.theme,
          characters: answers.characters,
          conflict: answers.conflict,
          climax: answers.climax,
          resolution: answers.resolution,
          setting: answers.setting,
          keyPoints: answers.keyPoints,
          narrativeArc: answers.narrativeArc,
          completedAt: new Date().toISOString(),
        },
        chapters: [
          {
            title: 'Chapter 1',
            content: '',
            order: 0,
            wordCount: 0,
          },
        ],
      });

      if (response.data.success) {
        toast.success('Story foundation created! Starting your book...');
        onSuccess(response.data.data.id);
      }
    } catch (error: any) {
      console.error('Failed to create book:', error);
      toast.error(error.response?.data?.error || 'Failed to create book');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-strong rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold gradient-gold" style={{ fontFamily: "'Cinzel', serif" }}>
                  Deep Dive Interview
                </h2>
                <p className="text-sm text-gray-400">
                  {isFinalStep ? 'Final Step' : `Question ${currentStep + 1} of ${QUESTIONS.length}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {!isFinalStep ? (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold text-white mb-2">
                  {currentQuestion.title}
                </h3>
                <p className="text-gray-300 mb-4 text-lg">
                  {currentQuestion.question}
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  💡 {currentQuestion.hint}
                </p>

                <textarea
                  value={answers[currentQuestion.id as keyof InterviewAnswers]}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="w-full h-64 bg-white/5 border border-white/10 rounded-xl p-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-serif leading-relaxed"
                  autoFocus
                />

                <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                  <span className={answers[currentQuestion.id as keyof InterviewAnswers].length < 20 ? 'text-red-400' : 'text-green-400'}>
                    {answers[currentQuestion.id as keyof InterviewAnswers].length} characters
                  </span>
                  <span>•</span>
                  <span>Minimum 20 characters required</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="final"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 glow">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold gradient-gold mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                    Interview Complete!
                  </h3>
                  <p className="text-gray-300">
                    You've laid the foundation for your story. Now let's create your book.
                  </p>
                </div>

                {/* Book Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Book Title *
                    </label>
                    <input
                      type="text"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      placeholder="Enter your book title"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Genre
                    </label>
                    <select
                      value={bookGenre}
                      onChange={(e) => setBookGenre(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      <option value="Fiction">Fiction</option>
                      <option value="Fantasy">Fantasy</option>
                      <option value="Science Fiction">Science Fiction</option>
                      <option value="Mystery">Mystery</option>
                      <option value="Thriller">Thriller</option>
                      <option value="Romance">Romance</option>
                      <option value="Horror">Horror</option>
                      <option value="Adventure">Adventure</option>
                      <option value="Historical Fiction">Historical Fiction</option>
                      <option value="Non-Fiction">Non-Fiction</option>
                      <option value="Biography">Biography</option>
                      <option value="Self-Help">Self-Help</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Summary of Answers */}
                  <div className="glass rounded-xl p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Your Story Foundation
                    </h4>
                    <div className="space-y-2 text-sm">
                      {QUESTIONS.map((q) => (
                        <div key={q.id} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-400">
                            <span className="text-gray-300 font-medium">{q.title}:</span>{' '}
                            {answers[q.id as keyof InterviewAnswers].slice(0, 60)}
                            {answers[q.id as keyof InterviewAnswers].length > 60 ? '...' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            className="btn-ghost px-6 py-2 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {!isFinalStep ? (
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="btn-primary px-6 py-2 flex items-center gap-2"
            >
              {isLastQuestion ? 'Finish Interview' : 'Next Question'}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !bookTitle.trim()}
              className="btn-gold px-8 py-2 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  Creating Book...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create My Book
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
