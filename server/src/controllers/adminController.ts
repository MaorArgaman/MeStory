import { Response } from 'express';
import { User, UserRole } from '../models/User';
import { Book } from '../models/Book';
import { AuthRequest } from '../types';

/**
 * Get platform statistics
 * GET /api/admin/stats
 */
export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Count users by role
    const totalUsers = await User.countDocuments();
    const freeUsers = await User.countDocuments({ role: UserRole.FREE });
    const standardUsers = await User.countDocuments({ role: UserRole.STANDARD });
    const premiumUsers = await User.countDocuments({ role: UserRole.PREMIUM });

    // Count books by status
    const totalBooks = await Book.countDocuments();
    const publishedBooks = await Book.countDocuments({ 'publishingStatus.status': 'published' });
    const draftBooks = await Book.countDocuments({ 'publishingStatus.status': 'draft' });

    // Calculate total revenue (50% from all book sales)
    const books = await Book.find({
      'publishingStatus.status': 'published',
    }).select('statistics');

    const totalBookRevenue = books.reduce((sum, book) => sum + (book.statistics?.revenue || 0), 0);
    const platformRevenue = totalBookRevenue * 0.5; // Platform gets 50%

    // Calculate subscription revenue (mock - in production, track actual payments)
    const subscriptionRevenue = (standardUsers * 25) + (premiumUsers * 65);

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSignups = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get signup trend (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const signupTrend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get top authors by revenue
    const topAuthors = await Book.aggregate([
      {
        $match: {
          'publishingStatus.status': 'published',
        },
      },
      {
        $group: {
          _id: '$author',
          totalRevenue: { $sum: '$statistics.revenue' },
          totalSales: { $sum: '$statistics.purchases' },
          bookCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'author',
        },
      },
      {
        $unwind: '$author',
      },
      {
        $project: {
          authorId: '$_id',
          authorName: '$author.name',
          authorEmail: '$author.email',
          totalRevenue: 1,
          totalSales: 1,
          bookCount: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalBooks,
          publishedBooks,
          platformRevenue: platformRevenue + subscriptionRevenue,
          recentSignups,
        },
        users: {
          total: totalUsers,
          free: freeUsers,
          standard: standardUsers,
          premium: premiumUsers,
        },
        books: {
          total: totalBooks,
          published: publishedBooks,
          drafts: draftBooks,
        },
        revenue: {
          total: platformRevenue + subscriptionRevenue,
          fromBooks: platformRevenue,
          fromSubscriptions: subscriptionRevenue,
        },
        signupTrend,
        topAuthors,
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
    });
  }
};

/**
 * Get all users with filters
 * GET /api/admin/users
 */
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const query: any = {};

    // Filter by role
    if (role && role !== 'all') {
      query.role = role;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users',
    });
  }
};

/**
 * Update user role or credits
 * PUT /api/admin/users/:id
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, credits, action } = req.body;

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Prevent modifying other admins
    if (user.role === UserRole.ADMIN && req.user?.id !== id) {
      res.status(403).json({
        success: false,
        error: 'Cannot modify other admin accounts',
      });
      return;
    }

    // Update role
    if (role && [UserRole.FREE, UserRole.STANDARD, UserRole.PREMIUM, UserRole.ADMIN].includes(role)) {
      user.role = role;

      // Set credits based on role
      if (role === UserRole.FREE) {
        user.credits = 100;
      } else if (role === UserRole.STANDARD) {
        user.credits = 500;
      } else if (role === UserRole.PREMIUM) {
        user.credits = 999999;
      }
    }

    // Update credits directly
    if (credits !== undefined) {
      user.credits = Number(credits);
    }

    // Handle specific actions
    if (action === 'ban') {
      user.role = UserRole.FREE;
      user.credits = 0;
      // In production, add a 'banned' field
    } else if (action === 'reset-password') {
      // In production, send password reset email
      // For now, just return success
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          credits: user.credits,
        },
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
    });
  }
};

/**
 * Delete/ban a user
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Prevent deleting admin accounts
    if (user.role === UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        error: 'Cannot delete admin accounts',
      });
      return;
    }

    // Delete user's books
    await Book.deleteMany({ author: id });

    // Delete user
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
};

/**
 * Get flagged/low quality books for moderation
 * GET /api/admin/books/flagged
 */
export const getFlaggedBooks = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get published books with low quality score (below 60)
    const lowQualityBooks = await Book.find({
      'publishingStatus.status': 'published',
      'qualityScore.overallScore': { $lt: 60, $gt: 0 },
    })
      .populate('author', 'name email')
      .select('title author genre qualityScore statistics publishingStatus')
      .sort({ 'qualityScore.overallScore': 1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: {
        books: lowQualityBooks,
      },
    });
  } catch (error) {
    console.error('Get flagged books error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get flagged books',
    });
  }
};

/**
 * Unpublish a book (content moderation)
 * PUT /api/admin/books/:id/unpublish
 */
export const unpublishBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    book.publishingStatus.status = 'draft';
    book.publishingStatus.isPublic = false;

    // In production, notify the author with reason
    await book.save();

    res.status(200).json({
      success: true,
      message: 'Book unpublished successfully',
      data: {
        bookId: book._id,
        reason,
      },
    });
  } catch (error) {
    console.error('Unpublish book error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unpublish book',
    });
  }
};
