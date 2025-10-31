import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

// Use Railway's DATABASE_URL environment variable
const connectionConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : {
      // Fallback to individual variables for local development
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

const pool = new Pool(connectionConfig);

async function dbConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ Database connected successfully");
    
    // Test query to verify tables exist
    const result = await client.query('SELECT NOW()');
    console.log("📊 Database time:", result.rows[0].now);
    
    client.release();
  } catch (error) {
    console.log("❌ Database not connected");
    console.error("Error message:", error.message);
    console.log("💡 Using DATABASE_URL:", !!process.env.DATABASE_URL);
  }
}

dbConnection();

export default pool;