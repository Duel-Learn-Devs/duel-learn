import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const allowedOrigins = [
  process.env.FRONTEND_URL, 'https://duel-learn.vercel.app', 'https://duel-learn-production.up.railway.app',
  'http://localhost:5000',
  'http://localhost:5173',
];

export const corsMiddleware = cors({
  origin: allowedOrigins, // Use array instead of function
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'cache-control', 'pragma'],
  credentials: true,
});
