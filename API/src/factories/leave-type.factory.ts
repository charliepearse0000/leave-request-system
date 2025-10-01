import { LeaveType, LeaveTypeCategory } from '../models/leave-type.entity';

// Factory Pattern: Creates different types of leave types with predefined configurations
export class LeaveTypeFactory {
  public static createAnnualLeave(name: string = 'Annual Leave', description?: string): LeaveType {
    const leaveType = new LeaveType();
    leaveType.name = name;
    leaveType.description = description || 'Regular annual leave';
    leaveType.category = LeaveTypeCategory.ANNUAL;
    leaveType.requiresApproval = true;
    leaveType.deductsBalance = true;
    return leaveType;
  }

  public static createSickLeave(name: string = 'Sick Leave', description?: string): LeaveType {
    const leaveType = new LeaveType();
    leaveType.name = name;
    leaveType.description = description || 'Leave for health-related reasons';
    leaveType.category = LeaveTypeCategory.SICK;
    leaveType.requiresApproval = true;
    leaveType.deductsBalance = true;
    return leaveType;
  }
} 