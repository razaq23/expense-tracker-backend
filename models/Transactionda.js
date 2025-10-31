import pool from '../config/database.js';

class Transaction {
  // Create new transaction
  static async create(transactionData) {
    const { user_id, category_id, amount, type, date, note } = transactionData;
    
    const query = `
      INSERT INTO transactions (user_id, category_id, amount, type, date, note) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      user_id, category_id, amount, type, date, note
    ]);
    return result.rows[0];
  }

  // Get all transactions for a user with category names
  static async findByUserId(userId) {
    const query = `
      SELECT 
        t.transaction_id,
        t.amount,
        t.type,
        t.date,
        t.note,
        t.created_at,
        c.category_name,
        c.category_id
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = $1
      ORDER BY t.date DESC, t.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Get single transaction by ID
  static async findById(transactionId) {
    const query = `
      SELECT 
        t.*,
        c.category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.transaction_id = $1
    `;
    const result = await pool.query(query, [transactionId]);
    return result.rows[0];
  }

  // Update transaction
  static async update(transactionId, updateData) {
    const { category_id, amount, type, date, note } = updateData;
    
    const query = `
      UPDATE transactions 
      SET category_id = $1, amount = $2, type = $3, date = $4, note = $5
      WHERE transaction_id = $6 
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      category_id, amount, type, date, note, transactionId
    ]);
    return result.rows[0];
  }

  // Delete transaction
  static async delete(transactionId) {
    const query = 'DELETE FROM transactions WHERE transaction_id = $1';
    await pool.query(query, [transactionId]);
    return true;
  }

  // Verify transaction belongs to user
  static async belongsToUser(transactionId, userId) {
    const query = `
      SELECT transaction_id 
      FROM transactions 
      WHERE transaction_id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [transactionId, userId]);
    return result.rows.length > 0;
  }

  // Get monthly summary for dashboard
  static async getMonthlySummary(userId, year, month) {
    const query = `
      SELECT 
        type,
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions 
      WHERE user_id = $1 
        AND EXTRACT(YEAR FROM date) = $2 
        AND EXTRACT(MONTH FROM date) = $3
      GROUP BY type
    `;
    
    const result = await pool.query(query, [userId, year, month]);
    return result.rows;
  }

  // Get category-wise spending
  static async getCategoryWiseSpending(userId, year, month) {
    const query = `
      SELECT 
        c.category_name,
        SUM(t.amount) as total,
        COUNT(*) as count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = $1 
        AND t.type = 'expense'
        AND EXTRACT(YEAR FROM t.date) = $2 
        AND EXTRACT(MONTH FROM t.date) = $3
      GROUP BY c.category_name
      ORDER BY total DESC
    `;
    
    const result = await pool.query(query, [userId, year, month]);
    return result.rows;
  }
}

export default Transaction;