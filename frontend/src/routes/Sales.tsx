import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/helpers';
import type { Sale } from '@/lib/types';

// Mock data
const mockSales: Sale[] = [
  {
    id: '1',
    productId: '1',
    productName: 'Laptop Pro 15"',
    quantity: 2,
    unitPrice: 1299.99,
    totalAmount: 2599.98,
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    saleDate: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    productId: '2',
    productName: 'Wireless Mouse',
    quantity: 5,
    unitPrice: 49.99,
    totalAmount: 249.95,
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    saleDate: '2024-01-14T14:30:00Z',
    createdAt: '2024-01-14T14:30:00Z',
    updatedAt: '2024-01-14T14:30:00Z',
  },
];

export function Sales() {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredSales = mockSales.filter(sale => {
    const matchesSearch = sale.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStartDate = !startDate || sale.saleDate >= startDate;
    const matchesEndDate = !endDate || sale.saleDate <= endDate;
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales</h1>
          <p className="text-muted-foreground">
            Track your sales and revenue
          </p>
        </div>
        <Button>Add Sale</Button>
      </div>

      {/* Summary Card */}
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
              <div className="text-2xl font-bold">
                {filteredSales.length > 0 ? formatCurrency(totalRevenue / filteredSales.length) : '$0.00'}
              </div>
              <div className="text-sm text-muted-foreground">Average Sale</div>
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
              placeholder="Search sales..."
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

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Records ({filteredSales.length})</CardTitle>
          <CardDescription>
            List of all sales transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Product</th>
                  <th className="text-left p-4">Customer</th>
                  <th className="text-left p-4">Quantity</th>
                  <th className="text-left p-4">Unit Price</th>
                  <th className="text-left p-4">Total</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b">
                    <td className="p-4">
                      <div className="font-medium">{sale.productName}</div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{sale.customerName}</div>
                        <div className="text-sm text-muted-foreground">{sale.customerEmail}</div>
                      </div>
                    </td>
                    <td className="p-4">{sale.quantity}</td>
                    <td className="p-4">{formatCurrency(sale.unitPrice)}</td>
                    <td className="p-4 font-medium">{formatCurrency(sale.totalAmount)}</td>
                    <td className="p-4">{formatDate(sale.saleDate)}</td>
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
