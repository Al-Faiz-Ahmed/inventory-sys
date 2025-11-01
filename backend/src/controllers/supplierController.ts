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
    const supplier = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    
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
    const { name, contactNumber, phone, email, address, bankAccNo, bankAccName } = req.body;
    
    if (!name) {
      const err = makeApiError('BAD_REQUEST', 'Name is required', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const inserted = await db.insert(suppliers).values({
      name,
      contactNumber: contactNumber || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      bankAccNo: bankAccNo || null,
      bankAccName: bankAccName || null,
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
    const { name, contactNumber, phone, email, address, bankAccNo, bankAccName } = req.body;

    // Check if supplier exists
    const existing = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Supplier not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    const updated = await db.update(suppliers)
      .set({
        name: name !== undefined ? name : existing[0].name,
        contactNumber: contactNumber !== undefined ? contactNumber : existing[0].contactNumber,
        phone: phone !== undefined ? phone : existing[0].phone,
        email: email !== undefined ? email : existing[0].email,
        address: address !== undefined ? address : existing[0].address,
        bankAccNo: bankAccNo !== undefined ? bankAccNo : existing[0].bankAccNo,
        bankAccName: bankAccName !== undefined ? bankAccName : existing[0].bankAccName,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, id))
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

    // Check if supplier exists
    const existing = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Supplier not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    await db.delete(suppliers).where(eq(suppliers.id, id));

    return res.status(200).json(ok(null, 'Supplier deleted successfully', 200));
  } catch (err) {
    console.error("deleteSupplier error:", err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

