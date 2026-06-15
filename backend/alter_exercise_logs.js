require('dotenv').config();
const mysql = require('mysql2/promise');

async function recreateExerciseLogTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fittrackbd',
  });

  try {
    console.log('Dropping old daily_exercise_logs table...');
    await connection.execute(`DROP TABLE IF EXISTS daily_exercise_logs`);
    
    console.log('Dropping existing exercise_logs table if any...');
    await connection.execute(`DROP TABLE IF EXISTS exercise_logs`);

    console.log('Creating exercise_logs table...');
    await connection.execute(`
      CREATE TABLE exercise_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        exercise_id INT NOT NULL,
        exercise_name VARCHAR(255) NOT NULL,
        met FLOAT NOT NULL,
        duration_minutes INT NOT NULL,
        calories_burned INT NOT NULL,
        logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('exercise_logs table created successfully.');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await connection.end();
  }
}

recreateExerciseLogTable();
