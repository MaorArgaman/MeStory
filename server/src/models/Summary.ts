import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();

// Source type enum
export enum SourceType {
  INTERVIEW = 'INTERVIEW',
  FILE = 'FILE',
  AUDIO = 'AUDIO',
  DIRECT = 'DIRECT',
}

// Character definition for summary
export interface ISummaryCharacter {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  description?: string;
  traits?: string[];
  backstory?: string;
  goals?: string;
  arc?: string;
}

// Plot structure for summary
export interface ISummaryPlotStructure {
  premise?: string;
  theme?: string;
  genre?: string;
  setting?: string;
  threeActStructure?: {
    act1: string;
    act2: string;
    act3: string;
  };
  plotPoints?: {
    incitingIncident?: string;
    firstPlotPoint?: string;
    midpoint?: string;
    climax?: string;
    resolution?: string;
  };
  conflict?: {
    type: string;
    description: string;
  };
  tone?: string;
  targetAudience?: string;
}

// Chapter outline for summary
export interface ISummaryChapter {
  chapterNumber: number;
  title: string;
  summary: string;
  keyEvents?: string[];
  characters?: string[];
  estimatedWordCount?: number;
  notes?: string;
}

// Metadata interfaces
export interface IInterviewMetadata {
  totalQuestions?: number;
  questionsAnswered?: number;
  sessionDuration?: number;
  conversationId?: string;
  aiModel?: string;
}

export interface IFileMetadata {
  originalFilename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  extractedText?: string;
  pageCount?: number;
}

export interface IAudioMetadata {
  originalFilename: string;
  audioFormat: string;
  duration: number;
  fileSize: number;
  uploadedAt: string;
  transcriptionModel?: string;
  transcriptionDuration?: number;
}

// Summary interface
export interface ISummary {
  id: string;
  _id?: string;
  userId: string;
  bookId?: string;
  sourceType: SourceType;
  content: string;
  summary: string;
  characters: ISummaryCharacter[];
  plotStructure: ISummaryPlotStructure;
  chapters: ISummaryChapter[];
  metadata?: IInterviewMetadata | IFileMetadata | IAudioMetadata;
  status: 'pending' | 'processing' | 'completed' | 'converted' | 'failed';
  error?: string;
  aiCreditsUsed?: number;
  convertedToBook: boolean;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
}

// Database row type
interface SummaryRow {
  id: string;
  user_id: string;
  book_id: string | null;
  source_type: string;
  content: string;
  summary: string;
  characters: ISummaryCharacter[];
  plot_structure: ISummaryPlotStructure;
  chapters: ISummaryChapter[];
  metadata: any;
  status: string;
  error: string | null;
  ai_credits_used: number;
  converted_to_book: boolean;
  created_at: string;
  updated_at: string;
}

// Transform database row to ISummary
function rowToSummary(row: SummaryRow): ISummary {
  return {
    id: row.id,
    _id: row.id,
    userId: row.user_id,
    bookId: row.book_id || undefined,
    sourceType: row.source_type as SourceType,
    content: row.content,
    summary: row.summary,
    characters: row.characters || [],
    plotStructure: row.plot_structure || {},
    chapters: row.chapters || [],
    metadata: row.metadata || undefined,
    status: row.status as ISummary['status'],
    error: row.error || undefined,
    aiCreditsUsed: row.ai_credits_used || 0,
    convertedToBook: row.converted_to_book || false,
    created_at: row.created_at,
    updated_at: row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Summary Model class for Supabase operations
export class Summary {
  // Find summary by ID
  static async findById(id: string): Promise<ISummary | null> {
    const { data, error } = await supabaseAdmin
      .from('summaries')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return rowToSummary(data as SummaryRow);
  }

  // Find one summary by query
  static async findOne(query: Record<string, any>): Promise<ISummary | null> {
    let queryBuilder = supabaseAdmin.from('summaries').select('*');

    if (query._id || query.id) {
      queryBuilder = queryBuilder.eq('id', query._id || query.id);
    }
    if (query.userId) {
      queryBuilder = queryBuilder.eq('user_id', query.userId);
    }
    if (query.bookId) {
      queryBuilder = queryBuilder.eq('book_id', query.bookId);
    }

    const { data, error } = await queryBuilder.limit(1).single();

    if (error || !data) return null;
    return rowToSummary(data as SummaryRow);
  }

  // Create new summary
  static async create(summaryData: Partial<ISummary>): Promise<ISummary> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const insertData = {
      id,
      user_id: summaryData.userId,
      book_id: summaryData.bookId || null,
      source_type: summaryData.sourceType || SourceType.DIRECT,
      content: summaryData.content || '',
      summary: summaryData.summary || '',
      characters: summaryData.characters || [],
      plot_structure: summaryData.plotStructure || {},
      chapters: summaryData.chapters || [],
      metadata: summaryData.metadata || null,
      status: summaryData.status || 'pending',
      error: summaryData.error || null,
      ai_credits_used: summaryData.aiCreditsUsed || 0,
      converted_to_book: summaryData.convertedToBook || false,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from('summaries')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating summary:', error);
      throw new Error(error.message);
    }

    return rowToSummary(data as SummaryRow);
  }

  // Update summary by ID
  static async findByIdAndUpdate(
    id: string,
    update: Partial<ISummary> | { $set?: Partial<any> },
    options?: { new?: boolean }
  ): Promise<ISummary | null> {
    let updateData: Record<string, any> = {};

    if ('$set' in update && update.$set) {
      const setData = update.$set;
      Object.entries(setData).forEach(([key, value]) => {
        updateData[camelToSnake(key)] = value;
      });
    } else {
      Object.entries(update).forEach(([key, value]) => {
        if (key !== 'id' && key !== '_id') {
          updateData[camelToSnake(key)] = value;
        }
      });
    }

    updateData.updated_at = new Date().toISOString();
    delete updateData.id;
    delete updateData._id;

    const { data, error } = await supabaseAdmin
      .from('summaries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating summary:', error);
      return null;
    }

    return rowToSummary(data as SummaryRow);
  }

  // Delete summary by ID
  static async findByIdAndDelete(id: string): Promise<ISummary | null> {
    const summary = await this.findById(id);
    if (!summary) return null;

    const { error } = await supabaseAdmin
      .from('summaries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting summary:', error);
      return null;
    }

    return summary;
  }

  // Find multiple summaries
  static async find(query: Record<string, any> = {}): Promise<ISummary[]> {
    let queryBuilder = supabaseAdmin.from('summaries').select('*');

    if (query.userId) {
      queryBuilder = queryBuilder.eq('user_id', query.userId);
    }
    if (query.bookId) {
      queryBuilder = queryBuilder.eq('book_id', query.bookId);
    }
    if (query.sourceType) {
      queryBuilder = queryBuilder.eq('source_type', query.sourceType);
    }
    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }
    if (query.convertedToBook !== undefined) {
      queryBuilder = queryBuilder.eq('converted_to_book', query.convertedToBook);
    }

    queryBuilder = queryBuilder.order('created_at', { ascending: false });

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error finding summaries:', error);
      return [];
    }

    return (data || []).map(row => rowToSummary(row as SummaryRow));
  }

  // Count summaries
  static async countDocuments(query: Record<string, any> = {}): Promise<number> {
    let queryBuilder = supabaseAdmin
      .from('summaries')
      .select('id', { count: 'exact', head: true });

    if (query.userId) {
      queryBuilder = queryBuilder.eq('user_id', query.userId);
    }
    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    const { count, error } = await queryBuilder;

    if (error) {
      console.error('Error counting summaries:', error);
      return 0;
    }

    return count || 0;
  }

  // Check if summary is ready for conversion
  static isReadyForConversion(summary: ISummary): boolean {
    return (
      summary.status === 'completed' &&
      !summary.convertedToBook &&
      !!summary.summary &&
      !!summary.plotStructure &&
      summary.characters.length > 0 &&
      summary.chapters.length > 0
    );
  }

  // Get total estimated word count
  static totalEstimatedWordCount(summary: ISummary): number {
    return summary.chapters.reduce((total, chapter) => total + (chapter.estimatedWordCount || 0), 0);
  }
}

// Helper to convert camelCase to snake_case
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export default Summary;
