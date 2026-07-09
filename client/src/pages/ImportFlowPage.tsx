/**
 * ImportFlowPage — the front door of the design-first product:
 * upload a file (or paste text) → review the detected structure → design.
 *
 * Flow (docs/IMPLEMENTATION_PLAN.md §א.1-א.2):
 *   1. upload     — dropzone for DOCX/TXT, or paste-text tab. Both go through
 *                   POST /api/books/upload (pasted text is wrapped in a .txt
 *                   File so the same server pipeline handles splitting).
 *   2. structure  — StructureReview over the detected chapters;
 *                   confirm saves via PUT /api/books/:id/structure.
 *   3. design     — the existing AutoDesignModal, opened full-screen; closing
 *                   it lands on /layout/:bookId.
 *
 * Entering with ?bookId=... skips straight to the structure step — this is
 * how the dashboard upload handoff continues here.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FileUp, ClipboardPaste, Loader2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { bookKeys } from '../hooks/useBooks';
import StructureReview, {
  ReviewChapter,
  DetectionInfo,
} from '../components/import/StructureReview';
import AutoDesignModal from '../components/autoDesign/AutoDesignModal';

type Step = 'upload' | 'processing' | 'structure' | 'design';

const ACCEPTED_EXTENSIONS = ['.docx', '.doc', '.txt'];

export default function ImportFlowPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('upload');
  const [bookId, setBookId] = useState<string | null>(searchParams.get('bookId'));
  const [chapters, setChapters] = useState<ReviewChapter[] | null>(null);
  const [detection, setDetection] = useState<DetectionInfo | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Load the book's chapters for the structure step. */
  const loadStructure = useCallback(async (id: string) => {
    setStep('processing');
    try {
      const res = await api.get(`/books/${id}`);
      const book = res.data?.data?.book;
      const chs: ReviewChapter[] = (book?.chapters || []).map((ch: any) => ({
        title: ch.title,
        content: ch.content || '',
        ...(ch.role ? { role: ch.role } : {}),
      }));
      if (chs.length === 0) {
        toast.error('לא נמצאו פרקים בספר');
        setStep('upload');
        return;
      }
      setChapters(chs);
      setStep('structure');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'טעינת הספר נכשלה');
      setStep('upload');
    }
  }, []);

  // Deep-link entry: /import?bookId=... jumps straight to structure review.
  useEffect(() => {
    const fromUrl = searchParams.get('bookId');
    if (fromUrl && step === 'upload' && !chapters) {
      setBookId(fromUrl);
      void loadStructure(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadFile = async (file: File) => {
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast.error('נא להעלות קובץ DOCX או TXT (תמיכה ב-PDF בקרוב)');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('הקובץ גדול מדי (מקסימום 50MB)');
      return;
    }

    setStep('processing');
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('manuscript', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
      formData.append('genre', 'Fiction');

      const res = await api.post('/books/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setUploadProgress(e.total ? Math.round((e.loaded * 100) / e.total) : 0);
        },
      });

      const id = res.data?.data?.book?.id;
      if (!id) throw new Error('השרת לא החזיר מזהה ספר');
      setBookId(id);
      setDetection(res.data?.data?.detection || null);
      setSearchParams({ bookId: id }, { replace: true });
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      await loadStructure(id);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'ההעלאה נכשלה');
      setStep('upload');
    }
  };

  const uploadPastedText = async () => {
    const text = pastedText.trim();
    if (text.length < 100) {
      toast.error('נא להדביק לפחות 100 תווים של טקסט');
      return;
    }
    const title = pasteTitle.trim() || 'היצירה שלי';
    // Wrap the pasted text in a .txt File so the exact same server pipeline
    // (extraction, chapter split, language detection) handles it.
    const file = new File([text], `${title}.txt`, { type: 'text/plain' });
    await uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  };

  const handleConfirmStructure = async (edited: ReviewChapter[]) => {
    if (!bookId) return;
    setSaving(true);
    try {
      await api.put(`/books/${bookId}/structure`, { chapters: edited });
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
      setStep('design');
    } catch (err: any) {
      const code = err?.response?.data?.errorCode;
      toast.error(
        code === 'CONTENT_LOSS'
          ? 'חלק מהטקסט המקורי חסר במבנה החדש — בדקו את המיזוגים והפיצולים'
          : err?.response?.data?.error || 'שמירת המבנה נכשלה'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white py-10 px-4">
      {/* Step indicator */}
      <div className="max-w-3xl mx-auto mb-8 flex items-center justify-center gap-2 text-sm">
        {[
          { key: 'upload', label: 'העלאה' },
          { key: 'structure', label: 'מבנה' },
          { key: 'design', label: 'עיצוב' },
        ].map((s, i) => {
          const activeIndex = step === 'upload' || step === 'processing' ? 0 : step === 'structure' ? 1 : 2;
          const isActive = i === activeIndex;
          const isDone = i < activeIndex;
          return (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && <div className="w-10 border-t border-gray-300" />}
              <span
                className={`px-3 py-1.5 rounded-full font-medium ${
                  isActive
                    ? 'bg-orange-600 text-white'
                    : isDone
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {step === 'upload' && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">מעצבים את היצירה שלך</h1>
            <p className="text-gray-600 mt-2">
              העלו קובץ Word או טקסט — ותוך דקות תקבלו ספר מעוצב, עמוד-עמוד.
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => setMode('file')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                mode === 'file' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <FileUp className="w-4 h-4" />
              העלאת קובץ
            </button>
            <button
              onClick={() => setMode('paste')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                mode === 'paste' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <ClipboardPaste className="w-4 h-4" />
              הדבקת טקסט
            </button>
          </div>

          {mode === 'file' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-white hover:border-orange-300'
              }`}
            >
              <FileUp className="w-12 h-12 mx-auto text-orange-500 mb-4" />
              <p className="font-semibold text-gray-800">גררו לכאן קובץ, או לחצו לבחירה</p>
              <p className="text-sm text-gray-500 mt-1">DOCX או TXT, עד 50MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.doc,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadFile(f);
                  e.target.value = '';
                }}
              />
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <input
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                placeholder="שם היצירה"
                className="w-full mb-3 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
              />
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="הדביקו כאן את הטקסט המלא…"
                rows={12}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 text-sm leading-relaxed"
              />
              <button
                onClick={() => void uploadPastedText()}
                disabled={pastedText.trim().length < 100}
                className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold disabled:opacity-50"
              >
                המשך לזיהוי מבנה
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'processing' && (
        <div className="max-w-md mx-auto text-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="font-medium text-gray-800">
            {uploadProgress > 0 && uploadProgress < 100
              ? `מעלה… ${uploadProgress}%`
              : 'קוראים את היצירה שלך ומזהים פרקים…'}
          </p>
        </div>
      )}

      {step === 'structure' && chapters && (
        <StructureReview
          initialChapters={chapters}
          detection={detection}
          saving={saving}
          onConfirm={handleConfirmStructure}
        />
      )}

      {step === 'design' && bookId && (
        <>
          {/* Backdrop content behind the modal, in case it's closed */}
          <div className="max-w-md mx-auto text-center py-20">
            <BookOpen className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <p className="text-gray-700">המבנה נשמר. עוברים לעיצוב…</p>
          </div>
          <AutoDesignModal
            bookId={bookId}
            isOpen
            onClose={() => navigate(`/layout/${bookId}`)}
          />
        </>
      )}
    </div>
  );
}
