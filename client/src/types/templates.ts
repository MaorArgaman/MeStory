/**
 * Template Types
 * TypeScript interfaces for book templates
 */

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

// Page Size Options
export type PageSizeOption = 'A4' | 'A5' | 'Letter' | 'Custom' | '6x9' | '5x8';

// Page Section Area Types
export type PageSectionArea =
  | 'top' | 'bottom' | 'left' | 'right'
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  | 'full';

// Content Block Position
export interface ContentBlockPosition {
  x: number;        // Percentage from left (0-100)
  y: number;        // Percentage from top (0-100)
  width: number;    // Percentage of page width
  height: number;   // Percentage of page height
}

// Content Block Style
export interface ContentBlockStyle {
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
}

// Content Block Interface
export interface ContentBlock {
  _id?: string;
  type: ContentBlockType;
  position: ContentBlockPosition;
  content: string;
  style: ContentBlockStyle;
  zIndex: number;
  locked?: boolean;
}

// Page Section
export interface PageSection {
  id: string;
  area: PageSectionArea;
  blocks: ContentBlock[];
  backgroundColor?: string;
  columns?: ColumnLayoutType;
}

// Header/Footer Content
export interface HeaderFooterContent {
  left?: string;
  center?: string;
  right?: string;
}

// Header/Footer Style
export interface HeaderFooterStyle {
  fontSize: number;
  fontFamily: string;
  textColor: string;
  backgroundColor?: string;
  borderBottom?: boolean;
  borderTop?: boolean;
  showOnFirstPage?: boolean;
  showOnOddPages?: boolean;
  showOnEvenPages?: boolean;
}

// Header/Footer Configuration
export interface HeaderFooterConfig {
  enabled: boolean;
  height: number;
  content: HeaderFooterContent;
  style: HeaderFooterStyle;
}

// Gradient Color Stop
export interface GradientColorStop {
  color: string;
  position: number;
}

// Background Configuration
export interface BackgroundConfig {
  type: BackgroundType;
  color?: string;
  gradient?: {
    type: GradientType;
    angle?: number;
    colors: GradientColorStop[];
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

// Margins
export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// Typography Settings
export interface TypographySettings {
  bodyFont: string;
  bodyFontSize: number;
  lineHeight: number;
  textColor: string;
  headingFont: string;
  headingFontSize: number;
  headingColor: string;
}

// Page Layout Template
export interface PageLayoutTemplate {
  _id?: string;
  name: string;
  description?: string;
  splitType: PageSplitType;
  splitRatio?: number[];
  sections: PageSection[];
  columns: ColumnLayoutType;
  columnGap: number;
  header: HeaderFooterConfig;
  footer: HeaderFooterConfig;
  background: BackgroundConfig;
  margins: Margins;
  typography: TypographySettings;
  isRTL: boolean;
  showPageNumber: boolean;
  pageNumberPosition: PageNumberPosition;
}

// Cover Position
export interface CoverPosition {
  x: number;
  y: number;
}

// Front Cover Defaults
export interface FrontCoverDefaults {
  backgroundColor: string;
  gradientColors?: string[];
  titlePosition: CoverPosition;
  authorPosition: CoverPosition;
  titleFont: string;
  titleSize: number;
  titleColor: string;
  authorFont: string;
  authorSize: number;
  authorColor: string;
}

// Back Cover Defaults
export interface BackCoverDefaults {
  backgroundColor: string;
  synopsisPosition: CoverPosition;
  synopsisFont: string;
  synopsisFontSize: number;
  synopsisColor: string;
}

// Spine Defaults
export interface SpineDefaults {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
}

// AI Settings
export interface AISettings {
  suggestedFonts: string[];
  suggestedColorPalettes: string[][];
  imagePlacementRules: string;
  styleGuidelines: string;
}

// Page Types
export interface PageTypes {
  titlePage: PageLayoutTemplate;
  tableOfContents: PageLayoutTemplate;
  chapterOpener: PageLayoutTemplate;
  bodyPage: PageLayoutTemplate;
  sectionDivider?: PageLayoutTemplate;
  acknowledgments?: PageLayoutTemplate;
}

// Cover Defaults
export interface CoverDefaults {
  frontCover: FrontCoverDefaults;
  backCover: BackCoverDefaults;
  spine: SpineDefaults;
}

// Template Defaults
export interface TemplateDefaults {
  pageSize: PageSizeOption;
  customPageSize?: { width: number; height: number };
  pageLayout: PageLayoutTemplate;
}

// Complete Book Template
export interface BookTemplate {
  _id: string;
  name: string;
  nameHe: string;
  category: TemplateCategory;
  description: string;
  descriptionHe: string;
  thumbnail: string;
  previewImages: string[];
  isSystem: boolean;
  createdBy?: string;
  defaults: TemplateDefaults;
  pageTypes: PageTypes;
  coverDefaults: CoverDefaults;
  aiSettings: AISettings;
  tags: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// Template List Item (for gallery display)
export interface TemplateListItem {
  _id: string;
  name: string;
  nameHe: string;
  category: TemplateCategory;
  description: string;
  descriptionHe: string;
  thumbnail: string;
  isSystem: boolean;
  usageCount: number;
}

// API Response Types
export interface TemplatesResponse {
  success: boolean;
  templates: BookTemplate[];
  count: number;
  error?: string;
}

export interface TemplateResponse {
  success: boolean;
  template: BookTemplate;
  error?: string;
}

export interface ApplyTemplateResponse {
  success: boolean;
  book: any;
  error?: string;
}

// Template Category Info (for filtering UI)
export interface TemplateCategoryInfo {
  key: TemplateCategory;
  name: string;
  nameHe: string;
  icon: string;
  description: string;
}

// Template Categories for UI
export const TEMPLATE_CATEGORIES: TemplateCategoryInfo[] = [
  { key: 'academic', name: 'Academic', nameHe: 'אקדמי', icon: '📚', description: 'Formal academic layout' },
  { key: 'personal-story', name: 'Personal Story', nameHe: 'סיפור אישי', icon: '💭', description: 'Memoir and autobiography' },
  { key: 'children', name: "Children's", nameHe: 'ילדים', icon: '🧸', description: 'Colorful kids layout' },
  { key: 'novel', name: 'Novel', nameHe: 'רומן', icon: '📖', description: 'Classic fiction layout' },
  { key: 'poetry', name: 'Poetry', nameHe: 'שירה', icon: '✨', description: 'Elegant verse layout' },
  { key: 'self-help', name: 'Self-Help', nameHe: 'עזרה עצמית', icon: '🎯', description: 'Motivational design' },
  { key: 'cookbook', name: 'Cookbook', nameHe: 'מתכונים', icon: '🍳', description: 'Recipe card layout' },
  { key: 'travel', name: 'Travel', nameHe: 'מסעות', icon: '✈️', description: 'Journal with photos' },
  { key: 'photo-album', name: 'Photo Album', nameHe: 'אלבום', icon: '📷', description: 'Image-first design' },
  { key: 'custom', name: 'Custom', nameHe: 'מותאם', icon: '🎨', description: 'Start from scratch' },
];

// Helper function to get category info
export function getCategoryInfo(category: TemplateCategory): TemplateCategoryInfo | undefined {
  return TEMPLATE_CATEGORIES.find(c => c.key === category);
}

// Helper function to get Hebrew category name
export function getCategoryNameHe(category: TemplateCategory): string {
  return getCategoryInfo(category)?.nameHe || category;
}
