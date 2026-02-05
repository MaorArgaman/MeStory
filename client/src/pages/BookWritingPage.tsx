import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEditor, EditorContent } from '@tiptap/react';
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
  const [book, setBook] = useState<BookData | null>(null);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [loading, setLoading] = useState(true);

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

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CharacterCount,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'editor-content flex-1 w-full h-full outline-none',
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

  // Update editor content when chapter changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [selectedChapterIndex]);

  // Load book data
  useEffect(() => {
    if (bookId) {
      loadBook();
    }
  }, [bookId]);

  // Auto-save every 30 seconds (Section 5.1)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!saved && content) {
        saveBook();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [saved, content]);

  const loadBook = async () => {
    try {
      const response = await api.get(`/books/${bookId}`);
      if (response.data.success) {
        const bookData = response.data.data.book;
        setBook(bookData);

        // If book has chapters, load the first one
        if (bookData.chapters && bookData.chapters.length > 0) {
          setContent(bookData.chapters[0].content || '');
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
    if (!book || !editor) return;

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
      title: `Chapter ${(book.chapters || []).length + 1}`,
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
        toast.success('המשך נוסף בהצלחה!');
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
      toast.error('שגיאה בשיפור הטקסט');
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
    toast.success('הטקסט עודכן בהצלחה!');
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
      <div className="glass-strong border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-ghost flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div className="h-6 w-px bg-gray-700" />
            <h1 className="text-xl font-semibold text-white">{book.title}</h1>
          </div>

          <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* Three-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chapters */}
        <div className="w-64 glass-strong border-r border-white/10 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300">CHAPTERS</h2>
            <button onClick={addChapter} className="btn-ghost p-2">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {book.chapters && book.chapters.length > 0 ? (
              book.chapters.map((chapter, index) => (
                <button
                  key={index}
                  onClick={() => selectChapter(index)}
                  className={
                    selectedChapterIndex === index
                      ? 'sidebar-item-active w-full text-left'
                      : 'sidebar-item w-full text-left'
                  }
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span className="flex-1 truncate">{chapter.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {chapter.wordCount} words
                  </p>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                <p>No chapters yet</p>
                <button onClick={addChapter} className="btn-secondary mt-3 text-xs">
                  Add First Chapter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="flex flex-col h-full">
            {currentChapter ? (
              <>
                <input
                  type="text"
                  value={currentChapter.title}
                  onChange={(e) => {
                    const updated = [...book.chapters];
                    updated[selectedChapterIndex].title = e.target.value;
                    setBook({ ...book, chapters: updated });
                    setSaved(false);
                  }}
                  className="w-full bg-transparent text-2xl font-bold text-white mb-4 focus:outline-none border-b border-transparent focus:border-indigo-500/30 pb-2"
                  placeholder="Chapter Title"
                />

                {/* Rich Text Editor Toolbar */}
                <EditorToolbar editor={editor} />

                {/* Rich Text Editor with AI Floating Toolbar */}
                <div className="editor-panel flex-1 overflow-y-auto relative">
                  <EditorContent editor={editor} />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select or create a chapter to start writing</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - AI & Analysis */}
        <div className="w-80 glass-strong border-l border-white/10 flex flex-col overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-white/10 p-2 gap-1" dir="rtl">
            <button
              onClick={() => setActiveTab('copilot')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'copilot'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI עוזר
            </button>
            <button
              onClick={() => setActiveTab('plot')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'plot'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              עלילה
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'analysis'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              ניתוח
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              {/* Writing Guidance Alert */}
              {guidance && activeTab === 'copilot' && (
                <WritingGuidanceAlert
                  guidance={guidance}
                  onDismiss={dismissGuidance}
                  onApplySuggestion={(text, insertable) => {
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
                        Select a chapter to use AI assistance
                      </p>
                    </div>
                  )}

                  {/* Stats Panel */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      <h2 className="text-sm font-semibold text-gray-300">STATISTICS</h2>
                    </div>
                    <div className="card space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Words</p>
                        <p className="text-lg font-semibold text-white">
                          {book.statistics.wordCount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Chapters</p>
                        <p className="text-lg font-semibold text-white">
                          {book.statistics.chapterCount}
                        </p>
                      </div>
                      {currentChapter && (
                        <div>
                          <p className="text-xs text-gray-500">Current Chapter</p>
                          <p className="text-lg font-semibold text-white">
                            {currentChapter.wordCount} words
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
