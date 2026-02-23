/**
 * PayPal Service for Book Purchases
 * Handles payment processing with 50/50 revenue split between author and platform
 */

import axios from 'axios';
import { User } from '../models/User';
import { Book } from '../models/Book';
import { Transaction } from '../models/Transaction';

// PayPal API Configuration
const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Revenue split configuration (from .env)
const AUTHOR_SHARE_PERCENTAGE = parseInt(process.env.AUTHOR_REVENUE_PERCENTAGE || '50') / 100;
const PLATFORM_SHARE_PERCENTAGE = parseInt(process.env.PLATFORM_REVENUE_PERCENTAGE || '50') / 100;
const PAYOUT_THRESHOLD = parseFloat(process.env.PAYOUT_THRESHOLD || '10');


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
    const book = await Book.findById(bookId).populate('author', 'name email paypal');
    if (!book) {
      return { success: false, error: 'Book not found' };
    }

    // Check if book is published
    if (book.publishingStatus.status !== 'published') {
      return { success: false, error: 'Book is not available for purchase' };
    }

    // Check if book is free
    if (book.publishingStatus.isFree || book.publishingStatus.price === 0) {
      return { success: false, error: 'This book is free and does not require purchase' };
    }

    // Check if buyer is the author
    if (book.author._id.toString() === buyerId) {
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
    const authorName = (book.author as any).name || 'Unknown Author';

    // Development/Mock Mode
    if (!isPayPalConfigured() || process.env.NODE_ENV === 'development') {
      const mockOrderId = `MOCK-BOOK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      console.log(`📚 [MOCK] Creating book purchase order:`);
      console.log(`   Book: ${book.title} by ${authorName}`);
      console.log(`   Price: $${price}`);
      console.log(`   Author Share: $${(price * AUTHOR_SHARE_PERCENTAGE).toFixed(2)}`);
      console.log(`   Platform Share: $${(price * PLATFORM_SHARE_PERCENTAGE).toFixed(2)}`);

      // Create pending transaction
      const transaction = new Transaction({
        userId: buyerId,
        amount: price,
        currency: 'USD',
        plan: 'book-purchase',
        status: 'pending',
        paymentMethod: 'mock',
        orderId: mockOrderId,
        description: `Purchase: ${book.title}`,
        metadata: {
          bookId: book._id,
          bookTitle: book.title,
          authorId: book.author._id,
          authorName,
          authorShare: price * AUTHOR_SHARE_PERCENTAGE,
          platformShare: price * PLATFORM_SHARE_PERCENTAGE,
          type: 'book_purchase',
        },
      });

      await transaction.save();

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
            authorId: book.author._id.toString(),
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
    const transaction = new Transaction({
      userId: buyerId,
      amount: price,
      currency: 'USD',
      plan: 'book-purchase',
      status: 'pending',
      paymentMethod: 'paypal',
      orderId: response.data.id,
      description: `Purchase: ${book.title}`,
      metadata: {
        bookId: book._id,
        bookTitle: book.title,
        authorId: book.author._id,
        authorName,
        authorShare: price * AUTHOR_SHARE_PERCENTAGE,
        platformShare: price * PLATFORM_SHARE_PERCENTAGE,
        type: 'book_purchase',
      },
    });

    await transaction.save();

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
    const authorShare = metadata?.authorShare || transaction.amount * AUTHOR_SHARE_PERCENTAGE;
    const platformShare = metadata?.platformShare || transaction.amount * PLATFORM_SHARE_PERCENTAGE;

    // Get book and author
    const book = await Book.findById(bookId);
    const author = await User.findById(authorId);
    const buyer = await User.findById(buyerId);

    if (!book || !author || !buyer) {
      return { success: false, error: 'Book, author, or buyer not found' };
    }

    // Mock mode
    if (transaction.paymentMethod === 'mock' || !isPayPalConfigured()) {
      console.log(`💳 [MOCK] Capturing payment for order: ${orderId}`);

      // Update transaction
      transaction.status = 'completed';
      transaction.paypalCaptureId = `MOCK-CAPTURE-${Date.now()}`;
      transaction.metadata = {
        ...transaction.metadata,
        capturedAt: new Date(),
        revenueProcessed: true,
      };
      await transaction.save();

      // Add book to buyer's library
      if (!buyer.profile) {
        buyer.profile = {};
      }
      if (!buyer.profile.readingHistory) {
        buyer.profile.readingHistory = [];
      }
      buyer.profile.readingHistory.push({
        bookId: book._id,
        progress: 0,
        lastRead: new Date(),
      });
      await buyer.save();

      // Update book statistics
      book.statistics.purchases += 1;
      book.statistics.revenue += transaction.amount;
      await book.save();

      // Update author earnings
      if (!author.profile) {
        author.profile = {};
      }
      if (!author.profile.earnings) {
        author.profile.earnings = {
          totalEarned: 0,
          pendingPayout: 0,
          withdrawn: 0,
          history: [],
        };
      }
      author.profile.earnings.totalEarned += authorShare;
      author.profile.earnings.pendingPayout += authorShare;

      if (author.profile.authorProfile) {
        author.profile.authorProfile.totalSales += 1;
      }
      await author.save();

      console.log(`✅ [MOCK] Payment captured successfully`);
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

    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status !== 'COMPLETED') {
      return { success: false, error: 'Payment capture failed' };
    }

    // Get capture ID
    const captureId = response.data.purchase_units[0]?.payments?.captures?.[0]?.id;

    // Update transaction
    transaction.status = 'completed';
    transaction.paypalCaptureId = captureId;
    transaction.metadata = {
      ...transaction.metadata,
      capturedAt: new Date(),
      paypalResponse: response.data,
      revenueProcessed: true,
    };
    await transaction.save();

    // Add book to buyer's library
    if (!buyer.profile) {
      buyer.profile = {};
    }
    if (!buyer.profile.readingHistory) {
      buyer.profile.readingHistory = [];
    }
    buyer.profile.readingHistory.push({
      bookId: book._id,
      progress: 0,
      lastRead: new Date(),
    });
    await buyer.save();

    // Update book statistics
    book.statistics.purchases += 1;
    book.statistics.revenue += transaction.amount;
    await book.save();

    // Update author earnings
    if (!author.profile) {
      author.profile = {};
    }
    if (!author.profile.earnings) {
      author.profile.earnings = {
        totalEarned: 0,
        pendingPayout: 0,
        withdrawn: 0,
        history: [],
      };
    }
    author.profile.earnings.totalEarned += authorShare;
    author.profile.earnings.pendingPayout += authorShare;

    if (author.profile.authorProfile) {
      author.profile.authorProfile.totalSales += 1;
    }
    await author.save();

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
      author.profile.earnings.lastPayoutDate = new Date();
      author.profile.earnings.history.push({
        amount: pendingAmount,
        date: new Date(),
        status: 'completed',
        paypalEmail,
      });

      await author.save();

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

    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v1/payments/payouts`,
      payoutPayload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const payoutBatchId = response.data.batch_header?.payout_batch_id;

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
    author.profile.earnings.lastPayoutDate = new Date();
    author.profile.earnings.history.push({
      amount: pendingAmount,
      date: new Date(),
      status: 'pending', // Will be updated via webhook
      paypalEmail,
    });

    await author.save();

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
  const recentSales = await Transaction.find({
    'metadata.authorId': authorId,
    'metadata.type': 'book_purchase',
    status: 'completed',
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return {
    ...earnings,
    payoutThreshold: PAYOUT_THRESHOLD,
    authorSharePercentage: AUTHOR_SHARE_PERCENTAGE * 100,
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
      connectedAt: new Date(),
    };

    await author.save();

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

export default {
  createBookPurchaseOrder,
  captureBookPayment,
  processAuthorPayout,
  getAuthorEarnings,
  connectAuthorPayPal,
  checkBookOwnership,
  isPayPalConfigured,
};
