import {pool} from '../config/database.js';
import bcrypt from 'bcryptjs';

class User {
  // Create new user
  static async create(userData) {
    const { name, email, password } = userData;
    
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (name, email, password) 
      VALUES ($1, $2, $3) 
      RETURNING user_id, name, email, created_at
    `;
    
    const result = await pool.query(query, [name, email, hashedPassword]);
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Find user by ID (without password)
  static async findById(userId) {
    const query = `
      SELECT user_id, name, email, created_at 
      FROM users 
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  // Compare password with hashed password
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

export default User;