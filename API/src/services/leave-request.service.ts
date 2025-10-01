import { In, Repository } from "typeorm";
import {
  LeaveRequest,
  LeaveRequestStatus,
} from "../models/leave-request.entity";
import { User } from "../models/user.entity";
import { LeaveType, LeaveTypeCategory } from "../models/leave-type.entity";
import { dataSource } from "../config/database";
import { logger } from "../config/logger";
import {
  ApprovalContext,
  ApprovalStrategyFactory,
} from "../strategies/approval.strategy";
import { Role, RoleType } from "../models/role.entity";

export class LeaveRequestService {
  private leaveRequestRepository: Repository<LeaveRequest>;
  private userRepository: Repository<User>;
  private leaveTypeRepository: Repository<LeaveType>;

  constructor() {
    this.leaveRequestRepository = dataSource.getRepository(LeaveRequest);
    this.userRepository = dataSource.getRepository(User);
    this.leaveTypeRepository = dataSource.getRepository(LeaveType);
  }

  async createLeaveRequest(
    leaveRequestData: Partial<LeaveRequest>,
    userId: string
  ): Promise<LeaveRequest> {
    try {
      const user = await this.userRepository.findOneOrFail({
        where: { id: userId },
      });
      const leaveType = await this.leaveTypeRepository.findOneOrFail({
        where: { id: leaveRequestData.leaveTypeId },
      });

      // Calculate duration in days
      const startDate = new Date(leaveRequestData.startDate);
      const endDate = new Date(leaveRequestData.endDate);
      const durationInDays =
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
        ) + 1;

      // Check if user has enough leave balance
      if (leaveType.deductsBalance) {
        if (
          leaveType.category === LeaveTypeCategory.ANNUAL &&
          user.annualLeaveBalance < durationInDays
        ) {
          throw new Error("Insufficient annual leave balance");
        }
        if (
          leaveType.category === LeaveTypeCategory.SICK &&
          user.sickLeaveBalance < durationInDays
        ) {
          throw new Error("Insufficient sick leave balance");
        }
      }

      const leaveRequest = this.leaveRequestRepository.create({
        ...leaveRequestData,
        userId,
        duration: durationInDays,
        status: LeaveRequestStatus.PENDING,
      });

      return await this.leaveRequestRepository.save(leaveRequest);
    } catch (error) {
      logger.error("Error creating leave request", { error });
      throw error;
    }
  }

  async getLeaveRequestById(id: string): Promise<LeaveRequest> {
    try {
      return await this.leaveRequestRepository.findOneOrFail({
        where: { id },
        relations: ["user", "leaveType", "approvedBy"],
      });
    } catch (error) {
      logger.error(`Error fetching leave request with id ${id}`, { error });
      throw new Error("Leave request not found");
    }
  }

  async getLeaveRequestsByUser(userId: string): Promise<LeaveRequest[]> {
    try {
      return await this.leaveRequestRepository.find({
        where: { userId },
        relations: ["leaveType", "approvedBy"],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      logger.error(`Error fetching leave requests for user ${userId}`, {
        error,
      });
      throw error;
    }
  }

  async getLeaveRequestsForApproval(
    managerId: string
  ): Promise<LeaveRequest[]> {
    try {
      // Get all users who report to this manager
      const directReports = await this.userRepository.find({
        where: { managerId },
      });

      const directReportIds = directReports.map((user) => user.id);

      // Get pending leave requests for these users
      return await this.leaveRequestRepository.find({
        where: {
          userId: In(directReportIds),
          status: LeaveRequestStatus.PENDING,
        },
        relations: ["user", "leaveType"],
        order: { createdAt: "ASC" },
      });
    } catch (error) {
      logger.error(
        `Error fetching leave requests for approval by manager ${managerId}`,
        { error }
      );
      throw error;
    }
  }

  async updateLeaveRequest(
    leaveRequestId: string,
    body: Partial<LeaveRequest>
  ): Promise<LeaveRequest> {
    try {
      const leaveRequest = await this.leaveRequestRepository.findOneOrFail({
        where: { id: leaveRequestId },
      });

      if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
        throw new Error(
          `Cannot update leave request with status ${leaveRequest.status}`
        );
      }

      return await this.leaveRequestRepository.save({
        ...leaveRequest,
        ...body,
      });
    } catch (error) {
      logger.error(`Error updating leave request ${leaveRequestId}`, { error });
      throw error;
    }
  }

  async approveLeaveRequest(
    leaveRequestId: string,
    manager: User,
    comments?: string
  ): Promise<LeaveRequest> {
    try {
      const approverId = manager.id;
      const leaveRequest = await this.leaveRequestRepository.findOneOrFail({
        where: { id: leaveRequestId },
        relations: ["user", "leaveType"],
      });

      const isAdmin =
        manager.role.name === RoleType.ADMIN ||
        (manager["role"] as unknown as string) === RoleType.ADMIN;

      if (leaveRequest.user.managerId !== approverId && !isAdmin) {
          throw new Error(
            "You do not have permission to approve this leave request"
          );
      }

      if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
        throw new Error(
          `Cannot approve leave request with status ${leaveRequest.status}`
        );
      }

      const approver = await this.userRepository.findOneOrFail({
        where: { id: approverId },
        relations: ["role"],
      });

      // Use Strategy pattern to determine if user can approve this request
      const approvalStrategy = ApprovalStrategyFactory.createStrategy(
        approver,
        leaveRequest
      );
      const approvalContext = new ApprovalContext(approvalStrategy);

      if (!approvalContext.canApprove(leaveRequest, approver)) {
        throw new Error(
          "You do not have permission to approve this leave request"
        );
      }

      // Update leave request
      leaveRequest.status = LeaveRequestStatus.APPROVED;
      leaveRequest.approvedById = approverId;
      if (comments) {
        leaveRequest.comments = comments;
      }

      // Deduct from leave balance if applicable
      if (leaveRequest.leaveType.deductsBalance) {
        const user = leaveRequest.user;

        if (leaveRequest.leaveType.category === LeaveTypeCategory.ANNUAL) {
          user.annualLeaveBalance -= leaveRequest.duration;
        } else if (leaveRequest.leaveType.category === LeaveTypeCategory.SICK) {
          user.sickLeaveBalance -= leaveRequest.duration;
        }

        await this.userRepository.save(user);
      }

      return await this.leaveRequestRepository.save(leaveRequest);
    } catch (error) {
      logger.error(`Error approving leave request ${leaveRequestId}`, {
        error,
      });
      throw error;
    }
  }

  async rejectLeaveRequest(
    leaveRequestId: string,
    approverId: string,
    comments?: string
  ): Promise<LeaveRequest> {
    try {
      const leaveRequest = await this.leaveRequestRepository.findOneOrFail({
        where: { id: leaveRequestId },
        relations: ["user", "leaveType"],
      });

      if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
        throw new Error(
          `Cannot reject leave request with status ${leaveRequest.status}`
        );
      }

      const approver = await this.userRepository.findOneOrFail({
        where: { id: approverId },
        relations: ["role"],
      });

      // Use Strategy pattern to determine if user can reject this request
      const approvalStrategy = ApprovalStrategyFactory.createStrategy(
        approver,
        leaveRequest
      );
      const approvalContext = new ApprovalContext(approvalStrategy);

      if (!approvalContext.canApprove(leaveRequest, approver)) {
        throw new Error(
          "You do not have permission to reject this leave request"
        );
      }

      // Update leave request
      leaveRequest.status = LeaveRequestStatus.REJECTED;
      leaveRequest.approvedById = approverId;
      if (comments) {
        leaveRequest.comments = comments;
      }

      return await this.leaveRequestRepository.save(leaveRequest);
    } catch (error) {
      logger.error(`Error rejecting leave request ${leaveRequestId}`, {
        error,
      });
      throw error;
    }
  }

  async cancelLeaveRequest(
    leaveRequestId: string,
    user: User
  ): Promise<LeaveRequest> {
    try {
      const userId = user.id;
      const leaveRequest = await this.leaveRequestRepository.findOneOrFail({
        where: { id: leaveRequestId },
      });

      // Only the owner can cancel their leave request
      if (leaveRequest.userId !== userId) {
        throw new Error("You can only cancel your own leave requests");
      }

      // Can only cancel pending requests
      if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
        throw new Error(
          `Cannot cancel leave request with status ${leaveRequest.status}`
        );
      }

      // Update leave request
      leaveRequest.status = LeaveRequestStatus.CANCELLED;

      return await this.leaveRequestRepository.save(leaveRequest);
    } catch (error) {
      logger.error(`Error cancelling leave request ${leaveRequestId}`, {
        error,
      });
      throw error;
    }
  }

  async getAllLeaveRequests(): Promise<LeaveRequest[]> {
    try {
      return await this.leaveRequestRepository.find({
        relations: ["user", "leaveType", "approvedBy"],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      logger.error("Error fetching all leave requests", { error });
      throw error;
    }
  }

  async deleteLeaveRequest(leaveRequestId: string): Promise<LeaveRequest> {
    try {
      const leaveRequest = await this.leaveRequestRepository.findOneOrFail({
        where: { id: leaveRequestId },
      });

      if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
        throw new Error(
          `Cannot delete leave request with status ${leaveRequest.status}`
        );
      }

      return await this.leaveRequestRepository.remove(leaveRequest);
    } catch (error) {
      logger.error(`Error deleting leave request ${leaveRequestId}`, { error });
      throw error;
    }
  }
}
