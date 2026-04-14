import { supabaseAdmin } from '../config/database';
import { randomUUID } from 'crypto';

// Organization types
export type OrganizationType = 'military_unit' | 'association' | 'community' | 'school' | 'other';
export type OrganizationStatus = 'active' | 'inactive' | 'pending';
export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';

export interface IOrganizationCoupon {
  id: string;
  code: string;
  discountPercent: number; // 0-100
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

export interface IOrganizationSubscription {
  plan: SubscriptionPlan;
  maxBooks: number; // -1 for unlimited
  maxMembers: number; // -1 for unlimited
  pricePerMonth: number;
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
}

export interface IOrganization {
  id: string;
  name: string;
  nameEn?: string;
  type: OrganizationType;
  description?: string;
  logoUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;

  // Subscription & Billing
  subscription: IOrganizationSubscription;
  coupons: IOrganizationCoupon[];

  // Statistics
  statistics: {
    totalMembers: number;
    totalBooks: number;
    activeBooks: number;
    publishedBooks: number;
  };

  // Admin users who can manage this organization
  adminUserIds: string[];

  // Members who belong to this organization
  memberUserIds: string[];

  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
}

interface OrganizationRow {
  id: string;
  name: string;
  name_en: string | null;
  type: OrganizationType;
  description: string | null;
  logo_url: string | null;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  subscription: IOrganizationSubscription;
  coupons: IOrganizationCoupon[];
  statistics: IOrganization['statistics'];
  admin_user_ids: string[];
  member_user_ids: string[];
  status: OrganizationStatus;
  created_at: string;
  updated_at: string;
}

// Convert database row to IOrganization
const rowToOrganization = (row: OrganizationRow): IOrganization => ({
  id: row.id,
  name: row.name,
  nameEn: row.name_en || undefined,
  type: row.type,
  description: row.description || undefined,
  logoUrl: row.logo_url || undefined,
  contactEmail: row.contact_email,
  contactPhone: row.contact_phone || undefined,
  website: row.website || undefined,
  subscription: row.subscription,
  coupons: row.coupons || [],
  statistics: row.statistics || { totalMembers: 0, totalBooks: 0, activeBooks: 0, publishedBooks: 0 },
  adminUserIds: row.admin_user_ids || [],
  memberUserIds: row.member_user_ids || [],
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class Organization {
  // Find organization by ID
  static async findById(id: string): Promise<IOrganization | null> {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return rowToOrganization(data as OrganizationRow);
  }

  // Find all organizations
  static async find(filter?: Partial<{ status: OrganizationStatus; type: OrganizationType }>): Promise<IOrganization[]> {
    let query = supabaseAdmin.from('organizations').select('*');

    if (filter?.status) {
      query = query.eq('status', filter.status);
    }
    if (filter?.type) {
      query = query.eq('type', filter.type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((row) => rowToOrganization(row as OrganizationRow));
  }

  // Create new organization
  static async create(orgData: Partial<IOrganization>): Promise<IOrganization> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const insertData = {
      id,
      name: orgData.name,
      name_en: orgData.nameEn || null,
      type: orgData.type || 'association',
      description: orgData.description || null,
      logo_url: orgData.logoUrl || null,
      contact_email: orgData.contactEmail,
      contact_phone: orgData.contactPhone || null,
      website: orgData.website || null,
      subscription: orgData.subscription || {
        plan: 'free',
        maxBooks: 10,
        maxMembers: 50,
        pricePerMonth: 0,
        startDate: now,
        autoRenew: false,
      },
      coupons: orgData.coupons || [],
      statistics: orgData.statistics || { totalMembers: 0, totalBooks: 0, activeBooks: 0, publishedBooks: 0 },
      admin_user_ids: orgData.adminUserIds || [],
      member_user_ids: orgData.memberUserIds || [],
      status: orgData.status || 'active',
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating organization:', error);
      throw new Error(error.message);
    }

    return rowToOrganization(data as OrganizationRow);
  }

  // Update organization
  static async findByIdAndUpdate(
    id: string,
    update: Partial<IOrganization>
  ): Promise<IOrganization | null> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (update.name !== undefined) updateData.name = update.name;
    if (update.nameEn !== undefined) updateData.name_en = update.nameEn;
    if (update.type !== undefined) updateData.type = update.type;
    if (update.description !== undefined) updateData.description = update.description;
    if (update.logoUrl !== undefined) updateData.logo_url = update.logoUrl;
    if (update.contactEmail !== undefined) updateData.contact_email = update.contactEmail;
    if (update.contactPhone !== undefined) updateData.contact_phone = update.contactPhone;
    if (update.website !== undefined) updateData.website = update.website;
    if (update.subscription !== undefined) updateData.subscription = update.subscription;
    if (update.coupons !== undefined) updateData.coupons = update.coupons;
    if (update.statistics !== undefined) updateData.statistics = update.statistics;
    if (update.adminUserIds !== undefined) updateData.admin_user_ids = update.adminUserIds;
    if (update.memberUserIds !== undefined) updateData.member_user_ids = update.memberUserIds;
    if (update.status !== undefined) updateData.status = update.status;

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return rowToOrganization(data as OrganizationRow);
  }

  // Delete organization
  static async findByIdAndDelete(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('organizations')
      .delete()
      .eq('id', id);

    return !error;
  }

  // Find organization by coupon code
  static async findByCouponCode(code: string): Promise<{ organization: IOrganization; coupon: IOrganizationCoupon } | null> {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('*');

    if (error || !data) return null;

    for (const row of data) {
      const org = rowToOrganization(row as OrganizationRow);
      const coupon = org.coupons.find(
        (c) => c.code.toLowerCase() === code.toLowerCase() && c.isActive
      );
      if (coupon) {
        return { organization: org, coupon };
      }
    }

    return null;
  }

  // Add member to organization
  static async addMember(orgId: string, userId: string): Promise<boolean> {
    const org = await this.findById(orgId);
    if (!org) return false;

    if (org.memberUserIds.includes(userId)) return true; // Already a member

    const updatedMembers = [...org.memberUserIds, userId];
    const updatedStats = {
      ...org.statistics,
      totalMembers: updatedMembers.length,
    };

    await this.findByIdAndUpdate(orgId, {
      memberUserIds: updatedMembers,
      statistics: updatedStats,
    });

    return true;
  }

  // Remove member from organization
  static async removeMember(orgId: string, userId: string): Promise<boolean> {
    const org = await this.findById(orgId);
    if (!org) return false;

    const updatedMembers = org.memberUserIds.filter((id) => id !== userId);
    const updatedStats = {
      ...org.statistics,
      totalMembers: updatedMembers.length,
    };

    await this.findByIdAndUpdate(orgId, {
      memberUserIds: updatedMembers,
      statistics: updatedStats,
    });

    return true;
  }

  // Use coupon (increment usage count)
  static async useCoupon(orgId: string, couponCode: string): Promise<boolean> {
    const org = await this.findById(orgId);
    if (!org) return false;

    const updatedCoupons = org.coupons.map((c) => {
      if (c.code.toLowerCase() === couponCode.toLowerCase()) {
        return { ...c, usedCount: c.usedCount + 1 };
      }
      return c;
    });

    await this.findByIdAndUpdate(orgId, { coupons: updatedCoupons });
    return true;
  }
}
