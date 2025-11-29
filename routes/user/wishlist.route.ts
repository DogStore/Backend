import express from "express";
import {
  getWishlist,
  addToWishlist,
  removeWishlistItem,
  clearWishlist,
} from "../../controllers/user/wishlist.controller.js";

const router = express.Router();

// Get wishlist
router.get("/", getWishlist);

// Add item to wishlist
router.post("/", addToWishlist);

// Remove a single wishlist item
router.delete("/:itemId", removeWishlistItem);

// Clear entire wishlist
router.delete("/", clearWishlist);

export default router;
