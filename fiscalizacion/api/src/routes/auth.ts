import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/request-reset', authController.requestReset);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authController.me);

// New security endpoints
router.post('/first-login', authController.firstLoginSetup);
router.post('/verify-2fa', authController.verify2FA);
router.get('/security-questions', authController.securityQuestions);
router.post('/verify-security-answers', authController.verifySecurityAnswers);
router.get('/policy', authController.getPolicy);
router.post('/policy', authController.updatePolicy);

export default router;