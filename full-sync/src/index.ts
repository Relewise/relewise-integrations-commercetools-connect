import * as dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import bodyParser from 'body-parser';

// Import routes
import SyncRoutes from './routes/sync.routes';

// Import logger
import { logger } from './infrastructure/utils/logger.utils';

import { readConfiguration } from './infrastructure/utils/config.utils';
import { errorMiddleware } from './middleware/error.middleware';

// Read env variables
readConfiguration();

const PORT = 8080;

// Create the express app
const app: Express = express();
app.disable('x-powered-by');

// Define configurations
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/full-sync', SyncRoutes)

// Global error handler
app.use(errorMiddleware);

// Listen the application
const server = app.listen(PORT, () => {
  logger.info(`⚡️ Service application listening on port ${PORT}`);
});

export default server;
