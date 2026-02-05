/**
 * Template Routes
 * API endpoints for book templates
 */

import { Router } from 'express';
import * as templateController from '../controllers/templateController';
import { auth, optionalAuth } from '../middleware/auth';

const router = Router();

// Public routes (no auth required)
router.get('/', templateController.getAllTemplates);
router.get('/system', templateController.getSystemTemplates);
router.get('/search', templateController.searchTemplates);
router.get('/recommendations', templateController.getTemplateRecommendations);
router.get('/category/:category', templateController.getTemplatesByCategory);
router.get('/:id', templateController.getTemplateById);

// Protected routes (auth required)
router.get('/user/my-templates', auth, templateController.getUserTemplates);
router.post('/', auth, templateController.createTemplate);
router.put('/:id', auth, templateController.updateTemplate);
router.delete('/:id', auth, templateController.deleteTemplate);
router.post('/:id/clone', auth, templateController.cloneTemplate);

// Book-template operations
router.post('/books/:bookId/apply-template', auth, templateController.applyTemplateToBook);
router.post('/books/:bookId/save-as-template', auth, templateController.saveBookAsTemplate);

export default router;
