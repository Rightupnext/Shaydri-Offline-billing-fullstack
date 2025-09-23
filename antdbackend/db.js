const mysql = require('mysql2/promise');

const masterConnection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: true,
});

// Test connection on startup
(async () => {
  try {
    const connection = await masterConnection.getConnection();
    console.log(`✅ Connected to MySQL ${process.env.DB_NAME} database successfully.`);
    connection.release(); // important to release the connection back to the pool
  } catch (err) {
    console.error('❌ Failed to connect to MySQL database:', err.message);
  }
})();

module.exports = masterConnection;
