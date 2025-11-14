// src/controllers/expenseController.ts
import { Request, Response } from "express";
import { db } from "../database/db";
import { expenses } from "../models/expenses";
import { expenseCategories } from "../models/expense-category";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import { ok, fail, makeApiError } from "../../../shared/error";
import { mainAccount } from "../models/main-account";

function toDecimalString(value: any): string | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num.toFixed(2);
}

export const listExpenses = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate, categoryId, minAmount, maxAmount, expenseType } = (req.query || {}) as any;

    const where: any[] = [];

    if (fromDate) {
      const d = new Date(fromDate);
      if (isNaN(d.getTime())) return res.status(400).json(fail(makeApiError('BAD_REQUEST','Invalid fromDate',{status:400})));
      where.push(gte(expenses.expenseDate, d as any));
    }
    if (toDate) {
      const d = new Date(toDate);
      if (isNaN(d.getTime())) return res.status(400).json(fail(makeApiError('BAD_REQUEST','Invalid toDate',{status:400})));
      where.push(lte(expenses.expenseDate, d as any));
    }

    if (categoryId !== undefined && categoryId !== '') {
      const id = Number(categoryId);
      if (!Number.isFinite(id)) return res.status(400).json(fail(makeApiError('BAD_REQUEST','Invalid categoryId',{status:400})));
      where.push(eq(expenses.categoryId, id));
    }

    if (minAmount !== undefined && minAmount !== '') {
      const s = toDecimalString(minAmount);
      if (!s) return res.status(400).json(fail(makeApiError('BAD_REQUEST','Invalid minAmount',{status:400})));
      where.push(gte(expenses.amount, s as any));
    }
    if (maxAmount !== undefined && maxAmount !== '') {
      const s = toDecimalString(maxAmount);
      if (!s) return res.status(400).json(fail(makeApiError('BAD_REQUEST','Invalid maxAmount',{status:400})));
      where.push(lte(expenses.amount, s as any));
    }

    if (expenseType !== undefined && expenseType !== '') {
      const allowed = ['expense','adjustment'] as const;
      if (!allowed.includes(String(expenseType) as any)) {
        return res.status(400).json(fail(makeApiError('BAD_REQUEST','Invalid expenseType',{status:400})));
      }
      where.push(eq(expenses.expenseType, expenseType as any));
    }

    const rows = await db.select().from(expenses).where(where.length ? (and as any)(...where) : undefined as any);
    return res.status(200).json(ok(rows, 'Expenses fetched successfully', 200));
  } catch (err) {
    console.error('listExpenses error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const getExpense = async (req: Request, res: Response) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum)) return res.status(400).json(fail(makeApiError('BAD_REQUEST','Invalid expense id',{status:400})));
    const rows = await db.select().from(expenses).where(eq(expenses.id, idNum)).limit(1);
    if (rows.length === 0) return res.status(404).json(fail(makeApiError('NOT_FOUND','Expense not found',{status:404})));
    return res.status(200).json(ok(rows[0], 'Expense fetched successfully', 200));
  } catch (err) {
    console.error('getExpense error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const { title, categoryId, expenseDate, amount, expenseType, description } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim().length < 1) {
      return res.status(400).json(fail(makeApiError('BAD_REQUEST','title is required',{status:400})));
    }
    const catId = Number(categoryId);
    if (!Number.isFinite(catId)) {
      return res.status(400).json(fail(makeApiError('BAD_REQUEST','categoryId is required',{status:400})));
    }
    if (!expenseDate || isNaN(Date.parse(expenseDate))) {
      return res.status(400).json(fail(makeApiError('BAD_REQUEST','Valid expenseDate is required',{status:400})));
    }
    const amt = toDecimalString(amount);
    if (!amt || Number(amt) < 0) {
      return res.status(400).json(fail(makeApiError('BAD_REQUEST','amount must be >= 0',{status:400})));
    }

    const typeVal = expenseType ? String(expenseType) : 'expense';
    const allowed = ['expense','adjustment'] as const;
    if (!allowed.includes(typeVal as any)) {
      return res.status(400).json(fail(makeApiError('BAD_REQUEST',"expenseType must be 'expense' or 'adjustment'",{status:400})));
    }

    // FK: category exists
    const cat = await db.select({ id: expenseCategories.id }).from(expenseCategories).where(eq(expenseCategories.id, catId)).limit(1);
    if (cat.length === 0) {
      return res.status(400).json(fail(makeApiError('BAD_REQUEST','Expense category not found',{status:400})));
    }

    const created = await db.transaction(async (tx) => {
      const inserted = await tx.insert(expenses).values({
        title: title.trim(),
        categoryId: catId,
        expenseDate: new Date(expenseDate) as any,
        amount: amt,
        expenseType: typeVal as any,
        description: description ? String(description) : null,
      }).returning();

      const exp = inserted[0] as any;

      // Get latest balance
      const last = await tx.select({ balanceAmount: mainAccount.balanceAmount })
        .from(mainAccount)
        .orderBy(desc(mainAccount.createdAt))
        .limit(1);
      const prevBal = last.length ? Number((last[0] as any).balanceAmount) : 0;
      const amtNum = Number(amt);
      const isDebit = typeVal === 'expense';
      const newBal = isDebit ? (prevBal - amtNum) : (prevBal + amtNum);

      await tx.insert(mainAccount).values({
        transactionType: (isDebit ? 'debit' : 'credit') as any,
        sourceType: 'expense' as any,
        sourceId: null,
        referenceId: exp.id,
        transactionAmount: amt,
        balanceAmount: newBal.toFixed(2),
        description: `${isDebit ? 'Expense' : 'Adjustment'}: ${title.trim()}`,
      });

      return exp;
    });

    return res.status(201).json(ok(created, 'Expense created successfully', 201));
  } catch (err) {
    console.error('createExpense error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum)) return res.status(400).json(fail(makeApiError('BAD_REQUEST','Invalid expense id',{status:400})));

    const existing = await db.select().from(expenses).where(eq(expenses.id, idNum)).limit(1);
    if (existing.length === 0) return res.status(404).json(fail(makeApiError('NOT_FOUND','Expense not found',{status:404})));

    const { title, categoryId, expenseDate, amount, expenseType, description } = req.body || {};

    let catId: number | undefined = undefined;
    if (categoryId !== undefined) {
      const v = Number(categoryId);
      if (!Number.isFinite(v)) return res.status(400).json(fail(makeApiError('BAD_REQUEST','Invalid categoryId',{status:400})));
      // FK exists
      const cat = await db.select({ id: expenseCategories.id }).from(expenseCategories).where(eq(expenseCategories.id, v)).limit(1);
      if (cat.length === 0) return res.status(400).json(fail(makeApiError('BAD_REQUEST','Expense category not found',{status:400})));
      catId = v;
    }

    const amt = amount !== undefined ? toDecimalString(amount) : null;
    if (amount !== undefined && (!amt || Number(amt) < 0)) {
      return res.status(400).json(fail(makeApiError('BAD_REQUEST','amount must be >= 0',{status:400})));
    }

    let typeVal: any = undefined;
    if (expenseType !== undefined) {
      const allowed = ['expense','adjustment'] as const;
      if (!allowed.includes(String(expenseType) as any)) {
        return res.status(400).json(fail(makeApiError('BAD_REQUEST',"expenseType must be 'expense' or 'adjustment'",{status:400})));
      }
      typeVal = String(expenseType);
    }

    const updated = await db.update(expenses)
      .set({
        title: title !== undefined ? String(title) : existing[0].title,
        categoryId: catId !== undefined ? catId : (existing[0] as any).categoryId,
        expenseDate: expenseDate !== undefined ? (new Date(expenseDate) as any) : (existing[0] as any).expenseDate,
        amount: amount !== undefined ? amt! : (existing[0] as any).amount,
        expenseType: typeVal !== undefined ? typeVal : (existing[0] as any).expenseType,
        description: description !== undefined ? (description ? String(description) : null) : (existing[0] as any).description,
      })
      .where(eq(expenses.id, idNum))
      .returning();

    return res.status(200).json(ok(updated[0], 'Expense updated successfully', 200));
  } catch (err) {
    console.error('updateExpense error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum)) return res.status(400).json(fail(makeApiError('BAD_REQUEST','Invalid expense id',{status:400})));

    const existing = await db.select().from(expenses).where(eq(expenses.id, idNum)).limit(1);
    if (existing.length === 0) return res.status(404).json(fail(makeApiError('NOT_FOUND','Expense not found',{status:404})));

    await db.delete(expenses).where(eq(expenses.id, idNum));
    return res.status(200).json(ok(null, 'Expense deleted successfully', 200));
  } catch (err) {
    console.error('deleteExpense error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};
