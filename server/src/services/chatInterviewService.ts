/**
 * Chat Interview Service
 * AI-driven chat-based interview for story development
 * Covers 8 pillars: theme, characters, conflict, climax, resolution, setting, keyPoints, narrativeArc
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import crypto from 'crypto';

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
    modelInstance = genAIClient.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return modelInstance;
}

// 8 Interview Topics
export type ChatInterviewTopic =
  | 'theme'
  | 'characters'
  | 'conflict'
  | 'climax'
  | 'resolution'
  | 'setting'
  | 'keyPoints'
  | 'narrativeArc';

// Topic configuration
interface TopicConfig {
  minQuestions: number;
  maxQuestions: number;
  hebrewName: string;
  englishName: string;
  description: string;
}

const TOPIC_CONFIG: Record<ChatInterviewTopic, TopicConfig> = {
  theme: {
    minQuestions: 2,
    maxQuestions: 4,
    hebrewName: 'נושא ורעיון מרכזי',
    englishName: 'Theme & Premise',
    description: 'Core theme, central idea, and main message',
  },
  characters: {
    minQuestions: 2,
    maxQuestions: 4,
    hebrewName: 'דמויות ראשיות',
    englishName: 'Main Characters',
    description: 'Protagonist, antagonist, and key supporting characters',
  },
  conflict: {
    minQuestions: 2,
    maxQuestions: 3,
    hebrewName: 'קונפליקט מרכזי',
    englishName: 'Central Conflict',
    description: 'Main problem, obstacles, and stakes',
  },
  climax: {
    minQuestions: 1,
    maxQuestions: 3,
    hebrewName: 'שיא מתוכנן',
    englishName: 'Planned Climax',
    description: 'Peak moment and main confrontation',
  },
  resolution: {
    minQuestions: 1,
    maxQuestions: 3,
    hebrewName: 'סיום ופתרון',
    englishName: 'Resolution',
    description: 'How the story ends and character growth',
  },
  setting: {
    minQuestions: 2,
    maxQuestions: 3,
    hebrewName: 'סביבה ועולם',
    englishName: 'Setting & World',
    description: 'Where and when, atmosphere and world-building',
  },
  keyPoints: {
    minQuestions: 2,
    maxQuestions: 3,
    hebrewName: 'נקודות מפתח בעלילה',
    englishName: 'Key Plot Points',
    description: 'Major events and story milestones',
  },
  narrativeArc: {
    minQuestions: 1,
    maxQuestions: 2,
    hebrewName: 'קשת נרטיבית וטון',
    englishName: 'Narrative Arc & Tone',
    description: 'Story structure, pacing, and mood',
  },
};

const TOPIC_ORDER: ChatInterviewTopic[] = [
  'theme',
  'characters',
  'conflict',
  'climax',
  'resolution',
  'setting',
  'keyPoints',
  'narrativeArc',
];

// Message interface
export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  topic: ChatInterviewTopic;
  timestamp: Date;
}

// Interview state
export interface ChatInterviewState {
  id: string;
  currentTopic: ChatInterviewTopic;
  questionsAsked: number;
  questionsPerTopic: Record<ChatInterviewTopic, number>;
  messages: ChatMessage[];
  isComplete: boolean;
  startedAt: Date;
  genre?: string;
  targetAudience?: string;
}

// Interview summary
export interface ChatInterviewSummary {
  theme: string;
  characters: string;
  conflict: string;
  climax: string;
  resolution: string;
  setting: string;
  keyPoints: string;
  narrativeArc: string;
}

// In-memory storage for interview states (use Redis in production)
const interviewStates = new Map<string, ChatInterviewState>();

/**
 * Create a new interview
 */
export function createInterview(
  genre?: string,
  targetAudience?: string
): ChatInterviewState {
  const id = crypto.randomUUID();

  const state: ChatInterviewState = {
    id,
    currentTopic: 'theme',
    questionsAsked: 0,
    questionsPerTopic: {
      theme: 0,
      characters: 0,
      conflict: 0,
      climax: 0,
      resolution: 0,
      setting: 0,
      keyPoints: 0,
      narrativeArc: 0,
    },
    messages: [],
    isComplete: false,
    startedAt: new Date(),
    genre,
    targetAudience,
  };

  interviewStates.set(id, state);
  return state;
}

/**
 * Get interview state by ID
 */
export function getInterview(id: string): ChatInterviewState | undefined {
  return interviewStates.get(id);
}

/**
 * Delete interview
 */
export function deleteInterview(id: string): void {
  interviewStates.delete(id);
}

/**
 * Generate the first AI message
 */
export async function generateFirstMessage(
  state: ChatInterviewState
): Promise<ChatMessage> {
  const genreContext = state.genre ? `לספר בז'אנר ${state.genre}` : '';

  const prompt = `אתה מראיין AI ידידותי ומקצועי שעוזר למחברים לפתח את הסיפור שלהם ${genreContext}.

זו תחילת הראיון. צור הודעת פתיחה קצרה וחמה שמברכת את המחבר ושואלת שאלה ראשונה על הנושא והרעיון המרכזי של הסיפור.

דרישות:
- 2-3 משפטים בלבד
- בעברית
- טון ידידותי ומעודד
- סיים בשאלה פתוחה על הנושא המרכזי

תחזיר רק את ההודעה, ללא הסברים.`;

  try {
    const result = await getGeminiModel().generateContent(prompt);
    const content = result.response.text().trim();

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'ai',
      content,
      topic: 'theme',
      timestamp: new Date(),
    };

    state.messages.push(message);
    state.questionsPerTopic.theme++;
    interviewStates.set(state.id, state);

    return message;
  } catch (error) {
    console.error('Error generating first message:', error);

    // Fallback message
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'ai',
      content:
        'שלום! אני שמח לעזור לך לפתח את הסיפור שלך. בוא נתחיל - ספר לי על הרעיון המרכזי או הנושא של הספר שאתה רוצה לכתוב?',
      topic: 'theme',
      timestamp: new Date(),
    };

    state.messages.push(message);
    state.questionsPerTopic.theme++;
    interviewStates.set(state.id, state);

    return message;
  }
}

/**
 * Process user message and generate AI response
 */
export async function processUserMessage(
  state: ChatInterviewState,
  userMessage: string
): Promise<{
  state: ChatInterviewState;
  aiMessage: ChatMessage;
  topicTransition?: string;
}> {
  // Add user message
  const userMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content: userMessage,
    topic: state.currentTopic,
    timestamp: new Date(),
  };
  state.messages.push(userMsg);
  state.questionsAsked++;

  // Build conversation context
  const conversationContext = state.messages
    .slice(-10) // Last 10 messages for context
    .map((m) => `${m.role === 'ai' ? 'מראיין' : 'מחבר'}: ${m.content}`)
    .join('\n');

  // Get topic info
  const topicConfig = TOPIC_CONFIG[state.currentTopic];
  const topicQuestions = state.questionsPerTopic[state.currentTopic];
  const minReached = topicQuestions >= topicConfig.minQuestions;
  const maxReached = topicQuestions >= topicConfig.maxQuestions;

  // Check if should move to next topic
  const shouldMoveToNext = maxReached || (minReached && shouldTransition(userMessage));

  let nextTopic = state.currentTopic;
  let topicTransition: string | undefined;

  if (shouldMoveToNext) {
    const currentIndex = TOPIC_ORDER.indexOf(state.currentTopic);
    const nextIndex = currentIndex + 1;

    if (nextIndex < TOPIC_ORDER.length) {
      nextTopic = TOPIC_ORDER[nextIndex];
      topicTransition = getTopicTransitionMessage(state.currentTopic, nextTopic);
      state.currentTopic = nextTopic;
    } else {
      // Interview complete
      state.isComplete = true;
    }
  }

  // Generate AI response
  const prompt = `אתה מראיין AI מקצועי שעוזר למחברים לפתח את הסיפור שלהם.

שיחה עד כה:
${conversationContext}

נושא נוכחי: ${TOPIC_CONFIG[nextTopic].hebrewName}
${topicTransition ? `(עברנו לנושא חדש!)` : ''}
תשובת המחבר האחרונה: ${userMessage}

${
  state.isComplete
    ? 'הראיון הסתיים. צור הודעת סיום קצרה שמודה למחבר ומציינת שאפשר להמשיך ליצור את הספר.'
    : `צור שאלה אחת ממוקדת על ${TOPIC_CONFIG[nextTopic].hebrewName}.

הנחיות:
- אם התשובה הייתה קצרה מדי, בקש הרחבה בעדינות
- אם צריך, הגב קצרה לתשובה לפני השאלה
- שאלה קצרה וברורה (עד 25 מילים)
- בעברית
- מעודדת תשובה מפורטת`
}

תחזיר רק את ההודעה, ללא הסברים.`;

  try {
    const result = await getGeminiModel().generateContent(prompt);
    const content = result.response.text().trim();

    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'ai',
      content: topicTransition ? `${topicTransition}\n\n${content}` : content,
      topic: nextTopic,
      timestamp: new Date(),
    };

    state.messages.push(aiMessage);
    if (!state.isComplete) {
      state.questionsPerTopic[nextTopic]++;
    }
    interviewStates.set(state.id, state);

    return { state, aiMessage, topicTransition };
  } catch (error) {
    console.error('Error generating AI response:', error);

    // Fallback response
    const fallbackContent = state.isComplete
      ? 'תודה רבה על הראיון! יש לי מספיק מידע כדי לעזור לך להתחיל לכתוב. בהצלחה!'
      : getFallbackQuestion(nextTopic);

    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'ai',
      content: topicTransition ? `${topicTransition}\n\n${fallbackContent}` : fallbackContent,
      topic: nextTopic,
      timestamp: new Date(),
    };

    state.messages.push(aiMessage);
    if (!state.isComplete) {
      state.questionsPerTopic[nextTopic]++;
    }
    interviewStates.set(state.id, state);

    return { state, aiMessage, topicTransition };
  }
}

/**
 * Check if response indicates we should transition to next topic
 */
function shouldTransition(response: string): boolean {
  // Simple heuristic: if response is comprehensive (50+ words), likely ready to move on
  const wordCount = response.trim().split(/\s+/).length;
  return wordCount >= 50;
}

/**
 * Get topic transition message
 */
function getTopicTransitionMessage(
  from: ChatInterviewTopic,
  to: ChatInterviewTopic
): string {
  const transitions: Record<string, string> = {
    theme_characters: 'מצוין! עכשיו בוא נדבר על הדמויות בסיפור שלך.',
    characters_conflict: 'נהדר! עכשיו נתמקד בקונפליקט המרכזי.',
    conflict_climax: 'יופי! בוא נדבר על השיא של הסיפור.',
    climax_resolution: 'מעולה! איך הסיפור מסתיים?',
    resolution_setting: 'מעניין! עכשיו ספר לי על העולם שבו מתרחש הסיפור.',
    setting_keyPoints: 'נהדר! בוא נדבר על אירועי המפתח בעלילה.',
    keyPoints_narrativeArc: 'יופי! לסיום, נדבר על הטון והמבנה של הסיפור.',
  };

  const key = `${from}_${to}`;
  return transitions[key] || 'בוא נעבור לנושא הבא.';
}

/**
 * Get fallback question for topic
 */
function getFallbackQuestion(topic: ChatInterviewTopic): string {
  const questions: Record<ChatInterviewTopic, string[]> = {
    theme: [
      'מה הרעיון המרכזי של הסיפור שלך?',
      'איזה מסר אתה רוצה להעביר?',
    ],
    characters: [
      'ספר לי על הדמות הראשית',
      'מה מניע את הגיבור שלך?',
    ],
    conflict: [
      'מה הבעיה המרכזית שהדמות צריכה להתמודד איתה?',
      'מה מפריע לדמות להשיג את מה שהיא רוצה?',
    ],
    climax: [
      'מה יהיה הרגע המכריע בסיפור?',
      'איך אתה רואה את השיא?',
    ],
    resolution: [
      'איך הסיפור מסתיים?',
      'מה הדמות לומדת בסוף?',
    ],
    setting: [
      'איפה ומתי מתרחש הסיפור?',
      'תאר את העולם של הסיפור',
    ],
    keyPoints: [
      'מה האירועים החשובים בעלילה?',
      'אילו רגעים מפתח יש בסיפור?',
    ],
    narrativeArc: [
      'מה הטון של הסיפור - קליל, דרמטי, מצחיק?',
      'איך אתה רואה את קצב הסיפור?',
    ],
  };

  const topicQuestions = questions[topic];
  return topicQuestions[Math.floor(Math.random() * topicQuestions.length)];
}

/**
 * Generate interview summary
 */
export async function generateSummary(
  state: ChatInterviewState
): Promise<ChatInterviewSummary> {
  // Extract messages by topic
  const messagesByTopic: Record<ChatInterviewTopic, string[]> = {
    theme: [],
    characters: [],
    conflict: [],
    climax: [],
    resolution: [],
    setting: [],
    keyPoints: [],
    narrativeArc: [],
  };

  state.messages.forEach((m) => {
    if (m.role === 'user') {
      messagesByTopic[m.topic].push(m.content);
    }
  });

  const prompt = `נתח את תשובות המחבר וצור סיכום מובנה לכל נושא.

## נושא ורעיון מרכזי:
${messagesByTopic.theme.join('\n') || 'לא צוין'}

## דמויות:
${messagesByTopic.characters.join('\n') || 'לא צוין'}

## קונפליקט:
${messagesByTopic.conflict.join('\n') || 'לא צוין'}

## שיא:
${messagesByTopic.climax.join('\n') || 'לא צוין'}

## סיום:
${messagesByTopic.resolution.join('\n') || 'לא צוין'}

## סביבה:
${messagesByTopic.setting.join('\n') || 'לא צוין'}

## נקודות מפתח:
${messagesByTopic.keyPoints.join('\n') || 'לא צוין'}

## קשת נרטיבית:
${messagesByTopic.narrativeArc.join('\n') || 'לא צוין'}

צור JSON בפורמט הבא עם סיכום קצר (2-3 משפטים) לכל נושא:
{
  "theme": "סיכום הנושא והרעיון המרכזי",
  "characters": "סיכום הדמויות",
  "conflict": "סיכום הקונפליקט",
  "climax": "סיכום השיא",
  "resolution": "סיכום הסיום",
  "setting": "סיכום הסביבה",
  "keyPoints": "סיכום נקודות המפתח",
  "narrativeArc": "סיכום הקשת הנרטיבית והטון"
}

הכל בעברית. אם מידע חסר, כתוב "לא צוין".`;

  try {
    const result = await getGeminiModel().generateContent(prompt);
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ChatInterviewSummary;
    }
  } catch (error) {
    console.error('Error generating summary:', error);
  }

  // Fallback summary
  return {
    theme: messagesByTopic.theme.join(' ') || 'לא צוין',
    characters: messagesByTopic.characters.join(' ') || 'לא צוין',
    conflict: messagesByTopic.conflict.join(' ') || 'לא צוין',
    climax: messagesByTopic.climax.join(' ') || 'לא צוין',
    resolution: messagesByTopic.resolution.join(' ') || 'לא צוין',
    setting: messagesByTopic.setting.join(' ') || 'לא צוין',
    keyPoints: messagesByTopic.keyPoints.join(' ') || 'לא צוין',
    narrativeArc: messagesByTopic.narrativeArc.join(' ') || 'לא צוין',
  };
}

/**
 * Get interview progress percentage
 */
export function getInterviewProgress(state: ChatInterviewState): number {
  const totalMinQuestions = Object.values(TOPIC_CONFIG).reduce(
    (sum, config) => sum + config.minQuestions,
    0
  );

  let answeredQuestions = 0;
  for (const topic of TOPIC_ORDER) {
    answeredQuestions += Math.min(
      state.questionsPerTopic[topic],
      TOPIC_CONFIG[topic].minQuestions
    );
  }

  return Math.min(100, Math.round((answeredQuestions / totalMinQuestions) * 100));
}

/**
 * Check if interview can be completed early
 */
export function canCompleteEarly(state: ChatInterviewState): boolean {
  // Can complete if at least half the topics have minimum questions
  let topicsWithMinQuestions = 0;

  for (const topic of TOPIC_ORDER) {
    if (state.questionsPerTopic[topic] >= TOPIC_CONFIG[topic].minQuestions) {
      topicsWithMinQuestions++;
    }
  }

  return topicsWithMinQuestions >= 4; // At least 4 of 8 topics covered
}
