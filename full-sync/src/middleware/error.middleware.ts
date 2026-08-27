import { type NextFunction, type Request, type Response } from 'express';
import CustomError from '../infrastructure/errors/custom.error';
import { logger } from '../infrastructure/utils/logger.utils';

/**
 * Middleware for error handling
 * @param error The error object
 * @param req The express request
 * @param res The Express response
 * @param next
 * @returns
 */
export const errorMiddleware = (
  error: unknown,
  _request: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(error);

  if (error instanceof CustomError) {
    if (typeof error.statusCode === 'number') {
      return res.status(error.statusCode).json({
        message: error.message,
        errors: error.errors,
      });
    }
  }

  return res.status(500).json({ message: 'Internal server error' });
};
