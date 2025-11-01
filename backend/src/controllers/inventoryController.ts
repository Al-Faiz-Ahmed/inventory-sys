// src/controllers/inventoryController.ts
import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../database/db";
import { products } from "../models/products";
import { productCategories } from "../models/product-categories";
import { ok, fail, makeApiError } from "../../../shared/error";

// Helper: normalize numeric input to string for decimal fields, and numbers for integers
function toDecimalString(n: unknown): string | null {
  if (n === undefined || n === null || n === "") return null;
  const num = typeof n === "string" ? Number(n) : (n as number);
  if (Number.isNaN(num)) return null;
  return num.toFixed(2);
}

function toInteger(n: unknown): number | null {
  if (n === undefined || n === null || n === "") return null;
  const num = typeof n === "string" ? Number(n) : (n as number);
  if (!Number.isFinite(num)) return null;
  return Math.trunc(num);
}

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      sku,
      categoryId,
      price,
      cost,
      quantity,
      minQuantity,
      maxQuantity,
      supplier,
    } = req.body || {};

    // Basic validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      const err = makeApiError("BAD_REQUEST", "Product name is required", { status: 400 });
      return res.status(400).json(fail(err));
    }
    if (!sku || typeof sku !== "string" || sku.trim().length < 2) {
      const err = makeApiError("BAD_REQUEST", "SKU is required", { status: 400 });
      return res.status(400).json(fail(err));
    }
    if (!categoryId || typeof categoryId !== "string") {
      const err = makeApiError("BAD_REQUEST", "Category is required", { status: 400 });
      return res.status(400).json(fail(err));
    }

    const priceStr = toDecimalString(price);
    const costStr = toDecimalString(cost);
    const quantityInt = toInteger(quantity) ?? 0;
    const minQtyInt = toInteger(minQuantity) ?? 0;
    const maxQtyInt = toInteger(maxQuantity) ?? 0;

    if (!priceStr || Number(priceStr) <= 0) {
      const err = makeApiError("BAD_REQUEST", "Price must be greater than 0", { status: 400 });
      return res.status(400).json(fail(err));
    }
    if (!costStr || Number(costStr) <= 0) {
      const err = makeApiError("BAD_REQUEST", "Cost must be greater than 0", { status: 400 });
      return res.status(400).json(fail(err));
    }
    if (Number(costStr) > Number(priceStr)) {
      const err = makeApiError("BAD_REQUEST", "Cost cannot be greater than price", { status: 400 });
      return res.status(400).json(fail(err));
    }
    if (quantityInt < 0 || minQtyInt < 0 || maxQtyInt < 0) {
      const err = makeApiError("BAD_REQUEST", "Quantities cannot be negative", { status: 400 });
      return res.status(400).json(fail(err));
    }

    // Uniqueness: SKU
    const existingSku = await db.select().from(products).where(eq(products.sku, sku)).limit(1);
    if (existingSku.length > 0) {
      const err = makeApiError("CONFLICT", "A product with this SKU already exists", { status: 409 });
      return res.status(409).json(fail(err));
    }

    // FK validation: category exists
    const category = await db
      .select({ id: productCategories.id })
      .from(productCategories)
      .where(eq(productCategories.id, categoryId))
      .limit(1);
    if (category.length === 0) {
      const err = makeApiError("BAD_REQUEST", "Category not found", { status: 400 });
      return res.status(400).json(fail(err));
    }

    const inserted = await db
      .insert(products)
      .values({
        name: name.trim(),
        description: description ? String(description) : null,
        sku: sku.trim(),
        categoryId,
        price: priceStr,
        cost: costStr,
        quantity: quantityInt,
        minQuantity: minQtyInt,
        maxQuantity: maxQtyInt,
        supplier: supplier ? String(supplier) : null,
      })
      .returning();

    return res.status(201).json(ok(inserted[0], "Product created successfully", 201));
  } catch (err) {
    console.error("createProduct error:", err);
    const apiErr = makeApiError("INTERNAL_SERVER_ERROR", "Server error", { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const getProducts = async (_req: Request, res: Response) => {
  try {
    const list = await db.select().from(products);
    return res.status(200).json(ok(list, "Products fetched successfully", 200));
  } catch (err) {
    console.error("getProducts error:", err);
    const apiErr = makeApiError("INTERNAL_SERVER_ERROR", "Server error", { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (rows.length === 0) {
      const err = makeApiError("NOT_FOUND", "Product not found", { status: 404 });
      return res.status(404).json(fail(err));
    }
    return res.status(200).json(ok(rows[0], "Product fetched successfully", 200));
  } catch (err) {
    console.error("getProduct error:", err);
    const apiErr = makeApiError("INTERNAL_SERVER_ERROR", "Server error", { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (existing.length === 0) {
      const err = makeApiError("NOT_FOUND", "Product not found", { status: 404 });
      return res.status(404).json(fail(err));
    }

    const body = req.body || {};

    // If updating SKU, ensure uniqueness
    if (body.sku && body.sku !== existing[0].sku) {
      const dup = await db.select().from(products).where(eq(products.sku, body.sku)).limit(1);
      if (dup.length > 0) {
        const err = makeApiError("CONFLICT", "A product with this SKU already exists", { status: 409 });
        return res.status(409).json(fail(err));
      }
    }

    // If updating category, ensure it exists
    if (body.categoryId) {
      const cat = await db.select().from(productCategories).where(eq(productCategories.id, body.categoryId)).limit(1);
      if (cat.length === 0) {
        const err = makeApiError("BAD_REQUEST", "Category not found", { status: 400 });
        return res.status(400).json(fail(err));
      }
    }

    const updated = await db
      .update(products)
      .set({
        name: body.name ?? existing[0].name,
        description: body.description !== undefined ? body.description : existing[0].description,
        sku: body.sku ?? existing[0].sku,
        categoryId: body.categoryId ?? existing[0].categoryId,
        price: body.price !== undefined ? toDecimalString(body.price)! : (existing[0] as any).price,
        cost: body.cost !== undefined ? toDecimalString(body.cost)! : (existing[0] as any).cost,
        quantity: body.quantity !== undefined ? toInteger(body.quantity)! : existing[0].quantity,
        minQuantity: body.minQuantity !== undefined ? toInteger(body.minQuantity)! : existing[0].minQuantity,
        maxQuantity: body.maxQuantity !== undefined ? toInteger(body.maxQuantity)! : existing[0].maxQuantity,
        supplier: body.supplier !== undefined ? body.supplier : existing[0].supplier,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return res.status(200).json(ok(updated[0], "Product updated successfully", 200));
  } catch (err) {
    console.error("updateProduct error:", err);
    const apiErr = makeApiError("INTERNAL_SERVER_ERROR", "Server error", { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (existing.length === 0) {
      const err = makeApiError("NOT_FOUND", "Product not found", { status: 404 });
      return res.status(404).json(fail(err));
    }

    await db.delete(products).where(eq(products.id, id));
    return res.status(200).json(ok(null, "Product deleted successfully", 200));
  } catch (err) {
    console.error("deleteProduct error:", err);
    const apiErr = makeApiError("INTERNAL_SERVER_ERROR", "Server error", { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};
