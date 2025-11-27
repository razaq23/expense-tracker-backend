import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

<<<<<<< HEAD
// Render PostgreSQL configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
=======
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
>>>>>>> bee3b2898842a652f07ad1a7b4cecc860c75af8c

async function dbConnection() {
  try {
    const client = await pool.connect();
<<<<<<< HEAD
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
=======
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
>>>>>>> bee3b2898842a652f07ad1a7b4cecc860c75af8c
