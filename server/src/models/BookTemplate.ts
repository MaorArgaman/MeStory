import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();

// Template Category
export type TemplateCategory =
  | 'academic'
  | 'personal-story'
  | 'children'
  | 'novel'
  | 'poetry'
  | 'self-help'
  | 'cookbook'
  | 'travel'
  | 'photo-album'
  | 'custom';

// Page Size Options
export type PageSizeOption = 'A4' | 'A5' | 'Letter' | 'Custom' | '6x9' | '5x8';

// Page Split Types
export type PageSplitType = 'none' | 'horizontal' | 'vertical' | 'quadrant';

// Column Layout Types
export type ColumnLayoutType = 1 | 2 | 3 | 4;

// Content Block Type
export type ContentBlockType = 'text' | 'image' | 'header' | 'footer' | 'quote' | 'caption' | 'decorative';

// Interfaces
export interface IContentBlock {
  _id?: string;
  type: ContentBlockType;
  position: { x: number; y: number; width: number; height: number };
  content: string;
  style: Record<string, any>;
  zIndex: number;
  locked?: boolean;
}

export interface IPageSection {
  id: string;
  area: string;
  blocks: IContentBlock[];
  backgroundColor?: string;
  columns?: ColumnLayoutType;
}

export interface IHeaderFooterConfig {
  enabled: boolean;
  height: number;
  content: { left?: string; center?: string; right?: string };
  style: Record<string, any>;
}

export interface IBackgroundConfig {
  type: 'solid' | 'gradient' | 'image' | 'pattern';
  color?: string;
  gradient?: any;
  image?: any;
  pattern?: any;
}

export interface IPageLayoutTemplate {
  _id?: string;
  name: string;
  description?: string;
  splitType: PageSplitType;
  splitRatio?: number[];
  sections: IPageSection[];
  columns: ColumnLayoutType;
  columnGap: number;
  header: IHeaderFooterConfig;
  footer: IHeaderFooterConfig;
  background: IBackgroundConfig;
  margins: { top: number; bottom: number; left: number; right: number };
  typography: Record<string, any>;
  isRTL: boolean;
  showPageNumber: boolean;
  pageNumberPosition: string;
}

export interface ICoverPosition {
  x: number;
  y: number;
}

export interface IFrontCoverDefaults {
  backgroundColor: string;
  gradientColors?: string[];
  titlePosition: ICoverPosition;
  authorPosition: ICoverPosition;
  titleFont: string;
  titleSize: number;
  titleColor: string;
  authorFont: string;
  authorSize: number;
  authorColor: string;
}

export interface IBackCoverDefaults {
  backgroundColor: string;
  synopsisPosition: ICoverPosition;
  synopsisFont: string;
  synopsisFontSize: number;
  synopsisColor: string;
}

export interface ISpineDefaults {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
}

export interface IAISettings {
  suggestedFonts: string[];
  suggestedColorPalettes: string[][];
  imagePlacementRules: string;
  styleGuidelines: string;
}

// Book Template interface
export interface IBookTemplate {
  id: string;
  _id?: string;
  name: string;
  nameHe?: string;
  category: TemplateCategory;
  description?: string;
  descriptionHe?: string;
  thumbnail?: string;
  previewImages: string[];
  isSystem: boolean;
  createdBy?: string;
  defaults: {
    pageSize: PageSizeOption;
    customPageSize?: { width: number; height: number };
    pageLayout: IPageLayoutTemplate | null;
  };
  pageTypes: {
    titlePage: IPageLayoutTemplate | null;
    tableOfContents: IPageLayoutTemplate | null;
    chapterOpener: IPageLayoutTemplate | null;
    bodyPage: IPageLayoutTemplate | null;
    sectionDivider?: IPageLayoutTemplate | null;
    acknowledgments?: IPageLayoutTemplate | null;
  };
  coverDefaults: {
    frontCover: IFrontCoverDefaults | null;
    backCover: IBackCoverDefaults | null;
    spine: ISpineDefaults | null;
  };
  aiSettings: IAISettings;
  tags: string[];
  isActive: boolean;
  usageCount: number;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
}

// Database row type
interface BookTemplateRow {
  id: string;
  name: string;
  name_he: string | null;
  category: string;
  description: string | null;
  description_he: string | null;
  thumbnail: string | null;
  preview_images: string[];
  is_system: boolean;
  created_by: string | null;
  defaults: any;
  page_types: any;
  cover_defaults: any;
  ai_settings: any;
  tags: string[];
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// Transform function
function rowToBookTemplate(row: BookTemplateRow): IBookTemplate {
  return {
    id: row.id,
    _id: row.id,
    name: row.name,
    nameHe: row.name_he || undefined,
    category: row.category as TemplateCategory,
    description: row.description || undefined,
    descriptionHe: row.description_he || undefined,
    thumbnail: row.thumbnail || undefined,
    previewImages: row.preview_images || [],
    isSystem: row.is_system,
    createdBy: row.created_by || undefined,
    defaults: row.defaults || { pageSize: 'A5', pageLayout: null },
    pageTypes: row.page_types || {
      titlePage: null,
      tableOfContents: null,
      chapterOpener: null,
      bodyPage: null,
    },
    coverDefaults: row.cover_defaults || {
      frontCover: null,
      backCover: null,
      spine: null,
    },
    aiSettings: row.ai_settings || {
      suggestedFonts: [],
      suggestedColorPalettes: [],
      imagePlacementRules: '',
      styleGuidelines: '',
    },
    tags: row.tags || [],
    isActive: row.is_active,
    usageCount: row.usage_count || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// BookTemplate Model class
export class BookTemplate {
  static async findById(id: string): Promise<IBookTemplate | null> {
    const { data, error } = await supabaseAdmin
      .from('book_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return rowToBookTemplate(data as BookTemplateRow);
  }

  static async findOne(query: Record<string, any>): Promise<IBookTemplate | null> {
    let queryBuilder = supabaseAdmin.from('book_templates').select('*');

    if (query._id || query.id) {
      queryBuilder = queryBuilder.eq('id', query._id || query.id);
    }
    if (query.category) {
      queryBuilder = queryBuilder.eq('category', query.category);
    }
    if (query.isSystem !== undefined) {
      queryBuilder = queryBuilder.eq('is_system', query.isSystem);
    }
    if (query.isActive !== undefined) {
      queryBuilder = queryBuilder.eq('is_active', query.isActive);
    }

    const { data, error } = await queryBuilder.limit(1).single();

    if (error || !data) return null;
    return rowToBookTemplate(data as BookTemplateRow);
  }

  static async create(templateData: Partial<IBookTemplate>): Promise<IBookTemplate> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const insertData = {
      id,
      name: templateData.name || 'New Template',
      name_he: templateData.nameHe || null,
      category: templateData.category || 'custom',
      description: templateData.description || null,
      description_he: templateData.descriptionHe || null,
      thumbnail: templateData.thumbnail || null,
      preview_images: templateData.previewImages || [],
      is_system: templateData.isSystem || false,
      created_by: templateData.createdBy || null,
      defaults: templateData.defaults || { pageSize: 'A5', pageLayout: null },
      page_types: templateData.pageTypes || {
        titlePage: null,
        tableOfContents: null,
        chapterOpener: null,
        bodyPage: null,
      },
      cover_defaults: templateData.coverDefaults || {
        frontCover: null,
        backCover: null,
        spine: null,
      },
      ai_settings: templateData.aiSettings || {
        suggestedFonts: [],
        suggestedColorPalettes: [],
        imagePlacementRules: '',
        styleGuidelines: '',
      },
      tags: templateData.tags || [],
      is_active: templateData.isActive !== false,
      usage_count: templateData.usageCount || 0,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from('book_templates')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating book template:', error);
      throw new Error(error.message);
    }

    return rowToBookTemplate(data as BookTemplateRow);
  }

  static async find(query: Record<string, any> = {}): Promise<IBookTemplate[]> {
    let queryBuilder = supabaseAdmin.from('book_templates').select('*');

    if (query.category) {
      queryBuilder = queryBuilder.eq('category', query.category);
    }
    if (query.isSystem !== undefined) {
      queryBuilder = queryBuilder.eq('is_system', query.isSystem);
    }
    if (query.isActive !== undefined) {
      queryBuilder = queryBuilder.eq('is_active', query.isActive);
    }
    if (query.createdBy) {
      queryBuilder = queryBuilder.eq('created_by', query.createdBy);
    }

    if (query._sort) {
      const sortField = camelToSnake(query._sort);
      queryBuilder = queryBuilder.order(sortField, { ascending: query._order !== 'desc' });
    } else {
      queryBuilder = queryBuilder.order('usage_count', { ascending: false });
    }

    if (query._limit) {
      queryBuilder = queryBuilder.limit(query._limit);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error finding book templates:', error);
      return [];
    }

    return (data || []).map(row => rowToBookTemplate(row as BookTemplateRow));
  }

  static async countDocuments(query: Record<string, any> = {}): Promise<number> {
    let queryBuilder = supabaseAdmin
      .from('book_templates')
      .select('id', { count: 'exact', head: true });

    if (query.category) {
      queryBuilder = queryBuilder.eq('category', query.category);
    }
    if (query.isActive !== undefined) {
      queryBuilder = queryBuilder.eq('is_active', query.isActive);
    }

    const { count, error } = await queryBuilder;

    if (error) return 0;
    return count || 0;
  }

  static async findByIdAndUpdate(
    id: string,
    update: Partial<IBookTemplate> | { $set?: any; $inc?: any }
  ): Promise<IBookTemplate | null> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Handle $set
    if ('$set' in update && update.$set) {
      Object.entries(update.$set).forEach(([key, value]) => {
        updateData[camelToSnake(key)] = value;
      });
    }

    // Handle $inc
    if ('$inc' in update && update.$inc) {
      const current = await this.findById(id);
      if (current) {
        Object.entries(update.$inc).forEach(([key, value]) => {
          updateData[camelToSnake(key)] = ((current as any)[key] || 0) + (value as number);
        });
      }
    }

    // Handle direct updates
    if (!('$set' in update) && !('$inc' in update)) {
      Object.entries(update).forEach(([key, value]) => {
        if (key !== 'id' && key !== '_id') {
          updateData[camelToSnake(key)] = value;
        }
      });
    }

    const { data, error } = await supabaseAdmin
      .from('book_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return rowToBookTemplate(data as BookTemplateRow);
  }

  static async findByIdAndDelete(id: string): Promise<IBookTemplate | null> {
    const template = await this.findById(id);
    if (!template) return null;

    const { error } = await supabaseAdmin
      .from('book_templates')
      .delete()
      .eq('id', id);

    if (error) return null;
    return template;
  }

  // Increment usage count
  static async incrementUsage(id: string): Promise<void> {
    const template = await this.findById(id);
    if (template) {
      await this.findByIdAndUpdate(id, { usageCount: template.usageCount + 1 });
    }
  }
}

// Helper to convert camelCase to snake_case
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export default BookTemplate;
