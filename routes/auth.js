import express from 'express';
import User from "../models/User.js";
import jwt from 'jsonwebtoken';

const router = express.Router();

// Generate token directly in this file
const generateToken = (userId) => {
  console.log('🔐 Generating token with JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    console.log('🔄 Signup attempt:', req.body);
    
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Please provide name, email, and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({ name, email, password });
    console.log('✅ User created:', user);

    // Generate token
    const token = generateToken(user.user_id);

    // Response
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({
      error: 'Server error during registration: ' + error.message
    });
  }
});

// @route   POST /api/auth/login  
router.post('/login', async (req, res) => {
  try {
    console.log('🔄 Login attempt:', req.body);
    
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        error: 'Invalid credentials'
      });
    }

    console.log('📊 User found, checking password...');

    // Check password - FIXED: Use 'password' from database (not password_hash)
    const isPasswordValid = await User.comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.user_id);

    // Response
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      error: 'Server error during login: ' + error.message
    });
  }
});

export default router;