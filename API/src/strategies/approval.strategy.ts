import { LeaveRequest, LeaveRequestStatus } from '../models/leave-request.entity';
import { User } from '../models/user.entity';
import { RoleType } from '../models/role.entity';
import { LeaveTypeCategory } from '../models/leave-type.entity';

// Strategy Pattern: Different approval strategies based on role and leave type
export interface ApprovalStrategy {
  canApprove(leaveRequest: LeaveRequest, approver: User): boolean;
}

// Direct manager approval strategy
export class ManagerApprovalStrategy implements ApprovalStrategy {
  canApprove(leaveRequest: LeaveRequest, approver: User): boolean {
    // Manager can approve if they are the direct manager of the requester
    return leaveRequest.user.managerId === approver.id;
  }
}

// Admin approval strategy - can approve any request
export class AdminApprovalStrategy implements ApprovalStrategy {
  canApprove(leaveRequest: LeaveRequest, approver: User): boolean {
    return approver.role.name === RoleType.ADMIN;
  }
}

// Self-approval strategy for certain leave types that don't require manager approval
export class SelfApprovalStrategy implements ApprovalStrategy {
  canApprove(leaveRequest: LeaveRequest, approver: User): boolean {
    return (
      leaveRequest.userId === approver.id && 
      !leaveRequest.leaveType.requiresApproval
    );
  }
}

// Context class that uses the strategies
export class ApprovalContext {
  private strategy: ApprovalStrategy;

  constructor(strategy: ApprovalStrategy) {
    this.strategy = strategy;
  }

  public setStrategy(strategy: ApprovalStrategy): void {
    this.strategy = strategy;
  }

  public canApprove(leaveRequest: LeaveRequest, approver: User): boolean {
    return this.strategy.canApprove(leaveRequest, approver);
  }
}

// Factory to create the appropriate approval strategy based on context
export class ApprovalStrategyFactory {
  public static createStrategy(approver: User, leaveRequest?: LeaveRequest): ApprovalStrategy {
    if (approver.role.name === RoleType.ADMIN) {
      return new AdminApprovalStrategy();
    }
    
    if (approver.role.name === RoleType.MANAGER) {
      return new ManagerApprovalStrategy();
    }
    
    if (leaveRequest && !leaveRequest.leaveType.requiresApproval) {
      return new SelfApprovalStrategy();
    }
    
    // Default case - no approval rights
    return {
      canApprove: () => false
    };
  }
} 