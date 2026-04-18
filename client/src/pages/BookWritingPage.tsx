import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import {
  BookOpen,
  Plus,
  Save,
  Loader2,
  Check,
  Palette,
  LayoutGrid,
  Sparkles,
  Target,
  PenTool,
  Menu,
  X,
  Trash2,
  UserPlus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Search,
  Replace,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import CharacterCount from '@tiptap/extension-character-count';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import AICopilot from '../components/editor/AICopilot';
import EditorToolbar from '../components/editor/EditorToolbar';
import AIHelpMenu from '../components/editor/AIHelpMenu';
import DraftNotes from '../components/editor/DraftNotes';
import AIFloatingToolbar, { AIEnhancePreview } from '../components/editor/AIFloatingToolbar';
import { enhanceText } from '../services/analysisApi';
import { EnhanceAction, EnhanceResult, AnalysisTab } from '../types/analysis';
import { useWritingGuidance } from '../components/analysis/WritingGuidanceAlert';
import PlotStructurePanel from '../components/analysis/PlotStructurePanel';
import TensionArcChart from '../components/analysis/TensionArcChart';
import WritingTechniquesCard from '../components/analysis/WritingTechniquesCard';
import { useLanguage } from '../contexts/LanguageContext';
import BrandWatermark from '../components/common/BrandWatermark';
import BookProgressStepper from '../components/common/BookProgressStepper';
import { CollaboratorsList } from '../components/collaboration';

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
  language?: string;
  chapters: Chapter[];
  statistics: {
    wordCount: number;
    chapterCount: number;
  };
}

// Simple rotating writing tip component for the sidebar
function WritingTipRotator({ isHebrew }: { isHebrew: boolean }) {
  const tips = isHebrew
    ? [
        'נסה לתאר ריח או צליל שאתה זוכר',
        'ספר מה הרגשת באותו רגע',
        'תאר את המקום כאילו אתה שם עכשיו',
        'מה היית אומר לעצמך הצעיר?',
        'איזה שיר או טעם מחזיר אותך לשם?',
        'נסה להתחיל עם משפט קצר ופשוט',
      ]
    : [
        'Try describing a smell or sound you remember',
        'Tell what you felt in that moment',
        'Describe the place as if you are there now',
        'What would you say to your younger self?',
        'What song or taste takes you back there?',
        'Try starting with a short, simple sentence',
      ];

  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-3 text-center" dir={isHebrew ? 'rtl' : 'ltr'}>
      <p className="text-xs text-amber-400/80 mb-1">
        {isHebrew ? '💡 טיפ לכתיבה' : '💡 Writing tip'}
      </p>
      <p className="text-sm text-amber-200/90 leading-relaxed">
        &ldquo;{tips[tipIndex]}&rdquo;
      </p>
    </div>
  );
}

export default function BookWritingPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { language } = useLanguage();
  const isHebrew = language === 'he';
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
  const [showCollaboratorsPanel, setShowCollaboratorsPanel] = useState(false);

  // Google Docs-like features
  const [zoomLevel, setZoomLevel] = useState(100);
  const [focusMode, setFocusMode] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [findCount, setFindCount] = useState(0);

  // Refs for sidebar focus management
  const leftSidebarRef = useRef<HTMLDivElement>(null);
  const rightSidebarRef = useRef<HTMLDivElement>(null);

  // Ref for debounced auto-save timer
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autosave versioning to prevent out-of-order saves
  const saveVersionRef = useRef(0);
  const pendingSaveRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  // Focus management for sidebars (accessibility)
  useEffect(() => {
    if (showLeftSidebar && leftSidebarRef.current) {
      // Focus the first focusable element in the left sidebar
      const focusableElement = leftSidebarRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusableElement?.focus();
    }
  }, [showLeftSidebar]);

  useEffect(() => {
    if (showRightSidebar && rightSidebarRef.current) {
      // Focus the first focusable element in the right sidebar
      const focusableElement = rightSidebarRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusableElement?.focus();
    }
  }, [showRightSidebar]);

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
  const [activeTab] = useState<AnalysisTab>('copilot');

  // Writing guidance hook
  const { guidance: _guidance, dismiss: _dismissGuidance } = useWritingGuidance(
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
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'editor-image max-w-full h-auto rounded-lg my-4',
        },
      }),
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

  // Debounced auto-save: saves 2 seconds after last edit
  useEffect(() => {
    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    // Only set timer if there are unsaved changes
    if (!saved && content && !saving) {
      autoSaveTimerRef.current = setTimeout(() => {
        saveBook();
      }, 2000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [saved, content, saving]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!saved) {
        e.preventDefault();
        e.returnValue = t('status.unsaved_changes');
        return t('status.unsaved_changes');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saved, t]);

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
      toast.error(isHebrew ? 'לא הצלחנו לטעון את הספר' : 'Failed to load book');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const saveBook = async (isRetry = false) => {
    if (!book || !editor) return;

    // Prevent concurrent saves
    if (pendingSaveRef.current && !isRetry) return;

    // Increment version for this save
    const currentVersion = ++saveVersionRef.current;
    pendingSaveRef.current = true;

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

      // Backup to localStorage before saving
      try {
        localStorage.setItem(`mestory_backup_${bookId}_${selectedChapterIndex}`, JSON.stringify({
          content,
          timestamp: Date.now(),
          version: currentVersion,
        }));
      } catch (e) {
      }

      const response = await api.put(`/books/${bookId}`, {
        chapters: updatedChapters,
      });

      // Only apply if this is still the latest save
      if (currentVersion === saveVersionRef.current && response.data.success) {
        setBook(response.data.data.book);
        setSaved(true);
        retryCountRef.current = 0;
        // Clear backup on successful save
        try {
          localStorage.removeItem(`mestory_backup_${bookId}_${selectedChapterIndex}`);
        } catch (e) {
          // Ignore
        }
        toast.success(t('status.saved'), { duration: 1500 });
      }
    } catch (error) {
      console.error('Failed to save book:', error);

      // Retry logic
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        toast.error(t('errors.save_failed_retrying', { attempt: retryCountRef.current, max: MAX_RETRIES }), { duration: 2000 });
        setTimeout(() => saveBook(true), 2000 * retryCountRef.current);
      } else {
        retryCountRef.current = 0;
        toast.error(t('errors.save_failed_backup'), { duration: 5000 });
      }
    } finally {
      pendingSaveRef.current = false;
      setSaving(false);
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 70));

  // Find and Replace
  const handleFind = useCallback(() => {
    if (!editor || !findText) { setFindCount(0); return; }
    const text = editor.getText();
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    setFindCount(matches ? matches.length : 0);
  }, [editor, findText]);

  const handleReplace = useCallback(() => {
    if (!editor || !findText) return;
    const { state } = editor;
    const { from, to } = state.selection;
    const selectedText = state.doc.textBetween(from, to);
    if (selectedText.toLowerCase() === findText.toLowerCase()) {
      editor.chain().focus().deleteSelection().insertContent(replaceText).run();
      handleFind();
    }
  }, [editor, findText, replaceText, handleFind]);

  const handleReplaceAll = useCallback(() => {
    if (!editor || !findText) return;
    const currentContent = editor.getHTML();
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newContent = currentContent.replace(regex, replaceText);
    editor.commands.setContent(newContent);
    setFindCount(0);
    setSaved(false);
  }, [editor, findText, replaceText]);

  // Keyboard shortcuts for Docs-like features
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowFindReplace(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowFindReplace(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
      if (e.key === 'Escape') {
        if (showFindReplace) setShowFindReplace(false);
        if (focusMode) setFocusMode(false);
      }
      if (e.key === 'F11') {
        e.preventDefault();
        setFocusMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFindReplace, focusMode]);

  // Update find count when search text changes
  useEffect(() => { handleFind(); }, [findText, handleFind]);

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

  const selectChapter = useCallback(async (index: number) => {
    if (!book || !book.chapters || !book.chapters[index]) return;

    // Save current chapter if there are unsaved changes before switching
    if (!saved && editor && book.chapters[selectedChapterIndex]) {
      const updatedChapters = [...book.chapters];
      updatedChapters[selectedChapterIndex] = {
        ...updatedChapters[selectedChapterIndex],
        content,
        wordCount: editor.storage.characterCount?.words() || 0,
      };

      try {
        const response = await api.put(`/books/${bookId}`, {
          chapters: updatedChapters,
        });

        if (response.data.success) {
          setBook(response.data.data.book);
        }
      } catch (error) {
        console.error('Failed to save before switching chapter:', error);
        // Continue switching even if save fails
      }
    }

    setSelectedChapterIndex(index);
    setContent(book.chapters[index].content || '');
    setSaved(true);
  }, [book, saved, editor, selectedChapterIndex, content, bookId]);

  const deleteChapter = useCallback(async (index: number) => {
    if (!book || !book.chapters || book.chapters.length === 0) return;

    // Show confirmation dialog
    const confirmed = window.confirm(t('editor.chapters.delete_confirm'));
    if (!confirmed) return;

    const updatedChapters = [...book.chapters];
    updatedChapters.splice(index, 1);

    // Re-order remaining chapters
    updatedChapters.forEach((chapter, i) => {
      chapter.order = i;
    });

    try {
      const response = await api.put(`/books/${bookId}`, {
        chapters: updatedChapters,
      });

      if (response.data.success) {
        setBook(response.data.data.book);

        // Handle edge cases for selected chapter index
        if (updatedChapters.length === 0) {
          // No chapters left
          setSelectedChapterIndex(0);
          setContent('');
        } else if (index === selectedChapterIndex) {
          // Deleted the currently selected chapter
          const newIndex = Math.min(index, updatedChapters.length - 1);
          setSelectedChapterIndex(newIndex);
          setContent(updatedChapters[newIndex]?.content || '');
        } else if (index < selectedChapterIndex) {
          // Deleted a chapter before the current one, adjust index
          setSelectedChapterIndex(selectedChapterIndex - 1);
        }

        setSaved(true);
        toast.success(t('status.saved'));
      }
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      toast.error(t('errors.generic'));
    }
  }, [book, bookId, selectedChapterIndex, t]);

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
        toast.success(isHebrew ? 'הטקסט נוסף בהצלחה!' : 'Text added successfully!');
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
      toast.error(isHebrew ? 'שגיאה בשיפור הטקסט' : 'Error improving text');
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
    toast.success(isHebrew ? 'הטקסט עודכן בהצלחה!' : 'Text updated!');
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
      <div className="glass-strong border-b border-memorial-gold/20 px-3 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Logo */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <img
                src="/img/new/logo-mestory-small.jpeg"
                alt="MeStory"
                className="h-8 sm:h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(255,215,0,0.3)]"
              />
            </button>
            <div className="hidden sm:block h-6 w-px bg-memorial-gold/30" />
            <h1 className="text-sm sm:text-xl font-semibold text-white truncate max-w-[120px] sm:max-w-none">{book.title}</h1>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Save Status */}
            <div className="flex items-center gap-2 text-sm">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-gray-400">{t('status.saving')}</span>
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">{t('status.saved')}</span>
                </>
              ) : (
                <span className="text-yellow-400">{t('status.unsaved_changes')}</span>
              )}
            </div>

            {/* Design Studio Button */}
            <button
              onClick={() => navigate(`/design/${bookId}`)}
              className="btn-secondary flex items-center gap-2"
            >
              <Palette className="w-4 h-4" />
              {t('editor.toolbar.design_cover')}
            </button>

            {/* Book Layout Button */}
            <button
              onClick={() => navigate(`/layout/${bookId}`)}
              className="btn-secondary flex items-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              {t('editor.toolbar.page_layout')}
            </button>

            {/* Collaborate / Invite Button */}
            <button
              onClick={() => setShowCollaboratorsPanel(true)}
              className="btn-secondary flex items-center gap-2"
              title={t('editor.toolbar.collaborate', 'Collaborate')}
            >
              <UserPlus className="w-4 h-4" />
              {t('editor.toolbar.collaborate', 'שתף לכתיבה משותפת')}
            </button>

            {/* Save Button */}
            <button
              onClick={() => saveBook()}
              disabled={saving || saved}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {t('editor.toolbar.save')}
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
              onClick={() => saveBook()}
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
              {t('editor.toolbar.design_cover')}
            </button>
            <button
              onClick={() => {
                navigate(`/layout/${bookId}`);
                setShowMobileMenu(false);
              }}
              className="w-full btn-secondary flex items-center justify-center gap-2 py-2"
            >
              <LayoutGrid className="w-4 h-4" />
              {t('editor.toolbar.page_layout')}
            </button>
            <button
              onClick={() => {
                setShowCollaboratorsPanel(true);
                setShowMobileMenu(false);
              }}
              className="w-full btn-secondary flex items-center justify-center gap-2 py-2"
            >
              <UserPlus className="w-4 h-4" />
              {t('editor.toolbar.collaborate', 'שתף לכתיבה משותפת')}
            </button>
          </div>
        )}
      </div>

      {/* Progress Stepper */}
      <div className="px-3 sm:px-6 py-2">
        <BookProgressStepper
          bookId={bookId || ''}
          currentStep="editor"
          progress={{
            hasContent: (book.chapters || []).some((ch: Chapter) => ch.content && ch.content.length > 50),
            hasDesign: !!((book as any).coverDesign?.front?.imageUrl || (book as any).coverDesign?.coverColor || (book as any).aiDesignState?.status === 'completed'),
            hasLayout: !!(book as any).pageLayout,
            isPublished: (book as any).publishingStatus?.status === 'published',
            wordCount: book.statistics?.wordCount || 0,
            chapterCount: book.chapters?.length || 0,
          }}
        />
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
        <div
          ref={leftSidebarRef}
          role="region"
          aria-label="Chapters sidebar"
          className={`
          ${showLeftSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${focusMode ? '!-translate-x-full !w-0 !p-0 !border-0 !overflow-hidden' : ''}
          fixed lg:relative z-50 lg:z-auto
          w-full sm:w-80 lg:w-64 h-full
          glass-strong border-r border-white/10 p-4 sm:p-5 overflow-y-auto
          transition-all duration-300 ease-in-out
        `}>
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6 lg:mb-4">
            <h2 className="text-base sm:text-sm font-semibold text-white lg:text-gray-300">
              {t('editor.sidebar.chapters')}
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={addChapter}
                className="btn-ghost p-2.5 lg:p-2 bg-indigo-500/20 lg:bg-transparent rounded-lg"
              >
                <Plus className="w-5 h-5 lg:w-4 lg:h-4" />
              </button>
              <button
                onClick={() => setShowLeftSidebar(false)}
                className="lg:hidden btn-ghost p-2.5 bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-3 lg:space-y-2">
            {book.chapters && book.chapters.length > 0 ? (
              book.chapters.map((chapter, index) => (
                <div
                  key={index}
                  className={`group relative rounded-xl lg:rounded-lg ${
                    selectedChapterIndex === index
                      ? 'bg-indigo-500/20 border border-indigo-500/30'
                      : 'bg-white/5 lg:bg-transparent border border-white/10 lg:border-transparent hover:bg-white/10'
                  } p-4 lg:p-3 transition-all`}
                >
                  <button
                    onClick={() => {
                      selectChapter(index);
                      setShowLeftSidebar(false);
                    }}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-3 lg:gap-2">
                      <BookOpen className="w-5 h-5 lg:w-4 lg:h-4 text-indigo-400" />
                      <span className="flex-1 truncate text-base lg:text-sm font-medium text-white lg:text-gray-200">
                        {chapter.title}
                      </span>
                      <span className="flex-shrink-0 text-xs" title={chapter.wordCount > 0 ? (isHebrew ? 'יש תוכן' : 'Has content') : (isHebrew ? 'ריק' : 'Empty')}>
                        {chapter.wordCount > 0 ? '🟢' : '⚪'}
                      </span>
                    </div>
                    <p className="text-sm lg:text-xs text-gray-400 mt-2 lg:mt-1 flex items-center gap-1">
                      {chapter.wordCount} {t('editor.statistics.words_unit')}
                      {chapter.wordCount > 0 && (
                        <span className="text-green-400/60">✓</span>
                      )}
                    </p>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChapter(index);
                    }}
                    className="absolute top-3 right-3 lg:top-2 lg:right-2 p-2 lg:p-1.5 rounded-lg lg:rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                    title={t('editor.chapters.delete')}
                  >
                    <Trash2 className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 lg:py-8 text-gray-400 text-base lg:text-sm">
                <p>{t('editor.sidebar.no_chapters')}</p>
                <button onClick={addChapter} className="btn-secondary mt-4 lg:mt-3 text-sm lg:text-xs px-6 py-3 lg:px-4 lg:py-2">
                  {t('editor.sidebar.add_first')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col pb-20 lg:pb-0 bg-gradient-to-b from-slate-900/50 to-slate-800/30 min-h-0">
          <div className="flex flex-col h-full overflow-hidden">
            {currentChapter ? (
              <>
                {/* Toolbar Container - Sticky */}
                <div className="editor-toolbar-container px-3 sm:px-4 lg:px-6 py-3 overflow-visible relative z-30">
                  {/* Chapter Title Input */}
                  <input
                    type="text"
                    name="chapterTitle"
                    value={currentChapter.title}
                    dir={isHebrew ? 'rtl' : 'ltr'}
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

                  {/* Rich Text Editor Toolbar + AI Help */}
                  <div className="overflow-visible max-w-4xl mx-auto relative z-20 flex items-start gap-2">
                    <div className="flex-1">
                      <EditorToolbar editor={editor} />
                    </div>
                    <div className="flex-shrink-0 hidden lg:block">
                      <AIHelpMenu
                        hasContent={!!content && content.length > 10}
                        isLoading={enhancing}
                        onAction={(actionId, context) => {
                          if (!editor) return;
                          if (actionId === 'start') {
                            // Trigger AI copilot start suggestion
                            const copilotEl = document.querySelector('[data-copilot-suggest]') as HTMLButtonElement;
                            if (copilotEl) copilotEl.click();
                          } else if (actionId === 'continue') {
                            const copilotEl = document.querySelector('[data-copilot-suggest]') as HTMLButtonElement;
                            if (copilotEl) copilotEl.click();
                          } else if (actionId === 'improve') {
                            const text = editor.getText();
                            if (text.length >= 5) {
                              editor.commands.selectAll();
                              const { from, to } = editor.state.selection;
                              const selectedText = editor.state.doc.textBetween(from, to, ' ');
                              handleEnhance('improve', selectedText);
                            }
                          } else if (actionId === 'sensory') {
                            const text = editor.getText();
                            if (text.length >= 5) {
                              editor.commands.selectAll();
                              const { from, to } = editor.state.selection;
                              const selectedText = editor.state.doc.textBetween(from, to, ' ');
                              handleEnhance('expand', selectedText);
                            }
                          } else if (actionId === 'rephrase' && context) {
                            // Insert the context as a prompt for AI to work with
                            editor.chain().focus().insertContent(`<p>${context}</p>`).run();
                            setSaved(false);
                            // Then trigger improve on it
                            setTimeout(() => {
                              editor.commands.selectAll();
                              const { from, to } = editor.state.selection;
                              const selectedText = editor.state.doc.textBetween(from, to, ' ');
                              handleEnhance('expand', selectedText);
                            }, 100);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Find & Replace Bar */}
                {showFindReplace && (
                  <div className="px-3 sm:px-4 lg:px-6 py-2 bg-slate-800/80 border-b border-white/10 z-20">
                    <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={findText}
                          onChange={(e) => setFindText(e.target.value)}
                          placeholder={isHebrew ? 'חפש...' : 'Find...'}
                          className="bg-white/10 text-white text-sm rounded px-3 py-1.5 flex-1 outline-none focus:ring-1 focus:ring-indigo-500"
                          dir="auto"
                          autoFocus
                        />
                        {findText && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {findCount} {isHebrew ? 'תוצאות' : 'found'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <Replace className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={replaceText}
                          onChange={(e) => setReplaceText(e.target.value)}
                          placeholder={isHebrew ? 'החלף ב...' : 'Replace with...'}
                          className="bg-white/10 text-white text-sm rounded px-3 py-1.5 flex-1 outline-none focus:ring-1 focus:ring-indigo-500"
                          dir="auto"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleReplace}
                          className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition"
                        >
                          {isHebrew ? 'החלף' : 'Replace'}
                        </button>
                        <button
                          onClick={handleReplaceAll}
                          className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded transition"
                        >
                          {isHebrew ? 'החלף הכל' : 'Replace All'}
                        </button>
                        <button
                          onClick={() => setShowFindReplace(false)}
                          className="p-1.5 hover:bg-white/10 rounded transition"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rich Text Editor - Google Docs page view */}
                <div className="flex-1 overflow-y-auto relative px-3 sm:px-4 lg:px-6 py-4 bg-slate-800/30 z-10">
                  <div
                    className={`editor-paper ${enhancing ? 'ring-2 ring-memorial-gold/30 transition-all' : 'ring-0 transition-all'}`}
                    style={{
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: 'top center',
                      backgroundImage: 'url(/img/new/texture-paper.png)',
                      backgroundSize: '512px 512px',
                    }}
                  >
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
                    <EditorContent
                      editor={editor}
                      style={{
                        cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23DAA520' stroke-width='2'%3E%3Cpath d='M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'/%3E%3C/path%3E%3C/svg%3E") 2 18, text`,
                      }}
                    />
                  </div>
                </div>

                {/* Status Bar — Google Docs style */}
                <div className="hidden lg:flex items-center justify-between px-4 py-1.5 bg-slate-900/90 border-t border-white/10 text-xs text-gray-400 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <span>
                      {editor?.storage.characterCount?.words() || 0} {isHebrew ? 'מילים' : 'words'}
                    </span>
                    <span>
                      {editor?.storage.characterCount?.characters() || 0} {isHebrew ? 'תווים' : 'characters'}
                    </span>
                    <span>
                      {isHebrew ? `פרק ${selectedChapterIndex + 1} מתוך ${book?.chapters?.length || 0}` : `Chapter ${selectedChapterIndex + 1} of ${book?.chapters?.length || 0}`}
                    </span>
                    {saved ? (
                      <span className="text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> {isHebrew ? 'נשמר' : 'Saved'}</span>
                    ) : (
                      <span className="text-amber-400">{isHebrew ? 'שינויים לא שמורים' : 'Unsaved changes'}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowFindReplace(!showFindReplace)} className="p-1 hover:bg-white/10 rounded transition" title="Ctrl+F">
                      <Search className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-white/10" />
                    <button onClick={handleZoomOut} className="p-1 hover:bg-white/10 rounded transition" title="Ctrl+-">
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center">{zoomLevel}%</span>
                    <button onClick={handleZoomIn} className="p-1 hover:bg-white/10 rounded transition" title="Ctrl+=">
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-white/10" />
                    <button
                      onClick={() => setFocusMode(!focusMode)}
                      className="p-1 hover:bg-white/10 rounded transition"
                      title="F11"
                    >
                      {focusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
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
        <div
          ref={rightSidebarRef}
          role="region"
          aria-label="AI and Analysis sidebar"
          className={`
          ${showRightSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          ${focusMode ? '!translate-x-full !w-0 !p-0 !border-0 !overflow-hidden' : ''}
          fixed lg:relative right-0 z-50 lg:z-auto
          w-[85%] sm:w-80 lg:w-80 h-full
          glass-strong border-l border-white/10 flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out
        `}>
          {/* Mobile Close Button */}
          <div className="lg:hidden flex items-center justify-between p-3 border-b border-white/10">
            <span className="text-sm font-semibold text-gray-300">{isHebrew ? 'עוזר כתיבה' : 'Writing Helper'}</span>
            <button
              onClick={() => setShowRightSidebar(false)}
              className="btn-ghost p-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Simple Writing Helper Panel */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="space-y-4 sm:space-y-5">
              {/* Panel Title */}
              <div className="text-center">
                <h2 className="text-lg font-semibold text-white flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  {isHebrew ? 'עוזר כתיבה' : 'Writing Helper'}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  {isHebrew ? 'לחץ על כפתור ותן ל-AI לעזור לך' : 'Click a button and let AI help you'}
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="space-y-2">
                {currentChapter ? (
                  <>
                    <button
                      onClick={() => {
                        if (editor) {
                          // Use AI copilot to help start writing
                          handleInsertText('');
                          // Trigger the AICopilot suggestion flow
                          const copilotEl = document.querySelector('[data-copilot-suggest]') as HTMLButtonElement;
                          if (copilotEl) copilotEl.click();
                        }
                      }}
                      className="w-full text-right py-3 px-4 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-200 text-sm font-medium transition-all flex items-center gap-3"
                      dir={isHebrew ? 'rtl' : 'ltr'}
                    >
                      <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                      </span>
                      {isHebrew ? 'עזור לי להתחיל' : 'Help me start'}
                    </button>

                    <button
                      onClick={() => {
                        if (editor) {
                          const text = editor.getText();
                          if (text && text.length >= 5) {
                            // Select all text and trigger improve
                            editor.commands.selectAll();
                            const { from, to } = editor.state.selection;
                            const selectedText = editor.state.doc.textBetween(from, to, ' ');
                            handleEnhance('improve', selectedText);
                          } else {
                            toast.error(isHebrew ? 'כתוב קצת טקסט קודם' : 'Write some text first');
                          }
                        }
                      }}
                      className="w-full text-right py-3 px-4 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 text-purple-200 text-sm font-medium transition-all flex items-center gap-3"
                      dir={isHebrew ? 'rtl' : 'ltr'}
                    >
                      <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <PenTool className="w-4 h-4 text-purple-400" />
                      </span>
                      {isHebrew ? 'תשפר את הטקסט' : 'Improve my text'}
                    </button>

                    <button
                      onClick={() => {
                        if (editor) {
                          const text = editor.getText();
                          if (text && text.length >= 5) {
                            // Move cursor to end and trigger continue
                            editor.commands.selectAll();
                            const { from, to } = editor.state.selection;
                            const selectedText = editor.state.doc.textBetween(from, to, ' ');
                            // Collapse selection to end
                            editor.commands.setTextSelection(to);
                            handleEnhance('continue', selectedText);
                          } else {
                            toast.error(isHebrew ? 'כתוב קצת טקסט קודם' : 'Write some text first');
                          }
                        }
                      }}
                      className="w-full text-right py-3 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-200 text-sm font-medium transition-all flex items-center gap-3"
                      dir={isHebrew ? 'rtl' : 'ltr'}
                    >
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Plus className="w-4 h-4 text-emerald-400" />
                      </span>
                      {isHebrew ? 'תמשיך לכתוב' : 'Continue writing'}
                    </button>

                    <button
                      onClick={() => {
                        if (editor) {
                          const text = editor.getText();
                          if (text && text.length >= 5) {
                            editor.commands.selectAll();
                            const { from, to } = editor.state.selection;
                            const selectedText = editor.state.doc.textBetween(from, to, ' ');
                            handleEnhance('expand', selectedText);
                          } else {
                            toast.error(isHebrew ? 'כתוב קצת טקסט קודם' : 'Write some text first');
                          }
                        }
                      }}
                      className="w-full text-right py-3 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-200 text-sm font-medium transition-all flex items-center gap-3"
                      dir={isHebrew ? 'rtl' : 'ltr'}
                    >
                      <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 text-amber-400" />
                      </span>
                      {isHebrew ? 'תוסיף פרטים' : 'Add details'}
                    </button>
                  </>
                ) : (
                  <div className="card p-4">
                    <p className="text-sm text-gray-400 text-center py-4">
                      {isHebrew ? 'בחר פרק כדי להתחיל לכתוב' : 'Select a chapter to start writing'}
                    </p>
                  </div>
                )}
              </div>

              {/* Enhancing indicator */}
              {enhancing && (
                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span className="text-sm text-indigo-300">
                    {isHebrew ? 'ה-AI עובד על זה...' : 'AI is working on it...'}
                  </span>
                </div>
              )}

              {/* Stats Line */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <div className="flex-1 h-px bg-white/10" />
                <span>
                  {book.statistics.wordCount.toLocaleString()} {isHebrew ? 'מילים' : 'words'} | {book.statistics.chapterCount} {isHebrew ? 'פרקים' : 'chapters'}
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* AI Copilot (hidden but functional — renders response area) */}
              {currentChapter && (
                <div className="hidden">
                  <AICopilot
                    currentText={content}
                    genre={book.genre}
                    bookTitle={book.title}
                    chapterTitle={currentChapter.title}
                    onInsertText={handleInsertText}
                  />
                </div>
              )}

              {/* AI Analysis Section — Quality Score, Plot, Techniques */}
              {currentChapter && content && content.length > 50 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="flex-1 h-px bg-white/10" />
                    <span>{isHebrew ? 'ניתוח AI' : 'AI Analysis'}</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Tension Arc Chart — visual story arc */}
                  <TensionArcChart
                    bookId={bookId || ''}
                    chapterCount={book.chapters?.length || 0}
                    currentChapterIndex={selectedChapterIndex}
                    onChapterClick={(idx) => selectChapter(idx)}
                  />

                  {/* Plot Structure — 3-act breakdown */}
                  <PlotStructurePanel
                    bookId={bookId || ''}
                    chapterCount={book.chapters?.length || 0}
                    onChapterClick={(idx) => selectChapter(idx)}
                  />

                  {/* Writing Techniques */}
                  <WritingTechniquesCard
                    bookId={bookId || ''}
                    chapterCount={book.chapters?.length || 0}
                  />
                </div>
              )}

              {/* Rotating Writing Tip */}
              <WritingTipRotator isHebrew={isHebrew} />
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

      {/* Draft Notes Sidebar */}
      {bookId && (
        <DraftNotes
          bookId={bookId}
          chapterIndex={selectedChapterIndex ?? 0}
          onInsertText={(text) => {
            if (editor) {
              editor.chain().focus().insertContent(text).run();
            }
          }}
          language={book.language || 'he'}
        />
      )}

      {/* Brand Watermark - Marketing */}
      <BrandWatermark
        position="bottom-right"
        size="small"
        opacity={0.12}
        className="hidden lg:block"
      />

      {/* Collaborators Panel (side drawer) */}
      {showCollaboratorsPanel && bookId && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setShowCollaboratorsPanel(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative ms-auto h-full w-full max-w-md bg-deep-space border-s border-memorial-gold/20 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-deep-space/95 backdrop-blur">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-memorial-gold" />
                {t('editor.collaboration.title', 'כתיבה משותפת')}
              </h2>
              <button
                onClick={() => setShowCollaboratorsPanel(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-300"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Family Contribution Link */}
            <div className="p-4 border-b border-white/10">
              <h3 className="text-sm font-semibold text-memorial-gold mb-2">
                {isHebrew ? '💌 הזמן משפחה לשתף זיכרונות' : '💌 Invite family to share memories'}
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                {isHebrew ? 'שלח את הלינק הזה למשפחה — כל אחד יוכל להוסיף זיכרון, סיפור או תמונה לספר שלך.' : 'Send this link to family — anyone can add a memory, story or photo to your book.'}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/contribute/${bookId}`}
                  className="input text-xs flex-1 bg-white/5 cursor-text"
                  dir="ltr"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/contribute/${bookId}`);
                    toast.success(isHebrew ? 'הלינק הועתק!' : 'Link copied!');
                  }}
                  className="btn-gold px-3 py-2 text-xs whitespace-nowrap"
                >
                  {isHebrew ? 'העתק' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="p-4">
              <CollaboratorsList
                bookId={bookId}
                bookTitle={book.title}
                isOwner={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
