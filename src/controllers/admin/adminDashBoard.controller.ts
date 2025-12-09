// controllers/admin/adminDashboard.controller.ts
import { Request, Response } from 'express';
import Order from '../../models/order.model.js';
import User from '../../models/user.model.js';
import Product from '../../models/product.model.js';

// GET /api/admin/dashboard/stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts
    ] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $nin: ['canceled'] } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      Order.countDocuments({ status: { $nin: ['canceled'] } }),
      User.countDocuments({ isActive: true }),
      Product.countDocuments()
    ]);

    return res.status(200).json({
      success: true,
      lastUpdated: new Date().toISOString(),
      stats: {
        totalRevenue: parseFloat((totalRevenue[0]?.total || 0).toFixed(2)),
        totalOrders,
        totalUsers,
        totalProducts
      }
    });

  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/dashboard/sales
export const getDashboardSales = async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sales = await Order.aggregate([
      {
        $match: {
          status: { $nin: ['canceled'] },
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          dailyRevenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill missing days
    const salesMap = new Map(sales.map(day => [day._id, day]));
    const result = [];
    const currentDate = new Date(thirtyDaysAgo);

    while (currentDate <= new Date()) {
      const dateStr = currentDate.toISOString().split('T')[0];
      result.push(salesMap.has(dateStr) 
        ? salesMap.get(dateStr) 
        : { _id: dateStr, dailyRevenue: 0, orders: 0 }
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return res.status(200).json({
      success: true,
      lastUpdated: new Date().toISOString(),
      sales: result
    });

  } catch (error: any) {
    console.error('Error fetching sales:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/dashboard/users
export const getDashboardUsers = async (req: Request, res: Response) => {
  try {
    const [totalUsers, adminUsers, userGrowth] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'admin', isActive: true }),
      User.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    return res.status(200).json({
      success: true,
      lastUpdated: new Date().toISOString(),
      users: {
        total: totalUsers,
        admins: adminUsers,
        regular: totalUsers - adminUsers,
        growth: userGrowth
      }
    });

  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/dashboard/products
export const getDashboardProducts = async (req: Request, res: Response) => {
  try {
    const [totalProducts, outOfStock, bestSellers, categoryStats] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      
      // Best sellers
      Order.aggregate([
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "productDetails"
          }
        },
        { $unwind: "$productDetails" },
        {
          $group: {
            _id: "$items.product",
            name: { $first: "$productDetails.name" },
            totalSold: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 }
      ]),
      
      // Category stats (for pie chart)
      Order.aggregate([
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "productDetails"
          }
        },
        { $unwind: "$productDetails" },
        {
          $lookup: {
            from: "categories",
            localField: "productDetails.category",
            foreignField: "_id",
            as: "categoryDetails"
          }
        },
        { $unwind: "$categoryDetails" },
        {
          $group: {
            _id: "$categoryDetails.name",
            totalSold: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
          }
        },
        { $sort: { totalSold: -1 } }
      ])
    ]);

    return res.status(200).json({
      success: true,
      lastUpdated: new Date().toISOString(),
      products: {
        total: totalProducts,
        outOfStock,
        bestSellers,
        categoryStats
      }
    });

  } catch (error: any) {
    console.error('Error fetching product stats:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};