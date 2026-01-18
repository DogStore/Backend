import express from "express";
import {protect} from '../../middlewares/auth.middleware.js'
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  validateCoupon
} from "../../controllers/user/order.controller.js";

const router = express.Router();
router.use(protect);

// routes/user/order.routes.ts
router.post('/validate-coupon', validateCoupon);

// Get all orders for logged-in user
router.get("/", getOrders);

// Get single order by ID
router.get("/:id", getOrderById);

// Create new order
router.post("/", createOrder);

// Update order
router.put("/:id", updateOrder);

export default router;
