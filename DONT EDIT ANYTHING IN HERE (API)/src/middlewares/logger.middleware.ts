import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Add request ID for correlation if not already present
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  
  // Add request ID to response headers
  res.setHeader('x-request-id', req.requestId);
  
  const startTime = Date.now();
  
  // Log request
  logger.info(`Request received: ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  // Capture response
  const originalSend = res.send;
  res.send = function(body): Response {
    const responseTime = Date.now() - startTime;
    
    // Log response
    logger.info(`Response sent: ${req.method} ${req.path} ${res.statusCode}`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      requestId: req.requestId
    });
    
    return originalSend.call(this, body);
  };
  
  next();
}; 