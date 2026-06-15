require('dotenv').config();
const mysql = require('mysql2/promise');

async function createDailyLogTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fittrackbd',
  });

  try {
    console.log('Creating daily_food_logs table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS daily_food_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        date DATE NOT NULL,
        meal VARCHAR(50) NOT NULL,
        food_name VARCHAR(255) NOT NULL,
        quantity FLOAT NOT NULL,
        unit VARCHAR(50) NOT NULL,
        calories INT NOT NULL,
        protein_g FLOAT NOT NULL,
        carbs_g FLOAT NOT NULL,
        fat_g FLOAT NOT NULL,
        time VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('daily_food_logs table created successfully.');

    console.log('Creating daily_exercise_logs table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS daily_exercise_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        date DATE NOT NULL,
        exercise_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NULL,
        met FLOAT NULL,
        duration_minutes INT NOT NULL,
        calories_burned INT NOT NULL,
        time VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('daily_exercise_logs table created successfully.');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await connection.end();
  }
}

createDailyLogTables();
