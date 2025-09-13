import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { LeaveTypeService } from '../services/leave-type.service';
import { logger } from '../config/logger';
import { LeaveTypeCategory } from '../models/leave-type.entity';

export class LeaveTypeController {
  private leaveTypeService: LeaveTypeService;

  constructor() {
    this.leaveTypeService = new LeaveTypeService();
  }

  createLeaveTypeValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('category')
      .isIn(Object.values(LeaveTypeCategory))
      .withMessage('Valid category is required'),
    body('requiresApproval').isBoolean().withMessage('Requires approval must be a boolean'),
    body('deductsBalance').isBoolean().withMessage('Deducts balance must be a boolean'),
    body('description').optional().isString().withMessage('Description must be a string')
  ];

  updateLeaveTypeValidation = [
    param('id').isUUID().withMessage('Valid leave type ID is required'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('category')
      .optional()
      .isIn(Object.values(LeaveTypeCategory))
      .withMessage('Valid category is required'),
    body('requiresApproval').optional().isBoolean().withMessage('Requires approval must be a boolean'),
    body('deductsBalance').optional().isBoolean().withMessage('Deducts balance must be a boolean'),
    body('description').optional().isString().withMessage('Description must be a string')
  ];

  createLeaveType = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaveTypeData = req.body;
      const leaveType = await this.leaveTypeService.createLeaveType(leaveTypeData);
      
      res.status(201).json({
        message: 'Leave type created successfully',
        leaveType
      });
    } catch (error: any) {
      logger.error('Error creating leave type', { error, requestId: req.requestId });
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  getLeaveType = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaveTypeId = req.params.id;
      const leaveType = await this.leaveTypeService.getLeaveTypeById(leaveTypeId);
      
      res.status(200).json(leaveType);
    } catch (error: any) {
      logger.error(`Error fetching leave type ${req.params.id}`, { error, requestId: req.requestId });
      
      if (error.message === 'Leave type not found') {
        res.status(404).json({ message: error.message });
        return;
      }
    }
  };

  getAllLeaveTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaveTypes = await this.leaveTypeService.getAllLeaveTypes();
      res.status(200).json(leaveTypes);
    } catch (error: any) {
      logger.error('Error fetching all leave types', { error, requestId: req.requestId });
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  updateLeaveType = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaveTypeId = req.params.id;
      const leaveTypeData = req.body;
      
      const leaveType = await this.leaveTypeService.updateLeaveType(leaveTypeId, leaveTypeData);
      
      res.status(200).json({
        message: 'Leave type updated successfully',
        leaveType
      });
    } catch (error: any) {
      logger.error(`Error updating leave type ${req.params.id}`, { error, requestId: req.requestId });
      
      if (error.message === 'Leave type not found') {
        res.status(404).json({ message: error.message });
        return;
      }
    }
  };

  deleteLeaveType = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaveTypeId = req.params.id;
      
      await this.leaveTypeService.deleteLeaveType(leaveTypeId);
      
      res.status(200).json({
        message: 'Leave type deleted successfully'
      });
    } catch (error: any) {
      logger.error(`Error deleting leave type ${req.params.id}`, { error, requestId: req.requestId });
      
      if (error.message === 'Leave type not found') {
        res.status(404).json({ message: error.message });
        return;
      }
    }
  };

  createDefaultLeaveTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaveTypes = await this.leaveTypeService.createDefaultLeaveTypes();
      
      res.status(201).json({
        message: 'Default leave types created successfully',
        leaveTypes
      });
    } catch (error: any) {
      logger.error('Error creating default leave types', { error, requestId: req.requestId });
    }
  };
}

export const leaveTypeController = new LeaveTypeController(); 