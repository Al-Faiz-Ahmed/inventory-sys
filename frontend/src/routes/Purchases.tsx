import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/helpers';
import type { Purchase } from '@/lib/types';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredPurchases = mockPurchases.filter(purchase => {
    const matchesSearch = purchase.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStartDate = !startDate || purchase.purchaseDate >= startDate;
    const matchesEndDate = !endDate || purchase.purchaseDate <= endDate;
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const totalSpent = filteredPurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Purchases</h1>
          <p className="text-muted-foreground">
            Manage supplier purchases and inventory restocking
          </p>
        </div>
        <Button>Add Purchase</Button>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </CardContent>
      </Card>

      {/* Purchases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Records ({filteredPurchases.length})</CardTitle>
          <CardDescription>
            List of all purchase transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
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
                  <tr key={purchase.id} className="border-b">
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
    </div>
  );
}
