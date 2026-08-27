import { type NextFunction, type Request, type Response } from 'express';
import { HTTP_STATUS_SUCCESS_NO_CONTENT } from '../infrastructure/constants/http.status';
import { readConfiguration } from '../infrastructure/utils/config.utils';
import { syncProducts } from '../sync';

export const syncHandler = async (
  _request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const storeKey = readConfiguration().storeKey;
    await syncProducts(storeKey);

    return response.status(HTTP_STATUS_SUCCESS_NO_CONTENT).send();
  } catch (error: unknown) {
    next(error);
  }
};
