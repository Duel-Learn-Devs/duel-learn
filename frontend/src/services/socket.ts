import { io } from "socket.io-client";

// Create socket instance
export const socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  withCredentials: true
});

// Socket event listeners
socket.on("connect", () => {
  console.log("Socket connected");
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

export default socket; 