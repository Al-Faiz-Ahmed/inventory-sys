// src/controllers/mainInventoryController.ts
import { Request, Response } from "express";
import { eq, and, gte, lte, like, ilike, or, inArray, desc, asc, sql } from "drizzle-orm";
import { db } from "../database/db";
import { mainInventory } from "../models/main-inventory";
import { products } from "../models/products";
import { ok, fail, makeApiError } from "../../../shared/error";

// Helper: normalize numeric input to string for decimal fields
function toDecimalString(n: unknown, scale = 2): string | null {
  if (n === undefined || n === null || n === "") return null;
  const num = typeof n === "string" ? Number(n) : (n as number);
  if (!Number.isFinite(num)) return null;
  return num.toFixed(scale);
}

// Allowed transaction types
const allowedTxnTypes = ['sale', 'purchase', 'refund', 'adjustment', 'miscelleneous'];

export const getMainInventoryTransactions = async (req: Request, res: Response) => {
  try {
    console.log('Received query params:', req.query);
    
    const {
      productId,
      transactionType,
      fromDate,
      toDate,
      minQuantity,
      maxQuantity,
      minAmount,
      maxAmount,
      search,
      orderBy = 'desc',
      limit = 500,
      offset = 0
    } = req.query || {};

    // Build where conditions
    const conditions = [];
    
    // Default to current month if no date filters provided
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const rawProductId = (req.query as any).productId ?? (req.query as any)['productId[]'] ?? productId;

    if (rawProductId) {
      if (Array.isArray(rawProductId)) {
        const ids = rawProductId.map(String).filter(Boolean);
        if (ids.length > 0) {
          conditions.push(inArray(mainInventory.productId, ids as any));
        }
      } else if (typeof rawProductId === 'string') {
        conditions.push(eq(mainInventory.productId, rawProductId));
      }
    }

    const rawTransactionType = (req.query as any).transactionType ?? (req.query as any)['transactionType[]'] ?? transactionType;

    if (rawTransactionType) {
      if (Array.isArray(rawTransactionType)) {
        const validTxnTypes = rawTransactionType.filter(t => allowedTxnTypes.includes(String(t) as any));
        if (validTxnTypes.length > 0) {
          conditions.push(inArray(mainInventory.transactionType, validTxnTypes as any));
        }
      } else {
        const value = String(rawTransactionType);
        const parts = value.split(',').map(p => p.trim()).filter(Boolean);

        if (parts.length > 1) {
          const validTxnTypes = parts.filter(t => allowedTxnTypes.includes(t as any));
          if (validTxnTypes.length > 0) {
            conditions.push(inArray(mainInventory.transactionType, validTxnTypes as any));
          }
        } else if (allowedTxnTypes.includes(value as any)) {
          conditions.push(eq(mainInventory.transactionType, value as any));
        } else {
          const err = makeApiError('BAD_REQUEST', 'Invalid transactionType', { status: 400 });
          return res.status(400).json(fail(err));
        }
      }
    }

    if (fromDate && typeof fromDate === 'string') {
      conditions.push(gte(mainInventory.createdAt, new Date(fromDate)));
    } else {
      // Default to start of current month
      conditions.push(gte(mainInventory.createdAt, startOfMonth));
    }

    if (toDate && typeof toDate === 'string') {
      conditions.push(lte(mainInventory.createdAt, new Date(toDate)));
    } else {
      // Default to end of current month
      conditions.push(lte(mainInventory.createdAt, endOfMonth));
    }

    if (minQuantity !== undefined) {
      const minQty = toDecimalString(minQuantity, 2);
      if (minQty !== null) {
        conditions.push(sql`${mainInventory.quantity} >= ${minQty}`);
      }
    }

    if (maxQuantity !== undefined) {
      const maxQty = toDecimalString(maxQuantity, 2);
      if (maxQty !== null) {
        conditions.push(sql`${mainInventory.quantity} <= ${maxQty}`);
      }
    }

    if (minAmount !== undefined) {
      const minAmt = toDecimalString(minAmount, 2);
      if (minAmt !== null) {
        conditions.push(sql`${mainInventory.totalAmount} >= ${minAmt}`);
      }
    }

    if (maxAmount !== undefined) {
      const maxAmt = toDecimalString(maxAmount, 2);
      if (maxAmt !== null) {
        conditions.push(sql`${mainInventory.totalAmount} <= ${maxAmt}`);
      }
    }

    if (search && typeof search === 'string') {
      conditions.push(like(products.name, `%${search}%`));
    }

    // Apply conditions and build final query
    console.log('Building conditions array:', conditions);
    const limitNum = Math.min(Number(limit) || 500, 1000);
    const offsetNum = Number(offset) || 0;
    
    const transactions = await db
      .select({
        id: mainInventory.id,
        productId: mainInventory.productId,
        productName: products.name,
        productSku: products.sku,
        transactionType: mainInventory.transactionType,
        quantity: mainInventory.quantity,
        stockQuantity: mainInventory.stockQuantity,
        unitPrice: mainInventory.unitPrice,
        costPrice: mainInventory.costPrice,
        sellPrice: mainInventory.sellPrice,
        avgPrice: mainInventory.avgPrice,
        previousCostPrice: mainInventory.previousCostPrice,
        previousSellPrice: mainInventory.previousSellPrice,
        previousAvgPrice: mainInventory.previousAvgPrice,
        supplierId: mainInventory.supplierId,
        customerId: mainInventory.customerId,
        supplierInvoiceNumber: mainInventory.supplierInvoiceNumber,
        customerInvoiceNumber: mainInventory.customerInvoiceNumber,
        totalAmount: mainInventory.totalAmount,
        description: mainInventory.description,
        createdAt: mainInventory.createdAt,
      })
      .from(mainInventory)
      .leftJoin(products, eq(mainInventory.productId, products.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined as any)
      .orderBy(orderBy === 'desc' ? desc(mainInventory.createdAt) : asc(mainInventory.createdAt))
      .limit(limitNum)
      .offset(offsetNum)
      .execute();

    // Get summary statistics
    const summaryConditions = conditions.filter(condition => 
      condition.toString().includes('productId') || 
      condition.toString().includes('transactionType') ||
      condition.toString().includes('createdAt') ||
      condition.toString().includes('quantity') ||
      condition.toString().includes('totalAmount')
    );

    const summary = await db
      .select({
        totalTransactions: sql<number>`count(${mainInventory.id})`,
        totalQuantity: sql<string>`sum(${mainInventory.quantity})`,
        totalAmount: sql<string>`sum(${mainInventory.totalAmount})`,
      })
      .from(mainInventory)
      .where(summaryConditions.length > 0 ? and(...summaryConditions) : undefined as any)
      .execute();

    return res.status(200).json(ok({
      transactions,
      summary: {
        totalTransactions: Number(summary[0]?.totalTransactions || 0),
        totalQuantity: Number(summary[0]?.totalQuantity || 0),
        totalAmount: Number(summary[0]?.totalAmount || 0),
      },
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        hasMore: transactions.length === limitNum,
      }
    }, "Main inventory transactions fetched successfully", 200));
  } catch (err) {
    console.error("getMainInventoryTransactions error:", err);
    const apiErr = makeApiError("INTERNAL_SERVER_ERROR", "Server error", { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const getMainInventoryTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const transaction = await db
      .select({
        id: mainInventory.id,
        productId: mainInventory.productId,
        productName: products.name,
        productSku: products.sku,
        transactionType: mainInventory.transactionType,
        quantity: mainInventory.quantity,
        stockQuantity: mainInventory.stockQuantity,
        unitPrice: mainInventory.unitPrice,
        costPrice: mainInventory.costPrice,
        sellPrice: mainInventory.sellPrice,
        avgPrice: mainInventory.avgPrice,
        previousCostPrice: mainInventory.previousCostPrice,
        previousSellPrice: mainInventory.previousSellPrice,
        previousAvgPrice: mainInventory.previousAvgPrice,
        supplierId: mainInventory.supplierId,
        customerId: mainInventory.customerId,
        supplierInvoiceNumber: mainInventory.supplierInvoiceNumber,
        customerInvoiceNumber: mainInventory.customerInvoiceNumber,
        totalAmount: mainInventory.totalAmount,
        description: mainInventory.description,
        createdAt: mainInventory.createdAt,
      })
      .from(mainInventory)
      .leftJoin(products, eq(mainInventory.productId, products.id))
      .where(eq(mainInventory.id, Number(id)))
      .limit(1)
      .execute();

    if (transaction.length === 0) {
      const err = makeApiError("NOT_FOUND", "Main inventory transaction not found", { status: 404 });
      return res.status(404).json(fail(err));
    }

    return res.status(200).json(ok(transaction[0], "Main inventory transaction fetched successfully", 200));
  } catch (err) {
    console.error("getMainInventoryTransaction error:", err);
    const apiErr = makeApiError("INTERNAL_SERVER_ERROR", "Server error", { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const getMainInventoryTransactionsByProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const {
      transactionType,
      fromDate,
      toDate,
      orderBy = 'desc',
      limit = 100,
      offset = 0
    } = req.query || {};

    // Build where conditions
    const conditions = [eq(mainInventory.productId, productId)];

    if (transactionType && typeof transactionType === 'string') {
      conditions.push(eq(mainInventory.transactionType, transactionType as any));
    }

    if (fromDate && typeof fromDate === 'string') {
      conditions.push(gte(mainInventory.createdAt, new Date(fromDate)));
    }

    if (toDate && typeof toDate === 'string') {
      conditions.push(lte(mainInventory.createdAt, new Date(toDate)));
    }

    // Build the query
    const limitNum = Math.min(Number(limit) || 100, 500);
    const offsetNum = Number(offset) || 0;
    
    const transactions = await db
      .select({
        id: mainInventory.id,
        productId: mainInventory.productId,
        productName: products.name,
        productSku: products.sku,
        transactionType: mainInventory.transactionType,
        quantity: mainInventory.quantity,
        stockQuantity: mainInventory.stockQuantity,
        unitPrice: mainInventory.unitPrice,
        costPrice: mainInventory.costPrice,
        sellPrice: mainInventory.sellPrice,
        avgPrice: mainInventory.avgPrice,
        previousCostPrice: mainInventory.previousCostPrice,
        previousSellPrice: mainInventory.previousSellPrice,
        previousAvgPrice: mainInventory.previousAvgPrice,
        supplierId: mainInventory.supplierId,
        customerId: mainInventory.customerId,
        supplierInvoiceNumber: mainInventory.supplierInvoiceNumber,
        customerInvoiceNumber: mainInventory.customerInvoiceNumber,
        totalAmount: mainInventory.totalAmount,
        description: mainInventory.description,
        createdAt: mainInventory.createdAt,
      })
      .from(mainInventory)
      .leftJoin(products, eq(mainInventory.productId, products.id))
      .where(and(...conditions))
      .orderBy(orderBy === 'desc' ? desc(mainInventory.createdAt) : asc(mainInventory.createdAt))
      .limit(limitNum)
      .offset(offsetNum)
      .execute();

    return res.status(200).json(ok({
      transactions,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        hasMore: transactions.length === limitNum,
      }
    }, "Product inventory transactions fetched successfully", 200));
  } catch (err) {
    console.error("getMainInventoryTransactionsByProduct error:", err);
    const apiErr = makeApiError("INTERNAL_SERVER_ERROR", "Server error", { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const exportMainInventoryPDF = async (req: Request, res: Response) => {
  try {
    console.log('PDF export request received with body:', req.body);
    
    // Get the same data as the list endpoint but without pagination
    const {
      productId,
      transactionType,
      fromDate,
      toDate,
      minQuantity,
      maxQuantity,
      minAmount,
      maxAmount,
      search,
      orderBy = 'desc'
    } = req.body || {};

    // Build where conditions
    const conditions = [];

    // Default to current month if no date filters provided
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Product filter: support single and multiple product IDs
    const rawProductId = (req.body as any).productId ?? (req.body as any)['productId[]'] ?? (req.body as any).productIds ?? productId;

    if (rawProductId) {
      if (Array.isArray(rawProductId)) {
        const ids = rawProductId.map(String).filter(Boolean);
        if (ids.length > 0) {
          conditions.push(inArray(mainInventory.productId, ids as any));
        }
      } else if (typeof rawProductId === 'string') {
        conditions.push(eq(mainInventory.productId, rawProductId));
      }
    }

    // Transaction type filter: support arrays, comma-separated strings, and single value
    const rawTransactionType = (req.body as any).transactionType ?? (req.body as any)['transactionType[]'] ?? transactionType;

    if (rawTransactionType) {
      if (Array.isArray(rawTransactionType)) {
        const validTxnTypes = rawTransactionType.filter((t: any) => allowedTxnTypes.includes(String(t) as any));
        if (validTxnTypes.length > 0) {
          conditions.push(inArray(mainInventory.transactionType, validTxnTypes as any));
        }
      } else {
        const value = String(rawTransactionType);
        const parts = value.split(',').map((p) => p.trim()).filter(Boolean);

        if (parts.length > 1) {
          const validTxnTypes = parts.filter((t) => allowedTxnTypes.includes(t as any));
          if (validTxnTypes.length > 0) {
            conditions.push(inArray(mainInventory.transactionType, validTxnTypes as any));
          }
        } else if (allowedTxnTypes.includes(value as any)) {
          conditions.push(eq(mainInventory.transactionType, value as any));
        } else {
          const err = makeApiError('BAD_REQUEST', 'Invalid transactionType', { status: 400 });
          return res.status(400).json(fail(err));
        }
      }
    }

    // Date range: use provided filters or default to current month
    if (fromDate && typeof fromDate === 'string') {
      conditions.push(gte(mainInventory.createdAt, new Date(fromDate)));
    } else {
      conditions.push(gte(mainInventory.createdAt, startOfMonth));
    }

    if (toDate && typeof toDate === 'string') {
      conditions.push(lte(mainInventory.createdAt, new Date(toDate)));
    } else {
      conditions.push(lte(mainInventory.createdAt, endOfMonth));
    }

    if (minQuantity !== undefined) {
      const minQty = toDecimalString(minQuantity, 2);
      if (minQty !== null) {
        conditions.push(sql`${mainInventory.quantity} >= ${minQty}`);
      }
    }

    if (maxQuantity !== undefined) {
      const maxQty = toDecimalString(maxQuantity, 2);
      if (maxQty !== null) {
        conditions.push(sql`${mainInventory.quantity} <= ${maxQty}`);
      }
    }

    if (minAmount !== undefined) {
      const minAmt = toDecimalString(minAmount, 2);
      if (minAmt !== null) {
        conditions.push(sql`${mainInventory.totalAmount} >= ${minAmt}`);
      }
    }

    if (maxAmount !== undefined) {
      const maxAmt = toDecimalString(maxAmount, 2);
      if (maxAmt !== null) {
        conditions.push(sql`${mainInventory.totalAmount} <= ${maxAmt}`);
      }
    }

    if (search && typeof search === 'string') {
      conditions.push(like(products.name, `%${search}%`));
    }

    // Get transactions
    const transactions = await db
      .select({
        id: mainInventory.id,
        productId: mainInventory.productId,
        productName: products.name,
        productSku: products.sku,
        transactionType: mainInventory.transactionType,
        quantity: mainInventory.quantity,
        stockQuantity: mainInventory.stockQuantity,
        unitPrice: mainInventory.unitPrice,
        costPrice: mainInventory.costPrice,
        sellPrice: mainInventory.sellPrice,
        avgPrice: mainInventory.avgPrice,
        supplierId: mainInventory.supplierId,
        customerId: mainInventory.customerId,
        supplierInvoiceNumber: mainInventory.supplierInvoiceNumber,
        customerInvoiceNumber: mainInventory.customerInvoiceNumber,
        totalAmount: mainInventory.totalAmount,
        description: mainInventory.description,
        createdAt: mainInventory.createdAt,
      })
      .from(mainInventory)
      .leftJoin(products, eq(mainInventory.productId, products.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined as any)
      .orderBy(orderBy === 'desc' ? desc(mainInventory.createdAt) : asc(mainInventory.createdAt))
      .limit(1000) // Limit for PDF
      .execute();

    // Calculate summary
    const totalTransactions = transactions.length;
    const totalQuantity = transactions.reduce((sum: number, t: any) => sum + Number(t.quantity || 0), 0);
    const totalAmount = transactions.reduce((sum: number, t: any) => sum + Number(t.totalAmount || 0), 0);
    
    console.log(`Found ${totalTransactions} transactions for PDF export`);
    
    // Import jsPDF
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Main Inventory Report', 14, 20);
    
    // Add generated date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Add date range if specified
    if (fromDate || toDate) {
      const dateRange = `Period: ${fromDate || 'All time'} - ${toDate || 'Present'}`;
      doc.text(dateRange, 14, 35);
    }
    
    // Add summary
    doc.setFontSize(12);
    doc.text('Summary:', 14, 45);
    doc.setFontSize(10);
    doc.text(`Total Transactions: ${totalTransactions}`, 14, 52);
    doc.text(`Total Quantity: ${totalQuantity}`, 14, 57);
    
    // Add table headers
    let yPosition = 72;
    const rowHeight = 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    // Header text
    doc.text('Date', 14, yPosition);
    doc.text('Product', 37, yPosition);
    doc.text('Type', 76, yPosition);
    doc.text('Qty', 105, yPosition);
    doc.text('Unit', 125, yPosition);
    doc.text('Amount', 145, yPosition);
    doc.text('Stock', 170, yPosition);

    // Header borders
    doc.rect(10, yPosition - 5, 24, rowHeight);   // Date
    doc.rect(34, yPosition - 5, 40, rowHeight);   // Product
    doc.rect(74, yPosition - 5, 26, rowHeight);   // Type
    doc.rect(100, yPosition - 5, 18, rowHeight);  // Qty
    doc.rect(118, yPosition - 5, 20, rowHeight);  // Unit
    doc.rect(138, yPosition - 5, 26, rowHeight);  // Amount
    doc.rect(164, yPosition - 5, 32, rowHeight);  // Stock
    
    // Reset font
    doc.setFont('helvetica', 'normal');
    yPosition += rowHeight;
    
    // Add transactions
    transactions.forEach((transaction: any) => {
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
        
        // Re-add headers on new page
        doc.setFont('helvetica', 'bold');
        doc.text('Date', 14, yPosition);
        doc.text('Product', 37, yPosition);
        doc.text('Type', 76, yPosition);
        doc.text('Qty', 105, yPosition);
        doc.text('Unit', 125, yPosition);
        doc.text('Amount', 145, yPosition);
        doc.text('Stock', 170, yPosition);

        // Header borders
        doc.rect(10, yPosition - 5, 24, rowHeight);
        doc.rect(34, yPosition - 5, 40, rowHeight);
        doc.rect(74, yPosition - 5, 26, rowHeight);
        doc.rect(100, yPosition - 5, 18, rowHeight);
        doc.rect(118, yPosition - 5, 20, rowHeight);
        doc.rect(138, yPosition - 5, 26, rowHeight);
        doc.rect(164, yPosition - 5, 32, rowHeight);
        doc.setFont('helvetica', 'normal');
        yPosition += rowHeight;
      }
      
      const date = new Date(transaction.createdAt).toLocaleDateString();
      const product = (transaction.productName || transaction.productId || '').substring(0, 15);
      const type = transaction.transactionType || '';
      const qty = Number(transaction.quantity || 0).toString();
      const unit = Number(transaction.unitPrice || 0).toFixed(2);
      const amount = Number(transaction.totalAmount || 0).toFixed(2);
      const stock = Number(transaction.stockQuantity || 0).toString();
      
      // Row borders
      doc.rect(10, yPosition - 5, 24, rowHeight);
      doc.rect(34, yPosition - 5, 40, rowHeight);
      doc.rect(74, yPosition - 5, 26, rowHeight);
      doc.rect(100, yPosition - 5, 18, rowHeight);
      doc.rect(118, yPosition - 5, 20, rowHeight);
      doc.rect(138, yPosition - 5, 26, rowHeight);
      doc.rect(164, yPosition - 5, 32, rowHeight);

      // Row text
      doc.text(date, 14, yPosition);
      doc.text(product, 37, yPosition);
      doc.text(type, 76, yPosition);
      doc.text(qty, 105, yPosition);
      doc.text(unit, 123, yPosition);
      doc.text(amount, 145, yPosition);
      doc.text(stock, 170, yPosition);
      
      yPosition += rowHeight;
    });
    
    // Generate PDF buffer
    console.log('Generating PDF buffer...');
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    console.log(`PDF buffer generated, size: ${pdfBuffer.length} bytes`);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="main-inventory-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('exportMainInventoryPDF error:', err);
    if (err.message.includes('Invalid')) {
      const apiErr = makeApiError('BAD_REQUEST', err.message, { status: 400 });
      return res.status(400).json(fail(apiErr));
    }
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};
