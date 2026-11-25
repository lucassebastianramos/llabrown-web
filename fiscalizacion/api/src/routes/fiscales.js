import { Router } from 'express';
import * as fiscalController from '../controllers/fiscal.controller.js';
const router = Router();
router.get('/fiscales', fiscalController.getFiscales);
router.post('/fiscales', fiscalController.createFiscal);
router.put('/fiscales/:id', fiscalController.updateFiscal);
router.delete('/fiscales/:id', fiscalController.deleteFiscal);
export default router;
//# sourceMappingURL=fiscales.js.map