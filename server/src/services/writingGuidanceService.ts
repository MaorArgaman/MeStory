/**
 * Writing Guidance Service
 * Real-time writing guidance and deviation detection
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { IBook } from '../models/Book';

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
  recentText: string
): Promise<WritingGuidance | null> {
  // Get established story elements
  const voiceInterview = book.storyContext?.voiceInterview?.summary;
  const currentChapter = book.chapters[chapterIndex];

  if (!currentChapter) {
    return null;
  }

  // Build context from voice interview
  let storyContext = '';
  if (voiceInterview) {
    storyContext = `
אלמנטים מבוססים של הסיפור (מראיון המחבר):
${voiceInterview.theme?.mainTheme ? `נושא מרכזי: ${voiceInterview.theme.mainTheme}` : ''}
${voiceInterview.theme?.tone ? `טון: ${voiceInterview.tone}` : ''}
${voiceInterview.plot?.conflict ? `קונפליקט מרכזי: ${voiceInterview.plot.conflict}` : ''}
${voiceInterview.characters && voiceInterview.characters.length > 0 ? `דמויות ראשיות: ${voiceInterview.characters.map((c: any) => c.name).join(', ')}` : ''}
${voiceInterview.writingGuidelines && voiceInterview.writingGuidelines.length > 0 ? `הנחיות כתיבה:\n${voiceInterview.writingGuidelines.map((g: string) => `- ${g}`).join('\n')}` : ''}
`;
  }

  // Get previous content for context
  const previousContent = stripHtml(currentChapter.content).slice(-1000);

  const prompt = `אתה מנחה כתיבה שעוזר לסופרים לשמור על עקביות ומבנה נכון.

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

הערה: תן הנחיה רק אם יש באמת צורך. אל תפריע לסופר סתם.
עדיף לתת הנחיה רק כאשר:
- יש סטייה ברורה מהנושא שנקבע
- הטון השתנה באופן משמעותי
- דמות מתנהגת לא עקבית
- המבנה חסר אלמנט חשוב`;

  try {
    const result = await getGeminiModel().generateContent(prompt);
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
