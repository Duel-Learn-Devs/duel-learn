import dotenv from "dotenv";
import app from "./index.js";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
