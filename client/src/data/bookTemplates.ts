// Book Design Templates
// Pre-made templates for quick book styling
// Target audience: regular people documenting their life stories, not professional writers

export interface BookTemplate {
  id: string;
  name: string;
  nameHe: string;
  description: string;
  descriptionHe: string;
  category: 'classic' | 'modern' | 'elegant' | 'playful' | 'minimal' | 'creative' | 'memorial' | 'autobiography' | 'family-history' | 'gift' | 'travel' | 'custom';

  // Typography
  fonts: {
    title: string;
    body: string;
    headers: string;
  };
  headerSizes: {
    h1: number;
    h2: number;
    h3: number;
  };
  fontSize: number;
  lineHeight: number;

  // Layout
  columns: 1 | 2 | 3 | 4;
  paragraphStyle: 'vertical' | 'horizontal';
  pageNumberPosition: 'top-left' | 'top-right' | 'bottom-center' | 'bottom-outside' | 'none';
  margins: { top: number; bottom: number; left: number; right: number };
  paragraphIndent: number;
  paragraphSpacing: number;

  // Advanced Layout Features
  chapterStartStyle?: 'same-page' | 'new-page' | 'new-page-centered' | 'drop-cap';
  dropCapStyle?: 'none' | 'classic' | 'decorative' | 'box' | 'modern';
  dropCapSize?: number; // lines to span
  headerDecoration?: 'none' | 'line' | 'ornament' | 'gradient-line' | 'dots' | 'banner';
  dividerStyle?: 'none' | 'line' | 'ornament' | 'stars' | 'dots' | 'wave';
  pullQuoteStyle?: 'none' | 'bordered' | 'background' | 'side-accent' | 'centered';

  // Images - Basic
  imagePositions: ('top' | 'center' | 'bottom' | 'combined' | 'side' | 'full-bleed')[];
  imageFrameStyle?: 'none' | 'border' | 'shadow' | 'rounded' | 'polaroid' | 'vintage';
  imageLayout?: 'single' | 'grid-2' | 'grid-3' | 'mosaic' | 'scattered';

  // Images - Creative Layouts
  creativeImageLayout?: {
    pattern: 'triangle' | 'corners' | 'diagonal' | 'side-by-side' | 'staggered' | 'pyramid' | 'circular' | 'filmstrip' | 'collage' | 'waterfall' | 'honeycomb' | 'zigzag';
    imageCount: number;
    customPositions?: { x: number; y: number; width: number; height: number; rotation?: number }[];
  };

  // Decorative Elements
  decorativeElements?: {
    // Emoji decorations
    headerEmoji?: string; // e.g., "📖" or "✨"
    footerEmoji?: string;
    chapterEmoji?: string;
    dividerEmoji?: string;
    cornerEmojis?: { topLeft?: string; topRight?: string; bottomLeft?: string; bottomRight?: string };

    // Visual elements
    cornerDecorations?: 'none' | 'flourish' | 'geometric' | 'floral' | 'stars' | 'hearts' | 'leaves';
    backgroundPattern?: 'none' | 'dots' | 'stripes' | 'grid' | 'waves' | 'confetti' | 'stars' | 'hearts' | 'geometric';
    backgroundPatternOpacity?: number;

    // Frames and borders
    pageFrame?: 'none' | 'simple' | 'double' | 'ornate' | 'rounded' | 'dashed' | 'dotted' | 'gradient' | 'royal' | 'elegant' | 'art-deco';
    frameColor?: string;
    frameWidth?: number;

    // Decorative lines
    titleUnderline?: 'none' | 'simple' | 'double' | 'wavy' | 'dotted' | 'gradient' | 'ornate';
    sectionDivider?: string; // Custom divider character/emoji pattern e.g., "✦ ✧ ✦" or "~ • ~"
  };

  // Per-Page Variations (for custom template)
  perPageStyling?: {
    enabled: boolean;
    variations?: {
      pageNumber?: number; // 0 = all odd pages, -1 = all even pages, or specific page number
      backgroundColor?: string;
      accentColor?: string;
      imageLayout?: string;
      decorativeElements?: Partial<BookTemplate['decorativeElements']>;
    }[];
  };

  // Header & Footer
  headerFooter?: {
    headerStyle?: 'none' | 'simple' | 'decorated' | 'chapter-title' | 'book-title';
    footerStyle?: 'none' | 'simple' | 'decorated' | 'page-number-only';
    headerText?: string;
    footerText?: string;
    headerBackgroundColor?: string;
    footerBackgroundColor?: string;
    headerHeight?: number;
    footerHeight?: number;
  };

  // Cover
  coverStyle: {
    backgroundColor: string;
    gradientColors?: string[];
    gradientType?: 'linear' | 'radial' | 'diagonal';
    titlePosition: 'top' | 'center' | 'bottom';
    titleAlignment: 'left' | 'center' | 'right';
    titleColor: string;
    authorColor: string;
    overlayPattern?: 'none' | 'dots' | 'lines' | 'grid' | 'noise';
    borderStyle?: 'none' | 'simple' | 'double' | 'ornate';
  };

  // Colors
  textColor: string;
  accentColor: string;
  backgroundColor: string;
  secondaryColor?: string;

  // Page Size
  pageSize?: 'A4' | 'A5' | 'B5' | 'Letter' | '6x9' | '5x8' | 'Square' | 'Pocket' | 'Custom';
  customPageSize?: { width: number; height: number }; // in mm

  // Preview
  previewGradient: string;
  previewLayout?: string; // CSS for layout preview thumbnail
  previewIcon?: string; // Emoji for template preview
}

export const bookTemplates: BookTemplate[] = [
  // ========================================
  // LIFE STORY & PERSONAL TEMPLATES
  // ========================================
  {
    id: 'my-life-story',
    name: 'My Life Story',
    nameHe: 'סיפור חיי',
    description: 'Autobiography template with guided chapters: Childhood, Youth, Army/Service, Family, Career, Wisdom & Reflections',
    descriptionHe: 'תבנית אוטוביוגרפית עם פרקים מודרכים: ילדות, נעורים, צבא/שירות, משפחה, קריירה, חוכמה והרהורים',
    category: 'autobiography',
    fonts: {
      title: 'David Libre',
      body: 'Frank Ruhl Libre',
      headers: 'David Libre',
    },
    headerSizes: { h1: 30, h2: 22, h3: 18 },
    fontSize: 12,
    lineHeight: 1.85,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 40, bottom: 40, left: 35, right: 35 },
    paragraphIndent: 22,
    paragraphSpacing: 0,
    chapterStartStyle: 'new-page-centered',
    dropCapStyle: 'classic',
    dropCapSize: 3,
    headerDecoration: 'ornament',
    dividerStyle: 'ornament',
    pullQuoteStyle: 'bordered',
    imagePositions: ['top', 'center', 'combined'],
    imageFrameStyle: 'vintage',
    imageLayout: 'single',
    creativeImageLayout: {
      pattern: 'corners',
      imageCount: 2,
      customPositions: [
        { x: 10, y: 8, width: 30, height: 25, rotation: -2 },
        { x: 60, y: 68, width: 30, height: 25, rotation: 2 },
      ],
    },
    decorativeElements: {
      headerEmoji: '📖',
      chapterEmoji: '✦',
      dividerEmoji: '~ ✦ ~',
      cornerDecorations: 'flourish',
      backgroundPattern: 'none',
      pageFrame: 'simple',
      frameColor: '#8b6914',
      frameWidth: 1,
      titleUnderline: 'double',
      sectionDivider: '~ ❦ ~',
    },
    headerFooter: {
      headerStyle: 'chapter-title',
      footerStyle: 'page-number-only',
      headerHeight: 28,
      footerHeight: 22,
    },
    coverStyle: {
      backgroundColor: '#3d2914',
      gradientColors: ['#2d1f0f', '#3d2914', '#6b4c2a'],
      gradientType: 'linear',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#f5e6d3',
      authorColor: '#d4c4a8',
      overlayPattern: 'none',
      borderStyle: 'ornate',
    },
    textColor: '#2c2c2c',
    accentColor: '#8b6914',
    backgroundColor: '#faf6ef',
    secondaryColor: '#f0e6d3',
    pageSize: 'A5',
    previewGradient: 'linear-gradient(135deg, #3d2914 0%, #8b6914 50%, #f5e6d3 100%)',
    previewIcon: '📖',
  },
  {
    id: 'in-memory',
    name: 'In Memory',
    nameHe: 'לזכרו/ה',
    description: 'Memorial book template with chapters: Who They Were, What They Loved, Special Moments, Letters & Messages, Photo Gallery, Testimonials',
    descriptionHe: 'תבנית ספר הנצחה עם פרקים: מי היו, מה אהבו, רגעים מיוחדים, מכתבים ומסרים, גלריית תמונות, עדויות',
    category: 'memorial',
    fonts: {
      title: 'Cormorant Garamond',
      body: 'Source Serif Pro',
      headers: 'Cinzel',
    },
    headerSizes: { h1: 28, h2: 22, h3: 18 },
    fontSize: 11,
    lineHeight: 1.9,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 42, bottom: 42, left: 38, right: 38 },
    paragraphIndent: 0,
    paragraphSpacing: 16,
    chapterStartStyle: 'new-page-centered',
    dropCapStyle: 'classic',
    dropCapSize: 3,
    headerDecoration: 'ornament',
    dividerStyle: 'ornament',
    pullQuoteStyle: 'centered',
    imagePositions: ['top', 'center', 'combined'],
    imageFrameStyle: 'border',
    imageLayout: 'single',
    creativeImageLayout: {
      pattern: 'circular',
      imageCount: 1,
      customPositions: [
        { x: 30, y: 15, width: 40, height: 35, rotation: 0 },
      ],
    },
    decorativeElements: {
      headerEmoji: '🕯️',
      chapterEmoji: '✦',
      dividerEmoji: '✦ ✧ ✦',
      cornerDecorations: 'flourish',
      backgroundPattern: 'none',
      pageFrame: 'double',
      frameColor: '#1a365d',
      frameWidth: 2,
      titleUnderline: 'ornate',
      sectionDivider: '✦ ✧ ✦',
    },
    headerFooter: {
      headerStyle: 'book-title',
      footerStyle: 'page-number-only',
      headerBackgroundColor: 'transparent',
      headerHeight: 28,
      footerHeight: 22,
    },
    coverStyle: {
      backgroundColor: '#1a2744',
      gradientColors: ['#0f1b33', '#1a2744', '#2c3e5a'],
      gradientType: 'radial',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#d4af37',
      authorColor: '#c0c8d8',
      overlayPattern: 'none',
      borderStyle: 'ornate',
    },
    textColor: '#1a202c',
    accentColor: '#d4af37',
    backgroundColor: '#fdfcf9',
    secondaryColor: '#f0ebe0',
    pageSize: 'A5',
    previewGradient: 'linear-gradient(135deg, #1a2744 0%, #d4af37 50%, #2c3e5a 100%)',
    previewIcon: '🕯️',
  },
  {
    id: 'grandparents-tell',
    name: 'Grandparents Tell',
    nameHe: 'סבא/סבתא מספרים',
    description: 'Guided questions template: Where did you grow up? What was your first job? How did you meet grandma/grandpa? Best advice? What do you want grandchildren to know?',
    descriptionHe: 'תבנית שאלות מנחות: איפה גדלת? מה היתה העבודה הראשונה שלך? איך הכרת את סבתא/סבא? מה העצה הכי טובה שקיבלת? מה אתה רוצה שהנכדים ידעו?',
    category: 'family-history',
    fonts: {
      title: 'Caveat',
      body: 'Assistant',
      headers: 'Caveat',
    },
    headerSizes: { h1: 36, h2: 28, h3: 22 },
    fontSize: 12,
    lineHeight: 1.85,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 38, bottom: 38, left: 35, right: 35 },
    paragraphIndent: 0,
    paragraphSpacing: 14,
    chapterStartStyle: 'new-page',
    dropCapStyle: 'classic',
    dropCapSize: 2,
    headerDecoration: 'line',
    dividerStyle: 'dots',
    pullQuoteStyle: 'background',
    imagePositions: ['top', 'center', 'combined', 'side'],
    imageFrameStyle: 'polaroid',
    imageLayout: 'scattered',
    creativeImageLayout: {
      pattern: 'collage',
      imageCount: 3,
      customPositions: [
        { x: 5, y: 8, width: 28, height: 22, rotation: -4 },
        { x: 68, y: 12, width: 26, height: 20, rotation: 3 },
        { x: 35, y: 72, width: 30, height: 24, rotation: -2 },
      ],
    },
    decorativeElements: {
      headerEmoji: '👴',
      chapterEmoji: '💛',
      dividerEmoji: '~ 💛 ~',
      cornerDecorations: 'floral',
      backgroundPattern: 'dots',
      backgroundPatternOpacity: 0.02,
      pageFrame: 'rounded',
      frameColor: '#a0845c',
      frameWidth: 1,
      titleUnderline: 'wavy',
      sectionDivider: '~ ✿ ~',
    },
    headerFooter: {
      headerStyle: 'chapter-title',
      footerStyle: 'page-number-only',
      headerHeight: 26,
      footerHeight: 20,
    },
    coverStyle: {
      backgroundColor: '#5c4033',
      gradientColors: ['#3d2914', '#5c4033', '#8b7355'],
      gradientType: 'linear',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#faf0e0',
      authorColor: '#ddd0b8',
      overlayPattern: 'noise',
      borderStyle: 'simple',
    },
    textColor: '#3d2914',
    accentColor: '#a0845c',
    backgroundColor: '#fdf8f0',
    secondaryColor: '#f5ead8',
    pageSize: 'A5',
    previewGradient: 'linear-gradient(135deg, #5c4033 0%, #a0845c 50%, #faf0e0 100%)',
    previewIcon: '👴',
  },
  {
    id: 'gift-book',
    name: 'Gift Book',
    nameHe: 'ספר מתנה',
    description: 'Personal gift book with chapters: Why You\'re Special, Our Best Memories, Things I Love About You, Wishes for the Future',
    descriptionHe: 'ספר מתנה אישי עם פרקים: למה את/ה מיוחד/ת, הזיכרונות הכי טובים שלנו, דברים שאני אוהב/ת בך, משאלות לעתיד',
    category: 'gift',
    fonts: {
      title: 'Playfair Display',
      body: 'Nunito',
      headers: 'Playfair Display',
    },
    headerSizes: { h1: 32, h2: 24, h3: 20 },
    fontSize: 12,
    lineHeight: 1.8,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 35, bottom: 35, left: 32, right: 32 },
    paragraphIndent: 0,
    paragraphSpacing: 14,
    chapterStartStyle: 'new-page-centered',
    dropCapStyle: 'decorative',
    dropCapSize: 3,
    headerDecoration: 'ornament',
    dividerStyle: 'ornament',
    pullQuoteStyle: 'centered',
    imagePositions: ['top', 'center', 'combined'],
    imageFrameStyle: 'rounded',
    imageLayout: 'single',
    creativeImageLayout: {
      pattern: 'corners',
      imageCount: 2,
      customPositions: [
        { x: 8, y: 6, width: 28, height: 24, rotation: -3 },
        { x: 64, y: 70, width: 28, height: 24, rotation: 3 },
      ],
    },
    decorativeElements: {
      headerEmoji: '🎁',
      chapterEmoji: '✨',
      dividerEmoji: '✨ ♥ ✨',
      cornerDecorations: 'floral',
      backgroundPattern: 'hearts',
      backgroundPatternOpacity: 0.03,
      pageFrame: 'ornate',
      frameColor: '#8b1a3a',
      frameWidth: 2,
      titleUnderline: 'ornate',
      sectionDivider: '✨ ♥ ✨',
    },
    headerFooter: {
      headerStyle: 'decorated',
      footerStyle: 'page-number-only',
      headerBackgroundColor: 'transparent',
      headerHeight: 28,
      footerHeight: 22,
    },
    coverStyle: {
      backgroundColor: '#6b1530',
      gradientColors: ['#4a0e22', '#6b1530', '#8b1a3a'],
      gradientType: 'radial',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#d4af37',
      authorColor: '#f0d0a0',
      overlayPattern: 'none',
      borderStyle: 'ornate',
    },
    textColor: '#2c1a1a',
    accentColor: '#8b1a3a',
    backgroundColor: '#fef9f5',
    secondaryColor: '#fce8e8',
    pageSize: 'A5',
    previewGradient: 'linear-gradient(135deg, #6b1530 0%, #d4af37 50%, #8b1a3a 100%)',
    previewIcon: '🎁',
  },
  {
    id: 'travel-journal-personal',
    name: 'Travel Journal',
    nameHe: 'יומן מסע',
    description: 'Travel documentation with chapters: The Departure, Day by Day, People We Met, Food & Flavors, Most Memorable Moments, Coming Home',
    descriptionHe: 'תיעוד מסע עם פרקים: היציאה לדרך, יום אחר יום, אנשים שפגשנו, אוכל וטעמים, הרגעים הכי זכורים, חזרה הביתה',
    category: 'travel',
    fonts: {
      title: 'Montserrat',
      body: 'Lato',
      headers: 'Montserrat',
    },
    headerSizes: { h1: 34, h2: 26, h3: 20 },
    fontSize: 11,
    lineHeight: 1.7,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-outside',
    margins: { top: 30, bottom: 30, left: 30, right: 30 },
    paragraphIndent: 0,
    paragraphSpacing: 14,
    chapterStartStyle: 'new-page',
    headerDecoration: 'gradient-line',
    dividerStyle: 'wave',
    pullQuoteStyle: 'background',
    imagePositions: ['top', 'center', 'bottom', 'combined', 'side'],
    imageFrameStyle: 'rounded',
    imageLayout: 'grid-2',
    creativeImageLayout: {
      pattern: 'staggered',
      imageCount: 3,
      customPositions: [
        { x: 5, y: 5, width: 42, height: 28, rotation: -2 },
        { x: 53, y: 35, width: 42, height: 28, rotation: 2 },
        { x: 20, y: 70, width: 60, height: 25, rotation: 0 },
      ],
    },
    decorativeElements: {
      headerEmoji: '✈️',
      chapterEmoji: '🌍',
      dividerEmoji: '~ ✈️ ~',
      cornerDecorations: 'none',
      backgroundPattern: 'none',
      pageFrame: 'simple',
      frameColor: '#0d7377',
      frameWidth: 1,
      titleUnderline: 'gradient',
      sectionDivider: '✦ 🌍 ✦',
    },
    headerFooter: {
      headerStyle: 'chapter-title',
      footerStyle: 'page-number-only',
      headerBackgroundColor: 'transparent',
      headerHeight: 26,
      footerHeight: 20,
    },
    coverStyle: {
      backgroundColor: '#0d7377',
      gradientColors: ['#065a5e', '#0d7377', '#14919b'],
      gradientType: 'diagonal',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#ffffff',
      authorColor: '#ffd166',
      overlayPattern: 'dots',
      borderStyle: 'simple',
    },
    textColor: '#1a2e35',
    accentColor: '#e8651a',
    backgroundColor: '#fafcfc',
    secondaryColor: '#e0f5f5',
    pageSize: 'A5',
    previewGradient: 'linear-gradient(135deg, #0d7377 0%, #e8651a 50%, #ffd166 100%)',
    previewIcon: '✈️',
  },
  // ========================================
  // NEW AUDIENCE-FOCUSED TEMPLATES
  // ========================================
  {
    id: 'family-recipes',
    name: 'Family Recipe Book',
    nameHe: 'ספר מתכונים משפחתי',
    description: 'Preserve family recipes and food memories with chapters: Grandma\'s Recipes, Holiday Meals, Shabbat Food, Old-Time Sweets, The Secret Recipe',
    descriptionHe: 'שימור מתכונים וזיכרונות אוכל משפחתיים עם פרקים: מתכוני סבתא, ארוחות חג, אוכל של שבת, מתוקים של פעם, המתכון הסודי',
    category: 'family-history',
    fonts: {
      title: 'Caveat',
      body: 'Heebo',
      headers: 'Caveat',
    },
    headerSizes: { h1: 38, h2: 28, h3: 22 },
    fontSize: 12,
    lineHeight: 1.75,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 32, bottom: 32, left: 30, right: 30 },
    paragraphIndent: 0,
    paragraphSpacing: 14,
    chapterStartStyle: 'new-page',
    dropCapStyle: 'classic',
    dropCapSize: 2,
    headerDecoration: 'line',
    dividerStyle: 'dots',
    pullQuoteStyle: 'background',
    imagePositions: ['top', 'center', 'combined', 'side'],
    imageFrameStyle: 'rounded',
    imageLayout: 'grid-2',
    creativeImageLayout: {
      pattern: 'side-by-side',
      imageCount: 2,
      customPositions: [
        { x: 5, y: 8, width: 42, height: 30, rotation: -2 },
        { x: 53, y: 8, width: 42, height: 30, rotation: 2 },
      ],
    },
    decorativeElements: {
      headerEmoji: '🍽️',
      chapterEmoji: '🥘',
      dividerEmoji: '~ 🍽️ ~',
      cornerDecorations: 'none',
      backgroundPattern: 'none',
      pageFrame: 'simple',
      frameColor: '#8b5e3c',
      frameWidth: 1,
      titleUnderline: 'wavy',
      sectionDivider: '~ 🍽️ ~',
    },
    headerFooter: {
      headerStyle: 'chapter-title',
      footerStyle: 'page-number-only',
      headerHeight: 28,
      footerHeight: 22,
    },
    coverStyle: {
      backgroundColor: '#8b5e3c',
      gradientColors: ['#6b4226', '#8b5e3c', '#a87c5a'],
      gradientType: 'linear',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#fff8f0',
      authorColor: '#f5e6d3',
      overlayPattern: 'noise',
      borderStyle: 'simple',
    },
    textColor: '#3d2914',
    accentColor: '#8b5e3c',
    backgroundColor: '#fff8f0',
    secondaryColor: '#f5ead8',
    previewGradient: 'linear-gradient(135deg, #8b5e3c 0%, #fff8f0 50%, #a87c5a 100%)',
    previewIcon: '🍽️',
  },
  {
    id: 'love-story',
    name: 'Love Story',
    nameHe: 'סיפור אהבה',
    description: 'Document your love story with chapters: How We Met, The Moment I Knew, The Proposal, Building a Home, What We Learned Together',
    descriptionHe: 'תיעוד סיפור האהבה שלכם עם פרקים: איך נפגשנו, הרגע שידעתי, הצעת נישואין, בניית בית, מה שלמדנו יחד',
    category: 'gift',
    fonts: {
      title: 'Playfair Display',
      body: 'Cormorant Garamond',
      headers: 'Playfair Display',
    },
    headerSizes: { h1: 32, h2: 24, h3: 20 },
    fontSize: 12,
    lineHeight: 1.85,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 38, bottom: 38, left: 35, right: 35 },
    paragraphIndent: 20,
    paragraphSpacing: 0,
    chapterStartStyle: 'new-page-centered',
    dropCapStyle: 'decorative',
    dropCapSize: 3,
    headerDecoration: 'ornament',
    dividerStyle: 'ornament',
    pullQuoteStyle: 'centered',
    imagePositions: ['top', 'center', 'combined'],
    imageFrameStyle: 'vintage',
    imageLayout: 'single',
    creativeImageLayout: {
      pattern: 'corners',
      imageCount: 2,
      customPositions: [
        { x: 25, y: 8, width: 50, height: 30, rotation: 0 },
        { x: 60, y: 65, width: 35, height: 28, rotation: 2 },
      ],
    },
    decorativeElements: {
      headerEmoji: '💕',
      chapterEmoji: '♥',
      dividerEmoji: '❧ ♡ ❧',
      cornerDecorations: 'flourish',
      backgroundPattern: 'hearts',
      backgroundPatternOpacity: 0.02,
      pageFrame: 'ornate',
      frameColor: '#8b3a4a',
      frameWidth: 2,
      titleUnderline: 'wavy',
      sectionDivider: '~ ♥ ~',
    },
    headerFooter: {
      headerStyle: 'decorated',
      footerStyle: 'page-number-only',
      headerBackgroundColor: 'transparent',
      headerHeight: 28,
      footerHeight: 22,
    },
    coverStyle: {
      backgroundColor: '#8b3a4a',
      gradientColors: ['#6b2035', '#8b3a4a', '#a85060'],
      gradientType: 'radial',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#f5e6e0',
      authorColor: '#f0c8c0',
      overlayPattern: 'none',
      borderStyle: 'ornate',
    },
    textColor: '#3d1a24',
    accentColor: '#8b3a4a',
    backgroundColor: '#f5e6e0',
    secondaryColor: '#fce8e8',
    previewGradient: 'linear-gradient(135deg, #8b3a4a 0%, #f5e6e0 50%, #a85060 100%)',
    previewIcon: '💕',
  },
  {
    id: 'military-memorial',
    name: 'Our Hero — Military Memorial',
    nameHe: 'הגיבור שלנו',
    description: 'Military memorial book with chapters: Childhood & Youth, Military Service, Friends Tell, Letters, What They Left Us',
    descriptionHe: 'ספר הנצחה צבאי עם פרקים: ילדות ונעורים, שירות צבאי, החברים מספרים, מכתבים, מה שהשאיר לנו',
    category: 'memorial',
    fonts: {
      title: 'Cinzel',
      body: 'Merriweather',
      headers: 'Cinzel',
    },
    headerSizes: { h1: 28, h2: 22, h3: 18 },
    fontSize: 11,
    lineHeight: 1.9,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 42, bottom: 42, left: 38, right: 38 },
    paragraphIndent: 0,
    paragraphSpacing: 16,
    chapterStartStyle: 'new-page-centered',
    dropCapStyle: 'classic',
    dropCapSize: 3,
    headerDecoration: 'line',
    dividerStyle: 'stars',
    pullQuoteStyle: 'bordered',
    imagePositions: ['top', 'center', 'combined'],
    imageFrameStyle: 'border',
    imageLayout: 'single',
    creativeImageLayout: {
      pattern: 'circular',
      imageCount: 1,
      customPositions: [
        { x: 30, y: 12, width: 40, height: 35, rotation: 0 },
      ],
    },
    decorativeElements: {
      headerEmoji: '✡',
      chapterEmoji: '★',
      dividerEmoji: '★ ✡ ★',
      cornerDecorations: 'none',
      backgroundPattern: 'none',
      pageFrame: 'double',
      frameColor: '#3d4a2c',
      frameWidth: 2,
      titleUnderline: 'double',
      sectionDivider: '★ ✡ ★',
    },
    headerFooter: {
      headerStyle: 'book-title',
      footerStyle: 'page-number-only',
      headerBackgroundColor: 'transparent',
      headerHeight: 28,
      footerHeight: 22,
    },
    coverStyle: {
      backgroundColor: '#3d4a2c',
      gradientColors: ['#2a3320', '#3d4a2c', '#4e5c3a'],
      gradientType: 'linear',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#c9a84c',
      authorColor: '#d8d0b8',
      overlayPattern: 'none',
      borderStyle: 'double',
    },
    textColor: '#1a202c',
    accentColor: '#c9a84c',
    backgroundColor: '#fdfcf7',
    secondaryColor: '#f0ebe0',
    previewGradient: 'linear-gradient(135deg, #3d4a2c 0%, #c9a84c 50%, #4e5c3a 100%)',
    previewIcon: '🎖️',
  },
  {
    id: 'time-journey',
    name: 'Journey Through Time',
    nameHe: 'מסע בזמן',
    description: 'Decade-by-decade life documentation: The 40s/50s, The 60s, The 70s, The 80s, The 90s, The Millennium',
    descriptionHe: 'תיעוד חיים לפי עשורים: שנות ה-40/50, שנות ה-60, שנות ה-70, שנות ה-80, שנות ה-90, המילניום',
    category: 'autobiography',
    fonts: {
      title: 'Libre Baskerville',
      body: 'Libre Baskerville',
      headers: 'Libre Baskerville',
    },
    headerSizes: { h1: 28, h2: 22, h3: 18 },
    fontSize: 11,
    lineHeight: 1.85,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 40, bottom: 40, left: 35, right: 35 },
    paragraphIndent: 24,
    paragraphSpacing: 0,
    chapterStartStyle: 'new-page',
    dropCapStyle: 'classic',
    dropCapSize: 3,
    headerDecoration: 'line',
    dividerStyle: 'ornament',
    pullQuoteStyle: 'bordered',
    imagePositions: ['top', 'center', 'combined'],
    imageFrameStyle: 'vintage',
    imageLayout: 'single',
    creativeImageLayout: {
      pattern: 'corners',
      imageCount: 2,
      customPositions: [
        { x: 10, y: 10, width: 30, height: 25, rotation: -5 },
        { x: 60, y: 65, width: 30, height: 25, rotation: 5 },
      ],
    },
    decorativeElements: {
      headerEmoji: '⏳',
      chapterEmoji: '❦',
      dividerEmoji: '~ ❦ ~',
      cornerDecorations: 'flourish',
      backgroundPattern: 'none',
      pageFrame: 'double',
      frameColor: '#6b5344',
      frameWidth: 1,
      titleUnderline: 'double',
      sectionDivider: '~ ❦ ~',
    },
    headerFooter: {
      headerStyle: 'chapter-title',
      footerStyle: 'page-number-only',
      headerHeight: 28,
      footerHeight: 22,
    },
    coverStyle: {
      backgroundColor: '#6b5344',
      gradientColors: ['#4a3828', '#6b5344', '#8b7360'],
      gradientType: 'linear',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#e8dcc8',
      authorColor: '#d4c4a8',
      overlayPattern: 'noise',
      borderStyle: 'double',
    },
    textColor: '#6b5344',
    accentColor: '#b8860b',
    backgroundColor: '#e8dcc8',
    secondaryColor: '#f5efe0',
    previewGradient: 'linear-gradient(135deg, #6b5344 0%, #b8860b 50%, #e8dcc8 100%)',
    previewIcon: '⏳',
  },
  {
    id: 'my-child',
    name: 'My Child',
    nameHe: 'ילד/ה שלי',
    description: 'Parent to child book with chapters: When We Knew You Were Coming, The Day You Were Born, First Year, First Steps, First Words, My Wishes for You',
    descriptionHe: 'ספר מהורה לילד עם פרקים: כשידענו שאת/ה בדרך, היום שנולדת, השנה הראשונה, הצעד הראשון, המילה הראשונה, מה שאני מאחל/ת לך',
    category: 'gift',
    fonts: {
      title: 'Nunito',
      body: 'Heebo',
      headers: 'Nunito',
    },
    headerSizes: { h1: 34, h2: 26, h3: 20 },
    fontSize: 12,
    lineHeight: 1.8,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 35, bottom: 35, left: 32, right: 32 },
    paragraphIndent: 0,
    paragraphSpacing: 14,
    chapterStartStyle: 'new-page-centered',
    dropCapStyle: 'modern',
    dropCapSize: 2,
    headerDecoration: 'dots',
    dividerStyle: 'dots',
    pullQuoteStyle: 'background',
    imagePositions: ['top', 'center', 'combined'],
    imageFrameStyle: 'rounded',
    imageLayout: 'single',
    creativeImageLayout: {
      pattern: 'pyramid',
      imageCount: 3,
      customPositions: [
        { x: 30, y: 5, width: 40, height: 28, rotation: 0 },
        { x: 5, y: 68, width: 28, height: 25, rotation: -3 },
        { x: 67, y: 68, width: 28, height: 25, rotation: 3 },
      ],
    },
    decorativeElements: {
      headerEmoji: '👶',
      chapterEmoji: '🌟',
      dividerEmoji: '✨ 🌟 ✨',
      cornerDecorations: 'stars',
      backgroundPattern: 'dots',
      backgroundPatternOpacity: 0.02,
      pageFrame: 'rounded',
      frameColor: '#b8a0c8',
      frameWidth: 1,
      titleUnderline: 'wavy',
      sectionDivider: '~ 🌟 ~',
    },
    headerFooter: {
      headerStyle: 'chapter-title',
      footerStyle: 'page-number-only',
      headerHeight: 26,
      footerHeight: 20,
    },
    coverStyle: {
      backgroundColor: '#b8a0c8',
      gradientColors: ['#9880b0', '#b8a0c8', '#c8b8d8'],
      gradientType: 'radial',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#ffffff',
      authorColor: '#f0e6f6',
      overlayPattern: 'none',
      borderStyle: 'simple',
    },
    textColor: '#2d3748',
    accentColor: '#9880b0',
    backgroundColor: '#f0e6f6',
    secondaryColor: '#e8f0e8',
    previewGradient: 'linear-gradient(135deg, #b8a0c8 0%, #f0e6f6 50%, #e8f0e8 100%)',
    previewIcon: '👶',
  },
  {
    id: 'family-roots',
    name: 'Roots — Family Heritage',
    nameHe: 'שורשים',
    description: 'Family heritage book with chapters: Where We Came From, The Immigration, Settling Down, Family Traditions, The Family Tree, What Passes Down',
    descriptionHe: 'ספר מורשת משפחתית עם פרקים: מאיפה באנו, ההגירה, ההתבססות, מסורות משפחתיות, העץ המשפחתי, מה שעובר בירושה',
    category: 'family-history',
    fonts: {
      title: 'Crimson Text',
      body: 'David Libre',
      headers: 'Crimson Text',
    },
    headerSizes: { h1: 28, h2: 22, h3: 18 },
    fontSize: 11,
    lineHeight: 1.85,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 40, bottom: 40, left: 35, right: 35 },
    paragraphIndent: 22,
    paragraphSpacing: 0,
    chapterStartStyle: 'new-page',
    dropCapStyle: 'classic',
    dropCapSize: 3,
    headerDecoration: 'ornament',
    dividerStyle: 'ornament',
    pullQuoteStyle: 'bordered',
    imagePositions: ['top', 'center', 'combined', 'side'],
    imageFrameStyle: 'vintage',
    imageLayout: 'scattered',
    creativeImageLayout: {
      pattern: 'collage',
      imageCount: 3,
      customPositions: [
        { x: 5, y: 5, width: 30, height: 25, rotation: -3 },
        { x: 65, y: 15, width: 28, height: 22, rotation: 4 },
        { x: 35, y: 70, width: 32, height: 26, rotation: -2 },
      ],
    },
    decorativeElements: {
      headerEmoji: '🌳',
      chapterEmoji: '❧',
      dividerEmoji: '~ ❧ ~',
      cornerDecorations: 'leaves',
      backgroundPattern: 'none',
      pageFrame: 'double',
      frameColor: '#5c3d2e',
      frameWidth: 1,
      titleUnderline: 'ornate',
      sectionDivider: '🌿 ❧ 🌿',
    },
    headerFooter: {
      headerStyle: 'book-title',
      footerStyle: 'page-number-only',
      headerBackgroundColor: 'transparent',
      headerHeight: 28,
      footerHeight: 22,
    },
    coverStyle: {
      backgroundColor: '#5c3d2e',
      gradientColors: ['#3d2818', '#5c3d2e', '#7a5a48'],
      gradientType: 'linear',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#f5efe0',
      authorColor: '#d4c4a8',
      overlayPattern: 'noise',
      borderStyle: 'ornate',
    },
    textColor: '#3d2914',
    accentColor: '#5c3d2e',
    backgroundColor: '#f5efe0',
    secondaryColor: '#ebe0d0',
    previewGradient: 'linear-gradient(135deg, #5c3d2e 0%, #f5efe0 50%, #7a5a48 100%)',
    previewIcon: '🌳',
  },
  {
    id: 'community-journal',
    name: 'Community Journal',
    nameHe: 'יומן קהילתי',
    description: 'Community documentation with chapters: Our History, The Founders, Defining Moments, People Who Made a Difference, What Connects Us',
    descriptionHe: 'תיעוד קהילתי עם פרקים: ההיסטוריה שלנו, המקימים, רגעים מכוננים, אנשים שעשו שינוי, מה שמחבר אותנו',
    category: 'creative',
    fonts: {
      title: 'Montserrat',
      body: 'Open Sans',
      headers: 'Montserrat',
    },
    headerSizes: { h1: 32, h2: 24, h3: 18 },
    fontSize: 11,
    lineHeight: 1.75,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-outside',
    margins: { top: 35, bottom: 35, left: 32, right: 32 },
    paragraphIndent: 0,
    paragraphSpacing: 14,
    chapterStartStyle: 'new-page',
    headerDecoration: 'gradient-line',
    dividerStyle: 'line',
    pullQuoteStyle: 'side-accent',
    imagePositions: ['top', 'center', 'combined', 'side'],
    imageFrameStyle: 'shadow',
    imageLayout: 'grid-2',
    creativeImageLayout: {
      pattern: 'side-by-side',
      imageCount: 2,
      customPositions: [
        { x: 5, y: 5, width: 42, height: 28, rotation: 0 },
        { x: 53, y: 5, width: 42, height: 28, rotation: 0 },
      ],
    },
    decorativeElements: {
      headerEmoji: '🏘️',
      chapterEmoji: '✦',
      dividerEmoji: '✦ • ✦',
      cornerDecorations: 'none',
      backgroundPattern: 'none',
      pageFrame: 'simple',
      frameColor: '#556b2f',
      frameWidth: 1,
      titleUnderline: 'gradient',
      sectionDivider: '✦ • ✦',
    },
    headerFooter: {
      headerStyle: 'chapter-title',
      footerStyle: 'page-number-only',
      headerHeight: 28,
      footerHeight: 22,
    },
    coverStyle: {
      backgroundColor: '#556b2f',
      gradientColors: ['#3d4e1e', '#556b2f', '#6b8540'],
      gradientType: 'linear',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#f5f2e8',
      authorColor: '#d4d0c0',
      overlayPattern: 'none',
      borderStyle: 'simple',
    },
    textColor: '#1a2e1a',
    accentColor: '#556b2f',
    backgroundColor: '#f5f2e8',
    secondaryColor: '#e8e5d8',
    previewGradient: 'linear-gradient(135deg, #556b2f 0%, #f5f2e8 50%, #6b8540 100%)',
    previewIcon: '🏘️',
  },
  {
    id: 'new-chapter',
    name: 'New Chapter — Life Transitions',
    nameHe: 'פרק חדש',
    description: 'Document life transitions with chapters: End of an Era, What I Learned, Who Helped Me Along the Way, The New Beginning, Plans for the Future',
    descriptionHe: 'תיעוד מעברי חיים עם פרקים: סוף תקופה, מה למדתי, מי עזר לי בדרך, ההתחלה החדשה, תוכניות לעתיד',
    category: 'autobiography',
    fonts: {
      title: 'Montserrat',
      body: 'Inter',
      headers: 'Montserrat',
    },
    headerSizes: { h1: 32, h2: 24, h3: 20 },
    fontSize: 12,
    lineHeight: 1.75,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 35, bottom: 35, left: 32, right: 32 },
    paragraphIndent: 0,
    paragraphSpacing: 16,
    chapterStartStyle: 'new-page-centered',
    dropCapStyle: 'modern',
    dropCapSize: 2,
    headerDecoration: 'gradient-line',
    dividerStyle: 'wave',
    pullQuoteStyle: 'background',
    imagePositions: ['top', 'center', 'combined'],
    imageFrameStyle: 'rounded',
    imageLayout: 'single',
    creativeImageLayout: {
      pattern: 'staggered',
      imageCount: 2,
      customPositions: [
        { x: 10, y: 10, width: 35, height: 28, rotation: -2 },
        { x: 55, y: 65, width: 35, height: 28, rotation: 2 },
      ],
    },
    decorativeElements: {
      headerEmoji: '🌅',
      chapterEmoji: '✦',
      dividerEmoji: '~ ✦ ~',
      cornerDecorations: 'none',
      backgroundPattern: 'none',
      pageFrame: 'simple',
      frameColor: '#e8927c',
      frameWidth: 1,
      titleUnderline: 'gradient',
      sectionDivider: '✦ ~ ✦',
    },
    headerFooter: {
      headerStyle: 'chapter-title',
      footerStyle: 'page-number-only',
      headerHeight: 28,
      footerHeight: 22,
    },
    coverStyle: {
      backgroundColor: '#e8927c',
      gradientColors: ['#c87060', '#e8927c', '#fef3e2'],
      gradientType: 'diagonal',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#ffffff',
      authorColor: '#fef3e2',
      overlayPattern: 'none',
      borderStyle: 'simple',
    },
    textColor: '#2d3748',
    accentColor: '#e8927c',
    backgroundColor: '#fef3e2',
    secondaryColor: '#fce8d8',
    previewGradient: 'linear-gradient(135deg, #e8927c 0%, #fef3e2 50%, #c87060 100%)',
    previewIcon: '🌅',
  },
  {
    id: 'army-memories',
    name: 'Army Memories',
    nameHe: 'זיכרונות מהצבא',
    description: 'Army memories book with chapters: Enlistment Day, Basic Training, Best Friends, Field Stories, Discharge Day',
    descriptionHe: 'ספר זיכרונות מהצבא עם פרקים: יום הגיוס, הטירונות, החברה הכי טובה, סיפורים מהשטח, יום השחרור',
    category: 'autobiography',
    fonts: {
      title: 'Oswald',
      body: 'Lato',
      headers: 'Oswald',
    },
    headerSizes: { h1: 32, h2: 24, h3: 18 },
    fontSize: 11,
    lineHeight: 1.75,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 35, bottom: 35, left: 32, right: 32 },
    paragraphIndent: 0,
    paragraphSpacing: 14,
    chapterStartStyle: 'new-page',
    headerDecoration: 'line',
    dividerStyle: 'line',
    pullQuoteStyle: 'side-accent',
    imagePositions: ['top', 'center', 'combined'],
    imageFrameStyle: 'border',
    imageLayout: 'grid-2',
    creativeImageLayout: {
      pattern: 'side-by-side',
      imageCount: 2,
      customPositions: [
        { x: 5, y: 8, width: 42, height: 30, rotation: 0 },
        { x: 53, y: 8, width: 42, height: 30, rotation: 0 },
      ],
    },
    decorativeElements: {
      headerEmoji: '🎖️',
      chapterEmoji: '★',
      dividerEmoji: '★ • ★',
      cornerDecorations: 'none',
      backgroundPattern: 'none',
      pageFrame: 'simple',
      frameColor: '#4a5536',
      frameWidth: 1,
      titleUnderline: 'simple',
      sectionDivider: '★ • ★',
    },
    headerFooter: {
      headerStyle: 'chapter-title',
      footerStyle: 'page-number-only',
      headerHeight: 28,
      footerHeight: 22,
    },
    coverStyle: {
      backgroundColor: '#4a5536',
      gradientColors: ['#333d24', '#4a5536', '#5c6b44'],
      gradientType: 'linear',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#c2b280',
      authorColor: '#d8d0b8',
      overlayPattern: 'none',
      borderStyle: 'simple',
    },
    textColor: '#1a2e1a',
    accentColor: '#c2b280',
    backgroundColor: '#f5f2e8',
    secondaryColor: '#e8e5d8',
    previewGradient: 'linear-gradient(135deg, #4a5536 0%, #c2b280 50%, #5c6b44 100%)',
    previewIcon: '🎖️',
  },
  {
    id: 'grandchildren-tell',
    name: 'Grandchildren Tell',
    nameHe: 'הנכדים מספרים',
    description: 'A book by grandchildren with chapters: Why Grandpa/Grandma Are Special, The Funniest Story, What I Learned From Them, The Visits, Letter to Grandpa/Grandma',
    descriptionHe: 'ספר מהנכדים עם פרקים: למה סבא/סבתא מיוחדים, הסיפור הכי מצחיק, מה למדתי מהם, הביקורים, מכתב לסבא/סבתא',
    category: 'family-history',
    fonts: {
      title: 'Fredoka One',
      body: 'Nunito',
      headers: 'Fredoka One',
    },
    headerSizes: { h1: 34, h2: 26, h3: 20 },
    fontSize: 12,
    lineHeight: 1.8,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 32, bottom: 32, left: 30, right: 30 },
    paragraphIndent: 0,
    paragraphSpacing: 14,
    chapterStartStyle: 'new-page',
    dropCapStyle: 'modern',
    dropCapSize: 2,
    headerDecoration: 'dots',
    dividerStyle: 'dots',
    pullQuoteStyle: 'background',
    imagePositions: ['top', 'center', 'combined'],
    imageFrameStyle: 'polaroid',
    imageLayout: 'scattered',
    creativeImageLayout: {
      pattern: 'collage',
      imageCount: 3,
      customPositions: [
        { x: 5, y: 5, width: 30, height: 25, rotation: -3 },
        { x: 65, y: 10, width: 28, height: 22, rotation: 4 },
        { x: 35, y: 70, width: 32, height: 26, rotation: -2 },
      ],
    },
    decorativeElements: {
      headerEmoji: '🌻',
      chapterEmoji: '💛',
      dividerEmoji: '✨ 💛 ✨',
      footerEmoji: '🌈',
      cornerDecorations: 'stars',
      backgroundPattern: 'confetti',
      backgroundPatternOpacity: 0.03,
      pageFrame: 'rounded',
      frameColor: '#e8913a',
      frameWidth: 2,
      titleUnderline: 'wavy',
      sectionDivider: '~ 🌻 ~',
    },
    headerFooter: {
      headerStyle: 'chapter-title',
      footerStyle: 'page-number-only',
      headerHeight: 26,
      footerHeight: 20,
    },
    coverStyle: {
      backgroundColor: '#e8913a',
      gradientColors: ['#c87828', '#e8913a', '#f0a850'],
      gradientType: 'radial',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#fff8e7',
      authorColor: '#ffecc0',
      overlayPattern: 'none',
      borderStyle: 'simple',
    },
    textColor: '#3d2914',
    accentColor: '#e8913a',
    backgroundColor: '#fff8e7',
    secondaryColor: '#ffecc0',
    previewGradient: 'linear-gradient(135deg, #e8913a 0%, #fff8e7 50%, #f0a850 100%)',
    previewIcon: '🌻',
  },
  // ========================================
  // PREMIUM TEMPLATES
  // ========================================
  {
    id: 'community-newsletter',
    name: 'Community Newsletter',
    nameHe: 'גליון קהילתי',
    description: 'Multi-column newsletter/journal style with sections, banners, and news items',
    descriptionHe: 'עלון קהילתי רב-עמודות עם מדורים, כותרות ובאנרים - בדיוק כמו גליון שבועי',
    category: 'classic',
    fonts: {
      title: 'Frank Ruhl Libre',
      body: 'Assistant',
      headers: 'Frank Ruhl Libre',
    },
    headerSizes: { h1: 28, h2: 20, h3: 16 },
    fontSize: 11,
    lineHeight: 1.75,
    columns: 2,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-outside',
    margins: { top: 32, bottom: 32, left: 28, right: 28 },
    paragraphIndent: 0,
    paragraphSpacing: 10,
    chapterStartStyle: 'same-page',
    dropCapStyle: 'classic',
    dropCapSize: 2,
    headerDecoration: 'gradient-line',
    dividerStyle: 'ornament',
    pullQuoteStyle: 'background',
    imagePositions: ['top', 'side', 'combined'],
    imageFrameStyle: 'border',
    imageLayout: 'grid-2',
    creativeImageLayout: {
      pattern: 'staggered',
      imageCount: 3,
      customPositions: [
        { x: 0, y: 5, width: 45, height: 30, rotation: 0 },
        { x: 55, y: 5, width: 45, height: 30, rotation: 0 },
        { x: 20, y: 65, width: 60, height: 30, rotation: 0 },
      ],
    },
    decorativeElements: {
      headerEmoji: '📰',
      chapterEmoji: '✦',
      dividerEmoji: '✦ ✧ ✦',
      cornerDecorations: 'geometric',
      backgroundPattern: 'none',
      pageFrame: 'simple',
      frameColor: '#1a365d',
      frameWidth: 1,
      titleUnderline: 'gradient',
      sectionDivider: '⸻ ✦ ⸻',
    },
    headerFooter: {
      headerStyle: 'book-title',
      footerStyle: 'page-number-only',
      headerBackgroundColor: 'transparent',
      headerHeight: 30,
      footerHeight: 22,
    },
    coverStyle: {
      backgroundColor: '#1a365d',
      gradientColors: ['#0f2340', '#1a365d', '#2c5282'],
      gradientType: 'linear',
      titlePosition: 'top',
      titleAlignment: 'center',
      titleColor: '#f7d060',
      authorColor: '#bee3f8',
      overlayPattern: 'none',
      borderStyle: 'double',
    },
    textColor: '#1a202c',
    accentColor: '#1a365d',
    backgroundColor: '#ffffff',
    secondaryColor: '#ebf8ff',
    previewGradient: 'linear-gradient(135deg, #1a365d 0%, #f7d060 50%, #2c5282 100%)',
    previewIcon: '📰',
  },
  {
    id: 'luxury-memorial',
    name: 'Royal Memorial',
    nameHe: 'ספר זיכרון מלכותי',
    description: 'Premium memorial book with gold accents, ornate borders, and elegant typography for honoring a loved one',
    descriptionHe: 'ספר הנצחה פרימיום עם עיטורי זהב, מסגרות מפוארות וטיפוגרפיה אלגנטית',
    category: 'memorial',
    fonts: {
      title: 'Cormorant Garamond',
      body: 'Frank Ruhl Libre',
      headers: 'Cinzel',
    },
    headerSizes: { h1: 32, h2: 24, h3: 18 },
    fontSize: 12,
    lineHeight: 2.0,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 50, bottom: 50, left: 45, right: 45 },
    paragraphIndent: 0,
    paragraphSpacing: 18,
    chapterStartStyle: 'new-page-centered',
    dropCapStyle: 'decorative',
    dropCapSize: 3,
    headerDecoration: 'ornament',
    dividerStyle: 'ornament',
    pullQuoteStyle: 'centered',
    imagePositions: ['top', 'center', 'combined'],
    imageFrameStyle: 'vintage',
    imageLayout: 'single',
    creativeImageLayout: {
      pattern: 'circular',
      imageCount: 1,
      customPositions: [
        { x: 25, y: 10, width: 50, height: 40, rotation: 0 },
      ],
    },
    decorativeElements: {
      headerEmoji: '🕯️',
      chapterEmoji: '✦',
      dividerEmoji: '✦ ✧ ✦',
      cornerDecorations: 'flourish',
      backgroundPattern: 'none',
      pageFrame: 'ornate',
      frameColor: '#b7950b',
      frameWidth: 2,
      titleUnderline: 'ornate',
      sectionDivider: '⸻ ✦ ⸻',
    },
    headerFooter: {
      headerStyle: 'book-title',
      footerStyle: 'page-number-only',
      headerBackgroundColor: 'transparent',
      headerHeight: 30,
      footerHeight: 24,
    },
    coverStyle: {
      backgroundColor: '#1c1208',
      gradientColors: ['#0d0904', '#1c1208', '#2d1f0f', '#4a3520'],
      gradientType: 'radial',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#d4af37',
      authorColor: '#c9a648',
      overlayPattern: 'none',
      borderStyle: 'ornate',
    },
    textColor: '#1a1a1a',
    accentColor: '#b7950b',
    backgroundColor: '#fdfaf4',
    secondaryColor: '#f7f0e0',
    previewGradient: 'linear-gradient(135deg, #1c1208 0%, #d4af37 50%, #4a3520 100%)',
    previewIcon: '✨',
  },
  {
    id: 'family-photo-album',
    name: 'Family Photo Album',
    nameHe: 'אלבום משפחתי דלוקס',
    description: 'Image-first template with beautiful gallery layouts, captions, and family memories',
    descriptionHe: 'תבנית אלבום תמונות משפחתי עם גלריות יפהפיות, כיתובים ורגעים מיוחדים',
    category: 'family-history',
    fonts: {
      title: 'Caveat',
      body: 'Assistant',
      headers: 'Caveat',
    },
    headerSizes: { h1: 34, h2: 26, h3: 20 },
    fontSize: 11,
    lineHeight: 1.7,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 25, bottom: 25, left: 22, right: 22 },
    paragraphIndent: 0,
    paragraphSpacing: 12,
    chapterStartStyle: 'new-page',
    dropCapStyle: 'classic',
    dropCapSize: 2,
    headerDecoration: 'line',
    dividerStyle: 'dots',
    pullQuoteStyle: 'background',
    imagePositions: ['top', 'center', 'combined', 'full-bleed'],
    imageFrameStyle: 'polaroid',
    imageLayout: 'mosaic',
    creativeImageLayout: {
      pattern: 'collage',
      imageCount: 4,
      customPositions: [
        { x: 2, y: 5, width: 46, height: 35, rotation: -2 },
        { x: 52, y: 5, width: 46, height: 35, rotation: 2 },
        { x: 2, y: 58, width: 46, height: 35, rotation: 1 },
        { x: 52, y: 58, width: 46, height: 35, rotation: -1 },
      ],
    },
    decorativeElements: {
      headerEmoji: '📸',
      chapterEmoji: '❤️',
      dividerEmoji: '~ 📷 ~',
      cornerDecorations: 'hearts',
      backgroundPattern: 'dots',
      backgroundPatternOpacity: 0.015,
      pageFrame: 'rounded',
      frameColor: '#c77daa',
      frameWidth: 1,
      titleUnderline: 'wavy',
      sectionDivider: '~ ❤ ~',
    },
    headerFooter: {
      headerStyle: 'chapter-title',
      footerStyle: 'page-number-only',
      headerHeight: 26,
      footerHeight: 20,
    },
    coverStyle: {
      backgroundColor: '#6b3a5a',
      gradientColors: ['#4a2040', '#6b3a5a', '#8b5878'],
      gradientType: 'linear',
      titlePosition: 'bottom',
      titleAlignment: 'center',
      titleColor: '#ffe0f0',
      authorColor: '#f0c0d8',
      overlayPattern: 'noise',
      borderStyle: 'simple',
    },
    textColor: '#2d1b2e',
    accentColor: '#c77daa',
    backgroundColor: '#fdf6fa',
    secondaryColor: '#fce4f0',
    previewGradient: 'linear-gradient(135deg, #6b3a5a 0%, #c77daa 50%, #ffe0f0 100%)',
    previewIcon: '📸',
  },
  {
    id: 'luxury-gift',
    name: 'Luxury Gift',
    nameHe: 'ספר מתנה יוקרתי',
    description: 'Premium gift book with warm gold tones, beautiful typography, and elegant layout',
    descriptionHe: 'ספר מתנה פרימיום עם גוונים זהובים חמים, טיפוגרפיה יפהפייה ועיצוב אלגנטי',
    category: 'gift',
    fonts: {
      title: 'Cormorant Garamond',
      body: 'Lora',
      headers: 'Playfair Display',
    },
    headerSizes: { h1: 30, h2: 22, h3: 17 },
    fontSize: 12,
    lineHeight: 1.9,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 44, bottom: 44, left: 40, right: 40 },
    paragraphIndent: 18,
    paragraphSpacing: 10,
    chapterStartStyle: 'new-page-centered',
    dropCapStyle: 'decorative',
    dropCapSize: 3,
    headerDecoration: 'ornament',
    dividerStyle: 'ornament',
    pullQuoteStyle: 'side-accent',
    imagePositions: ['top', 'center', 'side'],
    imageFrameStyle: 'vintage',
    imageLayout: 'single',
    creativeImageLayout: {
      pattern: 'diagonal',
      imageCount: 2,
      customPositions: [
        { x: 5, y: 5, width: 40, height: 32, rotation: -1.5 },
        { x: 55, y: 60, width: 40, height: 32, rotation: 1.5 },
      ],
    },
    decorativeElements: {
      headerEmoji: '🎁',
      chapterEmoji: '✨',
      dividerEmoji: '~ ✨ ~',
      cornerDecorations: 'floral',
      backgroundPattern: 'none',
      pageFrame: 'double',
      frameColor: '#c9a035',
      frameWidth: 1,
      titleUnderline: 'gradient',
      sectionDivider: '~ ❦ ~',
    },
    headerFooter: {
      headerStyle: 'book-title',
      footerStyle: 'page-number-only',
      headerHeight: 28,
      footerHeight: 22,
    },
    coverStyle: {
      backgroundColor: '#4a2c0a',
      gradientColors: ['#2d1a06', '#4a2c0a', '#7a4e22'],
      gradientType: 'radial',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#f5deb3',
      authorColor: '#daa520',
      overlayPattern: 'none',
      borderStyle: 'ornate',
    },
    textColor: '#2c1a06',
    accentColor: '#c9a035',
    backgroundColor: '#fdf8ef',
    secondaryColor: '#f5e8cc',
    previewGradient: 'linear-gradient(135deg, #4a2c0a 0%, #c9a035 50%, #fdf8ef 100%)',
    previewIcon: '🎁',
  },
  {
    id: 'childrens-story',
    name: "Children's Story",
    nameHe: 'ספר ילדים',
    description: 'Colorful, fun template for children\'s books with large fonts, illustrations and playful design',
    descriptionHe: 'תבנית צבעונית ושובבה לספרי ילדים עם פונטים גדולים, איורים ועיצוב משחקי',
    category: 'classic',
    fonts: {
      title: 'Fredoka One',
      body: 'Varela Round',
      headers: 'Fredoka One',
    },
    headerSizes: { h1: 38, h2: 28, h3: 22 },
    fontSize: 15,
    lineHeight: 2.0,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 30, bottom: 30, left: 28, right: 28 },
    paragraphIndent: 0,
    paragraphSpacing: 18,
    chapterStartStyle: 'new-page',
    dropCapStyle: 'box',
    dropCapSize: 3,
    headerDecoration: 'dots',
    dividerStyle: 'stars',
    pullQuoteStyle: 'background',
    imagePositions: ['top', 'center', 'full-bleed'],
    imageFrameStyle: 'rounded',
    imageLayout: 'single',
    creativeImageLayout: {
      pattern: 'pyramid',
      imageCount: 2,
      customPositions: [
        { x: 10, y: 5, width: 80, height: 40, rotation: 0 },
      ],
    },
    decorativeElements: {
      headerEmoji: '🌈',
      chapterEmoji: '⭐',
      dividerEmoji: '⭐ ✨ ⭐',
      cornerDecorations: 'stars',
      backgroundPattern: 'stars',
      backgroundPatternOpacity: 0.04,
      pageFrame: 'rounded',
      frameColor: '#ff6b9d',
      frameWidth: 3,
      titleUnderline: 'wavy',
      sectionDivider: '⭐ ✨ ⭐',
    },
    headerFooter: {
      headerStyle: 'none',
      footerStyle: 'page-number-only',
      footerHeight: 24,
    },
    coverStyle: {
      backgroundColor: '#ff6b9d',
      gradientColors: ['#ff6b9d', '#ffa726', '#42a5f5'],
      gradientType: 'diagonal',
      titlePosition: 'top',
      titleAlignment: 'center',
      titleColor: '#ffffff',
      authorColor: '#fff9c4',
      overlayPattern: 'dots',
      borderStyle: 'simple',
    },
    textColor: '#1a0a2e',
    accentColor: '#ff6b9d',
    backgroundColor: '#fffde7',
    secondaryColor: '#fff9c4',
    previewGradient: 'linear-gradient(135deg, #ff6b9d 0%, #ffa726 50%, #42a5f5 100%)',
    previewIcon: '🌈',
  },
  {
    id: 'poetry-verse',
    name: 'Poetry & Verse',
    nameHe: 'ספר שירה',
    description: 'Elegant minimalist template for poetry with centered layout, generous spacing and literary typography',
    descriptionHe: 'תבנית מינימלית ואלגנטית לשירה עם עיצוב ממורכז, רווחים נדיבים וטיפוגרפיה ספרותית',
    category: 'classic',
    fonts: {
      title: 'Playfair Display',
      body: 'Lora',
      headers: 'Playfair Display',
    },
    headerSizes: { h1: 26, h2: 20, h3: 16 },
    fontSize: 13,
    lineHeight: 2.2,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 60, bottom: 60, left: 55, right: 55 },
    paragraphIndent: 0,
    paragraphSpacing: 24,
    chapterStartStyle: 'new-page-centered',
    dropCapStyle: 'none',
    dropCapSize: 0,
    headerDecoration: 'none',
    dividerStyle: 'ornament',
    pullQuoteStyle: 'centered',
    imagePositions: ['center', 'full-bleed'],
    imageFrameStyle: 'shadow',
    imageLayout: 'single',
    decorativeElements: {
      headerEmoji: '✍️',
      chapterEmoji: '~',
      dividerEmoji: '~ • ~',
      cornerDecorations: 'none',
      backgroundPattern: 'none',
      pageFrame: 'none',
      titleUnderline: 'simple',
      sectionDivider: '~ • ~',
    },
    headerFooter: {
      headerStyle: 'book-title',
      footerStyle: 'page-number-only',
      headerHeight: 26,
      footerHeight: 22,
    },
    coverStyle: {
      backgroundColor: '#1a1a2e',
      gradientColors: ['#0f0f1a', '#1a1a2e', '#2d2d4e'],
      gradientType: 'radial',
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#e8e0d0',
      authorColor: '#b8a898',
      overlayPattern: 'none',
      borderStyle: 'none',
    },
    textColor: '#2c2c3e',
    accentColor: '#6b5b95',
    backgroundColor: '#faf9f7',
    secondaryColor: '#f0ece8',
    previewGradient: 'linear-gradient(135deg, #1a1a2e 0%, #6b5b95 50%, #faf9f7 100%)',
    previewIcon: '✍️',
  },
  // ========================================
  // CUSTOM TEMPLATE (always last)
  // ========================================
  {
    id: 'custom',
    name: 'Custom',
    nameHe: 'מותאם אישית',
    description: 'Full manual control over all settings',
    descriptionHe: 'שליטה מלאה על כל ההגדרות',
    category: 'custom',
    fonts: {
      title: 'Inter',
      body: 'Inter',
      headers: 'Inter',
    },
    headerSizes: { h1: 24, h2: 20, h3: 16 },
    fontSize: 11,
    lineHeight: 1.6,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 32, bottom: 32, left: 32, right: 32 },
    paragraphIndent: 0,
    paragraphSpacing: 12,
    imagePositions: ['top', 'center', 'bottom', 'combined'],
    coverStyle: {
      backgroundColor: '#1a1a2e',
      gradientColors: ['#1a1a2e', '#16213e'],
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#ffffff',
      authorColor: '#cccccc',
    },
    textColor: '#000000',
    accentColor: '#6366f1',
    backgroundColor: '#ffffff',
    previewGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
  },
];

// Get template by ID
export function getTemplateById(id: string): BookTemplate | undefined {
  return bookTemplates.find(t => t.id === id);
}

// Get templates by category
export function getTemplatesByCategory(category: BookTemplate['category']): BookTemplate[] {
  return bookTemplates.filter(t => t.category === category);
}

// Template categories for filtering - Memorial and personal story templates first as primary use case
export const templateCategories = [
  { id: 'all', name: 'All', nameHe: 'הכל' },
  { id: 'memorial', name: 'Memorial', nameHe: 'הנצחה' },
  { id: 'autobiography', name: 'Life Story', nameHe: 'סיפור חיים' },
  { id: 'family-history', name: 'Family History', nameHe: 'היסטוריה משפחתית' },
  { id: 'gift', name: 'Gift & Love', nameHe: 'מתנה ואהבה' },
  { id: 'travel', name: 'Travel', nameHe: 'מסע' },
  { id: 'creative', name: 'Community', nameHe: 'קהילה' },
] as const;

// Available fonts for custom selection
export const availableFonts = [
  // Hebrew-friendly fonts
  'David Libre',
  'Frank Ruhl Libre',
  'Heebo',
  'Assistant',
  'Rubik',
  'Alef',
  'Secular One',
  'Varela Round',
  'Suez One',
  'Amatic SC',

  // Classic Serif
  'Playfair Display',
  'Merriweather',
  'Crimson Text',
  'Libre Baskerville',
  'Cormorant Garamond',
  'PT Serif',
  'Lora',
  'Source Serif Pro',
  'Bitter',
  'Abril Fatface',

  // Modern Sans-Serif
  'Inter',
  'Open Sans',
  'Montserrat',
  'Lato',
  'Roboto',
  'Nunito',
  'Poppins',
  'Raleway',
  'Quicksand',
  'Josefin Sans',

  // Decorative & Display
  'Cinzel',
  'Cinzel Decorative',
  'Fredoka One',
  'Oswald',
  'Bebas Neue',
  'Lobster',
  'Pacifico',
  'Dancing Script',
  'Caveat',
  'Permanent Marker',

  // Elegant & Script
  'Great Vibes',
  'Satisfy',
  'Tangerine',
  'Alex Brush',
  'Pinyon Script',

  // Roboto Family
  'Roboto Slab',
  'Roboto Condensed',
  'Roboto Mono',

  // System Fonts
  'Times New Roman',
  'Georgia',
  'Arial',
  'Helvetica',
  'Verdana',
];

// Font categories for UI organization
export const fontCategories = [
  {
    id: 'hebrew',
    name: 'Hebrew',
    nameHe: 'עברית',
    fonts: ['David Libre', 'Frank Ruhl Libre', 'Heebo', 'Assistant', 'Rubik', 'Alef', 'Secular One', 'Varela Round', 'Suez One', 'Amatic SC']
  },
  {
    id: 'serif',
    name: 'Serif',
    nameHe: 'סריף',
    fonts: ['Playfair Display', 'Merriweather', 'Crimson Text', 'Libre Baskerville', 'Cormorant Garamond', 'PT Serif', 'Lora', 'Source Serif Pro', 'Bitter', 'Abril Fatface']
  },
  {
    id: 'sans-serif',
    name: 'Sans-Serif',
    nameHe: 'ללא סריף',
    fonts: ['Inter', 'Open Sans', 'Montserrat', 'Lato', 'Roboto', 'Nunito', 'Poppins', 'Raleway', 'Quicksand', 'Josefin Sans']
  },
  {
    id: 'decorative',
    name: 'Decorative',
    nameHe: 'דקורטיבי',
    fonts: ['Cinzel', 'Cinzel Decorative', 'Fredoka One', 'Oswald', 'Bebas Neue', 'Lobster', 'Pacifico', 'Dancing Script', 'Caveat', 'Permanent Marker']
  },
  {
    id: 'script',
    name: 'Script',
    nameHe: 'כתב יד',
    fonts: ['Great Vibes', 'Satisfy', 'Tangerine', 'Alex Brush', 'Pinyon Script']
  },
];

// Common text colors
export const textColorPresets = [
  { color: '#000000', name: 'Black', nameHe: 'שחור' },
  { color: '#1a1a1a', name: 'Soft Black', nameHe: 'שחור רך' },
  { color: '#333333', name: 'Dark Gray', nameHe: 'אפור כהה' },
  { color: '#2c2c2c', name: 'Charcoal', nameHe: 'פחם' },
  { color: '#1a1a2e', name: 'Navy Black', nameHe: 'שחור כחול' },
  { color: '#0f3460', name: 'Deep Blue', nameHe: 'כחול עמוק' },
  { color: '#16213e', name: 'Midnight', nameHe: 'חצות' },
  { color: '#3d3d3d', name: 'Dark Slate', nameHe: 'צפחה כהה' },
];

// Custom Templates Storage (localStorage)
const CUSTOM_TEMPLATES_KEY = 'mestory-custom-templates';

export function getCustomTemplates(): BookTemplate[] {
  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading custom templates:', error);
  }
  return [];
}

export function saveCustomTemplate(template: BookTemplate): void {
  try {
    const existing = getCustomTemplates();
    // Check if template with same ID exists, update it
    const index = existing.findIndex(t => t.id === template.id);
    if (index >= 0) {
      existing[index] = template;
    } else {
      existing.push(template);
    }
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Error saving custom template:', error);
    throw error;
  }
}

export function deleteCustomTemplate(templateId: string): void {
  try {
    const existing = getCustomTemplates();
    const filtered = existing.filter(t => t.id !== templateId);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting custom template:', error);
    throw error;
  }
}

export function getAllTemplates(): BookTemplate[] {
  return [...bookTemplates, ...getCustomTemplates()];
}

export const PAGE_SIZES = {
  A4: { width: 210, height: 297, name: 'A4', nameHe: 'A4', description: 'Standard document', descriptionHe: 'מסמך סטנדרטי' },
  A5: { width: 148, height: 210, name: 'A5', nameHe: 'A5', description: 'Standard book', descriptionHe: 'ספר סטנדרטי' },
  B5: { width: 176, height: 250, name: 'B5', nameHe: 'B5', description: 'Academic book', descriptionHe: 'ספר אקדמי' },
  Letter: { width: 216, height: 279, name: 'Letter', nameHe: 'Letter', description: 'US Letter', descriptionHe: 'פורמט אמריקאי' },
  '6x9': { width: 152, height: 229, name: '6×9"', nameHe: '6×9"', description: 'Professional book', descriptionHe: 'ספר מקצועי' },
  '5x8': { width: 127, height: 203, name: '5×8"', nameHe: '5×8"', description: 'Pocket book', descriptionHe: 'ספר כיס' },
  Square: { width: 210, height: 210, name: 'Square', nameHe: 'מרובע', description: 'Photo album', descriptionHe: 'אלבום תמונות' },
  Pocket: { width: 127, height: 178, name: 'Pocket', nameHe: 'כיס', description: 'Small pocket book', descriptionHe: 'ספר כיס קטן' },
} as const;

export type PageSizeKey = keyof typeof PAGE_SIZES;
