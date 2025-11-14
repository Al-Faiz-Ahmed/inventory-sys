import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { customerTransactionsApi, salesApi } from '@/lib/api';
import type { CustomerTransactionEntry, SupplierTransactionsFilters } from '../../../../shared/types';
import { formatCurrency, formatDate } from '@/lib/helpers';

export default function CustomerTransactionsSection({ customerId }: { customerId: number }) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<SupplierTransactionsFilters>({});
  const [openFilters, setOpenFilters] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);

  // Add Transaction form state
  const [txType, setTxType] = useState<'payment'|'refund'|'adjustment'>('payment');
  const [amount, setAmount] = useState<string>('');
  const [referenceId, setReferenceId] = useState<number | null>(null);
  const [invoiceQuery, setInvoiceQuery] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sales for invoice search (fetched lazily when add modal opens)
  const salesQuery = useQuery({
    queryKey: ['sales-for-customer', customerId],
    queryFn: async () => salesApi.getSales({ customerId }),
    enabled: openAdd && Number.isFinite(customerId),
  });

  const query = useQuery<CustomerTransactionEntry[]>({
    queryKey: ['customer-transactions', { customerId, filters, search }],
    queryFn: () => customerTransactionsApi.list(customerId, {
      ...filters,
      search: search || undefined,
    } as any),
    enabled: Number.isFinite(customerId),
  });

  return (
    <Card className="overflow-visible">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Customer Transactions ({query.data?.length ?? 0})</CardTitle>
            <CardDescription>Filter and search customer related transactions</CardDescription>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" onClick={() => query.refetch()}>Refresh</Button>
            <Button onClick={() => setOpenFilters(true)}>Filters</Button>
            <Button onClick={() => setOpenAdd(true)}>Add Transaction</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-visible">
        {query.isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
        ) : (query.data?.length ?? 0) === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No transactions found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2 md:p-3">Date</th>
                  <th className="text-left p-2 md:p-3">Type</th>
                  <th className="text-right p-2 md:p-3">Amount</th>
                  <th className="text-left p-2 md:p-3">Reference</th>
                  <th className="text-left p-2 md:p-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {query.data!.map((tx) => (
                  <tr key={tx.id}>
                    <td className="p-2 md:p-3">{formatDate(tx.createdAt)}</td>
                    <td className="p-2 md:p-3 capitalize">{tx.transactionType}</td>
                    <td className="p-2 md:p-3 text-right">{formatCurrency(tx.amount)}</td>
                    <td className="p-2 md:p-3">{tx.referenceId ?? '—'}</td>
                    <td className="p-2 md:p-3">{tx.description ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={openFilters} onOpenChange={setOpenFilters}>
        <DialogContent className="max-w-lg w-full p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-xl font-semibold">Filter Transactions</DialogTitle>
            <DialogClose onClick={() => setOpenFilters(false)} />
          </DialogHeader>
          <div className="px-6 py-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From date</Label>
                <Input type="date" value={filters.fromDate || ''} onChange={(e) => setFilters((f: SupplierTransactionsFilters) => ({ ...f, fromDate: e.target.value || undefined }))} />
              </div>
              <div className="space-y-2">
                <Label>To date</Label>
                <Input type="date" value={filters.toDate || ''} onChange={(e) => setFilters((f: SupplierTransactionsFilters) => ({ ...f, toDate: e.target.value || undefined }))} />
              </div>
              <div className="space-y-2">
                <Label>Transaction type</Label>
                <select
                  className="w-full border rounded h-10 px-3 bg-background"
                  value={filters.transactionType || ''}
                  onChange={(e) => setFilters((f: SupplierTransactionsFilters) => ({ ...f, transactionType: (e.target.value || undefined) as any }))}
                >
                  <option value="">All</option>
                  <option value="sale">Sale</option>
                  <option value="payment">Payment</option>
                  <option value="refund">Refund</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Min amount</Label>
                <Input type="number" step="0.01" value={(filters.minAmount as any) || ''} onChange={(e) => setFilters((f: SupplierTransactionsFilters) => ({ ...f, minAmount: e.target.value ? Number(e.target.value) : undefined }))} />
              </div>
              <div className="space-y-2">
                <Label>Max amount</Label>
                <Input type="number" step="0.01" value={(filters.maxAmount as any) || ''} onChange={(e) => setFilters((f: SupplierTransactionsFilters) => ({ ...f, maxAmount: e.target.value ? Number(e.target.value) : undefined }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFilters({} as any)}>Clear</Button>
              <Button onClick={() => { setOpenFilters(false); (query as any).refetch(); }}>Apply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Modal */}
      <Dialog open={openAdd} onOpenChange={(v) => { setOpenAdd(v); if (!v) { setFormError(null); setAmount(''); setReferenceId(null); setInvoiceQuery(''); setDescription(''); setTxType('payment'); } }}>
        <DialogContent className="max-w-lg w-full p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-xl font-semibold">Add Customer Transaction</DialogTitle>
            <DialogClose onClick={() => setOpenAdd(false)} />
          </DialogHeader>
          <div className="px-6 py-6 space-y-4">
            {formError ? <div className="text-sm text-red-600">{formError}</div> : null}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <select
                  className="w-full border rounded h-10 px-3 bg-background"
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as any)}
                >
                  <option value="payment">Payment</option>
                  <option value="refund">Refund</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0.01}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Invoice Id (Optional)</Label>
                <Input
                  placeholder="Type to search invoice number..."
                  value={invoiceQuery}
                  onChange={(e) => { setInvoiceQuery(e.target.value); setReferenceId(null); }}
                />
                {openAdd && salesQuery.data && invoiceQuery.trim().length > 0 ? (
                  <div className="border rounded max-h-40 overflow-auto bg-background">
                    {salesQuery.data
                      .filter((p) => p.invoiceNumber.toLowerCase().includes(invoiceQuery.toLowerCase()))
                      .slice(0, 10)
                      .map((p) => (
                        <button
                          type="button"
                          key={p.id}
                          className={`w-full text-left px-3 py-2 hover:bg-accent ${referenceId === p.id ? 'bg-accent' : ''}`}
                          onClick={() => { setReferenceId(p.id); setInvoiceQuery(p.invoiceNumber); }}
                        >
                          #{p.id} — {p.invoiceNumber}
                        </button>
                      ))}
                  </div>
                ) : null}
                <div className="text-xs text-muted-foreground">Leave empty if not linked to any invoice.</div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Description<span className="text-red-600">*</span></Label>
                <Input
                  placeholder="Enter description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenAdd(false)} disabled={submitting}>Cancel</Button>
              <Button
                onClick={async () => {
                  try {
                    setFormError(null);
                    if (!description.trim()) {
                      setFormError('Description is required');
                      return;
                    }
                    const amt = Number(amount);
                    if (!Number.isFinite(amt) || amt <= 0) {
                      setFormError('Enter a valid amount greater than 0');
                      return;
                    }
                    setSubmitting(true);
                    await customerTransactionsApi.create(customerId, {
                      transactionType: txType,
                      amount: amt,
                      referenceId: referenceId ?? undefined,
                      description: description.trim(),
                    } as any);
                    setSubmitting(false);
                    setOpenAdd(false);
                    setAmount('');
                    setReferenceId(null);
                    setInvoiceQuery('');
                    setDescription('');
                    setTxType('payment');
                    (query as any).refetch();
                  } catch (err: any) {
                    setSubmitting(false);
                    setFormError(err?.message || 'Failed to create transaction');
                  }
                }}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
