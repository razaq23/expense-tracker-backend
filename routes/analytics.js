import express from 'express';
import Analytics from '../models/Analytics.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// ALL Routes are protected
router.use(auth);

// Helper function to validate and parse dates
const parseDateRange = (req) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  
  
  const fromDate = req.query.from || '2020-01-01'; // Or whenever your app started
  const toDate = req.query.to || `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
  
  console.log('📅 Date range:', { fromDate, toDate });
  
  return { fromDate, toDate };
};


// @route   GET /api/analytics/overview
// @desc    Get comprehensive financial overview
// @access  Private
router.get('/overview', async (req, res) => {
  try {
    const { fromDate, toDate } = parseDateRange(req);
    
    const overview = await Analytics.getOverview(req.user.user_id, fromDate, toDate);
    const categoryBreakdown = await Analytics.getCategoryBreakdown(req.user.user_id, fromDate, toDate);

    res.json({
      success: true,
      period: {
        from: fromDate,
        to: toDate
      },
      overview,
      category_breakdown: categoryBreakdown,
      message: `Financial overview for ${fromDate} to ${toDate}`
    });

  } catch (error) {
    console.error('Overview analytics error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate financial overview' 
    });
  }
});

// @route   GET /api/analytics/categories
// @desc    Get detailed category analysis
// @access  Private
router.get('/categories', async (req, res) => {
  try {
    const { fromDate, toDate } = parseDateRange(req);
    
    const categoryBreakdown = await Analytics.getCategoryBreakdown(req.user.user_id, fromDate, toDate);
    
    // Calculate top categories
    const expenseCategories = categoryBreakdown.filter(c => c.type === 'expense');
    const incomeCategories = categoryBreakdown.filter(c => c.type === 'income');

    res.json({
      success: true,
      period: {
        from: fromDate,
        to: toDate
      },
      expense_categories: expenseCategories,
      income_categories: incomeCategories,
      top_spending_category: expenseCategories[0] || null,
      top_income_category: incomeCategories[0] || null,
      total_categories: categoryBreakdown.length
    });

  } catch (error) {
    console.error('Category analytics error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate category analysis' 
    });
  }
});

// @route   GET /api/analytics/trends
// @desc    Get spending trends over time
// @access  Private
router.get('/trends', async (req, res) => {
  try {
    const period = req.query.period || 'monthly'; // daily, weekly, monthly
    const months = parseInt(req.query.months) || 6;
    
    const trends = await Analytics.getSpendingTrends(req.user.user_id, period, months);

    res.json({
      success: true,
      period,
      months,
      trends,
      message: `Spending trends for last ${months} ${period} periods`
    });

  } catch (error) {
    console.error('Trends analytics error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate spending trends' 
    });
  }
});

// @route   GET /api/analytics/insights
// @desc    Get smart financial insights and recommendations
// @access  Private
router.get('/insights', async (req, res) => {
  try {
    const { fromDate, toDate } = parseDateRange(req);
    
    const insights = await Analytics.getFinancialInsights(req.user.user_id, fromDate, toDate);
    const overview = await Analytics.getOverview(req.user.user_id, fromDate, toDate);

    res.json({
      success: true,
      period: {
        from: fromDate,
        to: toDate
      },
      overview,
      insights: insights.insights,
      key_metrics: {
        highest_spending_category: insights.highest_spending_category,
        average_daily_spending: insights.average_daily_spending,
        financial_health: insights.financial_health
      },
      message: 'Smart financial insights generated'
    });

  } catch (error) {
    console.error('Insights analytics error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate financial insights' 
    });
  }
});

// @route   GET /api/analytics/health-score
// @desc    Get financial health score and recommendations
// @access  Private
router.get('/health-score', async (req, res) => {
  try {
    const { fromDate, toDate } = parseDateRange(req);
    
    const overview = await Analytics.getOverview(req.user.user_id, fromDate, toDate);
    const healthScore = Analytics.calculateHealthScore(overview.savings_rate);

    // Generate recommendations based on health score
    let recommendations = [];
    
    if (overview.savings_rate < 20) {
      recommendations = [
        "Consider tracking your daily expenses more closely",
        "Look for areas where you can reduce discretionary spending",
        "Set up automatic transfers to savings account"
      ];
    } else {
      recommendations = [
        "Great job maintaining healthy savings!",
        "Consider investing your surplus savings",
        "Review your financial goals and adjust if needed"
      ];
    }

    res.json({
      success: true,
      period: {
        from: fromDate,
        to: toDate
      },
      health_score: healthScore,
      savings_rate: overview.savings_rate,
      recommendations,
      overview,
      message: `Your financial health score: ${healthScore}`
    });

  } catch (error) {
    console.error('Health score analytics error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to calculate health score' 
    });
  }
});

export default router;