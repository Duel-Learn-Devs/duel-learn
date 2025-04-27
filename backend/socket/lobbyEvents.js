// Socket event handlers for PvP lobby functionality

export const registerLobbyEvents = (io, socket, userSocketMap) => {
  // Handler for when a user joins a lobby
  socket.on('join_lobby', async (data) => {
    try {
      const { lobbyCode, playerId, playerName } = data;
      
      if (!lobbyCode) {
        console.error("Missing lobby code in join_lobby event");
        return;
      }
      
      // Check if this socket is already in this room to prevent duplicates
      const rooms = Array.from(socket.rooms);
      if (rooms.includes(lobbyCode)) {
        console.log(`Player ${playerName || playerId} already in lobby ${lobbyCode}, skipping join`);
        return;
      }
      
      console.log(`Player ${playerName || playerId} joining lobby: ${lobbyCode}`);
      
      // Join the socket room for this lobby
      socket.join(lobbyCode);
      
      // Store user's current active lobby
      socket.activeLobby = lobbyCode;
      
      // Notify all sockets in the room about the new player
      io.to(lobbyCode).emit('player_joined_lobby', data);
    } catch (error) {
      console.error("Error in join_lobby handler:", error);
    }
  });
  
  // Handler for updating question types
  socket.on('update_question_types', (data) => {
    try {
      const { lobbyCode, questionTypes } = data;
      
      if (!lobbyCode || !Array.isArray(questionTypes)) {
        console.error("Invalid data in update_question_types event");
        return;
      }
      
      console.log(`Updating question types for lobby ${lobbyCode}:`, questionTypes);
      
      // Broadcast to all clients in the room
      io.to(lobbyCode).emit('question_types_changed', {
        lobbyCode,
        questionTypes
      });
    } catch (error) {
      console.error("Error in update_question_types handler:", error);
    }
  });
  
  // Handler for updating study material
  socket.on('update_study_material', (data) => {
    try {
      const { lobbyCode, studyMaterial } = data;
      
      if (!lobbyCode || !studyMaterial) {
        console.error("Invalid data in update_study_material event");
        return;
      }
      
      console.log(`Updating study material for lobby ${lobbyCode}:`, studyMaterial);
      
      // Broadcast to all clients in the room
      io.to(lobbyCode).emit('study_material_changed', {
        lobbyCode,
        studyMaterial
      });
    } catch (error) {
      console.error("Error in update_study_material handler:", error);
    }
  });
  
  // Handler for updating player ready status
  socket.on('update_player_ready', (data) => {
    try {
      const { lobbyCode, playerId, isReady } = data;
      
      if (!lobbyCode || !playerId) {
        console.error("Invalid data in update_player_ready event");
        return;
      }
      
      console.log(`Player ${playerId} ready status in lobby ${lobbyCode}:`, isReady);
      
      // Broadcast to all clients in the room
      io.to(lobbyCode).emit('player_ready_changed', {
        lobbyCode,
        playerId,
        isReady
      });
    } catch (error) {
      console.error("Error in update_player_ready handler:", error);
    }
  });
  
  // Handler for updating lobby status
  socket.on('update_lobby_status', (data) => {
    try {
      const { lobbyCode, status } = data;
      
      if (!lobbyCode || !status) {
        console.error("Invalid data in update_lobby_status event");
        return;
      }
      
      console.log(`Updating lobby ${lobbyCode} status to: ${status}`);
      
      // Broadcast to all clients in the room
      io.to(lobbyCode).emit('lobby_status_changed', {
        lobbyCode,
        status
      });
    } catch (error) {
      console.error("Error in update_lobby_status handler:", error);
    }
  });
  
  // Handler for when socket disconnects
  socket.on('disconnect', () => {
    try {
      // Notify lobby if user was in one
      if (socket.activeLobby) {
        io.to(socket.activeLobby).emit('player_disconnected', {
          lobbyCode: socket.activeLobby,
          socketId: socket.id
        });
      }
    } catch (error) {
      console.error("Error in disconnect handler:", error);
    }
  });
  socket.on('leave_lobby', async (data) => {
    try {
      const { lobbyCode, playerId, isHost, isGuest } = data;
      
      // Leave the socket room
      socket.leave(lobbyCode);
      
      // Notify other players in the room
      socket.to(lobbyCode).emit('player_left', {
        lobbyCode,
        playerId,
        isHost,
        isGuest,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Error in leave_lobby handler:", error);
    }
  });
}; 