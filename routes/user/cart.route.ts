import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from "../../controllers/user/cart.controller.js";
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();
router.use(protect)

// Get user cart
router.get("/", getCart);

// Add product to cart
router.post("/", addToCart);

// Update cart item quantity
router.put("/:itemId", updateCartItem);

// Remove one item
router.delete("/:itemId", removeCartItem);

// Clear entire cart
router.delete("/", clearCart);

export default router;
