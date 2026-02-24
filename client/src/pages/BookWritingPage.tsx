import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import {
  BookOpen,
  Plus,
  Save,
  BarChart3,
  ArrowLeft,
  Loader2,
  Check,
  Palette,
  LayoutGrid,
  Sparkles,
  Target,
  PenTool,
  Menu,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import CharacterCount from '@tiptap/extension-character-count';
import AICopilot from '../components/editor/AICopilot';
import EditorToolbar from '../components/editor/EditorToolbar';
import AIFloatingToolbar, { AIEnhancePreview } from '../components/editor/AIFloatingToolbar';
import { enhanceText } from '../services/analysisApi';
import { EnhanceAction, EnhanceResult, AnalysisTab } from '../types/analysis';
import PlotStructurePanel from '../components/analysis/PlotStructurePanel';
import TensionArcChart from '../components/analysis/TensionArcChart';
import WritingTechniquesCard from '../components/analysis/WritingTechniquesCard';
import WritingGuidanceAlert, { useWritingGuidance } from '../components/analysis/WritingGuidanceAlert';

interface Chapter {
  _id?: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
}

interface BookData {
  id: string;
  title: string;
  genre: string;
  chapters: Chapter[];
  statistics: {
    wordCount: number;
    chapterCount: number;
  };
}

export default function BookWritingPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [book, setBook] = useState<BookData | null>(null);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [loading, setLoading] = useState(true);

  // Mobile sidebar states
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // AI Enhancement state
  const [enhancing, setEnhancing] = useState(false);
  const [loadingAction, setLoadingAction] = useState<EnhanceAction | null>(null);
  const [previewData, setPreviewData] = useState<{
    isOpen: boolean;
    originalText: string;
    result: EnhanceResult | null;
    selectionFrom: number;
    selectionTo: number;
  }>({
    isOpen: false,
    originalText: '',
    result: null,
    selectionFrom: 0,
    selectionTo: 0,
  });

  // Analysis tab state
  const [activeTab, setActiveTab] = useState<AnalysisTab>('copilot');

  // Writing guidance hook
  const { guidance, dismiss: dismissGuidance } = useWritingGuidance(
    bookId,
    selectedChapterIndex,
    content,
    activeTab === 'copilot'
  );

  // Initialize TipTap editor with enhanced configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-indigo-500 pl-4 italic',
          },
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      CharacterCount,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'editor-content flex-1 w-full h-full outline-none focus:outline-none',
        dir: 'auto', // Automatic RTL detection
        'data-placeholder': 'Start writing your story...',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      setSaved(false);
    },
  });

  // Update editor content when chapter changes or content is first loaded
  useEffect(() => {
    if (editor && content !== undefined) {
      // Convert plain text to HTML if needed (for uploaded manuscripts)
      let htmlContent = content;
      if (content && !content.startsWith('<')) {
        // Plain text - wrap in paragraphs
        htmlContent = content
          .split(/\n\n+/)
          .map(para => `<p>${para.trim()}</p>`)
          .join('');
      }

      // Only update if content is different from what's in editor
      const currentHtml = editor.getHTML();
      if (htmlContent && currentHtml !== htmlContent) {
        editor.commands.setContent(htmlContent);
      } else if (!htmlContent && currentHtml !== '<p></p>') {
        // Set empty content if needed
        editor.commands.setContent('');
      }
    }
  }, [selectedChapterIndex, content, editor]);

  // Load book data
  useEffect(() => {
    if (bookId) {
      loadBook();
    }
  }, [bookId]);

  // Auto-save every 30 seconds (Section 5.1)
  useEffect(() => {
    const interval = setInterval(() => {
      // Prevent concurrent saves and only save if there are changes
      if (!saved && content && !saving) {
        saveBook();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [saved, content, saving]);

  const loadBook = async () => {
    try {
      const response = await api.get(`/books/${bookId}`);
      if (response.data.success) {
        const bookData = response.data.data.book;
        setBook(bookData);

        // If book has chapters, load the first one
        if (bookData.chapters && bookData.chapters.length > 0) {
          const chapterContent = bookData.chapters[0].content || '';
          setContent(chapterContent);

          // Also set editor content directly if editor is ready
          if (editor) {
            let htmlContent = chapterContent;
            if (chapterContent && !chapterContent.startsWith('<')) {
              htmlContent = chapterContent
                .split(/\n\n+/)
                .map((para: string) => `<p>${para.trim()}</p>`)
                .join('');
            }
            editor.commands.setContent(htmlContent);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load book:', error);
      toast.error('Failed to load book');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const saveBook = async () => {
    if (!book || !editor || saving) return;

    setSaving(true);
    try {
      // Update the current chapter
      const updatedChapters = [...(book.chapters || [])];

      if (updatedChapters[selectedChapterIndex]) {
        updatedChapters[selectedChapterIndex] = {
          ...updatedChapters[selectedChapterIndex],
          content,
          wordCount: editor.storage.characterCount?.words() || 0,
        };
      }

      const response = await api.put(`/books/${bookId}`, {
        chapters: updatedChapters,
      });

      if (response.data.success) {
        setBook(response.data.data.book);
        setSaved(true);
        toast.success('Saved!', { duration: 1500 });
      }
    } catch (error) {
      console.error('Failed to save book:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addChapter = () => {
    if (!book) return;

    const newChapter: Chapter = {
      title: t('editor.chapter_default', { number: (book.chapters || []).length + 1 }),
      content: '',
      order: (book.chapters || []).length,
      wordCount: 0,
    };

    setBook({
      ...book,
      chapters: [...(book.chapters || []), newChapter],
    });
    setSelectedChapterIndex((book.chapters || []).length);
    setContent('');
    setSaved(false);
  };

  const selectChapter = (index: number) => {
    if (!book || !book.chapters || !book.chapters[index]) return;

    setSelectedChapterIndex(index);
    setContent(book.chapters[index].content || '');
    setSaved(true);
  };

  const handleInsertText = (text: string) => {
    if (!editor) return;

    // Insert text at current cursor position
    editor.chain().focus().insertContent(text).run();
    setSaved(false);
  };

  // AI Enhancement handlers
  const handleEnhance = async (action: EnhanceAction, selectedText: string) => {
    if (!editor || !book) return;

    setEnhancing(true);
    setLoadingAction(action);

    try {
      const { from, to } = editor.state.selection;

      // Get surrounding text for context
      const docContent = editor.state.doc.textContent;
      const surroundingStart = Math.max(0, from - 200);
      const surroundingEnd = Math.min(docContent.length, to + 200);
      const surroundingText = docContent.slice(surroundingStart, surroundingEnd);

      const result = await enhanceText(selectedText, action, {
        genre: book.genre,
        bookId: book.id,
        bookTitle: book.title,
        chapterTitle: book.chapters?.[selectedChapterIndex]?.title,
        surroundingText,
      });

      if (action === 'continue') {
        // For continue action, insert directly after selection
        editor.chain().focus().setTextSelection(to).insertContent(' ' + result.enhancedText).run();
        setSaved(false);
        toast.success('Continuation added successfully!');
      } else {
        // For other actions, show preview
        setPreviewData({
          isOpen: true,
          originalText: selectedText,
          result,
          selectionFrom: from,
          selectionTo: to,
        });
      }
    } catch (error) {
      console.error('Enhancement failed:', error);
      toast.error('Error improving text');
    } finally {
      setEnhancing(false);
      setLoadingAction(null);
    }
  };

  const handleApplyEnhancement = () => {
    if (!editor || !previewData.result) return;

    const { selectionFrom, selectionTo } = previewData;

    // Replace the selected text with enhanced text
    editor
      .chain()
      .focus()
      .deleteRange({ from: selectionFrom, to: selectionTo })
      .insertContentAt(selectionFrom, previewData.result.enhancedText)
      .run();

    setSaved(false);
    setPreviewData({ isOpen: false, originalText: '', result: null, selectionFrom: 0, selectionTo: 0 });
    toast.success('Text updated successfully!');
  };

  const handleCancelEnhancement = () => {
    setPreviewData({ isOpen: false, originalText: '', result: null, selectionFrom: 0, selectionTo: 0 });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!book) {
    return null;
  }

  const currentChapter = book.chapters?.[selectedChapterIndex];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="glass-strong border-b border-white/10 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-ghost flex items-center gap-1 sm:gap-2 p-2 sm:px-3 sm:py-2"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="hidden sm:block h-6 w-px bg-gray-700" />
            <h1 className="text-sm sm:text-xl font-semibold text-white truncate max-w-[120px] sm:max-w-none">{book.title}</h1>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Save Status */}
            <div className="flex items-center gap-2 text-sm">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-gray-400">Saving...</span>
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Saved</span>
                </>
              ) : (
                <span className="text-yellow-400">Unsaved changes</span>
              )}
            </div>

            {/* Design Studio Button */}
            <button
              onClick={() => navigate(`/design/${bookId}`)}
              className="btn-secondary flex items-center gap-2"
            >
              <Palette className="w-4 h-4" />
              Design Cover
            </button>

            {/* Book Layout Button */}
            <button
              onClick={() => navigate(`/layout/${bookId}`)}
              className="btn-secondary flex items-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              Page Layout
            </button>

            {/* Save Button */}
            <button
              onClick={saveBook}
              disabled={saving || saved}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Save Status Icon */}
            <div className="flex items-center">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : saved ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={saveBook}
              disabled={saving || saved}
              className="btn-primary p-2"
            >
              <Save className="w-4 h-4" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="btn-ghost p-2"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="lg:hidden mt-3 pt-3 border-t border-white/10 space-y-2">
            <button
              onClick={() => {
                navigate(`/design/${bookId}`);
                setShowMobileMenu(false);
              }}
              className="w-full btn-secondary flex items-center justify-center gap-2 py-2"
            >
              <Palette className="w-4 h-4" />
              Design Cover
            </button>
            <button
              onClick={() => {
                navigate(`/layout/${bookId}`);
                setShowMobileMenu(false);
              }}
              className="w-full btn-secondary flex items-center justify-center gap-2 py-2"
            >
              <LayoutGrid className="w-4 h-4" />
              Page Layout
            </button>
          </div>
        )}
      </div>

      {/* Three-Column Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Toggle Buttons */}
        <div className="lg:hidden fixed bottom-4 left-4 z-40 flex flex-col gap-2">
          <button
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
            className="glass-strong p-3 rounded-full border border-white/10 shadow-lg"
          >
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </button>
        </div>
        <div className="lg:hidden fixed bottom-4 right-4 z-40 flex flex-col gap-2">
          <button
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            className="glass-strong p-3 rounded-full border border-white/10 shadow-lg"
          >
            <Sparkles className="w-5 h-5 text-purple-400" />
          </button>
        </div>

        {/* Left Sidebar Overlay for Mobile */}
        {showLeftSidebar && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowLeftSidebar(false)}
          />
        )}

        {/* Left Sidebar - Chapters */}
        <div className={`
          ${showLeftSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:relative z-50 lg:z-auto
          w-64 sm:w-72 lg:w-64 h-full
          glass-strong border-r border-white/10 p-3 sm:p-4 overflow-y-auto
          transition-transform duration-300 ease-in-out
        `}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-300">{t('editor.sidebar.chapters')}</h2>
            <div className="flex items-center gap-2">
              <button onClick={addChapter} className="btn-ghost p-2">
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowLeftSidebar(false)}
                className="lg:hidden btn-ghost p-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {book.chapters && book.chapters.length > 0 ? (
              book.chapters.map((chapter, index) => (
                <button
                  key={index}
                  onClick={() => {
                    selectChapter(index);
                    setShowLeftSidebar(false);
                  }}
                  className={
                    selectedChapterIndex === index
                      ? 'sidebar-item-active w-full text-left'
                      : 'sidebar-item w-full text-left'
                  }
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span className="flex-1 truncate text-sm">{chapter.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {chapter.wordCount} {t('editor.statistics.words_unit')}
                  </p>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                <p>{t('editor.sidebar.no_chapters')}</p>
                <button onClick={addChapter} className="btn-secondary mt-3 text-xs">
                  {t('editor.sidebar.add_first')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col overflow-hidden pb-20 lg:pb-0 bg-gradient-to-b from-slate-900/50 to-slate-800/30">
          <div className="flex flex-col h-full">
            {currentChapter ? (
              <>
                {/* Toolbar Container - Sticky */}
                <div className="editor-toolbar-container px-3 sm:px-4 lg:px-6 py-3">
                  {/* Chapter Title Input */}
                  <input
                    type="text"
                    value={currentChapter.title}
                    onChange={(e) => {
                      const updated = [...book.chapters];
                      updated[selectedChapterIndex].title = e.target.value;
                      setBook({ ...book, chapters: updated });
                      setSaved(false);
                    }}
                    className="w-full max-w-4xl mx-auto block bg-transparent text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 focus:outline-none border-b-2 border-white/10 focus:border-indigo-500/50 pb-2 transition-colors"
                    placeholder={t('editor.sidebar.chapter_title')}
                    style={{ fontFamily: "'Merriweather', Georgia, serif" }}
                  />

                  {/* Rich Text Editor Toolbar */}
                  <div className="overflow-x-auto max-w-4xl mx-auto">
                    <EditorToolbar editor={editor} />
                  </div>
                </div>

                {/* Rich Text Editor with AI Floating Toolbar - Paper-like design */}
                <div className="flex-1 overflow-y-auto relative px-3 sm:px-4 lg:px-6 py-4 bg-slate-800/30">
                  <div className="editor-paper">
                    {editor && (
                      <BubbleMenu
                        editor={editor}
                        shouldShow={({ state }) => {
                          const { from, to } = state.selection;
                          const selectedText = state.doc.textBetween(from, to, ' ');
                          // Show toolbar only when text is selected (min 5 chars)
                          return selectedText.trim().length >= 5;
                        }}
                      >
                        <AIFloatingToolbar
                          editor={editor}
                          onEnhance={handleEnhance}
                          isLoading={enhancing}
                          loadingAction={loadingAction}
                        />
                      </BubbleMenu>
                    )}
                    <EditorContent editor={editor} />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center px-4 py-12">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{t('editor.empty.ready_to_write')}</h3>
                  <p className="text-gray-400 mb-6 max-w-sm">
                    {t('editor.empty.create_chapter_prompt')}
                  </p>
                  <button
                    onClick={addChapter}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t('editor.sidebar.add_first')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Overlay for Mobile */}
        {showRightSidebar && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowRightSidebar(false)}
          />
        )}

        {/* Right Panel - AI & Analysis */}
        <div className={`
          ${showRightSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          fixed lg:relative right-0 z-50 lg:z-auto
          w-[85%] sm:w-80 lg:w-80 h-full
          glass-strong border-l border-white/10 flex flex-col overflow-hidden
          transition-transform duration-300 ease-in-out
        `}>
          {/* Mobile Close Button */}
          <div className="lg:hidden flex items-center justify-between p-3 border-b border-white/10">
            <span className="text-sm font-semibold text-gray-300">{t('editor.tabs.ai_analysis')}</span>
            <button
              onClick={() => setShowRightSidebar(false)}
              className="btn-ghost p-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-white/10 p-2 gap-1">
            <button
              onClick={() => setActiveTab('copilot')}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 sm:px-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'copilot'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('editor.tabs.ai_assistant')}</span>
              <span className="sm:hidden">{t('editor.tabs.ai')}</span>
            </button>
            <button
              onClick={() => setActiveTab('plot')}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 sm:px-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'plot'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              {t('editor.tabs.plot')}
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 sm:px-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'analysis'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('editor.tabs.analysis')}</span>
              <span className="sm:hidden">{t('editor.tabs.stats')}</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="space-y-4 sm:space-y-6">
              {/* Writing Guidance Alert */}
              {guidance && activeTab === 'copilot' && (
                <WritingGuidanceAlert
                  guidance={guidance}
                  onDismiss={dismissGuidance}
                  onApplySuggestion={(_text, insertable) => {
                    if (insertable && editor) {
                      editor.chain().focus().insertContent(insertable).run();
                      setSaved(false);
                    }
                    dismissGuidance();
                  }}
                />
              )}

              {/* AI Copilot Tab */}
              {activeTab === 'copilot' && (
                <>
                  {currentChapter ? (
                    <AICopilot
                      currentText={content}
                      genre={book.genre}
                      bookTitle={book.title}
                      chapterTitle={currentChapter.title}
                      onInsertText={handleInsertText}
                    />
                  ) : (
                    <div className="card p-4">
                      <p className="text-sm text-gray-400 text-center py-8">
                        {t('editor.ai.select_chapter')}
                      </p>
                    </div>
                  )}

                  {/* Stats Panel */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      <h2 className="text-sm font-semibold text-gray-300">{t('editor.statistics.title')}</h2>
                    </div>
                    <div className="card space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">{t('editor.statistics.words')}</p>
                        <p className="text-lg font-semibold text-white">
                          {book.statistics.wordCount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('editor.statistics.chapters')}</p>
                        <p className="text-lg font-semibold text-white">
                          {book.statistics.chapterCount}
                        </p>
                      </div>
                      {currentChapter && (
                        <div>
                          <p className="text-xs text-gray-500">{t('editor.statistics.current_chapter')}</p>
                          <p className="text-lg font-semibold text-white">
                            {currentChapter.wordCount} {t('editor.statistics.words_unit')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Plot Analysis Tab */}
              {activeTab === 'plot' && bookId && (
                <div className="space-y-6">
                  <PlotStructurePanel
                    bookId={bookId}
                    chapterCount={book.chapters?.length || 0}
                    onChapterClick={selectChapter}
                  />
                  <TensionArcChart
                    bookId={bookId}
                    chapterCount={book.chapters?.length || 0}
                    currentChapterIndex={selectedChapterIndex}
                    onChapterClick={selectChapter}
                  />
                </div>
              )}

              {/* Writing Techniques Tab */}
              {activeTab === 'analysis' && bookId && (
                <WritingTechniquesCard
                  bookId={bookId}
                  chapterCount={book.chapters?.length || 0}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Enhancement Preview Modal */}
      <AIEnhancePreview
        isOpen={previewData.isOpen}
        originalText={previewData.originalText}
        enhancedText={previewData.result?.enhancedText || ''}
        explanation={previewData.result?.explanation || ''}
        action={previewData.result?.action || 'improve'}
        onApply={handleApplyEnhancement}
        onCancel={handleCancelEnhancement}
        isApplying={false}
      />
    </div>
  );
}
