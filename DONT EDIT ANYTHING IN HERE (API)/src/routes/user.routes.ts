import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import { RoleType } from "../models/role.entity";

const router = Router();

// All routes require authentication
router.use(authMiddleware.authenticate);

// router.get("/me", (req, res) =>
//   userController.getUser({ ...req, params: { id: req.user.id } }, res)
// );
router.get("/:id", userController.getUser);
router.get("/", userController.getAllUsers);
router.get("/team-balances", userController.getTeamBalances);
router.get("/:id/direct-reports", userController.getDirectReports);

router.put(
  "/:id",
  validate(userController.updateUserValidation),
  userController.updateUser
);

router.delete(
  "/:id",
  authMiddleware.authorize([RoleType.ADMIN]),
  userController.deleteUser
);

router.post(
  "/:id/role",
  authMiddleware.authorize([RoleType.ADMIN]),
  validate(userController.assignRoleValidation),
  userController.assignRole
);

router.post(
  "/:id/manager",
  authMiddleware.authorize([RoleType.ADMIN]),
  validate(userController.assignManagerValidation),
  userController.assignManager
);

router.post(
  "/:id/leave-balance",
  authMiddleware.authorize([RoleType.ADMIN]),
  validate(userController.updateLeaveBalanceValidation),
  userController.updateLeaveBalance
);

export const userRoutes = router;
