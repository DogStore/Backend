import { Request, Response } from 'express';
import Category from '../../models/category.model.js';

// GET /api/categories — Get all categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find()
      .sort({ createdAt: -1 }); // Newest first

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/categories/:slug — Get category by slug
export const getCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category shit not found' });
    }

    return res.status(200).json({ success: true, category });
  } catch (error: any) {
    console.error('Error fetching category by slug:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
