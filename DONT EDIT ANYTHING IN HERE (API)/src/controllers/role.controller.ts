import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { RoleService } from '../services/role.service';
import { logger } from '../config/logger';
import { validate } from '../middlewares/validation.middleware';
import { RoleType } from '../models/role.entity';

export class RoleController {
  private roleService: RoleService;

  constructor() {
    this.roleService = new RoleService();
  }

  createRoleValidation = [
    body('name')
      .isIn(Object.values(RoleType))
      .withMessage('Valid role name is required'),
    body('description').notEmpty().withMessage('Description is required')
  ];

  updateRoleValidation = [
    param('id').isUUID().withMessage('Valid role ID is required'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty')
  ];

  // createRole = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     // Only admins can create roles
  //     if (req.user.role !== RoleType.ADMIN) {
  //       res.status(403).json({ message: 'Insufficient permissions' });
  //       return;
  //     }
      
  //     const roleData = req.body;
  //     const role = await this.roleService.createRole(roleData);
      
  //     res.status(201).json({
  //       message: 'Role created successfully',
  //       role
  //     });
  //   } catch (error: any) {
  //     console.log(error);
  //     logger.error('Error creating role', { error, requestId: req.requestId });
  //     res.status(500).json({ message: 'Internal server error' });
  //   }
  // };

  getRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const roleId = req.params.id;
      const role = await this.roleService.getRoleById(roleId);
      
      res.status(200).json(role);
    } catch (error: any) {
      logger.error(`Error fetching role ${req.params.id}`, { error, requestId: req.requestId });
      
      if (error.message === 'Role not found') {
        res.status(404).json({ message: error.message });
        return;
      }
      
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  getAllRoles = async (req: Request, res: Response): Promise<void> => {
    try {
      const roles = await this.roleService.getAllRoles();
      res.status(200).json(roles);
    } catch (error: any) {
      logger.error('Error fetching all roles', { error, requestId: req.requestId });
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  updateRole = async (req: Request, res: Response): Promise<void> => {
    try {
      // Only admins can update roles
      if (req.user.role !== RoleType.ADMIN) {
        res.status(403).json({ message: 'Insufficient permissions' });
        return;
      }
      
      const roleId = req.params.id;
      const roleData = req.body;
      
      // Prevent changing the role name
      if (roleData.name) {
        delete roleData.name;
      }
      
      const role = await this.roleService.updateRole(roleId, roleData);
      
      res.status(200).json({
        message: 'Role updated successfully',
        role
      });
    } catch (error: any) {
      logger.error(`Error updating role ${req.params.id}`, { error, requestId: req.requestId });
      
      if (error.message === 'Role not found') {
        res.status(404).json({ message: error.message });
        return;
      }
      
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  createDefaultRoles = async (req: Request, res: Response): Promise<void> => {
    try {
      // Only admins can create default roles
      if (req.user.role !== RoleType.ADMIN) {
        res.status(403).json({ message: 'Insufficient permissions' });
        return;
      }
      
      const roles = await this.roleService.createDefaultRoles();
      
      res.status(201).json({
        message: 'Default roles created successfully',
        roles
      });
    } catch (error: any) {
      logger.error('Error creating default roles', { error, requestId: req.requestId });
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}

export const roleController = new RoleController(); 