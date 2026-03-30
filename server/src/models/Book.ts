import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();

// Chapter Audio interface - supports both languages and both genders
export interface IAudioTrack {
  url: string;
  duration: number;
  voice: string;
  language: 'en' | 'he';
  generatedAt: string;
}

export interface IChapterAudio {
  // English voices
  maleVoiceEn?: IAudioTrack;
  femaleVoiceEn?: IAudioTrack;
  // Hebrew voices
  maleVoiceHe?: IAudioTrack;
  femaleVoiceHe?: IAudioTrack;
  // Legacy fields for backwards compatibility
  maleVoice?: IAudioTrack;
  femaleVoice?: IAudioTrack;
}

// Chapter interface
export interface IChapter {
  _id?: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  audio?: IChapterAudio;
  createdAt?: string;
  updatedAt?: string;
}

// Character interface
export interface ICharacter {
  _id?: string;
  name: string;
  age?: number;
  description: string;
  traits: string[];
  backstory?: string;
  goals?: string;
  motivations?: string;
  relationships?: Array<{
    characterId: string;
    characterName: string;
    relationship: string;
  }>;
  arc?: string;
  notes?: string;
}

// Quality Score Category interface
export interface IQualityCategory {
  score: number;
  weight: number;
  feedback?: string;
  examples?: string[];
}

// Quality Score interface
export interface IQualityScore {
  overallScore: number;
  rating: number;
  ratingLabel: 'Masterpiece' | 'Excellent' | 'Good' | 'Fair' | 'Needs Work';
  categories: {
    writingQuality: IQualityCategory;
    plotStructure: IQualityCategory;
    characterDevelopment: IQualityCategory;
    dialogue: IQualityCategory;
    setting: IQualityCategory;
    originality: IQualityCategory;
  };
  detailedFeedback?: string;
  suggestions?: string[];
  evaluatedAt: string;
  evaluatedBy: 'ai' | 'admin';
}

// Cover Design interface
export interface ICoverDesign {
  front?: {
    type: 'ai-generated' | 'uploaded' | 'gradient' | 'solid';
    imageUrl?: string;
    backgroundColor?: string;
    gradientColors?: string[];
    title: {
      text: string;
      font: string;
      size: number;
      color: string;
      position: { x: number; y: number };
    };
    subtitle?: {
      text: string;
      font: string;
      size: number;
      color: string;
    };
    authorName: {
      text: string;
      font: string;
      size: number;
      color: string;
    };
  };
  back?: {
    imageUrl?: string;
    backgroundColor?: string;
    synopsis: string;
    authorBio?: string;
    authorPhoto?: string;
    barcodeArea?: {
      isbn?: string;
      position: { x: number; y: number };
    };
  };
  spine?: {
    width: number;
    title: string;
    author: string;
    backgroundColor?: string;
  };
}

// Page Image interface
export interface IPageImage {
  _id?: string;
  pageIndex: number;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isAiGenerated: boolean;
  prompt?: string;
  createdAt: string;
}

// Page content interface
export interface IPageContent {
  id: string;
  type: 'cover' | 'content' | 'chapter-start' | 'toc' | 'back-cover' | 'blank' | 'title' | 'chapter' | 'summary';
  chapterIndex?: number;
  chapterTitle?: string;
  content?: string;
  pageNumber?: number;
  images?: Array<{
    id: string;
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  }>;
}

// Page Layout interface
export interface IPageLayout {
  bodyFont: string;
  fontSize: number;
  lineHeight: number;
  pageSize: 'A4' | 'A5' | 'Letter' | 'Custom';
  customPageSize?: { width: number; height: number };
  margins: { top: number; bottom: number; left: number; right: number };
  includeTableOfContents: boolean;
  tableOfContentsStyle?: string;
  headerFooter?: {
    includeHeader: boolean;
    includeFooter: boolean;
    includePageNumbers: boolean;
    pageNumberPosition: 'top' | 'bottom' | 'none';
  };
  textColor?: string;
  titleFont?: string;
  headerFont?: string;
  accentColor?: string;
  backgroundColor?: string;
  columns?: 1 | 2 | 3 | 4;
  paragraphIndent?: number;
  paragraphSpacing?: number;
  pageNumberPosition?: string;
  templateId?: string;
  pages?: IPageContent[];
  settings?: Record<string, any>;
}

// Publishing Status interface
export interface IPublishingStatus {
  status: 'draft' | 'published' | 'unpublished';
  publishedAt?: string;
  unpublishedAt?: string;
  price: number;
  priceILS?: number;
  isFree: boolean;
  isPublic: boolean;
  marketingStrategy?: {
    targetAudience?: string;
    description?: string;
    categories?: string[];
    tags?: string[];
    launchDate?: string;
  };
}

// Statistics interface
export interface IStatistics {
  wordCount: number;
  pageCount: number;
  chapterCount: number;
  characterCount: number;
  views: number;
  purchases: number;
  revenue: number;
  averageRating?: number;
  totalReviews: number;
  completionRate?: number;
  readingTime?: number;
  shares: number;
  comments: number;
}

// Voice Interview interfaces
export interface IVoiceInterviewCharacter {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  traits: string[];
  description: string;
}

export interface IVoiceInterviewSummary {
  theme: {
    mainTheme: string;
    subThemes: string[];
    tone: string;
    genre: string;
  };
  characters: IVoiceInterviewCharacter[];
  plot: {
    premise: string;
    conflict: string;
    stakes: string;
    keyEvents: string[];
  };
  setting: {
    world: string;
    timePeriod: string;
    atmosphere: string;
    locations: string[];
  };
  writingGuidelines: string[];
}

export interface IVoiceInterviewResponse {
  topic: string;
  question: string;
  answer: string;
}

export interface IVoiceInterview {
  completedAt: string;
  duration: number;
  responses: IVoiceInterviewResponse[];
  summary: IVoiceInterviewSummary;
}

// Story Context interface
export interface IStoryContext {
  theme?: string;
  characters?: string;
  conflict?: string;
  climax?: string;
  resolution?: string;
  setting?: string;
  keyPoints?: string;
  narrativeArc?: string;
  completedAt?: string;
  voiceInterview?: IVoiceInterview;
}

// AI Design State interface
export interface IAIDesignState {
  status: 'idle' | 'analyzing' | 'generating-design' | 'generating-images' | 'completed' | 'error';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  progress?: {
    currentStep: number;
    totalSteps: number;
    stepName: string;
  };
  design?: {
    typography?: any;
    layout?: any;
    covers?: any;
    imagePlacements?: any[];
    reasoning?: string;
    moodDescription?: string;
  };
}

// Plot Structure interface
export interface IPlotStructure {
  threeActStructure?: {
    act1: string;
    act2: string;
    act3: string;
  };
  plotPoints?: {
    incitingIncident?: string;
    firstPlotPoint?: string;
    midpoint?: string;
    secondPlotPoint?: string;
    climax?: string;
  };
  subplots?: Array<{
    title: string;
    description: string;
    status: 'planned' | 'in-progress' | 'completed';
  }>;
  timeline?: Array<{
    event: string;
    chapter?: number;
    date?: string;
  }>;
}

// Review interface
export interface IReview {
  _id?: string;
  user: string;
  userName?: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

// Translated chapter interface
export interface ITranslatedChapter {
  _id: string;
  title: string;
  content: string;
  order: number;
}

// Translation storage interface
export interface IBookTranslations {
  // Store pre-generated translations
  english?: {
    title: string;
    chapters: ITranslatedChapter[];
    generatedAt: string;
  };
  hebrew?: {
    title: string;
    chapters: ITranslatedChapter[];
    generatedAt: string;
  };
}

// Book interface
export interface IBook {
  id: string;
  _id?: string;
  title: string;
  author: string;
  genre: string;
  writingGoal?: 'short-story' | 'novella' | 'novel';
  targetAudience?: 'children' | 'young-adult' | 'adult' | 'all-ages';
  description?: string;
  synopsis?: string;
  storyContext?: IStoryContext;
  chapters: IChapter[];
  characters: ICharacter[];
  plotStructure?: IPlotStructure;
  qualityScore?: IQualityScore;
  coverDesign?: ICoverDesign;
  pageLayout?: IPageLayout;
  pageImages?: IPageImage[];
  templateId?: string;
  aiDesignState?: IAIDesignState;
  publishingStatus: IPublishingStatus;
  statistics: IStatistics;
  tags?: string[];
  language: string;
  translations?: IBookTranslations;
  ageRating?: 'G' | 'PG' | 'PG-13' | 'R' | '18+';
  likes: number;
  likedBy: string[];
  reviews: IReview[];
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
}

// Database row type
interface BookRow {
  id: string;
  title: string;
  author_id: string;
  genre: string;
  writing_goal: string | null;
  target_audience: string | null;
  description: string | null;
  synopsis: string | null;
  story_context: IStoryContext | null;
  chapters: IChapter[];
  characters: ICharacter[];
  plot_structure: IPlotStructure | null;
  quality_score: IQualityScore | null;
  cover_design: ICoverDesign | null;
  page_layout: IPageLayout | null;
  page_images: IPageImage[];
  ai_design_state: IAIDesignState | null;
  publishing_status: IPublishingStatus;
  statistics: IStatistics;
  tags: string[];
  language: string;
  translations: IBookTranslations | null;
  age_rating: string | null;
  likes: number;
  liked_by: string[];
  reviews: IReview[];
  created_at: string;
  updated_at: string;
}

// Transform database row to IBook
function rowToBook(row: BookRow): IBook {
  return {
    id: row.id,
    _id: row.id,
    title: row.title,
    author: row.author_id,
    genre: row.genre,
    writingGoal: row.writing_goal as IBook['writingGoal'],
    targetAudience: row.target_audience as IBook['targetAudience'],
    description: row.description || undefined,
    synopsis: row.synopsis || undefined,
    storyContext: row.story_context || undefined,
    chapters: row.chapters || [],
    characters: row.characters || [],
    plotStructure: row.plot_structure || undefined,
    qualityScore: row.quality_score || undefined,
    coverDesign: row.cover_design || undefined,
    pageLayout: row.page_layout || undefined,
    pageImages: row.page_images || [],
    aiDesignState: row.ai_design_state || undefined,
    publishingStatus: row.publishing_status || { status: 'draft', price: 0, isFree: true, isPublic: false },
    statistics: row.statistics || { wordCount: 0, pageCount: 0, chapterCount: 0, characterCount: 0, views: 0, purchases: 0, revenue: 0, totalReviews: 0, shares: 0, comments: 0 },
    tags: row.tags || [],
    language: row.language || 'en',
    translations: row.translations || undefined,
    ageRating: row.age_rating as IBook['ageRating'],
    likes: row.likes || 0,
    likedBy: row.liked_by || [],
    reviews: row.reviews || [],
    created_at: row.created_at,
    updated_at: row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Book Model class for Supabase operations
export class Book {
  // Find book by ID
  static async findById(id: string): Promise<IBook | null> {
    const { data, error } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return rowToBook(data as BookRow);
  }

  // Find one book by query
  static async findOne(query: Record<string, any>): Promise<IBook | null> {
    let queryBuilder = supabaseAdmin.from('books').select('*');

    if (query._id || query.id) {
      queryBuilder = queryBuilder.eq('id', query._id || query.id);
    }
    if (query.author) {
      queryBuilder = queryBuilder.eq('author_id', query.author);
    }
    if (query.title) {
      queryBuilder = queryBuilder.eq('title', query.title);
    }

    const { data, error } = await queryBuilder.limit(1).single();

    if (error || !data) return null;
    return rowToBook(data as BookRow);
  }

  // Create new book
  static async create(bookData: Partial<IBook>): Promise<IBook> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const insertData = {
      id,
      title: bookData.title,
      author_id: bookData.author,
      genre: bookData.genre || 'General',
      writing_goal: bookData.writingGoal || null,
      target_audience: bookData.targetAudience || null,
      description: bookData.description || null,
      synopsis: bookData.synopsis || null,
      story_context: bookData.storyContext || null,
      chapters: bookData.chapters || [],
      characters: bookData.characters || [],
      plot_structure: bookData.plotStructure || null,
      quality_score: bookData.qualityScore || null,
      cover_design: bookData.coverDesign || null,
      page_layout: bookData.pageLayout || null,
      page_images: bookData.pageImages || [],
      ai_design_state: bookData.aiDesignState || null,
      publishing_status: bookData.publishingStatus || { status: 'draft', price: 0, isFree: true, isPublic: false },
      statistics: bookData.statistics || { wordCount: 0, pageCount: 0, chapterCount: 0, characterCount: 0, views: 0, purchases: 0, revenue: 0, totalReviews: 0, shares: 0, comments: 0 },
      tags: bookData.tags || [],
      language: bookData.language || 'en',
      age_rating: bookData.ageRating || null,
      likes: bookData.likes || 0,
      liked_by: bookData.likedBy || [],
      reviews: bookData.reviews || [],
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from('books')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating book:', error);
      throw new Error(error.message);
    }

    return rowToBook(data as BookRow);
  }

  // Update book by ID
  static async findByIdAndUpdate(
    id: string,
    update: Partial<IBook> | { $set?: Partial<any>; $push?: any; $pull?: any; $inc?: any },
    options?: { new?: boolean }
  ): Promise<IBook | null> {
    let updateData: Record<string, any> = {};

    // Handle $set operator
    if ('$set' in update && update.$set) {
      const setData = update.$set;
      Object.entries(setData).forEach(([key, value]) => {
        const snakeKey = camelToSnake(key);
        updateData[snakeKey] = value;
      });
    } else if ('$push' in update || '$pull' in update || '$inc' in update) {
      // Handle array operations - need to fetch current data first
      const currentBook = await this.findById(id);
      if (!currentBook) return null;

      if (update.$push) {
        Object.entries(update.$push).forEach(([key, value]) => {
          const currentArray = (currentBook as any)[key] || [];
          updateData[camelToSnake(key)] = [...currentArray, value];
        });
      }

      if (update.$pull) {
        Object.entries(update.$pull).forEach(([key, condition]) => {
          const currentArray = (currentBook as any)[key] || [];
          // Simple filter - remove items matching condition
          updateData[camelToSnake(key)] = currentArray.filter((item: any) => {
            return !Object.entries(condition).every(([k, v]) => item[k] === v);
          });
        });
      }

      if (update.$inc) {
        Object.entries(update.$inc).forEach(([key, value]) => {
          // Handle nested keys like 'statistics.views'
          if (key.includes('.')) {
            const [parent, child] = key.split('.');
            const parentData = (currentBook as any)[parent] || {};
            parentData[child] = (parentData[child] || 0) + (value as number);
            updateData[camelToSnake(parent)] = parentData;
          } else {
            updateData[camelToSnake(key)] = ((currentBook as any)[key] || 0) + (value as number);
          }
        });
      }
    } else {
      // Direct update
      Object.entries(update).forEach(([key, value]) => {
        if (key !== 'id' && key !== '_id') {
          updateData[camelToSnake(key)] = value;
        }
      });
    }

    updateData.updated_at = new Date().toISOString();

    // Remove id fields
    delete updateData.id;
    delete updateData._id;

    const { data, error } = await supabaseAdmin
      .from('books')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating book:', error);
      return null;
    }

    return rowToBook(data as BookRow);
  }

  // Delete book by ID
  static async findByIdAndDelete(id: string): Promise<IBook | null> {
    const book = await this.findById(id);
    if (!book) return null;

    const { error } = await supabaseAdmin
      .from('books')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting book:', error);
      return null;
    }

    return book;
  }

  // Find multiple books
  static async find(query: Record<string, any> = {}): Promise<IBook[]> {
    let queryBuilder = supabaseAdmin.from('books').select('*');

    if (query.author) {
      queryBuilder = queryBuilder.eq('author_id', query.author);
    }
    if (query.genre) {
      queryBuilder = queryBuilder.eq('genre', query.genre);
    }

    // Handle JSONB queries for publishingStatus
    if (query['publishingStatus.status']) {
      queryBuilder = queryBuilder.filter('publishing_status->>status', 'eq', query['publishingStatus.status']);
    }
    if (query['publishingStatus.isPublic'] !== undefined) {
      queryBuilder = queryBuilder.filter('publishing_status->>isPublic', 'eq', String(query['publishingStatus.isPublic']));
    }

    // Handle search (text search on title and description)
    if (query.$or && Array.isArray(query.$or)) {
      // Extract search term from $or query
      const searchQuery = query.$or.find((q: any) => q.title?.$regex);
      if (searchQuery) {
        const searchTerm = searchQuery.title.$regex;
        queryBuilder = queryBuilder.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
    }

    // Handle sorting
    if (query._sort) {
      const sortField = camelToSnake(query._sort);
      queryBuilder = queryBuilder.order(sortField, { ascending: query._order !== 'desc' });
    } else {
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
    }

    // Handle pagination
    if (query._limit) {
      queryBuilder = queryBuilder.limit(query._limit);
    }
    if (query._skip) {
      queryBuilder = queryBuilder.range(query._skip, query._skip + (query._limit || 10) - 1);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error finding books:', error);
      return [];
    }

    return (data || []).map(row => rowToBook(row as BookRow));
  }

  // Count books
  static async countDocuments(query: Record<string, any> = {}): Promise<number> {
    let queryBuilder = supabaseAdmin
      .from('books')
      .select('id', { count: 'exact', head: true });

    if (query.author) {
      queryBuilder = queryBuilder.eq('author_id', query.author);
    }
    if (query['publishingStatus.status']) {
      queryBuilder = queryBuilder.filter('publishing_status->>status', 'eq', query['publishingStatus.status']);
    }

    const { count, error } = await queryBuilder;

    if (error) {
      console.error('Error counting books:', error);
      return 0;
    }

    return count || 0;
  }

  // Populate author data
  static async populate(book: IBook, field: string): Promise<IBook & { author: any }> {
    if (field === 'author') {
      const { data } = await supabaseAdmin
        .from('users')
        .select('id, name, email, profile')
        .eq('id', book.author)
        .single();

      return {
        ...book,
        author: data || { id: book.author, name: 'Unknown' },
      } as IBook & { author: any };
    }
    return book as IBook & { author: any };
  }

  // Update statistics helper
  static calculateStatistics(book: Partial<IBook>): Partial<IStatistics> {
    const chapters = book.chapters || [];
    const characters = book.characters || [];

    const wordCount = chapters.reduce((total, chapter) => total + (chapter.wordCount || 0), 0);
    let pageCount = Math.ceil(wordCount / 250);

    // Ensure page count is divisible by 4 for binding
    const remainder = pageCount % 4;
    if (remainder !== 0) {
      pageCount += 4 - remainder;
    }

    return {
      chapterCount: chapters.length,
      characterCount: characters.length,
      wordCount,
      pageCount,
      readingTime: Math.ceil(wordCount / 250),
    };
  }

  // Virtual getters
  static isPublished(book: IBook): boolean {
    return book.publishingStatus.status === 'published' && book.publishingStatus.isPublic;
  }

  static formattedPrice(book: IBook): string {
    return book.publishingStatus.isFree ? 'Free' : `$${book.publishingStatus.price}`;
  }
}

// Helper to convert camelCase to snake_case
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export default Book;
