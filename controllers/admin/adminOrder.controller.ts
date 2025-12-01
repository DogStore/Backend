import { Request, Response } from 'express';
import Order from '../../models/order.model.js'

// GET /api/admin/orders
export const getAdminOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name slug images') // 👈 'images' (plural) to match your Product model
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error: any) {
    console.error('Error fetching admin orders:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/orders/:id
export const getAdminOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('user', 'name email')
      .populate('items.product', 'name slug images');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.status(200).json({ success: true, order });
  } catch (error: any) {
    console.error('Error fetching admin order by ID:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/orders/:id
export const updateAdminOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, shippingAddress, phone } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Validate status
    const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'canceled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }

    // Update fields
    if (status !== undefined) order.status = status;
    if (shippingAddress) {
      order.shippingAddress = {
        ...order.shippingAddress,
        ...shippingAddress
      };
    }
    if (phone !== undefined) order.phone = phone;

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order,
    });

  } catch (error: any) {
    console.error('Error updating admin order:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/admin/orders/:id (Optional — rarely used in real apps)
export const deleteAdminOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await Order.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
    });

  } catch (error: any) {
    console.error('Error deleting admin order:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};