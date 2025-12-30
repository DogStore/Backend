import express from "express";
import { protect }from "../../middlewares/auth.middleware.js";
import {
  getAllProducts,
  getSingleProduct,
  searchProducts,
  getPromotedProducts,
  getProductsByCategory,
  addProductReview, 
  getProductReviews, 
  deleteProductReview
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

// POST /api/products/:id/reviews
router.post('/:id/reviews',protect, addProductReview);  

// GET /api/products/:id/reviews
router.get('/:id/reviews',protect, getProductReviews);  

// DELETE /api/products/:id/reviews/:reviewId
router.delete('/:id/reviews/:reviewId',protect, deleteProductReview);

export default router;
