const mysql = require('mysql2/promise');

const pools = {}; // 🔁 Reuse pools

module.exports = async function getUserDbConnection(dbName) {
  if (!pools[dbName]) {
    pools[dbName] = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      port:process.env.DB_PORT,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Optional: Test connection only once
    try {
      const conn = await pools[dbName].getConnection();
      console.log(`✅ Connected to tenant DB [${dbName}]`);
      conn.release();
    } catch (err) {
      console.error(`❌ Failed to connect to tenant DB [${dbName}]:`, err.message);
      throw err;
    }
  }

  return pools[dbName];
};
