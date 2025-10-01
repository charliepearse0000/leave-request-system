import { Request, Response } from "express";
import { body, param } from "express-validator";
import { UserService } from "../services/user.service";
import { logger } from "../config/logger";
import { validate } from "../middlewares/validation.middleware";
import { RoleType } from "../models/role.entity";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  updateUserValidation = [
    param("id").isUUID().withMessage("Valid user ID is required"),
    body("firstName")
      .optional()
      .notEmpty()
      .withMessage("First name cannot be empty"),
    body("lastName")
      .optional()
      .notEmpty()
      .withMessage("Last name cannot be empty"),
    body("email").optional().isEmail().withMessage("Valid email is required"),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ];

  assignRoleValidation = [
    param("id").isUUID().withMessage("Valid user ID is required"),
    body("roleId").isUUID().withMessage("Valid role ID is required"),
  ];

  assignManagerValidation = [
    param("id").isUUID().withMessage("Valid user ID is required"),
    body("managerId").isUUID().withMessage("Valid manager ID is required"),
  ];

  updateLeaveBalanceValidation = [
    param("id").isUUID().withMessage("Valid user ID is required"),
    body("annualLeaveChange")
      .optional()
      .isNumeric()
      .isInt({ min: 0 })
      .withMessage("Annual leave change must be a positive integer"),
    body("sickLeaveChange")
      .optional()
      .isNumeric()
      .isInt({ min: 0 })
      .withMessage("Sick leave change must be a positive integer"),
  ];

  getUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;

      const user = await this.userService.getUserById(userId);

      // Remove sensitive data
      const { password, ...userWithoutPassword } = user;

      res.status(200).json(userWithoutPassword);
    } catch (error: any) {
      logger.error(`Error fetching user ${req.params.id}`, {
        error,
        requestId: req.requestId,
      });

      if (error.message === "User not found") {
        res.status(404).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: "Internal server error" });
    }
  };

  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      logger.error("Error fetching all users", {
        error,
        requestId: req.requestId,
      });
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getTeamBalances = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userService.getAllUsers();
      // Filter to only return balance-related fields
      const balances = users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        annualLeaveBalance: user.annualLeaveBalance,
        sickLeaveBalance: user.sickLeaveBalance
      }));
      res.status(200).json(balances);
    } catch (error) {
      logger.error("Error fetching team balances", {
        error,
        requestId: req.requestId,
      });
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getDirectReports = async (req: Request, res: Response): Promise<void> => {
    try {
      const managerId = req.params.id;

      // Check if user is requesting their own direct reports or is an admin
      if (managerId === req.user.id || req.user.role === RoleType.ADMIN) {
        const directReports = await this.userService.getDirectReports(
          managerId
        );
        res.status(200).json(directReports);
      } else {
        res.status(403).json({ message: "Insufficient permissions" });
      }
    } catch (error) {
      logger.error(
        `Error fetching direct reports for manager ${req.params.id}`,
        { error, requestId: req.requestId }
      );
      res.status(500).json({ message: "Internal server error" });
    }
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      const userData = req.body;

      // Users can only update their own profile unless they are admin
      if (userId !== req.user.id && req.user.role !== RoleType.ADMIN) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
      }

      const updatedUser = await this.userService.updateUser(userId, userData);

      // Remove sensitive data
      const { password, ...userWithoutPassword } = updatedUser;

      res.status(200).json({
        message: "User updated successfully",
        user: userWithoutPassword,
      });
    } catch (error: any) {
      logger.error(`Error updating user ${req.params.id}`, {
        error,
        requestId: req.requestId,
      });

      if (error.message === "User not found") {
        res.status(404).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: "Internal server error" });
    }
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;

      await this.userService.deleteUser(userId);

      res.status(200).json({
        message: "User deleted successfully",
      });
    } catch (error: any) {
      logger.error(`Error deleting user ${req.params.id}`, {
        error,
        requestId: req.requestId,
      });

      if (error.message === "User not found") {
        res.status(404).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: "Internal server error" });
    }
  };

  assignRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      const { roleId } = req.body;

      const updatedUser = await this.userService.assignRole(userId, roleId);

      res.status(200).json({
        message: "Role assigned successfully",
        user: updatedUser,
      });
    } catch (error: any) {
      console.log('error',error);
      logger.error(`Error assigning role to user ${req.params.id}`, {
        error,
        requestId: req.requestId,
      });

      if (
        error.message === "User not found" ||
        error.message === "Role not found"
      ) {
        res.status(404).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: "Internal server error" });
    }
  };

  assignManager = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      const { managerId } = req.body;

      const updatedUser = await this.userService.assignManager(
        userId,
        managerId
      );

      res.status(200).json({
        message: "Manager assigned successfully",
        user: updatedUser,
      });
    } catch (error: any) {
      logger.error(`Error assigning manager to user ${req.params.id}`, {
        error,
        requestId: req.requestId,
      });

      if (error.message === "User not found") {
        res.status(404).json({ message: error.message });
        return;
      }

      if (
        error.message === "Only managers or admins can be assigned as managers"
      ) {
        res.status(400).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: "Internal server error" });
    }
  };

  updateLeaveBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      const { annualLeaveChange, sickLeaveChange } = req.body;

      const updatedUser = await this.userService.updateLeaveBalance(
        userId,
        Number(annualLeaveChange) || 0,
        Number(sickLeaveChange) || 0
      );

      res.status(200).json({
        message: "Leave balance updated successfully",
        user: {
          id: updatedUser.id,
          annualLeaveBalance: updatedUser.annualLeaveBalance,
          sickLeaveBalance: updatedUser.sickLeaveBalance,
        },
      });
    } catch (error: any) {
      logger.error(`Error updating leave balance for user ${req.params.id}`, {
        error,
        requestId: req.requestId,
      });

      if (error.message === "User not found") {
        res.status(404).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: "Internal server error" });
    }
  };
}

export const userController = new UserController();
