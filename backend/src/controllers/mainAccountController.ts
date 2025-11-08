// src/controllers/mainAccountController.ts
import { Request, Response } from 'express';
import { db } from '../database/db';
import { mainAccount } from '../models/main-account';
import { and, eq, gte, lte } from 'drizzle-orm';
import { ok, fail, makeApiError } from '../../../shared/error';

function toDecimalString(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num.toFixed(2);
}

const allowedTxn = ['debit', 'credit'] as const;
const allowedSrc = ['supplier','customer','expense','supplier_refund','customer_refund','adjustment','other'] as const;

export const listMainAccount = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate, transactionType, sourceType, minAmount, maxAmount, sourceId, referenceId } = (req.query || {}) as any;

    const whereClauses: any[] = [];

    if (fromDate) {
      const d = new Date(fromDate);
      if (isNaN(d.getTime())) {
        const err = makeApiError('BAD_REQUEST', 'Invalid fromDate', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(gte(mainAccount.createdAt, d as any));
    }
    if (toDate) {
      const d = new Date(toDate);
      if (isNaN(d.getTime())) {
        const err = makeApiError('BAD_REQUEST', 'Invalid toDate', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(lte(mainAccount.createdAt, d as any));
    }

    if (transactionType) {
      if (!allowedTxn.includes(String(transactionType) as any)) {
        const err = makeApiError('BAD_REQUEST', 'Invalid transactionType', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(eq(mainAccount.transactionType, transactionType as any));
    }

    if (sourceType) {
      if (!allowedSrc.includes(String(sourceType) as any)) {
        const err = makeApiError('BAD_REQUEST', 'Invalid sourceType', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(eq(mainAccount.sourceType, sourceType as any));
    }

    if (minAmount !== undefined && minAmount !== '') {
      const s = toDecimalString(minAmount);
      if (!s) {
        const err = makeApiError('BAD_REQUEST', 'Invalid minAmount', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(gte(mainAccount.transactionAmount, s as any));
    }
    if (maxAmount !== undefined && maxAmount !== '') {
      const s = toDecimalString(maxAmount);
      if (!s) {
        const err = makeApiError('BAD_REQUEST', 'Invalid maxAmount', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(lte(mainAccount.transactionAmount, s as any));
    }

    if (sourceId !== undefined && sourceId !== '') {
      const id = Number(sourceId);
      if (!Number.isFinite(id)) {
        const err = makeApiError('BAD_REQUEST', 'Invalid sourceId', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(eq(mainAccount.sourceId, id));
    }

    if (referenceId !== undefined && referenceId !== '') {
      const id = Number(referenceId);
      if (!Number.isFinite(id)) {
        const err = makeApiError('BAD_REQUEST', 'Invalid referenceId', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(eq(mainAccount.referenceId, id));
    }

    const rows = await db
      .select()
      .from(mainAccount)
      .where(whereClauses.length > 0 ? and(...whereClauses) : undefined as any);

    return res.status(200).json(ok(rows, 'Main account entries fetched successfully', 200));
  } catch (err) {
    console.error('listMainAccount error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const createMainAccount = async (req: Request, res: Response) => {
  try {
    const { transactionType, sourceType, sourceId, referenceId, transactionAmount, balanceAmount, description } = req.body || {};

    if (!transactionType || !allowedTxn.includes(String(transactionType) as any)) {
      const err = makeApiError('BAD_REQUEST', "transactionType must be 'debit' or 'credit'", { status: 400 });
      return res.status(400).json(fail(err));
    }
    if (!sourceType || !allowedSrc.includes(String(sourceType) as any)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid sourceType', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const amountStr = toDecimalString(transactionAmount);
    const balanceStr = toDecimalString(balanceAmount);
    if (!amountStr) {
      const err = makeApiError('BAD_REQUEST', 'Invalid transactionAmount', { status: 400 });
      return res.status(400).json(fail(err));
    }
    if (!balanceStr) {
      const err = makeApiError('BAD_REQUEST', 'Invalid balanceAmount', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const srcIdNum = sourceId !== undefined && sourceId !== null && sourceId !== '' ? Number(sourceId) : null;
    if (srcIdNum !== null && !Number.isFinite(srcIdNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid sourceId', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const refIdNum = referenceId !== undefined && referenceId !== null && referenceId !== '' ? Number(referenceId) : null;
    if (refIdNum !== null && !Number.isFinite(refIdNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid referenceId', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const inserted = await db.insert(mainAccount).values({
      transactionType: transactionType as any,
      sourceType: sourceType as any,
      sourceId: srcIdNum,
      referenceId: refIdNum,
      transactionAmount: amountStr,
      balanceAmount: balanceStr,
      description: description ? String(description) : null,
    }).returning();

    return res.status(201).json(ok(inserted[0], 'Main account entry created successfully', 201));
  } catch (err) {
    console.error('createMainAccount error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};
