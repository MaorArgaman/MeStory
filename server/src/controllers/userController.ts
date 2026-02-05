import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Book } from '../models/Book';
import { AuthRequest } from '../types';

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
    }).select('statistics publishingStatus title');

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
    const user = await User.findById(userId).select('profile');
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
            id: book._id,
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

    // Initialize profile if it doesn't exist
    if (!user.profile) {
      user.profile = {};
    }

    // Update fields
    if (name) user.name = name;
    if (bio !== undefined) user.profile.bio = bio;
    if (avatar) user.profile.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          credits: user.credits,
          profile: user.profile,
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
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

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
    }).select('statistics');

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

    // Initialize profile and earnings if they don't exist
    if (!user.profile) {
      user.profile = {};
    }
    if (!user.profile.earnings) {
      user.profile.earnings = { totalEarned: 0, pendingPayout: 0, withdrawn: 0, history: [] };
    }

    // In production, integrate with PayPal Payouts API
    // For now, just update the withdrawn amount
    user.profile.earnings.withdrawn += amount;
    user.profile.earnings.history.push({
      amount,
      date: new Date(),
      status: 'pending',
      paypalEmail: user.paypal?.email || '',
    });

    await user.save();

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

    const user = await User.findById(id).select('-password -paypal');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Get user's published books
    const books = await Book.find({
      author: id,
      'publishingStatus.status': 'published',
      'publishingStatus.isPublic': true,
    }).select('title coverDesign genre qualityScore statistics publishingStatus createdAt');

    // Calculate total reads (views)
    const totalReads = books.reduce((sum, book) => sum + (book.statistics?.views || 0), 0);

    // Check if current user is following this profile
    let isFollowing = false;
    if (req.user) {
      const currentUser = await User.findById(req.user.id);
      if (currentUser && currentUser.profile?.following) {
        isFollowing = currentUser.profile.following.some(
          (followingId) => followingId.toString() === id
        );
      }
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
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

    // Initialize profile structures if they don't exist
    if (!currentUser.profile) {
      currentUser.profile = {};
    }
    if (!currentUser.profile.following) {
      currentUser.profile.following = [];
    }

    if (!targetUser.profile) {
      targetUser.profile = {};
    }
    if (!targetUser.profile.authorProfile) {
      targetUser.profile.authorProfile = {
        publishedBooks: 0,
        totalSales: 0,
        rating: 0,
        followers: [],
      };
    }

    const targetUserId = targetUser._id as any;
    const currentUserId = currentUser._id as any;

    // Check if already following
    const followingIndex = currentUser.profile.following.findIndex(
      (followingId) => followingId.toString() === targetUserId.toString()
    );

    if (followingIndex > -1) {
      // Unfollow
      currentUser.profile.following.splice(followingIndex, 1);

      const followerIndex = targetUser.profile.authorProfile.followers.findIndex(
        (followerId) => followerId.toString() === currentUserId.toString()
      );
      if (followerIndex > -1) {
        targetUser.profile.authorProfile.followers.splice(followerIndex, 1);
      }

      await currentUser.save();
      await targetUser.save();

      res.status(200).json({
        success: true,
        message: 'User unfollowed successfully',
        data: {
          isFollowing: false,
          followersCount: targetUser.profile.authorProfile.followers.length,
        },
      });
    } else {
      // Follow
      currentUser.profile.following.push(targetUserId);
      targetUser.profile.authorProfile.followers.push(currentUserId);

      await currentUser.save();
      await targetUser.save();

      res.status(200).json({
        success: true,
        message: 'User followed successfully',
        data: {
          isFollowing: true,
          followersCount: targetUser.profile.authorProfile.followers.length,
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
