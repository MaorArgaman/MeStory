import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();

export interface ICoupon {
  id: string;
  code: string;
  plan: string;
  duration_days: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface ICouponRedemption {
  id: string;
  coupon_id: string;
  user_id: string;
  redeemed_at: string;
  access_expires_at: string;
}

export const Coupon = {
  async findByCode(code: string): Promise<ICoupon | null> {
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();
    if (error || !data) return null;
    return data as ICoupon;
  },

  async findById(id: string): Promise<ICoupon | null> {
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data as ICoupon;
  },

  async findAll(): Promise<ICoupon[]> {
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as ICoupon[];
  },

  async create(couponData: {
    code?: string;
    plan?: string;
    duration_days: number;
    max_uses?: number;
    created_by?: string;
    expires_at?: string | null;
  }): Promise<ICoupon> {
    const id = uuidv4();
    const code = (couponData.code || generateCode()).toUpperCase();

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert({
        id,
        code,
        plan: couponData.plan || 'premium',
        duration_days: couponData.duration_days,
        max_uses: couponData.max_uses || 1,
        used_count: 0,
        is_active: true,
        created_by: couponData.created_by || null,
        expires_at: couponData.expires_at || null,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create coupon: ${error.message}`);
    return data as ICoupon;
  },

  async validate(code: string): Promise<{ valid: boolean; coupon?: ICoupon; error?: string }> {
    const coupon = await this.findByCode(code);
    if (!coupon) return { valid: false, error: 'Coupon not found' };
    if (!coupon.is_active) return { valid: false, error: 'Coupon is no longer active' };
    if (coupon.used_count >= coupon.max_uses) return { valid: false, error: 'Coupon has reached maximum uses' };
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { valid: false, error: 'Coupon has expired' };
    }
    return { valid: true, coupon };
  },

  async redeem(couponId: string, userId: string): Promise<ICouponRedemption> {
    const coupon = await this.findById(couponId);
    if (!coupon) throw new Error('Coupon not found');

    const accessExpiresAt = new Date();
    accessExpiresAt.setDate(accessExpiresAt.getDate() + coupon.duration_days);

    // Create redemption record
    const redemptionId = uuidv4();
    const { error: redemptionError } = await supabaseAdmin
      .from('coupon_redemptions')
      .insert({
        id: redemptionId,
        coupon_id: couponId,
        user_id: userId,
        access_expires_at: accessExpiresAt.toISOString(),
      });
    if (redemptionError) throw new Error(`Failed to create redemption: ${redemptionError.message}`);

    // Increment used_count
    await supabaseAdmin
      .from('coupons')
      .update({ used_count: coupon.used_count + 1 })
      .eq('id', couponId);

    return {
      id: redemptionId,
      coupon_id: couponId,
      user_id: userId,
      redeemed_at: new Date().toISOString(),
      access_expires_at: accessExpiresAt.toISOString(),
    };
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('coupons')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw new Error(`Failed to deactivate coupon: ${error.message}`);
  },

  async getRedemptions(couponId: string): Promise<ICouponRedemption[]> {
    const { data, error } = await supabaseAdmin
      .from('coupon_redemptions')
      .select('*')
      .eq('coupon_id', couponId)
      .order('redeemed_at', { ascending: false });
    if (error || !data) return [];
    return data as ICouponRedemption[];
  },
};

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
