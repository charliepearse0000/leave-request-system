import { Request, Response } from "express";
import { body, param } from "express-validator";
import { LeaveRequestService } from "../services/leave-request.service";
import { logger } from "../config/logger";
import { RoleType } from "../models/role.entity";

export class LeaveRequestController {
  private leaveRequestService: LeaveRequestService;

  constructor() {
    this.leaveRequestService = new LeaveRequestService();
  }

  createLeaveRequestValidation = [
    body("leaveTypeId").isUUID().withMessage("Valid leave type ID is required"),
    body("startDate")
      .isISO8601()
      .toDate()
      .withMessage("Valid start date is required"),
    body("endDate")
      .isISO8601()
      .toDate()
      .withMessage("Valid end date is required"),
    body("reason").optional().isString().withMessage("Reason must be a string"),
  ];

  updateLeaveRequestValidation = [
    body("leaveTypeId")
      .optional()
      .isUUID()
      .withMessage("Valid leave type ID is required"),
    body("startDate")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Valid start date is required"),
    body("endDate")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Valid end date is required"),
    body("reason").optional().isString().withMessage("Reason must be a string"),
  ];

  approveRejectValidation = [
    param("id").isUUID().withMessage("Valid leave request ID is required"),
    body("comments")
      .optional()
      .isString()
      .withMessage("Comments must be a string"),
  ];

  createLeaveRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaveRequestData = req.body;
      const userId = req.user.id;

      const leaveRequest = await this.leaveRequestService.createLeaveRequest(
        leaveRequestData,
        userId
      );

      res.status(201).json({
        message: "Leave request created successfully",
        leaveRequest,
      });
    } catch (error: any) {
      logger.error("Error creating leave request", {
        error,
        userId: req.user.id,
        requestId: req.requestId,
      });

      if (error.message.includes("Insufficient")) {
        res.status(400).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: "Internal server error" });
    }
  };

  getLeaveRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaveRequestId = req.params.id;
      const leaveRequest = await this.leaveRequestService.getLeaveRequestById(
        leaveRequestId
      );

      // Check if user has permission to view this leave request
      if (
        leaveRequest.userId === req.user.id || // Own request
        leaveRequest.user.managerId === req.user.id || // Direct report's request
        req.user.role === RoleType.ADMIN // Admin can view all
      ) {
        res.status(200).json(leaveRequest);
      } else {
        res.status(403).json({ message: "Insufficient permissions" });
      }
    } catch (error: any) {
      logger.error(`Error fetching leave request ${req.params.id}`, {
        error,
        requestId: req.requestId,
      });

      if (error.message === "Leave request not found") {
        res.status(404).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: "Internal server error" });
    }
  };

  getUserLeaveRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId || req.user.id;

      // Check if user has permission to view these leave requests
      if (
        userId === req.user.id || // Own requests
        req.user.role === RoleType.ADMIN // Admin can view all
      ) {
        const leaveRequests =
          await this.leaveRequestService.getLeaveRequestsByUser(userId);
        res.status(200).json(leaveRequests);
      } else {
        res.status(403).json({ message: "Insufficient permissions" });
      }
    } catch (error: any) {
      logger.error(
        `Error fetching leave requests for user ${
          req.params.userId || req.user.id
        }`,
        { error, requestId: req.requestId }
      );
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getLeaveRequestsForApproval = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const managerId = req.user.id;

      const leaveRequests =
        await this.leaveRequestService.getLeaveRequestsForApproval(managerId);
      res.status(200).json(leaveRequests);
    } catch (error: any) {
      logger.error(
        `Error fetching leave requests for approval by manager ${req.user.id}`,
        { error, requestId: req.requestId }
      );
      res.status(500).json({ message: "Internal server error" });
    }
  };

  updateLeaveRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaveRequestId = req.params.id;

      const leaveRequest = await this.leaveRequestService.updateLeaveRequest(
        leaveRequestId,
        req.body
      );

      res.status(200).json({
        message: "Leave request updated successfully",
        leaveRequest,
      });
    } catch (error: any) {
      logger.error(`Error updatingA leave request ${req.params.id}`, {
        error,
        requestId: req.requestId,
      });

      if (error.message.startsWith("Cannot update")) {
        res.status(403).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: "Internal server error" });
    }
  };

  approveLeaveRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaveRequestId = req.params.id;
      const approver = req.user;
      const { comments } = req.body;

      const leaveRequest = await this.leaveRequestService.approveLeaveRequest(
        leaveRequestId,
        approver,
        comments
      );

      res.status(200).json({
        message: "Leave request approved successfully",
        leaveRequest,
      });
    } catch (error: any) {
      logger.error(`Error approving leave request ${req.params.id}`, {
        error,
        approverId: req.user.id,
        requestId: req.requestId,
      });

      if (
        error.message.includes("permission") ||
        error.message.includes("status")
      ) {
        res.status(400).json({ message: error.message });
        return;
      }

      if (error.message === "Leave request not found") {
        res.status(404).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: "Internal server error" });
    }
  };

  rejectLeaveRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaveRequestId = req.params.id;
      const approverId = req.user.id;
      const { comments } = req.body;

      const leaveRequest = await this.leaveRequestService.rejectLeaveRequest(
        leaveRequestId,
        approverId,
        comments
      );

      res.status(200).json({
        message: "Leave request rejected successfully",
        leaveRequest,
      });
    } catch (error: any) {
      logger.error(`Error rejecting leave request ${req.params.id}`, {
        error,
        approverId: req.user.id,
        requestId: req.requestId,
      });

      if (
        error.message.includes("permission") ||
        error.message.includes("status")
      ) {
        res.status(400).json({ message: error.message });
        return;
      }

      if (error.message === "Leave request not found") {
        res.status(404).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: "Internal server error" });
    }
  };

  cancelLeaveRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaveRequestId = req.params.id;
      const user = req.user;

      const leaveRequest = await this.leaveRequestService.cancelLeaveRequest(
        leaveRequestId,
        user
      );

      res.status(200).json({
        message: "Leave request cancelled successfully",
        leaveRequest,
      });
    } catch (error: any) {
      logger.error(`Error cancelling leave request ${req.params.id}`, {
        error,
        userId: req.user.id,
        requestId: req.requestId,
      });

      if (error.message.includes("own") || error.message.includes("status")) {
        res.status(400).json({ message: error.message });
        return;
      }

      if (error.message === "Leave request not found") {
        res.status(404).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: "Internal server error" });
    }
  };

  getAllLeaveRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaveRequests =
        await this.leaveRequestService.getAllLeaveRequests();
      res.status(200).json(leaveRequests);
    } catch (error: any) {
      logger.error("Error fetching all leave requests", {
        error,
        requestId: req.requestId,
      });
      res.status(500).json({ message: "Internal server error" });
    }
  };

  deleteLeaveRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaveRequestId = req.params.id;

      const leaveRequest = await this.leaveRequestService.deleteLeaveRequest(
        leaveRequestId
      );

      res.status(200).json({
        message: "Leave request deleted successfully",
        leaveRequest,
      });
    } catch (error: any) {
      logger.error(`Error deleting leave request ${req.params.id}`, {
        error,
        userId: req.user.id,
        requestId: req.requestId,
      });

      res.status(500).json({ message: "Internal server error" });
    }
  };
}

export const leaveRequestController = new LeaveRequestController();
