// src/routes/mainAccountRoutes.ts
import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { listMainAccount, createMainAccount, exportMainAccountCSV, exportMainAccountPDF } from '../controllers/mainAccountController';

const router = express.Router();

router.get('/', authenticate, listMainAccount);
router.post('/', authenticate, createMainAccount);
router.post('/main-account', authenticate, listMainAccount);
router.post('/reports/main-account/csv', authenticate, exportMainAccountCSV);
router.post('/reports/main-account/pdf', authenticate, exportMainAccountPDF);

export default router;
