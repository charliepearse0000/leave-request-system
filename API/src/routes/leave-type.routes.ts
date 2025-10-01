import { Router } from 'express';
import { leaveTypeController } from '../controllers/leave-type.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { RoleType } from '../models/role.entity';

const router = Router();

// All routes require authentication
router.use(authMiddleware.authenticate);

router.post(
  '/',
  authMiddleware.authorize([RoleType.ADMIN]),
  validate(leaveTypeController.createLeaveTypeValidation),
  leaveTypeController.createLeaveType
);

router.get('/:id', leaveTypeController.getLeaveType);
router.get('/', leaveTypeController.getAllLeaveTypes);

router.put(
  '/:id',
  authMiddleware.authorize([RoleType.ADMIN]),
  validate(leaveTypeController.updateLeaveTypeValidation),
  leaveTypeController.updateLeaveType
);

router.delete(
  '/:id',
  authMiddleware.authorize([RoleType.ADMIN]),
  leaveTypeController.deleteLeaveType
);

router.post(
  '/create-defaults',
  authMiddleware.authorize([RoleType.ADMIN]),
  leaveTypeController.createDefaultLeaveTypes
);

export const leaveTypeRoutes = router; 