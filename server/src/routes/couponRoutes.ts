import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminMiddleware';
import { Coupon } from '../models/Coupon';
import { User, UserRole } from '../models/User';
import { AuthRequest } from '../types';

const router = Router();

// ============================================
// Public: Validate a coupon code
// ============================================
router.get('/validate/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const result = await Coupon.validate(code);
    if (!result.valid) {
      return res.json({ success: false, error: result.error });
    }
    res.json({
      success: true,
      coupon: {
        plan: result.coupon!.plan,
        duration_days: result.coupon!.duration_days,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to validate coupon' });
  }
});

// ============================================
// Authenticated: Redeem a coupon code
// ============================================
router.post('/redeem', authenticate as any, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'Coupon code is required' });

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    // Validate coupon
    const validation = await Coupon.validate(code);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const coupon = validation.coupon!;

    // Redeem coupon
    const redemption = await Coupon.redeem(coupon.id, userId);

    // Upgrade user
    const plan = coupon.plan.toUpperCase() as keyof typeof UserRole;
    const role = UserRole[plan] || UserRole.PREMIUM;
    const credits = role === UserRole.PREMIUM ? 999999 : 500;

    await User.findByIdAndUpdate(userId, {
      role,
      credits,
      subscription: {
        tier: coupon.plan,
        price: 0,
        credits,
        startDate: new Date().toISOString(),
        endDate: redemption.access_expires_at,
        isActive: true,
        autoRenew: false,
      },
    });

    res.json({
      success: true,
      message: `You now have ${coupon.plan} access for ${coupon.duration_days} days!`,
      access_expires_at: redemption.access_expires_at,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to redeem coupon' });
  }
});

// ============================================
// Admin: List all coupons
// ============================================
router.get('/', authenticate as any, requireAdmin as any, async (_req: Request, res: Response) => {
  try {
    const coupons = await Coupon.findAll();
    res.json({ success: true, data: coupons });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch coupons' });
  }
});

// ============================================
// Admin: Create a coupon
// ============================================
router.post('/', authenticate as any, requireAdmin as any, async (req: AuthRequest, res: Response) => {
  try {
    const { code, plan, duration_days, max_uses, expires_at } = req.body;
    if (!duration_days) {
      return res.status(400).json({ success: false, error: 'duration_days is required' });
    }

    const coupon = await Coupon.create({
      code,
      plan: plan || 'premium',
      duration_days,
      max_uses: max_uses || 1,
      created_by: req.user?.id,
      expires_at: expires_at || null,
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error: any) {
    if (error.message?.includes('duplicate')) {
      return res.status(400).json({ success: false, error: 'Coupon code already exists' });
    }
    res.status(500).json({ success: false, error: error.message || 'Failed to create coupon' });
  }
});

// ============================================
// Admin: Deactivate a coupon
// ============================================
router.delete('/:id', authenticate as any, requireAdmin as any, async (req: Request, res: Response) => {
  try {
    await Coupon.deactivate(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to deactivate coupon' });
  }
});

export default router;
