/**
 * AI Interview Service
 * Handles voice-based AI interviews for book creation
 * Uses Gemini AI for adaptive questioning and summary generation
 */

import { generateWithBreaker } from './geminiClient';

// Interview topics - Memorial focused
export type InterviewTopic = 'person' | 'memories' | 'impact' | 'legacy';

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

// Interview summary interfaces - Memorial focused
export interface PersonSummary {
  name: string;
  relationship: string;
  birthDate?: string;
  passingDate?: string;
  occupation?: string;
  traits: string[];
  description: string;
}

export interface InterviewSummary {
  person: {
    name: string;
    relationship: string;
    lifeSpan: string;
    occupation: string;
    personalityTraits: string[];
    definingQualities: string;
  };
  memories: {
    favoriteMemories: string[];
    funnyStories: string[];
    significantMoments: string[];
    traditions: string[];
  };
  impact: {
    lessonsTaught: string[];
    howTheyChangedLives: string;
    whatTheyWouldWant: string;
    lastingInfluence: string;
  };
  legacy: {
    forFutureGenerations: string;
    howToPreserveMemory: string;
    keyMessage: string;
    dedication: string;
  };
  writingGuidelines: string[];
}

// Topic configurations - Memorial focused
const TOPIC_CONFIG: Record<InterviewTopic, {
  minQuestions: number;
  maxQuestions: number;
  hebrewName: string;
  englishName: string;
}> = {
  person: { minQuestions: 3, maxQuestions: 5, hebrewName: 'על האדם', englishName: 'About the Person' },
  memories: { minQuestions: 3, maxQuestions: 5, hebrewName: 'זיכרונות', englishName: 'Memories' },
  impact: { minQuestions: 3, maxQuestions: 5, hebrewName: 'השפעה', englishName: 'Impact' },
  legacy: { minQuestions: 2, maxQuestions: 3, hebrewName: 'מורשת', englishName: 'Legacy' },
};

const TOPIC_ORDER: InterviewTopic[] = ['person', 'memories', 'impact', 'legacy'];

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
    currentTopic: 'person',
    questionsAsked: 0,
    questionsPerTopic: {
      person: 0,
      memories: 0,
      impact: 0,
      legacy: 0,
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
  const genreContext = state.genre ? `מסוג ${state.genre}` : '';
  const audienceContext = state.targetAudience ? `עבור ${state.targetAudience}` : '';

  const prompt = `אתה מלווה רגיש ומקצועי שעוזר למשפחות לכתוב ספר הנצחה ${genreContext} ${audienceContext}.

זו תחילת הראיון. צור שאלת פתיחה חמה, מכבדת ואמפתית שתעזור לאדם לספר על היקיר/ה שהוא רוצה להנציח.

דרישות:
- שאלה קצרה וברורה (עד 25 מילים)
- בעברית
- טון חם, מכבד ורגיש
- מזמינה תשובה פתוחה
- מתאימה למצב של אבל או הנצחה

תחזיר רק את השאלה, ללא הסברים.`;

  const result = await generateWithBreaker(prompt);
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

  const prompt = `אתה מלווה רגיש ומקצועי שעוזר למשפחות לכתוב ספר הנצחה.

הקשר הראיון עד כה:
${allContext || 'טרם נשאלו שאלות'}

נושא נוכחי: ${topicConfig.hebrewName}
שאלות שנשאלו בנושא זה: ${topicQuestions}
${lastResponse ? `תשובה אחרונה: ${lastResponse}` : ''}

${relevantResponses ? `שיחה קודמת בנושא:\n${relevantResponses}` : ''}

צור שאלה אחת ממוקדת שתעזור לאדם לספר יותר על ${topicConfig.hebrewName}.

הנחיות:
- אם התשובה האחרונה הייתה קצרה מדי (פחות מ-20 מילים), בקש הרחבה או דוגמה ספציפית
- אם האדם סטה מהנושא, החזר אותו בעדינות ובכבוד לנושא ${topicConfig.hebrewName}
- שאל על היבטים שעדיין לא נדונו
- השאלה צריכה להיות קצרה וברורה (עד 25 מילים)
- בעברית
- טון חם, מכבד ורגיש - זכור שמדובר בספר הנצחה
- עזור להוציא זיכרונות, רגשות וסיפורים אישיים

החזר JSON בפורמט הבא:
{
  "question": "השאלה כאן",
  "isFollowUp": true/false (האם זו שאלת המשך על התשובה האחרונה)
}`;

  try {
    const result = await generateWithBreaker(prompt);
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
    // Fallback questions per topic - Memorial focused
    const fallbackQuestions: Record<InterviewTopic, string[]> = {
      person: [
        'ספר/י לי על האדם שאתה רוצה להנציח',
        'מה היו התכונות הבולטות שלו/שלה?',
        'מה היה הדבר הכי מיוחד באישיות שלו/שלה?',
      ],
      memories: [
        'מה הזיכרון הכי חזק שיש לך איתו/איתה?',
        'יש סיפור מצחיק שתמיד מספרים במשפחה?',
        'מה הרגעים שאתה הכי אוהב לזכור?',
      ],
      impact: [
        'איך הוא/היא שינה את החיים שלך?',
        'מה למדת ממנו/ממנה?',
        'מה הוא/היא היה רוצה שתזכרו?',
      ],
      legacy: [
        'מה חשוב לך שהדורות הבאים יידעו?',
        'איך אתה רוצה לשמר את הזיכרון?',
        'מה המסר שהוא/היא היה רוצה להעביר?',
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

    const result = await generateWithBreaker(prompt);
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
    person: [],
    memories: [],
    impact: [],
    legacy: [],
  };

  state.responses.forEach(r => {
    responsesByTopic[r.topic].push(`שאלה: ${r.question}\nתשובה: ${r.answer}`);
  });

  const prompt = `אתה מלווה רגיש שעוזר למשפחות לכתוב ספרי הנצחה. נתח את הראיון הבא וצור סיכום מקיף שיעזור בכתיבת ספר ההנצחה.

## על האדם:
${responsesByTopic.person.join('\n\n')}

## זיכרונות:
${responsesByTopic.memories.join('\n\n')}

## השפעה:
${responsesByTopic.impact.join('\n\n')}

## מורשת:
${responsesByTopic.legacy.join('\n\n')}

צור סיכום מובנה בפורמט JSON הבא:
{
  "person": {
    "name": "שם האדם המונצח",
    "relationship": "הקשר של הכותב לאדם",
    "lifeSpan": "תקופת החיים (אם צוין)",
    "occupation": "עיסוק או תפקיד",
    "personalityTraits": ["תכונה 1", "תכונה 2", "תכונה 3"],
    "definingQualities": "התכונות המגדירות ביותר"
  },
  "memories": {
    "favoriteMemories": ["זיכרון אהוב 1", "זיכרון אהוב 2"],
    "funnyStories": ["סיפור מצחיק 1", "סיפור מצחיק 2"],
    "significantMoments": ["רגע משמעותי 1", "רגע משמעותי 2"],
    "traditions": ["מסורת משפחתית 1", "מסורת 2"]
  },
  "impact": {
    "lessonsTaught": ["לקח 1", "לקח 2"],
    "howTheyChangedLives": "איך שינה/שינתה חיים",
    "whatTheyWouldWant": "מה היה רוצה שיזכרו",
    "lastingInfluence": "ההשפעה המתמשכת"
  },
  "legacy": {
    "forFutureGenerations": "מה לדעת לדורות הבאים",
    "howToPreserveMemory": "איך לשמר את הזיכרון",
    "keyMessage": "המסר המרכזי",
    "dedication": "הקדשה מוצעת"
  },
  "writingGuidelines": [
    "הנחיה לכתיבה רגישה 1",
    "הנחיה לכתיבה 2",
    "הנחיה לכתיבה 3"
  ]
}

חשוב:
- הכל בעברית
- התבסס רק על מה שנאמר בראיון
- אם מידע חסר, כתוב "לא צוין"
- הנחיות הכתיבה צריכות להיות רגישות ומכבדות
- שמור על טון חם ומכבד לאורך כל הסיכום`;

  try {
    const result = await generateWithBreaker(prompt);
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
    person: {
      name: 'לא צוין',
      relationship: 'לא צוין',
      lifeSpan: 'לא צוין',
      occupation: 'לא צוין',
      personalityTraits: [],
      definingQualities: 'לא צוין',
    },
    memories: {
      favoriteMemories: [],
      funnyStories: [],
      significantMoments: [],
      traditions: [],
    },
    impact: {
      lessonsTaught: [],
      howTheyChangedLives: 'לא צוין',
      whatTheyWouldWant: 'לא צוין',
      lastingInfluence: 'לא צוין',
    },
    legacy: {
      forFutureGenerations: 'לא צוין',
      howToPreserveMemory: 'לא צוין',
      keyMessage: 'לא צוין',
      dedication: 'לא צוין',
    },
    writingGuidelines: [
      'ספר את הסיפורים בצורה חמה ואישית',
      'שמור על כבוד וענווה בכתיבה',
      'הבא את האדם לחיים דרך דוגמאות וזיכרונות ספציפיים',
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
    'person_memories': 'תודה רבה. עכשיו אשמח לשמוע על זיכרונות מיוחדים שיש לך.',
    'memories_impact': 'אלו זיכרונות יפים. ספר לי איך הוא/היא השפיע על חייך.',
    'impact_legacy': 'זה מרגש. לסיום, מה חשוב לך שהדורות הבאים יידעו?',
  };

  const key = `${fromTopic}_${toTopic}`;
  return transitions[key] || 'תודה. בוא נמשיך לנושא הבא.';
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
