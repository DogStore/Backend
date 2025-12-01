import { Request, Response } from 'express';
import Coupon from '../../models/coupon.model.js';

// GET /api/admin/coupons
export const getAdminCoupons = async (req: Request, res: Response) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/coupons/:id
export const getAdminCouponById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    return res.status(200).json({ success: true, coupon });
  } catch (error: any) {
    console.error('Error fetching coupon by ID:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/coupons
export const createAdminCoupon = async (req: Request, res: Response) => {
  try {
    const {
      code,
      title,
      type,
      value,
      minOrderAmount,
      usageLimitTotal,
      usageLimitPerUser = 1,
      validUntil
    } = req.body;

    // Validation
    if (!code || !type || value === undefined) {
      return res.status(400).json({ success: false, message: 'Code, type, and value are required' });
    }

    if (!['percent', 'fixed'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be "percent" or "fixed"' });
    }

    if (type === 'percent' && (value < 0 || value > 100)) {
      return res.status(400).json({ success: false, message: 'Percent value must be between 0-100' });
    }

    if (value < 0) {
      return res.status(400).json({ success: false, message: 'Value cannot be negative' });
    }

    // Auto-uppercase code
    const couponCode = code.trim().toUpperCase();

    // Check for duplicate code
    const existing = await Coupon.findOne({ code: couponCode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = new Coupon({
      code: couponCode,
      title: title?.trim(),
      type,
      value,
      minOrderAmount: minOrderAmount || 0,
      usageLimitTotal: usageLimitTotal || null,
      usageLimitPerUser,
      validUntil: validUntil ? new Date(validUntil) : null,
      isActive: true
    });

    await coupon.save();

    return res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      coupon
    });

  } catch (error: any) {
    console.error('Error creating coupon:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/coupons/:id
export const updateAdminCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      code,
      title,
      type,
      value,
      minOrderAmount,
      usageLimitTotal,
      usageLimitPerUser,
      validUntil,
      isActive
    } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    // Prevent updating code if coupon has been used
    if (code && coupon.usedCount > 0 && code.trim().toUpperCase() !== coupon.code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change coupon code after it has been used' 
      });
    }

    // Update fields
    if (code !== undefined) coupon.code = code.trim().toUpperCase();
    if (title !== undefined) coupon.title = title?.trim();
    if (type !== undefined) coupon.type = type;
    if (value !== undefined) coupon.value = value;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (usageLimitTotal !== undefined) coupon.usageLimitTotal = usageLimitTotal;
    if (usageLimitPerUser !== undefined) coupon.usageLimitPerUser = usageLimitPerUser;
    if (validUntil !== undefined) coupon.validUntil = validUntil ? new Date(validUntil) : null;
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      coupon
    });

  } catch (error: any) {
    console.error('Error updating coupon:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/coupons/:id (Soft Delete Recommended)
export const deleteAdminCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    // 🔒 Safer: Deactivate instead of hard delete
    coupon.isActive = false;
    await coupon.save();

    return res.status(200).json({
      success: true,
      message: 'Coupon deactivated successfully'
    });

    // 💀 Hard delete (uncomment if needed):
    // await Coupon.findByIdAndDelete(id);
    // return res.status(200).json({ success: true, message: 'Coupon deleted successfully' });

  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};