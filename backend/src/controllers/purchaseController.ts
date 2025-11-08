// src/controllers/purchaseController.ts
import { Request, Response } from "express";
import { db } from "../database/db";
import { purchases } from "../models/purchases";
import { suppliers } from "../models/supplier";
import { supplierTransactions } from "../models/supplier-transactions";
import { eq, and } from "drizzle-orm";
import { ok, fail, makeApiError } from "../../../shared/error";

function toDecimalString(value: any): string | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num.toFixed(2);
}

export const getPurchases = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.query as { supplierId?: string };
    let rows;
    if (supplierId !== undefined) {
      const sid = Number(supplierId);
      if (!Number.isFinite(sid)) {
        const err = makeApiError('BAD_REQUEST', 'Invalid supplierId', { status: 400 });
        return res.status(400).json(fail(err));
      }
      rows = await db.select().from(purchases).where(eq(purchases.supplierId, sid));
    } else {
      rows = await db.select().from(purchases);
    }
    return res.status(200).json(ok(rows, 'Purchases fetched successfully', 200));
  } catch (err) {
    console.error('getPurchases error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const getPurchase = async (req: Request, res: Response) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid purchase id', { status: 400 });
      return res.status(400).json(fail(err));
    }
    const rows = await db.select().from(purchases).where(eq(purchases.id, idNum)).limit(1);
    if (rows.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Purchase not found', { status: 404 });
      return res.status(404).json(fail(err));
    }
    return res.status(200).json(ok(rows[0], 'Purchase fetched successfully', 200));
  } catch (err) {
    console.error('getPurchase error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const createPurchase = async (req: Request, res: Response) => {
  try {
    const { supplierId, invoiceNumber, date, totalAmount, /* paidAmount, */ status, description } = req.body || {};

    // Basic validation
    const supplierIdNum = Number(supplierId);
    if (!Number.isFinite(supplierIdNum)) {
      const err = makeApiError('BAD_REQUEST', 'supplierId is required', { status: 400 });
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
    // Enforce paid amount to be zero on creation
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

    // FK: supplier exists
    const sup = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.id, supplierIdNum)).limit(1);
    if (sup.length === 0) {
      const err = makeApiError('BAD_REQUEST', 'Supplier not found', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const created = await db.transaction(async (tx) => {
      const inserted = await tx.insert(purchases).values({
        supplierId: supplierIdNum,
        invoiceNumber: String(invoiceNumber).trim(),
        date: new Date(date) as any,
        totalAmount: totalStr,
        paidAmount: paidStr,
        status: status as any,
        description: description ? String(description) : null,
      }).returning();

      const purchase = inserted[0] as any;

      // Create supplier transaction of type 'purchase'
      await tx.insert(supplierTransactions).values({
        supplierId: supplierIdNum,
        transactionType: 'purchase' as any,
        amount: totalStr,
        referenceId: purchase.id,
        description: `regarding ${String(invoiceNumber).trim()}`,
      });

      // Update supplier balances: decrease currentBalance by total, increase debt by total
      const existingSup = await tx.select().from(suppliers).where(eq(suppliers.id, supplierIdNum)).limit(1);
      const cur = existingSup[0] as any;
      const newBalance = (Number(cur.currentBalance) - Number(totalStr)).toFixed(2);
      const newDebt = (Number(cur.debt) + Number(totalStr)).toFixed(2);

      await tx.update(suppliers)
        .set({
          currentBalance: newBalance,
          debt: newDebt,
        })
        .where(eq(suppliers.id, supplierIdNum));

      return purchase;
    });

    return res.status(201).json(ok(created, 'Purchase created successfully', 201));
  } catch (err) {
    console.error('createPurchase error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const updatePurchase = async (req: Request, res: Response) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid purchase id', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const existing = await db.select().from(purchases).where(eq(purchases.id, idNum)).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Purchase not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    const body = req.body || {};

    // If supplierId updated, validate supplier exists
    if (body.supplierId !== undefined) {
      const sid = Number(body.supplierId);
      if (!Number.isFinite(sid)) {
        const err = makeApiError('BAD_REQUEST', 'Invalid supplierId', { status: 400 });
        return res.status(400).json(fail(err));
      }
      const sup = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.id, sid)).limit(1);
      if (sup.length === 0) {
        const err = makeApiError('BAD_REQUEST', 'Supplier not found', { status: 400 });
        return res.status(400).json(fail(err));
      }
    }

    // Build update payload
    const payload: any = {};
    if (body.supplierId !== undefined) payload.supplierId = Number(body.supplierId);
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

    const updated = await db.update(purchases).set(payload).where(eq(purchases.id, idNum)).returning();
    return res.status(200).json(ok(updated[0], 'Purchase updated successfully', 200));
  } catch (err) {
    console.error('updatePurchase error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const deletePurchase = async (req: Request, res: Response) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid purchase id', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const existing = await db.select().from(purchases).where(eq(purchases.id, idNum)).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Purchase not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    await db.delete(purchases).where(eq(purchases.id, idNum));
    return res.status(200).json(ok(null, 'Purchase deleted successfully', 200));
  } catch (err) {
    console.error('deletePurchase error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};
