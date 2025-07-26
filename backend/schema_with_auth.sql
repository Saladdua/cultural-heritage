-- Create the database
CREATE DATABASE IF NOT EXISTS cultural_heritage;
USE cultural_heritage;

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  organization VARCHAR(100),
  role ENUM('researcher', 'curator', 'student', 'admin') DEFAULT 'researcher',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create user_databases table to track each user's database
CREATE TABLE IF NOT EXISTS user_databases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  database_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_db (user_id, database_name)
);

-- Create sessions table for user sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create folders table (now user-specific)
CREATE TABLE IF NOT EXISTS folders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_folders (user_id)
);

-- Create models table (now user-specific)
CREATE TABLE IF NOT EXISTS models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  folder_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(512) NOT NULL,
  file_type ENUM('obj', 'ply', 'stl', 'glb', 'gltf') NOT NULL,
  file_size INT NOT NULL,
  triangle_count INT DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
  INDEX idx_user_models (user_id),
  INDEX idx_folder_models (folder_id)
);

-- Create model_metadata table for additional 3D model information
CREATE TABLE IF NOT EXISTS model_metadata (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_id INT NOT NULL,
  artifact_type VARCHAR(100),
  period VARCHAR(100),
  culture VARCHAR(100),
  material VARCHAR(100),
  dimensions_x DECIMAL(10,3),
  dimensions_y DECIMAL(10,3),
  dimensions_z DECIMAL(10,3),
  acquisition_method ENUM('photogrammetry', '3d_scanning', 'manual_modeling', 'other'),
  notes TEXT,
  FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
);

-- Create user_activity_log table for tracking user actions
CREATE TABLE IF NOT EXISTS user_activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INT,
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_activity (user_id, created_at)
);

-- Insert sample users
INSERT INTO users (username, email, password_hash, first_name, last_name, organization, role) VALUES 
  ('admin', 'admin@heritage.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZp/k/K', 'Admin', 'User', 'Heritage Institute', 'admin'),
  ('researcher1', 'researcher@heritage.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZp/k/K', 'John', 'Smith', 'University Museum', 'researcher'),
  ('curator1', 'curator@heritage.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZp/k/K', 'Jane', 'Doe', 'National Gallery', 'curator');
