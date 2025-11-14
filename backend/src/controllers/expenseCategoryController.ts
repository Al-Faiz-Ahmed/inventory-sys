// src/controllers/expenseCategoryController.ts
import { Request, Response } from "express";
import { db } from "../database/db";
import { expenseCategories } from "../models/expense-category";
import { eq } from "drizzle-orm";
import { ok, fail, makeApiError } from "../../../shared/error";

export const listExpenseCategories = async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(expenseCategories);
    return res.status(200).json(ok(rows, 'Expense categories fetched successfully', 200));
  } catch (err) {
    console.error('listExpenseCategories error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const getExpenseCategory = async (req: Request, res: Response) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid category id', { status: 400 });
      return res.status(400).json(fail(err));
    }
    const rows = await db.select().from(expenseCategories).where(eq(expenseCategories.id, idNum)).limit(1);
    if (rows.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Category not found', { status: 404 });
      return res.status(404).json(fail(err));
    }
    return res.status(200).json(ok(rows[0], 'Expense category fetched successfully', 200));
  } catch (err) {
    console.error('getExpenseCategory error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const createExpenseCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length < 1) {
      const err = makeApiError('BAD_REQUEST', 'name is required', { status: 400 });
      return res.status(400).json(fail(err));
    }
    const inserted = await db.insert(expenseCategories).values({
      name: name.trim(),
      description: description ? String(description) : null,
    }).returning();
    return res.status(201).json(ok(inserted[0], 'Expense category created successfully', 201));
  } catch (err) {
    console.error('createExpenseCategory error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const updateExpenseCategory = async (req: Request, res: Response) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid category id', { status: 400 });
      return res.status(400).json(fail(err));
    }
    const { name, description } = req.body || {};

    const existing = await db.select().from(expenseCategories).where(eq(expenseCategories.id, idNum)).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Category not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    const updated = await db.update(expenseCategories)
      .set({
        name: name !== undefined ? String(name) : existing[0].name,
        description: description !== undefined ? String(description) : (existing[0] as any).description,
      })
      .where(eq(expenseCategories.id, idNum))
      .returning();

    return res.status(200).json(ok(updated[0], 'Expense category updated successfully', 200));
  } catch (err) {
    console.error('updateExpenseCategory error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const deleteExpenseCategory = async (req: Request, res: Response) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid category id', { status: 400 });
      return res.status(400).json(fail(err));
    }

    // Ensure exists
    const existing = await db.select().from(expenseCategories).where(eq(expenseCategories.id, idNum)).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Category not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    await db.delete(expenseCategories).where(eq(expenseCategories.id, idNum));
    return res.status(200).json(ok(null, 'Expense category deleted successfully', 200));
  } catch (err) {
    console.error('deleteExpenseCategory error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};
