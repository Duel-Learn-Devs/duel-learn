import { Server } from "socket.io";
import { pool } from './config/db.js';

let io;

// Helper function to validate required fields
const validateFields = (data, requiredFields, errorType) => {
  for (const field of requiredFields) {
    if (!data[field]) {
      const error = new Error(`Missing required field: ${field}`);
      error.type = errorType;
      throw error;
    }
  }
  return true;
};

// Centralized error handler
const handleSocketError = (socket, error, defaultType = "general") => {
  console.error(`Socket error: ${error.message}`, error);
  socket.emit("error", {
    type: error.type || defaultType,
    message: `Failed to process ${error.type || defaultType}`,
    details: error.message,
  });
};

// Standardized event handler creation helper
const createEventHandler = (socket, eventName, requiredFields, logEmoji, handler) => {
  socket.on(eventName, (data = {}) => {
    try {
      if (requiredFields.length > 0) {
        validateFields(data, requiredFields, eventName);
      }

      if (logEmoji) {
        console.log(`${logEmoji} ${eventName}:`, requiredFields.length > 0 ? data : "");
      }

      handler(data);
    } catch (error) {
      handleSocketError(socket, error, eventName.replace(/([A-Z])/g, '_$1').toLowerCase());
    }
  });
};

// Socket setup function with improved error handling and connection management
const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*", // Fallback to allow any origin in development
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000, // Increase from 30000 to 60000
    pingInterval: 25000, // Add explicit ping interval 
    connectTimeout: 10000, // Increase from 5000 to 10000
    transports: ["websocket", "polling"], // Prefer websocket first
    allowUpgrades: true, // Allow transport upgrades
    maxHttpBufferSize: 1e6, // 1MB
    path: "/socket.io/", // Explicit path
  });

  // Store active user connections
  const activeUsers = new Map();

  // Add a Map to track users in lobbies (after the activeUsers map declaration)
  const usersInLobby = new Map(); // Maps userId to lobbyCode

  // Add a Map to track users in games (after the usersInLobby map declaration)
  const usersInGame = new Map(); // Maps userId to { mode: string }

  // More robust server-side error handling
  io.engine.on("connection_error", (error) => {
    console.error("Socket.IO connection error:", error);
  });

  io.on("connect_error", (err) => {
    console.error(`Socket.IO connect error: ${err.message}`);
  });

  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);
    socket.setMaxListeners(20); // Increased to handle more events

    // Handle user setup and room joining
    socket.on("setup", (userId) => {
      try {
        if (!userId) {
          console.error("Missing user ID during setup");
          return;
        }

        // Store the userId in the socket object for later reference
        socket.userId = userId;
        socket.join(userId);

        console.log(`🔗 User ${userId} connected. Socket ID: ${socket.id}`);

        // Store in active users map
        activeUsers.set(userId, socket.id);
        socket.emit("connected", { success: true, socketId: socket.id });

        // Broadcast user online status to others
        socket.broadcast.emit("userStatusChanged", {
          userId,
          online: true
        });
      } catch (error) {
        console.error("Error in setup:", error);
        socket.emit("error", {
          type: "setup",
          message: "Failed to complete setup",
          details: error.message,
        });
      }
    });

    // Friend system handlers
    const createFriendEventHandler = (socket) => {
      // Handle friend request sending
      createEventHandler(
        socket,
        "sendFriendRequest",
        ["sender_id", "receiver_id", "sender_username"],
        "📨",
        (data) => {
          const { sender_id, receiver_id, sender_username, receiver_username } = data;

          io.to(receiver_id).emit("newFriendRequest", {
            sender_id, sender_username, receiver_id, receiver_username
          });

          socket.emit("friendRequestSent", {
            success: true, receiver_id, receiver_username
          });
        }
      );

      // Handle friend request acceptance
      createEventHandler(
        socket,
        "acceptFriendRequest",
        ["sender_id", "receiver_id"],
        "✅",
        (data) => {
          const { sender_id, receiver_id, senderInfo, receiverInfo } = data;

          // Notify sender if active
          if (activeUsers.has(sender_id)) {
            io.to(sender_id).emit("friendRequestAccepted", {
              newFriend: receiverInfo || { firebase_uid: receiver_id },
              otherUser: receiverInfo || { firebase_uid: receiver_id }
            });
          }

          // Notify receiver if active
          if (activeUsers.has(receiver_id)) {
            io.to(receiver_id).emit("friendRequestAccepted", {
              newFriend: senderInfo || { firebase_uid: sender_id },
              otherUser: senderInfo || { firebase_uid: sender_id }
            });
          }
        }
      );

      // Handle friend request rejection
      createEventHandler(
        socket,
        "rejectFriendRequest",
        ["sender_id", "receiver_id"],
        "❌",
        (data) => {
          const { sender_id, receiver_id } = data;
          const notificationData = { sender_id, receiver_id };

          io.to(sender_id).emit("friendRequestRejected", notificationData);
          io.to(receiver_id).emit("friendRequestRejected", notificationData);
        }
      );

      // Handle friend removal
      createEventHandler(
        socket,
        "removeFriend",
        ["sender_id", "receiver_id"],
        "❌",
        (data) => {
          const { sender_id, receiver_id } = data;

          io.to(sender_id).emit("friendRemoved", { removedFriendId: receiver_id });
          io.to(receiver_id).emit("friendRemoved", { removedFriendId: sender_id });
        }
      );
    };

    // Register all friend event handlers at once
    createFriendEventHandler(socket);

    // Study material handler
    socket.on("newStudyMaterial", (data) => {
      try {
        if (!data || !data.title) {
          throw new Error("Invalid study material data");
        }

        console.log("📚 New study material received:", data);

        // Normalize data structure for consistency
        const broadcastData = {
          study_material_id: data.studyMaterialId || data.study_material_id,
          title: data.title,
          tags: data.tags || [],
          images: data.images || [],
          total_items: data.totalItems || data.total_items || 0,
          created_by: data.createdBy || data.created_by,
          created_by_id: data.createdById || data.created_by_id,
          visibility: data.visibility || 0,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
          items: data.items || [],
        };

        io.emit("broadcastStudyMaterial", broadcastData);
      } catch (error) {
        handleSocketError(socket, error, "studyMaterial");
      }
    });

    // Simple notification events with standardized error handling
    const simpleEvents = [
      { event: "emailActionResult", requires: ["mode"], logEmoji: "📧" },
      { event: "passwordResetSuccess", requires: [], logEmoji: "🔑" },
      { event: "emailVerifiedSuccess", requires: [], logEmoji: "✅" }
    ];

    simpleEvents.forEach(({ event, requires, logEmoji }) => {
      createEventHandler(socket, event, requires, logEmoji, (data) => {
        io.emit(event, data);
      });
    });

    // Battle invitation system - updated with enhanced functionality
    const createBattleInvitationEventHandler = (socket) => {
      // Handle battle invitation sending
      createEventHandler(
        socket,
        "battle_invitation",
        ["senderId", "receiverId", "lobbyCode"],
        "🎮",
        (data) => {
          const {
            senderId,
            senderName,
            senderLevel,
            senderPicture,
            receiverId,
            receiverName,
            receiverLevel,
            receiverPicture,
            lobbyCode
          } = data;

          io.to(receiverId).emit("battle_invitation", {
            senderId,
            senderName,
            senderLevel,
            senderPicture,
            receiverId,
            receiverName,
            receiverLevel,
            receiverPicture,
            lobbyCode
          });

          socket.emit("battle_invitation_sent", {
            success: true,
            receiverId,
            receiverName,
            receiverLevel,
            receiverPicture,
            lobbyCode
          });
        }
      );

      // Handle battle invitation acceptance
      createEventHandler(
        socket,
        "accept_battle_invitation",
        ["senderId", "receiverId", "lobbyCode"],
        "✅",
        (data) => {
          const { senderId, receiverId, receiverName, lobbyCode } = data;

          // Notify sender if active
          if (activeUsers.has(senderId)) {
            io.to(senderId).emit("battle_invitation_accepted", {
              receiverId,
              receiverName,
              lobbyCode
            });
          }
        }
      );

      // Handle battle invitation rejection
      createEventHandler(
        socket,
        "decline_battle_invitation",
        ["senderId", "receiverId", "lobbyCode"],
        "❌",
        (data) => {
          const { senderId, receiverId, receiverName, lobbyCode } = data;

          // Notify sender
          io.to(senderId).emit("battle_invitation_declined", {
            receiverId,
            receiverName,
            lobbyCode
          });
        }
      );
    };

    // Register all battle invitation event handlers at once
    createBattleInvitationEventHandler(socket);

    // For backward compatibility - provide legacy support for old notify_battle_invitation
    createEventHandler(
      socket,
      "notify_battle_invitation",
      ["senderId", "senderName", "receiverId", "lobbyCode"],
      "🎮",
      (data) => {
        const { senderId, senderName, receiverId, lobbyCode } = data;

        io.to(receiverId).emit("battle_invitation", {
          senderId,
          senderName,
          receiverId,
          lobbyCode,
          timestamp: new Date().toISOString(),
        });
      }
    );

    // Lobby management
    createEventHandler(
      socket,
      "join_lobby",
      ["lobbyCode", "playerId"],
      "🎮",
      (data) => {
        const { lobbyCode, playerId, playerName, playerLevel, playerPicture, hostId } = data;
        socket.join(lobbyCode);

        const joinData = {
          lobbyCode, playerId, playerName, playerLevel, playerPicture
        };

        // Notify host if specified
        if (hostId) {
          io.to(hostId).emit("player_joined_lobby", joinData);
        }

        // Notify everyone in lobby
        socket.to(lobbyCode).emit("player_joined_lobby", joinData);

        // Confirm to joining player
        socket.emit("lobby_joined", {
          success: true, lobbyCode, message: "Successfully joined lobby"
        });
      }
    );

    // Lobby information handlers
    createEventHandler(
      socket,
      "request_lobby_info",
      ["lobbyCode", "requesterId"],
      "🔍",
      (data) => {
        const { lobbyCode, requesterId } = data;
        socket.to(lobbyCode).emit("request_lobby_info", { lobbyCode, requesterId });
      }
    );

    createEventHandler(
      socket,
      "lobby_info_response",
      ["lobbyCode", "requesterId"],
      "📡",
      (data) => {
        const { lobbyCode, requesterId, hostId, hostName, material, questionTypes, mode, hostLevel, hostPicture } = data;

        io.to(requesterId).emit("lobby_info_response", {
          lobbyCode, requesterId, hostId, hostName,
          hostLevel, hostPicture, material, questionTypes, mode
        });
      }
    );

    createEventHandler(
      socket,
      "lobby_material_update",
      ["lobbyCode"],
      "📚",
      (data) => {
        const { lobbyCode, material, questionTypes, mode } = data;
        socket.to(lobbyCode).emit("lobby_material_update", {
          lobbyCode, material, questionTypes, mode
        });
      }
    );

    createEventHandler(
      socket,
      "player_ready_state_changed",
      ["lobbyCode", "playerId"],
      "🎮",
      (data) => {
        const { lobbyCode, playerId, isReady } = data;
        socket.to(lobbyCode).emit("player_ready_state_changed", {
          lobbyCode, playerId, isReady
        });
      }
    );

    // Health check for socket connections
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });

    // Handle disconnection with improved cleanup
    socket.on("disconnect", (reason) => {
      if (socket.userId) {
        activeUsers.delete(socket.userId);
        usersInLobby.delete(socket.userId);
        usersInGame.delete(socket.userId);

        // Broadcast user offline status and not in game/lobby
        socket.broadcast.emit("userStatusChanged", {
          userId: socket.userId,
          online: false
        });
        socket.broadcast.emit("userLobbyStatusChanged", {
          userId: socket.userId,
          inLobby: false
        });
        socket.broadcast.emit("userGameStatusChanged", {
          userId: socket.userId,
          inGame: false,
          mode: null
        });

        console.log(`👋 User ${socket.userId} disconnected (${reason})`);
      }

      // Leave all rooms when disconnecting
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

      console.log(`🔌 Client disconnected (${reason}):`, socket.id);
    });

    // Generic error handler
    socket.on("error", (error) => {
      console.error("Socket error for user:", socket.userId, error);
      socket.emit("error", {
        message: "An unexpected error occurred",
        details: error.message,
      });
    });

    // Handle online status request
    createEventHandler(
      socket,
      "requestOnlineStatus",
      ["userIds"],
      "👥",
      (data) => {
        const { userIds } = data;
        const onlineStatuses = {};

        if (Array.isArray(userIds)) {
          userIds.forEach(userId => {
            onlineStatuses[userId] = isUserOnline(userId);
          });
        }

        socket.emit("onlineStatusResponse", onlineStatuses);
      }
    );

    // Add this helper function near isUserOnline
    const isUserInLobby = (userId) => {
      return usersInLobby.has(userId);
    };

    // Handle lobby status requests
    createEventHandler(
      socket,
      "requestLobbyStatus",
      ["userIds"],
      "🎮",
      (data) => {
        const { userIds } = data;
        const lobbyStatuses = {};
        
        userIds.forEach(userId => {
          const lobbyCode = usersInLobby.get(userId);
          lobbyStatuses[userId] = {
            inLobby: !!lobbyCode,
            lobbyCode: lobbyCode || null
          };
        });
        
        socket.emit('lobbyStatusResponse', lobbyStatuses);
      }
    );

    // Handle user lobby status changes
    createEventHandler(
      socket,
      "userLobbyStatusChanged",
      ["userId", "inLobby"],
      "🎮",
      (data) => {
        const { userId, inLobby, lobbyCode } = data;
        
        if (inLobby && lobbyCode) {
          usersInLobby.set(userId, lobbyCode);
        } else {
          usersInLobby.delete(userId);
        }
        
        // Broadcast to all clients
        socket.broadcast.emit('userLobbyStatusChanged', {
          userId,
          inLobby,
          lobbyCode
        });
      }
    );

    // Handle player joining lobby events
    createEventHandler(
      socket,
      "player_joined_lobby",
      ["playerId", "lobbyCode"],
      "🎮",
      (data) => {
        const { playerId, lobbyCode } = data;
        
        // Store in the map
        usersInLobby.set(playerId, lobbyCode);
        
        // Broadcast to all clients
        socket.broadcast.emit('player_joined_lobby', {
          playerId,
          lobbyCode
        });
      }
    );

    // Handle player leaving lobby events
    createEventHandler(
      socket,
      "player_left_lobby",
      ["playerId"],
      "🎮",
      (data) => {
        const { playerId } = data;
        
        // Remove from the map
        usersInLobby.delete(playerId);
        
        // Broadcast to all clients
        socket.broadcast.emit('player_left_lobby', {
          playerId
        });
      }
    );

    // Handle difficulty selection leave
    createEventHandler(
      socket,
      "leave_difficulty_selection",
      ["lobbyCode", "leavingPlayerId", "isHost"],
      "🎮",
      (data) => {
        const { lobbyCode, leavingPlayerId, isHost } = data;

        console.log(`Player ${leavingPlayerId} (${isHost ? 'Host' : 'Guest'}) leaving lobby ${lobbyCode}`);

        // Leave the socket room
        socket.leave(lobbyCode);

        // Remove from lobby tracking
        usersInLobby.delete(leavingPlayerId);

        // Broadcast to everyone in the lobby except the leaver
        socket.to(lobbyCode).emit("player_left_difficulty_selection", {
          leavingPlayerId,
          isHost,
          timestamp: new Date().toISOString()
        });

        // IMPORTANT: Also emit a direct broadcast to ALL clients to ensure everyone gets the message
        // This helps in case socket.to() has any issues
        io.emit("player_left_difficulty_selection", {
          leavingPlayerId,
          isHost,
          timestamp: new Date().toISOString()
        });

        // Also emit a general lobby status update
        io.emit("lobby_status_update", {
          lobbyCode,
          status: "player_left",
          leavingPlayerId,
          isHost,
          timestamp: new Date().toISOString()
        });

        // Clean up the lobby if it was the host who left
        if (isHost) {
          // Notify all clients in the lobby that it's being closed
          io.to(lobbyCode).emit("lobby_closed", {
            reason: "host_left",
            lobbyCode,
            timestamp: new Date().toISOString()
          });

          // Force all remaining clients to leave the lobby room
          const room = io.sockets.adapter.rooms.get(lobbyCode);
          if (room) {
            for (const clientId of room) {
              const clientSocket = io.sockets.sockets.get(clientId);
              if (clientSocket) {
                clientSocket.leave(lobbyCode);
              }
            }
          }
        }
      }
    );

    // Add this helper function near isUserInLobby
    const isUserInGame = (userId) => {
      return usersInGame.has(userId);
    };

    const getUserGameMode = (userId) => {
      const userGame = usersInGame.get(userId);
      return userGame ? userGame.mode : null;
    };

    // Handle game status requests
    createEventHandler(
      socket,
      "requestGameStatus",
      ["userIds"],
      "🎮",
      (data) => {
        const { userIds } = data;
        const gameStatuses = {};
        
        userIds.forEach(userId => {
          const userGame = usersInGame.get(userId);
          gameStatuses[userId] = {
            inGame: !!userGame,
            mode: userGame ? userGame.mode : null
          };
        });
        
        socket.emit('gameStatusResponse', gameStatuses);
      }
    );

    // Handle user game status changes
    createEventHandler(
      socket,
      "userGameStatusChanged",
      ["userId", "inGame"],
      "🎮",
      (data) => {
        const { userId, inGame, mode } = data;
        
        if (inGame && mode) {
          usersInGame.set(userId, { mode });
          usersInLobby.delete(userId);
        } else {
          usersInGame.delete(userId);
        }
        
        // Broadcast to all clients
        socket.broadcast.emit('userGameStatusChanged', {
          userId,
          inGame,
          mode
        });
      }
    );

    // Handle player entering game
    createEventHandler(
      socket,
      "player_entered_game",
      ["playerId", "mode"],
      "🎮",
      (data) => {
        const { playerId, mode } = data;

        // Store in the map
        usersInGame.set(playerId, { mode });
        // Remove from lobby if in game
        usersInLobby.delete(playerId);

        // Broadcast to all clients
        socket.broadcast.emit("player_entered_game", {
          playerId,
          mode
        });
      }
    );

    // Handle player exiting game
    createEventHandler(
      socket,
      "player_exited_game",
      ["playerId"],
      "🎮",
      (data) => {
        const { playerId } = data;

        // Remove from the map
        usersInGame.delete(playerId);

        // Broadcast to all clients
        socket.broadcast.emit("player_exited_game", {
          playerId
        });
      }
    );

    // Handle direct room join/leave
    createEventHandler(
      socket,
      "join",
      [],
      "🔌",
      (data) => {
        try {
          const roomId = data; // Can be just a string or from an object
          const room = typeof roomId === 'string' ? roomId : data?.roomId;

          if (room) {
            console.log(`Socket ${socket.id} joining room ${room}`);
            socket.join(room);
            socket.emit("room_joined", { room });
          }
        } catch (error) {
          console.error("Error in join room:", error);
        }
      }
    );

    createEventHandler(
      socket,
      "leave",
      [],
      "🔌",
      (data) => {
        try {
          const roomId = data; // Can be just a string or from an object
          const room = typeof roomId === 'string' ? roomId : data?.roomId;

          if (room) {
            console.log(`Socket ${socket.id} leaving room ${room}`);
            socket.leave(room);
            socket.emit("room_left", { room });
          }
        } catch (error) {
          console.error("Error in leave room:", error);
        }
      }
    );

    // Direct message to a lobby
    createEventHandler(
      socket,
      "to_lobby",
      ["lobbyCode"],
      "📣",
      (data) => {
        try {
          const { lobbyCode, type, playerId, isHost, ...rest } = data;

          if (!lobbyCode) {
            console.error("Missing lobbyCode in to_lobby event");
            return;
          }

          // Enhanced logging
          console.log(`Direct lobby message: ${type} to ${lobbyCode}`, data);

          // Broadcast to the lobby
          socket.to(lobbyCode).emit("lobby_message", {
            type,
            playerId,
            isHost,
            timestamp: new Date().toISOString(),
            ...rest
          });

          // If this is a player_left message, also emit specific events
          if (type === "player_left") {
            // Emit the player_left_difficulty_selection event for compatibility
            socket.to(lobbyCode).emit("player_left_difficulty_selection", {
              leavingPlayerId: playerId,
              isHost: isHost || false,
              timestamp: new Date().toISOString()
            });

            // Also emit to everyone as a fallback
            io.emit("player_left_difficulty_selection", {
              leavingPlayerId: playerId,
              isHost: isHost || false,
              timestamp: new Date().toISOString()
            });

            // Emit lobby status update
            io.emit("lobby_status_update", {
              lobbyCode,
              status: "player_left",
              leavingPlayerId: playerId,
              isHost: isHost || false,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error("Error handling to_lobby event:", error);
        }
      }
    );
  });

  // After creating the activeUsers Map, add these helper functions 

  // After this line: const activeUsers = new Map(); 
  // Add this function to check if a user is online
  const isUserOnline = (userId) => {
    return activeUsers.has(userId);
  };

  return io;
};

// Get the io instance with error handling
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

// Health check function to verify socket server is running
export const isSocketHealthy = () => {
  return !!io;
};

export default setupSocket;
