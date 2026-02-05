/**
 * AI Interview Service
 * Handles voice-based AI interviews for book creation
 * Uses Gemini AI for adaptive questioning and summary generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Interview topics
export type InterviewTopic = 'theme' | 'characters' | 'plot' | 'setting';

// Interview response interface
export interface InterviewResponse {
  question: string;
  answer: string;
  topic: InterviewTopic;
  timestamp: Date;
  isFollowUp: boolean;
}

// Interview state interface
export interface InterviewState {
  id: string;
  currentTopic: InterviewTopic;
  questionsAsked: number;
  questionsPerTopic: Record<InterviewTopic, number>;
  responses: InterviewResponse[];
  isComplete: boolean;
  startedAt: Date;
  genre?: string;
  targetAudience?: string;
}

// Response analysis result
export interface AnalysisResult {
  isComplete: boolean;
  needsFollowUp: boolean;
  followUpReason?: 'too_short' | 'off_topic' | 'needs_clarification';
  topicComplete: boolean;
  extractedInfo: string;
}

// Interview summary interfaces
export interface CharacterSummary {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  traits: string[];
  description: string;
}

export interface InterviewSummary {
  theme: {
    mainTheme: string;
    subThemes: string[];
    tone: string;
    genre: string;
  };
  characters: CharacterSummary[];
  plot: {
    premise: string;
    conflict: string;
    stakes: string;
    keyEvents: string[];
  };
  setting: {
    world: string;
    timePeriod: string;
    atmosphere: string;
    locations: string[];
  };
  writingGuidelines: string[];
}

// Topic configurations
const TOPIC_CONFIG: Record<InterviewTopic, {
  minQuestions: number;
  maxQuestions: number;
  hebrewName: string;
}> = {
  theme: { minQuestions: 3, maxQuestions: 5, hebrewName: 'נושא הספר' },
  characters: { minQuestions: 3, maxQuestions: 5, hebrewName: 'דמויות' },
  plot: { minQuestions: 3, maxQuestions: 5, hebrewName: 'עלילה' },
  setting: { minQuestions: 2, maxQuestions: 3, hebrewName: 'סביבה' },
};

const TOPIC_ORDER: InterviewTopic[] = ['theme', 'characters', 'plot', 'setting'];

/**
 * Create a new interview state
 */
export function createInterviewState(
  id: string,
  genre?: string,
  targetAudience?: string
): InterviewState {
  return {
    id,
    currentTopic: 'theme',
    questionsAsked: 0,
    questionsPerTopic: {
      theme: 0,
      characters: 0,
      plot: 0,
      setting: 0,
    },
    responses: [],
    isComplete: false,
    startedAt: new Date(),
    genre,
    targetAudience,
  };
}

/**
 * Get the first question to start the interview
 */
export async function getFirstQuestion(state: InterviewState): Promise<string> {
  const genreContext = state.genre ? `בז'אנר ${state.genre}` : '';
  const audienceContext = state.targetAudience ? `לקהל יעד ${state.targetAudience}` : '';

  const prompt = `אתה מראיין מקצועי שעוזר למחברים לפתח את הסיפור שלהם ${genreContext} ${audienceContext}.

זו תחילת הראיון. צור שאלת פתיחה חמה וידידותית שתעזור למחבר לספר על הרעיון המרכזי של הספר שלו.

דרישות:
- שאלה קצרה וברורה (עד 25 מילים)
- בעברית
- טון ידידותי ומעודד
- מזמינה תשובה פתוחה

תחזיר רק את השאלה, ללא הסברים.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Generate the next question based on interview state
 */
export async function generateNextQuestion(
  state: InterviewState,
  lastResponse?: string
): Promise<{ question: string; isFollowUp: boolean }> {
  const topic = state.currentTopic;
  const topicConfig = TOPIC_CONFIG[topic];
  const topicQuestions = state.questionsPerTopic[topic];

  // Build context from previous responses
  const relevantResponses = state.responses
    .filter(r => r.topic === topic)
    .map(r => `שאלה: ${r.question}\nתשובה: ${r.answer}`)
    .join('\n\n');

  const allContext = state.responses
    .map(r => `[${TOPIC_CONFIG[r.topic].hebrewName}] ${r.answer}`)
    .join('\n');

  const prompt = `אתה מראיין מקצועי שעוזר למחברים לפתח את הסיפור שלהם.

הקשר הראיון עד כה:
${allContext || 'טרם נשאלו שאלות'}

נושא נוכחי: ${topicConfig.hebrewName}
שאלות שנשאלו בנושא זה: ${topicQuestions}
${lastResponse ? `תשובה אחרונה: ${lastResponse}` : ''}

${relevantResponses ? `שיחה קודמת בנושא:\n${relevantResponses}` : ''}

צור שאלה אחת ממוקדת שתעזור למחבר להרחיב על ${topicConfig.hebrewName}.

הנחיות:
- אם התשובה האחרונה הייתה קצרה מדי (פחות מ-20 מילים), בקש הרחבה או דוגמה
- אם המחבר סטה מהנושא, החזר אותו בעדינות לנושא ${topicConfig.hebrewName}
- שאל על היבטים שעדיין לא נדונו
- השאלה צריכה להיות קצרה וברורה (עד 25 מילים)
- בעברית
- מעודדת תשובה מפורטת

החזר JSON בפורמט הבא:
{
  "question": "השאלה כאן",
  "isFollowUp": true/false (האם זו שאלת המשך על התשובה האחרונה)
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        question: parsed.question,
        isFollowUp: parsed.isFollowUp || false,
      };
    }

    // Fallback if JSON parsing fails
    return {
      question: text.replace(/[{}"\n]/g, '').trim(),
      isFollowUp: false,
    };
  } catch (error) {
    console.error('Error generating question:', error);
    // Fallback questions per topic
    const fallbackQuestions: Record<InterviewTopic, string[]> = {
      theme: [
        'מה הרעיון המרכזי של הסיפור שלך?',
        'איזה מסר אתה רוצה להעביר לקורא?',
        'מה מיוחד בסיפור הזה לעומת סיפורים אחרים?',
      ],
      characters: [
        'ספר לי על הדמות הראשית בסיפור',
        'מה מניע את הדמות הראשית?',
        'האם יש דמויות משנה חשובות?',
      ],
      plot: [
        'מה הקונפליקט המרכזי בסיפור?',
        'מה עומד על כף המאזניים?',
        'איך אתה רואה את השיא של הסיפור?',
      ],
      setting: [
        'איפה ומתי מתרחש הסיפור?',
        'מה האווירה שאתה רוצה ליצור?',
        'יש מקומות ספציפיים שחשובים לעלילה?',
      ],
    };

    const questions = fallbackQuestions[topic];
    return {
      question: questions[topicQuestions % questions.length],
      isFollowUp: false,
    };
  }
}

/**
 * Analyze a response and determine next action
 */
export async function analyzeResponse(
  response: string,
  state: InterviewState
): Promise<AnalysisResult> {
  const topic = state.currentTopic;
  const topicConfig = TOPIC_CONFIG[topic];
  const topicQuestions = state.questionsPerTopic[topic];

  // Simple heuristics first
  const wordCount = response.trim().split(/\s+/).length;
  const isShort = wordCount < 15;

  // Check if minimum questions asked
  const minQuestionsReached = topicQuestions >= topicConfig.minQuestions;
  const maxQuestionsReached = topicQuestions >= topicConfig.maxQuestions;

  // If max questions reached, move to next topic
  if (maxQuestionsReached) {
    return {
      isComplete: false,
      needsFollowUp: false,
      topicComplete: true,
      extractedInfo: response,
    };
  }

  // If response is too short and we haven't reached min questions
  if (isShort && !minQuestionsReached) {
    return {
      isComplete: false,
      needsFollowUp: true,
      followUpReason: 'too_short',
      topicComplete: false,
      extractedInfo: response,
    };
  }

  // Use AI for more nuanced analysis
  try {
    const prompt = `נתח את התשובה הבאה של מחבר בראיון על הספר שלו.

נושא הראיון: ${topicConfig.hebrewName}
שאלות שנשאלו עד כה בנושא: ${topicQuestions}
מינימום שאלות נדרש: ${topicConfig.minQuestions}

תשובת המחבר:
"${response}"

החזר JSON בפורמט הבא:
{
  "needsFollowUp": true/false,
  "followUpReason": "too_short" | "off_topic" | "needs_clarification" | null,
  "topicComplete": true/false (האם יש מספיק מידע על הנושא),
  "extractedInfo": "סיכום קצר של המידע החדש שהתקבל"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        isComplete: false,
        needsFollowUp: parsed.needsFollowUp && !minQuestionsReached,
        followUpReason: parsed.followUpReason,
        topicComplete: parsed.topicComplete && minQuestionsReached,
        extractedInfo: parsed.extractedInfo || response,
      };
    }
  } catch (error) {
    console.error('Error analyzing response:', error);
  }

  // Default: continue with topic if not at minimum
  return {
    isComplete: false,
    needsFollowUp: false,
    topicComplete: minQuestionsReached,
    extractedInfo: response,
  };
}

/**
 * Process a response and get the next question
 */
export async function processResponse(
  state: InterviewState,
  response: string
): Promise<{
  state: InterviewState;
  nextQuestion: string | null;
  isComplete: boolean;
  currentTopic: InterviewTopic;
}> {
  // Analyze the response
  const analysis = await analyzeResponse(response, state);

  // Generate next question info
  const questionInfo = await generateNextQuestion(state, response);

  // Record the response
  const newResponse: InterviewResponse = {
    question: state.responses.length > 0
      ? state.responses[state.responses.length - 1].question
      : 'שאלת פתיחה',
    answer: response,
    topic: state.currentTopic,
    timestamp: new Date(),
    isFollowUp: questionInfo.isFollowUp,
  };

  // Update state
  const newState: InterviewState = {
    ...state,
    questionsAsked: state.questionsAsked + 1,
    questionsPerTopic: {
      ...state.questionsPerTopic,
      [state.currentTopic]: state.questionsPerTopic[state.currentTopic] + 1,
    },
    responses: [...state.responses, newResponse],
  };

  // Check if we should move to next topic
  if (analysis.topicComplete && !analysis.needsFollowUp) {
    const currentTopicIndex = TOPIC_ORDER.indexOf(state.currentTopic);
    const nextTopicIndex = currentTopicIndex + 1;

    if (nextTopicIndex < TOPIC_ORDER.length) {
      // Move to next topic
      newState.currentTopic = TOPIC_ORDER[nextTopicIndex];
      const nextQ = await generateNextQuestion(newState);
      return {
        state: newState,
        nextQuestion: nextQ.question,
        isComplete: false,
        currentTopic: newState.currentTopic,
      };
    } else {
      // Interview complete
      newState.isComplete = true;
      return {
        state: newState,
        nextQuestion: null,
        isComplete: true,
        currentTopic: state.currentTopic,
      };
    }
  }

  // Continue with current topic
  return {
    state: newState,
    nextQuestion: questionInfo.question,
    isComplete: false,
    currentTopic: state.currentTopic,
  };
}

/**
 * Generate a comprehensive summary from interview responses
 */
export async function generateInterviewSummary(
  state: InterviewState
): Promise<InterviewSummary> {
  // Organize responses by topic
  const responsesByTopic: Record<InterviewTopic, string[]> = {
    theme: [],
    characters: [],
    plot: [],
    setting: [],
  };

  state.responses.forEach(r => {
    responsesByTopic[r.topic].push(`שאלה: ${r.question}\nתשובה: ${r.answer}`);
  });

  const prompt = `אתה עורך ספרותי מקצועי. נתח את הראיון הבא עם מחבר וצור סיכום מקיף שיעזור בכתיבת הספר.

## נושא הספר:
${responsesByTopic.theme.join('\n\n')}

## דמויות:
${responsesByTopic.characters.join('\n\n')}

## עלילה:
${responsesByTopic.plot.join('\n\n')}

## סביבה:
${responsesByTopic.setting.join('\n\n')}

צור סיכום מובנה בפורמט JSON הבא:
{
  "theme": {
    "mainTheme": "הנושא המרכזי של הסיפור",
    "subThemes": ["נושא משנה 1", "נושא משנה 2"],
    "tone": "הטון הכללי (למשל: דרמטי, הומוריסטי, מתח)",
    "genre": "הז'אנר המתאים"
  },
  "characters": [
    {
      "name": "שם הדמות",
      "role": "protagonist/antagonist/supporting/minor",
      "traits": ["תכונה 1", "תכונה 2"],
      "description": "תיאור קצר של הדמות"
    }
  ],
  "plot": {
    "premise": "הרעיון הבסיסי של הסיפור",
    "conflict": "הקונפליקט המרכזי",
    "stakes": "מה עומד על כף המאזניים",
    "keyEvents": ["אירוע מפתח 1", "אירוע מפתח 2"]
  },
  "setting": {
    "world": "תיאור העולם",
    "timePeriod": "תקופת הזמן",
    "atmosphere": "האווירה הכללית",
    "locations": ["מיקום 1", "מיקום 2"]
  },
  "writingGuidelines": [
    "הנחיה לכתיבה 1 - מבוססת על הראיון",
    "הנחיה לכתיבה 2",
    "הנחיה לכתיבה 3"
  ]
}

חשוב:
- הכל בעברית
- התבסס רק על מה שנאמר בראיון
- אם מידע חסר, כתוב "לא צוין"
- הנחיות הכתיבה צריכות להיות ספציפיות ושימושיות`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const summary = JSON.parse(jsonMatch[0]) as InterviewSummary;
      return summary;
    }
  } catch (error) {
    console.error('Error generating summary:', error);
  }

  // Fallback summary if AI fails
  return {
    theme: {
      mainTheme: 'לא זוהה',
      subThemes: [],
      tone: 'לא צוין',
      genre: state.genre || 'לא צוין',
    },
    characters: [],
    plot: {
      premise: 'לא צוין',
      conflict: 'לא צוין',
      stakes: 'לא צוין',
      keyEvents: [],
    },
    setting: {
      world: 'לא צוין',
      timePeriod: 'לא צוין',
      atmosphere: 'לא צוין',
      locations: [],
    },
    writingGuidelines: [
      'המשך לפתח את הרעיונות שעלו בראיון',
      'התמקד בדמויות ובמוטיבציות שלהן',
      'בנה את העלילה סביב הקונפליקט המרכזי',
    ],
  };
}

/**
 * Get a topic transition message
 */
export function getTopicTransitionMessage(
  fromTopic: InterviewTopic,
  toTopic: InterviewTopic
): string {
  const transitions: Record<string, string> = {
    'theme_characters': 'נהדר! עכשיו אני רוצה לשמוע על הדמויות בסיפור שלך.',
    'characters_plot': 'מצוין! בוא נדבר על העלילה והאירועים בסיפור.',
    'plot_setting': 'יופי! לסיום, ספר לי על העולם שבו מתרחש הסיפור.',
  };

  const key = `${fromTopic}_${toTopic}`;
  return transitions[key] || 'בוא נעבור לנושא הבא.';
}

/**
 * Get interview progress percentage
 */
export function getInterviewProgress(state: InterviewState): number {
  const totalMinQuestions = Object.values(TOPIC_CONFIG).reduce(
    (sum, config) => sum + config.minQuestions,
    0
  );

  const answeredQuestions = state.questionsAsked;
  return Math.min(100, Math.round((answeredQuestions / totalMinQuestions) * 100));
}

/**
 * Check if interview can be completed early
 */
export function canCompleteEarly(state: InterviewState): boolean {
  // Can complete if all topics have at least minimum questions
  return TOPIC_ORDER.every(
    topic => state.questionsPerTopic[topic] >= TOPIC_CONFIG[topic].minQuestions
  );
}
