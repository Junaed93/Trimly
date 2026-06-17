const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fittrackbd',
  });

  try {
    // Create awards table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS awards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        requirement_type VARCHAR(50),
        requirement_value INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created awards table.');

    // Insert default awards
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM awards');
    if (rows[0].count === 0) {
      await connection.query(`
        INSERT INTO awards (name, description, icon, requirement_type, requirement_value) VALUES
        ('First Step', 'Logged weight for the first time.', 'scale', 'WEIGHT_LOG', 1),
        ('Consistent Weigher', 'Logged weight for 7 consecutive days.', 'flame', 'WEIGHT_STREAK', 7),
        ('First Meal', 'Logged food for the first time.', 'restaurant', 'MEAL_LOG', 1),
        ('Active Logger', 'Logged an exercise.', 'barbell', 'EXERCISE_LOG', 1);
      `);
      console.log('Inserted default awards.');
    }

    // Create user_awards table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_awards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        award_id INT NOT NULL,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (award_id) REFERENCES awards(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_award (user_id, award_id)
      );
    `);
    console.log('Created user_awards table.');

    // Create notifications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('Created notifications table.');

  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    await connection.end();
  }
}

run();
