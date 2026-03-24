import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  StickyNote,
  Plus,
  X,
  GripVertical,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface DraftNote {
  id: string;
  content: string;
  color: string;
  position: number; // Y position as percentage
  createdAt: Date;
}

interface DraftNotesProps {
  bookId: string;
  chapterIndex: number;
  onInsertText?: (text: string) => void;
  language?: string;
}

const NOTE_COLORS = [
  { color: '#FEF08A', name: 'Yellow' },
  { color: '#BBF7D0', name: 'Green' },
  { color: '#BFDBFE', name: 'Blue' },
  { color: '#FBCFE8', name: 'Pink' },
  { color: '#FED7AA', name: 'Orange' },
  { color: '#E9D5FF', name: 'Purple' },
];

export default function DraftNotes({
  bookId,
  chapterIndex,
  onInsertText,
  language = 'he',
}: DraftNotesProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isHebrew = language === 'he';
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState<DraftNote[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // FUNC-008 FIX: Include userId in localStorage key to isolate notes per user
  const getStorageKey = () => `draft-notes-${user?.id || 'anon'}-${bookId}-${chapterIndex}`;

  // Load notes from localStorage
  useEffect(() => {
    const key = getStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load draft notes:', e);
      }
    }
  }, [bookId, chapterIndex, user?.id]);

  // Save notes to localStorage
  useEffect(() => {
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(notes));
  }, [notes, bookId, chapterIndex, user?.id]);

  const addNote = () => {
    const newNote: DraftNote = {
      id: `note-${Date.now()}`,
      content: '',
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)].color,
      position: 10 + notes.length * 15,
      createdAt: new Date(),
    };
    setNotes([...notes, newNote]);
    setEditingId(newNote.id);
  };

  const updateNote = (id: string, content: string) => {
    setNotes(notes.map(note =>
      note.id === id ? { ...note, content } : note
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const changeNoteColor = (id: string, color: string) => {
    setNotes(notes.map(note =>
      note.id === id ? { ...note, color } : note
    ));
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDrag = (e: React.MouseEvent, id: string) => {
    if (!draggedId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const clampedY = Math.max(5, Math.min(85, y));

    // RTL-aware x position calculation (for future horizontal positioning)
    // In RTL mode, x position is calculated from the right side
    const x = isHebrew
      ? ((rect.right - e.clientX) / rect.width) * 100
      : ((e.clientX - rect.left) / rect.width) * 100;

    setNotes(notes.map(note =>
      note.id === id ? { ...note, position: clampedY } : note
    ));
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  return (
    <div
      ref={containerRef}
      className={`fixed ${isHebrew ? 'left-0' : 'right-0'} top-32 bottom-20 z-30 transition-all duration-500 ease-in-out ${
        isExpanded ? 'w-72 max-w-[90vw]' : 'w-10'
      }`}
      style={{
        transform: isExpanded ? 'translateX(0)' : undefined,
        willChange: 'width, transform'
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`absolute top-0 ${isHebrew ? 'right-0 translate-x-full rounded-r-lg' : 'left-0 -translate-x-full rounded-l-lg'} bg-amber-500 hover:bg-amber-600 text-white p-2 shadow-lg transition-colors`}
        title={t('draft_notes.title')}
      >
        {isExpanded ? (
          isHebrew ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
        ) : (
          <StickyNote className="w-4 h-4" />
        )}
      </button>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: isHebrew ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isHebrew ? -20 : 20 }}
            className="h-full bg-slate-900/95 backdrop-blur-lg border-r border-white/10 shadow-2xl flex flex-col"
            style={{ direction: isHebrew ? 'rtl' : 'ltr' }}
          >
            {/* Header */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-400" />
                {t('draft_notes.title')}
              </h3>
              <button
                onClick={addNote}
                className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-amber-400 transition-colors"
                title={t('draft_notes.add_note')}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Notes Container */}
            <div className="flex-1 relative overflow-hidden">
              {notes.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-4">
                  <StickyNote className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs text-center">
                    {t('draft_notes.empty_message')}
                  </p>
                </div>
              ) : (
                notes.map((note) => (
                  <motion.div
                    key={note.id}
                    drag="y"
                    dragConstraints={containerRef}
                    dragElastic={0.1}
                    onDragStart={() => handleDragStart(note.id)}
                    onDragEnd={handleDragEnd}
                    className="absolute left-2 right-2 cursor-move"
                    style={{
                      top: `${note.position}%`,
                    }}
                  >
                    <div
                      className="rounded-lg shadow-lg overflow-hidden"
                      style={{ backgroundColor: note.color }}
                    >
                      {/* Note Header */}
                      <div className="flex items-center justify-between px-2 py-1 bg-black/10">
                        <GripVertical className="w-3 h-3 text-black/40 cursor-grab" />
                        <div className="flex items-center gap-1">
                          {/* Color Picker - UI-006 FIX: Added aria-label for accessibility */}
                          <div className="flex gap-0.5">
                            {NOTE_COLORS.map((c) => (
                              <button
                                key={c.color}
                                onClick={() => changeNoteColor(note.id, c.color)}
                                aria-label={t(`colors.${c.name.toLowerCase()}`)}
                                className={`w-3 h-3 rounded-full border focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-amber-500 ${
                                  note.color === c.color ? 'border-black/50' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: c.color }}
                              />
                            ))}
                          </div>
                          {/* Delete */}
                          <button
                            onClick={() => deleteNote(note.id)}
                            aria-label={t('buttons.delete')}
                            className="p-0.5 hover:bg-black/10 rounded text-black/40 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Note Content */}
                      <div className="p-2">
                        {editingId === note.id ? (
                          <div className="relative">
                            <textarea
                              autoFocus
                              value={note.content}
                              onChange={(e) => updateNote(note.id, e.target.value)}
                              placeholder={t('draft_notes.write_idea')}
                              className="w-full bg-transparent text-black/80 text-xs resize-none outline-none min-h-[60px] placeholder-black/40"
                              onBlur={() => setEditingId(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            onClick={() => setEditingId(note.id)}
                            className="text-xs text-black/80 min-h-[40px] cursor-text whitespace-pre-wrap"
                          >
                            {note.content || (
                              <span className="text-black/40 italic">
                                {t('draft_notes.click_to_edit')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Insert Button */}
                      {note.content && onInsertText && (
                        <div className="px-2 pb-2">
                          <button
                            onClick={() => onInsertText(note.content)}
                            className="w-full py-1 bg-black/10 hover:bg-black/20 rounded text-xs text-black/60 flex items-center justify-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            {t('draft_notes.insert_to_text')}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notes.length > 0 && (
              <div className="p-2 border-t border-white/10 text-xs text-gray-500 text-center">
                {t('draft_notes.notes_count', { count: notes.length })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
