// middleware/auth.ts (or wherever your protect middleware lives)
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { IUser } from '../interfaces/user.interface.js';
import User from '../models/user.model.js'

// Custom request with typed user
interface CustomRequest extends Request {
  user?: IUser;
}

export const protect = async (req: CustomRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token
      token = req.headers.authorization.split(' ')[1];

      // Verify JWT signature and decode
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

      // Find user by ID
      const user = await User.findById(decoded.id).select('-password -tokens');
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      //Check if this token is stored in the user's tokens array
      if (user.Token !== token) {
        return res.status(401).json({ message: 'Token revoked or invalid' });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin middleware (unchanged, but now req.user is typed!)
export const admin = (req: CustomRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};