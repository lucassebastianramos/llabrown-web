import { Router } from 'express';
import * as fiscalController from '../controllers/fiscal.controller.js';

const router = Router();

router.get('/fiscales', fiscalController.getFiscales);
router.get('/fiscales/backup', fiscalController.getFiscalesBackup);
router.post('/fiscales', fiscalController.createFiscal);
router.put('/fiscales/:id', fiscalController.updateFiscal);
router.delete('/fiscales/:id', fiscalController.deleteFiscal);

// New: manage school assignments for a user
router.get('/fiscales/:id/asignaciones', fiscalController.getUserAsignaciones);
router.post('/fiscales/:id/asignaciones', fiscalController.setUserAsignaciones);

export default router;