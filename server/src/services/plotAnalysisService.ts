/**
 * Plot Analysis Service
 * AI-powered plot structure and writing techniques analysis
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { IBook } from '../models/Book';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Types
export interface ActInfo {
  chapters: number[];
  percentage: number;
  completeness: number;
  elements: string[];
  suggestions: string[];
}

export interface PlotPoint {
  chapter: number;
  description: string;
}

export interface PlotAnalysis {
  threeActStructure: {
    act1: ActInfo;
    act2: ActInfo;
    act3: ActInfo;
  };
  plotPoints: {
    incitingIncident?: PlotPoint;
    midpoint?: PlotPoint;
    climax?: PlotPoint;
  };
  balance: 'balanced' | 'front-heavy' | 'back-heavy' | 'middle-heavy';
  suggestions: string[];
}

export interface TechniqueScore {
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  examples: Array<{
    chapterIndex: number;
    excerpt: string;
    analysis: string;
    quality: 'excellent' | 'good' | 'needs-improvement';
  }>;
  suggestions: string[];
}

export interface WritingTechniques {
  tensionCreation: TechniqueScore;
  problemResolution: TechniqueScore;
  characterDevelopment: TechniqueScore;
  motifsThemes: TechniqueScore;
  dialogueQuality: TechniqueScore;
  pacing: TechniqueScore;
}

export interface TechniquesAnalysis {
  techniques: WritingTechniques;
  overallScore: number;
  improvements: string[];
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Analyze book plot structure (three-act)
 */
export async function analyzePlotStructure(book: IBook): Promise<PlotAnalysis> {
  // Prepare chapter summaries
  const chapterSummaries = book.chapters.map((ch, idx) => {
    const plainContent = stripHtml(ch.content);
    return `פרק ${idx + 1}: "${ch.title}" (${ch.wordCount} מילים)\nתוכן: ${plainContent.slice(0, 800)}...`;
  }).join('\n\n');

  const totalWords = book.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

  // Build voice interview context if available
  let contextPrompt = '';
  if (book.storyContext?.voiceInterview?.summary) {
    const vi = book.storyContext.voiceInterview.summary;
    contextPrompt = `
הקשר מראיון המחבר:
${vi.theme?.mainTheme ? `נושא: ${vi.theme.mainTheme}` : ''}
${vi.plot?.conflict ? `קונפליקט: ${vi.plot.conflict}` : ''}
${vi.plot?.stakes ? `מה בסיכון: ${vi.plot.stakes}` : ''}
`;
  }

  const prompt = `אתה מנתח ספרותי מקצועי המתמחה במבנה עלילה.

מידע על הספר:
כותרת: "${book.title}"
ז'אנר: ${book.genre}
מספר פרקים: ${book.chapters.length}
סה"כ מילים: ${totalWords}
${contextPrompt}

סיכומי פרקים:
${chapterSummaries}

משימה:
נתח את מבנה שלושת המערכות של הספר (Three-Act Structure).

מערכה ראשונה (התחלה ~25%): הצגה, היכרות עם דמויות, בניית עולם
מערכה שנייה (אמצע ~50%): עלייה במתח, סיבוכים, קונפליקט מרכזי
מערכה שלישית (סוף ~25%): שיא, פתרון, סיום

החזר JSON בפורמט הבא בלבד:
{
  "threeActStructure": {
    "act1": {
      "chapters": [מספרי פרקים, מתחיל מ-0],
      "percentage": אחוז מסה"כ המילים,
      "completeness": 0-100 מידת השלמות,
      "elements": ["אלמנטים שנמצאו"],
      "suggestions": ["הצעות לשיפור"]
    },
    "act2": { ... },
    "act3": { ... }
  },
  "plotPoints": {
    "incitingIncident": { "chapter": מספר פרק, "description": "תיאור" },
    "midpoint": { "chapter": מספר פרק, "description": "תיאור" },
    "climax": { "chapter": מספר פרק, "description": "תיאור" }
  },
  "balance": "balanced" | "front-heavy" | "back-heavy" | "middle-heavy",
  "suggestions": ["הצעות כלליות לשיפור המבנה"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error analyzing plot structure:', error);
    // Return default analysis
    const chapterCount = book.chapters.length;
    const act1End = Math.floor(chapterCount * 0.25);
    const act2End = Math.floor(chapterCount * 0.75);

    return {
      threeActStructure: {
        act1: {
          chapters: Array.from({ length: act1End }, (_, i) => i),
          percentage: 25,
          completeness: 50,
          elements: ['הצגת דמויות'],
          suggestions: ['יש להרחיב את ההיכרות עם העולם'],
        },
        act2: {
          chapters: Array.from({ length: act2End - act1End }, (_, i) => i + act1End),
          percentage: 50,
          completeness: 50,
          elements: ['התפתחות עלילה'],
          suggestions: ['יש להוסיף יותר מתח'],
        },
        act3: {
          chapters: Array.from({ length: chapterCount - act2End }, (_, i) => i + act2End),
          percentage: 25,
          completeness: 50,
          elements: ['סיום'],
          suggestions: ['יש לחזק את השיא'],
        },
      },
      plotPoints: {},
      balance: 'balanced',
      suggestions: ['המשך לכתוב ונתח שוב כשיש יותר תוכן'],
    };
  }
}

/**
 * Analyze writing techniques
 */
export async function analyzeWritingTechniques(book: IBook): Promise<TechniquesAnalysis> {
  // Prepare content for analysis
  const allContent = book.chapters.map((ch, idx) => {
    const plainContent = stripHtml(ch.content);
    return `[פרק ${idx + 1}] ${plainContent.slice(0, 1000)}`;
  }).join('\n\n');

  const prompt = `אתה מנתח ספרותי מקצועי המעריך טכניקות כתיבה.

ספר: "${book.title}" (${book.genre})

תוכן לניתוח:
${allContent.slice(0, 6000)}

משימה:
נתח את טכניקות הכתיבה הבאות בסולם 0-100:

1. יצירת מתח (Tension Creation) - בניית מתח, סקרנות, תחושת דחיפות
2. פתרון בעיות (Problem/Resolution) - הצגת בעיות ופתרונן
3. פיתוח דמויות (Character Development) - עומק, עקביות, צמיחה
4. מוטיבים ונושאים (Motifs & Themes) - נושאים חוזרים, סמלים
5. איכות דיאלוג (Dialogue Quality) - טבעיות, קולות ייחודיים
6. קצב (Pacing) - קצב הסיפור, איזון בין פעולה להרהור

החזר JSON בפורמט:
{
  "techniques": {
    "tensionCreation": {
      "score": 0-100,
      "trend": "improving" | "stable" | "declining",
      "examples": [{ "chapterIndex": 0, "excerpt": "דוגמה קצרה", "analysis": "הסבר", "quality": "excellent" | "good" | "needs-improvement" }],
      "suggestions": ["הצעות לשיפור"]
    },
    "problemResolution": { ... },
    "characterDevelopment": { ... },
    "motifsThemes": { ... },
    "dialogueQuality": { ... },
    "pacing": { ... }
  },
  "overallScore": ציון כולל 0-100,
  "improvements": ["הצעות כלליות לשיפור"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error analyzing writing techniques:', error);
    // Return default analysis
    const defaultTechnique: TechniqueScore = {
      score: 60,
      trend: 'stable',
      examples: [],
      suggestions: ['המשך לכתוב כדי לקבל ניתוח מפורט יותר'],
    };

    return {
      techniques: {
        tensionCreation: { ...defaultTechnique },
        problemResolution: { ...defaultTechnique },
        characterDevelopment: { ...defaultTechnique },
        motifsThemes: { ...defaultTechnique },
        dialogueQuality: { ...defaultTechnique },
        pacing: { ...defaultTechnique },
      },
      overallScore: 60,
      improvements: ['המשך לכתוב ונתח שוב כשיש יותר תוכן'],
    };
  }
}
