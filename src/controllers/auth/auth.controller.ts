import { Request, Response } from 'express';
import User from '../../models/user.model.js';
import generateToken from '../../utils/generateToken.js';
import jwt from 'jsonwebtoken'

// Custom interface for req.user (after protect middleware)
interface AuthRequest extends Request {
  user?: any;
}

// REGISTER
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: email === 'admin@doghub.com' ? 'admin' : 'user' // auto admin if you want
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id.toString())
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// LOGIN
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id.toString())
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// LOGOUT (client removes token, we just respond)
export const logoutUser = async (req: AuthRequest, res: Response) => {
  res.json({ message: 'Logged out successfully' });
  // Token is removed on frontend (localStorage.removeItem('token'))
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

// REFRESH TOKEN (simple version — just regenerate)
export const refreshToken = async (req: Request, res: Response) => {
  const { token } = req.body; // old token

  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const newToken = generateToken(decoded.id);

    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};