import { Request, Response } from "express";
import Category from '../../models/category.model.js'
import cloudinary from "../../configs/cloudinary.config.js"

// GET /api/admin/categories → get all
export const getAdminCategories = async (req: Request, res: Response) => {
  const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
};

// PUT update — optional new image
export const updateAdminCategory = async (req: Request, res: Response) => {
  try {
      const category = await Category.findById(req.params.id);
      if (!category) return res.status(404).json({ message: 'Not found' });

      const { name } = req.body;
      let imageUrl = category.image;

        // If new image, upload and replace old
    if (req.file && req.file.buffer) {
      // Delete old image from Cloudinary (optional, pro touch)
      if (category.image) {
        const publicId = category.image.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }

    // Upload new image
    const result = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'doghub/categories' },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (!result || !result.secure_url) {
            reject(new Error('Cloudinary upload failed: no secure_url returned'));
          } else {
            resolve(result.secure_url);
          }
        }
      );
      stream.end((req.file as Express.Multer.File).buffer); // ✅ Safe now — we checked req.file.buffer exists
    });

    imageUrl = result;
  }

    let slug = category.slug;
    if (name && name.trim() !== category.name) {
      slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    category.name = name?.trim() || category.name;
    category.slug = slug;
    category.image = imageUrl;

    await category.save();
    res.json(category);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
// POST create — upload image + save to DB
export const createAdminCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) return res.status(400).json({ message: 'Name required' });

    let imageUrl = '';

    // If image uploaded, upload to Cloudinary
    if (req.file) {
      const result: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'doghub/categories',
            transformation: [{ width: 500, height: 500, crop: 'limit' }]
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end((req.file as Express.Multer.File).buffer); // 👈 Type assertion here
      });

      imageUrl = result.secure_url;
    }

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const categoryExists = await Category.findOne({ slug });
    if (categoryExists) return res.status(400).json({ message: 'Category exists' });

    const category = await Category.create({
      name: name.trim(),
      slug,
      image: imageUrl
    });

    res.status(201).json(category);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
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
