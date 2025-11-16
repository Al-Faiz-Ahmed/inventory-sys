import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mainInventoryApi, inventoryApi } from '@/lib/api';
import { type MainInventory, type Product } from '../../../../shared/types';

interface MainInventoryFilters {
  startDate?: string;
  endDate?: string;
  productIds?: string[];
  transactionType?: ('sale' | 'purchase' | 'refund' | 'adjustment' | 'miscelleneous')[];
  minQuantity?: string;
  maxQuantity?: string;
  minAmount?: string;
  maxAmount?: string;
  search?: string;
  orderBy?: 'asc' | 'desc';
  limit?: number;
}

const MainInventoryReport: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<MainInventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  
  // Set default date range to current month
  const now = new Date();
  const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [filters, setFilters] = useState<MainInventoryFilters>({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    orderBy: 'desc',
    limit: 500
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<MainInventoryFilters>({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    transactionType: [], 
    orderBy: 'desc',
    limit: 500
  });
  const [summary, setSummary] = useState({
    totalTransactions: 0,
    totalQuantity: 0,
    totalAmount: 0
  });

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const apiFilters = {
        fromDate: filters.startDate,
        toDate: filters.endDate,
        productId: filters.productIds && filters.productIds.length > 0 ? filters.productIds : undefined,
        transactionType: filters.transactionType && filters.transactionType.length > 0 ? filters.transactionType : undefined,
        minQuantity: filters.minQuantity,
        maxQuantity: filters.maxQuantity,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
        search: filters.search,
        orderBy: filters.orderBy || 'desc',
        limit: filters.limit || 500,
      };

      console.log('Fetching transactions with filters:', apiFilters);
      const response = await mainInventoryApi.getTransactions(apiFilters);
      console.log('Received response:', response);
      setTransactions(response.transactions || []);
      setSummary(response.summary || {
        totalTransactions: 0,
        totalQuantity: 0,
        totalAmount: 0
      });
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch transactions';
      alert(errorMessage);
      setTransactions([]);
      setSummary({
        totalTransactions: 0,
        totalQuantity: 0,
        totalAmount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Load products once for search/autocomplete
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await inventoryApi.getProducts();
        setAllProducts(products || []);
      } catch (error) {
        console.error('Failed to load products for main inventory filters', error);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const applyFilters = () => {
    setFilters({ ...tempFilters });
    setFilterDialogOpen(false);
  };

  const resetFilters = () => {
    const defaultFilters = {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      transactionType: [],
      orderBy: 'desc' as const,
      limit: 500
    };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setFilterDialogOpen(false);
    setTimeout(fetchTransactions, 100);
  };

  const exportPDF = async () => {
    try {
      const apiFilters = {
        fromDate: filters.startDate,
        toDate: filters.endDate,
        productId: filters.productIds && filters.productIds.length > 0 ? filters.productIds : undefined,
        transactionType: filters.transactionType && filters.transactionType.length > 0 ? filters.transactionType : undefined,
        minQuantity: filters.minQuantity ? Number(filters.minQuantity) : undefined,
        maxQuantity: filters.maxQuantity ? Number(filters.maxQuantity) : undefined,
        minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
        maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
        search: filters.search,
        orderBy: filters.orderBy || 'desc',
        limit: filters.limit || 500,
      };
      
      await mainInventoryApi.exportPDF(apiFilters);
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to export PDF';
      alert(errorMessage);
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'sale':
        return 'text-green-600';
      case 'purchase':
        return 'text-blue-600';
      case 'refund':
        return 'text-orange-600';
      case 'adjustment':
        return 'text-purple-600';
      case 'miscelleneous':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Main Inventory Report</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setFilterDialogOpen(true)}
          >
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={fetchTransactions}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={exportPDF} disabled={!transactions.length}>
            Generate PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalQuantity.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No transactions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Product</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-right p-2">Quantity</th>
                    <th className="text-right p-2">Stock</th>
                    <th className="text-right p-2">Unit Price</th>
                    <th className="text-right p-2">Total Amount</th>
                    <th className="text-left p-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{formatDate(transaction.createdAt)}</td>
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{transaction.productName}</div>
                          <div className="text-xs text-gray-500">{transaction.productSku}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className={`font-medium ${getTransactionTypeColor(transaction.transactionType)}`}>
                          {transaction.transactionType}
                        </span>
                      </td>
                      <td className="p-2 text-right">{transaction.quantity}</td>
                      <td className="p-2 text-right">{transaction.stockQuantity}</td>
                      <td className="p-2 text-right">{formatCurrency(transaction.unitPrice)}</td>
                      <td className="p-2 text-right font-medium">{formatCurrency(transaction.totalAmount)}</td>
                      <td className="p-2 text-xs text-gray-600 max-w-xs truncate">
                        {transaction.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter Modal */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Filter Main Inventory Transactions</DialogTitle>
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
            </div>

            <div>
              <Label className="mb-1 block">Products</Label>
              <Input
                placeholder="Search by name, SKU or ID..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
              />
              {productSearchTerm && (
                <div className="mt-2 max-h-40 overflow-y-auto border rounded bg-white shadow-sm">
                  {allProducts
                    .filter((p) => {
                      const q = productSearchTerm.toLowerCase();
                      return (
                        p.name.toLowerCase().includes(q) ||
                        (p.sku && p.sku.toLowerCase().includes(q)) ||
                        p.id.toLowerCase().includes(q)
                      );
                    })
                    .slice(0, 15)
                    .map((p) => {
                      const isSelected = tempFilters.productIds?.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className={`w-full text-left px-2 py-1 text-sm hover:bg-gray-100 flex justify-between ${isSelected ? 'bg-gray-100' : ''}`}
                          onClick={() => {
                            const current = tempFilters.productIds || [];
                            if (isSelected) return;
                            setTempFilters({
                              ...tempFilters,
                              productIds: [...current, p.id],
                            });
                          }}
                        >
                          <span>
                            {p.name} ({p.sku})
                          </span>
                          <span className="text-xs text-gray-500">{p.id}</span>
                        </button>
                      );
                    })}
                </div>
              )}

              {tempFilters.productIds && tempFilters.productIds.length > 0 && (
                <div className="mt-3 space-y-1">
                  <Label className="block text-xs text-gray-500">Selected products:</Label>
                  <div className="flex flex-wrap gap-2">
                    {tempFilters.productIds.map((id) => {
                      const product = allProducts.find((p) => p.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 rounded"
                        >
                          <span>{product?.name || id}</span>
                          <button
                            type="button"
                            className="text-gray-500 hover:text-gray-700"
                            onClick={() => {
                              setTempFilters({
                                ...tempFilters,
                                productIds: tempFilters.productIds?.filter((pid) => pid !== id),
                              });
                            }}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="mb-2 block">Transaction Types</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['sale', 'purchase', 'refund', 'adjustment', 'miscelleneous'].map((type) => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={tempFilters.transactionType?.includes(type as any) || false}
                      onChange={(e) => {
                        const types = tempFilters.transactionType || [];
                        if (e.target.checked) {
                          setTempFilters({ ...tempFilters, transactionType: [...types, type as any] });
                        } else {
                          setTempFilters({ ...tempFilters, transactionType: types.filter(t => t !== type) });
                        }
                      }}
                    />
                    <span className="text-sm capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Min Quantity</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={tempFilters.minQuantity || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, minQuantity: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1 block">Max Quantity</Label>
                <Input
                  type="number"
                  placeholder="999999"
                  value={tempFilters.maxQuantity || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, maxQuantity: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Min Amount</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={tempFilters.minAmount || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, minAmount: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1 block">Max Amount</Label>
                <Input
                  type="number"
                  placeholder="999999"
                  value={tempFilters.maxAmount || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, maxAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Order By</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={tempFilters.orderBy}
                  onChange={(e) => setTempFilters({ ...tempFilters, orderBy: e.target.value as 'asc' | 'desc' })}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
              <div>
                <Label className="mb-1 block">Limit</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={tempFilters.limit}
                  onChange={(e) => setTempFilters({ ...tempFilters, limit: Number(e.target.value) })}
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
            <Button onClick={applyFilters}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MainInventoryReport;
