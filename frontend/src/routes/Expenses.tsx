import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/helpers';
import type { Expense } from '@/lib/types';

// Mock data
const mockExpenses: Expense[] = [
  {
    id: '1',
    title: 'Office Rent',
    description: 'Monthly office rent payment',
    amount: 2500.00,
    category: 'Rent',
    expenseDate: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Internet Bill',
    description: 'Monthly internet service',
    amount: 89.99,
    category: 'Utilities',
    expenseDate: '2024-01-05T00:00:00Z',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: '3',
    title: 'Office Supplies',
    description: 'Pens, paper, and other supplies',
    amount: 125.50,
    category: 'Supplies',
    expenseDate: '2024-01-10T00:00:00Z',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
];

export function Expenses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const categories = Array.from(new Set(mockExpenses.map(e => e.category)));

  const filteredExpenses = mockExpenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || expense.category === selectedCategory;
    const matchesStartDate = !startDate || expense.expenseDate >= startDate;
    const matchesEndDate = !endDate || expense.expenseDate <= endDate;
    return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const expensesByCategory = categories.map(category => {
    const categoryExpenses = filteredExpenses.filter(e => e.category === category);
    const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    return { category, total, count: categoryExpenses.length };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage business expenses
          </p>
        </div>
        <Button>Add Expense</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <span className="text-2xl">💸</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredExpenses.length} transactions
            </p>
          </CardContent>
        </Card>

        {expensesByCategory.map(({ category, total, count }) => (
          <Card key={category}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{category}</CardTitle>
              <span className="text-2xl">📊</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(total)}</div>
              <p className="text-xs text-muted-foreground">
                {count} transactions
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Records ({filteredExpenses.length})</CardTitle>
          <CardDescription>
            List of all business expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Title</th>
                  <th className="text-left p-4">Description</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Amount</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b">
                    <td className="p-4">
                      <div className="font-medium">{expense.title}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">{expense.description}</div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{expense.category}</Badge>
                    </td>
                    <td className="p-4 font-medium">{formatCurrency(expense.amount)}</td>
                    <td className="p-4">{formatDate(expense.expenseDate)}</td>
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
