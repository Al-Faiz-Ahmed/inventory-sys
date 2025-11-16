// src/controllers/customerTransactionController.ts
import { Request, Response } from "express";
import { db } from "../database/db";
import { customers } from "../models/customer";
import { sales } from "../models/sales";
import { customerTransactions } from "../models/customer-transactions";
import { mainAccount } from "../models/main-account";
import { eq, and, gte, lte, ilike, desc } from "drizzle-orm";
import { ok, fail, makeApiError } from "../../../shared/error";

const allowedTypes = ['sale','payment','refund','adjustment'] as const;

function toDecimalString(value: any): string | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num.toFixed(2);
}

export const listCustomerTransactions = async (req: Request, res: Response) => {
  try {
    const customerId = Number(req.params.customerId);
    if (!Number.isFinite(customerId)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid customer id', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const cust = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, customerId)).limit(1);
    if (cust.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Customer not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    const { fromDate, toDate, transactionType, minAmount, maxAmount, search } = (req.query || {}) as any;

    const whereClauses: any[] = [eq(customerTransactions.customerId, customerId)];

    if (fromDate) {
      const d = new Date(fromDate);
      if (isNaN(d.getTime())) {
        const err = makeApiError('BAD_REQUEST', 'Invalid fromDate', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(gte(customerTransactions.createdAt, d as any));
    }
    if (toDate) {
      const d = new Date(toDate);
      if (isNaN(d.getTime())) {
        const err = makeApiError('BAD_REQUEST', 'Invalid toDate', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(lte(customerTransactions.createdAt, d as any));
    }

    if (transactionType) {
      if (!allowedTypes.includes(String(transactionType) as any)) {
        const err = makeApiError('BAD_REQUEST', 'Invalid transactionType', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(eq(customerTransactions.transactionType, transactionType as any));
    }

    if (minAmount !== undefined && minAmount !== '') {
      const s = toDecimalString(minAmount);
      if (!s) {
        const err = makeApiError('BAD_REQUEST', 'Invalid minAmount', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(gte(customerTransactions.amount, s as any));
    }
    if (maxAmount !== undefined && maxAmount !== '') {
      const s = toDecimalString(maxAmount);
      if (!s) {
        const err = makeApiError('BAD_REQUEST', 'Invalid maxAmount', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(lte(customerTransactions.amount, s as any));
    }

    if (search && String(search).trim().length > 0) {
      const q = `%${String(search).trim()}%`;
      whereClauses.push(ilike(customerTransactions.description, q));
    }

    const rows = await db
      .select()
      .from(customerTransactions)
      .where(whereClauses.length > 1 ? and(...whereClauses) : whereClauses[0]);
    return res.status(200).json(ok(rows, 'Customer transactions fetched successfully', 200));
  } catch (err) {
    console.error('listCustomerTransactions error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const createCustomerTransaction = async (req: Request, res: Response) => {
  try {
    const customerId = Number(req.params.customerId);
    if (!Number.isFinite(customerId)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid customer id', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const { transactionType, amount, referenceId, description } = req.body || {};

    if (!transactionType || !allowedTypes.includes(String(transactionType) as any)) {
      const err = makeApiError('BAD_REQUEST', "transactionType must be one of 'sale','payment','refund','adjustment'", { status: 400 });
      return res.status(400).json(fail(err));
    }

    const amountStr = toDecimalString(amount);
    if (!amountStr || Number(amountStr) < 0) {
      const err = makeApiError('BAD_REQUEST', 'amount must be >= 0', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const cust = await db.select({ id: customers.id, currentBalance: customers.currentBalance, receivable: customers.receivable }).from(customers).where(eq(customers.id, customerId)).limit(1);
    if (cust.length === 0) {
      const err = makeApiError('BAD_REQUEST', 'Customer not found', { status: 400 });
      return res.status(400).json(fail(err));
    }

    let refIdNum: number | null = null;
    if (referenceId !== undefined && referenceId !== null) {
      refIdNum = Number(referenceId);
      if (!Number.isFinite(refIdNum)) {
        const err = makeApiError('BAD_REQUEST', 'Invalid referenceId', { status: 400 });
        return res.status(400).json(fail(err));
      }
      const s = await db.select({ id: sales.id }).from(sales).where(eq(sales.id, refIdNum)).limit(1);
      if (s.length === 0) {
        const err = makeApiError('BAD_REQUEST', 'Referenced sale not found', { status: 400 });
        return res.status(400).json(fail(err));
      }
    }

    const row = cust[0] as any;
    const cbNum = Number(row.currentBalance);
    const recvNum = Number(row.receivable);
    const amtNum = Number(amountStr);

    let newCB = cbNum;
    let newRecv = recvNum;

    if (transactionType === 'payment') {
      // payment: decrease both balance and receivable
      newRecv = recvNum - amtNum;
      newCB = cbNum - amtNum;
    } else if (transactionType === 'refund') {
      // refund: we pay customer -> decrease both balance and receivable
      newRecv = recvNum - amtNum;
      newCB = cbNum - amtNum;
    } else if (transactionType === 'adjustment') {
      // adjustment for wrong payment: increase both balance and receivable
      newRecv = recvNum + amtNum;
      newCB = cbNum + amtNum;
    }

    const newCBStr = newCB.toFixed(2);
    const newRecvStr = newRecv.toFixed(2);

    

    const inserted = await db.insert(customerTransactions).values({
      customerId,
      transactionType: transactionType as any,
      amount: amountStr,
      balanceAmount: (transactionType === 'payment' || transactionType === 'refund' || transactionType === 'adjustment') ? (newCBStr as any) : undefined,
      referenceId: refIdNum,
      description: description ? String(description) : null,
    }).returning();

    // main account mapping per requirements:
    // payment = credit (increase main balance), refund = debit (decrease main balance), adjustment = debit (decrease main balance)
    if (transactionType === 'payment' || transactionType === 'refund' || transactionType === 'adjustment') {
      const mainTxnType = (transactionType === 'payment') ? 'credit' : 'debit';
      const mainSrcType = transactionType === 'payment' ? 'customer' : (transactionType === 'refund' ? 'customer_refund' : 'adjustment');

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
        sourceId: customerId,
        referenceId: refIdNum,
        transactionAmount: amountStr,
        balanceAmount: newBalanceStr as any,
        description: description ? String(description) : null,
      });
    }

    if (transactionType === 'payment' || transactionType === 'refund' || transactionType === 'adjustment') {
      await db.update(customers).set({
        currentBalance: newCBStr as any,
        receivable: newRecvStr as any,
      }).where(eq(customers.id, customerId));
    }

    return res.status(201).json(ok(inserted[0], 'Customer transaction created successfully', 201));
  } catch (err) {
    console.error('createCustomerTransaction error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const updateCustomerTransaction = async (req: Request, res: Response) => {
  try {
    const customerId = Number(req.params.customerId);
    const idNum = Number(req.params.transactionId);
    if (!Number.isFinite(customerId) || !Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid ids', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const existing = await db.select().from(customerTransactions).where(and(eq(customerTransactions.id, idNum), eq(customerTransactions.customerId, customerId))).limit(1);
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
        const s = await db.select({ id: sales.id }).from(sales).where(eq(sales.id, refIdNum)).limit(1);
        if (s.length === 0) {
          const err = makeApiError('BAD_REQUEST', 'Referenced sale not found', { status: 400 });
          return res.status(400).json(fail(err));
        }
        payload.referenceId = refIdNum;
      }
    }

    if (body.description !== undefined) {
      payload.description = body.description ? String(body.description) : null;
    }

    const updated = await db.update(customerTransactions).set(payload).where(and(eq(customerTransactions.id, idNum), eq(customerTransactions.customerId, customerId))).returning();

    return res.status(200).json(ok(updated[0], 'Customer transaction updated successfully', 200));
  } catch (err) {
    console.error('updateCustomerTransaction error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const deleteCustomerTransaction = async (req: Request, res: Response) => {
  try {
    const customerId = Number(req.params.customerId);
    const idNum = Number(req.params.transactionId);
    if (!Number.isFinite(customerId) || !Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid ids', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const existing = await db.select().from(customerTransactions).where(and(eq(customerTransactions.id, idNum), eq(customerTransactions.customerId, customerId))).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Transaction not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    await db.delete(customerTransactions).where(and(eq(customerTransactions.id, idNum), eq(customerTransactions.customerId, customerId)));
    return res.status(200).json(ok(null, 'Customer transaction deleted successfully', 200));
  } catch (err) {
    console.error('deleteCustomerTransaction error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};
