import { Request, Response } from "express";
import Order from '../../models/order.model.js';
import Cart from '../../models/cart.model.js'
import Coupon from '../../models/coupon.model.js';
import Product from '../../models/product.model.js';

// Helper: Generate unique order number
const generateOrderNumber = () => {
  return `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
};

// GET /api/orders — Get user's order history
export const getOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name slug images');

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error: any) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/:id — Get single order by ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;

    const order = await Order.findOne({ _id: id, user: userId })
      .populate('items.product', 'name slug images');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.status(200).json({ success: true, order });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/orders — Create new order (checkout)
export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { shippingAddress, phone, appliedCoupon } = req.body;

    if (!shippingAddress || !phone) {
      return res.status(400).json({ success: false, message: 'Shipping address and phone are required' });
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const validItems = cart.items.filter(item => item.product != null);
    if (validItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart contains no valid products' });
    }

    // CHECK STOCK VALIDATION
    for (const item of validItems) {
      const productId = typeof item.product === 'string' 
        ? item.product 
        : (item.product as any)._id;

      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const quantity = item.quantity || 1;
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${quantity}`
        });
      }
    }

    let totalAmount = 0;
    const orderItems = validItems.map(item => {
      const productId = typeof item.product === 'string' 
        ? item.product 
        : (item.product as any)._id;

      const price = item.price || 
                  (item.product as any)?.salePrice || 
                  (item.product as any)?.regularPrice ||
                  0;

      totalAmount += price * (item.quantity || 1);

      return {
        product: productId,
        name: item.name || (item.product as any)?.name || '',
        slug: item.slug || (item.product as any)?.slug || '',
        image: item.image || (item.product as any)?.images?.[0] || '',
        price,
        quantity: item.quantity || 1
      };
    });

  let finalTotal = totalAmount;
  let couponData = null;

  if (appliedCoupon?.code) {
    const coupon = await Coupon.findOne({
      code: appliedCoupon.code.trim().toUpperCase(),
      isActive: true,
      validUntil: { $gt: new Date() }
    });

    if (coupon) {

      // CHECK TOTAL LIMIT
      if (coupon.usageLimitTotal && coupon.usedCount >= coupon.usageLimitTotal) {
        return res.status(400).json({
          success: false,
          message: "Coupon usage limit reached"
        });
      }

      // CHECK PER USER LIMIT
      const userUsage = coupon.usedBy.find(
        (u: any) => u.user.toString() === userId.toString()
      );

      if (userUsage && coupon.usageLimitPerUser && userUsage.count >= coupon.usageLimitPerUser) {
        return res.status(400).json({
          success: false,
          message: "You already used this coupon"
        });
      }

      // CALCULATE DISCOUNT ONLY AFTER LIMITS PASS
      let discount = coupon.type === 'percent'
        ? totalAmount * (coupon.value / 100)
        : coupon.value;

      if (coupon.minOrderAmount && totalAmount < coupon.minOrderAmount) {
        return res.status(400).json({
          success: false,
          message: `Minimum order amount $${coupon.minOrderAmount} required`
        });
      }

      finalTotal = Math.max(0, totalAmount - discount);

      couponData = {
        code: coupon.code,
        discountAmount: discount
      };

      // UPDATE COUPON USAGE
      coupon.usedCount += 1;

      if (userUsage) {
        userUsage.count += 1;
      } else {
        coupon.usedBy.push({ user: userId, count: 1 });
      }

      await coupon.save();
    }
  }

    // Create order
    const order = new Order({
      orderNumber: generateOrderNumber(),
      user: userId,
      items: orderItems,
      totalAmount: finalTotal,
      shippingAddress,
      phone,
      appliedCoupon: couponData,
      status: 'pending'
    });

    await order.save();

    // Update each product
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 
          stock: -item.quantity, 
          soldCount: item.quantity 
        }
      });
    }
    // Clear user's cart
    await Cart.findOneAndDelete({ user: userId });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });

  } catch (error: any) {
    console.error('Error creating order:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// PUT /api/orders/:id — Allow user to cancel order
export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).user._id;
    if (status !== 'canceled') {
      return res.status(400).json({ success: false, message: 'Only cancellation is allowed' });
    }

    const order = await Order.findOne({ _id: id, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!['pending', 'paid'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this order' });
    }

    order.status = 'canceled';
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order canceled successfully',
      order
    });

  } catch (error: any) {
    console.error('Error updating order:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/orders/validate-coupon
export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { couponCode, cartTotal } = req.body;

    if (!couponCode) {
      return res.status(400).json({ valid: false, message: 'Coupon code required' });
    }

    const coupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase(),
      isActive: true,
      validUntil: { $gt: new Date() }
    });

    if (!coupon) {
      return res.status(200).json({ valid: false, message: 'Invalid or expired coupon' });
    }

    if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
      return res.status(200).json({ 
        valid: false, 
        message: `Min order: $${coupon.minOrderAmount}` 
      });
    }

    // Calculate discount
    const discount = coupon.type === 'percent'
      ? cartTotal * (coupon.value / 100)
      : coupon.value;

    return res.status(200).json({
      valid: true,
      discountAmount: parseFloat(discount.toFixed(2)),
      finalTotal: parseFloat((cartTotal - discount).toFixed(2)),
      coupon: {
        code: coupon.code,
        title: coupon.title
      }
    });

  } catch (error: any) {
    console.error('Coupon validation error:', error);
    return res.status(500).json({ valid: false, message: 'Validation error' });
  }
};