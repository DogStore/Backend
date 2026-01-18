import { Request, Response } from "express";
import Cart from '../../models/cart.model.js';
import Product from "../../models/product.model.js";

// GET /api/cart — Get user's cart
export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id; 

    const cart = await Cart.findOne({ user: userId }).populate('items.product', 'name slug images');

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: 'Cart is empty',
        cart: { items: [], totalItems: 0, totalPrice: 0 }
      });
    }

    // Calculate totals
    const totalItems = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalPrice = cart.items.reduce((sum, item) => {
      const price = item.price || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);

    return res.status(200).json({
      success: true,
      cart: {
        ...cart.toObject(),
        totalItems,
        totalPrice
      }
    });

  } catch (error: any) {
    console.error('Error fetching cart:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// POST /api/cart — Add product to cart
export const addToCart = async (req: Request, res: Response) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = (req as any).user._id;

    if (!productId || typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid product ID or quantity' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItem = cart.items.find(item => 
      item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images[0] || '',
        price: product.salePrice || product.regularPrice,
        quantity
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart
    });

  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/cart/:itemId — Update item quantity
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = (req as any).user._id;

    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    item.quantity = quantity;
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Cart item updated',
      cart
    });

  } catch (error: any) {
    console.error('Error updating cart item:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/cart/:itemId — Remove one item
export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const userId = (req as any).user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemExists = cart.items.some(item => item._id.toString() === itemId);
    if (!itemExists) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    await Cart.updateOne(
      { user: userId, 'items._id': itemId },
      { $pull: { items: { _id: itemId } } }
    );

    const updatedCart = await Cart.findOne({ user: userId }).populate('items.product', 'name slug images');

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart: updatedCart
    });

  } catch (error: any) {
    console.error('Error removing cart item:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/cart — Clear entire cart
export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    await Cart.findOneAndDelete({ user: userId });

    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });

  } catch (error: any) {
    console.error('Error clearing cart:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};