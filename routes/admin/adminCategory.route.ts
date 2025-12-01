import express from "express";
import {protect, admin} from '../../middlewares/auth.middleware.js'
import { uploadCategoryImage } from '../../middlewares/uploadCategoryImage.middleware.js';
import {
  getAdminCategories,
  getAdminCategoryById,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory
} from "../../controllers/admin/adminCategory.controller.js";

const router = express.Router();
router.use(protect, admin);

// Get all categories
router.get("/", getAdminCategories);

// Get category by ID
router.get("/:id", getAdminCategoryById);

// Create new category
router.post("/", uploadCategoryImage, createAdminCategory);

// Update category
router.put("/:id", uploadCategoryImage, updateAdminCategory);

// Delete category
router.delete("/:id", deleteAdminCategory);

export default router;
