import express from "express";
import {
  getCategories,
  getCategoryBySlug
} from "../../controllers/user/category.controller.js";

const router = express.Router();

// Get all categories
router.get("/", getCategories);

// Get category by slug
router.get('/:slug', getCategoryBySlug);

export default router;
