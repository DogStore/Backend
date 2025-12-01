import express from "express";
import {protect} from '../../middlewares/auth.middleware.js'
import {
  getWishlist,
  addToWishlist,
  removeWishlistItem,
  clearWishlist,
} from "../../controllers/user/wishlist.controller.js";

const router = express.Router();
router.use(protect);

// Get wishlist
router.get("/", getWishlist);

// Add item to wishlist
router.post("/", addToWishlist);

// Remove a single wishlist item
router.delete("/:productId", removeWishlistItem);

// Clear entire wishlist
router.delete("/", clearWishlist);

export default router;
