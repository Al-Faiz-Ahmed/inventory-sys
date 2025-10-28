import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/helpers';
import type { Product } from '@/lib/types';

// Mock data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Laptop Pro 15"',
    description: 'High-performance laptop for professionals',
    sku: 'LP-001',
    category: 'Electronics',
    price: 1299.99,
    cost: 899.99,
    quantity: 25,
    minQuantity: 5,
    maxQuantity: 50,
    supplier: 'TechCorp',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse',
    sku: 'WM-002',
    category: 'Accessories',
    price: 49.99,
    cost: 25.99,
    quantity: 2,
    minQuantity: 10,
    maxQuantity: 100,
    supplier: 'AccessoryWorld',
    createdAt: '2024-01-14T14:30:00Z',
    updatedAt: '2024-01-14T14:30:00Z',
  },
  {
    id: '3',
    name: 'Mechanical Keyboard',
    description: 'RGB mechanical keyboard',
    sku: 'KB-003',
    category: 'Accessories',
    price: 149.99,
    cost: 89.99,
    quantity: 15,
    minQuantity: 5,
    maxQuantity: 30,
    supplier: 'KeyTech',
    createdAt: '2024-01-13T09:15:00Z',
    updatedAt: '2024-01-13T09:15:00Z',
  },
];

export function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = Array.from(new Set(mockProducts.map(p => p.category)));

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (product: Product) => {
    if (product.quantity <= product.minQuantity) return 'low';
    if (product.quantity >= product.maxQuantity) return 'high';
    return 'normal';
  };

  const getStockBadgeVariant = (status: string) => {
    switch (status) {
      case 'low': return 'destructive';
      case 'high': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your products and stock levels
          </p>
        </div>
        <Button>Add Product</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-input rounded-md bg-background"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
          <CardDescription>
            List of all products in your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Product</th>
                  <th className="text-left p-4">SKU</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Price</th>
                  <th className="text-left p-4">Cost</th>
                  <th className="text-left p-4">Stock</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr key={product.id} className="border-b">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.description}</div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm">{product.sku}</td>
                      <td className="p-4">{product.category}</td>
                      <td className="p-4">{formatCurrency(product.price)}</td>
                      <td className="p-4">{formatCurrency(product.cost)}</td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div>{product.quantity} units</div>
                          <div className="text-muted-foreground">
                            Min: {product.minQuantity} | Max: {product.maxQuantity}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getStockBadgeVariant(stockStatus)}>
                          {stockStatus === 'low' ? 'Low Stock' : 
                           stockStatus === 'high' ? 'High Stock' : 'Normal'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="destructive" size="sm">Delete</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
