import express from 'express';
import Transaction from '../models/Transactionda.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

// @route   GET /api/reports/monthly
// @desc    Get monthly summary and category-wise spending
// @access  Private
router.get('/monthly', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    
    const summary = await Transaction.getMonthlySummary(req.user.user_id, year, month);
    const categorySpending = await Transaction.getCategoryWiseSpending(req.user.user_id, year, month);
    
    // Calculate totals
    const income = summary.find(item => item.type === 'income')?.total || 0;
    const expense = summary.find(item => item.type === 'expense')?.total || 0;
    const balance = income - expense;

    res.json({
      summary: {
        income: parseFloat(income),
        expense: parseFloat(expense),
        balance: parseFloat(balance)
      },
      categorySpending,
      period: { year: parseInt(year), month: parseInt(month) }
    });

  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ error: 'Server error while generating reports' });
  }
});

export default router;