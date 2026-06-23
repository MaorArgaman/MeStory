import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useModal } from '../../hooks/useModal';
import {
  Sparkles,
  BookOpen,
  Heart,
  Users,
  ScrollText,
  PenLine,
  Loader2,
  Star,
  Shield,
  Globe,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { GlassCard, GlowingButton } from '../ui';
import { applyTemplateToBook } from '../../services/templateApi';
import analytics from '../../utils/analytics';

interface StoryType {
  id: string;
  genre: string;
  templateSlug: string;
  icon: any;
  color: string;
}

const storyTypes: StoryType[] = [
  {
    id: 'my-life-story',
    genre: 'autobiography',
    templateSlug: 'my-life-story',
    icon: BookOpen,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'in-memory',
    genre: 'memorial',
    templateSlug: 'in-memory',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
  },
  {
    id: 'fallen-soldier',
    genre: 'fallen_soldier',
    templateSlug: 'in-memory',
    icon: Shield,
    color: 'from-slate-500 to-slate-700',
  },
  {
    id: 'family-story',
    genre: 'family',
    templateSlug: 'family-roots',
    icon: Users,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'family-legacy',
    genre: 'family_legacy',
    templateSlug: 'family-roots',
    icon: Globe,
    color: 'from-green-500 to-emerald-700',
  },
  {
    id: 'holocaust-survivor',
    genre: 'holocaust_survivor',
    templateSlug: 'my-life-story',
    icon: Star,
    color: 'from-yellow-600 to-amber-800',
  },
  {
    id: 'shared-memories',
    genre: 'shared_memories',
    templateSlug: 'family-roots',
    icon: MessageSquare,
    color: 'from-sky-500 to-cyan-600',
  },
  {
    id: 'personal-testimony',
    genre: 'testimony',
    templateSlug: 'my-life-story',
    icon: ScrollText,
    color: 'from-amber-500 to-yellow-600',
  },
  {
    id: 'something-else',
    genre: 'other',
    templateSlug: 'custom',
    icon: PenLine,
    color: 'from-purple-500 to-violet-600',
  },
];

interface CreateBookWizardProps {
  onClose: () => void;
  onSuccess: (bookId: string) => void;
}

export default function CreateBookWizard({ onClose, onSuccess }: CreateBookWizardProps) {
  const { t } = useTranslation('common');

  // Use modal hook for ESC key and scroll lock
  useModal(true, onClose);

  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<string>('my-life-story');
  const [creating, setCreating] = useState(false);

  const handleCreateBook = async () => {
    if (!title.trim()) {
      toast.error(t('create_book.enter_title'));
      return;
    }

    const storyType = storyTypes.find((st) => st.id === selectedType)!;

    try {
      setCreating(true);
      const bookData = {
        title: title.trim(),
        genre: storyType.genre,
        writingGoal: 'novella',
        targetAudience: 'family',
        bookType: 'personal',
        isCollaborative: false,
      };

      const response = await api.post('/books', bookData);

      if (response.data.success) {
        const bookId = response.data.data.book.id;

        // Auto-apply template based on story type
        if (storyType.templateSlug !== 'custom') {
          try {
            await applyTemplateToBook(bookId, storyType.templateSlug);
          } catch (templateError) {
            console.error('Failed to apply template:', templateError);
            // Non-blocking — book is still created
          }
        }

        analytics.bookCreate(storyType.genre);
        toast.success(t('create_book.book_created'));
        onSuccess(bookId);
      }
    } catch (error: any) {
      console.error('Failed to create book:', error);
      toast.error(error.response?.data?.error || t('create_book.create_failed'));
    } finally {
      setCreating(false);
    }
  };

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
        className="w-full max-w-md"
      >
        <GlassCard className="relative p-5">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white"
          >
            ✕
          </button>

          {/* Header */}
          <div className="text-center mb-4">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-memorial-gold to-yellow-600 flex items-center justify-center mx-auto mb-2 shadow-glow-gold">
              <BookOpen className="w-5 h-5 text-deep-space" />
            </div>
            <h2
              id="create-book-wizard-title"
              className="text-xl font-display font-bold gradient-gold mb-1"
            >
              {t('create_book.wizard_title')}
            </h2>
            <p className="text-gray-400 text-xs">{t('create_book.wizard_subtitle')}</p>
          </div>

          {/* Title Input */}
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1.5 text-gray-300">
              {t('create_book.book_name_label')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('create_book.book_name_placeholder')}
              className="input text-sm py-2"
              autoFocus
            />
          </div>

          {/* Story Type Selection */}
          <div className="mb-5">
            <label className="block text-xs font-semibold mb-2 text-gray-300">
              {t('create_book.story_type_label')}
            </label>
            <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
              {storyTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;

                return (
                  <motion.button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-right ${
                      isSelected
                        ? 'bg-white/10 border-2 border-memorial-gold shadow-glow-gold'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-md bg-gradient-to-br ${type.color} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-white flex-1 text-sm">
                      {t(`create_book.story_types.${type.id}`)}
                    </span>
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-memorial-gold flex-shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* CTA Button */}
          <GlowingButton
            onClick={handleCreateBook}
            disabled={creating || !title.trim()}
            variant="gold"
            size="md"
            className="w-full justify-center text-sm py-2.5"
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('create_book.creating')}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {t('create_book.lets_start')}
              </>
            )}
          </GlowingButton>
        </GlassCard>
      </motion.div>
    </div>
  );
}
