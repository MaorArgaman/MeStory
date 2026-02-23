import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Loader2,
  Sparkles,
  Layout,
  Palette,
  Check,
  Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import {
  BookTemplate,
  AIDesignState,
  DesignPath,
} from '../types/templates';
import TemplateSelector from '../components/design/TemplateSelector';
import AIDesignWizard from '../components/design/AIDesignWizard';
import Book3DPreview from '../components/design/Book3DPreview';

// Book data interface
interface BookData {
  id: string;
  title: string;
  author?: { name: string };
  genre: string;
  language: string;
  synopsis?: string;
  description?: string;
  chapters: Array<{
    title: string;
    content: string;
    wordCount: number;
  }>;
  coverDesign?: {
    coverColor?: string;
    textColor?: string;
    fontFamily?: string;
    imageUrl?: string;
    front?: {
      type?: string;
      imageUrl?: string;
      backgroundColor?: string;
      gradientColors?: string[];
      title?: {
        text: string;
        font: string;
        size: number;
        color: string;
        position?: { x: number; y: number };
      };
      authorName?: {
        text: string;
        font: string;
        size: number;
        color: string;
      };
    };
    back?: {
      imageUrl?: string;
      backgroundColor?: string;
      synopsis?: string;
    };
    spine?: {
      backgroundColor?: string;
      title?: string;
      author?: string;
    };
  };
  pageLayout?: any;
  aiDesignState?: AIDesignState;
  templateId?: string;
}

export default function BookDesignPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  // State
  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Design flow state
  const [designPath, setDesignPath] = useState<DesignPath | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<BookTemplate | null>(null);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [aiDesignState, setAiDesignState] = useState<AIDesignState | null>(null);

  // Preview state (reserved for future use)
  // const [previewSpread, setPreviewSpread] = useState(0);
  // const [showSettings, setShowSettings] = useState(false);

  // Load book data
  useEffect(() => {
    if (bookId) {
      loadBook();
    }
  }, [bookId]);

  const loadBook = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/books/${bookId}`);
      if (response.data.success) {
        const bookData = response.data.data.book;
        setBook(bookData);

        // Check if there's an existing AI design state
        if (bookData.aiDesignState) {
          setAiDesignState(bookData.aiDesignState);
          if (bookData.aiDesignState.status === 'completed') {
            setDesignPath('ai');
          }
        }

        // Check if template was previously applied
        if (bookData.templateId) {
          setDesignPath('template');
        }
      }
    } catch (error: any) {
      console.error('Load book error:', error);
      toast.error(isHebrew ? 'שגיאה בטעינת הספר' : 'Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  // Handle path selection
  const handleSelectPath = (path: DesignPath) => {
    setDesignPath(path);
    if (path === 'ai') {
      setShowAIWizard(true);
    }
  };

  // Handle template selection
  const handleSelectTemplate = async (template: BookTemplate) => {
    setSelectedTemplate(template);
    // Apply template to book
    try {
      setSaving(true);
      toast.loading(isHebrew ? 'מחיל תבנית...' : 'Applying template...', { id: 'apply-template' });

      const response = await api.post(`/templates/books/${bookId}/apply-template`, {
        templateId: template._id,
      });

      if (response.data.success) {
        toast.success(isHebrew ? 'התבנית הוחלה בהצלחה!' : 'Template applied successfully!', { id: 'apply-template' });
        loadBook();
      }
    } catch (error: any) {
      console.error('Apply template error:', error);
      toast.error(isHebrew ? 'שגיאה בהחלת התבנית' : 'Failed to apply template', { id: 'apply-template' });
    } finally {
      setSaving(false);
    }
  };

  // Handle AI design completion
  const handleAIDesignComplete = (design: any) => {
    setAiDesignState(design);
    setShowAIWizard(false);
    loadBook();
  };

  // Save design
  const saveDesign = async () => {
    if (!book) return;

    setSaving(true);
    try {
      const response = await api.put(`/books/${bookId}`, {
        pageLayout: book.pageLayout,
        coverDesign: book.coverDesign,
      });

      if (response.data.success) {
        setLastSaved(new Date());
        toast.success(isHebrew ? 'העיצוב נשמר!' : 'Design saved!');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(isHebrew ? 'שגיאה בשמירה' : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Navigate to editor
  const goToEditor = () => {
    navigate(`/editor/${bookId}`);
  };

  // Navigate to layout page (for detailed editing)
  const goToDetailedLayout = () => {
    navigate(`/layout/${bookId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">{isHebrew ? 'טוען...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">{isHebrew ? 'הספר לא נמצא' : 'Book not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg"
          >
            {isHebrew ? 'חזור לדף הבית' : 'Back to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white" dir={isHebrew ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={goToEditor}
                className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title={isHebrew ? 'חזור לעורך' : 'Back to Editor'}
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div>
                <h1 className="font-semibold text-sm sm:text-lg truncate max-w-[150px] sm:max-w-none">{book.title}</h1>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                  {isHebrew ? 'עיצוב הספר' : 'Book Design'}
                </p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3">
              {lastSaved && (
                <span className="hidden md:block text-sm text-gray-400">
                  {saving ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isHebrew ? 'שומר...' : 'Saving...'}
                    </span>
                  ) : (
                    `${isHebrew ? 'נשמר' : 'Saved'} ${lastSaved.toLocaleTimeString()}`
                  )}
                </span>
              )}

              <button
                onClick={goToDetailedLayout}
                className="p-2 sm:px-3 sm:py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Layout className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isHebrew ? 'עריכה מתקדמת' : 'Advanced Editor'}
                </span>
              </button>

              <button
                onClick={saveDesign}
                disabled={saving}
                className="p-2 sm:px-4 sm:py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{isHebrew ? 'שמור' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Show template selector if no path selected */}
        {!designPath && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            {/* Title */}
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">
                {isHebrew ? 'בחר את סגנון העיצוב שלך' : 'Choose Your Design Style'}
              </h2>
              <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto px-2">
                {isHebrew
                  ? 'בחר תבנית מוכנה, תן לבינה המלאכותית לעצב את הספר, או התחל מאפס עם התאמה אישית מלאה'
                  : 'Choose a ready-made template, let AI design your book, or start from scratch with full customization'}
              </p>
            </div>

            {/* Design Path Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12">
              {/* AI Design */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPath('ai')}
                className="relative bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:border-purple-400 transition-all group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-purple-600/30 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
                    {isHebrew ? 'עיצוב עם AI' : 'AI Design'}
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    {isHebrew
                      ? 'הבינה המלאכותית תנתח את הספר ותעצב הכל - כריכה, פריסה, גופנים ותמונות'
                      : 'AI analyzes your book and designs everything - cover, layout, fonts, and images'}
                  </p>
                  <div className="mt-3 sm:mt-4 inline-flex items-center gap-1 text-purple-400 text-xs sm:text-sm font-medium">
                    <span>{isHebrew ? 'מומלץ' : 'Recommended'}</span>
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </div>
              </motion.button>

              {/* Template Selection */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPath('template')}
                className="bg-gray-800/50 border-2 border-gray-600/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:border-gray-500 transition-all"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-700/50 rounded-full flex items-center justify-center">
                  <Layout className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
                  {isHebrew ? 'תבנית מוכנה' : 'Ready Template'}
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm">
                  {isHebrew
                    ? 'בחר מתוך 10 תבניות מעוצבות מראש לפי סוג הספר שלך'
                    : 'Choose from 10 pre-designed templates based on your book type'}
                </p>
              </motion.button>

              {/* Custom Design */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPath('custom')}
                className="bg-gray-800/50 border-2 border-gray-600/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:border-gray-500 transition-all sm:col-span-2 md:col-span-1"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-700/50 rounded-full flex items-center justify-center">
                  <Palette className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
                  {isHebrew ? 'התאמה אישית' : 'Custom Design'}
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm">
                  {isHebrew
                    ? 'עצב את הספר בעצמך עם כל הכלים הזמינים'
                    : 'Design your book yourself with all available tools'}
                </p>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Template Selection View */}
        {designPath === 'template' && !selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <button
                onClick={() => setDesignPath(null)}
                className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <h2 className="text-lg sm:text-2xl font-bold">
                {isHebrew ? 'בחר תבנית' : 'Choose Template'}
              </h2>
            </div>

            <TemplateSelector
              onSelect={handleSelectTemplate}
              selectedId={undefined}
              bookGenre={book.genre}
              language={language}
            />
          </motion.div>
        )}

        {/* Custom Design - Navigate to layout editor */}
        {designPath === 'custom' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 sm:py-12 px-4"
          >
            <Palette className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-purple-400" />
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
              {isHebrew ? 'מצב התאמה אישית' : 'Custom Design Mode'}
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">
              {isHebrew
                ? 'במצב זה תוכל לעצב כל היבט של הספר בעצמך'
                : 'In this mode you can design every aspect of your book yourself'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => setDesignPath(null)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                {isHebrew ? 'חזור' : 'Back'}
              </button>
              <button
                onClick={goToDetailedLayout}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Layout className="w-4 h-4 sm:w-5 sm:h-5" />
                {isHebrew ? 'פתח עורך מתקדם' : 'Open Advanced Editor'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Design Preview (when design is completed) */}
        {(designPath === 'ai' || designPath === 'template') && !showAIWizard && (aiDesignState?.status === 'completed' || selectedTemplate) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setDesignPath(null);
                    setSelectedTemplate(null);
                  }}
                  className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <h2 className="text-lg sm:text-2xl font-bold">
                  {isHebrew ? 'תצוגה מקדימה' : 'Design Preview'}
                </h2>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={goToDetailedLayout}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                >
                  <Settings className="w-4 h-4" />
                  {isHebrew ? 'ערוך' : 'Edit'}
                </button>
                <button
                  onClick={saveDesign}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                >
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline">{isHebrew ? 'אשר והמשך' : 'Confirm & Continue'}</span>
                  <span className="sm:hidden">{isHebrew ? 'אשר' : 'Confirm'}</span>
                </button>
              </div>
            </div>

            {/* 3D Preview */}
            <div className="flex justify-center mb-6 sm:mb-8 overflow-hidden">
              <div className="transform scale-75 sm:scale-100">
                <Book3DPreview
                  title={book.title}
                  author={book.author?.name || 'Author'}
                  coverColor={book.coverDesign?.front?.backgroundColor || book.coverDesign?.coverColor || '#1a1a2e'}
                  textColor={book.coverDesign?.front?.title?.color || book.coverDesign?.textColor || '#ffffff'}
                  fontFamily={book.coverDesign?.front?.title?.font || book.coverDesign?.fontFamily || 'Georgia'}
                  imageUrl={book.coverDesign?.front?.imageUrl || book.coverDesign?.imageUrl}
                  language={book.language}
                />
              </div>
            </div>

            {/* Design Summary */}
            {aiDesignState?.design && (
              <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 max-w-2xl mx-auto">
                <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  {isHebrew ? 'סיכום העיצוב' : 'Design Summary'}
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-gray-400">{isHebrew ? 'גופן גוף:' : 'Body Font:'}</span>
                    <span className="ml-1 sm:ml-2">{aiDesignState.design.typography?.bodyFont}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">{isHebrew ? 'גופן כותרות:' : 'Heading Font:'}</span>
                    <span className="ml-1 sm:ml-2">{aiDesignState.design.typography?.headingFont}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">{isHebrew ? 'עמודות:' : 'Columns:'}</span>
                    <span className="ml-1 sm:ml-2">{aiDesignState.design.layout?.columns || 1}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">{isHebrew ? 'תמונות:' : 'Images:'}</span>
                    <span className="ml-1 sm:ml-2">{aiDesignState.design.imagePlacements?.length || 0}</span>
                  </div>
                </div>
                {aiDesignState.design.reasoning && (
                  <p className="mt-3 sm:mt-4 text-gray-400 text-xs sm:text-sm italic">
                    {aiDesignState.design.reasoning}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* AI Design Wizard Modal */}
      <AnimatePresence>
        {showAIWizard && (
          <AIDesignWizard
            bookId={bookId!}
            book={book}
            onComplete={handleAIDesignComplete}
            onClose={() => {
              setShowAIWizard(false);
              if (!aiDesignState?.status || aiDesignState.status === 'idle') {
                setDesignPath(null);
              }
            }}
            language={language}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
