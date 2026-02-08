import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Lazy-initialize Gemini AI client (only when API key is available)
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
    modelInstance = genAIClient.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }
  return modelInstance;
}

// ============================================
// TYPE DEFINITIONS
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

export interface TypographyDesign {
  bodyFont: string;
  headingFont: string;
  titleFont: string;
  fontSize: number; // pt
  lineHeight: number;
  chapterTitleSize: number;
  pageNumberSize: number;
  colors: {
    text: string;
    heading: string;
    accent: string;
  };
  reasoning: string;
}

export interface PageLayoutDesign {
  margins: {
    top: number;
    bottom: number;
    inner: number; // Closer to spine
    outer: number;
  };
  chapterStartStyle: 'same-page' | 'new-page' | 'new-page-centered';
  pageNumberPosition: 'bottom-center' | 'bottom-outer' | 'top-outer' | 'none';
  headerStyle: 'none' | 'book-title' | 'chapter-title' | 'author-name';
  dropCaps: boolean;
  ornaments: boolean; // Decorative elements between sections
  reasoning: string;
}

export interface ImagePlacementSuggestion {
  chapterIndex: number;
  position: 'chapter-start' | 'mid-chapter' | 'chapter-end';
  textContext: string; // The relevant text snippet
  suggestedPrompt: string;
  importance: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface CoverDesign {
  front: {
    imagePrompt: string;
    imageUrl?: string;
    title: {
      text: string;
      font: string;
      size: number;
      color: string;
      position: 'top' | 'center' | 'bottom';
      alignment: 'left' | 'center' | 'right';
    };
    author: {
      text: string;
      font: string;
      size: number;
      color: string;
      position: 'top' | 'bottom';
    };
    colorPalette: string[];
  };
  back: {
    imagePrompt: string; // Same style as front but blurred/toned down
    imageUrl?: string;
    synopsis: {
      text: string;
      font: string;
      size: number;
      color: string;
    };
    author: {
      text: string;
      font: string;
      size: number;
      color: string;
    };
    backgroundColor: string;
  };
  spine: {
    title: string;
    author: string;
    font: string;
    color: string;
    backgroundColor: string;
  };
  reasoning: string;
}

export interface CompleteBookDesign {
  typography: TypographyDesign;
  layout: PageLayoutDesign;
  cover: CoverDesign;
  imagePlacements: ImagePlacementSuggestion[];
  overallStyle: string;
  moodDescription: string;
  generatedAt: Date;
}

// ============================================
// FONT DATABASE
// ============================================

const FONT_DATABASE = {
  hebrew: {
    serif: ['David Libre', 'Frank Ruhl Libre', 'Heebo', 'Assistant'],
    sansSerif: ['Heebo', 'Assistant', 'Rubik', 'Open Sans Hebrew'],
    display: ['Secular One', 'Suez One', 'Alef'],
    handwriting: ['Amatic SC', 'Varela Round'],
  },
  english: {
    serif: ['Playfair Display', 'Merriweather', 'Lora', 'Crimson Text', 'EB Garamond'],
    sansSerif: ['Inter', 'Open Sans', 'Roboto', 'Lato', 'Source Sans Pro'],
    display: ['Bebas Neue', 'Oswald', 'Montserrat', 'Poppins'],
    handwriting: ['Dancing Script', 'Pacifico', 'Caveat', 'Great Vibes'],
  },
};

const GENRE_FONT_MAPPING: Record<string, { body: string; heading: string; title: string }> = {
  'fantasy': { body: 'serif', heading: 'display', title: 'display' },
  'romance': { body: 'serif', heading: 'handwriting', title: 'handwriting' },
  'thriller': { body: 'sansSerif', heading: 'display', title: 'display' },
  'sci-fi': { body: 'sansSerif', heading: 'sansSerif', title: 'display' },
  'mystery': { body: 'serif', heading: 'serif', title: 'display' },
  'horror': { body: 'serif', heading: 'display', title: 'display' },
  'literary': { body: 'serif', heading: 'serif', title: 'serif' },
  'children': { body: 'sansSerif', heading: 'display', title: 'handwriting' },
  'young-adult': { body: 'sansSerif', heading: 'display', title: 'display' },
  'historical': { body: 'serif', heading: 'serif', title: 'serif' },
  'biography': { body: 'serif', heading: 'sansSerif', title: 'sansSerif' },
  'self-help': { body: 'sansSerif', heading: 'sansSerif', title: 'display' },
  'default': { body: 'serif', heading: 'serif', title: 'display' },
};

// ============================================
// TYPOGRAPHY DESIGN
// ============================================

export async function generateTypographyDesign(input: BookDesignInput): Promise<TypographyDesign> {
  const isHebrew = input.language === 'he' || /[\u0590-\u05FF]/.test(input.title);
  const fontDb = isHebrew ? FONT_DATABASE.hebrew : FONT_DATABASE.english;
  const genreMapping = GENRE_FONT_MAPPING[input.genre.toLowerCase()] || GENRE_FONT_MAPPING.default;

  const prompt = `You are a professional book designer and typographer. Analyze this book and recommend the best typography design.

BOOK INFORMATION:
Title: "${input.title}"
Genre: ${input.genre}
Language: ${isHebrew ? 'Hebrew' : 'English'}
Target Audience: ${input.targetAudience || 'General'}
Synopsis: ${input.synopsis || 'Not provided'}

AVAILABLE FONTS:
Body fonts: ${fontDb[genreMapping.body as keyof typeof fontDb].join(', ')}
Heading fonts: ${fontDb[genreMapping.heading as keyof typeof fontDb].join(', ')}
Title fonts: ${fontDb[genreMapping.title as keyof typeof fontDb].join(', ')}

TASK:
Design the typography for this book. Consider:
1. The genre and its conventions
2. The target audience (readability for children vs adults)
3. The mood and tone of the book
4. Hebrew/English specific considerations (RTL, font legibility)

Respond with ONLY valid JSON in this exact format:
{
  "bodyFont": "font name from available fonts",
  "headingFont": "font name for chapter headings",
  "titleFont": "font name for book title on cover",
  "fontSize": 12,
  "lineHeight": 1.6,
  "chapterTitleSize": 24,
  "pageNumberSize": 10,
  "colors": {
    "text": "#hex color for body text",
    "heading": "#hex color for headings",
    "accent": "#hex color for decorative elements"
  },
  "reasoning": "2-3 sentences explaining your typography choices"
}`;

  try {
    const result = await getGeminiModel().generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const typography = JSON.parse(jsonMatch[0]) as TypographyDesign;

    // Validate and fallback
    const bodyFonts = fontDb[genreMapping.body as keyof typeof fontDb];
    const headingFonts = fontDb[genreMapping.heading as keyof typeof fontDb];
    const titleFonts = fontDb[genreMapping.title as keyof typeof fontDb];

    if (!bodyFonts.includes(typography.bodyFont)) {
      typography.bodyFont = bodyFonts[0];
    }
    if (!headingFonts.includes(typography.headingFont)) {
      typography.headingFont = headingFonts[0];
    }
    if (!titleFonts.includes(typography.titleFont)) {
      typography.titleFont = titleFonts[0];
    }

    return typography;
  } catch (error) {
    console.error('Typography generation error:', error);
    // Return sensible defaults
    const bodyFonts = fontDb[genreMapping.body as keyof typeof fontDb];
    const headingFonts = fontDb[genreMapping.heading as keyof typeof fontDb];
    const titleFonts = fontDb[genreMapping.title as keyof typeof fontDb];

    return {
      bodyFont: bodyFonts[0],
      headingFont: headingFonts[0],
      titleFont: titleFonts[0],
      fontSize: 12,
      lineHeight: 1.6,
      chapterTitleSize: 24,
      pageNumberSize: 10,
      colors: {
        text: '#1a1a2e',
        heading: '#16213e',
        accent: '#e94560',
      },
      reasoning: 'Default typography based on genre conventions.',
    };
  }
}

// ============================================
// PAGE LAYOUT DESIGN
// ============================================

export async function generatePageLayoutDesign(input: BookDesignInput): Promise<PageLayoutDesign> {
  const isHebrew = input.language === 'he' || /[\u0590-\u05FF]/.test(input.title);
  const totalWordCount = input.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  const estimatedPages = Math.ceil(totalWordCount / 250);

  const prompt = `You are a professional book designer specializing in page layout and formatting.

BOOK INFORMATION:
Title: "${input.title}"
Genre: ${input.genre}
Language: ${isHebrew ? 'Hebrew (RTL)' : 'English (LTR)'}
Total Chapters: ${input.chapters.length}
Estimated Pages: ${estimatedPages}
Target Audience: ${input.targetAudience || 'General'}

TASK:
Design the page layout for this book. Consider:
1. Genre conventions (literary books often have wider margins, thrillers are more compact)
2. Reading comfort and eye flow
3. RTL vs LTR considerations
4. How chapters should begin (on same page, new page, or centered new page)
5. Page numbers and headers

Respond with ONLY valid JSON:
{
  "margins": {
    "top": 60,
    "bottom": 60,
    "inner": 70,
    "outer": 50
  },
  "chapterStartStyle": "new-page-centered",
  "pageNumberPosition": "bottom-outer",
  "headerStyle": "chapter-title",
  "dropCaps": true,
  "ornaments": false,
  "reasoning": "2-3 sentences explaining your layout choices"
}

Values for chapterStartStyle: "same-page" | "new-page" | "new-page-centered"
Values for pageNumberPosition: "bottom-center" | "bottom-outer" | "top-outer" | "none"
Values for headerStyle: "none" | "book-title" | "chapter-title" | "author-name"`;

  try {
    const result = await getGeminiModel().generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    return JSON.parse(jsonMatch[0]) as PageLayoutDesign;
  } catch (error) {
    console.error('Layout generation error:', error);
    return {
      margins: { top: 60, bottom: 60, inner: 70, outer: 50 },
      chapterStartStyle: 'new-page-centered',
      pageNumberPosition: 'bottom-outer',
      headerStyle: 'chapter-title',
      dropCaps: true,
      ornaments: false,
      reasoning: 'Default layout based on standard book conventions.',
    };
  }
}

// ============================================
// IMAGE PLACEMENT SUGGESTIONS
// ============================================

export async function suggestImagePlacements(input: BookDesignInput): Promise<ImagePlacementSuggestion[]> {
  const suggestions: ImagePlacementSuggestion[] = [];

  // Analyze each chapter for good image opportunities
  for (let i = 0; i < input.chapters.length; i++) {
    const chapter = input.chapters[i];

    // Skip very short chapters
    if (chapter.wordCount < 200) continue;

    const prompt = `You are a professional book illustrator consultant. Analyze this chapter and suggest the best places for illustrations.

BOOK: "${input.title}" (${input.genre})
CHAPTER ${i + 1}: "${chapter.title}"

CHAPTER CONTENT (first 2000 chars):
${chapter.content.slice(0, 2000)}

TASK:
Identify 1-2 moments in this chapter that would benefit from an illustration. Look for:
1. Vivid visual scenes (landscapes, action, emotional moments)
2. Introduction of important characters or settings
3. Climactic or dramatic moments
4. Scenes that are hard to visualize from text alone

For each suggestion, provide a detailed image prompt that could be used with an AI image generator.

Respond with ONLY valid JSON array:
[
  {
    "position": "chapter-start",
    "textContext": "Brief quote or description of the relevant moment (max 100 chars)",
    "suggestedPrompt": "Detailed AI image generation prompt (be specific about style, mood, elements)",
    "importance": "high",
    "reasoning": "Why this moment deserves an illustration"
  }
]

If no illustrations are needed for this chapter, return empty array: []`;

    try {
      const result = await getGeminiModel().generateContent(prompt);
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const chapterSuggestions = JSON.parse(jsonMatch[0]) as Array<Omit<ImagePlacementSuggestion, 'chapterIndex'>>;

        for (const suggestion of chapterSuggestions) {
          suggestions.push({
            ...suggestion,
            chapterIndex: i,
          });
        }
      }
    } catch (error) {
      console.error(`Error analyzing chapter ${i + 1}:`, error);
    }
  }

  // Sort by importance
  const importanceOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);

  return suggestions;
}

// ============================================
// COVER DESIGN
// ============================================

export async function generateCoverDesign(input: BookDesignInput, typography: TypographyDesign): Promise<CoverDesign> {
  const isHebrew = input.language === 'he' || /[\u0590-\u05FF]/.test(input.title);

  const prompt = `You are a professional book cover designer with expertise in visual storytelling.

BOOK INFORMATION:
Title: "${input.title}"
Author: "${input.authorName}"
Genre: ${input.genre}
Language: ${isHebrew ? 'Hebrew' : 'English'}
Synopsis: ${input.synopsis || 'Not provided'}

First chapter excerpt for context:
${input.chapters[0]?.content.slice(0, 1000) || 'Not available'}

TYPOGRAPHY (already selected):
Title Font: ${typography.titleFont}
Body Font: ${typography.bodyFont}

TASK:
Design a complete book cover system including:
1. FRONT COVER: Main image that captures the book's essence
2. BACK COVER: Subtle version of front style with synopsis
3. SPINE: Vertical text treatment

For the front cover image, create a detailed prompt for AI image generation that:
- Captures the core theme/mood of the book
- Is visually striking and marketable
- Works well with text overlay
- Matches genre expectations

For the back cover:
- Use same color palette but more subtle/blurred
- Ensure text readability

Respond with ONLY valid JSON:
{
  "front": {
    "imagePrompt": "Detailed AI image generation prompt (200+ chars, very specific)",
    "title": {
      "text": "${input.title}",
      "font": "${typography.titleFont}",
      "size": 48,
      "color": "#hex",
      "position": "center",
      "alignment": "center"
    },
    "author": {
      "text": "${input.authorName}",
      "font": "${typography.bodyFont}",
      "size": 18,
      "color": "#hex",
      "position": "bottom"
    },
    "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"]
  },
  "back": {
    "imagePrompt": "Subtle version of front - same style but toned down, good for text overlay",
    "synopsis": {
      "text": "${(input.synopsis || 'Synopsis here...').slice(0, 500)}",
      "font": "${typography.bodyFont}",
      "size": 12,
      "color": "#hex"
    },
    "author": {
      "text": "${input.authorName}",
      "font": "${typography.headingFont}",
      "size": 14,
      "color": "#hex"
    },
    "backgroundColor": "#hex"
  },
  "spine": {
    "title": "${input.title}",
    "author": "${input.authorName}",
    "font": "${typography.titleFont}",
    "color": "#hex",
    "backgroundColor": "#hex from palette"
  },
  "reasoning": "3-4 sentences explaining your cover design concept and how it relates to the book"
}`;

  try {
    const result = await getGeminiModel().generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    return JSON.parse(jsonMatch[0]) as CoverDesign;
  } catch (error) {
    console.error('Cover design generation error:', error);
    // Return default cover design
    return {
      front: {
        imagePrompt: `Book cover art for "${input.title}", a ${input.genre} book. Professional, atmospheric, cinematic lighting, high quality illustration suitable for book cover.`,
        title: {
          text: input.title,
          font: typography.titleFont,
          size: 48,
          color: '#ffffff',
          position: 'center',
          alignment: 'center',
        },
        author: {
          text: input.authorName,
          font: typography.bodyFont,
          size: 18,
          color: '#ffffff',
          position: 'bottom',
        },
        colorPalette: ['#1a1a2e', '#16213e', '#0f3460', '#e94560'],
      },
      back: {
        imagePrompt: `Subtle abstract background matching ${input.genre} genre, muted colors, good for text overlay, soft gradient.`,
        synopsis: {
          text: input.synopsis || '',
          font: typography.bodyFont,
          size: 12,
          color: '#ffffff',
        },
        author: {
          text: input.authorName,
          font: typography.headingFont,
          size: 14,
          color: '#ffffff',
        },
        backgroundColor: '#1a1a2e',
      },
      spine: {
        title: input.title,
        author: input.authorName,
        font: typography.titleFont,
        color: '#ffffff',
        backgroundColor: '#16213e',
      },
      reasoning: 'Default cover design based on genre conventions.',
    };
  }
}

// ============================================
// GENERATE COVER IMAGES
// ============================================

async function generateCoverImage(prompt: string): Promise<string | null> {
  try {
    // Use Pollinations.ai for free image generation
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=600&height=900&seed=${Date.now()}`;

    // Download and save locally
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 120000, // 2 minute timeout for cover generation
    });

    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filename = `cover-${crypto.randomUUID()}.png`;
    const filePath = path.join(uploadDir, filename);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, response.data);

    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Cover image generation error:', error);
    return null;
  }
}

// ============================================
// COMPLETE BOOK DESIGN
// ============================================

export async function generateCompleteBookDesign(input: BookDesignInput): Promise<CompleteBookDesign> {
  console.log(`🎨 Generating complete book design for "${input.title}"...`);

  // Generate typography first (other designs depend on it)
  console.log('  → Generating typography...');
  const typography = await generateTypographyDesign(input);

  // Generate layout and cover in parallel
  console.log('  → Generating layout and cover design...');
  const [layout, cover] = await Promise.all([
    generatePageLayoutDesign(input),
    generateCoverDesign(input, typography),
  ]);

  // Generate image placement suggestions
  console.log('  → Analyzing chapters for image placements...');
  const imagePlacements = await suggestImagePlacements(input);

  // Generate actual cover images
  console.log('  → Generating cover images...');
  const [frontImageUrl, backImageUrl] = await Promise.all([
    generateCoverImage(cover.front.imagePrompt),
    generateCoverImage(cover.back.imagePrompt),
  ]);

  if (frontImageUrl) {
    cover.front.imageUrl = frontImageUrl;
  }
  if (backImageUrl) {
    cover.back.imageUrl = backImageUrl;
  }

  // Determine overall style description
  const overallStyle = await generateStyleDescription(input, typography, cover);

  console.log('  ✓ Design generation complete!');

  return {
    typography,
    layout,
    cover,
    imagePlacements,
    overallStyle,
    moodDescription: cover.reasoning,
    generatedAt: new Date(),
  };
}

async function generateStyleDescription(
  input: BookDesignInput,
  typography: TypographyDesign,
  cover: CoverDesign
): Promise<string> {
  const prompt = `Based on these design choices, write a brief 2-sentence style summary:

Book: "${input.title}" (${input.genre})
Typography: ${typography.bodyFont}, ${typography.headingFont}
Colors: ${cover.front.colorPalette.join(', ')}
Cover concept: ${cover.reasoning}

Describe the overall aesthetic in 2 sentences.`;

  try {
    const result = await getGeminiModel().generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return `Professional ${input.genre} design with ${typography.bodyFont} typography and ${cover.front.colorPalette.length > 0 ? 'rich color palette' : 'classic styling'}.`;
  }
}

// ============================================
// APPLY DESIGN TO BOOK
// ============================================

export function applyDesignToPageLayout(
  design: CompleteBookDesign,
  existingLayout: any
): any {
  return {
    ...existingLayout,
    bodyFont: design.typography.bodyFont,
    fontSize: design.typography.fontSize,
    lineHeight: design.typography.lineHeight,
    margins: design.layout.margins,
    showPageNumbers: design.layout.pageNumberPosition !== 'none',
    pageNumberPosition: design.layout.pageNumberPosition,
    headerStyle: design.layout.headerStyle,
    chapterStartStyle: design.layout.chapterStartStyle,
    dropCaps: design.layout.dropCaps,
    ornaments: design.layout.ornaments,
  };
}

export function applyDesignToCoverDesign(design: CompleteBookDesign): any {
  return {
    front: {
      type: design.cover.front.imageUrl ? 'ai-generated' : 'gradient',
      imageUrl: design.cover.front.imageUrl,
      backgroundColor: design.cover.front.colorPalette[0],
      gradientColors: design.cover.front.colorPalette,
      title: design.cover.front.title,
      authorName: design.cover.front.author,
    },
    back: {
      imageUrl: design.cover.back.imageUrl,
      backgroundColor: design.cover.back.backgroundColor,
      synopsis: design.cover.back.synopsis.text,
    },
    spine: design.cover.spine,
  };
}
