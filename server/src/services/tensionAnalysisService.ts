/**
 * Tension Analysis Service
 * AI-powered tension level analysis throughout the book
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { IBook } from '../models/Book';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Types
export interface TensionMoment {
  position: number; // 0-1 within chapter
  type: 'conflict' | 'revelation' | 'resolution' | 'cliffhanger' | 'suspense';
  description: string;
}

export interface ChapterTension {
  chapterIndex: number;
  title: string;
  tensionLevel: number; // 0-100
  type: 'rising' | 'falling' | 'peak' | 'valley' | 'stable';
  keyMoments: TensionMoment[];
}

export interface TensionAnalysis {
  chapters: ChapterTension[];
  overallArc: 'classic' | 'episodic' | 'building' | 'flat' | 'irregular';
  suggestions: string[];
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Analyze tension levels throughout the book
 */
export async function analyzeTension(book: IBook): Promise<TensionAnalysis> {
  // Prepare chapter content for analysis
  const chapterData = book.chapters.map((ch, idx) => {
    const plainContent = stripHtml(ch.content);
    return {
      index: idx,
      title: ch.title,
      content: plainContent.slice(0, 1500), // Limit content size
    };
  });

  const chapterPrompts = chapterData.map(ch =>
    `[פרק ${ch.index + 1}: "${ch.title}"]\n${ch.content}...`
  ).join('\n\n---\n\n');

  const prompt = `אתה מנתח ספרותי מומחה למתח ודרמה בספרות.

ספר: "${book.title}" (${book.genre})
מספר פרקים: ${book.chapters.length}

תוכן הפרקים:
${chapterPrompts.slice(0, 8000)}

משימה:
נתח את רמות המתח בכל פרק בסולם 0-100:
- 0-20: רגוע, הצגה, הרהורים
- 21-40: מתח נמוך, קונפליקטים קלים
- 41-60: מתח בינוני, אתגרים משמעותיים
- 61-80: מתח גבוה, קונפליקטים מרכזיים
- 81-100: שיא מתח, רגעי קלימקס

זהה גם רגעי מפתח בכל פרק:
- conflict: קונפליקט/עימות
- revelation: גילוי/התגלות
- resolution: פתרון/הקלה
- cliffhanger: קליפהאנגר
- suspense: מתח צפייה

החזר JSON בפורמט:
{
  "chapters": [
    {
      "chapterIndex": 0,
      "title": "שם הפרק",
      "tensionLevel": 0-100,
      "type": "rising" | "falling" | "peak" | "valley" | "stable",
      "keyMoments": [
        {
          "position": 0-1 (מיקום בפרק),
          "type": "conflict" | "revelation" | "resolution" | "cliffhanger" | "suspense",
          "description": "תיאור קצר"
        }
      ]
    }
  ],
  "overallArc": "classic" | "episodic" | "building" | "flat" | "irregular",
  "suggestions": ["הצעות לשיפור עקומת המתח"]
}

סוגי עקומות:
- classic: עלייה הדרגתית לשיא ואז ירידה
- episodic: עליות וירידות מחזוריות
- building: עלייה מתמדת
- flat: מתח אחיד ללא שינויים משמעותיים
- irregular: תבנית לא עקבית`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Ensure all chapters are included
    if (analysis.chapters.length < book.chapters.length) {
      for (let i = analysis.chapters.length; i < book.chapters.length; i++) {
        analysis.chapters.push({
          chapterIndex: i,
          title: book.chapters[i].title,
          tensionLevel: 50,
          type: 'stable',
          keyMoments: [],
        });
      }
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing tension:', error);
    // Return default analysis
    return {
      chapters: book.chapters.map((ch, idx) => ({
        chapterIndex: idx,
        title: ch.title,
        tensionLevel: 50,
        type: 'stable' as const,
        keyMoments: [],
      })),
      overallArc: 'flat',
      suggestions: ['המשך לכתוב כדי לקבל ניתוח מתח מפורט יותר'],
    };
  }
}
