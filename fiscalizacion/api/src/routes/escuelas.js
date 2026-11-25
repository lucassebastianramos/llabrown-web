import { Router } from 'express';
import * as escuelaController from '../controllers/escuela.controller.js';
const router = Router();
router.get('/escuelas', escuelaController.getEscuelas);
router.post('/escuelas', escuelaController.createEscuela);
router.put('/escuelas/:id', escuelaController.updateEscuela);
export default router;
//# sourceMappingURL=escuelas.js.map