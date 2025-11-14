import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { customersApi, salesApi } from '@/lib/api';
import { AddCustomerModal } from '@/components/AddCustomerModal';
import { EditCustomerModal } from '@/components/EditCustomerModal';
import type { Customer, SaleEntry } from '../../../shared/types';

export function Sales() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [customerFilter, setCustomerFilter] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () => customersApi.getCustomers(),
  });

  const { data: recentSales = [] } = useQuery<SaleEntry[]>({
    queryKey: ['sales', { searchTerm, startDate, endDate }],
    queryFn: () => salesApi.getSales(),
  });

  const filteredCustomers = customers.filter(c =>
    !customerFilter || c.name.toLowerCase().includes(customerFilter.toLowerCase())
  );

  const filteredSales = recentSales.filter(s => {
    const matchesSearch = !searchTerm || s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStartDate = !startDate || s.date >= startDate;
    const matchesEndDate = !endDate || s.date <= endDate;
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales</h1>
          <p className="text-muted-foreground">Manage customers and sales invoices</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsCustomerModalOpen(true)}>
            Add Customer
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{filteredSales.length}</div>
              <div className="text-sm text-muted-foreground">Total Sales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{filteredSales.length > 0 ? formatCurrency(totalRevenue / filteredSales.length) : '$0.00'}</div>
              <div className="text-sm text-muted-foreground">Average Sale</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers - Horizontal Cards Section */}
      <Card className="overflow-visible">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Customers</CardTitle>
              <CardDescription>Browse customers. Click to view details.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search by name..."
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-56"
              />
              <Button variant="outline" onClick={() => { /* live filter */ }}>Search</Button>
              <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}>Refresh</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {customersLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading customers...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No customers found.</div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  className="min-w-[220px] rounded-lg border border-border p-4 hover:shadow cursor-pointer"
                  onClick={() => navigate(`/sales/customers/${c.id}`)}
                >
                  <div className="text-sm text-muted-foreground">ID: {c.id}</div>
                  <div className="text-base font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{c.email || '—'}</div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setEditingCustomer(c); }}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sales Section */}
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Recent Sales ({filteredSales.length})</CardTitle>
          <CardDescription>Latest sales invoices</CardDescription>
        </CardHeader>
        <CardContent className="overflow-visible">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] items-center gap-4">
            <div className="flex gap-2">
              <Input placeholder="Search invoices..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <Button variant="outline" onClick={() => { /* live filter */ }}>Search</Button>
              <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['sales'] })}>Refresh</Button>
            </div>
            <Input type="date" placeholder="Start Date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" placeholder="End Date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="overflow-visible">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-4">Invoice #</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-right p-4">Total</th>
                  <th className="text-left p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((s) => (
                  <tr key={s.id}>
                    <td className="p-4 font-medium">{s.invoiceNumber}</td>
                    <td className="p-4">{formatDate(s.date)}</td>
                    <td className="p-4 text-right font-medium">{formatCurrency(Number(s.totalAmount))}</td>
                    <td className="p-4 capitalize">{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddCustomerModal open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen} />
      <EditCustomerModal
        open={!!editingCustomer}
        onOpenChange={(open: boolean) => { if (!open) setEditingCustomer(null); }}
        customer={editingCustomer}
        onSaved={() => { queryClient.invalidateQueries({ queryKey: ['customers'] }); setEditingCustomer(null); }}
      />
    </div>
  );
}
