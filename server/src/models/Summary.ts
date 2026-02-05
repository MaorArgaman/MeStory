import mongoose, { Document, Schema } from 'mongoose';

// Source type enum (Section 4.1)
export enum SourceType {
  INTERVIEW = 'interview',
  FILE = 'file',
  AUDIO = 'audio',
  DIRECT = 'direct',
}

// Character definition for summary
export interface ISummaryCharacter {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  description?: string;
  traits?: string[];
  backstory?: string;
  goals?: string;
  arc?: string;
}

// Plot structure for summary
export interface ISummaryPlotStructure {
  premise?: string;
  theme?: string;
  genre?: string;
  setting?: string;
  threeActStructure?: {
    act1: string; // Setup
    act2: string; // Confrontation
    act3: string; // Resolution
  };
  plotPoints?: {
    incitingIncident?: string;
    firstPlotPoint?: string;
    midpoint?: string;
    climax?: string;
    resolution?: string;
  };
  conflict?: {
    type: string;
    description: string;
  };
  tone?: string;
  targetAudience?: string;
}

// Chapter outline for summary
export interface ISummaryChapter {
  chapterNumber: number;
  title: string;
  summary: string;
  keyEvents?: string[];
  characters?: string[];
  estimatedWordCount?: number;
  notes?: string;
}

// Interview metadata
export interface IInterviewMetadata {
  totalQuestions?: number;
  questionsAnswered?: number;
  sessionDuration?: number; // in minutes
  conversationId?: string;
  aiModel?: string;
}

// File upload metadata
export interface IFileMetadata {
  originalFilename: string;
  fileType: string;
  fileSize: number; // in bytes
  uploadedAt: Date;
  extractedText?: string;
  pageCount?: number;
}

// Audio upload metadata
export interface IAudioMetadata {
  originalFilename: string;
  audioFormat: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  uploadedAt: Date;
  transcriptionModel?: string;
  transcriptionDuration?: number; // in seconds
}

// Summary interface extending Mongoose Document
export interface ISummary extends Document {
  userId: mongoose.Types.ObjectId;
  bookId?: mongoose.Types.ObjectId; // Reference to created book (if converted)
  sourceType: SourceType;
  content: string; // Original content (interview transcript, file text, or audio transcript)
  summary: string; // AI-generated summary
  characters: ISummaryCharacter[];
  plotStructure: ISummaryPlotStructure;
  chapters: ISummaryChapter[];
  metadata?: IInterviewMetadata | IFileMetadata | IAudioMetadata;
  status: 'pending' | 'processing' | 'completed' | 'converted' | 'failed';
  error?: string;
  aiCreditsUsed?: number;
  convertedToBook: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Character schema
const SummaryCharacterSchema = new Schema<ISummaryCharacter>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['protagonist', 'antagonist', 'supporting', 'minor'],
      required: true,
    },
    description: {
      type: String,
    },
    traits: {
      type: [String],
      default: [],
    },
    backstory: {
      type: String,
    },
    goals: {
      type: String,
    },
    arc: {
      type: String,
    },
  },
  { _id: false }
);

// Plot structure schema
const SummaryPlotStructureSchema = new Schema<ISummaryPlotStructure>(
  {
    premise: {
      type: String,
    },
    theme: {
      type: String,
    },
    genre: {
      type: String,
    },
    setting: {
      type: String,
    },
    threeActStructure: {
      act1: {
        type: String,
      },
      act2: {
        type: String,
      },
      act3: {
        type: String,
      },
    },
    plotPoints: {
      incitingIncident: {
        type: String,
      },
      firstPlotPoint: {
        type: String,
      },
      midpoint: {
        type: String,
      },
      climax: {
        type: String,
      },
      resolution: {
        type: String,
      },
    },
    conflict: {
      type: {
        type: String,
      },
      description: {
        type: String,
      },
    },
    tone: {
      type: String,
    },
    targetAudience: {
      type: String,
    },
  },
  { _id: false }
);

// Chapter outline schema
const SummaryChapterSchema = new Schema<ISummaryChapter>(
  {
    chapterNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
    },
    keyEvents: {
      type: [String],
      default: [],
    },
    characters: {
      type: [String],
      default: [],
    },
    estimatedWordCount: {
      type: Number,
    },
    notes: {
      type: String,
    },
  },
  { _id: false }
);

// Interview metadata schema (reserved for future use)
export const _InterviewMetadataSchema = new Schema(
  {
    totalQuestions: {
      type: Number,
    },
    questionsAnswered: {
      type: Number,
    },
    sessionDuration: {
      type: Number,
    },
    conversationId: {
      type: String,
    },
    aiModel: {
      type: String,
      default: 'gemini-2.5-flash',
    },
  },
  { _id: false }
);

// File metadata schema (reserved for future use)
export const _FileMetadataSchema = new Schema(
  {
    originalFilename: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    extractedText: {
      type: String,
    },
    pageCount: {
      type: Number,
    },
  },
  { _id: false }
);

// Audio metadata schema (reserved for future use)
export const _AudioMetadataSchema = new Schema(
  {
    originalFilename: {
      type: String,
      required: true,
    },
    audioFormat: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    transcriptionModel: {
      type: String,
      default: 'gemini-2.5-flash',
    },
    transcriptionDuration: {
      type: Number,
    },
  },
  { _id: false }
);

// Summary schema
const SummarySchema = new Schema<ISummary>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      index: true,
    },
    sourceType: {
      type: String,
      enum: Object.values(SourceType),
      required: [true, 'Source type is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    summary: {
      type: String,
      required: true,
    },
    characters: {
      type: [SummaryCharacterSchema],
      default: [],
    },
    plotStructure: {
      type: SummaryPlotStructureSchema,
      required: true,
    },
    chapters: {
      type: [SummaryChapterSchema],
      default: [],
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'converted', 'failed'],
      default: 'pending',
      required: true,
    },
    error: {
      type: String,
    },
    aiCreditsUsed: {
      type: Number,
      default: 0,
    },
    convertedToBook: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'summaries',
  }
);

// Indexes
SummarySchema.index({ userId: 1 });
SummarySchema.index({ bookId: 1 });
SummarySchema.index({ sourceType: 1 });
SummarySchema.index({ status: 1 });
SummarySchema.index({ convertedToBook: 1 });
SummarySchema.index({ createdAt: -1 });

// Compound indexes
SummarySchema.index({ userId: 1, status: 1 });
SummarySchema.index({ userId: 1, convertedToBook: 1 });

// Virtual for checking if summary is ready for conversion
SummarySchema.virtual('isReadyForConversion').get(function (this: ISummary) {
  return (
    this.status === 'completed' &&
    !this.convertedToBook &&
    this.summary &&
    this.plotStructure &&
    this.characters.length > 0 &&
    this.chapters.length > 0
  );
});

// Virtual for total estimated word count
SummarySchema.virtual('totalEstimatedWordCount').get(function (this: ISummary) {
  return this.chapters.reduce((total, chapter) => total + (chapter.estimatedWordCount || 0), 0);
});

// Pre-save middleware to validate metadata based on source type
SummarySchema.pre('save', function (next) {
  if (this.sourceType === SourceType.INTERVIEW && this.metadata) {
    // Validate interview metadata
    const metadata = this.metadata as IInterviewMetadata;
    if (!metadata.conversationId) {
      return next(new Error('Interview metadata must include conversationId'));
    }
  } else if (this.sourceType === SourceType.FILE && this.metadata) {
    // Validate file metadata
    const metadata = this.metadata as IFileMetadata;
    if (!metadata.originalFilename || !metadata.fileType) {
      return next(new Error('File metadata must include originalFilename and fileType'));
    }
  } else if (this.sourceType === SourceType.AUDIO && this.metadata) {
    // Validate audio metadata
    const metadata = this.metadata as IAudioMetadata;
    if (!metadata.originalFilename || !metadata.audioFormat || !metadata.duration) {
      return next(new Error('Audio metadata must include originalFilename, audioFormat, and duration'));
    }
  }

  next();
});

// Export the model
export const Summary = mongoose.model<ISummary>('Summary', SummarySchema);
