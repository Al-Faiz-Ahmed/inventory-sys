import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/helpers';

import { useEffect, useState } from 'react';
import { inventoryApi, salesApi, purchasesApi, expensesApi, mainAccountApi } from '@/lib/api';

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  netProfit: number;
  currentBalance: number;
}



export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    totalSales: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    netProfit: 0,
    currentBalance: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        // Current month range
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const [products, sales, purchases, expenses, main] = await Promise.all([
          inventoryApi.getProducts(),
          salesApi.getSales(),
          purchasesApi.getPurchases(),
          expensesApi.getExpenses({ fromDate: start.toISOString(), toDate: end.toISOString(), expenseType: 'expense' }),
          mainAccountApi.list(),
        ]);

        const totalProducts = products.length;
        const lowStockProducts = products.filter(p => Number(p.quantity) <= Number(p.minQuantity)).length;

        const isInMonth = (d: string) => {
          const dt = new Date(d).getTime();
          return dt >= start.getTime() && dt <= end.getTime();
        };

        const totalSales = sales
          .filter(s => isInMonth(s.date))
          .reduce((sum, s) => sum + Number((s as any).totalAmount ?? 0), 0);

        const totalPurchases = purchases
          .filter(p => isInMonth(p.date))
          .reduce((sum, p) => sum + Number((p as any).totalAmount ?? 0), 0);

        const totalExpenses = expenses
          .reduce((sum, e) => sum + Number((e as any).amount ?? 0), 0);

        const netProfit = totalSales - totalPurchases - totalExpenses;

        const sortedMain = [...main.transactions].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);
const currentBalance = sortedMain.length
  ? Number((sortedMain[0] as any).balanceAmount ?? 0)
  : 0;
        setStats({
          totalProducts,
          lowStockProducts,
          totalSales,
          totalPurchases,
          totalExpenses,
          netProfit,
          currentBalance,
        });
      } catch (err) {
        // Fail silently for now on dashboard
      }
    };
    load();
  }, []);

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
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lowStockProducts} low stock items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales (This Month)</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div>
            
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit (This Month)</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.netProfit)}</div>
            
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases (This Month)</CardTitle>
            <span className="text-2xl">🛒</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPurchases)}</div>
            
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <span className="text-2xl">💸</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
            
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Main Account Balance</CardTitle>
            <span className="text-2xl">🏦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.currentBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Current balance (latest)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <span className="text-2xl">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              Products need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      
    </div>
  );
}
