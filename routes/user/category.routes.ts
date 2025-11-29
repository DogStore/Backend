import express from "express";
import {
  getCategories,
  getCategoryById,
} from "../../controllers/user/category.controller.js";

const router = express.Router();

// Get all categories
router.get("/", getCategories);

// Get category by ID
router.get("/:id", getCategoryById);

export default router;
