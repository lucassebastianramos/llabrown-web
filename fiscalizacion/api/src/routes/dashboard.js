import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
const router = Router();
router.get('/dashboard', dashboardController.getDashboardData);
export default router;
//# sourceMappingURL=dashboard.js.map