import { Router } from 'express';
import { roleController } from '../controllers/role.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { RoleType } from '../models/role.entity';

const router = Router();

// All routes require authentication
router.use(authMiddleware.authenticate);

router.get('/:id', roleController.getRole);
router.get('/', roleController.getAllRoles);

router.put(
  '/:id',
  authMiddleware.authorize([RoleType.ADMIN]),
  validate(roleController.updateRoleValidation),
  roleController.updateRole
);

router.post(
  "/create-defaults",
  authMiddleware.authorize([RoleType.ADMIN]),
  roleController.createDefaultRoles
);

export const roleRoutes = router;
