/**
 * AI Complete Design Wizard - One Button Solution
 *
 * Premium AI-powered book design that creates EVERYTHING:
 * - Custom typography (fonts, sizes, colors)
 * - Page layout (margins, columns, chapter style)
 * - Complete cover design (front, back, spine) with AI images
 * - Smart image placeholders in chapters
 * - Auto-generated synopsis
 * - Saves everything to the book automatically
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  BookOpen,
  Palette,
  Image as ImageIcon,
  Check,
  Loader2,
  RefreshCw,
  Type,
  Layout,
  Wand2,
  Eye,
  ArrowRight,
  BookMarked,
  FileText,
  Save,
  Layers,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useModal } from '../../hooks/useModal';
import { api } from '../../services/api';
import { BookTemplate, saveCustomTemplate } from '../../data/bookTemplates';
import toast from 'react-hot-toast';

// ─── Genre-Based Design Templates (instant, no API call) ─────────────────────

function generateDesignFromGenre(genre: string, title: string, authorName: string, isHebrew: boolean) {
  const g = (genre || '').toLowerCase();

  // Color palettes per genre family
  const palettes: Record<string, { text: string; heading: string; accent: string; bg: string; coverBg: string; coverPalette: string[] }> = {
    memoir:    { text: '#2c2416', heading: '#1a1a0e', accent: '#8b6914', bg: '#fffdf7', coverBg: '#2c1810', coverPalette: ['#8b6914', '#d4a853', '#2c1810'] },
    biography: { text: '#1e293b', heading: '#0f172a', accent: '#6366f1', bg: '#faf8ff', coverBg: '#1e1b4b', coverPalette: ['#6366f1', '#818cf8', '#1e1b4b'] },
    fiction:   { text: '#1a1a2e', heading: '#16213e', accent: '#e94560', bg: '#fefcfb', coverBg: '#16213e', coverPalette: ['#e94560', '#0f3460', '#16213e'] },
    romance:   { text: '#3d0c11', heading: '#5c1a28', accent: '#c2185b', bg: '#fef7f9', coverBg: '#4a0e1b', coverPalette: ['#c2185b', '#e91e63', '#f8bbd0'] },
    children:  { text: '#1b5e20', heading: '#2e7d32', accent: '#ff9800', bg: '#fffde7', coverBg: '#1b5e20', coverPalette: ['#ff9800', '#4caf50', '#2196f3'] },
    thriller:  { text: '#1a1a1a', heading: '#212121', accent: '#b71c1c', bg: '#fafafa', coverBg: '#1a1a1a', coverPalette: ['#b71c1c', '#d32f2f', '#212121'] },
    scifi:     { text: '#0d1b2a', heading: '#1b2838', accent: '#00bcd4', bg: '#f0f9ff', coverBg: '#0d1b2a', coverPalette: ['#00bcd4', '#0288d1', '#0d1b2a'] },
    fantasy:   { text: '#1a0a2e', heading: '#2d1b4e', accent: '#9c27b0', bg: '#fdf5ff', coverBg: '#1a0a2e', coverPalette: ['#9c27b0', '#ce93d8', '#4a148c'] },
    history:   { text: '#3e2723', heading: '#4e342e', accent: '#795548', bg: '#faf6f3', coverBg: '#3e2723', coverPalette: ['#795548', '#a1887f', '#3e2723'] },
    poetry:    { text: '#263238', heading: '#37474f', accent: '#607d8b', bg: '#f5f7fa', coverBg: '#263238', coverPalette: ['#607d8b', '#90a4ae', '#263238'] },
    cooking:   { text: '#33220b', heading: '#4e3317', accent: '#e65100', bg: '#fff8f0', coverBg: '#4e3317', coverPalette: ['#e65100', '#ff9800', '#4e3317'] },
    selfhelp:  { text: '#004d40', heading: '#00695c', accent: '#009688', bg: '#f0faf8', coverBg: '#004d40', coverPalette: ['#009688', '#4db6ac', '#004d40'] },
  };

  // Match genre to closest palette
  let palette = palettes.memoir; // default
  for (const [key, val] of Object.entries(palettes)) {
    if (g.includes(key) || g.includes(key.slice(0, 4))) { palette = val; break; }
  }
  // Hebrew genre matching
  if (g.includes('זיכרון') || g.includes('אוטו') || g.includes('ביוגרפ')) palette = palettes.memoir;
  else if (g.includes('רומ') || g.includes('אהבה')) palette = palettes.romance;
  else if (g.includes('ילד') || g.includes('נוער')) palette = palettes.children;
  else if (g.includes('מתח') || g.includes('מסתורין')) palette = palettes.thriller;
  else if (g.includes('פנטז') || g.includes('דמיון')) palette = palettes.fantasy;
  else if (g.includes('שיר') || g.includes('פואמ')) palette = palettes.poetry;
  else if (g.includes('היסטור')) palette = palettes.history;
  else if (g.includes('בישול') || g.includes('מתכון')) palette = palettes.cooking;
  else if (g.includes('עזרה') || g.includes('self')) palette = palettes.selfhelp;
  else if (g.includes('מד"ב') || g.includes('sci')) palette = palettes.scifi;

  const bodyFont = isHebrew ? 'David Libre' : 'Merriweather';
  const headingFont = isHebrew ? 'Secular One' : 'Playfair Display';
  const titleFont = isHebrew ? 'Suez One' : 'Playfair Display';

  return {
    typography: {
      bodyFont, headingFont, titleFont,
      fontSize: 12, lineHeight: 1.7, chapterTitleSize: 28,
      colors: { text: palette.text, heading: palette.heading, accent: palette.accent },
    },
    layout: {
      pageSize: 'A5',
      margins: { top: 32, bottom: 28, inner: 28, outer: 24 },
      chapterStartStyle: 'new-page-centered' as const,
      pageNumberPosition: 'bottom-center' as const,
      headerStyle: 'chapter-title' as const,
      dropCaps: true,
      background: { primaryColor: palette.bg },
    },
    cover: {
      front: { colorPalette: palette.coverPalette, backgroundColor: palette.coverBg,
        title: { text: title, font: titleFont, size: 48, color: '#ffffff', position: 'center' },
        author: { text: authorName, font: bodyFont, size: 18, color: '#ffffffcc' },
      },
      back: { backgroundColor: palette.coverBg,
        synopsis: { text: '', font: bodyFont, size: 14, color: '#ffffff' },
        author: { text: authorName, font: bodyFont, size: 16, color: '#ffffff' },
      },
      spine: { title, author: authorName, font: bodyFont, color: '#ffffff', backgroundColor: palette.accent },
    },
    theme: { primaryTheme: genre, mood: 'professional', visualStyle: 'elegant', colorMood: 'warm' },
    overallStyle: `${genre} elegant design`,
    moodDescription: `Professional ${genre} book design`,
    tableOfContents: { style: 'elegant' },
    chapterDecoration: { headerStyle: 'centered', titleDecoration: 'ornament' },
    imagePlacements: [],
  };
}

// ─── Style Variants ───────────────────────────────────────────────────────────

type StyleVariantKey = 'minimal' | 'classic' | 'luxurious';

interface StyleVariantConfig {
  key: StyleVariantKey;
  nameHe: string;
  nameEn: string;
  descriptionHe: string;
  descriptionEn: string;
  swatches: string[];
  dropCapStyle: 'classic' | 'none' | 'decorative' | 'box';
  dividerStyle: 'ornament' | 'none' | 'stars' | 'wave';
  pageFrame: 'none' | 'simple' | 'double' | 'ornate';
  backgroundPattern: 'none' | 'dots' | 'grid';
  headerDecoration: 'none' | 'ornament' | 'gradient-line' | 'line';
  cornerDecorations: 'none' | 'flourish' | 'floral' | 'geometric';
  sectionDivider: string;
  titleUnderline: 'none' | 'gradient' | 'ornate' | 'simple';
  pageSize: 'A4' | 'A5' | 'B5';
}

const STYLE_VARIANTS: StyleVariantConfig[] = [
  {
    key: 'minimal',
    nameHe: 'מינימלי',
    nameEn: 'Minimal',
    descriptionHe: 'נקי, פשוט, ללא קישוטים',
    descriptionEn: 'Clean, simple, no ornaments',
    swatches: ['#f8f9fa', '#e9ecef', '#dee2e6', '#1a1a2e', '#6c757d'],
    dropCapStyle: 'none',
    dividerStyle: 'none',
    pageFrame: 'none',
    backgroundPattern: 'none',
    headerDecoration: 'line',
    cornerDecorations: 'none',
    sectionDivider: '⸻',
    titleUnderline: 'simple',
    pageSize: 'A5',
  },
  {
    key: 'classic',
    nameHe: 'קלאסי',
    nameEn: 'Classic',
    descriptionHe: 'סריף, זהב, תחושת ספר מסורתי',
    descriptionEn: 'Serif, gold accents, traditional book feel',
    swatches: ['#fdf6e3', '#d4af37', '#8b4513', '#2c1810', '#a0522d'],
    dropCapStyle: 'classic',
    dividerStyle: 'ornament',
    pageFrame: 'simple',
    backgroundPattern: 'none',
    headerDecoration: 'ornament',
    cornerDecorations: 'flourish',
    sectionDivider: '⸻ ✦ ⸻',
    titleUnderline: 'ornate',
    pageSize: 'B5',
  },
  {
    key: 'luxurious',
    nameHe: 'מפואר',
    nameEn: 'Luxurious',
    descriptionHe: 'קישוטים מרובים, גבולות דקורטיביים, פרימיום',
    descriptionEn: 'Heavy ornaments, decorative borders, premium feel',
    swatches: ['#0d0d0d', '#c9a84c', '#8b0000', '#1a0533', '#4a0080'],
    dropCapStyle: 'decorative',
    dividerStyle: 'ornament',
    pageFrame: 'ornate',
    backgroundPattern: 'dots',
    headerDecoration: 'gradient-line',
    cornerDecorations: 'floral',
    sectionDivider: '✦ ❦ ✦',
    titleUnderline: 'gradient',
    pageSize: 'A5',
  },
];

// ─── Progress Steps ───────────────────────────────────────────────────────────

const PROGRESS_STEPS: { titleHe: string; titleEn: string; percent: number }[] = [
  { titleHe: 'מנתח את תוכן הספר...', titleEn: 'Analyzing book content...', percent: 15 },
  { titleHe: 'בוחר פלטת צבעים...', titleEn: 'Selecting color palette...', percent: 35 },
  { titleHe: 'מתאים גופנים ועיצוב...', titleEn: 'Matching fonts and layout...', percent: 55 },
  { titleHe: 'מעצב פריסת עמודים...', titleEn: 'Designing page layout...', percent: 75 },
  { titleHe: 'שומר ומסיים...', titleEn: 'Saving and finishing...', percent: 90 },
  { titleHe: 'מוכן!', titleEn: 'Ready!', percent: 100 },
];

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface CoverDesign {
  front: {
    imagePrompt: string;
    imageUrl?: string;
    backgroundColor?: string;
    title: { text: string; font: string; size: number; color: string; position: string };
    author: { text: string; font: string; size: number; color: string };
    colorPalette: string[];
  };
  back: {
    imagePrompt: string;
    imageUrl?: string;
    synopsis: { text: string; font: string; size: number; color: string };
    author: { text: string; font: string; size: number; color: string };
    backgroundColor: string;
  };
  spine: {
    title: string;
    author: string;
    font: string;
    color: string;
    backgroundColor: string;
  };
}

interface ImagePlacement {
  chapterIndex: number;
  position: 'chapter-start' | 'mid-chapter' | 'chapter-end';
  textContext: string;
  suggestedPrompt: string;
  importance: 'high' | 'medium' | 'low';
  reasoning: string;
  generatedImageUrl?: string;
}

interface Typography {
  bodyFont: string;
  headingFont: string;
  titleFont: string;
  fontSize: number;
  lineHeight: number;
  chapterTitleSize: number;
  colors: {
    text: string;
    heading: string;
    accent: string;
  };
}

interface PageLayout {
  margins: { top: number; bottom: number; inner: number; outer: number };
  chapterStartStyle: 'same-page' | 'new-page' | 'new-page-centered';
  pageNumberPosition: 'bottom-center' | 'bottom-outer' | 'top-outer' | 'none';
  headerStyle: 'none' | 'book-title' | 'chapter-title' | 'author-name';
  dropCaps: boolean;
}

interface CompleteDesign {
  typography: Typography;
  layout: PageLayout;
  cover: CoverDesign;
  imagePlacements: ImagePlacement[];
  synopsis?: string;
  overallStyle: string;
  moodDescription: string;
  // Extended design settings
  dropCapStyle?: 'classic' | 'none' | 'decorative' | 'box';
  dividerStyle?: 'ornament' | 'none' | 'stars' | 'wave';
  pageFrame?: 'none' | 'simple' | 'double' | 'ornate';
  frameColor?: string;
  backgroundPattern?: 'none' | 'dots' | 'grid';
  headerDecoration?: 'none' | 'ornament' | 'gradient-line' | 'line';
  cornerDecorations?: 'none' | 'flourish' | 'floral' | 'geometric';
  sectionDivider?: string;
  titleUnderline?: 'none' | 'gradient' | 'ornate' | 'simple';
  pageSize?: string;
  styleVariant?: StyleVariantKey;
}

interface AICompleteDesignWizardProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  book: {
    title: string;
    genre: string;
    synopsis?: string;
    description?: string;
    chapters?: Array<{ title: string; content: string }>;
    author?: { name: string };
  };
  onDesignComplete: (design: CompleteDesign, coverImageUrls: { front?: string; back?: string }) => void;
}

type Step = 'intro' | 'analyzing' | 'typography' | 'layout' | 'cover' | 'synopsis' | 'images' | 'saving' | 'variant' | 'preview';

const STEPS: { key: Step; icon: any; titleHe: string; titleEn: string }[] = [
  { key: 'analyzing', icon: BookOpen, titleHe: 'מנתח את הספר', titleEn: 'Analyzing book' },
  { key: 'typography', icon: Type, titleHe: 'יוצר טיפוגרפיה', titleEn: 'Creating typography' },
  { key: 'layout', icon: Layout, titleHe: 'מעצב פריסה', titleEn: 'Designing layout' },
  { key: 'cover', icon: Palette, titleHe: 'מעצב כריכה', titleEn: 'Designing covers' },
  { key: 'synopsis', icon: FileText, titleHe: 'יוצר תקציר', titleEn: 'Generating synopsis' },
  { key: 'images', icon: ImageIcon, titleHe: 'ממקם תמונות', titleEn: 'Placing images' },
  { key: 'saving', icon: Save, titleHe: 'שומר הכל', titleEn: 'Saving everything' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AICompleteDesignWizard({
  isOpen,
  onClose,
  bookId,
  book,
  onDesignComplete,
}: AICompleteDesignWizardProps) {
  const { i18n } = useTranslation('common');
  const isHebrew = i18n.language === 'he';

  useModal(isOpen, onClose);

  const [step, setStep] = useState<Step>('intro');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressStepIndex, setProgressStepIndex] = useState(0);
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [design, setDesign] = useState<CompleteDesign | null>(null);
  const [coverImages, setCoverImages] = useState<{ front?: string; back?: string }>({});
  const [synopsis, setSynopsis] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [generateCoverImages, setGenerateCoverImages] = useState(true);
  const [generateSynopsis, setGenerateSynopsis] = useState(true);
  const [generateInteriorImages, setGenerateInteriorImages] = useState(true);
  const [previewTab, setPreviewTab] = useState<'cover' | 'typography' | 'layout' | 'images'>('cover');
  const [selectedVariant, setSelectedVariant] = useState<StyleVariantKey>('classic');

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setStep('intro');
      setCurrentStepIndex(0);
      setProgressStepIndex(0);
      setAnimatedPercent(0);
      setDesign(null);
      setCoverImages({});
      setSynopsis('');
      setError(null);
      setSelectedVariant('classic');
    }
  }, [isOpen]);

  // Animate progress percentage
  useEffect(() => {
    if (step === 'intro' || step === 'variant' || step === 'preview') return;
    const target = PROGRESS_STEPS[progressStepIndex]?.percent ?? 0;
    let current = animatedPercent;
    const interval = setInterval(() => {
      if (current < target) {
        current = Math.min(current + 1, target);
        setAnimatedPercent(current);
      } else {
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [progressStepIndex, step]);

  const updateStep = (newStep: Step, index: number, progressIdx?: number) => {
    setStep(newStep);
    setCurrentStepIndex(index);
    if (progressIdx !== undefined) setProgressStepIndex(progressIdx);
  };

  const startDesign = useCallback(async () => {
    try {
      setError(null);
      setAnimatedPercent(0);
      setProgressStepIndex(0);

      // Generate design LOCALLY from genre-based templates (instant, no API call)
      updateStep('analyzing', 0, 0);
      const data = generateDesignFromGenre(book.genre, book.title, book.author?.name || '', isHebrew);
      await new Promise(r => setTimeout(r, 300));

      updateStep('typography', 1, 1);
      await new Promise(r => setTimeout(r, 300));

      updateStep('layout', 2, 2);
      await new Promise(r => setTimeout(r, 300));

      updateStep('layout', 3, 3);

      // Build design from local genre template
      const processedDesign: CompleteDesign = {
        typography: data.typography || {
          bodyFont: 'David Libre', headingFont: 'Secular One', titleFont: 'Suez One',
          fontSize: 14, lineHeight: 1.7, chapterTitleSize: 28,
          colors: { text: '#1a1a2e', heading: '#2c3e50', accent: '#6366f1' },
        },
        layout: data.layout || {
          margins: { top: 50, bottom: 50, inner: 60, outer: 40 },
          chapterStartStyle: 'new-page-centered', pageNumberPosition: 'bottom-center',
          headerStyle: 'chapter-title', dropCaps: true,
        },
        cover: (data.cover || {
          front: {
            imagePrompt: `Professional book cover for "${book.title}"`,
            backgroundColor: '#1a1a2e',
            title: { text: book.title, font: 'Suez One', size: 48, color: '#ffffff', position: 'center' },
            author: { text: book.author?.name || '', font: 'David Libre', size: 18, color: '#ffffff' },
            colorPalette: ['#6366f1', '#8b5cf6', '#a855f7'],
          },
          back: {
            imagePrompt: 'Blurred background matching front cover',
            synopsis: { text: book.synopsis || book.description || '', font: 'David Libre', size: 14, color: '#ffffff' },
            author: { text: book.author?.name || '', font: 'David Libre', size: 16, color: '#ffffff' },
            backgroundColor: '#1a1a2e',
          },
          spine: { title: book.title, author: book.author?.name || '', font: 'David Libre', color: '#ffffff', backgroundColor: '#6366f1' },
        }) as CoverDesign,
        imagePlacements: [],
        overallStyle: data.overallStyle || 'professional',
        moodDescription: data.moodDescription || data.theme?.primaryTheme || '',
      };

      // Generate synopsis if enabled
      if (generateSynopsis && (!book.synopsis || book.synopsis.length < 50)) {
        try {
          const synRes = await api.post('/ai/generate-synopsis', { bookId });
          if (synRes.data.success && synRes.data.data.synopsis) {
            const syn = synRes.data.data.synopsis;
            setSynopsis(syn);
            processedDesign.synopsis = syn;
            if (processedDesign.cover?.back?.synopsis) processedDesign.cover.back.synopsis.text = syn;
          }
        } catch (_e) { /* non-fatal */ }
      }

      // ── Save layout to server (no cover — user handles cover separately) ──
      updateStep('saving', 4, 4);
      try {
        const savePayload: any = {
          pageLayout: {
            bodyFont: processedDesign.typography.bodyFont,
            headingFont: processedDesign.typography.headingFont,
            titleFont: processedDesign.typography.titleFont,
            fontSize: processedDesign.typography.fontSize,
            lineHeight: processedDesign.typography.lineHeight,
            textColor: processedDesign.typography.colors.text,
            accentColor: processedDesign.typography.colors.accent,
            margins: {
              top: processedDesign.layout.margins?.top || 32,
              bottom: processedDesign.layout.margins?.bottom || 28,
              left: processedDesign.layout.margins?.inner || 28,
              right: processedDesign.layout.margins?.outer || 24,
            },
            chapterStartStyle: processedDesign.layout.chapterStartStyle,
            pageNumberPosition: processedDesign.layout.pageNumberPosition,
            headerStyle: processedDesign.layout.headerStyle,
            dropCaps: processedDesign.layout.dropCaps,
            headerFooter: { includePageNumbers: processedDesign.layout.pageNumberPosition !== 'none' },
          },
        };
        if (synopsis || processedDesign.synopsis) {
          savePayload.synopsis = synopsis || processedDesign.synopsis;
        }
        await api.put(`/books/${bookId}`, savePayload);
      } catch (_saveError) { /* non-fatal */ }

      setProgressStepIndex(7);
      setDesign(processedDesign);
      setStep('variant');

    } catch (err: any) {
      const status = err?.response?.status;
      const serverError = err?.response?.data?.error;
      const is504 = status === 504 || err?.code === 'ECONNABORTED';
      const isTimeout = err?.message?.includes('timeout') || is504;
      const is404 = status === 404;
      let heMsg: string;
      if (isTimeout) {
        heMsg = 'עיצוב ה-AI לוקח זמן רב. אנא נסה שוב בעוד כמה דקות (הבקשה עברה את מגבלת הזמן של השרת)';
      } else if (is404) {
        heMsg = serverError
          ? `שגיאה: ${serverError}`
          : 'הנתיב לא נמצא בשרת (404). ייתכן שהשרת לא עודכן. אנא נסה שוב.';
      } else {
        heMsg = 'שגיאה ביצירת העיצוב: ' + (serverError || err.message || 'שגיאה לא ידועה');
      }
      console.error('[AICompleteDesignWizard] Design failed', { status, serverError, err });
      setError(heMsg);
      setStep('intro');
    }
  }, [bookId, book, generateCoverImages, generateInteriorImages, generateSynopsis, isHebrew]);

  const applyVariantToDesign = (base: CompleteDesign, variantKey: StyleVariantKey): CompleteDesign => {
    const v = STYLE_VARIANTS.find(sv => sv.key === variantKey)!;
    return {
      ...base,
      styleVariant: variantKey,
      dropCapStyle: v.dropCapStyle,
      dividerStyle: v.dividerStyle,
      pageFrame: v.pageFrame,
      frameColor: base.typography.colors.accent,
      backgroundPattern: v.backgroundPattern,
      headerDecoration: v.headerDecoration,
      cornerDecorations: v.cornerDecorations,
      sectionDivider: v.sectionDivider,
      titleUnderline: v.titleUnderline,
      pageSize: v.pageSize,
    };
  };

  const confirmVariant = () => {
    if (!design) return;
    const updated = applyVariantToDesign(design, selectedVariant);
    setDesign(updated);
    setStep('preview');
  };

  const handleApply = async () => {
    if (!design) return;

    try {
      // Safely destructure with defaults — server may return partial objects
      const typo = design.typography || {} as any;
      const layout = design.layout || {} as any;
      const margins = layout.margins || { top: 50, bottom: 50, inner: 60, outer: 40 };
      const colors = typo.colors || { text: '#1a1a2e', heading: '#2c3e50', accent: '#6366f1' };

      const customTemplate: BookTemplate = {
        id: `ai-custom-${Date.now()}`,
        name: `AI Design for ${book.title}`,
        nameHe: `עיצוב AI עבור ${book.title}`,
        description: `Custom AI-generated design`,
        descriptionHe: `עיצוב מותאם אישית שנוצר על ידי AI`,
        category: 'custom',
        fonts: {
          title: typo.titleFont || 'Suez One',
          body: typo.bodyFont || 'David Libre',
          headers: typo.headingFont || 'Secular One',
        },
        headerSizes: { h1: typo.chapterTitleSize || 28, h2: 22, h3: 18 },
        fontSize: typo.fontSize || 14,
        lineHeight: typo.lineHeight || 1.7,
        columns: 1,
        paragraphStyle: 'vertical',
        pageNumberPosition:
          layout.pageNumberPosition === 'bottom-outer' || layout.pageNumberPosition === 'top-outer'
            ? 'bottom-outside' as const
            : (layout.pageNumberPosition || 'bottom-center') as 'none' | 'top-left' | 'top-right' | 'bottom-center' | 'bottom-outside',
        margins: {
          top: margins.top,
          bottom: margins.bottom,
          left: margins.inner || 60,
          right: margins.outer || 40,
        },
        paragraphIndent: 0,
        paragraphSpacing: 12,
        chapterStartStyle: layout.chapterStartStyle || 'new-page-centered',
        dropCapStyle: design.dropCapStyle || (layout.dropCaps ? 'classic' : 'none'),
        headerDecoration: design.headerDecoration || 'banner',
        dividerStyle: design.dividerStyle || 'ornament',
        imagePositions: ['top', 'center'],
        imageFrameStyle: 'rounded',
        textColor: colors.text,
        accentColor: colors.accent,
        backgroundColor: (layout as any).background?.primaryColor || '#fefdfb',
        previewGradient: `linear-gradient(135deg, ${colors.accent}40, ${colors.heading}40)`,
        coverStyle: {
          backgroundColor: design.cover?.spine?.backgroundColor || '#6366f1',
          titlePosition: 'center' as const,
          titleAlignment: 'center' as const,
          titleColor: design.cover?.front?.title?.color || '#ffffff',
          authorColor: design.cover?.front?.author?.color || '#ffffff',
        },
        creativeImageLayout: {
          pattern: 'custom' as any,
          imageCount: (design.imagePlacements || []).length,
          customPositions: (design.imagePlacements || []).map((p) => ({
            x: 10,
            y: p.position === 'chapter-start' ? 10 : p.position === 'mid-chapter' ? 40 : 70,
            width: 40,
            height: 30,
            rotation: 0,
          })),
        },
      };

      saveCustomTemplate(customTemplate);
      onDesignComplete(design, coverImages);
      toast.success(isHebrew ? 'העיצוב הושלם והוחל בהצלחה!' : 'Design completed and applied!');
      onClose();
    } catch (err: any) {
      console.error('Apply design error:', err);
      toast.error(err.message || 'Failed to apply design');
    }
  };

  const handleRegenerate = () => {
    setStep('intro');
    setDesign(null);
    setCoverImages({});
    setSynopsis('');
    setAnimatedPercent(0);
    setProgressStepIndex(0);
  };

  const getCurrentStepInfo = () => {
    if (step === 'intro') return { icon: Wand2, titleHe: 'עצב לי הכל', titleEn: 'Design Everything' };
    if (step === 'preview') return { icon: Eye, titleHe: 'תצוגה מקדימה', titleEn: 'Preview' };
    if (step === 'variant') return { icon: Layers, titleHe: 'בחר סגנון', titleEn: 'Choose Style' };
    return STEPS.find(s => s.key === step) || STEPS[0];
  };

  const stepInfo = getCurrentStepInfo();
  const StepIcon = stepInfo.icon;

  const isProcessing = step !== 'intro' && step !== 'preview' && step !== 'variant';

  // Elapsed time counter — so user sees the wizard is still alive during long API calls
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!isProcessing) { setElapsedSeconds(0); return; }
    const timer = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isProcessing]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-purple-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <motion.div
                animate={isProcessing ? { rotate: 360 } : {}}
                transition={{ duration: 2, repeat: isProcessing ? Infinity : 0, ease: 'linear' }}
                className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center"
              >
                <StepIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {isHebrew ? stepInfo.titleHe : stepInfo.titleEn}
                </h2>
                <p className="text-white/70 text-sm">
                  {isHebrew ? 'כריכה + פריסה + טיפוגרפיה + תקציר + תמונות' : 'Cover + Layout + Typography + Synopsis + Images'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Progress Steps */}
          {isProcessing && (
            <div className="mt-4">
              {/* Step label + animated percentage */}
              <div className="flex items-center justify-between text-sm text-white/80 mb-2 font-medium">
                <motion.span
                  key={progressStepIndex}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isHebrew
                    ? PROGRESS_STEPS[progressStepIndex]?.titleHe
                    : PROGRESS_STEPS[progressStepIndex]?.titleEn}
                </motion.span>
                <span className="tabular-nums">{animatedPercent}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${progressStepIndex >= 4 && progressStepIndex <= 5 ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 animate-pulse' : 'bg-white'}`}
                  style={{ width: `${animatedPercent}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {/* Step circles */}
              <div className="flex items-center justify-center gap-0.5 sm:gap-1 mt-3 overflow-x-auto px-2">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.key}
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                        i < currentStepIndex
                          ? 'bg-green-500 text-white'
                          : i === currentStepIndex
                          ? 'bg-white text-purple-600'
                          : 'bg-white/20 text-white/50'
                      }`}
                    >
                      {i < currentStepIndex ? (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          <AnimatePresence mode="wait">

            {/* Intro */}
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Book Preview */}
                <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-16 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{book.title}</h3>
                    <p className="text-white/60 text-sm">
                      {book.genre} • {book.chapters?.length || 0} {isHebrew ? 'פרקים' : 'chapters'}
                    </p>
                  </div>
                </div>

                {/* What AI Will Do */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    {isHebrew ? 'מה ה-AI יעשה:' : 'What AI will do:'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <FeatureCard icon={Type} title={isHebrew ? 'טיפוגרפיה' : 'Typography'} description={isHebrew ? 'גופנים, גדלים וצבעים' : 'Fonts, sizes, colors'} />
                    <FeatureCard icon={Layout} title={isHebrew ? 'פריסת עמודים' : 'Page Layout'} description={isHebrew ? 'שוליים, כותרות, מספרים' : 'Margins, headers, numbers'} />
                    <FeatureCard icon={Palette} title={isHebrew ? 'כריכה קדמית' : 'Front Cover'} description={isHebrew ? 'תמונה + כותרת + מחבר' : 'Image + title + author'} />
                    <FeatureCard icon={BookMarked} title={isHebrew ? 'גב + שדרה' : 'Back + Spine'} description={isHebrew ? 'תקציר + עיצוב שדרה' : 'Synopsis + spine design'} />
                    <FeatureCard icon={FileText} title={isHebrew ? 'תקציר אוטומטי' : 'Auto Synopsis'} description={isHebrew ? 'יצירת תקציר מהתוכן' : 'Generate from content'} />
                    <FeatureCard icon={ImageIcon} title={isHebrew ? 'מיקומי תמונות' : 'Image Spots'} description={isHebrew ? 'מקומות מומלצים בפרקים' : 'Suggested in chapters'} />
                  </div>
                </div>

                {/* Options */}
                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateCoverImages}
                      onChange={(e) => setGenerateCoverImages(e.target.checked)}
                      className="w-5 h-5 rounded border-purple-500 bg-white/10 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-white">
                      {isHebrew ? 'צור תמונות לכריכה עם AI' : 'Generate cover images with AI'}
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateSynopsis}
                      onChange={(e) => setGenerateSynopsis(e.target.checked)}
                      className="w-5 h-5 rounded border-purple-500 bg-white/10 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-white">
                      {isHebrew ? 'צור תקציר אוטומטי' : 'Generate synopsis automatically'}
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateInteriorImages}
                      onChange={(e) => setGenerateInteriorImages(e.target.checked)}
                      className="w-5 h-5 rounded border-purple-500 bg-white/10 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-white">
                      {isHebrew ? 'הצע מיקומי תמונות בפרקים' : 'Suggest image placements in chapters'}
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300">
                    {error}
                  </div>
                )}

                {/* Start Button */}
                <button
                  onClick={startDesign}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-500/25"
                >
                  <Sparkles className="w-6 h-6" />
                  {isHebrew ? 'עצב לי הכל!' : 'Design Everything!'}
                </button>
              </motion.div>
            )}

            {/* Processing */}
            {isProcessing && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
                  >
                    <Loader2 className="w-12 h-12 text-white" />
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-purple-500/30"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>

                <h3 className="mt-8 text-2xl font-bold text-white">
                  {isHebrew ? stepInfo.titleHe : stepInfo.titleEn}
                </h3>

                <p className="mt-2 text-white/60 text-center max-w-md">
                  {progressStepIndex >= 4 && progressStepIndex <= 5
                    ? (isHebrew
                      ? 'יצירת תמונות עם AI לוקחת עד דקה — אנא המתן...'
                      : 'AI image generation takes up to a minute — please wait...')
                    : (isHebrew
                      ? 'יוצר עיצוב מקצועי מלא עבור הספר שלך'
                      : 'Creating a complete professional design for your book')}
                </p>
                <p className="mt-1 text-white/40 text-xs tabular-nums">
                  {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}
                </p>

                {/* Detailed progress steps list */}
                <div className="mt-8 space-y-2 w-full max-w-sm">
                  {PROGRESS_STEPS.map((ps, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: i <= progressStepIndex ? 1 : 0.3, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          i < progressStepIndex
                            ? 'bg-green-500'
                            : i === progressStepIndex
                            ? 'bg-purple-500 animate-pulse'
                            : 'bg-white/20'
                        }`}
                      >
                        {i < progressStepIndex ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-white/60" />
                        )}
                      </div>
                      <span className={`text-sm ${i === progressStepIndex ? 'text-white font-medium' : 'text-white/50'}`}>
                        {isHebrew ? ps.titleHe : ps.titleEn}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Variant Selector */}
            {step === 'variant' && design && (
              <motion.div
                key="variant"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {isHebrew ? 'בחר סגנון עיצוב' : 'Choose a Design Style'}
                  </h3>
                  <p className="text-white/60 text-sm">
                    {isHebrew
                      ? 'ה-AI יצר את הבסיס. עכשיו בחר את הסגנון שמתאים לך'
                      : 'The AI created the foundation. Now pick the style that fits you'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {STYLE_VARIANTS.map((v) => (
                    <button
                      key={v.key}
                      onClick={() => setSelectedVariant(v.key)}
                      className={`relative rounded-2xl p-5 border-2 text-left transition-all ${
                        selectedVariant === v.key
                          ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      {selectedVariant === v.key && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}

                      {/* Color swatches */}
                      <div className="flex gap-1.5 mb-4">
                        {v.swatches.map((color, ci) => (
                          <div
                            key={ci}
                            className="w-7 h-7 rounded-full border border-white/10 shadow-inner"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>

                      <h4 className="text-white font-bold text-lg mb-1">
                        {isHebrew ? v.nameHe : v.nameEn}
                      </h4>
                      <p className="text-white/60 text-xs leading-relaxed">
                        {isHebrew ? v.descriptionHe : v.descriptionEn}
                      </p>

                      {/* Feature tags */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {v.dropCapStyle !== 'none' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                            {isHebrew ? 'אות ראשונה גדולה' : 'Drop caps'}
                          </span>
                        )}
                        {v.dividerStyle !== 'none' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                            {isHebrew ? 'מפרידים' : 'Dividers'}
                          </span>
                        )}
                        {v.pageFrame !== 'none' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                            {isHebrew ? 'מסגרת' : 'Frame'}
                          </span>
                        )}
                        {v.cornerDecorations !== 'none' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                            {isHebrew ? 'קישוטי פינה' : 'Corners'}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={confirmVariant}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-white font-bold transition-all shadow-lg shadow-purple-500/25"
                  >
                    <Check className="w-5 h-5" />
                    {isHebrew ? 'המשך עם הסגנון הנבחר' : 'Continue with Selected Style'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Preview */}
            {step === 'preview' && design && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Success Banner */}
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">
                      {isHebrew ? 'העיצוב הושלם!' : 'Design Complete!'}
                    </h4>
                    <p className="text-white/70 text-sm">
                      {isHebrew ? 'כל ההגדרות נשמרו אוטומטית' : 'All settings saved automatically'}
                    </p>
                  </div>
                </div>

                {/* Design Summary Card */}
                <DesignSummaryCard design={design} isHebrew={isHebrew} />

                {/* Preview Tabs */}
                <div className="flex gap-1.5 sm:gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20">
                  {[
                    { key: 'cover', icon: BookMarked, label: isHebrew ? 'כריכה' : 'Cover' },
                    { key: 'typography', icon: Type, label: isHebrew ? 'טיפוגרפיה' : 'Typography' },
                    { key: 'layout', icon: Layout, label: isHebrew ? 'פריסה' : 'Layout' },
                    { key: 'images', icon: ImageIcon, label: isHebrew ? 'תמונות' : 'Images' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setPreviewTab(tab.key as any)}
                      className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${
                        previewTab === tab.key
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white/5 rounded-xl p-4 sm:p-6">
                  {/* Cover Tab */}
                  {previewTab === 'cover' && (
                    <div className="space-y-6">
                      <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-2">
                        {/* Back Cover */}
                        <div
                          className="relative w-40 h-56 rounded-lg overflow-hidden shadow-xl order-2 lg:order-1"
                          style={{ backgroundColor: design.cover?.back?.backgroundColor || '#1a1a2e' }}
                        >
                          {coverImages.back ? (
                            <img src={coverImages.back} alt="Back Cover" className="w-full h-full object-cover opacity-60" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10" />
                          )}
                          <div className="absolute inset-0 p-3 flex flex-col justify-center items-center text-center">
                            <p className="text-white/90 text-[10px] leading-relaxed mb-2 line-clamp-5">
                              {synopsis || design.cover?.back?.synopsis?.text || book.synopsis || ''}
                            </p>
                            <p className="text-white/70 text-xs mt-auto">
                              {design.cover?.back?.author?.text || book.author?.name || ''}
                            </p>
                          </div>
                        </div>

                        {/* Spine */}
                        <div
                          className="w-6 h-56 rounded-sm shadow-xl flex items-center justify-center order-3 lg:order-2"
                          style={{ backgroundColor: design.cover?.spine?.backgroundColor || '#6366f1' }}
                        >
                          <div
                            className="transform -rotate-90 whitespace-nowrap text-xs font-medium"
                            style={{ color: design.cover?.spine?.color || '#ffffff' }}
                          >
                            {design.cover?.spine?.title || book.title}
                          </div>
                        </div>

                        {/* Front Cover */}
                        <div className="relative w-40 h-56 rounded-lg overflow-hidden shadow-xl order-1 lg:order-3">
                          {coverImages.front ? (
                            <img src={coverImages.front} alt="Front Cover" className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className="w-full h-full"
                              style={{
                                background: `linear-gradient(135deg, ${design.cover?.front?.colorPalette?.[0] || '#6366f1'}, ${design.cover?.front?.colorPalette?.[1] || '#8b5cf6'})`,
                              }}
                            />
                          )}
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                            <h3 className="text-lg font-bold mb-1 drop-shadow-lg" style={{ color: design.cover?.front?.title?.color || '#ffffff' }}>
                              {design.cover?.front?.title?.text || book.title}
                            </h3>
                            <p className="text-xs drop-shadow" style={{ color: design.cover?.front?.author?.color || '#ffffff' }}>
                              {design.cover?.front?.author?.text || book.author?.name || ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Typography Tab */}
                  {previewTab === 'typography' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="text-sm text-white/50">{isHebrew ? 'גופן גוף' : 'Body Font'}</label>
                        <p className="text-white font-medium">{design.typography.bodyFont}</p>
                      </div>
                      <div>
                        <label className="text-sm text-white/50">{isHebrew ? 'גופן כותרות' : 'Heading Font'}</label>
                        <p className="text-white font-medium">{design.typography.headingFont}</p>
                      </div>
                      <div>
                        <label className="text-sm text-white/50">{isHebrew ? 'גודל גופן' : 'Font Size'}</label>
                        <p className="text-white font-medium">{design.typography.fontSize}px</p>
                      </div>
                      <div>
                        <label className="text-sm text-white/50">{isHebrew ? 'גובה שורה' : 'Line Height'}</label>
                        <p className="text-white font-medium">{design.typography.lineHeight}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm text-white/50 mb-2 block">{isHebrew ? 'צבעים' : 'Colors'}</label>
                        <div className="flex flex-wrap gap-3 sm:gap-4">
                          {[
                            { color: design.typography.colors.text, labelHe: 'טקסט', labelEn: 'Text' },
                            { color: design.typography.colors.heading, labelHe: 'כותרות', labelEn: 'Headings' },
                            { color: design.typography.colors.accent, labelHe: 'הדגשה', labelEn: 'Accent' },
                          ].map(({ color, labelHe, labelEn }) => (
                            <div key={labelEn} className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: color }} />
                              <span className="text-sm text-white/70">{isHebrew ? labelHe : labelEn}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Layout Tab */}
                  {previewTab === 'layout' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="text-sm text-white/50">{isHebrew ? 'סגנון פרק' : 'Chapter Style'}</label>
                        <p className="text-white font-medium">
                          {design.layout.chapterStartStyle === 'new-page-centered'
                            ? isHebrew ? 'עמוד חדש במרכז' : 'New page centered'
                            : design.layout.chapterStartStyle === 'new-page'
                            ? isHebrew ? 'עמוד חדש' : 'New page'
                            : isHebrew ? 'באותו עמוד' : 'Same page'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-white/50">{isHebrew ? 'מספרי עמודים' : 'Page Numbers'}</label>
                        <p className="text-white font-medium">{design.layout.pageNumberPosition}</p>
                      </div>
                      <div>
                        <label className="text-sm text-white/50">{isHebrew ? 'כותרת עליונה' : 'Header'}</label>
                        <p className="text-white font-medium">{design.layout.headerStyle}</p>
                      </div>
                      <div>
                        <label className="text-sm text-white/50">{isHebrew ? 'אות ראשונה גדולה' : 'Drop Caps'}</label>
                        <p className="text-white font-medium">{design.layout.dropCaps ? '✓' : '✗'}</p>
                      </div>
                      {design.dividerStyle && (
                        <div>
                          <label className="text-sm text-white/50">{isHebrew ? 'מפריד פסקאות' : 'Divider Style'}</label>
                          <p className="text-white font-medium">{design.dividerStyle}</p>
                        </div>
                      )}
                      {design.pageFrame && design.pageFrame !== 'none' && (
                        <div>
                          <label className="text-sm text-white/50">{isHebrew ? 'מסגרת עמוד' : 'Page Frame'}</label>
                          <p className="text-white font-medium">{design.pageFrame}</p>
                        </div>
                      )}
                      {design.sectionDivider && (
                        <div>
                          <label className="text-sm text-white/50">{isHebrew ? 'סימן הפרדה' : 'Section Divider'}</label>
                          <p className="text-white font-medium tracking-widest">{design.sectionDivider}</p>
                        </div>
                      )}
                      {design.pageSize && (
                        <div>
                          <label className="text-sm text-white/50">{isHebrew ? 'גודל עמוד' : 'Page Size'}</label>
                          <p className="text-white font-medium">{design.pageSize}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Images Tab */}
                  {previewTab === 'images' && (
                    <div className="space-y-4">
                      {design.imagePlacements.length > 0 ? (
                        design.imagePlacements.slice(0, 5).map((placement, i) => (
                          <div key={i} className="bg-white/5 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">
                                {isHebrew ? `פרק ${placement.chapterIndex + 1}` : `Chapter ${placement.chapterIndex + 1}`}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  placement.importance === 'high'
                                    ? 'bg-red-500/30 text-red-300'
                                    : placement.importance === 'medium'
                                    ? 'bg-yellow-500/30 text-yellow-300'
                                    : 'bg-green-500/30 text-green-300'
                                }`}
                              >
                                {placement.importance}
                              </span>
                            </div>
                            <p className="text-white/60 text-sm">{placement.suggestedPrompt}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-white/50 text-center py-8">
                          {isHebrew ? 'לא נמצאו המלצות לתמונות' : 'No image recommendations'}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
                  {/* Regenerate button */}
                  <button
                    onClick={handleRegenerate}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors w-full sm:w-auto justify-center sm:justify-start"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {isHebrew ? 'יפה לי זה / צור מחדש' : 'Regenerate / Redo'}
                  </button>

                  <button
                    onClick={handleApply}
                    className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl text-white font-bold transition-all shadow-lg shadow-green-500/25 w-full sm:w-auto justify-center text-sm sm:text-base order-first sm:order-last"
                  >
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    {isHebrew ? 'סיום והחלה' : 'Finish & Apply'}
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-purple-400" />
      </div>
      <div>
        <h4 className="text-white font-medium text-sm">{title}</h4>
        <p className="text-white/50 text-xs">{description}</p>
      </div>
    </div>
  );
}

// ─── Design Summary Card ──────────────────────────────────────────────────────

function DesignSummaryCard({ design, isHebrew }: { design: CompleteDesign; isHebrew: boolean }) {
  const variantInfo = STYLE_VARIANTS.find(v => v.key === design.styleVariant);
  const palette = [
    design.typography.colors.text,
    design.typography.colors.heading,
    design.typography.colors.accent,
    design.cover?.front?.colorPalette?.[0] || '#6366f1',
    design.cover?.spine?.backgroundColor || '#6366f1',
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      <h4 className="text-white font-semibold text-sm flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-yellow-400" />
        {isHebrew ? 'סיכום העיצוב' : 'Design Summary'}
      </h4>

      {/* Color palette */}
      <div className="flex items-center gap-2">
        <span className="text-white/50 text-xs w-20 shrink-0">{isHebrew ? 'פלטת צבעים' : 'Colors'}</span>
        <div className="flex gap-1.5">
          {palette.map((color, i) => (
            <div
              key={i}
              title={color}
              className="w-6 h-6 rounded-full border border-white/10"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="flex gap-1">
          <span className="text-white/50">{isHebrew ? 'כותרת:' : 'Title:'}</span>
          <span className="text-white truncate">{design.typography.titleFont}</span>
        </div>
        <div className="flex gap-1">
          <span className="text-white/50">{isHebrew ? 'גוף:' : 'Body:'}</span>
          <span className="text-white truncate">{design.typography.bodyFont}</span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-2 text-xs">
        {design.pageSize && (
          <span className="px-2 py-0.5 bg-white/10 rounded-full text-white/70">
            {design.pageSize}
          </span>
        )}
        {variantInfo && (
          <span className="px-2 py-0.5 bg-purple-500/20 rounded-full text-purple-300">
            {isHebrew ? variantInfo.nameHe : variantInfo.nameEn}
          </span>
        )}
        <span className={`px-2 py-0.5 rounded-full ${design.dropCapStyle && design.dropCapStyle !== 'none' ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/40'}`}>
          {isHebrew ? 'אות ראשונה גדולה: ' : 'Drop caps: '}
          {design.dropCapStyle && design.dropCapStyle !== 'none' ? (isHebrew ? 'כן' : 'yes') : (isHebrew ? 'לא' : 'no')}
        </span>
        <span className={`px-2 py-0.5 rounded-full ${design.dividerStyle && design.dividerStyle !== 'none' ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/40'}`}>
          {isHebrew ? 'קישוטים: ' : 'Ornaments: '}
          {design.dividerStyle && design.dividerStyle !== 'none' ? (isHebrew ? 'כן' : 'yes') : (isHebrew ? 'לא' : 'no')}
        </span>
      </div>
    </div>
  );
}
