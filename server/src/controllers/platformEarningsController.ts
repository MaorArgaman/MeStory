/**
 * Platform Earnings Controller - admin reporting on the commission cut
 * MeStory takes from each marketplace book sale.
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { supabaseAdmin } from '../config/supabase';

interface PlatformEarningRow {
  id: string;
  transaction_id: string;
  book_id: string;
  author_id: string;
  buyer_id: string;
  gross_amount: number;
  author_share: number;
  platform_share: number;
  currency: string;
  author_plan: string;
  paid_out: boolean;
  paid_out_at: string | null;
  created_at: string;
}

/**
 * GET /api/admin/platform-earnings/summary
 * Returns rolled-up totals for the platform's commission income.
 */
export const getEarningsSummary = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('platform_earnings')
      .select('platform_share, gross_amount, author_share, currency, paid_out, created_at, author_plan');

    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    const rows = (data || []) as PlatformEarningRow[];

    const totals = rows.reduce(
      (acc, r) => {
        acc.totalSales += 1;
        acc.totalGross += Number(r.gross_amount);
        acc.totalAuthorShare += Number(r.author_share);
        acc.totalPlatformShare += Number(r.platform_share);
        if (!r.paid_out) {
          acc.unpaidPlatformShare += Number(r.platform_share);
        }
        return acc;
      },
      {
        totalSales: 0,
        totalGross: 0,
        totalAuthorShare: 0,
        totalPlatformShare: 0,
        unpaidPlatformShare: 0,
      }
    );

    // Group by author plan to see which tiers drive revenue
    const byPlan = rows.reduce<Record<string, { sales: number; platformShare: number }>>(
      (acc, r) => {
        const k = r.author_plan || 'unknown';
        if (!acc[k]) acc[k] = { sales: 0, platformShare: 0 };
        acc[k].sales += 1;
        acc[k].platformShare += Number(r.platform_share);
        return acc;
      },
      {}
    );

    // Group by month (last 12 months)
    const byMonth: Record<string, number> = {};
    for (const r of rows) {
      const d = new Date(r.created_at);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] || 0) + Number(r.platform_share);
    }

    res.status(200).json({
      success: true,
      data: {
        totals,
        byPlan,
        byMonth,
      },
    });
  } catch (err: any) {
    console.error('[platformEarnings] summary error:', err);
    res.status(500).json({ success: false, error: 'Failed to load earnings summary' });
  }
};

/**
 * GET /api/admin/platform-earnings
 * Lists individual earnings rows, newest first.
 *
 * Query params:
 *   limit (default 50, max 200)
 *   offset (default 0)
 *   onlyUnpaid (true/false)
 */
export const listEarnings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10) || 50, 200);
    const offset = parseInt(String(req.query.offset || '0'), 10) || 0;
    const onlyUnpaid = req.query.onlyUnpaid === 'true';

    let query = supabaseAdmin
      .from('platform_earnings')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (onlyUnpaid) {
      query = query.eq('paid_out', false);
    }

    const { data, error } = await query;
    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    res.status(200).json({ success: true, data: { earnings: data || [], limit, offset } });
  } catch (err: any) {
    console.error('[platformEarnings] list error:', err);
    res.status(500).json({ success: false, error: 'Failed to list earnings' });
  }
};
