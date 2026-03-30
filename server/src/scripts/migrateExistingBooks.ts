/**
 * Migration Script: Generate Audio & Translations for Existing Books
 * Run with: npx ts-node src/scripts/migrateExistingBooks.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { Book } from '../models/Book';
import { generateChapterAudio, GeminiVoiceName } from '../services/geminiTTSService';
import { translateChapter } from '../services/geminiService';

const DEFAULT_MALE_VOICE: GeminiVoiceName = 'Charon';
const DEFAULT_FEMALE_VOICE: GeminiVoiceName = 'Aoede';

async function migrateBook(book: any): Promise<void> {
  console.log(`\n========================================`);
  console.log(`Processing: "${book.title}" (${book.id})`);
  console.log(`Language: ${book.language || 'en'}`);
  console.log(`Chapters: ${book.chapters?.length || 0}`);
  console.log(`========================================`);

  const chapters = book.chapters || [];
  const updatedChapters = [];

  // Generate audio for each chapter
  for (const chapter of chapters) {
    const chapterId = chapter._id || `chapter-${chapter.order}`;
    const audio: any = chapter.audio || {};

    console.log(`\n  Chapter: "${chapter.title}"`);

    // 1. English male voice
    if (!audio.maleVoiceEn?.url) {
      try {
        console.log(`    - Generating English male voice...`);
        const result = await generateChapterAudio(
          book.id,
          `${chapterId}-en-male`,
          chapter.content || '',
          { voice: DEFAULT_MALE_VOICE, authorGender: 'male', language: 'en' }
        );
        audio.maleVoiceEn = {
          url: result.audioUrl,
          duration: result.duration,
          voice: result.voice,
          language: 'en',
          generatedAt: new Date().toISOString(),
        };
        audio.maleVoice = audio.maleVoiceEn;
        console.log(`      Done!`);
      } catch (err: any) {
        console.error(`      Failed: ${err.message}`);
      }
    } else {
      console.log(`    - English male voice: Already exists`);
    }

    // 2. English female voice
    if (!audio.femaleVoiceEn?.url) {
      try {
        console.log(`    - Generating English female voice...`);
        const result = await generateChapterAudio(
          book.id,
          `${chapterId}-en-female`,
          chapter.content || '',
          { voice: DEFAULT_FEMALE_VOICE, authorGender: 'female', language: 'en' }
        );
        audio.femaleVoiceEn = {
          url: result.audioUrl,
          duration: result.duration,
          voice: result.voice,
          language: 'en',
          generatedAt: new Date().toISOString(),
        };
        audio.femaleVoice = audio.femaleVoiceEn;
        console.log(`      Done!`);
      } catch (err: any) {
        console.error(`      Failed: ${err.message}`);
      }
    } else {
      console.log(`    - English female voice: Already exists`);
    }

    // 3. Hebrew male voice
    if (!audio.maleVoiceHe?.url) {
      try {
        console.log(`    - Generating Hebrew male voice...`);
        const result = await generateChapterAudio(
          book.id,
          `${chapterId}-he-male`,
          chapter.content || '',
          { voice: DEFAULT_MALE_VOICE, authorGender: 'male', language: 'he' }
        );
        audio.maleVoiceHe = {
          url: result.audioUrl,
          duration: result.duration,
          voice: result.voice,
          language: 'he',
          generatedAt: new Date().toISOString(),
        };
        console.log(`      Done!`);
      } catch (err: any) {
        console.error(`      Failed: ${err.message}`);
      }
    } else {
      console.log(`    - Hebrew male voice: Already exists`);
    }

    // 4. Hebrew female voice
    if (!audio.femaleVoiceHe?.url) {
      try {
        console.log(`    - Generating Hebrew female voice...`);
        const result = await generateChapterAudio(
          book.id,
          `${chapterId}-he-female`,
          chapter.content || '',
          { voice: DEFAULT_FEMALE_VOICE, authorGender: 'female', language: 'he' }
        );
        audio.femaleVoiceHe = {
          url: result.audioUrl,
          duration: result.duration,
          voice: result.voice,
          language: 'he',
          generatedAt: new Date().toISOString(),
        };
        console.log(`      Done!`);
      } catch (err: any) {
        console.error(`      Failed: ${err.message}`);
      }
    } else {
      console.log(`    - Hebrew female voice: Already exists`);
    }

    updatedChapters.push({
      ...chapter,
      audio,
    });
  }

  // Update book with audio
  await Book.findByIdAndUpdate(book.id, { chapters: updatedChapters });
  console.log(`\n  Audio saved to database.`);

  // Generate translation
  const bookLanguage = book.language || 'en';
  const targetLanguage = bookLanguage === 'he' ? 'english' : 'hebrew';
  const translationKey = targetLanguage === 'english' ? 'english' : 'hebrew';

  const existingTranslation = book.translations?.[translationKey];
  if (existingTranslation?.chapters?.length > 0) {
    console.log(`\n  Translation to ${targetLanguage}: Already exists`);
  } else {
    console.log(`\n  Generating translation to ${targetLanguage}...`);

    try {
      const titleTranslation = await translateChapter(book.title, book.title, targetLanguage);

      const translatedChapters = [];
      for (const chapter of chapters) {
        try {
          console.log(`    - Translating: "${chapter.title}"...`);
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
          console.log(`      Done!`);
        } catch (err: any) {
          console.error(`      Failed: ${err.message}`);
          translatedChapters.push({
            _id: chapter._id || `chapter-${chapter.order}`,
            title: chapter.title,
            content: chapter.content || '',
            order: chapter.order,
          });
        }
      }

      const translations: any = book.translations || {};
      translations[translationKey] = {
        title: titleTranslation.translatedTitle,
        chapters: translatedChapters,
        generatedAt: new Date().toISOString(),
      };

      await Book.findByIdAndUpdate(book.id, { translations });
      console.log(`\n  Translation saved to database.`);
    } catch (err: any) {
      console.error(`\n  Translation failed: ${err.message}`);
    }
  }

  console.log(`\n  Book "${book.title}" migration complete!`);
}

async function main() {
  console.log('='.repeat(60));
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
    console.log('MIGRATION COMPLETE!');
    console.log('='.repeat(60));
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
