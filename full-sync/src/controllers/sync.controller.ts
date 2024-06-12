import { Request, Response } from 'express';
import { logger } from '../infrastructure/utils/logger.utils';
import CustomError from '../infrastructure/errors/custom.error';

import {
    HTTP_STATUS_SUCCESS_NO_CONTENT,
} from '../infrastructure/constants/http.status';
import { readConfiguration } from '../infrastructure/utils/config.utils';
import { syncProducts } from '../sync';

export const syncHandler = async (request: Request, response: Response) => {
    try {
        const storeKey = readConfiguration().storeKey;
        await syncProducts(storeKey);
    } catch (err: unknown) {
        logger.error(err);

        if (err instanceof CustomError) {
            return response.status(Number(err.statusCode)).send(err);
        }

        return response.status(500).send(err);
    }

    return response.status(HTTP_STATUS_SUCCESS_NO_CONTENT).send();
};