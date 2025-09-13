import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.post(
  '/register',
  validate(authController.registerValidation),
  authController.register
);

router.post(
  '/login',
  validate(authController.loginValidation),
  authController.login
);

export const authRoutes = router; 