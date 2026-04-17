/**
 * Story Generation Service
 * Takes interview answers and generates a complete, publish-ready book.
 * This is the core "Tell me your story → get a book" feature.
 */

import { generateWithBreaker } from './geminiClient';
import { detectLanguage, getLanguageInstruction, SupportedLanguage } from '../utils/languageHelper';

// Chapter structure for generated book
export interface GeneratedChapter {
  title: string;
  content: string;
  wordCount: number;
}

// Full generated book
export interface GeneratedBook {
  title: string;
  synopsis: string;
  chapters: GeneratedChapter[];
  totalWords: number;
  language: string;
}

// Interview data that can come from any interview type
export interface StoryInput {
  // Book metadata
  bookTitle: string;
  genre: string;
  language: string;

  // From memorial interview
  person?: {
    name?: string;
    relationship?: string;
    lifeSpan?: string;
    occupation?: string;
    personalityTraits?: string[];
    definingQualities?: string;
  };
  memories?: {
    favoriteMemories?: string[];
    funnyStories?: string[];
    significantMoments?: string[];
    traditions?: string[];
  };
  impact?: {
    lessonsTaught?: string[];
    howTheyChangedLives?: string;
    whatTheyWouldWant?: string;
    lastingInfluence?: string;
  };
  legacy?: {
    forFutureGenerations?: string;
    howToPreserveMemory?: string;
    keyMessage?: string;
    dedication?: string;
  };

  // From chat interview (fiction/general)
  theme?: string;
  characters?: string;
  conflict?: string;
  setting?: string;
  climax?: string;
  resolution?: string;
  keyPoints?: string;
  narrativeArc?: string;

  // Raw interview answers (fallback)
  rawAnswers?: string;

  // Template-based structure
  templateChapters?: {
    title: string;
    guidingQuestions: string[];
  }[];

  // Progress callback
  onProgress?: (step: string, percent: number) => void;
}

/**
 * Generate a complete book from interview data.
 * This is the main entry point for "Tell me → Book" flow.
 */
export async function generateCompleteBook(input: StoryInput): Promise<GeneratedBook> {
  const lang = (input.language || 'he') as SupportedLanguage;
  const langInstruction = getLanguageInstruction(lang);
  const isHebrew = lang === 'he';
  const progress = input.onProgress || (() => {});

  // Step 1: Build the story context from all available data
  progress(isHebrew ? 'מנתח את הסיפור שלך...' : 'Analyzing your story...', 5);
  const storyContext = buildStoryContext(input, lang);

  // Step 2: Generate chapter outline
  progress(isHebrew ? 'מתכנן את מבנה הספר...' : 'Planning book structure...', 15);
  const chapterOutline = await generateChapterOutline(input, storyContext, langInstruction);

  // Step 3: Generate each chapter
  const chapters: GeneratedChapter[] = [];
  let previousChapters = '';

  for (let i = 0; i < chapterOutline.length; i++) {
    const outline = chapterOutline[i];
    const percent = 20 + Math.round((i / chapterOutline.length) * 60);
    progress(
      isHebrew ? `כותב פרק ${i + 1} מתוך ${chapterOutline.length}: "${outline.title}"...` : `Writing chapter ${i + 1} of ${chapterOutline.length}: "${outline.title}"...`,
      percent
    );

    const chapterContent = await generateChapter(
      outline,
      storyContext,
      previousChapters,
      i,
      chapterOutline.length,
      langInstruction,
      input.genre,
    );

    const wordCount = chapterContent.split(/\s+/).filter(w => w.length > 0).length;
    chapters.push({
      title: outline.title,
      content: chapterContent,
      wordCount,
    });

    // Keep summary of previous chapters for context continuity
    previousChapters += `\n\nפרק ${i + 1} - ${outline.title}: ${chapterContent.slice(0, 200)}...`;
  }

  // Step 4: Generate synopsis
  progress(isHebrew ? 'כותב תקציר לכריכה האחורית...' : 'Writing back cover synopsis...', 85);
  const synopsis = await generateBookSynopsis(input.bookTitle, chapters, langInstruction, input.genre);

  // Step 5: Calculate total
  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

  progress(isHebrew ? 'הספר מוכן!' : 'Book is ready!', 100);

  return {
    title: input.bookTitle,
    synopsis,
    chapters,
    totalWords,
    language: lang,
  };
}

/**
 * Build a rich story context string from all available interview data
 */
function buildStoryContext(input: StoryInput, lang: SupportedLanguage): string {
  const parts: string[] = [];

  // Memorial data
  if (input.person) {
    const p = input.person;
    parts.push(`PERSON: ${p.name || 'Unknown'} (${p.relationship || ''}).`);
    if (p.occupation) parts.push(`Occupation: ${p.occupation}`);
    if (p.lifeSpan) parts.push(`Life: ${p.lifeSpan}`);
    if (p.definingQualities) parts.push(`Defining qualities: ${p.definingQualities}`);
    if (p.personalityTraits?.length) parts.push(`Traits: ${p.personalityTraits.join(', ')}`);
  }

  if (input.memories) {
    const m = input.memories;
    if (m.favoriteMemories?.length) parts.push(`FAVORITE MEMORIES:\n${m.favoriteMemories.map(mem => `- ${mem}`).join('\n')}`);
    if (m.funnyStories?.length) parts.push(`FUNNY STORIES:\n${m.funnyStories.map(s => `- ${s}`).join('\n')}`);
    if (m.significantMoments?.length) parts.push(`SIGNIFICANT MOMENTS:\n${m.significantMoments.map(s => `- ${s}`).join('\n')}`);
    if (m.traditions?.length) parts.push(`TRADITIONS:\n${m.traditions.map(t => `- ${t}`).join('\n')}`);
  }

  if (input.impact) {
    const imp = input.impact;
    if (imp.lessonsTaught?.length) parts.push(`LESSONS TAUGHT: ${imp.lessonsTaught.join('; ')}`);
    if (imp.howTheyChangedLives) parts.push(`IMPACT ON LIVES: ${imp.howTheyChangedLives}`);
    if (imp.lastingInfluence) parts.push(`LASTING INFLUENCE: ${imp.lastingInfluence}`);
  }

  if (input.legacy) {
    const leg = input.legacy;
    if (leg.keyMessage) parts.push(`KEY MESSAGE: ${leg.keyMessage}`);
    if (leg.forFutureGenerations) parts.push(`FOR FUTURE GENERATIONS: ${leg.forFutureGenerations}`);
    if (leg.dedication) parts.push(`DEDICATION: ${leg.dedication}`);
  }

  // Fiction/general interview data
  if (input.theme) parts.push(`THEME: ${input.theme}`);
  if (input.characters) parts.push(`CHARACTERS: ${input.characters}`);
  if (input.conflict) parts.push(`CONFLICT: ${input.conflict}`);
  if (input.setting) parts.push(`SETTING: ${input.setting}`);
  if (input.climax) parts.push(`CLIMAX: ${input.climax}`);
  if (input.resolution) parts.push(`RESOLUTION: ${input.resolution}`);
  if (input.keyPoints) parts.push(`KEY POINTS: ${input.keyPoints}`);
  if (input.narrativeArc) parts.push(`NARRATIVE ARC: ${input.narrativeArc}`);

  // Raw answers as fallback
  if (input.rawAnswers && parts.length < 3) {
    parts.push(`RAW INTERVIEW:\n${input.rawAnswers}`);
  }

  return parts.join('\n\n');
}

/**
 * Generate chapter outline from story context
 */
async function generateChapterOutline(
  input: StoryInput,
  storyContext: string,
  langInstruction: string
): Promise<{ title: string; outline: string; mood: string }[]> {

  // If template provides chapter structure, use it
  if (input.templateChapters?.length) {
    return input.templateChapters.map(ch => ({
      title: ch.title,
      outline: ch.guidingQuestions.join('\n'),
      mood: 'warm',
    }));
  }

  // Otherwise, ask AI to create optimal structure
  const prompt = `You are an experienced book editor creating the chapter structure for a personal story book.
${langInstruction}

BOOK TITLE: "${input.bookTitle}"
GENRE: ${input.genre || 'life_story'}

STORY MATERIAL FROM INTERVIEW:
${storyContext}

TASK:
Create 5-7 chapters for this book. Each chapter should cover a natural phase or theme from the story.

RULES:
- Chapter titles should be evocative and emotional, not generic ("The Door That Never Closed" not "Chapter 1")
- Each chapter should have a clear emotional arc
- The order should feel natural — chronological for life stories, thematic for memorials
- Write the titles and outlines in the SAME LANGUAGE as the story material

Respond in EXACTLY this JSON format, no extra text:
[
  {"title": "chapter title", "outline": "2-3 sentences describing what this chapter covers", "mood": "emotional tone"},
  ...
]`;

  const result = await generateWithBreaker(prompt);
  const text = result.response.text().trim();

  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse chapter outline:', e);
  }

  // Fallback: generic 5-chapter structure
  const isHebrew = (input.language || 'he') === 'he';
  return [
    { title: isHebrew ? 'ההתחלה' : 'The Beginning', outline: 'Introduction and background', mood: 'nostalgic' },
    { title: isHebrew ? 'ימים של אור' : 'Days of Light', outline: 'Happy memories and key moments', mood: 'joyful' },
    { title: isHebrew ? 'אתגרים ושינויים' : 'Challenges and Changes', outline: 'Difficulties and growth', mood: 'reflective' },
    { title: isHebrew ? 'מה שנשאר' : 'What Remains', outline: 'Legacy and lasting impact', mood: 'meaningful' },
    { title: isHebrew ? 'מכתב מהלב' : 'A Letter from the Heart', outline: 'Personal message and closing', mood: 'intimate' },
  ];
}

/**
 * Generate a single chapter's full content
 */
async function generateChapter(
  outline: { title: string; outline: string; mood: string },
  storyContext: string,
  previousChapters: string,
  chapterIndex: number,
  totalChapters: number,
  langInstruction: string,
  genre?: string,
): Promise<string> {

  const isFirstChapter = chapterIndex === 0;
  const isLastChapter = chapterIndex === totalChapters - 1;

  const prompt = `You are a talented ghostwriter creating a personal story book.
Your job is to take interview material and transform it into beautiful, emotionally rich prose.
${langInstruction}

WRITING STYLE RULES:
- Write in first person ("I remember..." / "אני זוכר...")
- Start each chapter with a SCENE, not an explanation. "The door opened and..." not "In this chapter I will tell about..."
- Use sensory details: smells, sounds, textures, colors
- Vary sentence length: short. Then longer, building up detail and emotion.
- Show emotions through actions: "His hands trembled" not "He was emotional"
- End the chapter with a powerful last line — a quote, an image, or a short sharp sentence
- Keep the narrator's authentic voice — don't over-polish
- NO clichés. Be specific and personal.
- Write 600-1000 words per chapter

CHAPTER DETAILS:
Title: "${outline.title}"
Chapter ${chapterIndex + 1} of ${totalChapters}
Outline: ${outline.outline}
Mood: ${outline.mood}
${isFirstChapter ? 'THIS IS THE OPENING CHAPTER — hook the reader immediately.' : ''}
${isLastChapter ? 'THIS IS THE FINAL CHAPTER — bring everything together with emotion and meaning.' : ''}

STORY MATERIAL:
${storyContext}

${previousChapters ? `PREVIOUS CHAPTERS (for continuity — don't repeat, build upon):\n${previousChapters.slice(-500)}` : ''}

Write the FULL chapter now. Only the chapter text, no titles, no "Chapter X" headers, no meta-commentary.`;

  const result = await generateWithBreaker(prompt);
  let text = result.response.text().trim();

  // Clean up: remove any markdown headers or meta text the AI might add
  text = text.replace(/^#+\s+.+$/gm, ''); // Remove markdown headers
  text = text.replace(/^(Chapter \d+|פרק \d+)[:\s-]*.*/gim, ''); // Remove chapter labels
  text = text.trim();

  // Wrap paragraphs in HTML for the editor
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  const htmlContent = paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');

  return htmlContent;
}

/**
 * Generate a short synopsis for the back cover (max 500 chars)
 */
async function generateBookSynopsis(
  title: string,
  chapters: GeneratedChapter[],
  langInstruction: string,
  genre?: string,
): Promise<string> {

  const chapterSummary = chapters
    .map((ch, i) => `Chapter ${i + 1} "${ch.title}": ${ch.content.replace(/<[^>]*>/g, '').slice(0, 150)}...`)
    .join('\n');

  const prompt = `Write a SHORT back-cover synopsis for a book called "${title}".
${langInstruction}

BOOK CONTENT:
${chapterSummary}

RULES:
- Maximum 400 characters (this will be printed on the physical back cover)
- Hook the reader in the first sentence
- Be emotional and specific, not generic
- 2 short paragraphs maximum
- Write ONLY the synopsis text, nothing else`;

  const result = await generateWithBreaker(prompt);
  let synopsis = result.response.text().trim();

  // Truncate at sentence boundary if too long
  if (synopsis.length > 500) {
    const truncated = synopsis.slice(0, 497);
    const lastPeriod = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?'),
      truncated.lastIndexOf('。'),
    );
    synopsis = lastPeriod > 250 ? truncated.slice(0, lastPeriod + 1) : truncated + '...';
  }

  return synopsis;
}
