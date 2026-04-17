/**
 * InterviewWizard Component
 * AI-driven chat interview for story development
 * Uses AIInterviewChat for interactive AI questioning
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Edit2, ChevronLeft, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useModal } from '../../hooks/useModal';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import AIInterviewChat from '../interview/AIInterviewChat';
import { InterviewSummary } from '../../services/aiInterviewApi';
import BookGeneratingScreen from './BookGeneratingScreen';
import { useLanguage } from '../../contexts/LanguageContext';

interface InterviewWizardProps {
  onClose: () => void;
  onSuccess: (bookId: string) => void;
}

type WizardStep = 'interview' | 'summary' | 'creating' | 'generating';

export default function InterviewWizard({ onClose, onSuccess }: InterviewWizardProps) {
  // Use modal hook for ESC key and scroll lock (active when not in interview step)
  useModal(true, onClose);
  const { t } = useTranslation('common');
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  const [step, setStep] = useState<WizardStep>('interview');
  const [editedSummary, setEditedSummary] = useState<InterviewSummary | null>(null);
  const [bookTitle, setBookTitle] = useState('');
  const [bookGenre, setBookGenre] = useState('Fiction');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [generatingStep, setGeneratingStep] = useState('');

  // Handle interview completion
  const handleInterviewComplete = (interviewSummary: InterviewSummary) => {
    setEditedSummary(interviewSummary);
    setStep('summary');
  };

  // Handle summary field change
  const handleSummaryChange = (field: keyof InterviewSummary, value: string) => {
    if (editedSummary) {
      setEditedSummary({
        ...editedSummary,
        [field]: value,
      });
    }
  };

  // Create book AND generate full content with AI
  const handleCreateBook = async () => {
    if (!bookTitle.trim()) {
      toast.error(t('interview.enter_book_title', 'Please enter a book title'));
      return;
    }

    if (!editedSummary) {
      toast.error(t('interview.summary_missing', 'Interview summary is missing'));
      return;
    }

    setIsSubmitting(true);
    setStep('generating');
    setGeneratingProgress(5);
    setGeneratingStep(isHebrew ? 'יוצר את הספר...' : 'Creating book...');

    try {
      // Step 1: Create the book
      setGeneratingProgress(10);
      setGeneratingStep(isHebrew ? 'שומר את פרטי הספר...' : 'Saving book details...');

      const createResponse = await api.post('/books', {
        title: bookTitle.trim(),
        genre: bookGenre,
        language: isHebrew ? 'he' : 'en',
        storyContext: {
          theme: editedSummary.theme,
          characters: editedSummary.characters,
          conflict: editedSummary.conflict,
          climax: editedSummary.climax,
          resolution: editedSummary.resolution,
          setting: editedSummary.setting,
          keyPoints: editedSummary.keyPoints,
          narrativeArc: editedSummary.narrativeArc,
          completedAt: new Date().toISOString(),
        },
      });

      if (!createResponse.data.success) {
        throw new Error('Failed to create book');
      }

      const bookId = createResponse.data.data.id;

      // Step 2: Generate complete book content with AI
      setGeneratingProgress(20);
      setGeneratingStep(isHebrew ? 'ה-AI כותב את הספר שלך...' : 'AI is writing your book...');

      // Simulate gradual progress while waiting for AI
      const progressInterval = setInterval(() => {
        setGeneratingProgress(prev => {
          if (prev < 80) return prev + 2;
          return prev;
        });
      }, 1500);

      const generateResponse = await api.post('/ai/generate-book', {
        bookId,
        storyInput: {
          bookTitle: bookTitle.trim(),
          genre: bookGenre,
          language: isHebrew ? 'he' : 'en',
          // Pass interview data
          theme: editedSummary.theme,
          characters: editedSummary.characters,
          conflict: editedSummary.conflict,
          setting: editedSummary.setting,
          climax: editedSummary.climax,
          resolution: editedSummary.resolution,
          keyPoints: editedSummary.keyPoints,
          narrativeArc: editedSummary.narrativeArc,
          // Build raw text from all fields for context
          rawAnswers: Object.values(editedSummary).filter(v => typeof v === 'string').join('\n\n'),
        },
      }, { timeout: 120000 }); // 2 minute timeout for AI generation

      clearInterval(progressInterval);

      if (generateResponse.data.success) {
        setGeneratingProgress(90);
        setGeneratingStep(isHebrew ? 'מסיים...' : 'Finishing...');

        // Short delay for animation
        await new Promise(resolve => setTimeout(resolve, 1000));

        setGeneratingProgress(100);
        setGeneratingStep(isHebrew ? 'הספר שלך מוכן!' : 'Your book is ready!');

        // Wait for completion animation
        await new Promise(resolve => setTimeout(resolve, 2000));

        toast.success(
          isHebrew
            ? `הספר "${bookTitle}" נוצר עם ${generateResponse.data.data.chapters?.length || 0} פרקים!`
            : `Book "${bookTitle}" created with ${generateResponse.data.data.chapters?.length || 0} chapters!`
        );
        onSuccess(bookId);
      } else {
        throw new Error(generateResponse.data.error || 'Generation failed');
      }
    } catch (error: any) {
      console.error('Failed to create/generate book:', error);
      toast.error(
        isHebrew
          ? 'שגיאה ביצירת הספר. נסה שוב.'
          : (error.response?.data?.error || 'Failed to generate book')
      );
      setStep('summary');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render interview step
  if (step === 'interview') {
    return (
      <AIInterviewChat
        onClose={onClose}
        onComplete={handleInterviewComplete}
        genre={bookGenre}
      />
    );
  }

  // Render generating step — full book creation with AI
  if (step === 'generating' || step === 'creating') {
    return (
      <BookGeneratingScreen
        isVisible={true}
        currentStep={generatingStep}
        progress={generatingProgress}
      />
    );
  }

  // Render summary step
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-summary-title"
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('interview')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center glow">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 id="interview-summary-title" className="text-2xl font-bold gradient-gold" style={{ fontFamily: "'Cinzel', serif" }}>
                  {t('interview.complete', 'Interview Complete!')}
                </h2>
                <p className="text-sm text-gray-400">
                  {t('interview.review_story', 'Review your story foundation and create your book')}
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Book Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('interview.book_title', 'Book Title')} *
              </label>
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder={t('interview.enter_title_placeholder', 'Enter your book title')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('interview.genre', 'Genre')}
              </label>
              <select
                value={bookGenre}
                onChange={(e) => setBookGenre(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="fallen_soldier">{t('genres.fallen_soldier', 'לזכר חייל/ת שנפל/ה')}</option>
                <option value="life_story">{t('genres.life_story', 'סיפור חיים')}</option>
                <option value="family_legacy">{t('genres.family_legacy', 'מורשת משפחתית')}</option>
                <option value="tribute">{t('genres.tribute', 'מחווה ליקיר/ה')}</option>
                <option value="holocaust_survivor">{t('genres.holocaust_survivor', 'עדות ניצול שואה')}</option>
                <option value="shared_memories">{t('genres.shared_memories', 'זיכרונות משותפים')}</option>
                <option value="letters_and_words">{t('genres.letters_and_words', 'מכתבים ודברים שלא נאמרו')}</option>
                <option value="testimony">{t('genres.testimony', 'עדות')}</option>
              </select>
            </div>
          </div>

          {/* Summary Sections */}
          {editedSummary && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-indigo-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {t('interview.story_foundation', 'Story Foundation')}
                <span className="text-xs text-gray-500 font-normal">({t('interview.click_to_edit', 'Click to edit')})</span>
              </h3>

              {/* Summary Fields */}
              {[
                { key: 'theme', label: t('interview.fields.theme', 'Theme & Premise'), icon: '🎯' },
                { key: 'characters', label: t('interview.fields.characters', 'Main Characters'), icon: '👤' },
                { key: 'conflict', label: t('interview.fields.conflict', 'Central Conflict'), icon: '⚔️' },
                { key: 'climax', label: t('interview.fields.climax', 'Planned Climax'), icon: '🔥' },
                { key: 'resolution', label: t('interview.fields.resolution', 'Resolution'), icon: '✨' },
                { key: 'setting', label: t('interview.fields.setting', 'Setting & World'), icon: '🌍' },
                { key: 'keyPoints', label: t('interview.fields.key_points', 'Key Plot Points'), icon: '📍' },
                { key: 'narrativeArc', label: t('interview.fields.narrative_arc', 'Narrative Arc & Tone'), icon: '📖' },
              ].map(({ key, label, icon }) => (
                <div
                  key={key}
                  className="group glass rounded-xl p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{icon}</span>
                      <span className="text-sm font-medium text-gray-300">{label}</span>
                    </div>
                    <Edit2 className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
                  </div>
                  <textarea
                    value={editedSummary[key as keyof InterviewSummary]}
                    onChange={(e) => handleSummaryChange(key as keyof InterviewSummary, e.target.value)}
                    className="w-full bg-transparent border-none text-gray-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/30 rounded p-1 -m-1"
                    rows={3}
                    dir="rtl"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => setStep('interview')}
            disabled={isSubmitting}
            className="btn-ghost px-6 py-2 flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('interview.back_to_interview', 'Back to Interview')}
          </button>

          <button
            onClick={handleCreateBook}
            disabled={isSubmitting || !bookTitle.trim()}
            className="btn-gold px-8 py-2 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('interview.creating_book_button', 'Creating Book...')}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {t('interview.create_my_book', 'Create My Book')}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
