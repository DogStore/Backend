import express from "express";
import {protect, admin} from '../../middlewares/auth.middleware.js'
import {
  getAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct
} from "../../controllers/admin/adminProduct.controller.js";

const router = express.Router();

router.use(protect, admin);

// Get all products
router.get("/", getAdminProducts);

// Get product by ID
router.get("/:id", getAdminProductById);

// Create new product
router.post("/", createAdminProduct);

// Update product
router.put("/:id", updateAdminProduct);

// Delete product
router.delete("/:id", deleteAdminProduct);

export default router;
