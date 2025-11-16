import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { supplierTransactionsApi, suppliersApi, purchasesApi } from '@/lib/api';
import type { SupplierTransactionEntry, SupplierTransactionType, Supplier } from '../../../shared/types';
import { SupplierTransactionSection } from '@/routes/reports/SupplierTransactionSection';

export function ReportsPurchase() {
  const navigate = useNavigate();
  const [productOpen, setProductOpen] = useState(false);

  // defaults: current month
  const defaultDateRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    const toISO = (d: Date) => d.toISOString().slice(0, 10);
    return { start: toISO(start), end: toISO(end) };
  }, []);

  // (Supplier Transaction moved into its own component)

  // Product Purchase Report (scaffold; heavy backend filtering recommended)
  const [productFilters, setProductFilters] = useState({
    productQuery: '',
    products: [] as string[],
    minQty: '',
    maxQty: '',
    minAmount: '',
    maxAmount: '',
    minUnitPrice: '',
    maxUnitPrice: '',
    startDate: '',
    endDate: '',
    limit: 500,
    invoiceId: '',
  });
  useEffect(() => {
    setProductFilters((p) => ({ ...p, startDate: defaultDateRange.start, endDate: defaultDateRange.end }));
  }, [defaultDateRange]);

  const addProductToken = () => {
    const v = productFilters.productQuery.trim();
    if (!v) return;
    setProductFilters((p) => ({ ...p, products: [...p.products, v], productQuery: '' }));
  };
  const removeProductToken = (idx: number) => {
    setProductFilters((p) => ({ ...p, products: p.products.filter((_, i) => i !== idx) }));
  };
  const resetProduct = () => {
    setProductFilters({
      productQuery: '',
      products: [],
      minQty: '',
      maxQty: '',
      minAmount: '',
      maxAmount: '',
      minUnitPrice: '',
      maxUnitPrice: '',
      startDate: defaultDateRange.start,
      endDate: defaultDateRange.end,
      limit: 500,
      invoiceId: '',
    });
    setProductResults([]);
    setProductError(null);
  };

  const [productLoading, setProductLoading] = useState(false);
  const [productResults, setProductResults] = useState<any[]>([]);
  const [productError, setProductError] = useState<string | null>(null);
  const [productHasFetched, setProductHasFetched] = useState(false);
  const [productDisplayRows, setProductDisplayRows] = useState<any[]>([]);

  const fetchProductReport = async () => {
    setProductLoading(true);
    setProductError(null);
    setProductResults([]);
    try {
      // NOTE: Backend lacks a dedicated items report endpoint.
      // Placeholder: fetch recent purchases (no date filter available in current API), then fetch items per purchase and filter client-side.
      const purchases = await purchasesApi.getPurchases();
      const items: any[] = [];
      for (const p of purchases) {
        const pi = await purchasesApi.getPurchaseItems(p.id);
        for (const it of pi) {
          items.push({ ...it, purchaseId: p.id, date: p.date, invoiceNumber: p.invoiceNumber });
        }
      }
      // Apply rudimentary client-side filters
      const prodTokens = productFilters.products.map((x) => x.toLowerCase());
      let filtered = items.filter((it) => {
        const matchProduct = prodTokens.length
          ? prodTokens.some((t) => it.productId.toLowerCase().includes(t) || it.productName.toLowerCase().includes(t))
          : true;
        const qtyOk = (
          (productFilters.minQty === '' || it.quantity >= Number(productFilters.minQty)) &&
          (productFilters.maxQty === '' || it.quantity <= Number(productFilters.maxQty))
        );
        const amount = it.total;
        const amtOk = (
          (productFilters.minAmount === '' || amount >= Number(productFilters.minAmount)) &&
          (productFilters.maxAmount === '' || amount <= Number(productFilters.maxAmount))
        );
        const unitOk = (
          (productFilters.minUnitPrice === '' || it.unitPrice >= Number(productFilters.minUnitPrice)) &&
          (productFilters.maxUnitPrice === '' || it.unitPrice <= Number(productFilters.maxUnitPrice))
        );
        const dateOk = (
          (!productFilters.startDate || it.date >= productFilters.startDate) &&
          (!productFilters.endDate || it.date <= productFilters.endDate)
        );
        const invoiceOk = productFilters.invoiceId ? String(purchaseIdOr(it.purchaseId)).includes(productFilters.invoiceId) || (it.invoiceNumber || '').includes(productFilters.invoiceId) : true;
        return matchProduct && qtyOk && amtOk && unitOk && dateOk && invoiceOk;
      });
      filtered = filtered
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, Math.max(0, productFilters.limit || 0));
      setProductResults(filtered);
      setProductDisplayRows(filtered.map(it => ({
        id: it.id,
        purchaseId: it.purchaseId,
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
        invoiceNumber: it.invoiceNumber,
        date: it.date,
      })));
    } catch (e: any) {
      setProductError(e?.message || 'Failed to fetch product purchase report');
    } finally {
      setProductLoading(false);
      setProductHasFetched(true);
    }
  };

  const purchaseIdOr = (id: any) => id;

  // Product exports
  const handleProductExportCSV = () => {
    if (!productDisplayRows.length) return;
    const headers = ['ID','Purchase ID','Product ID','Product Name','Qty','Unit Price','Total','Invoice No','Date'];
    const lines = [headers.join(',')];
    for (const r of productDisplayRows) {
      const row = [
        r.id,
        r.purchaseId,
        r.productId,
        (r.productName || '').replace(/\n/g,' '),
        r.quantity,
        Number(r.unitPrice).toFixed(2),
        Number(r.total).toFixed(2),
        r.invoiceNumber || '-',
        new Date(r.date).toLocaleDateString(),
      ];
      lines.push(row.map((v) => typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g,'""')}"` : String(v)).join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-purchase-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleProductExportPDF = () => {
    if (!productDisplayRows.length) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const styles = `
      <style>
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        thead { background: #f4f4f5; }
        h1 { font-size: 18px; margin-bottom: 12px; }
      </style>
    `;
    const header = `<h1>Product Purchase Report</h1>`;
    const thead = `<thead><tr>
      <th>ID</th><th>Purchase ID</th><th>Product ID</th><th>Product Name</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Invoice No</th><th>Date</th>
    </tr></thead>`;
    const tbody = '<tbody>' + productDisplayRows.map(r => `
      <tr>
        <td>${r.id}</td>
        <td>${r.purchaseId}</td>
        <td>${r.productId}</td>
        <td>${(r.productName || '').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>
        <td>${r.quantity}</td>
        <td>${Number(r.unitPrice).toFixed(2)}</td>
        <td>${Number(r.total).toFixed(2)}</td>
        <td>${r.invoiceNumber || '-'}</td>
        <td>${new Date(r.date).toLocaleDateString()}</td>
      </tr>
    `).join('') + '</tbody>';
    w.document.write(`<html><head><title>Product Purchase Report</title>${styles}</head><body>${header}<table>${thead}${tbody}</table></body></html>`);
    w.document.close();
    w.focus();
    w.print();
    setTimeout(() => { try { w.close(); } catch {} }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Purchase Reports</h1>
          <p className="text-muted-foreground">Supplier Transaction and Product Purchase reports</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/reports')}>Back to Reports</Button>
      </div>

      <SupplierTransactionSection />

      {/* Product Purchase Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Product Purchase Report</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleProductExportCSV} disabled={!productDisplayRows.length}>Generate CSV</Button>
              <Button onClick={handleProductExportPDF} disabled={!productDisplayRows.length}>Generate PDF</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Use filters to fetch product purchase report</div>
            <Button variant="outline" onClick={() => setProductOpen(true)}>Open Filters</Button>
          </div>

          {productError && <div className="text-sm text-red-600">{productError}</div>}
          {!productLoading && productHasFetched && productResults.length === 0 && (
            <div className="text-sm text-muted-foreground">Nothing found regarding your data.</div>
          )}
          {productResults.length > 0 && (
            <div className="text-sm text-muted-foreground">Results: {productResults.length}</div>
          )}
          {productDisplayRows.length > 0 && (
            <div className="overflow-auto rounded border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Purchase ID</th>
                    <th className="px-3 py-2 text-left">Product ID</th>
                    <th className="px-3 py-2 text-left">Product Name</th>
                    <th className="px-3 py-2 text-left">Qty</th>
                    <th className="px-3 py-2 text-left">Unit Price</th>
                    <th className="px-3 py-2 text-left">Total</th>
                    <th className="px-3 py-2 text-left">Invoice No</th>
                    <th className="px-3 py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {productDisplayRows.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="px-3 py-2">{r.id}</td>
                      <td className="px-3 py-2">{r.purchaseId}</td>
                      <td className="px-3 py-2">{r.productId}</td>
                      <td className="px-3 py-2">{r.productName}</td>
                      <td className="px-3 py-2">{r.quantity}</td>
                      <td className="px-3 py-2">{Number(r.unitPrice).toFixed(2)}</td>
                      <td className="px-3 py-2">{Number(r.total).toFixed(2)}</td>
                      <td className="px-3 py-2">{r.invoiceNumber || '-'}</td>
                      <td className="px-3 py-2">{new Date(r.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier section moved into its own component */}

      {/* Product Filters Modal */}
      <Dialog open={productOpen} onOpenChange={setProductOpen}>
        <DialogContent>
          <DialogClose onClick={() => setProductOpen(false)} />
          <DialogHeader>
            <DialogTitle>Product Purchase Filters</DialogTitle>
            <DialogDescription>Select filters and apply to fetch results</DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-4 space-y-4">
            <div>
              <Label className="mb-2 block">Products (add one or more by ID or Name)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Type product id or name and press Add"
                  value={productFilters.productQuery}
                  onChange={(e) => setProductFilters({ ...productFilters, productQuery: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addProductToken();
                    }
                  }}
                />
                <Button type="button" onClick={addProductToken}>Add</Button>
              </div>
              {productFilters.products.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {productFilters.products.map((p, idx) => (
                    <span key={`${p}-${idx}`} className="inline-flex items-center gap-2 rounded border px-2 py-1 text-sm">
                      {p}
                      <button className="text-muted-foreground hover:text-foreground" onClick={() => removeProductToken(idx)} aria-label="Remove">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Qty Min</Label>
                <Input type="number" value={productFilters.minQty} onChange={(e) => setProductFilters({ ...productFilters, minQty: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1 block">Qty Max</Label>
                <Input type="number" value={productFilters.maxQty} onChange={(e) => setProductFilters({ ...productFilters, maxQty: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md-grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Min Amount</Label>
                <Input type="number" value={productFilters.minAmount} onChange={(e) => setProductFilters({ ...productFilters, minAmount: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1 block">Max Amount</Label>
                <Input type="number" value={productFilters.maxAmount} onChange={(e) => setProductFilters({ ...productFilters, maxAmount: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Unit Price Min</Label>
                <Input type="number" value={productFilters.minUnitPrice} onChange={(e) => setProductFilters({ ...productFilters, minUnitPrice: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1 block">Unit Price Max</Label>
                <Input type="number" value={productFilters.maxUnitPrice} onChange={(e) => setProductFilters({ ...productFilters, maxUnitPrice: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Start Date</Label>
                <Input type="date" value={productFilters.startDate} onChange={(e) => setProductFilters({ ...productFilters, startDate: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1 block">End Date</Label>
                <Input type="date" value={productFilters.endDate} onChange={(e) => setProductFilters({ ...productFilters, endDate: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label className="mb-1 block">Limit (rows)</Label>
                <Input type="number" min={1} value={productFilters.limit} onChange={(e) => setProductFilters({ ...productFilters, limit: Number(e.target.value || 0) })} />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-1 block">Invoice ID</Label>
                <Input value={productFilters.invoiceId} onChange={(e) => setProductFilters({ ...productFilters, invoiceId: e.target.value })} placeholder="Optional" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={resetProduct} disabled={productLoading}>Reset Filters</Button>
            <Button onClick={() => { setProductOpen(false); fetchProductReport(); }} disabled={productLoading}>{productLoading ? 'Loading...' : 'Apply Filters'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ReportsPurchase;
