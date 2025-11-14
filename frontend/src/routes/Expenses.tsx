import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { expensesApi, expenseCategoriesApi } from '@/lib/api';
import type { ExpenseEntry, ExpenseEntryFormData, ExpenseCategoryEntry, ExpenseType } from '../../../shared/types';

export function Expenses() {
  const [items, setItems] = useState<ExpenseEntry[]>([]);
  const [categories, setCategories] = useState<ExpenseCategoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState<number | ''>('');
  const [filterType, setFilterType] = useState<ExpenseType | ''>('');
  const [filterMinAmount, setFilterMinAmount] = useState<string>('');
  const [filterMaxAmount, setFilterMaxAmount] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  const [openExpense, setOpenExpense] = useState(false);
  const [openAdjustment, setOpenAdjustment] = useState(false);

  const [form, setForm] = useState<{
    title: string;
    categoryId: number | '';
    expenseDate: string;
    amount: string;
    description: string;
  }>({ title: '', categoryId: '', expenseDate: '', amount: '', description: '' });

  const loadCategories = async () => {
    try {
      const data = await expenseCategoriesApi.list();
      setCategories(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load categories');
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expensesApi.getExpenses({
        categoryId: filterCategoryId === '' ? undefined : Number(filterCategoryId),
        expenseType: filterType === '' ? undefined : filterType,
        minAmount: filterMinAmount ? Number(filterMinAmount) : undefined,
        maxAmount: filterMaxAmount ? Number(filterMaxAmount) : undefined,
        fromDate: filterStartDate || undefined,
        toDate: filterEndDate || undefined,
      });
      setItems(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategoryId, filterType, filterMinAmount, filterMaxAmount, filterStartDate, filterEndDate]);

  const totalExpenses = useMemo(() => items.reduce((sum, e) => sum + Number(e.amount ?? e.amount), 0), [items]);

  const onOpenExpense = () => {
    setForm({ title: '', categoryId: '', expenseDate: '', amount: '', description: '' });
    setOpenExpense(true);
  };
  const onOpenAdjustment = () => {
    setForm({ title: '', categoryId: '', expenseDate: '', amount: '', description: '' });
    setOpenAdjustment(true);
  };

  const submitForm = async (type: ExpenseType) => {
    try {
      setLoading(true);
      const payload: ExpenseEntryFormData = {
        title: form.title.trim(),
        categoryId: Number(form.categoryId),
        expenseDate: form.expenseDate,
        amount: Number(form.amount),
        expenseType: type,
        description: form.description ? form.description : undefined,
      };
      await expensesApi.createExpense(payload);
      setOpenExpense(false);
      setOpenAdjustment(false);
      await loadExpenses();
    } catch (e: any) {
      setError(e.message || 'Failed to create entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground">Track and manage business expenses</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onOpenExpense}>Add Expense</Button>
          <Button variant="destructive" onClick={onOpenAdjustment}>Adjustment</Button>
        </div>
      </div>

      {/* Filters toggle */}
      <div className="flex items-center justify-between">
        <div />
        <Button
          onClick={() => {
            if (!filtersOpen) {
              setFiltersOpen(true);
            } else {
              // Clear all filters and hide panel
              setFilterCategoryId('');
              setFilterType('' as any);
              setFilterMinAmount('');
              setFilterMaxAmount('');
              setFilterStartDate('');
              setFilterEndDate('');
              setFiltersOpen(false);
            }
          }}
        >
          {filtersOpen ? 'Remove filters' : 'Filter'}
        </Button>
      </div>

      {filtersOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter by category, type, amount and date range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <select
                className="px-3 py-2 border border-input rounded-md bg-background"
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                className="px-3 py-2 border border-input rounded-md bg-background"
                value={filterType}
                onChange={(e) => setFilterType((e.target.value || '') as any)}
              >
                <option value="">All Types</option>
                <option value="expense">Expense</option>
                <option value="adjustment">Adjustment</option>
              </select>
              <Input type="number" placeholder="Min Amount (Rs)" value={filterMinAmount} onChange={(e) => setFilterMinAmount(e.target.value)} />
              <Input type="number" placeholder="Max Amount (Rs)" value={filterMaxAmount} onChange={(e) => setFilterMaxAmount(e.target.value)} />
              <Input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
              <Input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Records ({items.length})</CardTitle>
          <CardDescription>List of all expenses and adjustments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Title</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Amount (Rs)</th>
                  <th className="text-left p-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e) => (
                  <tr key={e.id} className="border-b">
                    <td className="p-4">
                      <div className="font-medium">{e.title}</div>
                      {e.description && (
                        <div className="text-sm text-muted-foreground">{e.description}</div>
                      )}
                    </td>
                    <td className="p-4">
                      {/* Show category id; optionally map to name if needed */}
                      <Badge variant="outline">#{e.categoryId}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={e.expenseType === 'adjustment' ? 'destructive' : 'secondary'}>
                        {e.expenseType === 'adjustment' ? 'Adjustment' : 'Expense'}
                      </Badge>
                    </td>
                    <td className="p-4 font-medium">Rs {Number(e.amount).toFixed(2)}</td>
                    <td className="p-4">{formatDate(e.expenseDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      <Dialog open={openExpense} onOpenChange={setOpenExpense}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogClose />
          </DialogHeader>
          <div className="p-6 pt-0 space-y-4">
            <div className="grid gap-2">
              <label className="text-sm">Title</label>
              <Input value={form.title} onChange={(e) => setForm(s => ({ ...s, title: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Category</label>
              <select
                className="px-3 py-2 border border-input rounded-md bg-background"
                value={form.categoryId}
                onChange={(e) => setForm(s => ({ ...s, categoryId: e.target.value ? Number(e.target.value) : '' }))}
              >
                <option value="">Select category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Date</label>
              <Input type="date" value={form.expenseDate} onChange={(e) => setForm(s => ({ ...s, expenseDate: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Amount (Rs)</label>
              <Input type="number" value={form.amount} onChange={(e) => setForm(s => ({ ...s, amount: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Description</label>
              <Input value={form.description} onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => submitForm('expense')} disabled={loading || !form.title || !form.categoryId || !form.expenseDate || !form.amount}>Create Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjustment Modal */}
      <Dialog open={openAdjustment} onOpenChange={setOpenAdjustment}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adjustment</DialogTitle>
            <DialogClose />
          </DialogHeader>
          <div className="p-6 pt-0 space-y-4">
            <div className="grid gap-2">
              <label className="text-sm">Title</label>
              <Input value={form.title} onChange={(e) => setForm(s => ({ ...s, title: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Category</label>
              <select
                className="px-3 py-2 border border-input rounded-md bg-background"
                value={form.categoryId}
                onChange={(e) => setForm(s => ({ ...s, categoryId: e.target.value ? Number(e.target.value) : '' }))}
              >
                <option value="">Select category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Date</label>
              <Input type="date" value={form.expenseDate} onChange={(e) => setForm(s => ({ ...s, expenseDate: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Amount (Rs)</label>
              <Input type="number" value={form.amount} onChange={(e) => setForm(s => ({ ...s, amount: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Description</label>
              <Input value={form.description} onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => submitForm('adjustment')} disabled={loading || !form.title || !form.categoryId || !form.expenseDate || !form.amount}>Create Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
