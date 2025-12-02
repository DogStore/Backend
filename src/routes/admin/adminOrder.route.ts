import express from "express";
import {protect, admin} from '../../middlewares/auth.middleware.js'
import {
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrder,
  deleteAdminOrder
} from "../../controllers/admin/adminOrder.controller.js";

const router = express.Router();
router.use(protect, admin);

// Get all orders
router.get("/", getAdminOrders);

// Get order by ID
router.get("/:id", getAdminOrderById);

// Update order
router.put("/:id", updateAdminOrder);

// Delete order
router.delete("/:id", deleteAdminOrder);

export default router;
