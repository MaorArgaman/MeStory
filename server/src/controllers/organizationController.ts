import { Request, Response } from 'express';
import { Organization, IOrganizationCoupon } from '../models/Organization';
import { User } from '../models/User';
import crypto from 'crypto';

// Generate unique coupon code
const generateCouponCode = (prefix: string = ''): string => {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return prefix ? `${prefix}-${random}` : random;
};

// ==================== ADMIN ENDPOINTS ====================

// Get all organizations (admin only)
export const getAllOrganizations = async (req: Request, res: Response) => {
  try {
    const { status, type } = req.query;

    const organizations = await Organization.find({
      status: status as any,
      type: type as any,
    });

    res.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch organizations' });
  }
};

// Get organization by ID (admin only)
export const getOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    res.json({
      success: true,
      data: organization,
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch organization' });
  }
};

// Create new organization (admin only)
export const createOrganization = async (req: Request, res: Response) => {
  try {
    const {
      name,
      nameEn,
      type,
      description,
      contactEmail,
      contactPhone,
      website,
      subscription,
    } = req.body;

    if (!name || !contactEmail) {
      return res.status(400).json({
        success: false,
        error: 'Name and contact email are required',
      });
    }

    const organization = await Organization.create({
      name,
      nameEn,
      type: type || 'association',
      description,
      contactEmail,
      contactPhone,
      website,
      subscription,
    });

    res.status(201).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ success: false, error: 'Failed to create organization' });
  }
};

// Update organization (admin only)
export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const organization = await Organization.findByIdAndUpdate(id, updateData);
    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    res.json({
      success: true,
      data: organization,
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ success: false, error: 'Failed to update organization' });
  }
};

// Delete organization (admin only)
export const deleteOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await Organization.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    res.json({
      success: true,
      message: 'Organization deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ success: false, error: 'Failed to delete organization' });
  }
};

// ==================== COUPON MANAGEMENT ====================

// Create coupon for organization (admin only)
export const createCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      code,
      discountPercent,
      maxUses,
      validFrom,
      validUntil,
    } = req.body;

    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    // Generate code if not provided
    const couponCode = code || generateCouponCode(organization.name.substring(0, 3).toUpperCase());

    // Check if code already exists
    const codeExists = organization.coupons.some(
      (c) => c.code.toLowerCase() === couponCode.toLowerCase()
    );
    if (codeExists) {
      return res.status(400).json({ success: false, error: 'Coupon code already exists' });
    }

    const newCoupon: IOrganizationCoupon = {
      id: crypto.randomUUID(),
      code: couponCode,
      discountPercent: discountPercent || 100, // Default to 100% (free)
      maxUses: maxUses || -1, // -1 for unlimited
      usedCount: 0,
      validFrom: validFrom || new Date().toISOString(),
      validUntil: validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year default
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const updatedCoupons = [...organization.coupons, newCoupon];
    await Organization.findByIdAndUpdate(id, { coupons: updatedCoupons });

    res.status(201).json({
      success: true,
      data: newCoupon,
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ success: false, error: 'Failed to create coupon' });
  }
};

// Update coupon (admin only)
export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const { id, couponId } = req.params;
    const updateData = req.body;

    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    const couponIndex = organization.coupons.findIndex((c) => c.id === couponId);
    if (couponIndex === -1) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }

    const updatedCoupons = [...organization.coupons];
    updatedCoupons[couponIndex] = {
      ...updatedCoupons[couponIndex],
      ...updateData,
    };

    await Organization.findByIdAndUpdate(id, { coupons: updatedCoupons });

    res.json({
      success: true,
      data: updatedCoupons[couponIndex],
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ success: false, error: 'Failed to update coupon' });
  }
};

// Delete coupon (admin only)
export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    const { id, couponId } = req.params;

    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    const updatedCoupons = organization.coupons.filter((c) => c.id !== couponId);
    await Organization.findByIdAndUpdate(id, { coupons: updatedCoupons });

    res.json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ success: false, error: 'Failed to delete coupon' });
  }
};

// ==================== MEMBER MANAGEMENT ====================

// Get organization members (admin only)
export const getOrganizationMembers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    // Fetch member details
    const members = await Promise.all(
      organization.memberUserIds.map(async (userId) => {
        const user = await User.findById(userId);
        if (user) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: organization.adminUserIds.includes(userId),
          };
        }
        return null;
      })
    );

    res.json({
      success: true,
      data: members.filter(Boolean),
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch members' });
  }
};

// Add member to organization (admin only)
export const addOrganizationMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, email } = req.body;

    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    let targetUserId = userId;

    // If email provided instead of userId, find user by email
    if (!targetUserId && email) {
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      targetUserId = user.id;
    }

    if (!targetUserId) {
      return res.status(400).json({ success: false, error: 'User ID or email required' });
    }

    const success = await Organization.addMember(id, targetUserId);
    if (!success) {
      return res.status(500).json({ success: false, error: 'Failed to add member' });
    }

    res.json({
      success: true,
      message: 'Member added successfully',
    });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ success: false, error: 'Failed to add member' });
  }
};

// Remove member from organization (admin only)
export const removeOrganizationMember = async (req: Request, res: Response) => {
  try {
    const { id, userId } = req.params;

    const success = await Organization.removeMember(id, userId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    res.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ success: false, error: 'Failed to remove member' });
  }
};

// ==================== PUBLIC ENDPOINTS ====================

// Validate coupon code (public)
export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const result = await Organization.findByCouponCode(code);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'קוד קופון לא תקף',
        errorEn: 'Invalid coupon code',
      });
    }

    const { organization, coupon } = result;

    // Check if coupon is still valid
    const now = new Date();
    if (new Date(coupon.validFrom) > now) {
      return res.status(400).json({
        success: false,
        error: 'קופון עדיין לא בתוקף',
        errorEn: 'Coupon not yet valid',
      });
    }

    if (new Date(coupon.validUntil) < now) {
      return res.status(400).json({
        success: false,
        error: 'קופון פג תוקף',
        errorEn: 'Coupon expired',
      });
    }

    if (coupon.maxUses !== -1 && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        error: 'קופון מוצה',
        errorEn: 'Coupon usage limit reached',
      });
    }

    res.json({
      success: true,
      data: {
        organizationId: organization.id,
        organizationName: organization.name,
        discountPercent: coupon.discountPercent,
        message: coupon.discountPercent === 100
          ? 'הספר שלך יהיה בחינם!'
          : `הנחה של ${coupon.discountPercent}% על הספר`,
        messageEn: coupon.discountPercent === 100
          ? 'Your book will be free!'
          : `${coupon.discountPercent}% discount on your book`,
      },
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ success: false, error: 'Failed to validate coupon' });
  }
};

// Apply coupon (during registration or book creation)
export const applyCoupon = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const result = await Organization.findByCouponCode(code);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Invalid coupon code' });
    }

    const { organization, coupon } = result;

    // Validate coupon
    const now = new Date();
    if (new Date(coupon.validFrom) > now || new Date(coupon.validUntil) < now) {
      return res.status(400).json({ success: false, error: 'Coupon not valid' });
    }

    if (coupon.maxUses !== -1 && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, error: 'Coupon usage limit reached' });
    }

    // Add user to organization
    await Organization.addMember(organization.id, userId);

    // Increment coupon usage
    await Organization.useCoupon(organization.id, code);

    // Update user's organization reference
    await User.findByIdAndUpdate(userId, {
      organizationId: organization.id,
    });

    res.json({
      success: true,
      data: {
        organizationId: organization.id,
        organizationName: organization.name,
        discountPercent: coupon.discountPercent,
      },
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({ success: false, error: 'Failed to apply coupon' });
  }
};
