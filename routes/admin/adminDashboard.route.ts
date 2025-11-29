import express from "express";
import {protect, admin} from '../../middlewares/auth.middleware.js'
import {
  getDashboardStats,
  getDashboardSales,
  getDashboardUsers,
  getDashboardProducts
} from "../../controllers/admin/adminDashBoard.controller.js";

const router = express.Router();
router.use(protect, admin);

// Dashboard stats
router.get("/stats", getDashboardStats);

// Dashboard sales
router.get("/sales", getDashboardSales);

// Dashboard users
router.get("/users", getDashboardUsers);

// Dashboard products
router.get("/products", getDashboardProducts);

export default router;
