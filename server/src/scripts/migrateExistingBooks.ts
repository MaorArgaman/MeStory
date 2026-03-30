/**
 * Migration Script: Generate Audio & Translations for Existing Books
 *
 * CORRECT ORDER:
 * 1. Generate audio in ORIGINAL language (male + female)
 * 2. Generate translation to OTHER language
 * 3. Generate audio for TRANSLATED content (male + female)
 *
 * Run with: npx ts-node --transpile-only src/scripts/migrateExistingBooks.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { Book } from '../models/Book';
import { generateChapterAudio, GeminiVoiceName } from '../services/geminiTTSService';
import { translateChapter } from '../services/geminiService';

const DEFAULT_MALE_VOICE: GeminiVoiceName = 'Charon';
const DEFAULT_FEMALE_VOICE: GeminiVoiceName = 'Aoede';

// Force regenerate audio even if it exists
const FORCE_REGENERATE = true;

async function migrateBook(book: any): Promise<void> {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Processing: "${book.title}" (${book.id})`);
  console.log(`Original Language: ${book.language || 'en'}`);
  console.log(`Chapters: ${book.chapters?.length || 0}`);
  console.log(`${'='.repeat(50)}`);

  const chapters = book.chapters || [];
  const bookLanguage = book.language || 'en';
  const isHebrew = bookLanguage === 'he' || bookLanguage === 'hebrew';
  const targetLanguage = isHebrew ? 'english' : 'hebrew';
  const translationKey = isHebrew ? 'english' : 'hebrew';

  // STEP 1: Generate translation first (we need it for the other language audio)
  console.log(`\n📝 STEP 1: Generate translation to ${targetLanguage}...`);

  let translatedChapters: any[] = [];
  let translatedTitle = '';

  const existingTranslation = book.translations?.[translationKey];
  if (existingTranslation?.chapters?.length > 0 && !FORCE_REGENERATE) {
    console.log(`  Translation already exists, using existing.`);
    translatedChapters = existingTranslation.chapters;
    translatedTitle = existingTranslation.title;
  } else {
    try {
      // Translate title
      const titleTranslation = await translateChapter(book.title, book.title, targetLanguage);
      translatedTitle = titleTranslation.translatedTitle;
      console.log(`  Title: "${book.title}" → "${translatedTitle}"`);

      // Translate chapters
      for (const chapter of chapters) {
        try {
          console.log(`  Translating chapter: "${chapter.title}"...`);
          const translation = await translateChapter(
            chapter.content || '',
            chapter.title || `Chapter ${chapter.order}`,
            targetLanguage
          );
          translatedChapters.push({
            _id: chapter._id || `chapter-${chapter.order}`,
            title: translation.translatedTitle,
            content: translation.translatedContent,
            order: chapter.order,
          });
          console.log(`    → "${translation.translatedTitle}"`);
        } catch (err: any) {
          console.error(`    Failed: ${err.message}`);
          translatedChapters.push({
            _id: chapter._id || `chapter-${chapter.order}`,
            title: chapter.title,
            content: chapter.content || '',
            order: chapter.order,
          });
        }
      }

      // Save translation to database
      const translations: any = book.translations || {};
      translations[translationKey] = {
        title: translatedTitle,
        chapters: translatedChapters,
        generatedAt: new Date().toISOString(),
      };
      await Book.findByIdAndUpdate(book.id, { translations });
      console.log(`  ✅ Translation saved!`);
    } catch (err: any) {
      console.error(`  Translation failed: ${err.message}`);
      return; // Can't continue without translation
    }
  }

  // STEP 2: Generate audio for each chapter
  console.log(`\n🎙️ STEP 2: Generate audio files...`);

  const updatedChapters = [];

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const translatedChapter = translatedChapters[i];
    const chapterId = chapter._id || `chapter-${chapter.order}`;
    const audio: any = {};

    console.log(`\n  Chapter ${i + 1}: "${chapter.title}"`);

    // Original language content
    const originalContent = chapter.content || '';
    // Translated content
    const translatedContent = translatedChapter?.content || '';

    if (isHebrew) {
      // Book is in Hebrew
      // Hebrew audio uses original Hebrew content
      // English audio uses translated English content

      // 2a. Hebrew male voice (original)
      try {
        console.log(`    - Hebrew male voice (original)...`);
        const result = await generateChapterAudio(
          book.id,
          `${chapterId}-he-male-v2`,
          originalContent,
          { voice: DEFAULT_MALE_VOICE, authorGender: 'male', language: 'he' }
        );
        audio.maleVoiceHe = {
          url: result.audioUrl,
          duration: result.duration,
          voice: result.voice,
          language: 'he',
          generatedAt: new Date().toISOString(),
        };
        console.log(`      ✅ Done (${result.duration}s)`);
      } catch (err: any) {
        console.error(`      ❌ Failed: ${err.message}`);
      }

      // 2b. Hebrew female voice (original)
      try {
        console.log(`    - Hebrew female voice (original)...`);
        const result = await generateChapterAudio(
          book.id,
          `${chapterId}-he-female-v2`,
          originalContent,
          { voice: DEFAULT_FEMALE_VOICE, authorGender: 'female', language: 'he' }
        );
        audio.femaleVoiceHe = {
          url: result.audioUrl,
          duration: result.duration,
          voice: result.voice,
          language: 'he',
          generatedAt: new Date().toISOString(),
        };
        console.log(`      ✅ Done (${result.duration}s)`);
      } catch (err: any) {
        console.error(`      ❌ Failed: ${err.message}`);
      }

      // 2c. English male voice (translated)
      if (translatedContent) {
        try {
          console.log(`    - English male voice (translated)...`);
          const result = await generateChapterAudio(
            book.id,
            `${chapterId}-en-male-v2`,
            translatedContent,
            { voice: DEFAULT_MALE_VOICE, authorGender: 'male', language: 'en' }
          );
          audio.maleVoiceEn = {
            url: result.audioUrl,
            duration: result.duration,
            voice: result.voice,
            language: 'en',
            generatedAt: new Date().toISOString(),
          };
          audio.maleVoice = audio.maleVoiceEn; // Legacy
          console.log(`      ✅ Done (${result.duration}s)`);
        } catch (err: any) {
          console.error(`      ❌ Failed: ${err.message}`);
        }
      }

      // 2d. English female voice (translated)
      if (translatedContent) {
        try {
          console.log(`    - English female voice (translated)...`);
          const result = await generateChapterAudio(
            book.id,
            `${chapterId}-en-female-v2`,
            translatedContent,
            { voice: DEFAULT_FEMALE_VOICE, authorGender: 'female', language: 'en' }
          );
          audio.femaleVoiceEn = {
            url: result.audioUrl,
            duration: result.duration,
            voice: result.voice,
            language: 'en',
            generatedAt: new Date().toISOString(),
          };
          audio.femaleVoice = audio.femaleVoiceEn; // Legacy
          console.log(`      ✅ Done (${result.duration}s)`);
        } catch (err: any) {
          console.error(`      ❌ Failed: ${err.message}`);
        }
      }
    } else {
      // Book is in English
      // English audio uses original English content
      // Hebrew audio uses translated Hebrew content

      // 2a. English male voice (original)
      try {
        console.log(`    - English male voice (original)...`);
        const result = await generateChapterAudio(
          book.id,
          `${chapterId}-en-male-v2`,
          originalContent,
          { voice: DEFAULT_MALE_VOICE, authorGender: 'male', language: 'en' }
        );
        audio.maleVoiceEn = {
          url: result.audioUrl,
          duration: result.duration,
          voice: result.voice,
          language: 'en',
          generatedAt: new Date().toISOString(),
        };
        audio.maleVoice = audio.maleVoiceEn; // Legacy
        console.log(`      ✅ Done (${result.duration}s)`);
      } catch (err: any) {
        console.error(`      ❌ Failed: ${err.message}`);
      }

      // 2b. English female voice (original)
      try {
        console.log(`    - English female voice (original)...`);
        const result = await generateChapterAudio(
          book.id,
          `${chapterId}-en-female-v2`,
          originalContent,
          { voice: DEFAULT_FEMALE_VOICE, authorGender: 'female', language: 'en' }
        );
        audio.femaleVoiceEn = {
          url: result.audioUrl,
          duration: result.duration,
          voice: result.voice,
          language: 'en',
          generatedAt: new Date().toISOString(),
        };
        audio.femaleVoice = audio.femaleVoiceEn; // Legacy
        console.log(`      ✅ Done (${result.duration}s)`);
      } catch (err: any) {
        console.error(`      ❌ Failed: ${err.message}`);
      }

      // 2c. Hebrew male voice (translated)
      if (translatedContent) {
        try {
          console.log(`    - Hebrew male voice (translated)...`);
          const result = await generateChapterAudio(
            book.id,
            `${chapterId}-he-male-v2`,
            translatedContent,
            { voice: DEFAULT_MALE_VOICE, authorGender: 'male', language: 'he' }
          );
          audio.maleVoiceHe = {
            url: result.audioUrl,
            duration: result.duration,
            voice: result.voice,
            language: 'he',
            generatedAt: new Date().toISOString(),
          };
          console.log(`      ✅ Done (${result.duration}s)`);
        } catch (err: any) {
          console.error(`      ❌ Failed: ${err.message}`);
        }
      }

      // 2d. Hebrew female voice (translated)
      if (translatedContent) {
        try {
          console.log(`    - Hebrew female voice (translated)...`);
          const result = await generateChapterAudio(
            book.id,
            `${chapterId}-he-female-v2`,
            translatedContent,
            { voice: DEFAULT_FEMALE_VOICE, authorGender: 'female', language: 'he' }
          );
          audio.femaleVoiceHe = {
            url: result.audioUrl,
            duration: result.duration,
            voice: result.voice,
            language: 'he',
            generatedAt: new Date().toISOString(),
          };
          console.log(`      ✅ Done (${result.duration}s)`);
        } catch (err: any) {
          console.error(`      ❌ Failed: ${err.message}`);
        }
      }
    }

    updatedChapters.push({
      ...chapter,
      audio,
    });
  }

  // Save audio to database
  await Book.findByIdAndUpdate(book.id, { chapters: updatedChapters });
  console.log(`\n✅ Audio saved to database!`);

  console.log(`\n🎉 Book "${book.title}" migration complete!`);
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION: Audio & Translations for Existing Books');
  console.log('='.repeat(60));

  try {
    // Find all published books
    const books = await Book.find({
      'publishingStatus.status': 'published',
    });

    console.log(`\nFound ${books.length} published books.`);

    if (books.length === 0) {
      console.log('No books to migrate.');
      process.exit(0);
    }

    for (const book of books) {
      await migrateBook(book);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 MIGRATION COMPLETE!');
    console.log('='.repeat(60));
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
