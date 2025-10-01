import { DataSource } from "typeorm";
import { User } from "../../models/user.entity";
import {
  LeaveRequest,
  LeaveRequestStatus,
} from "../../models/leave-request.entity";
import { Role, RoleType } from "../../models/role.entity";
import { LeaveType, LeaveTypeCategory } from "../../models/leave-type.entity";
import bcrypt from "bcryptjs";

export class UserLeaveRequestsSeeder {
  constructor(private dataSource: DataSource) {}

  async run() {
    try {
      console.log("Executing UserLeaveRequestsSeeder");
      const roleRepo = this.dataSource.getRepository(Role);
      const leaveTypeRepo = this.dataSource.getRepository(LeaveType);
  
      // Check if roles already exist
      let adminRole = await roleRepo.findOne({ where: { name: RoleType.ADMIN } });
      if (!adminRole) {
        adminRole = await roleRepo.save({
          name: RoleType.ADMIN,
          description: "Administrator role",
        });
      }
  
      let managerRole = await roleRepo.findOne({ where: { name: RoleType.MANAGER } });
      if (!managerRole) {
        managerRole = await roleRepo.save({
          name: RoleType.MANAGER,
          description: "Manager role",
        });
      }
  
      let employeeRole = await roleRepo.findOne({ where: { name: RoleType.EMPLOYEE } });
      if (!employeeRole) {
        employeeRole = await roleRepo.save({
          name: RoleType.EMPLOYEE,
          description: "Regular employee role",
        });
      }
  
      // Check if leave types already exist
      let annualLeave = await leaveTypeRepo.findOne({ where: { name: "Annual Leave" } });
      if (!annualLeave) {
        annualLeave = await leaveTypeRepo.save({
          name: "Annual Leave",
          category: LeaveTypeCategory.ANNUAL,
          description: "Regular annual leave",
        });
      }
  
      let sickLeave = await leaveTypeRepo.findOne({ where: { name: "Sick Leave" } });
      if (!sickLeave) {
        sickLeave = await leaveTypeRepo.save({
          name: "Sick Leave",
          category: LeaveTypeCategory.SICK,
          description: "Medical leave",
        });
      }
  
      const userRepo = this.dataSource.getRepository(User);
      console.log('userRepo in seeder')
      const salt = bcrypt.genSaltSync(14);
      const hashedPassword = bcrypt.hashSync("password123", salt);

      console.log('hashed', hashedPassword)
  
      // Check if users already exist
      let ceo = await userRepo.findOne({ where: { email: "john.smith@company.com" } });
      if (!ceo) {
        ceo = await userRepo.save({
          firstName: "John",
          lastName: "Smith",
          email: "john.smith@company.com",
          password: hashedPassword,
          roleId: adminRole.id,
          annualLeaveBalance: 25,
          sickLeaveBalance: 15,
        });
      }
  
      let manager1 = await userRepo.findOne({ where: { email: "sarah.johnson@company.com" } });
      if (!manager1) {
        manager1 = await userRepo.save({
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah.johnson@company.com",
          password: hashedPassword,
          managerId: ceo.id,
          roleId: managerRole.id,
          annualLeaveBalance: 22,
          sickLeaveBalance: 12,
        });
      }
  
      let manager2 = await userRepo.findOne({ where: { email: "michael.brown@company.com" } });
      if (!manager2) {
        manager2 = await userRepo.save({
          firstName: "Michael",
          lastName: "Brown",
          email: "michael.brown@company.com",
          password: hashedPassword,
          managerId: ceo.id,
          roleId: managerRole.id,
          annualLeaveBalance: 22,
          sickLeaveBalance: 12,
        });
      }
  
      let employee1 = await userRepo.findOne({ where: { email: "emma.davis@company.com" } });
      if (!employee1) {
        employee1 = await userRepo.save({
          firstName: "Emma",
          lastName: "Davis",
          email: "emma.davis@company.com",
          password: hashedPassword,
          managerId: manager1.id,
          roleId: employeeRole.id,
          annualLeaveBalance: 20,
          sickLeaveBalance: 10,
        });
      }
  
      let employee2 = await userRepo.findOne({ where: { email: "james.wilson@company.com" } });
      if (!employee2) {
        employee2 = await userRepo.save({
          firstName: "James",
          lastName: "Wilson",
          email: "james.wilson@company.com",
          password: hashedPassword,
          managerId: manager1.id,
          roleId: employeeRole.id,
          annualLeaveBalance: 20,
          sickLeaveBalance: 10,
        });
      }
  
      let employee3 = await userRepo.findOne({ where: { email: "lisa.anderson@company.com" } });
      if (!employee3) {
        employee3 = await userRepo.save({
          firstName: "Lisa",
          lastName: "Anderson",
          email: "lisa.anderson@company.com",
          password: hashedPassword,
          managerId: manager2.id,
          roleId: employeeRole.id,
          annualLeaveBalance: 20,
          sickLeaveBalance: 10,
        });
      }
  
      const leaveRequestRepo = this.dataSource.getRepository(LeaveRequest);
  
      // Check if leave requests already exist
      const existingRequest1 = await leaveRequestRepo.findOne({
        where: {
          userId: employee1.id,
          startDate: new Date("2024-03-15"),
          endDate: new Date("2024-03-20")
        }
      });
  
      if (!existingRequest1) {
        await leaveRequestRepo.save({
          userId: employee1.id,
          leaveTypeId: annualLeave.id,
          startDate: new Date("2024-03-15"),
          endDate: new Date("2024-03-20"),
          duration: 4,
          reason: "Vacation",
          status: LeaveRequestStatus.APPROVED,
          approvedById: manager1.id,
        });
      }
  
      const existingRequest2 = await leaveRequestRepo.findOne({
        where: {
          userId: employee2.id,
          startDate: new Date("2024-04-01"),
          endDate: new Date("2024-04-05")
        }
      });
  
      if (!existingRequest2) {
        await leaveRequestRepo.save({
          userId: employee2.id,
          leaveTypeId: annualLeave.id,
          startDate: new Date("2024-04-01"),
          endDate: new Date("2024-04-05"),
          duration: 3,
          reason: "Family trip",
          status: LeaveRequestStatus.PENDING,
        });
      }
  
      const existingRequest3 = await leaveRequestRepo.findOne({
        where: {
          userId: employee3.id,
          startDate: new Date("2024-03-10"),
          endDate: new Date("2024-03-12")
        }
      });
  
      if (!existingRequest3) {
        await leaveRequestRepo.save({
          userId: employee3.id,
          leaveTypeId: sickLeave.id,
          startDate: new Date("2024-03-10"),
          endDate: new Date("2024-03-12"),
          duration: 2,
          reason: "Medical appointment",
          status: LeaveRequestStatus.APPROVED,
          approvedById: manager2.id,
        });
      }
    } catch (error) {
      console.log("SOMETHING WENT WRONG");
      console.log(error);
    }
  }
}
