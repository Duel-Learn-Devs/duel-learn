import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import cors from 'cors';  // Import CORS package
import studyMaterialRoutes from './routes/StudyMaterial.js';
const userRoutes = require('./routes/UserAccount'); // Import user routes

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Initialize Express App
const app = express();

// Enable CORS for all routes (you can adjust this to be more specific)
app.use(cors({
    origin: 'http://localhost:5173',
}
));

// Middleware 
app.use(express.json());

// Routes
app.use('/api/study-material', studyMaterialRoutes);
app.use('/api/user', userRoutes); // Use user routes

export default app;