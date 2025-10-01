import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export class HttpException extends Error {
  status: number;
  message: string;
  
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.message = message;
  }
}

export const errorMiddleware = (
  error: HttpException,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const status = error.status || 500;
  const message = error.message || 'Something went wrong';
  
  logger.error(`Error: ${message}`, { 
    status, 
    path: req.path, 
    method: req.method,
    requestId: req.requestId,
    stack: error.stack
  });
  
  res.status(status).json({
    status,
    message,
    requestId: req.requestId
  });
}; 