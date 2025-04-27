import * as LobbyModel from '../models/LobbyModel.js';

// Maps to track user connections and lobbies
const userSocketMap = new Map(); // userId -> socketId
const socketUserMap = new Map(); // socketId -> userId
const disconnectedUsers = new Map(); // userId -> array of lobby codes

// Helper functions for managing user socket connections
const addUserSocket = (userId, socketId) => {
  userSocketMap.set(userId, socketId);
  socketUserMap.set(socketId, userId);
  console.log(`Added mapping for user: ${userId} -> socket: ${socketId}`);
};

const removeUserSocket = (userId) => {
  const socketId = userSocketMap.get(userId);
  userSocketMap.delete(userId);
  if (socketId) {
    socketUserMap.delete(socketId);
  }
  console.log(`Removed mapping for user: ${userId}`);
};

const getUserIdFromSocketId = (socketId) => {
  return socketUserMap.get(socketId);
};

export const setupPvPLobbySocket = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Set up the user's ID when they connect
    socket.on('setup', (userId) => {
      console.log(`Socket ${socket.id} setup for user: ${userId}`);
      addUserSocket(userId, socket.id);
      socket.emit('connected', { userId });
    });
    
    // === LOBBY HANDLERS ===
    
    // Join a lobby room
    socket.on('join_lobby', async (data) => {
      const { lobbyCode, playerId, playerName, playerLevel, playerPicture } = data;
      
      if (!lobbyCode || !playerId) {
        console.error("Missing required data for join_lobby event");
        return;
      }
      
      try {
        // Update user socket mapping
        addUserSocket(playerId, socket.id);
        
        // Join the socket room for this lobby
        socket.join(lobbyCode);
        
        console.log(`Player ${playerName} (${playerId}) joined lobby: ${lobbyCode}`);
        
        // Check if this player is already the host or a new guest
        const lobby = await LobbyModel.getLobbyByCode(lobbyCode);
        
        let isHost = false;
        let isGuest = false;
        
        if (lobby) {
          isHost = lobby.host_id === playerId;
          isGuest = lobby.guest_id === playerId;
          
          // If this is a new guest, update the lobby
          if (!isHost && !isGuest && !lobby.guest_id) {
            await LobbyModel.joinLobby(lobbyCode, {
              player_id: playerId,
              player_username: playerName,
              player_level: playerLevel,
              player_picture: playerPicture
            });
          }
        }
        
        // Notify all clients in the room that a player joined
        io.to(lobbyCode).emit('player_joined_lobby', {
          lobbyCode,
          playerId,
          playerName,
          playerLevel,
          playerPicture,
          isHost,
          isGuest
        });
      } catch (error) {
        console.error("Error handling join_lobby event:", error);
      }
    });
    
    // Leave a lobby room
    socket.on('leave_lobby', (data) => {
      const { lobbyCode, playerId } = data;
      
      if (!lobbyCode) return;
      
      // Leave the socket room
      socket.leave(lobbyCode);
      
      console.log(`Player ${playerId} left lobby: ${lobbyCode}`);
      
      // Notify all clients in the room that a player left
      io.to(lobbyCode).emit('player_left_lobby', {
        lobbyCode,
        playerId
      });
    });
    
    // Update question types
    socket.on('update_question_types', async (data) => {
      const { lobbyCode, playerId, questionTypes } = data;
      
      if (!lobbyCode || !Array.isArray(questionTypes)) return;
      
      try {
        // Update in database
        await LobbyModel.updateLobbySettings(lobbyCode, {
          question_types: questionTypes
        });
        
        console.log(`Player ${playerId} updated question types in lobby: ${lobbyCode}`);
        
        // Broadcast to all clients in the room including sender
        io.to(lobbyCode).emit('question_types_changed', {
          lobbyCode,
          playerId,
          questionTypes
        });
      } catch (error) {
        console.error("Error handling update_question_types event:", error);
      }
    });
    
    // Update study material
    socket.on('update_study_material', async (data) => {
      const { lobbyCode, playerId, studyMaterial } = data;
      
      if (!lobbyCode || !studyMaterial) return;
      
      try {
        // Update in database
        await LobbyModel.updateLobbySettings(lobbyCode, {
          study_material_id: studyMaterial.id || studyMaterial.study_material_id,
          study_material_title: studyMaterial.title
        });
        
        console.log(`Player ${playerId} updated study material in lobby: ${lobbyCode}`);
        
        // Broadcast to all clients in the room including sender
        io.to(lobbyCode).emit('study_material_changed', {
          lobbyCode,
          playerId,
          studyMaterial
        });
      } catch (error) {
        console.error("Error handling update_study_material event:", error);
      }
    });
    
    // Update player ready status
    socket.on('update_player_ready', async (data) => {
      const { lobbyCode, playerId, isReady } = data;
      
      if (!lobbyCode || !playerId) return;
      
      try {
        // Update in database
        await LobbyModel.setPlayerReady(lobbyCode, playerId, isReady);
        
        console.log(`Player ${playerId} set ready status to ${isReady} in lobby: ${lobbyCode}`);
        
        // Broadcast to all clients in the room including sender
        io.to(lobbyCode).emit('player_ready_changed', {
          lobbyCode,
          playerId,
          isReady
        });
        
        // Check if both players are ready
        const updatedLobby = await LobbyModel.getLobbyByCode(lobbyCode);
        
        if (updatedLobby && updatedLobby.host_ready && updatedLobby.guest_ready) {
          // Both players are ready, update lobby status to 'ready'
          await LobbyModel.updateLobbyStatus(lobbyCode, 'ready');
          
          io.to(lobbyCode).emit('lobby_status_changed', {
            lobbyCode,
            status: 'ready'
          });
        }
      } catch (error) {
        console.error("Error handling update_player_ready event:", error);
      }
    });
    
    // Update lobby status
    socket.on('update_lobby_status', async (data) => {
      const { lobbyCode, status } = data;
      
      if (!lobbyCode || !status) return;
      
      try {
        // Update in database
        await LobbyModel.updateLobbyStatus(lobbyCode, status);
        
        console.log(`Lobby ${lobbyCode} status updated to ${status}`);
        
        // Broadcast to all clients in the room including sender
        io.to(lobbyCode).emit('lobby_status_changed', {
          lobbyCode,
          status
        });
      } catch (error) {
        console.error("Error handling update_lobby_status event:", error);
      }
    });
    
    // Handle socket disconnections
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      
      // Get the user's id from our map
      const userId = getUserIdFromSocketId(socket.id);
      
      if (userId) {
        try {
          // Find all lobbies the user is in
          const userLobbies = await LobbyModel.find({
            $or: [
              { host_id: userId },
              { guest_id: userId }
            ]
          });
          
          // For each lobby, notify others that the player disconnected
          userLobbies.forEach(lobby => {
            socket.to(lobby.lobby_code).emit('player_disconnected', {
              lobbyCode: lobby.lobby_code,
              playerId: userId
            });
          });
          
          // Store the user's lobbies in the disconnected users map for reconnection
          disconnectedUsers.set(userId, userLobbies.map(lobby => lobby.lobby_code));
        } catch (error) {
          console.error("Error handling user disconnect:", error);
        }
        
        // Remove from connected user map
        removeUserSocket(userId);
      }
    });
    
    // Handle reconnections
    socket.on('connect', async () => {
      // This runs when a socket reconnects after a disconnect
      console.log('Socket reconnected:', socket.id);
      
      // If we have already identified this user
      const userId = getUserIdFromSocketId(socket.id);
      
      if (userId && disconnectedUsers.has(userId)) {
        const lobbyCodes = disconnectedUsers.get(userId);
        
        // Rejoin all the lobbies the user was in
        lobbyCodes.forEach(lobbyCode => {
          socket.join(lobbyCode);
          
          // Notify others in the lobby that the user reconnected
          socket.to(lobbyCode).emit('player_reconnected', {
            lobbyCode,
            playerId: userId
          });
        });
        
        // Remove from disconnected users map
        disconnectedUsers.delete(userId);
      }
    });
  });
  
  return io;
}; 