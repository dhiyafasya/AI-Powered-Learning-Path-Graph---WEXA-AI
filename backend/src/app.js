import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import catalogRouter from './routes/catalog.js';
import graphRouter from './routes/graph.js';
import pathRouter from './routes/paths.js';
import userRouter from './routes/users.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.frontendOrigins.includes(origin)) return callback(null, true);
        const err = new Error(`Origin ${origin} not allowed by CORS`);
        err.status = 403;
        return callback(err);
      },
    })
  );
  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api/graph', graphRouter);
  app.use('/api/paths', pathRouter);
  app.use('/api/users', userRouter);

  app.use('/api', notFoundHandler);

  // Graceful error responses for anything above.
  app.use(errorHandler);

  return app;
}
