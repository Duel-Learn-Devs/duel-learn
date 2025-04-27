import cors from 'cors'; // Import the cors package

// Use CORS middleware
const corsOptions = {
  origin: '*', // You can specify the allowed origins here
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify the allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify the allowed headers
};

export const corsMiddleware = cors(corsOptions);
