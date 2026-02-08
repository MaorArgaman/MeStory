import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

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

// Types for AI responses
export interface WritingSuggestion {
  suggestions: string[];
}

export interface QualityAnalysis {
  scores: {
    writingQuality: number;
    plotStructure: number;
    characterDevelopment: number;
    dialogue: number;
    setting: number;
    originality: number;
  };
  overallScore: number;
  rating: number;
  ratingLabel: 'Masterpiece' | 'Excellent' | 'Good' | 'Fair' | 'Needs Work';
  feedback: string;
  suggestions?: string[];
}

// Voice Interview Summary interface for context
interface VoiceInterviewContext {
  theme?: {
    mainTheme?: string;
    tone?: string;
  };
  characters?: Array<{
    name: string;
    role?: string;
    traits?: string[];
  }>;
  plot?: {
    premise?: string;
    conflict?: string;
    stakes?: string;
  };
  setting?: {
    world?: string;
    atmosphere?: string;
  };
  writingGuidelines?: string[];
}

/**
 * Generate writing continuations using Gemini AI
 * Section 5.2: AI Writing Assistant
 */
export async function generateContinuations(
  currentText: string,
  genre: string,
  context?: {
    bookTitle?: string;
    chapterTitle?: string;
    characters?: string[];
    storyContext?: {
      theme?: string;
      characters?: string;
      conflict?: string;
      setting?: string;
      voiceInterview?: {
        summary?: VoiceInterviewContext;
      };
    };
  }
): Promise<WritingSuggestion> {
  try {
    // Build voice interview context if available
    let voiceInterviewPrompt = '';
    if (context?.storyContext?.voiceInterview?.summary) {
      const vi = context.storyContext.voiceInterview.summary;
      voiceInterviewPrompt = `
STORY BACKGROUND (from author interview):
${vi.theme?.mainTheme ? `Theme: ${vi.theme.mainTheme}` : ''}
${vi.theme?.tone ? `Tone: ${vi.theme.tone}` : ''}
${vi.plot?.conflict ? `Central Conflict: ${vi.plot.conflict}` : ''}
${vi.plot?.stakes ? `Stakes: ${vi.plot.stakes}` : ''}
${vi.setting?.world ? `Setting: ${vi.setting.world}` : ''}
${vi.setting?.atmosphere ? `Atmosphere: ${vi.setting.atmosphere}` : ''}
${vi.characters && vi.characters.length > 0 ? `Main Characters: ${vi.characters.map(c => `${c.name} (${c.role})`).join(', ')}` : ''}
${vi.writingGuidelines && vi.writingGuidelines.length > 0 ? `Writing Guidelines:\n${vi.writingGuidelines.map(g => `- ${g}`).join('\n')}` : ''}
`;
    } else if (context?.storyContext) {
      // Fallback to regular story context
      const sc = context.storyContext;
      voiceInterviewPrompt = `
STORY BACKGROUND:
${sc.theme ? `Theme: ${sc.theme}` : ''}
${sc.conflict ? `Conflict: ${sc.conflict}` : ''}
${sc.setting ? `Setting: ${sc.setting}` : ''}
${sc.characters ? `Characters: ${sc.characters}` : ''}
`;
    }

    const prompt = `You are a professional ${genre} author and writing assistant.

CONTEXT:
${context?.bookTitle ? `Book: "${context.bookTitle}"` : ''}
${context?.chapterTitle ? `Chapter: "${context.chapterTitle}"` : ''}
${context?.characters ? `Characters: ${context.characters.join(', ')}` : ''}
${voiceInterviewPrompt}

CURRENT TEXT:
${currentText.slice(-500)}

TASK:
Continue the story from where it left off. Generate exactly 3 different continuation options (50-100 words each).
Each option should:
- Maintain the same writing style and tone
- Be a natural continuation
- Offer different narrative directions
- Stay true to the ${genre} genre
${context?.storyContext?.voiceInterview ? '- Align with the story background from the author interview' : ''}

Respond ONLY with a JSON array of 3 strings, nothing else:
["option1", "option2", "option3"]`;

    const result = await getGeminiModel().generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON response
    let suggestions: string[];
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: split by quotes if JSON parsing fails
        suggestions = text
          .split('\n')
          .filter(line => line.trim().length > 20)
          .slice(0, 3);
      }
    } catch (parseError) {
      // Fallback: return the raw text split into chunks
      suggestions = [text.slice(0, 200), text.slice(200, 400), text.slice(400, 600)].filter(s => s.length > 0);
    }

    // Ensure we have exactly 3 suggestions
    while (suggestions.length < 3) {
      suggestions.push('Continue writing here...');
    }

    return {
      suggestions: suggestions.slice(0, 3),
    };
  } catch (error: any) {
    console.error('Gemini API error (generateContinuations):', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
      fullError: error
    });
    throw new Error('Failed to generate suggestions. Please try again.');
  }
}

/**
 * Analyze text quality using Gemini AI
 * Section 5.5: Quality Scoring System
 */
export async function analyzeTextQuality(text: string): Promise<QualityAnalysis> {
  try {
    const prompt = `You are a professional literary critic and editor. Analyze the following text and provide a comprehensive quality assessment.

TEXT TO ANALYZE:
${text}

EVALUATION CRITERIA (Section 5.5):
1. Writing Quality (25%): Grammar, vocabulary, readability, sentence structure
2. Plot Structure (20%): Story arc, pacing, tension, coherence
3. Character Development (20%): Depth, consistency, growth, believability
4. Dialogue (15%): Natural flow, distinct voices, purpose
5. Setting (10%): World-building, sensory details, atmosphere
6. Originality (10%): Unique elements, creativity, fresh perspective

SCORING SCALE:
- 90-100: Masterpiece (5 stars)
- 80-89: Excellent (4 stars)
- 70-79: Good (3 stars)
- 60-69: Fair (2 stars)
- Below 60: Needs Work (1 star)

Respond ONLY with valid JSON in this exact format:
{
  "scores": {
    "writingQuality": <number 0-100>,
    "plotStructure": <number 0-100>,
    "characterDevelopment": <number 0-100>,
    "dialogue": <number 0-100>,
    "setting": <number 0-100>,
    "originality": <number 0-100>
  },
  "feedback": "<constructive feedback summary, 2-3 sentences>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}`;

    const result = await getGeminiModel().generateContent(prompt);
    const response = result.response;
    const responseText = response.text();

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);

    // Calculate overall score based on weights (Section 5.5)
    const weights = {
      writingQuality: 0.25,
      plotStructure: 0.20,
      characterDevelopment: 0.20,
      dialogue: 0.15,
      setting: 0.10,
      originality: 0.10,
    };

    const overallScore = Math.round(
      parsedResponse.scores.writingQuality * weights.writingQuality +
      parsedResponse.scores.plotStructure * weights.plotStructure +
      parsedResponse.scores.characterDevelopment * weights.characterDevelopment +
      parsedResponse.scores.dialogue * weights.dialogue +
      parsedResponse.scores.setting * weights.setting +
      parsedResponse.scores.originality * weights.originality
    );

    // Determine rating and label
    let rating: number;
    let ratingLabel: QualityAnalysis['ratingLabel'];

    if (overallScore >= 90) {
      rating = 5;
      ratingLabel = 'Masterpiece';
    } else if (overallScore >= 80) {
      rating = 4;
      ratingLabel = 'Excellent';
    } else if (overallScore >= 70) {
      rating = 3;
      ratingLabel = 'Good';
    } else if (overallScore >= 60) {
      rating = 2;
      ratingLabel = 'Fair';
    } else {
      rating = 1;
      ratingLabel = 'Needs Work';
    }

    return {
      scores: parsedResponse.scores,
      overallScore,
      rating,
      ratingLabel,
      feedback: parsedResponse.feedback,
      suggestions: parsedResponse.suggestions || [],
    };
  } catch (error: any) {
    console.error('Gemini API error (analyzeTextQuality):', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
      fullError: error
    });
    throw new Error('Failed to analyze text quality. Please try again.');
  }
}

/**
 * Enhance text using Gemini AI
 * Section 5.2: Text Enhancement
 */
export async function enhanceText(
  text: string,
  enhancementType: 'rephrase' | 'expand' | 'improve-dialogue' | 'add-sensory' | 'strengthen-verbs'
): Promise<string> {
  try {
    let prompt = '';

    switch (enhancementType) {
      case 'rephrase':
        prompt = `Rephrase the following text to improve clarity and flow while maintaining the original meaning:\n\n${text}\n\nProvide only the rephrased version, no explanations.`;
        break;
      case 'expand':
        prompt = `Expand the following text by adding more detail, description, and depth:\n\n${text}\n\nProvide only the expanded version, no explanations.`;
        break;
      case 'improve-dialogue':
        prompt = `Improve the dialogue in the following text to make it more natural and engaging:\n\n${text}\n\nProvide only the improved version, no explanations.`;
        break;
      case 'add-sensory':
        prompt = `Enhance the following text by adding sensory details (sight, sound, smell, touch, taste):\n\n${text}\n\nProvide only the enhanced version, no explanations.`;
        break;
      case 'strengthen-verbs':
        prompt = `Strengthen the verbs in the following text by replacing weak verbs with more powerful ones:\n\n${text}\n\nProvide only the improved version, no explanations.`;
        break;
    }

    const result = await getGeminiModel().generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error: any) {
    console.error('Gemini API error (enhanceText):', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
      fullError: error
    });
    throw new Error('Failed to enhance text. Please try again.');
  }
}

/**
 * Generate book title suggestions based on genre
 * Used in Create Book Wizard Step 2
 */
export async function generateBookTitles(
  genre: string,
  count: number = 5
): Promise<string[]> {
  try {
    const prompt = `You are a creative book title generator specialized in ${genre} books.

Generate ${count} creative, catchy, and marketable book titles for a ${genre} book.

Requirements:
- Each title should be unique and memorable
- Titles should be appropriate for the ${genre} genre
- Mix of short punchy titles and longer descriptive ones
- Titles should sound professional and publishable
- No explanations, just the titles

Format: Return only the titles, one per line, numbered 1-${count}.`;

    const result = await getGeminiModel().generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // Parse the titles from the response
    const lines = text.split('\n').filter(line => line.trim());
    const titles = lines
      .map(line => line.replace(/^\d+[\.)]\s*/, '').trim())
      .filter(title => title.length > 0)
      .slice(0, count);

    if (titles.length === 0) {
      throw new Error('No titles generated');
    }

    return titles;
  } catch (error: any) {
    console.error('Gemini API error (generateBookTitles):', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
      fullError: error
    });
    throw new Error('Failed to generate book titles. Please try again.');
  }
}

/**
 * Generate compelling synopsis for marketplace
 * Used in Publishing Metadata Editor
 */
export async function generateSynopsis(
  title: string,
  genre: string,
  chapters: Array<{ title: string; content: string }>
): Promise<string> {
  try {
    // Aggregate chapter content (use first 3 chapters or all if less)
    const chaptersToAnalyze = chapters.slice(0, 3);
    const contentSample = chaptersToAnalyze
      .map((ch, idx) => `Chapter ${idx + 1}: ${ch.title}\n${ch.content.slice(0, 1000)}`)
      .join('\n\n---\n\n');

    const prompt = `You are a professional book marketer and copywriter. Your task is to write a compelling book synopsis for the marketplace.

BOOK INFORMATION:
Title: "${title}"
Genre: ${genre}
Number of Chapters: ${chapters.length}

CONTENT SAMPLE:
${contentSample}

TASK:
Write a captivating 2-3 paragraph synopsis (150-300 words) that:
- Hooks readers immediately with an engaging opening
- Introduces the main character(s) and their conflict
- Hints at the central plot without spoilers
- Evokes emotion and creates intrigue
- Ends with a compelling question or hook
- Uses active, vivid language appropriate for ${genre}
- Follows standard book blurb conventions

TARGET AUDIENCE: Readers browsing the marketplace who need a reason to click "Read Now"

Respond with ONLY the synopsis text, no titles, no explanations, no formatting markers.`;

    const result = await getGeminiModel().generateContent(prompt);
    const response = result.response;
    const synopsis = response.text().trim();

    // Validate length (100-1000 characters as per frontend validation)
    if (synopsis.length < 100) {
      throw new Error('Generated synopsis is too short');
    }

    // Truncate if too long (keep within 1000 char limit)
    if (synopsis.length > 1000) {
      return synopsis.slice(0, 997) + '...';
    }

    return synopsis;
  } catch (error: any) {
    console.error('Gemini API error (generateSynopsis):', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
      fullError: error
    });
    throw new Error('Failed to generate synopsis. Please try again.');
  }
}

/**
 * Generate AI color scheme for book cover
 * Used in Design Studio
 */
export async function generateCoverColorScheme(
  title: string,
  genre: string,
  mood?: string
): Promise<{
  backgroundColor: string;
  gradientColors: string[];
  titleColor: string;
  authorColor: string;
  suggestion: string;
}> {
  try {
    const prompt = `You are a professional book cover designer. Generate a compelling color scheme for a book cover.

BOOK INFORMATION:
Title: "${title}"
Genre: ${genre}
Mood: ${mood || 'Not specified'}

TASK:
Create a color scheme that:
- Captures the essence of the ${genre} genre
- Creates visual appeal and marketability
- Ensures text readability
- Follows modern design trends

Provide colors as hex codes. Respond ONLY with valid JSON in this exact format:
{
  "backgroundColor": "#HEXCODE",
  "gradientColors": ["#HEX1", "#HEX2", "#HEX3"],
  "titleColor": "#HEXCODE",
  "authorColor": "#HEXCODE",
  "suggestion": "Brief explanation of the color choice (1-2 sentences)"
}`;

    const result = await getGeminiModel().generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    const colorScheme = JSON.parse(jsonMatch[0]);

    return colorScheme;
  } catch (error: any) {
    console.error('Gemini API error (generateCoverColorScheme):', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
      fullError: error
    });
    throw new Error('Failed to generate color scheme. Please try again.');
  }
}

/**
 * Generate AI-powered book cover design
 * Section 6.1: AI Cover Generation
 */
export async function generateBookCover(
  synopsis: string,
  genre: string,
  title: string
): Promise<{
  type: 'gradient' | 'pattern';
  backgroundColor: string;
  gradientColors?: string[];
  pattern?: string;
  overlayOpacity?: number;
  suggestion: string;
}> {
  try {
    const prompt = `You are a professional book cover designer specializing in ${genre} books.

BOOK INFORMATION:
Title: "${title}"
Genre: ${genre}
Synopsis: ${synopsis}

TASK:
Create an abstract book cover design concept that:
- Captures the mood and essence of the story
- Uses colors and patterns that evoke the right emotions
- Is visually striking and marketable
- Works well with text overlay

Design should be either:
1. GRADIENT: Multiple blended colors creating atmosphere
2. PATTERN: Geometric or abstract patterns with colors

Respond ONLY with valid JSON in this exact format:
{
  "type": "gradient" or "pattern",
  "backgroundColor": "#HEXCODE",
  "gradientColors": ["#HEX1", "#HEX2", "#HEX3"] (for gradient type),
  "pattern": "CSS pattern description" (for pattern type, like "repeating-linear-gradient(45deg, color1 0px, color2 10px)"),
  "overlayOpacity": 0.0-1.0 (darkness overlay for text readability),
  "suggestion": "Brief explanation of the design concept (2-3 sentences)"
}`;

    const result = await getGeminiModel().generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    const coverDesign = JSON.parse(jsonMatch[0]);

    return coverDesign;
  } catch (error: any) {
    console.error('Gemini API error (generateBookCover):', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
      fullError: error
    });
    throw new Error('Failed to generate book cover. Please try again.');
  }
}
