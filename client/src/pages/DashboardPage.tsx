import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Plus, Loader2, BookOpen, Edit, Palette, Download, Rocket, MessageSquare, Upload, Sparkles, FileText, Mic, PenTool, X, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import CreateBookWizard from '../components/dashboard/CreateBookWizard';
import InterviewWizard from '../components/dashboard/InterviewWizard';
import VoiceInterviewWizard from '../components/interview/VoiceInterviewWizard';
import { saveInterviewToBook, InterviewSummary, InterviewResponse } from '../services/voiceService';
import {
  ContinueReading,
  ContinueWriting,
  RecommendedForYou,
} from '../components/recommendations';
import emptyDashboard from '../assets/images/empty-dashboard.png';
import dashboardIconScratch from '../assets/images/dashboard-icon-scratch.png';
import dashboardIconInterview from '../assets/images/dashboard-icon-interview.png';
import dashboardIconImport from '../assets/images/dashboard-icon-import.png';
import dashboardIconVoice from '../assets/images/dashboard-icon-voice.png';

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
  const [creating, setCreating] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickGenre, setQuickGenre] = useState('Fiction');
  const [transcribing, setTranscribing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const response = await api.get('/books');
      if (response.data.success) {
        setBooks(response.data.data.books);
      }
    } catch (error) {
      console.error('Failed to load books:', error);
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
    try {
      toast('Generating PDF...');
      const response = await api.get(`/books/${bookId}/export`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${bookTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Failed to export book:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.txt', '.doc'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      toast.error('Please upload a PDF, DOCX, or TXT file');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('manuscript', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      formData.append('genre', 'Fiction'); // Default genre

      const response = await api.post('/books/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Manuscript uploaded successfully!');
        setShowUploadModal(false);
        navigate(`/editor/${response.data.data.book.id}`);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload manuscript');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleQuickCreate = async () => {
    if (!quickTitle.trim()) {
      toast.error('Please enter a book title');
      return;
    }

    setCreating(true);
    try {
      const response = await api.post('/books', {
        title: quickTitle.trim(),
        genre: quickGenre,
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
        toast.success('Book created! Start writing...');
        setShowQuickCreateModal(false);
        setQuickTitle('');
        navigate(`/editor/${response.data.data.id}`);
      }
    } catch (error: any) {
      console.error('Quick create error:', error);
      toast.error(error.response?.data?.error || 'Failed to create book');
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
      toast.error('Please upload a valid audio file (MP3, WAV, M4A)');
      return;
    }

    // Validate file size (25MB max)
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Audio file size must be less than 25MB');
      return;
    }

    setTranscribing(true);
    setShowVoiceModal(false);

    try {
      toast.loading('Transcribing audio with AI...', { id: 'audio-transcribe' });

      const formData = new FormData();
      formData.append('audio', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      formData.append('genre', 'Fiction'); // Default genre

      const response = await api.post('/books/upload-audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Audio transcribed successfully!', { id: 'audio-transcribe' });
        navigate(`/editor/${response.data.data.book.id}`);
      }
    } catch (error: any) {
      console.error('Audio upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to transcribe audio', { id: 'audio-transcribe' });
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
        title: summary.theme.mainTheme.slice(0, 50) || 'Untitled Book',
        genre: summary.theme.genre || 'Fiction',
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
        const bookId = response.data.data.id;

        // Save interview to the book
        await saveInterviewToBook(bookId, undefined, summary, responses, duration);

        toast.success('Book created with interview context!');
        setShowVoiceInterviewWizard(false);
        navigate(`/editor/${bookId}`);
      }
    } catch (error: any) {
      console.error('Voice interview completion error:', error);
      toast.error(error.response?.data?.error || 'Failed to create book');
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Creation Hub</h1>
        <p className="text-gray-400">
          Welcome back, {user?.name}! You have {user?.credits} credits remaining.
        </p>
      </div>

      {/* Hero Section - Begin Your Next Masterpiece */}
      <div className="max-w-7xl mx-auto mb-16">
        <div className="text-center mb-10">
          <h2 className="text-5xl font-bold gradient-gold mb-3" style={{ fontFamily: "'Cinzel', serif" }}>
            Begin Your Next Masterpiece
          </h2>
          <p className="text-xl text-gray-400">Choose how you want to bring your story to life</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {/* Card 1: Start from Scratch */}
          <motion.button
            onClick={() => setShowQuickCreateModal(true)}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="glass-gold rounded-2xl p-8 text-center group cursor-pointer relative overflow-hidden h-full"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
              <img
                src={dashboardIconScratch}
                alt="Start from Scratch"
                className="w-16 h-16 mb-4 mx-auto object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform duration-300"
              />
              <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Cinzel', serif" }}>
                Start from Scratch
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Create a blank book and dive straight into writing. Perfect for when inspiration strikes.
              </p>
              <div className="text-xs text-cyan-300 font-medium">
                Quick Start • Immediate
              </div>
            </div>
          </motion.button>

          {/* Card 2: AI Voice Interview */}
          <motion.button
            onClick={() => setShowVoiceInterviewWizard(true)}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="glass-gold rounded-2xl p-8 text-center group cursor-pointer relative overflow-hidden h-full"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-magic-gold/20 to-yellow-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
              <img
                src={dashboardIconInterview}
                alt="Voice Interview"
                className="w-16 h-16 mb-4 mx-auto object-contain drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] group-hover:scale-110 transition-transform duration-300"
              />
              <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Cinzel', serif" }}>
                Voice Interview
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Talk to AI about your story. AI asks questions, you answer by voice.
              </p>
              <div className="text-xs text-magic-gold font-medium">
                Interactive • Voice AI
              </div>
            </div>
          </motion.button>

          {/* Card 3: AI Text Interview */}
          <motion.button
            onClick={() => setShowInterviewModal(true)}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="glass-gold rounded-2xl p-8 text-center group cursor-pointer relative overflow-hidden h-full"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
              <img
                src={dashboardIconInterview}
                alt="Text Interview"
                className="w-16 h-16 mb-4 mx-auto object-contain drop-shadow-[0_0_10px_rgba(99,102,241,0.5)] group-hover:scale-110 transition-transform duration-300"
              />
              <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Cinzel', serif" }}>
                Text Interview
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Answer 8 questions to build your story's foundation with AI guidance.
              </p>
              <div className="text-xs text-indigo-300 font-medium">
                Guided • 15-20 minutes
              </div>
            </div>
          </motion.button>

          {/* Card 3: Import Manuscript */}
          <motion.button
            onClick={() => setShowUploadModal(true)}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="glass-gold rounded-2xl p-8 text-center group cursor-pointer relative overflow-hidden h-full"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
              <img
                src={dashboardIconImport}
                alt="Import Manuscript"
                className="w-16 h-16 mb-4 mx-auto object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform duration-300"
              />
              <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Cinzel', serif" }}>
                Import Manuscript
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Upload an existing manuscript and we'll extract the text for editing.
              </p>
              <div className="text-xs text-purple-300 font-medium">
                PDF, DOCX, TXT • Max 50MB
              </div>
            </div>
          </motion.button>

          {/* Card 4: Voice to Text */}
          <motion.button
            onClick={() => setShowVoiceModal(true)}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="glass-gold rounded-2xl p-8 text-center group cursor-pointer relative overflow-hidden h-full"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
              <img
                src={dashboardIconVoice}
                alt="Voice to Text"
                className="w-16 h-16 mb-4 mx-auto object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover:scale-110 transition-transform duration-300"
              />
              <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Cinzel', serif" }}>
                Voice to Text
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Upload audio and let AI transcribe it into written text automatically.
              </p>
              <div className="text-xs text-emerald-300 font-medium">
                AI Transcription • Multi-Language
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Continue Reading & Writing Sections */}
      <div className="max-w-7xl mx-auto mb-12">
        {/* Continue Reading */}
        <ContinueReading limit={4} title="המשך לקרוא" />

        {/* Continue Writing */}
        <ContinueWriting limit={4} title="המשך לכתוב" />

        {/* Recommended Based on Your Reading */}
        <RecommendedForYou limit={4} title="מומלץ עבורך" showReasons={false} />
      </div>

      {/* Your Library Section */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold gradient-gold mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
            Your Library
          </h2>
          <p className="text-gray-400">Your ongoing projects and completed works</p>
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
              alt="No books yet"
              className="w-full max-w-xs md:max-w-sm h-auto object-contain mb-8 opacity-90"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.9 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            <h2
              className="text-4xl font-bold gradient-gold mb-4 text-center"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Your Masterpiece Awaits
            </h2>
            <p className="text-gray-400 text-lg mb-8 text-center max-w-md">
              Begin your storytelling journey today. Every great story starts with a single word.
            </p>
            <motion.button
              onClick={openWizard}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary px-8 py-4 text-lg font-semibold flex items-center gap-3 shadow-glow-gold"
            >
              <Plus className="w-6 h-6" />
              Create Your First Book
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Book Card */}
            <motion.button
              onClick={openWizard}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="card-hover min-h-[200px] flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-700"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Create New Book</p>
                <p className="text-sm text-gray-400">Start writing your story</p>
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
                  <span>{book.statistics.wordCount.toLocaleString()} words</span>
                  <span>{book.statistics.chapterCount} chapters</span>
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
                    title="Continue Writing"
                  >
                    <Edit className="w-3 h-3" />
                    Write
                  </button>
                  <button
                    onClick={() => navigate(`/design/${book.id}`)}
                    className="btn-secondary text-xs py-2 flex items-center justify-center gap-1"
                    title="Design Cover"
                  >
                    <Palette className="w-3 h-3" />
                    Design
                  </button>
                  {book.publishingStatus.status === 'published' ? (
                    <button
                      onClick={(e) => exportBook(book.id, book.title, e)}
                      className="btn-primary text-xs py-2 flex items-center justify-center gap-1"
                      title="Export PDF"
                    >
                      <Download className="w-3 h-3" />
                      Export
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/publish/${book.id}`)}
                      className="btn-primary text-xs py-2 flex items-center justify-center gap-1"
                      title="Publish Book"
                    >
                      <Rocket className="w-3 h-3" />
                      Publish
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
                  Upload Manuscript
                </h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Upload your existing manuscript and we'll extract the text for you to continue editing.
                </p>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.doc"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />

                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-primary w-full mb-3 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Choose File
                    </>
                  )}
                </button>

                {!uploading && (
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="btn-ghost w-full"
                  >
                    Cancel
                  </button>
                )}

                <p className="text-xs text-gray-500 mt-4">
                  Supported formats: PDF, DOCX, TXT • Max size: 50MB
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
                  Start from Scratch
                </h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Create a blank book with just a title and genre. Perfect for when you're ready to dive straight into writing.
                </p>

                <div className="space-y-4 mb-6">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Book Title *
                    </label>
                    <input
                      type="text"
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      placeholder="Enter your book title"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      autoFocus
                      disabled={creating}
                    />
                  </div>

                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Genre
                    </label>
                    <select
                      value={quickGenre}
                      onChange={(e) => setQuickGenre(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      disabled={creating}
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

                <button
                  onClick={handleQuickCreate}
                  disabled={creating || !quickTitle.trim()}
                  className="btn-primary w-full mb-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PenTool className="w-5 h-5" />
                      Create & Start Writing
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
                    Cancel
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
                  Voice to Text
                </h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Upload an audio file of your story and we'll transcribe it into text using AI. Supports English, Hebrew, and many other languages.
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
                      Transcribing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Choose Audio File
                    </>
                  )}
                </button>

                {!transcribing && (
                  <button
                    onClick={() => setShowVoiceModal(false)}
                    className="btn-ghost w-full"
                  >
                    Cancel
                  </button>
                )}

                <div className="glass rounded-xl p-4 mt-6">
                  <p className="text-xs text-gray-400 mb-2">Supported formats:</p>
                  <p className="text-xs text-gray-300">MP3, WAV, M4A, MP4, MPEG, MPGA, WEBM</p>
                  <p className="text-xs text-gray-400 mt-2">Max size: 25MB</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
