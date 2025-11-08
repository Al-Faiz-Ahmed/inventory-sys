// src/controllers/supplierTransactionController.ts
import { Request, Response } from "express";
import { db } from "../database/db";
import { suppliers } from "../models/supplier";
import { purchases } from "../models/purchases";
import { supplierTransactions } from "../models/supplier-transactions";
import { mainAccount } from "../models/main-account";
import { eq, and, gte, lte, ilike, desc } from "drizzle-orm";
import { ok, fail, makeApiError } from "../../../shared/error";

const allowedTypes = ['purchase','payment','refund','adjustment'] as const;

function toDecimalString(value: any): string | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num.toFixed(2);
}

export const listSupplierTransactions = async (req: Request, res: Response) => {
  try {
    const supplierId = Number(req.params.supplierId);
    if (!Number.isFinite(supplierId)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid supplier id', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const sup = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
    if (sup.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Supplier not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    const { fromDate, toDate, transactionType, minAmount, maxAmount, search } = (req.query || {}) as any;

    const whereClauses: any[] = [eq(supplierTransactions.supplierId, supplierId)];

    if (fromDate) {
      const d = new Date(fromDate);
      if (isNaN(d.getTime())) {
        const err = makeApiError('BAD_REQUEST', 'Invalid fromDate', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(gte(supplierTransactions.createdAt, d as any));
    }
    if (toDate) {
      const d = new Date(toDate);
      if (isNaN(d.getTime())) {
        const err = makeApiError('BAD_REQUEST', 'Invalid toDate', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(lte(supplierTransactions.createdAt, d as any));
    }

    if (transactionType) {
      if (!allowedTypes.includes(String(transactionType) as any)) {
        const err = makeApiError('BAD_REQUEST', 'Invalid transactionType', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(eq(supplierTransactions.transactionType, transactionType as any));
    }

    if (minAmount !== undefined && minAmount !== '') {
      const s = toDecimalString(minAmount);
      if (!s) {
        const err = makeApiError('BAD_REQUEST', 'Invalid minAmount', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(gte(supplierTransactions.amount, s as any));
    }
    if (maxAmount !== undefined && maxAmount !== '') {
      const s = toDecimalString(maxAmount);
      if (!s) {
        const err = makeApiError('BAD_REQUEST', 'Invalid maxAmount', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(lte(supplierTransactions.amount, s as any));
    }

    if (search && String(search).trim().length > 0) {
      const q = `%${String(search).trim()}%`;
      whereClauses.push(ilike(supplierTransactions.description, q));
    }

    const rows = await db
      .select()
      .from(supplierTransactions)
      .where(whereClauses.length > 1 ? and(...whereClauses) : whereClauses[0]);
    return res.status(200).json(ok(rows, 'Supplier transactions fetched successfully', 200));
  } catch (err) {
    console.error('listSupplierTransactions error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const createSupplierTransaction = async (req: Request, res: Response) => {
  try {
    const supplierId = Number(req.params.supplierId);
    if (!Number.isFinite(supplierId)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid supplier id', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const { transactionType, amount, referenceId, description } = req.body || {};

    if (!transactionType || !allowedTypes.includes(String(transactionType) as any)) {
      const err = makeApiError('BAD_REQUEST', "transactionType must be one of 'purchase','payment','refund','adjustment'", { status: 400 });
      return res.status(400).json(fail(err));
    }

    const amountStr = toDecimalString(amount);
    if (!amountStr || Number(amountStr) < 0) {
      const err = makeApiError('BAD_REQUEST', 'amount must be >= 0', { status: 400 });
      return res.status(400).json(fail(err));
    }

    // ensure supplier exists
    const sup = await db.select({ id: suppliers.id, currentBalance: suppliers.currentBalance, debt: suppliers.debt }).from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
    if (sup.length === 0) {
      const err = makeApiError('BAD_REQUEST', 'Supplier not found', { status: 400 });
      return res.status(400).json(fail(err));
    }

    // if referenceId provided, ensure purchase exists
    let refIdNum: number | null = null;
    if (referenceId !== undefined && referenceId !== null) {
      refIdNum = Number(referenceId);
      if (!Number.isFinite(refIdNum)) {
        const err = makeApiError('BAD_REQUEST', 'Invalid referenceId', { status: 400 });
        return res.status(400).json(fail(err));
      }
      const pur = await db.select({ id: purchases.id }).from(purchases).where(eq(purchases.id, refIdNum)).limit(1);
      if (pur.length === 0) {
        const err = makeApiError('BAD_REQUEST', 'Referenced purchase not found', { status: 400 });
        return res.status(400).json(fail(err));
      }
    }

    const inserted = await db.insert(supplierTransactions).values({
      supplierId,
      transactionType: transactionType as any,
      amount: amountStr,
      referenceId: refIdNum,
      description: description ? String(description) : null,
    }).returning();

    if (transactionType === 'payment' || transactionType === 'refund' || transactionType === 'adjustment') {
      const mainTxnType = transactionType === 'payment' ? 'debit' : 'credit';
      const mainSrcType = transactionType === 'payment' ? 'supplier' : (transactionType === 'refund' ? 'supplier_refund' : 'adjustment');

      const last = await db
        .select({ balanceAmount: mainAccount.balanceAmount })
        .from(mainAccount)
        .orderBy(desc(mainAccount.id))
        .limit(1);
      const prevBalance = last.length > 0 ? Number(last[0].balanceAmount as any) : 0;
      const amtNum = Number(amountStr);
      const newBalance = mainTxnType === 'debit' ? (prevBalance - amtNum) : (prevBalance + amtNum);
      const newBalanceStr = newBalance.toFixed(2);

      await db.insert(mainAccount).values({
        transactionType: mainTxnType as any,
        sourceType: mainSrcType as any,
        sourceId: supplierId,
        referenceId: refIdNum,
        transactionAmount: amountStr,
        balanceAmount: newBalanceStr as any,
        description: description ? String(description) : null,
      });
    }

    const supRow = sup[0] as any;
    const cbNum = Number(supRow.currentBalance);
    const debtNum = Number(supRow.debt);
    const amtNum = Number(amountStr);

    if (transactionType === 'payment') {
      const newDebt = Math.max(0, debtNum - amtNum);
      const newCB = cbNum + amtNum;
      await db.update(suppliers).set({
        currentBalance: newCB.toFixed(2) as any,
        debt: newDebt.toFixed(2) as any,
      }).where(eq(suppliers.id, supplierId));
    } else if (transactionType === 'refund' || transactionType === 'adjustment') {
      const newCB = cbNum + amtNum;
      await db.update(suppliers).set({
        currentBalance: newCB.toFixed(2) as any,
      }).where(eq(suppliers.id, supplierId));
    }

    return res.status(201).json(ok(inserted[0], 'Supplier transaction created successfully', 201));
  } catch (err) {
    console.error('createSupplierTransaction error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const updateSupplierTransaction = async (req: Request, res: Response) => {
  try {
    const supplierId = Number(req.params.supplierId);
    const idNum = Number(req.params.transactionId);
    if (!Number.isFinite(supplierId) || !Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid ids', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const existing = await db.select().from(supplierTransactions).where(and(eq(supplierTransactions.id, idNum), eq(supplierTransactions.supplierId, supplierId))).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Transaction not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    const body = req.body || {};
    const payload: any = {};

    if (body.transactionType !== undefined) {
      if (!allowedTypes.includes(String(body.transactionType) as any)) {
        const err = makeApiError('BAD_REQUEST', 'Invalid transactionType', { status: 400 });
        return res.status(400).json(fail(err));
      }
      payload.transactionType = body.transactionType as any;
    }

    if (body.amount !== undefined) {
      const s = toDecimalString(body.amount);
      if (!s || Number(s) < 0) {
        const err = makeApiError('BAD_REQUEST', 'amount must be >= 0', { status: 400 });
        return res.status(400).json(fail(err));
      }
      payload.amount = s;
    }

    if (body.referenceId !== undefined) {
      if (body.referenceId === null) {
        payload.referenceId = null;
      } else {
        const refIdNum = Number(body.referenceId);
        if (!Number.isFinite(refIdNum)) {
          const err = makeApiError('BAD_REQUEST', 'Invalid referenceId', { status: 400 });
          return res.status(400).json(fail(err));
        }
        const pur = await db.select({ id: purchases.id }).from(purchases).where(eq(purchases.id, refIdNum)).limit(1);
        if (pur.length === 0) {
          const err = makeApiError('BAD_REQUEST', 'Referenced purchase not found', { status: 400 });
          return res.status(400).json(fail(err));
        }
        payload.referenceId = refIdNum;
      }
    }

    if (body.description !== undefined) {
      payload.description = body.description ? String(body.description) : null;
    }

    const updated = await db.update(supplierTransactions).set(payload).where(and(eq(supplierTransactions.id, idNum), eq(supplierTransactions.supplierId, supplierId))).returning();

    return res.status(200).json(ok(updated[0], 'Supplier transaction updated successfully', 200));
  } catch (err) {
    console.error('updateSupplierTransaction error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const deleteSupplierTransaction = async (req: Request, res: Response) => {
  try {
    const supplierId = Number(req.params.supplierId);
    const idNum = Number(req.params.transactionId);
    if (!Number.isFinite(supplierId) || !Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid ids', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const existing = await db.select().from(supplierTransactions).where(and(eq(supplierTransactions.id, idNum), eq(supplierTransactions.supplierId, supplierId))).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Transaction not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    await db.delete(supplierTransactions).where(and(eq(supplierTransactions.id, idNum), eq(supplierTransactions.supplierId, supplierId)));
    return res.status(200).json(ok(null, 'Supplier transaction deleted successfully', 200));
  } catch (err) {
    console.error('deleteSupplierTransaction error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};
