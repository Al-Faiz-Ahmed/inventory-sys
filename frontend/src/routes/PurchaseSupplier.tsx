import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { suppliersApi, purchasesApi } from '@/lib/api';
import SupplierTransactionsSection from '@/components/suppliers/SupplierTransactionsSection';
import InvoiceDetailModal from '@/components/suppliers/InvoiceDetailModal';
import AddPurchaseModal from '@/components/suppliers/AddPurchaseModal';
import type { Supplier, PurchaseEntry, PurchaseItemEntry, PurchaseStatus } from '../../../shared/types';
import { formatCurrency, formatDate } from '@/lib/helpers';

export function PurchaseSupplier() {
  const { supplierId } = useParams();
  const queryClient = useQueryClient();
  const sid = Number(supplierId);

  const { data: supplier, isLoading: supplierLoading } = useQuery<Supplier>({
    queryKey: ['supplier', sid],
    queryFn: () => suppliersApi.getSupplier(sid),
    enabled: Number.isFinite(sid),
  });

  const [search, setSearch] = useState('');
  const { data: purchases = [], isLoading: purchasesLoading, refetch } = useQuery<PurchaseEntry[]>({
    queryKey: ['purchases', { supplierId: sid }],
    queryFn: () => purchasesApi.getPurchases({ supplierId: sid }),
    enabled: Number.isFinite(sid),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return purchases;
    const q = search.toLowerCase();
    return purchases.filter(p => p.invoiceNumber?.toLowerCase().includes(q));
  }, [purchases, search]);

  const [openAdd, setOpenAdd] = useState(false);
  const [openInvoice, setOpenInvoice] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseEntry | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<PurchaseItemEntry[]>([]);
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusDraft, setStatusDraft] = useState<PurchaseStatus | null>(null);

  const onCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['purchases', { supplierId: sid }] });
    setOpenAdd(false);
  };

  const balanceColor = useMemo(() => {
    if (!supplier) return 'text-foreground';
    const v = supplier.currentBalance;
    if (v > 0) return 'text-green-600';
    if (v < 0) return 'text-red-600';
    return 'text-foreground';
  }, [supplier]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supplier Details</h1>
          <p className="text-muted-foreground">Nested under purchases</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Account Balance</div>
            <div className={`text-2xl font-semibold ${balanceColor}`}>
              {supplierLoading || !supplier ? '—' : formatCurrency(supplier.currentBalance)}
            </div>
          </div>

          {
           supplier && supplier.currentBalance < 0 && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Debt</div>
                <div className="text-2xl font-semibold text-red-600">
                  {supplierLoading || !supplier ? '—' : formatCurrency(Math.abs(supplier.currentBalance))}
                </div>
              </div>

            )

          }


        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{supplierLoading ? 'Loading…' : supplier?.name}</CardTitle>
          <CardDescription>Supplier ID: {supplierId}</CardDescription>
        </CardHeader>
        <CardContent>
          {supplierLoading ? (
            <div className="py-6 text-muted-foreground">Loading supplier...</div>
          ) : supplier ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div>{supplier.email || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div>{supplier.phone || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Contact Person</div>
                <div>{supplier.contactPerson || '—'}</div>
              </div>
              <div className="md:col-span-3">
                <div className="text-sm text-muted-foreground">Address</div>
                <div>{supplier.address || '—'}</div>
              </div>
              {supplier.description && (
                <div className="md:col-span-3">
                  <div className="text-sm text-muted-foreground">Description</div>
                  <div>{supplier.description}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-destructive">Supplier not found</div>
          )}
        </CardContent>
      </Card>

      {/* Add Purchase Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Purchases</h2>
        <Button onClick={() => setOpenAdd(true)}>Add Purchase</Button>
      </div>
      <AddPurchaseModal
        open={openAdd}
        onOpenChange={setOpenAdd}
        supplierId={sid}
        onCreated={onCreated}
      />

      {/* Invoices list */}
      <Card className="overflow-visible">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Invoices ({filtered.length})</CardTitle>
              <CardDescription>All invoices for this supplier</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search by invoice number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
              <Button variant="outline" onClick={() => refetch()}>Refresh</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-visible">
          {purchasesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No invoices found.</div>
          ) : (
            <div className="overflow-visible">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2 md:p-3">Invoice #</th>
                    <th className="text-left p-2 md:p-3">Date</th>
                    <th className="text-right p-2 md:p-3">Total</th>
                    <th className="text-left p-2 md:p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => (
                    <tr key={inv.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => {
                      setSelectedInvoice(inv);
                      setStatusDraft(inv.status);
                      setOpenInvoice(true);
                    }}>
                      <td className="p-2 md:p-3 font-medium">{inv.invoiceNumber}</td>
                      <td className="p-2 md:p-3">{formatDate(inv.date)}</td>
                      <td className="p-2 md:p-3 text-right font-medium">{formatCurrency(inv.totalAmount)}</td>
                      <td className="p-2 md:p-3 capitalize">{inv.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier Transactions Section */}
      <SupplierTransactionsSection supplierId={sid} />

      {/* Invoice detail modal */}
      <InvoiceDetailModal
        open={openInvoice}
        onOpenChange={(o) => {
          if (!o) {
            setSelectedInvoice(null);
            setInvoiceItems([]);
            setStatusDraft(null);
          }
          setOpenInvoice(o);
        }}
        invoice={selectedInvoice}
        items={invoiceItems}
        onLoadItems={async (invoiceId) => {
          const items = await purchasesApi.getPurchaseItems(invoiceId);
          setInvoiceItems(items);
        }}
        statusDraft={statusDraft}
        onChangeStatus={setStatusDraft}
        onSave={async () => {
          if (!selectedInvoice || statusDraft === null || statusDraft === selectedInvoice.status) return;
          setSavingStatus(true);
          try {
            const updated = await purchasesApi.updatePurchase(selectedInvoice.id, { status: statusDraft });
            setSelectedInvoice(updated);
            setSavingStatus(false);
            setOpenInvoice(false);
            await refetch();
          } catch (e) {
            setSavingStatus(false);
          }
        }}
        saving={savingStatus}
      />
    </div>
  );
}

