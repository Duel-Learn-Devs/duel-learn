import { pool } from "../config/db.js";
import * as LobbyModel from '../models/LobbyModel.js';

export const getFriendsList = async (req, res) => {
  const { firebase_uid } = req.params;

  if (!firebase_uid) {
    return res.status(400).json({
      success: false,
      message: "firebase_uid is required"
    });
  }

  try {
    // Test database connection
    await pool.getConnection();

    // Get friends through accepted friend requests and join with user_info
    const query = `
            SELECT DISTINCT
                u.firebase_uid,
                u.username,
                ui.level,
                ui.exp,
                ui.mana,
                ui.coins,
                u.display_picture
            FROM users u
            LEFT JOIN user_info ui ON u.firebase_uid = ui.firebase_uid
            INNER JOIN friend_requests fr ON 
                (fr.sender_id = ? AND fr.receiver_id = u.firebase_uid) OR 
                (fr.receiver_id = ? AND fr.sender_id = u.firebase_uid)
            WHERE fr.status = 'accepted'
        `;

    const [friends] = await pool.query(query, [firebase_uid, firebase_uid]);
    console.log("Query results:", friends);

    // Format the response using actual level from user_info
    const formattedFriends = friends.map(friend => ({
      firebase_uid: friend.firebase_uid,
      username: friend.username,
      level: friend.level || 1,
      display_picture: friend.display_picture || null
    }));

    return res.status(200).json({
      success: true,
      data: formattedFriends
    });

  } catch (error) {
    // More detailed error logging
    console.error("Error in getFriendsList:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Request params:", req.params);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Create a new lobby
export const createLobby = async (req, res) => {
  try {
    const lobbyData = req.body;

    // Validate the required fields
    if (!lobbyData.lobby_code || !lobbyData.host_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: lobby_code and host_id are required'
      });
    }

    // Create the lobby
    const result = await LobbyModel.createLobby(lobbyData);

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in createLobby controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lobby',
      error: error.message
    });
  }
};

// Validate lobby code
export const validateLobby = async (req, res) => {
  try {
    const { lobbyCode } = req.params;

    console.log("Validating lobby code:", lobbyCode);

    const lobby = await LobbyModel.getLobbyByCode(lobbyCode);

    if (!lobby) {
      console.log("Lobby not found:", lobbyCode);
      return res.status(404).json({
        success: false,
        exists: false,
        message: 'Lobby not found'
      });
    }

    // Check if lobby is in a valid state to join
    if (lobby.status !== 'waiting') {
      console.log(`Lobby ${lobbyCode} is ${lobby.status}, not accepting new players`);
      return res.status(400).json({
        success: false,
        exists: true,
        message: `Lobby is ${lobby.status}, not accepting new players`
      });
    }

    // Check if lobby already has a guest
    if (lobby.guest_id) {
      console.log(`Lobby ${lobbyCode} is already full`);
      return res.status(400).json({
        success: false,
        exists: true,
        message: 'Lobby is already full'
      });
    }

    console.log("Lobby validation successful:", lobbyCode);
    res.json({
      success: true,
      exists: true,
      data: {
        lobbyCode: lobby.lobby_code,
        hostId: lobby.host_id,
        hostUsername: lobby.host_username,
        status: lobby.status,
        settings: lobby.settings
      }
    });
  } catch (error) {
    console.error('Error in validateLobby controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate lobby',
      error: error.message
    });
  }
};

// Join a lobby
export const joinLobby = async (req, res) => {
  try {
    const { lobby_code, player_id, player_username, player_level, player_picture } = req.body;

    console.log("Joining lobby with data:", req.body);

    // Validate the required fields
    if (!lobby_code || !player_id || !player_username) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if lobby exists and is in waiting state
    const [existingLobby] = await pool.query(
      `SELECT l.*, 
              JSON_UNQUOTE(JSON_EXTRACT(l.settings, '$.question_types')) as question_types,
              JSON_UNQUOTE(JSON_EXTRACT(l.settings, '$.study_material_title')) as study_material_title
       FROM pvp_lobbies l 
       WHERE l.lobby_code = ?`,
      [lobby_code]
    );

    if (existingLobby.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lobby not found'
      });
    }

    const lobby = existingLobby[0];

    if (lobby.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: `Lobby is ${lobby.status}, not accepting new players`
      });
    }

    if (lobby.guest_id) {
      return res.status(400).json({
        success: false,
        message: 'Lobby is already full'
      });
    }

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // First update the pvp_lobbies table
      const updateLobbyQuery = `
        UPDATE pvp_lobbies 
        SET guest_id = ?, 
            guest_username = ?, 
            guest_level = ?, 
            guest_picture = ?,
            guest_ready = 0
        WHERE lobby_code = ?`;

      await connection.query(updateLobbyQuery, [
        player_id,
        player_username,
        player_level || 1,
        player_picture,
        lobby_code
      ]);

      // Parse question types from settings
      let questionTypes = [];
      try {
        questionTypes = JSON.parse(lobby.question_types || '[]');
      } catch (e) {
        console.warn('Failed to parse question types:', e);
      }

      // Create battle invitation
      const createInvitationQuery = `
        INSERT INTO battle_invitations (
          sender_id,
          sender_username,
          sender_level,
          receiver_id,
          receiver_username,
          receiver_level,
          lobby_code,
          status,
          question_types,
          study_material_title,
          host_ready,
          guest_ready,
          battle_started,
          selected_difficulty
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      await connection.query(createInvitationQuery, [
        lobby.host_id,                    // sender_id (host)
        lobby.host_username,              // sender_username
        lobby.host_level || 1,            // sender_level
        player_id,                        // receiver_id (guest)
        player_username,                  // receiver_username
        player_level || 1,                // receiver_level
        lobby_code,                       // lobby_code
        'accepted',                       // status
        JSON.stringify(questionTypes),    // question_types
        lobby.study_material_title,       // study_material_title
        lobby.host_ready ? 1 : 0,        // host_ready
        0,                               // guest_ready (default false)
        0,                               // battle_started
        null                        // selected_difficulty (default)
      ]);

      // Commit the transaction
      await connection.commit();

      // Get the updated lobby data
      const [updatedLobby] = await pool.query(
        'SELECT * FROM pvp_lobbies WHERE lobby_code = ?',
        [lobby_code]
      );

      res.json({
        success: true,
        data: updatedLobby[0]
      });

    } catch (error) {
      // If error, rollback the transaction
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error in joinLobby controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join lobby',
      error: error.message
    });
  }
};

// Update lobby settings
export const updateSettings = async (req, res) => {
  try {
    const { lobby_code, settings } = req.body;

    if (!lobby_code || !settings) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: lobby_code and settings'
      });
    }

    const updatedSettings = await LobbyModel.updateLobbySettings(lobby_code, settings);

    res.json({
      success: true,
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error in updateSettings controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lobby settings',
      error: error.message
    });
  }
};

// Update lobby status
export const updateStatus = async (req, res) => {
  try {
    const { lobby_code, status } = req.body;

    if (!lobby_code || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: lobby_code and status'
      });
    }

    const validStatuses = ['waiting', 'ready', 'in_progress', 'completed', 'abandoned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status: must be one of ${validStatuses.join(', ')}`
      });
    }

    const updatedLobby = await LobbyModel.updateLobbyStatus(lobby_code, status);

    res.json({
      success: true,
      data: updatedLobby
    });
  } catch (error) {
    console.error('Error in updateStatus controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lobby status',
      error: error.message
    });
  }
};

// Set player ready status
export const setReady = async (req, res) => {
  try {
    const { lobby_code, player_id, is_ready, is_host, is_guest } = req.body;

    if (!lobby_code || !player_id || is_ready === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Update pvp_lobbies ready status
    const updateQuery = is_host
      ? 'UPDATE pvp_lobbies SET host_ready = ? WHERE lobby_code = ?'
      : 'UPDATE pvp_lobbies SET guest_ready = ? WHERE lobby_code = ?';

    await pool.query(updateQuery, [is_ready ? 1 : 0, lobby_code]);

    // Get updated lobby data
    const [updatedLobby] = await pool.query(
      'SELECT * FROM pvp_lobbies WHERE lobby_code = ?',
      [lobby_code]
    );

    if (updatedLobby.length === 0) {
      throw new Error('Lobby not found');
    }

    res.json({
      success: true,
      data: updatedLobby[0]
    });

  } catch (error) {
    console.error('Error in setReady controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set player ready status',
      error: error.message
    });
  }
};

// Add new controller for battle invitations
export const updateOrCreateBattleInvitation = async (req, res) => {
  try {
    const {
      sender_id,
      sender_username,
      sender_level,
      receiver_id,
      receiver_username,
      receiver_level,
      lobby_code,
      status,
      question_types,
      study_material_title,
      host_ready,
      guest_ready,
      battle_started,
      selected_difficulty
    } = req.body;

    // Check if invitation exists
    const [existingInvitation] = await pool.query(
      'SELECT id FROM battle_invitations WHERE lobby_code = ? ORDER BY created_at DESC LIMIT 1',
      [lobby_code]
    );

    if (existingInvitation.length > 0) {
      // Update existing invitation
      await pool.query(
        `UPDATE battle_invitations 
         SET host_ready = ?, guest_ready = ?, status = ?, 
             question_types = ?, study_material_title = ?,
             battle_started = ?, selected_difficulty = ?
         WHERE id = ?`,
        [
          host_ready ? 1 : 0,
          guest_ready ? 1 : 0,
          status,
          question_types,
          study_material_title,
          battle_started ? 1 : 0,
          selected_difficulty,
          existingInvitation[0].id
        ]
      );
    } else {
      // Create new invitation
      await pool.query(
        `INSERT INTO battle_invitations 
         (sender_id, sender_username, sender_level, receiver_id, 
          receiver_username, receiver_level, lobby_code, status,
          question_types, study_material_title, host_ready, 
          guest_ready, battle_started, selected_difficulty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sender_id, sender_username, sender_level, receiver_id,
          receiver_username, receiver_level, lobby_code, status,
          question_types, study_material_title,
          host_ready ? 1 : 0, guest_ready ? 1 : 0,
          battle_started ? 1 : 0, selected_difficulty
        ]
      );
    }

    res.json({
      success: true,
      message: existingInvitation.length > 0 ? 'Invitation updated' : 'Invitation created'
    });

  } catch (error) {
    console.error('Error in updateOrCreateBattleInvitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update/create battle invitation',
      error: error.message
    });
  }
};

// Get lobby details
export const getLobbyDetails = async (req, res) => {
  try {
    const { lobbyCode } = req.params;

    const lobby = await LobbyModel.getLobbyByCode(lobbyCode);

    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: 'Lobby not found'
      });
    }

    res.json({
      success: true,
      data: lobby
    });
  } catch (error) {
    console.error('Error in getLobbyDetails controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get lobby details',
      error: error.message
    });
  }

};
export const leaveLobby = async (req, res) => {
  try {
    const { lobby_code, player_id, is_host, is_guest } = req.body;

    if (!lobby_code || !player_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      if (is_host) {
        // If host leaves, mark lobby as abandoned
        await connection.query(
          `UPDATE pvp_lobbies 
           SET status = 'abandoned',
               ended_at = CURRENT_TIMESTAMP,
               host_ready = 0,
               guest_ready = 0
           WHERE lobby_code = ?`,
          [lobby_code]
        );

        // Update battle invitation
        await connection.query(
          `UPDATE battle_invitations 
           SET status = 'expired',
               battle_started = 0,
               host_ready = 0,
               guest_ready = 0
           WHERE lobby_code = ? 
           ORDER BY created_at DESC 
           LIMIT 1`,
          [lobby_code]
        );
      } else if (is_guest) {
        // If guest leaves, remove guest info
        await connection.query(
          `UPDATE pvp_lobbies 
           SET guest_id = NULL,
               guest_username = NULL,
               guest_level = NULL,
               guest_picture = NULL,
               guest_ready = 0,
               status = 'waiting'
           WHERE lobby_code = ?`,
          [lobby_code]
        );

        // Update battle invitation
        await connection.query(
          `UPDATE battle_invitations 
           SET receiver_id = NULL,
               receiver_username = NULL,
               receiver_level = NULL,
               guest_ready = 0,
               status = 'pending'
           WHERE lobby_code = ? 
           ORDER BY created_at DESC 
           LIMIT 1`,
          [lobby_code]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Successfully left lobby'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error in leaveLobby controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave lobby',
      error: error.message
    });
  }
};