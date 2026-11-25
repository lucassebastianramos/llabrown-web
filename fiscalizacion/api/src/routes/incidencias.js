import { Router } from 'express';
import * as incidenciaController from '../controllers/incidencia.controller.js';
const router = Router();
router.get('/incidencias', incidenciaController.getIncidencias);
router.post('/incidencias', incidenciaController.createIncidencia);
router.put('/incidencias/:id', incidenciaController.updateIncidencia);
router.delete('/incidencias/:id', incidenciaController.deleteIncidencia);
export default router;
//# sourceMappingURL=incidencias.js.map