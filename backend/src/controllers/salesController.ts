// src/controllers/salesController.ts
import { Request, Response } from "express";
import { db } from "../database/db";
import { sales } from "../models/sales";
import { customers } from "../models/customer";
import { customerTransactions } from "../models/customer-transactions";
import { desc, eq } from "drizzle-orm";
import { ok, fail, makeApiError } from "../../../shared/error";

function toDecimalString(value: any): string | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num.toFixed(2);
}

export const getSales = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.query as { customerId?: string };
    let rows;
    const orderByClause = desc(sales.date);
    if (customerId !== undefined) {
      const cid = Number(customerId);
      if (!Number.isFinite(cid)) {
        const err = makeApiError('BAD_REQUEST', 'Invalid customerId', { status: 400 });
        return res.status(400).json(fail(err));
      }
      rows = await db.select().from(sales).where(eq(sales.customerId, cid)).orderBy(orderByClause);
    } else {
      rows = await db.select().from(sales).orderBy(orderByClause);
    }
    return res.status(200).json(ok(rows, 'Sales fetched successfully', 200));
  } catch (err) {
    console.error('getSales error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const getSale = async (req: Request, res: Response) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid sale id', { status: 400 });
      return res.status(400).json(fail(err));
    }
    const rows = await db.select().from(sales).where(eq(sales.id, idNum)).limit(1);
    if (rows.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Sale not found', { status: 404 });
      return res.status(404).json(fail(err));
    }
    return res.status(200).json(ok(rows[0], 'Sale fetched successfully', 200));
  } catch (err) {
    console.error('getSale error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const createSale = async (req: Request, res: Response) => {
  try {
    const { customerId, invoiceNumber, date, totalAmount, status, description } = req.body || {};

    const customerIdNum = Number(customerId);
    if (!Number.isFinite(customerIdNum)) {
      const err = makeApiError('BAD_REQUEST', 'customerId is required', { status: 400 });
      return res.status(400).json(fail(err));
    }
    if (!invoiceNumber || typeof invoiceNumber !== 'string' || invoiceNumber.trim().length < 1) {
      const err = makeApiError('BAD_REQUEST', 'invoiceNumber is required', { status: 400 });
      return res.status(400).json(fail(err));
    }
    if (!date || isNaN(Date.parse(date))) {
      const err = makeApiError('BAD_REQUEST', 'Valid date is required', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const totalStr = toDecimalString(totalAmount);
    const paidStr = toDecimalString(0);
    if (!totalStr || Number(totalStr) < 0) {
      const err = makeApiError('BAD_REQUEST', 'totalAmount must be >= 0', { status: 400 });
      return res.status(400).json(fail(err));
    }
    if (!paidStr || Number(paidStr) < 0) {
      const err = makeApiError('BAD_REQUEST', 'paidAmount must be >= 0', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const allowedStatus = ['paid','unpaid','partial'] as const;
    if (!status || !allowedStatus.includes(String(status) as any)) {
      const err = makeApiError('BAD_REQUEST', "status must be one of 'paid','unpaid','partial'", { status: 400 });
      return res.status(400).json(fail(err));
    }

    const cust = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, customerIdNum)).limit(1);
    if (cust.length === 0) {
      const err = makeApiError('BAD_REQUEST', 'Customer not found', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const created = await db.transaction(async (tx) => {
      const inserted = await tx.insert(sales).values({
        customerId: customerIdNum,
        invoiceNumber: String(invoiceNumber).trim(),
        date: new Date(date) as any,
        totalAmount: totalStr,
        paidAmount: paidStr,
        status: status as any,
        description: description ? String(description) : null,
      }).returning();

      const sale = inserted[0] as any;

      // Create customer transaction of type 'sale'
      await tx.insert(customerTransactions).values({
        customerId: customerIdNum,
        transactionType: 'sale' as any,
        amount: totalStr,
        referenceId: sale.id,
        description: `regarding ${String(invoiceNumber).trim()}`,
      });

      // Update customer balances: increase currentBalance and receivable by total
      const existingCust = await tx.select().from(customers).where(eq(customers.id, customerIdNum)).limit(1);
      const cur = existingCust[0] as any;
      const newBalance = (Number(cur.currentBalance) + Number(totalStr)).toFixed(2);
      const newRecv = (Number(cur.receivable) + Number(totalStr)).toFixed(2);

      await tx.update(customers)
        .set({
          currentBalance: newBalance,
          receivable: newRecv,
        })
        .where(eq(customers.id, customerIdNum));

      return sale;
    });

    return res.status(201).json(ok(created, 'Sale created successfully', 201));
  } catch (err) {
    console.error('createSale error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const updateSale = async (req: Request, res: Response) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid sale id', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const existing = await db.select().from(sales).where(eq(sales.id, idNum)).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Sale not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    const body = req.body || {};
    const payload: any = {};

    if (body.customerId !== undefined) {
      const cid = Number(body.customerId);
      if (!Number.isFinite(cid)) {
        const err = makeApiError('BAD_REQUEST', 'Invalid customerId', { status: 400 });
        return res.status(400).json(fail(err));
      }
      const cust = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, cid)).limit(1);
      if (cust.length === 0) {
        const err = makeApiError('BAD_REQUEST', 'Customer not found', { status: 400 });
        return res.status(400).json(fail(err));
      }
      payload.customerId = cid;
    }

    if (body.invoiceNumber !== undefined) payload.invoiceNumber = String(body.invoiceNumber);
    if (body.date !== undefined) {
      if (!body.date || isNaN(Date.parse(body.date))) {
        const err = makeApiError('BAD_REQUEST', 'Invalid date', { status: 400 });
        return res.status(400).json(fail(err));
      }
      payload.date = new Date(body.date) as any;
    }
    if (body.totalAmount !== undefined) {
      const s = toDecimalString(body.totalAmount);
      if (!s || Number(s) < 0) {
        const err = makeApiError('BAD_REQUEST', 'totalAmount must be >= 0', { status: 400 });
        return res.status(400).json(fail(err));
      }
      payload.totalAmount = s;
    }
    if (body.paidAmount !== undefined) {
      const s = toDecimalString(body.paidAmount);
      if (!s || Number(s) < 0) {
        const err = makeApiError('BAD_REQUEST', 'paidAmount must be >= 0', { status: 400 });
        return res.status(400).json(fail(err));
      }
      payload.paidAmount = s;
    }
    if (body.status !== undefined) {
      const allowedStatus = ['paid','unpaid','partial'] as const;
      if (!allowedStatus.includes(String(body.status) as any)) {
        const err = makeApiError('BAD_REQUEST', "status must be one of 'paid','unpaid','partial'", { status: 400 });
        return res.status(400).json(fail(err));
      }
      payload.status = body.status as any;
    }
    if (body.description !== undefined) payload.description = body.description ? String(body.description) : null;

    const updated = await db.update(sales).set(payload).where(eq(sales.id, idNum)).returning();
    return res.status(200).json(ok(updated[0], 'Sale updated successfully', 200));
  } catch (err) {
    console.error('updateSale error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const deleteSale = async (req: Request, res: Response) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid sale id', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const existing = await db.select().from(sales).where(eq(sales.id, idNum)).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Sale not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    await db.delete(sales).where(eq(sales.id, idNum));
    return res.status(200).json(ok(null, 'Sale deleted successfully', 200));
  } catch (err) {
    console.error('deleteSale error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};
