import dotenv from "dotenv";
import app from "./index.js";
import { createServer } from "http";
import setupSocket from "./socket.js";
import aiRoutes from './routes/aiRoutes.js'; // Use import instead of require

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server instance
const server = createServer(app);

// Initialize socket.io
const io = setupSocket(server);

// Use aiRoutes
app.use('/api/ai', aiRoutes);

// Export io instance if needed in other parts of your application
export { io };

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server is ready`);
});