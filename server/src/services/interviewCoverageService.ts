/**
 * Interview Coverage Service
 * Compares the book's written content against the 8-topic chat-interview
 * summary. Flags topics that weren't addressed and returns a coverage score
 * with concrete suggestions for what's missing.
 */

import { generateWithBreaker } from './geminiClient';
import { IBook } from '../models/Book';
import { SupportedLanguage, detectLanguage } from '../utils/languageHelper';

export type CoverageTopic =
  | 'theme'
  | 'characters'
  | 'conflict'
  | 'climax'
  | 'resolution'
  | 'setting'
  | 'keyPoints'
  | 'narrativeArc';

export interface TopicCoverage {
  topic: CoverageTopic;
  label: string;
  interviewAnswer: string;
  coverageScore: number; // 0-100
  status: 'covered' | 'partial' | 'missing';
  gap: string;
  suggestion: string;
}

export interface InterviewCoverageResult {
  overallScore: number; // 0-100 average
  topics: TopicCoverage[];
  topGaps: string[]; // the 3 biggest gaps, ranked
  encouragement: string;
}

const TOPIC_LABELS: Record<CoverageTopic, { he: string; en: string }> = {
  theme: { he: 'נושא ורעיון מרכזי', en: 'Theme & Premise' },
  characters: { he: 'דמויות ראשיות', en: 'Main Characters' },
  conflict: { he: 'קונפליקט מרכזי', en: 'Central Conflict' },
  climax: { he: 'שיא מתוכנן', en: 'Planned Climax' },
  resolution: { he: 'סיום ופתרון', en: 'Resolution' },
  setting: { he: 'סביבה ועולם', en: 'Setting & World' },
  keyPoints: { he: 'נקודות מפתח בעלילה', en: 'Key Plot Points' },
  narrativeArc: { he: 'קשת נרטיבית וטון', en: 'Narrative Arc & Tone' },
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function analyzeInterviewCoverage(
  book: IBook,
  language?: SupportedLanguage
): Promise<InterviewCoverageResult | null> {
  const sc: any = book.storyContext || {};
  const topicKeys: CoverageTopic[] = ['theme', 'characters', 'conflict', 'climax', 'resolution', 'setting', 'keyPoints', 'narrativeArc'];
  const activeTopics = topicKeys.filter((k) => sc[k]);

  if (activeTopics.length === 0) {
    return null; // No interview to compare against
  }

  const bookText = (book.chapters || [])
    .map((c: any) => stripHtml(c.content || ''))
    .join('\n\n')
    .slice(0, 12000); // Cap to stay within prompt budget

  if (!bookText || bookText.length < 100) {
    return null; // Not enough written to compare
  }

  const lang = language || detectLanguage(bookText);
  const isHebrew = lang === 'he';

  const interviewBlock = activeTopics
    .map((k) => `[${k}] ${TOPIC_LABELS[k][isHebrew ? 'he' : 'en']}: ${sc[k]}`)
    .join('\n');

  const prompt = isHebrew
    ? `אתה עורך ספרותי. המחבר ענה בראיון על 8 נושאים לגבי הסיפור, ואז התחיל לכתוב את הספר.
המשימה שלך: להשוות בין מה שהמחבר **אמר בראיון** לבין מה שהוא **בפועל כתב בטקסט**, ולזהות נושאים שלא קיבלו ביטוי מספק בטקסט.

תשובות הראיון:
${interviewBlock}

הטקסט של הספר עד כה:
---
${bookText}
---

לכל אחד מהנושאים שבראיון, החזר אובייקט הכולל:
- topic: מזהה הנושא (theme/characters/conflict/climax/resolution/setting/keyPoints/narrativeArc)
- coverageScore: ציון 0-100 עד כמה הנושא בא לידי ביטוי בטקסט
- status: "covered" (מכוסה היטב, 70+), "partial" (חלקי, 30-69), או "missing" (חסר, פחות מ-30)
- gap: משפט אחד קצר שמתאר מה חסר או לא מספיק מפותח. אם הנושא מכוסה מצוין, כתוב "".
- suggestion: הצעה קונקרטית וקצרה (1-2 משפטים) איך לשלב/לפתח את הנושא הזה בטקסט. אם מכוסה מצוין, כתוב "".

לבסוף, החזר:
- overallScore: ממוצע הציונים
- topGaps: מערך של עד 3 פערים הכי בולטים (משפטים קצרים)
- encouragement: משפט עידוד קצר בהתאם לציון הכולל

החזר אך ורק JSON תקין:
{
  "overallScore": <0-100>,
  "topics": [
    { "topic": "...", "coverageScore": <0-100>, "status": "...", "gap": "...", "suggestion": "..." }
  ],
  "topGaps": ["...", "...", "..."],
  "encouragement": "..."
}`
    : `You are a literary editor. The author answered an interview covering 8 story topics, then began writing the book.
Your task: compare what the author **said in the interview** against what they **actually wrote**, and flag topics underrepresented in the text.

Interview answers:
${interviewBlock}

Book text so far:
---
${bookText}
---

For each interview topic, return an object with:
- topic: identifier (theme/characters/conflict/climax/resolution/setting/keyPoints/narrativeArc)
- coverageScore: 0-100 for how well this topic is reflected in the text
- status: "covered" (70+), "partial" (30-69), or "missing" (<30)
- gap: one short sentence describing what is missing or underdeveloped. Empty string if well covered.
- suggestion: a concrete 1-2 sentence suggestion on how to weave this topic into the text. Empty string if well covered.

Also return:
- overallScore: average of scores
- topGaps: array of up to 3 most important gaps (short sentences)
- encouragement: one short encouragement line based on overall score

Return ONLY valid JSON:
{
  "overallScore": <0-100>,
  "topics": [...],
  "topGaps": ["...", "...", "..."],
  "encouragement": "..."
}`;

  try {
    const result = await generateWithBreaker(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    // Enrich with labels + original interview answers for UI
    const topics: TopicCoverage[] = (parsed.topics || []).map((t: any) => ({
      topic: t.topic,
      label: TOPIC_LABELS[t.topic as CoverageTopic]?.[isHebrew ? 'he' : 'en'] || t.topic,
      interviewAnswer: sc[t.topic] || '',
      coverageScore: Math.max(0, Math.min(100, Number(t.coverageScore) || 0)),
      status: t.status === 'covered' || t.status === 'partial' || t.status === 'missing' ? t.status : 'partial',
      gap: String(t.gap || ''),
      suggestion: String(t.suggestion || ''),
    }));

    return {
      overallScore: Math.max(0, Math.min(100, Number(parsed.overallScore) || 0)),
      topics,
      topGaps: Array.isArray(parsed.topGaps) ? parsed.topGaps.slice(0, 3).map(String) : [],
      encouragement: String(parsed.encouragement || ''),
    };
  } catch (error) {
    console.error('Error analyzing interview coverage:', error);
    return null;
  }
}
