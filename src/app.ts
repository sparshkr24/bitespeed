import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';

import { connectToDB } from './config/db.js';
import v1Routes, { API_VERSION } from './routes/v1.js';
import middlewares from './middlewares';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectToDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(middlewares.limiter);
app.get('/', middlewares.baseRouteHandler);
app.get('/health', middlewares.healthCheckHandler);

// Main API routes
app.use(API_VERSION, v1Routes);

// Error handling middleware
app.use(middlewares.notFoundHandler);
app.use(middlewares.errorHandler);  

try {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
