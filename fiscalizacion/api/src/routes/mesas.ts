import { Router } from 'express';
import * as mesaController from '../controllers/mesa.controller.js';

const router = Router();

router.put('/mesas/:id/fiscal', mesaController.updateMesaFiscal);

// Jornada electoral (solo fiscal de mesa asignado)
router.get('/mesas/:id/jornada', mesaController.getMesaJornada);
router.get('/mesas/me/jornada', mesaController.getMesaJornada);
router.post('/mesas/:id/jornada/open', mesaController.openMesaJornada);
router.post('/mesas/:id/jornada/electores', mesaController.setMesaElectores);
router.post('/mesas/:id/jornada/checkin', mesaController.checkinVotante);
router.post('/mesas/:id/jornada/uncheck', mesaController.uncheckVotante);
router.post('/mesas/:id/jornada/close', mesaController.closeMesaJornada);

// Resultados, acta, alianzas
router.get('/mesas/alianzas', mesaController.getAlianzas);
router.post('/mesas/:id/resultados', mesaController.submitResultados);
router.post('/mesas/:id/acta', mesaController.uploadActa);

export default router;