// src/routes/expenseCategoryRoutes.ts
import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { listExpenseCategories, getExpenseCategory, createExpenseCategory, updateExpenseCategory, deleteExpenseCategory } from '../controllers/expenseCategoryController';

const router = express.Router();

router.get('/', authenticate, listExpenseCategories);
router.get('/:id', authenticate, getExpenseCategory);
router.post('/', authenticate, createExpenseCategory);
router.put('/:id', authenticate, updateExpenseCategory);
router.delete('/:id', authenticate, deleteExpenseCategory);

export default router;
