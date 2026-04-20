import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Type,
  Palette,
  Highlighter,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import VoiceRecordButton from './VoiceRecordButton';

// Predefined color palette - keys are used for translation
// Text colors for light background editor (no white - invisible on white bg)
const TEXT_COLORS = [
  { color: '#000000', nameKey: 'black' },
  { color: '#374151', nameKey: 'gray' },
  { color: '#1f2937', nameKey: 'dark_gray' },
  { color: '#DC2626', nameKey: 'red' },
  { color: '#EA580C', nameKey: 'orange' },
  { color: '#D97706', nameKey: 'amber' },
  { color: '#16A34A', nameKey: 'green' },
  { color: '#0891B2', nameKey: 'cyan' },
  { color: '#2563EB', nameKey: 'blue' },
  { color: '#7C3AED', nameKey: 'purple' },
  { color: '#DB2777', nameKey: 'pink' },
  { color: '#064E3B', nameKey: 'dark_green' },
];

const HIGHLIGHT_COLORS = [
  { color: 'transparent', nameKey: 'none' },
  { color: '#FEF08A', nameKey: 'yellow' },
  { color: '#BBF7D0', nameKey: 'green' },
  { color: '#BFDBFE', nameKey: 'blue' },
  { color: '#FBCFE8', nameKey: 'pink' },
  { color: '#FED7AA', nameKey: 'orange' },
  { color: '#E9D5FF', nameKey: 'purple' },
];

interface EditorToolbarProps {
  editor: Editor | null;
}

type HeadingLevel = 1 | 2 | 3;

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const { t } = useTranslation('common');
  const { isRTL } = useLanguage();

  // Return null if editor is not initialized
  if (!editor) return null;
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isSimpleMode, setIsSimpleMode] = useState(() => {
    const saved = localStorage.getItem('editor-simple-mode');
    // Default to simple mode for new users (key not set yet)
    return saved === null ? true : saved === 'true';
  });

  // Save selection when opening menus (to restore before applying commands in portals)
  const savedSelection = useRef<{ from: number; to: number } | null>(null);

  const saveSelection = () => {
    if (editor) {
      const { from, to } = editor.state.selection;
      savedSelection.current = { from, to };
    }
  };

  // Editor is guaranteed non-null by early return above - cast to ensure TypeScript knows
  const safeEditor = editor as Editor;

  // Get chain builder that restores selection first, then clears it
  const getChainWithSelection = () => {
    if (savedSelection.current) {
      const { from, to } = savedSelection.current;
      const docSize = safeEditor.state.doc.content.size;
      savedSelection.current = null;
      // Validate bounds to prevent invalid selection crash
      if (from >= 0 && to <= docSize && from <= to) {
        return safeEditor.chain().focus().setTextSelection({ from, to });
      }
    }
    return safeEditor.chain().focus();
  };
  const headingMenuRef = useRef<HTMLDivElement>(null);
  const colorMenuRef = useRef<HTMLDivElement>(null);
  const highlightMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const colorButtonMobileRef = useRef<HTMLButtonElement>(null);
  const highlightButtonRef = useRef<HTMLButtonElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [colorMenuPosition, setColorMenuPosition] = useState({ top: 0, left: 0 });
  const [highlightMenuPosition, setHighlightMenuPosition] = useState({ top: 0, left: 0 });
  const [moreMenuPosition, setMoreMenuPosition] = useState({ top: 0, left: 0 });

  // Calculate menu position when opening
  useEffect(() => {
    if (showHeadingMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      if (isRTL) {
        setMenuPosition({
          top: rect.bottom + 4,
          left: Math.max(8, window.innerWidth - rect.right),
        });
      } else {
        setMenuPosition({
          top: rect.bottom + 4,
          left: rect.left,
        });
      }
    }
  }, [showHeadingMenu, isRTL]);

  // Helper: position a dropdown menu centered below a button, clamped to viewport
  const positionMenuBelow = (buttonEl: HTMLElement | null, menuWidth: number) => {
    if (!buttonEl) return { top: 0, left: 0 };
    const rect = buttonEl.getBoundingClientRect();
    const vw = window.innerWidth;
    // Center the menu under the button
    let leftPos = rect.left + rect.width / 2 - menuWidth / 2;
    // Clamp so it doesn't go off-screen
    leftPos = Math.max(8, Math.min(leftPos, vw - menuWidth - 8));
    return { top: rect.bottom + 6, left: leftPos };
  };

  // Calculate color menu position
  useEffect(() => {
    if (showColorMenu) {
      const buttonEl = colorButtonMobileRef.current || colorButtonRef.current;
      setColorMenuPosition(positionMenuBelow(buttonEl, 220));
    }
  }, [showColorMenu]);

  // Calculate highlight menu position
  useEffect(() => {
    if (showHighlightMenu) {
      setHighlightMenuPosition(positionMenuBelow(highlightButtonRef.current, 180));
    }
  }, [showHighlightMenu]);

  // Calculate more menu position
  useEffect(() => {
    if (showMoreMenu && moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      const menuWidth = window.innerWidth < 640 ? 260 : 280;
      // For mobile, center the menu or position it to stay within viewport
      const isMobile = window.innerWidth < 640;
      let leftPos: number;

      if (isMobile) {
        // Center the menu on mobile, with padding from edges
        leftPos = Math.max(8, (window.innerWidth - menuWidth) / 2);
      } else if (isRTL) {
        // For RTL desktop, position from right
        leftPos = Math.max(8, window.innerWidth - rect.right);
      } else {
        // For LTR desktop
        leftPos = Math.max(8, rect.left - 100);
      }

      setMoreMenuPosition({
        top: rect.bottom + 4,
        left: leftPos,
      });
    }
  }, [showMoreMenu, isRTL]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Check heading menu
      const isOutsideHeadingButton = buttonRef.current && !buttonRef.current.contains(target);
      const isOutsideHeadingMenu = headingMenuRef.current && !headingMenuRef.current.contains(target);
      if (isOutsideHeadingButton && isOutsideHeadingMenu) {
        setShowHeadingMenu(false);
      }

      // Check color menu (both desktop and mobile buttons)
      const isOutsideColorButtonDesktop = !colorButtonRef.current || !colorButtonRef.current.contains(target);
      const isOutsideColorButtonMobile = !colorButtonMobileRef.current || !colorButtonMobileRef.current.contains(target);
      const isOutsideColorMenu = !colorMenuRef.current || !colorMenuRef.current.contains(target);
      if (isOutsideColorButtonDesktop && isOutsideColorButtonMobile && isOutsideColorMenu) {
        setShowColorMenu(false);
      }

      // Check highlight menu
      const isOutsideHighlightButton = !highlightButtonRef.current || !highlightButtonRef.current.contains(target);
      const isOutsideHighlightMenu = !highlightMenuRef.current || !highlightMenuRef.current.contains(target);
      if (isOutsideHighlightButton && isOutsideHighlightMenu) {
        setShowHighlightMenu(false);
      }

      // Check more menu
      const isOutsideMoreButton = !moreButtonRef.current || !moreButtonRef.current.contains(target);
      const isOutsideMoreMenu = !moreMenuRef.current || !moreMenuRef.current.contains(target);
      if (isOutsideMoreButton && isOutsideMoreMenu) {
        setShowMoreMenu(false);
      }
    };

    // Use only mousedown - React normalizes touch to click events
    // touchstart was causing race condition (closing menu before onClick fires)
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    children,
    title,
    disabled = false,
    size = 'normal',
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
    disabled?: boolean;
    size?: 'normal' | 'small';
  }) => (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        ${size === 'small' ? 'p-1.5' : 'p-2'}
        rounded-lg transition-all duration-200 flex items-center justify-center
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${
          isActive
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
            : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
        }
      `}
    >
      {children}
    </motion.button>
  );

  const smallIconClass = "w-3.5 h-3.5";

  const getCurrentHeading = (): string => {
    if (editor.isActive('heading', { level: 1 })) return 'H1';
    if (editor.isActive('heading', { level: 2 })) return 'H2';
    if (editor.isActive('heading', { level: 3 })) return 'H3';
    return 'P';
  };

  const setHeading = (level: HeadingLevel | 'paragraph') => {
    setShowHeadingMenu(false);
    if (level === 'paragraph') {
      getChainWithSelection().setParagraph().run();
    } else {
      getChainWithSelection().toggleHeading({ level }).run();
    }
  };

  // Handle voice transcription - insert text at cursor without overwriting
  const handleVoiceTranscription = useCallback((text: string) => {
    if (!editor) return;

    // Get current cursor position
    const { to } = editor.state.selection;

    // Add a space before the new text if there's content before cursor
    const currentContent = editor.state.doc.textBetween(0, to);
    const needsSpace = currentContent.length > 0 && !currentContent.endsWith(' ') && !currentContent.endsWith('\n');
    const textToInsert = needsSpace ? ` ${text}` : text;

    // Insert at current cursor position (end of selection)
    editor
      .chain()
      .focus()
      .insertContentAt(to, textToInsert)
      .run();
  }, [editor]);

  return (
    <div className="bg-slate-800/90 backdrop-blur-md rounded-xl p-1.5 sm:p-2 mb-3 flex items-center gap-1 border border-white/10 shadow-lg">
      {/* Undo/Redo - Hidden on mobile, visible on sm+ */}
      <div className="hidden sm:flex gap-0.5 items-center flex-shrink-0">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title={`${t('editor.toolbar.undo')} (Ctrl+Z)`}
          size="small"
        >
          <Undo className={smallIconClass} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title={`${t('editor.toolbar.redo')} (Ctrl+Y)`}
          size="small"
        >
          <Redo className={smallIconClass} />
        </ToolbarButton>
      </div>

      <div className="hidden sm:block w-px h-5 bg-white/10 mx-0.5 flex-shrink-0" />

      {/* Paragraph/Heading Dropdown - Compact */}
      {!isSimpleMode && <div className="relative flex-shrink-0">
        <button
          ref={buttonRef}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (!showHeadingMenu) saveSelection();
            setShowHeadingMenu(!showHeadingMenu);
            setShowColorMenu(false);
            setShowHighlightMenu(false);
            setShowMoreMenu(false);
          }}
          className="flex items-center gap-1 px-2 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all text-xs font-medium touch-manipulation active:scale-95"
        >
          <Type className="w-4 h-4" />
          <span>{getCurrentHeading()}</span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showHeadingMenu && createPortal(
          <motion.div
            ref={headingMenuRef}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bg-slate-800 border border-white/10 rounded-lg shadow-2xl min-w-[140px]"
            style={{
              top: menuPosition.top,
              ...(isRTL ? { right: menuPosition.left } : { left: menuPosition.left }),
              zIndex: 9999,
            }}
          >
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setHeading('paragraph')}
              className={`w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-3 touch-manipulation active:bg-white/20 ${
                editor.isActive('paragraph') ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300'
              }`}
            >
              <Pilcrow className="w-4 h-4" />
              <span className="text-sm">{t('editor.toolbar.normal_text')}</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setHeading(1)}
              className={`w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-3 touch-manipulation active:bg-white/20 ${
                editor.isActive('heading', { level: 1 }) ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300'
              }`}
            >
              <Heading1 className="w-4 h-4" />
              <span className="text-base font-bold">{t('editor.toolbar.heading1')}</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setHeading(2)}
              className={`w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-3 touch-manipulation active:bg-white/20 ${
                editor.isActive('heading', { level: 2 }) ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300'
              }`}
            >
              <Heading2 className="w-4 h-4" />
              <span className="text-sm font-bold">{t('editor.toolbar.heading2')}</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setHeading(3)}
              className={`w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-3 touch-manipulation active:bg-white/20 ${
                editor.isActive('heading', { level: 3 }) ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300'
              }`}
            >
              <Heading3 className="w-4 h-4" />
              <span className="text-sm font-semibold">{t('editor.toolbar.heading3')}</span>
            </button>
          </motion.div>,
          document.body
        )}
      </div>}

      {!isSimpleMode && <div className="w-px h-5 bg-white/10 mx-0.5 flex-shrink-0" />}

      {/* Core Text Formatting - Always visible */}
      <div className="flex gap-0.5 items-center flex-shrink-0">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title={`${t('editor.toolbar.bold')} (Ctrl+B)`}
          size="small"
        >
          <Bold className={smallIconClass} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title={`${t('editor.toolbar.italic')} (Ctrl+I)`}
          size="small"
        >
          <Italic className={smallIconClass} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title={`${t('editor.toolbar.underline')} (Ctrl+U)`}
          size="small"
        >
          <Underline className={smallIconClass} />
        </ToolbarButton>

        {/* Text Color - Mobile only */}
        {!isSimpleMode && <div className="relative sm:hidden">
          <button
            ref={colorButtonMobileRef}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (!showColorMenu) saveSelection();
              setShowColorMenu(!showColorMenu);
              setShowHighlightMenu(false);
              setShowMoreMenu(false);
              setShowHeadingMenu(false);
            }}
            title={t('editor.toolbar.text_color')}
            className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all relative flex items-center justify-center touch-manipulation active:scale-95"
          >
            <Palette className="w-4 h-4" />
            <div
              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full"
              style={{ backgroundColor: editor.getAttributes('textStyle').color || '#374151' }}
            />
          </button>
        </div>}

        {/* Voice Recording Button - Always visible */}
        <VoiceRecordButton
          onTranscription={handleVoiceTranscription}
          className="p-1.5"
        />
      </div>

      {/* Desktop only: Additional formatting */}
      {!isSimpleMode && <div className="hidden sm:flex gap-0.5 items-center flex-shrink-0">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title={t('editor.toolbar.strikethrough')}
          size="small"
        >
          <Strikethrough className={smallIconClass} />
        </ToolbarButton>

        {/* Text Color - Desktop */}
        <div className="relative">
          <button
            ref={colorButtonRef}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (!showColorMenu) saveSelection();
              setShowColorMenu(!showColorMenu);
              setShowHighlightMenu(false);
              setShowHeadingMenu(false);
            }}
            title={t('editor.toolbar.text_color')}
            className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all relative flex items-center justify-center touch-manipulation active:scale-95"
          >
            <Palette className="w-4 h-4" />
            <div
              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full"
              style={{ backgroundColor: editor.getAttributes('textStyle').color || '#374151' }}
            />
          </button>
        </div>

        {/* Highlight Color */}
        <div className="relative">
          <button
            ref={highlightButtonRef}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (!showHighlightMenu) saveSelection();
              setShowHighlightMenu(!showHighlightMenu);
              setShowColorMenu(false);
              setShowHeadingMenu(false);
            }}
            title={t('editor.toolbar.highlight')}
            className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center touch-manipulation active:scale-95"
          >
            <Highlighter className="w-4 h-4" />
          </button>
        </div>
      </div>}

      {!isSimpleMode && <div className="w-px h-5 bg-white/10 mx-0.5 flex-shrink-0 hidden sm:block" />}

      {/* Desktop only: Alignment */}
      {!isSimpleMode && <div className="hidden md:flex gap-0.5 items-center flex-shrink-0">
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title={t('editor.toolbar.align_left')}
          size="small"
        >
          <AlignLeft className={smallIconClass} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title={t('editor.toolbar.align_center')}
          size="small"
        >
          <AlignCenter className={smallIconClass} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title={t('editor.toolbar.align_right')}
          size="small"
        >
          <AlignRight className={smallIconClass} />
        </ToolbarButton>
      </div>}

      {!isSimpleMode && <div className="w-px h-5 bg-white/10 mx-0.5 flex-shrink-0 hidden md:block" />}

      {/* Desktop only: Lists */}
      {!isSimpleMode && <div className="hidden lg:flex gap-0.5 items-center flex-shrink-0">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title={t('editor.toolbar.bullet_list')}
          size="small"
        >
          <List className={smallIconClass} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title={t('editor.toolbar.numbered_list')}
          size="small"
        >
          <ListOrdered className={smallIconClass} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title={t('editor.toolbar.quote')}
          size="small"
        >
          <Quote className={smallIconClass} />
        </ToolbarButton>
      </div>}

      {/* More menu removed — all toolbar buttons are always visible */}

      {/* Color Picker Menu */}
      {showColorMenu && createPortal(
        <motion.div
          ref={colorMenuRef}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bg-slate-800 border border-white/10 rounded-lg shadow-2xl p-3"
          style={{
            top: colorMenuPosition.top,
            left: colorMenuPosition.left,
            zIndex: 9999,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs text-gray-400 mb-2">{t('colors.text_color')}</div>
          <div className="grid grid-cols-6 gap-2">
            {TEXT_COLORS.map((item) => (
              <button
                key={item.color}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setShowColorMenu(false);
                  getChainWithSelection().setColor(item.color).run();
                }}
                title={t(`colors.${item.nameKey}`)}
                className="w-8 h-8 rounded-md border border-white/20 hover:scale-110 transition-transform touch-manipulation active:scale-90"
                style={{ backgroundColor: item.color }}
              />
            ))}
          </div>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setShowColorMenu(false);
              getChainWithSelection().unsetColor().run();
            }}
            className="w-full mt-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg touch-manipulation active:bg-white/20"
          >
            {t('colors.reset_color')}
          </button>
        </motion.div>,
        document.body
      )}

      {/* Highlight Picker Menu */}
      {showHighlightMenu && createPortal(
        <motion.div
          ref={highlightMenuRef}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bg-slate-800 border border-white/10 rounded-lg shadow-2xl p-3"
          style={{
            top: highlightMenuPosition.top,
            left: highlightMenuPosition.left,
            zIndex: 9999,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs text-gray-400 mb-2">{t('colors.highlight')}</div>
          <div className="grid grid-cols-4 gap-2">
            {HIGHLIGHT_COLORS.map((item) => (
              <button
                key={item.color}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setShowHighlightMenu(false);
                  if (item.color === 'transparent') {
                    getChainWithSelection().unsetHighlight().run();
                  } else {
                    getChainWithSelection().toggleHighlight({ color: item.color }).run();
                  }
                }}
                title={t(`colors.${item.nameKey}`)}
                className={`w-8 h-8 rounded-md border hover:scale-110 transition-transform touch-manipulation active:scale-90 flex items-center justify-center ${
                  item.color === 'transparent' ? 'border-dashed border-gray-500' : 'border-white/20'
                }`}
                style={{ backgroundColor: item.color === 'transparent' ? 'transparent' : item.color }}
              >
                {item.color === 'transparent' && <span className="text-gray-500 text-sm">✕</span>}
              </button>
            ))}
          </div>
        </motion.div>,
        document.body
      )}

      {/* Simple/Advanced toggle */}
      <button
        type="button"
        onClick={() => {
          const next = !isSimpleMode;
          setIsSimpleMode(next);
          localStorage.setItem('editor-simple-mode', String(next));
        }}
        title={isSimpleMode ? t('editor.toolbar.advanced_mode', 'Advanced mode') : t('editor.toolbar.simple_mode', 'Simple mode')}
        className="flex-shrink-0 ml-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all
          border-white/10 text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5"
      >
        {isSimpleMode ? t('editor.toolbar.mode_advanced', 'מתקדם') : t('editor.toolbar.mode_simple', 'פשוט')}
      </button>

      {/* Word Count - Right aligned */}
      <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} flex items-center text-[10px] sm:text-xs text-gray-400 px-1 sm:px-2 flex-shrink-0`}>
        <span>{editor.storage.characterCount?.words() || 0}</span>
      </div>
    </div>
  );
}
