import { Router } from 'express';
import * as escuelaController from '../controllers/escuela.controller.js';

const router = Router();

router.get('/escuelas', escuelaController.getEscuelas);
router.get('/escuelas/:id', escuelaController.getEscuelaById);
router.post('/escuelas', escuelaController.createEscuela);
router.put('/escuelas/:id', escuelaController.updateEscuela);
router.post('/escuelas/geocode-missing', escuelaController.geocodeMissing);
router.delete('/escuelas/:id', escuelaController.deleteEscuela);
router.get('/escuelas/template', escuelaController.downloadTemplate);

export default router;