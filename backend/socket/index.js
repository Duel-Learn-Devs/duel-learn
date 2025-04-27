import { Server } from 'socket.io';
import { setupPvPLobbySocket } from './pvpLobbySocket.js';

export default function initializeSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  // Set up PvP lobby socket handlers
  setupPvPLobbySocket(io);
  
  return io;
} 