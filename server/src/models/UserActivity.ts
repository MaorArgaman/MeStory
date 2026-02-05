import mongoose, { Document, Schema } from 'mongoose';

/**
 * User Activity Model
 * Tracks reading history, writing progress, and preferences for personalized recommendations
 */

// Reading Progress interface
export interface IReadingProgress {
  bookId: mongoose.Types.ObjectId;
  lastChapterRead: number;
  percentageComplete: number;
  totalReadingTime: number; // in minutes
  lastReadAt: Date;
  isCompleted: boolean;
  rating?: number; // 1-5 stars if user rated
}

// Writing Progress interface
export interface IWritingProgress {
  bookId: mongoose.Types.ObjectId;
  lastEditedAt: Date;
  isCompleted: boolean;
  totalWritingTime: number; // in minutes
}

// Genre Preference interface
export interface IGenrePreference {
  genre: string;
  weight: number; // 0-100, higher = more preferred
  readCount: number;
  writtenCount: number;
  lastInteraction: Date;
}

// Author Preference interface
export interface IAuthorPreference {
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  booksRead: number;
  averageRating: number;
  isFollowing: boolean;
  lastInteraction: Date;
}

// Interaction Event for ML training
export interface IInteractionEvent {
  type: 'view' | 'read' | 'complete' | 'purchase' | 'like' | 'share' | 'review' | 'abandon';
  bookId: mongoose.Types.ObjectId;
  genre: string;
  authorId: mongoose.Types.ObjectId;
  duration?: number; // time spent in minutes
  timestamp: Date;
  metadata?: Record<string, any>;
}

// User Activity Document interface
export interface IUserActivity extends Document {
  userId: mongoose.Types.ObjectId;

  // Reading tracking
  readingHistory: IReadingProgress[];
  currentlyReading: mongoose.Types.ObjectId[];
  completedBooks: mongoose.Types.ObjectId[];
  abandonedBooks: mongoose.Types.ObjectId[];

  // Writing tracking
  writingProgress: IWritingProgress[];
  currentlyWriting: mongoose.Types.ObjectId[];
  completedWriting: mongoose.Types.ObjectId[];
  abandonedWriting: mongoose.Types.ObjectId[];

  // Preferences (learned from behavior)
  genrePreferences: IGenrePreference[];
  authorPreferences: IAuthorPreference[];
  preferredLanguages: string[];
  preferredReadingLength: 'short' | 'medium' | 'long' | 'any';

  // Interaction history for ML
  interactionEvents: IInteractionEvent[];

  // Engagement metrics
  totalBooksRead: number;
  totalBooksWritten: number;
  totalReadingTime: number;
  totalWritingTime: number;
  averageSessionDuration: number;
  lastActiveAt: Date;

  // Activity streak
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: Date;

  createdAt: Date;
  updatedAt: Date;
}

// Reading Progress Schema
const ReadingProgressSchema = new Schema<IReadingProgress>(
  {
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    lastChapterRead: {
      type: Number,
      default: 0,
    },
    percentageComplete: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalReadingTime: {
      type: Number,
      default: 0,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  { _id: false }
);

// Writing Progress Schema
const WritingProgressSchema = new Schema<IWritingProgress>(
  {
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    lastEditedAt: {
      type: Date,
      default: Date.now,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    totalWritingTime: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// Genre Preference Schema
const GenrePreferenceSchema = new Schema<IGenrePreference>(
  {
    genre: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    readCount: {
      type: Number,
      default: 0,
    },
    writtenCount: {
      type: Number,
      default: 0,
    },
    lastInteraction: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Author Preference Schema
const AuthorPreferenceSchema = new Schema<IAuthorPreference>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    booksRead: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    isFollowing: {
      type: Boolean,
      default: false,
    },
    lastInteraction: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Interaction Event Schema
const InteractionEventSchema = new Schema<IInteractionEvent>(
  {
    type: {
      type: String,
      enum: ['view', 'read', 'complete', 'purchase', 'like', 'share', 'review', 'abandon'],
      required: true,
    },
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    genre: {
      type: String,
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    duration: {
      type: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { _id: false }
);

// Main User Activity Schema
const UserActivitySchema = new Schema<IUserActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // Reading tracking
    readingHistory: {
      type: [ReadingProgressSchema],
      default: [],
    },
    currentlyReading: [{
      type: Schema.Types.ObjectId,
      ref: 'Book',
    }],
    completedBooks: [{
      type: Schema.Types.ObjectId,
      ref: 'Book',
    }],
    abandonedBooks: [{
      type: Schema.Types.ObjectId,
      ref: 'Book',
    }],

    // Writing tracking
    writingProgress: {
      type: [WritingProgressSchema],
      default: [],
    },
    currentlyWriting: [{
      type: Schema.Types.ObjectId,
      ref: 'Book',
    }],
    completedWriting: [{
      type: Schema.Types.ObjectId,
      ref: 'Book',
    }],
    abandonedWriting: [{
      type: Schema.Types.ObjectId,
      ref: 'Book',
    }],

    // Preferences
    genrePreferences: {
      type: [GenrePreferenceSchema],
      default: [],
    },
    authorPreferences: {
      type: [AuthorPreferenceSchema],
      default: [],
    },
    preferredLanguages: {
      type: [String],
      default: ['en', 'he'],
    },
    preferredReadingLength: {
      type: String,
      enum: ['short', 'medium', 'long', 'any'],
      default: 'any',
    },

    // Interaction history
    interactionEvents: {
      type: [InteractionEventSchema],
      default: [],
    },

    // Engagement metrics
    totalBooksRead: {
      type: Number,
      default: 0,
    },
    totalBooksWritten: {
      type: Number,
      default: 0,
    },
    totalReadingTime: {
      type: Number,
      default: 0,
    },
    totalWritingTime: {
      type: Number,
      default: 0,
    },
    averageSessionDuration: {
      type: Number,
      default: 0,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },

    // Activity streak
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastStreakDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'user_activities',
  }
);

// Indexes for efficient queries
UserActivitySchema.index({ userId: 1 });
UserActivitySchema.index({ 'genrePreferences.genre': 1, 'genrePreferences.weight': -1 });
UserActivitySchema.index({ lastActiveAt: -1 });
UserActivitySchema.index({ 'interactionEvents.timestamp': -1 });

// Limit interaction events to last 1000 for memory efficiency
UserActivitySchema.pre('save', function (next) {
  if (this.interactionEvents.length > 1000) {
    this.interactionEvents = this.interactionEvents.slice(-1000);
  }
  next();
});

export const UserActivity = mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);
