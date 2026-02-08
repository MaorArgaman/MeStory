/**
 * Template Service
 * CRUD operations for book templates
 */

import mongoose from 'mongoose';
import { BookTemplate, IBookTemplate, TemplateCategory } from '../models/BookTemplate';
import { Book, IBook } from '../models/Book';
import { defaultTemplates } from '../data/defaultTemplates';

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

  let queryBuilder = BookTemplate.find(query)
    .sort({ isSystem: -1, usageCount: -1, createdAt: -1 });

  if (options?.skip) {
    queryBuilder = queryBuilder.skip(options.skip);
  }

  if (options?.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }

  return queryBuilder.exec();
}

// Get template by ID
export async function getTemplateById(templateId: string): Promise<IBookTemplate | null> {
  if (!mongoose.Types.ObjectId.isValid(templateId)) {
    return null;
  }

  return BookTemplate.findById(templateId).exec();
}

// Get templates by category
export async function getTemplatesByCategory(category: TemplateCategory): Promise<IBookTemplate[]> {
  return BookTemplate.find({ category, isActive: true })
    .sort({ usageCount: -1 })
    .exec();
}

// Get system templates only
export async function getSystemTemplates(): Promise<IBookTemplate[]> {
  return BookTemplate.find({ isSystem: true, isActive: true })
    .sort({ category: 1 })
    .exec();
}

// Get user's custom templates
export async function getUserTemplates(userId: string): Promise<IBookTemplate[]> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return [];
  }

  return BookTemplate.find({ createdBy: userId, isSystem: false })
    .sort({ createdAt: -1 })
    .exec();
}

// Create a new template
export async function createTemplate(
  templateData: Partial<IBookTemplate>,
  userId?: string
): Promise<IBookTemplate> {
  const template = new BookTemplate({
    ...templateData,
    isSystem: false,
    createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
    usageCount: 0,
    isActive: true,
  });

  return template.save();
}

// Update a template
export async function updateTemplate(
  templateId: string,
  updates: Partial<IBookTemplate>,
  userId?: string
): Promise<IBookTemplate | null> {
  if (!mongoose.Types.ObjectId.isValid(templateId)) {
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
  if (template.createdBy && userId && template.createdBy.toString() !== userId) {
    throw new Error('Not authorized to modify this template');
  }

  // Remove protected fields from updates
  const { _id, isSystem, createdBy, usageCount, createdAt, ...safeUpdates } = updates as any;

  Object.assign(template, safeUpdates);

  return template.save();
}

// Delete a template
export async function deleteTemplate(templateId: string, userId?: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(templateId)) {
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
  if (template.createdBy && userId && template.createdBy.toString() !== userId) {
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
  if (!mongoose.Types.ObjectId.isValid(templateId)) {
    return null;
  }

  const originalTemplate = await BookTemplate.findById(templateId).lean();

  if (!originalTemplate) {
    return null;
  }

  // Create a clone with modified properties
  const clonedTemplate = new BookTemplate({
    ...originalTemplate,
    _id: new mongoose.Types.ObjectId(),
    name: newName || `${originalTemplate.name} (Copy)`,
    nameHe: newName || `${originalTemplate.nameHe} (העתק)`,
    isSystem: false,
    createdBy: new mongoose.Types.ObjectId(userId),
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return clonedTemplate.save();
}

// Apply template to a book
export async function applyTemplateToBook(
  bookId: string,
  templateId: string,
  userId: string
): Promise<IBook | null> {
  if (!mongoose.Types.ObjectId.isValid(bookId) || !mongoose.Types.ObjectId.isValid(templateId)) {
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
  if (book.author.toString() !== userId) {
    throw new Error('Not authorized to modify this book');
  }

  // Apply template settings to book
  book.pageLayout = {
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

  // Apply cover defaults if no cover exists
  if (!book.coverDesign || !book.coverDesign.front) {
    book.coverDesign = {
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

  // Store template reference (add to book model if needed)
  (book as any).templateId = new mongoose.Types.ObjectId(templateId);

  // Increment template usage count
  await BookTemplate.findByIdAndUpdate(templateId, { $inc: { usageCount: 1 } });

  return book.save();
}

// Save book layout as custom template
export async function saveBookAsTemplate(
  bookId: string,
  userId: string,
  templateName: string,
  templateNameHe: string,
  category: TemplateCategory = 'custom'
): Promise<IBookTemplate | null> {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return null;
  }

  const book = await Book.findById(bookId);

  if (!book) {
    return null;
  }

  // Verify user owns the book
  if (book.author.toString() !== userId) {
    throw new Error('Not authorized to access this book');
  }

  // Create template from book layout
  const template = new BookTemplate({
    name: templateName,
    nameHe: templateNameHe,
    category,
    description: `Custom template created from "${book.title}"`,
    descriptionHe: `תבנית מותאמת שנוצרה מ"${book.title}"`,
    isSystem: false,
    createdBy: new mongoose.Types.ObjectId(userId),
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

  return template.save();
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

  // Get templates from relevant categories
  const templates = await BookTemplate.find({
    category: { $in: categories },
    isActive: true,
  })
    .sort({ usageCount: -1 })
    .limit(5)
    .exec();

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
  const searchQuery: any = {
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { nameHe: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { descriptionHe: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } },
    ],
  };

  if (options?.category) {
    searchQuery.category = options.category;
  }

  return BookTemplate.find(searchQuery)
    .sort({ usageCount: -1 })
    .limit(options?.limit || 10)
    .exec();
}
