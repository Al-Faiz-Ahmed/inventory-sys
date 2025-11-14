import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { AddSupplierModal } from '@/components/AddSupplierModal';
import { EditSupplierModal } from '@/components/EditSupplierModal';
import { SupplierActionsMenu } from '@/components/SupplierActionsMenu';
import { suppliersApi, purchasesApi } from '@/lib/api';
import type { Supplier } from '@/lib/types';

export function Purchases() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isEditSupplierModalOpen, setIsEditSupplierModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Fetch suppliers
  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getSuppliers(),
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: (id: number) => suppliersApi.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsDeleteDialogOpen(false);
      setSelectedSupplier(null);
    },
  });

  // Fetch purchases (used for invoice mapping and IDs to fetch items)
  const { data: allPurchases = [], isLoading: purchasesLoading, refetch: refetchPurchases } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => purchasesApi.getPurchases(),
  });

  // Fetch all purchase items for the loaded purchases
  const { data: allPurchaseItems = [], isLoading: itemsLoading, refetch: refetchItems } = useQuery({
    queryKey: ['purchase-items', allPurchases.map(p => p.id)],
    enabled: allPurchases.length > 0,
    queryFn: async () => {
      const lists = await Promise.all(allPurchases.map(p => purchasesApi.getPurchaseItems(p.id)));
      return lists.flat();
    }
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const isWithinRange = (iso: string) => {
    const t = new Date(iso).getTime();
    return t >= monthStart.getTime() && t <= monthEnd.getTime();
  };

  // Use createdAt to represent transaction recency
  const currentMonthPurchases = allPurchases.filter(p => isWithinRange(p.createdAt));

  const supplierNameById = new Map<number, string>(suppliers.map(s => [s.id, s.name] as [number, string]));
  const invoiceByPurchaseId = new Map<number, string>(allPurchases.map(p => [p.id, p.invoiceNumber] as [number, string]));

  // Items view for Recent section: filter by createdAt (current month) and optional search/date; newest first
  const currentMonthItems = allPurchaseItems.filter(it => isWithinRange(it.createdAt));

  const filteredItems = currentMonthItems
    .filter((it) => {
      const productMatch = String(it.productName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const invoice = invoiceByPurchaseId.get(it.purchaseId) || '';
      const invoiceMatch = invoice.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = !searchTerm || productMatch || invoiceMatch;
      const createdAtDate = new Date(it.createdAt);
      const startOk = !startDate || createdAtDate >= new Date(startDate);
      const endOk = !endDate || createdAtDate <= new Date(endDate);
      return matchesSearch && startOk && endOk;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredSuppliers = suppliers.filter(supplier => {
    if (!supplierFilter) return true;
    return supplier.name.toLowerCase().includes(supplierFilter.toLowerCase());
  });

  const totalSpent = filteredItems.reduce((sum: number, it: any) => sum + Number(it.total ?? 0), 0);

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsEditSupplierModalOpen(true);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedSupplier) {
      deleteSupplierMutation.mutate(selectedSupplier.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Purchases</h1>
          <p className="text-muted-foreground">
            Manage supplier purchases and inventory restocking
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsSupplierModalOpen(true)}>
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{filteredItems.length}</div>
              <div className="text-sm text-muted-foreground">Total Purchases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {filteredItems.length > 0 ? formatCurrency(totalSpent / filteredItems.length) : '$0.00'}
              </div>
              <div className="text-sm text-muted-foreground">Average Purchase</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers - Horizontal Cards Section */}
      <Card className="overflow-visible">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Suppliers</CardTitle>
              <CardDescription>Browse suppliers. Click to view details.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search by name..."
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-56"
              />
              <Button
                variant="outline"
                onClick={() => {/* magnifier search action - filter is applied live */}}
              >
                Search
              </Button>
              <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['suppliers'] })}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {suppliersLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading suppliers...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No suppliers found.</div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {filteredSuppliers.map((s) => (
                <div
                  key={s.id}
                  className="min-w-[220px] rounded-lg border border-border p-4 hover:shadow cursor-pointer"
                  onClick={() => navigate(`/purchases/suppliers/${s.id}`)}
                >
                  <div className="text-sm text-muted-foreground">ID: {s.id}</div>
                  <div className="text-base font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.contactPerson || '—'}</div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleEditSupplier(s); }}>Edit</Button>
                    {/* <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDeleteSupplier(s); }}>Delete</Button> */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Purchase Items Section */}
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Recent Purchase Items ({filteredItems.length})</CardTitle>
          <CardDescription>Latest items added to purchases this month</CardDescription>
        </CardHeader>
        <CardContent className="overflow-visible">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] items-center gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search items (product or invoice)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline" onClick={() => {/* magnifier search action */}}>Search</Button>
              <Button variant="outline" onClick={() => { refetchPurchases(); refetchItems(); }}>Refresh</Button>
            </div>
            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="overflow-visible">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-4">Item</th>
                  <th className="text-left p-4">Invoice</th>
                  <th className="text-left p-4">Quantity</th>
                  <th className="text-left p-4">Unit Price</th>
                  <th className="text-left p-4">Total</th>
                  <th className="text-left p-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {purchasesLoading || itemsLoading ? (
                  <tr>
                    <td className="p-4 text-muted-foreground" colSpan={5}>Loading purchases...</td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td className="p-4 text-muted-foreground" colSpan={5}>No purchase items in current month.</td>
                  </tr>
                ) : (
                  filteredItems.map((it) => (
                    <tr key={it.id}>
                      <td className="p-4">
                        <div className="font-medium">{it.productName}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{invoiceByPurchaseId.get(it.purchaseId) || `#${it.purchaseId}`}</div>
                      </td>
                      <td className="p-4">{it.quantity}</td>
                      <td className="p-4">{formatCurrency(Number((it as any).unitPrice ?? 0))}</td>
                      <td className="p-4 font-medium">{formatCurrency(Number((it as any).total ?? 0))}</td>
                      <td className="p-4">{formatDate(it.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Supplier Modal */}
      <AddSupplierModal
        open={isSupplierModalOpen}
        onOpenChange={setIsSupplierModalOpen}
      />

      {/* Edit Supplier Modal */}
      <EditSupplierModal
        open={isEditSupplierModalOpen}
        onOpenChange={setIsEditSupplierModalOpen}
        supplier={selectedSupplier}
      />

      {/* Delete Supplier Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-xl font-semibold">Delete Supplier</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground mt-1">
              Are you sure you want to delete this supplier? This action cannot be undone.
            </DialogDescription>
            <DialogClose onClick={() => setIsDeleteDialogOpen(false)} />
          </DialogHeader>
          <div className="px-6 py-6">
            <p className="text-sm">
              Supplier: <span className="font-medium">{selectedSupplier?.name}</span>
            </p>
            {selectedSupplier?.contactPerson && (
              <p className="text-sm text-muted-foreground">
                Contact: {selectedSupplier.contactPerson}
              </p>
            )}
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteSupplierMutation.isPending}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteSupplierMutation.isPending}
              className="min-w-[140px]"
            >
              {deleteSupplierMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
