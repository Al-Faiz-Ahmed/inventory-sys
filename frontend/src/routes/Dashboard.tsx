import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/helpers';

// Mock data for demonstration
const mockStats = {
  totalProducts: 156,
  lowStockProducts: 12,
  totalSales: 45680.50,
  totalPurchases: 23450.75,
  totalExpenses: 5670.25,
  netProfit: 16559.50,
};

const recentActivities = [
  { id: 1, type: 'sale', description: 'Sold 5 units of Product A', amount: 250.00, time: '2 hours ago' },
  { id: 2, type: 'purchase', description: 'Purchased 20 units of Product B', amount: 400.00, time: '4 hours ago' },
  { id: 3, type: 'expense', description: 'Office supplies expense', amount: 75.50, time: '6 hours ago' },
  { id: 4, type: 'sale', description: 'Sold 3 units of Product C', amount: 150.00, time: '8 hours ago' },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your business performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {mockStats.lowStockProducts} low stock items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockStats.totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockStats.netProfit)}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <span className="text-2xl">🛒</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockStats.totalPurchases)}</div>
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
            <div className="text-2xl font-bold">{formatCurrency(mockStats.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              +3% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <span className="text-2xl">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{mockStats.lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              Products need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>
            Latest transactions and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={activity.type === 'sale' ? 'default' : activity.type === 'purchase' ? 'secondary' : 'outline'}>
                    {activity.type}
                  </Badge>
                  <span className="text-sm font-medium">{formatCurrency(activity.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
