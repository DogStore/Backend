import { Request, Response } from 'express';
import User from '../../models/user.model.js';
import cloudinary from '../../configs/cloudinary.config.js';

// GET /api/user/profile — Get user profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/user/profile — Update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { name, email, phone } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (name) user.name = name.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (phone) user.phone = phone.trim();

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toObject()
    });

  } catch (error: any) {
    console.error('Error updating profile:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/user/profile — Delete user account (soft delete recommended)
export const deleteUserAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error: any) {
    console.error('Error deleting account:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateUserImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.userImage) {
      const publicId = getPublicIdFromUrl(user.userImage);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    // Upload new image
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'doghub/users' },
        (error, result) => {
          if (error) {
            reject(new Error('Image upload failed'));
          } else {
            resolve(result);
          }
        }
      ).end(req.file.buffer);
    });

    // Save new image URL
    user.userImage = result.secure_url;
    await user.save();

    res.json({
      success: true,
      message: 'Profile image updated successfully',
      userImage: user.userImage
    });
  } catch (error: any) {
    console.error('Update user image error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Extract Public ID from URL
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

// ----- Address Management ----- //

// GET /api/user/addresses — Get all user addresses
export const getUserAddresses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const user = await User.findById(userId).select('addresses');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      addresses: user.addresses || [],
      count: (user.addresses || []).length
    });

  } catch (error: any) {
    console.error('Error fetching addresses:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/user/addresses — Add new address
export const addUserAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { title, street, city, country, postalCode, isDefault } = req.body;


    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (isDefault) {
      user.addresses = user.addresses.map(addr => ({ ...addr, isDefault: false }));
    }

    const newAddress = {
      title: title.trim(),
      street: street.trim(),
      city: city.trim(),
      country: country.trim(),
      postalCode: postalCode.trim(),
      isDefault: isDefault || false
    };

    user.addresses.push(newAddress);
    await user.save();

    return res.status(201).json({ success: true, message: 'Address added', address: newAddress });
  } catch (error: any) {
    console.error('Error adding address:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/user/addresses/:addressId — Update address
export const updateUserAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { addressId } = req.params;
    const { title, street, city, country, postalCode, isDefault } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (isDefault) {
      user.addresses = user.addresses.map(addr => ({ ...addr, isDefault: false }));
    }

    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex],
      title: title?.trim() || user.addresses[addressIndex].title,
      street: street?.trim() || user.addresses[addressIndex].street,
      city: city?.trim() || user.addresses[addressIndex].city,
      country: country?.trim() || user.addresses[addressIndex].country,
      postalCode: postalCode?.trim() || user.addresses[addressIndex].postalCode,
      isDefault: isDefault !== undefined ? isDefault : user.addresses[addressIndex].isDefault
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      address: user.addresses[addressIndex]
    });

  } catch (error: any) {
    console.error('Error updating address:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/user/addresses/:addressId — Delete address
export const deleteUserAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const initialLength = user.addresses.length;
    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== addressId
    );

    if (user.addresses.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting address:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

