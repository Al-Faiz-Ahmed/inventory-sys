import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/helpers';

// Mock report data
const mockReportData = {
  totalSales: 45680.50,
  totalPurchases: 23450.75,
  totalExpenses: 5670.25,
  netProfit: 16559.50,
  totalProducts: 156,
  lowStockProducts: 12,
  topSellingProducts: [
    { productName: 'Laptop Pro 15"', totalSold: 25, revenue: 32499.75 },
    { productName: 'Wireless Mouse', totalSold: 45, revenue: 2249.55 },
    { productName: 'Mechanical Keyboard', totalSold: 18, revenue: 2699.82 },
  ],
};

export function Reports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = ['Electronics', 'Accessories', 'Software', 'Services'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground">
          Generate and view business performance reports
        </p>
      </div>

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>
            Customize your report parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">Generate Report</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockReportData.totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <span className="text-2xl">🛒</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockReportData.totalPurchases)}</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <span className="text-2xl">💸</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockReportData.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              +3% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(mockReportData.netProfit)}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Overview</CardTitle>
            <CardDescription>
              Current inventory status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Products</span>
                <span className="text-lg font-bold">{mockReportData.totalProducts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Low Stock Items</span>
                <Badge variant="destructive">{mockReportData.lowStockProducts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Stock Value</span>
                <span className="text-lg font-bold">{formatCurrency(125000)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>
              Best performing products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockReportData.topSellingProducts.map((product, index) => (
                <div key={product.productName} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{product.productName}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.totalSold} units sold
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(product.revenue)}</div>
                    <Badge variant="outline">#{index + 1}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
          <CardDescription>
            Download reports in various formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button variant="outline">Export as PDF</Button>
            <Button variant="outline">Export as Excel</Button>
            <Button variant="outline">Export as CSV</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
