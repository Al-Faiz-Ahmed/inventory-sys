import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mainAccountApi } from '@/lib/api';
import { type MainAccountEntry } from '../../../../shared/types';

interface MainAccountFilters {
  startDate?: string;
  endDate?: string;
  transactionType?: ('debit' | 'credit')[];
  sourceType?: ('supplier' | 'customer' | 'expense' | 'supplier_refund' | 'customer_refund' | 'adjustment' | 'other')[];
  minAmount?: string;
  maxAmount?: string;
  search?: string;
  orderBy?: 'asc' | 'desc';
  limit?: number;
}

const MainAccountReport: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<MainAccountEntry[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Set default date range to current month
  const now = new Date();
  const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [filters, setFilters] = useState<MainAccountFilters>({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    orderBy: 'desc',
    limit: 500
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<MainAccountFilters>({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    transactionType: [], 
    sourceType: [],
    orderBy: 'desc',
    limit: 500
  });
  const [totalBalance, setTotalBalance] = useState('0');

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const apiFilters = {
        fromDate: filters.startDate,
        toDate: filters.endDate,
        transactionType: filters.transactionType && filters.transactionType.length > 0 ? filters.transactionType : undefined,
        sourceType: filters.sourceType && filters.sourceType.length > 0 ? filters.sourceType : undefined,
        minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
        maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
        search: filters.search,
        orderBy: filters.orderBy || 'desc',
        limit: filters.limit || 500,
      };
      
      const response = await mainAccountApi.list(apiFilters);
      const transactionsData = response.transactions || [];
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      
      // Calculate total balance
      if (transactionsData && transactionsData.length > 0) {
        const lastTransaction = transactionsData[transactionsData.length - 1];
        setTotalBalance(String(lastTransaction.balanceAmount || '0'));
      }
      
      // Update total balance from API response
      if (response.totalBalance) {
        setTotalBalance(response.totalBalance);
      }
    } catch (error: any) {
      console.error('Error fetching main account transactions:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch data';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Apply filters
  const applyFilters = () => {
    const cleanedFilters = { ...tempFilters };
    // Remove empty arrays from filters
    if (cleanedFilters.transactionType && cleanedFilters.transactionType.length === 0) {
      delete cleanedFilters.transactionType;
    }
    if (cleanedFilters.sourceType && cleanedFilters.sourceType.length === 0) {
      delete cleanedFilters.sourceType;
    }
    setFilters(cleanedFilters);
    setFilterDialogOpen(false);
    setTimeout(fetchTransactions, 100);
  };

  // Clear filters
  const clearFilters = () => {
    const clearedFilters = {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      orderBy: 'desc' as const,
      limit: 500
    };
    setFilters(clearedFilters);
    setTempFilters({
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      transactionType: [], 
      sourceType: [],
      orderBy: 'desc' as const,
      limit: 500
    });
    setFilterDialogOpen(false);
    setTimeout(fetchTransactions, 100);
  };

  // Export functions
  const exportCSV = async () => {
    try {
      const apiFilters = {
        fromDate: filters.startDate,
        toDate: filters.endDate,
        transactionType: filters.transactionType && filters.transactionType.length > 0 ? filters.transactionType : undefined,
        sourceType: filters.sourceType && filters.sourceType.length > 0 ? filters.sourceType : undefined,
        minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
        maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
        search: filters.search,
        orderBy: filters.orderBy || 'desc',
        limit: filters.limit || 500,
      };
      
      await mainAccountApi.exportCSV(apiFilters);
    } catch (error: any) {
      console.error('Error exporting CSV:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to export CSV';
      alert(errorMessage);
    }
  };

  const exportPDF = async () => {
    try {
      const apiFilters = {
        fromDate: filters.startDate,
        toDate: filters.endDate,
        transactionType: filters.transactionType && filters.transactionType.length > 0 ? filters.transactionType : undefined,
        sourceType: filters.sourceType && filters.sourceType.length > 0 ? filters.sourceType : undefined,
        minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
        maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
        search: filters.search,
        orderBy: filters.orderBy || 'desc',
        limit: filters.limit || 500,
      };
      
      await mainAccountApi.exportPDF(apiFilters);
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to export PDF';
      alert(errorMessage);
    }
  };

  // Format currency
  const formatCurrency = (amount: string | number) => {
    return `PKR ${Number(amount).toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get badge color for transaction type
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'debit':
        return 'bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium';
      case 'credit':
        return 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium';
      default:
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium';
    }
  };

  // Get source type label
  const getSourceTypeLabel = (sourceType: string) => {
    return sourceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Main Account Report</h1>
          <p className="text-muted-foreground">Account transactions and balance overview</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/reports')}>Back to Reports</Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Transactions</div>
              <div className="text-2xl font-bold">{transactions.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Current Balance</div>
              <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Last Updated</div>
              <div className="text-lg">{formatDate(new Date().toISOString())}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Filters</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setFilterDialogOpen(true)}>Advanced Filters</Button>
              <Button variant="outline" onClick={fetchTransactions}>Refresh</Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filter Modal */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Filter Main Account Transactions</DialogTitle>
                <DialogDescription>Select filters and apply to fetch results</DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterDialogOpen(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
          </DialogHeader>
          <div className="px-6 pb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Start Date</Label>
                <Input
                  type="date"
                  value={tempFilters.startDate || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1 block">End Date</Label>
                <Input
                  type="date"
                  value={tempFilters.endDate || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, endDate: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1 block">Transaction Type</Label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={tempFilters.transactionType?.includes('debit') || false}
                      onChange={(e) => {
                        const types = tempFilters.transactionType || [];
                        if (e.target.checked) {
                          setTempFilters({ ...tempFilters, transactionType: [...types, 'debit'] });
                        } else {
                          setTempFilters({ ...tempFilters, transactionType: types.filter(t => t !== 'debit') });
                        }
                      }}
                    />
                    Debit
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={tempFilters.transactionType?.includes('credit') || false}
                      onChange={(e) => {
                        const types = tempFilters.transactionType || [];
                        if (e.target.checked) {
                          setTempFilters({ ...tempFilters, transactionType: [...types, 'credit'] });
                        } else {
                          setTempFilters({ ...tempFilters, transactionType: types.filter(t => t !== 'credit') });
                        }
                      }}
                    />
                    Credit
                  </label>
                </div>
              </div>
              <div>
                <Label className="mb-1 block">Source Type</Label>
                <div className="space-y-2">
                  {(['supplier', 'customer', 'expense', 'supplier_refund', 'customer_refund', 'adjustment', 'other'] as const).map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={tempFilters.sourceType?.includes(type) || false}
                        onChange={(e) => {
                          const types = tempFilters.sourceType || [];
                          if (e.target.checked) {
                            setTempFilters({ ...tempFilters, sourceType: [...types, type] });
                          } else {
                            setTempFilters({ ...tempFilters, sourceType: types.filter(t => t !== type) });
                          }
                        }}
                      />
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-1 block">Min Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={tempFilters.minAmount || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || Number(value) >= 0) {
                      setTempFilters({ ...tempFilters, minAmount: value });
                    }
                  }}
                />
              </div>
              <div>
                <Label className="mb-1 block">Max Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={tempFilters.maxAmount || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || Number(value) >= 0) {
                      setTempFilters({ ...tempFilters, maxAmount: value });
                    }
                  }}
                />
              </div>
              <div>
                <Label className="mb-1 block">Order By</Label>
                <select
                  className="w-full h-10 px-3 py-2 text-sm border rounded-md bg-background"
                  value={tempFilters.orderBy || 'desc'}
                  onChange={(e) => setTempFilters({ ...tempFilters, orderBy: e.target.value as 'asc' | 'desc' })}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
              <div>
                <Label className="mb-1 block">Limit Rows</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="500"
                  value={tempFilters.limit || 500}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || Number(value) >= 0) {
                      setTempFilters({ ...tempFilters, limit: Number(value) });
                    }
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-1 block">Search Description</Label>
                <Input
                  type="text"
                  placeholder="Search in description..."
                  value={tempFilters.search || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, search: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={clearFilters}>Clear Filters</Button>
            <Button onClick={applyFilters}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Transactions</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportCSV} disabled={!transactions.length}>Generate CSV</Button>
              <Button onClick={exportPDF} disabled={!transactions.length}>Generate PDF</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Source</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(transactions) && transactions.length > 0 ? (
                  transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t">
                    <td className="px-3 py-2">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={getTransactionTypeColor(transaction.transactionType)}>
                        {transaction.transactionType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {getSourceTypeLabel(transaction.sourceType)}
                    </td>
                    <td className="px-3 py-2">
                      {transaction.description || '-'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatCurrency(transaction.transactionAmount)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {formatCurrency(transaction.balanceAmount)}
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted-foreground">
                      {loading ? 'Loading transactions...' : 'No transactions found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MainAccountReport;
