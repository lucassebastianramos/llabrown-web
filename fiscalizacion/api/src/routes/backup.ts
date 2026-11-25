import { Router } from 'express';
import * as backupController from '../controllers/backup.controller.js';

const router = Router();

router.get('/backup/snapshot', backupController.snapshot);
router.get('/backup/export/:entity', backupController.exportCSV);

export default router;
