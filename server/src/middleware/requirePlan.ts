/**
 * requirePlan - guards a route by minimum subscription tier.
 *
 * Use this for binary features (you have export OR you don't), where
 * `requireCredits` doesn't fit because there's no per-call cost. The
 * frontend's InsufficientCreditsModal already handles the 403 +
 * FEATURE_NOT_AVAILABLE response shape with an "upgrade" CTA.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UserRole } from '../models/User';

const TIER_LEVEL: Record<string, number> = {
  [UserRole.FREE]: 0,
  [UserRole.STANDARD]: 1,
  [UserRole.PREMIUM]: 2,
  [UserRole.ADMIN]: 99,
};

export function requirePlan(minimum: 'standard' | 'premium', featureLabel: string) {
  const minLevel = minimum === 'premium' ? 2 : 1;

  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const userLevel = TIER_LEVEL[req.user.role] ?? 0;
    if (userLevel >= minLevel) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      error: `${featureLabel} is available on the ${minimum} plan or higher.`,
      errorCode: 'FEATURE_NOT_AVAILABLE',
      feature: featureLabel,
      currentPlan: req.user.role.toLowerCase(),
      requiredPlan: minimum,
      upgradeRequired: true,
    });
  };
}
