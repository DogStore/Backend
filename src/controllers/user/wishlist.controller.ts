import { Request, Response } from 'express';
import Wishlist from '../../models/wishlist.model.js';
import Product from '../../models/product.model.js';

// GET /api/wishlist — Get user's wishlist
export const getWishlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    // Find wishlist and populate products
    const wishlist = await Wishlist.findOne({ user: userId })
      .populate('products', 'name slug images regularPrice salePrice');

    if (!wishlist || wishlist.products.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Wishlist is empty',
        wishlist: [],
        count: 0
      });
    }

    return res.status(200).json({
      success: true,
      count: wishlist.products.length,
      wishlist: wishlist.products // Return just the products array
    });

  } catch (error: any) {
    console.error('Error fetching wishlist:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/wishlist — Add product to wishlist
export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    const userId = (req as any).user._id;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    // Check if product already in wishlist
    const productExists = wishlist.products.some(
      (id: any) => id.toString() === productId
    );

    if (productExists) {
      return res.status(400).json({ success: false, message: 'Product already in wishlist' });
    }

    // Add product
    wishlist.products.push(productId);
    await wishlist.save();

    return res.status(201).json({
      success: true,
      message: 'Product added to wishlist',
      count: wishlist.products.length
    });

  } catch (error: any) {
    console.error('Error adding to wishlist:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/wishlist/:productId — Remove product from wishlist
export const removeWishlistItem = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = (req as any).user._id;

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    // Remove product
    const initialLength = wishlist.products.length;
    wishlist.products = wishlist.products.filter(
      (id: any) => id.toString() !== productId
    );

    if (wishlist.products.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Product not found in wishlist' });
    }

    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      count: wishlist.products.length
    });

  } catch (error: any) {
    console.error('Error removing from wishlist:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/wishlist — Clear entire wishlist
export const clearWishlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    await Wishlist.findOneAndDelete({ user: userId });

    return res.status(200).json({
      success: true,
      message: 'Wishlist cleared successfully'
    });

  } catch (error: any) {
    console.error('Error clearing wishlist:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};