/**
 * Notification Model
 * Handles all user notifications for likes, comments, shares, purchases, etc.
 */

import mongoose, { Document, Schema } from 'mongoose';

// Notification types
export type NotificationType =
  | 'like'           // Someone liked your book
  | 'comment'        // Someone commented/reviewed your book
  | 'share'          // Someone shared your book
  | 'purchase'       // Someone purchased your book
  | 'new_message'    // New message from reader/author
  | 'new_follower'   // Someone followed you
  | 'book_published' // Your book was published
  | 'payment'        // Payment received
  | 'subscription'   // Subscription upgrade/change
  | 'quality_score'  // Book quality score updated
  | 'mention'        // Someone mentioned you
  | 'system'         // System notification
  | 'promotion';     // Your book was featured/promoted

// Notification interface
export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId; // User receiving the notification
  sender?: mongoose.Types.ObjectId;   // User who triggered the notification (if applicable)
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    bookId?: mongoose.Types.ObjectId;
    bookTitle?: string;
    conversationId?: mongoose.Types.ObjectId;
    paymentId?: string;
    amount?: number;
    currency?: string;
    subscriptionPlan?: string;
    qualityScore?: number;
    link?: string;
    [key: string]: any;
  };
  isRead: boolean;
  readAt?: Date;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Notification schema
const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: [
        'like',
        'comment',
        'share',
        'purchase',
        'new_message',
        'new_follower',
        'book_published',
        'payment',
        'subscription',
        'quality_score',
        'mention',
        'system',
        'promotion',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    data: {
      bookId: {
        type: Schema.Types.ObjectId,
        ref: 'Book',
      },
      bookTitle: String,
      conversationId: {
        type: Schema.Types.ObjectId,
        ref: 'Conversation',
      },
      paymentId: String,
      amount: Number,
      currency: String,
      subscriptionPlan: String,
      qualityScore: Number,
      link: String,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isArchived: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

// TTL index - auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
