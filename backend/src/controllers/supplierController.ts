// src/controllers/supplierController.ts
import { Request, Response } from "express";
import { db } from "../database/db";
import { suppliers } from "../models/supplier";
import { eq } from "drizzle-orm";
import { ok, fail, makeApiError } from "../../../shared/error";

export const getSuppliers = async (_req: Request, res: Response) => {
  try {
    const suppliersList = await db.select().from(suppliers);
    return res.status(200).json(ok(suppliersList, 'Suppliers fetched successfully', 200));
  } catch (err) {
    console.error("getSuppliers error:", err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const getSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idNum = Number(id);
    if (!Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid supplier id', { status: 400 });
      return res.status(400).json(fail(err));
    }
    const supplier = await db.select().from(suppliers).where(eq(suppliers.id, idNum)).limit(1);
    
    if (supplier.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Supplier not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    return res.status(200).json(ok(supplier[0], 'Supplier fetched successfully', 200));
  } catch (err) {
    console.error("getSupplier error:", err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, contactPerson, address, description } = req.body || {};
    
    if (!name) {
      const err = makeApiError('BAD_REQUEST', 'Name is required', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const inserted = await db.insert(suppliers).values({
      name,
      email: email || null,
      phone: phone || null,
      contactPerson: contactPerson || null,
      address: address || null,
      description: description || null,
    }).returning();

    return res.status(201).json(ok(inserted[0], 'Supplier created successfully', 201));
  } catch (err) {
    console.error("createSupplier error:", err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idNum = Number(id);
    if (!Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid supplier id', { status: 400 });
      return res.status(400).json(fail(err));
    }
    const { name, email, phone, contactPerson, address, description } = req.body || {};

    // Check if supplier exists
    const existing = await db.select().from(suppliers).where(eq(suppliers.id, idNum)).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Supplier not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    const updated = await db.update(suppliers)
      .set({
        name: name !== undefined ? name : existing[0].name,
        email: email !== undefined ? email : (existing[0] as any).email,
        phone: phone !== undefined ? phone : (existing[0] as any).phone,
        contactPerson: contactPerson !== undefined ? contactPerson : (existing[0] as any).contactPerson,
        address: address !== undefined ? address : (existing[0] as any).address,
        description: description !== undefined ? description : (existing[0] as any).description,
      })
      .where(eq(suppliers.id, idNum))
      .returning();

    return res.status(200).json(ok(updated[0], 'Supplier updated successfully', 200));
  } catch (err) {
    console.error("updateSupplier error:", err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idNum = Number(id);
    if (!Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid supplier id', { status: 400 });
      return res.status(400).json(fail(err));
    }

    // Check if supplier exists
    const existing = await db.select().from(suppliers).where(eq(suppliers.id, idNum)).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Supplier not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    await db.delete(suppliers).where(eq(suppliers.id, idNum));

    return res.status(200).json(ok(null, 'Supplier deleted successfully', 200));
  } catch (err) {
    console.error("deleteSupplier error:", err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

