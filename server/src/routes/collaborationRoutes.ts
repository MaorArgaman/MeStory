import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  inviteCollaborator,
  getInvitations,
  respondToInvitation,
  getCollaborators,
  removeCollaborator,
  updateCollaboratorRole,
  getMyInvitations,
  getCollaborativeBooks,
  getInvitationByToken,
} from '../controllers/collaborationController';

const router = express.Router();

// ===== BOOK OWNER ROUTES =====

// Invite a collaborator to a book
router.post('/:bookId/invite', authenticate, inviteCollaborator);

// Get all invitations for a book (owner only)
router.get('/:bookId/invitations', authenticate, getInvitations);

// Get all collaborators for a book
router.get('/:bookId/collaborators', authenticate, getCollaborators);

// Remove a collaborator from a book
router.delete('/:bookId/collaborators/:collaboratorId', authenticate, removeCollaborator);

// Update collaborator role
router.put('/:bookId/collaborators/:collaboratorId', authenticate, updateCollaboratorRole);

// ===== PUBLIC ROUTES =====

// Get invitation details by token (no auth required - for preview before login)
router.get('/invitation/:token', getInvitationByToken);

// ===== INVITEE ROUTES =====

// Get my pending invitations (across all books)
router.get('/my-invitations', authenticate, getMyInvitations);

// Respond to an invitation (accept/decline)
router.post('/respond/:token', authenticate, respondToInvitation);

// Get books I'm collaborating on
router.get('/my-collaborations', authenticate, getCollaborativeBooks);

export default router;
