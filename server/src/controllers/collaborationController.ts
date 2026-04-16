import { Request, Response } from 'express';
import { Book, ICollaborator, IBookInvitation } from '../models/Book';
import { notifyCollaboratorRemoved } from '../services/socketService';
import crypto from 'crypto';

// Generate unique invitation token
const generateInvitationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Normalize email for consistent comparison across invite / accept / duplicate-check.
const normalizeEmail = (email: unknown): string =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

// Allowed relationship values (mirrors the frontend modal)
const VALID_RELATIONSHIPS = new Set([
  'spouse',
  'parent',
  'child',
  'sibling',
  'grandparent',
  'grandchild',
  'friend',
  'other',
]);

// Allowed collaborator roles
const VALID_ROLES = new Set(['editor', 'commenter', 'viewer']);

// Invite a collaborator to a book
export const inviteCollaborator = async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const userId = req.user?.id;
    const userEmail = normalizeEmail(req.user?.email);

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // --- Input validation (BUG-014) ---
    const rawEmail = req.body?.email;
    const rawName = req.body?.name;
    const rawRelationship = req.body?.relationship;
    const rawMessage = req.body?.personalMessage;

    const email = normalizeEmail(rawEmail);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'A valid email is required' });
    }

    const name = typeof rawName === 'string' ? rawName.trim() : '';
    if (!name || name.length > 120) {
      return res.status(400).json({ success: false, error: 'Name is required (1–120 characters)' });
    }

    const relationship = typeof rawRelationship === 'string' ? rawRelationship.trim() : '';
    if (!VALID_RELATIONSHIPS.has(relationship)) {
      return res.status(400).json({ success: false, error: 'Invalid relationship value' });
    }

    const personalMessage =
      typeof rawMessage === 'string' ? rawMessage.trim().slice(0, 1000) : '';

    // Optional role - default to 'editor' (full write access)
    const rawRole = req.body?.role;
    const inviteRole = typeof rawRole === 'string' && VALID_ROLES.has(rawRole) ? rawRole : 'editor';

    // --- Self-invite guard (BUG-008) ---
    if (email === userEmail) {
      return res.status(400).json({ success: false, error: 'You cannot invite yourself' });
    }

    // Find the book
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    // Check if user is the owner
    if (book.author !== userId) {
      return res.status(403).json({ success: false, error: 'Only the book owner can invite collaborators' });
    }

    // Check if already invited (normalized compare — BUG-009)
    const existingInvitation = book.invitations?.find(
      (inv) => normalizeEmail(inv.email) === email && inv.status === 'pending'
    );
    if (existingInvitation) {
      return res.status(400).json({ success: false, error: 'This person has already been invited' });
    }

    // Check if already a collaborator (normalized compare — BUG-009)
    const existingCollaborator = book.collaborators?.find(
      (c) => normalizeEmail(c.email) === email
    );
    if (existingCollaborator) {
      return res.status(400).json({ success: false, error: 'This person is already a collaborator' });
    }

    // Create invitation with the chosen role
    const invitation: IBookInvitation = {
      id: crypto.randomUUID(),
      email,
      name,
      relationship,
      personalMessage,
      role: inviteRole as any,
      token: generateInvitationToken(),
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      createdAt: new Date().toISOString(),
    };

    // Update book with new invitation
    const updatedInvitations = [...(book.invitations || []), invitation];

    await Book.findByIdAndUpdate(bookId, {
      $set: {
        invitations: updatedInvitations,
        isCollaborative: true,
        bookType: 'collaborative',
      }
    });

    // Send invitation email (BUG-003) — best-effort; do not fail the request if email is down
    const invitationLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/invitation/${invitation.token}`;
    try {
      const { sendInvitationEmail } = await import('../services/emailService');
      await sendInvitationEmail({
        to: email,
        inviteeName: name,
        bookTitle: book.title,
        inviterName: req.user?.name || 'A friend',
        personalMessage,
        invitationLink,
      });
    } catch (emailErr) {
      console.warn('[collaboration] Invitation email failed to send:', emailErr);
    }

    res.status(201).json({
      success: true,
      data: {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          name: invitation.name,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
        },
        invitationLink,
      }
    });
  } catch (error) {
    console.error('Error inviting collaborator:', error);
    if (!res.headersSent) res.status(500).json({ success: false, error: 'Failed to invite collaborator' });
  }
};

// Get all invitations for a book
export const getInvitations = async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const userId = req.user?.id;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    // Only owner can see all invitations
    if (book.author !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      data: book.invitations || [],
    });
  } catch (error) {
    console.error('Error getting invitations:', error);
    if (!res.headersSent) res.status(500).json({ success: false, error: 'Failed to get invitations' });
  }
};

// Get all collaborators for a book
export const getCollaborators = async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const userId = req.user?.id;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    // Check if user is owner or collaborator
    const isOwner = book.author === userId;
    const isCollaborator = book.collaborators?.some(c => c.userId === userId);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      data: book.collaborators || [],
    });
  } catch (error) {
    console.error('Error getting collaborators:', error);
    if (!res.headersSent) res.status(500).json({ success: false, error: 'Failed to get collaborators' });
  }
};

// Remove a collaborator
export const removeCollaborator = async (req: Request, res: Response) => {
  try {
    const { bookId, collaboratorId } = req.params;
    const userId = req.user?.id;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    if (book.author !== userId) {
      return res.status(403).json({ success: false, error: 'Only the book owner can remove collaborators' });
    }

    // Find the collaborator being removed so we can notify them
    const removedCollab = (book.collaborators || []).find(c => c.id === collaboratorId);
    const updatedCollaborators = (book.collaborators || []).filter(c => c.id !== collaboratorId);

    await Book.findByIdAndUpdate(bookId, {
      $set: { collaborators: updatedCollaborators }
    });

    // BUG-007: Notify removed user via socket so their editor closes gracefully
    if (removedCollab?.userId) {
      notifyCollaboratorRemoved(removedCollab.userId, bookId, book.title);
    }

    res.json({
      success: true,
      message: 'Collaborator removed successfully',
    });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    if (!res.headersSent) res.status(500).json({ success: false, error: 'Failed to remove collaborator' });
  }
};

// Update collaborator role
export const updateCollaboratorRole = async (req: Request, res: Response) => {
  try {
    const { bookId, collaboratorId } = req.params;
    const { role, assignedChapters } = req.body;
    const userId = req.user?.id;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    if (book.author !== userId) {
      return res.status(403).json({ success: false, error: 'Only the book owner can update collaborator roles' });
    }

    // Validate role enum (BUG-004)
    if (role !== undefined && !VALID_ROLES.has(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${[...VALID_ROLES].join(', ')}`,
      });
    }

    const updatedCollaborators = (book.collaborators || []).map(c => {
      if (c.id === collaboratorId) {
        return {
          ...c,
          role: role || c.role,
          assignedChapters: assignedChapters || c.assignedChapters,
        };
      }
      return c;
    });

    await Book.findByIdAndUpdate(bookId, {
      $set: { collaborators: updatedCollaborators }
    });

    res.json({
      success: true,
      message: 'Collaborator updated successfully',
    });
  } catch (error) {
    console.error('Error updating collaborator:', error);
    if (!res.headersSent) res.status(500).json({ success: false, error: 'Failed to update collaborator' });
  }
};

// Get my pending invitations
export const getMyInvitations = async (req: Request, res: Response) => {
  try {
    const userEmail = normalizeEmail(req.user?.email);

    if (!userEmail) {
      return res.status(400).json({ success: false, error: 'User email not found' });
    }

    // Use efficient query to find books with pending invitations for this email
    const books = await Book.findByPendingInvitationEmail(userEmail);

    const myInvitations: Array<{
      bookId: string;
      bookTitle: string;
      invitation: IBookInvitation;
    }> = [];

    for (const book of books) {
      const pendingInvitation = book.invitations?.find(
        (inv) => normalizeEmail(inv.email) === userEmail && inv.status === 'pending'
      );
      if (pendingInvitation) {
        myInvitations.push({
          bookId: book.id,
          bookTitle: book.title,
          invitation: pendingInvitation,
        });
      }
    }

    res.json({
      success: true,
      data: myInvitations,
    });
  } catch (error) {
    console.error('Error getting my invitations:', error);
    if (!res.headersSent) res.status(500).json({ success: false, error: 'Failed to get invitations' });
  }
};

// Respond to an invitation
export const respondToInvitation = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { accept } = req.body;
    const userId = req.user?.id;
    const userEmail = normalizeEmail(req.user?.email);
    const userName = req.user?.name;

    if (!userId || !userEmail) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Use efficient query to find the book with this invitation token
    const targetBook = await Book.findByInvitationToken(token);

    if (!targetBook) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    const targetInvitation = targetBook.invitations?.find(inv => inv.token === token);

    if (!targetInvitation) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    // Check if invitation is still valid
    if (targetInvitation.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Invitation has already been responded to' });
    }

    if (new Date(targetInvitation.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, error: 'Invitation has expired' });
    }

    // Check email matches (normalized — BUG-009)
    if (normalizeEmail(targetInvitation.email) !== userEmail) {
      return res.status(403).json({
        success: false,
        error: `This invitation was sent to ${targetInvitation.email}. Please log in with that email to accept it.`,
      });
    }

    // Update invitation status
    const updatedInvitations = (targetBook.invitations || []).map(inv => {
      if (inv.token === token) {
        return {
          ...inv,
          status: accept ? 'accepted' : 'declined' as const,
          respondedAt: new Date().toISOString(),
        };
      }
      return inv;
    });

    if (accept) {
      // Add as collaborator
      const newCollaborator: ICollaborator = {
        id: crypto.randomUUID(),
        userId,
        email: userEmail,
        name: userName || targetInvitation.name,
        role: targetInvitation.role || 'editor',
        relationship: targetInvitation.relationship,
        assignedChapters: [],
        contributedChapters: [],
        status: 'active',
        joinedAt: new Date().toISOString(),
        invitedAt: targetInvitation.createdAt,
        invitedBy: targetBook.author,
      };

      const updatedCollaborators = [...(targetBook.collaborators || []), newCollaborator];

      await Book.findByIdAndUpdate(targetBook.id, {
        $set: {
          invitations: updatedInvitations,
          collaborators: updatedCollaborators,
        }
      });

      res.json({
        success: true,
        message: 'You have joined the book as a collaborator',
        data: {
          bookId: targetBook.id,
          bookTitle: targetBook.title,
        }
      });
    } else {
      await Book.findByIdAndUpdate(targetBook.id, {
        $set: { invitations: updatedInvitations }
      });

      res.json({
        success: true,
        message: 'Invitation declined',
      });
    }
  } catch (error) {
    console.error('Error responding to invitation:', error);
    if (!res.headersSent) res.status(500).json({ success: false, error: 'Failed to respond to invitation' });
  }
};

// Get invitation details by token (public - no auth required)
export const getInvitationByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Use efficient query to find the book with this invitation token
    const targetBook = await Book.findByInvitationToken(token);

    if (!targetBook) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    const targetInvitation = targetBook.invitations?.find(inv => inv.token === token);

    if (!targetInvitation) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    // Check if invitation is still valid
    if (targetInvitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: targetInvitation.status === 'accepted'
          ? 'This invitation has already been accepted'
          : 'This invitation is no longer valid'
      });
    }

    if (new Date(targetInvitation.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, error: 'This invitation has expired' });
    }

    // Look up the inviter's name (book owner) to display on the acceptance page
    let inviterName = 'A friend';
    try {
      const { User } = await import('../models/User');
      const inviter = await User.findById(targetBook.author);
      if (inviter?.name) inviterName = inviter.name;
    } catch {
      // non-fatal
    }

    // Return invitation details (without sensitive data)
    res.json({
      success: true,
      data: {
        bookId: targetBook.id,
        bookTitle: targetBook.title,
        inviterName,
        relationship: targetInvitation.relationship,
        personalMessage: targetInvitation.personalMessage,
        inviteeName: targetInvitation.name,
        memorialDedication: targetBook.memorialDedication ? {
          name: targetBook.memorialDedication.name,
          relationship: targetBook.memorialDedication.relationship,
        } : null,
      }
    });
  } catch (error) {
    console.error('Error getting invitation:', error);
    if (!res.headersSent) res.status(500).json({ success: false, error: 'Failed to get invitation' });
  }
};

// Transfer book ownership to a collaborator
export const transferOwnership = async (req: Request, res: Response) => {
  try {
    const { bookId, collaboratorId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    // Only current owner can transfer
    if (book.author !== userId) {
      return res.status(403).json({ success: false, error: 'Only the book owner can transfer ownership' });
    }

    // Find the target collaborator
    const targetCollab = (book.collaborators || []).find(c => c.id === collaboratorId);
    if (!targetCollab || !targetCollab.userId) {
      return res.status(404).json({ success: false, error: 'Collaborator not found or has no linked account' });
    }

    const newOwnerId = targetCollab.userId;
    const newOwnerEmail = targetCollab.email;
    const newOwnerName = targetCollab.name;

    // Remove the new owner from collaborators and add the old owner as editor
    const updatedCollaborators = (book.collaborators || [])
      .filter(c => c.id !== collaboratorId)
      .concat({
        id: require('crypto').randomUUID(),
        userId,
        email: req.user?.email || '',
        name: req.user?.name || '',
        role: 'editor' as const,
        relationship: 'owner',
        assignedChapters: [],
        contributedChapters: [],
        status: 'active' as const,
        joinedAt: new Date().toISOString(),
        invitedAt: new Date().toISOString(),
        invitedBy: newOwnerId,
      });

    await Book.findByIdAndUpdate(bookId, {
      $set: {
        author: newOwnerId,
        collaborators: updatedCollaborators,
      }
    });

    // Notify the new owner via socket
    const { sendNotificationToUser } = await import('../services/socketService');
    sendNotificationToUser(newOwnerId, {
      type: 'collaboration:ownership-transferred',
      bookId,
      bookTitle: book.title,
      message: `You are now the owner of "${book.title}"`,
    });

    res.json({
      success: true,
      message: `Ownership transferred to ${newOwnerName}`,
      data: { newOwnerId, newOwnerName },
    });
  } catch (error) {
    console.error('Error transferring ownership:', error);
    if (!res.headersSent) res.status(500).json({ success: false, error: 'Failed to transfer ownership' });
  }
};

// Leave a collaboration (self-service) — BUG-012
export const leaveCollaboration = async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    // Owner cannot "leave" — they have to delete the book instead
    if (book.author === userId) {
      return res.status(400).json({
        success: false,
        error: 'Book owners cannot leave. Delete the book or transfer ownership instead.',
      });
    }

    const collaborators = book.collaborators || [];
    const wasCollaborator = collaborators.some((c) => c.userId === userId);
    if (!wasCollaborator) {
      return res.status(404).json({
        success: false,
        error: 'You are not a collaborator on this book',
      });
    }

    const updatedCollaborators = collaborators.filter((c) => c.userId !== userId);
    await Book.findByIdAndUpdate(bookId, {
      $set: { collaborators: updatedCollaborators },
    });

    res.json({
      success: true,
      message: 'You have left the collaboration',
    });
  } catch (error) {
    console.error('Error leaving collaboration:', error);
    if (!res.headersSent) res.status(500).json({ success: false, error: 'Failed to leave collaboration' });
  }
};

// Get books I'm collaborating on
export const getCollaborativeBooks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Use efficient query to find books where user is a collaborator
    const myCollaborations = await Book.findByCollaboratorId(userId);

    res.json({
      success: true,
      data: myCollaborations.map(book => ({
        id: book.id,
        title: book.title,
        memorialDedication: book.memorialDedication,
        myRole: book.collaborators?.find(c => c.userId === userId)?.role,
        collaboratorsCount: book.collaborators?.length || 0,
        chaptersCount: book.chapters?.length || 0,
      })),
    });
  } catch (error) {
    console.error('Error getting collaborative books:', error);
    if (!res.headersSent) res.status(500).json({ success: false, error: 'Failed to get collaborative books' });
  }
};
