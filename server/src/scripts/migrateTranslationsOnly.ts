/**
 * Migration Script: Generate Translations for Existing Books
 * Run with: npx ts-node --transpile-only src/scripts/migrateTranslationsOnly.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { Book } from '../models/Book';
import { translateChapter } from '../services/geminiService';

async function migrateBookTranslations(book: any): Promise<void> {
  console.log(`\n========================================`);
  console.log(`Processing: "${book.title}" (${book.id})`);
  console.log(`Language: ${book.language || 'en'}`);
  console.log(`Chapters: ${book.chapters?.length || 0}`);
  console.log(`========================================`);

  const chapters = book.chapters || [];
  const bookLanguage = book.language || 'en';
  const targetLanguage = bookLanguage === 'he' ? 'english' : 'hebrew';
  const translationKey = targetLanguage === 'english' ? 'english' : 'hebrew';

  // Check if translation already exists
  const existingTranslation = book.translations?.[translationKey];
  if (existingTranslation?.chapters?.length > 0) {
    console.log(`\n  Translation to ${targetLanguage}: Already exists - Skipping`);
    return;
  }

  console.log(`\n  Generating translation to ${targetLanguage}...`);

  try {
    // Translate title
    console.log(`    - Translating title: "${book.title}"...`);
    const titleTranslation = await translateChapter(book.title, book.title, targetLanguage);
    console.log(`      => "${titleTranslation.translatedTitle}"`);

    // Translate chapters
    const translatedChapters = [];
    for (const chapter of chapters) {
      try {
        console.log(`    - Translating chapter: "${chapter.title}"...`);
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
        console.log(`      => "${translation.translatedTitle}" (${translation.translatedContent.length} chars)`);
      } catch (err: any) {
        console.error(`      Failed: ${err.message}`);
        // Keep original as fallback
        translatedChapters.push({
          _id: chapter._id || `chapter-${chapter.order}`,
          title: chapter.title,
          content: chapter.content || '',
          order: chapter.order,
        });
      }
    }

    // Save translations
    const translations: any = book.translations || {};
    translations[translationKey] = {
      title: titleTranslation.translatedTitle,
      chapters: translatedChapters,
      generatedAt: new Date().toISOString(),
    };

    await Book.findByIdAndUpdate(book.id, { translations });
    console.log(`\n  Translation saved successfully!`);
  } catch (err: any) {
    console.error(`\n  Translation failed: ${err.message}`);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('MIGRATION: Translations for Existing Books');
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
      await migrateBookTranslations(book);
    }

    console.log('\n' + '='.repeat(60));
    console.log('TRANSLATION MIGRATION COMPLETE!');
    console.log('='.repeat(60));
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
