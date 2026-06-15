-- FitTrackBD Database Initialization
-- Run this script in MySQL to create the database and users table

CREATE DATABASE IF NOT EXISTS fittrackbd;
USE fittrackbd;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  provider VARCHAR(50) DEFAULT 'local',
  provider_id VARCHAR(255) NULL,
  age INT NULL,
  gender VARCHAR(10) NULL,
  height_cm FLOAT NULL,
  weight_kg FLOAT NULL,
  goal VARCHAR(20) NULL,
  daily_calorie_target INT NULL,
  activity_level VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_food_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  meal VARCHAR(20) NOT NULL,
  food_name VARCHAR(255) NOT NULL,
  quantity FLOAT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  calories INT NOT NULL,
  protein_g FLOAT NOT NULL,
  carbs_g FLOAT NOT NULL,
  fat_g FLOAT NOT NULL,
  time VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS weight_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  weight_kg FLOAT NOT NULL,
  recorded_at DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_date (user_id, recorded_at)
);

CREATE TABLE IF NOT EXISTS exercise_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  exercise_id INT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  met FLOAT NULL,
  duration_minutes INT NOT NULL,
  calories_burned INT NOT NULL,
  logged_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

