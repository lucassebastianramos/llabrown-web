import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { getAuthUser } from '../lib/auth.js';

const router = Router();

const requireCoordinador = (req: any, res: any, next: any) => {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'coordinador') return res.status(403).json({ error: 'Forbidden' });
  next();
};

router.get('/users', requireCoordinador, userController.list);
router.post('/users', requireCoordinador, userController.create);
router.delete('/users/:id', requireCoordinador, userController.remove);
router.post('/users/:id/reset-password', requireCoordinador, userController.resetPassword);

export default router;