import * as dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { logger } from './infrastructure/utils/logger.utils';
import { readConfiguration } from './infrastructure/utils/config.utils';

readConfiguration();

const PORT = 8080;
const app = createApp();
const server = app.listen(PORT, () => {
  logger.info(`Job application listening on port ${PORT}`);
});

export default server;
