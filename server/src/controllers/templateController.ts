/**
 * Template Controller
 * API handlers for book templates
 */

import { Request, Response } from 'express';
import * as templateService from '../services/templateService';
import { TemplateCategory } from '../models/BookTemplate';

// Get all templates
export async function getAllTemplates(req: Request, res: Response) {
  try {
    const { category, limit, skip } = req.query;

    const templates = await templateService.getAllTemplates({
      category: category as TemplateCategory,
      isActive: true,
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined,
    });

    res.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch templates',
    });
  }
}

// Get template by ID
export async function getTemplateById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const template = await templateService.getTemplateById(id);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    res.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch template',
    });
  }
}

// Get templates by category
export async function getTemplatesByCategory(req: Request, res: Response): Promise<void> {
  try {
    const { category } = req.params;

    if (!isValidCategory(category)) {
      res.status(400).json({
        success: false,
        error: 'Invalid category',
      });
      return;
    }

    const templates = await templateService.getTemplatesByCategory(category as TemplateCategory);

    res.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error: any) {
    console.error('Error fetching templates by category:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch templates',
    });
  }
}

// Get system templates
export async function getSystemTemplates(_req: Request, res: Response): Promise<void> {
  try {
    const templates = await templateService.getSystemTemplates();

    res.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error: any) {
    console.error('Error fetching system templates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch system templates',
    });
  }
}

// Get user's custom templates
export async function getUserTemplates(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const templates = await templateService.getUserTemplates(userId);

    res.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error: any) {
    console.error('Error fetching user templates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user templates',
    });
  }
}

// Create a new template
export async function createTemplate(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const templateData = req.body;

    // Validate required fields
    if (!templateData.name || !templateData.nameHe || !templateData.category) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, nameHe, category',
      });
      return;
    }

    const template = await templateService.createTemplate(templateData, userId);

    res.status(201).json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create template',
    });
  }
}

// Update a template
export async function updateTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const updates = req.body;

    const template = await templateService.updateTemplate(id, updates, userId);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    res.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('Error updating template:', error);
    res.status(error.message.includes('Not authorized') ? 403 : 500).json({
      success: false,
      error: error.message || 'Failed to update template',
    });
  }
}

// Delete a template
export async function deleteTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const deleted = await templateService.deleteTemplate(id, userId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    res.status(error.message.includes('Not authorized') || error.message.includes('Cannot delete') ? 403 : 500).json({
      success: false,
      error: error.message || 'Failed to delete template',
    });
  }
}

// Clone a template
export async function cloneTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { name } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const template = await templateService.cloneTemplate(id, userId, name);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    res.status(201).json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('Error cloning template:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clone template',
    });
  }
}

// Apply template to a book
export async function applyTemplateToBook(req: Request, res: Response): Promise<void> {
  try {
    const { bookId } = req.params;
    const { templateId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!templateId) {
      res.status(400).json({
        success: false,
        error: 'Template ID is required',
      });
      return;
    }

    const book = await templateService.applyTemplateToBook(bookId, templateId, userId);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book or template not found',
      });
      return;
    }

    res.json({
      success: true,
      book,
    });
  } catch (error: any) {
    console.error('Error applying template to book:', error);
    res.status(error.message.includes('Not authorized') ? 403 : 500).json({
      success: false,
      error: error.message || 'Failed to apply template',
    });
  }
}

// Save book as template
export async function saveBookAsTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { bookId } = req.params;
    const { name, nameHe, category } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!name || !nameHe) {
      res.status(400).json({
        success: false,
        error: 'Template name (name, nameHe) is required',
      });
      return;
    }

    const template = await templateService.saveBookAsTemplate(
      bookId,
      userId,
      name,
      nameHe,
      category
    );

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    res.status(201).json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('Error saving book as template:', error);
    res.status(error.message.includes('Not authorized') ? 403 : 500).json({
      success: false,
      error: error.message || 'Failed to save book as template',
    });
  }
}

// Get template recommendations
export async function getTemplateRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const { genre, targetAudience, writingGoal } = req.query;

    if (!genre) {
      res.status(400).json({
        success: false,
        error: 'Genre is required',
      });
      return;
    }

    const templates = await templateService.getTemplateRecommendations(
      genre as string,
      targetAudience as string,
      writingGoal as string
    );

    res.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error: any) {
    console.error('Error getting template recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recommendations',
    });
  }
}

// Search templates
export async function searchTemplates(req: Request, res: Response): Promise<void> {
  try {
    const { q, category, limit } = req.query;

    if (!q) {
      res.status(400).json({
        success: false,
        error: 'Search query (q) is required',
      });
      return;
    }

    const templates = await templateService.searchTemplates(q as string, {
      category: category as TemplateCategory,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error: any) {
    console.error('Error searching templates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search templates',
    });
  }
}

// Helper function to validate category
function isValidCategory(category: string): boolean {
  const validCategories = [
    'academic',
    'personal-story',
    'children',
    'novel',
    'poetry',
    'self-help',
    'cookbook',
    'travel',
    'photo-album',
    'custom',
  ];
  return validCategories.includes(category);
}
