/**
 * InterviewWizard Component
 * AI-driven chat interview for story development
 * Uses AIInterviewChat for interactive AI questioning
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Edit2, ChevronLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import AIInterviewChat from '../interview/AIInterviewChat';
import { InterviewSummary } from '../../services/aiInterviewApi';

interface InterviewWizardProps {
  onClose: () => void;
  onSuccess: (bookId: string) => void;
}

type WizardStep = 'interview' | 'summary' | 'creating';

export default function InterviewWizard({ onClose, onSuccess }: InterviewWizardProps) {
  const [step, setStep] = useState<WizardStep>('interview');
  const [editedSummary, setEditedSummary] = useState<InterviewSummary | null>(null);
  const [bookTitle, setBookTitle] = useState('');
  const [bookGenre, setBookGenre] = useState('Fiction');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Create book with storyContext
  const handleCreateBook = async () => {
    if (!bookTitle.trim()) {
      toast.error('Please enter a book title');
      return;
    }

    if (!editedSummary) {
      toast.error('Interview summary is missing');
      return;
    }

    setIsSubmitting(true);
    setStep('creating');

    try {
      const response = await api.post('/books', {
        title: bookTitle.trim(),
        genre: bookGenre,
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

      if (response.data.success) {
        toast.success('Story foundation created! Starting your book...');
        onSuccess(response.data.data.id);
      }
    } catch (error: any) {
      console.error('Failed to create book:', error);
      toast.error(error.response?.data?.error || 'Failed to create book');
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

  // Render creating step
  if (step === 'creating') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-16 h-16 text-magic-gold" />
          </motion.div>
          <p className="text-xl text-white">Creating your book...</p>
          <p className="text-gray-400">Setting up your story foundation</p>
        </div>
      </motion.div>
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
                <h2 className="text-2xl font-bold gradient-gold" style={{ fontFamily: "'Cinzel', serif" }}>
                  Interview Complete!
                </h2>
                <p className="text-sm text-gray-400">
                  Review your story foundation and create your book
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
          </div>

          {/* Summary Sections */}
          {editedSummary && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-indigo-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Story Foundation
                <span className="text-xs text-gray-500 font-normal">(Click to edit)</span>
              </h3>

              {/* Summary Fields */}
              {[
                { key: 'theme', label: 'Theme & Premise', icon: '🎯' },
                { key: 'characters', label: 'Main Characters', icon: '👤' },
                { key: 'conflict', label: 'Central Conflict', icon: '⚔️' },
                { key: 'climax', label: 'Planned Climax', icon: '🔥' },
                { key: 'resolution', label: 'Resolution', icon: '✨' },
                { key: 'setting', label: 'Setting & World', icon: '🌍' },
                { key: 'keyPoints', label: 'Key Plot Points', icon: '📍' },
                { key: 'narrativeArc', label: 'Narrative Arc & Tone', icon: '📖' },
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
            Back to Interview
          </button>

          <button
            onClick={handleCreateBook}
            disabled={isSubmitting || !bookTitle.trim()}
            className="btn-gold px-8 py-2 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Book...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create My Book
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
