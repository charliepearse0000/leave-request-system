import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { logger } from '../config/logger';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Check for validation errors
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }
    
    // Log validation errors
    logger.warn('Validation error', { 
      errors: errors.array(),
      path: req.path,
      method: req.method,
    });
    
    // Return validation errors
    res.status(400).json({
      status: 400,
      message: 'Validation error',
      errors: errors.array()
    });
  };
}; 