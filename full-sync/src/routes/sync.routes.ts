import { Router } from 'express';
import { syncHandler } from '../controllers/sync.controller';

const syncRouter = Router();

syncRouter.post('/', syncHandler);

export default syncRouter;