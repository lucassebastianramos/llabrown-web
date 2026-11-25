import { Router } from 'express';
import multer from 'multer';
import * as importController from '../controllers/import.controller.js';
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
router.post('/import', upload.single('file'), importController.importData);
export default router;
//# sourceMappingURL=import.js.map