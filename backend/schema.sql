-- Create the database
CREATE DATABASE IF NOT EXISTS cultural_heritage;
USE cultural_heritage;

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create models table
CREATE TABLE IF NOT EXISTS models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  folder_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  file_type ENUM('obj', 'ply', 'stl') NOT NULL,
  file_size INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Insert sample data
INSERT INTO folders (name) VALUES 
  ('Greek Artifacts'),
  ('Roman Sculptures'),
  ('Egyptian Collection');
