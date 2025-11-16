// src/controllers/purchaseItemController.ts
import { Request, Response } from "express";
import { db } from "../database/db";
import { purchases } from "../models/purchases";
import { purchaseItems } from "../models/purchase-items";
import { products } from "../models/products";
import { mainInventory } from "../models/main-inventory";
import { eq, and, desc } from "drizzle-orm";
import { ok, fail, makeApiError } from "../../../shared/error";

function toDecimalString(value: any): string | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num.toFixed(2);
}

export const listPurchaseItems = async (req: Request, res: Response) => {
  try {
    const purchaseId = Number(req.params.purchaseId);
    if (!Number.isFinite(purchaseId)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid purchase id', { status: 400 });
      return res.status(400).json(fail(err));
    }
    // Ensure purchase exists
    const parent = await db.select().from(purchases).where(eq(purchases.id, purchaseId)).limit(1);
    if (parent.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Purchase not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    // join products to include product name in response
    const rows = await db
      .select({
        id: purchaseItems.id,
        purchaseId: purchaseItems.purchaseId,
        productId: purchaseItems.productId,
        productName: products.name,
        quantity: purchaseItems.quantity,
        unitPrice: purchaseItems.unitPrice,
        total: purchaseItems.total,
        createdAt: purchaseItems.createdAt,
      })
      .from(purchaseItems)
      .leftJoin(products, eq(purchaseItems.productId, products.id))
      .where(eq(purchaseItems.purchaseId, purchaseId)).orderBy(desc(purchaseItems.createdAt));
    return res.status(200).json(ok(rows as any, 'Purchase items fetched successfully', 200));
  } catch (err) {
    console.error('listPurchaseItems error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const createPurchaseItem = async (req: Request, res: Response) => {
  try {
    const purchaseId = Number(req.params.purchaseId);
    if (!Number.isFinite(purchaseId)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid purchase id', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const { productId, quantity, unitPrice } = req.body || {};

    if (!productId || typeof productId !== 'string') {
      const err = makeApiError('BAD_REQUEST', 'productId is required', { status: 400 });
      return res.status(400).json(fail(err));
    }
    const qtyStr = toDecimalString(quantity);
    const priceStr = toDecimalString(unitPrice);
    if (!qtyStr || Number(qtyStr) <= 0) {
      const err = makeApiError('BAD_REQUEST', 'quantity must be > 0', { status: 400 });
      return res.status(400).json(fail(err));
    }
    if (!priceStr || Number(priceStr) < 0) {
      const err = makeApiError('BAD_REQUEST', 'unitPrice must be >= 0', { status: 400 });
      return res.status(400).json(fail(err));
    }

    // Ensure purchase exists
    const parent = await db.select().from(purchases).where(eq(purchases.id, purchaseId)).limit(1);
    if (parent.length === 0) {
      const err = makeApiError('BAD_REQUEST', 'Purchase not found', { status: 400 });
      return res.status(400).json(fail(err));
    }

    // Ensure product exists
    const prod = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1);
    if (prod.length === 0) {
      const err = makeApiError('BAD_REQUEST', 'Product not found', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const total = (Number(qtyStr) * Number(priceStr)).toFixed(2);

    const created = await db.transaction(async (tx) => {
      const inserted = await tx.insert(purchaseItems).values({
        purchaseId,
        productId,
        quantity: qtyStr,
        unitPrice: priceStr,
        total,
      }).returning();

      // Fetch current product to get previous prices and quantity
      const productBefore = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
      if (productBefore.length === 0) {
        throw new Error('Product not found');
      }
      const prod = productBefore[0];

      const previousQty = Number(prod.quantity || 0);
      const previousCost = Number(prod.cost || 0);
      const previousSell = Number(prod.price || 0);
      const previousAvg = Number(prod.avgPrice || 0);

      const addedQty = Number(qtyStr);
      const addedCost = Number(priceStr);
      const newQty = previousQty + addedQty;

      // Calculate new average cost price
      const newAvgCost = newQty > 0
        ? (previousQty * previousCost + addedQty * addedCost) / newQty
        : 0;

      // Update product quantity and cost/avg
      await tx.update(products).set({
        quantity: newQty.toFixed(3),
        // cost: addedCost.toFixed(2),
        // avgPrice: newAvgCost.toFixed(2),
        // previousCost: previousCost.toFixed(2),
        // previousPrice: previousSell.toFixed(2),
        // previousAvgPrice: previousAvg.toFixed(2),
      }).where(eq(products.id, productId));

      // Insert into main_inventory
      await tx.insert(mainInventory).values({
        productId,
        transactionType: 'purchase',
        quantity: qtyStr,
        stockQuantity: newQty.toFixed(3),
        unitPrice: priceStr,
        costPrice: priceStr,
        sellPrice: previousSell.toFixed(2),
        avgPrice: newAvgCost.toFixed(2),
        previousCostPrice: previousCost.toFixed(2),
        previousSellPrice: previousSell.toFixed(2),
        previousAvgPrice: previousAvg.toFixed(2),
        supplierId: parent[0].supplierId,
        supplierInvoiceNumber: parent[0].invoiceNumber,
        totalAmount: total,
        description: `Purchase item added: ${productId}`,
      });

      return inserted[0];
    });

    return res.status(201).json(ok(created, 'Purchase item created successfully', 201));
  } catch (err) {
    console.error('createPurchaseItem error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const updatePurchaseItem = async (req: Request, res: Response) => {
  try {
    const purchaseId = Number(req.params.purchaseId);
    const itemId = Number(req.params.itemId);
    if (!Number.isFinite(purchaseId) || !Number.isFinite(itemId)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid ids', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const parent = await db.select().from(purchases).where(eq(purchases.id, purchaseId)).limit(1);
    if (parent.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Purchase not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    const existing = await db.select().from(purchaseItems).where(and(eq(purchaseItems.id, itemId), eq(purchaseItems.purchaseId, purchaseId))).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Purchase item not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    const body = req.body || {};
    const payload: any = {};

    if (body.productId !== undefined) {
      if (!body.productId || typeof body.productId !== 'string') {
        const err = makeApiError('BAD_REQUEST', 'Invalid productId', { status: 400 });
        return res.status(400).json(fail(err));
      }
      // Ensure product exists
      const prod = await db.select({ id: products.id }).from(products).where(eq(products.id, body.productId)).limit(1);
      if (prod.length === 0) {
        const err = makeApiError('BAD_REQUEST', 'Product not found', { status: 400 });
        return res.status(400).json(fail(err));
      }
      payload.productId = body.productId;
    }

    let qtyStr: string | null = null;
    let priceStr: string | null = null;

    if (body.quantity !== undefined) {
      qtyStr = toDecimalString(body.quantity);
      if (!qtyStr || Number(qtyStr) <= 0) {
        const err = makeApiError('BAD_REQUEST', 'quantity must be > 0', { status: 400 });
        return res.status(400).json(fail(err));
      }
      payload.quantity = qtyStr;
    }

    if (body.unitPrice !== undefined) {
      priceStr = toDecimalString(body.unitPrice);
      if (!priceStr || Number(priceStr) < 0) {
        const err = makeApiError('BAD_REQUEST', 'unitPrice must be >= 0', { status: 400 });
        return res.status(400).json(fail(err));
      }
      payload.unitPrice = priceStr;
    }

    // Compute total if quantity or unitPrice changed; else keep existing
    const curQty = qtyStr !== null ? Number(qtyStr) : Number((existing[0] as any).quantity);
    const curPrice = priceStr !== null ? Number(priceStr) : Number((existing[0] as any).unitPrice);
    payload.total = (curQty * curPrice).toFixed(2);

    const updated = await db.transaction(async (tx) => {
      // Update the item first
      const updatedRows = await tx
        .update(purchaseItems)
        .set(payload)
        .where(and(eq(purchaseItems.id, itemId), eq(purchaseItems.purchaseId, purchaseId)))
        .returning();

      const oldProductId: string = (existing[0] as any).productId;
      const newProductId: string = payload.productId ?? oldProductId;
      const oldQty = Number((existing[0] as any).quantity);
      const newQty = qtyStr !== null ? Number(qtyStr) : oldQty;

      if (newProductId === oldProductId) {
        // Adjust same product by delta
        const delta = newQty - oldQty;
        if (delta !== 0) {
          const cur = await tx.select({ quantity: products.quantity }).from(products).where(eq(products.id, newProductId)).limit(1);
          const currentQty = cur.length ? Number((cur[0] as any).quantity) : 0;
          const adj = (currentQty + delta).toFixed(3);
          await tx.update(products).set({ quantity: adj as any }).where(eq(products.id, newProductId));
        }
      } else {
        // Move quantity from old product to new product
        const curOld = await tx.select({ quantity: products.quantity }).from(products).where(eq(products.id, oldProductId)).limit(1);
        const curOldQty = curOld.length ? Number((curOld[0] as any).quantity) : 0;
        const newOldQty = (curOldQty - oldQty).toFixed(3);
        await tx.update(products).set({ quantity: newOldQty as any }).where(eq(products.id, oldProductId));

        const curNew = await tx.select({ quantity: products.quantity }).from(products).where(eq(products.id, newProductId)).limit(1);
        const curNewQty = curNew.length ? Number((curNew[0] as any).quantity) : 0;
        const newNewQty = (curNewQty + newQty).toFixed(3);
        await tx.update(products).set({ quantity: newNewQty as any }).where(eq(products.id, newProductId));
      }

      return updatedRows[0];
    });

    return res.status(200).json(ok(updated, 'Purchase item updated successfully', 200));
  } catch (err) {
    console.error('updatePurchaseItem error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const deletePurchaseItem = async (req: Request, res: Response) => {
  try {
    const purchaseId = Number(req.params.purchaseId);
    const itemId = Number(req.params.itemId);
    if (!Number.isFinite(purchaseId) || !Number.isFinite(itemId)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid ids', { status: 400 });
      return res.status(400).json(fail(err));
    }

    // Ensure exists
    const existing = await db.select().from(purchaseItems).where(and(eq(purchaseItems.id, itemId), eq(purchaseItems.purchaseId, purchaseId))).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Purchase item not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    await db.transaction(async (tx) => {
      // Delete the item
      await tx.delete(purchaseItems).where(and(eq(purchaseItems.id, itemId), eq(purchaseItems.purchaseId, purchaseId)));
      // Decrease product stock by the item's quantity
      const prodId: string = (existing[0] as any).productId;
      const qty = Number((existing[0] as any).quantity);
      const cur = await tx.select({ quantity: products.quantity }).from(products).where(eq(products.id, prodId)).limit(1);
      const currentQty = cur.length ? Number((cur[0] as any).quantity) : 0;
      const newQty = (currentQty - qty).toFixed(3);
      await tx.update(products).set({ quantity: newQty as any }).where(eq(products.id, prodId));
    });
    return res.status(200).json(ok(null, 'Purchase item deleted successfully', 200));
  } catch (err) {
    console.error('deletePurchaseItem error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};
