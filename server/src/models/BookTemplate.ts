import mongoose, { Document, Schema } from 'mongoose';

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

// Page Split Types
export type PageSplitType = 'none' | 'horizontal' | 'vertical' | 'quadrant';

// Column Layout Types
export type ColumnLayoutType = 1 | 2 | 3 | 4;

// Content Block Type
export type ContentBlockType = 'text' | 'image' | 'header' | 'footer' | 'quote' | 'caption' | 'decorative';

// Content Block Interface (for free-form content arrangement)
export interface IContentBlock {
  _id?: mongoose.Types.ObjectId;
  type: ContentBlockType;
  position: {
    x: number;        // Percentage from left (0-100)
    y: number;        // Percentage from top (0-100)
    width: number;    // Percentage of page width
    height: number;   // Percentage of page height
  };
  content: string;    // Text content or image URL
  style: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold' | 'light';
    fontStyle?: 'normal' | 'italic';
    textColor?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    padding?: number;
    borderRadius?: number;
    border?: {
      width: number;
      color: string;
      style: 'solid' | 'dashed' | 'dotted';
    };
  };
  zIndex: number;     // Layer ordering
  locked?: boolean;   // Prevent accidental editing
}

// Page Section Area Types
export type PageSectionArea =
  | 'top' | 'bottom' | 'left' | 'right'
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  | 'full';

// Page Section (for split layouts)
export interface IPageSection {
  id: string;
  area: PageSectionArea;
  blocks: IContentBlock[];
  backgroundColor?: string;
  columns?: ColumnLayoutType;
}

// Header/Footer Content Position
export interface IHeaderFooterContent {
  left?: string;      // Dynamic: {pageNumber}, {title}, {author}, {chapter}
  center?: string;
  right?: string;
}

// Header/Footer Style
export interface IHeaderFooterStyle {
  fontSize: number;
  fontFamily: string;
  textColor: string;
  backgroundColor?: string;
  borderBottom?: boolean;  // For header
  borderTop?: boolean;     // For footer
  showOnFirstPage?: boolean;
  showOnOddPages?: boolean;
  showOnEvenPages?: boolean;
}

// Advanced Header/Footer Configuration
export interface IHeaderFooterConfig {
  enabled: boolean;
  height: number;       // Pixels
  content: IHeaderFooterContent;
  style: IHeaderFooterStyle;
}

// Page Number Position
export type PageNumberPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

// Background Type
export type BackgroundType = 'solid' | 'gradient' | 'image' | 'pattern';

// Gradient Type
export type GradientType = 'linear' | 'radial';

// Pattern Type
export type PatternType = 'dots' | 'lines' | 'grid' | 'custom';

// Background Configuration
export interface IBackgroundConfig {
  type: BackgroundType;
  color?: string;
  gradient?: {
    type: GradientType;
    angle?: number;
    colors: Array<{ color: string; position: number }>;
  };
  image?: {
    url: string;
    opacity: number;
    position: 'cover' | 'contain' | 'tile';
  };
  pattern?: {
    type: PatternType;
    color: string;
    opacity: number;
  };
}

// Page Layout Template (single page configuration)
export interface IPageLayoutTemplate {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description?: string;

  // Split configuration
  splitType: PageSplitType;
  splitRatio?: number[];  // [50, 50] for equal, [30, 70] for custom
  sections: IPageSection[];

  // Column configuration
  columns: ColumnLayoutType;
  columnGap: number;       // Pixels between columns

  // Header/Footer
  header: IHeaderFooterConfig;
  footer: IHeaderFooterConfig;

  // Background
  background: IBackgroundConfig;

  // Margins
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };

  // Typography defaults for this page
  typography: {
    bodyFont: string;
    bodyFontSize: number;
    lineHeight: number;
    textColor: string;
    headingFont: string;
    headingFontSize: number;
    headingColor: string;
  };

  // Page-specific settings
  isRTL: boolean;
  showPageNumber: boolean;
  pageNumberPosition: PageNumberPosition;
}

// Cover Position Interface
export interface ICoverPosition {
  x: number;
  y: number;
}

// Front Cover Defaults
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

// Back Cover Defaults
export interface IBackCoverDefaults {
  backgroundColor: string;
  synopsisPosition: ICoverPosition;
  synopsisFont: string;
  synopsisFontSize: number;
  synopsisColor: string;
}

// Spine Defaults
export interface ISpineDefaults {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
}

// AI Settings for Template
export interface IAISettings {
  suggestedFonts: string[];
  suggestedColorPalettes: string[][];
  imagePlacementRules: string;   // AI prompt guidance
  styleGuidelines: string;        // AI design guidance
}

// Page Size Options
export type PageSizeOption = 'A4' | 'A5' | 'Letter' | 'Custom' | '6x9' | '5x8';

// Complete Book Template Interface
export interface IBookTemplate extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  nameHe: string;           // Hebrew name for RTL display
  category: TemplateCategory;
  description: string;
  descriptionHe: string;
  thumbnail: string;        // Preview image URL
  previewImages: string[];  // Multiple preview angles

  // Is this a system template or user-created?
  isSystem: boolean;
  createdBy?: mongoose.Types.ObjectId;

  // Default settings for books using this template
  defaults: {
    pageSize: PageSizeOption;
    customPageSize?: { width: number; height: number };
    pageLayout: IPageLayoutTemplate;
  };

  // Predefined page types
  pageTypes: {
    titlePage: IPageLayoutTemplate;
    tableOfContents: IPageLayoutTemplate;
    chapterOpener: IPageLayoutTemplate;
    bodyPage: IPageLayoutTemplate;
    sectionDivider?: IPageLayoutTemplate;
    acknowledgments?: IPageLayoutTemplate;
  };

  // Cover design defaults
  coverDefaults: {
    frontCover: IFrontCoverDefaults;
    backCover: IBackCoverDefaults;
    spine: ISpineDefaults;
  };

  // AI-specific settings for this template
  aiSettings: IAISettings;

  // Metadata
  tags: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Content Block Schema
const ContentBlockSchema = new Schema<IContentBlock>(
  {
    type: {
      type: String,
      enum: ['text', 'image', 'header', 'footer', 'quote', 'caption', 'decorative'],
      required: true,
    },
    position: {
      x: { type: Number, required: true, min: 0, max: 100, default: 0 },
      y: { type: Number, required: true, min: 0, max: 100, default: 0 },
      width: { type: Number, required: true, min: 1, max: 100, default: 100 },
      height: { type: Number, required: true, min: 1, max: 100, default: 20 },
    },
    content: { type: String, default: '' },
    style: {
      fontSize: { type: Number, min: 8, max: 72 },
      fontFamily: String,
      fontWeight: { type: String, enum: ['normal', 'bold', 'light'] },
      fontStyle: { type: String, enum: ['normal', 'italic'] },
      textColor: String,
      backgroundColor: String,
      textAlign: { type: String, enum: ['left', 'center', 'right', 'justify'] },
      padding: { type: Number, min: 0 },
      borderRadius: { type: Number, min: 0 },
      border: {
        width: { type: Number, min: 0 },
        color: String,
        style: { type: String, enum: ['solid', 'dashed', 'dotted'] },
      },
    },
    zIndex: { type: Number, default: 0 },
    locked: { type: Boolean, default: false },
  },
  { _id: true }
);

// Page Section Schema
const PageSectionSchema = new Schema(
  {
    id: { type: String, required: true },
    area: {
      type: String,
      enum: ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'full'],
      default: 'full',
    },
    blocks: [ContentBlockSchema],
    backgroundColor: String,
    columns: { type: Number, enum: [1, 2, 3, 4], default: 1 },
  },
  { _id: false }
);

// Header/Footer Content Schema
const HeaderFooterContentSchema = new Schema(
  {
    left: String,
    center: String,
    right: String,
  },
  { _id: false }
);

// Header/Footer Style Schema
const HeaderFooterStyleSchema = new Schema(
  {
    fontSize: { type: Number, default: 10 },
    fontFamily: { type: String, default: 'Georgia' },
    textColor: { type: String, default: '#333333' },
    backgroundColor: String,
    borderBottom: { type: Boolean, default: false },
    borderTop: { type: Boolean, default: false },
    showOnFirstPage: { type: Boolean, default: false },
    showOnOddPages: { type: Boolean, default: true },
    showOnEvenPages: { type: Boolean, default: true },
  },
  { _id: false }
);

// Header/Footer Config Schema
const HeaderFooterConfigSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    height: { type: Number, default: 40 },
    content: { type: HeaderFooterContentSchema, default: () => ({}) },
    style: { type: HeaderFooterStyleSchema, default: () => ({}) },
  },
  { _id: false }
);

// Background Config Schema
const BackgroundConfigSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['solid', 'gradient', 'image', 'pattern'],
      default: 'solid',
    },
    color: { type: String, default: '#ffffff' },
    gradient: {
      type: { type: String, enum: ['linear', 'radial'] },
      angle: Number,
      colors: [
        {
          color: String,
          position: Number,
        },
      ],
    },
    image: {
      url: String,
      opacity: { type: Number, min: 0, max: 1, default: 1 },
      position: { type: String, enum: ['cover', 'contain', 'tile'] },
    },
    pattern: {
      type: { type: String, enum: ['dots', 'lines', 'grid', 'custom'] },
      color: String,
      opacity: { type: Number, min: 0, max: 1 },
    },
  },
  { _id: false }
);

// Typography Schema
const TypographySchema = new Schema(
  {
    bodyFont: { type: String, default: 'Georgia' },
    bodyFontSize: { type: Number, default: 12, min: 8, max: 24 },
    lineHeight: { type: Number, default: 1.6, min: 1, max: 3 },
    textColor: { type: String, default: '#000000' },
    headingFont: { type: String, default: 'Georgia' },
    headingFontSize: { type: Number, default: 18, min: 12, max: 48 },
    headingColor: { type: String, default: '#000000' },
  },
  { _id: false }
);

// Margins Schema
const MarginsSchema = new Schema(
  {
    top: { type: Number, default: 25 },
    bottom: { type: Number, default: 25 },
    left: { type: Number, default: 25 },
    right: { type: Number, default: 25 },
  },
  { _id: false }
);

// Page Layout Template Schema
const PageLayoutTemplateSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    splitType: {
      type: String,
      enum: ['none', 'horizontal', 'vertical', 'quadrant'],
      default: 'none',
    },
    splitRatio: [Number],
    sections: [PageSectionSchema],
    columns: { type: Number, enum: [1, 2, 3, 4], default: 1 },
    columnGap: { type: Number, default: 20 },
    header: { type: HeaderFooterConfigSchema, default: () => ({}) },
    footer: { type: HeaderFooterConfigSchema, default: () => ({}) },
    background: { type: BackgroundConfigSchema, default: () => ({}) },
    margins: { type: MarginsSchema, default: () => ({}) },
    typography: { type: TypographySchema, default: () => ({}) },
    isRTL: { type: Boolean, default: true },
    showPageNumber: { type: Boolean, default: true },
    pageNumberPosition: {
      type: String,
      enum: ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'],
      default: 'bottom-center',
    },
  },
  { _id: true }
);

// Cover Position Schema
const CoverPositionSchema = new Schema(
  {
    x: { type: Number, default: 50 },
    y: { type: Number, default: 50 },
  },
  { _id: false }
);

// Front Cover Defaults Schema
const FrontCoverDefaultsSchema = new Schema(
  {
    backgroundColor: { type: String, default: '#1a1a2e' },
    gradientColors: [String],
    titlePosition: { type: CoverPositionSchema, default: () => ({ x: 50, y: 40 }) },
    authorPosition: { type: CoverPositionSchema, default: () => ({ x: 50, y: 85 }) },
    titleFont: { type: String, default: 'Playfair Display' },
    titleSize: { type: Number, default: 36 },
    titleColor: { type: String, default: '#ffffff' },
    authorFont: { type: String, default: 'Inter' },
    authorSize: { type: Number, default: 16 },
    authorColor: { type: String, default: '#cccccc' },
  },
  { _id: false }
);

// Back Cover Defaults Schema
const BackCoverDefaultsSchema = new Schema(
  {
    backgroundColor: { type: String, default: '#1a1a2e' },
    synopsisPosition: { type: CoverPositionSchema, default: () => ({ x: 50, y: 50 }) },
    synopsisFont: { type: String, default: 'Georgia' },
    synopsisFontSize: { type: Number, default: 12 },
    synopsisColor: { type: String, default: '#ffffff' },
  },
  { _id: false }
);

// Spine Defaults Schema
const SpineDefaultsSchema = new Schema(
  {
    backgroundColor: { type: String, default: '#1a1a2e' },
    textColor: { type: String, default: '#ffffff' },
    fontSize: { type: Number, default: 10 },
  },
  { _id: false }
);

// AI Settings Schema
const AISettingsSchema = new Schema(
  {
    suggestedFonts: { type: [String], default: [] },
    suggestedColorPalettes: { type: [[String]], default: [] },
    imagePlacementRules: { type: String, default: '' },
    styleGuidelines: { type: String, default: '' },
  },
  { _id: false }
);

// Book Template Schema
const BookTemplateSchema = new Schema<IBookTemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    nameHe: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      required: true,
      enum: ['academic', 'personal-story', 'children', 'novel', 'poetry', 'self-help', 'cookbook', 'travel', 'photo-album', 'custom'],
    },
    description: {
      type: String,
      maxlength: 500,
    },
    descriptionHe: {
      type: String,
      maxlength: 500,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    previewImages: {
      type: [String],
      default: [],
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    defaults: {
      pageSize: {
        type: String,
        enum: ['A4', 'A5', 'Letter', 'Custom', '6x9', '5x8'],
        default: 'A5',
      },
      customPageSize: {
        width: Number,
        height: Number,
      },
      pageLayout: { type: PageLayoutTemplateSchema, default: () => ({}) },
    },
    pageTypes: {
      titlePage: { type: PageLayoutTemplateSchema, default: () => ({}) },
      tableOfContents: { type: PageLayoutTemplateSchema, default: () => ({}) },
      chapterOpener: { type: PageLayoutTemplateSchema, default: () => ({}) },
      bodyPage: { type: PageLayoutTemplateSchema, default: () => ({}) },
      sectionDivider: PageLayoutTemplateSchema,
      acknowledgments: PageLayoutTemplateSchema,
    },
    coverDefaults: {
      frontCover: { type: FrontCoverDefaultsSchema, default: () => ({}) },
      backCover: { type: BackCoverDefaultsSchema, default: () => ({}) },
      spine: { type: SpineDefaultsSchema, default: () => ({}) },
    },
    aiSettings: {
      type: AISettingsSchema,
      default: () => ({}),
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'book_templates',
  }
);

// Indexes
BookTemplateSchema.index({ category: 1 });
BookTemplateSchema.index({ isSystem: 1 });
BookTemplateSchema.index({ isActive: 1 });
BookTemplateSchema.index({ usageCount: -1 });
BookTemplateSchema.index({ createdBy: 1 });

// Export the model
export const BookTemplate = mongoose.model<IBookTemplate>('BookTemplate', BookTemplateSchema);
