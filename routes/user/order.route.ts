import express from "express";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder
} from "../../controllers/user/order.controller.js";

const router = express.Router();

// Get all orders for logged-in user
router.get("/", getOrders);

// Get single order by ID
router.get("/:id", getOrderById);

// Create new order
router.post("/", createOrder);

// Update order (optional, e.g., cancel)
router.put("/:id", updateOrder);

export default router;
