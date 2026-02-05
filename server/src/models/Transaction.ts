import { Schema, model, Document, Types } from 'mongoose';

/**
 * Transaction Model
 * Logs all payment transactions for audit and accounting
 */

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  amount: number;
  currency: string;
  plan: 'free' | 'standard' | 'premium';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'paypal' | 'mock' | 'credit_card';
  orderId?: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  description: string;
  metadata?: {
    previousPlan?: string;
    creditsAdded?: number;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      enum: ['USD', 'ILS'],
      default: 'USD',
    },
    plan: {
      type: String,
      required: true,
      enum: ['free', 'standard', 'premium'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['paypal', 'mock', 'credit_card'],
      default: 'mock',
    },
    orderId: {
      type: String,
      index: true,
    },
    paypalOrderId: {
      type: String,
      index: true,
    },
    paypalCaptureId: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying user transactions
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
