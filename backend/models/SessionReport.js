import { pool } from '../config/db.js';

export const initSessionReportTable = async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS session_report (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        study_material_id VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        summary TEXT,
        session_by_user_id VARCHAR(255) NOT NULL,
        session_by_username VARCHAR(255),
        status VARCHAR(50),
        started_at DATETIME,
        ends_at DATETIME,
        exp_gained INT DEFAULT 0,
        coins_gained INT DEFAULT 0,
        game_mode VARCHAR(50),
        correct_count INT DEFAULT 0,
        incorrect_count INT DEFAULT 0,
        highest_streak INT DEFAULT 0,
        time_spent VARCHAR(10),
        total_time VARCHAR(10),
        mastered INT DEFAULT 0,
        unmastered INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (study_material_id),
        INDEX (session_by_user_id),
        INDEX (game_mode)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await pool.query(createTableQuery);
    console.log('Session report table verified/created successfully');
  } catch (error) {
    console.error('Error initializing session report table:', error);
    throw error;
  }
}; 