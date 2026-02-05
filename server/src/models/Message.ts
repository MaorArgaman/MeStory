/**
 * Message and Conversation Models
 * Handles reader-author communication
 */

import mongoose, { Document, Schema } from 'mongoose';

// Message interface
export interface IMessage extends Document {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Conversation interface
export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  book?: mongoose.Types.ObjectId; // Optional: conversation about a specific book
  lastMessage?: {
    content: string;
    sender: mongoose.Types.ObjectId;
    sentAt: Date;
  };
  unreadCount: Map<string, number>; // Map of participantId -> unread count
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Message Schema
const messageSchema = new Schema<IMessage>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Conversation Schema
const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      default: null,
    },
    lastMessage: {
      content: String,
      sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      sentAt: Date,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

conversationSchema.index({ participants: 1 });
conversationSchema.index({ book: 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ 'lastMessage.sentAt': -1 });

// Compound index for finding conversations between specific users
conversationSchema.index({ participants: 1, book: 1 }, { unique: true, sparse: true });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
