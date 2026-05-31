import { Request, Response } from 'express';
import fs from 'fs/promises';

// UUID validation regex for Supabase
const isValidUUID = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
import path from 'path';
// pdf-parse disabled - DOMMatrix not available in Vercel serverless
// import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { Book } from '../models/Book';
import { User } from '../models/User';
import { AuthRequest } from '../types';
import { transcribeAudio } from '../services/whisperService';
import { generatePricingStrategy } from '../services/pricingStrategyService';
import { exportBook } from '../services/bookExportService';
import { enqueueJob, runJobInBackground } from '../services/jobQueue';
import { renderBookToPdf } from '../services/puppeteerExportService';
import { resolveActiveDesign } from '../utils/activeDesign';
import { generateBookPdfFromHtml } from '../services/pdfService';
import {
  notifyBookLike,
  notifyBookComment,
  notifyBookShare,
  notifyBookPurchase,
  notifyBookPublished,
} from '../services/notificationService';
import {
  sendBookPurchaseEmail,
  sendSaleNotificationToAuthor,
} from '../services/emailService';
import { supabaseAdmin } from '../config/supabase';
import {
  generateChapterAudio,
  GeminiVoiceName,
} from '../services/geminiTTSService';
import { translateChapter } from '../services/geminiService';
import { IChapter, IChapterAudio, IBookTranslations, ITranslatedChapter } from '../models/Book';

// Default voices for pre-generation
const DEFAULT_MALE_VOICE: GeminiVoiceName = 'Charon';
const DEFAULT_FEMALE_VOICE: GeminiVoiceName = 'Aoede';

/**
 * Permission levels for book access (mirrors CollaboratorRole + owner).
 * 'owner'     — full control (delete, publish, manage collaborators)
 * 'editor'    — read + write (chapters, images, cover, layout, export)
 * 'commenter' — read + comment only (cannot edit content directly)
 * 'viewer'    — read-only (can view + export, nothing else)
 */
type BookAccess = 'owner' | 'editor' | 'commenter' | 'viewer' | null;

const getBookAccess = (book: any, userId: string): BookAccess => {
  if (!book || !userId) return null;
  if (book.author === userId) return 'owner';
  const collaborators = (book.collaborators || []) as Array<{
    userId?: string;
    status?: string;
    role?: string;
  }>;
  const collab = collaborators.find(
    (c) => c.userId === userId && (c.status === 'active' || !c.status)
  );
  if (!collab) return null;
  const role = collab.role === 'contributor' ? 'editor' : collab.role;
  return (role as BookAccess) || 'viewer';
};

const canEditBook = (book: any, userId: string): boolean => {
  const access = getBookAccess(book, userId);
  return access === 'owner' || access === 'editor';
};

const canReadBook = (book: any, userId: string): boolean => {
  return getBookAccess(book, userId) !== null;
};

/**
 * Generate translations and TTS audio for a book
 * CORRECT ORDER:
 * 1. Generate audio for ORIGINAL language (male + female)
 * 2. Generate translation to OTHER language
 * 3. Generate audio for TRANSLATED content (male + female)
 *
 * Runs asynchronously to not block the publish process
 */
async function generateTranslationsAndAudio(
  bookId: string,
  bookTitle: string,
  chapters: IChapter[],
  bookLanguage: string
): Promise<void> {
  console.log(`[Publish] Starting translation & audio generation for book ${bookId}`);
  console.log(`[Publish] Book language: ${bookLanguage}, Chapters: ${chapters.length}`);

  const isHebrew = bookLanguage === 'he' || bookLanguage === 'hebrew';
  const targetLanguage = isHebrew ? 'english' : 'hebrew';
  const translationKey = isHebrew ? 'english' : 'hebrew';

  // STEP 1: Generate audio for ORIGINAL language
  console.log(`[Publish] STEP 1: Generating audio for original language (${bookLanguage})...`);

  let updatedChapters: IChapter[] = [];

  for (const chapter of chapters) {
    const chapterId = chapter._id || `chapter-${chapter.order}`;
    const audio: IChapterAudio = {};
    const originalContent = chapter.content || '';

    if (isHebrew) {
      // Book is in Hebrew - generate Hebrew audio from original content
      try {
        console.log(`  - Hebrew male voice for: ${chapter.title}`);
        const result = await generateChapterAudio(
          bookId, `${chapterId}-he-male`, originalContent,
          { voice: DEFAULT_MALE_VOICE, authorGender: 'male', language: 'he' }
        );
        audio.maleVoiceHe = {
          url: result.audioUrl, duration: result.duration, voice: result.voice,
          language: 'he', generatedAt: new Date().toISOString(),
        };
      } catch (err) {
        console.error(`    Failed: ${err}`);
      }

      try {
        console.log(`  - Hebrew female voice for: ${chapter.title}`);
        const result = await generateChapterAudio(
          bookId, `${chapterId}-he-female`, originalContent,
          { voice: DEFAULT_FEMALE_VOICE, authorGender: 'female', language: 'he' }
        );
        audio.femaleVoiceHe = {
          url: result.audioUrl, duration: result.duration, voice: result.voice,
          language: 'he', generatedAt: new Date().toISOString(),
        };
      } catch (err) {
        console.error(`    Failed: ${err}`);
      }
    } else {
      // Book is in English - generate English audio from original content
      try {
        console.log(`  - English male voice for: ${chapter.title}`);
        const result = await generateChapterAudio(
          bookId, `${chapterId}-en-male`, originalContent,
          { voice: DEFAULT_MALE_VOICE, authorGender: 'male', language: 'en' }
        );
        audio.maleVoiceEn = {
          url: result.audioUrl, duration: result.duration, voice: result.voice,
          language: 'en', generatedAt: new Date().toISOString(),
        };
        audio.maleVoice = audio.maleVoiceEn; // Legacy
      } catch (err) {
        console.error(`    Failed: ${err}`);
      }

      try {
        console.log(`  - English female voice for: ${chapter.title}`);
        const result = await generateChapterAudio(
          bookId, `${chapterId}-en-female`, originalContent,
          { voice: DEFAULT_FEMALE_VOICE, authorGender: 'female', language: 'en' }
        );
        audio.femaleVoiceEn = {
          url: result.audioUrl, duration: result.duration, voice: result.voice,
          language: 'en', generatedAt: new Date().toISOString(),
        };
        audio.femaleVoice = audio.femaleVoiceEn; // Legacy
      } catch (err) {
        console.error(`    Failed: ${err}`);
      }
    }

    updatedChapters.push({ ...chapter, audio });
  }

  // Save original audio to database
  await Book.findByIdAndUpdate(bookId, { chapters: updatedChapters });
  console.log(`[Publish] Original language audio saved.`);

  // STEP 2: Generate translation
  console.log(`[Publish] STEP 2: Generating translation to ${targetLanguage}...`);

  const translatedChapters: any[] = [];
  let translatedTitle = '';

  try {
    // Translate title
    const titleTranslation = await translateChapter(bookTitle, bookTitle, targetLanguage);
    translatedTitle = titleTranslation.translatedTitle;
    console.log(`  Title: "${bookTitle}" → "${translatedTitle}"`);

    // Translate chapters
    for (const chapter of chapters) {
      try {
        console.log(`  Translating: ${chapter.title}...`);
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
        console.log(`    → ${translation.translatedTitle}`);
      } catch (err) {
        console.error(`    Failed: ${err}`);
        translatedChapters.push({
          _id: chapter._id || `chapter-${chapter.order}`,
          title: chapter.title,
          content: chapter.content || '',
          order: chapter.order,
        });
      }
    }

    // Save translations to database
    const translations: IBookTranslations = {};
    translations[translationKey as keyof IBookTranslations] = {
      title: translatedTitle,
      chapters: translatedChapters,
      generatedAt: new Date().toISOString(),
    };
    await Book.findByIdAndUpdate(bookId, { translations });
    console.log(`[Publish] Translation saved.`);
  } catch (err) {
    console.error(`[Publish] Translation failed:`, err);
    return; // Can't continue without translation
  }

  // STEP 3: Generate audio for TRANSLATED content
  console.log(`[Publish] STEP 3: Generating audio for translated content (${targetLanguage})...`);

  // Re-fetch book to get latest chapters with original audio
  const bookWithAudio = await Book.findById(bookId);
  if (!bookWithAudio) {
    console.error(`[Publish] Book not found after audio generation`);
    return;
  }

  const finalChapters: IChapter[] = [];

  for (let i = 0; i < bookWithAudio.chapters.length; i++) {
    const chapter = bookWithAudio.chapters[i];
    const translatedChapter = translatedChapters[i];
    const translatedContent = translatedChapter?.content || '';
    const audio: IChapterAudio = chapter.audio || {};
    const chapterId = chapter._id || `chapter-${chapter.order}`;

    if (isHebrew) {
      // Book is in Hebrew - generate English audio from TRANSLATED content
      if (translatedContent) {
        try {
          console.log(`  - English male voice (translated) for: ${chapter.title}`);
          const result = await generateChapterAudio(
            bookId, `${chapterId}-en-male`, translatedContent,
            { voice: DEFAULT_MALE_VOICE, authorGender: 'male', language: 'en' }
          );
          audio.maleVoiceEn = {
            url: result.audioUrl, duration: result.duration, voice: result.voice,
            language: 'en', generatedAt: new Date().toISOString(),
          };
          audio.maleVoice = audio.maleVoiceEn; // Legacy
        } catch (err) {
          console.error(`    Failed: ${err}`);
        }

        try {
          console.log(`  - English female voice (translated) for: ${chapter.title}`);
          const result = await generateChapterAudio(
            bookId, `${chapterId}-en-female`, translatedContent,
            { voice: DEFAULT_FEMALE_VOICE, authorGender: 'female', language: 'en' }
          );
          audio.femaleVoiceEn = {
            url: result.audioUrl, duration: result.duration, voice: result.voice,
            language: 'en', generatedAt: new Date().toISOString(),
          };
          audio.femaleVoice = audio.femaleVoiceEn; // Legacy
        } catch (err) {
          console.error(`    Failed: ${err}`);
        }
      }
    } else {
      // Book is in English - generate Hebrew audio from TRANSLATED content
      if (translatedContent) {
        try {
          console.log(`  - Hebrew male voice (translated) for: ${chapter.title}`);
          const result = await generateChapterAudio(
            bookId, `${chapterId}-he-male`, translatedContent,
            { voice: DEFAULT_MALE_VOICE, authorGender: 'male', language: 'he' }
          );
          audio.maleVoiceHe = {
            url: result.audioUrl, duration: result.duration, voice: result.voice,
            language: 'he', generatedAt: new Date().toISOString(),
          };
        } catch (err) {
          console.error(`    Failed: ${err}`);
        }

        try {
          console.log(`  - Hebrew female voice (translated) for: ${chapter.title}`);
          const result = await generateChapterAudio(
            bookId, `${chapterId}-he-female`, translatedContent,
            { voice: DEFAULT_FEMALE_VOICE, authorGender: 'female', language: 'he' }
          );
          audio.femaleVoiceHe = {
            url: result.audioUrl, duration: result.duration, voice: result.voice,
            language: 'he', generatedAt: new Date().toISOString(),
          };
        } catch (err) {
          console.error(`    Failed: ${err}`);
        }
      }
    }

    finalChapters.push({ ...chapter, audio });
  }

  // Save final chapters with all audio
  await Book.findByIdAndUpdate(bookId, { chapters: finalChapters });
  console.log(`[Publish] All audio saved. Translation & audio generation complete!`);
}

/**
 * Generate translations for a book
 * If book is in Hebrew, translate to English and vice versa
 * Runs asynchronously to not block the publish process
 */
async function generateBookTranslations(
  bookId: string,
  bookTitle: string,
  chapters: IChapter[],
  bookLanguage: string
): Promise<void> {
  console.log(`Starting translation generation for book ${bookId} (language: ${bookLanguage})`);

  // Determine target language (opposite of book language)
  const targetLanguage = bookLanguage === 'he' ? 'english' : 'hebrew';

  try {
    // Translate book title
    const titleTranslation = await translateChapter(bookTitle, bookTitle, targetLanguage);

    // Translate all chapters
    const translatedChapters: ITranslatedChapter[] = [];
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
        // Add original content as fallback
        translatedChapters.push({
          _id: chapter._id || `chapter-${chapter.order}`,
          title: chapter.title,
          content: chapter.content || '',
          order: chapter.order,
        });
      }
    }

    // Build translations object
    const translations: IBookTranslations = {};
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

    // Update book with translations
    await Book.findByIdAndUpdate(bookId, {
      translations,
    });
    console.log(`Translation generation completed for book ${bookId}`);
  } catch (err) {
    console.error(`Failed to generate translations for book ${bookId}:`, err);
  }
}

/**
 * Split text into chapters based on common patterns
 * Detects: "Chapter X", "פרק X", "חלק X", numbered headings, etc.
 */
function splitTextIntoChapters(text: string): Array<{ title: string; content: string }> {
  // Patterns for chapter detection (English and Hebrew)
  const chapterPatterns = [
    // English patterns
    /^(?:chapter|part)\s+(?:\d+|[ivxlcdm]+)(?:\s*[-:.]?\s*(.*))?$/im,
    /^(?:chapter|part)\s+(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?:\s*[-:.]?\s*(.*))?$/im,
    // Hebrew patterns
    /^(?:פרק|חלק)\s+(?:\d+|[א-ת]{1,2})(?:\s*[-:.]?\s*(.*))?$/m,
    // Numbered headings
    /^(\d+)\.\s+(.+)$/m,
  ];

  // Combined regex for splitting
  const splitRegex = /\n\s*(?:(?:chapter|part|פרק|חלק)\s+(?:\d+|[ivxlcdm]+|[א-ת]{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?:\s*[-:.]?\s*.{0,100})?)\s*\n/gi;

  // Check if text has chapter markers
  const hasChapterMarkers = splitRegex.test(text);
  splitRegex.lastIndex = 0; // Reset regex

  if (!hasChapterMarkers) {
    // No chapter markers found, return as single chapter
    return [{
      title: 'Imported Content',
      content: text,
    }];
  }

  // Split by chapter markers
  const parts = text.split(splitRegex);
  const matches = text.match(splitRegex) || [];

  const chapters: Array<{ title: string; content: string }> = [];

  // Handle content before first chapter marker
  if (parts[0] && parts[0].trim().length > 100) {
    chapters.push({
      title: 'Introduction',
      content: parts[0].trim(),
    });
  }

  // Process each chapter
  for (let i = 0; i < matches.length; i++) {
    const chapterTitle = matches[i].trim().replace(/\n/g, ' ');
    const chapterContent = parts[i + 1] ? parts[i + 1].trim() : '';

    if (chapterContent.length > 0) {
      chapters.push({
        title: chapterTitle || `Chapter ${i + 1}`,
        content: chapterContent,
      });
    }
  }

  // If no chapters were created, return as single chapter
  if (chapters.length === 0) {
    return [{
      title: 'Imported Content',
      content: text,
    }];
  }

  return chapters;
}

/**
 * Create a new book
 * POST /api/books
 */
export const createBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const {
      title,
      genre,
      description,
      language,
      storyContext,
      chapters,
      // Collaborative book fields
      bookType,
      isCollaborative,
      memorialDedication,
    } = req.body;

    // Create new book
    const book = await Book.create({
      title,
      author: req.user.id,
      genre,
      description,
      language: language || 'he', // Default to Hebrew for memorial books
      storyContext: storyContext || undefined, // Story context from Deep Dive Interview
      chapters: chapters || [],
      characters: [],
      // Collaborative book fields
      bookType: bookType || 'personal',
      isCollaborative: isCollaborative || false,
      memorialDedication: memorialDedication || undefined,
      collaborators: [],
      invitations: [],
      publishingStatus: {
        status: 'draft',
        price: 0,
        isFree: true,
        isPublic: false,
      },
      statistics: {
        wordCount: 0,
        pageCount: 0,
        chapterCount: 0,
        characterCount: 0,
        views: 0,
        purchases: 0,
        revenue: 0,
        totalReviews: 0,
        averageRating: 0,
        completionRate: 0,
        readingTime: 0,
        shares: 0,
        comments: 0,
      },
      translations: {},
    });

    // Update user's writing statistics
    const user = await User.findById(req.user.id);
    if (user && user.profile) {
      const writingStatistics = user.profile.writingStatistics || {
        totalWords: 0,
        booksWritten: 0,
      };
      writingStatistics.booksWritten += 1;
      await User.findByIdAndUpdate(req.user.id, {
        'profile.writingStatistics': writingStatistics,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: {
        id: book.id,
        book: {
          id: book.id,
          title: book.title,
          genre: book.genre,
          description: book.description,
          language: book.language,
          storyContext: book.storyContext,
          publishingStatus: book.publishingStatus,
          statistics: book.statistics,
          createdAt: book.created_at,
        },
      },
    });
  } catch (error: any) {
    console.error('Create book error:', error);

    // Provide more helpful error messages for debugging
    let errorMessage = 'Failed to create book';

    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      errorMessage = `Validation failed: ${validationErrors.join(', ')}`;
    } else if (error.code === 11000) {
      // Duplicate key error
      errorMessage = 'A book with this title already exists';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Get all books for the authenticated user
 * GET /api/books
 */
export const getBooks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Get query parameters for filtering
    const { status, genre, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Build query - only return user's own books
    const query: any = { author: req.user.id };

    if (status) {
      query['publishingStatus.status'] = status;
    }

    if (genre) {
      query.genre = genre;
    }

    // PERF: list endpoint — skip heavy JSONB columns (chapters, pageImages, designState)
    const books = await Book.find({
      ...query,
      _sort: sortBy as string,
      _order: order as string,
      _lightweight: true,
    });

    res.status(200).json({
      success: true,
      data: {
        books: books.map((book) => ({
          id: book.id,
          title: book.title,
          genre: book.genre,
          description: book.description,
          publishingStatus: book.publishingStatus,
          statistics: book.statistics,
          qualityScore: book.qualityScore,
          coverDesign: book.coverDesign,
          createdAt: book.created_at,
          updatedAt: book.updated_at,
        })),
        count: books.length,
      },
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve books',
    });
  }
};

/**
 * Get a single book by ID
 * GET /api/books/:id
 */
export const getBookById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    // Validate UUID
    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Check if user owns this book, is a collaborator, OR if book is publicly published
    const isOwner = book.author === req.user.id;
    const isCollaborator = (book.collaborators || []).some(
      (c: any) => c.userId === req.user.id && (c.status === 'active' || !c.status)
    );
    const isPubliclyPublished = book.publishingStatus?.status === 'published' && book.publishingStatus?.isPublic;

    if (!isOwner && !isCollaborator && !isPubliclyPublished) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to access this book',
      });
      return;
    }

    // Fetch author info for both owner and public views
    const author = await User.findById(book.author);

    // If owner or collaborator, return full book data
    if (isOwner || isCollaborator) {
      if (!res.headersSent) {
        res.status(200).json({
          success: true,
          data: {
            book: {
              id: book.id,
              title: book.title,
              genre: book.genre,
              description: book.description,
              synopsis: book.synopsis,
              language: book.language,
              chapters: book.chapters,
              characters: book.characters,
              plotStructure: book.plotStructure,
              qualityScore: book.qualityScore,
              coverDesign: book.coverDesign,
              pageLayout: book.pageLayout,
              pageImages: book.pageImages || [],
              aiDesignState: book.aiDesignState,
              publishingStatus: book.publishingStatus,
              statistics: book.statistics,
              tags: book.tags,
              ageRating: book.ageRating,
              translations: book.translations,
              createdAt: book.created_at,
              updatedAt: book.updated_at,
              // Include author info for consistent data across the app
              author: {
                _id: author?.id || book.author,
                id: author?.id || book.author,
                name: author?.name || author?.displayName || 'Unknown Author',
                profile: {
                  avatar: author?.profile?.avatar || null,
                  bio: author?.profile?.bio || null,
                },
              },
            },
          },
        });
      }
      return;
    }

    // For public books, return data with author info and chapters for reading
    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        data: {
          _id: book.id,
          id: book.id,
          title: book.title,
          genre: book.genre,
          synopsis: book.synopsis,
          description: book.description,
          language: book.language,
          chapters: book.chapters || [], // Include chapters for reading
          translations: book.translations, // Include pre-generated translations
          coverDesign: book.coverDesign,
          qualityScore: book.qualityScore,
          publishingStatus: {
            price: book.publishingStatus?.price || 0,
            isFree: book.publishingStatus?.isFree || true,
          },
          statistics: {
            wordCount: book.statistics?.wordCount || 0,
            pageCount: book.statistics?.pageCount || 0,
            views: book.statistics?.views || 0,
            averageRating: book.statistics?.averageRating || 0,
            totalReviews: book.statistics?.totalReviews || 0,
          },
          likes: book.likes || 0,
          likedBy: book.likedBy || [],
          reviews: book.reviews || [],
          author: {
            _id: author?.id || book.author,
            id: author?.id || book.author,
            name: author?.name || 'Unknown Author',
            profile: {
              avatar: author?.profile?.avatar || null,
              bio: author?.profile?.bio || null,
            },
          },
          createdAt: book.created_at,
        },
      });
    }
  } catch (error) {
    console.error('Get book error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve book',
      });
    }
  }
};

/**
 * Update a book
 * PUT /api/books/:id
 */
export const updateBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    // Validate UUID
    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // PERF: lightweight permission check — owner, editor, commenter, or viewer.
    const access = await Book.getUserAccess(id, req.user.id);
    if (access === null) {
      const ownerId = await Book.getOwnerId(id);
      res.status(ownerId ? 403 : 404).json({
        success: false,
        error: ownerId
          ? 'You do not have permission to update this book'
          : 'Book not found',
      });
      return;
    }

    // Only owner and editor can write content. Commenter/viewer get 403.
    if (access === 'commenter' || access === 'viewer') {
      res.status(403).json({
        success: false,
        error: access === 'commenter'
          ? 'Commenters cannot edit book content. Ask the owner to upgrade your role.'
          : 'Viewers have read-only access. Ask the owner to upgrade your role.',
      });
      return;
    }

    // Editors cannot change book-level metadata (only content).
    const ownerOnlyFields = new Set(['collaborators', 'invitations', 'publishingStatus', 'isCollaborative', 'bookType']);
    if (access === 'editor') {
      for (const field of Object.keys(req.body || {})) {
        if (ownerOnlyFields.has(field)) {
          res.status(403).json({
            success: false,
            error: `Collaborators cannot modify '${field}'`,
          });
          return;
        }
      }
    }

    // Allowed fields to update
    const allowedUpdates = [
      'title',
      'genre',
      'description',
      'synopsis',
      'language',
      'chapters',
      'characters',
      'plotStructure',
      'coverDesign',
      'pageLayout',
      'pageImages',
      'tags',
      'ageRating',
      'publishingStatus',
      'aiDesignState',
      'templateId',
      'storyContext',
      'translations',
    ];

    // BUG-005: Optimistic locking — if the client sends `_lastUpdatedAt`,
    // reject the save when the DB copy is newer (another user saved after the
    // client last loaded). This prevents silent overwrites in collaborative
    // editing. The client can then show "reload to see latest changes".
    const clientLastUpdated = req.body._lastUpdatedAt;
    if (clientLastUpdated) {
      const { data: meta } = await supabaseAdmin
        .from('books')
        .select('updated_at')
        .eq('id', id)
        .single();
      if (meta?.updated_at) {
        const dbTime = new Date(meta.updated_at).getTime();
        const clientTime = new Date(clientLastUpdated).getTime();
        if (dbTime > clientTime) {
          res.status(409).json({
            success: false,
            error: 'Conflict: this book was modified by someone else. Reload to see the latest version.',
            serverUpdatedAt: meta.updated_at,
          });
          return;
        }
      }
    }

    // Build update object
    const updateData: any = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    // Track that the user is building with the MANUAL design pipeline so
    // exports/previews pick pageLayout+coverDesign over any autoDesignPlan.
    // Uses a dot-path into the ai_design_state JSONB (handled by the Book
    // adapter's read-modify-write) so we don't clobber the legacy `status`.
    if (('pageLayout' in updateData || 'coverDesign' in updateData) && !('aiDesignState' in updateData)) {
      updateData['aiDesignState.activeDesign'] = 'manual';
    }

    // Update book + broadcast change to other editors in the room
    const updatedBook = await Book.findByIdAndUpdate(id, updateData, { new: true });

    // Notify other collaborators in real-time that the book has changed
    try {
      const { emitToBookRoom } = await import('../services/socketService');
      emitToBookRoom(id, 'book:content-updated', {
        bookId: id,
        updatedBy: req.user.id,
        fields: Object.keys(updateData),
        at: new Date().toISOString(),
      });
    } catch { /* non-fatal */ }

    if (!updatedBook) {
      res.status(500).json({
        success: false,
        error: 'Failed to update book',
      });
      return;
    }

    // Update user's writing statistics
    if (updatedBook.statistics?.wordCount) {
      await User.findByIdAndUpdate(req.user.id, {
        'profile.writingStatistics.totalWords': updatedBook.statistics.wordCount,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: {
        book: {
          id: updatedBook.id,
          title: updatedBook.title,
          genre: updatedBook.genre,
          description: updatedBook.description,
          synopsis: updatedBook.synopsis,
          language: updatedBook.language,
          chapters: updatedBook.chapters,
          characters: updatedBook.characters,
          plotStructure: updatedBook.plotStructure,
          coverDesign: updatedBook.coverDesign,
          pageLayout: updatedBook.pageLayout,
          pageImages: updatedBook.pageImages,
          tags: updatedBook.tags,
          ageRating: updatedBook.ageRating,
          publishingStatus: updatedBook.publishingStatus,
          statistics: updatedBook.statistics,
          qualityScore: updatedBook.qualityScore,
          aiDesignState: updatedBook.aiDesignState,
          templateId: updatedBook.templateId,
          storyContext: updatedBook.storyContext,
          translations: updatedBook.translations,
          createdAt: updatedBook.created_at,
          updatedAt: updatedBook.updated_at,
        },
      },
    });
  } catch (error: any) {
    console.error('Update book error:', error);
    // Return more detailed error for debugging
    const errorMessage = error.message || 'Failed to update book';
    const validationErrors = error.errors ? Object.keys(error.errors).map(key => `${key}: ${error.errors[key].message}`).join(', ') : null;
    res.status(500).json({
      success: false,
      error: validationErrors || errorMessage,
      details: process.env.NODE_ENV !== 'production' ? error.toString() : undefined,
    });
  }
};

/**
 * Delete a book
 * DELETE /api/books/:id
 */
export const deleteBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    // Validate UUID
    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Lightweight fetch — only need author + publishingStatus, not full chapters/images
    const book = await Book.findByIdLite(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    // BUG-004: Fix type mismatch by converting both to strings
    if (book.author.toString() !== req.user.id.toString()) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this book',
      });
      return;
    }

    // Don't allow deletion of published books
    if (book.publishingStatus.status === 'published') {
      res.status(400).json({
        success: false,
        error: 'Cannot delete a published book. Unpublish it first.',
      });
      return;
    }

    // BUG-051 FIX: Cascade delete - delete related records before deleting the book
    try {
      // Delete related summaries
      await supabaseAdmin
        .from('summaries')
        .delete()
        .eq('book_id', id);

      // Delete related conversations linked to this book
      await supabaseAdmin
        .from('conversations')
        .delete()
        .eq('book_id', id);

      // Delete related notifications referencing this book
      // Notifications have book_id in their data JSON field, so we need to handle this differently
      // For now, we'll delete notifications that have this book in their data
      const { data: notifications } = await supabaseAdmin
        .from('notifications')
        .select('id, data')
        .not('data', 'is', null);

      if (notifications && notifications.length > 0) {
        const notificationIdsToDelete = notifications
          .filter((n: any) => n.data?.bookId === id)
          .map((n: any) => n.id);

        if (notificationIdsToDelete.length > 0) {
          await supabaseAdmin
            .from('notifications')
            .delete()
            .in('id', notificationIdsToDelete);
        }
      }

      // Delete related transactions for this book (book purchases)
      await supabaseAdmin
        .from('transactions')
        .delete()
        .eq('metadata->>bookId', id);

      // Remove book from users' reading history
      // This is stored in the user's profile JSON, so we need to update each affected user
      const { data: usersWithBook } = await supabaseAdmin
        .from('users')
        .select('id, profile')
        .not('profile', 'is', null);

      if (usersWithBook && usersWithBook.length > 0) {
        for (const userData of usersWithBook) {
          const profile = userData.profile;
          if (profile?.readingHistory && Array.isArray(profile.readingHistory)) {
            const filteredHistory = profile.readingHistory.filter(
              (item: any) => item.bookId !== id
            );
            if (filteredHistory.length !== profile.readingHistory.length) {
              await supabaseAdmin
                .from('users')
                .update({
                  profile: {
                    ...profile,
                    readingHistory: filteredHistory,
                  },
                  updated_at: new Date().toISOString(),
                })
                .eq('id', userData.id);
            }
          }
        }
      }

    } catch (cascadeError) {
      console.error('Error during cascade delete, continuing with book deletion:', cascadeError);
      // Continue with book deletion even if cascade operations fail
    }

    // BUG-011: Notify all collaborators that the book is being deleted
    // Do this BEFORE the actual delete so the socket room still exists.
    const { notifyBookDeleted } = await import('../services/socketService');
    notifyBookDeleted(id, book.title);

    await Book.findByIdAndDelete(id);

    // Update user's writing statistics
    const user = await User.findById(req.user.id);
    if (user && user.profile?.writingStatistics) {
      const newBooksWritten = Math.max(0, user.profile.writingStatistics.booksWritten - 1);
      await User.findByIdAndUpdate(req.user.id, {
        'profile.writingStatistics.booksWritten': newBooksWritten,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete book',
    });
  }
};

/**
 * Publish a book
 * POST /api/books/:id/publish
 */
export const publishBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;
    const { price, isFree } = req.body;

    // Validate UUID
    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to publish this book',
      });
      return;
    }

    // Diagnostic snapshot of the fields we're about to validate. Lets us
    // see in Vercel logs exactly which field tripped the 400 instead of
    // guessing from the user's report.
    console.log('[publishBook] validating:', JSON.stringify({
      id,
      hasChapters: book.chapters?.length > 0,
      chapterCount: book.chapters?.length || 0,
      synopsisWords: (book.synopsis || '').trim().split(/\s+/).filter(Boolean).length,
      synopsisLen: (book.synopsis || '').length,
      tagsCount: book.tags?.length || 0,
      hasCover: !!book.coverDesign?.front?.imageUrl,
      isFree: req.body.isFree,
      price: req.body.price,
    }));

    // Validate book has content
    if (book.chapters.length === 0) {
      console.warn('[publishBook] reject: no chapters');
      res.status(400).json({
        success: false,
        error: 'Cannot publish a book without chapters',
      });
      return;
    }

    // Validate marketplace metadata. Minimum 15 words gives readers
    // enough context to decide on the book without forcing the author
    // to pad. Whitespace-only words are filtered out before counting.
    const synopsisWordCount = (book.synopsis || '')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    if (!book.synopsis || synopsisWordCount < 15) {
      console.warn(`[publishBook] reject: synopsis ${synopsisWordCount} words`);
      res.status(400).json({
        success: false,
        error: 'Please add a synopsis (minimum 15 words) before publishing',
      });
      return;
    }

    if (!book.tags || book.tags.length === 0) {
      console.warn('[publishBook] reject: no tags');
      res.status(400).json({
        success: false,
        error: 'Please add at least one tag before publishing',
      });
      return;
    }

    // Validate cover design exists
    if (!book.coverDesign || !book.coverDesign.front?.imageUrl) {
      console.warn('[publishBook] reject: no cover');
      res.status(400).json({
        success: false,
        error: 'Please design a cover for your book before publishing',
      });
      return;
    }

    // Validate pricing (Section 9.2: Max $25)
    if (!isFree) {
      if (typeof price !== 'number' || price < 0.01 || price > 25) {
        res.status(400).json({
          success: false,
          error: 'Paid books must have a price between $0.01 and $25',
        });
        return;
      }
    }

    // Update publishing status
    const updatedPublishingStatus = {
      ...book.publishingStatus,
      status: 'published',
      isPublic: true,
      publishedAt: new Date().toISOString(),
      isFree: isFree || false,
      price: isFree ? 0 : price || 0,
    };

    const updatedBook = await Book.findByIdAndUpdate(id, {
      publishingStatus: updatedPublishingStatus,
    }, { new: true });

    // TTS DISABLED - Too expensive ($32+ per book)
    // Was generating 8 audio versions automatically (2 languages × 2 genders × 2 versions)
    // To re-enable, uncomment the following:
    // generateTranslationsAndAudio(id, book.title, book.chapters, book.language || 'en').catch((err) =>
    //   console.error('Failed to generate translations and audio:', err)
    // );

    // Update user's author profile
    const user = await User.findById(req.user.id);
    if (user && user.profile?.authorProfile) {
      const newPublishedBooks = user.profile.authorProfile.publishedBooks + 1;
      await User.findByIdAndUpdate(req.user.id, {
        'profile.authorProfile.publishedBooks': newPublishedBooks,
      });
    }

    // Send notification to author about successful publication (async, don't wait)
    notifyBookPublished(req.user!.id, id, book.title).catch((err) =>
      console.error('Failed to send book published notification:', err)
    );

    res.status(200).json({
      success: true,
      message: 'Book published successfully',
      data: {
        book: {
          id: updatedBook?.id || book.id,
          title: book.title,
          author: book.author,
          genre: book.genre,
          description: book.description,
          synopsis: book.synopsis,
          language: book.language,
          chapters: book.chapters,
          characters: book.characters,
          coverDesign: book.coverDesign,
          pageLayout: book.pageLayout,
          pageImages: book.pageImages,
          tags: book.tags,
          ageRating: book.ageRating,
          publishingStatus: updatedPublishingStatus,
          statistics: book.statistics,
          translations: book.translations,
          createdAt: book.created_at,
          updatedAt: book.updated_at,
        },
      },
    });
  } catch (error) {
    console.error('Publish book error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish book',
    });
  }
};

/**
 * Purchase a book
 * POST /api/books/:id/purchase
 */
export const purchaseBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    // Validate UUID
    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Lightweight fetch — only need publishingStatus + author for purchase check
    const book = await Book.findByIdLite(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Check if book is published
    if (book.publishingStatus.status !== 'published') {
      res.status(400).json({
        success: false,
        error: 'This book is not available for purchase',
      });
      return;
    }

    // Check if user is trying to purchase their own book
    if (book.author === req.user.id) {
      res.status(400).json({
        success: false,
        error: 'You cannot purchase your own book',
      });
      return;
    }

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Initialize profile if needed
    const profile = user.profile || {
      bio: '',
      notificationPreferences: {
        writing: true,
        publishing: true,
        sales: true,
        social: true,
        system: true,
        emailDigest: false,
      },
      readingHistory: [],
    };

    // Initialize readingHistory if needed
    const readingHistory = profile.readingHistory || [];

    // Check if already purchased
    const alreadyPurchased = readingHistory.some(
      (item: any) => item.bookId === id
    );

    if (alreadyPurchased) {
      res.status(400).json({
        success: false,
        error: 'You have already purchased this book',
      });
      return;
    }

    // Add to user's library
    readingHistory.push({
      bookId: id,
      progress: 0,
      lastRead: new Date().toISOString(),
    });

    await User.findByIdAndUpdate(req.user.id, {
      'profile.readingHistory': readingHistory,
    });

    // Update book statistics
    const newStatistics = {
      ...book.statistics,
      purchases: book.statistics.purchases + 1,
      revenue: book.statistics.revenue + book.publishingStatus.price,
    };
    await Book.findByIdAndUpdate(id, { statistics: newStatistics });

    // Update author's earnings
    const author = await User.findById(book.author);
    if (author && author.profile) {
      const earnings = author.profile.earnings || {
        totalEarned: 0,
        pendingPayout: 0,
        withdrawn: 0,
        history: [],
      };
      const authorShare = book.publishingStatus.price * 0.5; // 50% split
      earnings.totalEarned += authorShare;
      earnings.pendingPayout += authorShare;

      const authorProfile = author.profile.authorProfile || { totalSales: 0 };
      authorProfile.totalSales += 1;

      await User.findByIdAndUpdate(book.author, {
        'profile.earnings': earnings,
        'profile.authorProfile': authorProfile,
      });
    }

    // Send notification to author about purchase (async, don't wait)
    notifyBookPurchase(
      id,
      req.user!.id,
      book.author,
      book.publishingStatus.price,
      'ILS'
    ).catch((err) => console.error('Failed to send purchase notification:', err));

    // Send purchase confirmation email to buyer (async)
    // Note: 'author' is already fetched above for earnings update
    sendBookPurchaseEmail(
      user!.email,
      user!.name,
      book.title,
      author?.name || 'Unknown',
      book.publishingStatus.price,
      'ILS',
      id
    ).catch((err) => console.error('Failed to send purchase email:', err));

    // Send sale notification email to author (async)
    if (author) {
      sendSaleNotificationToAuthor(
        author.email,
        author.name,
        book.title,
        user!.name,
        book.publishingStatus.price * 0.5, // Author's share
        'ILS'
      ).catch((err) => console.error('Failed to send sale notification email:', err));
    }

    res.status(200).json({
      success: true,
      message: 'Book purchased successfully',
      data: {
        bookId: book.id,
        title: book.title,
        price: book.publishingStatus.price,
        readUrl: `/read/${book.id}`,
      },
    });
  } catch (error) {
    console.error('Purchase book error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to purchase book',
    });
  }
};

/**
 * Get all public published books (for marketplace)
 * GET /api/books/public
 * Section 8: Marketplace
 */
export const getPublicBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { genre, category, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Build query
    const query: any = {
      'publishingStatus.status': 'published',
      'publishingStatus.isPublic': true,
    };

    // Filter by genre
    if (genre && typeof genre === 'string') {
      query.genre = genre;
    }

    // Filter by category
    if (category && typeof category === 'string') {
      query['publishingStatus.marketingStrategy.categories'] = category;
    }

    // Search by title or description
    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sortOptions: any = {};
    if (sortBy === 'price') {
      sortOptions['publishingStatus.price'] = order === 'asc' ? 1 : -1;
    } else if (sortBy === 'quality') {
      sortOptions['qualityScore.overallScore'] = order === 'asc' ? 1 : -1;
    } else if (sortBy === 'popularity') {
      sortOptions['statistics.views'] = -1;
    } else {
      sortOptions[sortBy as string] = order === 'asc' ? 1 : -1;
    }

    // PERF: list endpoint — skip heavy JSONB columns
    const books = await Book.find({
      ...query,
      _sort: sortBy as string,
      _order: order as string,
      _limit: 100,
      _lightweight: true,
    });

    // PERF: batch-fetch all unique authors in ONE query instead of N+1.
    // Old code did `books.map(async b => User.findById(b.author))` which for
    // 50 books meant 51 sequential round-trips to Supabase (~5–10 seconds).
    const uniqueAuthorIds = Array.from(new Set(books.map((b) => b.author)));
    const authors = uniqueAuthorIds.length > 0
      ? await User.findByIds(uniqueAuthorIds)
      : [];
    const authorMap = new Map(authors.map((a: any) => [a.id, a]));

    const booksWithAuthors = books.map((book) => {
      const author = authorMap.get(book.author);
      return {
        ...book,
        authorName: author?.name || 'Unknown Author',
        author: {
          id: author?.id || book.author,
          name: author?.name || 'Unknown Author',
          profile: {
            avatar: author?.profile?.avatar || null,
            bio: author?.profile?.bio || null,
          },
        },
      };
    });

    res.status(200).json({
      success: true,
      data: {
        books: booksWithAuthors,
        count: booksWithAuthors.length,
      },
    });
  } catch (error) {
    console.error('Get public books error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch public books',
    });
  }
};

/**
 * Get a single published book by ID (public)
 * GET /api/books/public/:id
 * Section 8: Marketplace - Book Details
 */
export const getPublicBookById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Check if book is publicly published
    const isPubliclyPublished = book.publishingStatus?.status === 'published' && book.publishingStatus?.isPublic;

    if (!isPubliclyPublished) {
      res.status(403).json({
        success: false,
        error: 'This book is not publicly available',
      });
      return;
    }

    // Fetch author info
    const author = await User.findById(book.author);

    res.status(200).json({
      success: true,
      data: {
        _id: book.id,
        id: book.id,
        title: book.title,
        genre: book.genre,
        synopsis: book.synopsis,
        description: book.description,
        language: book.language,
        chapters: book.chapters || [],
        translations: book.translations,
        coverDesign: book.coverDesign,
        qualityScore: book.qualityScore,
        publishingStatus: {
          price: book.publishingStatus?.price || 0,
          isFree: book.publishingStatus?.isFree || true,
        },
        statistics: {
          wordCount: book.statistics?.wordCount || 0,
          pageCount: book.statistics?.pageCount || 0,
          views: book.statistics?.views || 0,
          averageRating: book.statistics?.averageRating || 0,
          totalReviews: book.statistics?.totalReviews || 0,
        },
        likes: book.likes || 0,
        likedBy: book.likedBy || [],
        reviews: book.reviews || [],
        author: {
          _id: author?.id || book.author,
          id: author?.id || book.author,
          name: author?.name || 'Unknown Author',
          profile: {
            avatar: author?.profile?.avatar || null,
            bio: author?.profile?.bio || null,
          },
        },
        createdAt: book.created_at,
      },
    });
  } catch (error) {
    console.error('Get public book error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve book',
    });
  }
};

/**
 * Record a book view
 * POST /api/books/:id/view
 * Section 8: Marketplace - View tracking
 */
export const recordBookView = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Lightweight fetch — only need statistics for view count
    const book = await Book.findByIdLite(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Increment view count
    const currentStats = book.statistics || { views: 0, purchases: 0, revenue: 0, ratings: [], averageRating: 0 };
    const newViewCount = (currentStats.views || 0) + 1;
    await Book.findByIdAndUpdate(id, {
      statistics: {
        ...currentStats,
        views: newViewCount,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        views: newViewCount,
      },
    });
  } catch (error) {
    console.error('Record view error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record view',
    });
  }
};

/**
 * Export book as PDF
 * GET /api/books/:id/export
 * Section 16.1: PDF Export (Legacy endpoint - redirects to new format)
 */
export const exportBookPDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    // Validate UUID
    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (!canEditBook(book, req.user.id)) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to export this book',
      });
      return;
    }

    // Validate book has content before exporting
    if (!book.chapters || book.chapters.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot export a book without chapters. Please add content to your book first.',
      });
      return;
    }

    // Check if at least one chapter has content
    const hasContent = book.chapters.some((ch: any) => ch.content && ch.content.trim().length > 0);
    if (!hasContent) {
      res.status(400).json({
        success: false,
        error: 'Cannot export a book without content. Please add some text to your chapters first.',
      });
      return;
    }

    // Generate PDF using the new comprehensive export service
    const exportResult = await exportBook(id, 'pdf');

    // Validate export result
    if (!exportResult || !exportResult.buffer) {
      res.status(500).json({
        success: false,
        error: 'Export failed - no output generated',
      });
      return;
    }

    // Log any warnings that occurred during export
    if (exportResult.warnings && exportResult.warnings.length > 0) {
      console.log(`Export warnings for book ${id}:`, exportResult.warnings);
    }

    // Set response headers for PDF download
    const filename = book.title.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.pdf"`);
    res.setHeader('Content-Length', exportResult.buffer.length);

    // Include warnings in response header if any (for debugging)
    if (exportResult.warnings && exportResult.warnings.length > 0) {
      res.setHeader('X-Export-Warnings', JSON.stringify(exportResult.warnings));
    }

    // Send the PDF buffer
    res.send(exportResult.buffer);
  } catch (error: any) {
    console.error('Export book error:', error);

    // Provide more specific error messages
    let errorMessage = 'Failed to export book';
    if (error.message?.includes('not found')) {
      errorMessage = 'Book not found or has been deleted';
    } else if (error.message?.includes('font')) {
      errorMessage = 'Font loading error. Please try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Async PDF export via background job.
 * POST /api/books/:id/export-async
 *
 * Returns { jobId } immediately. Client polls GET /api/jobs/:jobId until
 * status === 'completed', then reads result.downloadUrl for the signed URL.
 * PDF is uploaded to Supabase Storage bucket `exports` with a 24h signed URL.
 */
export const exportBookPDFAsync = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    if (!isValidUUID(id)) {
      res.status(400).json({ success: false, error: 'Invalid book ID' });
      return;
    }

    const book = await Book.findById(id);
    if (!book) {
      res.status(404).json({ success: false, error: 'Book not found' });
      return;
    }
    if (!canEditBook(book, req.user.id)) {
      res.status(403).json({ success: false, error: 'You do not have permission to export this book' });
      return;
    }
    if (!book.chapters?.length || !book.chapters.some((ch: any) => ch.content?.trim())) {
      res.status(400).json({
        success: false,
        error: 'Cannot export a book without content. Add text to chapters first.',
      });
      return;
    }

    // Capture the user's JWT so Puppeteer can authenticate as them.
    // We grab it before entering the background task because `req` won't be
    // safe to read after the response is sent.
    const authHeader = req.headers.authorization || '';
    const authToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

    // Render the design the user actually built last: 'designed' (auto-design /
    // עימוד) renders /print/:id/designed; 'manual' renders /print/:id. This is
    // what makes "export === what you see".
    const exportVariant = resolveActiveDesign(book) === 'auto' ? 'designed' : 'manual';

    // Enqueue job and return immediately
    const job = await enqueueJob({
      userId: req.user.id,
      bookId: id,
      type: 'pdf_export',
      input: { format: 'pdf', title: book.title },
    });

    // Fire-and-forget the actual work
    runJobInBackground(job.id, async ({ updateProgress }) => {
      let pdfBuffer: Buffer;
      let warnings: string[] = [];

      // Step 1: React-app renderer (PrintBookPage) — EXACT match to Layout editor
      // since they share the same React code and CSS. This is the source of truth.
      try {
        await updateProgress(5, 'Generating PDF (exact layout match)...');
        pdfBuffer = await renderBookToPdf({
          bookId: id,
          authToken,
          variant: exportVariant,
          onProgress: (pct, msg) => updateProgress(5 + pct * 0.65, msg),
        });
        if (exportVariant === 'designed') {
          // The fallback renderers below only understand the manual pageLayout,
          // so for auto-designed books the WYSIWYG path is the only faithful one.
          // (Reaching the fallbacks would silently produce manual-layout output.)
        }
      } catch (puppeteerErr: any) {
        if (exportVariant === 'designed') {
          warnings.push('Auto-design PDF fell back to the manual renderer — layout may differ from the עימוד preview.');
        }
        console.warn('[exportBookPDFAsync] React renderer failed, trying server HTML:', puppeteerErr?.message);

        // Step 2: Server-side HTML renderer (still uses Puppeteer/Chrome but generates HTML directly)
        try {
          await updateProgress(10, 'Generating PDF (server HTML)...');
          pdfBuffer = await generateBookPdfFromHtml({
            bookId: id,
            onProgress: (pct, msg) => updateProgress(10 + pct * 0.55, msg),
          });
          warnings.push('Used server-side renderer — layout may differ slightly from editor.');
        } catch (htmlErr: any) {
          console.warn('[exportBookPDFAsync] Server HTML failed, falling back to PDFKit:', htmlErr?.message);

          // Step 3: PDFKit fallback (no Chrome needed)
          await updateProgress(10, 'Generating PDF (fallback)...');
          const exportResult = await exportBook(id, 'pdf');
          if (!exportResult?.buffer) throw new Error('Export failed — no output generated');
          pdfBuffer = exportResult.buffer;
          warnings = [...(exportResult.warnings || []), 'PDF generated with fallback renderer — for best results use "Save as PDF" from your browser.'];
        }
      }

      await updateProgress(70, 'Uploading to storage...');
      const { supabaseAdmin } = await import('../config/supabase');

      // Supabase Storage keys must be ASCII — Hebrew/Unicode titles get rejected
      // as "Invalid key". Use a pure ASCII path (timestamp + book id + "book")
      // and keep the Hebrew title only for the download filename that the
      // browser shows the user.
      const storagePath = `${req.user!.id}/${id}/${Date.now()}_book.pdf`;
      const downloadFilename = `${book.title.replace(/[^\w\u0590-\u05FF\s-]/g, '').trim().slice(0, 80) || 'book'}.pdf`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('exports')
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });
      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      await updateProgress(95, 'Creating download link...');
      // 24-hour signed URL. Pass the download filename so the browser saves
      // the file with the original (possibly Hebrew) book title.
      const { data: signed, error: signError } = await supabaseAdmin.storage
        .from('exports')
        .createSignedUrl(storagePath, 60 * 60 * 24, { download: downloadFilename });
      if (signError || !signed) {
        throw new Error(`Failed to create download link: ${signError?.message || 'unknown'}`);
      }

      return {
        downloadUrl: signed.signedUrl,
        filename: downloadFilename,
        sizeBytes: pdfBuffer.length,
        expiresInSeconds: 60 * 60 * 24,
        warnings,
      };
    });

    res.status(202).json({
      success: true,
      data: {
        jobId: job.id,
        status: 'pending',
        pollUrl: `/api/jobs/${job.id}`,
      },
    });
  } catch (error: any) {
    console.error('Async export book error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start export',
    });
  }
};

/**
 * Toggle like on a book
 * POST /api/books/:id/like
 */
export const likeBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Lightweight fetch — only need likes/likedBy
    const book = await Book.findByIdLite(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Check if user already liked this book
    const userId = req.user.id;
    const likedBy = book.likedBy || [];
    const likedIndex = likedBy.findIndex(
      (likedUserId: string) => likedUserId === userId
    );

    let newLikes = book.likes || 0;
    let newLikedBy = [...likedBy];

    if (likedIndex > -1) {
      // Unlike: remove user from likedBy array
      newLikedBy.splice(likedIndex, 1);
      newLikes = Math.max(0, newLikes - 1);
    } else {
      // Like: add user to likedBy array
      newLikedBy.push(userId);
      newLikes += 1;

      // Send notification to author (async, don't wait)
      notifyBookLike(id, req.user!.id, book.author).catch((err) =>
        console.error('Failed to send like notification:', err)
      );
    }

    await Book.findByIdAndUpdate(id, { likes: newLikes, likedBy: newLikedBy });

    res.status(200).json({
      success: true,
      message: likedIndex > -1 ? 'Book unliked' : 'Book liked',
      data: {
        likes: newLikes,
        isLiked: likedIndex === -1,
      },
    });
  } catch (error) {
    console.error('Like book error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like book',
    });
  }
};

/**
 * Add a review to a book
 * POST /api/books/:id/review
 */
export const addReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;
    const { rating, comment } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5',
      });
      return;
    }

    if (!comment || comment.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Comment is required',
      });
      return;
    }

    if (comment.length > 1000) {
      res.status(400).json({
        success: false,
        error: 'Comment must not exceed 1000 characters',
      });
      return;
    }

    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Lightweight fetch — only need author + reviews
    const book = await Book.findByIdLite(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Authors cannot review their own books
    if (book.author === req.user.id) {
      res.status(400).json({
        success: false,
        error: 'Authors cannot review their own books',
      });
      return;
    }

    // Check if user already reviewed this book
    const reviews = book.reviews || [];
    const existingReview = reviews.find(
      (review: any) => review.user === req.user!.id
    );

    if (existingReview) {
      res.status(400).json({
        success: false,
        error: 'You have already reviewed this book',
      });
      return;
    }

    // Get user name
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Add review
    const newReview = {
      user: req.user.id,
      userName: user.name,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };
    const updatedReviews = [...reviews, newReview];

    // Update statistics
    const totalReviews = updatedReviews.length;
    const totalRating = updatedReviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;

    const updatedStatistics = {
      ...book.statistics,
      totalReviews,
      averageRating,
    };

    await Book.findByIdAndUpdate(id, {
      reviews: updatedReviews,
      statistics: updatedStatistics,
    });

    // Send notification to author (async, don't wait)
    notifyBookComment(id, req.user!.id, book.author, rating).catch((err) =>
      console.error('Failed to send comment notification:', err)
    );

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: {
        review: newReview,
        averageRating,
        totalReviews,
      },
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add review',
    });
  }
};

/**
 * Get all reviews for a book
 * GET /api/books/:id/reviews
 */
export const getBookReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    const book = await Book.findByIdLite(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        reviews: book.reviews,
        averageRating: book.statistics.averageRating,
        totalReviews: book.statistics.totalReviews,
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reviews',
    });
  }
};

/**
 * Update a review
 * PUT /api/books/:id/review
 */
export const updateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;
    const { rating, comment } = req.body;

    // Validation
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5',
      });
      return;
    }

    if (comment !== undefined && comment.length > 1000) {
      res.status(400).json({
        success: false,
        error: 'Comment must not exceed 1000 characters',
      });
      return;
    }

    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    const book = await Book.findByIdLite(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Find user's review
    const reviews = book.reviews || [];
    const reviewIndex = reviews.findIndex(
      (review: any) => review.user === req.user!.id
    );

    if (reviewIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Review not found',
      });
      return;
    }

    // Update review
    const updatedReview = {
      ...reviews[reviewIndex],
      rating: rating !== undefined ? rating : reviews[reviewIndex].rating,
      comment: comment !== undefined ? comment.trim() : reviews[reviewIndex].comment,
      updatedAt: new Date().toISOString(),
    };
    reviews[reviewIndex] = updatedReview;

    // Recalculate statistics
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;

    const updatedStatistics = {
      ...book.statistics,
      totalReviews,
      averageRating,
    };

    await Book.findByIdAndUpdate(id, {
      reviews,
      statistics: updatedStatistics,
    });

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: {
        review: updatedReview,
        averageRating,
        totalReviews,
      },
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update review',
    });
  }
};

/**
 * Delete a review
 * DELETE /api/books/:id/review
 */
export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    const book = await Book.findByIdLite(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Find user's review
    const reviews = book.reviews || [];
    const reviewIndex = reviews.findIndex(
      (review: any) => review.user === req.user!.id
    );

    if (reviewIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Review not found',
      });
      return;
    }

    // Remove review
    reviews.splice(reviewIndex, 1);

    // Recalculate statistics
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    const updatedStatistics = {
      ...book.statistics,
      totalReviews,
      averageRating,
    };

    await Book.findByIdAndUpdate(id, {
      reviews,
      statistics: updatedStatistics,
    });

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
      data: {
        averageRating,
        totalReviews,
      },
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete review',
    });
  }
};

/**
 * Upload cover image
 * POST /api/books/:id/upload-cover
 * On Vercel: converts image to base64 data URL and stores in DB
 * On local: stores file on disk
 */
export const uploadCoverImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
      return;
    }

    const { id } = req.params;

    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    const book = await Book.findByIdLite(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Owner OR active collaborator may upload the cover
    const isOwner = book.author === req.user.id;
    const isCollaborator = (book.collaborators || []).some(
      (c: any) => c.userId === req.user.id && (c.status === 'active' || !c.status)
    );
    if (!isOwner && !isCollaborator) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to update this book',
      });
      return;
    }

    let imageUrl: string;

    // Always try to upload to Supabase Storage for a stable HTTP URL.
    // This avoids base64 blobs in the DB that get stripped on layout saves.
    try {
      const { persistImage } = await import('../services/imagePersistenceService');

      let tempUrl: string;
      if (req.file.buffer) {
        // Vercel / memoryStorage: create a data URL so persistImage can decode it
        const mimeType = req.file.mimetype || 'image/jpeg';
        tempUrl = `data:${mimeType};base64,${req.file.buffer.toString('base64')}`;
      } else if (req.file.filename) {
        tempUrl = `/uploads/${req.file.filename}`;
      } else {
        res.status(400).json({ success: false, error: 'Invalid file upload' });
        return;
      }

      imageUrl = await persistImage(tempUrl, {
        userId: req.user.id,
        bookId: id,
        mimeTypeHint: req.file.mimetype,
      });
    } catch (storageErr: any) {
      console.warn('[uploadCoverImage] Supabase upload failed, falling back:', storageErr?.message);
      // Fallback: store locally or as base64 (same as old behaviour)
      if (req.file.filename) {
        imageUrl = `/uploads/${req.file.filename}`;
      } else if (req.file.buffer) {
        const mimeType = req.file.mimetype || 'image/jpeg';
        imageUrl = `data:${mimeType};base64,${req.file.buffer.toString('base64')}`;
      } else {
        res.status(400).json({ success: false, error: 'Invalid file upload' });
        return;
      }
    }

    // Caller can target front or back cover via ?side=back (or body.side).
    // Default = front for backward compatibility with old clients.
    const side: 'front' | 'back' =
      (req.query.side === 'back' || req.body?.side === 'back') ? 'back' : 'front';

    // Update book cover design with proper typing
    let coverDesign = book.coverDesign || {};
    if (side === 'back') {
      if (!coverDesign.back) {
        coverDesign.back = {
          imageUrl,
          backgroundColor: '#1a1a2e',
          synopsis: book.synopsis || book.description || '',
        } as any;
      } else {
        coverDesign.back.imageUrl = imageUrl;
      }
    } else {
      if (!coverDesign.front) {
        coverDesign.front = {
          type: 'uploaded',
          imageUrl,
          title: {
            text: book.title,
            font: 'Arial',
            size: 48,
            color: '#ffffff',
          },
          authorName: {
            text: '',
            font: 'Arial',
            size: 24,
            color: '#ffffff',
          },
        } as any;
      } else {
        coverDesign.front.imageUrl = imageUrl;
        coverDesign.front.type = 'uploaded';
      }
    }

    await Book.findByIdAndUpdate(id, { coverDesign });

    res.status(200).json({
      success: true,
      message: 'Cover image uploaded successfully',
      data: {
        imageUrl,
        filename: req.file.filename || 'embedded-image',
      },
    });
  } catch (error) {
    console.error('Upload cover error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload cover image',
    });
  }
};

/**
 * Upload and extract text from manuscript file
 * POST /api/books/upload
 * Section 4.1: File Upload → Analysis → Book
 */
export const uploadManuscript = async (req: AuthRequest, res: Response): Promise<void> => {
  // Track temp file for cleanup
  let tempFilePath: string | null = null;
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
      return;
    }

    const { title, genre } = req.body;

    if (!title || !genre) {
      res.status(400).json({
        success: false,
        error: 'Title and genre are required',
      });
      return;
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let extractedText = '';

    // Handle both disk storage (local) and memory storage (Vercel)
    let filePath: string;

    if (req.file.path) {
      // Disk storage - file is on disk
      filePath = req.file.path;
    } else if (req.file.buffer) {
      // Memory storage (Vercel) - write buffer to temp file
      const tempDir = '/tmp';
      const tempFileName = `manuscript-${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
      tempFilePath = path.join(tempDir, tempFileName);

      console.log(`📁 Writing buffer to temp file: ${tempFilePath}`);
      await fs.writeFile(tempFilePath, req.file.buffer);
      filePath = tempFilePath;
    } else {
      res.status(400).json({
        success: false,
        error: 'File upload failed. No file data received.',
      });
      return;
    }

    try {
      // Extract text based on file type
      if (fileExtension === '.pdf') {
        // PDF parsing disabled - DOMMatrix not available in Vercel serverless
        res.status(400).json({
          success: false,
          error: 'PDF upload is temporarily unavailable. Please upload DOCX or TXT files instead.',
        });
        return;
      } else if (fileExtension === '.docx' || fileExtension === '.doc') {
        // Extract text from DOCX - mammoth can use buffer directly on Vercel
        if (isVercel && req.file.buffer) {
          const result = await mammoth.extractRawText({ buffer: req.file.buffer });
          extractedText = result.value;
        } else {
          const result = await mammoth.extractRawText({ path: filePath });
          extractedText = result.value;
        }
      } else if (fileExtension === '.txt') {
        // Read plain text file - can use buffer directly on Vercel
        if (isVercel && req.file.buffer) {
          extractedText = req.file.buffer.toString('utf-8');
        } else {
          extractedText = await fs.readFile(filePath, 'utf-8');
        }
      } else {
        res.status(400).json({
          success: false,
          error: 'Unsupported file type. Please upload DOCX or TXT files.',
        });
        return;
      }

      // Validate extracted text
      if (!extractedText || extractedText.trim().length < 100) {
        res.status(400).json({
          success: false,
          error: 'Could not extract sufficient text from the file. Please ensure the file contains readable text.',
        });
        return;
      }

      // Calculate word count
      const wordCount = extractedText.trim().split(/\s+/).length;

      // Auto-detect chapters based on common patterns
      const chapters = splitTextIntoChapters(extractedText.trim());

      // Detect language (Hebrew or English based on content)
      const hebrewChars = (extractedText.match(/[\u0590-\u05FF]/g) || []).length;
      const latinChars = (extractedText.match(/[a-zA-Z]/g) || []).length;
      const detectedLanguage = hebrewChars > latinChars ? 'he' : 'en';

      // Create new book with extracted content (auto-split into chapters)
      const book = await Book.create({
        title: title.trim(),
        author: req.user.id,
        genre,
        description: `Imported from ${req.file.originalname}`,
        language: detectedLanguage,
        chapters: chapters.map((ch, index) => ({
          title: ch.title,
          content: ch.content,
          order: index,
          wordCount: ch.content.trim().split(/\s+/).length,
        })),
        publishingStatus: {
          status: 'draft',
          price: 0,
          isFree: true,
          isPublic: false,
        },
        statistics: {
          wordCount,
          pageCount: Math.ceil(wordCount / 250), // Rough estimate: 250 words per page
          chapterCount: chapters.length,
          characterCount: 0,
          views: 0,
          purchases: 0,
          revenue: 0,
          totalReviews: 0,
          shares: 0,
          comments: 0,
        },
      });

      // Update user's writing statistics
      const user = await User.findById(req.user.id);
      if (user && user.profile) {
        const writingStatistics = user.profile.writingStatistics || {
          totalWords: 0,
          booksWritten: 0,
        };
        writingStatistics.booksWritten += 1;
        writingStatistics.totalWords += wordCount;
        await User.findByIdAndUpdate(req.user.id, {
          'profile.writingStatistics': writingStatistics,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Manuscript uploaded and processed successfully',
        data: {
          book: {
            id: book.id,
            title: book.title,
            genre: book.genre,
            wordCount,
            chapters: book.chapters.map((ch: any) => ({
              title: ch.title,
              wordCount: ch.wordCount,
            })),
          },
        },
      });
    } catch (extractError) {
      throw extractError;
    } finally {
      // Clean up temp file if created (Vercel memory storage case)
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
          console.log(`🗑️ Cleaned up temp file: ${tempFilePath}`);
        } catch (unlinkError) {
          // Ignore cleanup errors
        }
      }
      // Clean up disk storage file (local development)
      if (req.file?.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          // Ignore cleanup errors
        }
      }
    }
  } catch (error: any) {
    // Clean up temp file on error
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (unlinkError) {
        // Ignore cleanup errors
      }
    }

    console.error('Upload manuscript error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    // Provide specific error messages
    let errorMessage = 'Failed to process uploaded manuscript';

    if (error.code === 'ENOENT') {
      errorMessage = 'File upload failed. Please try again.';
    } else if (error.message?.includes('DOCX') || error.message?.includes('mammoth')) {
      errorMessage = 'Failed to read DOCX file. Please ensure the file is not corrupted.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Upload and transcribe audio file
 * POST /api/books/upload-audio
 * Section 4.1: Audio Upload → Transcription → Book
 */
export const uploadAudio = async (req: AuthRequest, res: Response): Promise<void> => {
  // Track temp file for cleanup
  let tempFilePath: string | null = null;

  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No audio file uploaded',
      });
      return;
    }

    const { title, genre, language } = req.body;

    if (!title || !genre) {
      res.status(400).json({
        success: false,
        error: 'Title and genre are required',
      });
      return;
    }

    // Handle both disk storage (local) and memory storage (Vercel)
    let filePath: string;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    if (req.file.path) {
      // Disk storage - file is on disk
      filePath = req.file.path;
    } else if (req.file.buffer) {
      // Memory storage (Vercel) - write buffer to temp file
      const tempDir = '/tmp';
      const tempFileName = `audio-${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
      tempFilePath = path.join(tempDir, tempFileName);

      console.log(`📁 Writing audio buffer to temp file: ${tempFilePath}`);
      await fs.writeFile(tempFilePath, req.file.buffer);
      filePath = tempFilePath;
    } else {
      res.status(400).json({
        success: false,
        error: 'File upload failed. No file data received.',
      });
      return;
    }

    try {
      console.log(`🎤 Processing audio file: ${req.file.originalname}`);

      // Transcribe audio using Whisper API
      const { text: transcribedText, language: detectedLanguage } = await transcribeAudio(
        filePath,
        language
      );

      // Validate transcribed text
      if (!transcribedText || transcribedText.trim().length < 50) {
        res.status(400).json({
          success: false,
          error: 'Could not transcribe sufficient text from the audio. Please ensure the audio has clear speech.',
        });
        return;
      }

      // Calculate word count
      const wordCount = transcribedText.trim().split(/\s+/).length;

      // Create new book with transcribed content
      // Use language-appropriate chapter title
      const chapterTitle = detectedLanguage === 'he' ? 'תוכן מתומלל' : 'Transcribed Content';
      const descriptionText = detectedLanguage === 'he'
        ? `תומלל מקובץ אודיו: ${req.file.originalname}`
        : `Transcribed from audio: ${req.file.originalname}`;

      const book = await Book.create({
        title: title.trim(),
        author: req.user.id,
        genre,
        description: descriptionText,
        language: detectedLanguage || 'en',
        chapters: [
          {
            title: chapterTitle,
            content: transcribedText.trim(),
            order: 0,
            wordCount,
          },
        ],
        publishingStatus: {
          status: 'draft',
          price: 0,
          isFree: true,
          isPublic: false,
        },
        statistics: {
          wordCount,
          pageCount: Math.ceil(wordCount / 250),
          chapterCount: 1,
          characterCount: 0,
          views: 0,
          purchases: 0,
          revenue: 0,
          totalReviews: 0,
          shares: 0,
          comments: 0,
        },
      });

      // Update user's writing statistics
      const user = await User.findById(req.user.id);
      if (user && user.profile) {
        const writingStatistics = user.profile.writingStatistics || {
          totalWords: 0,
          booksWritten: 0,
        };
        writingStatistics.booksWritten += 1;
        writingStatistics.totalWords += wordCount;
        await User.findByIdAndUpdate(req.user.id, {
          'profile.writingStatistics': writingStatistics,
        });
      }

      console.log(`✅ Audio transcription complete. Created book: ${book.id}`);

      res.status(201).json({
        success: true,
        message: 'Audio transcribed and book created successfully',
        data: {
          book: {
            id: book.id,
            title: book.title,
            genre: book.genre,
            language: detectedLanguage,
            wordCount,
            chapters: book.chapters.map((ch: any) => ({
              title: ch.title,
              wordCount: ch.wordCount,
            })),
          },
        },
      });
    } catch (transcriptionError: any) {
      // Handle specific transcription errors
      if (transcriptionError.message.includes('API key')) {
        res.status(500).json({
          success: false,
          error: 'Audio transcription service is not configured. Please contact support.',
        });
        return;
      }

      throw transcriptionError;
    } finally {
      // Clean up temp file if created (Vercel memory storage case)
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
          console.log(`🗑️ Cleaned up temp audio file: ${tempFilePath}`);
        } catch (unlinkError) {
          // Ignore cleanup errors
        }
      }
      // Clean up disk storage file (local development)
      if (req.file?.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          // Ignore cleanup errors
        }
      }
    }
  } catch (error: any) {
    // Clean up temp file on error
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (unlinkError) {
        // Ignore cleanup errors
      }
    }

    console.error('Upload audio error:', {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process uploaded audio',
    });
  }
};

/**
 * Get AI pricing strategy for a book
 * GET /api/books/:id/pricing-strategy
 */
export const getPricingStrategy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    // Validate UUID
    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Lightweight fetch — only need author for ownership check
    const book = await Book.findByIdLite(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to access this book',
      });
      return;
    }

    // Generate pricing strategy
    const strategy = await generatePricingStrategy(id, req.user.id);

    res.status(200).json({
      success: true,
      data: strategy,
    });
  } catch (error: any) {
    console.error('Get pricing strategy error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate pricing strategy',
    });
  }
};

/**
 * Export book to PDF or DOCX
 * GET /api/books/:id/export/:format
 */
export const exportBookToFormat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id, format } = req.params;

    // Validate format
    if (!['pdf', 'docx'].includes(format)) {
      res.status(400).json({
        success: false,
        error: 'Invalid format. Supported formats: pdf, docx',
      });
      return;
    }

    // Validate UUID
    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (!canEditBook(book, req.user.id)) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to export this book',
      });
      return;
    }

    // Validate book has content before exporting
    if (!book.chapters || book.chapters.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot export a book without chapters. Please add content to your book first.',
      });
      return;
    }

    // Check if at least one chapter has content
    const hasContent = book.chapters.some((ch: any) => ch.content && ch.content.trim().length > 0);
    if (!hasContent) {
      res.status(400).json({
        success: false,
        error: 'Cannot export a book without content. Please add some text to your chapters first.',
      });
      return;
    }

    // Generate export file
    const exportResult = await exportBook(id, format as 'pdf' | 'docx');

    // Validate export result
    if (!exportResult || !exportResult.buffer) {
      res.status(500).json({
        success: false,
        error: 'Export failed - no output generated',
      });
      return;
    }

    // Log any warnings that occurred during export
    if (exportResult.warnings && exportResult.warnings.length > 0) {
      console.log(`Export warnings for book ${id}:`, exportResult.warnings);
    }

    // Set response headers
    // Use ASCII-safe filename for Content-Disposition header, encode non-ASCII with RFC 5987
    const safeFilename = book.title.replace(/[^a-zA-Z0-9]/g, '_');
    const encodedFilename = encodeURIComponent(book.title);
    const contentType = format === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    res.setHeader('Content-Type', contentType);
    // Use both filename (ASCII fallback) and filename* (UTF-8 encoded) for compatibility
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.${format}"; filename*=UTF-8''${encodedFilename}.${format}`);
    res.setHeader('Content-Length', exportResult.buffer.length);

    // Include warnings in response header if any (for debugging)
    if (exportResult.warnings && exportResult.warnings.length > 0) {
      res.setHeader('X-Export-Warnings', JSON.stringify(exportResult.warnings));
    }

    res.send(exportResult.buffer);
  } catch (error: any) {
    console.error('Export book error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export book',
    });
  }
};

/**
 * Upload a page image for book layout
 * POST /api/books/:id/page-image
 */
export const uploadPageImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No image file uploaded',
      });
      return;
    }

    const { id } = req.params;

    // Validate UUID
    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Convert the uploaded file to a URL.
    // NOTE: We intentionally skip Book.findById / ownership check here — the user
    // is already authenticated via JWT, and the image URL is only useful to the
    // client that uploaded it. The image gets persisted to the book via the
    // normal PUT /api/books/:id save flow, so no separate DB write is needed here.
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

    let imageUrl: string;

    if (isVercel && req.file.buffer) {
      // On Vercel: return as base64 data URL (no writable filesystem)
      const mimeType = req.file.mimetype || 'image/jpeg';
      const base64Data = req.file.buffer.toString('base64');
      imageUrl = `data:${mimeType};base64,${base64Data}`;
    } else if (req.file.filename) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else {
      res.status(400).json({ success: false, error: 'Invalid file upload' });
      return;
    }

    const { pageIndex, x, y, width, height, rotation } = req.body;
    const pageImage = {
      id: crypto.randomUUID(),
      pageIndex: parseInt(pageIndex, 10) || 0,
      url: imageUrl,
      x: parseFloat(x) || 10,
      y: parseFloat(y) || 10,
      width: parseFloat(width) || 30,
      height: parseFloat(height) || 30,
      rotation: parseFloat(rotation) || 0,
      isAiGenerated: false,
      createdAt: new Date(),
    };

    res.status(201).json({
      success: true,
      message: 'Page image uploaded successfully',
      data: { image: pageImage },
    });
  } catch (error: any) {
    console.error('Upload page image error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload page image',
    });
  }
};

/**
 * Update page image position/size
 * PUT /api/books/:id/page-image/:imageId
 */
export const updatePageImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id, imageId } = req.params;
    const { pageIndex, x, y, width, height, rotation } = req.body;

    // Validate UUIDs
    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (!canEditBook(book, req.user.id)) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to update this book',
      });
      return;
    }

    // Find the page image
    const pageImages = book.pageImages || [];
    if (pageImages.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No page images found',
      });
      return;
    }

    const imageIndex = pageImages.findIndex(
      (img: any) => img.id === imageId || img._id === imageId
    );

    if (imageIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Page image not found',
      });
      return;
    }

    // Update image properties
    if (pageIndex !== undefined) pageImages[imageIndex].pageIndex = parseInt(pageIndex, 10);
    if (x !== undefined) pageImages[imageIndex].x = parseFloat(x);
    if (y !== undefined) pageImages[imageIndex].y = parseFloat(y);
    if (width !== undefined) pageImages[imageIndex].width = parseFloat(width);
    if (height !== undefined) pageImages[imageIndex].height = parseFloat(height);
    if (rotation !== undefined) pageImages[imageIndex].rotation = parseFloat(rotation);

    await Book.findByIdAndUpdate(id, { pageImages });

    res.status(200).json({
      success: true,
      message: 'Page image updated successfully',
      data: {
        image: pageImages[imageIndex],
      },
    });
  } catch (error: any) {
    console.error('Update page image error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update page image',
    });
  }
};

/**
 * Delete page image
 * DELETE /api/books/:id/page-image/:imageId
 */
export const deletePageImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id, imageId } = req.params;

    // Validate UUID
    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (!canEditBook(book, req.user.id)) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to update this book',
      });
      return;
    }

    // Find and remove the page image
    const pageImages = book.pageImages || [];
    if (pageImages.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No page images found',
      });
      return;
    }

    const imageIndex = pageImages.findIndex(
      (img: any) => img.id === imageId || img._id === imageId
    );

    if (imageIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Page image not found',
      });
      return;
    }

    // Get the image URL before removing (for cleanup)
    const imageUrl = pageImages[imageIndex].url;

    // Remove from array
    pageImages.splice(imageIndex, 1);
    await Book.findByIdAndUpdate(id, { pageImages });

    // Try to delete the actual file (optional - don't fail if file doesn't exist)
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      const filename = imageUrl.replace('/uploads/', '');
      const filePath = path.join(process.env.UPLOAD_DIR || './uploads', filename);
      try {
        await fs.unlink(filePath);
      } catch (e) {
        console.log('Could not delete image file:', filePath);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Page image deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete page image error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete page image',
    });
  }
};

/**
 * Get all page images for a book
 * GET /api/books/:id/page-images
 */
export const getPageImages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    // Validate UUID
    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Owner OR collaborator can read page images
    if (!canEditBook(book, req.user.id)) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to access this book',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        images: book.pageImages || [],
      },
    });
  } catch (error: any) {
    console.error('Get page images error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get page images',
    });
  }
};

/**
 * Update page images in batch (for auto-save)
 * PUT /api/books/:id/page-images
 */
export const updatePageImages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;
    const { images } = req.body;

    // Validate UUID
    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (!canEditBook(book, req.user.id)) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to update this book',
      });
      return;
    }

    // Update page images (only update positions, not add new ones)
    const pageImages = book.pageImages || [];
    if (Array.isArray(images) && pageImages.length > 0) {
      images.forEach((update: any) => {
        const updateId = update._id || update.id;
        if (updateId) {
          const existingIndex = pageImages.findIndex(
            (img: any) => img.id === updateId || img._id === updateId
          );
          if (existingIndex !== -1) {
            if (update.pageIndex !== undefined) pageImages[existingIndex].pageIndex = update.pageIndex;
            if (update.x !== undefined) pageImages[existingIndex].x = update.x;
            if (update.y !== undefined) pageImages[existingIndex].y = update.y;
            if (update.width !== undefined) pageImages[existingIndex].width = update.width;
            if (update.height !== undefined) pageImages[existingIndex].height = update.height;
            if (update.rotation !== undefined) pageImages[existingIndex].rotation = update.rotation;
          }
        }
      });
    }

    await Book.findByIdAndUpdate(id, { pageImages });

    res.status(200).json({
      success: true,
      message: 'Page images updated successfully',
      data: {
        images: pageImages,
      },
    });
  } catch (error: any) {
    console.error('Update page images error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update page images',
    });
  }
};

/**
 * Track book share
 * POST /api/books/:id/share
 */
export const shareBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;
    const { platform } = req.body; // 'whatsapp', 'twitter', 'facebook', 'copy', 'native'

    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    const book = await Book.findByIdLite(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Increment share count
    const newShares = (book.statistics.shares || 0) + 1;
    const updatedStatistics = {
      ...book.statistics,
      shares: newShares,
    };

    await Book.findByIdAndUpdate(id, { statistics: updatedStatistics });

    // Send notification to author (async, don't wait)
    notifyBookShare(id, req.user!.id, book.author, platform).catch((err) =>
      console.error('Failed to send share notification:', err)
    );

    // Generate share URL
    const shareUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/read/${id}`;

    res.status(200).json({
      success: true,
      message: 'Share tracked successfully',
      data: {
        shares: newShares,
        shareUrl,
        platform: platform || 'unknown',
      },
    });
  } catch (error) {
    console.error('Share book error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track share',
    });
  }
};

/**
 * Get book social stats (likes, shares, comments)
 * GET /api/books/:id/social-stats
 */
export const getBookSocialStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    const book = await Book.findByIdLite(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        likes: book.likes,
        shares: book.statistics.shares || 0,
        comments: book.statistics.totalReviews,
        averageRating: book.statistics.averageRating,
      },
    });
  } catch (error) {
    console.error('Get social stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get social stats',
    });
  }
};

/**
 * Add a mention (tag) to a book
 * POST /api/books/:id/mention
 */
export const addMention = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;
    const { userId } = req.body;

    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    if (!userId || !isValidUUID(userId)) {
      res.status(400).json({
        success: false,
        error: 'Valid user ID is required',
      });
      return;
    }

    const book = await Book.findByIdLite(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Only book author can add mentions
    if (book.author !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Only the book author can add mentions',
      });
      return;
    }

    // Get the user to mention
    const userToMention = await User.findById(userId);
    if (!userToMention) {
      res.status(404).json({
        success: false,
        error: 'User to mention not found',
      });
      return;
    }

    // Check if already mentioned
    const mentions = book.mentions || [];
    if (mentions.some((m) => m.userId === userId)) {
      res.status(400).json({
        success: false,
        error: 'User is already mentioned in this book',
      });
      return;
    }

    // Add the mention
    const newMention = {
      userId: userToMention.id,
      userName: userToMention.name,
      userAvatar: userToMention.profile?.avatar || undefined,
      addedAt: new Date().toISOString(),
    };

    const updatedMentions = [...mentions, newMention];

    await Book.findByIdAndUpdate(id, {
      mentions: updatedMentions,
    });

    res.status(201).json({
      success: true,
      message: 'User mentioned successfully',
      data: {
        mention: newMention,
        totalMentions: updatedMentions.length,
      },
    });
  } catch (error) {
    console.error('Add mention error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add mention',
    });
  }
};

/**
 * Remove a mention from a book
 * DELETE /api/books/:id/mention/:userId
 */
export const removeMention = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id, userId } = req.params;

    if (!isValidUUID(id) || !isValidUUID(userId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid ID format',
      });
      return;
    }

    const book = await Book.findByIdLite(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Only book author can remove mentions
    if (book.author !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Only the book author can remove mentions',
      });
      return;
    }

    const mentions = book.mentions || [];
    const mentionIndex = mentions.findIndex((m) => m.userId === userId);

    if (mentionIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Mention not found',
      });
      return;
    }

    mentions.splice(mentionIndex, 1);

    await Book.findByIdAndUpdate(id, {
      mentions,
    });

    res.status(200).json({
      success: true,
      message: 'Mention removed successfully',
      data: {
        totalMentions: mentions.length,
      },
    });
  } catch (error) {
    console.error('Remove mention error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove mention',
    });
  }
};

/**
 * Get mentions for a book
 * GET /api/books/:id/mentions
 */
export const getBookMentions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    const book = await Book.findByIdLite(id);
    if (!book) {
      res.status(404).json({ success: false, error: 'Book not found' });
      return;
    }

    // Return empty mentions array - feature not yet implemented
    res.json({ success: true, data: { mentions: [], total: 0 } });
  } catch (error) {
    console.error('Error getting book mentions:', error);
    res.status(500).json({ success: false, error: 'Failed to get mentions' });
  }
};
