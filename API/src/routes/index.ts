import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { leaveRequestRoutes } from './leave-request.routes';
import { leaveTypeRoutes } from './leave-type.routes';
import { roleRoutes } from './role.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/leave-requests', leaveRequestRoutes);
router.use('/leave-types', leaveTypeRoutes);
router.use('/roles', roleRoutes);

export const routes = router; 