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

CREATE TABLE IF NOT EXISTS awards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  requirement_type VARCHAR(50),
  requirement_value INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO awards (name, description, icon, requirement_type, requirement_value) VALUES
  ('First Step', 'Logged weight for the first time.', 'Scale', 'WEIGHT_LOG', 1),
  ('Consistent Weigher', 'Logged weight for 7 consecutive days.', 'Flame', 'WEIGHT_STREAK', 7),
  ('Weight Tracker Silver', 'Logged weight 14 times.', 'Scale', 'WEIGHT_LOG', 14),
  ('Weight Tracker Gold', 'Logged weight 30 times.', 'Scale', 'WEIGHT_LOG', 30),
  ('Weight Tracker Platinum', 'Logged weight 60 times.', 'Award', 'WEIGHT_LOG', 60),
  ('Weight Tracker Diamond', 'Logged weight 100 times.', 'Trophy', 'WEIGHT_LOG', 100),
  ('Streak Master Bronze', 'Maintained a 14-day weight streak.', 'Flame', 'WEIGHT_STREAK', 14),
  ('Streak Master Silver', 'Maintained a 30-day weight streak.', 'Flame', 'WEIGHT_STREAK', 30),
  ('Streak Master Gold', 'Maintained a 60-day weight streak.', 'Flame', 'WEIGHT_STREAK', 60),
  ('Streak Master Platinum', 'Maintained a 100-day weight streak.', 'Zap', 'WEIGHT_STREAK', 100),

  ('First Meal', 'Logged food for the first time.', 'Utensils', 'MEAL_LOG', 1),
  ('Foodie Bronze', 'Logged 10 meals.', 'Utensils', 'MEAL_LOG', 10),
  ('Foodie Silver', 'Logged 50 meals.', 'Utensils', 'MEAL_LOG', 50),
  ('Foodie Gold', 'Logged 100 meals.', 'Utensils', 'MEAL_LOG', 100),
  ('Foodie Platinum', 'Logged 365 meals.', 'Star', 'MEAL_LOG', 365),
  ('Diet Streak Bronze', 'Logged food for 7 consecutive days.', 'Flame', 'MEAL_STREAK', 7),
  ('Diet Streak Silver', 'Logged food for 14 consecutive days.', 'Flame', 'MEAL_STREAK', 14),
  ('Diet Streak Gold', 'Logged food for 30 consecutive days.', 'Flame', 'MEAL_STREAK', 30),
  ('Diet Streak Platinum', 'Logged food for 60 consecutive days.', 'Zap', 'MEAL_STREAK', 60),

  ('Active Logger', 'Logged an exercise.', 'Dumbbell', 'EXERCISE_LOG', 1),
  ('Workout Bronze', 'Logged 10 workouts.', 'Dumbbell', 'EXERCISE_LOG', 10),
  ('Workout Silver', 'Logged 50 workouts.', 'Dumbbell', 'EXERCISE_LOG', 50),
  ('Workout Gold', 'Logged 100 workouts.', 'Dumbbell', 'EXERCISE_LOG', 100),
  ('Workout Platinum', 'Logged 365 workouts.', 'Star', 'EXERCISE_LOG', 365),
  ('Exercise Streak Bronze', 'Worked out for 7 consecutive days.', 'Flame', 'EXERCISE_STREAK', 7),
  ('Exercise Streak Silver', 'Worked out for 14 consecutive days.', 'Flame', 'EXERCISE_STREAK', 14),
  ('Exercise Streak Gold', 'Worked out for 30 consecutive days.', 'Flame', 'EXERCISE_STREAK', 30),

  ('Calorie Burner Bronze', 'Burned 1,000 total calories.', 'Activity', 'CALORIES_BURNED', 1000),
  ('Calorie Burner Silver', 'Burned 5,000 total calories.', 'Activity', 'CALORIES_BURNED', 5000),
  ('Calorie Burner Gold', 'Burned 10,000 total calories.', 'Activity', 'CALORIES_BURNED', 10000),
  ('Calorie Burner Platinum', 'Burned 50,000 total calories.', 'Zap', 'CALORIES_BURNED', 50000),
  ('Calorie Burner Diamond', 'Burned 100,000 total calories.', 'Trophy', 'CALORIES_BURNED', 100000),

  ('Nutritionist Bronze', 'Tracked 1,000 calories eaten.', 'Apple', 'CALORIES_TRACKED', 1000),
  ('Nutritionist Silver', 'Tracked 10,000 calories eaten.', 'Apple', 'CALORIES_TRACKED', 10000),
  ('Nutritionist Gold', 'Tracked 50,000 calories eaten.', 'Apple', 'CALORIES_TRACKED', 50000),
  ('Nutritionist Platinum', 'Tracked 100,000 calories eaten.', 'Star', 'CALORIES_TRACKED', 100000),
  ('Nutritionist Diamond', 'Tracked 500,000 calories eaten.', 'Trophy', 'CALORIES_TRACKED', 500000),

  ('Goal Setter', 'Set your first weight goal.', 'Target', 'FIRST_GOAL', 1),
  ('Profile Complete', 'Updated your profile info.', 'User', 'PROFILE_UPDATE', 1)
ON DUPLICATE KEY UPDATE requirement_value=VALUES(requirement_value), icon=VALUES(icon);

CREATE TABLE IF NOT EXISTS user_awards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  award_id INT NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (award_id) REFERENCES awards(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_award (user_id, award_id)
);

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
