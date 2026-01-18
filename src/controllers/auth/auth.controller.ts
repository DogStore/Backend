import { Request, Response } from 'express';
import User from '../../models/user.model.js';
import generateToken from '../../utils/generateToken.js';
import jwt from 'jsonwebtoken'

interface AuthRequest extends Request {
  user?: any;
}

// REGISTER (corrected)
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const user = new User({
      name,
      email,
      password,
      phone,
      role: email === 'admin@doghub.com' ? 'admin' : 'user'
    });

    await user.save();

    const token = generateToken(user._id.toString());

    user.Token = token; 
    await user.save(); 

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// controllers/auth.controller.ts
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && !user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }
    
    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id.toString());

      user.Token = token;
      await user.save(); 

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// LOGOUT
export const logoutUser = async (req: AuthRequest, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (token && req.user) {
    req.user.tokens = null;;
    await req.user.save();
  }

  res.json({ message: 'Logged out successfully' });
};

// GET CURRENT USER (/me)
export const getMe = async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone
  });
};

// REFRESH TOKEN
export const refreshToken = async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    

    const user = await User.findById(decoded.id);
    if (!user || user.Token !== token) {
      return res.status(401).json({ message: 'Old token revoked' });
    }

    const newToken = generateToken(decoded.id);

    user.Token = newToken;
    await user.save();

    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};