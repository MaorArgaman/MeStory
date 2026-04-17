import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { exportBookAsPdfAsync } from '../utils/asyncExport';
import { Plus, Loader2, BookOpen, Edit, Palette, Download, Rocket, Upload, Mic, PenTool, Feather, MessageCircle, FileUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import CreateBookWizard from '../components/dashboard/CreateBookWizard';
import InterviewWizard from '../components/dashboard/InterviewWizard';
import VoiceInterviewWizard from '../components/interview/VoiceInterviewWizard';
import { saveInterviewToBook, InterviewSummary, InterviewResponse } from '../services/voiceService';
import { compressAudio, needsCompression, formatFileSize } from '../utils/audioCompression';
import {
  ContinueReading,
  ContinueWriting,
  RecommendedForYou,
} from '../components/recommendations';
import MemorialSection from '../components/memorial/MemorialSection';
import MyCollaborationsSection from '../components/collaboration/MyCollaborationsSection';

// Memorial-themed dashboard images from public folder
const emptyDashboard = '/img/memorial-hero.png';
const dashboardHero = '/img/new/hero-soldiers-unit.png';
const dashboardIconScratch = '/img/new/card-notebook.png';
const dashboardIconInterview = '/img/new/card-microphone.png';
const dashboardIconVoice = '/img/new/card-recording.png';
const dashboardIconImport = '/img/new/card-old-documents.png';

interface BookItem {
  id: string;
  title: string;
  genre: string;
  publishingStatus: {
    status: string;
  };
  statistics: {
    wordCount: number;
    chapterCount: number;
  };
  updatedAt: string;
}

export default function DashboardPage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showVoiceInterviewWizard, setShowVoiceInterviewWizard] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [creating, setCreating] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickGenre, setQuickGenre] = useState('Fiction');
  const [transcribing, setTranscribing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const response = await api.get('/books');
      if (response.data.success) {
        setBooks(response.data.data.books || []);
      } else {
        console.error('Failed to load books:', response.data.error);
        toast.error(t('dashboard.messages.load_failed', 'Failed to load books'));
      }
    } catch (error: any) {
      console.error('Failed to load books:', error);
      toast.error(error.response?.data?.error || t('dashboard.messages.load_failed', 'Failed to load books'));
    } finally {
      setLoading(false);
    }
  };

  const openWizard = () => {
    setShowWizard(true);
  };

  const closeWizard = () => {
    setShowWizard(false);
  };

  const handleBookCreated = (bookId: string) => {
    setShowWizard(false);
    navigate(`/editor/${bookId}`);
  };

  const exportBook = async (bookId: string, bookTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Live progress toast that updates as the job advances
    const toastId = toast.loading(t('dashboard.messages.generating_pdf'));
    try {
      await exportBookAsPdfAsync({
        bookId,
        bookTitle,
        onProgress: (progress, message) => {
          toast.loading(`${message} (${progress}%)`, { id: toastId });
        },
      });
      toast.success(t('dashboard.messages.export_success'), { id: toastId });
    } catch (error: any) {
      console.error('Failed to export book:', error);
      toast.error(error?.message || t('dashboard.messages.export_failed'), { id: toastId });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF temporarily disabled - use DOCX or TXT)
    const allowedTypes = ['.docx', '.txt', '.doc'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      toast.error(t('dashboard.messages.invalid_file_type'));
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error(t('dashboard.messages.file_too_large'));
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('manuscript', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      formData.append('genre', 'Fiction'); // Default genre

      const response = await api.post('/books/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data.success) {
        toast.success(t('dashboard.messages.upload_success'));
        setShowUploadModal(false);
        navigate(`/editor/${response.data.data.book.id}`);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || t('dashboard.messages.upload_failed'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle drag and drop for file upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Create a synthetic event to reuse handleFileUpload
      const syntheticEvent = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(syntheticEvent);
    }
  };

  const handleQuickCreate = async () => {
    if (!quickTitle.trim()) {
      toast.error(t('dashboard.messages.enter_title'));
      return;
    }

    setCreating(true);
    try {
      const response = await api.post('/books', {
        title: quickTitle.trim(),
        genre: quickGenre,
        chapters: [
          {
            title: t('dashboard.default_chapter_title'),
            content: '',
            order: 0,
            wordCount: 0,
          },
        ],
      });

      if (response.data.success) {
        toast.success(t('dashboard.messages.book_created'));
        setShowQuickCreateModal(false);
        setQuickTitle('');
        navigate(`/editor/${response.data.data.id}`);
      }
    } catch (error: any) {
      console.error('Quick create error:', error);
      toast.error(error.response?.data?.error || t('dashboard.messages.create_failed'));
    } finally {
      setCreating(false);
    }
  };

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.mp3', '.wav', '.m4a', '.mp4', '.mpeg', '.mpga', '.webm'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      toast.error(t('dashboard.messages.invalid_audio_type'));
      return;
    }

    // Validate file size (25MB max)
    if (file.size > 25 * 1024 * 1024) {
      toast.error(t('dashboard.messages.audio_too_large'));
      return;
    }

    setTranscribing(true);
    setShowVoiceModal(false);

    try {
      toast.loading(t('dashboard.messages.transcribing_audio'), { id: 'audio-transcribe' });

      // Compress audio if needed (Vercel has 4.5MB limit)
      let audioToUpload: Blob = file;
      if (needsCompression(file)) {
        toast.loading(t('dashboard.messages.compressing_audio'), { id: 'audio-transcribe' });
        console.log(`Compressing audio: ${formatFileSize(file.size)}`);
        audioToUpload = await compressAudio(file);
        console.log(`Compressed to: ${formatFileSize(audioToUpload.size)}`);
        toast.loading(t('dashboard.messages.transcribing_audio'), { id: 'audio-transcribe' });
      }

      const formData = new FormData();
      formData.append('audio', audioToUpload, 'recording.wav');
      formData.append('title', file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      formData.append('genre', 'Fiction'); // Default genre

      const response = await api.post('/books/upload-audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success(t('dashboard.messages.audio_transcribed'), { id: 'audio-transcribe' });
        navigate(`/editor/${response.data.data.book.id}`);
      }
    } catch (error: any) {
      console.error('Audio upload error:', error);
      toast.error(error.response?.data?.error || t('dashboard.messages.audio_failed'), { id: 'audio-transcribe' });
    } finally {
      setTranscribing(false);
      if (audioInputRef.current) {
        audioInputRef.current.value = '';
      }
    }
  };

  // Handle voice interview completion
  const handleVoiceInterviewComplete = async (
    summary: InterviewSummary,
    responses: InterviewResponse[],
    duration: number
  ) => {
    try {
      // Create a new book first
      const response = await api.post('/books', {
        title: summary.theme.mainTheme.slice(0, 50) || t('dashboard.untitled_book', 'Untitled Book'),
        genre: summary.theme.genre || 'Fiction',
        chapters: [
          {
            title: t('dashboard.default_chapter_title'),
            content: '',
            order: 0,
            wordCount: 0,
          },
        ],
      });

      if (response.data.success) {
        const bookId = response.data.data.id;

        // Save interview to the book
        await saveInterviewToBook(bookId, undefined, summary, responses, duration);

        toast.success(t('dashboard.messages.book_with_interview'));
        setShowVoiceInterviewWizard(false);
        navigate(`/editor/${bookId}`);
      }
    } catch (error: any) {
      console.error('Voice interview completion error:', error);
      toast.error(error.response?.data?.error || t('dashboard.messages.create_failed'));
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Header with Background Image */}
      <div className="relative overflow-hidden pt-24 pb-6 sm:pt-28 sm:pb-8 px-4 sm:px-6 lg:px-8 bg-deep-space">
        <div className="absolute inset-0 z-0">
          <img
            src={dashboardHero}
            alt=""
            className="w-full h-full object-cover opacity-40"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-deep-space/60 to-deep-space" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">{t('dashboard.title')}</h1>
          <p className="text-sm sm:text-base text-gray-300">
            {t('dashboard.welcome', { name: user?.name, credits: user?.credits })}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
      {/* Hero Section - Begin Your Next Masterpiece */}
      <div className="max-w-7xl mx-auto mb-8 sm:mb-12 lg:mb-16">
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold gradient-gold mb-2 sm:mb-3" style={{ fontFamily: "'Cinzel', serif" }}>
            {t('dashboard.hero.title')}
          </h2>
          <p className="text-sm sm:text-base lg:text-xl text-gray-400 px-2">{t('dashboard.hero.subtitle')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 stagger-children">
          {/* Card 1: Start from Scratch */}
          <motion.button
            type="button"
            onClick={() => setShowQuickCreateModal(true)}
            whileHover={{ scale: 1.02, y: -8 }}
            whileTap={{ scale: 0.98 }}
            className="glass rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer relative h-[220px] sm:h-[280px] lg:h-[340px] border border-white/10 hover:border-cyan-500/50 transition-all duration-500"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={dashboardIconScratch}
                alt={t('dashboard.cards.scratch.title')}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-space via-deep-space/80 to-transparent" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 lg:p-6 z-10">
              <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-white mb-1 sm:mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                {t('dashboard.cards.scratch.title')}
              </h3>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-none">
                {t('dashboard.cards.scratch.description')}
              </p>
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30">
                <Feather className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                <span className="text-[10px] sm:text-xs text-cyan-300 font-medium">{t('dashboard.cards.scratch.badge')}</span>
              </div>
            </div>
          </motion.button>

          {/* Card 2: Deep Dive Interview */}
          <motion.button
            type="button"
            onClick={() => setShowInterviewModal(true)}
            whileHover={{ scale: 1.02, y: -8 }}
            whileTap={{ scale: 0.98 }}
            className="glass rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer relative h-[220px] sm:h-[280px] lg:h-[340px] border border-white/10 hover:border-indigo-500/50 transition-all duration-500"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={dashboardIconInterview}
                alt={t('dashboard.cards.interview.title')}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-space via-deep-space/80 to-transparent" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 lg:p-6 z-10">
              <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-white mb-1 sm:mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                {t('dashboard.cards.interview.title')}
              </h3>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-none">
                {t('dashboard.cards.interview.description')}
              </p>
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
                <span className="text-[10px] sm:text-xs text-indigo-300 font-medium">{t('dashboard.cards.interview.badge')}</span>
              </div>
            </div>
          </motion.button>

          {/* Card 3: Voice Dictation */}
          <motion.button
            type="button"
            onClick={() => setShowVoiceModal(true)}
            whileHover={{ scale: 1.02, y: -8 }}
            whileTap={{ scale: 0.98 }}
            className="glass rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer relative h-[220px] sm:h-[280px] lg:h-[340px] border border-white/10 hover:border-memorial-gold/50 transition-all duration-500"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={dashboardIconVoice}
                alt={t('dashboard.cards.voice.title')}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-space via-deep-space/80 to-transparent" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 lg:p-6 z-10">
              <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-white mb-1 sm:mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                {t('dashboard.cards.voice.title')}
              </h3>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-none">
                {t('dashboard.cards.voice.description')}
              </p>
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-memorial-gold/20 border border-memorial-gold/30">
                <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-memorial-gold" />
                <span className="text-[10px] sm:text-xs text-memorial-gold font-medium">{t('dashboard.cards.voice.badge')}</span>
              </div>
            </div>
          </motion.button>

          {/* Card 4: Import Manuscript */}
          <motion.button
            type="button"
            onClick={() => setShowUploadModal(true)}
            whileHover={{ scale: 1.02, y: -8 }}
            whileTap={{ scale: 0.98 }}
            className="glass rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer relative h-[220px] sm:h-[280px] lg:h-[340px] border border-white/10 hover:border-purple-500/50 transition-all duration-500"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={dashboardIconImport}
                alt={t('dashboard.cards.import.title')}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-space via-deep-space/80 to-transparent" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 lg:p-6 z-10">
              <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-white mb-1 sm:mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                {t('dashboard.cards.import.title')}
              </h3>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-none">
                {t('dashboard.cards.import.description')}
              </p>
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30">
                <FileUp className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                <span className="text-[10px] sm:text-xs text-purple-300 font-medium">{t('dashboard.cards.import.badge')}</span>
              </div>
            </div>
          </motion.button>

        </div>
      </div>

      {/* Memorial Section - Hebrew only */}
      {language === 'he' && (
        <div className="max-w-7xl mx-auto mb-16 px-4">
          <MemorialSection />
        </div>
      )}

      {/* My Collaborations Section */}
      <div className="max-w-7xl mx-auto px-4">
        <MyCollaborationsSection />
      </div>

      {/* Continue Reading & Writing Sections */}
      <div className="max-w-7xl mx-auto mb-12">
        {/* Continue Reading */}
        <ContinueReading limit={4} title={t('dashboard.sections.continue_reading')} />

        {/* Continue Writing */}
        <ContinueWriting limit={4} title={t('dashboard.sections.continue_writing')} />

        {/* Recommended Based on Your Reading */}
        <RecommendedForYou limit={4} title={t('dashboard.sections.recommended')} showReasons={false} />
      </div>

      {/* Your Library Section */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold gradient-gold mb-1 sm:mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
            {t('dashboard.sections.your_library')}
          </h2>
          <p className="text-sm sm:text-base text-gray-400">{t('dashboard.sections.your_library_subtitle')}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : books.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center py-16 px-6"
          >
            <motion.img
              src={emptyDashboard}
              alt={t('dashboard.empty.title')}
              className="w-full max-w-xs md:max-w-sm h-auto object-contain mb-8 opacity-90"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.9 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            <h2
              className="text-4xl font-bold gradient-gold mb-4 text-center"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {t('dashboard.empty.title')}
            </h2>
            <p className="text-gray-400 text-lg mb-8 text-center max-w-md">
              {t('dashboard.empty.subtitle')}
            </p>
            <motion.button
              type="button"
              onClick={openWizard}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary px-8 py-4 text-lg font-semibold flex items-center gap-3 shadow-glow-gold"
            >
              <Plus className="w-6 h-6" />
              {t('dashboard.empty.create_first')}
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Book Card */}
            <motion.button
              type="button"
              onClick={openWizard}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="card-hover min-h-[200px] flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-700"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{t('dashboard.book_card.create_new')}</p>
                <p className="text-sm text-gray-400">{t('dashboard.book_card.start_writing')}</p>
              </div>
            </motion.button>

            {/* Existing Books */}
            {books.map((book) => (
              <motion.div
                key={book.id}
                whileHover={{ scale: 1.02 }}
                className="card-hover min-h-[280px] flex flex-col cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:glow transition-all">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white line-clamp-1">{book.title}</h3>
                    <p className="text-sm text-gray-400">{book.genre}</p>
                  </div>
                </div>

                <div className="flex-1" />

                <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                  <span>{book.statistics.wordCount.toLocaleString()} {t('dashboard.book_card.words')}</span>
                  <span>{book.statistics.chapterCount} {t('dashboard.book_card.chapters')}</span>
                </div>

                <div className="mb-4">
                  <span className={`badge ${
                    book.publishingStatus.status === 'published'
                      ? 'badge-success'
                      : 'badge-warning'
                  }`}>
                    {book.publishingStatus.status}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => navigate(`/editor/${book.id}`)}
                    className="btn-secondary text-xs py-2 flex items-center justify-center gap-1"
                    title={t('dashboard.sections.continue_writing')}
                  >
                    <Edit className="w-3 h-3" />
                    {t('dashboard.book_card.write')}
                  </button>
                  <button
                    onClick={() => navigate(`/design/${book.id}`)}
                    className="btn-secondary text-xs py-2 flex items-center justify-center gap-1"
                    title={t('dashboard.book_card.design')}
                  >
                    <Palette className="w-3 h-3" />
                    {t('dashboard.book_card.design')}
                  </button>
                  {/* Export button - available for all books with chapters */}
                  {book.statistics.chapterCount > 0 ? (
                    <button
                      onClick={(e) => exportBook(book.id, book.title, e)}
                      className={`${book.publishingStatus.status === 'published' ? 'btn-primary' : 'btn-secondary'} text-xs py-2 flex items-center justify-center gap-1`}
                      title={t('dashboard.book_card.export')}
                    >
                      <Download className="w-3 h-3" />
                      {t('dashboard.book_card.export')}
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/publish/${book.id}`)}
                      className="btn-primary text-xs py-2 flex items-center justify-center gap-1"
                      title={t('dashboard.book_card.publish')}
                    >
                      <Rocket className="w-3 h-3" />
                      {t('dashboard.book_card.publish')}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Book Wizard */}
      <AnimatePresence>
        {showWizard && (
          <CreateBookWizard
            onClose={closeWizard}
            onSuccess={handleBookCreated}
          />
        )}
      </AnimatePresence>

      {/* AI Interview Modal */}
      <AnimatePresence>
        {showInterviewModal && (
          <InterviewWizard
            onClose={() => setShowInterviewModal(false)}
            onSuccess={(bookId) => {
              setShowInterviewModal(false);
              navigate(`/editor/${bookId}`);
            }}
          />
        )}
      </AnimatePresence>

      {/* Voice Interview Wizard */}
      <AnimatePresence>
        {showVoiceInterviewWizard && (
          <VoiceInterviewWizard
            onComplete={handleVoiceInterviewComplete}
            onCancel={() => setShowVoiceInterviewWizard(false)}
          />
        )}
      </AnimatePresence>

      {/* Upload Manuscript Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !uploading && setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-strong rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-6 glow-purple">
                  <Upload className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold gradient-gold mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
                  {t('dashboard.modals.upload.title')}
                </h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {t('dashboard.modals.upload.description')}
                </p>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.txt,.doc"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 mb-4 cursor-pointer transition-all duration-300 ${
                    isDragging
                      ? 'border-purple-500 bg-purple-500/20 scale-[1.02]'
                      : 'border-gray-600 hover:border-purple-500/50 hover:bg-white/5'
                  } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Upload className={`w-8 h-8 ${isDragging ? 'text-purple-400' : 'text-gray-400'}`} />
                    <p className="text-sm text-gray-300">
                      {isDragging
                        ? t('dashboard.modals.upload.drop_here', 'Drop file here')
                        : t('dashboard.modals.upload.drag_drop', 'Drag & drop your file here, or click to browse')}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                {uploading && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>{t('dashboard.modals.upload.uploading', 'Uploading...')}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-primary w-full mb-3 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('dashboard.modals.upload.processing')}
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      {t('dashboard.modals.upload.button')}
                    </>
                  )}
                </button>

                {!uploading && (
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="btn-ghost w-full"
                  >
                    {t('buttons.cancel')}
                  </button>
                )}

                <p className="text-xs text-gray-500 mt-4">
                  {t('dashboard.modals.upload.formats')}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Create Modal */}
      <AnimatePresence>
        {showQuickCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !creating && setShowQuickCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-strong rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mx-auto mb-6 glow">
                  <PenTool className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold gradient-gold mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
                  {t('dashboard.modals.quick_create.title')}
                </h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {t('dashboard.modals.quick_create.description')}
                </p>

                <div className="space-y-4 mb-6">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('dashboard.modals.quick_create.book_title')}
                    </label>
                    <input
                      type="text"
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      placeholder={t('dashboard.modals.quick_create.book_title_placeholder')}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      autoFocus
                      disabled={creating}
                    />
                  </div>

                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('dashboard.modals.quick_create.genre')}
                    </label>
                    <select
                      value={quickGenre}
                      onChange={(e) => setQuickGenre(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      disabled={creating}
                    >
                      <option value="Fiction" className="bg-gray-800 text-white">{t('dashboard.genres.fiction')}</option>
                      <option value="Fantasy" className="bg-gray-800 text-white">{t('dashboard.genres.fantasy')}</option>
                      <option value="Science Fiction" className="bg-gray-800 text-white">{t('dashboard.genres.science_fiction')}</option>
                      <option value="Mystery" className="bg-gray-800 text-white">{t('dashboard.genres.mystery')}</option>
                      <option value="Thriller" className="bg-gray-800 text-white">{t('dashboard.genres.thriller')}</option>
                      <option value="Romance" className="bg-gray-800 text-white">{t('dashboard.genres.romance')}</option>
                      <option value="Horror" className="bg-gray-800 text-white">{t('dashboard.genres.horror')}</option>
                      <option value="Adventure" className="bg-gray-800 text-white">{t('dashboard.genres.adventure')}</option>
                      <option value="Historical Fiction" className="bg-gray-800 text-white">{t('dashboard.genres.historical_fiction')}</option>
                      <option value="Non-Fiction" className="bg-gray-800 text-white">{t('dashboard.genres.non_fiction')}</option>
                      <option value="Biography" className="bg-gray-800 text-white">{t('dashboard.genres.biography')}</option>
                      <option value="Self-Help" className="bg-gray-800 text-white">{t('dashboard.genres.self_help')}</option>
                      <option value="Other" className="bg-gray-800 text-white">{t('dashboard.genres.other')}</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleQuickCreate}
                  disabled={creating || !quickTitle.trim()}
                  className="btn-primary w-full mb-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('dashboard.modals.quick_create.creating')}
                    </>
                  ) : (
                    <>
                      <PenTool className="w-5 h-5" />
                      {t('dashboard.modals.quick_create.button')}
                    </>
                  )}
                </button>

                {!creating && (
                  <button
                    onClick={() => {
                      setShowQuickCreateModal(false);
                      setQuickTitle('');
                    }}
                    className="btn-ghost w-full"
                  >
                    {t('buttons.cancel')}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice to Text Modal */}
      <AnimatePresence>
        {showVoiceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !transcribing && setShowVoiceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-strong rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 glow">
                  <Mic className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold gradient-gold mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
                  {t('dashboard.modals.voice.title')}
                </h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {t('dashboard.modals.voice.description')}
                </p>

                {/* Hidden Audio Input */}
                <input
                  ref={audioInputRef}
                  type="file"
                  accept=".mp3,.wav,.m4a,.mp4,.mpeg,.mpga,.webm"
                  onChange={handleAudioUpload}
                  className="hidden"
                  disabled={transcribing}
                />

                {/* Upload Button */}
                <button
                  onClick={() => audioInputRef.current?.click()}
                  disabled={transcribing}
                  className="btn-primary w-full mb-3 flex items-center justify-center gap-2"
                >
                  {transcribing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('dashboard.modals.voice.transcribing')}
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      {t('dashboard.modals.voice.button')}
                    </>
                  )}
                </button>

                {!transcribing && (
                  <button
                    onClick={() => setShowVoiceModal(false)}
                    className="btn-ghost w-full"
                  >
                    {t('buttons.cancel')}
                  </button>
                )}

                <div className="glass rounded-xl p-4 mt-6">
                  <p className="text-xs text-gray-400 mb-2">{t('dashboard.modals.voice.formats')}</p>
                  <p className="text-xs text-gray-300">{t('dashboard.modals.voice.formats_list')}</p>
                  <p className="text-xs text-gray-400 mt-2">{t('dashboard.modals.voice.max_size')}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
