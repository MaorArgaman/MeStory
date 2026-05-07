/**
 * requireCredits middleware - guards an AI route by checking that the
 * authenticated user can pay for the feature.
 *
 * Lifecycle:
 *   1. authenticate (sets req.user)
 *   2. requireCredits('feature_key') runs preflight
 *      - 403 if plan doesn't include feature
 *      - 402 if balance too low (with proposed top-up packages)
 *      - otherwise next()
 *   3. controller runs the AI call
 *   4. controller calls creditService.consume() on success (or throws and
 *      we don't charge)
 *
 * For features with dynamic cost (e.g. transcription priced per minute),
 * pass a function for `costFromReq` instead of relying on the static cost.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import {
  preflight,
  consume,
  FeatureNotAvailableError,
  InsufficientCreditsError,
} from '../services/creditService';
import { FeatureKey, getCreditCost } from '../config/creditCosts';
import { TOP_UP_PACKAGES } from '../config/plans';

type CostResolver = (req: AuthRequest) => number;

interface RequireCreditsOptions {
  /** Where to stash the preflight result on req for the controller. */
  attachAs?: string;
}

export function requireCredits(
  feature: FeatureKey,
  costFromReq?: CostResolver,
  options: RequireCreditsOptions = {}
) {
  const attachAs = options.attachAs || 'creditPreflight';

  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const cost = costFromReq ? costFromReq(req) : getCreditCost(feature);

    try {
      const result = await preflight(req.user.id, feature, cost);
      (req as any)[attachAs] = { ...result, feature, cost };

      // Hook res.json to auto-consume on 2xx success. Controllers don't
      // need to call creditService.consume() manually. If a controller
      // wants to skip charging (e.g. cached result), it can set
      // res.locals.skipCreditCharge = true before responding.
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
        const shouldCharge =
          isSuccess && !res.locals.skipCreditCharge && req.user;
        if (shouldCharge) {
          // Fire-and-forget: charging is async but should not delay the
          // response. Errors are logged inside consume().
          consume({
            userId: req.user!.id,
            feature,
            costOverride: cost,
            metadata: {
              path: req.originalUrl,
              method: req.method,
            },
            idempotencyKey: req.headers['x-idempotency-key'] as string | undefined,
          }).catch((err) => {
            console.error('[requireCredits] Auto-consume failed:', err.message);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      if (err instanceof FeatureNotAvailableError) {
        res.status(403).json({
          success: false,
          error: 'Feature not included in your plan',
          errorCode: 'FEATURE_NOT_AVAILABLE',
          feature: err.feature,
          currentPlan: err.planId,
          upgradeRequired: true,
        });
        return;
      }
      if (err instanceof InsufficientCreditsError) {
        res.status(402).json({
          success: false,
          error: 'Insufficient credits',
          errorCode: 'INSUFFICIENT_CREDITS',
          required: err.required,
          available: err.available,
          // Surface top-up options so frontend can render a buy-now modal
          topUpOptions: TOP_UP_PACKAGES,
          upgradeRequired: false,
        });
        return;
      }
      console.error('[requireCredits] Preflight error:', err);
      res.status(500).json({ success: false, error: 'Credit check failed' });
    }
  };
}
