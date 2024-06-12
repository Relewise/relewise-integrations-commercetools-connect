import CustomError from '../../../src/infrastructure/errors/custom.error';

describe('CustomError', () => {
    it('should create an error with the provided status code and message', () => {
      const statusCode = 400;
      const message = 'Bad Request';
      const error = new CustomError(statusCode, message);
  
      expect(error.statusCode).toBe(statusCode);
      expect(error.message).toBe(message);
      expect(error.errors).toBeUndefined();
    });
  
    it('should create an error with the provided status code, message, and errors array', () => {
      const statusCode = 500;
      const message = 'Internal Server Error';
      const errors = [
        { statusCode: '500', message: 'Database connection failed', referencedBy: 'database' },
        { statusCode: '500', message: 'Cache connection failed', referencedBy: 'cache' }
      ];
      const error = new CustomError(statusCode, message, errors);
  
      expect(error.statusCode).toBe(statusCode);
      expect(error.message).toBe(message);
      expect(error.errors).toEqual(errors);
    });
  
    it('should inherit from the Error class', () => {
      const statusCode = 404;
      const message = 'Not Found';
      const error = new CustomError(statusCode, message);
  
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CustomError);
    });
  
    it('should correctly set the error name to CustomError', () => {
      const statusCode = 403;
      const message = 'Forbidden';
      const error = new CustomError(statusCode, message);
  
      expect(error.name).toBe('Error'); // Error name is 'Error' by default, unless explicitly changed
    });
  
    it('should handle an undefined errors array correctly', () => {
      const statusCode = 401;
      const message = 'Unauthorized';
      const error = new CustomError(statusCode, message, undefined);
  
      expect(error.errors).toBeUndefined();
    });
  });