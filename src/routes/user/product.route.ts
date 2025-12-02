import express from "express";
import {
  getAllProducts,
  getSingleProduct,
  searchProducts,
  getPromotedProducts,
  getProductsByCategory
} from "../../controllers/user/product.controller.js";

const router = express.Router();

// Get all products
router.get("/", getAllProducts);

// Get single product by slug
router.get("/:slug", getSingleProduct);

// Search products
router.get("/search/query", searchProducts);

// Get promoted products
router.get("/promoted/list", getPromotedProducts);

// Get products by category slug
router.get("/category/:categorySlug", getProductsByCategory);

export default router;
