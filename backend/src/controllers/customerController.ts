// src/controllers/customerController.ts
import { Request, Response } from "express";
import { db } from "../database/db";
import { customers } from "../models/customer";
import { eq } from "drizzle-orm";
import { ok, fail, makeApiError } from "../../../shared/error";

export const getCustomers = async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(customers);
    return res.status(200).json(ok(rows, 'Customers fetched successfully', 200));
  } catch (err) {
    console.error('getCustomers error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const getCustomer = async (req: Request, res: Response) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid customer id', { status: 400 });
      return res.status(400).json(fail(err));
    }
    const rows = await db.select().from(customers).where(eq(customers.id, idNum)).limit(1);
    if (rows.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Customer not found', { status: 404 });
      return res.status(404).json(fail(err));
    }
    return res.status(200).json(ok(rows[0], 'Customer fetched successfully', 200));
  } catch (err) {
    console.error('getCustomer error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, contactPerson, address, description } = req.body || {};
    if (!name) {
      const err = makeApiError('BAD_REQUEST', 'Name is required', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const inserted = await db.insert(customers).values({
      name,
      email: email || null,
      phone: phone || null,
      contactPerson: contactPerson || null,
      address: address || null,
      description: description || null,
    }).returning();

    return res.status(201).json(ok(inserted[0], 'Customer created successfully', 201));
  } catch (err) {
    console.error('createCustomer error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid customer id', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const existing = await db.select().from(customers).where(eq(customers.id, idNum)).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Customer not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    const { name, email, phone, contactPerson, address, description } = req.body || {};

    const updated = await db.update(customers).set({
      name: name !== undefined ? name : (existing[0] as any).name,
      email: email !== undefined ? email : (existing[0] as any).email,
      phone: phone !== undefined ? phone : (existing[0] as any).phone,
      contactPerson: contactPerson !== undefined ? contactPerson : (existing[0] as any).contactPerson,
      address: address !== undefined ? address : (existing[0] as any).address,
      description: description !== undefined ? description : (existing[0] as any).description,
    }).where(eq(customers.id, idNum)).returning();

    return res.status(200).json(ok(updated[0], 'Customer updated successfully', 200));
  } catch (err) {
    console.error('updateCustomer error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid customer id', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const existing = await db.select().from(customers).where(eq(customers.id, idNum)).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Customer not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    await db.delete(customers).where(eq(customers.id, idNum));

    return res.status(200).json(ok(null, 'Customer deleted successfully', 200));
  } catch (err) {
    console.error('deleteCustomer error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};
