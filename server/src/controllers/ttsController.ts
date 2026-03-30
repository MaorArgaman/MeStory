/**
 * TTS Controller
 * Handles text-to-speech generation using Gemini 2.5 Pro TTS
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { Book } from '../models/Book';
import { User } from '../models/User';
import {
  generateChapterAudio,
  getAvailableVoices,
  deleteCachedAudio,
  GeminiVoiceName,
  AuthorGender,
} from '../services/geminiTTSService';

/**
 * Generate audio for a chapter
 * POST /api/tts/generate
 */
export const generateAudio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { bookId, chapterId, voice = 'auto' } = req.body;

    if (!bookId || !chapterId) {
      res.status(400).json({ success: false, error: 'bookId and chapterId are required' });
      return;
    }

    // Verify the book exists and user has access
    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({ success: false, error: 'Book not found' });
      return;
    }

    // Find the chapter
    const chapter = book.chapters?.find((ch: any) => ch._id?.toString() === chapterId || ch.id === chapterId);
    if (!chapter) {
      res.status(404).json({ success: false, error: 'Chapter not found' });
      return;
    }

    // Get author's gender for voice selection
    let authorGender: AuthorGender = 'unknown';
    if (book.author) {
      const author = await User.findById(book.author);
      if (author?.profile?.gender) {
        authorGender = author.profile.gender as AuthorGender;
      }
    }

    // Generate audio
    const result = await generateChapterAudio(
      bookId,
      chapterId,
      chapter.content || '',
      {
        voice: voice !== 'auto' ? voice as GeminiVoiceName : undefined,
        authorGender,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        audioUrl: result.audioUrl,
        duration: result.duration,
        cached: result.cached,
        chapterId,
        voice: result.voice,
      },
    });
  } catch (error: any) {
    console.error('TTS generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate audio',
    });
  }
};

/**
 * Get available TTS voices
 * GET /api/tts/voices
 */
export const getVoices = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const voices = getAvailableVoices();

    res.status(200).json({
      success: true,
      data: { voices },
    });
  } catch (error: any) {
    console.error('Get voices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get voices',
    });
  }
};

/**
 * Delete cached audio for a chapter
 * DELETE /api/tts/cache
 */
export const deleteAudioCache = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { bookId, chapterId, voice = 'Kore' } = req.body;

    if (!bookId || !chapterId) {
      res.status(400).json({ success: false, error: 'bookId and chapterId are required' });
      return;
    }

    // Verify the book exists and user is the author
    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({ success: false, error: 'Book not found' });
      return;
    }

    if (book.author?.toString() !== req.user.id) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    await deleteCachedAudio(bookId, chapterId, voice);

    res.status(200).json({
      success: true,
      message: 'Audio cache deleted',
    });
  } catch (error: any) {
    console.error('Delete cache error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete cache',
    });
  }
};

/**
 * Get audio status for a book (which chapters have generated audio)
 * GET /api/tts/status/:bookId
 */
export const getAudioStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookId } = req.params;

    if (!bookId) {
      res.status(400).json({ success: false, error: 'bookId is required' });
      return;
    }

    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({ success: false, error: 'Book not found' });
      return;
    }

    // Count chapters with audio
    const chaptersWithAudio = book.chapters?.filter(
      (ch: any) => ch.audio?.maleVoice?.url || ch.audio?.femaleVoice?.url
    ).length || 0;

    res.status(200).json({
      success: true,
      data: {
        bookId,
        chaptersCount: book.chapters?.length || 0,
        chaptersWithAudio,
        hasFullAudio: chaptersWithAudio === (book.chapters?.length || 0),
      },
    });
  } catch (error: any) {
    console.error('Get audio status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audio status',
    });
  }
};

// Default voices for pre-generation
const DEFAULT_MALE_VOICE: GeminiVoiceName = 'Charon';
const DEFAULT_FEMALE_VOICE: GeminiVoiceName = 'Aoede';

/**
 * Generate audio for a single book (all chapters, both voices)
 * Used for migration of existing books
 * POST /api/tts/generate-book/:bookId
 */
export const generateBookAudio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { bookId } = req.params;

    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({ success: false, error: 'Book not found' });
      return;
    }

    // Only allow author or admin
    if (book.author?.toString() !== req.user.id) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    // Check if book already has audio
    const chaptersWithAudio = book.chapters?.filter(
      (ch: any) => ch.audio?.maleVoice?.url && ch.audio?.femaleVoice?.url
    ).length || 0;

    if (chaptersWithAudio === book.chapters?.length) {
      res.status(200).json({
        success: true,
        message: 'Book already has full audio coverage',
        data: { chaptersWithAudio, totalChapters: book.chapters?.length },
      });
      return;
    }

    // Start generating audio in background (4 versions per chapter)
    generateAllChapterAudioForBook(bookId, book.chapters || []).catch((err) =>
      console.error(`Failed to generate audio for book ${bookId}:`, err)
    );

    res.status(202).json({
      success: true,
      message: 'Audio generation started in background',
      data: {
        bookId,
        chaptersToProcess: book.chapters?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('Generate book audio error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start audio generation',
    });
  }
};

/**
 * Admin: Generate audio for all published books without audio
 * POST /api/tts/migrate-all
 */
export const migrateAllBooksAudio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Find all published books
    const books = await Book.find({
      'publishingStatus.status': 'published',
    });

    // Filter books that don't have full audio
    const booksNeedingAudio = books.filter((book) => {
      const chaptersWithAudio = book.chapters?.filter(
        (ch: any) => ch.audio?.maleVoice?.url && ch.audio?.femaleVoice?.url
      ).length || 0;
      return chaptersWithAudio < (book.chapters?.length || 0);
    });

    console.log(`Found ${booksNeedingAudio.length} books needing audio generation`);

    // Start generating audio for each book in background (4 versions per chapter)
    for (const book of booksNeedingAudio) {
      generateAllChapterAudioForBook(book.id, book.chapters || []).catch((err) =>
        console.error(`Failed to generate audio for book ${book.id}:`, err)
      );
    }

    res.status(202).json({
      success: true,
      message: `Started audio generation for ${booksNeedingAudio.length} books`,
      data: {
        totalPublishedBooks: books.length,
        booksNeedingAudio: booksNeedingAudio.length,
        bookIds: booksNeedingAudio.map((b) => ({ id: b.id, title: b.title })),
      },
    });
  } catch (error: any) {
    console.error('Migrate all books audio error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start migration',
    });
  }
};

/**
 * Admin: Generate translations for all published books without translations
 * POST /api/tts/migrate-translations
 */
export const migrateAllBooksTranslations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Find all published books
    const books = await Book.find({
      'publishingStatus.status': 'published',
    });

    // Filter books that don't have translations
    const booksNeedingTranslations = books.filter((book) => {
      const hasTranslation = book.language === 'he'
        ? book.translations?.english?.chapters?.length
        : book.translations?.hebrew?.chapters?.length;
      return !hasTranslation;
    });

    console.log(`Found ${booksNeedingTranslations.length} books needing translation generation`);

    // Import translateChapter dynamically to avoid circular dependency
    const { translateChapter } = await import('../services/geminiService');

    // Start generating translations for each book in background
    for (const book of booksNeedingTranslations) {
      generateBookTranslation(book.id, book.title, book.chapters || [], book.language || 'en', translateChapter).catch((err) =>
        console.error(`Failed to generate translations for book ${book.id}:`, err)
      );
    }

    res.status(202).json({
      success: true,
      message: `Started translation generation for ${booksNeedingTranslations.length} books`,
      data: {
        totalPublishedBooks: books.length,
        booksNeedingTranslations: booksNeedingTranslations.length,
        bookIds: booksNeedingTranslations.map((b) => ({ id: b.id, title: b.title, language: b.language })),
      },
    });
  } catch (error: any) {
    console.error('Migrate all books translations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start translation migration',
    });
  }
};

/**
 * Helper: Generate translations for a book
 */
async function generateBookTranslation(
  bookId: string,
  bookTitle: string,
  chapters: any[],
  bookLanguage: string,
  translateChapter: Function
): Promise<void> {
  console.log(`Starting translation generation for book ${bookId} (language: ${bookLanguage})`);

  const targetLanguage = bookLanguage === 'he' ? 'english' : 'hebrew';

  try {
    const titleTranslation = await translateChapter(bookTitle, bookTitle, targetLanguage);

    const translatedChapters = [];
    for (const chapter of chapters) {
      try {
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
      } catch (err) {
        console.error(`Failed to translate chapter ${chapter.title}:`, err);
        translatedChapters.push({
          _id: chapter._id || `chapter-${chapter.order}`,
          title: chapter.title,
          content: chapter.content || '',
          order: chapter.order,
        });
      }
    }

    const translations: any = {};
    if (targetLanguage === 'english') {
      translations.english = {
        title: titleTranslation.translatedTitle,
        chapters: translatedChapters,
        generatedAt: new Date().toISOString(),
      };
    } else {
      translations.hebrew = {
        title: titleTranslation.translatedTitle,
        chapters: translatedChapters,
        generatedAt: new Date().toISOString(),
      };
    }

    await Book.findByIdAndUpdate(bookId, { translations });
    console.log(`Translation generation completed for book ${bookId}`);
  } catch (err) {
    console.error(`Failed to generate translations for book ${bookId}:`, err);
  }
}

/**
 * Helper: Generate audio for all chapters of a book
 * Generates all 4 versions: English male/female + Hebrew male/female
 */
async function generateAllChapterAudioForBook(
  bookId: string,
  chapters: any[]
): Promise<void> {
  console.log(`Starting TTS generation for book ${bookId} with ${chapters.length} chapters (4 versions each)`);

  const updatedChapters = [];

  for (const chapter of chapters) {
    const chapterId = chapter._id || `chapter-${chapter.order}`;
    const audio: any = chapter.audio || {};

    // Generate all 4 versions

    // 1. English male voice
    if (!audio.maleVoiceEn?.url) {
      try {
        console.log(`Generating English male voice for chapter: ${chapter.title}`);
        const result = await generateChapterAudio(
          bookId,
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
        audio.maleVoice = audio.maleVoiceEn; // Legacy
      } catch (err) {
        console.error(`Failed to generate English male voice for chapter ${chapter.title}:`, err);
      }
    }

    // 2. English female voice
    if (!audio.femaleVoiceEn?.url) {
      try {
        console.log(`Generating English female voice for chapter: ${chapter.title}`);
        const result = await generateChapterAudio(
          bookId,
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
        audio.femaleVoice = audio.femaleVoiceEn; // Legacy
      } catch (err) {
        console.error(`Failed to generate English female voice for chapter ${chapter.title}:`, err);
      }
    }

    // 3. Hebrew male voice
    if (!audio.maleVoiceHe?.url) {
      try {
        console.log(`Generating Hebrew male voice for chapter: ${chapter.title}`);
        const result = await generateChapterAudio(
          bookId,
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
      } catch (err) {
        console.error(`Failed to generate Hebrew male voice for chapter ${chapter.title}:`, err);
      }
    }

    // 4. Hebrew female voice
    if (!audio.femaleVoiceHe?.url) {
      try {
        console.log(`Generating Hebrew female voice for chapter: ${chapter.title}`);
        const result = await generateChapterAudio(
          bookId,
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
      } catch (err) {
        console.error(`Failed to generate Hebrew female voice for chapter ${chapter.title}:`, err);
      }
    }

    updatedChapters.push({
      ...chapter,
      audio,
    });
  }

  // Update book with audio URLs
  try {
    await Book.findByIdAndUpdate(bookId, {
      chapters: updatedChapters,
    });
    console.log(`TTS generation completed for book ${bookId}`);
  } catch (err) {
    console.error(`Failed to update book with audio URLs:`, err);
  }
}
