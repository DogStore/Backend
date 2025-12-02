import { Request, Response } from "express";
import Product from "../../models/product.model.js";
import Category from "../../models/category.model.js";

// GET /api/products — All products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find()
      .populate('category', 'name slug') // Only populate name & slug of category
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/:slug — Single product by slug
export const getSingleProduct = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug }).populate('category');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, product });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/search/query — Search products
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q } = req.query; // e.g., ?q=headphones

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    const regex = new RegExp(q.trim(), 'i'); // case-insensitive

    const products = await Product.find({
      $or: [
        { name: { $regex: regex } },
        { description: { $regex: regex } },
        { slug: { $regex: regex } }
      ]
    })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      query: q,
      products,
    });
  } catch (error: any) {
    console.error('Error searching products:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/promoted/list — Promoted products
export const getPromotedProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ isPromoted: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error: any) {
    console.error('Error fetching promoted products:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/category/:categorySlug — Products by category slug
export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const { categorySlug } = req.params;

    const category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const products = await Product.find({ category: category._id })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      category: category.name,
      products,
    });
  } catch (error: any) {
    console.error('Error fetching products by category:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};