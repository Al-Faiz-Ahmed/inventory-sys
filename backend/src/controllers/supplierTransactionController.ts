// src/controllers/supplierTransactionController.ts
import { Request, Response } from "express";
import { db } from "../database/db";
import { suppliers } from "../models/supplier";
import { purchases } from "../models/purchases";
import { supplierTransactions } from "../models/supplier-transactions";
import { mainAccount } from "../models/main-account";
import { eq, and, gte, lte, ilike, desc, asc, inArray } from "drizzle-orm";
import { ok, fail, makeApiError } from "../../../shared/error";
import { CustomerTransactionType } from "../../../shared/types";

const allowedTypes = ['purchase','payment','refund','adjustment'] as const;

function toDecimalString(value: any): string | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num.toFixed(2);
}

export const listSupplierTransactions = async (req: Request, res: Response) => {
  try {
    const supplierId = Number(req.params.supplierId);
    if (!Number.isFinite(supplierId)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid supplier id', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const sup = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
    if (sup.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Supplier not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    const { fromDate, toDate, transactionType, minAmount, maxAmount, search } = (req.query || {}) as any;

    const whereClauses: any[] = [eq(supplierTransactions.supplierId, supplierId)];

    if (fromDate) {
      const d = new Date(fromDate);
      if (isNaN(d.getTime())) {
        const err = makeApiError('BAD_REQUEST', 'Invalid fromDate', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(gte(supplierTransactions.createdAt, d as any));
    }
    if (toDate) {
      const d = new Date(toDate);
      if (isNaN(d.getTime())) {
        const err = makeApiError('BAD_REQUEST', 'Invalid toDate', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(lte(supplierTransactions.createdAt, d as any));
    }

    if (transactionType) {
      if (!allowedTypes.includes(String(transactionType) as any)) {
        const err = makeApiError('BAD_REQUEST', 'Invalid transactionType', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(eq(supplierTransactions.transactionType, transactionType as any));
    }

    if (minAmount !== undefined && minAmount !== '') {
      const s = toDecimalString(minAmount);
      if (!s) {
        const err = makeApiError('BAD_REQUEST', 'Invalid minAmount', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(gte(supplierTransactions.amount, s as any));
    }
    if (maxAmount !== undefined && maxAmount !== '') {
      const s = toDecimalString(maxAmount);
      if (!s) {
        const err = makeApiError('BAD_REQUEST', 'Invalid maxAmount', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(lte(supplierTransactions.amount, s as any));
    }

    if (search && String(search).trim().length > 0) {
      const q = `%${String(search).trim()}%`;
      whereClauses.push(ilike(supplierTransactions.description, q));
    }

    const rows = await db
      .select()
      .from(supplierTransactions)
      .where(whereClauses.length > 1 ? and(...whereClauses) : whereClauses[0]);
    return res.status(200).json(ok(rows, 'Supplier transactions fetched successfully', 200));
  } catch (err) {
    console.error('listSupplierTransactions error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const createSupplierTransaction = async (req: Request, res: Response) => {
  try {
    const supplierId = Number(req.params.supplierId);
    if (!Number.isFinite(supplierId)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid supplier id', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const { transactionType, amount, referenceId, description } = req.body || {};

    if (!transactionType || !allowedTypes.includes(String(transactionType) as any)) {
      const err = makeApiError('BAD_REQUEST', "transactionType must be one of 'purchase','payment','refund','adjustment'", { status: 400 });
      return res.status(400).json(fail(err));
    }

    const amountStr = toDecimalString(amount);
    if (!amountStr || Number(amountStr) < 0) {
      const err = makeApiError('BAD_REQUEST', 'amount must be >= 0', { status: 400 });
      return res.status(400).json(fail(err));
    }

    // ensure supplier exists
    const sup = await db.select({ id: suppliers.id, currentBalance: suppliers.currentBalance, debt: suppliers.debt }).from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
    if (sup.length === 0) {
      const err = makeApiError('BAD_REQUEST', 'Supplier not found', { status: 400 });
      return res.status(400).json(fail(err));
    }

    // if referenceId provided, ensure purchase exists
    let refIdNum: number | null = null;
    if (referenceId !== undefined && referenceId !== null) {
      refIdNum = Number(referenceId);
      if (!Number.isFinite(refIdNum)) {
        const err = makeApiError('BAD_REQUEST', 'Invalid referenceId', { status: 400 });
        return res.status(400).json(fail(err));
      }
      const pur = await db.select({ id: purchases.id }).from(purchases).where(eq(purchases.id, refIdNum)).limit(1);
      if (pur.length === 0) {
        const err = makeApiError('BAD_REQUEST', 'Referenced purchase not found', { status: 400 });
        return res.status(400).json(fail(err));
      }
    }

    // Compute running balance for this supplier based on last transaction
    const lastTxn = await db
      .select({ id: supplierTransactions.id, balanceAmount: supplierTransactions.balanceAmount })
      .from(supplierTransactions)
      .where(eq(supplierTransactions.supplierId, supplierId))
      .orderBy(desc(supplierTransactions.id))
      .limit(1);
    const prevBal = lastTxn.length ? Number(lastTxn[0].balanceAmount as any) : Number((sup[0] as any).currentBalance);
    const amtNumForBal = Number(amountStr);
    const isIncrease = transactionType === 'payment' || transactionType === 'refund' || transactionType === 'adjustment';
    const nextBal = (isIncrease ? prevBal + amtNumForBal : prevBal - amtNumForBal);
    const nextBalStr = nextBal.toFixed(2);

    const inserted = await db.insert(supplierTransactions).values({
      supplierId,
      transactionType: transactionType as any,
      amount: amountStr,
      balanceAmount: nextBalStr as any,
      referenceId: refIdNum,
      description: description ? String(description) : null,
    }).returning();

    if (transactionType === 'payment' || transactionType === 'refund' || transactionType === 'adjustment') {
      const mainTxnType = transactionType === 'payment' ? 'debit' : 'credit';
      const mainSrcType = transactionType === 'payment' ? 'supplier' : (transactionType === 'refund' ? 'supplier_refund' : 'adjustment');

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
        sourceId: supplierId,
        referenceId: refIdNum,
        transactionAmount: amountStr,
        balanceAmount: newBalanceStr as any,
        description: description ? String(description) : null,
      });
    }

    const supRow = sup[0] as any;
    const cbNum = Number(supRow.currentBalance);
    const debtNum = Number(supRow.debt);
    const amtNum = Number(amountStr);

    if (transactionType === 'payment') {
      const newDebt = Math.max(0, debtNum - amtNum);
      const newCB = cbNum + amtNum;
      await db.update(suppliers).set({
        currentBalance: newCB.toFixed(2) as any,
        debt: newDebt.toFixed(2) as any,
      }).where(eq(suppliers.id, supplierId));
    } else if (transactionType === 'refund' || transactionType === 'adjustment') {
      const newCB = cbNum + amtNum;
      await db.update(suppliers).set({
        currentBalance: newCB.toFixed(2) as any,
      }).where(eq(suppliers.id, supplierId));
    } else if (transactionType === 'purchase') {
      const newDebt = debtNum + amtNum;
      const newCB = cbNum - amtNum;
      await db.update(suppliers).set({
        currentBalance: newCB.toFixed(2) as any,
        debt: newDebt.toFixed(2) as any,
      }).where(eq(suppliers.id, supplierId));
    }

    return res.status(201).json(ok(inserted[0], 'Supplier transaction created successfully', 201));
  } catch (err) {
    console.error('createSupplierTransaction error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const updateSupplierTransaction = async (req: Request, res: Response) => {
  try {
    const supplierId = Number(req.params.supplierId);
    const idNum = Number(req.params.transactionId);
    if (!Number.isFinite(supplierId) || !Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid ids', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const existing = await db.select().from(supplierTransactions).where(and(eq(supplierTransactions.id, idNum), eq(supplierTransactions.supplierId, supplierId))).limit(1);
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
        const pur = await db.select({ id: purchases.id }).from(purchases).where(eq(purchases.id, refIdNum)).limit(1);
        if (pur.length === 0) {
          const err = makeApiError('BAD_REQUEST', 'Referenced purchase not found', { status: 400 });
          return res.status(400).json(fail(err));
        }
        payload.referenceId = refIdNum;
      }
    }

    if (body.description !== undefined) {
      payload.description = body.description ? String(body.description) : null;
    }

    const updated = await db.update(supplierTransactions).set(payload).where(and(eq(supplierTransactions.id, idNum), eq(supplierTransactions.supplierId, supplierId))).returning();

    return res.status(200).json(ok(updated[0], 'Supplier transaction updated successfully', 200));
  } catch (err) {
    console.error('updateSupplierTransaction error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const deleteSupplierTransaction = async (req: Request, res: Response) => {
  try {
    const supplierId = Number(req.params.supplierId);
    const idNum = Number(req.params.transactionId);
    if (!Number.isFinite(supplierId) || !Number.isFinite(idNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid ids', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const existing = await db.select().from(supplierTransactions).where(and(eq(supplierTransactions.id, idNum), eq(supplierTransactions.supplierId, supplierId))).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Transaction not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    await db.delete(supplierTransactions).where(and(eq(supplierTransactions.id, idNum), eq(supplierTransactions.supplierId, supplierId)));
    return res.status(200).json(ok(null, 'Supplier transaction deleted successfully', 200));
  } catch (err) {
    console.error('deleteSupplierTransaction error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

// Helper function to get filtered transactions (shared between export functions)
async function getFilteredTransactions(req: Request) {
  const supplierId = Number(req.params.supplierId);
  if (!Number.isFinite(supplierId)) {
    throw new Error('Invalid supplier id');
  }

  const sup = await db.select({ id: suppliers.id, name: suppliers.name, contactPerson: suppliers.contactPerson, phone: suppliers.phone }).from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
  if (sup.length === 0) {
    throw new Error('Supplier not found');
  }
  const supplier = sup[0];

  const { fromDate, toDate, transactionType, minAmount, maxAmount, search } = (req.query || {}) as any;

  const whereConditions = [eq(supplierTransactions.supplierId, supplierId)];

  if (fromDate) {
    whereConditions.push(gte(supplierTransactions.createdAt, new Date(fromDate as string)));
  }
  if (toDate) {
    whereConditions.push(lte(supplierTransactions.createdAt, new Date(toDate as string)));
  }
  if (transactionType) {
    if (!allowedTypes.includes(String(transactionType) as any)) {
      throw new Error('Invalid transactionType');
    }
    whereConditions.push(eq(supplierTransactions.transactionType, transactionType as any));
  }

  if (minAmount !== undefined && minAmount !== '') {
    const s = toDecimalString(minAmount);
    if (!s) {
      throw new Error('Invalid minAmount');
    }
    whereConditions.push(gte(supplierTransactions.amount, s as any));
  }
  if (maxAmount !== undefined && maxAmount !== '') {
    const s = toDecimalString(maxAmount);
    if (!s) {
      throw new Error('Invalid maxAmount');
    }
    whereConditions.push(lte(supplierTransactions.amount, s as any));
  }

  if (search && String(search).trim().length > 0) {
    const q = `%${String(search).trim()}%`;
    whereConditions.push(ilike(supplierTransactions.description, q));
  }

  const transactions = await db
    .select()
    .from(supplierTransactions)
    .where(whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0])
    .orderBy(asc(supplierTransactions.createdAt));

  // Fetch invoice numbers for referenceId (purchaseId)
  const invoiceMap = new Map<number, string>();
  const purchaseIds = transactions
    .filter(tx => tx.referenceId && tx.referenceId > 0)
    .map(tx => tx.referenceId!);
  
  if (purchaseIds.length > 0) {
    const purchaseRecords = await db.select({ id: purchases.id, invoiceNumber: purchases.invoiceNumber })
      .from(purchases)
      .where(inArray(purchases.id, purchaseIds));
    
    purchaseRecords.forEach(purchase => {
      invoiceMap.set(purchase.id, purchase.invoiceNumber);
    });
  }

  // Enrich transactions with invoice numbers
  const enrichedTransactions = transactions.map(tx => ({
    ...tx,
    invoiceNo: tx.referenceId ? invoiceMap.get(tx.referenceId) : undefined
  }));

  return { supplier, transactions: enrichedTransactions };
}

// CSV Export
export const exportSupplierTransactionsCSV = async (req: Request, res: Response) => {
  try {
    const { supplier, transactions } = await getFilteredTransactions(req);
    
    // Create CSV content
    const headers = ['SR NO', 'Type', 'Amount', 'Balance', 'Invoice No', 'Description', 'Date'];
    const csvLines = [headers.join(',')];
    
    transactions.forEach((tx, idx) => {
      const row = [
        idx + 1,
        tx.transactionType,
        Number(tx.amount).toFixed(2),
        Number(tx.balanceAmount).toFixed(2),
        tx.referenceId || '-',
        (tx.description || '-').replace(/"/g, '""'),
        new Date(tx.createdAt).toLocaleDateString()
      ];
      csvLines.push(row.map(field => {
        if (typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
          return `"${field}"`;
        }
        return String(field);
      }).join(','));
    });

    const csvContent = csvLines.join('\n');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="supplier-transactions-${supplier.name}-${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    console.error('exportSupplierTransactionsCSV error:', err);
    if (err.message.includes('Invalid') || err.message.includes('not found')) {
      const apiErr = makeApiError('BAD_REQUEST', err.message, { status: 400 });
      return res.status(400).json(fail(apiErr));
    }
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

// PDF Export
export const exportSupplierTransactionsPDF = async (req: Request, res: Response) => {
  try {
    const { supplier, transactions } = await getFilteredTransactions(req);
    
    // Create HTML content for PDF
    const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    
    const contact = supplier.contactPerson || supplier.phone || '-';
    const dateRange = `${req.query.fromDate || '-'} to ${req.query.toDate || '-'}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Supplier Transactions Report</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px;
        }
        .header { 
            margin-bottom: 20px; 
            border-bottom: 2px solid #333; 
            padding-bottom: 10px; 
        }
        .header .title { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 10px; 
        }
        .header .info { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 5px; 
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
        }
        th { 
            background-color: #f2f2f2; 
            font-weight: bold; 
        }
        .summary { 
            margin-top: 20px; 
            padding: 15px; 
            border: 1px solid #ddd; 
            background-color: #f9f9f9; 
        }
        .summary-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 5px; 
        }
        .total { 
            font-weight: bold; 
            font-size: 14px; 
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Supplier Transactions Report</div>
        <div class="info">
            <div><strong>Supplier:</strong> ${escapeHtml(supplier.name)}</div>
            <div><strong>Contact:</strong> ${escapeHtml(contact)}</div>
        </div>
        <div class="info">
            <div><strong>Date Range:</strong> ${escapeHtml(dateRange)}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Balance</th>
            </tr>
        </thead>
        <tbody>
            ${transactions.map(t => `
                <tr>
                    <td>${escapeHtml(new Date(t.createdAt).toLocaleDateString())}</td>
                    <td>${escapeHtml(t.transactionType)}</td>
                    <td>${escapeHtml(t.description || '')}</td>
                    <td style="text-align: right">₹${escapeHtml(t.amount.toString())}</td>
                    <td style="text-align: right">₹${escapeHtml(t.balanceAmount.toString())}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="summary">
        <div class="summary-row">
            <span><strong>Total Transactions:</strong></span>
            <span>${transactions.length}</span>
        </div>
        <div class="summary-row total">
            <span><strong>Total Amount:</strong></span>
            <span>₹${transactions.reduce((sum, t) => sum + Number(t.amount), 0).toFixed(2)}</span>
        </div>
    </div>
</body>
</html>`;

    // Use jspdf to generate PDF
    const { jsPDF } = require('jspdf');
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(14);
    doc.text('Supplier Transactions Report', 20, 15);
    
    // Add supplier info
    doc.setFontSize(9);
    doc.text(`Supplier: ${supplier.name}`, 20, 25);
    doc.text(`Contact: ${supplier.contactPerson || supplier.phone || '-'}`, 20, 32);
    doc.text(`Date Range: ${req.query.fromDate || '-'} to ${req.query.toDate || '-'}`, 20, 39);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 46);
    
    // Add table headers with borders
    doc.setFontSize(8);
    const headers = ['Date', 'Type', 'Description', 'Invoice No', 'Amount', 'Balance'];
    let yPosition = 58; // Increased gap from 50 to 58
    const xPositions = [20, 40, 60, 110, 145, 170]; // Wider spacing
    const colWidths = [20, 20, 50, 35, 25, 25];
    
    // Draw header background
    doc.setFillColor(240, 240, 240);
    doc.rect(xPositions[0], yPosition - 4, xPositions[5] + colWidths[5] - xPositions[0], 6, 'F');
    
    // Draw table borders and headers with padding
    headers.forEach((header, index) => {
      doc.text(header, xPositions[index] + 2, yPosition); // Add left padding
      // Draw vertical lines
      if (index < headers.length - 1) {
        doc.line(xPositions[index + 1], yPosition - 4, xPositions[index + 1], yPosition + 2);
      }
    });
    
    // Draw horizontal lines for header
    doc.line(xPositions[0], yPosition - 4, xPositions[5] + colWidths[5], yPosition - 4);
    doc.line(xPositions[0], yPosition + 2, xPositions[5] + colWidths[5], yPosition + 2);
    
    // Add transactions with borders
    yPosition += 8; // More space between header and first row
    transactions.forEach((transaction) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
        
        // Redraw headers on new page
        doc.setFillColor(240, 240, 240);
        doc.rect(xPositions[0], yPosition - 4, xPositions[5] + colWidths[5] - xPositions[0], 6, 'F');
        headers.forEach((header, index) => {
          doc.text(header, xPositions[index] + 2, yPosition); // Add left padding
          if (index < headers.length - 1) {
            doc.line(xPositions[index + 1], yPosition - 4, xPositions[index + 1], yPosition + 2);
          }
        });
        doc.line(xPositions[0], yPosition - 4, xPositions[5] + colWidths[5], yPosition - 4);
        doc.line(xPositions[0], yPosition + 2, xPositions[5] + colWidths[5], yPosition + 2);
        yPosition += 8;
      }
      
      const date = new Date(transaction.createdAt).toLocaleDateString();
      const description = (transaction.description || '').substring(0, 25); // Increased from 15 to 25
      
      // Add top padding by starting text 2px lower
      const textY = yPosition + 2;
      
      doc.text(date, xPositions[0] + 2, textY); // Add left padding
      doc.text(transaction.transactionType || '', xPositions[1] + 2, textY); // Add left padding
      doc.text(description, xPositions[2] + 2, textY); // Add left padding
      // Add invoice number column - use enriched invoiceNo field
      doc.text((transaction as any).invoiceNo || '-', xPositions[3] + 2, textY); // Add left padding
      
      // Debug and clean amount fields - remove all non-ASCII characters
      console.log('Raw amount:', transaction.amount, typeof transaction.amount);
      console.log('Raw balance:', transaction.balanceAmount, typeof transaction.balanceAmount);
      
      // Convert to string and remove all non-ASCII characters, then clean to numbers only
      const amountStr = String(transaction.amount).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\d.-]/g, '');
      const balanceStr = String(transaction.balanceAmount).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\d.-]/g, '');
      
      console.log('Cleaned amount:', amountStr);
      console.log('Cleaned balance:', balanceStr);
      
      const amount = Number(amountStr) || 0;
      const balance = Number(balanceStr) || 0;
      
      // Try without currency symbol to see if that's causing the issue
      doc.text(`${amount.toFixed(2)}`, xPositions[4] + 2, textY); // Add left padding
      doc.text(`${balance.toFixed(2)}`, xPositions[5] + 2, textY); // Add left padding
      
      // Draw row borders
      doc.line(xPositions[0], yPosition - 2, xPositions[5] + colWidths[5], yPosition - 2);
      doc.line(xPositions[0], yPosition + 5, xPositions[5] + colWidths[5], yPosition + 5);
      
      // Draw vertical lines for each row
      xPositions.forEach((x, index) => {
        if (index < headers.length - 1) {
          doc.line(x + colWidths[index], yPosition - 2, x + colWidths[index], yPosition + 5);
        }
      });
      
      yPosition += 7; // More space between rows
    });
    
    // Draw final bottom border
    doc.line(xPositions[0], yPosition - 2, xPositions[5] + colWidths[5], yPosition - 2);
    
    // Add summary (without total amount)
    yPosition += 8;
    doc.setFontSize(10);
    doc.text(`Total Transactions: ${transactions.length}`, 20, yPosition);
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    // Set proper PDF headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="supplier-transactions-${supplier.name.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('exportSupplierTransactionsPDF error:', err);
    if (err.message.includes('Invalid') || err.message.includes('not found')) {
      const apiErr = makeApiError('BAD_REQUEST', err.message, { status: 400 });
      return res.status(400).json(fail(apiErr));
    }
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};
