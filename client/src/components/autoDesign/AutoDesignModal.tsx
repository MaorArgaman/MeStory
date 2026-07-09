/**
 * AutoDesignModal — the single entry point for the multi-agent
 * typesetting flow in the editor. Opens when the user clicks
 * "Premium Auto-Design" in BookLayoutPage's design panel.
 *
 * States:
 *   1. idle         — show status (uses remaining, current designSystem
 *                     if a plan exists) + "Generate" button
 *   2. generating   — show progress indicator while the orchestrator
 *                     runs (planner → critic → revise → done)
 *   3. ready        — show iframe preview of /print/:bookId/designed
 *                     plus "Regenerate" and "Download Word" buttons
 *   4. error        — show error message with retry button
 *
 * The modal is owned by BookLayoutPage; that page passes bookId and
 * keeps it open via showAutoDesignModal state.
 */

import { useEffect, useState } from 'react';
import { X, Sparkles, RefreshCw, Download, Loader2, Shuffle, Check } from 'lucide-react';
import { api } from '../../services/api';

interface AutoDesignModalProps {
  bookId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface StatusResponse {
  hasPlan: boolean;
  designSystem: string | null;
  usesRemaining: number;
  maxUses: number;
  /** Account-level free allowance; null when the server can't report it. */
  freeDesignsRemaining?: number | null;
}

type Stage = 'idle' | 'generating' | 'ready' | 'error';

const DESIGN_SYSTEM_LABELS: Record<string, string> = {
  'memoir-warm': 'זיכרון חם',
  'editorial-modern': 'מגזין רציני',
  'storybook-illustrated': 'ספר ילדים מאויר',
  'playful-zine': 'צבעוני ושובב',
  'romantic-vintage': 'רומנטי ונוסטלגי',
  'minimalist-nordic': 'מינימליסטי נורדי',
  'academic-formal': 'אקדמי קלאסי',
  'bold-magazine': 'מגזין נועז',
  'fairytale-classic': 'אגדה קלאסית',
  'poetry-quiet': 'שירה שקטה',
};

export default function AutoDesignModal({ bookId, isOpen, onClose }: AutoDesignModalProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0); // bump to force reload
  // Current visual variation seed (null = the saved design). Re-rolling this is
  // free + instant: it just re-renders the preview with a fresh genome, no
  // server call, no credit, no usage-cap hit.
  const [variationSeed, setVariationSeed] = useState<number | null>(null);
  const [savedVariation, setSavedVariation] = useState(false);

  // Load status whenever the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setErrorMsg(null);
    api
      .get(`/auto-design/${bookId}/status`)
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data as StatusResponse;
        setStatus(data);
        setStage(data?.hasPlan ? 'ready' : 'idle');
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err?.response?.data?.error || err?.message || 'Failed to load status');
        setStage('error');
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, bookId]);

  const handleGenerate = async () => {
    setStage('generating');
    setErrorMsg(null);
    try {
      const res = await api.post(`/auto-design/${bookId}`);
      const data = res.data?.data;
      setStatus({
        hasPlan: true,
        designSystem: data?.designSystem || null,
        usesRemaining: data?.usesRemaining ?? 0,
        maxUses: status?.maxUses ?? 3,
        freeDesignsRemaining:
          data?.freeDesignsRemaining ?? status?.freeDesignsRemaining ?? null,
      });
      setVariationSeed(null);
      setSavedVariation(false);
      setIframeKey((k) => k + 1);
      setStage('ready');
    } catch (err: any) {
      const code = err?.response?.data?.errorCode;
      if (code === 'AUTO_DESIGN_CAP_REACHED') {
        setErrorMsg('הגעת למקסימום השימושים בפיצ׳ר הזה לספר הזה (3).');
      } else if (code === 'INSUFFICIENT_CREDITS') {
        setErrorMsg('אין מספיק קרדיטים. שדרג מסלול או הוסף קרדיטים.');
      } else if (code === 'FEATURE_NOT_AVAILABLE') {
        setErrorMsg('הפיצ׳ר זמין רק במסלולים Standard ו-Premium.');
      } else {
        setErrorMsg(err?.response?.data?.error || err?.message || 'שגיאה ביצירת העיצוב');
      }
      setStage('error');
    }
  };

  // Roll a fresh visual variation — same content + structure, a brand-new
  // coherent design. Free and instant: only the preview re-renders with a new
  // seed (no POST, no credit, no usage-cap hit).
  const handleVariation = () => {
    setVariationSeed(Math.floor(Math.random() * 2147483647));
    setSavedVariation(false);
    setIframeKey((k) => k + 1);
  };

  // Persist the currently-previewed variation so exports + the main editor pick
  // it up. 0 credits, doesn't touch the 3-generate cap.
  const handleSaveVariation = async () => {
    if (variationSeed == null) return;
    try {
      await api.patch(`/auto-design/${bookId}/seed`, { seed: variationSeed });
      setSavedVariation(true);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || err?.message || 'שמירת הווריאציה נכשלה');
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const res = await api.get(`/auto-design/${bookId}/export.docx`, { responseType: 'blob' });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'book-designed.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || err?.message || 'הורדה נכשלה');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      // Server renders the SAME /print/:id/designed page to PDF (WYSIWYG).
      const res = await api.get(`/auto-design/${bookId}/export.pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'book-designed.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || err?.message || 'הורדה נכשלה');
    }
  };

  if (!isOpen) return null;

  const previewSrc =
    variationSeed != null ? `/print/${bookId}/designed?seed=${variationSeed}` : `/print/${bookId}/designed`;
  const usesLabel = status
    ? `${status.maxUses - status.usesRemaining}/${status.maxUses} שימושים`
    : '';
  const freeRemaining = status?.freeDesignsRemaining ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-orange-50 to-pink-50">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-orange-600" />
            <div>
              <h2 className="font-bold text-lg">עיצוב אוטומטי ברמת מעצב</h2>
              <p className="text-xs text-gray-600">
                אייג׳נטים מעצבים את הספר עבורך. עד 3 גרסאות שונות לכל ספר.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {status && <span className="text-sm text-gray-600">{usesLabel}</span>}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/60 rounded-lg"
              aria-label="סגור"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: controls */}
          <div className="w-80 border-l p-6 overflow-y-auto bg-gray-50">
            {stage === 'idle' && status && (
              <>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  לחץ "צור עיצוב" כדי שאייג׳נטים יבחרו עיצוב מתאים לספר שלך מתוך 10 סגנונות,
                  ויעמדו את כל העמודים — כולל בחירת טיפוגרפיה, פלטה, ומיקום תמונות.
                </p>
                {freeRemaining != null && freeRemaining > 0 && (
                  <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-sm font-medium text-emerald-800">
                      {freeRemaining === 2
                        ? 'שני העיצובים הראשונים שלך — חינם 🎁'
                        : 'נשאר לך עיצוב אחד חינם 🎁'}
                    </p>
                  </div>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={status.usesRemaining <= 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold disabled:opacity-50"
                >
                  צור עיצוב
                </button>
                {status.usesRemaining <= 0 && (
                  <p className="mt-3 text-xs text-red-600">
                    הגעת למקסימום (3) שימושים בספר זה.
                  </p>
                )}
              </>
            )}

            {stage === 'generating' && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Loader2 className="w-12 h-12 animate-spin text-orange-600 mb-4" />
                <p className="font-medium text-gray-800">האייג׳נטים מעצבים את הספר…</p>
                <p className="text-xs text-gray-500 mt-2">
                  שלב 1: תכנון<br />
                  שלב 2: ביקורת<br />
                  שלב 3: עיצוב סופי
                </p>
                <p className="text-xs text-gray-400 mt-4">לוקח 30-90 שניות</p>
              </div>
            )}

            {stage === 'ready' && status && (
              <>
                <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm font-medium text-green-800">העיצוב מוכן</p>
                  {status.designSystem && (
                    <p className="text-xs text-green-700 mt-1">
                      סגנון: {DESIGN_SYSTEM_LABELS[status.designSystem] || status.designSystem}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleVariation}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold flex items-center justify-center gap-2 mb-2"
                >
                  <Shuffle className="w-4 h-4" />
                  ג'נרט וריאציה חדשה
                </button>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  אינסוף וריאציות עיצוב — חינם ומיידי. אותו תוכן, מראה חדש לגמרי בכל לחיצה.
                </p>
                {variationSeed != null && (
                  <button
                    onClick={handleSaveVariation}
                    disabled={savedVariation}
                    className="w-full py-2.5 rounded-xl bg-green-600 text-white font-medium flex items-center justify-center gap-2 mb-3 disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" />
                    {savedVariation ? 'הווריאציה נשמרה' : 'שמור וריאציה זו'}
                  </button>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={status.usesRemaining <= 0}
                  className="w-full py-2.5 rounded-xl bg-orange-100 text-orange-900 font-medium flex items-center justify-center gap-2 mb-3 disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  תכנון מחדש מלא ({status.usesRemaining} נותרו)
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="w-full py-3 rounded-xl bg-rose-600 text-white font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  הורד כ-PDF (זהה לתצוגה)
                </button>
                <button
                  onClick={handleDownloadDocx}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  הורד כקובץ Word
                </button>
                <p className="mt-6 text-xs text-gray-500 leading-relaxed">
                  ה-PDF נוצר מאותו דף תצוגה שאתה רואה כאן — מה שרואים זה מה שמיוצא, כולל הכריכה.
                  גם הכפתור הראשי של ייצוא בעורך ישתמש בעיצוב הזה אוטומטית.
                </p>
              </>
            )}

            {stage === 'error' && (
              <>
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 mb-4">
                  <p className="text-sm text-red-800">{errorMsg}</p>
                </div>
                <button
                  onClick={() => setStage(status?.hasPlan ? 'ready' : 'idle')}
                  className="w-full py-3 rounded-xl bg-gray-200 text-gray-800 font-medium"
                >
                  חזור
                </button>
              </>
            )}
          </div>

          {/* Right: preview */}
          <div className="flex-1 bg-gray-100 overflow-hidden">
            {stage === 'ready' || (stage === 'idle' && status?.hasPlan) ? (
              <iframe
                key={iframeKey}
                src={previewSrc}
                title="Designed book preview"
                className="w-full h-full border-0 bg-white"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                {stage === 'generating'
                  ? 'מכין את התצוגה המקדימה…'
                  : 'התצוגה המקדימה תופיע כאן לאחר יצירת עיצוב.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
