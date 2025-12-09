import { Request, Response } from "express";
import User from '../../models/user.model.js'
import generateToken from "../../utils/generateToken.js";

export const createAdminUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Create new admin user
    const user = new User({
      name,
      email,
      password, // will be hashed by pre-save hook
      phone,
      role: 'admin', // 👈 set role to admin
    });

    // Save to get _id
    await user.save();

    // Generate token for new admin (optional: send to frontend)
    const token = generateToken(user._id.toString());

    // Optional: assign token to DB (if using single-token model)
    user.Token = token;
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token, // optional: if you want to auto-login new admin
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ message: 'Server error while creating admin user' });
  }    
}

export const updateAdminUser = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, isActive } = req.body;

    // 👉 Prevent self-update of role (optional safety)
    if (id === req.user._id.toString() && role && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot demote yourself' });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name !== undefined) user.name = name.trim();
    if (email !== undefined) {
      // Check if new email is already used by someone else
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      user.email = email.trim().toLowerCase();
    }
    if (phone !== undefined) user.phone = phone.trim();

    // Update role only if provided and valid
    if (role !== undefined) {
      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be "admin" or "user".' });
      }
      user.role = role;
    }

    if (isActive !== undefined) {
      user.isActive = Boolean(isActive);
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error while updating user' });
  }
};