CREATE TABLE IF NOT EXISTS battle_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid VARCHAR(255) NOT NULL,
    player_type ENUM('host', 'guest') NOT NULL,
    questions JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_session_player (session_uuid, player_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 