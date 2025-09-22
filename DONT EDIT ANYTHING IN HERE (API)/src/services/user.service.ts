import { Repository } from 'typeorm';
import { User } from '../models/user.entity';
import { Role, RoleType } from '../models/role.entity';
import { dataSource } from '../config/database';
import { logger } from '../config/logger';
import bcrypt from 'bcryptjs';

export class UserService {
  private userRepository: Repository<User>;
  private roleRepository: Repository<Role>;

  constructor() {
    this.userRepository = dataSource.getRepository(User);
    this.roleRepository = dataSource.getRepository(Role);
  }

  async getUserById(id: string): Promise<User> {
    try {
      return await this.userRepository.findOneOrFail({
        where: { id },
        relations: ['role', 'manager', 'directReports']
      });
    } catch (error) {
      logger.error(`Error fetching user with id ${id}`, { error });
      throw new Error('User not found');
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.userRepository.find({
        relations: ['role', 'manager'],
        select: ['id', 'firstName', 'lastName', 'email', 'roleId', 'managerId', 'annualLeaveBalance', 'sickLeaveBalance', 'createdAt', 'updatedAt']
      });
    } catch (error) {
      logger.error('Error fetching all users', { error });
      throw error;
    }
  }

  async getDirectReports(managerId: string): Promise<User[]> {
    try {
      return await this.userRepository.find({
        where: { managerId },
        relations: ['role'],
        select: ['id', 'firstName', 'lastName', 'email', 'roleId', 'annualLeaveBalance', 'sickLeaveBalance']
      });
    } catch (error) {
      logger.error(`Error fetching direct reports for manager ${managerId}`, { error });
      throw error;
    }
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    try {
      const user = await this.userRepository.findOneOrFail({ where: { id } });
      
      // If password is being updated, hash it
      if (userData.password) {
        const salt = bcrypt.genSaltSync(14);
        const hashedPassword = bcrypt.hashSync(userData.password, salt);
        userData.password = hashedPassword;
      }
      
      // Update properties
      Object.assign(user, userData);
      
      return await this.userRepository.save(user);
    } catch (error) {
      logger.error(`Error updating user with id ${id}`, { error });
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const user = await this.userRepository.findOneOrFail({ where: { id } });
      await this.userRepository.remove(user);
    } catch (error) {
      logger.error(`Error deleting user with id ${id}`, { error });
      throw error;
    }
  }

  async assignRole(userId: string, roleId: string): Promise<User> {
    try {
      // Use query builder to update the role directly in the database
      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({ roleId: roleId })
        .where("id = :id", { id: userId })
        .execute();
      
      // Return the user with updated role relation
      return await this.userRepository.findOneOrFail({
        where: { id: userId },
        relations: ['role', 'manager', 'directReports']
      });
    } catch (error) {
      logger.error(`Error assigning role ${roleId} to user ${userId}`, { error });
      throw error;
    }
  }

  async assignManager(userId: string, managerId: string): Promise<User> {
    try {
      const user = await this.userRepository.findOneOrFail({ where: { id: userId } });
      const manager = await this.userRepository.findOneOrFail({ where: { id: managerId }, relations: ['role'] });
      
      // Check if manager has appropriate role
      if (manager.role.name !== RoleType.MANAGER && manager.role.name !== RoleType.ADMIN) {
        throw new Error('Only managers or admins can be assigned as managers');
      }
      
      user.managerId = manager.id;
      
      return await this.userRepository.save(user);
    } catch (error) {
      logger.error(`Error assigning manager ${managerId} to user ${userId}`, { error });
      throw error;
    }
  }

  async updateLeaveBalance(userId: string, annualLeaveChange: number = 0, sickLeaveChange: number = 0): Promise<User> {
    try {
      const user = await this.userRepository.findOneOrFail({ where: { id: userId } });
      
      if (annualLeaveChange) {
        user.annualLeaveBalance = annualLeaveChange;
      }
      
      if (sickLeaveChange) {
        user.sickLeaveBalance = sickLeaveChange;
      }
      
      return await this.userRepository.save(user);
    } catch (error) {
      logger.error(`Error updating leave balance for user ${userId}`, { error });
      throw error;
    }
  }
}