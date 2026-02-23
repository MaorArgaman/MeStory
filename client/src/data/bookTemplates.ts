// Book Design Templates
// Pre-made templates for quick book styling

export interface BookTemplate {
  id: string;
  name: string;
  nameHe: string;
  description: string;
  descriptionHe: string;
  category: 'classic' | 'modern' | 'elegant' | 'playful' | 'minimal' | 'custom';

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

  // Images
  imagePositions: ('top' | 'center' | 'bottom' | 'combined')[];

  // Cover
  coverStyle: {
    backgroundColor: string;
    gradientColors?: string[];
    titlePosition: 'top' | 'center' | 'bottom';
    titleAlignment: 'left' | 'center' | 'right';
    titleColor: string;
    authorColor: string;
  };

  // Colors
  textColor: string;
  accentColor: string;
  backgroundColor: string;

  // Preview gradient for display
  previewGradient: string;
}

export const bookTemplates: BookTemplate[] = [
  {
    id: 'classic-book',
    name: 'Classic Book',
    nameHe: 'ספר קלאסי',
    description: 'Traditional serif fonts with elegant single column layout',
    descriptionHe: 'גופנים קלאסיים עם עמודה אחת אלגנטית',
    category: 'classic',
    fonts: {
      title: 'Playfair Display',
      body: 'Merriweather',
      headers: 'Playfair Display',
    },
    headerSizes: { h1: 28, h2: 22, h3: 18 },
    fontSize: 14,
    lineHeight: 1.8,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 60, bottom: 60, left: 50, right: 50 },
    paragraphIndent: 20,
    paragraphSpacing: 0,
    imagePositions: ['top', 'center'],
    coverStyle: {
      backgroundColor: '#1a1a2e',
      gradientColors: ['#1a1a2e', '#16213e', '#0f3460'],
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#d4af37',
      authorColor: '#c0c0c0',
    },
    textColor: '#2c2c2c',
    accentColor: '#8b4513',
    backgroundColor: '#faf8f5',
    previewGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  },
  {
    id: 'modern-clean',
    name: 'Modern Clean',
    nameHe: 'מודרני נקי',
    description: 'Sans-serif fonts with generous whitespace',
    descriptionHe: 'גופנים מודרניים עם הרבה רווח לבן',
    category: 'modern',
    fonts: {
      title: 'Inter',
      body: 'Inter',
      headers: 'Inter',
    },
    headerSizes: { h1: 32, h2: 24, h3: 18 },
    fontSize: 15,
    lineHeight: 1.7,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-outside',
    margins: { top: 70, bottom: 70, left: 60, right: 60 },
    paragraphIndent: 0,
    paragraphSpacing: 16,
    imagePositions: ['top', 'bottom'],
    coverStyle: {
      backgroundColor: '#ffffff',
      gradientColors: ['#f8f9fa', '#e9ecef', '#dee2e6'],
      titlePosition: 'center',
      titleAlignment: 'left',
      titleColor: '#212529',
      authorColor: '#6c757d',
    },
    textColor: '#333333',
    accentColor: '#0066cc',
    backgroundColor: '#ffffff',
    previewGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 'fantasy-epic',
    name: 'Fantasy Epic',
    nameHe: 'פנטזיה אפית',
    description: 'Decorative headers with ornate fantasy styling',
    descriptionHe: 'כותרות מעוטרות בסגנון פנטזיה',
    category: 'elegant',
    fonts: {
      title: 'Cinzel Decorative',
      body: 'Crimson Text',
      headers: 'Cinzel',
    },
    headerSizes: { h1: 30, h2: 24, h3: 20 },
    fontSize: 14,
    lineHeight: 1.75,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 55, bottom: 55, left: 55, right: 55 },
    paragraphIndent: 25,
    paragraphSpacing: 0,
    imagePositions: ['top', 'center', 'combined'],
    coverStyle: {
      backgroundColor: '#0d0d1a',
      gradientColors: ['#1a0a2e', '#2d1b4e', '#0d0d1a'],
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#ffd700',
      authorColor: '#c0a080',
    },
    textColor: '#1a1a1a',
    accentColor: '#8b0000',
    backgroundColor: '#f5f0e6',
    previewGradient: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #0d0d1a 100%)',
  },
  {
    id: 'childrens-book',
    name: "Children's Book",
    nameHe: 'ספר ילדים',
    description: 'Playful fonts with colorful two-column layout',
    descriptionHe: 'גופנים משחקיים עם שתי עמודות צבעוניות',
    category: 'playful',
    fonts: {
      title: 'Fredoka One',
      body: 'Nunito',
      headers: 'Fredoka One',
    },
    headerSizes: { h1: 36, h2: 28, h3: 22 },
    fontSize: 16,
    lineHeight: 1.6,
    columns: 2,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 40, bottom: 40, left: 35, right: 35 },
    paragraphIndent: 0,
    paragraphSpacing: 12,
    imagePositions: ['top', 'center', 'bottom', 'combined'],
    coverStyle: {
      backgroundColor: '#ff6b6b',
      gradientColors: ['#ff6b6b', '#feca57', '#48dbfb'],
      titlePosition: 'top',
      titleAlignment: 'center',
      titleColor: '#ffffff',
      authorColor: '#ffe66d',
    },
    textColor: '#2d3436',
    accentColor: '#e17055',
    backgroundColor: '#fffaf0',
    previewGradient: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #48dbfb 100%)',
  },
  {
    id: 'academic',
    name: 'Academic',
    nameHe: 'אקדמי',
    description: 'Professional layout with footnotes ready',
    descriptionHe: 'עיצוב מקצועי עם מקום להערות שוליים',
    category: 'classic',
    fonts: {
      title: 'Times New Roman',
      body: 'Times New Roman',
      headers: 'Times New Roman',
    },
    headerSizes: { h1: 24, h2: 20, h3: 16 },
    fontSize: 12,
    lineHeight: 2.0,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'top-right',
    margins: { top: 72, bottom: 72, left: 72, right: 72 },
    paragraphIndent: 36,
    paragraphSpacing: 0,
    imagePositions: ['top', 'bottom'],
    coverStyle: {
      backgroundColor: '#1e3d59',
      gradientColors: ['#1e3d59', '#17263a'],
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#ffffff',
      authorColor: '#b0c4de',
    },
    textColor: '#000000',
    accentColor: '#1e3d59',
    backgroundColor: '#ffffff',
    previewGradient: 'linear-gradient(135deg, #1e3d59 0%, #17263a 100%)',
  },
  {
    id: 'magazine-style',
    name: 'Magazine Style',
    nameHe: 'סגנון מגזין',
    description: 'Dynamic multi-column with bold image placement',
    descriptionHe: 'עיצוב דינמי עם מספר עמודות ותמונות בולטות',
    category: 'modern',
    fonts: {
      title: 'Oswald',
      body: 'Open Sans',
      headers: 'Oswald',
    },
    headerSizes: { h1: 36, h2: 26, h3: 20 },
    fontSize: 13,
    lineHeight: 1.5,
    columns: 3,
    paragraphStyle: 'horizontal',
    pageNumberPosition: 'bottom-outside',
    margins: { top: 30, bottom: 30, left: 25, right: 25 },
    paragraphIndent: 0,
    paragraphSpacing: 10,
    imagePositions: ['top', 'center', 'combined'],
    coverStyle: {
      backgroundColor: '#e63946',
      gradientColors: ['#e63946', '#f77f00', '#fcbf49'],
      titlePosition: 'bottom',
      titleAlignment: 'left',
      titleColor: '#ffffff',
      authorColor: '#f1faee',
    },
    textColor: '#1d3557',
    accentColor: '#e63946',
    backgroundColor: '#f1faee',
    previewGradient: 'linear-gradient(135deg, #e63946 0%, #f77f00 50%, #fcbf49 100%)',
  },
  {
    id: 'photo-book',
    name: 'Photo Book',
    nameHe: 'אלבום תמונות',
    description: 'Image-heavy layout with minimal text',
    descriptionHe: 'עיצוב עשיר בתמונות עם מעט טקסט',
    category: 'minimal',
    fonts: {
      title: 'Montserrat',
      body: 'Lato',
      headers: 'Montserrat',
    },
    headerSizes: { h1: 28, h2: 22, h3: 16 },
    fontSize: 14,
    lineHeight: 1.6,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'none',
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
    paragraphIndent: 0,
    paragraphSpacing: 14,
    imagePositions: ['top', 'center', 'bottom', 'combined'],
    coverStyle: {
      backgroundColor: '#000000',
      gradientColors: ['#000000', '#1a1a1a'],
      titlePosition: 'bottom',
      titleAlignment: 'center',
      titleColor: '#ffffff',
      authorColor: '#888888',
    },
    textColor: '#333333',
    accentColor: '#444444',
    backgroundColor: '#ffffff',
    previewGradient: 'linear-gradient(135deg, #000000 0%, #434343 100%)',
  },
  {
    id: 'novel',
    name: 'Novel',
    nameHe: 'רומן',
    description: 'Classic single column for immersive reading',
    descriptionHe: 'עמודה אחת קלאסית לקריאה שקועה',
    category: 'classic',
    fonts: {
      title: 'Libre Baskerville',
      body: 'Libre Baskerville',
      headers: 'Libre Baskerville',
    },
    headerSizes: { h1: 26, h2: 20, h3: 16 },
    fontSize: 14,
    lineHeight: 1.85,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 65, bottom: 65, left: 55, right: 55 },
    paragraphIndent: 24,
    paragraphSpacing: 0,
    imagePositions: ['center'],
    coverStyle: {
      backgroundColor: '#2c3e50',
      gradientColors: ['#2c3e50', '#34495e', '#1a252f'],
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#ecf0f1',
      authorColor: '#bdc3c7',
    },
    textColor: '#1a1a1a',
    accentColor: '#34495e',
    backgroundColor: '#fdfcfa',
    previewGradient: 'linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #1a252f 100%)',
  },
  {
    id: 'poetry',
    name: 'Poetry',
    nameHe: 'שירה',
    description: 'Centered text with elegant spacing',
    descriptionHe: 'טקסט ממורכז עם ריווח אלגנטי',
    category: 'elegant',
    fonts: {
      title: 'Cormorant Garamond',
      body: 'Cormorant Garamond',
      headers: 'Cormorant Garamond',
    },
    headerSizes: { h1: 32, h2: 24, h3: 20 },
    fontSize: 16,
    lineHeight: 2.0,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 80, bottom: 80, left: 80, right: 80 },
    paragraphIndent: 0,
    paragraphSpacing: 24,
    imagePositions: ['center'],
    coverStyle: {
      backgroundColor: '#f5e6d3',
      gradientColors: ['#d4a373', '#e9c46a', '#f5e6d3'],
      titlePosition: 'center',
      titleAlignment: 'center',
      titleColor: '#3d3d3d',
      authorColor: '#6b6b6b',
    },
    textColor: '#3d3d3d',
    accentColor: '#a47148',
    backgroundColor: '#faf8f5',
    previewGradient: 'linear-gradient(135deg, #d4a373 0%, #e9c46a 50%, #f5e6d3 100%)',
  },
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
    fontSize: 14,
    lineHeight: 1.6,
    columns: 1,
    paragraphStyle: 'vertical',
    pageNumberPosition: 'bottom-center',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
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

// Template categories for filtering
export const templateCategories = [
  { id: 'all', name: 'All', nameHe: 'הכל' },
  { id: 'classic', name: 'Classic', nameHe: 'קלאסי' },
  { id: 'modern', name: 'Modern', nameHe: 'מודרני' },
  { id: 'elegant', name: 'Elegant', nameHe: 'אלגנטי' },
  { id: 'playful', name: 'Playful', nameHe: 'משחקי' },
  { id: 'minimal', name: 'Minimal', nameHe: 'מינימלי' },
] as const;

// Available fonts for custom selection
export const availableFonts = [
  'Inter',
  'Playfair Display',
  'Merriweather',
  'Cinzel',
  'Cinzel Decorative',
  'Crimson Text',
  'Fredoka One',
  'Nunito',
  'Times New Roman',
  'Oswald',
  'Open Sans',
  'Montserrat',
  'Lato',
  'Libre Baskerville',
  'Cormorant Garamond',
  'Georgia',
  'Roboto',
  'Roboto Slab',
  'Source Sans Pro',
  'PT Serif',
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
