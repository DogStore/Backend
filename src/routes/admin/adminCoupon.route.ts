import express from "express";
import {protect, admin} from '../../middlewares/auth.middleware.js'
import {
  getAdminCoupons,
  getAdminCouponById,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon
} from "../../controllers/admin/adminCoupon.controller.js";

const router = express.Router();
router.use(protect, admin);

// Get all coupons
router.get("/", getAdminCoupons);

// Get coupon by ID
router.get("/:id", getAdminCouponById);

// Create new coupon
router.post("/", createAdminCoupon);

// Update coupon
router.put("/:id", updateAdminCoupon);

// Delete coupon
router.delete("/:id", deleteAdminCoupon);

export default router;
