import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Mic2,
  MessageCircle,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { GlassCard, GlowingButton } from '../components/ui';
import ChatModal from '../components/messaging/ChatModal';
import ShareModal from '../components/social/ShareModal';

interface Chapter {
  _id: string;
  title: string;
  content: string;
  order: number;
}

interface Book {
  _id: string;
  title: string;
  author: {
    _id: string;
    name: string;
  };
  chapters: Chapter[];
  genre: string;
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
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
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
      if (contentRef.current && book && currentChapterIndex === book.chapters.length - 1) {
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
      toast.error('Narration is not supported in this browser');
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
      if (book && currentChapterIndex < book.chapters.length - 1) {
        toast.success('Chapter finished. Moving to next chapter...');
        setTimeout(() => {
          nextChapter();
          // Will auto-start narration on next chapter
          setTimeout(() => startNarration(), 1000);
        }, 1500);
      } else {
        toast.success('Narration finished');
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
        toast.error('Narration error');
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
        setBook(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load book:', error);
      toast.error('Failed to load book');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const currentChapter = book?.chapters[currentChapterIndex];
  const progress = book ? ((currentChapterIndex + 1) / book.chapters.length) * 100 : 0;

  const nextChapter = () => {
    if (book && currentChapterIndex < book.chapters.length - 1) {
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
      toast.success('Text copied to clipboard!');
      setShowShareButton(false);
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      toast.error('Failed to copy text');
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      // Mock API call
      toast.success('Thank you for your review!');
      setShowReviewCard(false);
      setRating(0);
      setReviewText('');
    } catch (error) {
      toast.error('Failed to submit review');
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
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-deep-space">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-magic-gold mx-auto mb-4 animate-pulse" />
          <p className="text-gray-300 text-lg">Loading book...</p>
        </div>
      </div>
    );
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
        className="fixed top-6 right-6 z-50 w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:shadow-glow-gold"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${currentTheme.accent}`,
        }}
      >
        <X className="w-6 h-6" style={{ color: currentTheme.accent }} />
      </motion.button>

      {/* Settings Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setShowControls(!showControls)}
        className="fixed top-6 left-6 z-50 w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:shadow-glow-gold"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${currentTheme.accent}`,
        }}
      >
        <Settings
          className={`w-6 h-6 transition-transform ${showControls ? 'rotate-90' : ''}`}
          style={{ color: currentTheme.accent }}
        />
      </motion.button>

      {/* Narration Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => {
          if (isNarrating) {
            setShowNarrationControls(!showNarrationControls);
          } else {
            startNarration();
          }
        }}
        className={`fixed top-6 left-20 z-50 w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:shadow-glow-gold ${
          isNarrating ? 'animate-pulse' : ''
        }`}
        style={{
          background: isNarrating ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${isNarrating ? '#22c55e' : currentTheme.accent}`,
        }}
      >
        {isNarrating ? (
          <Volume2 className="w-6 h-6 text-green-400" />
        ) : (
          <Mic2 className="w-6 h-6" style={{ color: currentTheme.accent }} />
        )}
      </motion.button>

      {/* Chat with Author Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setShowChatModal(true)}
        className="fixed top-6 left-[136px] z-50 w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:shadow-glow-gold group"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${currentTheme.accent}`,
        }}
        title={`Chat with ${book.author.name}`}
      >
        <MessageCircle className="w-6 h-6" style={{ color: currentTheme.accent }} />
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-black/80 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          Chat with Author
        </span>
      </motion.button>

      {/* Share Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setShowShareModal(true)}
        className="fixed top-6 left-[192px] z-50 w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:shadow-glow-gold group"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${currentTheme.accent}`,
        }}
        title="Share this book"
      >
        <Share2 className="w-6 h-6" style={{ color: currentTheme.accent }} />
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-black/80 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          Share
        </span>
      </motion.button>

      {/* Control Panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed top-24 left-6 z-40"
          >
            <GlassCard className="w-72 p-6 space-y-6">
              {/* Theme Selection */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-5 h-5 text-magic-gold" />
                  <h3 className="font-display font-semibold text-white">Theme</h3>
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
                    <span className="font-medium">Dark Space</span>
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
                    <span className="font-medium">Old Paper</span>
                  </button>
                </div>
              </div>

              {/* Font Family */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Type className="w-5 h-5 text-magic-gold" />
                  <h3 className="font-display font-semibold text-white">Font</h3>
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
                  <h3 className="font-display font-semibold text-white">Font Size</h3>
                  <span className="text-magic-gold font-bold">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="28"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-magic-gold"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Small</span>
                  <span>Large</span>
                </div>
              </div>

              {/* Chapter Navigation */}
              <div>
                <h3 className="font-display font-semibold text-white mb-3">
                  Chapter {currentChapterIndex + 1} of {book.chapters.length}
                </h3>
                <div className="text-sm text-gray-400">
                  {Math.round(progress)}% Complete
                </div>
              </div>

              {/* Narration Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Mic2 className="w-5 h-5 text-magic-gold" />
                  <h3 className="font-display font-semibold text-white">Narration</h3>
                </div>
                {!isNarrating ? (
                  <button
                    onClick={startNarration}
                    className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium flex items-center justify-center gap-2 hover:from-green-500 hover:to-emerald-500 transition-all"
                  >
                    <Volume2 className="w-5 h-5" />
                    Start Narration
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
                          Resume
                        </button>
                      ) : (
                        <button
                          onClick={pauseNarration}
                          className="flex-1 px-3 py-2 rounded-lg bg-yellow-600 text-white flex items-center justify-center gap-1"
                        >
                          <Pause className="w-4 h-4" />
                          Pause
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
                      {currentSentenceIndex + 1} / {sentences.length} sentences
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
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50"
          >
            <GlassCard className="px-6 py-4">
              {/* Progress bar */}
              <div className="w-64 h-1 bg-gray-700 rounded-full mb-4 overflow-hidden">
                <motion.div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${narrationProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Playback controls */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={skipBackward}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  disabled={currentSentenceIndex <= 0}
                >
                  <SkipBack className="w-5 h-5 text-white" />
                </button>

                {isPaused ? (
                  <button
                    onClick={resumeNarration}
                    className="p-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
                  >
                    <Play className="w-6 h-6 text-white" />
                  </button>
                ) : (
                  <button
                    onClick={pauseNarration}
                    className="p-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
                  >
                    <Pause className="w-6 h-6 text-white" />
                  </button>
                )}

                <button
                  onClick={stopNarration}
                  className="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                >
                  <Square className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={skipForward}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  disabled={currentSentenceIndex >= sentences.length - 1}
                >
                  <SkipForward className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Speed control */}
              <div className="flex items-center justify-center gap-3">
                <span className="text-xs text-gray-400">Speed:</span>
                <div className="flex gap-1">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setNarrationSpeed(speed)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        narrationSpeed === speed
                          ? 'bg-magic-gold text-black font-bold'
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
                  <span className="text-xs text-gray-400">Voice:</span>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="text-xs bg-white/10 border border-white/20 rounded px-2 py-1 text-white max-w-[150px]"
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
                  Sentence {currentSentenceIndex + 1} of {sentences.length}
                </span>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Reading Area */}
      <div className="fixed inset-0 flex items-center justify-center px-8 py-24">
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
              className="w-full h-full rounded-2xl shadow-2xl overflow-hidden"
              style={{
                background: currentTheme.paper,
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Page Content */}
              <div ref={contentRef} className="h-full overflow-y-auto px-12 py-16 custom-scrollbar">
                {/* Chapter Title */}
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-display font-bold mb-8"
                  style={{
                    color: currentTheme.accent,
                    fontSize: `${fontSize * 1.8}px`,
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
                  style={{
                    color: currentTheme.text,
                    fontSize: `${fontSize}px`,
                    lineHeight: 1.8,
                    fontFamily:
                      fontFamily === 'merriweather' ? 'Merriweather, serif' : 'Crimson Text, serif',
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
                    End of Chapter {currentChapterIndex + 1}
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
                            className="font-display text-3xl font-bold mb-2"
                            style={{ color: currentTheme.accent }}
                          >
                            You've Reached the End!
                          </h3>
                          <p className="text-gray-400">
                            Share your thoughts about "{book.title}"
                          </p>
                        </div>

                        {/* Star Rating */}
                        <div className="flex justify-center gap-2 mb-6">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <motion.button
                              key={star}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setRating(star)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`w-10 h-10 transition-all ${
                                  star <= rating
                                    ? 'fill-magic-gold text-magic-gold drop-shadow-glow-gold'
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
                            placeholder="Write your review here... (optional)"
                            className="w-full h-32 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-magic-gold/50 focus:shadow-glow-gold transition-all resize-none"
                            style={{
                              fontFamily:
                                fontFamily === 'merriweather'
                                  ? 'Merriweather, serif'
                                  : 'Crimson Text, serif',
                            }}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            {reviewText.length} / 500 characters
                          </p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-center gap-4">
                          <GlowingButton
                            variant="cosmic"
                            size="lg"
                            onClick={() => setShowReviewCard(false)}
                          >
                            Maybe Later
                          </GlowingButton>
                          <GlowingButton variant="gold" size="lg" onClick={handleSubmitReview}>
                            Submit Review
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
            className="fixed z-50 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md transition-all hover:shadow-glow-gold"
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
            <span className="text-sm font-semibold">Share</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4">
        <GlowingButton
          variant={currentChapterIndex === 0 ? 'cosmic' : 'gold'}
          size="lg"
          onClick={prevChapter}
          disabled={currentChapterIndex === 0}
          className={currentChapterIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}
        >
          <ChevronLeft className="w-6 h-6" />
          Previous
        </GlowingButton>

        <div className="glass rounded-full px-6 py-3 backdrop-blur-md">
          <p className="text-sm font-medium" style={{ color: currentTheme.accent }}>
            {currentChapterIndex + 1} / {book.chapters.length}
          </p>
        </div>

        <GlowingButton
          variant={currentChapterIndex === book.chapters.length - 1 ? 'cosmic' : 'gold'}
          size="lg"
          onClick={nextChapter}
          disabled={currentChapterIndex === book.chapters.length - 1}
          className={
            currentChapterIndex === book.chapters.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
          }
        >
          Next
          <ChevronRight className="w-6 h-6" />
        </GlowingButton>
      </div>

      {/* Book Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-8 left-8 z-30"
      >
        <div className="glass rounded-xl px-4 py-3 backdrop-blur-md">
          <p className="text-sm font-display font-semibold" style={{ color: currentTheme.accent }}>
            {book.title}
          </p>
          <p className="text-xs opacity-60" style={{ color: currentTheme.text }}>
            by {book.author.name}
          </p>
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
