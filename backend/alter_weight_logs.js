require('dotenv').config();
const mysql = require('mysql2/promise');

async function createWeightLogsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fittrackbd',
  });

  try {
    console.log('Creating weight_logs table...');
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS weight_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        weight_kg DECIMAL(5,2) NOT NULL,
        recorded_at DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_date (user_id, recorded_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;
    await connection.execute(createTableQuery);
    console.log('weight_logs table created successfully!');
  } catch (error) {
    console.error('Error creating weight_logs table:', error);
  } finally {
    await connection.end();
  }
}

createWeightLogsTable();
