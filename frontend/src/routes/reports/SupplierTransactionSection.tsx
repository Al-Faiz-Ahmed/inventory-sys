import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { supplierTransactionsApi, suppliersApi, purchasesApi } from '@/lib/api';
import type { Supplier, SupplierTransactionEntry, SupplierTransactionType } from '../../../../shared/types';

export const SupplierTransactionSection: React.FC = () => {
  // defaults: current month
  const defaultDateRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    const toISO = (d: Date) => d.toISOString().slice(0, 10);
    return { start: toISO(start), end: toISO(end) };
  }, []);

  // modal open
  const [filterOpen, setFilterOpen] = useState(false);

  // supplier search
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [supplierQuery, setSupplierQuery] = useState('');
  const [supplierSuggestions, setSupplierSuggestions] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<null | { id: number; name: string }>(null);
  const [supplierDetails, setSupplierDetails] = useState<Supplier | null>(null);

  useEffect(() => {
    suppliersApi.getSuppliers().then(setAllSuppliers).catch(() => {});
  }, []);

  useEffect(() => {
    const q = supplierQuery.trim().toLowerCase();
    if (!q) { setSupplierSuggestions([]); return; }
    const sugg = allSuppliers.filter(s => String(s.id).includes(q) || s.name.toLowerCase().includes(q)).slice(0, 8);
    setSupplierSuggestions(sugg);
  }, [supplierQuery, allSuppliers]);

  // filters
  const [filters, setFilters] = useState({
    txnTypes: new Set<SupplierTransactionType>(),
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
    limit: 500,
    orderBy: 'desc' as 'asc' | 'desc',
  });
  useEffect(() => {
    setFilters(p => ({ ...p, startDate: defaultDateRange.start, endDate: defaultDateRange.end }));
  }, [defaultDateRange]);

  // results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SupplierTransactionEntry[]>([]);
  const [displayRows, setDisplayRows] = useState<Array<SupplierTransactionEntry & { invoiceNo?: string }>>([]);
  const [hasFetched, setHasFetched] = useState(false);

  // Exports
  const handleExportCSV = async () => {
    if (!selectedSupplier) return;
    
    try {
      const exportFilters: any = {
        fromDate: filters.startDate,
        toDate: filters.endDate,
        transactionType: Array.from(filters.txnTypes)[0] || undefined,
        minAmount: filters.minAmount || undefined,
        maxAmount: filters.maxAmount || undefined,
        search: supplierQuery || undefined,
      };
      
      await supplierTransactionsApi.exportCSV(selectedSupplier.id, exportFilters);
    } catch (error: any) {
      console.error('CSV export failed:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to export CSV';
      alert(errorMessage);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedSupplier) return;
    
    try {
      const exportFilters: any = {
        fromDate: filters.startDate,
        toDate: filters.endDate,
        transactionType: Array.from(filters.txnTypes)[0] || undefined,
        minAmount: filters.minAmount || undefined,
        maxAmount: filters.maxAmount || undefined,
        search: supplierQuery || undefined,
      };
      
      await supplierTransactionsApi.exportPDF(selectedSupplier.id, exportFilters);
    } catch (error: any) {
      console.error('PDF export failed:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to export PDF';
      alert(errorMessage);
    }
  };

  function escapeHtml(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
  }

  const resetFilters = () => {
    setFilters({
      txnTypes: new Set<SupplierTransactionType>(),
      minAmount: '',
      maxAmount: '',
      startDate: defaultDateRange.start,
      endDate: defaultDateRange.end,
      limit: 500,
      orderBy: 'desc',
    });
    setRows([]);
    setDisplayRows([]);
    setError(null);
    setHasFetched(false);
  };

  const fetchData = async (explicitSupplierId?: number) => {
    setLoading(true);
    setError(null);
    setRows([]);
    try {
      const supplierId = explicitSupplierId ?? selectedSupplier?.id ?? null;
      if (!supplierId) throw new Error('Please select a supplier from the search box.');
      const base: any = {
        fromDate: filters.startDate || undefined,
        toDate: filters.endDate || undefined,
        minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
        maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
      };
      const types = Array.from(filters.txnTypes);
      const runTypes: (SupplierTransactionType | undefined)[] = types.length ? types : [undefined];
      const all: SupplierTransactionEntry[] = [];
      for (const t of runTypes) {
        const res = await supplierTransactionsApi.list(supplierId, { ...base, transactionType: t as any });
        all.push(...res);
      }
      all.sort((a, b) => filters.orderBy === 'asc' ? (a.createdAt > b.createdAt ? 1 : -1) : (a.createdAt < b.createdAt ? 1 : -1));
      const limited = all.slice(0, Math.max(0, filters.limit || 0));
      setRows(limited);

      // Enrich with invoice numbers for referenceId (purchaseId)
      const uniquePurchaseIds = Array.from(new Set(limited.map(r => r.referenceId).filter(Boolean))) as number[];
      const invoiceMap = new Map<number, string>();
      for (const pid of uniquePurchaseIds) {
        try {
          const purchase = await purchasesApi.getPurchase(pid);
          invoiceMap.set(pid, purchase.invoiceNumber);
        } catch {}
      }
      setDisplayRows(limited.map(r => ({ ...r, invoiceNo: r.referenceId ? invoiceMap.get(r.referenceId) : undefined })));
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch supplier transactions');
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Supplier Transaction Report</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} disabled={!selectedSupplier}>Generate CSV</Button>
            <Button onClick={handleExportPDF} disabled={!selectedSupplier}>Generate PDF</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div>
          <Label className="mb-1 block">Supplier</Label>
          <div className="relative">
            <Input
              placeholder="Search by ID or Name"
              value={selectedSupplier ? `${selectedSupplier.id} - ${selectedSupplier.name}` : supplierQuery}
              onChange={(e) => { setSelectedSupplier(null); setSupplierQuery(e.target.value); }}
            />
            {supplierSuggestions.length > 0 && !selectedSupplier && (
              <div className="absolute z-10 mt-1 w-full rounded border bg-background shadow">
                {supplierSuggestions.map(s => (
                  <button
                    type="button"
                    key={s.id}
                    className="w-full text-left px-3 py-2 hover:bg-muted/60"
                    onClick={async () => {
                      setSelectedSupplier({ id: s.id, name: s.name });
                      setSupplierQuery('');
                      setSupplierSuggestions([]);
                      try { const det = await suppliersApi.getSupplier(s.id); setSupplierDetails(det); } catch {}
                      fetchData(s.id);
                    }}
                  >
                    {s.id} - {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <Button variant="outline" onClick={() => setFilterOpen(true)}>Open Filters</Button>
            <Button onClick={() => fetchData()} disabled={!selectedSupplier || loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {!loading && hasFetched && rows.length === 0 && (
          <div className="text-sm text-muted-foreground">Nothing found regarding your data.</div>
        )}
        {displayRows.length > 0 && (
          <div className="overflow-auto rounded border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-2 py-1 text-left">SR NO</th>
                  <th className="px-2 py-1 text-left">Type</th>
                  <th className="px-2 py-1 text-left">Amount</th>
                  <th className="px-2 py-1 text-left">Balance</th>
                  <th className="px-2 py-1 text-left">Invoice No</th>
                  <th className="px-2 py-1 text-left">Description</th>
                  <th className="px-2 py-1 text-left">Created At</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((r, idx) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-2 py-1">{idx + 1}</td>
                    <td className="px-2 py-1 capitalize">{r.transactionType}</td>
                    <td className="px-2 py-1">{Number(r.amount).toFixed(2)}</td>
                    <td className="px-2 py-1">{Number(r.balanceAmount).toFixed(2)}</td>
                    <td className="px-2 py-1">{r.invoiceNo ?? '-'}</td>
                    <td className="px-2 py-1">{r.description ?? '-'}</td>
                    <td className="px-2 py-1">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Filters Modal */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent>
          <DialogClose onClick={() => setFilterOpen(false)} />
          <DialogHeader>
            <DialogTitle>Supplier Transaction Filters</DialogTitle>
            <DialogDescription>Select filters and apply to fetch results</DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-4 space-y-4">
            <div>
              <Label className="mb-2 block">Transaction Types</Label>
              <div className="flex flex-wrap gap-4">
                {(['purchase','payment','refund','adjustment'] as SupplierTransactionType[]).map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.txnTypes.has(t)}
                      onChange={() => {
                        setFilters((p) => {
                          const next = new Set(p.txnTypes as Set<SupplierTransactionType>);
                          next.has(t) ? next.delete(t) : next.add(t);
                          return { ...p, txnTypes: next };
                        });
                      }}
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Min Amount</Label>
                <Input type="number" value={filters.minAmount} onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1 block">Max Amount</Label>
                <Input type="number" value={filters.maxAmount} onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Start Date</Label>
                <Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1 block">End Date</Label>
                <Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label className="mb-1 block">Limit (rows)</Label>
                <Input type="number" min={1} value={filters.limit} onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value || 0) })} />
              </div>
              <div>
                <Label className="mb-1 block">Order By</Label>
                <select
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  value={filters.orderBy}
                  onChange={(e) => setFilters({ ...filters, orderBy: e.target.value as 'asc' | 'desc' })}
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={resetFilters} disabled={loading}>Reset Filters</Button>
            <Button onClick={() => { setFilterOpen(false); fetchData(); }} disabled={loading || !selectedSupplier}>{loading ? 'Loading...' : 'Apply Filters'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
