import { pool } from '../config/db.js';

// Create the lobbies table if it doesn't exist
export const createLobbyTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pvp_lobbies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lobby_code VARCHAR(10) NOT NULL UNIQUE,
        host_id VARCHAR(100) NOT NULL,
        host_username VARCHAR(50) NOT NULL,
        host_level INT DEFAULT 1,
        host_picture VARCHAR(255),
        guest_id VARCHAR(100),
        guest_username VARCHAR(50),
        guest_level INT,
        guest_picture VARCHAR(255),
        status ENUM('waiting', 'ready', 'in_progress', 'completed', 'abandoned') DEFAULT 'waiting',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP NULL,
        ended_at TIMESTAMP NULL,
        settings JSON NOT NULL,
        host_ready BOOLEAN DEFAULT FALSE,
        guest_ready BOOLEAN DEFAULT FALSE,
        winner_id VARCHAR(100),
        INDEX (lobby_code),
        INDEX (host_id),
        INDEX (guest_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('PvP Lobbies table created or already exists');
  } catch (error) {
    console.error('Error creating PvP Lobbies table:', error);
    throw error;
  }
};

// Create a new lobby
export const createLobby = async (lobbyData) => {
  try {
    const query = `
      INSERT INTO pvp_lobbies (
        lobby_code, host_id, host_username, host_level, host_picture, 
        status, settings
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const settingsJson = JSON.stringify(lobbyData.settings || {});
    
    const values = [
      lobbyData.lobby_code,
      lobbyData.host_id,
      lobbyData.host_username,
      lobbyData.host_level || 1,
      lobbyData.host_picture,
      lobbyData.status || 'waiting',
      settingsJson
    ];
    
    const [result] = await pool.query(query, values);
    return { id: result.insertId, ...lobbyData };
  } catch (error) {
    console.error('Error creating lobby:', error);
    throw error;
  }
};

// Get lobby by code
export const getLobbyByCode = async (lobbyCode) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM pvp_lobbies WHERE lobby_code = ?',
      [lobbyCode]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    // Parse the settings JSON
    const lobby = rows[0];
    try {
      lobby.settings = typeof lobby.settings === 'string' 
        ? JSON.parse(lobby.settings)
        : lobby.settings || {};
    } catch (e) {
      console.error('Error parsing lobby settings:', e);
      lobby.settings = {};
    }
    
    return lobby;
  } catch (error) {
    console.error('Error getting lobby by code:', error);
    throw error;
  }
};

// Update lobby settings
export const updateLobbySettings = async (lobbyCode, settings) => {
  try {
    const [existingLobby] = await pool.query(
      'SELECT settings FROM pvp_lobbies WHERE lobby_code = ?',
      [lobbyCode]
    );
    
    if (existingLobby.length === 0) {
      throw new Error('Lobby not found');
    }
    
    // Merge existing settings with new settings
    let currentSettings = {};
    try {
      currentSettings = JSON.parse(existingLobby[0].settings);
    } catch (e) {
      // If parsing fails, use empty object
    }
    
    const updatedSettings = { ...currentSettings, ...settings };
    
    await pool.query(
      'UPDATE pvp_lobbies SET settings = ? WHERE lobby_code = ?',
      [JSON.stringify(updatedSettings), lobbyCode]
    );
    
    return updatedSettings;
  } catch (error) {
    console.error('Error updating lobby settings:', error);
    throw error;
  }
};

// Add guest to lobby
export const joinLobby = async (lobbyCode, guestData) => {
  try {
    const query = `
      UPDATE pvp_lobbies 
      SET guest_id = ?, 
          guest_username = ?, 
          guest_level = ?, 
          guest_picture = ?
      WHERE lobby_code = ? AND status = 'waiting'
    `;
    
    const values = [
      guestData.player_id,
      guestData.player_username,
      guestData.player_level || 1,
      guestData.player_picture,
      lobbyCode
    ];
    
    const [result] = await pool.query(query, values);
    
    if (result.affectedRows === 0) {
      throw new Error('Lobby not found or not in waiting status');
    }
    
    return await getLobbyByCode(lobbyCode);
  } catch (error) {
    console.error('Error joining lobby:', error);
    throw error;
  }
};

// Update lobby status
export const updateLobbyStatus = async (lobbyCode, status) => {
  try {
    let additionalFields = {};
    
    if (status === 'in_progress') {
      additionalFields.started_at = 'NOW()';
    } else if (status === 'completed' || status === 'abandoned') {
      additionalFields.ended_at = 'NOW()';
    }
    
    let query = 'UPDATE pvp_lobbies SET status = ?';
    const values = [status];
    
    // Add any additional timestamp fields
    Object.entries(additionalFields).forEach(([field, value]) => {
      query += `, ${field} = ${value}`;
    });
    
    query += ' WHERE lobby_code = ?';
    values.push(lobbyCode);
    
    const [result] = await pool.query(query, values);
    
    if (result.affectedRows === 0) {
      throw new Error('Lobby not found');
    }
    
    return await getLobbyByCode(lobbyCode);
  } catch (error) {
    console.error('Error updating lobby status:', error);
    throw error;
  }
};

// Set player ready status
export const setPlayerReady = async (lobbyCode, playerId, isReady) => {
  try {
    // First determine if player is host or guest
    const [lobby] = await pool.query(
      'SELECT host_id, guest_id FROM pvp_lobbies WHERE lobby_code = ?',
      [lobbyCode]
    );
    
    if (lobby.length === 0) {
      throw new Error('Lobby not found');
    }
    
    const isHost = playerId === lobby[0].host_id;
    const isGuest = playerId === lobby[0].guest_id;
    
    if (!isHost && !isGuest) {
      throw new Error('Player is not part of this lobby');
    }
    
    const field = isHost ? 'host_ready' : 'guest_ready';
    
    await pool.query(
      `UPDATE pvp_lobbies SET ${field} = ? WHERE lobby_code = ?`,
      [isReady, lobbyCode]
    );
    
    return await getLobbyByCode(lobbyCode);
  } catch (error) {
    console.error('Error setting player ready status:', error);
    throw error;
  }
};

// Initialize the table when module is loaded
createLobbyTable().catch(console.error); 