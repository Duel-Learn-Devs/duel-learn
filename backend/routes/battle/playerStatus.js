import express from 'express';
import { pool } from '../../config/db.js';
import { getIO } from '../../socket.js';

const router = express.Router();

/**
 * Check if a player is still in a lobby
 * @route GET /api/battle/check-player/:lobbyCode/:playerId
 * @param {string} lobbyCode - The lobby code
 * @param {string} playerId - The player's ID to check
 * @returns {Object} Status indicating if player is present or has left
 */
router.get('/check-player/:lobbyCode/:playerId', async (req, res) => {
  try {
    const { lobbyCode, playerId } = req.params;
    
    // First check the database for the player in battle_invitations
    const [invitations] = await pool.query(
      `SELECT * FROM battle_invitations WHERE lobby_code = ? AND (host_id = ? OR guest_id = ?)`,
      [lobbyCode, playerId, playerId]
    );
    
    if (invitations.length === 0) {
      return res.json({ status: 'left', reason: 'no_invitation_found' });
    }
    
    // Get socket.io instance to check for active connections
    const io = getIO();
    if (!io) {
      return res.status(500).json({ error: 'Socket server not available' });
    }
    
    // Check if the player is in the socket room for this lobby
    const socketsInRoom = io.sockets.adapter.rooms.get(lobbyCode);
    const playerSockets = Object.values(io.sockets.sockets)
      .filter(socket => socket.userId === playerId);
    
    if (!playerSockets || playerSockets.length === 0) {
      return res.json({ status: 'left', reason: 'no_socket_connection' });
    }
    
    // Check if any of the player's sockets are in the room
    const inRoom = playerSockets.some(socket => 
      socketsInRoom && socketsInRoom.has(socket.id)
    );
    
    if (!inRoom) {
      return res.json({ status: 'left', reason: 'not_in_room' });
    }
    
    return res.json({ status: 'present', playerId });
    
  } catch (error) {
    console.error('Error checking player status:', error);
    return res.status(500).json({ error: 'Server error checking player status' });
  }
});

export default router; 