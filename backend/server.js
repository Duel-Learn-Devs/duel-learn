import dotenv from "dotenv";
import app from "./index.js";
import { createServer } from "http";
import setupSocket from "./socket.js";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server instance
const server = createServer(app);

// Initialize socket.io
const io = setupSocket(server);

// Export io instance if needed in other parts of your application
export { io };

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server is ready`);
});