import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import cors from "cors"; // Import CORS package
import studyMaterialRoutes from "./routes/StudyMaterial.js";
import userRoutes from "./routes/UserAccount.js";
import friendRoutes from "./routes/FriendRoutes.js";
import aiRoutes from './routes/aiRoutes.js';
// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Initialize Express App
const app = express();

const allowedOrigins = [process.env.FRONTEND_URL];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

// Middleware
app.use(express.json());

// Routes
app.use("/api/study-material", studyMaterialRoutes);
app.use("/api/user", userRoutes);
app.use("/api/friend", friendRoutes);
app.use('/api/ai', aiRoutes);

export default app;
