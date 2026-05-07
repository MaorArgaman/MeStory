/**
 * Credit Service - the canonical entry point for spending and recording
 * AI-feature usage. Consolidates plan gating, monthly bonus pools, and
 * actual credit balance into a single API.
 *
 * Charging policy is POST-execution: caller computes/runs the AI op
 * first, and only then records the charge here. Failed AI calls do
 * not consume credits. The middleware in `requireCredits` does a
 * cheap pre-check so we don't burn AI quota for users who can't pay.
 */

import { supabaseAdmin } from '../config/supabase';
import { User, UserRole, IUser } from '../models/User';
import {
  CREDIT_COSTS,
  PLAN_BONUSES,
  PLAN_FEATURES,
  FEATURE_GATES,
  FeatureKey,
} from '../config/creditCosts';
import { PlanId, getPlanByTier } from '../config/plans';

export class InsufficientCreditsError extends Error {
  constructor(public required: number, public available: number) {
    super(`Insufficient credits. Required: ${required}, available: ${available}`);
    this.name = 'InsufficientCreditsError';
  }
}

export class FeatureNotAvailableError extends Error {
  constructor(public feature: FeatureKey, public planId: PlanId) {
    super(`Feature "${feature}" is not available on plan "${planId}". Upgrade required.`);
    this.name = 'FeatureNotAvailableError';
  }
}

interface PreflightResult {
  /** True if user can run the feature with no charge (e.g. ADMIN). */
  free: boolean;
  /** True if a monthly bonus will absorb this call. */
  bonusCovered: boolean;
  /** Cost in credits (0 if free or bonus). */
  costCredits: number;
  /** User's current credit balance. */
  currentCredits: number;
  /** Plan id used for gating. */
  planId: PlanId;
}

function planIdFromUser(user: IUser): PlanId {
  return getPlanByTier(user.role).id;
}

function isAdmin(user: IUser): boolean {
  return user.role === UserRole.ADMIN;
}

/**
 * Check whether `userId` may invoke `feature` right now. Throws
 * FeatureNotAvailableError or InsufficientCreditsError on failure.
 *
 * `costOverride` lets callers compute a dynamic cost (e.g. transcription
 * priced per minute of audio); when omitted, uses CREDIT_COSTS[feature].
 */
export async function preflight(
  userId: string,
  feature: FeatureKey,
  costOverride?: number
): Promise<PreflightResult> {
  const user = await User.findById(userId);
  if (!user) throw new Error(`User not found: ${userId}`);

  const planId = planIdFromUser(user);
  const planFeatures = PLAN_FEATURES[planId];

  // 1. Plan gate
  const gateKey = FEATURE_GATES[feature];
  if (gateKey && gateKey !== 'watermark' && gateKey !== 'priority_queue') {
    const gateValue = planFeatures[gateKey];
    if (typeof gateValue === 'boolean' && gateValue === false) {
      throw new FeatureNotAvailableError(feature, planId);
    }
  }

  // 2. Admin bypass
  if (isAdmin(user)) {
    return {
      free: true,
      bonusCovered: false,
      costCredits: 0,
      currentCredits: user.credits,
      planId,
    };
  }

  const cost = costOverride ?? CREDIT_COSTS[feature];

  // 3. Bonus pool check
  const bonusCovered = await isBonusAvailable(userId, planId, feature);
  if (bonusCovered) {
    return {
      free: false,
      bonusCovered: true,
      costCredits: 0,
      currentCredits: user.credits,
      planId,
    };
  }

  // 4. Balance check
  if (user.credits < cost) {
    throw new InsufficientCreditsError(cost, user.credits);
  }

  return {
    free: false,
    bonusCovered: false,
    costCredits: cost,
    currentCredits: user.credits,
    planId,
  };
}

/**
 * Record consumption of a feature AFTER it ran successfully. Atomically
 * decrements credits (or burns a bonus slot) and writes to credit_usage_log.
 *
 * Idempotent if the same idempotencyKey is reused.
 */
export async function consume(params: {
  userId: string;
  feature: FeatureKey;
  costOverride?: number;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}): Promise<{ chargedCredits: number; bonusUsed: boolean; balanceAfter: number }> {
  const { userId, feature, costOverride, metadata, idempotencyKey } = params;

  // Re-fetch the latest user row (preflight might have been minutes ago)
  const user = await User.findById(userId);
  if (!user) throw new Error(`User not found: ${userId}`);

  // Admin: free, but still log
  if (isAdmin(user)) {
    await logUsage({
      userId,
      feature,
      cost: 0,
      bonusUsed: false,
      metadata: { ...metadata, reason: 'admin_bypass' },
      idempotencyKey,
    });
    return { chargedCredits: 0, bonusUsed: false, balanceAfter: user.credits };
  }

  const planId = planIdFromUser(user);

  // Idempotency: if we've already charged for this key, return that result.
  if (idempotencyKey) {
    const prior = await findUsageByIdempotencyKey(userId, idempotencyKey);
    if (prior) {
      return {
        chargedCredits: prior.cost,
        bonusUsed: prior.bonus_used,
        balanceAfter: user.credits,
      };
    }
  }

  // Try bonus first
  const bonusUsed = await tryConsumeBonus(userId, planId, feature);
  if (bonusUsed) {
    await logUsage({
      userId,
      feature,
      cost: 0,
      bonusUsed: true,
      metadata,
      idempotencyKey,
    });
    return { chargedCredits: 0, bonusUsed: true, balanceAfter: user.credits };
  }

  // Charge credits
  const cost = costOverride ?? CREDIT_COSTS[feature];
  if (cost > 0) {
    if (user.credits < cost) {
      throw new InsufficientCreditsError(cost, user.credits);
    }
    const ok = await User.deductCreditsStrict(userId, cost);
    if (!ok) throw new InsufficientCreditsError(cost, user.credits);
  }

  await logUsage({
    userId,
    feature,
    cost,
    bonusUsed: false,
    metadata,
    idempotencyKey,
  });

  return {
    chargedCredits: cost,
    bonusUsed: false,
    balanceAfter: user.credits - cost,
  };
}

/**
 * Add credits to a user (top-up purchase, refund, admin grant).
 */
export async function grantCredits(params: {
  userId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, any>;
}): Promise<boolean> {
  const ok = await User.addCredits(params.userId, params.amount);
  if (ok) {
    await logUsage({
      userId: params.userId,
      feature: 'topup' as any, // logged with non-feature label
      cost: -params.amount, // negative = added
      bonusUsed: false,
      metadata: { reason: params.reason, ...params.metadata },
    });
  }
  return ok;
}

// ----- Bonus pool -----------------------------------------------------

async function isBonusAvailable(
  userId: string,
  planId: PlanId,
  feature: FeatureKey
): Promise<boolean> {
  const bonuses = PLAN_BONUSES[planId] as unknown as Record<string, number>;
  const totalAllotment = bonuses[feature] ?? 0;
  if (totalAllotment <= 0) return false;

  const used = await getBonusUsedThisPeriod(userId, feature);
  return used < totalAllotment;
}

async function tryConsumeBonus(
  userId: string,
  planId: PlanId,
  feature: FeatureKey
): Promise<boolean> {
  const bonuses = PLAN_BONUSES[planId] as unknown as Record<string, number>;
  const totalAllotment = bonuses[feature] ?? 0;
  if (totalAllotment <= 0) return false;

  const used = await getBonusUsedThisPeriod(userId, feature);
  if (used >= totalAllotment) return false;

  // Increment bonus usage atomically. If the row doesn't exist, insert.
  const periodStart = currentPeriodStart();
  const { error } = await supabaseAdmin.rpc('increment_bonus_usage', {
    p_user_id: userId,
    p_feature: feature,
    p_period_start: periodStart,
  });

  if (error) {
    // Fallback to upsert if RPC isn't deployed yet.
    await supabaseAdmin
      .from('monthly_bonus_usage')
      .upsert(
        { user_id: userId, feature, period_start: periodStart, used: used + 1 },
        { onConflict: 'user_id,feature,period_start' }
      );
  }

  return true;
}

async function getBonusUsedThisPeriod(userId: string, feature: FeatureKey): Promise<number> {
  const periodStart = currentPeriodStart();
  const { data, error } = await supabaseAdmin
    .from('monthly_bonus_usage')
    .select('used')
    .eq('user_id', userId)
    .eq('feature', feature)
    .eq('period_start', periodStart)
    .maybeSingle();

  if (error || !data) return 0;
  return data.used || 0;
}

/**
 * Period start = first day of the current calendar month, ISO format.
 * Aligns bonus resets with monthly subscription cycles.
 */
function currentPeriodStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

// ----- Usage log ------------------------------------------------------

async function logUsage(params: {
  userId: string;
  feature: string;
  cost: number;
  bonusUsed: boolean;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}): Promise<void> {
  const { error } = await supabaseAdmin.from('credit_usage_log').insert({
    user_id: params.userId,
    feature: params.feature,
    cost: params.cost,
    bonus_used: params.bonusUsed,
    metadata: params.metadata || null,
    idempotency_key: params.idempotencyKey || null,
    created_at: new Date().toISOString(),
  });
  if (error) {
    // Logging failure is non-fatal but loud.
    console.error('[creditService] Failed to log usage:', error.message);
  }
}

async function findUsageByIdempotencyKey(
  userId: string,
  key: string
): Promise<{ cost: number; bonus_used: boolean } | null> {
  const { data, error } = await supabaseAdmin
    .from('credit_usage_log')
    .select('cost, bonus_used')
    .eq('user_id', userId)
    .eq('idempotency_key', key)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

// ----- Public read API ------------------------------------------------

export async function getCreditBalance(userId: string): Promise<number> {
  const user = await User.findById(userId);
  return user?.credits ?? 0;
}

/**
 * Returns this user's bonus pool status: how many of each bonus they've
 * used out of their plan's allotment, for the current period.
 */
export async function getBonusStatus(userId: string): Promise<
  Array<{ feature: string; used: number; total: number }>
> {
  const user = await User.findById(userId);
  if (!user) return [];

  const planId = planIdFromUser(user);
  const bonuses = PLAN_BONUSES[planId] as unknown as Record<string, number>;
  const periodStart = currentPeriodStart();

  const { data } = await supabaseAdmin
    .from('monthly_bonus_usage')
    .select('feature, used')
    .eq('user_id', userId)
    .eq('period_start', periodStart);

  const usedMap = new Map<string, number>(
    (data || []).map((r: any) => [r.feature, r.used])
  );

  return Object.entries(bonuses)
    .filter(([, total]) => total > 0)
    .map(([feature, total]) => ({
      feature,
      used: usedMap.get(feature) || 0,
      total,
    }));
}

/**
 * Returns the user's recent usage log, newest first.
 */
export async function getUsageHistory(
  userId: string,
  limit = 50
): Promise<Array<{ feature: string; cost: number; bonus_used: boolean; created_at: string; metadata: any }>> {
  const { data, error } = await supabaseAdmin
    .from('credit_usage_log')
    .select('feature, cost, bonus_used, created_at, metadata')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}
