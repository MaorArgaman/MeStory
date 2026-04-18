import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();

// Helper function to convert camelCase to snake_case
const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

// SECURITY: Whitelist of allowed sort fields to prevent SQL injection via ORDER BY.
// Any field not in this list will be rejected and fall back to 'created_at'.
const ALLOWED_SORT_FIELDS = new Set([
  'created_at',
  'updated_at',
  'title',
  'genre',
  'quality_score',
  'word_count',
  'reading_time',
  'views',
  'likes_count',
  'purchase_count',
  'rating',
  'published_at',
]);

function safeSortField(userInput: string | undefined, fallback = 'created_at'): string {
  if (!userInput || typeof userInput !== 'string') return fallback;
  const snake = userInput.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  return ALLOWED_SORT_FIELDS.has(snake) ? snake : fallback;
}

// SECURITY: Escape PostgREST/ILIKE wildcards and special characters from user input
// to prevent pattern injection and unintended matches.
function escapeLikePattern(str: string): string {
  if (typeof str !== 'string') return '';
  // Escape: backslash, %, _, comma (PostgREST separator), parentheses
  return str
    .replace(/\\/g, '\\\\')
    .replace(/[%_]/g, '\\$&')
    .replace(/[,()]/g, '')
    .slice(0, 100); // Length cap to prevent ReDoS
}

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

// Mention interface - for tagging users in books
export interface IMention {
  userId: string;
  userName: string;
  userAvatar?: string;
  addedAt: string;
}

// ===== COLLABORATIVE BOOK INTERFACES =====

// Collaborator role and status
export type CollaboratorRole = 'editor' | 'commenter' | 'viewer';
export type CollaboratorStatus = 'pending' | 'active' | 'completed' | 'declined';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

// Collaborator interface - someone contributing to a memorial book
export interface ICollaborator {
  id: string;
  userId?: string;  // Set when they accept and have an account
  email: string;
  name: string;
  role: CollaboratorRole;
  relationship: string;  // "אח", "חבר", "מפקד", etc.
  assignedChapters: string[];  // Chapter IDs they can edit
  contributedChapters: string[];  // Chapters they wrote
  status: CollaboratorStatus;
  joinedAt?: string;
  completedAt?: string;
  invitedAt: string;
  invitedBy: string;  // User ID of who invited them
}

// Invitation to join a collaborative book
export interface IBookInvitation {
  id: string;
  email: string;
  name: string;
  relationship: string;
  personalMessage?: string;
  role?: CollaboratorRole; // Role to assign when accepted (default: 'editor')
  token: string;  // Unique token for invitation link
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  respondedAt?: string;
}

// Memorial book dedication - who the book is for
export interface IMemorialDedication {
  name: string;  // Name of the person being memorialized
  relationship: string;  // Creator's relationship to them
  birthDate?: string;
  passingDate?: string;
  photoUrl?: string;
  shortBio?: string;
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
  targetAudience?: 'children' | 'young-adult' | 'adult' | 'all-ages' | 'family' | 'friends' | 'community' | 'public';
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
  mentions?: IMention[];

  // ===== COLLABORATIVE BOOK FIELDS =====
  isCollaborative?: boolean;
  collaborators?: ICollaborator[];
  invitations?: IBookInvitation[];
  memorialDedication?: IMemorialDedication;
  bookType?: 'personal' | 'collaborative' | 'memorial';

  // Convenience aliases used in some controllers
  status?: string;
  coverImage?: string;

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
  mentions: IMention[];
  // Collaborative book fields
  is_collaborative: boolean | null;
  collaborators: ICollaborator[] | null;
  invitations: IBookInvitation[] | null;
  memorial_dedication: IMemorialDedication | null;
  book_type: string | null;
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
    mentions: row.mentions || [],
    // Collaborative book fields
    isCollaborative: row.is_collaborative || false,
    collaborators: row.collaborators || [],
    invitations: row.invitations || [],
    memorialDedication: row.memorial_dedication || undefined,
    bookType: row.book_type as IBook['bookType'] || 'personal',
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
      language: bookData.language || 'he',  // Default to Hebrew for memorial books
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
    update: Partial<IBook> | { $set?: Partial<any>; $push?: any; $pull?: any; $inc?: any } | Record<string, any>,
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
    // PERF: `_lightweight: true` fetches only columns needed for list views
    // (title, genre, cover, status, stats…) and skips the heavy JSONB columns
    // like chapters/pageImages/designState which can be megabytes per row.
    // Cuts /api/books from ~5s to <500ms for users with many books.
    const LIGHTWEIGHT_COLUMNS = [
      'id',
      'author_id',
      'title',
      'genre',
      'description',
      'language',
      'target_audience',
      'publishing_status',
      'statistics',
      'quality_score',
      'cover_design',
      'created_at',
      'updated_at',
    ].join(',');

    const selectColumns = query._lightweight ? LIGHTWEIGHT_COLUMNS : '*';
    let queryBuilder = supabaseAdmin.from('books').select(selectColumns);

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
    // SECURITY: Escape ILIKE wildcards and PostgREST special chars to prevent injection
    if (query.$or && Array.isArray(query.$or)) {
      const searchQuery = query.$or.find((q: any) => q.title?.$regex);
      if (searchQuery) {
        const safeTerm = escapeLikePattern(searchQuery.title.$regex);
        if (safeTerm) {
          queryBuilder = queryBuilder.or(`title.ilike.%${safeTerm}%,description.ilike.%${safeTerm}%`);
        }
      }
    }

    // Handle sorting
    // SECURITY: Validate sort field against whitelist to prevent ORDER BY injection
    if (query._sort) {
      const sortField = safeSortField(query._sort);
      queryBuilder = queryBuilder.order(sortField, { ascending: query._order !== 'desc' });
    }

    // PERF: hard cap to prevent pulling thousands of rows accidentally.
    // Callers that need more should paginate explicitly via _limit.
    const limit = typeof query._limit === 'number' ? Math.min(query._limit, 500) : 200;
    queryBuilder = queryBuilder.limit(limit);

    // Execute query
    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error finding books:', error);
      return [];
    }

    return (data || []).map((row: any) => rowToBook(row));
  }

  // PERF: Lightweight ownership check. Fetches only author_id — used by
  // routes that need to verify "does this user own this book?" without
  // pulling megabytes of chapters/pageImages/designState.
  static async getOwnerId(id: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('books')
      .select('author_id')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return (data as any).author_id;
  }

  /**
   * Lightweight permission check.
   * Returns { access, role } where:
   *   access = 'owner' | 'editor' | 'commenter' | 'viewer' | null
   *   role = the CollaboratorRole string if collaborator, or 'owner'
   * Fetches only author_id + collaborators (not the full book).
   */
  static async getUserAccess(
    bookId: string,
    userId: string
  ): Promise<'owner' | CollaboratorRole | null> {
    if (!bookId || !userId) return null;
    const { data, error } = await supabaseAdmin
      .from('books')
      .select('author_id, collaborators')
      .eq('id', bookId)
      .single();
    if (error || !data) return null;
    if ((data as any).author_id === userId) return 'owner';
    const collaborators = ((data as any).collaborators || []) as Array<{
      userId?: string;
      status?: string;
      role?: string;
    }>;
    const collab = collaborators.find(
      (c) => c.userId === userId && (c.status === 'active' || !c.status)
    );
    if (!collab) return null;
    // Map legacy 'contributor' role to 'editor'
    const role = collab.role === 'contributor' ? 'editor' : collab.role;
    return (role as CollaboratorRole) || 'viewer';
  }

  /**
   * Convenience: returns true if user can WRITE to this book (owner or editor).
   */
  static async canUserWrite(bookId: string, userId: string): Promise<boolean> {
    const access = await Book.getUserAccess(bookId, userId);
    return access === 'owner' || access === 'editor';
  }

  /**
   * Convenience: returns true if user can READ this book (any role).
   */
  static async canUserRead(bookId: string, userId: string): Promise<boolean> {
    return (await Book.getUserAccess(bookId, userId)) !== null;
  }

  // Find multiple books by IDs efficiently
  static async findByIds(ids: string[]): Promise<IBook[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    const { data, error } = await supabaseAdmin
      .from('books')
      .select('*')
      .in('id', ids);

    if (error) {
      console.error('Error finding books by IDs:', error);
      return [];
    }

    return (data || []).map((row: any) => rowToBook(row));
  }

  // Delete many books by query
  static async deleteMany(query: Record<string, any>): Promise<void> {
    let queryBuilder = supabaseAdmin.from('books').delete();
    if (query.author) {
      queryBuilder = queryBuilder.eq('author_id', query.author);
    }
    await queryBuilder;
  }

  // Count books
  static async countDocuments(query: Record<string, any> = {}): Promise<number> {
    let queryBuilder = supabaseAdmin
      .from('books')
      .select('id', { count: 'exact', head: true });

    if (query.authorId) {
      queryBuilder = (queryBuilder as any).eq('author_id', query.authorId);
    }
    if (query['publishingStatus.status']) {
      queryBuilder = (queryBuilder as any).eq('publishing_status->>status', query['publishingStatus.status']);
    }

    const { count, error } = await queryBuilder;
    if (error) return 0;
    return count || 0;
  }

  // Find books where user is a collaborator - efficient JSONB query
  static async findByCollaboratorId(userId: string): Promise<IBook[]> {
    if (!userId) return [];

    const { data, error } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('is_collaborative', true)
      .contains('collaborators', JSON.stringify([{ userId }]));

    if (error) {
      console.error('Error finding books by collaborator:', error);
      // Fallback: try broader search with filter
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('books')
        .select('*')
        .eq('is_collaborative', true);

      if (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return [];
      }

      // Filter in code as fallback
      return (fallbackData || [])
        .filter((row: any) => {
          const collaborators = row.collaborators || [];
          return collaborators.some((c: any) => c.userId === userId);
        })
        .map((row: any) => rowToBook(row));
    }

    return (data || []).map((row: any) => rowToBook(row));
  }

  // Find books with pending invitations for a specific email - efficient JSONB query
  static async findByPendingInvitationEmail(email: string): Promise<IBook[]> {
    if (!email) return [];

    // Note: Supabase JSONB @> (contains) works for exact object match
    // For email filter in array of objects, we need to use raw SQL or filter in code
    // For now, we'll use a more targeted query with limited results
    const { data, error } = await supabaseAdmin
      .from('books')
      .select('id, title, invitations, memorial_dedication')
      .not('invitations', 'is', null);

    if (error) {
      console.error('Error finding books by invitation:', error);
      return [];
    }

    // Filter in code for exact email match in pending invitations
    // This is still more efficient than loading full book data for all books
    const matchingBooks = (data || []).filter((row: any) => {
      const invitations = row.invitations || [];
      return invitations.some((inv: any) => inv.email === email && inv.status === 'pending');
    });

    // Load full book data only for matching books
    if (matchingBooks.length === 0) return [];

    const bookIds = matchingBooks.map((b: any) => b.id);
    return Book.findByIds(bookIds);
  }

  // Find a book by invitation token - efficient query
  static async findByInvitationToken(token: string): Promise<IBook | null> {
    if (!token) return null;

    // Query books that have invitations, selecting only needed fields for filtering
    const { data, error } = await supabaseAdmin
      .from('books')
      .select('id, invitations')
      .not('invitations', 'is', null);

    if (error) {
      console.error('Error finding book by invitation token:', error);
      return null;
    }

    // Find the book with matching invitation token
    const matchingBook = (data || []).find((row: any) => {
      const invitations = row.invitations || [];
      return invitations.some((inv: any) => inv.token === token);
    });

    if (!matchingBook) return null;

    // Load full book data for the matching book
    return Book.findById(matchingBook.id);
  }
}
