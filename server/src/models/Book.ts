import mongoose, { Document, Schema } from 'mongoose';

// Chapter interface
export interface IChapter {
  _id?: mongoose.Types.ObjectId;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Character interface
export interface ICharacter {
  _id?: mongoose.Types.ObjectId;
  name: string;
  age?: number;
  description: string;
  traits: string[];
  backstory?: string;
  goals?: string;
  motivations?: string;
  relationships?: Array<{
    characterId: mongoose.Types.ObjectId | string;
    characterName: string;
    relationship: string;
  }>;
  arc?: string;
  notes?: string;
}

// Quality Score Category interface
export interface IQualityCategory {
  score: number; // 0-100
  weight: number; // Percentage weight
  feedback?: string;
  examples?: string[];
}

// Quality Score interface (Section 5.5)
export interface IQualityScore {
  overallScore: number; // 0-100
  rating: number; // 1-5 stars
  ratingLabel: 'Masterpiece' | 'Excellent' | 'Good' | 'Fair' | 'Needs Work';
  categories: {
    writingQuality: IQualityCategory; // 25%
    plotStructure: IQualityCategory; // 20%
    characterDevelopment: IQualityCategory; // 20%
    dialogue: IQualityCategory; // 15%
    setting: IQualityCategory; // 10%
    originality: IQualityCategory; // 10%
  };
  detailedFeedback?: string;
  suggestions?: string[];
  evaluatedAt: Date;
  evaluatedBy: 'ai' | 'admin';
}

// Cover Design interface (Section 6.1)
export interface ICoverDesign {
  front?: {
    type: 'ai-generated' | 'uploaded' | 'gradient' | 'solid';
    imageUrl?: string;
    backgroundColor?: string;
    gradientColors?: string[];
    title: {
      text: string;
      font: string;
      size: number;
      color: string;
      position: {
        x: number;
        y: number;
      };
    };
    subtitle?: {
      text: string;
      font: string;
      size: number;
      color: string;
    };
    authorName: {
      text: string;
      font: string;
      size: number;
      color: string;
    };
  };
  back?: {
    imageUrl?: string;
    backgroundColor?: string;
    synopsis: string;
    authorBio?: string;
    authorPhoto?: string;
    barcodeArea?: {
      isbn?: string;
      position: {
        x: number;
        y: number;
      };
    };
  };
  spine?: {
    width: number; // Auto-calculated based on page count
    title: string;
    author: string;
    backgroundColor?: string;
  };
}

// Page Image interface (for Book Layout visualization)
export interface IPageImage {
  _id?: mongoose.Types.ObjectId;
  pageIndex: number; // Which page this image belongs to
  url: string;
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  width: number; // Percentage of page width (0-100)
  height: number; // Percentage of page height (0-100)
  rotation: number; // Rotation in degrees
  isAiGenerated: boolean;
  prompt?: string; // If AI generated, the prompt used
  createdAt: Date;
}

// Page Layout interface (Section 6.2)
export interface IPageLayout {
  bodyFont: string;
  fontSize: number; // 10-16pt
  lineHeight: number; // 1.2-2.0
  pageSize: 'A4' | 'A5' | 'Letter' | 'Custom';
  customPageSize?: {
    width: number;
    height: number;
  };
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  includeTableOfContents: boolean;
  tableOfContentsStyle?: string;
  headerFooter?: {
    includeHeader: boolean;
    includeFooter: boolean;
    includePageNumbers: boolean;
    pageNumberPosition: 'top' | 'bottom' | 'none';
  };
}

// Publishing Status interface (Section 9.1)
export interface IPublishingStatus {
  status: 'draft' | 'published' | 'unpublished';
  publishedAt?: Date;
  unpublishedAt?: Date;
  price: number; // 0-25 USD
  priceILS?: number; // 0-99 ILS
  isFree: boolean;
  isPublic: boolean;
  marketingStrategy?: {
    targetAudience?: string;
    description?: string;
    categories?: string[];
    tags?: string[];
    launchDate?: Date;
  };
}

// Statistics interface
export interface IStatistics {
  wordCount: number;
  pageCount: number;
  chapterCount: number;
  characterCount: number;
  views: number;
  purchases: number;
  revenue: number;
  averageRating?: number;
  totalReviews: number;
  completionRate?: number; // Percentage of readers who finished
  readingTime?: number; // Estimated reading time in minutes
  shares: number; // Number of times the book was shared
  comments: number; // Number of comments on the book
}

// Voice Interview Character Summary
export interface IVoiceInterviewCharacter {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  traits: string[];
  description: string;
}

// Voice Interview Summary
export interface IVoiceInterviewSummary {
  theme: {
    mainTheme: string;
    subThemes: string[];
    tone: string;
    genre: string;
  };
  characters: IVoiceInterviewCharacter[];
  plot: {
    premise: string;
    conflict: string;
    stakes: string;
    keyEvents: string[];
  };
  setting: {
    world: string;
    timePeriod: string;
    atmosphere: string;
    locations: string[];
  };
  writingGuidelines: string[];
}

// Voice Interview Response
export interface IVoiceInterviewResponse {
  topic: string;
  question: string;
  answer: string;
}

// Voice Interview Data
export interface IVoiceInterview {
  completedAt: Date;
  duration: number; // seconds
  responses: IVoiceInterviewResponse[];
  summary: IVoiceInterviewSummary;
}

// Story Context interface (Deep Dive Interview - 8 Pillars)
export interface IStoryContext {
  theme?: string; // Q1: Core theme/premise
  characters?: string; // Q2: Main characters & protagonist
  conflict?: string; // Q3: Central conflict/problem
  climax?: string; // Q4: Planned climax
  resolution?: string; // Q5: Resolution
  setting?: string; // Q6: Setting/world description
  keyPoints?: string; // Q7: Key plot points
  narrativeArc?: string; // Q8: Desired narrative arc/tone
  completedAt?: Date; // When the interview was completed
  voiceInterview?: IVoiceInterview; // Voice interview data
}

// Plot Structure interface
export interface IPlotStructure {
  threeActStructure?: {
    act1: string; // Setup
    act2: string; // Confrontation
    act3: string; // Resolution
  };
  plotPoints?: {
    incitingIncident?: string;
    firstPlotPoint?: string;
    midpoint?: string;
    secondPlotPoint?: string;
    climax?: string;
  };
  subplots?: Array<{
    title: string;
    description: string;
    status: 'planned' | 'in-progress' | 'completed';
  }>;
  timeline?: Array<{
    event: string;
    chapter?: number;
    date?: string;
  }>;
}

// Review interface
export interface IReview {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  userName?: string;
  rating: number; // 1-5 stars
  comment: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Book interface extending Mongoose Document
export interface IBook extends Document {
  title: string;
  author: mongoose.Types.ObjectId;
  genre: string;
  writingGoal?: 'short-story' | 'novella' | 'novel';
  targetAudience?: 'children' | 'young-adult' | 'adult' | 'all-ages';
  description?: string;
  synopsis?: string;
  storyContext?: IStoryContext; // Deep Dive Interview data
  chapters: IChapter[];
  characters: ICharacter[];
  plotStructure?: IPlotStructure;
  qualityScore?: IQualityScore;
  coverDesign?: ICoverDesign;
  pageLayout?: IPageLayout;
  pageImages?: IPageImage[];
  publishingStatus: IPublishingStatus;
  statistics: IStatistics;
  tags?: string[];
  language: string;
  ageRating?: 'G' | 'PG' | 'PG-13' | 'R' | '18+';
  likes: number;
  likedBy: mongoose.Types.ObjectId[];
  reviews: IReview[];
  createdAt: Date;
  updatedAt: Date;
}

// Chapter schema
const ChapterSchema = new Schema<IChapter>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Character schema
const CharacterSchema = new Schema<ICharacter>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
    },
    description: {
      type: String,
      required: true,
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
    motivations: {
      type: String,
    },
    relationships: [
      {
        characterId: {
          type: Schema.Types.Mixed, // Can be ObjectId or string
        },
        characterName: {
          type: String,
        },
        relationship: {
          type: String,
        },
      },
    ],
    arc: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  { _id: true }
);

// Quality Category schema
const QualityCategorySchema = new Schema<IQualityCategory>(
  {
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    feedback: {
      type: String,
    },
    examples: {
      type: [String],
    },
  },
  { _id: false }
);

// Quality Score schema (Section 5.5)
const QualityScoreSchema = new Schema<IQualityScore>(
  {
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    ratingLabel: {
      type: String,
      required: true,
      enum: ['Masterpiece', 'Excellent', 'Good', 'Fair', 'Needs Work'],
    },
    categories: {
      writingQuality: {
        type: QualityCategorySchema,
        required: true,
        default: () => ({ score: 0, weight: 25 }),
      },
      plotStructure: {
        type: QualityCategorySchema,
        required: true,
        default: () => ({ score: 0, weight: 20 }),
      },
      characterDevelopment: {
        type: QualityCategorySchema,
        required: true,
        default: () => ({ score: 0, weight: 20 }),
      },
      dialogue: {
        type: QualityCategorySchema,
        required: true,
        default: () => ({ score: 0, weight: 15 }),
      },
      setting: {
        type: QualityCategorySchema,
        required: true,
        default: () => ({ score: 0, weight: 10 }),
      },
      originality: {
        type: QualityCategorySchema,
        required: true,
        default: () => ({ score: 0, weight: 10 }),
      },
    },
    detailedFeedback: {
      type: String,
    },
    suggestions: {
      type: [String],
    },
    evaluatedAt: {
      type: Date,
      default: Date.now,
    },
    evaluatedBy: {
      type: String,
      enum: ['ai', 'admin'],
      default: 'ai',
    },
  },
  { _id: false }
);

// Cover Design schema
const CoverDesignSchema = new Schema<ICoverDesign>(
  {
    front: {
      type: {
        type: String,
        enum: ['ai-generated', 'uploaded', 'gradient', 'solid'],
      },
      imageUrl: String,
      backgroundColor: String,
      gradientColors: [String],
      title: {
        text: String,
        font: String,
        size: Number,
        color: String,
        position: {
          x: Number,
          y: Number,
        },
      },
      subtitle: {
        text: String,
        font: String,
        size: Number,
        color: String,
      },
      authorName: {
        text: String,
        font: String,
        size: Number,
        color: String,
      },
    },
    back: {
      imageUrl: String,
      backgroundColor: String,
      synopsis: String,
      authorBio: String,
      authorPhoto: String,
      barcodeArea: {
        isbn: String,
        position: {
          x: Number,
          y: Number,
        },
      },
    },
    spine: {
      width: Number,
      title: String,
      author: String,
      backgroundColor: String,
    },
  },
  { _id: false }
);

// Page Image schema (for Book Layout visualization)
const PageImageSchema = new Schema<IPageImage>(
  {
    pageIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    url: {
      type: String,
      required: true,
    },
    x: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
      max: 100,
    },
    y: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
      max: 100,
    },
    width: {
      type: Number,
      required: true,
      default: 30,
      min: 5,
      max: 100,
    },
    height: {
      type: Number,
      required: true,
      default: 30,
      min: 5,
      max: 100,
    },
    rotation: {
      type: Number,
      default: 0,
      min: -360,
      max: 360,
    },
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
    prompt: {
      type: String,
      maxlength: 1000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// Page Layout schema
const PageLayoutSchema = new Schema<IPageLayout>(
  {
    bodyFont: {
      type: String,
      default: 'Georgia',
    },
    fontSize: {
      type: Number,
      min: 10,
      max: 16,
      default: 12,
    },
    lineHeight: {
      type: Number,
      min: 1.2,
      max: 2.0,
      default: 1.6,
    },
    pageSize: {
      type: String,
      enum: ['A4', 'A5', 'Letter', 'Custom'],
      default: 'A5',
    },
    customPageSize: {
      width: Number,
      height: Number,
    },
    margins: {
      top: {
        type: Number,
        default: 25,
      },
      bottom: {
        type: Number,
        default: 25,
      },
      left: {
        type: Number,
        default: 25,
      },
      right: {
        type: Number,
        default: 25,
      },
    },
    includeTableOfContents: {
      type: Boolean,
      default: true,
    },
    tableOfContentsStyle: {
      type: String,
    },
    headerFooter: {
      includeHeader: {
        type: Boolean,
        default: false,
      },
      includeFooter: {
        type: Boolean,
        default: true,
      },
      includePageNumbers: {
        type: Boolean,
        default: true,
      },
      pageNumberPosition: {
        type: String,
        enum: ['top', 'bottom', 'none'],
        default: 'bottom',
      },
    },
  },
  { _id: false }
);

// Publishing Status schema
const PublishingStatusSchema = new Schema<IPublishingStatus>(
  {
    status: {
      type: String,
      enum: ['draft', 'published', 'unpublished'],
      default: 'draft',
      required: true,
    },
    publishedAt: {
      type: Date,
    },
    unpublishedAt: {
      type: Date,
    },
    price: {
      type: Number,
      min: 0,
      max: 25,
      default: 0,
    },
    priceILS: {
      type: Number,
      min: 0,
      max: 99,
    },
    isFree: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    marketingStrategy: {
      targetAudience: String,
      description: String,
      categories: [String],
      tags: [String],
      launchDate: Date,
    },
  },
  { _id: false }
);

// Statistics schema
const StatisticsSchema = new Schema<IStatistics>(
  {
    wordCount: {
      type: Number,
      default: 0,
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    chapterCount: {
      type: Number,
      default: 0,
    },
    characterCount: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    purchases: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    completionRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    readingTime: {
      type: Number,
    },
    shares: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// Voice Interview Response schema
const VoiceInterviewResponseSchema = new Schema(
  {
    topic: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

// Voice Interview Character schema
const VoiceInterviewCharacterSchema = new Schema(
  {
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ['protagonist', 'antagonist', 'supporting', 'minor'],
      required: true,
    },
    traits: [String],
    description: { type: String, required: true },
  },
  { _id: false }
);

// Voice Interview Summary schema
const VoiceInterviewSummarySchema = new Schema(
  {
    theme: {
      mainTheme: String,
      subThemes: [String],
      tone: String,
      genre: String,
    },
    characters: [VoiceInterviewCharacterSchema],
    plot: {
      premise: String,
      conflict: String,
      stakes: String,
      keyEvents: [String],
    },
    setting: {
      world: String,
      timePeriod: String,
      atmosphere: String,
      locations: [String],
    },
    writingGuidelines: [String],
  },
  { _id: false }
);

// Voice Interview schema
const VoiceInterviewSchema = new Schema<IVoiceInterview>(
  {
    completedAt: { type: Date, default: Date.now },
    duration: { type: Number, default: 0 },
    responses: [VoiceInterviewResponseSchema],
    summary: VoiceInterviewSummarySchema,
  },
  { _id: false }
);

// Story Context schema (Deep Dive Interview - 8 Pillars)
const StoryContextSchema = new Schema<IStoryContext>(
  {
    theme: {
      type: String,
      maxlength: [5000, 'Theme must not exceed 5000 characters'],
    },
    characters: {
      type: String,
      maxlength: [5000, 'Characters description must not exceed 5000 characters'],
    },
    conflict: {
      type: String,
      maxlength: [5000, 'Conflict description must not exceed 5000 characters'],
    },
    climax: {
      type: String,
      maxlength: [5000, 'Climax description must not exceed 5000 characters'],
    },
    resolution: {
      type: String,
      maxlength: [5000, 'Resolution description must not exceed 5000 characters'],
    },
    setting: {
      type: String,
      maxlength: [5000, 'Setting description must not exceed 5000 characters'],
    },
    keyPoints: {
      type: String,
      maxlength: [5000, 'Key points must not exceed 5000 characters'],
    },
    narrativeArc: {
      type: String,
      maxlength: [5000, 'Narrative arc description must not exceed 5000 characters'],
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    voiceInterview: {
      type: VoiceInterviewSchema,
    },
  },
  { _id: false }
);

// Plot Structure schema
const PlotStructureSchema = new Schema(
  {
    threeActStructure: {
      act1: String,
      act2: String,
      act3: String,
    },
    plotPoints: {
      incitingIncident: String,
      firstPlotPoint: String,
      midpoint: String,
      secondPlotPoint: String,
      climax: String,
    },
    subplots: [
      {
        title: String,
        description: String,
        status: {
          type: String,
          enum: ['planned', 'in-progress', 'completed'],
          default: 'planned',
        },
      },
    ],
    timeline: [
      {
        event: String,
        chapter: Number,
        date: String,
      },
    ],
  },
  { _id: false }
);

// Review schema
const ReviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// Book schema
const BookSchema = new Schema<IBook>(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      minlength: [1, 'Title must be at least 1 character'],
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true,
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true,
    },
    writingGoal: {
      type: String,
      enum: ['short-story', 'novella', 'novel'],
    },
    targetAudience: {
      type: String,
      enum: ['children', 'young-adult', 'adult', 'all-ages'],
    },
    description: {
      type: String,
      maxlength: [2000, 'Description must not exceed 2000 characters'],
    },
    synopsis: {
      type: String,
      maxlength: [5000, 'Synopsis must not exceed 5000 characters'],
    },
    storyContext: {
      type: StoryContextSchema,
    },
    chapters: {
      type: [ChapterSchema],
      default: [],
    },
    characters: {
      type: [CharacterSchema],
      default: [],
    },
    plotStructure: {
      type: PlotStructureSchema,
    },
    qualityScore: {
      type: QualityScoreSchema,
    },
    coverDesign: {
      type: CoverDesignSchema,
    },
    pageLayout: {
      type: PageLayoutSchema,
      default: () => ({}),
    },
    pageImages: {
      type: [PageImageSchema],
      default: [],
    },
    publishingStatus: {
      type: PublishingStatusSchema,
      default: () => ({}),
      required: true,
    },
    statistics: {
      type: StatisticsSchema,
      default: () => ({}),
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    language: {
      type: String,
      default: 'en',
    },
    ageRating: {
      type: String,
      enum: ['G', 'PG', 'PG-13', 'R', '18+'],
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reviews: {
      type: [ReviewSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'books',
  }
);

// Indexes
BookSchema.index({ author: 1 });
BookSchema.index({ genre: 1 });
BookSchema.index({ 'publishingStatus.status': 1 });
BookSchema.index({ 'publishingStatus.price': 1 });
BookSchema.index({ 'qualityScore.overallScore': -1 });
BookSchema.index({ 'statistics.views': -1 });
BookSchema.index({ 'statistics.purchases': -1 });
BookSchema.index({ createdAt: -1 });
BookSchema.index({ tags: 1 });

// Compound indexes
BookSchema.index({ 'publishingStatus.status': 1, 'publishingStatus.isPublic': 1 });
BookSchema.index({ genre: 1, 'qualityScore.overallScore': -1 });

// Virtual for checking if book is published
BookSchema.virtual('isPublished').get(function (this: IBook) {
  return this.publishingStatus.status === 'published' && this.publishingStatus.isPublic;
});

// Virtual for formatted price
BookSchema.virtual('formattedPrice').get(function (this: IBook) {
  return this.publishingStatus.isFree ? 'Free' : `$${this.publishingStatus.price}`;
});

// Pre-save middleware to update statistics
BookSchema.pre('save', function (next) {
  // Update chapter count
  this.statistics.chapterCount = this.chapters.length;

  // Update character count
  this.statistics.characterCount = this.characters.length;

  // Update word count
  this.statistics.wordCount = this.chapters.reduce((total, chapter) => total + chapter.wordCount, 0);

  // Estimate page count (approximately 250 words per page)
  this.statistics.pageCount = Math.ceil(this.statistics.wordCount / 250);

  // Ensure page count is divisible by 4 for binding (Section 16.4)
  const remainder = this.statistics.pageCount % 4;
  if (remainder !== 0) {
    this.statistics.pageCount += 4 - remainder;
  }

  // Estimate reading time (approximately 250 words per minute)
  this.statistics.readingTime = Math.ceil(this.statistics.wordCount / 250);

  next();
});

// Export the model
export const Book = mongoose.model<IBook>('Book', BookSchema);
