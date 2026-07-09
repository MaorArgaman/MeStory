/**
 * StructureReview — the "we detected X chapters" screen of the import flow.
 *
 * Shows the chapters the importer detected and lets the user fix them BEFORE
 * burning a design generation: rename, merge with next, split at a paragraph,
 * and mark semantic roles (dedication / foreword / epilogue) that the design
 * planner uses. Transparency here is what buys trust in the whole pipeline —
 * the user always sees what we understood before we design.
 *
 * Content is never edited here (that's the editor's job) and never lost:
 * merge/split only move existing text between chapters, and the server
 * enforces a content-preservation guard on save.
 */

import { useMemo, useState } from 'react';
import { Check, GitMerge, Scissors, Loader2, X } from 'lucide-react';

export interface ReviewChapter {
  title: string;
  content: string;
  role?: 'dedication' | 'foreword' | 'epilogue';
}

export interface DetectionInfo {
  method: 'headings' | 'markers' | 'ai' | 'single';
  confidence: 'high' | 'low';
  chapterCount: number;
}

interface StructureReviewProps {
  initialChapters: ReviewChapter[];
  detection?: DetectionInfo | null;
  saving: boolean;
  onConfirm: (chapters: ReviewChapter[]) => void;
}

const ROLE_LABELS: Record<string, string> = {
  '': 'פרק רגיל',
  dedication: 'הקדשה',
  foreword: 'פתח דבר',
  epilogue: 'אחרית דבר',
};

const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Split content into paragraphs for the split-picker. Falls back to single
 *  newlines when the text has no blank lines at all. */
function toParagraphs(content: string): string[] {
  let paras = content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paras.length < 2) {
    paras = content.split(/\n/).map((p) => p.trim()).filter(Boolean);
  }
  return paras;
}

export default function StructureReview({
  initialChapters,
  detection,
  saving,
  onConfirm,
}: StructureReviewProps) {
  const [chapters, setChapters] = useState<ReviewChapter[]>(initialChapters);
  const [splitIndex, setSplitIndex] = useState<number | null>(null); // chapter being split

  const totalWords = useMemo(
    () => chapters.reduce((n, ch) => n + countWords(ch.content), 0),
    [chapters]
  );

  const renameChapter = (i: number, title: string) => {
    setChapters((chs) => chs.map((ch, j) => (j === i ? { ...ch, title } : ch)));
  };

  const setRole = (i: number, role: string) => {
    setChapters((chs) =>
      chs.map((ch, j) =>
        j === i ? { ...ch, role: (role || undefined) as ReviewChapter['role'] } : ch
      )
    );
  };

  const mergeWithNext = (i: number) => {
    setChapters((chs) => {
      if (i >= chs.length - 1) return chs;
      const merged: ReviewChapter = {
        ...chs[i],
        content: `${chs[i].content}\n\n${chs[i + 1].content}`,
      };
      return [...chs.slice(0, i), merged, ...chs.slice(i + 2)];
    });
  };

  const applySplit = (i: number, paragraphIndex: number) => {
    setChapters((chs) => {
      const paras = toParagraphs(chs[i].content);
      if (paragraphIndex <= 0 || paragraphIndex >= paras.length) return chs;
      const first: ReviewChapter = {
        ...chs[i],
        content: paras.slice(0, paragraphIndex).join('\n\n'),
      };
      const second: ReviewChapter = {
        title: 'פרק חדש',
        content: paras.slice(paragraphIndex).join('\n\n'),
      };
      return [...chs.slice(0, i), first, second, ...chs.slice(i + 1)];
    });
    setSplitIndex(null);
  };

  const canConfirm = chapters.length > 0 && chapters.every((ch) => ch.title.trim());

  return (
    <div dir="rtl" className="max-w-3xl mx-auto">
      {/* Summary header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          זיהינו {chapters.length === 1 ? 'פרק אחד' : `${chapters.length} פרקים`} · {totalWords.toLocaleString()} מילים
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          בדקו שהחלוקה נכונה לפני העיצוב — אפשר לשנות שם, למזג ולפצל. הטקסט עצמו לא משתנה.
        </p>
        {detection?.confidence === 'low' && (
          <div className="mt-3 inline-block px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
            לא זיהינו חלוקה ברורה לפרקים בקובץ. אפשר לפצל ידנית כאן, או להמשיך כפרק אחד.
          </div>
        )}
      </div>

      {/* Chapter list */}
      <div className="space-y-3 mb-8">
        {chapters.map((ch, i) => {
          const preview = ch.content.replace(/\s+/g, ' ').slice(0, 140);
          return (
            <div
              key={`${i}-${ch.title}`}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-sm">
                  {i + 1}
                </span>
                <input
                  value={ch.title}
                  onChange={(e) => renameChapter(i, e.target.value)}
                  className="flex-1 font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-orange-400 focus:outline-none py-1"
                  aria-label={`שם פרק ${i + 1}`}
                />
                <span className="shrink-0 text-xs text-gray-500">
                  {countWords(ch.content).toLocaleString()} מילים
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2 mr-11 leading-relaxed">{preview}…</p>
              <div className="flex items-center gap-2 mt-3 mr-11">
                <select
                  value={ch.role || ''}
                  onChange={(e) => setRole(i, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 text-gray-700"
                  aria-label="סוג הפרק"
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {i < chapters.length - 1 && (
                  <button
                    onClick={() => mergeWithNext(i)}
                    className="text-xs flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                  >
                    <GitMerge className="w-3.5 h-3.5" />
                    מזג עם הבא
                  </button>
                )}
                <button
                  onClick={() => setSplitIndex(i)}
                  className="text-xs flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  פצל
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm */}
      <div className="text-center pb-10">
        <button
          onClick={() => onConfirm(chapters)}
          disabled={!canConfirm || saving}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-lg disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          נראה טוב — עצבו לי את הספר
        </button>
      </div>

      {/* Split picker modal */}
      {splitIndex !== null && chapters[splitIndex] && (
        <SplitPicker
          chapter={chapters[splitIndex]}
          onCancel={() => setSplitIndex(null)}
          onSplit={(paragraphIndex) => applySplit(splitIndex, paragraphIndex)}
        />
      )}
    </div>
  );
}

function SplitPicker({
  chapter,
  onCancel,
  onSplit,
}: {
  chapter: ReviewChapter;
  onCancel: () => void;
  onSplit: (paragraphIndex: number) => void;
}) {
  const paras = useMemo(() => toParagraphs(chapter.content), [chapter.content]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        dir="rtl"
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="font-bold">פיצול "{chapter.title}"</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              לחצו על "פצל כאן" בנקודה שבה מתחיל הפרק החדש.
            </p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="סגור">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {paras.length < 2 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              הפרק קצר מדי לפיצול — אין בו יותר מפסקה אחת.
            </p>
          ) : (
            paras.map((p, i) => (
              <div key={i}>
                {i > 0 && (
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 border-t border-dashed border-gray-300" />
                    <button
                      onClick={() => onSplit(i)}
                      className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-800 hover:bg-orange-200 flex items-center gap-1"
                    >
                      <Scissors className="w-3 h-3" />
                      פצל כאן
                    </button>
                    <div className="flex-1 border-t border-dashed border-gray-300" />
                  </div>
                )}
                <p className="text-sm text-gray-700 leading-relaxed">
                  {p.replace(/\s+/g, ' ').slice(0, 220)}
                  {p.length > 220 ? '…' : ''}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
