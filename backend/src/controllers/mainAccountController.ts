// src/controllers/mainAccountController.ts
import { Request, Response } from 'express';
import { db } from '../database/db';
import { mainAccount } from '../models/main-account';
import { and, eq, gte, lte, ilike, asc, desc, inArray } from 'drizzle-orm';
import { ok, fail, makeApiError } from '../../../shared/error';

function toDecimalString(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num.toFixed(2);
}

const allowedTxn = ['debit', 'credit'] as const;
const allowedSrc = ['supplier','customer','expense','supplier_refund','customer_refund','adjustment','other'] as const;

async function getFilteredMainAccountTransactions(req: Request) {
  const { fromDate, toDate, transactionType, sourceType, minAmount, maxAmount, search } = (req.body || {}) as any;

  const whereConditions: any[] = [];

  // Default to current month if no date filters provided
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Date range filter - default to current month
  if (fromDate) {
    whereConditions.push(gte(mainAccount.createdAt, new Date(fromDate as string)));
  } else {
    // Default to start of current month
    whereConditions.push(gte(mainAccount.createdAt, startOfMonth));
  }

  if (toDate) {
    whereConditions.push(lte(mainAccount.createdAt, new Date(toDate as string)));
  } else {
    // Default to end of current month
    whereConditions.push(lte(mainAccount.createdAt, endOfMonth));
  }
  if (transactionType) {
    if (Array.isArray(transactionType)) {
      const validTxnTypes = transactionType.filter(t => allowedTxn.includes(t as any));
      if (validTxnTypes.length > 0) {
        whereConditions.push(inArray(mainAccount.transactionType, validTxnTypes as any));
      }
    } else if (allowedTxn.includes(String(transactionType) as any)) {
      whereConditions.push(eq(mainAccount.transactionType, transactionType as any));
    } else {
      throw new Error('Invalid transactionType');
    }
  }
  if (sourceType) {
    if (Array.isArray(sourceType)) {
      const validSrcTypes = sourceType.filter(s => allowedSrc.includes(s as any));
      if (validSrcTypes.length > 0) {
        whereConditions.push(inArray(mainAccount.sourceType, validSrcTypes as any));
      }
    } else if (allowedSrc.includes(String(sourceType) as any)) {
      whereConditions.push(eq(mainAccount.sourceType, sourceType as any));
    } else {
      throw new Error('Invalid sourceType');
    }
  }
  if (minAmount !== undefined && minAmount !== '') {
    const s = toDecimalString(minAmount);
    if (!s) {
      throw new Error('Invalid minAmount');
    }
    whereConditions.push(gte(mainAccount.transactionAmount, s as any));
  }
  if (maxAmount !== undefined && maxAmount !== '') {
    const s = toDecimalString(maxAmount);
    if (!s) {
      throw new Error('Invalid maxAmount');
    }
    whereConditions.push(lte(mainAccount.transactionAmount, s as any));
  }
  if (search && String(search).trim().length > 0) {
    const q = `%${String(search).trim()}%`;
    whereConditions.push(ilike(mainAccount.description, q));
  }

  const transactions = await db
    .select()
    .from(mainAccount)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined as any)
    .orderBy(desc(mainAccount.createdAt)); // Order by date descending (newest first)

  return { transactions };
}

export const listMainAccount = async (req: Request, res: Response) => {
  try {
    // Support both query params (for GET) and body (for POST)
    const filters = req.method === 'POST' ? (req.body || {}) : (req.query || {});
    const { fromDate, toDate, transactionType, sourceType, minAmount, maxAmount, sourceId, referenceId, orderBy, limit, search } = filters;

    const whereClauses: any[] = [];

    // Default to current month if no date filters provided
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Date range filter - default to current month
    if (fromDate) {
      const d = new Date(fromDate);
      if (isNaN(d.getTime())) {
        const err = makeApiError('BAD_REQUEST', 'Invalid fromDate', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(gte(mainAccount.createdAt, d));
    } else {
      // Default to start of current month
      whereClauses.push(gte(mainAccount.createdAt, startOfMonth));
    }

    if (toDate) {
      const d = new Date(toDate);
      if (isNaN(d.getTime())) {
        const err = makeApiError('BAD_REQUEST', 'Invalid toDate', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(lte(mainAccount.createdAt, d));
    } else {
      // Default to end of current month
      whereClauses.push(lte(mainAccount.createdAt, endOfMonth));
    }

    // Transaction type filter - support multiple types
    if (transactionType) {
      if (Array.isArray(transactionType)) {
        const validTxnTypes = transactionType.filter(t => allowedTxn.includes(t as any));
        if (validTxnTypes.length > 0) {
          whereClauses.push(inArray(mainAccount.transactionType, validTxnTypes as any));
        }
      } else if (allowedTxn.includes(String(transactionType) as any)) {
        whereClauses.push(eq(mainAccount.transactionType, transactionType as any));
      } else {
        const err = makeApiError('BAD_REQUEST', 'Invalid transactionType', { status: 400 });
        return res.status(400).json(fail(err));
      }
    }

    // Source type filter - support multiple types
    if (sourceType) {
      if (Array.isArray(sourceType)) {
        const validSrcTypes = sourceType.filter(s => allowedSrc.includes(s as any));
        if (validSrcTypes.length > 0) {
          whereClauses.push(inArray(mainAccount.sourceType, validSrcTypes as any));
        }
      } else if (allowedSrc.includes(String(sourceType) as any)) {
        whereClauses.push(eq(mainAccount.sourceType, sourceType as any));
      } else {
        const err = makeApiError('BAD_REQUEST', 'Invalid sourceType', { status: 400 });
        return res.status(400).json(fail(err));
      }
    }

    // Amount filters - only apply if provided
    if (minAmount !== undefined && minAmount !== null && minAmount !== '') {
      const s = toDecimalString(minAmount);
      if (!s) {
        const err = makeApiError('BAD_REQUEST', 'Invalid minAmount', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(gte(mainAccount.transactionAmount, s as any));
    }

    if (maxAmount !== undefined && maxAmount !== null && maxAmount !== '') {
      const s = toDecimalString(maxAmount);
      if (!s) {
        const err = makeApiError('BAD_REQUEST', 'Invalid maxAmount', { status: 400 });
        return res.status(400).json(fail(err));
      }
      whereClauses.push(lte(mainAccount.transactionAmount, s as any));
    }

    // Source and reference filters
    if (sourceId) {
      whereClauses.push(eq(mainAccount.sourceId, Number(sourceId)));
    }

    if (referenceId) {
      whereClauses.push(eq(mainAccount.referenceId, Number(referenceId)));
    }

    // Search filter
    if (search && String(search).trim().length > 0) {
      const q = `%${String(search).trim()}%`;
      whereClauses.push(ilike(mainAccount.description, q));
    }

    // Build query with ordering and limit
    const orderDirection = orderBy === 'asc' ? asc(mainAccount.createdAt) : desc(mainAccount.createdAt);
    const limitValue = limit ? Number(limit) : 500;
    
    let baseQuery = db
      .select()
      .from(mainAccount)
      .where(whereClauses.length > 0 ? and(...whereClauses) : undefined);
    
    // Execute query with ordering and limit
    const transactions = await baseQuery
      .orderBy(orderDirection)
      .limit(limitValue > 0 ? limitValue : 500)
      .execute();

    const totalBalanceResult = await db
      .select({ balanceAmount: mainAccount.balanceAmount })
      .from(mainAccount)
      .orderBy(desc(mainAccount.createdAt))
      .limit(1)
      .execute();

    const totalBalance = totalBalanceResult.length > 0 ? totalBalanceResult[0].balanceAmount : '0';

    return res.status(200).json(ok({ transactions, totalBalance }));
  } catch (error) {
    console.error('Error listing main account transactions:', error);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const createMainAccount = async (req: Request, res: Response) => {
  try {
    const { transactionType, sourceType, sourceId, referenceId, transactionAmount, balanceAmount, description } = req.body || {};

    if (!transactionType || !allowedTxn.includes(String(transactionType) as any)) {
      const err = makeApiError('BAD_REQUEST', "transactionType must be 'debit' or 'credit'", { status: 400 });
      return res.status(400).json(fail(err));
    }
    if (!sourceType || !allowedSrc.includes(String(sourceType) as any)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid sourceType', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const amountStr = toDecimalString(transactionAmount);
    const balanceStr = toDecimalString(balanceAmount);
    if (!amountStr) {
      const err = makeApiError('BAD_REQUEST', 'Invalid transactionAmount', { status: 400 });
      return res.status(400).json(fail(err));
    }
    if (!balanceStr) {
      const err = makeApiError('BAD_REQUEST', 'Invalid balanceAmount', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const srcIdNum = sourceId !== undefined && sourceId !== null && sourceId !== '' ? Number(sourceId) : null;
    if (srcIdNum !== null && !Number.isFinite(srcIdNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid sourceId', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const refIdNum = referenceId !== undefined && referenceId !== null && referenceId !== '' ? Number(referenceId) : null;
    if (refIdNum !== null && !Number.isFinite(refIdNum)) {
      const err = makeApiError('BAD_REQUEST', 'Invalid referenceId', { status: 400 });
      return res.status(400).json(fail(err));
    }

    const inserted = await db.insert(mainAccount).values({
      transactionType: transactionType as any,
      sourceType: sourceType as any,
      sourceId: srcIdNum,
      referenceId: refIdNum,
      transactionAmount: amountStr,
      balanceAmount: balanceStr,
      description: description ? String(description) : null,
    }).returning();

    return res.status(201).json(ok(inserted[0], 'Main account entry created successfully', 201));
  } catch (err) {
    console.error('createMainAccount error:', err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const exportMainAccountCSV = async (req: Request, res: Response) => {
  try {
    const { transactions } = await getFilteredMainAccountTransactions(req);
    
    // Create CSV content
    const headers = ['SR NO', 'Date', 'Type', 'Source', 'Description', 'Amount', 'Balance'];
    const csvLines = [headers.join(',')];
    
    transactions.forEach((tx, idx) => {
      const row = [
        idx + 1,
        tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '-',
        tx.transactionType,
        tx.sourceType,
        (tx.description || '-').replace(/"/g, '""'),
        Number(tx.transactionAmount).toFixed(2),
        Number(tx.balanceAmount).toFixed(2)
      ];
      csvLines.push(row.map(field => {
        if (typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
          return `"${field}"`;
        }
        return String(field);
      }).join(','));
    });

    const csvContent = csvLines.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="main-account-report-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    console.error('exportMainAccountCSV error:', err);
    if (err.message.includes('Invalid')) {
      const apiErr = makeApiError('BAD_REQUEST', err.message, { status: 400 });
      return res.status(400).json(fail(apiErr));
    }
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const exportMainAccountPDF = async (req: Request, res: Response) => {
  try {
    const { transactions } = await getFilteredMainAccountTransactions(req);
    const { fromDate, toDate } = (req.body || {}) as any;
    
    // Import jsPDF
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Main Account Report', 14, 20);
    
    // Add generated date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Add date range
    let dateRangeText = '';
    if (fromDate || toDate) {
      const start = fromDate ? new Date(fromDate as string).toLocaleDateString() : 'Start';
      const end = toDate ? new Date(toDate as string).toLocaleDateString() : 'End';
      dateRangeText = `Date Range: ${start} - ${end}`;
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString();
      dateRangeText = `Date Range: ${startOfMonth} - ${endOfMonth}`;
    }
    doc.text(dateRangeText, 14, 37);
    
    // Add table headers (styled similar to main inventory PDF)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    let yPosition = 55;
    const rowHeight = 7;

    // Columns: Date | Type | Source | Description | Amount | Balance
    doc.text('Date', 14, yPosition);
    doc.text('Type', 32, yPosition);
    doc.text('Source', 48, yPosition);
    doc.text('Description', 74, yPosition);
    doc.text('Amount', 140, yPosition);
    doc.text('Balance', 164, yPosition);

    // Header borders (per cell)
    doc.rect(10, yPosition - 5, 20, rowHeight);   // Date
    doc.rect(30, yPosition - 5, 16, rowHeight);   // Type
    doc.rect(46, yPosition - 5, 24, rowHeight);   // Source
    doc.rect(70, yPosition - 5, 68, rowHeight);   // Description
    doc.rect(138, yPosition - 5, 24, rowHeight);  // Amount
    doc.rect(162, yPosition - 5, 34, rowHeight);  // Balance

    doc.setFont('helvetica', 'normal');
    yPosition += rowHeight;

    // Add transactions
    transactions.forEach((tx) => {
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;

        // Redraw headers on new page
        doc.setFont('helvetica', 'bold');
        doc.text('Date', 14, yPosition);
        doc.text('Type', 32, yPosition);
        doc.text('Source', 48, yPosition);
        doc.text('Description', 74, yPosition);
        doc.text('Amount', 138, yPosition);
        doc.text('Balance', 164, yPosition);

        // Header borders
        doc.rect(10, yPosition - 5, 20, rowHeight);
        doc.rect(30, yPosition - 5, 16, rowHeight);
        doc.rect(46, yPosition - 5, 24, rowHeight);
        doc.rect(70, yPosition - 5, 68, rowHeight);
        doc.rect(138, yPosition - 5, 24, rowHeight);
        doc.rect(162, yPosition - 5, 34, rowHeight);

        doc.setFont('helvetica', 'normal');
        yPosition += rowHeight;
      }

      const date = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '-';
      const type = tx.transactionType || '';
      const source = tx.sourceType || '';
      const description = (tx.description || '').substring(0, 30);
      const amount = Number(tx.transactionAmount).toFixed(2);
      const balance = Number(tx.balanceAmount).toFixed(2);

      // Row borders
      doc.rect(10, yPosition - 5, 20, rowHeight);
      doc.rect(30, yPosition - 5, 16, rowHeight);
      doc.rect(46, yPosition - 5, 24, rowHeight);
      doc.rect(70, yPosition - 5, 68, rowHeight);
      doc.rect(138, yPosition - 5, 24, rowHeight);
      doc.rect(162, yPosition - 5, 34, rowHeight);

      // Row text
      doc.text(date, 10, yPosition);
      doc.text(type, 32, yPosition);
      doc.text(source, 48, yPosition);
      doc.text(description, 74, yPosition);
      doc.text(amount, 140, yPosition);
      doc.text(balance, 164, yPosition);

      yPosition += rowHeight;
    });
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="main-account-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('exportMainAccountPDF error:', err);
    if (err.message.includes('Invalid')) {
      const apiErr = makeApiError('BAD_REQUEST', err.message, { status: 400 });
      return res.status(400).json(fail(apiErr));
    }
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};
