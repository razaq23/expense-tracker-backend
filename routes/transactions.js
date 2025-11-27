import express from 'express';
import Transaction from '../models/Transactionda.js'; // Fixed import name
import Category from '../models/Categoryda.js'; // Fixed import name
import { auth } from '../middleware/auth.js';
import {pool} from '../config/database.js';

const router = express.Router();

// ALL Routes are protected - require authentication
router.use(auth);

// @route   GET /api/transactions
// @desc    Get all transactions for logged-in user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.findByUserId(req.user.user_id);
    res.json({
      transactions,
      count: transactions.length,
      message: `Found ${transactions.length} transactions`
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Server error while fetching transactions' });
  }
});

// @route   GET /api/transactions/categories
// @desc    Get available categories for user with usage info
// @access  Private
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.getUserCategories(req.user.user_id);
    
    const categoriesWithUsage = await Promise.all(
      categories.map(async (category) => {
        const usageQuery = `
          SELECT COUNT(*) as transaction_count, 
                 COALESCE(SUM(amount), 0) as total_amount
          FROM transactions 
          WHERE category_id = $1 AND user_id = $2
        `;
        const usageResult = await pool.query(usageQuery, [category.category_id, req.user.user_id]);
        
        return {
          ...category,
          transaction_count: parseInt(usageResult.rows[0].transaction_count),
          total_amount: parseFloat(usageResult.rows[0].total_amount)
        };
      })
    );

    res.json({
      categories: categoriesWithUsage,
      message: `Found ${categoriesWithUsage.length} categories`
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error while fetching categories' });
  }
});

// 🚨 FIXED VERSION - REMOVE DUPLICATE AND FIX VALIDATION
// @route   POST /api/transactions
// @desc    Create a new transaction (accepts category_id OR category_name)
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { category_id, category_name, amount, type, date, note } = req.body;

    console.log('📨 Received transaction data:', { category_id, category_name, amount, type, date, note });

    // ✅ FIXED VALIDATION: Date is now optional
    if ((!category_id && !category_name) || !amount || !type) {
      return res.status(400).json({
        success: false,
        error: 'Please provide: category (id or name), amount, and type'
      });
    }

    let finalCategoryId = category_id;

    // If user provided category name instead of ID
    if (category_name) {
      const category = await Category.findByName(category_name, req.user.user_id);
      
      if (!category) {
        return res.status(400).json({
          success: false,
          error: `Category "${category_name}" not found. Use /api/categories to see available categories.`
        });
      }
      
      finalCategoryId = category.category_id;
    }

    // ✅ Use provided date OR default to today's date
    const transactionDate = date || new Date().toISOString().split('T')[0];
    
    console.log('📅 Using date for transaction:', transactionDate);

    // Create the transaction
    const transactionData = {
      user_id: req.user.user_id,
      category_id: finalCategoryId,
      amount: parseFloat(amount),
      type,
      date: transactionDate, // This will be today's date if not provided
      note: note || ''
    };

    console.log('💾 Creating transaction with data:', transactionData);

    const transaction = await Transaction.create(transactionData);
    
    res.status(201).json({
      success: true,
      message: 'Transaction added successfully!',
      transaction: transaction,
      note: `Date used: ${transactionDate}`
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add transaction: ' + error.message 
    });
  }
});

// ... keep your existing PUT and DELETE routes below
// @route   PUT /api/transactions/:id
// @desc    Update a transaction (accepts category_id OR category_name)
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;
    
    // Check if transaction belongs to user
    const belongsToUser = await Transaction.belongsToUser(transactionId, req.user.user_id);
    if (!belongsToUser) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const { category_id, category_name, amount, type, date, note } = req.body;

    // Validation
    if (amount && amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than 0'
      });
    }

    let finalCategoryId = category_id;

    // Handle category_name if provided
    if (category_name && !category_id) {
      const categoryQuery = `
        SELECT category_id FROM categories 
        WHERE LOWER(category_name) = LOWER($1) 
        AND (user_id IS NULL OR user_id = $2)
        LIMIT 1
      `;
      const categoryResult = await pool.query(categoryQuery, [category_name.trim(), req.user.user_id]);
      
      if (categoryResult.rows.length === 0) {
        return res.status(400).json({
          error: `Category "${category_name}" not found`
        });
      }
      finalCategoryId = categoryResult.rows[0].category_id;
    }

    const updateData = {
      category_id: finalCategoryId,
      amount: amount ? parseFloat(amount) : undefined,
      type,
      date: date, // Keep provided date
      note
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedTransaction = await Transaction.update(transactionId, updateData);
    
    res.json({
      message: 'Transaction updated successfully',
      transaction: updatedTransaction
    });

  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Server error while updating transaction' });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;
    
    // Check if transaction belongs to user
    const belongsToUser = await Transaction.belongsToUser(transactionId, req.user.user_id);
    if (!belongsToUser) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await Transaction.delete(transactionId);
    
    res.json({ 
      message: 'Transaction deleted successfully',
      deleted_id: transactionId 
    });

  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Server error while deleting transaction' });
  }
});

export default router;