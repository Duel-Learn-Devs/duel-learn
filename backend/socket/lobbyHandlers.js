// Socket handlers for lobby management

const handleJoinLobbyRoom = (io, socket, data) => {
  const { lobbyCode, userId } = data;
  
  if (!lobbyCode || !userId) {
    console.error('Invalid join_lobby_room data:', data);
    return;
  }
  
  console.log(`User ${userId} joining lobby room: ${lobbyCode}`);
  
  // Join the socket room for this lobby
  socket.join(`lobby:${lobbyCode}`);
  
  // Notify others in the room that someone has joined the socket room
  // (This is just for socket connection, not actually joining the lobby as a player)
  socket.to(`lobby:${lobbyCode}`).emit('user_joined_socket', {
    userId,
    lobbyCode,
    timestamp: new Date()
  });
};

const handleLeaveLobbyRoom = (io, socket, data) => {
  const { lobbyCode, userId } = data;
  
  if (!lobbyCode || !userId) {
    console.error('Invalid leave_lobby_room data:', data);
    return;
  }
  
  console.log(`User ${userId} leaving lobby room: ${lobbyCode}`);
  
  // Leave the socket room
  socket.leave(`lobby:${lobbyCode}`);
  
  // Notify others in the room
  socket.to(`lobby:${lobbyCode}`).emit('user_left_socket', {
    userId,
    lobbyCode,
    timestamp: new Date()
  });
};

const handlePlayerReadyChanged = async (io, socket, data, db) => {
  const { lobbyCode, playerId, playerRole, isReady } = data;
  
  if (!lobbyCode || !playerId || !playerRole) {
    console.error('Invalid player_ready_changed data:', data);
    return;
  }
  
  console.log(`Player ${playerId} (${playerRole}) ready status changed to ${isReady} in lobby ${lobbyCode}`);
  
  try {
    // Update database (already handled by API call)
    
    // Broadcast to all clients in the lobby room
    io.to(`lobby:${lobbyCode}`).emit('player_ready_updated', {
      lobbyCode,
      playerId,
      playerRole,
      isReady,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error handling player ready change:', error);
  }
};

const handleLobbySettingsChanged = async (io, socket, data, db) => {
  const { lobbyCode, settings } = data;
  
  if (!lobbyCode || !settings) {
    console.error('Invalid lobby_settings_changed data:', data);
    return;
  }
  
  console.log(`Lobby ${lobbyCode} settings changed:`, settings);
  
  try {
    // Update database (already handled by API call)
    
    // Broadcast to all clients in the lobby room
    io.to(`lobby:${lobbyCode}`).emit('lobby_settings_updated', {
      lobbyCode,
      settings,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error handling lobby settings change:', error);
  }
};

const handleGameStart = async (io, socket, data, db) => {
  const { lobbyCode } = data;
  
  if (!lobbyCode) {
    console.error('Invalid game_start data:', data);
    return;
  }
  
  console.log(`Game starting in lobby ${lobbyCode}`);
  
  try {
    // Update database (already handled by API call)
    
    // Broadcast to all clients in the lobby room
    io.to(`lobby:${lobbyCode}`).emit('game_started', {
      lobbyCode,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error handling game start:', error);
  }
};

const handlePlayerLeaving = async (io, socket, data, db) => {
  const { lobbyCode, playerId, playerRole } = data;
  
  if (!lobbyCode || !playerId) {
    console.error('Invalid player_leaving data:', data);
    return;
  }
  
  console.log(`Player ${playerId} (${playerRole}) leaving lobby ${lobbyCode}`);
  
  try {
    // Update database (already handled by API call)
    
    // Broadcast to all clients in the lobby room
    io.to(`lobby:${lobbyCode}`).emit('player_left_lobby', {
      lobbyCode,
      playerId,
      playerRole,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error handling player leaving:', error);
  }
};

// Register all lobby socket handlers
const registerLobbyHandlers = (io, socket, db) => {
  socket.on('join_lobby_room', (data) => handleJoinLobbyRoom(io, socket, data));
  socket.on('leave_lobby_room', (data) => handleLeaveLobbyRoom(io, socket, data));
  socket.on('player_ready_changed', (data) => handlePlayerReadyChanged(io, socket, data, db));
  socket.on('lobby_settings_changed', (data) => handleLobbySettingsChanged(io, socket, data, db));
  socket.on('game_start', (data) => handleGameStart(io, socket, data, db));
  socket.on('player_leaving', (data) => handlePlayerLeaving(io, socket, data, db));
};

// Lobby event handlers for Socket.io

export const setupLobbyHandlers = (io, socket) => {
  // Join a lobby room
  socket.on('join_lobby', (data) => {
    const { lobbyCode, playerId, playerName, playerLevel, playerPicture } = data;
    
    // Join the socket room
    socket.join(lobbyCode);
    
    console.log(`Player ${playerName} (${playerId}) joined lobby: ${lobbyCode}`);
    
    // Notify all clients in the room that a player joined
    io.to(lobbyCode).emit('player_joined_lobby', {
      lobbyCode,
      playerId,
      playerName,
      playerLevel,
      playerPicture
    });
  });
  
  // Leave a lobby room
  socket.on('leave_lobby', (data) => {
    const { lobbyCode, playerId } = data;
    
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
  socket.on('update_question_types', (data) => {
    const { lobbyCode, playerId, questionTypes } = data;
    
    console.log(`Player ${playerId} updated question types in lobby: ${lobbyCode}`);
    
    // Broadcast to all other clients in the room
    socket.to(lobbyCode).emit('question_types_changed', {
      lobbyCode,
      playerId,
      questionTypes
    });
  });
  
  // Update study material
  socket.on('update_study_material', (data) => {
    const { lobbyCode, playerId, studyMaterial } = data;
    
    console.log(`Player ${playerId} updated study material in lobby: ${lobbyCode}`);
    
    // Broadcast to all other clients in the room
    socket.to(lobbyCode).emit('study_material_changed', {
      lobbyCode,
      playerId,
      studyMaterial
    });
  });
  
  // Update player ready status
  socket.on('update_player_ready', (data) => {
    const { lobbyCode, playerId, isReady } = data;
    
    console.log(`Player ${playerId} set ready status to ${isReady} in lobby: ${lobbyCode}`);
    
    // Broadcast to all clients in the room (including sender)
    io.to(lobbyCode).emit('player_ready_changed', {
      lobbyCode,
      playerId,
      isReady
    });
  });
  
  // Update lobby status
  socket.on('update_lobby_status', (data) => {
    const { lobbyCode, playerId, status } = data;
    
    console.log(`Player ${playerId} updated lobby status to ${status} in lobby: ${lobbyCode}`);
    
    // Broadcast to all clients in the room (including sender)
    io.to(lobbyCode).emit('lobby_status_changed', {
      lobbyCode,
      playerId,
      status
    });
  });
};

module.exports = {
  registerLobbyHandlers,
  setupLobbyHandlers
}; 