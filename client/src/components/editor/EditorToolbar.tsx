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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface EditorToolbarProps {
  editor: Editor | null;
}

type HeadingLevel = 1 | 2 | 3;

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const { t } = useTranslation('common');
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const headingMenuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(target);
      const isOutsideMenu = headingMenuRef.current && !headingMenuRef.current.contains(target);
      if (isOutsideButton && isOutsideMenu) {
        setShowHeadingMenu(false);
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
      </div>

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
