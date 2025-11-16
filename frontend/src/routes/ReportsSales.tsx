import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { salesApi, customersApi } from '@/lib/api';
import type { SaleEntry, SaleItemEntry, Customer, SaleStatus, SalesFilters } from '../../../shared/types';

// Extended filters interface for the reports component
interface ExtendedSalesFilters {
  customerName: string;
  minAmount: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
  statuses: Set<SaleStatus>;
  orderBy: 'asc' | 'desc';
  limit: number;
}

export const ReportsSales: React.FC = () => {
  // Sales Report State
  const [salesFilters, setSalesFilters] = useState<ExtendedSalesFilters>({
    customerName: '',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
    statuses: new Set<SaleStatus>(),
    orderBy: 'desc',
    limit: 100,
  });
  const [salesResults, setSalesResults] = useState<SaleEntry[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [salesHasFetched, setSalesHasFetched] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Sales Items Report State
  const [itemsResults, setItemsResults] = useState<(SaleItemEntry & { saleId: number; saleDate: string; invoiceNumber: string; customerName: string })[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [itemsHasFetched, setItemsHasFetched] = useState(false);

  // Default date range - current month
  const defaultDateRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    const toISO = (d: Date) => d.toISOString().slice(0, 10);
    return { start: toISO(start), end: toISO(end) };
  }, []);

  useEffect(() => {
    // Set default date range for sales filters
    setSalesFilters(prev => ({ ...prev, startDate: defaultDateRange.start, endDate: defaultDateRange.end }));
  }, [defaultDateRange]);

  useEffect(() => {
    // Load customers for dropdown
    const loadCustomers = async () => {
      try {
        const customerList = await customersApi.getCustomers();
        setCustomers(customerList);
      } catch (error) {
        console.error('Failed to load customers:', error);
      }
    };
    loadCustomers();
  }, []);

  const fetchSalesReport = async () => {
    setSalesLoading(true);
    setSalesError(null);
    setSalesResults([]);
    try {
      const sales = await salesApi.getSales();
      const filtered = sales.filter((sale: SaleEntry) => {
        const customerMatch = !salesFilters.customerName || customers.find(c => c.id === sale.customerId)?.name.toLowerCase().includes(salesFilters.customerName.toLowerCase());
        const amountMatch = (
          (salesFilters.minAmount === '' || sale.totalAmount >= Number(salesFilters.minAmount)) &&
          (salesFilters.maxAmount === '' || sale.totalAmount <= Number(salesFilters.maxAmount))
        );
        const statusMatch = salesFilters.statuses.size > 0 ? salesFilters.statuses.has(sale.status) : true;
        const dateMatch = (
          (!salesFilters.startDate || sale.date >= salesFilters.startDate) &&
          (!salesFilters.endDate || sale.date <= salesFilters.endDate)
        );
        return customerMatch && amountMatch && statusMatch && dateMatch;
      });
      
      if (salesFilters.orderBy === 'asc') {
        filtered.sort((a: SaleEntry, b: SaleEntry) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } else {
        filtered.sort((a: SaleEntry, b: SaleEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      
      const limited = filtered.slice(0, Math.max(0, salesFilters.limit || 0));
      setSalesResults(limited);
    } catch (e: any) {
      setSalesError(e?.message || 'Failed to fetch sales report');
    } finally {
      setSalesLoading(false);
      setSalesHasFetched(true);
    }
  };

  const fetchItemsReport = async () => {
    setItemsLoading(true);
    setItemsError(null);
    setItemsResults([]);
    try {
      const sales = await salesApi.getSales();
      
      const items: any[] = [];
      for (const sale of sales) {
        const saleItems = await salesApi.getSaleItems(sale.id);
        for (const item of saleItems) {
          // Get customer name for the sale
          const customer = await customersApi.getCustomer(sale.customerId);
          items.push({ ...item, saleId: sale.id, saleDate: sale.date, invoiceNumber: sale.invoiceNumber, customerName: customer.name });
        }
      }
      
      // Filter items based on sales filters
      const filteredItems = items.filter((item: any) => {
        const customerMatch = !salesFilters.customerName || item.customerName.toLowerCase().includes(salesFilters.customerName.toLowerCase());
        const dateMatch = (
          (!salesFilters.startDate || item.saleDate >= salesFilters.startDate) &&
          (!salesFilters.endDate || item.saleDate <= salesFilters.endDate)
        );
        return customerMatch && dateMatch;
      });
      
      setItemsResults(filteredItems);
    } catch (e: any) {
      setItemsError(e?.message || 'Failed to fetch items report');
    } finally {
      setItemsLoading(false);
      setItemsHasFetched(true);
    }
  };

  const exportSalesCSV = () => {
    if (!salesResults.length) return;
    
    const headers = ['Invoice No', 'Customer', 'Date', 'Status', 'Total Amount', 'Paid Amount', 'Balance'];
    const csvLines = [headers.join(',')];
    
    salesResults.forEach((sale) => {
      const row = [
        sale.invoiceNumber,
        customers.find(c => c.id === sale.customerId)?.name || 'Unknown',
        new Date(sale.date).toLocaleDateString(),
        sale.status,
        sale.totalAmount.toFixed(2),
        sale.paidAmount.toFixed(2),
        (sale.totalAmount - sale.paidAmount).toFixed(2)
      ];
      csvLines.push(row.map((v) => typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g, '""')}"` : String(v)).join(','));
    });
    
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSalesPDF = () => {
    if (!salesResults.length) return;
    
    const w = window.open('', '_blank');
    if (!w) return;
    
    const styles = `
      <style>
        @page { margin: 16mm; }
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 0; }
        .header { margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: 600; margin: 0 0 8px 0; }
        .meta { font-size: 12px; color: #374151; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f4f4f5; font-weight: 600; }
        .text-right { text-align: right; }
        thead { display: table-header-group; }
      </style>
    `;
    
    const dateRange = `${salesFilters.startDate || '-'} to ${salesFilters.endDate || '-'}`;
    const header = `
      <div class="header">
        <div class="title">Sales Report</div>
        <div class="meta">
          <div><strong>Date Range:</strong> ${dateRange}</div>
          <div><strong>Total Sales:</strong> ${salesResults.length}</div>
        </div>
      </div>
    `;
    
    const thead = `<thead><tr>
      <th>Invoice No</th>
      <th>Customer</th>
      <th>Date</th>
      <th>Status</th>
      <th class="text-right">Total Amount</th>
      <th class="text-right">Paid Amount</th>
      <th class="text-right">Balance</th>
    </tr></thead>`;
    
    const tbody = '<tbody>' + salesResults.map((sale) => {
      const customer = customers.find(c => c.id === sale.customerId);
      return `
        <tr>
          <td>${sale.invoiceNumber}</td>
          <td>${customer?.name || 'Unknown'}</td>
          <td>${new Date(sale.date).toLocaleDateString()}</td>
          <td>${sale.status}</td>
          <td class="text-right">${sale.totalAmount.toFixed(2)}</td>
          <td class="text-right">${sale.paidAmount.toFixed(2)}</td>
          <td class="text-right">${(sale.totalAmount - sale.paidAmount).toFixed(2)}</td>
        </tr>
      `;
    }).join('') + '</tbody>';
    
    w.document.write(`<html><head><title>Sales Report</title>${styles}</head><body>${header}<table>${thead}${tbody}</table></body></html>`);
    w.document.close();
    w.focus();
    w.print();
    setTimeout(() => { try { w.close(); } catch {} }, 500);
  };

  const exportItemsCSV = () => {
    if (!itemsResults.length) return;
    
    const headers = ['Invoice No', 'Customer', 'Product', 'Quantity', 'Unit Price', 'Total Price', 'Sale Date'];
    const csvLines = [headers.join(',')];
    
    itemsResults.forEach((item) => {
      const row = [
        item.invoiceNumber,
        item.customerName,
        item.productName,
        item.quantity,
        item.unitPrice.toFixed(2),
        (item.quantity * item.unitPrice).toFixed(2),
        new Date(item.saleDate).toLocaleDateString()
      ];
      csvLines.push(row.map((v) => typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g, '""')}"` : String(v)).join(','));
    });
    
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales-items-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Sales Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Sales Report</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportSalesCSV} disabled={!salesResults.length}>Generate CSV</Button>
              <Button onClick={exportSalesPDF} disabled={!salesResults.length}>Generate PDF</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label className="mb-1 block">Customer Name</Label>
              <Input
                placeholder="Filter by customer name"
                value={salesFilters.customerName}
                onChange={(e) => setSalesFilters(prev => ({ ...prev, customerName: e.target.value }))}
              />
            </div>
            <div>
              <Label className="mb-1 block">Min Amount</Label>
              <Input
                type="number"
                placeholder="0"
                value={salesFilters.minAmount}
                onChange={(e) => setSalesFilters(prev => ({ ...prev, minAmount: e.target.value }))}
              />
            </div>
            <div>
              <Label className="mb-1 block">Max Amount</Label>
              <Input
                type="number"
                placeholder="999999"
                value={salesFilters.maxAmount}
                onChange={(e) => setSalesFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
              />
            </div>
            <div>
              <Label className="mb-1 block">Start Date</Label>
              <Input
                type="date"
                value={salesFilters.startDate}
                onChange={(e) => setSalesFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label className="mb-1 block">End Date</Label>
              <Input
                type="date"
                value={salesFilters.endDate}
                onChange={(e) => setSalesFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <Label className="mb-1 block">Limit</Label>
              <Input
                type="number"
                placeholder="100"
                value={salesFilters.limit}
                onChange={(e) => setSalesFilters(prev => ({ ...prev, limit: Number(e.target.value) }))}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={fetchSalesReport} disabled={salesLoading}>
              {salesLoading ? 'Loading...' : 'Generate Report'}
            </Button>
          </div>

          {/* Results */}
          {salesError && (
            <div className="text-red-600 bg-red-50 p-3 rounded">{salesError}</div>
          )}
          
          {salesHasFetched && !salesLoading && !salesError && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">Invoice No</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Customer</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Total Amount</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Paid Amount</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {salesResults.map((sale) => {
                    const customer = customers.find(c => c.id === sale.customerId);
                    return (
                      <tr key={sale.id}>
                        <td className="border border-gray-300 px-4 py-2">{sale.invoiceNumber}</td>
                        <td className="border border-gray-300 px-4 py-2">{customer?.name || 'Unknown'}</td>
                        <td className="border border-gray-300 px-4 py-2">{new Date(sale.date).toLocaleDateString()}</td>
                        <td className="border border-gray-300 px-4 py-2">{sale.status}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{sale.totalAmount.toFixed(2)}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{sale.paidAmount.toFixed(2)}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{(sale.totalAmount - sale.paidAmount).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {salesResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">No sales records found</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Items Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Sales Items Report</CardTitle>
            <Button variant="outline" onClick={exportItemsCSV} disabled={!itemsResults.length}>Generate CSV</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={fetchItemsReport} disabled={itemsLoading}>
              {itemsLoading ? 'Loading...' : 'Generate Items Report'}
            </Button>
          </div>

          {/* Items Results */}
          {itemsError && (
            <div className="text-red-600 bg-red-50 p-3 rounded">{itemsError}</div>
          )}
          
          {itemsHasFetched && !itemsLoading && !itemsError && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">Invoice No</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Customer</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Product</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Quantity</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Total Price</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Sale Date</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsResults.map((item, idx) => (
                    <tr key={`${item.saleId}-${item.productId}-${idx}`}>
                      <td className="border border-gray-300 px-4 py-2">{item.invoiceNumber}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.customerName}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.productName}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{item.quantity}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{item.unitPrice.toFixed(2)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{(item.quantity * item.unitPrice).toFixed(2)}</td>
                      <td className="border border-gray-300 px-4 py-2">{new Date(item.saleDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {itemsResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">No sales items found</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
