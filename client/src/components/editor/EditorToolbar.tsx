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
  MoreHorizontal,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';

// Predefined color palette - keys are used for translation
const TEXT_COLORS = [
  { color: '#000000', nameKey: 'black' },
  { color: '#374151', nameKey: 'gray' },
  { color: '#DC2626', nameKey: 'red' },
  { color: '#EA580C', nameKey: 'orange' },
  { color: '#D97706', nameKey: 'amber' },
  { color: '#CA8A04', nameKey: 'yellow' },
  { color: '#16A34A', nameKey: 'green' },
  { color: '#0891B2', nameKey: 'cyan' },
  { color: '#2563EB', nameKey: 'blue' },
  { color: '#7C3AED', nameKey: 'purple' },
  { color: '#DB2777', nameKey: 'pink' },
  { color: '#FFFFFF', nameKey: 'white' },
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
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const headingMenuRef = useRef<HTMLDivElement>(null);
  const colorMenuRef = useRef<HTMLDivElement>(null);
  const highlightMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
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

  // Calculate color menu position
  useEffect(() => {
    if (showColorMenu && colorButtonRef.current) {
      const rect = colorButtonRef.current.getBoundingClientRect();
      if (isRTL) {
        setColorMenuPosition({
          top: rect.bottom + 4,
          left: Math.max(8, window.innerWidth - rect.right - 60),
        });
      } else {
        setColorMenuPosition({
          top: rect.bottom + 4,
          left: Math.max(8, rect.left - 60),
        });
      }
    }
  }, [showColorMenu, isRTL]);

  // Calculate highlight menu position
  useEffect(() => {
    if (showHighlightMenu && highlightButtonRef.current) {
      const rect = highlightButtonRef.current.getBoundingClientRect();
      if (isRTL) {
        setHighlightMenuPosition({
          top: rect.bottom + 4,
          left: Math.max(8, window.innerWidth - rect.right - 40),
        });
      } else {
        setHighlightMenuPosition({
          top: rect.bottom + 4,
          left: Math.max(8, rect.left - 40),
        });
      }
    }
  }, [showHighlightMenu, isRTL]);

  // Calculate more menu position
  useEffect(() => {
    if (showMoreMenu && moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      setMoreMenuPosition({
        top: rect.bottom + 4,
        left: isRTL ? Math.max(8, window.innerWidth - rect.right) : Math.max(8, rect.left - 100),
      });
    }
  }, [showMoreMenu, isRTL]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(target);
      const isOutsideMenu = headingMenuRef.current && !headingMenuRef.current.contains(target);
      if (isOutsideButton && isOutsideMenu) {
        setShowHeadingMenu(false);
      }
      const isOutsideColorButton = colorButtonRef.current && !colorButtonRef.current.contains(target);
      const isOutsideColorMenu = colorMenuRef.current && !colorMenuRef.current.contains(target);
      if (isOutsideColorButton && isOutsideColorMenu) {
        setShowColorMenu(false);
      }
      const isOutsideHighlightButton = highlightButtonRef.current && !highlightButtonRef.current.contains(target);
      const isOutsideHighlightMenu = highlightMenuRef.current && !highlightMenuRef.current.contains(target);
      if (isOutsideHighlightButton && isOutsideHighlightMenu) {
        setShowHighlightMenu(false);
      }
      const isOutsideMoreButton = moreButtonRef.current && !moreButtonRef.current.contains(target);
      const isOutsideMoreMenu = moreMenuRef.current && !moreMenuRef.current.contains(target);
      if (isOutsideMoreButton && isOutsideMoreMenu) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const iconClass = "w-4 h-4";
  const smallIconClass = "w-3.5 h-3.5";

  const getCurrentHeading = (): string => {
    if (editor.isActive('heading', { level: 1 })) return 'H1';
    if (editor.isActive('heading', { level: 2 })) return 'H2';
    if (editor.isActive('heading', { level: 3 })) return 'H3';
    return 'P';
  };

  const setHeading = (level: HeadingLevel | 'paragraph') => {
    if (level === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level }).run();
    }
    setShowHeadingMenu(false);
  };

  return (
    <div className="bg-slate-800/90 backdrop-blur-md rounded-xl p-1.5 sm:p-2 mb-3 flex items-center gap-1 border border-white/10 shadow-lg overflow-x-auto">
      {/* Undo/Redo - Always visible */}
      <div className="flex gap-0.5 items-center flex-shrink-0">
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

      <div className="w-px h-5 bg-white/10 mx-0.5 flex-shrink-0" />

      {/* Paragraph/Heading Dropdown - Compact */}
      <div className="relative flex-shrink-0">
        <motion.button
          ref={buttonRef}
          whileHover={{ scale: 1.02 }}
          onClick={() => setShowHeadingMenu(!showHeadingMenu)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all text-xs font-medium"
        >
          <Type className="w-3.5 h-3.5" />
          <span>{getCurrentHeading()}</span>
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.button>

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
              onClick={() => setHeading('paragraph')}
              className={`w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2 ${
                editor.isActive('paragraph') ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300'
              }`}
            >
              <Pilcrow className="w-3.5 h-3.5" />
              <span className="text-sm">{t('editor.toolbar.normal_text')}</span>
            </button>
            <button
              onClick={() => setHeading(1)}
              className={`w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2 ${
                editor.isActive('heading', { level: 1 }) ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300'
              }`}
            >
              <Heading1 className="w-3.5 h-3.5" />
              <span className="text-base font-bold">{t('editor.toolbar.heading1')}</span>
            </button>
            <button
              onClick={() => setHeading(2)}
              className={`w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2 ${
                editor.isActive('heading', { level: 2 }) ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300'
              }`}
            >
              <Heading2 className="w-3.5 h-3.5" />
              <span className="text-sm font-bold">{t('editor.toolbar.heading2')}</span>
            </button>
            <button
              onClick={() => setHeading(3)}
              className={`w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2 ${
                editor.isActive('heading', { level: 3 }) ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300'
              }`}
            >
              <Heading3 className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">{t('editor.toolbar.heading3')}</span>
            </button>
          </motion.div>,
          document.body
        )}
      </div>

      <div className="w-px h-5 bg-white/10 mx-0.5 flex-shrink-0" />

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
      </div>

      {/* Desktop only: Additional formatting */}
      <div className="hidden sm:flex gap-0.5 items-center flex-shrink-0">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title={t('editor.toolbar.strikethrough')}
          size="small"
        >
          <Strikethrough className={smallIconClass} />
        </ToolbarButton>

        {/* Text Color */}
        <div className="relative">
          <motion.button
            ref={colorButtonRef}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowColorMenu(!showColorMenu);
              setShowHighlightMenu(false);
            }}
            title={t('editor.toolbar.text_color')}
            className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all relative flex items-center justify-center"
          >
            <Palette className={smallIconClass} />
            <div
              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full"
              style={{ backgroundColor: editor.getAttributes('textStyle').color || '#ffffff' }}
            />
          </motion.button>
        </div>

        {/* Highlight Color */}
        <div className="relative">
          <motion.button
            ref={highlightButtonRef}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowHighlightMenu(!showHighlightMenu);
              setShowColorMenu(false);
            }}
            title={t('editor.toolbar.highlight')}
            className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center"
          >
            <Highlighter className={smallIconClass} />
          </motion.button>
        </div>
      </div>

      <div className="w-px h-5 bg-white/10 mx-0.5 flex-shrink-0 hidden sm:block" />

      {/* Desktop only: Alignment */}
      <div className="hidden md:flex gap-0.5 items-center flex-shrink-0">
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
      </div>

      <div className="w-px h-5 bg-white/10 mx-0.5 flex-shrink-0 hidden md:block" />

      {/* Desktop only: Lists */}
      <div className="hidden lg:flex gap-0.5 items-center flex-shrink-0">
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
      </div>

      {/* More Button - Mobile & Tablet */}
      <div className="lg:hidden relative flex-shrink-0">
        <motion.button
          ref={moreButtonRef}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`p-2 rounded-lg transition-all flex items-center justify-center ${
            showMoreMenu ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          {showMoreMenu ? <X className={smallIconClass} /> : <MoreHorizontal className={smallIconClass} />}
        </motion.button>
      </div>

      {/* More Menu - Portal */}
      <AnimatePresence>
        {showMoreMenu && createPortal(
          <motion.div
            ref={moreMenuRef}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="fixed bg-slate-800 border border-white/10 rounded-xl shadow-2xl p-3 w-[280px]"
            style={{
              top: moreMenuPosition.top,
              ...(isRTL ? { right: moreMenuPosition.left } : { left: Math.min(moreMenuPosition.left, window.innerWidth - 290) }),
              zIndex: 9999,
            }}
          >
            {/* Mobile: Strikethrough, Colors */}
            <div className="sm:hidden mb-3">
              <div className="text-xs text-gray-400 mb-2">{t('editor.toolbar.formatting', 'Formatting')}</div>
              <div className="flex gap-1 flex-wrap">
                <ToolbarButton
                  onClick={() => { editor.chain().focus().toggleStrike().run(); }}
                  isActive={editor.isActive('strike')}
                  title={t('editor.toolbar.strikethrough')}
                  size="small"
                >
                  <Strikethrough className={smallIconClass} />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => { setShowColorMenu(!showColorMenu); setShowMoreMenu(false); }}
                  title={t('editor.toolbar.text_color')}
                  size="small"
                >
                  <Palette className={smallIconClass} />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => { setShowHighlightMenu(!showHighlightMenu); setShowMoreMenu(false); }}
                  title={t('editor.toolbar.highlight')}
                  size="small"
                >
                  <Highlighter className={smallIconClass} />
                </ToolbarButton>
              </div>
            </div>

            {/* Alignment */}
            <div className="md:hidden mb-3">
              <div className="text-xs text-gray-400 mb-2">{t('editor.toolbar.alignment', 'Alignment')}</div>
              <div className="flex gap-1">
                <ToolbarButton
                  onClick={() => { editor.chain().focus().setTextAlign('left').run(); }}
                  isActive={editor.isActive({ textAlign: 'left' })}
                  title={t('editor.toolbar.align_left')}
                  size="small"
                >
                  <AlignLeft className={smallIconClass} />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => { editor.chain().focus().setTextAlign('center').run(); }}
                  isActive={editor.isActive({ textAlign: 'center' })}
                  title={t('editor.toolbar.align_center')}
                  size="small"
                >
                  <AlignCenter className={smallIconClass} />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => { editor.chain().focus().setTextAlign('right').run(); }}
                  isActive={editor.isActive({ textAlign: 'right' })}
                  title={t('editor.toolbar.align_right')}
                  size="small"
                >
                  <AlignRight className={smallIconClass} />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => { editor.chain().focus().setTextAlign('justify').run(); }}
                  isActive={editor.isActive({ textAlign: 'justify' })}
                  title={t('editor.toolbar.align_justify')}
                  size="small"
                >
                  <AlignJustify className={smallIconClass} />
                </ToolbarButton>
              </div>
            </div>

            {/* Lists & Blocks */}
            <div>
              <div className="text-xs text-gray-400 mb-2">{t('editor.toolbar.lists', 'Lists & Blocks')}</div>
              <div className="flex gap-1 flex-wrap">
                <ToolbarButton
                  onClick={() => { editor.chain().focus().toggleBulletList().run(); }}
                  isActive={editor.isActive('bulletList')}
                  title={t('editor.toolbar.bullet_list')}
                  size="small"
                >
                  <List className={smallIconClass} />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => { editor.chain().focus().toggleOrderedList().run(); }}
                  isActive={editor.isActive('orderedList')}
                  title={t('editor.toolbar.numbered_list')}
                  size="small"
                >
                  <ListOrdered className={smallIconClass} />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => { editor.chain().focus().toggleBlockquote().run(); }}
                  isActive={editor.isActive('blockquote')}
                  title={t('editor.toolbar.quote')}
                  size="small"
                >
                  <Quote className={smallIconClass} />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => { editor.chain().focus().setHorizontalRule().run(); }}
                  title={t('editor.toolbar.horizontal_line')}
                  size="small"
                >
                  <Minus className={smallIconClass} />
                </ToolbarButton>
              </div>
            </div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>

      {/* Color Picker Menu */}
      {showColorMenu && createPortal(
        <motion.div
          ref={colorMenuRef}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bg-slate-800 border border-white/10 rounded-lg shadow-2xl p-3"
          style={{
            top: colorMenuPosition.top,
            ...(isRTL ? { right: colorMenuPosition.left } : { left: colorMenuPosition.left }),
            zIndex: 9999,
          }}
        >
          <div className="text-xs text-gray-400 mb-2">{t('colors.text_color')}</div>
          <div className="grid grid-cols-6 gap-1.5">
            {TEXT_COLORS.map((item) => (
              <button
                key={item.color}
                onClick={() => {
                  try {
                    const chain = editor.chain().focus();
                    if ('setColor' in chain) {
                      (chain as any).setColor(item.color).run();
                    } else {
                      editor.chain().focus().setMark('textStyle', { color: item.color }).run();
                    }
                  } catch (e) {
                    console.warn('setColor not available:', e);
                  }
                  setShowColorMenu(false);
                }}
                title={t(`colors.${item.nameKey}`)}
                className="w-6 h-6 rounded-md border border-white/20 hover:scale-110 transition-transform"
                style={{ backgroundColor: item.color }}
              />
            ))}
          </div>
          <button
            onClick={() => {
              try {
                const chain = editor.chain().focus();
                if ('unsetColor' in chain) {
                  (chain as any).unsetColor().run();
                }
              } catch (e) {
                console.warn('unsetColor not available:', e);
              }
              setShowColorMenu(false);
            }}
            className="w-full mt-2 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded"
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
            ...(isRTL ? { right: highlightMenuPosition.left } : { left: highlightMenuPosition.left }),
            zIndex: 9999,
          }}
        >
          <div className="text-xs text-gray-400 mb-2">{t('colors.highlight')}</div>
          <div className="grid grid-cols-4 gap-1.5">
            {HIGHLIGHT_COLORS.map((item) => (
              <button
                key={item.color}
                onClick={() => {
                  try {
                    const chain = editor.chain().focus();
                    if (item.color === 'transparent') {
                      if ('unsetHighlight' in chain) {
                        (chain as any).unsetHighlight().run();
                      }
                    } else {
                      if ('toggleHighlight' in chain) {
                        (chain as any).toggleHighlight({ color: item.color }).run();
                      }
                    }
                  } catch (e) {
                    console.warn('Highlight not available:', e);
                  }
                  setShowHighlightMenu(false);
                }}
                title={t(`colors.${item.nameKey}`)}
                className={`w-6 h-6 rounded-md border hover:scale-110 transition-transform ${
                  item.color === 'transparent' ? 'border-dashed border-gray-500' : 'border-white/20'
                }`}
                style={{ backgroundColor: item.color === 'transparent' ? 'transparent' : item.color }}
              >
                {item.color === 'transparent' && <span className="text-gray-500 text-xs">✕</span>}
              </button>
            ))}
          </div>
        </motion.div>,
        document.body
      )}

      {/* Word Count - Right aligned */}
      <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} flex items-center text-xs text-gray-400 px-2 flex-shrink-0`}>
        <span>{editor.storage.characterCount?.words() || 0}</span>
      </div>
    </div>
  );
}
