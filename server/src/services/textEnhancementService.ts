/**
 * Text Enhancement Service
 * AI-powered text manipulation for the floating toolbar
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Types
export type EnhanceAction = 'improve' | 'expand' | 'shorten' | 'continue';

export interface EnhanceContext {
  genre: string;
  bookTitle?: string;
  chapterTitle?: string;
  surroundingText?: string;
  voiceInterview?: {
    theme?: { mainTheme?: string; tone?: string };
    characters?: Array<{ name: string; role?: string }>;
    plot?: { conflict?: string };
    setting?: { atmosphere?: string };
    writingGuidelines?: string[];
  };
}

export interface EnhanceResult {
  enhanced: string;
  explanation: string;
}

/**
 * Build context prompt from voice interview data
 */
function buildContextPrompt(context: EnhanceContext): string {
  let contextStr = '';

  if (context.bookTitle) {
    contextStr += `Book: "${context.bookTitle}"\n`;
  }
  if (context.chapterTitle) {
    contextStr += `Chapter: "${context.chapterTitle}"\n`;
  }
  contextStr += `Genre: ${context.genre}\n`;

  if (context.voiceInterview) {
    const vi = context.voiceInterview;
    if (vi.theme?.mainTheme) contextStr += `Theme: ${vi.theme.mainTheme}\n`;
    if (vi.theme?.tone) contextStr += `Tone: ${vi.theme.tone}\n`;
    if (vi.plot?.conflict) contextStr += `Conflict: ${vi.plot.conflict}\n`;
    if (vi.setting?.atmosphere) contextStr += `Atmosphere: ${vi.setting.atmosphere}\n`;
    if (vi.characters && vi.characters.length > 0) {
      contextStr += `Characters: ${vi.characters.map(c => c.name).join(', ')}\n`;
    }
    if (vi.writingGuidelines && vi.writingGuidelines.length > 0) {
      contextStr += `Guidelines: ${vi.writingGuidelines.slice(0, 3).join('; ')}\n`;
    }
  }

  return contextStr;
}

/**
 * Improve text - better phrasing, clearer writing
 */
export async function improveText(
  text: string,
  context: EnhanceContext
): Promise<EnhanceResult> {
  const contextPrompt = buildContextPrompt(context);

  const prompt = `You are a professional Hebrew editor improving text quality.

CONTEXT:
${contextPrompt}

ORIGINAL TEXT (Hebrew):
${text}

TASK:
Improve this text for:
- Better phrasing and flow
- Clearer expression of ideas
- Enhanced literary quality
- Maintained original meaning and voice
- Keep it in Hebrew

IMPORTANT: Preserve the original style and length approximately.

Respond ONLY with valid JSON:
{
  "enhanced": "<the improved Hebrew text>",
  "explanation": "<brief Hebrew explanation of changes made, 1 sentence>"
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { enhanced: text, explanation: 'לא ניתן היה לשפר את הטקסט' };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error improving text:', error);
    throw new Error('Failed to improve text');
  }
}

/**
 * Expand text - add more detail and description
 */
export async function expandText(
  text: string,
  context: EnhanceContext
): Promise<EnhanceResult> {
  const contextPrompt = buildContextPrompt(context);

  const prompt = `You are a creative Hebrew author expanding a text section.

CONTEXT:
${contextPrompt}

ORIGINAL TEXT (Hebrew):
${text}

TASK:
Expand this text by:
- Adding sensory details (sight, sound, smell, touch, taste)
- Deepening emotional resonance
- Enriching descriptions
- Adding relevant context or backstory
- Maintaining consistent style and voice
- Keep it in Hebrew

Target length: 150-200% of original (expand but don't make it too long)

Respond ONLY with valid JSON:
{
  "enhanced": "<the expanded Hebrew text>",
  "explanation": "<brief Hebrew explanation of what was added, 1 sentence>"
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { enhanced: text, explanation: 'לא ניתן היה להרחיב את הטקסט' };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error expanding text:', error);
    throw new Error('Failed to expand text');
  }
}

/**
 * Shorten text - condense while keeping meaning
 */
export async function shortenText(
  text: string,
  context: EnhanceContext
): Promise<EnhanceResult> {
  const contextPrompt = buildContextPrompt(context);

  const prompt = `You are a professional Hebrew editor condensing text.

CONTEXT:
${contextPrompt}

ORIGINAL TEXT (Hebrew):
${text}

TASK:
Shorten this text while:
- Preserving the core meaning
- Keeping essential details
- Maintaining narrative flow
- Removing redundancy
- Keep it in Hebrew

Target length: 50-70% of original

Respond ONLY with valid JSON:
{
  "enhanced": "<the shortened Hebrew text>",
  "explanation": "<brief Hebrew explanation of what was removed, 1 sentence>"
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { enhanced: text, explanation: 'לא ניתן היה לקצר את הטקסט' };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error shortening text:', error);
    throw new Error('Failed to shorten text');
  }
}

/**
 * Continue text - generate continuation from selection point
 */
export async function continueText(
  text: string,
  context: EnhanceContext
): Promise<EnhanceResult> {
  const contextPrompt = buildContextPrompt(context);

  const prompt = `You are a creative Hebrew author continuing a story.

CONTEXT:
${contextPrompt}

TEXT ENDING AT SELECTION POINT (Hebrew):
${text}

${context.surroundingText ? `SURROUNDING CONTEXT:\n${context.surroundingText}\n` : ''}

TASK:
Continue the story naturally from this point:
- Match the existing writing style exactly
- Maintain character voices
- Advance the plot meaningfully
- Stay true to the ${context.genre} genre
- Keep it in Hebrew

Write 80-120 words continuing the narrative.

Respond ONLY with valid JSON:
{
  "enhanced": "<the continuation in Hebrew>",
  "explanation": "<brief Hebrew explanation of the direction taken, 1 sentence>"
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { enhanced: '', explanation: 'לא ניתן היה להמשיך את הטקסט' };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error continuing text:', error);
    throw new Error('Failed to continue text');
  }
}

/**
 * Main enhancement function - routes to specific action
 */
export async function enhanceSelectedText(
  text: string,
  action: EnhanceAction,
  context: EnhanceContext
): Promise<EnhanceResult> {
  switch (action) {
    case 'improve':
      return improveText(text, context);
    case 'expand':
      return expandText(text, context);
    case 'shorten':
      return shortenText(text, context);
    case 'continue':
      return continueText(text, context);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
