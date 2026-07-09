/**
 * designEntitlement — the single gate for "may this user run an auto-design
 * generation, and who pays for it?"
 *
 * Freemium rule (docs/BUSINESS_STRATEGY.md §1): every account gets
 * FREE_DESIGNS_PER_ACCOUNT free generations, lifetime. While the allowance
 * lasts, the request is free — no plan gate, no credit charge. Once it's
 * exhausted, the request falls through to the existing credits gate
 * (requireCredits('auto_design_premium')), which will later be replaced by
 * per-project packages (IMPLEMENTATION_PLAN §מ.3).
 *
 * Counting mirrors requireCredits: the free use is consumed only on a 2xx
 * response (a failed generation never burns an allowance), honoring
 * res.locals.skipCreditCharge. The counter lives in the plain column
 * users.free_designs_used (migration 014) with a CAS increment — never in
 * the profile JSONB, whose dot-path updates fail silently.
 *
 * Fail-safe direction: if the counter can't be read (e.g. migration not yet
 * applied), we fall through to the credits gate rather than granting
 * unlimited free designs.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { supabaseAdmin } from '../config/supabase';
import { requireCredits } from './requireCredits';

export const FREE_DESIGNS_PER_ACCOUNT = 2;

const creditsGate = requireCredits('auto_design_premium');

/** Read the lifetime free-design counter. null = column missing / error. */
export async function getFreeDesignsUsed(userId: string): Promise<number | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('free_designs_used')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  const used = (data as any).free_designs_used;
  return typeof used === 'number' ? used : null;
}

/** CAS increment with a small retry loop (same pattern as deductCreditsStrict). */
async function incrementFreeDesignsUsed(userId: string): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const used = await getFreeDesignsUsed(userId);
    if (used === null) return;
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ free_designs_used: used + 1 })
      .eq('id', userId)
      .eq('free_designs_used', used) // CAS guard
      .select('id');
    if (error) return;
    if (data && data.length > 0) return;
    // 0 rows => concurrent increment raced us; re-read and retry.
  }
  console.warn('[designEntitlement] free-design increment lost after retries for user', userId);
}

export async function designEntitlement(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const used = await getFreeDesignsUsed(req.user.id);
    if (used !== null && used < FREE_DESIGNS_PER_ACCOUNT) {
      (req as any).freeDesign = true;
      (req as any).freeDesignsRemaining = FREE_DESIGNS_PER_ACCOUNT - used;

      // Consume the allowance only on success, like requireCredits does.
      const originalJson = res.json.bind(res);
      const userId = req.user.id;
      res.json = (body: any) => {
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
        if (isSuccess && !res.locals.skipCreditCharge) {
          void incrementFreeDesignsUsed(userId);
        }
        return originalJson(body);
      };

      next();
      return;
    }
  } catch (err: any) {
    console.warn('[designEntitlement] free-allowance check failed, falling back to credits:', err?.message);
  }

  // Allowance exhausted (or unreadable) — the normal paid path decides.
  return creditsGate(req as any, res, next);
}
