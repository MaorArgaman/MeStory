import { Response } from 'express';
import { User, UserRole } from '../models/User';
import { Book } from '../models/Book';
import { AuthRequest } from '../types';

// UUID validation regex for Supabase
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Get platform statistics
 * GET /api/admin/stats
 */
export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Count users by role
    const totalUsers = await User.count();
    const freeUsers = await User.count({ role: UserRole.FREE });
    const standardUsers = await User.count({ role: UserRole.STANDARD });
    const premiumUsers = await User.count({ role: UserRole.PREMIUM });

    // Count books by status
    const totalBooks = await Book.count();
    const publishedBooks = await Book.count({ 'publishingStatus.status': 'published' });
    const draftBooks = await Book.count({ 'publishingStatus.status': 'draft' });

    // Calculate total revenue (50% from all book sales)
    const books = await Book.find({
      'publishingStatus.status': 'published',
    });

    const totalBookRevenue = books.reduce((sum, book) => sum + (book.statistics?.revenue || 0), 0);
    const platformRevenue = totalBookRevenue * 0.5; // Platform gets 50%

    // Calculate subscription revenue (mock - in production, track actual payments)
    const subscriptionRevenue = (standardUsers * 25) + (premiumUsers * 65);

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSignups = await User.count({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get signup trend (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // For Supabase, we need to fetch users and group in JavaScript
    const recentUsers = await User.find({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Group by date in JavaScript
    const signupTrendMap = new Map<string, number>();
    recentUsers.forEach(user => {
      const dateStr = new Date(user.createdAt).toISOString().split('T')[0];
      signupTrendMap.set(dateStr, (signupTrendMap.get(dateStr) || 0) + 1);
    });
    const signupTrend = Array.from(signupTrendMap.entries())
      .map(([_id, count]) => ({ _id, count }))
      .sort((a, b) => a._id.localeCompare(b._id));

    // Get top authors by revenue - fetch and aggregate in JavaScript for Supabase
    const publishedBooksWithAuthors = await Book.find({
      'publishingStatus.status': 'published',
    });

    // Group by author
    const authorStatsMap = new Map<string, { totalRevenue: number; totalSales: number; bookCount: number }>();
    publishedBooksWithAuthors.forEach(book => {
      const authorId = book.author;
      const existing = authorStatsMap.get(authorId) || { totalRevenue: 0, totalSales: 0, bookCount: 0 };
      existing.totalRevenue += book.statistics?.revenue || 0;
      existing.totalSales += book.statistics?.purchases || 0;
      existing.bookCount += 1;
      authorStatsMap.set(authorId, existing);
    });

    // Sort by revenue and get top 10
    const topAuthorIds = Array.from(authorStatsMap.entries())
      .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)
      .slice(0, 10);

    // Fetch author details
    const topAuthors = await Promise.all(
      topAuthorIds.map(async ([authorId, stats]) => {
        const author = await User.findById(authorId);
        return {
          authorId,
          authorName: author?.name || 'Unknown',
          authorEmail: author?.email || 'Unknown',
          totalRevenue: stats.totalRevenue,
          totalSales: stats.totalSales,
          bookCount: stats.bookCount,
        };
      })
    );

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

    let users = await User.find(query);

    const total = users.length;

    // Sort by createdAt descending, then apply pagination
    users = users
      .sort((a: any, b: any) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime())
      .slice(skip, skip + Number(limit));

    // Remove password from response (Supabase returns full objects)
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user as any;
      return userWithoutPassword;
    });

    res.status(200).json({
      success: true,
      data: {
        users: usersWithoutPassword,
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

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
      });
      return;
    }

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

    // Build update object
    const updateData: any = {};

    // Update role
    if (role && [UserRole.FREE, UserRole.STANDARD, UserRole.PREMIUM, UserRole.ADMIN].includes(role)) {
      updateData.role = role;

      // Set credits based on role
      if (role === UserRole.FREE) {
        updateData.credits = 100;
      } else if (role === UserRole.STANDARD) {
        updateData.credits = 500;
      } else if (role === UserRole.PREMIUM) {
        updateData.credits = 999999;
      }
    }

    // Update credits directly
    if (credits !== undefined) {
      updateData.credits = Number(credits);
    }

    // Handle specific actions
    if (action === 'ban') {
      updateData.role = UserRole.FREE;
      updateData.credits = 0;
      // In production, add a 'banned' field
    } else if (action === 'reset-password') {
      // In production, send password reset email
      // For now, just return success
    }

    // Use findByIdAndUpdate instead of save()
    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: updatedUser!.id,
          name: updatedUser!.name,
          email: updatedUser!.email,
          role: updatedUser!.role,
          credits: updatedUser!.credits,
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

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
      });
      return;
    }

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
    let lowQualityBooks = await Book.find({
      'publishingStatus.status': 'published',
      'qualityScore.overallScore': { $lt: 60, $gt: 0 },
    });

    // Sort by quality score ascending and limit to 50
    lowQualityBooks = lowQualityBooks
      .sort((a: any, b: any) => (a.qualityScore?.overallScore || 0) - (b.qualityScore?.overallScore || 0))
      .slice(0, 50);

    // Fetch author details for each book
    const booksWithAuthors = await Promise.all(
      lowQualityBooks.map(async (book) => {
        const author = await User.findById(book.author);
        return {
          id: book.id,
          title: book.title,
          author: author ? {
            id: author.id,
            name: author.name,
            email: author.email,
          } : null,
          genre: book.genre,
          qualityScore: book.qualityScore,
          statistics: book.statistics,
          publishingStatus: book.publishingStatus,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        books: booksWithAuthors,
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

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID format',
      });
      return;
    }

    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Use findByIdAndUpdate instead of save()
    await Book.findByIdAndUpdate(id, {
      'publishingStatus.status': 'draft',
      'publishingStatus.isPublic': false,
    });

    // In production, notify the author with reason

    res.status(200).json({
      success: true,
      message: 'Book unpublished successfully',
      data: {
        bookId: book.id,
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
