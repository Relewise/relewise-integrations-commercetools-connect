import express, { type Express } from 'express';
import { errorMiddleware } from './middleware/error.middleware';
import SyncRoutes from './routes/sync.routes';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use('/full-sync', SyncRoutes);
  app.use(errorMiddleware);

  return app;
}
