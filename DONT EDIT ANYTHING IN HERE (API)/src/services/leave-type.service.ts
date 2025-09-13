import { Repository } from 'typeorm';
import { LeaveType } from '../models/leave-type.entity';
import { dataSource } from '../config/database';
import { logger } from '../config/logger';
import { LeaveTypeFactory } from '../factories/leave-type.factory';

export class LeaveTypeService {
  private leaveTypeRepository: Repository<LeaveType>;

  constructor() {
    this.leaveTypeRepository = dataSource.getRepository(LeaveType);
  }

  async createLeaveType(leaveTypeData: Partial<LeaveType>): Promise<LeaveType> {
    try {
      const leaveType = this.leaveTypeRepository.create(leaveTypeData);
      return await this.leaveTypeRepository.save(leaveType);
    } catch (error) {
      logger.error('Error creating leave type', { error });
      throw error;
    }
  }

  async getLeaveTypeById(id: string): Promise<LeaveType> {
    try {
      return await this.leaveTypeRepository.findOneOrFail({ where: { id } });
    } catch (error) {
      logger.error(`Error fetching leave type with id ${id}`, { error });
      throw new Error('Leave type not found');
    }
  }

  async getAllLeaveTypes(): Promise<LeaveType[]> {
    try {
      return await this.leaveTypeRepository.find();
    } catch (error) {
      logger.error('Error fetching all leave types', { error });
      throw error;
    }
  }

  async updateLeaveType(id: string, leaveTypeData: Partial<LeaveType>): Promise<LeaveType> {
    try {
      const leaveType = await this.leaveTypeRepository.findOneOrFail({ where: { id } });
      
      // Update properties
      Object.assign(leaveType, leaveTypeData);
      
      return await this.leaveTypeRepository.save(leaveType);
    } catch (error) {
      logger.error(`Error updating leave type with id ${id}`, { error });
      throw error;
    }
  }

  async deleteLeaveType(id: string): Promise<void> {
    try {
      const leaveType = await this.leaveTypeRepository.findOneOrFail({ where: { id } });
      await this.leaveTypeRepository.remove(leaveType);
    } catch (error) {
      logger.error(`Error deleting leave type with id ${id}`, { error });
      throw error;
    }
  }

  // Use the factory to create predefined leave types
  async createDefaultLeaveTypes(): Promise<LeaveType[]> {
    try {
      const annualLeave = LeaveTypeFactory.createAnnualLeave();
      const sickLeave = LeaveTypeFactory.createSickLeave();
      
      return await this.leaveTypeRepository.save([annualLeave, sickLeave]);
    } catch (error) {
      logger.error('Error creating default leave types', { error });
      throw error;
    }
  }
} 