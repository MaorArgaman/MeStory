/**
 * Premium AI Book Design Service
 *
 * This service provides the highest quality AI-powered book design,
 * creating professional, stunning designs that match the book's content and theme.
 *
 * Features:
 * - Deep content analysis for theme understanding
 * - Sophisticated typography with perfect font pairing
 * - Unique color schemes based on book mood
 * - Professional page layouts with proper structure
 * - Beautiful table of contents design
 * - Chapter decorations and ornaments
 * - Strategic image placement suggestions
 * - AI-generated cover art matching the book's essence
 * - Page numbering and header/footer design
 * - Text highlighting and emphasis styles
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { generateWithBreaker } from './geminiClient';
import {
  generateBookCovers,
  generateBookInteriorImages,
  BookImagePlacement,
} from './imageGenerationService';

// Lazy-initialize Gemini AI client
let genAIClient: GoogleGenerativeAI | null = null;
let modelInstance: GenerativeModel | null = null;

function getGeminiModel(): GenerativeModel {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  if (!modelInstance) {
    modelInstance = genAIClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }
  return modelInstance;
}

// ============================================
// PREMIUM TYPE DEFINITIONS
// ============================================

export interface BookDesignInput {
  title: string;
  authorName: string;
  genre: string;
  language: string;
  synopsis?: string;
  chapters: Array<{
    title: string;
    content: string;
    wordCount: number;
  }>;
  targetAudience?: string;
}

export interface ThemeAnalysis {
  primaryTheme: string;
  mood: string;
  atmosphere: string;
  emotionalTone: string;
  visualStyle: string;
  colorMood: string;
  era: string;
  setting: string;
  keywords: string[];
}

export interface PremiumTypography {
  bodyFont: string;
  headingFont: string;
  titleFont: string;
  accentFont: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  paragraphSpacing: number;
  chapterTitleSize: number;
  sectionTitleSize: number;
  pageNumberSize: number;
  colors: {
    text: string;
    heading: string;
    accent: string;
    highlight: string;
    quote: string;
    pageNumber: string;
  };
  formatting: {
    firstParagraphIndent: boolean;
    dropCapStyle: 'none' | 'simple' | 'decorated' | 'boxed';
    dropCapLines: number;
    quoteStyle: 'italic' | 'indented' | 'bordered' | 'highlighted';
    emphasisStyle: 'bold' | 'italic' | 'color' | 'underline';
  };
  reasoning: string;
}

export interface TableOfContentsDesign {
  style: 'classic' | 'modern' | 'minimal' | 'decorated' | 'elegant';
  titleText: string;
  titleFont: string;
  titleSize: number;
  titleColor: string;
  entryFont: string;
  entrySize: number;
  entryColor: string;
  pageNumberStyle: 'right-aligned' | 'dotted-line' | 'bracketed' | 'subtle';
  spacing: number;
  indentSubsections: boolean;
  decorativeElements: boolean;
  dividerStyle: 'none' | 'line' | 'ornament' | 'gradient';
  backgroundColor?: string;
  borderStyle?: string;
}

export interface ChapterDecoration {
  headerStyle: 'simple' | 'centered' | 'decorated' | 'full-width' | 'artistic';
  numberStyle: 'numeric' | 'word' | 'roman' | 'hidden';
  numberPosition: 'above-title' | 'inline' | 'side' | 'none';
  titleAlignment: 'left' | 'center' | 'right';
  titleDecoration: 'none' | 'underline' | 'ornament' | 'box' | 'gradient';
  openingOrnament: string | null; // SVG or character
  closingOrnament: string | null;
  spacingBefore: number;
  spacingAfter: number;
  backgroundColor?: string;
  borderTop?: string;
  borderBottom?: string;
}

export interface PageBackground {
  style: 'solid' | 'subtle-texture' | 'gradient' | 'parchment' | 'clean';
  primaryColor: string;
  secondaryColor?: string;
  opacity: number;
  texturePattern?: string;
}

export interface PremiumPageLayout {
  pageSize: 'A4' | 'A5' | '6x9' | '5x8' | 'Letter' | 'Custom';
  customSize?: { width: number; height: number };
  margins: {
    top: number;
    bottom: number;
    inner: number;
    outer: number;
  };
  columns: 1 | 2;
  columnGap?: number;
  chapterStartStyle: 'same-page' | 'new-page' | 'new-page-centered' | 'new-page-decorated';
  pageNumbering: {
    enabled: boolean;
    position: 'bottom-center' | 'bottom-outer' | 'top-outer' | 'top-center';
    startFrom: number;
    style: 'numeric' | 'roman' | 'decorated';
    font: string;
    size: number;
    color: string;
  };
  headers: {
    enabled: boolean;
    style: 'book-title' | 'chapter-title' | 'author-name' | 'alternating';
    font: string;
    size: number;
    color: string;
    alignment: 'left' | 'center' | 'right' | 'outer';
    separator: 'none' | 'line' | 'ornament';
  };
  footers: {
    enabled: boolean;
    content: 'page-number' | 'copyright' | 'custom';
    customText?: string;
  };
  dropCaps: {
    enabled: boolean;
    style: 'simple' | 'decorated' | 'boxed' | 'colored';
    lines: number;
    font: string;
    color: string;
  };
  sectionBreaks: {
    style: 'space' | 'ornament' | 'line' | 'symbol';
    ornament?: string;
    spacing: number;
  };
  background: PageBackground;
  reasoning: string;
}

export interface ImagePlacement {
  chapterIndex: number;
  pagePosition: 'chapter-start' | 'mid-chapter' | 'chapter-end' | 'full-page';
  imagePosition: 'top' | 'center' | 'bottom' | 'left' | 'right' | 'full-bleed';
  aspectRatio: '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
  frame: 'none' | 'thin-border' | 'shadow' | 'rounded' | 'decorative';
  caption?: string;
  textContext: string;
  suggestedPrompt: string;
  importance: 'essential' | 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface PremiumCoverDesign {
  front: {
    imagePrompt: string;
    imageUrl?: string;
    composition: 'centered' | 'off-center' | 'full-bleed' | 'framed' | 'split';
    title: {
      text: string;
      font: string;
      size: number;
      color: string;
      strokeColor?: string;
      strokeWidth?: number;
      position: { x: number; y: number };
      alignment: 'left' | 'center' | 'right';
      shadow?: { color: string; blur: number; offset: { x: number; y: number } };
    };
    subtitle?: {
      text: string;
      font: string;
      size: number;
      color: string;
      position: { x: number; y: number };
    };
    author: {
      text: string;
      font: string;
      size: number;
      color: string;
      position: { x: number; y: number };
      prefix?: string; // "by", "מאת", etc.
    };
    tagline?: string;
    colorPalette: string[];
    overlayGradient?: {
      direction: 'top' | 'bottom' | 'left' | 'right';
      colors: string[];
    };
  };
  back: {
    imagePrompt: string;
    imageUrl?: string;
    layout: 'centered' | 'top-heavy' | 'bottom-heavy' | 'split';
    synopsis: {
      text: string;
      font: string;
      size: number;
      color: string;
      maxLines: number;
    };
    authorBio?: {
      text: string;
      font: string;
      size: number;
      color: string;
    };
    authorPhoto?: boolean;
    testimonials?: string[];
    barcode: {
      position: { x: number; y: number };
      size: { width: number; height: number };
    };
    backgroundColor: string;
  };
  spine: {
    title: string;
    author: string;
    font: string;
    titleSize: number;
    authorSize: number;
    color: string;
    backgroundColor: string;
    orientation: 'top-to-bottom' | 'bottom-to-top';
    logo?: boolean;
  };
  style: {
    genre: string;
    mood: string;
    era: string;
    visualTheme: string;
  };
  reasoning: string;
}

export interface PremiumCompleteDesign {
  theme: ThemeAnalysis;
  typography: PremiumTypography;
  tableOfContents: TableOfContentsDesign;
  chapterDecoration: ChapterDecoration;
  layout: PremiumPageLayout;
  cover: PremiumCoverDesign;
  imagePlacements: ImagePlacement[];
  covers: {
    frontImageUrl?: string;
    backImageUrl?: string;
    spineImageUrl?: string;
  };
  generatedImages: Array<{
    chapterIndex: number;
    imageUrl: string;
    prompt: string;
    position: string;
  }>;
  overallStyle: string;
  moodDescription: string;
  qualityScore: number;
  generatedAt: Date;
}

// ============================================
// PREMIUM FONT DATABASE
// ============================================

const PREMIUM_FONTS = {
  hebrew: {
    serif: {
      elegant: ['David Libre', 'Frank Ruhl Libre', 'Noto Serif Hebrew'],
      classic: ['Heebo', 'Assistant', 'Rubik'],
      modern: ['Secular One', 'Suez One'],
    },
    sansSerif: {
      clean: ['Heebo', 'Assistant', 'Rubik'],
      modern: ['Open Sans Hebrew', 'Varela Round'],
      bold: ['Secular One', 'Alef'],
    },
    display: ['Secular One', 'Suez One', 'Alef', 'Amatic SC'],
    handwriting: ['Amatic SC', 'Varela Round', 'Karantina'],
  },
  english: {
    serif: {
      elegant: ['Playfair Display', 'Cormorant Garamond', 'Libre Baskerville'],
      classic: ['Merriweather', 'Lora', 'Crimson Text', 'EB Garamond'],
      modern: ['Source Serif Pro', 'PT Serif', 'Bitter'],
    },
    sansSerif: {
      clean: ['Inter', 'Open Sans', 'Lato', 'Source Sans Pro'],
      modern: ['Montserrat', 'Poppins', 'Raleway'],
      bold: ['Oswald', 'Roboto Condensed', 'Anton'],
    },
    display: ['Bebas Neue', 'Oswald', 'Playfair Display SC', 'Cinzel'],
    handwriting: ['Dancing Script', 'Pacifico', 'Caveat', 'Great Vibes', 'Satisfy'],
  },
};

// Genre-specific design configurations
const GENRE_DESIGN_PRESETS: Record<string, {
  typography: { bodyStyle: string; headingStyle: string; titleStyle: string };
  colors: { mood: string; palette: string[] };
  layout: { style: string; density: string };
  cover: { style: string; composition: string };
}> = {
  'fantasy': {
    typography: { bodyStyle: 'serif.elegant', headingStyle: 'display', titleStyle: 'display' },
    colors: { mood: 'mystical', palette: ['#2C3E50', '#8E44AD', '#E74C3C', '#F39C12', '#1ABC9C'] },
    layout: { style: 'decorated', density: 'comfortable' },
    cover: { style: 'epic', composition: 'full-bleed' },
  },
  'romance': {
    typography: { bodyStyle: 'serif.elegant', headingStyle: 'handwriting', titleStyle: 'handwriting' },
    colors: { mood: 'warm', palette: ['#E91E63', '#9C27B0', '#FF5722', '#FFC107', '#8BC34A'] },
    layout: { style: 'elegant', density: 'airy' },
    cover: { style: 'romantic', composition: 'centered' },
  },
  'thriller': {
    typography: { bodyStyle: 'sansSerif.clean', headingStyle: 'sansSerif.bold', titleStyle: 'display' },
    colors: { mood: 'dark', palette: ['#1a1a2e', '#16213e', '#e94560', '#0f3460', '#533483'] },
    layout: { style: 'modern', density: 'tight' },
    cover: { style: 'intense', composition: 'off-center' },
  },
  'sci-fi': {
    typography: { bodyStyle: 'sansSerif.modern', headingStyle: 'sansSerif.bold', titleStyle: 'display' },
    colors: { mood: 'futuristic', palette: ['#0D0D0D', '#1A1A2E', '#00D9FF', '#FF00FF', '#39FF14'] },
    layout: { style: 'modern', density: 'clean' },
    cover: { style: 'futuristic', composition: 'split' },
  },
  'mystery': {
    typography: { bodyStyle: 'serif.classic', headingStyle: 'serif.elegant', titleStyle: 'display' },
    colors: { mood: 'noir', palette: ['#1C1C1C', '#2D2D2D', '#8B0000', '#DAA520', '#4A4A4A'] },
    layout: { style: 'classic', density: 'comfortable' },
    cover: { style: 'mysterious', composition: 'framed' },
  },
  'horror': {
    typography: { bodyStyle: 'serif.classic', headingStyle: 'display', titleStyle: 'display' },
    colors: { mood: 'eerie', palette: ['#0D0D0D', '#1a0a0a', '#8B0000', '#2F4F4F', '#800020'] },
    layout: { style: 'atmospheric', density: 'spacious' },
    cover: { style: 'dark', composition: 'full-bleed' },
  },
  'literary': {
    typography: { bodyStyle: 'serif.elegant', headingStyle: 'serif.classic', titleStyle: 'serif.elegant' },
    colors: { mood: 'refined', palette: ['#2C3E50', '#34495E', '#7F8C8D', '#BDC3C7', '#ECF0F1'] },
    layout: { style: 'classic', density: 'airy' },
    cover: { style: 'artistic', composition: 'centered' },
  },
  'children': {
    typography: { bodyStyle: 'sansSerif.clean', headingStyle: 'display', titleStyle: 'handwriting' },
    colors: { mood: 'playful', palette: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'] },
    layout: { style: 'fun', density: 'spacious' },
    cover: { style: 'colorful', composition: 'centered' },
  },
  'young-adult': {
    typography: { bodyStyle: 'sansSerif.modern', headingStyle: 'display', titleStyle: 'display' },
    colors: { mood: 'energetic', palette: ['#6C5CE7', '#00CEC9', '#FD79A8', '#FDCB6E', '#00B894'] },
    layout: { style: 'modern', density: 'comfortable' },
    cover: { style: 'vibrant', composition: 'off-center' },
  },
  'historical': {
    typography: { bodyStyle: 'serif.classic', headingStyle: 'serif.elegant', titleStyle: 'serif.elegant' },
    colors: { mood: 'vintage', palette: ['#8B4513', '#D2691E', '#DEB887', '#F5DEB3', '#2F4F4F'] },
    layout: { style: 'traditional', density: 'comfortable' },
    cover: { style: 'period', composition: 'framed' },
  },
  'biography': {
    typography: { bodyStyle: 'serif.classic', headingStyle: 'sansSerif.clean', titleStyle: 'sansSerif.modern' },
    colors: { mood: 'professional', palette: ['#1A1A1A', '#333333', '#4A4A4A', '#6B6B6B', '#B8860B'] },
    layout: { style: 'clean', density: 'comfortable' },
    cover: { style: 'documentary', composition: 'centered' },
  },
  'self-help': {
    typography: { bodyStyle: 'sansSerif.clean', headingStyle: 'sansSerif.modern', titleStyle: 'display' },
    colors: { mood: 'inspiring', palette: ['#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#00ACC1'] },
    layout: { style: 'modern', density: 'clean' },
    cover: { style: 'motivational', composition: 'centered' },
  },
  'memoir': {
    typography: { bodyStyle: 'serif.elegant', headingStyle: 'handwriting', titleStyle: 'handwriting' },
    colors: { mood: 'personal', palette: ['#5D4037', '#795548', '#A1887F', '#D7CCC8', '#3E2723'] },
    layout: { style: 'intimate', density: 'airy' },
    cover: { style: 'personal', composition: 'centered' },
  },
  'default': {
    typography: { bodyStyle: 'serif.classic', headingStyle: 'serif.elegant', titleStyle: 'display' },
    colors: { mood: 'classic', palette: ['#2C3E50', '#34495E', '#E74C3C', '#F39C12', '#1ABC9C'] },
    layout: { style: 'classic', density: 'comfortable' },
    cover: { style: 'professional', composition: 'centered' },
  },
};

// ============================================
// STEP 1: DEEP THEME ANALYSIS
// ============================================

export async function analyzeBookTheme(input: BookDesignInput): Promise<ThemeAnalysis> {
  const isHebrew = input.language === 'he' || /[\u0590-\u05FF]/.test(input.title);

  // Combine chapter content for analysis (first 5000 chars)
  const sampleContent = input.chapters
    .map(ch => ch.content)
    .join('\n\n')
    .slice(0, 5000);

  const prompt = `You are an expert literary analyst and visual designer. Deeply analyze this book to understand its essence for creating the perfect design.

BOOK INFORMATION:
Title: "${input.title}"
Author: ${input.authorName}
Genre: ${input.genre}
Language: ${isHebrew ? 'Hebrew' : 'English'}
Target Audience: ${input.targetAudience || 'General'}
Synopsis: ${input.synopsis || 'Not provided'}

SAMPLE CONTENT:
${sampleContent}

TASK:
Analyze this book deeply to extract:
1. PRIMARY THEME - What is this book fundamentally about?
2. MOOD - What emotional feeling does it evoke? (e.g., hopeful, dark, whimsical, intense)
3. ATMOSPHERE - What kind of visual atmosphere fits? (e.g., ethereal, gritty, cozy, dramatic)
4. EMOTIONAL TONE - How should readers feel? (e.g., excited, contemplative, scared, inspired)
5. VISUAL STYLE - What design style fits? (e.g., minimalist, ornate, modern, vintage, artistic)
6. COLOR MOOD - What color feeling matches? (e.g., warm sunset, cool ocean, dark forest, bright meadow)
7. ERA - What time period feeling? (e.g., contemporary, historical, futuristic, timeless)
8. SETTING - Where does the story feel like it takes place?
9. KEYWORDS - 5-8 visual keywords that capture the book's essence

Respond with ONLY valid JSON:
{
  "primaryTheme": "one sentence describing the core theme",
  "mood": "single word or short phrase",
  "atmosphere": "single word or short phrase",
  "emotionalTone": "single word or short phrase",
  "visualStyle": "single word or short phrase",
  "colorMood": "descriptive phrase like 'deep ocean blues' or 'warm autumn tones'",
  "era": "time period or feeling",
  "setting": "type of place or environment",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

  try {
    const result = await generateWithBreaker(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    return JSON.parse(jsonMatch[0]) as ThemeAnalysis;
  } catch (error) {
    console.error('Theme analysis error:', error);
    return {
      primaryTheme: `A ${input.genre} story`,
      mood: 'engaging',
      atmosphere: 'immersive',
      emotionalTone: 'compelling',
      visualStyle: 'professional',
      colorMood: 'balanced and appealing',
      era: 'contemporary',
      setting: 'varied',
      keywords: [input.genre, 'story', 'narrative', 'compelling', 'engaging'],
    };
  }
}

// ============================================
// STEP 2: PREMIUM TYPOGRAPHY GENERATION
// ============================================

export async function generatePremiumTypography(
  input: BookDesignInput,
  theme: ThemeAnalysis
): Promise<PremiumTypography> {
  const isHebrew = input.language === 'he' || /[\u0590-\u05FF]/.test(input.title);
  const fonts = isHebrew ? PREMIUM_FONTS.hebrew : PREMIUM_FONTS.english;
  const genrePreset = GENRE_DESIGN_PRESETS[input.genre.toLowerCase()] || GENRE_DESIGN_PRESETS.default;

  // Get font categories from preset
  const [bodyCategory, bodyStyle] = genrePreset.typography.bodyStyle.split('.');
  const availableBodyFonts = fonts[bodyCategory as keyof typeof fonts];
  const bodyFontList = typeof availableBodyFonts === 'object' && !Array.isArray(availableBodyFonts)
    ? (availableBodyFonts as Record<string, string[]>)[bodyStyle] || Object.values(availableBodyFonts).flat()
    : Array.isArray(availableBodyFonts) ? availableBodyFonts : [];

  const headingFontList = fonts.display || [];
  const accentFontList = fonts.handwriting || [];

  const prompt = `You are a world-renowned typographer who designs bestselling books. Create the PERFECT typography system for this book.

BOOK: "${input.title}" by ${input.authorName}
GENRE: ${input.genre}
LANGUAGE: ${isHebrew ? 'Hebrew (RTL - right to left)' : 'English'}

THEME ANALYSIS:
- Primary Theme: ${theme.primaryTheme}
- Mood: ${theme.mood}
- Atmosphere: ${theme.atmosphere}
- Visual Style: ${theme.visualStyle}
- Color Mood: ${theme.colorMood}

AVAILABLE FONTS:
Body: ${bodyFontList.join(', ')}
Headings: ${headingFontList.join(', ')}
Accent: ${accentFontList.join(', ')}

REQUIREMENTS:
1. Create a STUNNING, COHESIVE typography system
2. Choose fonts that PERFECTLY match the book's mood and theme
3. Select RICH, SOPHISTICATED colors - NOT plain black/white
4. Consider readability AND visual appeal
5. ${isHebrew ? 'Design for RTL Hebrew text with proper Hebrew typography conventions' : 'Design for elegant Latin typography'}

Color Guidelines:
- Text color should be deep and rich (navy, charcoal, sepia, burgundy) - NOT plain black
- Heading color should be bold and eye-catching
- Accent color should complement and highlight
- Quote color should be distinct but harmonious
- All colors should work together as a cohesive palette

Typography should feel: ${theme.mood}, ${theme.atmosphere}, ${theme.visualStyle}

Respond with ONLY valid JSON:
{
  "bodyFont": "exact font name from body list",
  "headingFont": "exact font name from heading list",
  "titleFont": "exact font name for cover title",
  "accentFont": "exact font name for decorative elements",
  "fontSize": 12,
  "lineHeight": 1.7,
  "letterSpacing": 0,
  "paragraphSpacing": 12,
  "chapterTitleSize": 28,
  "sectionTitleSize": 18,
  "pageNumberSize": 10,
  "colors": {
    "text": "#deep rich color",
    "heading": "#bold distinctive color",
    "accent": "#complementary accent",
    "highlight": "#for highlighted text",
    "quote": "#for quotations",
    "pageNumber": "#subtle but visible"
  },
  "formatting": {
    "firstParagraphIndent": false,
    "dropCapStyle": "decorated",
    "dropCapLines": 3,
    "quoteStyle": "indented",
    "emphasisStyle": "italic"
  },
  "reasoning": "3-4 sentences explaining why these typography choices perfectly match the book"
}

Values for dropCapStyle: "none", "simple", "decorated", "boxed"
Values for quoteStyle: "italic", "indented", "bordered", "highlighted"
Values for emphasisStyle: "bold", "italic", "color", "underline"`;

  try {
    const result = await generateWithBreaker(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const typography = JSON.parse(jsonMatch[0]) as PremiumTypography;

    // Validate fonts
    if (!bodyFontList.includes(typography.bodyFont)) {
      typography.bodyFont = bodyFontList[0] || (isHebrew ? 'David Libre' : 'Merriweather');
    }
    if (!headingFontList.includes(typography.headingFont)) {
      typography.headingFont = headingFontList[0] || (isHebrew ? 'Secular One' : 'Playfair Display');
    }

    return typography;
  } catch (error) {
    console.error('Premium typography error:', error);
    const palette = genrePreset.colors.palette;
    return {
      bodyFont: isHebrew ? 'David Libre' : 'Merriweather',
      headingFont: isHebrew ? 'Secular One' : 'Playfair Display',
      titleFont: isHebrew ? 'Suez One' : 'Bebas Neue',
      accentFont: isHebrew ? 'Amatic SC' : 'Dancing Script',
      fontSize: 12,
      lineHeight: 1.7,
      letterSpacing: 0,
      paragraphSpacing: 12,
      chapterTitleSize: 28,
      sectionTitleSize: 18,
      pageNumberSize: 10,
      colors: {
        text: palette[0] || '#1a1a2e',
        heading: palette[2] || '#e94560',
        accent: palette[3] || '#f39c12',
        highlight: palette[4] || '#1abc9c',
        quote: palette[1] || '#16213e',
        pageNumber: palette[1] || '#666666',
      },
      formatting: {
        firstParagraphIndent: false,
        dropCapStyle: 'decorated',
        dropCapLines: 3,
        quoteStyle: 'indented',
        emphasisStyle: 'italic',
      },
      reasoning: 'Professional typography based on genre conventions.',
    };
  }
}

// ============================================
// STEP 3: TABLE OF CONTENTS DESIGN
// ============================================

export async function generateTableOfContentsDesign(
  input: BookDesignInput,
  theme: ThemeAnalysis,
  typography: PremiumTypography
): Promise<TableOfContentsDesign> {
  const isHebrew = input.language === 'he' || /[\u0590-\u05FF]/.test(input.title);

  const prompt = `You are designing a beautiful table of contents for a ${input.genre} book.

BOOK: "${input.title}"
THEME: ${theme.mood}, ${theme.atmosphere}
TYPOGRAPHY: Using ${typography.headingFont} for headings, ${typography.bodyFont} for body
COLORS: Text ${typography.colors.text}, Heading ${typography.colors.heading}, Accent ${typography.colors.accent}
LANGUAGE: ${isHebrew ? 'Hebrew (TOC title should be "תוכן עניינים")' : 'English'}

Create a TABLE OF CONTENTS design that:
1. Matches the book's mood and style
2. Is elegant and easy to navigate
3. Uses the typography system consistently
4. Has appropriate decorative elements for the genre

Respond with ONLY valid JSON:
{
  "style": "elegant",
  "titleText": "${isHebrew ? 'תוכן עניינים' : 'Contents'}",
  "titleFont": "${typography.headingFont}",
  "titleSize": 32,
  "titleColor": "${typography.colors.heading}",
  "entryFont": "${typography.bodyFont}",
  "entrySize": 14,
  "entryColor": "${typography.colors.text}",
  "pageNumberStyle": "dotted-line",
  "spacing": 16,
  "indentSubsections": true,
  "decorativeElements": true,
  "dividerStyle": "ornament",
  "backgroundColor": "#optional or null",
  "borderStyle": "#optional or null"
}

Values for style: "classic", "modern", "minimal", "decorated", "elegant"
Values for pageNumberStyle: "right-aligned", "dotted-line", "bracketed", "subtle"
Values for dividerStyle: "none", "line", "ornament", "gradient"`;

  try {
    const result = await generateWithBreaker(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    return JSON.parse(jsonMatch[0]) as TableOfContentsDesign;
  } catch (error) {
    console.error('TOC design error:', error);
    return {
      style: 'elegant',
      titleText: isHebrew ? 'תוכן עניינים' : 'Contents',
      titleFont: typography.headingFont,
      titleSize: 32,
      titleColor: typography.colors.heading,
      entryFont: typography.bodyFont,
      entrySize: 14,
      entryColor: typography.colors.text,
      pageNumberStyle: 'dotted-line',
      spacing: 16,
      indentSubsections: true,
      decorativeElements: true,
      dividerStyle: 'ornament',
    };
  }
}

// ============================================
// STEP 4: CHAPTER DECORATION DESIGN
// ============================================

export async function generateChapterDecoration(
  input: BookDesignInput,
  theme: ThemeAnalysis,
  typography: PremiumTypography
): Promise<ChapterDecoration> {
  const isHebrew = input.language === 'he' || /[\u0590-\u05FF]/.test(input.title);
  const genrePreset = GENRE_DESIGN_PRESETS[input.genre.toLowerCase()] || GENRE_DESIGN_PRESETS.default;

  const prompt = `You are designing beautiful chapter openings for a ${input.genre} book.

BOOK: "${input.title}"
THEME: ${theme.mood}, ${theme.atmosphere}, ${theme.visualStyle}
STYLE PRESET: ${genrePreset.layout.style}
LANGUAGE: ${isHebrew ? 'Hebrew (RTL)' : 'English'}

Create STUNNING chapter decorations that:
1. Make a powerful first impression
2. Match the book's mood perfectly
3. Feel premium and professional
4. Are appropriate for the genre

For ornaments, use Unicode decorative characters like:
- Flourishes: ❧ ☙ ✦ ✧ ❋ ✿ ❀ ✾ ❁ ✽
- Lines: ═══ ━━━ ───
- Stars: ★ ☆ ✯ ✡
- Hearts: ♥ ♡ ❤
- Other: ◆ ◇ ● ○ ■ □ ▲ △

Respond with ONLY valid JSON:
{
  "headerStyle": "decorated",
  "numberStyle": "word",
  "numberPosition": "above-title",
  "titleAlignment": "center",
  "titleDecoration": "ornament",
  "openingOrnament": "❧",
  "closingOrnament": "❧",
  "spacingBefore": 80,
  "spacingAfter": 40,
  "backgroundColor": null,
  "borderTop": null,
  "borderBottom": "1px solid ${typography.colors.accent}"
}

Values for headerStyle: "simple", "centered", "decorated", "full-width", "artistic"
Values for numberStyle: "numeric", "word", "roman", "hidden"
Values for numberPosition: "above-title", "inline", "side", "none"
Values for titleAlignment: "left", "center", "right"
Values for titleDecoration: "none", "underline", "ornament", "box", "gradient"`;

  try {
    const result = await generateWithBreaker(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    return JSON.parse(jsonMatch[0]) as ChapterDecoration;
  } catch (error) {
    console.error('Chapter decoration error:', error);
    return {
      headerStyle: 'decorated',
      numberStyle: isHebrew ? 'word' : 'numeric',
      numberPosition: 'above-title',
      titleAlignment: 'center',
      titleDecoration: 'ornament',
      openingOrnament: '❧',
      closingOrnament: '❧',
      spacingBefore: 80,
      spacingAfter: 40,
    };
  }
}

// ============================================
// STEP 5: PREMIUM PAGE LAYOUT
// ============================================

export async function generatePremiumPageLayout(
  input: BookDesignInput,
  theme: ThemeAnalysis,
  typography: PremiumTypography
): Promise<PremiumPageLayout> {
  const isHebrew = input.language === 'he' || /[\u0590-\u05FF]/.test(input.title);
  const totalWordCount = input.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  const estimatedPages = Math.ceil(totalWordCount / 250);
  const genrePreset = GENRE_DESIGN_PRESETS[input.genre.toLowerCase()] || GENRE_DESIGN_PRESETS.default;

  const prompt = `You are a master book designer creating the perfect page layout.

BOOK: "${input.title}"
GENRE: ${input.genre}
CHAPTERS: ${input.chapters.length}
ESTIMATED PAGES: ${estimatedPages}
LANGUAGE: ${isHebrew ? 'Hebrew (RTL)' : 'English'}
THEME: ${theme.mood}, ${theme.atmosphere}
STYLE: ${genrePreset.layout.style}, ${genrePreset.layout.density}

TYPOGRAPHY COLORS:
- Text: ${typography.colors.text}
- Heading: ${typography.colors.heading}
- Accent: ${typography.colors.accent}
- Page Number: ${typography.colors.pageNumber}

Create a PROFESSIONAL page layout with:
1. Perfect margins for comfortable reading
2. Elegant page numbering
3. Sophisticated headers
4. Beautiful section breaks
5. Appropriate background (subtle, not distracting)
6. New chapters starting on new pages with proper spacing

Respond with ONLY valid JSON:
{
  "pageSize": "A5",
  "margins": {
    "top": 60,
    "bottom": 55,
    "inner": 70,
    "outer": 50
  },
  "columns": 1,
  "chapterStartStyle": "new-page-decorated",
  "pageNumbering": {
    "enabled": true,
    "position": "bottom-outer",
    "startFrom": 1,
    "style": "numeric",
    "font": "${typography.bodyFont}",
    "size": 10,
    "color": "${typography.colors.pageNumber}"
  },
  "headers": {
    "enabled": true,
    "style": "chapter-title",
    "font": "${typography.bodyFont}",
    "size": 9,
    "color": "${typography.colors.pageNumber}",
    "alignment": "outer",
    "separator": "line"
  },
  "footers": {
    "enabled": false,
    "content": "page-number"
  },
  "dropCaps": {
    "enabled": true,
    "style": "decorated",
    "lines": 3,
    "font": "${typography.headingFont}",
    "color": "${typography.colors.accent}"
  },
  "sectionBreaks": {
    "style": "ornament",
    "ornament": "❧ ❧ ❧",
    "spacing": 24
  },
  "background": {
    "style": "clean",
    "primaryColor": "#FFFFFF",
    "opacity": 1
  },
  "reasoning": "Explain the layout choices"
}

Values for pageSize: "A4", "A5", "6x9", "5x8", "Letter"
Values for chapterStartStyle: "same-page", "new-page", "new-page-centered", "new-page-decorated"
Values for pageNumbering.position: "bottom-center", "bottom-outer", "top-outer", "top-center"
Values for pageNumbering.style: "numeric", "roman", "decorated"
Values for headers.style: "book-title", "chapter-title", "author-name", "alternating"
Values for headers.separator: "none", "line", "ornament"
Values for dropCaps.style: "simple", "decorated", "boxed", "colored"
Values for sectionBreaks.style: "space", "ornament", "line", "symbol"
Values for background.style: "solid", "subtle-texture", "gradient", "parchment", "clean"`;

  try {
    const result = await generateWithBreaker(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    return JSON.parse(jsonMatch[0]) as PremiumPageLayout;
  } catch (error) {
    console.error('Premium layout error:', error);
    return {
      pageSize: 'A5',
      margins: { top: 60, bottom: 55, inner: 70, outer: 50 },
      columns: 1,
      chapterStartStyle: 'new-page-decorated',
      pageNumbering: {
        enabled: true,
        position: 'bottom-outer',
        startFrom: 1,
        style: 'numeric',
        font: typography.bodyFont,
        size: 10,
        color: typography.colors.pageNumber,
      },
      headers: {
        enabled: true,
        style: 'chapter-title',
        font: typography.bodyFont,
        size: 9,
        color: typography.colors.pageNumber,
        alignment: 'outer',
        separator: 'line',
      },
      footers: {
        enabled: false,
        content: 'page-number',
      },
      dropCaps: {
        enabled: true,
        style: 'decorated',
        lines: 3,
        font: typography.headingFont,
        color: typography.colors.accent,
      },
      sectionBreaks: {
        style: 'ornament',
        ornament: '❧ ❧ ❧',
        spacing: 24,
      },
      background: {
        style: 'clean',
        primaryColor: '#FFFFFF',
        opacity: 1,
      },
      reasoning: 'Professional layout for comfortable reading.',
    };
  }
}

// ============================================
// STEP 6: PREMIUM COVER DESIGN
// ============================================

export async function generatePremiumCoverDesign(
  input: BookDesignInput,
  theme: ThemeAnalysis,
  typography: PremiumTypography
): Promise<PremiumCoverDesign> {
  const isHebrew = input.language === 'he' || /[\u0590-\u05FF]/.test(input.title);
  const genrePreset = GENRE_DESIGN_PRESETS[input.genre.toLowerCase()] || GENRE_DESIGN_PRESETS.default;

  const prompt = `You are a world-famous book cover designer who creates STUNNING, award-winning covers.

BOOK: "${input.title}" by ${input.authorName}
GENRE: ${input.genre}
LANGUAGE: ${isHebrew ? 'Hebrew' : 'English'}

DEEP THEME ANALYSIS:
- Primary Theme: ${theme.primaryTheme}
- Mood: ${theme.mood}
- Atmosphere: ${theme.atmosphere}
- Visual Style: ${theme.visualStyle}
- Color Mood: ${theme.colorMood}
- Era: ${theme.era}
- Setting: ${theme.setting}
- Keywords: ${theme.keywords.join(', ')}

SYNOPSIS: ${input.synopsis || 'Not provided'}

FIRST CHAPTER (for context):
${input.chapters[0]?.content.slice(0, 1500) || 'Not available'}

TYPOGRAPHY:
- Title Font: ${typography.titleFont}
- Body Font: ${typography.bodyFont}
- Colors: ${JSON.stringify(typography.colors)}

STYLE GUIDANCE:
- Cover Style: ${genrePreset.cover.style}
- Composition: ${genrePreset.cover.composition}
- Color Palette: ${genrePreset.colors.palette.join(', ')}

YOUR MISSION:
Create an ABSOLUTELY STUNNING book cover that:
1. PERFECTLY captures the book's essence and theme
2. Would stand out on any bookshelf
3. Creates immediate emotional impact
4. Works beautifully with the title text overlay
5. Is appropriate for the ${input.genre} genre
6. Would be worthy of a bestseller

For the IMAGE PROMPT, be EXTREMELY DETAILED and SPECIFIC:
- Describe exact visual elements, composition, lighting
- Specify art style (photorealistic, illustration, painterly, etc.)
- Include mood, atmosphere, colors
- Mention what should NOT be in the image
- Make it at least 200 characters

Respond with ONLY valid JSON:
{
  "front": {
    "imagePrompt": "EXTREMELY DETAILED prompt for AI image generation - be very specific about composition, style, mood, colors, elements, lighting. At least 200 characters. This will be used to generate a STUNNING cover image.",
    "composition": "full-bleed",
    "title": {
      "text": "${input.title}",
      "font": "${typography.titleFont}",
      "size": 56,
      "color": "#ffffff",
      "strokeColor": "#000000",
      "strokeWidth": 2,
      "position": { "x": 50, "y": 35 },
      "alignment": "center",
      "shadow": { "color": "rgba(0,0,0,0.5)", "blur": 10, "offset": { "x": 2, "y": 2 } }
    },
    "author": {
      "text": "${input.authorName}",
      "font": "${typography.bodyFont}",
      "size": 20,
      "color": "#ffffff",
      "position": { "x": 50, "y": 88 },
      "prefix": "${isHebrew ? 'מאת' : 'by'}"
    },
    "colorPalette": ["#color1", "#color2", "#color3", "#color4"]
  },
  "back": {
    "imagePrompt": "Subtle, sophisticated background that complements the front cover - good for text overlay, muted version of front style",
    "layout": "centered",
    "synopsis": {
      "text": "${(input.synopsis || '').slice(0, 400)}",
      "font": "${typography.bodyFont}",
      "size": 12,
      "color": "#text color",
      "maxLines": 15
    },
    "barcode": {
      "position": { "x": 75, "y": 90 },
      "size": { "width": 80, "height": 40 }
    },
    "backgroundColor": "#dark color"
  },
  "spine": {
    "title": "${input.title}",
    "author": "${input.authorName}",
    "font": "${typography.titleFont}",
    "titleSize": 14,
    "authorSize": 10,
    "color": "#ffffff",
    "backgroundColor": "#from palette",
    "orientation": "top-to-bottom"
  },
  "style": {
    "genre": "${input.genre}",
    "mood": "${theme.mood}",
    "era": "${theme.era}",
    "visualTheme": "${theme.visualStyle}"
  },
  "reasoning": "4-5 sentences explaining your cover design concept and how it perfectly captures the book's essence"
}`;

  try {
    const result = await generateWithBreaker(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    return JSON.parse(jsonMatch[0]) as PremiumCoverDesign;
  } catch (error) {
    console.error('Premium cover design error:', error);
    const palette = genrePreset.colors.palette;
    return {
      front: {
        imagePrompt: `Stunning professional book cover art for "${input.title}", a ${input.genre} book. ${theme.mood} atmosphere, ${theme.colorMood} color palette. ${theme.visualStyle} style. Cinematic lighting, high quality, suitable for book cover with text overlay. ${theme.keywords.join(', ')}.`,
        composition: 'full-bleed',
        title: {
          text: input.title,
          font: typography.titleFont,
          size: 56,
          color: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 2,
          position: { x: 50, y: 35 },
          alignment: 'center',
          shadow: { color: 'rgba(0,0,0,0.5)', blur: 10, offset: { x: 2, y: 2 } },
        },
        author: {
          text: input.authorName,
          font: typography.bodyFont,
          size: 20,
          color: '#ffffff',
          position: { x: 50, y: 88 },
          prefix: isHebrew ? 'מאת' : 'by',
        },
        colorPalette: palette,
      },
      back: {
        imagePrompt: `Subtle atmospheric background for ${input.genre} book back cover, muted and elegant, good for text readability`,
        layout: 'centered',
        synopsis: {
          text: input.synopsis || '',
          font: typography.bodyFont,
          size: 12,
          color: '#ffffff',
          maxLines: 15,
        },
        barcode: {
          position: { x: 75, y: 90 },
          size: { width: 80, height: 40 },
        },
        backgroundColor: palette[0] || '#1a1a2e',
      },
      spine: {
        title: input.title,
        author: input.authorName,
        font: typography.titleFont,
        titleSize: 14,
        authorSize: 10,
        color: '#ffffff',
        backgroundColor: palette[1] || '#16213e',
        orientation: 'top-to-bottom',
      },
      style: {
        genre: input.genre,
        mood: theme.mood,
        era: theme.era,
        visualTheme: theme.visualStyle,
      },
      reasoning: 'Professional cover design based on genre conventions and theme analysis.',
    };
  }
}

// ============================================
// STEP 7: INTELLIGENT IMAGE PLACEMENTS
// ============================================

export async function generateSmartImagePlacements(
  input: BookDesignInput,
  theme: ThemeAnalysis
): Promise<ImagePlacement[]> {
  const placements: ImagePlacement[] = [];

  // Only analyze chapters with substantial content
  const significantChapters = input.chapters.filter(ch => ch.wordCount >= 300);

  for (let i = 0; i < Math.min(significantChapters.length, 10); i++) {
    const chapter = significantChapters[i];
    const originalIndex = input.chapters.indexOf(chapter);

    const prompt = `You are a professional book illustrator consultant. Analyze this chapter to find the BEST moments for illustrations.

BOOK: "${input.title}" (${input.genre})
THEME: ${theme.mood}, ${theme.atmosphere}
VISUAL STYLE: ${theme.visualStyle}

CHAPTER ${originalIndex + 1}: "${chapter.title}"
CONTENT:
${chapter.content.slice(0, 3000)}

TASK:
Find 1-2 PERFECT moments in this chapter that would create STUNNING illustrations.

Look for:
1. Powerful visual scenes with dramatic potential
2. Emotional climaxes or turning points
3. Character introductions or transformations
4. Beautiful settings or locations
5. Action sequences or dramatic moments

For each suggestion:
- Choose the BEST aspect ratio for the scene
- Create a DETAILED, VIVID image prompt (150+ characters)
- Consider how it fits the book's overall visual style

Respond with ONLY valid JSON array:
[
  {
    "pagePosition": "chapter-start",
    "imagePosition": "center",
    "aspectRatio": "4:3",
    "frame": "shadow",
    "textContext": "Brief quote or description (max 80 chars)",
    "suggestedPrompt": "DETAILED AI image prompt - specify style, mood, composition, lighting, colors, elements. Be very specific! 150+ characters.",
    "importance": "high",
    "reasoning": "Why this moment deserves an illustration"
  }
]

If no good moments found, return: []

Values for pagePosition: "chapter-start", "mid-chapter", "chapter-end", "full-page"
Values for imagePosition: "top", "center", "bottom", "left", "right", "full-bleed"
Values for aspectRatio: "1:1", "4:3", "3:4", "16:9", "9:16"
Values for frame: "none", "thin-border", "shadow", "rounded", "decorative"
Values for importance: "essential", "high", "medium", "low"`;

    try {
      const result = await generateWithBreaker(prompt);
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const chapterSuggestions = JSON.parse(jsonMatch[0]) as Array<Omit<ImagePlacement, 'chapterIndex'>>;

        for (const suggestion of chapterSuggestions) {
          placements.push({
            ...suggestion,
            chapterIndex: originalIndex,
          });
        }
      }
    } catch (error) {
      console.error(`Error analyzing chapter ${originalIndex + 1}:`, error);
    }
  }

  // Sort by importance
  const importanceOrder = { essential: 0, high: 1, medium: 2, low: 3 };
  placements.sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);

  return placements;
}

// ============================================
// MAIN: GENERATE ULTIMATE PREMIUM DESIGN
// ============================================

export interface PremiumDesignProgress {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  percentage: number;
}

export async function generateUltimatePremiumDesign(
  input: BookDesignInput,
  onProgress?: (progress: PremiumDesignProgress) => void,
  options: {
    generateCoverImages?: boolean;
    generateInteriorImages?: boolean;
    maxInteriorImages?: number;
  } = {}
): Promise<PremiumCompleteDesign> {
  const {
    generateCoverImages = true,
    generateInteriorImages = true,
    maxInteriorImages = 5,
  } = options;

  const totalSteps = generateInteriorImages ? 9 : 7;
  let currentStep = 0;

  const reportProgress = (stepName: string) => {
    currentStep++;
    const percentage = Math.round((currentStep / totalSteps) * 100);
    if (onProgress) {
      onProgress({ currentStep, totalSteps, stepName, percentage });
    }
    console.log(`  🎨 Step ${currentStep}/${totalSteps} (${percentage}%): ${stepName}`);
  };

  console.log(`\n✨ Starting ULTIMATE PREMIUM DESIGN for "${input.title}"...`);
  console.log(`   Genre: ${input.genre}`);
  console.log(`   Chapters: ${input.chapters.length}`);
  console.log(`   Options: Covers=${generateCoverImages}, Interior=${generateInteriorImages}\n`);

  // Step 1: Deep Theme Analysis (required by everything)
  reportProgress('Analyzing book theme and essence...');
  const theme = await analyzeBookTheme(input);
  console.log(`   → Theme: ${theme.primaryTheme}`);
  console.log(`   → Mood: ${theme.mood}, Atmosphere: ${theme.atmosphere}`);

  // Step 2: Premium Typography (required by steps 3-6)
  reportProgress('Creating premium typography system...');
  const typography = await generatePremiumTypography(input, theme);
  console.log(`   → Fonts: ${typography.bodyFont} / ${typography.headingFont}`);

  // Steps 3-6 + image placements run IN PARALLEL (all only need theme + typography)
  reportProgress('Designing layout, cover, and images in parallel...');

  const parallelTasks: Promise<any>[] = [
    generateTableOfContentsDesign(input, theme, typography),       // [0] TOC
    generateChapterDecoration(input, theme, typography),            // [1] Chapter decoration
    generatePremiumPageLayout(input, theme, typography),            // [2] Layout
    generatePremiumCoverDesign(input, theme, typography),           // [3] Cover
  ];

  // Image placements can also run in parallel (only needs theme)
  if (generateInteriorImages) {
    parallelTasks.push(generateSmartImagePlacements(input, theme)); // [4] Image placements
  }

  const parallelResults = await Promise.all(parallelTasks);

  const tableOfContents = parallelResults[0];
  const chapterDecoration = parallelResults[1];
  const layout = parallelResults[2];
  const cover = parallelResults[3];
  const imagePlacements: ImagePlacement[] = generateInteriorImages ? (parallelResults[4] || []) : [];

  console.log(`   → TOC Style: ${tableOfContents.style}`);
  console.log(`   → Chapter Style: ${chapterDecoration.headerStyle}`);
  console.log(`   → Layout: ${layout.pageSize}, ${layout.chapterStartStyle}`);
  console.log(`   → Cover Style: ${cover.style.visualTheme}`);
  if (generateInteriorImages) console.log(`   → Found ${imagePlacements.length} image opportunities`);

  // Cover images + interior images can ALSO run in parallel
  reportProgress('Generating images...');

  let covers = {
    frontImageUrl: undefined as string | undefined,
    backImageUrl: undefined as string | undefined,
    spineImageUrl: undefined as string | undefined,
  };
  let generatedImages: Array<{ chapterIndex: number; imageUrl: string; prompt: string; position: string }> = [];

  const imagePromises: Promise<void>[] = [];

  // Cover image generation
  if (generateCoverImages) {
    imagePromises.push((async () => {
      try {
        const coverResults = await generateBookCovers({
          title: input.title,
          author: input.authorName,
          genre: input.genre,
          synopsis: input.synopsis,
          mood: `${theme.mood}, ${theme.atmosphere}, ${theme.colorMood}`,
          style: theme.visualStyle,
          customPrompt: cover.front.imagePrompt,
        });

        if (coverResults.frontCover.success && coverResults.frontCover.imageUrl) {
          covers.frontImageUrl = coverResults.frontCover.imageUrl;
          cover.front.imageUrl = coverResults.frontCover.imageUrl;
        }
        if (coverResults.backCover?.success && coverResults.backCover.imageUrl) {
          covers.backImageUrl = coverResults.backCover.imageUrl;
          cover.back.imageUrl = coverResults.backCover.imageUrl;
        }
        if (coverResults.spine?.success && coverResults.spine.imageUrl) {
          covers.spineImageUrl = coverResults.spine.imageUrl;
        }
        console.log(`   → Covers Generated: Front=${!!covers.frontImageUrl}, Back=${!!covers.backImageUrl}`);
      } catch (error) {
        console.error('   → Cover generation error:', error);
      }
    })());
  }

  // Interior image generation (runs in parallel with cover images)
  if (generateInteriorImages && imagePlacements.length > 0) {
    imagePromises.push((async () => {
      const topPlacements = imagePlacements.slice(0, maxInteriorImages);
      const bookPlacements: BookImagePlacement[] = topPlacements.map((p) => ({
        chapterIndex: p.chapterIndex,
        pagePosition: p.pagePosition,
        imagePosition: p.imagePosition as 'top' | 'center' | 'bottom' | 'left' | 'right' | 'full-bleed',
        prompt: p.suggestedPrompt,
      }));

      try {
        const interiorResults = await generateBookInteriorImages(bookPlacements, {
          title: input.title,
          genre: input.genre,
        });

        interiorResults.forEach((result, idx) => {
          if (result.success && result.imageUrl) {
            generatedImages.push({
              chapterIndex: topPlacements[idx].chapterIndex,
              imageUrl: result.imageUrl,
              prompt: result.prompt,
              position: topPlacements[idx].pagePosition,
            });
          }
        });
        console.log(`   → Generated ${generatedImages.length} interior images`);
      } catch (error) {
        console.error('   → Interior image generation error:', error);
      }
    })());
  }

  await Promise.all(imagePromises);

  // Calculate quality score
  const qualityScore = calculateDesignQuality({
    hasThemeAnalysis: true,
    hasTypography: true,
    hasTOC: true,
    hasChapterDecoration: true,
    hasLayout: true,
    hasCover: true,
    hasFrontImage: !!covers.frontImageUrl,
    hasBackImage: !!covers.backImageUrl,
    hasImagePlacements: imagePlacements.length > 0,
    hasGeneratedImages: generatedImages.length > 0,
  });

  // Generate overall style description
  const overallStyle = `${theme.visualStyle} ${input.genre} design with ${theme.mood} atmosphere. Typography uses ${typography.bodyFont} and ${typography.headingFont}. Color palette inspired by ${theme.colorMood}.`;

  console.log(`\n✅ ULTIMATE PREMIUM DESIGN COMPLETE!`);
  console.log(`   Quality Score: ${qualityScore}/100`);
  console.log(`   Theme: ${theme.mood} ${theme.atmosphere}`);
  console.log(`   Typography: ${typography.bodyFont} / ${typography.headingFont}`);
  console.log(`   Covers: ${covers.frontImageUrl ? '✓' : '✗'} front, ${covers.backImageUrl ? '✓' : '✗'} back`);
  console.log(`   Images: ${generatedImages.length} interior illustrations\n`);

  return {
    theme,
    typography,
    tableOfContents,
    chapterDecoration,
    layout,
    cover,
    imagePlacements,
    covers,
    generatedImages,
    overallStyle,
    moodDescription: cover.reasoning,
    qualityScore,
    generatedAt: new Date(),
  };
}

function calculateDesignQuality(factors: Record<string, boolean>): number {
  const weights = {
    hasThemeAnalysis: 10,
    hasTypography: 15,
    hasTOC: 10,
    hasChapterDecoration: 10,
    hasLayout: 15,
    hasCover: 15,
    hasFrontImage: 10,
    hasBackImage: 5,
    hasImagePlacements: 5,
    hasGeneratedImages: 5,
  };

  let score = 0;
  for (const [key, value] of Object.entries(factors)) {
    if (value && weights[key as keyof typeof weights]) {
      score += weights[key as keyof typeof weights];
    }
  }

  return score;
}

// ============================================
// FAST SINGLE-CALL DESIGN (1 AI call instead of 6+)
// ============================================

export async function generateFastDesign(
  input: BookDesignInput,
  onProgress?: (progress: PremiumDesignProgress) => void,
): Promise<PremiumCompleteDesign> {
  const isHebrew = input.language === 'he' || /[\u0590-\u05FF]/.test(input.title);
  const hebrewFonts = 'David Libre, Heebo, Secular One, Suez One, Rubik, Frank Ruhl Libre';

  if (onProgress) onProgress({ currentStep: 1, totalSteps: 2, stepName: 'מעצב...', percentage: 10 });

  const prompt = `Design a book. Title: "${input.title}", Genre: ${input.genre}, Language: ${isHebrew ? 'Hebrew' : 'English'}.
Synopsis: ${(input.synopsis || '').slice(0, 300)}

Return JSON only:
{"theme":{"primaryTheme":"...","mood":"...","visualStyle":"...","colorMood":"...","keywords":["..."]},"typography":{"bodyFont":"${isHebrew ? 'David Libre' : 'Merriweather'}","headingFont":"${isHebrew ? 'Secular One' : 'Playfair Display'}","titleFont":"${isHebrew ? 'Suez One' : 'Playfair Display'}","colors":{"text":"#2c2c2c","heading":"#1a1a2e","accent":"#8b6914"}},"cover":{"front":{"colorPalette":["#hex1","#hex2","#hex3"],"backgroundColor":"#1a1a2e"},"spine":{"backgroundColor":"#accent"},"reasoning":"..."}${isHebrew ? `\nUse ONLY these Hebrew fonts: ${hebrewFonts}` : ''}}`;

  try {
    const result = await generateWithBreaker(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error('Invalid response');

    const design = JSON.parse(jsonMatch[0]);

    if (onProgress) onProgress({ currentStep: 2, totalSteps: 2, stepName: 'שומר עיצוב...', percentage: 90 });

    // Build the full PremiumCompleteDesign from the single response
    return {
      theme: design.theme || { primaryTheme: input.genre, mood: 'professional', atmosphere: 'clean', emotionalTone: 'engaged', visualStyle: 'modern', colorMood: 'warm tones', era: 'contemporary', setting: 'general', keywords: [input.genre] },
      typography: {
        bodyFont: design.typography?.bodyFont || 'David Libre',
        headingFont: design.typography?.headingFont || 'Secular One',
        titleFont: design.typography?.titleFont || 'Suez One',
        accentFont: design.typography?.accentFont || design.typography?.headingFont || 'Secular One',
        fontSize: design.typography?.fontSize || 12,
        lineHeight: design.typography?.lineHeight || 1.7,
        chapterTitleSize: design.typography?.chapterTitleSize || 28,
        sectionTitleSize: design.typography?.sectionTitleSize || 18,
        pageNumberSize: design.typography?.pageNumberSize || 10,
        paragraphSpacing: design.typography?.paragraphSpacing || 12,
        colors: {
          text: design.typography?.colors?.text || '#2c2c2c',
          heading: design.typography?.colors?.heading || '#1a1a2e',
          accent: design.typography?.colors?.accent || '#8b6914',
          highlight: design.typography?.colors?.highlight || '#d4a853',
          quote: design.typography?.colors?.quote || '#555555',
          pageNumber: design.typography?.colors?.pageNumber || '#999999',
        },
        formatting: design.typography?.formatting || { dropCaps: 'simple', quoteStyle: 'italic', emphasis: 'bold', firstParagraphIndent: false },
      },
      tableOfContents: design.tableOfContents || { style: 'elegant', title: { text: isHebrew ? 'תוכן עניינים' : 'Contents', font: 'Secular One', size: 24, color: '#1a1a2e' }, entryStyle: { font: 'David Libre', size: 12, color: '#333', pageNumberFormat: 'dotted-line' }, decorative: true, dividerStyle: 'ornament' },
      chapterDecoration: design.chapterDecoration || { headerStyle: 'centered', numberStyle: 'word', numberPosition: 'above-title', titleDecoration: 'ornament', openingOrnament: '✦', closingOrnament: '✦', spacing: { beforeTitle: 40, afterTitle: 20, beforeContent: 15 } },
      layout: {
        pageSize: design.layout?.pageSize || 'A5',
        margins: design.layout?.margins || { top: 35, bottom: 30, inner: 30, outer: 25 },
        columns: design.layout?.columns || 1,
        chapterStartStyle: design.layout?.chapterStartStyle || 'new-page-centered',
        pageNumbering: design.layout?.pageNumbering || { enabled: true, position: 'bottom-center', style: 'numeric', startFrom: 1 },
        headers: design.layout?.headers || { enabled: true, style: 'chapter-title', separator: 'ornament' },
        footers: design.layout?.footers || { enabled: false },
        dropCaps: design.layout?.dropCaps || { enabled: true, style: 'simple', lines: 3 },
        sectionBreaks: design.layout?.sectionBreaks || { style: 'ornament', ornament: '✦' },
        background: design.layout?.background || { style: 'clean', primaryColor: '#fffdf7', secondaryColor: '#faf6ee' },
      },
      cover: design.cover || {
        front: { imagePrompt: `Professional book cover for "${input.title}"`, composition: 'centered', title: { text: input.title, font: 'Suez One', size: 48, color: '#fff', position: 'center' }, author: { text: input.authorName, font: 'David Libre', size: 18, color: '#fff' }, colorPalette: ['#6366f1', '#8b5cf6', '#a855f7'], backgroundColor: '#1a1a2e' },
        back: { synopsis: { text: '', font: 'David Libre', size: 14, color: '#fff' }, author: { text: input.authorName, font: 'David Libre', size: 16, color: '#fff' }, backgroundColor: '#1a1a2e' },
        spine: { title: input.title, author: input.authorName, font: 'David Libre', color: '#fff', backgroundColor: '#6366f1' },
        style: { genre: input.genre, mood: 'professional', visualTheme: 'modern' },
        reasoning: 'Professional design matching the book genre',
      },
      imagePlacements: [],
      covers: { frontImageUrl: undefined, backImageUrl: undefined, spineImageUrl: undefined },
      generatedImages: [],
      overallStyle: `${design.theme?.visualStyle || 'professional'} ${input.genre} design`,
      moodDescription: design.cover?.reasoning || design.theme?.mood || 'professional',
      qualityScore: 75,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error('Fast design generation failed:', error);
    throw error;
  }
}

// ============================================
// EXPORT: CONVERT TO BOOK MODEL FORMAT
// ============================================

export function convertPremiumDesignToBookState(design: PremiumCompleteDesign): any {
  return {
    status: 'completed',
    completedAt: new Date(),
    design: {
      theme: design.theme,
      typography: {
        bodyFont: design.typography.bodyFont,
        headingFont: design.typography.headingFont,
        titleFont: design.typography.titleFont,
        accentFont: design.typography.accentFont,
        fontSize: design.typography.fontSize,
        lineHeight: design.typography.lineHeight,
        letterSpacing: design.typography.letterSpacing,
        paragraphSpacing: design.typography.paragraphSpacing,
        chapterTitleSize: design.typography.chapterTitleSize,
        sectionTitleSize: design.typography.sectionTitleSize,
        colors: design.typography.colors,
        formatting: design.typography.formatting,
      },
      tableOfContents: design.tableOfContents,
      chapterDecoration: design.chapterDecoration,
      layout: {
        pageSize: design.layout.pageSize,
        margins: design.layout.margins,
        columns: design.layout.columns,
        chapterStartStyle: design.layout.chapterStartStyle,
        pageNumbering: design.layout.pageNumbering,
        headers: design.layout.headers,
        footers: design.layout.footers,
        dropCaps: design.layout.dropCaps,
        sectionBreaks: design.layout.sectionBreaks,
        background: design.layout.background,
      },
      cover: {
        front: design.cover.front,
        back: design.cover.back,
        spine: design.cover.spine,
        style: design.cover.style,
      },
      imagePlacements: design.imagePlacements,
      covers: design.covers,
      generatedImages: design.generatedImages,
      overallStyle: design.overallStyle,
      moodDescription: design.moodDescription,
      qualityScore: design.qualityScore,
    },
  };
}
