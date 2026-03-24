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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

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
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const headingMenuRef = useRef<HTMLDivElement>(null);
  const colorMenuRef = useRef<HTMLDivElement>(null);
  const highlightMenuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const highlightButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [colorMenuPosition, setColorMenuPosition] = useState({ top: 0, left: 0 });
  const [highlightMenuPosition, setHighlightMenuPosition] = useState({ top: 0, left: 0 });

  // Calculate menu position when opening
  useEffect(() => {
    if (showHeadingMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [showHeadingMenu]);

  // Calculate color menu position
  useEffect(() => {
    if (showColorMenu && colorButtonRef.current) {
      const rect = colorButtonRef.current.getBoundingClientRect();
      setColorMenuPosition({
        top: rect.bottom + 4,
        left: Math.max(8, rect.left - 60),
      });
    }
  }, [showColorMenu]);

  // Calculate highlight menu position
  useEffect(() => {
    if (showHighlightMenu && highlightButtonRef.current) {
      const rect = highlightButtonRef.current.getBoundingClientRect();
      setHighlightMenuPosition({
        top: rect.bottom + 4,
        left: Math.max(8, rect.left - 40),
      });
    }
  }, [showHighlightMenu]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(target);
      const isOutsideMenu = headingMenuRef.current && !headingMenuRef.current.contains(target);
      if (isOutsideButton && isOutsideMenu) {
        setShowHeadingMenu(false);
      }
      // Close color menu
      const isOutsideColorButton = colorButtonRef.current && !colorButtonRef.current.contains(target);
      const isOutsideColorMenu = colorMenuRef.current && !colorMenuRef.current.contains(target);
      if (isOutsideColorButton && isOutsideColorMenu) {
        setShowColorMenu(false);
      }
      // Close highlight menu
      const isOutsideHighlightButton = highlightButtonRef.current && !highlightButtonRef.current.contains(target);
      const isOutsideHighlightMenu = highlightMenuRef.current && !highlightMenuRef.current.contains(target);
      if (isOutsideHighlightButton && isOutsideHighlightMenu) {
        setShowHighlightMenu(false);
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
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
    disabled?: boolean;
  }) => (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded-lg transition-all duration-200
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

  const Divider = () => (
    <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
  );

  const iconClass = "w-4 h-4";

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
    <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-2 mb-4 flex flex-wrap gap-1 items-center border border-white/10 shadow-lg">
      {/* Undo/Redo */}
      <div className="flex gap-0.5 items-center pr-2 border-r border-white/10">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className={iconClass} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo className={iconClass} />
        </ToolbarButton>
      </div>

      {/* Paragraph/Heading Dropdown */}
      <div className="relative">
        <motion.button
          ref={buttonRef}
          whileHover={{ scale: 1.02 }}
          onClick={() => setShowHeadingMenu(!showHeadingMenu)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all min-w-[80px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            <span className="text-sm font-medium">{getCurrentHeading()}</span>
          </div>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.button>

        {showHeadingMenu && createPortal(
          <motion.div
            ref={headingMenuRef}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bg-slate-800 border border-white/10 rounded-lg shadow-2xl min-w-[160px]"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              zIndex: 9999,
            }}
          >
            <button
              onClick={() => setHeading('paragraph')}
              className={`w-full px-4 py-2.5 text-left hover:bg-white/10 flex items-center gap-3 ${
                editor.isActive('paragraph') ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300'
              }`}
            >
              <Pilcrow className="w-4 h-4" />
              <span className="text-sm">{t('editor.toolbar.normal_text')}</span>
            </button>
            <button
              onClick={() => setHeading(1)}
              className={`w-full px-4 py-2.5 text-left hover:bg-white/10 flex items-center gap-3 ${
                editor.isActive('heading', { level: 1 }) ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300'
              }`}
            >
              <Heading1 className="w-4 h-4" />
              <span className="text-lg font-bold">{t('editor.toolbar.heading1')}</span>
            </button>
            <button
              onClick={() => setHeading(2)}
              className={`w-full px-4 py-2.5 text-left hover:bg-white/10 flex items-center gap-3 ${
                editor.isActive('heading', { level: 2 }) ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300'
              }`}
            >
              <Heading2 className="w-4 h-4" />
              <span className="text-base font-bold">{t('editor.toolbar.heading2')}</span>
            </button>
            <button
              onClick={() => setHeading(3)}
              className={`w-full px-4 py-2.5 text-left hover:bg-white/10 flex items-center gap-3 ${
                editor.isActive('heading', { level: 3 }) ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300'
              }`}
            >
              <Heading3 className="w-4 h-4" />
              <span className="text-sm font-semibold">{t('editor.toolbar.heading3')}</span>
            </button>
          </motion.div>,
          document.body
        )}
      </div>

      <Divider />

      {/* Text Formatting */}
      <div className="flex gap-0.5 items-center">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className={iconClass} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className={iconClass} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <Underline className={iconClass} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className={iconClass} />
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
            title="Text Color"
            className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all relative"
          >
            <Palette className={iconClass} />
            <div
              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
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
            title="Highlight"
            className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <Highlighter className={iconClass} />
          </motion.button>
        </div>
      </div>

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
        >
          <div className="text-xs text-gray-400 mb-2">{t('colors.text_color')}</div>
          <div className="grid grid-cols-6 gap-1.5">
            {TEXT_COLORS.map((item) => (
              <button
                key={item.color}
                onClick={() => {
                  try {
                    // Check if setColor exists before calling
                    const chain = editor.chain().focus();
                    if ('setColor' in chain) {
                      (chain as any).setColor(item.color).run();
                    } else {
                      // Fallback: apply color via inline style
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
            left: highlightMenuPosition.left,
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

      <Divider />

      {/* Text Alignment */}
      <div className="flex gap-0.5 items-center">
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className={iconClass} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className={iconClass} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className={iconClass} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Justify"
        >
          <AlignJustify className={iconClass} />
        </ToolbarButton>
      </div>

      <Divider />

      {/* Lists & Blocks */}
      <div className="flex gap-0.5 items-center">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className={iconClass} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className={iconClass} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className={iconClass} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Line"
        >
          <Minus className={iconClass} />
        </ToolbarButton>
      </div>

      {/* Word Count - Right aligned */}
      <div className="ml-auto flex items-center gap-3 text-xs text-gray-400 px-3">
        <span className="hidden sm:inline">
          {editor.storage.characterCount?.words() || 0} {t('editor.toolbar.words')}
        </span>
        <span className="sm:hidden">
          {editor.storage.characterCount?.words() || 0}
        </span>
        <span className="hidden md:inline text-gray-500">
          · {editor.storage.characterCount?.characters() || 0} {t('editor.toolbar.chars')}
        </span>
      </div>
    </div>
  );
}
