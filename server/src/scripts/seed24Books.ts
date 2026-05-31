import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';
import { authors, books, img, AuthorDef, BookDef, ChapterDef } from './seed24Data';

const uuidv4 = () => crypto.randomUUID();

// =================== HTML CHAPTER BUILDER ===================
function buildChapterHTML(chapter: ChapterDef): { html: string; wordCount: number } {
  const parts: string[] = [`<h2 class="chapter-title">${chapter.title}</h2>`];
  let wordCount = 0;
  for (const p of chapter.paras) {
    if (p.img) {
      parts.push(
        `<figure style="margin: 28px 0; text-align: center;">` +
        `<img src="${p.img}" alt="${p.caption || ''}" style="max-width: 100%; width: 720px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.15);" />` +
        (p.caption ? `<figcaption style="font-style: italic; color: #6b7280; margin-top: 10px; font-size: 0.95em;">${p.caption}</figcaption>` : '') +
        `</figure>`
      );
    }
    parts.push(`<p>${p.text}</p>`);
    wordCount += p.text.trim().split(/\s+/).length;
  }
  return { html: parts.join('\n'), wordCount };
}

function buildChapter(chapter: ChapterDef, order: number) {
  const { html, wordCount } = buildChapterHTML(chapter);
  return {
    _id: uuidv4(),
    title: chapter.title,
    order,
    wordCount,
    content: html
  };
}

function buildCoverDesign(book: BookDef, authorName: string) {
  return {
    front: {
      type: 'uploaded',
      imageUrl: img(book.coverImageSeed, 800, 1200),
      gradientColors: book.coverColors,
      backgroundColor: book.coverColors[0],
      title: {
        text: book.title,
        font: 'Heebo',
        size: 42,
        color: '#FFFFFF',
        position: { x: 50, y: 28 }
      },
      authorName: {
        text: authorName,
        font: 'Heebo',
        size: 18,
        color: '#FFFFFF',
        position: { x: 50, y: 88 }
      }
    },
    back: {
      type: 'uploaded',
      imageUrl: img(`${book.coverImageSeed}_back`, 800, 1200),
      backgroundColor: book.coverColors[book.coverColors.length - 1],
      synopsis: book.synopsis.substring(0, 280)
    },
    spine: {
      width: 30,
      backgroundColor: book.coverColors[1] || book.coverColors[0],
      title: { text: book.title, font: 'Heebo', size: 14, color: '#FFFFFF' },
      author: { text: authorName, font: 'Heebo', size: 11, color: '#FFFFFF' }
    }
  };
}

function buildQualityScore(score: number) {
  return {
    overallScore: score,
    rating: 5,
    ratingLabel: 'Excellent',
    categories: {
      writingQuality: { score, weight: 25 },
      plotStructure: { score: Math.max(60, score - 2), weight: 20 },
      characterDevelopment: { score: Math.max(60, score - 1), weight: 20 },
      dialogue: { score, weight: 15 },
      setting: { score: Math.max(60, score - 1), weight: 10 },
      originality: { score, weight: 10 }
    },
    evaluatedAt: new Date().toISOString(),
    evaluatedBy: 'ai'
  };
}

function buildStatistics(book: BookDef, totalWordCount: number, chapterCount: number, characterCount: number) {
  const pageCount = Math.max(8, Math.ceil(totalWordCount / 250));
  return {
    wordCount: totalWordCount,
    pageCount,
    chapterCount,
    characterCount,
    views: book.baseViews,
    purchases: 0,
    revenue: 0,
    averageRating: book.reviews.reduce((s, r) => s + r.rating, 0) / book.reviews.length,
    totalReviews: book.reviews.length,
    shares: Math.floor(book.baseViews / 30),
    comments: Math.floor(book.baseViews / 50)
  };
}

function buildReviews(book: BookDef) {
  const now = Date.now();
  return book.reviews.map((r, i) => ({
    _id: uuidv4(),
    user: uuidv4(),
    userName: r.name,
    rating: r.rating,
    comment: r.comment,
    createdAt: new Date(now - (i + 1) * 7 * 86400000).toISOString()
  }));
}

function buildCharacters(chars: BookDef['characters']) {
  return chars.map(c => ({
    _id: uuidv4(),
    name: c.name,
    age: c.age,
    description: c.description,
    traits: c.traits,
    backstory: ''
  }));
}

// =================== AUTHOR UPSERT ===================
async function upsertAuthor(a: AuthorDef): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', a.email)
    .single();

  if (existing) {
    await supabaseAdmin
      .from('users')
      .update({
        name: a.name,
        profile: {
          bio: a.bio,
          avatar: img(a.avatarSeed, 400, 400),
          language: 'he',
          authorProfile: {
            publishedBooks: a.publishedBooks,
            totalSales: 0,
            rating: a.rating,
            followers: []
          }
        }
      })
      .eq('id', existing.id);
    return existing.id;
  }

  const id = uuidv4();
  const { error } = await supabaseAdmin
    .from('users')
    .insert({
      id,
      name: a.name,
      email: a.email,
      password: '$2a$10$dummyhashnotusedforlogin',
      role: 'FREE',
      credits: 100,
      profile: {
        bio: a.bio,
        avatar: img(a.avatarSeed, 400, 400),
        language: 'he',
        authorProfile: {
          publishedBooks: a.publishedBooks,
          totalSales: 0,
          rating: a.rating,
          followers: []
        }
      }
    });

  if (error) {
    console.error(`  Failed to create author ${a.name}:`, error.message);
    throw error;
  }
  return id;
}

// =================== BOOK INSERT ===================
async function insertBook(book: BookDef, authorId: string, authorName: string): Promise<string> {
  const chapters = book.chapters.map((c, i) => buildChapter(c, i + 1));
  const totalWordCount = chapters.reduce((s, c) => s + c.wordCount, 0);

  const bookId = uuidv4();
  const now = new Date().toISOString();

  // Idempotent: delete any existing book with same title from same author
  const { data: existing } = await supabaseAdmin
    .from('books')
    .select('id')
    .eq('title', book.title)
    .eq('author_id', authorId);
  if (existing && existing.length > 0) {
    await supabaseAdmin.from('books').delete().in('id', existing.map(b => b.id));
  }

  const { error } = await supabaseAdmin
    .from('books')
    .insert({
      id: bookId,
      title: book.title,
      author_id: authorId,
      genre: book.genre,
      writing_goal: 'novella',
      target_audience: 'adult',
      description: book.description,
      synopsis: book.synopsis,
      chapters,
      characters: buildCharacters(book.characters),
      cover_design: buildCoverDesign(book, authorName),
      publishing_status: {
        status: 'published',
        publishedAt: now,
        price: 0,
        priceILS: 0,
        isFree: true,
        isPublic: true,
        marketingStrategy: {
          targetAudience: 'all',
          description: book.description,
          categories: [book.genre],
          tags: book.tags
        }
      },
      statistics: buildStatistics(book, totalWordCount, chapters.length, book.characters.length),
      quality_score: buildQualityScore(book.qualityScore),
      reviews: buildReviews(book),
      tags: book.tags,
      language: 'he',
      age_rating: book.ageRating,
      likes: book.baseLikes,
      liked_by: [],
      created_at: now,
      updated_at: now
    });

  if (error) {
    console.error(`  Failed to insert book "${book.title}":`, error.message);
    throw error;
  }
  return bookId;
}

// =================== MAIN ===================
async function seed() {
  console.log('========================================');
  console.log('Seeding 24 books with 24 authors');
  console.log('========================================\n');

  console.log('Step 1: Upserting authors...');
  const authorIds: Record<string, string> = {};
  const authorNames: Record<string, string> = {};
  for (const a of authors) {
    try {
      const id = await upsertAuthor(a);
      authorIds[a.key] = id;
      authorNames[a.key] = a.name;
      console.log(`  ok  ${a.name}`);
    } catch (e: any) {
      console.log(`  ERR ${a.name}: ${e.message}`);
    }
  }
  console.log(`Done: ${Object.keys(authorIds).length}/${authors.length} authors ready.\n`);

  console.log('Step 2: Inserting books...');
  let inserted = 0;
  let failed = 0;
  for (const b of books) {
    const authorId = authorIds[b.authorKey];
    const authorName = authorNames[b.authorKey];
    if (!authorId) {
      console.error(`  ERR author "${b.authorKey}" missing for "${b.title}"`);
      failed++;
      continue;
    }
    try {
      const bookId = await insertBook(b, authorId, authorName);
      console.log(`  ok  ${b.title}  by  ${authorName}  [${bookId.substring(0, 8)}]`);
      inserted++;
    } catch (e: any) {
      console.error(`  ERR ${b.title}: ${e.message}`);
      failed++;
    }
  }

  console.log('\n========================================');
  console.log(`Inserted: ${inserted} | Failed: ${failed}`);
  console.log('========================================');
}

seed()
  .then(() => process.exit(0))
  .catch(e => { console.error('Fatal:', e); process.exit(1); });
