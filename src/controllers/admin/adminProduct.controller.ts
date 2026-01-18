import { Request, Response } from "express";
import cloudinary from "../../configs/cloudinary.config.js";
import Category from '../../models/category.model.js'
import Product from '../../models/product.model.js'

const getPublicIdFromUrl = (url: string): string | null => {
  try {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    return publicId;
  } catch {
    return null;
  }
};

// GET /admin/products
export const getAdminProducts = async (req: Request, res: Response) => {
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

// GET /admin/products/:id
export const getAdminProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, product });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /admin/products
export const createAdminProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, regularPrice, discount, category, stock, size, isPromoted, isActive, countryName } = req.body;

    if (!name || !regularPrice || !category || !stock) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const discountNum = parseFloat(discount) || 0;
    const regularPriceNum = parseFloat(regularPrice);
    const salePrice = discountNum > 0
      ? regularPriceNum - (regularPriceNum * discountNum / 100)
      : regularPriceNum;

  let imageUrls: string[] = [];
  const images = (req.files as any)?.['images'];
  if (images && Array.isArray(images) && images.length > 0) {
    imageUrls = await Promise.all(
      images.map(async (file: Express.Multer.File) => {
        return new Promise<string>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'doghub/products' },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                reject(new Error('Image upload failed'));
              } else {
                resolve(result!.secure_url);
              }
            }
          ).end(file.buffer);
        });
      })
    );
  }

  let countryFlagUrl: string | null = null;
  const countryFlagFile = (req.files as any)?.['countryFlag']?.[0];
  if (countryFlagFile) {
    countryFlagUrl = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'doghub/flags' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary flag upload error:', error);
            reject(new Error('Flag upload failed'));
          } else {
            resolve(result!.secure_url);
          }
        }
      ).end(countryFlagFile.buffer);
    });
  }

    const product = new Product({
      name: name.trim(),
      slug,
      description: description?.trim(),
      regularPrice: regularPriceNum,
      discount: discountNum,
      salePrice,
      category,
      stock: parseInt(stock, 10),
      size: size?.trim(),
      isPromoted: isPromoted === 'true' || isPromoted === true,
      isActive: isActive === 'true' || isActive === true, 
      images: imageUrls,
      countryFlag: countryFlagUrl,
      countryName: countryName?.trim() || ''
    });

    await product.save();

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });

  } catch (error: any) {
    console.error('Error creating product:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// PUT /admin/products/:id
export const updateAdminProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { name, description, regularPrice, discount, category, stock, size, isPromoted, isActive } = req.body;

    if (category) {
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        return res.status(400).json({ success: false, message: 'Invalid category' });
      }
    }

    let slug = product.slug;
    if (name && name.trim() !== product.name) {
      slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const discountNum = discount !== undefined ? parseFloat(discount) : product.discount;
    const regularPriceNum = regularPrice !== undefined ? parseFloat(regularPrice) : product.regularPrice;
    const salePrice = discountNum > 0
      ? regularPriceNum - (regularPriceNum * discountNum / 100)
      : regularPriceNum;

    let updatedImageUrls = [...product.images];

    const imagesToDelete = req.body.imagesToDelete || [];
    if (Array.isArray(imagesToDelete)) {
      updatedImageUrls = updatedImageUrls.filter(url => !imagesToDelete.includes(url));

      await Promise.all(
        imagesToDelete.map(async (url: string) => {
          const publicId = getPublicIdFromUrl(url);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        })
      );
    }

    let newImageUrls: string[] = [];
    const images = (req.files as any)?.['images'];
    if (images && Array.isArray(images) && images.length > 0) {
      newImageUrls = await Promise.all(
        images.map(async (file: Express.Multer.File) => {
          return new Promise<string>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: 'doghub/products' },
              (error, result) => {
                if (error) {
                  console.error('Cloudinary image upload error:', error);
                  reject(new Error('Image upload failed'));
                } else {
                  resolve(result!.secure_url);
                }
              }
            ).end(file.buffer);
          });
        })
      );
    }

    const finalImageUrls = [...updatedImageUrls, ...newImageUrls];

    let newCountryFlag = product.countryFlag;
    const countryFlagFile = (req.files as any)?.['countryFlag']?.[0];
    if (countryFlagFile) {
      if (product.countryFlag) {
        const publicId = getPublicIdFromUrl(product.countryFlag);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }

      newCountryFlag = await new Promise<string>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'doghub/flags' },
          (error, result) => {
            if (error) {
              console.error('Cloudinary flag upload error:', error);
              reject(new Error('Flag upload failed'));
            } else {
              resolve(result!.secure_url);
            }
          }
        ).end(countryFlagFile.buffer);
      });
    }

    const countryName = req.body.countryName !== undefined 
      ? req.body.countryName.trim() 
      : product.countryName;
    product.set({
      name: name?.trim() || product.name,
      slug,
      description: description?.trim() || product.description,
      regularPrice: regularPriceNum,
      discount: discountNum,
      salePrice,
      category: category || product.category,
      stock: stock !== undefined ? parseInt(stock, 10) : product.stock,
      size: size?.trim() || product.size,
      isPromoted: isPromoted !== undefined 
        ? (isPromoted === 'true' || isPromoted === true) 
        : product.isPromoted,
      images: finalImageUrls,
      isActive: isActive !== undefined
        ? (isActive === 'true' || isActive === true)
        : product.isActive,
      countryFlag: newCountryFlag,
      countryName: countryName
    });

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });

  } catch (error: any) {
    console.error('Error updating product:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /admin/products/:id
export const deleteAdminProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.images.length > 0) {
      await Promise.all(
        product.images.map(async (url) => {
          const publicId = getPublicIdFromUrl(url);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        })
      );
    }

    if (product.countryFlag) {
      const publicId = getPublicIdFromUrl(product.countryFlag);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });

  } catch (error: any) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
