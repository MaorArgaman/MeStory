import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Book } from '../models/Book';
import { Summary } from '../models/Summary';
import { Transaction } from '../models/Transaction';
import { Notification } from '../models/Notification';
import { UserActivity } from '../models/UserActivity';
import { AuthRequest } from '../types';
import { supabaseAdmin } from '../config/supabase';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Get user earnings data
 * GET /api/user/earnings
 * Section 9.2: Revenue Model
 */
export const getEarnings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const userId = req.user.id;

    // Get all published books by this author
    const books = await Book.find({
      author: userId,
      'publishingStatus.status': 'published',
    });

    // Calculate total earnings (50% of book sales revenue)
    let totalRevenue = 0;
    let totalSales = 0;
    const dailySales: { [key: string]: number } = {};
    const monthlySales: { [key: string]: number } = {};

    books.forEach((book) => {
      const revenue = book.statistics?.revenue || 0;
      const purchases = book.statistics?.purchases || 0;

      totalRevenue += revenue;
      totalSales += purchases;

      // Mock daily/monthly data (in real app, track actual dates)
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().substring(0, 7);

      if (!dailySales[today]) {
        dailySales[today] = 0;
      }
      dailySales[today] += revenue * 0.1; // Mock 10% of revenue for today

      if (!monthlySales[thisMonth]) {
        monthlySales[thisMonth] = 0;
      }
      monthlySales[thisMonth] += revenue;
    });

    // Author gets 50% of revenue
    const authorEarnings = totalRevenue * 0.5;

    // Get user to check withdrawal history
    const user = await User.findById(userId);
    const withdrawn = user?.profile?.earnings?.withdrawn || 0;
    const available = authorEarnings - withdrawn;

    res.status(200).json({
      success: true,
      data: {
        earnings: {
          total: authorEarnings,
          available,
          withdrawn,
          pending: 0, // Placeholder for pending payouts
        },
        sales: {
          totalBooks: books.length,
          totalSales,
          totalRevenue,
        },
        dailySales: Object.entries(dailySales).map(([date, amount]) => ({
          date,
          amount: amount * 0.5, // 50% to author
        })),
        monthlySales: Object.entries(monthlySales).map(([month, amount]) => ({
          month,
          amount: amount * 0.5, // 50% to author
        })),
        topBooks: books
          .sort((a, b) => (b.statistics?.revenue || 0) - (a.statistics?.revenue || 0))
          .slice(0, 5)
          .map((book) => ({
            id: book.id,
            title: book.title,
            sales: book.statistics?.purchases || 0,
            revenue: ((book.statistics?.revenue || 0) * 0.5).toFixed(2),
            price: book.publishingStatus?.price || 0,
          })),
      },
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get earnings',
    });
  }
};

/**
 * Update user profile
 * PUT /api/user/profile
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { name, bio, avatar } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Build update object
    const updateData: any = {};
    if (name) updateData.name = name;

    // Handle profile updates
    const profileUpdates: any = { ...user.profile };
    if (!profileUpdates) {
      updateData.profile = {};
    }
    if (bio !== undefined) profileUpdates.bio = bio;
    if (avatar) profileUpdates.avatar = avatar;
    updateData.profile = profileUpdates;

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData);

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: 'Failed to update user',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          credits: updatedUser.credits,
          profile: updatedUser.profile,
        },
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
};

/**
 * Change user password
 * PUT /api/user/password
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { oldPassword, newPassword } = req.body;

    // Validation
    if (!oldPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Please provide both old and new passwords',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters',
      });
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      res.status(400).json({
        success: false,
        error: 'Current password is incorrect',
      });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
    });
  }
};

/**
 * Request withdrawal of earnings
 * POST /api/user/withdraw
 * BUG-003 FIX: Added optimistic locking to prevent race conditions
 */
export const requestWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { amount } = req.body;

    if (!amount || amount < 10) {
      res.status(400).json({
        success: false,
        error: 'Minimum withdrawal amount is $10',
      });
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Check if PayPal is connected
    if (!user.paypal?.email) {
      res.status(400).json({
        success: false,
        error: 'Please connect your PayPal account first',
      });
      return;
    }

    // Calculate available balance
    const books = await Book.find({
      author: req.user.id,
      'publishingStatus.status': 'published',
    });

    const totalRevenue = books.reduce(
      (sum, book) => sum + (book.statistics?.revenue || 0),
      0
    );
    const authorEarnings = totalRevenue * 0.5;
    const withdrawn = user.profile?.earnings?.withdrawn || 0;
    const available = authorEarnings - withdrawn;

    if (amount > available) {
      res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: $${available.toFixed(2)}`,
      });
      return;
    }

    // BUG-003 FIX: Use optimistic locking with atomic update

    // Build updated profile with earnings
    const currentProfile = user.profile || {};
    const currentEarnings = currentProfile.earnings || { totalEarned: 0, pendingPayout: 0, withdrawn: 0, history: [] };
    const newWithdrawnAmount = currentEarnings.withdrawn + amount;
    const updatedEarnings = {
      ...currentEarnings,
      withdrawn: newWithdrawnAmount,
      history: [
        ...currentEarnings.history,
        {
          amount,
          date: new Date().toISOString(),
          status: 'pending',
          paypalEmail: user.paypal?.email || '',
        },
      ],
    };

    const updatedProfile = {
      ...currentProfile,
      earnings: updatedEarnings,
    };

    // BUG-003 FIX: Atomic update with version check (optimistic locking)
    // Re-fetch user and verify balance hasn't changed before updating
    const { data: freshUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (fetchError || !freshUser) {
      res.status(500).json({
        success: false,
        error: 'Failed to verify user data',
      });
      return;
    }

    // Re-validate the balance with fresh data
    const freshWithdrawn = freshUser.profile?.earnings?.withdrawn || 0;
    const freshAvailable = authorEarnings - freshWithdrawn;

    if (amount > freshAvailable) {
      res.status(409).json({
        success: false,
        error: `Balance has changed. Available: $${freshAvailable.toFixed(2)}`,
      });
      return;
    }

    // Perform atomic update with version check using updated_at as version field
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        profile: updatedProfile,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .eq('updated_at', freshUser.updated_at) // Optimistic lock check
      .select();

    if (updateError) {
      console.error('Withdrawal update error:', updateError);
      res.status(500).json({
        success: false,
        error: 'Failed to process withdrawal request',
      });
      return;
    }

    // Check if the update affected any rows (optimistic lock succeeded)
    if (!updateResult || updateResult.length === 0) {
      res.status(409).json({
        success: false,
        error: 'Concurrent modification detected. Please try again.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        withdrawal: {
          amount,
          status: 'pending',
          paypalEmail: user.paypal.email,
        },
      },
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process withdrawal request',
    });
  }
};

/**
 * Get user profile by ID
 * GET /api/user/profile/:id
 */
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
      });
      return;
    }

    const userResult = await User.findById(id);

    if (!userResult) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Remove sensitive fields (Supabase returns full objects)
    const { password, paypal, ...user } = userResult as any;

    // Get user's published books
    const books = await Book.find({
      author: id,
      'publishingStatus.status': 'published',
      'publishingStatus.isPublic': true,
    });

    // Calculate total reads (views)
    const totalReads = books.reduce((sum, book) => sum + (book.statistics?.views || 0), 0);

    // Check if current user is following this profile
    let isFollowing = false;
    if (req.user) {
      const currentUser = await User.findById(req.user.id);
      if (currentUser && currentUser.profile?.following) {
        isFollowing = currentUser.profile.following.some(
          (followingId) => followingId === id
        );
      }
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          bio: user.profile?.bio,
          avatar: user.profile?.avatar,
          headerImage: user.profile?.headerImage,
          role: user.role,
          stats: {
            publishedBooks: user.profile?.authorProfile?.publishedBooks || books.length,
            totalReads,
            followers: user.profile?.authorProfile?.followers?.length || 0,
            rating: user.profile?.authorProfile?.rating || 0,
          },
          isFollowing,
        },
        books,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
    });
  }
};

/**
 * Update user language preference
 * PUT /api/user/language
 */
export const updateLanguage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { language } = req.body;

    // Validate language
    if (!language || !['en', 'he'].includes(language)) {
      res.status(400).json({
        success: false,
        error: 'Invalid language. Must be "en" or "he"',
      });
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Build updated profile with language
    const currentProfile = user.profile || {};
    await User.findByIdAndUpdate(req.user.id, {
      profile: {
        ...currentProfile,
        language,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Language preference updated successfully',
      data: {
        language,
      },
    });
  } catch (error) {
    console.error('Update language error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update language preference',
    });
  }
};

/**
 * Toggle follow/unfollow a user
 * POST /api/user/:id/follow
 */
export const followUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
      });
      return;
    }

    if (id === req.user.id) {
      res.status(400).json({
        success: false,
        error: 'You cannot follow yourself',
      });
      return;
    }

    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(id);

    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    if (!currentUser) {
      res.status(404).json({
        success: false,
        error: 'Current user not found',
      });
      return;
    }

    // Initialize profile structures
    const currentUserProfile = currentUser.profile || {};
    const currentUserFollowing = currentUserProfile.following || [];

    const targetUserProfile = targetUser.profile || {};
    const targetUserAuthorProfile = targetUserProfile.authorProfile || {
      publishedBooks: 0,
      totalSales: 0,
      rating: 0,
      followers: [],
    };

    const targetUserId = targetUser.id;
    const currentUserId = currentUser.id;

    // Check if already following
    const followingIndex = currentUserFollowing.findIndex(
      (followingId) => followingId === targetUserId
    );

    if (followingIndex > -1) {
      // Unfollow
      const updatedFollowing = [...currentUserFollowing];
      updatedFollowing.splice(followingIndex, 1);

      const followerIndex = targetUserAuthorProfile.followers.findIndex(
        (followerId) => followerId === currentUserId
      );
      const updatedFollowers = [...targetUserAuthorProfile.followers];
      if (followerIndex > -1) {
        updatedFollowers.splice(followerIndex, 1);
      }

      await User.findByIdAndUpdate(req.user.id, {
        profile: {
          ...currentUserProfile,
          following: updatedFollowing,
        },
      });

      await User.findByIdAndUpdate(id, {
        profile: {
          ...targetUserProfile,
          authorProfile: {
            ...targetUserAuthorProfile,
            followers: updatedFollowers,
          },
        },
      });

      res.status(200).json({
        success: true,
        message: 'User unfollowed successfully',
        data: {
          isFollowing: false,
          followersCount: updatedFollowers.length,
        },
      });
    } else {
      // Follow
      const updatedFollowing = [...currentUserFollowing, targetUserId];
      const updatedFollowers = [...targetUserAuthorProfile.followers, currentUserId];

      await User.findByIdAndUpdate(req.user.id, {
        profile: {
          ...currentUserProfile,
          following: updatedFollowing,
        },
      });

      await User.findByIdAndUpdate(id, {
        profile: {
          ...targetUserProfile,
          authorProfile: {
            ...targetUserAuthorProfile,
            followers: updatedFollowers,
          },
        },
      });

      res.status(200).json({
        success: true,
        message: 'User followed successfully',
        data: {
          isFollowing: true,
          followersCount: updatedFollowers.length,
        },
      });
    }
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to follow user',
    });
  }
};

/**
 * Export all user data (GDPR compliance)
 * GET /api/user/export-data
 * BUG-009: GDPR data export functionality
 */
export const exportUserData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const userId = req.user.id;

    // Fetch all user data in parallel for efficiency
    const [user, books, summaries, transactions, notifications, userActivity] = await Promise.all([
      User.findById(userId),
      Book.find({ author: userId }),
      Summary.find({ userId }),
      Transaction.find({ userId }),
      Notification.find({ recipient: userId }),
      UserActivity.findByUserId(userId),
    ]);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Remove sensitive data from user profile
    const { password, ...userDataWithoutPassword } = user as any;

    // Build the export data object
    const exportData = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        userId: userId,
        dataVersion: '1.0',
        description: 'Complete export of all your personal data stored in MeStory (GDPR Article 20)',
      },
      profile: {
        id: userDataWithoutPassword.id,
        name: userDataWithoutPassword.name,
        email: userDataWithoutPassword.email,
        role: userDataWithoutPassword.role,
        credits: userDataWithoutPassword.credits,
        bio: userDataWithoutPassword.profile?.bio,
        avatar: userDataWithoutPassword.profile?.avatar,
        language: userDataWithoutPassword.profile?.language,
        createdAt: userDataWithoutPassword.created_at,
        updatedAt: userDataWithoutPassword.updated_at,
      },
      books: books.map((book) => ({
        id: book.id,
        title: book.title,
        description: book.description,
        genre: book.genre,
        language: book.language,
        status: book.status,
        publishingStatus: book.publishingStatus,
        coverImage: book.coverImage,
        chapters: book.chapters,
        statistics: book.statistics,
        createdAt: book.created_at,
        updatedAt: book.updated_at,
      })),
      summaries: summaries.map((summary) => ({
        id: summary.id,
        sourceType: summary.sourceType,
        content: summary.content,
        summary: summary.summary,
        characters: summary.characters,
        plotStructure: summary.plotStructure,
        chapters: summary.chapters,
        status: summary.status,
        convertedToBook: summary.convertedToBook,
        createdAt: summary.created_at,
        updatedAt: summary.updated_at,
      })),
      transactions: transactions.map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        plan: transaction.plan,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        description: transaction.description,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
      })),
      notifications: notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.created_at,
      })),
      activity: userActivity ? {
        readingHistory: userActivity.readingHistory,
        completedBooks: userActivity.completedBooks,
        currentlyReading: userActivity.currentlyReading,
        writingProgress: userActivity.writingProgress,
        completedWriting: userActivity.completedWriting,
        currentlyWriting: userActivity.currentlyWriting,
        genrePreferences: userActivity.genrePreferences,
        authorPreferences: userActivity.authorPreferences,
        totalBooksRead: userActivity.totalBooksRead,
        totalBooksWritten: userActivity.totalBooksWritten,
        totalReadingTime: userActivity.totalReadingTime,
        totalWritingTime: userActivity.totalWritingTime,
        currentStreak: userActivity.currentStreak,
        longestStreak: userActivity.longestStreak,
        lastActiveAt: userActivity.lastActiveAt,
      } : null,
    };

    // Set headers for JSON file download
    const filename = `mestory-data-export-${userId}-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.status(200).json(exportData);
  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export user data',
    });
  }
};
