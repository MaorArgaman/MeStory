import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '../../hooks/useModal';
import {
  Sparkles,
  BookOpen,
  Wand2,
  Target,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Sword,
  Rocket,
  Heart,
  Ghost,
  Briefcase,
  Lightbulb,
  Smile,
  Drama,
  Book,
  TrendingUp,
  Layout,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { GlassCard, GlowingButton } from '../ui';
import { TemplateGallery } from '../templates';
import { BookTemplate } from '../../types/templates';
import { applyTemplateToBook } from '../../services/templateApi';

interface Genre {
  id: string;
  icon: any;
  color: string;
}

const genres: Genre[] = [
  { id: 'fantasy', icon: Sword, color: 'from-purple-500 to-pink-600' },
  { id: 'sci-fi', icon: Rocket, color: 'from-cyan-500 to-blue-600' },
  { id: 'romance', icon: Heart, color: 'from-rose-500 to-red-600' },
  { id: 'mystery', icon: Ghost, color: 'from-indigo-500 to-purple-600' },
  { id: 'thriller', icon: Drama, color: 'from-red-600 to-orange-600' },
  { id: 'non-fiction', icon: Briefcase, color: 'from-green-500 to-emerald-600' },
  { id: 'self-help', icon: Lightbulb, color: 'from-yellow-500 to-amber-600' },
  { id: 'humor', icon: Smile, color: 'from-pink-500 to-rose-600' },
];

interface WritingGoal {
  id: string;
  icon: any;
}

const writingGoals: WritingGoal[] = [
  { id: 'short-story', icon: Book },
  { id: 'novella', icon: BookOpen },
  { id: 'novel', icon: TrendingUp },
];

interface TargetAudience {
  id: string;
}

const targetAudiences: TargetAudience[] = [
  { id: 'children' },
  { id: 'young-adult' },
  { id: 'adult' },
  { id: 'all-ages' },
];

interface CreateBookWizardProps {
  onClose: () => void;
  onSuccess: (bookId: string) => void;
}

export default function CreateBookWizard({ onClose, onSuccess }: CreateBookWizardProps) {
  const { t } = useTranslation('common');

  // Use modal hook for ESC key and scroll lock
  useModal(true, onClose);

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [generatingTitles, setGeneratingTitles] = useState(false);
  const [selectedWritingGoal, setSelectedWritingGoal] = useState<string>('');
  const [selectedAudience, setSelectedAudience] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<BookTemplate | null>(null);
  const [creating, setCreating] = useState(false);

  const handleSelectTemplate = (template: BookTemplate) => {
    setSelectedTemplate(template);
    toast.success(t('create_book.template_selected', { name: template.name }));
  };

  const handleGenerateTitles = async () => {
    if (!selectedGenre) {
      toast.error(t('create_book.select_genre_first'));
      return;
    }

    try {
      setGeneratingTitles(true);
      const response = await api.post('/ai/generate-titles', {
        genre: selectedGenre,
        count: 5,
      });

      if (response.data.success) {
        setGeneratedTitles(response.data.data.titles);
        toast.success(t('create_book.title_ideas_generated'));
      }
    } catch (error: any) {
      console.error('Failed to generate titles:', error);
      toast.error(error.response?.data?.error || t('create_book.title_generation_failed'));
    } finally {
      setGeneratingTitles(false);
    }
  };

  const handleSelectGeneratedTitle = (generatedTitle: string) => {
    setTitle(generatedTitle);
    toast.success(t('create_book.title_selected'));
  };

  const handleCreateBook = async () => {
    // Validation
    if (!title.trim()) {
      toast.error(t('create_book.enter_title'));
      return;
    }
    if (!selectedGenre) {
      toast.error(t('create_book.select_genre'));
      return;
    }
    if (!selectedWritingGoal) {
      toast.error(t('create_book.select_writing_goal'));
      return;
    }
    if (!selectedAudience) {
      toast.error(t('create_book.select_audience'));
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/books', {
        title: title.trim(),
        genre: selectedGenre,
        writingGoal: selectedWritingGoal,
        targetAudience: selectedAudience,
      });

      if (response.data.success) {
        const bookId = response.data.data.book.id;

        // Apply template if selected
        if (selectedTemplate) {
          try {
            await applyTemplateToBook(bookId, selectedTemplate._id);
            toast.success(t('create_book.book_created_with_template'));
          } catch (templateError) {
            console.error('Failed to apply template:', templateError);
            toast.success(t('create_book.book_created_template_failed'));
          }
        } else {
          toast.success(t('create_book.book_created'));
        }

        onSuccess(bookId);
      }
    } catch (error: any) {
      console.error('Failed to create book:', error);
      toast.error(error.response?.data?.error || t('create_book.create_failed'));
    } finally {
      setCreating(false);
    }
  };

  const canProceedToStep2 = title.trim() && selectedGenre;
  const canProceedToStep3 = canProceedToStep2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-book-wizard-title"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl"
      >
        <GlassCard className="relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white"
          >
            ✕
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-magic-gold to-yellow-600 flex items-center justify-center mx-auto mb-4 shadow-glow-gold">
              <Sparkles className="w-8 h-8 text-deep-space" />
            </div>
            <h2 id="create-book-wizard-title" className="text-3xl font-display font-bold gradient-gold mb-2">
              {t('create_book.wizard_title')}
            </h2>
            <p className="text-gray-400">{t('create_book.wizard_subtitle')}</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    s === step
                      ? 'bg-gradient-to-br from-magic-gold to-yellow-600 text-deep-space shadow-glow-gold'
                      : s < step
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'bg-white/5 text-gray-500 border border-white/10'
                  }`}
                >
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-12 h-0.5 ${
                      s < step ? 'bg-green-400' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: The Spark */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-display font-bold text-white mb-2">
                    ✨ {t('create_book.step1_title')}
                  </h3>
                  <p className="text-gray-400">{t('create_book.step1_subtitle')}</p>
                </div>

                {/* Title Input */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    {t('create_book.book_name_label')}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('create_book.book_name_placeholder')}
                    className="input text-lg"
                    autoFocus
                  />
                </div>

                {/* Genre Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-4 text-gray-300">
                    {t('create_book.select_genre_label')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                    {genres.map((genre) => {
                      const Icon = genre.icon;
                      const isSelected = selectedGenre === genre.id;

                      return (
                        <motion.button
                          key={genre.id}
                          onClick={() => setSelectedGenre(genre.id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`relative p-4 rounded-xl transition-all ${
                            isSelected
                              ? 'bg-white/10 border-2 border-magic-gold shadow-glow-gold'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div
                            className={`w-12 h-12 rounded-lg bg-gradient-to-br ${genre.color} flex items-center justify-center mx-auto mb-2`}
                          >
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-sm font-semibold text-white">
                            {t(`create_book.genres.${genre.id}`)}
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-magic-gold flex items-center justify-center">
                              <Check className="w-4 h-4 text-deep-space" />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
                  <GlowingButton
                    onClick={() => setStep(2)}
                    disabled={!canProceedToStep2}
                    variant="gold"
                    size="lg"
                  >
                    {t('create_book.next_step')}
                    <ArrowLeft className="w-5 h-5" />
                  </GlowingButton>
                </div>
              </motion.div>
            )}

            {/* Step 2: AI Brainstorm */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-display font-bold text-white mb-2">
                    🎨 {t('create_book.step2_title')}
                  </h3>
                  <p className="text-gray-400">{t('create_book.step2_subtitle')}</p>
                </div>

                {/* Current Title */}
                <div className="glass rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-400 mb-2">{t('create_book.current_title')}</p>
                  <p className="text-2xl font-display font-bold gradient-gold">{title}</p>
                  <p className="text-sm text-cosmic-purple mt-2 capitalize">
                    {t(`create_book.genres.${selectedGenre}`)} • {t('create_book.ready_to_write')}
                  </p>
                </div>

                {/* Generate Titles Button */}
                <div className="text-center">
                  <p className="text-gray-300 mb-4">
                    {t('create_book.title_not_sure')}
                  </p>
                  <GlowingButton
                    onClick={handleGenerateTitles}
                    disabled={generatingTitles}
                    variant="cosmic"
                    size="lg"
                  >
                    {generatingTitles ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('create_book.generating_ideas')}
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        {t('create_book.suggest_titles')}
                      </>
                    )}
                  </GlowingButton>
                </div>

                {/* Generated Titles */}
                {generatedTitles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-sm font-semibold text-gray-300 text-center">
                      {t('create_book.ai_suggestions')}
                    </p>
                    {generatedTitles.map((genTitle, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleSelectGeneratedTitle(genTitle)}
                        className={`w-full p-4 rounded-xl text-left transition-all ${
                          title === genTitle
                            ? 'bg-magic-gold/20 border-2 border-magic-gold'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-white">{genTitle}</p>
                          </div>
                          {title === genTitle && (
                            <Check className="w-5 h-5 text-magic-gold" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* Navigation */}
                <div className="flex justify-between gap-4 pt-6 border-t border-white/10">
                  <GlowingButton
                    onClick={() => setStep(1)}
                    variant="cosmic"
                    size="lg"
                  >
                    <ArrowRight className="w-5 h-5" />
                    {t('create_book.back')}
                  </GlowingButton>
                  <GlowingButton
                    onClick={() => setStep(3)}
                    disabled={!canProceedToStep3}
                    variant="gold"
                    size="lg"
                  >
                    {t('create_book.next_step')}
                    <ArrowLeft className="w-5 h-5" />
                  </GlowingButton>
                </div>
              </motion.div>
            )}

            {/* Step 3: The Setup */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-display font-bold text-white mb-2">
                    🎯 {t('create_book.step3_title')}
                  </h3>
                  <p className="text-gray-400">{t('create_book.step3_subtitle')}</p>
                </div>

                {/* Writing Goal */}
                <div>
                  <label className="block text-sm font-semibold mb-4 text-gray-300">
                    {t('create_book.writing_goal_label')}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
                    {writingGoals.map((goal) => {
                      const Icon = goal.icon;
                      const isSelected = selectedWritingGoal === goal.id;

                      return (
                        <motion.button
                          key={goal.id}
                          onClick={() => setSelectedWritingGoal(goal.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-6 rounded-xl transition-all ${
                            isSelected
                              ? 'bg-white/10 border-2 border-magic-gold shadow-glow-gold'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <Icon className={`w-8 h-8 mb-3 mx-auto ${isSelected ? 'text-magic-gold' : 'text-gray-400'}`} />
                          <div className="font-semibold text-white mb-1">{t(`create_book.writing_goals.${goal.id}`)}</div>
                          <div className="text-sm text-gray-400">{t(`create_book.writing_goals.${goal.id}_desc`)}</div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-semibold mb-4 text-gray-300">
                    {t('create_book.audience_label')}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                    {targetAudiences.map((audience) => {
                      const isSelected = selectedAudience === audience.id;

                      return (
                        <motion.button
                          key={audience.id}
                          onClick={() => setSelectedAudience(audience.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 rounded-xl text-left transition-all ${
                            isSelected
                              ? 'bg-white/10 border-2 border-magic-gold shadow-glow-gold'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-white mb-1">
                                {t(`create_book.audiences.${audience.id}`)}
                              </div>
                              <div className="text-sm text-gray-400">
                                {t(`create_book.audiences.${audience.id}_desc`)}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-8 h-8 rounded-full bg-magic-gold flex items-center justify-center">
                                <Check className="w-5 h-5 text-deep-space" />
                              </div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Summary */}
                <div className="glass rounded-xl p-6 space-y-2">
                  <p className="text-sm text-gray-400 mb-3">{t('create_book.summary')}</p>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-magic-gold" />
                    <span className="text-white">
                      <span className="font-semibold">{title}</span> • {t(`create_book.genres.${selectedGenre}`)}
                    </span>
                  </div>
                  {selectedWritingGoal && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-cosmic-purple" />
                      <span className="text-gray-300 capitalize">
                        {t(`create_book.writing_goals.${selectedWritingGoal}`)}
                      </span>
                    </div>
                  )}
                  {selectedAudience && (
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">
                        {t('create_book.target_audience')} {t(`create_book.audiences.${selectedAudience}`)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between gap-4 pt-6 border-t border-white/10">
                  <GlowingButton
                    onClick={() => setStep(2)}
                    variant="cosmic"
                    size="lg"
                  >
                    <ArrowRight className="w-5 h-5" />
                    {t('create_book.back')}
                  </GlowingButton>
                  <GlowingButton
                    onClick={() => setStep(4)}
                    disabled={!selectedWritingGoal || !selectedAudience}
                    variant="gold"
                    size="lg"
                  >
                    {t('create_book.next_step')}
                    <ArrowLeft className="w-5 h-5" />
                  </GlowingButton>
                </div>
              </motion.div>
            )}

            {/* Step 4: Template Selection */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-display font-bold text-white mb-2">
                    📐 {t('create_book.step4_title')}
                  </h3>
                  <p className="text-gray-400">{t('create_book.step4_subtitle')}</p>
                </div>

                {/* Template Gallery */}
                <div className="max-h-[400px] overflow-y-auto rounded-xl">
                  <TemplateGallery
                    selectedTemplate={selectedTemplate}
                    onSelectTemplate={handleSelectTemplate}
                    compact={true}
                  />
                </div>

                {/* Selected Template Display */}
                {selectedTemplate && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Layout className="w-5 h-5 text-magic-gold" />
                      <span className="text-white">
                        {t('create_book.template_selected_label')} <span className="font-semibold text-magic-gold">{selectedTemplate.name}</span>
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Summary */}
                <div className="glass rounded-xl p-6 space-y-2">
                  <p className="text-sm text-gray-400 mb-3">{t('create_book.summary')}</p>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-magic-gold" />
                    <span className="text-white">
                      <span className="font-semibold">{title}</span> • {t(`create_book.genres.${selectedGenre}`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cosmic-purple" />
                    <span className="text-gray-300 capitalize">
                      {t(`create_book.writing_goals.${selectedWritingGoal}`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">
                      {t('create_book.target_audience')} {t(`create_book.audiences.${selectedAudience}`)}
                    </span>
                  </div>
                  {selectedTemplate && (
                    <div className="flex items-center gap-2">
                      <Layout className="w-4 h-4 text-magic-gold" />
                      <span className="text-gray-300">
                        {t('create_book.template')} {selectedTemplate.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between gap-4 pt-6 border-t border-white/10">
                  <GlowingButton
                    onClick={() => setStep(3)}
                    variant="cosmic"
                    size="lg"
                  >
                    <ArrowRight className="w-5 h-5" />
                    {t('create_book.back')}
                  </GlowingButton>
                  <GlowingButton
                    onClick={handleCreateBook}
                    disabled={creating}
                    variant="gold"
                    size="lg"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('create_book.creating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {t('create_book.create_my_book')}
                      </>
                    )}
                  </GlowingButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </div>
  );
}
