/**
 * Template Service
 * CRUD operations for book templates
 */

import { BookTemplate, IBookTemplate, TemplateCategory } from '../models/BookTemplate';
import { Book, IBook } from '../models/Book';
import { defaultTemplates } from '../data/defaultTemplates';

// UUID validation helper
const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Initialize default templates in database
export async function initializeDefaultTemplates(): Promise<void> {
  try {
    // Check if system templates already exist
    const existingCount = await BookTemplate.countDocuments({ isSystem: true });

    if (existingCount === 0) {
      console.log('Initializing default templates...');

      for (const template of defaultTemplates) {
        await BookTemplate.create({
          ...template,
          isSystem: true,
        });
      }

      console.log(`Created ${defaultTemplates.length} default templates`);
    } else {
      console.log(`${existingCount} system templates already exist`);
    }
  } catch (error) {
    console.error('Failed to initialize default templates:', error);
    throw error;
  }
}

// Get all templates
export async function getAllTemplates(options?: {
  category?: TemplateCategory;
  isActive?: boolean;
  limit?: number;
  skip?: number;
}): Promise<IBookTemplate[]> {
  const query: any = {};

  if (options?.category) {
    query.category = options.category;
  }

  if (options?.isActive !== undefined) {
    query.isActive = options.isActive;
  }

  if (options?.limit) {
    query._limit = options.limit;
  }

  let templates = await BookTemplate.find(query);

  // Sort: system first, then by usage count, then by createdAt
  templates.sort((a, b) => {
    if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
    if (a.usageCount !== b.usageCount) return b.usageCount - a.usageCount;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  // Apply skip if needed
  if (options?.skip) {
    templates = templates.slice(options.skip);
  }

  return templates;
}

// Get template by ID
export async function getTemplateById(templateId: string): Promise<IBookTemplate | null> {
  if (!isValidUUID(templateId)) {
    return null;
  }

  return BookTemplate.findById(templateId);
}

// Get templates by category
export async function getTemplatesByCategory(category: TemplateCategory): Promise<IBookTemplate[]> {
  const templates = await BookTemplate.find({ category, isActive: true });
  // Sort by usage count descending
  templates.sort((a, b) => b.usageCount - a.usageCount);
  return templates;
}

// Get system templates only
export async function getSystemTemplates(): Promise<IBookTemplate[]> {
  const templates = await BookTemplate.find({ isSystem: true, isActive: true });
  // Sort by category
  templates.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
  return templates;
}

// Get user's custom templates
export async function getUserTemplates(userId: string): Promise<IBookTemplate[]> {
  if (!isValidUUID(userId)) {
    return [];
  }

  const templates = await BookTemplate.find({ createdBy: userId, isSystem: false });
  // Sort by createdAt descending
  templates.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return templates;
}

// Create a new template
export async function createTemplate(
  templateData: Partial<IBookTemplate>,
  userId?: string
): Promise<IBookTemplate> {
  const template = await BookTemplate.create({
    ...templateData,
    isSystem: false,
    createdBy: userId || undefined,
    usageCount: 0,
    isActive: true,
  });

  return template;
}

// Update a template
export async function updateTemplate(
  templateId: string,
  updates: Partial<IBookTemplate>,
  userId?: string
): Promise<IBookTemplate | null> {
  if (!isValidUUID(templateId)) {
    return null;
  }

  const template = await BookTemplate.findById(templateId);

  if (!template) {
    return null;
  }

  // Prevent editing system templates by non-admins
  if (template.isSystem && userId) {
    throw new Error('Cannot modify system templates');
  }

  // Prevent editing templates owned by other users
  if (template.createdBy && userId && template.createdBy !== userId) {
    throw new Error('Not authorized to modify this template');
  }

  // Remove protected fields from updates
  const { id, isSystem, createdBy, usageCount, createdAt, ...safeUpdates } = updates as any;

  return BookTemplate.findByIdAndUpdate(templateId, safeUpdates, { new: true });
}

// Delete a template
export async function deleteTemplate(templateId: string, userId?: string): Promise<boolean> {
  if (!isValidUUID(templateId)) {
    return false;
  }

  const template = await BookTemplate.findById(templateId);

  if (!template) {
    return false;
  }

  // Prevent deleting system templates
  if (template.isSystem) {
    throw new Error('Cannot delete system templates');
  }

  // Prevent deleting templates owned by other users
  if (template.createdBy && userId && template.createdBy !== userId) {
    throw new Error('Not authorized to delete this template');
  }

  await BookTemplate.findByIdAndDelete(templateId);
  return true;
}

// Clone a template
export async function cloneTemplate(
  templateId: string,
  userId: string,
  newName?: string
): Promise<IBookTemplate | null> {
  if (!isValidUUID(templateId)) {
    return null;
  }

  const originalTemplate = await BookTemplate.findById(templateId).lean();

  if (!originalTemplate) {
    return null;
  }

  // Remove id from original to let Supabase generate a new one
  const { id, ...templateData } = originalTemplate as any;

  // Create a clone with modified properties
  const clonedTemplate = await BookTemplate.create({
    ...templateData,
    name: newName || `${originalTemplate.name} (Copy)`,
    nameHe: newName || `${originalTemplate.nameHe} (העתק)`,
    isSystem: false,
    createdBy: userId,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return clonedTemplate;
}

// Apply template to a book
export async function applyTemplateToBook(
  bookId: string,
  templateId: string,
  userId: string
): Promise<IBook | null> {
  if (!isValidUUID(bookId) || !isValidUUID(templateId)) {
    return null;
  }

  const [book, template] = await Promise.all([
    Book.findById(bookId),
    BookTemplate.findById(templateId),
  ]);

  if (!book || !template) {
    return null;
  }

  // Verify user owns the book
  if (book.author !== userId) {
    throw new Error('Not authorized to modify this book');
  }

  // Build update object
  const pageLayout = {
    bodyFont: template.defaults.pageLayout.typography.bodyFont,
    fontSize: template.defaults.pageLayout.typography.bodyFontSize,
    lineHeight: template.defaults.pageLayout.typography.lineHeight,
    pageSize: template.defaults.pageSize as 'A4' | 'A5' | 'Letter' | 'Custom',
    customPageSize: template.defaults.customPageSize,
    margins: template.defaults.pageLayout.margins,
    includeTableOfContents: true,
    headerFooter: {
      includeHeader: template.defaults.pageLayout.header.enabled,
      includeFooter: template.defaults.pageLayout.footer.enabled,
      includePageNumbers: template.defaults.pageLayout.showPageNumber,
      pageNumberPosition: template.defaults.pageLayout.pageNumberPosition.includes('top') ? 'top' : 'bottom',
    },
  };

  // Build cover design if no cover exists
  let coverDesign = book.coverDesign;
  if (!book.coverDesign || !book.coverDesign.front) {
    coverDesign = {
      front: {
        type: 'gradient',
        backgroundColor: template.coverDefaults.frontCover.backgroundColor,
        gradientColors: template.coverDefaults.frontCover.gradientColors,
        title: {
          text: book.title,
          font: template.coverDefaults.frontCover.titleFont,
          size: template.coverDefaults.frontCover.titleSize,
          color: template.coverDefaults.frontCover.titleColor,
          position: template.coverDefaults.frontCover.titlePosition,
        },
        authorName: {
          text: '',
          font: template.coverDefaults.frontCover.authorFont,
          size: template.coverDefaults.frontCover.authorSize,
          color: template.coverDefaults.frontCover.authorColor,
        },
      },
      back: {
        backgroundColor: template.coverDefaults.backCover.backgroundColor,
        synopsis: book.synopsis || '',
      },
      spine: {
        width: 0,
        title: book.title,
        author: '',
        backgroundColor: template.coverDefaults.spine.backgroundColor,
      },
    };
  }

  // Increment template usage count
  await BookTemplate.findByIdAndUpdate(templateId, { $inc: { usageCount: 1 } });

  // Update book with template settings
  return Book.findByIdAndUpdate(
    bookId,
    { pageLayout, coverDesign, templateId },
    { new: true }
  );
}

// Save book layout as custom template
export async function saveBookAsTemplate(
  bookId: string,
  userId: string,
  templateName: string,
  templateNameHe: string,
  category: TemplateCategory = 'custom'
): Promise<IBookTemplate | null> {
  if (!isValidUUID(bookId)) {
    return null;
  }

  const book = await Book.findById(bookId);

  if (!book) {
    return null;
  }

  // Verify user owns the book
  if (book.author !== userId) {
    throw new Error('Not authorized to access this book');
  }

  // Create template from book layout
  const template = await BookTemplate.create({
    name: templateName,
    nameHe: templateNameHe,
    category,
    description: `Custom template created from "${book.title}"`,
    descriptionHe: `תבנית מותאמת שנוצרה מ"${book.title}"`,
    isSystem: false,
    createdBy: userId,
    defaults: {
      pageSize: book.pageLayout?.pageSize || 'A5',
      customPageSize: book.pageLayout?.customPageSize,
      pageLayout: {
        name: 'Custom',
        splitType: 'none',
        sections: [],
        columns: 1,
        columnGap: 20,
        header: {
          enabled: book.pageLayout?.headerFooter?.includeHeader || false,
          height: 40,
          content: {},
          style: {
            fontSize: 10,
            fontFamily: book.pageLayout?.bodyFont || 'Georgia',
            textColor: '#333333',
            showOnFirstPage: false,
            showOnOddPages: true,
            showOnEvenPages: true,
          },
        },
        footer: {
          enabled: book.pageLayout?.headerFooter?.includeFooter || true,
          height: 40,
          content: { center: '{pageNumber}' },
          style: {
            fontSize: 10,
            fontFamily: book.pageLayout?.bodyFont || 'Georgia',
            textColor: '#333333',
            showOnFirstPage: false,
            showOnOddPages: true,
            showOnEvenPages: true,
          },
        },
        background: {
          type: 'solid',
          color: '#ffffff',
        },
        margins: book.pageLayout?.margins || { top: 25, bottom: 25, left: 25, right: 25 },
        typography: {
          bodyFont: book.pageLayout?.bodyFont || 'Georgia',
          bodyFontSize: book.pageLayout?.fontSize || 12,
          lineHeight: book.pageLayout?.lineHeight || 1.6,
          textColor: '#000000',
          headingFont: book.pageLayout?.bodyFont || 'Georgia',
          headingFontSize: 18,
          headingColor: '#000000',
        },
        isRTL: book.language === 'he',
        showPageNumber: book.pageLayout?.headerFooter?.includePageNumbers || true,
        pageNumberPosition: 'bottom-center',
      },
    },
    pageTypes: {
      titlePage: { name: 'Custom Title', splitType: 'none', sections: [], columns: 1, columnGap: 20, header: { enabled: false, height: 0, content: {}, style: { fontSize: 10, fontFamily: 'Georgia', textColor: '#000', showOnOddPages: true, showOnEvenPages: true } }, footer: { enabled: false, height: 0, content: {}, style: { fontSize: 10, fontFamily: 'Georgia', textColor: '#000', showOnOddPages: true, showOnEvenPages: true } }, background: { type: 'solid', color: '#ffffff' }, margins: { top: 25, bottom: 25, left: 25, right: 25 }, typography: { bodyFont: 'Georgia', bodyFontSize: 12, lineHeight: 1.6, textColor: '#000', headingFont: 'Georgia', headingFontSize: 36, headingColor: '#000' }, isRTL: true, showPageNumber: false, pageNumberPosition: 'bottom-center' },
      tableOfContents: { name: 'Custom TOC', splitType: 'none', sections: [], columns: 1, columnGap: 20, header: { enabled: false, height: 0, content: {}, style: { fontSize: 10, fontFamily: 'Georgia', textColor: '#000', showOnOddPages: true, showOnEvenPages: true } }, footer: { enabled: true, height: 40, content: { center: '{pageNumber}' }, style: { fontSize: 10, fontFamily: 'Georgia', textColor: '#000', showOnOddPages: true, showOnEvenPages: true } }, background: { type: 'solid', color: '#ffffff' }, margins: { top: 25, bottom: 25, left: 25, right: 25 }, typography: { bodyFont: 'Georgia', bodyFontSize: 12, lineHeight: 2, textColor: '#000', headingFont: 'Georgia', headingFontSize: 18, headingColor: '#000' }, isRTL: true, showPageNumber: true, pageNumberPosition: 'bottom-center' },
      chapterOpener: { name: 'Custom Chapter', splitType: 'none', sections: [], columns: 1, columnGap: 20, header: { enabled: false, height: 0, content: {}, style: { fontSize: 10, fontFamily: 'Georgia', textColor: '#000', showOnOddPages: true, showOnEvenPages: true } }, footer: { enabled: false, height: 0, content: {}, style: { fontSize: 10, fontFamily: 'Georgia', textColor: '#000', showOnOddPages: true, showOnEvenPages: true } }, background: { type: 'solid', color: '#ffffff' }, margins: { top: 60, bottom: 25, left: 25, right: 25 }, typography: { bodyFont: 'Georgia', bodyFontSize: 12, lineHeight: 1.6, textColor: '#000', headingFont: 'Georgia', headingFontSize: 24, headingColor: '#000' }, isRTL: true, showPageNumber: false, pageNumberPosition: 'bottom-center' },
      bodyPage: { name: 'Custom Body', splitType: 'none', sections: [], columns: 1, columnGap: 20, header: { enabled: false, height: 0, content: {}, style: { fontSize: 10, fontFamily: 'Georgia', textColor: '#000', showOnOddPages: true, showOnEvenPages: true } }, footer: { enabled: true, height: 40, content: { center: '{pageNumber}' }, style: { fontSize: 10, fontFamily: 'Georgia', textColor: '#000', showOnOddPages: true, showOnEvenPages: true } }, background: { type: 'solid', color: '#ffffff' }, margins: { top: 25, bottom: 25, left: 25, right: 25 }, typography: { bodyFont: 'Georgia', bodyFontSize: 12, lineHeight: 1.6, textColor: '#000', headingFont: 'Georgia', headingFontSize: 18, headingColor: '#000' }, isRTL: true, showPageNumber: true, pageNumberPosition: 'bottom-center' },
    },
    coverDefaults: {
      frontCover: {
        backgroundColor: book.coverDesign?.front?.backgroundColor || '#1a1a2e',
        gradientColors: book.coverDesign?.front?.gradientColors,
        titlePosition: book.coverDesign?.front?.title?.position || { x: 50, y: 40 },
        authorPosition: { x: 50, y: 85 },
        titleFont: book.coverDesign?.front?.title?.font || 'Playfair Display',
        titleSize: book.coverDesign?.front?.title?.size || 36,
        titleColor: book.coverDesign?.front?.title?.color || '#ffffff',
        authorFont: book.coverDesign?.front?.authorName?.font || 'Inter',
        authorSize: book.coverDesign?.front?.authorName?.size || 14,
        authorColor: book.coverDesign?.front?.authorName?.color || '#cccccc',
      },
      backCover: {
        backgroundColor: book.coverDesign?.back?.backgroundColor || '#1a1a2e',
        synopsisPosition: { x: 50, y: 50 },
        synopsisFont: 'Georgia',
        synopsisFontSize: 12,
        synopsisColor: '#ffffff',
      },
      spine: {
        backgroundColor: book.coverDesign?.spine?.backgroundColor || '#1a1a2e',
        textColor: '#ffffff',
        fontSize: 10,
      },
    },
    aiSettings: {
      suggestedFonts: [book.pageLayout?.bodyFont || 'Georgia'],
      suggestedColorPalettes: [],
      imagePlacementRules: '',
      styleGuidelines: '',
    },
    tags: ['custom', 'user-created'],
    isActive: true,
    usageCount: 0,
  });

  return template;
}

// Get template recommendations based on book metadata
export async function getTemplateRecommendations(
  genre: string,
  targetAudience?: string,
  _writingGoal?: string
): Promise<IBookTemplate[]> {
  // Map genre to template categories
  const categoryMap: Record<string, TemplateCategory[]> = {
    'fantasy': ['novel', 'children'],
    'sci-fi': ['novel'],
    'romance': ['novel', 'personal-story'],
    'mystery': ['novel'],
    'thriller': ['novel'],
    'non-fiction': ['academic', 'self-help'],
    'self-help': ['self-help'],
    'humor': ['novel', 'personal-story'],
    'biography': ['personal-story'],
    'memoir': ['personal-story'],
    'poetry': ['poetry'],
    'cooking': ['cookbook'],
    'travel': ['travel', 'photo-album'],
    'children': ['children'],
    'photography': ['photo-album'],
  };

  // Get relevant categories
  const categories = categoryMap[genre.toLowerCase()] || ['novel', 'custom'];

  // Adjust based on target audience
  if (targetAudience === 'children') {
    categories.unshift('children');
  }

  // Get all active templates
  const allTemplates = await BookTemplate.find({ isActive: true });

  // Filter by categories
  let templates = allTemplates.filter(t => categories.includes(t.category as TemplateCategory));

  // Sort by usage count descending
  templates.sort((a, b) => b.usageCount - a.usageCount);

  // Limit to 5
  templates = templates.slice(0, 5);

  // Always include custom template
  const customTemplate = await BookTemplate.findOne({ category: 'custom', isSystem: true });
  if (customTemplate && !templates.find(t => t.category === 'custom')) {
    templates.push(customTemplate);
  }

  return templates;
}

// Search templates
export async function searchTemplates(
  query: string,
  options?: {
    category?: TemplateCategory;
    limit?: number;
  }
): Promise<IBookTemplate[]> {
  // Get all active templates
  let templates = await BookTemplate.find({ isActive: true });

  // Filter by category if specified
  if (options?.category) {
    templates = templates.filter(t => t.category === options.category);
  }

  // Filter by search query (case insensitive)
  const lowerQuery = query.toLowerCase();
  templates = templates.filter(t =>
    (t.name || '').toLowerCase().includes(lowerQuery) ||
    (t.nameHe || '').toLowerCase().includes(lowerQuery) ||
    (t.description || '').toLowerCase().includes(lowerQuery) ||
    (t.descriptionHe || '').toLowerCase().includes(lowerQuery) ||
    (t.tags || []).some(tag => tag.toLowerCase().includes(lowerQuery))
  );

  // Sort by usage count descending
  templates.sort((a, b) => b.usageCount - a.usageCount);

  // Limit results
  return templates.slice(0, options?.limit || 10);
}
