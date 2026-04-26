import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Accessibility,
  X,
  Plus,
  Minus,
  Type,
  Contrast,
  Droplet,
  Link as LinkIcon,
  PauseCircle,
  MousePointer2,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

type ContrastMode = 'normal' | 'high' | 'inverted' | 'grayscale';

interface A11ySettings {
  fontScale: number;
  contrast: ContrastMode;
  highlightLinks: boolean;
  reduceMotion: boolean;
  bigCursor: boolean;
}

const DEFAULT_SETTINGS: A11ySettings = {
  fontScale: 1,
  contrast: 'normal',
  highlightLinks: false,
  reduceMotion: false,
  bigCursor: false,
};

const STORAGE_KEY = 'mestory-a11y-settings';
const FONT_STEP = 0.1;
const FONT_MIN = 0.8;
const FONT_MAX = 1.6;

function loadSettings(): A11ySettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function applySettingsToDom(s: A11ySettings) {
  const root = document.documentElement;
  root.style.setProperty('--a11y-font-scale', String(s.fontScale));
  if (s.fontScale !== 1) root.classList.add('a11y-font-scaled');
  else root.classList.remove('a11y-font-scaled');

  root.classList.remove('a11y-contrast-high', 'a11y-contrast-inverted', 'a11y-contrast-grayscale');
  if (s.contrast === 'high') root.classList.add('a11y-contrast-high');
  else if (s.contrast === 'inverted') root.classList.add('a11y-contrast-inverted');
  else if (s.contrast === 'grayscale') root.classList.add('a11y-contrast-grayscale');

  root.classList.toggle('a11y-highlight-links', s.highlightLinks);
  root.classList.toggle('a11y-reduce-motion', s.reduceMotion);
  root.classList.toggle('a11y-big-cursor', s.bigCursor);
}

export default function AccessibilityWidget() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>(() => loadSettings());
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    applySettingsToDom(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore quota errors
    }
  }, [settings]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const update = useCallback(<K extends keyof A11ySettings>(key: K, value: A11ySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = () => setSettings(DEFAULT_SETTINGS);

  const t = (he: string, en: string) => (isHebrew ? he : en);

  const contrastButton = (mode: ContrastMode, icon: React.ReactNode, labelHe: string, labelEn: string) => (
    <button
      type="button"
      onClick={() => update('contrast', settings.contrast === mode ? 'normal' : mode)}
      aria-pressed={settings.contrast === mode}
      className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border transition-colors text-xs ${
        settings.contrast === mode
          ? 'bg-memorial-gold/20 border-memorial-gold text-memorial-gold'
          : 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10'
      }`}
    >
      {icon}
      <span>{t(labelHe, labelEn)}</span>
    </button>
  );

  const toggleButton = (
    on: boolean,
    onToggle: () => void,
    icon: React.ReactNode,
    labelHe: string,
    labelEn: string
  ) => (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={`flex items-center justify-between gap-3 w-full p-3 rounded-lg border transition-colors text-sm ${
        on
          ? 'bg-memorial-gold/20 border-memorial-gold text-memorial-gold'
          : 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10'
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        <span>{t(labelHe, labelEn)}</span>
      </span>
      <span
        className={`inline-block w-9 h-5 rounded-full relative transition-colors ${
          on ? 'bg-memorial-gold' : 'bg-gray-600'
        }`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
            on ? (isHebrew ? 'right-0.5' : 'left-[18px]') : isHebrew ? 'right-[18px]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  );

  const panelSide = isHebrew ? 'right-4' : 'left-4';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('פתיחת תפריט נגישות', 'Open accessibility menu')}
        aria-expanded={open}
        aria-controls="a11y-panel"
        className={`fixed bottom-4 ${panelSide} z-[9998] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-memorial-gold text-deep-space shadow-lg shadow-black/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform focus:outline-none focus:ring-4 focus:ring-memorial-gold/40`}
      >
        <Accessibility className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
      </button>

      {open && (
        <div
          id="a11y-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label={t('תפריט נגישות', 'Accessibility menu')}
          dir={isHebrew ? 'rtl' : 'ltr'}
          className={`fixed bottom-20 ${panelSide} z-[9999] w-[min(92vw,340px)] max-h-[80vh] overflow-y-auto rounded-2xl bg-deep-space/95 backdrop-blur-md border border-white/10 shadow-2xl text-white p-4`}
        >
          <header className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Accessibility className="w-5 h-5 text-memorial-gold" aria-hidden="true" />
              {t('תפריט נגישות', 'Accessibility')}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('סגירה', 'Close')}
              className="p-1 rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-memorial-gold"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </header>

          <section aria-label={t('גודל טקסט', 'Text size')} className="mb-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1">
              <Type className="w-3.5 h-3.5" aria-hidden="true" />
              {t('גודל טקסט', 'Text size')}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => update('fontScale', Math.max(FONT_MIN, +(settings.fontScale - FONT_STEP).toFixed(2)))}
                aria-label={t('הקטנת טקסט', 'Decrease text')}
                disabled={settings.fontScale <= FONT_MIN}
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-memorial-gold"
              >
                <Minus className="w-4 h-4" aria-hidden="true" />
              </button>
              <div
                className="flex-1 text-center text-sm bg-white/5 border border-white/10 rounded-lg py-2"
                aria-live="polite"
              >
                {Math.round(settings.fontScale * 100)}%
              </div>
              <button
                type="button"
                onClick={() => update('fontScale', Math.min(FONT_MAX, +(settings.fontScale + FONT_STEP).toFixed(2)))}
                aria-label={t('הגדלת טקסט', 'Increase text')}
                disabled={settings.fontScale >= FONT_MAX}
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-memorial-gold"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </section>

          <section aria-label={t('ניגודיות וצבעים', 'Contrast and color')} className="mb-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
              {t('ניגודיות וצבעים', 'Contrast & color')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {contrastButton('high', <Contrast className="w-5 h-5" aria-hidden="true" />, 'ניגודיות גבוהה', 'High')}
              {contrastButton('inverted', <Contrast className="w-5 h-5 rotate-180" aria-hidden="true" />, 'הפוך', 'Invert')}
              {contrastButton('grayscale', <Droplet className="w-5 h-5" aria-hidden="true" />, 'גווני אפור', 'Grayscale')}
            </div>
          </section>

          <section aria-label={t('כלי עזר נוספים', 'Additional helpers')} className="space-y-2 mb-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
              {t('כלי עזר', 'Helpers')}
            </p>
            {toggleButton(
              settings.highlightLinks,
              () => update('highlightLinks', !settings.highlightLinks),
              <LinkIcon className="w-4 h-4" aria-hidden="true" />,
              'הדגשת קישורים',
              'Highlight links'
            )}
            {toggleButton(
              settings.reduceMotion,
              () => update('reduceMotion', !settings.reduceMotion),
              <PauseCircle className="w-4 h-4" aria-hidden="true" />,
              'עצירת אנימציות',
              'Reduce motion'
            )}
            {toggleButton(
              settings.bigCursor,
              () => update('bigCursor', !settings.bigCursor),
              <MousePointer2 className="w-4 h-4" aria-hidden="true" />,
              'סמן עכבר גדול',
              'Big cursor'
            )}
          </section>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={reset}
              className="flex items-center justify-center gap-1 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-memorial-gold"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              {t('איפוס', 'Reset')}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/accessibility');
              }}
              className="flex items-center justify-center gap-1 p-2 rounded-lg bg-memorial-gold/20 border border-memorial-gold/40 text-memorial-gold hover:bg-memorial-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-memorial-gold"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              {t('הצהרה', 'Statement')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
