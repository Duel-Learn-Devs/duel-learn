import { io, Socket } from 'socket.io-client';

export interface PlayerLeftData {
  leavingPlayerId: string;
  isHost: boolean;
  timestamp: string;
}

export interface LobbyStatusUpdate {
  lobbyCode: string;
  status: 'player_left' | 'lobby_closed';
  leavingPlayerId: string;
  isHost: boolean;
  timestamp: string;
}

export interface LobbyClosedData {
  reason: 'host_left';
  lobbyCode: string;
  timestamp: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const socket: Socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Debug socket connection
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
  document.body.setAttribute('data-socket-status', 'connected');
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
  document.body.setAttribute('data-socket-status', 'disconnected');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
  document.body.setAttribute('data-socket-status', 'error');
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Socket reconnected after', attemptNumber, 'attempts');
  document.body.setAttribute('data-socket-status', 'reconnected');
});

// Add type-safe event listeners with UI debugging
socket.on('player_left_difficulty_selection', (data: PlayerLeftData) => {
  console.log('Player left difficulty selection:', data);
  
  // Create visual debug element in DOM
  const debugEvent = document.createElement('div');
  debugEvent.className = 'socket-debug-event';
  debugEvent.textContent = `Player left event: ${data.isHost ? 'Host' : 'Guest'} (ID: ${data.leavingPlayerId}) left at ${new Date(data.timestamp).toLocaleTimeString()}`;
  debugEvent.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 9999;
    font-size: 14px;
    max-width: 300px;
  `;
  document.body.appendChild(debugEvent);
  setTimeout(() => debugEvent.remove(), 5000);
  
  // Also show in console for easier debugging
  console.table({
    Event: 'player_left_difficulty_selection',
    PlayerId: data.leavingPlayerId,
    IsHost: data.isHost,
    Timestamp: data.timestamp
  });
});

socket.on('lobby_status_update', (data: LobbyStatusUpdate) => {
  console.log('Lobby status update:', data);
  
  // Create visual debug element in DOM
  const debugEvent = document.createElement('div');
  debugEvent.className = 'socket-debug-event';
  debugEvent.textContent = `Lobby status: ${data.status} - Player ${data.leavingPlayerId} (${data.isHost ? 'Host' : 'Guest'})`;
  debugEvent.style.cssText = `
    position: fixed;
    bottom: 70px;
    left: 20px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 9999;
    font-size: 14px;
    max-width: 300px;
  `;
  document.body.appendChild(debugEvent);
  setTimeout(() => debugEvent.remove(), 5000);
});

socket.on('lobby_closed', (data: LobbyClosedData) => {
  console.log('Lobby closed:', data);
});

export default socket; 