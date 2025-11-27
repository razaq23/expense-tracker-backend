import {pool} from '../config/database.js';

class Category {
  // Get all categories for a user (default categories + user's custom categories)
  static async getUserCategories(userId) {
    try {
      const query = `
        SELECT 
          category_id, 
          category_name, 
          type,
          CASE 
            WHEN user_id IS NULL THEN 'default' 
            ELSE 'custom' 
          END as category_type
        FROM categories 
        WHERE user_id = $1 OR user_id IS NULL
        ORDER BY type, category_name
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows;
      
    } catch (error) {
      console.error('Error getting user categories:', error);
      throw error;
    }
  }

  // Find a category by its name (for the hybrid approach)
  static async findByName(categoryName, userId) {
    try {
      const query = `
        SELECT category_id, category_name, type
        FROM categories 
        WHERE LOWER(category_name) = LOWER($1) 
          AND (user_id = $2 OR user_id IS NULL)
        LIMIT 1
      `;
      
      const result = await pool.query(query, [categoryName, userId]);
      
      if (result.rows.length === 0) {
        return null; // Category not found
      }
      
      return result.rows[0];
      
    } catch (error) {
      console.error('Error finding category by name:', error);
      throw error;
    }
  }

  // Create a new custom category
  static async createCustomCategory(userId, categoryName, type) {
    try {
      // Check if category already exists
      const existingCategory = await this.findByName(categoryName, userId);
      if (existingCategory) {
        throw new Error('You already have a category with this name');
      }

      const query = `
        INSERT INTO categories (user_id, category_name, type) 
        VALUES ($1, $2, $3) 
        RETURNING category_id, category_name, type
      `;
      
      const result = await pool.query(query, [userId, categoryName, type]);
      return result.rows[0];
      
    } catch (error) {
      console.error('Error creating custom category:', error);
      throw error;
    }
  }

  // Get category usage count (how many transactions use this category)
  static async getCategoryUsage(categoryId, userId) {
    try {
      const query = `
        SELECT COUNT(*) as usage_count
        FROM transactions 
        WHERE category_id = $1 AND user_id = $2
      `;
      
      const result = await pool.query(query, [categoryId, userId]);
      return parseInt(result.rows[0].usage_count);
      
    } catch (error) {
      console.error('Error getting category usage:', error);
      throw error;
    }
  }

  // Delete a custom category (only if not used in transactions)
  static async deleteCustomCategory(categoryId, userId) {
    try {
      // Check if category is being used
      const usageCount = await this.getCategoryUsage(categoryId, userId);
      if (usageCount > 0) {
        throw new Error(`Cannot delete category. It is used in ${usageCount} transaction(s).`);
      }

      const query = `
        DELETE FROM categories 
        WHERE category_id = $1 AND user_id = $2
      `;
      
      await pool.query(query, [categoryId, userId]);
      return true;
      
    } catch (error) {
      console.error('Error deleting custom category:', error);
      throw error;
    }
  }
}

export default Category;