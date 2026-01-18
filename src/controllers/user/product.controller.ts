import { Request, Response } from "express";
import Product from "../../models/product.model.js";
import Category from "../../models/category.model.js";

// GET /api/products — All products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find()
      .populate('category', 'name slug')
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
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    const regex = new RegExp(q.trim(), 'i');

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

// POST /api/products/:id/reviews – Add Review
// controllers/user/product.controller.ts 
export const addProductReview = async (req: Request, res: Response) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const userId = (req as any).user._id;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Rating and comment required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user already reviewed
    const existingReview = product.reviews.find(r => r.user.toString() === userId);
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You already reviewed this product' });
    }

    // Add review
    product.reviews.push({
      user: userId,
      rating: Number(rating),
      comment: comment.trim(),
      createdAt: new Date()
    });

    // Recalculate
    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.avgRating = totalRating / product.reviews.length;
    product.reviewCount = product.reviews.length;

    await product.save();

    // Populate user name for response
    await product.populate('reviews.user', 'name');

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review: product.reviews[product.reviews.length - 1]
    });
  } catch (error: any) {
    console.error('Add review error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/:id/reviews – Get All Reviews

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId).populate('reviews.user', 'name');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      reviews: product.reviews
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//  DELETE /api/products/:id/reviews/:reviewId – Delete Review (User or Admin)

export const deleteProductReview = async (req: Request, res: Response) => {
  try {
    const { id: productId, reviewId } = req.params;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const reviewIndex = product.reviews.findIndex(r => r._id?.toString() === reviewId);
    if (reviewIndex === -1) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const review = product.reviews[reviewIndex];
    if (review.user.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    product.reviews.splice(reviewIndex, 1);

    if (product.reviews.length > 0) {
      const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
      product.avgRating = totalRating / product.reviews.length;
      product.reviewCount = product.reviews.length;
    } else {
      product.avgRating = 0;
      product.reviewCount = 0;
    }

    await product.save();

    res.json({ success: true, message: 'Review deleted' });
  } catch (error: any) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

