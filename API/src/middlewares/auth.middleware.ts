import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';



export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Add request ID for correlation
      req.requestId = req.headers['x-request-id'] as string || uuidv4();
      
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = this.authService.verifyToken(token);
        req.user = decoded;
        next();
      } catch (error) {
        logger.error('Invalid token', { error, requestId: req.requestId });
        res.status(401).json({ message: 'Invalid token' });
      }
    } catch (error) {
      logger.error('Authentication error', { error, requestId: req.requestId });
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          res.status(401).json({ message: 'Authentication required' });
          return;
        }
      
        if (!roles.includes(req.user.role)) {
          logger.warn('Unauthorized access attempt', { 
            userId: req.user.id, 
            requiredRoles: roles, 
            userRole: req.user.role,
            requestId: req.requestId
          });
          res.status(403).json({ message: 'Insufficient permissions' });
          return;
        }
        
        next();
      } catch (error) {
        logger.error('Authorization error', { error, requestId: req.requestId });
        res.status(500).json({ message: 'Internal server error' });
      }
    };
  };
}

export const authMiddleware = new AuthMiddleware(); 