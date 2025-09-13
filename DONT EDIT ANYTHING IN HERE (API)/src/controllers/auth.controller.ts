import { Request, Response } from 'express';
import { body } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { RoleService } from '../services/role.service';
import { logger } from '../config/logger';
import { validate } from '../middlewares/validation.middleware';
import { RoleType } from '../models/role.entity';

export class AuthController {
  private authService: AuthService;
  private userService: UserService;
  private roleService: RoleService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
    this.roleService = new RoleService();
  }

  registerValidation = [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ];

  loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ];

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { firstName, lastName, email, password } = req.body;
      
      // Get default employee role
      const roles = await this.roleService.getAllRoles();
      const employeeRole = roles.find(role => role.name === RoleType.EMPLOYEE);
      
      if (!employeeRole) {
        throw new Error('Default employee role not found');
      }
      
      const userData = {
        firstName,
        lastName,
        email,
        password,
        roleId: employeeRole.id
      };
      
      const user = await this.authService.register(userData as any);
      
      logger.info('User registered successfully', { 
        userId: user.id,
        email: user.email,
        requestId: req.requestId
      });
      
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      });
    } catch (error: any) {
      logger.error('Registration error', { error, requestId: req.requestId });
      
      if (error.message === 'User with this email already exists') {
        res.status(400).json({ message: error.message });
        return;
      }
      
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      
      const { user, token } = await this.authService.login(email, password);
      
      logger.info('User logged in successfully', { 
        userId: user.id,
        email: user.email,
        requestId: req.requestId
      });
      
      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role?.name
        }
      });
    } catch (error: any) {
      logger.error('Login error', { error, email: req.body.email, requestId: req.requestId });
      
      if (error.message === 'Invalid credentials') {
        res.status(401).json({ message: error.message });
        return;
      }
      
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}

export const authController = new AuthController(); 