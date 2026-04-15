import express from 'express';
import { authenticate } from '../middleware/auth';
import { inviteLimiter } from '../middleware/rateLimiter';
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
  leaveCollaboration,
} from '../controllers/collaborationController';

const router = express.Router();

// ===== BOOK OWNER ROUTES =====

// Invite a collaborator to a book (rate-limited — BUG-002)
router.post('/:bookId/invite', authenticate, inviteLimiter, inviteCollaborator);

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

// Leave a collaboration (removes self from collaborators) — BUG-012
router.delete('/:bookId/leave', authenticate, leaveCollaboration);

export default router;
