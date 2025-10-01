import { Router } from 'express';
import { leaveRequestController } from '../controllers/leave-request.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { RoleType } from '../models/role.entity';

const router = Router();

router.use(authMiddleware.authenticate);

router.post(
  '/',
  validate(leaveRequestController.createLeaveRequestValidation),
  leaveRequestController.createLeaveRequest
);

router.get("/me", leaveRequestController.getUserLeaveRequests);
router.get(
  "/for-approval",
  authMiddleware.authorize([RoleType.ADMIN, RoleType.MANAGER]),
  leaveRequestController.getLeaveRequestsForApproval
);
router.get("/all", authMiddleware.authorize([RoleType.ADMIN]), leaveRequestController.getAllLeaveRequests);
router.get("/:id", leaveRequestController.getLeaveRequest);
router.get("/user/:userId", leaveRequestController.getUserLeaveRequests);

router.put('/:id', validate(leaveRequestController.updateLeaveRequestValidation), leaveRequestController.updateLeaveRequest);

router.post(
  '/:id/approve',
  authMiddleware.authorize([RoleType.ADMIN, RoleType.MANAGER]),
  validate(leaveRequestController.approveRejectValidation),
  leaveRequestController.approveLeaveRequest
);

router.post(
  '/:id/reject',
  authMiddleware.authorize([RoleType.ADMIN, RoleType.MANAGER]),
  validate(leaveRequestController.approveRejectValidation),
  leaveRequestController.rejectLeaveRequest
);

router.post('/:id/cancel', leaveRequestController.cancelLeaveRequest);

router.delete('/:id', authMiddleware.authorize([RoleType.ADMIN]), leaveRequestController.deleteLeaveRequest);

export const leaveRequestRoutes = router; 