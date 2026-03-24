/**
 * Language Helper for AI Services
 * Ensures AI responses match the user's language preference
 */

export type SupportedLanguage = 'en' | 'he';

/**
 * Detect language from text content
 * Returns 'he' if majority of text is Hebrew, 'en' otherwise
 */
export function detectLanguage(text: string): SupportedLanguage {
  if (!text) return 'en';

  // Count Hebrew characters (Hebrew Unicode range: 0x0590-0x05FF)
  const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;

  // If more than 30% Hebrew characters, consider it Hebrew
  return hebrewChars > totalChars * 0.3 ? 'he' : 'en';
}

/**
 * Get language instruction for AI prompts
 * This tells the AI which language to respond in
 */
export function getLanguageInstruction(language: SupportedLanguage): string {
  if (language === 'he') {
    return `
IMPORTANT: You MUST respond entirely in Hebrew (עברית).
All text, feedback, suggestions, and explanations must be in Hebrew.
Do not mix languages - use Hebrew only.`;
  }
  return `
IMPORTANT: You MUST respond entirely in English.
All text, feedback, suggestions, and explanations must be in English.
Do not mix languages - use English only.`;
}

/**
 * Get localized genre name
 */
export function getLocalizedGenre(genre: string, language: SupportedLanguage): string {
  const genreMap: Record<string, { en: string; he: string }> = {
    'fiction': { en: 'Fiction', he: 'בדיון' },
    'fantasy': { en: 'Fantasy', he: 'פנטזיה' },
    'sci-fi': { en: 'Science Fiction', he: 'מדע בדיוני' },
    'romance': { en: 'Romance', he: 'רומן' },
    'thriller': { en: 'Thriller', he: 'מותחן' },
    'mystery': { en: 'Mystery', he: 'מסתורין' },
    'horror': { en: 'Horror', he: 'אימה' },
    'children': { en: 'Children\'s Book', he: 'ספר ילדים' },
    'young-adult': { en: 'Young Adult', he: 'נוער' },
    'historical': { en: 'Historical Fiction', he: 'היסטורי' },
    'biography': { en: 'Biography', he: 'ביוגרפיה' },
    'self-help': { en: 'Self-Help', he: 'עזרה עצמית' },
    'business': { en: 'Business', he: 'עסקים' },
    'poetry': { en: 'Poetry', he: 'שירה' },
  };

  const normalizedGenre = genre.toLowerCase();
  const mapping = genreMap[normalizedGenre];

  if (mapping) {
    return mapping[language];
  }

  return genre;
}

/**
 * Get localized labels for quality analysis
 */
export function getLocalizedRatingLabel(
  label: 'Masterpiece' | 'Excellent' | 'Good' | 'Fair' | 'Needs Work',
  language: SupportedLanguage
): string {
  const labels: Record<string, { en: string; he: string }> = {
    'Masterpiece': { en: 'Masterpiece', he: 'יצירת מופת' },
    'Excellent': { en: 'Excellent', he: 'מצוין' },
    'Good': { en: 'Good', he: 'טוב' },
    'Fair': { en: 'Fair', he: 'סביר' },
    'Needs Work': { en: 'Needs Work', he: 'דורש עבודה' },
  };

  return labels[label]?.[language] || label;
}

/**
 * Common prompts in both languages
 */
export const PROMPTS = {
  respondAsJson: {
    en: 'Respond ONLY with valid JSON in this exact format:',
    he: 'הגב אך ורק ב-JSON תקין בפורמט הבא:',
  },
  noExplanations: {
    en: 'Provide only the result, no explanations or additional text.',
    he: 'ספק רק את התוצאה, ללא הסברים או טקסט נוסף.',
  },
  task: {
    en: 'TASK:',
    he: 'משימה:',
  },
  context: {
    en: 'CONTEXT:',
    he: 'הקשר:',
  },
  requirements: {
    en: 'REQUIREMENTS:',
    he: 'דרישות:',
  },
};

/**
 * Get a prompt section in the correct language
 */
export function getPrompt(key: keyof typeof PROMPTS, language: SupportedLanguage): string {
  return PROMPTS[key][language];
}
