import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

// Render PostgreSQL configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function dbConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ Database connected successfully to Render PostgreSQL");
    
    const result = await client.query('SELECT version()');
    console.log("📊 PostgreSQL Version:", result.rows[0].version);
    
    client.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
}

export { dbConnection, pool };