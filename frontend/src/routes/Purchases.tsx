import { useState } from 'react';
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
import { suppliersApi } from '@/lib/api';
import type { Purchase, Supplier } from '@/lib/types';

// Mock data
const mockPurchases: Purchase[] = [
  {
    id: '1',
    productId: '1',
    productName: 'Laptop Pro 15"',
    quantity: 10,
    unitCost: 899.99,
    totalAmount: 8999.90,
    supplierName: 'TechCorp',
    purchaseDate: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    productId: '2',
    productName: 'Wireless Mouse',
    quantity: 50,
    unitCost: 25.99,
    totalAmount: 1299.50,
    supplierName: 'AccessoryWorld',
    purchaseDate: '2024-01-14T14:30:00Z',
    createdAt: '2024-01-14T14:30:00Z',
    updatedAt: '2024-01-14T14:30:00Z',
  },
];

export function Purchases() {
  const queryClient = useQueryClient();
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
    mutationFn: (id: string) => suppliersApi.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsDeleteDialogOpen(false);
      setSelectedSupplier(null);
    },
  });

  const filteredPurchases = mockPurchases.filter(purchase => {
    const matchesSearch = purchase.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStartDate = !startDate || purchase.purchaseDate >= startDate;
    const matchesEndDate = !endDate || purchase.purchaseDate <= endDate;
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const filteredSuppliers = suppliers.filter(supplier => {
    if (!supplierFilter) return true;
    return supplier.name.toLowerCase().includes(supplierFilter.toLowerCase());
  });

  const totalSpent = filteredPurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);

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
          <Button variant="outline" onClick={() => setIsSupplierModalOpen(true)}>
            Add Supplier
          </Button>
          <Button>Add Purchase</Button>
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
              <div className="text-2xl font-bold">{filteredPurchases.length}</div>
              <div className="text-sm text-muted-foreground">Total Purchases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {filteredPurchases.length > 0 ? formatCurrency(totalSpent / filteredPurchases.length) : '$0.00'}
              </div>
              <div className="text-sm text-muted-foreground">Average Purchase</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchases and Suppliers - Side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Purchases Table - Takes 2/3 width */}
        <Card className="lg:col-span-2 overflow-visible">
          <CardHeader>
            <CardTitle>Purchase Records ({filteredPurchases.length})</CardTitle>
            <CardDescription>
              List of all purchase transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-visible">
            {/* Filters - Inside Purchase Records Section */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search purchases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
                    <th className="text-left p-4">Product</th>
                    <th className="text-left p-4">Supplier</th>
                    <th className="text-left p-4">Quantity</th>
                    <th className="text-left p-4">Unit Cost</th>
                    <th className="text-left p-4">Total</th>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td className="p-4">
                        <div className="font-medium">{purchase.productName}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{purchase.supplierName}</div>
                      </td>
                      <td className="p-4">{purchase.quantity}</td>
                      <td className="p-4">{formatCurrency(purchase.unitCost)}</td>
                      <td className="p-4 font-medium">{formatCurrency(purchase.totalAmount)}</td>
                      <td className="p-4">{formatDate(purchase.purchaseDate)}</td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="destructive" size="sm">Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Suppliers - Right Side - Takes 1/3 width */}
        <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Suppliers ({filteredSuppliers.length})</CardTitle>
          <CardDescription>
            Manage your suppliers
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-visible">
          {/* Supplier Filter */}
          <div className="mb-4">
            <Input
              placeholder="Filter by supplier name..."
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
            />
          </div>

          {/* Suppliers Table */}
          {suppliersLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading suppliers...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No suppliers found. Add one to get started.
            </div>
          ) : (
            <div className="overflow-visible">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Bank Name</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td className="p-4">
                        <div className="font-medium">{supplier.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-muted-foreground">
                          {supplier.bankAccName || '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <SupplierActionsMenu
                          onEdit={() => handleEditSupplier(supplier)}
                          onDelete={() => handleDeleteSupplier(supplier)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        </Card>
      </div>

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
            {selectedSupplier?.bankAccName && (
              <p className="text-sm text-muted-foreground">
                Bank: {selectedSupplier.bankAccName}
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
