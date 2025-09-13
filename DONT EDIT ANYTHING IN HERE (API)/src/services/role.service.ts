import { Repository } from 'typeorm';
import { Role, RoleType } from '../models/role.entity';
import { dataSource } from '../config/database';
import { logger } from '../config/logger';

export class RoleService {
  private roleRepository: Repository<Role>;

  constructor() {
    this.roleRepository = dataSource.getRepository(Role);
  }

  // async createRole(roleData: Partial<Role>): Promise<Role> {
  //   try {
  //     const role = this.roleRepository.create(roleData);
  //     return await this.roleRepository.save(role);
  //   } catch (error) {
  //     logger.error('Error creating role', { error });
  //     throw error;
  //   }
  // }

  async getRoleById(id: string): Promise<Role> {
    try {
      return await this.roleRepository.findOneOrFail({ where: { id } });
    } catch (error) {
      logger.error(`Error fetching role with id ${id}`, { error });
      throw new Error('Role not found');
    }
  }

  async getAllRoles(): Promise<Role[]> {
    try {
      return await this.roleRepository.find();
    } catch (error) {
      logger.error('Error fetching all roles', { error });
      throw error;
    }
  }

  async updateRole(id: string, roleData: Partial<Role>): Promise<Role> {
    try {
      const role = await this.roleRepository.findOneOrFail({ where: { id } });
      
      Object.assign(role, roleData);
      
      return await this.roleRepository.save(role);
    } catch (error) {
      logger.error(`Error updating role with id ${id}`, { error });
      throw error;
    }
  }
  async createDefaultRoles(): Promise<Role[]> {
    try {
      const adminRole = this.roleRepository.create({
        name: RoleType.ADMIN,
        description: 'Administrator with full access to all features'
      });
      
      const managerRole = this.roleRepository.create({
        name: RoleType.MANAGER,
        description: 'Manager with access to approve leave requests for direct reports'
      });
      
      const employeeRole = this.roleRepository.create({
        name: RoleType.EMPLOYEE,
        description: 'Regular employee with basic access'
      });
      
      return await this.roleRepository.save([adminRole, managerRole, employeeRole]);
    } catch (error) {
      logger.error('Error creating default roles', { error });
      throw error;
    }
  }
} 