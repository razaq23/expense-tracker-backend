import pool from '../config/database.js';

class Analytics {
  // Get comprehensive overview for a date range
  static async getOverview(userId, fromDate, toDate) {
    try {
      // Get total income, expenses, and savings
      const summaryQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
          COUNT(*) as transaction_count
        FROM transactions 
        WHERE user_id = $1 
          AND date BETWEEN $2 AND $3
      `;

      const summaryResult = await pool.query(summaryQuery, [userId, fromDate, toDate]);
      const summary = summaryResult.rows[0];
      
      // Calculate savings
      const savings = summary.total_income - summary.total_expense;
      const savingsRate = summary.total_income > 0 ? (savings / summary.total_income) * 100 : 0;

      return {
        total_income: parseFloat(summary.total_income),
        total_expense: parseFloat(summary.total_expense),
        savings: parseFloat(savings),
        savings_rate: parseFloat(savingsRate.toFixed(2)),
        transaction_count: parseInt(summary.transaction_count)
      };

    } catch (error) {
      console.error('Analytics overview error:', error);
      throw error;
    }
  }

  // Get category-wise spending breakdown
  static async getCategoryBreakdown(userId, fromDate, toDate) {
    try {
      const query = `
        SELECT 
          c.category_name,
          c.type,
          COALESCE(SUM(t.amount), 0) as total_amount,
          COUNT(t.transaction_id) as transaction_count
        FROM categories c
        LEFT JOIN transactions t ON c.category_id = t.category_id 
          AND t.user_id = $1 
          AND t.date BETWEEN $2 AND $3
        WHERE c.user_id IS NULL OR c.user_id = $1
        GROUP BY c.category_id, c.category_name, c.type
        HAVING COALESCE(SUM(t.amount), 0) > 0
        ORDER BY total_amount DESC
      `;

      const result = await pool.query(query, [userId, fromDate, toDate]);
      
      // Calculate percentages
      const expenseTotalQuery = `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE user_id = $1 AND type = 'expense' AND date BETWEEN $2 AND $3
      `;
      const expenseTotalResult = await pool.query(expenseTotalQuery, [userId, fromDate, toDate]);
      const totalExpenses = parseFloat(expenseTotalResult.rows[0].total);

      const categories = result.rows.map(category => {
        const percentage = totalExpenses > 0 && category.type === 'expense' 
          ? (category.total_amount / totalExpenses) * 100 
          : 0;
        
        return {
          category_name: category.category_name,
          type: category.type,
          total_amount: parseFloat(category.total_amount),
          transaction_count: parseInt(category.transaction_count),
          percentage: parseFloat(percentage.toFixed(2))
        };
      });

      return categories;

    } catch (error) {
      console.error('Category breakdown error:', error);
      throw error;
    }
  }

  // Get spending trends (daily/weekly/monthly)
  static async getSpendingTrends(userId, period = 'monthly', months = 6) {
    try {
      let groupBy, dateFormat, interval;
      
      switch (period) {
        case 'daily':
          groupBy = 'DATE(t.date)';
          dateFormat = 'YYYY-MM-DD';
          interval = `${months * 30} days`;
          break;
        case 'weekly':
          groupBy = 'DATE_TRUNC(\'week\', t.date)';
          dateFormat = 'YYYY-"W"WW';
          interval = `${months * 4} weeks`;
          break;
        case 'monthly':
        default:
          groupBy = 'DATE_TRUNC(\'month\', t.date)';
          dateFormat = 'YYYY-MM';
          interval = `${months} months`;
      }

      const query = `
        SELECT 
          TO_CHAR(${groupBy}, $1) as period,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
          COUNT(*) as transaction_count
        FROM transactions t
        WHERE user_id = $2 
          AND t.date >= CURRENT_DATE - INTERVAL '${interval}'
        GROUP BY ${groupBy}
        ORDER BY ${groupBy} ASC
      `;

      const result = await pool.query(query, [dateFormat, userId]);
      
      return result.rows.map(row => ({
        period: row.period,
        income: parseFloat(row.income),
        expense: parseFloat(row.expense),
        savings: parseFloat(row.income - row.expense),
        transaction_count: parseInt(row.transaction_count)
      }));

    } catch (error) {
      console.error('Spending trends error:', error);
      throw error;
    }
  }

  // Get financial insights and recommendations
  static async getFinancialInsights(userId, fromDate, toDate) {
    try {
      const overview = await this.getOverview(userId, fromDate, toDate);
      const categories = await this.getCategoryBreakdown(userId, fromDate, toDate);

      // Analyze spending patterns
      const expenseCategories = categories.filter(c => c.type === 'expense');
      const highestSpending = expenseCategories[0] || null;
      const totalExpenses = overview.total_expense;

      // Generate insights
      const insights = [];

      // Savings rate insight
      if (overview.savings_rate >= 30) {
        insights.push({
          type: 'positive',
          title: 'Excellent Savings!',
          message: `Your savings rate is ${overview.savings_rate}% - keep it up! 🎉`
        });
      } else if (overview.savings_rate <= 10) {
        insights.push({
          type: 'warning', 
          title: 'Low Savings Rate',
          message: `Your savings rate is ${overview.savings_rate}%. Consider reducing expenses.`
        });
      }

      // Highest spending category insight
      if (highestSpending && highestSpending.percentage > 40) {
        insights.push({
          type: 'info',
          title: 'High Spending Concentration',
          message: `You're spending ${highestSpending.percentage}% of your expenses on ${highestSpending.category_name}.`
        });
      }

      // Transaction frequency insight
      const avgDailyTransactions = overview.transaction_count / 30; // Rough estimate
      if (avgDailyTransactions > 3) {
        insights.push({
          type: 'info',
          title: 'Frequent Transactions',
          message: `You're making ${overview.transaction_count} transactions this period.`
        });
      }

      return {
        insights,
        highest_spending_category: highestSpending?.category_name || 'No expenses',
        average_daily_spending: totalExpenses > 0 ? (totalExpenses / 30).toFixed(2) : 0,
        financial_health: this.calculateHealthScore(overview.savings_rate)
      };

    } catch (error) {
      console.error('Financial insights error:', error);
      throw error;
    }
  }

  // Calculate simple financial health score
  static calculateHealthScore(savingsRate) {
    if (savingsRate >= 30) return 'A - Excellent';
    if (savingsRate >= 20) return 'B - Good';
    if (savingsRate >= 10) return 'C - Average';
    if (savingsRate > 0) return 'D - Needs Improvement';
    return 'F - Critical';
  }
}

export default Analytics;