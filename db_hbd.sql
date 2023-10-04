CREATE DATABASE db_hbd;
USE db_hbd;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  birthday DATE,
  email VARCHAR(255),
  location VARCHAR(255)
);

CREATE TABLE pending_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  message TEXT,
  sent BOOLEAN DEFAULT 0,
  FOREIGN KEY (userId) REFERENCES users(id)
);
