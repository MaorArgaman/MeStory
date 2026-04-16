/**
 * Writing Guidance Service
 * Real-time writing guidance and deviation detection
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { generateWithBreaker } from './geminiClient';
import { IBook } from '../models/Book';
import { SupportedLanguage, detectLanguage, getLanguageInstruction } from '../utils/languageHelper';

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
    modelInstance = genAIClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }
  return modelInstance;
}

// Types
export interface GuidanceSuggestion {
  text: string;
  insertable?: string;
}

export interface WritingGuidance {
  type: 'deviation' | 'structure' | 'tension' | 'character' | 'pacing' | 'theme';
  severity: 'info' | 'warning' | 'suggestion';
  message: string;
  context?: string;
  suggestions: GuidanceSuggestion[];
  dismissible: boolean;
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Check for writing guidance alerts
 */
export async function checkGuidance(
  book: IBook,
  chapterIndex: number,
  recentText: string,
  language?: SupportedLanguage
): Promise<WritingGuidance | null> {
  // Get established story elements
  const voiceInterview = book.storyContext?.voiceInterview?.summary;
  const currentChapter = book.chapters[chapterIndex];

  if (!currentChapter) {
    return null;
  }

  // Auto-detect language from recent text if not provided
  const lang = language || detectLanguage(recentText);
  const langInstruction = getLanguageInstruction(lang);
  const isHebrew = lang === 'he';

  // Build context from voice interview (language-aware)
  let storyContext = '';
  if (voiceInterview) {
    if (isHebrew) {
      storyContext = `
אלמנטים מבוססים של הסיפור (מראיון המחבר):
${voiceInterview.theme?.mainTheme ? `נושא מרכזי: ${voiceInterview.theme.mainTheme}` : ''}
${(voiceInterview as any).tone ? `טון: ${(voiceInterview as any).tone}` : ''}
${voiceInterview.plot?.conflict ? `קונפליקט מרכזי: ${voiceInterview.plot.conflict}` : ''}
${voiceInterview.characters && voiceInterview.characters.length > 0 ? `דמויות ראשיות: ${voiceInterview.characters.map((c: any) => c.name).join(', ')}` : ''}
${voiceInterview.writingGuidelines && voiceInterview.writingGuidelines.length > 0 ? `הנחיות כתיבה:\n${voiceInterview.writingGuidelines.map((g: string) => `- ${g}`).join('\n')}` : ''}
`;
    } else {
      storyContext = `
Established story elements (from author interview):
${voiceInterview.theme?.mainTheme ? `Main theme: ${voiceInterview.theme.mainTheme}` : ''}
${(voiceInterview as any).tone ? `Tone: ${(voiceInterview as any).tone}` : ''}
${voiceInterview.plot?.conflict ? `Central conflict: ${voiceInterview.plot.conflict}` : ''}
${voiceInterview.characters && voiceInterview.characters.length > 0 ? `Main characters: ${voiceInterview.characters.map((c: any) => c.name).join(', ')}` : ''}
${voiceInterview.writingGuidelines && voiceInterview.writingGuidelines.length > 0 ? `Writing guidelines:\n${voiceInterview.writingGuidelines.map((g: string) => `- ${g}`).join('\n')}` : ''}
`;
    }
  }

  // Get previous content for context
  const previousContent = stripHtml(currentChapter.content).slice(-1000);

  // Build prompt based on language
  const prompt = isHebrew ? `אתה מנחה כתיבה שעוזר לסופרים לשמור על עקביות ומבנה נכון.
${langInstruction}

${storyContext}

הקשר הפרק הנוכחי:
פרק ${chapterIndex + 1}: "${currentChapter.title}"
תוכן קודם: ${previousContent.slice(-500)}...

טקסט שנכתב לאחרונה (500 תווים אחרונים):
${recentText}

משימה:
בדוק אם הטקסט שנכתב לאחרונה:
1. עוקב אחר הנושאים והטון שנקבעו
2. שומר על עקביות קולות הדמויות
3. מתאים למבנה ההתפתחותי (התחלה/אמצע/סוף)
4. בונה מתח בצורה נכונה לקראת שיא/פתרון
5. שומר על הטון שנקבע

אם יש סטייה או הזדמנות להנחיה, החזר JSON:
{
  "hasGuidance": true,
  "guidance": {
    "type": "deviation" | "structure" | "tension" | "character" | "pacing" | "theme",
    "severity": "info" | "warning" | "suggestion",
    "message": "הודעה בעברית",
    "context": "מה גרם להנחיה זו",
    "suggestions": [
      { "text": "תיאור ההצעה", "insertable": "טקסט להכנסה (אופציונלי)" }
    ],
    "dismissible": true
  }
}

אם הכל בסדר, החזר:
{ "hasGuidance": false }

הערה: תן הנחיה רק אם יש באמת צורך. אל תפריע לסופר סתם.` :
  `You are a writing coach helping authors maintain consistency and proper structure.
${langInstruction}

${storyContext}

Current chapter context:
Chapter ${chapterIndex + 1}: "${currentChapter.title}"
Previous content: ${previousContent.slice(-500)}...

Recently written text (last 500 characters):
${recentText}

TASK:
Check if the recently written text:
1. Follows the established themes and tone
2. Maintains character voice consistency
3. Fits the story structure (beginning/middle/end)
4. Builds tension appropriately toward climax/resolution
5. Maintains the established tone

If there's a deviation or opportunity for guidance, return JSON:
{
  "hasGuidance": true,
  "guidance": {
    "type": "deviation" | "structure" | "tension" | "character" | "pacing" | "theme",
    "severity": "info" | "warning" | "suggestion",
    "message": "Message in English",
    "context": "What triggered this guidance",
    "suggestions": [
      { "text": "Description of suggestion", "insertable": "Text to insert (optional)" }
    ],
    "dismissible": true
  }
}

If everything is fine, return:
{ "hasGuidance": false }

Note: Only provide guidance when truly needed. Don't interrupt the author unnecessarily.`;

  try {
    const result = await generateWithBreaker(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.hasGuidance) {
      return null;
    }

    return parsed.guidance;
  } catch (error) {
    console.error('Error checking guidance:', error);
    return null;
  }
}
