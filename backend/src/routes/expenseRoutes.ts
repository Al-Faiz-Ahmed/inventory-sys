// src/routes/expenseRoutes.ts
import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { listExpenses, getExpense, createExpense, updateExpense, deleteExpense } from '../controllers/expenseController';

const router = express.Router();

router.get('/', authenticate, listExpenses);
router.get('/:id', authenticate, getExpense);
router.post('/', authenticate, createExpense);
router.put('/:id', authenticate, updateExpense);
router.delete('/:id', authenticate, deleteExpense);

export default router;
