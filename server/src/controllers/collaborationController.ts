import { Request, Response } from 'express';
import { Book, ICollaborator, IBookInvitation } from '../models/Book';
import crypto from 'crypto';

// Generate unique invitation token
const generateInvitationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Invite a collaborator to a book
export const inviteCollaborator = async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const { email, name, relationship, personalMessage } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
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

    // Check if already invited
    const existingInvitation = book.invitations?.find(inv => inv.email === email && inv.status === 'pending');
    if (existingInvitation) {
      return res.status(400).json({ success: false, error: 'This person has already been invited' });
    }

    // Check if already a collaborator
    const existingCollaborator = book.collaborators?.find(c => c.email === email);
    if (existingCollaborator) {
      return res.status(400).json({ success: false, error: 'This person is already a collaborator' });
    }

    // Create invitation
    const invitation: IBookInvitation = {
      id: crypto.randomUUID(),
      email,
      name,
      relationship,
      personalMessage,
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

    // TODO: Send email notification to invitee
    // await sendInvitationEmail(email, name, book.title, invitation.token, personalMessage);

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
        invitationLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/invitation/${invitation.token}`,
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

    const updatedCollaborators = (book.collaborators || []).filter(c => c.id !== collaboratorId);

    await Book.findByIdAndUpdate(bookId, {
      $set: { collaborators: updatedCollaborators }
    });

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
    const userId = req.user?.id;
    const userEmail = req.user?.email;

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
        inv => inv.email === userEmail && inv.status === 'pending'
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
    const userEmail = req.user?.email;
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

    // Check email matches
    if (targetInvitation.email !== userEmail) {
      return res.status(403).json({ success: false, error: 'This invitation was sent to a different email address' });
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
        role: 'contributor',
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

    // Return invitation details (without sensitive data)
    res.json({
      success: true,
      data: {
        bookId: targetBook.id,
        bookTitle: targetBook.title,
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
