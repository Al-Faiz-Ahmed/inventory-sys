// src/controllers/saleItemController.ts
import { Request, Response } from "express";
import { db } from "../database/db";
import { saleItems } from "../models/sale-items";
import { products } from "../models/products";
import { mainInventory } from "../models/main-inventory";
import { sales } from "../models/sales";
import { eq, and } from "drizzle-orm";
import { ok, fail, makeApiError } from "../../../shared/error";

function toDecimalString(value: any): string | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num.toFixed(2);
}

export const listSaleItems = async (req: Request, res: Response) => {
  try {
    const saleId = Number(req.params.saleId);
    if (!Number.isFinite(saleId)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid sale id', { status: 400 });
      return res.status(400).json(fail(err));
    }
    const parent = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1);
    if (parent.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Sale not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    const rows = await db
      .select({
        id: saleItems.id,
        saleId: saleItems.saleId,
        productId: saleItems.productId,
        productName: products.name,
        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
        total: saleItems.total,
        createdAt: saleItems.createdAt,
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, saleId));

    return res.status(200).json(ok(rows as any, 'Sale items fetched successfully', 200));
  } catch (err) {
    console.error('listSaleItems error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const createSaleItem = async (req: Request, res: Response) => {
  try {
    const saleId = Number(req.params.saleId);
    if (!Number.isFinite(saleId)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid sale id', { status: 400 });
      return res.status(400).json(fail(err));
    }

    // Get sale information for customer details
    const saleInfo = await db.select({
      customerId: sales.customerId,
      invoiceNumber: sales.invoiceNumber
    }).from(sales).where(eq(sales.id, saleId)).limit(1);
    
    if (!saleInfo.length) {
      const err = makeApiError('NOT_FOUND', 'Sale not found', { status: 404 });
      return res.status(404).json(fail(err));
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

    const parent = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1);
    if (parent.length === 0) {
      const err = makeApiError('BAD_REQUEST', 'Sale not found', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const prod = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1);
    if (prod.length === 0) {
      const err = makeApiError('BAD_REQUEST', 'Product not found', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const total = (Number(qtyStr) * Number(priceStr)).toFixed(2);

    const created = await db.transaction(async (tx) => {
      const inserted = await tx.insert(saleItems).values({
        saleId,
        productId,
        quantity: qtyStr,
        unitPrice: priceStr,
        total,
      }).returning();

      // Get product data before updating for main_inventory
      const productData = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
      const product = productData[0];

      // Decrease product stock by sold quantity
      const cur = await tx.select({ quantity: products.quantity }).from(products).where(eq(products.id, productId)).limit(1);
      const currentQty = cur.length ? Number((cur[0] as any).quantity) : 0;
      const newQty = (currentQty - Number(qtyStr)).toFixed(3);
      await tx.update(products).set({ quantity: newQty as any }).where(eq(products.id, productId));

      // Create main_inventory entry for the sale
      await tx.insert(mainInventory).values({
        productId,
        transactionType: 'sale',
        quantity: qtyStr,
        stockQuantity: newQty,
        unitPrice: priceStr,
        costPrice: product.cost || '0.00',
        sellPrice: priceStr,
        avgPrice: product.avgPrice || '0.00',
        previousCostPrice: product.previousCost || '0.00',
        previousSellPrice: product.previousPrice || '0.00',
        previousAvgPrice: product.previousAvgPrice || '0.00',
        totalAmount: total,
        customerId: saleInfo[0].customerId,
        customerInvoiceNumber: saleInfo[0].invoiceNumber,
        description: `Product sale - ${product.name}`,
      });

      return inserted[0];
    });

    return res.status(201).json(ok(created, 'Sale item created successfully', 201));
  } catch (err) {
    console.error('createSaleItem error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const updateSaleItem = async (req: Request, res: Response) => {
  try {
    const saleId = Number(req.params.saleId);
    const itemId = Number(req.params.itemId);
    if (!Number.isFinite(saleId) || !Number.isFinite(itemId)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid ids', { status: 400 });
      return res.status(400).json(fail(err));
    }

    // Get sale information for customer details
    const saleInfo = await db.select({
      customerId: sales.customerId,
      invoiceNumber: sales.invoiceNumber
    }).from(sales).where(eq(sales.id, saleId)).limit(1);
    
    if (!saleInfo.length) {
      const err = makeApiError('NOT_FOUND', 'Sale not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    const parent = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1);
    if (parent.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Sale not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    const existing = await db.select().from(saleItems).where(and(eq(saleItems.id, itemId), eq(saleItems.saleId, saleId))).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Sale item not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    const body = req.body || {};
    const payload: any = {};

    if (body.productId !== undefined) {
      if (!body.productId || typeof body.productId !== 'string') {
        const err = makeApiError('BAD_REQUEST', 'Invalid productId', { status: 400 });
        return res.status(400).json(fail(err));
      }
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

    const curQty = qtyStr !== null ? Number(qtyStr) : Number((existing[0] as any).quantity);
    const curPrice = priceStr !== null ? Number(priceStr) : Number((existing[0] as any).unitPrice);
    payload.total = (curQty * curPrice).toFixed(2);

    const updated = await db.transaction(async (tx) => {
      const updatedRows = await tx
        .update(saleItems)
        .set(payload)
        .where(and(eq(saleItems.id, itemId), eq(saleItems.saleId, saleId)))
        .returning();

      const oldProductId: string = (existing[0] as any).productId;
      const newProductId: string = payload.productId ?? oldProductId;
      const oldQty = Number((existing[0] as any).quantity);
      const newQty = qtyStr !== null ? Number(qtyStr) : oldQty;

      if (newProductId === oldProductId) {
        const delta = newQty - oldQty;
        if (delta !== 0) {
          const cur = await tx.select({ quantity: products.quantity }).from(products).where(eq(products.id, newProductId)).limit(1);
          const currentQty = cur.length ? Number((cur[0] as any).quantity) : 0;
          const adj = (currentQty - delta).toFixed(3); // subtract delta because positive delta means more sold -> reduce stock
          await tx.update(products).set({ quantity: adj as any }).where(eq(products.id, newProductId));

          // Get product data for main_inventory
          const productData = await tx.select().from(products).where(eq(products.id, newProductId)).limit(1);
          const product = productData[0];
          const newUnitPrice = priceStr || (existing[0] as any).unitPrice;

          // Create main_inventory entry for sale adjustment
          await tx.insert(mainInventory).values({
            productId: newProductId,
            transactionType: 'sale',
            quantity: newQty.toFixed(2),
            stockQuantity: adj,
            unitPrice: newUnitPrice,
            costPrice: product.cost || '0.00',
            sellPrice: newUnitPrice,
            avgPrice: product.avgPrice || '0.00',
            previousCostPrice: product.previousCost || '0.00',
            previousSellPrice: product.previousPrice || '0.00',
            previousAvgPrice: product.previousAvgPrice || '0.00',
            totalAmount: (newQty * Number(newUnitPrice)).toFixed(2),
            customerId: saleInfo[0].customerId,
            customerInvoiceNumber: saleInfo[0].invoiceNumber,
            description: `Sale updated - ${product.name}`,
          });
        }
      } else {
        // Move quantity from old product to new product: restore old stock, reduce new stock
        const curOld = await tx.select({ quantity: products.quantity }).from(products).where(eq(products.id, oldProductId)).limit(1);
        const curOldQty = curOld.length ? Number((curOld[0] as any).quantity) : 0;
        const newOldQty = (curOldQty + oldQty).toFixed(3); // restore
        await tx.update(products).set({ quantity: newOldQty as any }).where(eq(products.id, oldProductId));

        const curNew = await tx.select({ quantity: products.quantity }).from(products).where(eq(products.id, newProductId)).limit(1);
        const curNewQty = curNew.length ? Number((curNew[0] as any).quantity) : 0;
        const newNewQty = (curNewQty - newQty).toFixed(3); // reduce
        await tx.update(products).set({ quantity: newNewQty as any }).where(eq(products.id, newProductId));

        // Get product data for main_inventory entry
        const newProductData = await tx.select().from(products).where(eq(products.id, newProductId)).limit(1);
        const newProduct = newProductData[0];
        const newUnitPrice = priceStr || (existing[0] as any).unitPrice;

        // Create single main_inventory entry for the new sale
        await tx.insert(mainInventory).values({
          productId: newProductId,
          transactionType: 'sale',
          quantity: newQty.toFixed(2),
          stockQuantity: newNewQty,
          unitPrice: newUnitPrice,
          costPrice: newProduct.cost || '0.00',
          sellPrice: newUnitPrice,
          avgPrice: newProduct.avgPrice || '0.00',
          previousCostPrice: newProduct.previousCost || '0.00',
          previousSellPrice: newProduct.previousPrice || '0.00',
          previousAvgPrice: newProduct.previousAvgPrice || '0.00',
          totalAmount: (newQty * Number(newUnitPrice)).toFixed(2),
          customerId: saleInfo[0].customerId,
          customerInvoiceNumber: saleInfo[0].invoiceNumber,
          description: `Sale updated - ${newProduct.name}`,
        });
      }

      return updatedRows[0];
    });

    return res.status(200).json(ok(updated, 'Sale item updated successfully', 200));
  } catch (err) {
    console.error('updateSaleItem error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const deleteSaleItem = async (req: Request, res: Response) => {
  try {
    const saleId = Number(req.params.saleId);
    const itemId = Number(req.params.itemId);
    if (!Number.isFinite(saleId) || !Number.isFinite(itemId)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid ids', { status: 400 });
      return res.status(400).json(fail(err));
    }

    // Get sale information for customer details
    const saleInfo = await db.select({
      customerId: sales.customerId,
      invoiceNumber: sales.invoiceNumber
    }).from(sales).where(eq(sales.id, saleId)).limit(1);
    
    if (!saleInfo.length) {
      const err = makeApiError('NOT_FOUND', 'Sale not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    const existing = await db.select().from(saleItems).where(and(eq(saleItems.id, itemId), eq(saleItems.saleId, saleId))).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Sale item not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    await db.transaction(async (tx) => {
      await tx.delete(saleItems).where(and(eq(saleItems.id, itemId), eq(saleItems.saleId, saleId)));
      const prodId: string = (existing[0] as any).productId;
      const qty = Number((existing[0] as any).quantity);
      const cur = await tx.select({ quantity: products.quantity }).from(products).where(eq(products.id, prodId)).limit(1);
      const currentQty = cur.length ? Number((cur[0] as any).quantity) : 0;
      const newQty = (currentQty + qty).toFixed(3); // restore stock
      await tx.update(products).set({ quantity: newQty as any }).where(eq(products.id, prodId));

      // Get product data for main_inventory
      const productData = await tx.select().from(products).where(eq(products.id, prodId)).limit(1);
      const product = productData[0];

      // Create main_inventory entry for sale deletion (stock restoration)
      await tx.insert(mainInventory).values({
        productId: prodId,
        transactionType: 'refund',
        quantity: qty.toFixed(2),
        stockQuantity: newQty,
        unitPrice: (existing[0] as any).unitPrice,
        costPrice: product.cost || '0.00',
        sellPrice: (existing[0] as any).unitPrice,
        avgPrice: product.avgPrice || '0.00',
        previousCostPrice: product.previousCost || '0.00',
        previousSellPrice: product.previousPrice || '0.00',
        previousAvgPrice: product.previousAvgPrice || '0.00',
        totalAmount: (qty * Number((existing[0] as any).unitPrice)).toFixed(2),
        customerId: saleInfo[0].customerId,
        customerInvoiceNumber: saleInfo[0].invoiceNumber,
        description: `Sale item deleted - stock restored - ${product.name}`,
      });
    });

    return res.status(200).json(ok(null, 'Sale item deleted successfully', 200));
  } catch (err) {
    console.error('deleteSaleItem error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};
