/**
 * PayPal Webhook Controller
 * Handles PayPal webhook events for payment status updates
 */

import { Request, Response } from 'express';
import axios from 'axios';
import { Transaction } from '../models/Transaction';
import { User, UserRole } from '../models/User';
import { Book } from '../models/Book';
import {
  notifyPaymentReceived,
  notifySubscriptionChange,
  notifySystem,
  notifyBookPurchase,
} from '../services/notificationService';
import {
  sendPayPalReceiptEmail,
  sendSubscriptionUpgradeEmail,
} from '../services/emailService';
import { generateInvoiceForTransaction } from '../services/invoiceService';

// PayPal API Configuration
const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

// Revenue split configuration
const AUTHOR_SHARE_PERCENTAGE = parseInt(process.env.AUTHOR_REVENUE_PERCENTAGE || '50') / 100;

// Token cache for PayPal access tokens
let cachedToken: { token: string; expiresAt: Date } | null = null;

/**
 * Get PayPal access token (with caching)
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > new Date()) {
    return cachedToken.token;
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Cache token with expiration (60s buffer)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + response.data.expires_in - 60);
    cachedToken = {
      token: response.data.access_token,
      expiresAt,
    };

    return response.data.access_token;
  } catch (error: any) {
    console.error('PayPal token error:', error.response?.data || error.message);
    throw new Error('Failed to get PayPal access token');
  }
}

/**
 * Verify PayPal webhook signature using PayPal's verification API
 */
async function verifyWebhookSignature(
  headers: Request['headers'],
  body: any
): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) {
    console.error('PAYPAL_WEBHOOK_ID is not configured');
    return false;
  }

  try {
    const accessToken = await getAccessToken();

    const verificationPayload = {
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: body,
    };

    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
      verificationPayload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.verification_status === 'SUCCESS';
  } catch (error: any) {
    console.error('Webhook signature verification error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * PayPal webhook event types we handle
 */
type PayPalEventType =
  | 'PAYMENT.CAPTURE.COMPLETED'
  | 'PAYMENT.CAPTURE.DENIED'
  | 'PAYMENT.CAPTURE.REFUNDED'
  | 'CHECKOUT.ORDER.APPROVED';

interface PayPalWebhookEvent {
  id: string;
  event_type: PayPalEventType;
  event_version: string;
  create_time: string;
  resource_type: string;
  resource: {
    id: string;
    status?: string;
    amount?: {
      currency_code: string;
      value: string;
    };
    custom_id?: string;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
    [key: string]: any;
  };
  links: Array<{ href: string; rel: string; method: string }>;
}

/**
 * Handle PAYMENT.CAPTURE.COMPLETED event
 * Called when a payment capture is successfully completed
 */
async function handlePaymentCaptureCompleted(event: PayPalWebhookEvent): Promise<void> {
  const resource = event.resource;
  const captureId = resource.id;
  const orderId = resource.supplementary_data?.related_ids?.order_id;

  console.log(`[Webhook] Processing PAYMENT.CAPTURE.COMPLETED for capture: ${captureId}`);

  // Find transaction by PayPal order ID or capture ID
  let transaction = await Transaction.findOne({ paypalOrderId: orderId });
  if (!transaction) {
    transaction = await Transaction.findOne({ paypalCaptureId: captureId });
  }
  if (!transaction) {
    transaction = await Transaction.findOne({ orderId: orderId });
  }

  if (!transaction) {
    console.log(`[Webhook] No transaction found for capture: ${captureId}, order: ${orderId}`);
    return;
  }

  // Skip if already completed
  if (transaction.status === 'completed') {
    console.log(`[Webhook] Transaction ${transaction.id} already completed, skipping`);
    return;
  }

  // Update transaction status
  await Transaction.findByIdAndUpdate(transaction.id, {
    status: 'completed',
    paypalCaptureId: captureId,
    metadata: {
      ...transaction.metadata,
      webhookEventId: event.id,
      completedAt: new Date().toISOString(),
    },
  });

  console.log(`[Webhook] Transaction ${transaction.id} marked as completed`);

  // Get user for notifications
  const user = await User.findById(transaction.userId);
  if (!user) {
    console.error(`[Webhook] User not found for transaction: ${transaction.id}`);
    return;
  }

  const metadata = transaction.metadata as any;

  // Handle different transaction types
  if (metadata?.type === 'book_purchase') {
    // Book purchase - notify author and update book stats
    await handleBookPurchaseComplete(transaction, user, metadata);
  } else {
    // Subscription upgrade
    await handleSubscriptionUpgradeComplete(transaction, user);
  }

  // Generate invoice for completed transaction
  try {
    const language = user.profile?.language || 'en';
    const { invoiceNumber } = await generateInvoiceForTransaction(transaction.id, language);
    console.log(`[Webhook] Invoice ${invoiceNumber} generated for transaction ${transaction.id}`);
  } catch (invoiceError) {
    // Log error but don't fail the payment processing
    console.error(`[Webhook] Failed to generate invoice for transaction ${transaction.id}:`, invoiceError);
  }
}

/**
 * Handle book purchase completion
 */
async function handleBookPurchaseComplete(
  transaction: any,
  buyer: any,
  metadata: any
): Promise<void> {
  const bookId = metadata.bookId;
  const authorId = metadata.authorId;
  const authorShare = metadata.authorShare || transaction.amount * AUTHOR_SHARE_PERCENTAGE;

  // Update book statistics
  const book = await Book.findById(bookId);
  if (book) {
    await Book.findByIdAndUpdate(bookId, {
      $inc: {
        'statistics.purchases': 1,
        'statistics.revenue': transaction.amount,
      },
    });

    // Add book to buyer's library if not already owned
    const buyerProfile = buyer.profile || {};
    const readingHistory = buyerProfile.readingHistory || [];

    const alreadyOwns = readingHistory.some(
      (item: any) => item.bookId?.toString() === bookId
    );
    if (!alreadyOwns) {
      const newReadingHistory = [
        ...readingHistory,
        {
          bookId: book._id || book.id,
          progress: 0,
          lastRead: new Date().toISOString(),
        },
      ];
      await User.findByIdAndUpdate(buyer.id, {
        $set: {
          profile: {
            ...buyerProfile,
            readingHistory: newReadingHistory,
          },
        },
      });
    }
  }

  // Update author earnings
  const author = await User.findById(authorId);
  if (author) {
    const authorProfile = author.profile || {};
    const earnings = authorProfile.earnings || {
      totalEarned: 0,
      pendingPayout: 0,
      withdrawn: 0,
      history: [],
    };
    const authorProfileData = authorProfile.authorProfile || {
      publishedBooks: 0,
      totalSales: 0,
      rating: 0,
      followers: [],
    };

    await User.findByIdAndUpdate(authorId, {
      $set: {
        profile: {
          ...authorProfile,
          earnings: {
            ...earnings,
            totalEarned: earnings.totalEarned + authorShare,
            pendingPayout: earnings.pendingPayout + authorShare,
          },
          authorProfile: {
            publishedBooks: authorProfileData.publishedBooks || 0,
            totalSales: (authorProfileData.totalSales || 0) + 1,
            rating: authorProfileData.rating || 0,
            followers: authorProfileData.followers || [],
          },
        },
      },
    });

    // Notify author about the sale
    await notifyBookPurchase(
      bookId,
      buyer.id,
      authorId,
      transaction.amount,
      transaction.currency || 'USD'
    );
  }

  // Notify buyer about successful payment
  await notifyPaymentReceived(
    buyer.id,
    transaction.amount,
    transaction.currency || 'USD',
    transaction.orderId || transaction.id,
    `Purchase: ${metadata.bookTitle || 'Book'}`
  );

  console.log(`[Webhook] Book purchase complete: ${metadata.bookTitle}`);
}

/**
 * Handle subscription upgrade completion
 */
async function handleSubscriptionUpgradeComplete(
  transaction: any,
  user: any
): Promise<void> {
  const planType = transaction.plan as 'standard' | 'premium';
  const planLabel = planType.charAt(0).toUpperCase() + planType.slice(1);

  // Plan configuration
  const PLANS = {
    standard: {
      tier: UserRole.STANDARD,
      price: parseFloat(process.env.STANDARD_PLAN_PRICE || '25'),
      credits: parseInt(process.env.STANDARD_PLAN_CREDITS || '500'),
    },
    premium: {
      tier: UserRole.PREMIUM,
      price: parseFloat(process.env.PREMIUM_PLAN_PRICE || '65'),
      credits: parseInt(process.env.PREMIUM_PLAN_CREDITS || '-1'),
    },
  };

  const planDetails = PLANS[planType];
  if (!planDetails) {
    console.error(`[Webhook] Invalid plan type: ${planType}`);
    return;
  }

  const previousPlan = user.role;
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1);

  // Update user subscription
  const newCredits = planDetails.credits === -1 ? 999999 : planDetails.credits;
  await User.findByIdAndUpdate(user.id, {
    $set: {
      role: planDetails.tier,
      credits: newCredits,
      subscription: {
        tier: planDetails.tier,
        price: planDetails.price,
        credits: planDetails.credits,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        isActive: true,
        autoRenew: true,
      },
    },
  });

  // Send notifications
  const isUpgrade = previousPlan === UserRole.FREE ||
    (previousPlan === UserRole.STANDARD && planType === 'premium');

  await notifyPaymentReceived(
    user.id,
    transaction.amount,
    'USD',
    transaction.orderId || transaction.id,
    `Upgrade to ${planLabel} Plan`
  );

  await notifySubscriptionChange(user.id, planLabel, isUpgrade);

  // Send emails
  const planFeatures = planType === 'premium'
    ? ['Unlimited credits', 'Priority AI processing', 'Advanced analytics', 'Custom branding', 'Early access to features', 'Priority support']
    : ['Full AI writing assistant', 'Book quality scoring', '500 credits/month', 'Marketplace publishing', 'Advanced export', 'Cover design studio'];

  sendSubscriptionUpgradeEmail(
    user.email,
    user.name,
    planLabel,
    transaction.amount,
    'USD',
    planFeatures
  ).catch((err) => console.error('Failed to send upgrade email:', err));

  sendPayPalReceiptEmail(
    user.email,
    user.name,
    transaction.orderId || transaction.id,
    `Upgrade to ${planLabel} Plan`,
    transaction.amount,
    'USD'
  ).catch((err) => console.error('Failed to send receipt email:', err));

  console.log(`[Webhook] Subscription upgrade complete: ${previousPlan} -> ${planDetails.tier}`);
}

/**
 * Handle PAYMENT.CAPTURE.DENIED event
 * Called when a payment capture is denied
 */
async function handlePaymentCaptureDenied(event: PayPalWebhookEvent): Promise<void> {
  const resource = event.resource;
  const captureId = resource.id;
  const orderId = resource.supplementary_data?.related_ids?.order_id;

  console.log(`[Webhook] Processing PAYMENT.CAPTURE.DENIED for capture: ${captureId}`);

  // Find transaction
  let transaction = await Transaction.findOne({ paypalOrderId: orderId });
  if (!transaction) {
    transaction = await Transaction.findOne({ orderId: orderId });
  }

  if (!transaction) {
    console.log(`[Webhook] No transaction found for denied capture: ${captureId}`);
    return;
  }

  // Update transaction status to failed
  await Transaction.findByIdAndUpdate(transaction.id, {
    status: 'failed',
    metadata: {
      ...transaction.metadata,
      webhookEventId: event.id,
      failedAt: new Date().toISOString(),
      failureReason: 'Payment capture denied by PayPal',
    },
  });

  console.log(`[Webhook] Transaction ${transaction.id} marked as failed`);

  // Notify user about failed payment
  const user = await User.findById(transaction.userId);
  if (user) {
    await notifySystem(
      user.id,
      'Payment Failed',
      'Your payment could not be processed. Please try again or use a different payment method.',
      '/subscription'
    );
  }
}

/**
 * Handle PAYMENT.CAPTURE.REFUNDED event
 * Called when a payment is refunded
 */
async function handlePaymentCaptureRefunded(event: PayPalWebhookEvent): Promise<void> {
  const resource = event.resource;
  const captureId = resource.id;
  const refundAmount = resource.amount ? parseFloat(resource.amount.value) : 0;

  console.log(`[Webhook] Processing PAYMENT.CAPTURE.REFUNDED for capture: ${captureId}`);

  // Find transaction by capture ID
  const transaction = await Transaction.findOne({ paypalCaptureId: captureId });

  if (!transaction) {
    console.log(`[Webhook] No transaction found for refunded capture: ${captureId}`);
    return;
  }

  // Update transaction status to refunded
  await Transaction.findByIdAndUpdate(transaction.id, {
    status: 'refunded',
    metadata: {
      ...transaction.metadata,
      webhookEventId: event.id,
      refundedAt: new Date().toISOString(),
      refundAmount,
    },
  });

  console.log(`[Webhook] Transaction ${transaction.id} marked as refunded`);

  // Get user
  const user = await User.findById(transaction.userId);
  if (!user) {
    console.error(`[Webhook] User not found for refunded transaction: ${transaction.id}`);
    return;
  }

  const metadata = transaction.metadata as any;

  // Handle refund based on transaction type
  if (metadata?.type === 'book_purchase') {
    // Book purchase refund - reverse author earnings
    await handleBookPurchaseRefund(transaction, user, metadata, refundAmount);
  } else {
    // Subscription refund - downgrade user
    await handleSubscriptionRefund(transaction, user);
  }

  // Notify user about refund
  await notifySystem(
    user.id,
    'Payment Refunded',
    `Your payment of ${refundAmount} ${transaction.currency} has been refunded.`,
    '/settings/payments'
  );
}

/**
 * Handle book purchase refund
 */
async function handleBookPurchaseRefund(
  transaction: any,
  buyer: any,
  metadata: any,
  refundAmount: number
): Promise<void> {
  const bookId = metadata.bookId;
  const authorId = metadata.authorId;
  const authorShare = metadata.authorShare || refundAmount * AUTHOR_SHARE_PERCENTAGE;

  // Update book statistics
  const book = await Book.findById(bookId);
  if (book) {
    const newPurchases = Math.max(0, (book.statistics?.purchases || 0) - 1);
    const newRevenue = Math.max(0, (book.statistics?.revenue || 0) - transaction.amount);

    await Book.findByIdAndUpdate(bookId, {
      $set: {
        'statistics.purchases': newPurchases,
        'statistics.revenue': newRevenue,
      },
    });

    // Remove book from buyer's library
    if (buyer.profile?.readingHistory) {
      const filteredHistory = buyer.profile.readingHistory.filter(
        (item: any) => item.bookId?.toString() !== bookId
      );
      await User.findByIdAndUpdate(buyer.id, {
        $set: {
          profile: {
            ...buyer.profile,
            readingHistory: filteredHistory,
          },
        },
      });
    }
  }

  // Reverse author earnings
  const author = await User.findById(authorId);
  if (author && author.profile?.earnings) {
    const earnings = author.profile.earnings;
    const authorProfileData = author.profile.authorProfile || {
      publishedBooks: 0,
      totalSales: 0,
      rating: 0,
      followers: [],
    };

    await User.findByIdAndUpdate(authorId, {
      $set: {
        profile: {
          ...author.profile,
          earnings: {
            ...earnings,
            totalEarned: Math.max(0, earnings.totalEarned - authorShare),
            pendingPayout: Math.max(0, earnings.pendingPayout - authorShare),
          },
          authorProfile: {
            publishedBooks: authorProfileData.publishedBooks || 0,
            totalSales: Math.max(0, (authorProfileData.totalSales || 0) - 1),
            rating: authorProfileData.rating || 0,
            followers: authorProfileData.followers || [],
          },
        },
      },
    });

    // Notify author about refund
    await notifySystem(
      authorId,
      'Book Purchase Refunded',
      `A purchase of "${metadata.bookTitle || 'your book'}" has been refunded. Your earnings have been adjusted.`,
      '/dashboard'
    );
  }

  console.log(`[Webhook] Book purchase refund processed: ${metadata.bookTitle}`);
}

/**
 * Handle subscription refund
 */
async function handleSubscriptionRefund(
  transaction: any,
  user: any
): Promise<void> {
  const freeCredits = parseInt(process.env.FREE_PLAN_CREDITS || '100');

  // Downgrade user to free plan
  await User.findByIdAndUpdate(user.id, {
    $set: {
      role: UserRole.FREE,
      credits: freeCredits,
      subscription: {
        tier: UserRole.FREE,
        price: 0,
        credits: freeCredits,
        startDate: new Date().toISOString(),
        endDate: null,
        isActive: false,
        autoRenew: false,
      },
    },
  });

  await notifySubscriptionChange(user.id, 'Free', false);

  console.log(`[Webhook] Subscription refund processed, user downgraded to free`);
}

/**
 * Handle CHECKOUT.ORDER.APPROVED event
 * Called when a buyer approves an order (before capture)
 */
async function handleCheckoutOrderApproved(event: PayPalWebhookEvent): Promise<void> {
  const resource = event.resource;
  const orderId = resource.id;

  console.log(`[Webhook] Processing CHECKOUT.ORDER.APPROVED for order: ${orderId}`);

  // Find transaction by order ID
  const transaction = await Transaction.findOne({ orderId: orderId });
  if (!transaction) {
    transaction && console.log(`[Webhook] No transaction found for approved order: ${orderId}`);
    return;
  }

  // Update transaction with PayPal order ID if not set
  if (!transaction.paypalOrderId) {
    await Transaction.findByIdAndUpdate(transaction.id, {
      paypalOrderId: orderId,
      metadata: {
        ...transaction.metadata,
        orderApprovedAt: new Date().toISOString(),
        webhookEventId: event.id,
      },
    });
  }

  console.log(`[Webhook] Order ${orderId} marked as approved, awaiting capture`);

  // Note: The actual capture should be triggered by the client or server
  // This event just confirms the buyer approved the payment
}

/**
 * Main PayPal webhook handler
 * POST /api/webhooks/paypal
 */
export const handlePayPalWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = req.body as PayPalWebhookEvent;

    console.log(`[Webhook] Received PayPal event: ${event.event_type} (${event.id})`);

    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      const isValid = await verifyWebhookSignature(req.headers, req.body);
      if (!isValid) {
        console.error(`[Webhook] Invalid signature for event: ${event.id}`);
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }
    }

    // Process event based on type
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(event);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentCaptureDenied(event);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentCaptureRefunded(event);
        break;

      case 'CHECKOUT.ORDER.APPROVED':
        await handleCheckoutOrderApproved(event);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.event_type}`);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Webhook] Error processing PayPal webhook:', error);
    // Return 200 anyway to prevent PayPal from retrying
    // Log the error for investigation
    res.status(200).json({ received: true, error: 'Processing error logged' });
  }
};
