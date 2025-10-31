import express from 'express';
import Category from '../models/Categoryda.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// ALL Routes are protected
router.use(auth);

// @route   GET /api/categories
// @desc    Get all categories available to the user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const categories = await Category.getUserCategories(req.user.user_id);
    
    res.json({
      success: true,
      categories: categories,
      message: `Found ${categories.length} categories`
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to load categories' 
    });
  }
});

// @route   POST /api/categories
// @desc    Create a new custom category
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { category_name, type } = req.body;

    // Simple validation
    if (!category_name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both category name and type (income/expense)'
      });
    }

    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({
        success: false,
        error: 'Type must be either "income" or "expense"'
      });
    }

    const newCategory = await Category.createCustomCategory(
      req.user.user_id, 
      category_name, 
      type
    );
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: newCategory
    });

  } catch (error) {
    console.error('Create category error:', error);
    
    if (error.message.includes('already have')) {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to create category' 
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a custom category
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    await Category.deleteCustomCategory(req.params.id, req.user.user_id);
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    
    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete category' 
    });
  }
});

export default router;