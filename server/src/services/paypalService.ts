/**
 * PayPal Service for Book Purchases
 * Handles payment processing with 50/50 revenue split between author and platform
 */

import axios from 'axios';
import { User, UserRole, IUser } from '../models/User';
import { Book } from '../models/Book';
import { Transaction } from '../models/Transaction';
import { supabaseAdmin } from '../config/supabase';
import { getPlanByTier } from '../config/plans';

// PayPal API Configuration
const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const PAYOUT_THRESHOLD = parseFloat(process.env.PAYOUT_THRESHOLD || '10');

/**
 * Marketplace revenue split is driven by the AUTHOR's plan, not by global
 * env vars. Free authors get 50/50, Standard 70/30, Premium 85/15. See
 * server/src/config/plans.ts for the source of truth.
 */
function getRevenueSplit(authorRole: UserRole): {
  authorShareRatio: number;
  platformShareRatio: number;
} {
  const plan = getPlanByTier(authorRole);
  return {
    authorShareRatio: plan.authorRevenueShare,
    platformShareRatio: 1 - plan.authorRevenueShare,
  };
}

function authorPlanLabel(authorRole: UserRole): string {
  return getPlanByTier(authorRole).id;
}

/**
 * Persist the platform's commission cut from a marketplace sale so admin
 * can run revenue reports without trawling transaction metadata.
 */
async function recordPlatformEarning(args: {
  transactionId: string;
  bookId: string;
  authorId: string;
  buyerId: string;
  grossAmount: number;
  authorShare: number;
  platformShare: number;
  currency: string;
  authorPlan: string;
}): Promise<void> {
  const { error } = await supabaseAdmin.from('platform_earnings').insert({
    transaction_id: args.transactionId,
    book_id: args.bookId,
    author_id: args.authorId,
    buyer_id: args.buyerId,
    gross_amount: args.grossAmount,
    author_share: args.authorShare,
    platform_share: args.platformShare,
    currency: args.currency,
    author_plan: args.authorPlan,
    paid_out: false,
  });
  if (error) {
    console.error('[paypalService] Failed to record platform earning:', error.message);
  }
}


interface PayPalAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalOrder {
  id: string;
  status: string;
  links: Array<{ href: string; rel: string; method: string }>;
}

interface BookPurchaseResult {
  success: boolean;
  orderId?: string;
  approvalUrl?: string;
  error?: string;
  mockMode?: boolean;
}

interface PaymentCaptureResult {
  success: boolean;
  transactionId?: string;
  authorShare?: number;
  platformShare?: number;
  error?: string;
  mockMode?: boolean;
}

interface PayoutResult {
  success: boolean;
  payoutBatchId?: string;
  amount?: number;
  error?: string;
  mockMode?: boolean;
}

// Token cache
let cachedToken: { token: string; expiresAt: Date } | null = null;

/**
 * Get PayPal access token
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > new Date()) {
    return cachedToken.token;
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await axios.post<PayPalAccessToken>(
      `${PAYPAL_BASE_URL}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Cache token with expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + response.data.expires_in - 60); // 60s buffer
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
 * Check if PayPal is configured
 */
function isPayPalConfigured(): boolean {
  return !!(
    PAYPAL_CLIENT_ID &&
    PAYPAL_CLIENT_SECRET &&
    PAYPAL_CLIENT_ID !== 'your-paypal-client-id' &&
    PAYPAL_CLIENT_SECRET !== 'your-paypal-client-secret'
  );
}

/**
 * Create a PayPal order for book purchase
 */
export async function createBookPurchaseOrder(
  bookId: string,
  buyerId: string
): Promise<BookPurchaseResult> {
  try {
    // Get book details
    const book = await Book.findById(bookId);
    if (!book) {
      return { success: false, error: 'Book not found' };
    }

    // Get author details separately (Supabase doesn't support populate)
    const author = await User.findById(book.author);

    // Check if book is published
    if (book.publishingStatus.status !== 'published') {
      return { success: false, error: 'Book is not available for purchase' };
    }

    // Check if book is free
    if (book.publishingStatus.isFree || book.publishingStatus.price === 0) {
      return { success: false, error: 'This book is free and does not require purchase' };
    }

    // Check if buyer is the author
    if (book.author.toString() === buyerId) {
      return { success: false, error: 'You cannot purchase your own book' };
    }

    // Check if buyer already owns the book
    const buyer = await User.findById(buyerId);
    if (!buyer) {
      return { success: false, error: 'User not found' };
    }

    const alreadyOwns = buyer.profile?.readingHistory?.some(
      (item) => item.bookId.toString() === bookId
    );
    if (alreadyOwns) {
      return { success: false, error: 'You already own this book' };
    }

    const price = book.publishingStatus.price;
    const authorName = author?.name || 'Unknown Author';
    const authorRole = (author?.role as UserRole) || UserRole.FREE;
    const { authorShareRatio, platformShareRatio } = getRevenueSplit(authorRole);
    const authorShareAmount = price * authorShareRatio;
    const platformShareAmount = price * platformShareRatio;

    // Development/Mock Mode
    if (!isPayPalConfigured() || process.env.NODE_ENV === 'development') {
      const mockOrderId = `MOCK-BOOK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      console.log(`📚 [MOCK] Creating book purchase order:`);
      console.log(`   Book: ${book.title} by ${authorName}`);
      console.log(`   Price: $${price}`);
      console.log(`   Author plan: ${authorPlanLabel(authorRole)} (${(authorShareRatio * 100).toFixed(0)}%/${(platformShareRatio * 100).toFixed(0)}% split)`);
      console.log(`   Author Share: $${authorShareAmount.toFixed(2)}`);
      console.log(`   Platform Share: $${platformShareAmount.toFixed(2)}`);

      // Create pending transaction
      await Transaction.create({
        userId: buyerId,
        amount: price,
        currency: 'USD',
        plan: 'book-purchase',
        status: 'pending',
        paymentMethod: 'mock',
        orderId: mockOrderId,
        description: `Purchase: ${book.title}`,
        metadata: {
          bookId: book.id,
          bookTitle: book.title,
          authorId: book.author,
          authorName,
          authorPlan: authorPlanLabel(authorRole),
          authorShareRatio,
          platformShareRatio,
          authorShare: authorShareAmount,
          platformShare: platformShareAmount,
          type: 'book_purchase',
        },
      });

      return {
        success: true,
        orderId: mockOrderId,
        approvalUrl: `/mock-payment?orderId=${mockOrderId}`,
        mockMode: true,
      };
    }

    // Production: Real PayPal Order
    const accessToken = await getAccessToken();

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: bookId,
          description: `Book: ${book.title} by ${authorName}`,
          custom_id: JSON.stringify({
            bookId,
            buyerId,
            authorId: book.author.toString(),
          }),
          amount: {
            currency_code: 'USD',
            value: price.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'MeStory',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW',
        return_url: `${process.env.CLIENT_URL}/payment/success`,
        cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      },
    };

    const response = await axios.post<PayPalOrder>(
      `${PAYPAL_BASE_URL}/v2/checkout/orders`,
      orderPayload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Create pending transaction
    await Transaction.create({
      userId: buyerId,
      amount: price,
      currency: 'USD',
      plan: 'book-purchase',
      status: 'pending',
      paymentMethod: 'paypal',
      orderId: response.data.id,
      description: `Purchase: ${book.title}`,
      metadata: {
        bookId: book.id,
        bookTitle: book.title,
        authorId: book.author,
        authorName,
        authorPlan: authorPlanLabel(authorRole),
        authorShareRatio,
        platformShareRatio,
        authorShare: authorShareAmount,
        platformShare: platformShareAmount,
        type: 'book_purchase',
      },
    });

    // Find approval URL
    const approvalLink = response.data.links.find((link) => link.rel === 'approve');

    return {
      success: true,
      orderId: response.data.id,
      approvalUrl: approvalLink?.href,
    };
  } catch (error: any) {
    console.error('Create book purchase order error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create order',
    };
  }
}

/**
 * Capture payment and process revenue split
 */
export async function captureBookPayment(
  orderId: string,
  buyerId: string
): Promise<PaymentCaptureResult> {
  try {
    // Find the transaction
    const transaction = await Transaction.findOne({ orderId });
    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    // Verify transaction belongs to user
    if (transaction.userId.toString() !== buyerId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if already processed
    if (transaction.status === 'completed') {
      return { success: false, error: 'Payment already processed' };
    }

    const metadata = transaction.metadata as any;
    const bookId = metadata?.bookId;
    const authorId = metadata?.authorId;

    // Get book and author
    const book = await Book.findById(bookId);
    const author = await User.findById(authorId);
    const buyer = await User.findById(buyerId);

    if (!book || !author || !buyer) {
      return { success: false, error: 'Book, author, or buyer not found' };
    }

    // Resolve revenue split. Prefer the snapshot stored on the transaction
    // metadata (so a plan change between order creation and capture
    // doesn't shift the cut), fall back to author's current plan.
    const splitRatio =
      typeof metadata?.authorShareRatio === 'number'
        ? metadata.authorShareRatio
        : getRevenueSplit(author.role).authorShareRatio;
    const platformRatio = 1 - splitRatio;
    const authorShare = transaction.amount * splitRatio;
    const platformShare = transaction.amount * platformRatio;
    const authorPlanAtSale =
      metadata?.authorPlan || authorPlanLabel(author.role);

    // Mock mode
    if (transaction.paymentMethod === 'mock' || !isPayPalConfigured()) {
      console.log(`💳 [MOCK] Capturing payment for order: ${orderId}`);

      // Update transaction
      await Transaction.findByIdAndUpdate(transaction.id, {
        status: 'completed',
        paypalCaptureId: `MOCK-CAPTURE-${Date.now()}`,
        metadata: {
          ...transaction.metadata,
          capturedAt: new Date().toISOString(),
          revenueProcessed: true,
        },
      });

      // Add book to buyer's library
      const buyerProfile = buyer.profile || {};
      const buyerReadingHistory = buyerProfile.readingHistory || [];
      buyerReadingHistory.push({
        bookId: book.id,
        progress: 0,
        lastRead: new Date().toISOString(),
      });
      await User.findByIdAndUpdate(buyerId, {
        profile: { ...buyerProfile, readingHistory: buyerReadingHistory },
      });

      // Update book statistics
      await Book.findByIdAndUpdate(bookId, {
        statistics: {
          ...book.statistics,
          purchases: book.statistics.purchases + 1,
          revenue: book.statistics.revenue + transaction.amount,
        },
      });

      // Update author earnings
      const authorProfile = author.profile || {};
      const earnings = authorProfile.earnings || {
        totalEarned: 0,
        pendingPayout: 0,
        withdrawn: 0,
        history: [],
      };
      earnings.totalEarned += authorShare;
      earnings.pendingPayout += authorShare;

      const authorAuthorProfile = authorProfile.authorProfile;
      if (authorAuthorProfile) {
        authorAuthorProfile.totalSales += 1;
      }
      await User.findByIdAndUpdate(authorId, {
        profile: { ...authorProfile, earnings, authorProfile: authorAuthorProfile },
      });

      // Record platform commission cut for admin reporting
      await recordPlatformEarning({
        transactionId: transaction.id,
        bookId: book.id,
        authorId: author.id,
        buyerId: buyer.id,
        grossAmount: transaction.amount,
        authorShare,
        platformShare,
        currency: transaction.currency,
        authorPlan: authorPlanAtSale,
      });

      console.log(`✅ [MOCK] Payment captured successfully`);
      console.log(`   Author plan: ${authorPlanAtSale} (${(splitRatio * 100).toFixed(0)}% to author)`);
      console.log(`   Author earned: $${authorShare.toFixed(2)}`);
      console.log(`   Platform earned: $${platformShare.toFixed(2)}`);

      return {
        success: true,
        transactionId: transaction._id.toString(),
        authorShare,
        platformShare,
        mockMode: true,
      };
    }

    // Production: Capture PayPal payment
    const accessToken = await getAccessToken();

    let response;
    try {
      response = await axios.post(
        `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (captureError: any) {
      console.error('PayPal capture API error:', captureError.response?.data || captureError.message);

      // Handle specific PayPal errors
      const paypalErrorName = captureError.response?.data?.name;
      const paypalErrorDetails = captureError.response?.data?.details?.[0];

      let errorMessage = 'Failed to capture payment';

      if (paypalErrorName === 'ORDER_NOT_APPROVED') {
        errorMessage = 'Payment was not approved. Please complete the PayPal checkout.';
      } else if (paypalErrorName === 'ORDER_ALREADY_CAPTURED') {
        errorMessage = 'This payment has already been processed.';
      } else if (paypalErrorName === 'INVALID_RESOURCE_ID') {
        errorMessage = 'Invalid order ID. The order may have expired.';
      } else if (paypalErrorName === 'PAYER_ACTION_REQUIRED') {
        errorMessage = 'Additional action required from payer.';
      } else if (paypalErrorDetails?.description) {
        errorMessage = paypalErrorDetails.description;
      }

      return { success: false, error: errorMessage };
    }

    if (response.data.status !== 'COMPLETED') {
      console.error('PayPal capture incomplete:', response.data.status);
      return {
        success: false,
        error: `Payment capture failed with status: ${response.data.status}`
      };
    }

    // Get capture ID
    const captureId = response.data.purchase_units[0]?.payments?.captures?.[0]?.id;

    // Update transaction
    await Transaction.findByIdAndUpdate(transaction.id, {
      status: 'completed',
      paypalCaptureId: captureId,
      metadata: {
        ...transaction.metadata,
        capturedAt: new Date().toISOString(),
        paypalResponse: response.data,
        revenueProcessed: true,
      },
    });

    // Add book to buyer's library
    const buyerProfile2 = buyer.profile || {};
    const buyerReadingHistory2 = buyerProfile2.readingHistory || [];
    buyerReadingHistory2.push({
      bookId: book.id,
      progress: 0,
      lastRead: new Date().toISOString(),
    });
    await User.findByIdAndUpdate(buyerId, {
      profile: { ...buyerProfile2, readingHistory: buyerReadingHistory2 },
    });

    // Update book statistics
    await Book.findByIdAndUpdate(bookId, {
      statistics: {
        ...book.statistics,
        purchases: book.statistics.purchases + 1,
        revenue: book.statistics.revenue + transaction.amount,
      },
    });

    // Update author earnings
    const authorProfile2 = author.profile || {};
    const earnings2 = authorProfile2.earnings || {
      totalEarned: 0,
      pendingPayout: 0,
      withdrawn: 0,
      history: [],
    };
    earnings2.totalEarned += authorShare;
    earnings2.pendingPayout += authorShare;

    const authorAuthorProfile2 = authorProfile2.authorProfile;
    if (authorAuthorProfile2) {
      authorAuthorProfile2.totalSales += 1;
    }
    await User.findByIdAndUpdate(authorId, {
      profile: { ...authorProfile2, earnings: earnings2, authorProfile: authorAuthorProfile2 },
    });

    // Record platform commission cut for admin reporting
    await recordPlatformEarning({
      transactionId: transaction.id,
      bookId: book.id,
      authorId: author.id,
      buyerId: buyer.id,
      grossAmount: transaction.amount,
      authorShare,
      platformShare,
      currency: transaction.currency,
      authorPlan: authorPlanAtSale,
    });

    return {
      success: true,
      transactionId: transaction._id.toString(),
      authorShare,
      platformShare,
    };
  } catch (error: any) {
    console.error('Capture book payment error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to capture payment',
    };
  }
}

/**
 * Process author payout
 * Sends 50% of earnings to author's PayPal account
 */
export async function processAuthorPayout(authorId: string): Promise<PayoutResult> {
  try {
    const author = await User.findById(authorId);
    if (!author) {
      return { success: false, error: 'Author not found' };
    }

    // Check if author has PayPal email
    const paypalEmail = author.paypal?.email;
    if (!paypalEmail) {
      return { success: false, error: 'Author has not connected PayPal account' };
    }

    // Check pending payout amount
    const pendingAmount = author.profile?.earnings?.pendingPayout || 0;
    if (pendingAmount < PAYOUT_THRESHOLD) {
      return {
        success: false,
        error: `Minimum payout threshold is $${PAYOUT_THRESHOLD}. Current balance: $${pendingAmount.toFixed(2)}`,
      };
    }

    // Mock mode
    if (!isPayPalConfigured() || process.env.NODE_ENV === 'development') {
      const mockPayoutId = `MOCK-PAYOUT-${Date.now()}`;

      console.log(`💰 [MOCK] Processing payout to author: ${author.name}`);
      console.log(`   PayPal Email: ${paypalEmail}`);
      console.log(`   Amount: $${pendingAmount.toFixed(2)}`);

      // Update author earnings
      if (!author.profile) author.profile = {};
      if (!author.profile.earnings) {
        author.profile.earnings = {
          totalEarned: 0,
          pendingPayout: 0,
          withdrawn: 0,
          history: [],
        };
      }

      author.profile.earnings.pendingPayout = 0;
      author.profile.earnings.withdrawn += pendingAmount;
      author.profile.earnings.lastPayoutDate = new Date().toISOString();
      author.profile.earnings.history.push({
        amount: pendingAmount,
        date: new Date().toISOString(),
        status: 'completed',
        paypalEmail,
      });

      await User.findByIdAndUpdate(authorId, {
        profile: author.profile,
      });

      console.log(`✅ [MOCK] Payout completed: ${mockPayoutId}`);

      return {
        success: true,
        payoutBatchId: mockPayoutId,
        amount: pendingAmount,
        mockMode: true,
      };
    }

    // Production: PayPal Payouts API
    const accessToken = await getAccessToken();

    const payoutPayload = {
      sender_batch_header: {
        sender_batch_id: `MESTORY-${Date.now()}`,
        email_subject: 'You have received a payment from MeStory!',
        email_message: 'Thank you for publishing on MeStory. Your book sales earnings are ready.',
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: {
            value: pendingAmount.toFixed(2),
            currency: 'USD',
          },
          receiver: paypalEmail,
          note: `MeStory book sales earnings for ${author.name}`,
          sender_item_id: `AUTHOR-${authorId}-${Date.now()}`,
        },
      ],
    };

    let response;
    try {
      response = await axios.post(
        `${PAYPAL_BASE_URL}/v1/payments/payouts`,
        payoutPayload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (payoutError: any) {
      console.error('PayPal payout API error:', payoutError.response?.data || payoutError.message);

      // Handle specific PayPal payout errors
      const paypalErrorName = payoutError.response?.data?.name;
      const paypalErrorDetails = payoutError.response?.data?.details?.[0];

      let errorMessage = 'Failed to process payout';

      if (paypalErrorName === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Platform has insufficient funds. Please contact support.';
      } else if (paypalErrorName === 'RECEIVER_UNREGISTERED') {
        errorMessage = 'The PayPal email is not registered. Please verify your PayPal account.';
      } else if (paypalErrorName === 'RECEIVER_UNCONFIRMED') {
        errorMessage = 'The PayPal email is not confirmed. Please verify your PayPal account.';
      } else if (paypalErrorName === 'VALIDATION_ERROR') {
        errorMessage = paypalErrorDetails?.description || 'Invalid payout details.';
      } else if (paypalErrorName === 'SENDER_BATCH_ID_ALREADY_USED') {
        errorMessage = 'A payout is already being processed. Please wait.';
      } else if (paypalErrorDetails?.description) {
        errorMessage = paypalErrorDetails.description;
      }

      return { success: false, error: errorMessage };
    }

    // Check payout batch status
    const batchStatus = response.data.batch_header?.batch_status;
    if (batchStatus === 'DENIED' || batchStatus === 'CANCELED') {
      console.error('PayPal payout denied/canceled:', response.data);
      return {
        success: false,
        error: `Payout was ${batchStatus.toLowerCase()}. Please contact support.`
      };
    }

    const payoutBatchId = response.data.batch_header?.payout_batch_id;
    console.log(`[PayPal] Payout created: ${payoutBatchId}, status: ${batchStatus}`);

    // Update author earnings
    if (!author.profile) author.profile = {};
    if (!author.profile.earnings) {
      author.profile.earnings = {
        totalEarned: 0,
        pendingPayout: 0,
        withdrawn: 0,
        history: [],
      };
    }

    author.profile.earnings.pendingPayout = 0;
    author.profile.earnings.withdrawn += pendingAmount;
    author.profile.earnings.lastPayoutDate = new Date().toISOString();
    author.profile.earnings.history.push({
      amount: pendingAmount,
      date: new Date().toISOString(),
      status: 'pending', // Will be updated via webhook
      paypalEmail,
    });

    await User.findByIdAndUpdate(authorId, {
      profile: author.profile,
    });

    return {
      success: true,
      payoutBatchId,
      amount: pendingAmount,
    };
  } catch (error: any) {
    console.error('Process author payout error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to process payout',
    };
  }
}

/**
 * Get author earnings summary
 */
export async function getAuthorEarnings(authorId: string) {
  const author = await User.findById(authorId);
  if (!author) {
    throw new Error('Author not found');
  }

  const earnings = author.profile?.earnings || {
    totalEarned: 0,
    pendingPayout: 0,
    withdrawn: 0,
    history: [],
  };

  // Get recent sales from transactions
  const allSales = await Transaction.find({
    'metadata.authorId': authorId,
    'metadata.type': 'book_purchase',
    status: 'completed',
  });

  // Sort in memory and limit (Supabase returns plain objects, no .lean() needed)
  const recentSales = allSales
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  // Author share percentage is now plan-driven, not a global constant.
  const { authorShareRatio } = getRevenueSplit(author.role);

  return {
    ...earnings,
    payoutThreshold: PAYOUT_THRESHOLD,
    authorSharePercentage: authorShareRatio * 100,
    canRequestPayout: earnings.pendingPayout >= PAYOUT_THRESHOLD,
    hasPayPalConnected: !!author.paypal?.email,
    paypalEmail: author.paypal?.email ? `${author.paypal.email.substring(0, 3)}***` : null,
    recentSales: recentSales.map((sale) => ({
      bookTitle: (sale.metadata as any)?.bookTitle,
      amount: sale.amount,
      authorShare: (sale.metadata as any)?.authorShare,
      date: sale.createdAt,
    })),
  };
}

/**
 * Connect author's PayPal account
 */
export async function connectAuthorPayPal(
  authorId: string,
  paypalEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paypalEmail)) {
      return { success: false, error: 'Invalid email format' };
    }

    const author = await User.findById(authorId);
    if (!author) {
      return { success: false, error: 'User not found' };
    }

    // Update PayPal info
    author.paypal = {
      email: paypalEmail.toLowerCase(),
      isVerified: false, // Will be verified on first payout
      connectedAt: new Date().toISOString(),
    };

    await User.findByIdAndUpdate(authorId, {
      paypal: author.paypal,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Check if user owns a book
 */
export async function checkBookOwnership(
  userId: string,
  bookId: string
): Promise<{ owns: boolean; isFree: boolean; isAuthor: boolean }> {
  const user = await User.findById(userId);
  const book = await Book.findById(bookId);

  if (!user || !book) {
    return { owns: false, isFree: false, isAuthor: false };
  }

  // Check if user is the author
  const isAuthor = book.author.toString() === userId;
  if (isAuthor) {
    return { owns: true, isFree: false, isAuthor: true };
  }

  // Check if book is free
  if (book.publishingStatus.isFree || book.publishingStatus.price === 0) {
    return { owns: true, isFree: true, isAuthor: false };
  }

  // Check if user has purchased the book
  const owns = user.profile?.readingHistory?.some(
    (item) => item.bookId.toString() === bookId
  ) || false;

  return { owns, isFree: false, isAuthor: false };
}

/**
 * Refund Result interface
 */
interface RefundResult {
  success: boolean;
  refundId?: string;
  status?: string;
  error?: string;
  mockMode?: boolean;
}

/**
 * Process PayPal refund for a captured payment
 * Uses POST /v2/payments/captures/{capture_id}/refund
 */
export async function processPayPalRefund(
  captureId: string,
  amount: number,
  currency: string,
  note?: string
): Promise<RefundResult> {
  try {
    // Mock mode for development
    if (!isPayPalConfigured() || process.env.NODE_ENV === 'development') {
      const mockRefundId = `MOCK-REFUND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      console.log(`💸 [MOCK] Processing refund:`);
      console.log(`   Capture ID: ${captureId}`);
      console.log(`   Amount: $${amount} ${currency}`);
      console.log(`   Note: ${note || 'N/A'}`);
      console.log(`   Mock Refund ID: ${mockRefundId}`);

      return {
        success: true,
        refundId: mockRefundId,
        status: 'COMPLETED',
        mockMode: true,
      };
    }

    // Production: Real PayPal Refund
    const accessToken = await getAccessToken();

    const refundPayload: any = {
      amount: {
        value: amount.toFixed(2),
        currency_code: currency || 'USD',
      },
    };

    if (note) {
      refundPayload.note_to_payer = note.substring(0, 255); // PayPal limit
    }

    let response;
    try {
      response = await axios.post(
        `${PAYPAL_BASE_URL}/v2/payments/captures/${captureId}/refund`,
        refundPayload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (refundError: any) {
      console.error('PayPal refund API error:', refundError.response?.data || refundError.message);

      // Handle specific PayPal refund errors
      const paypalErrorName = refundError.response?.data?.name;
      const paypalErrorDetails = refundError.response?.data?.details?.[0];

      let errorMessage = 'Failed to process refund';

      if (paypalErrorName === 'CAPTURE_NOT_FOUND') {
        errorMessage = 'Original payment capture not found.';
      } else if (paypalErrorName === 'CAPTURE_FULLY_REFUNDED') {
        errorMessage = 'This payment has already been fully refunded.';
      } else if (paypalErrorName === 'INVALID_RESOURCE_ID') {
        errorMessage = 'Invalid capture ID. The payment may not exist.';
      } else if (paypalErrorName === 'MAX_NUMBER_OF_REFUNDS_EXCEEDED') {
        errorMessage = 'Maximum number of refunds for this payment exceeded.';
      } else if (paypalErrorName === 'REFUND_NOT_ALLOWED') {
        errorMessage = 'Refund is not allowed for this payment.';
      } else if (paypalErrorName === 'REFUND_AMOUNT_EXCEEDED') {
        errorMessage = 'Refund amount exceeds the available refund amount.';
      } else if (paypalErrorDetails?.description) {
        errorMessage = paypalErrorDetails.description;
      }

      return { success: false, error: errorMessage };
    }

    // Check refund status
    const refundStatus = response.data.status;
    if (refundStatus === 'COMPLETED' || refundStatus === 'PENDING') {
      console.log(`[PayPal] Refund processed: ${response.data.id}, status: ${refundStatus}`);
      return {
        success: true,
        refundId: response.data.id,
        status: refundStatus,
      };
    } else {
      console.error('PayPal refund unexpected status:', response.data);
      return {
        success: false,
        error: `Refund returned unexpected status: ${refundStatus}`,
      };
    }
  } catch (error: any) {
    console.error('Process PayPal refund error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to process refund',
    };
  }
}

export default {
  createBookPurchaseOrder,
  captureBookPayment,
  processAuthorPayout,
  getAuthorEarnings,
  connectAuthorPayPal,
  checkBookOwnership,
  isPayPalConfigured,
  processPayPalRefund,
};
