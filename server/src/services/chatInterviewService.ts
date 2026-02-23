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
  language: InterviewLanguage;
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

// Supported languages
export type InterviewLanguage = 'en' | 'he';

// Bilingual prompts
const PROMPTS = {
  en: {
    firstMessage: (genre: string) => `You are a friendly and professional AI interviewer helping authors develop their story${genre ? ` in the ${genre} genre` : ''}.

This is the beginning of the interview. Create a short and warm opening message that greets the author and asks a first question about the theme and central idea of the story.

Requirements:
- 2-3 sentences only
- In English
- Friendly and encouraging tone
- End with an open question about the main theme

Return only the message, no explanations.`,
    fallbackFirst: "Hello! I'm excited to help you develop your story. Let's start - tell me about the central idea or theme of the book you want to write?",
    processMessage: (conversationContext: string, topicName: string, topicTransition: boolean, userMessage: string, isComplete: boolean) => `You are a professional AI interviewer helping authors develop their story.

Conversation so far:
${conversationContext}

Current topic: ${topicName}
${topicTransition ? '(We moved to a new topic!)' : ''}
Author's last response: ${userMessage}

${
  isComplete
    ? 'The interview is complete. Create a short closing message thanking the author and mentioning they can continue to create their book.'
    : `Create one focused question about ${topicName}.

Guidelines:
- If the answer was too short, gently ask for more details
- If needed, briefly respond to the answer before the question
- Short and clear question (up to 25 words)
- In English
- Encouraging detailed response`
}

Return only the message, no explanations.`,
    fallbackComplete: "Thank you so much for the interview! I have enough information to help you start writing. Good luck!",
    summaryPrompt: (messagesByTopic: Record<ChatInterviewTopic, string[]>) => `Analyze the author's responses and create a structured summary for each topic.

## Theme and Central Idea:
${messagesByTopic.theme.join('\n') || 'Not specified'}

## Characters:
${messagesByTopic.characters.join('\n') || 'Not specified'}

## Conflict:
${messagesByTopic.conflict.join('\n') || 'Not specified'}

## Climax:
${messagesByTopic.climax.join('\n') || 'Not specified'}

## Resolution:
${messagesByTopic.resolution.join('\n') || 'Not specified'}

## Setting:
${messagesByTopic.setting.join('\n') || 'Not specified'}

## Key Points:
${messagesByTopic.keyPoints.join('\n') || 'Not specified'}

## Narrative Arc:
${messagesByTopic.narrativeArc.join('\n') || 'Not specified'}

Create JSON in the following format with a short summary (2-3 sentences) for each topic:
{
  "theme": "Summary of theme and central idea",
  "characters": "Summary of characters",
  "conflict": "Summary of conflict",
  "climax": "Summary of climax",
  "resolution": "Summary of resolution",
  "setting": "Summary of setting",
  "keyPoints": "Summary of key points",
  "narrativeArc": "Summary of narrative arc and tone"
}

All in English. If information is missing, write "Not specified".`,
    notSpecified: 'Not specified',
    transitions: {
      theme_characters: 'Excellent! Now let\'s talk about the characters in your story.',
      characters_conflict: 'Great! Now let\'s focus on the central conflict.',
      conflict_climax: 'Perfect! Let\'s talk about the climax of the story.',
      climax_resolution: 'Wonderful! How does the story end?',
      resolution_setting: 'Interesting! Now tell me about the world where the story takes place.',
      setting_keyPoints: 'Great! Let\'s talk about the key events in the plot.',
      keyPoints_narrativeArc: 'Perfect! Finally, let\'s discuss the tone and structure of the story.',
      default: 'Let\'s move to the next topic.',
    },
    fallbackQuestions: {
      theme: ['What is the central idea of your story?', 'What message do you want to convey?'],
      characters: ['Tell me about the main character', 'What motivates your hero?'],
      conflict: ['What is the main problem the character needs to face?', 'What prevents the character from getting what they want?'],
      climax: ['What will be the decisive moment in the story?', 'How do you see the climax?'],
      resolution: ['How does the story end?', 'What does the character learn in the end?'],
      setting: ['Where and when does the story take place?', 'Describe the world of the story'],
      keyPoints: ['What are the important events in the plot?', 'What key moments are in the story?'],
      narrativeArc: ['What is the tone of the story - light, dramatic, funny?', 'How do you see the pacing of the story?'],
    },
    roleLabels: { ai: 'Interviewer', user: 'Author' },
  },
  he: {
    firstMessage: (genre: string) => `אתה מראיין AI ידידותי ומקצועי שעוזר למחברים לפתח את הסיפור שלהם ${genre ? `לספר בז'אנר ${genre}` : ''}.

זו תחילת הראיון. צור הודעת פתיחה קצרה וחמה שמברכת את המחבר ושואלת שאלה ראשונה על הנושא והרעיון המרכזי של הסיפור.

דרישות:
- 2-3 משפטים בלבד
- בעברית
- טון ידידותי ומעודד
- סיים בשאלה פתוחה על הנושא המרכזי

תחזיר רק את ההודעה, ללא הסברים.`,
    fallbackFirst: 'שלום! אני שמח לעזור לך לפתח את הסיפור שלך. בוא נתחיל - ספר לי על הרעיון המרכזי או הנושא של הספר שאתה רוצה לכתוב?',
    processMessage: (conversationContext: string, topicName: string, topicTransition: boolean, userMessage: string, isComplete: boolean) => `אתה מראיין AI מקצועי שעוזר למחברים לפתח את הסיפור שלהם.

שיחה עד כה:
${conversationContext}

נושא נוכחי: ${topicName}
${topicTransition ? `(עברנו לנושא חדש!)` : ''}
תשובת המחבר האחרונה: ${userMessage}

${
  isComplete
    ? 'הראיון הסתיים. צור הודעת סיום קצרה שמודה למחבר ומציינת שאפשר להמשיך ליצור את הספר.'
    : `צור שאלה אחת ממוקדת על ${topicName}.

הנחיות:
- אם התשובה הייתה קצרה מדי, בקש הרחבה בעדינות
- אם צריך, הגב קצרה לתשובה לפני השאלה
- שאלה קצרה וברורה (עד 25 מילים)
- בעברית
- מעודדת תשובה מפורטת`
}

תחזיר רק את ההודעה, ללא הסברים.`,
    fallbackComplete: 'תודה רבה על הראיון! יש לי מספיק מידע כדי לעזור לך להתחיל לכתוב. בהצלחה!',
    summaryPrompt: (messagesByTopic: Record<ChatInterviewTopic, string[]>) => `נתח את תשובות המחבר וצור סיכום מובנה לכל נושא.

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

הכל בעברית. אם מידע חסר, כתוב "לא צוין".`,
    notSpecified: 'לא צוין',
    transitions: {
      theme_characters: 'מצוין! עכשיו בוא נדבר על הדמויות בסיפור שלך.',
      characters_conflict: 'נהדר! עכשיו נתמקד בקונפליקט המרכזי.',
      conflict_climax: 'יופי! בוא נדבר על השיא של הסיפור.',
      climax_resolution: 'מעולה! איך הסיפור מסתיים?',
      resolution_setting: 'מעניין! עכשיו ספר לי על העולם שבו מתרחש הסיפור.',
      setting_keyPoints: 'נהדר! בוא נדבר על אירועי המפתח בעלילה.',
      keyPoints_narrativeArc: 'יופי! לסיום, נדבר על הטון והמבנה של הסיפור.',
      default: 'בוא נעבור לנושא הבא.',
    },
    fallbackQuestions: {
      theme: ['מה הרעיון המרכזי של הסיפור שלך?', 'איזה מסר אתה רוצה להעביר?'],
      characters: ['ספר לי על הדמות הראשית', 'מה מניע את הגיבור שלך?'],
      conflict: ['מה הבעיה המרכזית שהדמות צריכה להתמודד איתה?', 'מה מפריע לדמות להשיג את מה שהיא רוצה?'],
      climax: ['מה יהיה הרגע המכריע בסיפור?', 'איך אתה רואה את השיא?'],
      resolution: ['איך הסיפור מסתיים?', 'מה הדמות לומדת בסוף?'],
      setting: ['איפה ומתי מתרחש הסיפור?', 'תאר את העולם של הסיפור'],
      keyPoints: ['מה האירועים החשובים בעלילה?', 'אילו רגעים מפתח יש בסיפור?'],
      narrativeArc: ['מה הטון של הסיפור - קליל, דרמטי, מצחיק?', 'איך אתה רואה את קצב הסיפור?'],
    },
    roleLabels: { ai: 'מראיין', user: 'מחבר' },
  },
};

// In-memory storage for interview states (use Redis in production)
const interviewStates = new Map<string, ChatInterviewState>();

/**
 * Create a new interview
 */
export function createInterview(
  genre?: string,
  targetAudience?: string,
  language: InterviewLanguage = 'he'
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
    language,
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
  const lang = state.language || 'he';
  const prompts = PROMPTS[lang];
  const prompt = prompts.firstMessage(state.genre || '');

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
      content: prompts.fallbackFirst,
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
  const lang = state.language || 'he';
  const prompts = PROMPTS[lang];
  const roleLabels = prompts.roleLabels;

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
    .map((m) => `${m.role === 'ai' ? roleLabels.ai : roleLabels.user}: ${m.content}`)
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
      topicTransition = getTopicTransitionMessage(state.currentTopic, nextTopic, lang);
      state.currentTopic = nextTopic;
    } else {
      // Interview complete
      state.isComplete = true;
    }
  }

  // Get topic name in the appropriate language
  const topicName = lang === 'he' ? TOPIC_CONFIG[nextTopic].hebrewName : TOPIC_CONFIG[nextTopic].englishName;

  // Generate AI response
  const prompt = prompts.processMessage(
    conversationContext,
    topicName,
    !!topicTransition,
    userMessage,
    state.isComplete
  );

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
      ? prompts.fallbackComplete
      : getFallbackQuestion(nextTopic, lang);

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
  to: ChatInterviewTopic,
  lang: InterviewLanguage = 'he'
): string {
  const transitions = PROMPTS[lang].transitions;
  const key = `${from}_${to}` as keyof typeof transitions;
  return transitions[key] || transitions.default;
}

/**
 * Get fallback question for topic
 */
function getFallbackQuestion(topic: ChatInterviewTopic, lang: InterviewLanguage = 'he'): string {
  const questions = PROMPTS[lang].fallbackQuestions[topic];
  return questions[Math.floor(Math.random() * questions.length)];
}

/**
 * Generate interview summary
 */
export async function generateSummary(
  state: ChatInterviewState
): Promise<ChatInterviewSummary> {
  const lang = state.language || 'he';
  const prompts = PROMPTS[lang];
  const notSpecified = prompts.notSpecified;

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

  const prompt = prompts.summaryPrompt(messagesByTopic);

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
    theme: messagesByTopic.theme.join(' ') || notSpecified,
    characters: messagesByTopic.characters.join(' ') || notSpecified,
    conflict: messagesByTopic.conflict.join(' ') || notSpecified,
    climax: messagesByTopic.climax.join(' ') || notSpecified,
    resolution: messagesByTopic.resolution.join(' ') || notSpecified,
    setting: messagesByTopic.setting.join(' ') || notSpecified,
    keyPoints: messagesByTopic.keyPoints.join(' ') || notSpecified,
    narrativeArc: messagesByTopic.narrativeArc.join(' ') || notSpecified,
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
