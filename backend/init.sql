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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
