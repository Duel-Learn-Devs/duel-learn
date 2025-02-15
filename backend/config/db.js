const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // Increase the connection timeout to 10 seconds
});

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL Database Connected!");
    connection.release(); // Release the connection back to the pool
  } catch (error) {
    console.error(`❌ Database Connection Failed: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = { pool, connectDB };
