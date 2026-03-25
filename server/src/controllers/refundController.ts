/**
 * Refund Controller
 * Handles refund requests, admin approval/rejection, and PayPal refund processing
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { Book } from '../models/Book';
import { supabaseAdmin } from '../config/supabase';
import { processPayPalRefund } from '../services/paypalService';
import {
  notifySystem,
  createNotification,
} from '../services/notificationService';
import { sendEmail } from '../services/emailService';
import crypto from 'crypto';

const uuidv4 = () => crypto.randomUUID();

// UUID validation helper
const isValidUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Refund request interface
interface IRefundRequest {
  id: string;
  transactionId: string;
  userId: string;
  bookId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  amount: number;
  currency: string;
  adminNotes?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Refund window: 7 days in milliseconds
const REFUND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Request a refund for a book purchase
 * POST /api/refunds/request
 */
export const requestRefund = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { transactionId, reason } = req.body;

    if (!transactionId || !reason) {
      res.status(400).json({
        success: false,
        error: 'Transaction ID and reason are required',
      });
      return;
    }

    if (!isValidUUID(transactionId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid transaction ID',
      });
      return;
    }

    // Find the transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
      return;
    }

    // Verify transaction belongs to user
    if (transaction.userId !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You can only request refunds for your own purchases',
      });
      return;
    }

    // Verify it's a book purchase
    const metadata = transaction.metadata as any;
    if (metadata?.type !== 'book_purchase') {
      res.status(400).json({
        success: false,
        error: 'Refunds are only available for book purchases',
      });
      return;
    }

    // Check if already refunded
    if (transaction.status === 'refunded') {
      res.status(400).json({
        success: false,
        error: 'This purchase has already been refunded',
      });
      return;
    }

    // Check if transaction is completed (can't refund pending/failed transactions)
    if (transaction.status !== 'completed') {
      res.status(400).json({
        success: false,
        error: 'Only completed purchases can be refunded',
      });
      return;
    }

    // Check 7-day refund window
    const purchaseDate = new Date(transaction.createdAt || transaction.created_at);
    const now = new Date();
    if (now.getTime() - purchaseDate.getTime() > REFUND_WINDOW_MS) {
      res.status(400).json({
        success: false,
        error: 'Refund window has expired. Refunds are only available within 7 days of purchase.',
        purchaseDate: purchaseDate.toISOString(),
        expiresAt: new Date(purchaseDate.getTime() + REFUND_WINDOW_MS).toISOString(),
      });
      return;
    }

    // Check if there's already a pending refund request for this transaction
    const { data: existingRequest } = await supabaseAdmin
      .from('refund_requests')
      .select('*')
      .eq('transaction_id', transactionId)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      res.status(400).json({
        success: false,
        error: 'A refund request for this purchase is already pending',
      });
      return;
    }

    // Create refund request
    const refundRequest = {
      id: uuidv4(),
      transaction_id: transactionId,
      user_id: req.user.id,
      book_id: metadata.bookId,
      reason: reason.trim(),
      status: 'pending',
      amount: transaction.amount,
      currency: transaction.currency,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabaseAdmin
      .from('refund_requests')
      .insert(refundRequest);

    if (insertError) {
      console.error('Error creating refund request:', insertError);
      res.status(500).json({
        success: false,
        error: 'Failed to create refund request',
      });
      return;
    }

    // Notify admins about new refund request
    const { data: admins } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'ADMIN');

    if (admins && admins.length > 0) {
      const user = await User.findById(req.user.id);
      const book = await Book.findById(metadata.bookId);

      for (const admin of admins) {
        await notifySystem(
          admin.id,
          'New Refund Request',
          `User ${user?.name || 'Unknown'} requested a refund for "${book?.title || 'Unknown Book'}" ($${transaction.amount})`,
          '/admin/refunds'
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Refund request submitted successfully',
      data: {
        id: refundRequest.id,
        status: 'pending',
        amount: transaction.amount,
        currency: transaction.currency,
      },
    });
  } catch (error: any) {
    console.error('Request refund error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit refund request',
    });
  }
};

/**
 * Get user's refund requests
 * GET /api/refunds
 */
export const getUserRefunds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { data: refunds, error } = await supabaseAdmin
      .from('refund_requests')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user refunds:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch refund requests',
      });
      return;
    }

    // Get book details for each refund
    const refundsWithDetails = await Promise.all(
      (refunds || []).map(async (refund) => {
        const book = await Book.findById(refund.book_id);
        return {
          id: refund.id,
          transactionId: refund.transaction_id,
          bookId: refund.book_id,
          bookTitle: book?.title || 'Unknown Book',
          reason: refund.reason,
          status: refund.status,
          amount: refund.amount,
          currency: refund.currency,
          adminNotes: refund.admin_notes,
          createdAt: refund.created_at,
          processedAt: refund.processed_at,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: refundsWithDetails,
    });
  } catch (error: any) {
    console.error('Get user refunds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch refund requests',
    });
  }
};

/**
 * Get all pending refund requests (Admin only)
 * GET /api/admin/refunds
 */
export const getAdminRefunds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { status } = req.query;

    let query = supabaseAdmin
      .from('refund_requests')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by status if provided, otherwise show all pending
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    const { data: refunds, error } = await query;

    if (error) {
      console.error('Error fetching admin refunds:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch refund requests',
      });
      return;
    }

    // Get detailed information for each refund
    const refundsWithDetails = await Promise.all(
      (refunds || []).map(async (refund) => {
        const [user, book, transaction] = await Promise.all([
          User.findById(refund.user_id),
          Book.findById(refund.book_id),
          Transaction.findById(refund.transaction_id),
        ]);

        const metadata = transaction?.metadata as any;

        return {
          id: refund.id,
          transactionId: refund.transaction_id,
          userId: refund.user_id,
          userName: user?.name || 'Unknown User',
          userEmail: user?.email || 'Unknown Email',
          bookId: refund.book_id,
          bookTitle: book?.title || 'Unknown Book',
          authorId: metadata?.authorId,
          authorName: metadata?.authorName || 'Unknown Author',
          reason: refund.reason,
          status: refund.status,
          amount: refund.amount,
          currency: refund.currency,
          authorShare: metadata?.authorShare || 0,
          platformShare: metadata?.platformShare || 0,
          paypalCaptureId: transaction?.paypalCaptureId,
          adminNotes: refund.admin_notes,
          processedBy: refund.processed_by,
          processedAt: refund.processed_at,
          createdAt: refund.created_at,
          purchasedAt: transaction?.createdAt || transaction?.created_at,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: refundsWithDetails,
      summary: {
        total: refundsWithDetails.length,
        pending: refundsWithDetails.filter(r => r.status === 'pending').length,
        approved: refundsWithDetails.filter(r => r.status === 'approved').length,
        rejected: refundsWithDetails.filter(r => r.status === 'rejected').length,
      },
    });
  } catch (error: any) {
    console.error('Get admin refunds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch refund requests',
    });
  }
};

/**
 * Approve a refund request (Admin only)
 * PUT /api/admin/refunds/:id/approve
 */
export const approveRefund = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;
    const { adminNotes } = req.body;

    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid refund request ID',
      });
      return;
    }

    // Get refund request
    const { data: refundRequest, error: fetchError } = await supabaseAdmin
      .from('refund_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !refundRequest) {
      res.status(404).json({
        success: false,
        error: 'Refund request not found',
      });
      return;
    }

    if (refundRequest.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: `Refund request has already been ${refundRequest.status}`,
      });
      return;
    }

    // Get transaction details
    const transaction = await Transaction.findById(refundRequest.transaction_id);
    if (!transaction) {
      res.status(404).json({
        success: false,
        error: 'Original transaction not found',
      });
      return;
    }

    const metadata = transaction.metadata as any;

    // 1. Process PayPal refund
    let refundResult;
    if (transaction.paypalCaptureId) {
      refundResult = await processPayPalRefund(
        transaction.paypalCaptureId,
        transaction.amount,
        transaction.currency,
        `Refund for book purchase: ${metadata.bookTitle}`
      );

      if (!refundResult.success) {
        res.status(400).json({
          success: false,
          error: refundResult.error || 'Failed to process PayPal refund',
        });
        return;
      }
    }

    // 2. Revoke book access from buyer
    const buyer = await User.findById(refundRequest.user_id);
    if (buyer && buyer.profile?.readingHistory) {
      const updatedReadingHistory = buyer.profile.readingHistory.filter(
        (item) => item.bookId !== refundRequest.book_id
      );

      const updatedProfile = {
        ...buyer.profile,
        readingHistory: updatedReadingHistory,
      };
      await User.findByIdAndUpdate(refundRequest.user_id, { profile: updatedProfile });
    }

    // 3. Deduct from author earnings
    const authorId = metadata?.authorId;
    const authorShare = metadata?.authorShare || 0;

    if (authorId && authorShare > 0) {
      const author = await User.findById(authorId);
      if (author && author.profile?.earnings) {
        const newPendingPayout = Math.max(0, (author.profile.earnings.pendingPayout || 0) - authorShare);
        const newTotalEarned = Math.max(0, (author.profile.earnings.totalEarned || 0) - authorShare);

        const updatedProfile = {
          ...author.profile,
          earnings: {
            ...author.profile.earnings,
            pendingPayout: newPendingPayout,
            totalEarned: newTotalEarned,
          },
        };
        await User.findByIdAndUpdate(authorId, { profile: updatedProfile });
      }
    }

    // 4. Update book statistics
    const book = await Book.findById(refundRequest.book_id);
    if (book) {
      const updatedStatistics = {
        ...book.statistics,
        purchases: Math.max(0, book.statistics.purchases - 1),
        revenue: Math.max(0, book.statistics.revenue - transaction.amount),
      };
      await Book.findByIdAndUpdate(refundRequest.book_id, { statistics: updatedStatistics });
    }

    // 5. Update transaction status to 'refunded'
    await Transaction.findByIdAndUpdate(refundRequest.transaction_id, {
      status: 'refunded',
      metadata: {
        ...metadata,
        refundedAt: new Date().toISOString(),
        refundedBy: req.user.id,
        refundRequestId: id,
        paypalRefundId: refundResult?.refundId,
      },
    });

    // 6. Update refund request status
    await supabaseAdmin
      .from('refund_requests')
      .update({
        status: 'approved',
        admin_notes: adminNotes || null,
        processed_by: req.user.id,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // 7. Send notifications to buyer and author
    // Notify buyer
    await createNotification({
      recipientId: refundRequest.user_id,
      type: 'payment',
      title: 'Refund Approved',
      message: `Your refund request for "${book?.title || 'the book'}" has been approved. $${transaction.amount} will be returned to your payment method.`,
      data: {
        refundId: id,
        amount: transaction.amount,
        currency: transaction.currency,
        link: '/library',
      },
    });

    // Notify author
    if (authorId) {
      await createNotification({
        recipientId: authorId,
        type: 'payment',
        title: 'Book Refund Processed',
        message: `A purchase of "${book?.title || 'your book'}" has been refunded. $${authorShare.toFixed(2)} has been deducted from your earnings.`,
        data: {
          bookId: refundRequest.book_id,
          amount: authorShare,
          link: '/dashboard',
        },
      });
    }

    // Send emails
    if (buyer) {
      await sendRefundApprovedEmail(
        buyer.email,
        buyer.name,
        book?.title || 'Unknown Book',
        transaction.amount,
        transaction.currency
      );
    }

    if (authorId) {
      const author = await User.findById(authorId);
      if (author) {
        await sendRefundNotificationToAuthor(
          author.email,
          author.name,
          book?.title || 'Unknown Book',
          buyer?.name || 'A customer',
          authorShare,
          transaction.currency
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Refund approved and processed successfully',
      data: {
        refundId: id,
        paypalRefundId: refundResult?.refundId,
        amount: transaction.amount,
        authorDeduction: authorShare,
        mockMode: refundResult?.mockMode,
      },
    });
  } catch (error: any) {
    console.error('Approve refund error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve refund',
    });
  }
};

/**
 * Reject a refund request (Admin only)
 * PUT /api/admin/refunds/:id/reject
 */
export const rejectRefund = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;
    const { adminNotes } = req.body;

    if (!isValidUUID(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid refund request ID',
      });
      return;
    }

    if (!adminNotes || adminNotes.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'A reason for rejection is required',
      });
      return;
    }

    // Get refund request
    const { data: refundRequest, error: fetchError } = await supabaseAdmin
      .from('refund_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !refundRequest) {
      res.status(404).json({
        success: false,
        error: 'Refund request not found',
      });
      return;
    }

    if (refundRequest.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: `Refund request has already been ${refundRequest.status}`,
      });
      return;
    }

    // Update refund request status
    await supabaseAdmin
      .from('refund_requests')
      .update({
        status: 'rejected',
        admin_notes: adminNotes.trim(),
        processed_by: req.user.id,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Get book details for notification
    const book = await Book.findById(refundRequest.book_id);
    const buyer = await User.findById(refundRequest.user_id);

    // Notify buyer
    await createNotification({
      recipientId: refundRequest.user_id,
      type: 'system',
      title: 'Refund Request Rejected',
      message: `Your refund request for "${book?.title || 'the book'}" has been rejected. Reason: ${adminNotes}`,
      data: {
        refundId: id,
        link: '/library',
      },
    });

    // Send email to buyer
    if (buyer) {
      await sendRefundRejectedEmail(
        buyer.email,
        buyer.name,
        book?.title || 'Unknown Book',
        adminNotes
      );
    }

    res.status(200).json({
      success: true,
      message: 'Refund request rejected',
      data: {
        refundId: id,
        status: 'rejected',
      },
    });
  } catch (error: any) {
    console.error('Reject refund error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject refund',
    });
  }
};

// ==================== EMAIL HELPERS ====================

async function sendRefundApprovedEmail(
  to: string,
  name: string,
  bookTitle: string,
  amount: number,
  currency: string
): Promise<boolean> {
  const content = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #10B981;">Refund Approved</h1>
      <p>Hello ${name},</p>
      <p>Your refund request for <strong>"${bookTitle}"</strong> has been approved.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Refund Amount:</strong> ${amount} ${currency}</p>
        <p style="margin: 10px 0 0;"><strong>Status:</strong> Processing</p>
      </div>
      <p>The refund will be credited to your original payment method within 5-10 business days.</p>
      <p>The book has been removed from your library.</p>
      <p>Thank you for using MeStory!</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Refund Approved - "${bookTitle}"`,
    html: content,
  });
}

async function sendRefundRejectedEmail(
  to: string,
  name: string,
  bookTitle: string,
  reason: string
): Promise<boolean> {
  const content = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #EF4444;">Refund Request Rejected</h1>
      <p>Hello ${name},</p>
      <p>Unfortunately, your refund request for <strong>"${bookTitle}"</strong> has been rejected.</p>
      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
        <p style="margin: 0;"><strong>Reason:</strong></p>
        <p style="margin: 10px 0 0;">${reason}</p>
      </div>
      <p>If you have any questions or believe this decision was made in error, please contact our support team.</p>
      <p>Thank you for your understanding.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Refund Request Rejected - "${bookTitle}"`,
    html: content,
  });
}

async function sendRefundNotificationToAuthor(
  to: string,
  authorName: string,
  bookTitle: string,
  buyerName: string,
  amount: number,
  currency: string
): Promise<boolean> {
  const content = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #F59E0B;">Book Refund Processed</h1>
      <p>Hello ${authorName},</p>
      <p>A refund has been processed for your book <strong>"${bookTitle}"</strong>.</p>
      <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
        <p style="margin: 0;"><strong>Customer:</strong> ${buyerName}</p>
        <p style="margin: 10px 0 0;"><strong>Amount Deducted:</strong> ${amount.toFixed(2)} ${currency}</p>
      </div>
      <p>This amount has been deducted from your pending payout balance.</p>
      <p>You can view your updated earnings in your dashboard.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Refund Processed - "${bookTitle}"`,
    html: content,
  });
}
