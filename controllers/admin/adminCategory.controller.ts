import { Request, Response } from "express";
import Category from '../../models/category.model'

// GET /api/admin/categories → get all
export const getAdminCategories = async (req: Request, res: Response) => {
  const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
};

// PUT /api/admin/categories/:id → update
export const updateAdminCategory = async (req: Request, res: Response) => {
  const { name, image } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    let slug = category.slug;
    if (name && name.trim() !== category.name) {
      slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    category.name = name?.trim() || category.name;
    category.slug = slug;
    category.image = image || category.image;

    await category.save();
    res.json(category);
};

// POST /api/admin/categories → create new
export const createAdminCategory = async (req: Request, res: Response) => {
  const { name, image } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const categoryExists = await Category.findOne({ slug });
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      image: image || ''
    });

    res.status(201).json(category);
};

// DELETE /api/admin/categories/:id → delete
export const deleteAdminCategory = async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Optional: check if any product uses this category first
    // const used = await Product.findOne({ category: category._id });
    // if (used) return res.status(400).json({ message: 'Category has products' });

    await category.deleteOne();
    res.json({ message: 'Category removed' });
};

// GET /api/admin/categories/:id → get single category (for edit form)
export const getAdminCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
