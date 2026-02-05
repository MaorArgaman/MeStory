import mongoose, { Document, Schema } from 'mongoose';

// User role enum
export enum UserRole {
  FREE = 'free',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ADMIN = 'admin',
}

// Subscription interface
export interface ISubscription {
  tier: UserRole;
  price: number;
  credits: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  autoRenew?: boolean;
}

// Profile interface
export interface IProfile {
  bio?: string;
  avatar?: string;
  headerImage?: string;
  authorProfile?: {
    publishedBooks: number;
    totalSales: number;
    rating: number;
    followers: mongoose.Types.ObjectId[];
  };
  following?: mongoose.Types.ObjectId[];
  readingHistory?: Array<{
    bookId: mongoose.Types.ObjectId;
    progress: number;
    lastRead: Date;
  }>;
  writingStatistics?: {
    totalWords: number;
    booksWritten: number;
    averageQualityScore?: number;
  };
  earnings?: {
    totalEarned: number;
    pendingPayout: number;
    withdrawn: number;
    lastPayoutDate?: Date;
    history: Array<{
      amount: number;
      date: Date;
      status: 'pending' | 'completed' | 'failed';
      paypalEmail: string;
    }>;
  };
  notificationPreferences?: {
    writing: boolean;
    publishing: boolean;
    sales: boolean;
    social: boolean;
    system: boolean;
    emailDigest: boolean;
    quietHours?: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
}

// PayPal interface
export interface IPayPal {
  email?: string;
  accountId?: string;
  isVerified: boolean;
  connectedAt?: Date;
}

// Email verification interface
export interface IEmailVerification {
  isVerified: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  verifiedAt?: Date;
}

// User interface extending Mongoose Document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  credits: number;
  subscription?: ISubscription;
  profile?: IProfile;
  paypal?: IPayPal;
  emailVerification: IEmailVerification;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription schema
const SubscriptionSchema = new Schema<ISubscription>(
  {
    tier: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.FREE,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    credits: {
      type: Number,
      required: true,
      default: 100,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// Profile schema
const ProfileSchema = new Schema<IProfile>(
  {
    bio: {
      type: String,
      maxlength: 500,
    },
    avatar: {
      type: String,
    },
    headerImage: {
      type: String,
    },
    authorProfile: {
      publishedBooks: {
        type: Number,
        default: 0,
      },
      totalSales: {
        type: Number,
        default: 0,
      },
      rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      followers: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
    },
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    readingHistory: [
      {
        bookId: {
          type: Schema.Types.ObjectId,
          ref: 'Book',
        },
        progress: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        lastRead: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    writingStatistics: {
      totalWords: {
        type: Number,
        default: 0,
      },
      booksWritten: {
        type: Number,
        default: 0,
      },
      averageQualityScore: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    earnings: {
      totalEarned: {
        type: Number,
        default: 0,
      },
      pendingPayout: {
        type: Number,
        default: 0,
      },
      withdrawn: {
        type: Number,
        default: 0,
      },
      lastPayoutDate: {
        type: Date,
      },
      history: [
        {
          amount: Number,
          date: Date,
          status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
          },
          paypalEmail: String,
        },
      ],
    },
    notificationPreferences: {
      writing: {
        type: Boolean,
        default: true,
      },
      publishing: {
        type: Boolean,
        default: true,
      },
      sales: {
        type: Boolean,
        default: true,
      },
      social: {
        type: Boolean,
        default: true,
      },
      system: {
        type: Boolean,
        default: true,
      },
      emailDigest: {
        type: Boolean,
        default: false,
      },
      quietHours: {
        enabled: {
          type: Boolean,
          default: false,
        },
        start: {
          type: String,
        },
        end: {
          type: String,
        },
      },
    },
  },
  { _id: false }
);

// PayPal schema
const PayPalSchema = new Schema<IPayPal>(
  {
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    accountId: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    connectedAt: {
      type: Date,
    },
  },
  { _id: false }
);

// Email verification schema
const EmailVerificationSchema = new Schema<IEmailVerification>(
  {
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
    },
    verificationCodeExpires: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
  },
  { _id: false }
);

// User schema
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.FREE,
      required: true,
    },
    credits: {
      type: Number,
      required: true,
      default: 100, // Free tier starts with 100 credits
      min: [0, 'Credits cannot be negative'],
    },
    subscription: {
      type: SubscriptionSchema,
    },
    profile: {
      type: ProfileSchema,
      default: () => ({}),
    },
    paypal: {
      type: PayPalSchema,
    },
    emailVerification: {
      type: EmailVerificationSchema,
      default: () => ({ isVerified: false }),
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'subscription.tier': 1 });
UserSchema.index({ createdAt: -1 });

// Virtual for checking if user is premium
UserSchema.virtual('isPremium').get(function (this: IUser) {
  return this.role === UserRole.PREMIUM || this.role === UserRole.ADMIN;
});

// Virtual for checking if user has credits
UserSchema.virtual('hasCredits').get(function (this: IUser) {
  if (this.role === UserRole.PREMIUM || this.role === UserRole.ADMIN) {
    return true; // Unlimited credits
  }
  return this.credits > 0;
});

// Method to deduct credits
UserSchema.methods.deductCredits = async function (amount: number): Promise<boolean> {
  if (this.role === UserRole.PREMIUM || this.role === UserRole.ADMIN) {
    return true; // Premium users have unlimited credits
  }

  if (this.credits >= amount) {
    this.credits -= amount;
    await this.save();
    return true;
  }

  return false;
};

// Method to add credits
UserSchema.methods.addCredits = async function (amount: number): Promise<void> {
  this.credits += amount;
  await this.save();
};

// Export the model
export const User = mongoose.model<IUser>('User', UserSchema);
