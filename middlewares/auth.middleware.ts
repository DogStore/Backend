import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/user.model.js'; // Adjust path if needed

// Define a custom interface to extend the Express Request object
// This allows TypeScript to know that 'req.user' exists
interface CustomRequest extends Request {
    user?: any; // You can define a more specific User type here if preferred
}

export const protect = async (req: CustomRequest, res: Response, next: NextFunction) => {
    let token;

    // 1. Check for token in the 'Authorization' header
    // Format: "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (split by space to get the token part)
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

            // 3. Find user by ID and attach to request object (excluding password)
            // We only select the necessary fields (_id, name, email, role)
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next(); // Move to the next middleware or the route handler

        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Ensure this uses the CustomRequest interface defined above
export const admin = (req: CustomRequest, res: Response, next: NextFunction) => {
    // 1. Check if the user exists (should exist if protect ran successfully)
    // 2. Check if the user's role is 'admin'
    if (req.user && req.user.role === 'admin') {
        next(); // User is an admin, proceed
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};