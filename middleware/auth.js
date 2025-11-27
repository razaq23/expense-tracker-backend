import { verifyToken } from '../utils/jwtUtils.js';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Find user by ID from token
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token. User not found.' 
      });
    }

    // Add user to request object
    req.user = user;
    
    // Continue to next middleware/route
    next();
    
  } catch (error) {
    res.status(401).json({ 
      error: 'Invalid token.' 
    });
  }
};