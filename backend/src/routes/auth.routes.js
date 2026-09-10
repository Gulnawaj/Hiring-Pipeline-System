import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe);

// GET /api/auth/interviewers
router.get('/interviewers', authenticate, authController.getInterviewers);

// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

export default router;
