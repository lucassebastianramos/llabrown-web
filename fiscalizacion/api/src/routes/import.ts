import { Router } from 'express';
import multer from 'multer';
import * as importController from '../controllers/import.controller.js';
import * as importGenericosController from '../controllers/import.genericos.controller.js';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const name = (file.originalname || '').toLowerCase();
    const okExt = name.endsWith('.xlsx') || name.endsWith('.xls');
    const okMime = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ].includes(file.mimetype);
    if (!okExt || !okMime) return cb(new Error('Formato inválido. Subí un Excel (.xlsx o .xls).'));
    cb(null, true);
  },
});

const handleUpload = (req: any, res: any, next: any) =>
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Archivo demasiado grande (límite 25MB)' });
      }
      return res.status(400).json({ error: err.message || 'Error al procesar el archivo' });
    }
    next();
  });

router.post('/import', handleUpload, importController.importData);
router.post('/import/mesas', handleUpload, importController.importMesas);
router.post('/import/genericos/mesas', handleUpload, importGenericosController.importFiscalesMesaGenericos);
router.post('/import/genericos/fg', handleUpload, importGenericosController.importFiscalesGeneralesGenericos);
router.post('/import/genericos/establecimientos', handleUpload, importGenericosController.importEstablecimientosGenericos);
router.post('/import/genericos/mesas', handleUpload, importGenericosController.importFiscalesMesaGenericos);
router.post('/import/genericos/fg', handleUpload, importGenericosController.importFiscalesGeneralesGenericos);

export default router;