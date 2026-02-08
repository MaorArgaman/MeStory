import { Response } from 'express';
import { AuthRequest } from '../types';
import * as bookPromotionService from '../services/bookPromotionService';

/**
 * Get featured/editor's choice books
 * GET /api/promotions/featured
 */
export const getFeatured = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const featured = await bookPromotionService.getFeaturedBooks(limit);

    res.status(200).json({
      success: true,
      data: { books: featured },
    });
  } catch (error) {
    console.error('Get featured books error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get featured books',
    });
  }
};

/**
 * Get rising stars - new books gaining traction
 * GET /api/promotions/rising-stars
 */
export const getRisingStars = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const risingStars = await bookPromotionService.getRisingStars(limit);

    res.status(200).json({
      success: true,
      data: { books: risingStars },
    });
  } catch (error) {
    console.error('Get rising stars error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get rising stars',
    });
  }
};

/**
 * Get quality new releases
 * GET /api/promotions/quality-releases
 */
export const getQualityReleases = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const minQuality = parseInt(req.query.minQuality as string) || 60;
    const days = parseInt(req.query.days as string) || 30;

    const releases = await bookPromotionService.getQualityNewReleases(limit, {
      minQualityScore: minQuality,
      publishedWithinDays: days,
    });

    res.status(200).json({
      success: true,
      data: { books: releases },
    });
  } catch (error) {
    console.error('Get quality releases error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quality releases',
    });
  }
};

/**
 * Get trending by velocity
 * GET /api/promotions/trending
 */
export const getTrending = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const days = parseInt(req.query.days as string) || 7;

    const trending = await bookPromotionService.getTrendingByVelocity(days, limit);

    res.status(200).json({
      success: true,
      data: { books: trending },
    });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trending books',
    });
  }
};

/**
 * Get top authors spotlight
 * GET /api/promotions/top-authors
 */
export const getTopAuthorsSpotlight = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const authors = await bookPromotionService.getTopAuthorsSpotlight(limit);

    res.status(200).json({
      success: true,
      data: { authors },
    });
  } catch (error) {
    console.error('Get top authors spotlight error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get top authors spotlight',
    });
  }
};

/**
 * Get top books in a genre
 * GET /api/promotions/genre/:genre
 */
export const getTopInGenre = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { genre } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const books = await bookPromotionService.getTopInGenre(genre, limit);

    res.status(200).json({
      success: true,
      data: { books },
    });
  } catch (error) {
    console.error('Get top in genre error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get top books in genre',
    });
  }
};

/**
 * Get promotion summary for admin
 * GET /api/promotions/summary
 */
export const getPromotionSummary = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const summary = await bookPromotionService.getPromotionSummary();

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Get promotion summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get promotion summary',
    });
  }
};
