import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { customersApi, salesApi } from '@/lib/api';
import CustomerTransactionsSection from '@/components/customers/CustomerTransactionsSection';
import SalesInvoiceDetailModal from '@/components/customers/SalesInvoiceDetailModal';
import AddSaleModal from '@/components/customers/AddSaleModal';
import type { Customer, SaleEntry, SaleItemEntry, SaleStatus } from '../../../shared/types';
import { formatCurrency, formatDate } from '@/lib/helpers';

export function SalesCustomer() {
  const { customerId } = useParams();
  const queryClient = useQueryClient();
  const cid = Number(customerId);

  const { data: customer, isLoading: customerLoading } = useQuery<Customer>({
    queryKey: ['customer', cid],
    queryFn: () => customersApi.getCustomer(cid),
    enabled: Number.isFinite(cid),
  });

  const [search, setSearch] = useState('');
  const { data: sales = [], isLoading: salesLoading, refetch } = useQuery<SaleEntry[]>({
    queryKey: ['sales', { customerId: cid }],
    queryFn: () => salesApi.getSales({ customerId: cid }),
    enabled: Number.isFinite(cid),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return sales;
    const q = search.toLowerCase();
    return sales.filter(p => p.invoiceNumber?.toLowerCase().includes(q));
  }, [sales, search]);

  const [openAdd, setOpenAdd] = useState(false);
  const [openInvoice, setOpenInvoice] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SaleEntry | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<SaleItemEntry[]>([]);
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusDraft, setStatusDraft] = useState<SaleStatus | null>(null);

  const onCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['sales', { customerId: cid }] });
    setOpenAdd(false);
  };

  const balanceColor = useMemo(() => {
    if (!customer) return 'text-foreground';
    const v = customer.currentBalance;
    if (v > 0) return 'text-green-600';
    if (v < 0) return 'text-red-600';
    return 'text-foreground';
  }, [customer]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Details</h1>
          <p className="text-muted-foreground">Nested under sales</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Account Balance</div>
            <div className={`text-2xl font-semibold ${balanceColor}`}>
              {customerLoading || !customer ? '—' : formatCurrency(customer.currentBalance)}
            </div>
          </div>

          {/* <div className="text-right">
            <div className="text-sm text-muted-foreground">Receivable</div>
            <div className="text-2xl font-semibold text-green-600">
              {customerLoading || !customer ? '—' : formatCurrency(customer.receivable)}
            </div>
          </div> */}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{customerLoading ? 'Loading…' : customer?.name}</CardTitle>
          <CardDescription>Customer ID: {customerId}</CardDescription>
        </CardHeader>
        <CardContent>
          {customerLoading ? (
            <div className="py-6 text-muted-foreground">Loading customer...</div>
          ) : customer ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div>{customer.email || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div>{customer.phone || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Contact Person</div>
                <div>{customer.contactPerson || '—'}</div>
              </div>
              <div className="md:col-span-3">
                <div className="text-sm text-muted-foreground">Address</div>
                <div>{customer.address || '—'}</div>
              </div>
              {customer.description && (
                <div className="md:col-span-3">
                  <div className="text-sm text-muted-foreground">Description</div>
                  <div>{customer.description}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-destructive">Customer not found</div>
          )}
        </CardContent>
      </Card>

      {/* Add Sale Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sales</h2>
        <Button onClick={() => setOpenAdd(true)}>Add Sale</Button>
      </div>
      <AddSaleModal open={openAdd} onOpenChange={setOpenAdd} customerId={cid} onCreated={onCreated} />

      {/* Invoices list */}
      <Card className="overflow-visible">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Invoices ({filtered.length})</CardTitle>
              <CardDescription>All invoices for this customer</CardDescription>
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
          {salesLoading ? (
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
                      <td className="p-2 md:p-3 text-right font-medium">{formatCurrency(inv.totalAmount as any)}</td>
                      <td className="p-2 md:p-3 capitalize">{inv.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Transactions Section */}
      <CustomerTransactionsSection customerId={cid} />

      {/* Invoice detail modal */}
      <SalesInvoiceDetailModal
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
          const items = await salesApi.getSaleItems(invoiceId);
          setInvoiceItems(items);
        }}
        statusDraft={statusDraft}
        onChangeStatus={setStatusDraft}
        onSave={async () => {
          if (!selectedInvoice || statusDraft === null || statusDraft === selectedInvoice.status) return;
          setSavingStatus(true);
          try {
            const updated = await salesApi.updateSale(selectedInvoice.id, { status: statusDraft });
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
