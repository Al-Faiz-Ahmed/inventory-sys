// src/routes/mainAccountRoutes.ts
import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { listMainAccount, createMainAccount } from '../controllers/mainAccountController';

const router = express.Router();

router.get('/', authenticate, listMainAccount);
router.post('/', authenticate, createMainAccount);

export default router;
