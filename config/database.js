import pkg from "pg";
import dotenv from "dotenv";


dotenv.config();

const {Pool} = pkg;

const pool = new Pool({
  user : process.env.DB_USER,
  host : process.env.DB_HOST,
  database : process.env.DB_NAME,
  password : process.env.DB_PASSWORD,
  port : process.env.DB_PORT,
});

async function dbConnection(){
  try{
    const client = await pool.connect();
    console.log("database conneted successfully");
    client.release();
  }
  catch(error){
    console.log("database not conneted");
    console.error("error meassage",error.message);
  }
}

dbConnection();

export default pool;