import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import BookLoader from '../components/common/BookLoader';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  Sun,
  Moon,
  Palette,
  Type,
  BookOpen,
  Share2,
  Star,
  Volume2,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  MessageCircle,
  Languages,
  Loader2,
  Menu,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { GlassCard, GlowingButton } from '../components/ui';
import ChatModal from '../components/messaging/ChatModal';
import ShareModal from '../components/social/ShareModal';
import AudioPlayer from '../components/reader/AudioPlayer';
import { MentionDisplay } from '../components/mentions';
import { Mention } from '../services/userApi';

interface AudioTrack {
  url: string;
  duration: number;
  voice: string;
  language?: 'en' | 'he';
  generatedAt: string;
}

interface ChapterAudio {
  // Language-specific voices
  maleVoiceEn?: AudioTrack;
  femaleVoiceEn?: AudioTrack;
  maleVoiceHe?: AudioTrack;
  femaleVoiceHe?: AudioTrack;
  // Legacy fields
  maleVoice?: AudioTrack;
  femaleVoice?: AudioTrack;
}

interface Chapter {
  _id: string;
  title: string;
  content: string;
  order: number;
  audio?: ChapterAudio;
}

interface TranslatedContent {
  title: string;
  chapters: Array<{
    _id: string;
    title: string;
    content: string;
    order: number;
  }>;
  generatedAt?: string;
}

interface Book {
  _id: string;
  title: string;
  author: {
    _id: string;
    name: string;
  };
  mentions?: Mention[];
  chapters: Chapter[];
  genre: string;
  language?: 'en' | 'he';
  translations?: {
    english?: TranslatedContent;
    hebrew?: TranslatedContent;
  };
}

type Theme = 'dark-space' | 'old-paper';

const themes = {
  'dark-space': {
    name: 'Dark Space',
    background: 'linear-gradient(135deg, #0a0a1f 0%, #1a1a3e 100%)',
    text: '#e5e5e5',
    accent: '#FFD700',
    paper: 'rgba(17, 17, 35, 0.8)',
  },
  'old-paper': {
    name: 'Old Paper',
    background: 'linear-gradient(135deg, #f4e8d0 0%, #e8d4b0 100%)',
    text: '#2c1810',
    accent: '#8b4513',
    paper: 'rgba(244, 232, 208, 0.9)',
  },
};

export default function ReaderPage() {
  const { t } = useTranslation();
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark-space');
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState<'merriweather' | 'crimson'>('merriweather');
  const [pageDirection, setPageDirection] = useState<'next' | 'prev'>('next');
  const [selectedText, setSelectedText] = useState('');
  const [shareButtonPos, setShareButtonPos] = useState({ x: 0, y: 0 });
  const [showShareButton, setShowShareButton] = useState(false);
  const [showReviewCard, setShowReviewCard] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [showChatModal, setShowChatModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Translation state
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedBook, setTranslatedBook] = useState<{
    title: string;
    chapters: { _id: string; title: string; content: string; order: number }[];
    targetLanguage: 'hebrew' | 'english';
  } | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  // Narration state
  const [isNarrating, setIsNarrating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showNarrationControls, setShowNarrationControls] = useState(false);
  const [narrationSpeed, setNarrationSpeed] = useState(1.0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [sentences, setSentences] = useState<string[]>([]);
  const [narrationProgress, setNarrationProgress] = useState(0);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  useEffect(() => {
    loadBook();
  }, [bookId]);

  // Text selection handler
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0) {
        setSelectedText(text);
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();

        if (rect) {
          setShareButtonPos({
            x: rect.left + rect.width / 2,
            y: rect.top - 50,
          });
          setShowShareButton(true);
        }
      } else {
        setShowShareButton(false);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, []);

  // Check if on last chapter and scrolled to bottom
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current && book?.chapters?.length && currentChapterIndex === book.chapters.length - 1) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 100;

        if (scrolledToBottom && !showReviewCard) {
          setShowReviewCard(true);
        }
      }
    };

    const content = contentRef.current;
    content?.addEventListener('scroll', handleScroll);

    return () => content?.removeEventListener('scroll', handleScroll);
  }, [book, currentChapterIndex, showReviewCard]);

  // Load available voices for TTS
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Select a Hebrew voice by default, or English
      const hebrewVoice = voices.find(v => v.lang.startsWith('he'));
      const englishVoice = voices.find(v => v.lang.startsWith('en'));

      if (hebrewVoice) {
        setSelectedVoice(hebrewVoice.name);
      } else if (englishVoice) {
        setSelectedVoice(englishVoice.name);
      } else if (voices.length > 0) {
        setSelectedVoice(voices[0].name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Prepare sentences when chapter changes
  useEffect(() => {
    const chapter = book?.chapters[currentChapterIndex];
    if (chapter) {
      const plainText = chapter.content
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();

      const sentenceList = plainText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
      setSentences(sentenceList);
      setCurrentSentenceIndex(-1);
      setNarrationProgress(0);
    }
  }, [book, currentChapterIndex]);

  // Stop narration when chapter changes
  useEffect(() => {
    stopNarration();
  }, [currentChapterIndex]);

  // Start narration
  const startNarration = () => {
    if (!window.speechSynthesis || sentences.length === 0) {
      toast.error(t('reader.narration_not_supported'));
      return;
    }

    setIsNarrating(true);
    setIsPaused(false);
    setShowNarrationControls(true);

    // Start from current sentence or beginning
    const startIndex = currentSentenceIndex >= 0 ? currentSentenceIndex : 0;
    speakSentence(startIndex);
  };

  // Speak a specific sentence
  const speakSentence = (index: number) => {
    if (index >= sentences.length) {
      // End of chapter
      setIsNarrating(false);
      setCurrentSentenceIndex(-1);
      setNarrationProgress(100);

      // Auto-advance to next chapter if available
      if (book?.chapters?.length && currentChapterIndex < book.chapters.length - 1) {
        toast.success(t('reader.chapter_finished'));
        setTimeout(() => {
          nextChapter();
          // Will auto-start narration on next chapter
          setTimeout(() => startNarration(), 1000);
        }, 1500);
      } else {
        toast.success(t('reader.narration_finished'));
      }
      return;
    }

    setCurrentSentenceIndex(index);
    setNarrationProgress((index / sentences.length) * 100);

    const utterance = new SpeechSynthesisUtterance(sentences[index]);
    utterance.rate = narrationSpeed;
    utterance.pitch = 1;

    // Find and set the selected voice
    const voice = availableVoices.find(v => v.name === selectedVoice);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.onend = () => {
      if (!isPaused) {
        speakSentence(index + 1);
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech error:', event);
      if (event.error !== 'interrupted') {
        toast.error(t('reader.narration_error'));
        stopNarration();
      }
    };

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Pause narration
  const pauseNarration = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  // Resume narration
  const resumeNarration = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else if (isNarrating && isPaused) {
      // If we were paused but synthesis was cancelled, restart from current sentence
      setIsPaused(false);
      speakSentence(currentSentenceIndex);
    }
  };

  // Stop narration
  const stopNarration = () => {
    window.speechSynthesis.cancel();
    setIsNarrating(false);
    setIsPaused(false);
    setCurrentSentenceIndex(-1);
    setNarrationProgress(0);
  };

  // Skip forward (next sentence)
  const skipForward = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      window.speechSynthesis.cancel();
      speakSentence(currentSentenceIndex + 1);
    }
  };

  // Skip backward (previous sentence)
  const skipBackward = () => {
    if (currentSentenceIndex > 0) {
      window.speechSynthesis.cancel();
      speakSentence(currentSentenceIndex - 1);
    }
  };

  // Update speed while narrating
  useEffect(() => {
    if (isNarrating && !isPaused && speechSynthRef.current) {
      // Need to restart with new speed
      window.speechSynthesis.cancel();
      speakSentence(currentSentenceIndex);
    }
  }, [narrationSpeed]);

  const loadBook = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/books/${bookId}`);
      if (response.data.success) {
        // Handle both owner format (data.book) and public format (data directly)
        const bookData = response.data.data.book || response.data.data;
        setBook(bookData);
      }
    } catch (error) {
      console.error('Failed to load book:', error);
      toast.error(t('reader.failed_load_book'));
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  // Get current chapter (original or translated)
  const getCurrentChapter = () => {
    if (showTranslation && translatedBook) {
      const chapter = translatedBook.chapters[currentChapterIndex];
      return chapter;
    }
    return book?.chapters?.[currentChapterIndex];
  };

  // Get original chapter (always from the original book - used for audio)
  const getOriginalChapter = () => {
    return book?.chapters?.[currentChapterIndex];
  };

  // Get current book title (original or translated)
  const getCurrentTitle = () => {
    if (showTranslation && translatedBook) {
      return translatedBook.title;
    }
    return book?.title || '';
  };

  // Get the language being displayed (for audio selection)
  const getDisplayLanguage = (): 'en' | 'he' => {
    if (showTranslation) {
      // If showing translation, the language is opposite of original
      return book?.language === 'he' ? 'en' : 'he';
    }
    return book?.language || 'en';
  };

  const currentChapter = getCurrentChapter();
  const originalChapter = getOriginalChapter();
  const displayTitle = getCurrentTitle();
  const progress = book?.chapters?.length ? ((currentChapterIndex + 1) / book.chapters.length) * 100 : 0;

  const nextChapter = () => {
    if (book?.chapters?.length && currentChapterIndex < book.chapters.length - 1) {
      setPageDirection('next');
      setCurrentChapterIndex(currentChapterIndex + 1);
    }
  };

  const prevChapter = () => {
    if (currentChapterIndex > 0) {
      setPageDirection('prev');
      setCurrentChapterIndex(currentChapterIndex - 1);
      setShowReviewCard(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      toast.success(t('reader.text_copied'));
      setShowShareButton(false);
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      toast.error(t('reader.failed_copy'));
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error(t('reader.select_rating'));
      return;
    }

    try {
      // Mock API call
      toast.success(t('reader.thank_you_review'));
      setShowReviewCard(false);
      setRating(0);
      setReviewText('');
    } catch (error) {
      toast.error(t('reader.failed_submit_review'));
    }
  };

  // Detect if book content is primarily Hebrew or English
  const detectLanguage = (text: string): 'hebrew' | 'english' => {
    // Strip HTML tags first to avoid counting tag names as English
    const textWithoutHtml = text.replace(/<[^>]*>/g, '');
    const hebrewRegex = /[\u0590-\u05FF]/g;
    const hebrewMatches = (textWithoutHtml.match(hebrewRegex) || []).length;
    const englishRegex = /[a-zA-Z]/g;
    const englishMatches = (textWithoutHtml.match(englishRegex) || []).length;
    return hebrewMatches > englishMatches ? 'hebrew' : 'english';
  };

  // Translate the book
  const handleTranslateBook = async () => {
    if (!book || !bookId) return;

    // If already showing translation, toggle back to original
    if (showTranslation && translatedBook) {
      setShowTranslation(false);
      return;
    }

    // If we already have a translation in state, just show it
    if (translatedBook) {
      setShowTranslation(true);
      return;
    }

    // Detect current language and determine target
    const firstChapterContent = book.chapters[0]?.content || book.title;
    const currentLanguage = detectLanguage(firstChapterContent);
    const targetLanguage = currentLanguage === 'hebrew' ? 'english' : 'hebrew';

    // Check if book already has pre-saved translation
    const savedTranslation = targetLanguage === 'english'
      ? book.translations?.english
      : book.translations?.hebrew;

    if (savedTranslation && savedTranslation.chapters?.length > 0) {
      // Use saved translation directly - instant!
      setTranslatedBook({
        title: savedTranslation.title,
        chapters: savedTranslation.chapters,
        targetLanguage,
      });
      setShowTranslation(true);
      toast.success(
        targetLanguage === 'hebrew'
          ? t('reader.translated_to_hebrew')
          : t('reader.translated_to_english')
      );
      return;
    }

    // No saved translation, call API
    setIsTranslating(true);
    try {
      const response = await api.post(`/ai/translate-book/${bookId}`, {
        targetLanguage,
      });

      if (response.data.success) {
        setTranslatedBook({
          title: response.data.data.translatedTitle,
          chapters: response.data.data.translatedChapters,
          targetLanguage,
        });
        setShowTranslation(true);
        toast.success(
          targetLanguage === 'hebrew'
            ? t('reader.translated_to_hebrew')
            : t('reader.translated_to_english')
        );
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(t('reader.translation_failed'));
    } finally {
      setIsTranslating(false);
    }
  };

  const pageVariants = {
    enter: (direction: string) => ({
      rotateY: direction === 'next' ? 90 : -90,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: string) => ({
      rotateY: direction === 'next' ? -90 : 90,
      opacity: 0,
      scale: 0.8,
    }),
  };

  if (loading) {
    return <BookLoader variant="fullscreen" message="טוען ספר..." />;
  }

  if (!book || !currentChapter) {
    return null;
  }

  const currentTheme = themes[theme];

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: currentTheme.background }}
    >
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 z-50"
        style={{ background: currentTheme.accent }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: progress / 100 }}
        transition={{ duration: 0.3 }}
      />

      {/* Exit Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => navigate('/marketplace')}
        className="fixed top-3 sm:top-6 right-3 sm:right-6 z-50 w-10 h-10 sm:w-12 sm:h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:shadow-glow-gold"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${currentTheme.accent}`,
        }}
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: currentTheme.accent }} />
      </motion.button>

      {/* Top Menu Bar */}
      <div className="fixed top-3 sm:top-4 left-3 sm:left-4 z-50">
        {/* Menu Toggle Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setShowToolbar(!showToolbar)}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:shadow-glow-gold"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: `1px solid ${currentTheme.accent}`,
          }}
        >
          <Menu
            className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${showToolbar ? 'rotate-90' : ''}`}
            style={{ color: currentTheme.accent }}
          />
        </motion.button>

        {/* Expandable Toolbar */}
        <AnimatePresence>
          {showToolbar && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-12 left-0 backdrop-blur-md rounded-xl p-2 flex flex-row gap-2"
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                border: `1px solid ${currentTheme.accent}40`,
              }}
            >
              {/* Settings Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => {
                  setShowControls(!showControls);
                  setShowToolbar(false);
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
                title={t('reader.settings')}
              >
                <Settings
                  className={`w-5 h-5 transition-transform ${showControls ? 'rotate-90' : ''}`}
                  style={{ color: currentTheme.accent }}
                />
              </motion.button>

              {/* Chat with Author Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => {
                  setShowChatModal(true);
                  setShowToolbar(false);
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
                title={`Chat with ${book.author.name}`}
              >
                <MessageCircle className="w-5 h-5" style={{ color: currentTheme.accent }} />
              </motion.button>

              {/* Share Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => {
                  setShowShareModal(true);
                  setShowToolbar(false);
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
                title={t('reader.share')}
              >
                <Share2 className="w-5 h-5" style={{ color: currentTheme.accent }} />
              </motion.button>

              {/* Translate Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => {
                  handleTranslateBook();
                  setShowToolbar(false);
                }}
                disabled={isTranslating}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:bg-white/10 ${
                  isTranslating ? 'cursor-wait' : ''
                } ${showTranslation ? 'bg-green-500/20 ring-1 ring-green-400' : ''}`}
                title={t('reader.translate_book')}
              >
                {isTranslating ? (
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: currentTheme.accent }} />
                ) : (
                  <Languages className="w-5 h-5" style={{ color: showTranslation ? '#22c55e' : currentTheme.accent }} />
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed top-16 sm:top-20 left-3 sm:left-4 z-40 max-w-[calc(100vw-24px)] sm:max-w-none"
          >
            <GlassCard className="w-64 sm:w-72 p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Theme Selection */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-5 h-5 text-memorial-gold" />
                  <h3 className="font-display font-semibold text-white">{t('reader.theme')}</h3>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setTheme('dark-space')}
                    className={`w-full px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                      theme === 'dark-space'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Moon className="w-5 h-5" />
                    <span className="font-medium">{t('reader.dark_space')}</span>
                  </button>
                  <button
                    onClick={() => setTheme('old-paper')}
                    className={`w-full px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                      theme === 'old-paper'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Sun className="w-5 h-5" />
                    <span className="font-medium">{t('reader.old_paper')}</span>
                  </button>
                </div>
              </div>

              {/* Font Family */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Type className="w-5 h-5 text-memorial-gold" />
                  <h3 className="font-display font-semibold text-white">{t('reader.font')}</h3>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setFontFamily('merriweather')}
                    className={`w-full px-4 py-3 rounded-lg transition-all ${
                      fontFamily === 'merriweather'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                    style={{ fontFamily: 'Merriweather, serif' }}
                  >
                    Merriweather
                  </button>
                  <button
                    onClick={() => setFontFamily('crimson')}
                    className={`w-full px-4 py-3 rounded-lg transition-all ${
                      fontFamily === 'crimson'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                    style={{ fontFamily: 'Crimson Text, serif' }}
                  >
                    Crimson Text
                  </button>
                </div>
              </div>

              {/* Font Size */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-white">{t('reader.font_size')}</h3>
                  <span className="text-memorial-gold font-bold">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="28"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-memorial-gold"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{t('reader.small')}</span>
                  <span>{t('reader.large')}</span>
                </div>
              </div>

              {/* Chapter Navigation */}
              <div>
                <h3 className="font-display font-semibold text-white mb-3">
                  {t('reader.chapter_of', { current: currentChapterIndex + 1, total: book.chapters?.length || 0 })}
                </h3>
                <div className="text-sm text-gray-400">
                  {t('reader.complete', { percent: Math.round(progress) })}
                </div>
              </div>

              {/* Tagged People */}
              {book.mentions && book.mentions.length > 0 && (
                <MentionDisplay mentions={book.mentions} />
              )}

              {/* Narration Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-display font-semibold text-white">{t('reader.narration')}</h3>
                </div>
                {!isNarrating ? (
                  <button
                    onClick={startNarration}
                    className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium flex items-center justify-center gap-2 hover:from-green-500 hover:to-emerald-500 transition-all"
                  >
                    <Volume2 className="w-5 h-5" />
                    {t('reader.start_narration')}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {isPaused ? (
                        <button
                          onClick={resumeNarration}
                          className="flex-1 px-3 py-2 rounded-lg bg-green-600 text-white flex items-center justify-center gap-1"
                        >
                          <Play className="w-4 h-4" />
                          {t('reader.resume')}
                        </button>
                      ) : (
                        <button
                          onClick={pauseNarration}
                          className="flex-1 px-3 py-2 rounded-lg bg-yellow-600 text-white flex items-center justify-center gap-1"
                        >
                          <Pause className="w-4 h-4" />
                          {t('reader.pause')}
                        </button>
                      )}
                      <button
                        onClick={stopNarration}
                        className="px-3 py-2 rounded-lg bg-red-600 text-white flex items-center justify-center"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 text-center">
                      {t('reader.sentences', { current: currentSentenceIndex + 1, total: sentences.length })}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Narration Control Panel */}
      <AnimatePresence>
        {showNarrationControls && isNarrating && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 sm:bottom-32 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-32px)] sm:w-auto"
          >
            <GlassCard className="px-4 sm:px-6 py-3 sm:py-4">
              {/* Progress bar */}
              <div className="w-64 h-1 bg-gray-700 rounded-full mb-4 overflow-hidden">
                <motion.div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${narrationProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Playback controls */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4">
                <button
                  onClick={skipBackward}
                  className="p-3 sm:p-2 rounded-full hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  disabled={currentSentenceIndex <= 0}
                >
                  <SkipBack className="w-5 h-5 text-white" />
                </button>

                {isPaused ? (
                  <button
                    onClick={resumeNarration}
                    className="p-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                  >
                    <Play className="w-6 h-6 text-white" />
                  </button>
                ) : (
                  <button
                    onClick={pauseNarration}
                    className="p-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                  >
                    <Pause className="w-6 h-6 text-white" />
                  </button>
                )}

                <button
                  onClick={stopNarration}
                  className="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Square className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={skipForward}
                  className="p-3 sm:p-2 rounded-full hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  disabled={currentSentenceIndex >= sentences.length - 1}
                >
                  <SkipForward className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Speed control */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                <span className="text-xs text-gray-400">{t('reader.speed')}</span>
                <div className="flex gap-1 flex-wrap justify-center">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setNarrationSpeed(speed)}
                      className={`min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 px-2 sm:px-2 py-2 sm:py-1 text-xs rounded transition-colors ${
                        narrationSpeed === speed
                          ? 'bg-memorial-gold text-black font-bold'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice selection */}
              {availableVoices.length > 0 && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="text-xs text-gray-400">{t('reader.voice')}</span>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="text-xs bg-white/10 border border-white/20 rounded px-2 py-2 sm:py-1 text-white max-w-[150px] min-h-[40px] sm:min-h-0"
                  >
                    {availableVoices.map((voice) => (
                      <option key={voice.name} value={voice.name} className="bg-gray-800">
                        {voice.name.slice(0, 20)} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Current sentence indicator */}
              <div className="mt-3 text-center">
                <span className="text-xs text-gray-400">
                  {t('reader.sentence_of', { current: currentSentenceIndex + 1, total: sentences.length })}
                </span>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Reading Area */}
      <div className="fixed inset-0 flex items-center justify-center px-3 sm:px-8 py-16 sm:py-24">
        <div className="max-w-4xl w-full h-full flex items-center justify-center perspective-1000">
          <AnimatePresence mode="wait" custom={pageDirection}>
            <motion.div
              key={currentChapterIndex}
              custom={pageDirection}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                rotateY: { duration: 0.6, ease: 'easeInOut' },
                opacity: { duration: 0.4 },
                scale: { duration: 0.4 },
              }}
              className="w-full h-full rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden"
              style={{
                background: currentTheme.paper,
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Page Content */}
              <div ref={contentRef} className="h-full overflow-y-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16 custom-scrollbar">
                {/* Chapter Title */}
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-display font-bold mb-4 sm:mb-6 lg:mb-8"
                  dir={getDisplayLanguage() === 'he' ? 'rtl' : 'ltr'}
                  style={{
                    color: currentTheme.accent,
                    fontSize: `${Math.max(fontSize * 1.2, fontSize * 1.8 * 0.7)}px`,
                    textAlign: getDisplayLanguage() === 'he' ? 'right' : 'left',
                  }}
                >
                  {currentChapter.title}
                </motion.h1>

                {/* Chapter Content */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="prose prose-lg max-w-none"
                  dir={getDisplayLanguage() === 'he' ? 'rtl' : 'ltr'}
                  style={{
                    color: currentTheme.text,
                    fontSize: `${fontSize}px`,
                    lineHeight: 1.8,
                    textAlign: getDisplayLanguage() === 'he' ? 'right' : 'left',
                    fontFamily: getDisplayLanguage() === 'he'
                      ? '"Heebo", "David Libre", "Noto Sans Hebrew", sans-serif'
                      : fontFamily === 'merriweather' ? 'Merriweather, serif' : 'Crimson Text, serif',
                  }}
                  dangerouslySetInnerHTML={{ __html: currentChapter.content }}
                />

                {/* Chapter End */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-12 pt-8 border-t"
                  style={{ borderColor: `${currentTheme.accent}40` }}
                >
                  <p className="text-center text-sm opacity-50" style={{ color: currentTheme.text }}>
                    {t('reader.end_of_chapter', { chapter: currentChapterIndex + 1 })}
                  </p>
                </motion.div>

                {/* Rate & Review Card */}
                <AnimatePresence>
                  {showReviewCard && (
                    <motion.div
                      initial={{ opacity: 0, y: 50, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 50, scale: 0.9 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      className="mt-16"
                    >
                      <GlassCard glow="gold" className="max-w-2xl mx-auto">
                        <div className="text-center mb-6">
                          <h3
                            className="font-display text-2xl sm:text-3xl font-bold mb-2"
                            style={{ color: currentTheme.accent }}
                          >
                            {t('reader.reached_the_end')}
                          </h3>
                          <p className="text-gray-400">
                            {t('reader.share_thoughts', { title: book.title })}
                          </p>
                        </div>

                        {/* Star Rating */}
                        <div className="flex justify-center gap-1 sm:gap-2 mb-6">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <motion.button
                              key={star}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setRating(star)}
                              className="focus:outline-none p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            >
                              <Star
                                className={`w-8 h-8 sm:w-10 sm:h-10 transition-all ${
                                  star <= rating
                                    ? 'fill-memorial-gold text-memorial-gold drop-shadow-glow-gold'
                                    : 'text-gray-600 hover:text-gray-400'
                                }`}
                              />
                            </motion.button>
                          ))}
                        </div>

                        {/* Review Text */}
                        <div className="mb-6">
                          <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder={t('reader.write_review_placeholder')}
                            className="w-full h-32 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-memorial-gold/50 focus:shadow-glow-gold transition-all resize-none"
                            style={{
                              fontFamily:
                                fontFamily === 'merriweather'
                                  ? 'Merriweather, serif'
                                  : 'Crimson Text, serif',
                            }}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            {t('reader.characters', { count: reviewText.length })}
                          </p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                          <GlowingButton
                            variant="cosmic"
                            size="lg"
                            onClick={() => setShowReviewCard(false)}
                          >
                            {t('reader.maybe_later')}
                          </GlowingButton>
                          <GlowingButton variant="gold" size="lg" onClick={handleSubmitReview}>
                            {t('reader.submit_review')}
                          </GlowingButton>
                        </div>
                      </GlassCard>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Share Button for Selected Text */}
      <AnimatePresence>
        {showShareButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={handleShare}
            className="fixed z-50 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md transition-all hover:shadow-glow-gold min-h-[44px]"
            style={{
              left: shareButtonPos.x,
              top: shareButtonPos.y,
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.8)',
              border: `1px solid ${currentTheme.accent}`,
              color: currentTheme.accent,
            }}
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-semibold">{t('reader.share')}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="fixed bottom-3 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-4 px-2 sm:px-0">
        <button
          onClick={prevChapter}
          disabled={currentChapterIndex === 0}
          className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full backdrop-blur-md transition-all text-sm sm:text-base min-h-[44px] ${
            currentChapterIndex === 0 ? 'opacity-50 cursor-not-allowed bg-gray-600/50' : 'bg-memorial-gold/20 hover:bg-memorial-gold/30 border border-memorial-gold/50'
          }`}
          style={{ color: currentTheme.accent }}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">{t('reader.previous')}</span>
        </button>

        <div className="glass rounded-full px-3 sm:px-6 py-2 sm:py-3 backdrop-blur-md min-h-[44px] flex items-center">
          <p className="text-xs sm:text-sm font-medium" style={{ color: currentTheme.accent }}>
            {currentChapterIndex + 1} / {book.chapters?.length || 0}
          </p>
        </div>

        <button
          onClick={nextChapter}
          disabled={currentChapterIndex === (book.chapters?.length || 1) - 1}
          className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full backdrop-blur-md transition-all text-sm sm:text-base min-h-[44px] ${
            currentChapterIndex === (book.chapters?.length || 1) - 1 ? 'opacity-50 cursor-not-allowed bg-gray-600/50' : 'bg-memorial-gold/20 hover:bg-memorial-gold/30 border border-memorial-gold/50'
          }`}
          style={{ color: currentTheme.accent }}
        >
          <span className="hidden sm:inline">{t('reader.next')}</span>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Book Info - Hidden on very small screens */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden sm:block fixed bottom-8 left-4 sm:left-8 z-30"
      >
        <div className="glass rounded-xl px-3 sm:px-4 py-2 sm:py-3 backdrop-blur-md max-w-[200px]">
          <p className="text-xs sm:text-sm font-display font-semibold truncate" style={{ color: currentTheme.accent }}>
            {displayTitle}
          </p>
          <p className="text-xs opacity-60 truncate" style={{ color: currentTheme.text }}>
            {t('reader.by_author', { author: book.author.name })}
          </p>
          {showTranslation && (
            <p className="text-xs text-green-400 mt-1">{t('reader.translated')}</p>
          )}
        </div>
      </motion.div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        authorId={book.author._id}
        authorName={book.author.name}
        bookId={book._id}
        bookTitle={book.title}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        bookId={book._id}
        bookTitle={book.title}
        authorName={book.author.name}
      />

      {/* Audio Player - always use original chapter for audio data */}
      {originalChapter?.audio && (
        originalChapter.audio.maleVoice?.url ||
        originalChapter.audio.femaleVoice?.url ||
        originalChapter.audio.maleVoiceEn?.url ||
        originalChapter.audio.femaleVoiceEn?.url ||
        originalChapter.audio.maleVoiceHe?.url ||
        originalChapter.audio.femaleVoiceHe?.url
      ) && (
        <AudioPlayer
          bookId={book._id}
          chapterId={originalChapter._id}
          chapterTitle={currentChapter?.title || originalChapter.title}
          chapterAudio={originalChapter.audio}
          bookLanguage={getDisplayLanguage()}
          onChapterChange={(direction) => {
            if (direction === 'next') {
              nextChapter();
            } else {
              prevChapter();
            }
          }}
          hasNextChapter={currentChapterIndex < (book.chapters?.length || 1) - 1}
          hasPrevChapter={currentChapterIndex > 0}
        />
      )}

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${currentTheme.accent}40;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${currentTheme.accent}60;
        }
      `}</style>
    </div>
  );
}
