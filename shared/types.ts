// User and Auth types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
}

// Inventory types
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  avgPrice?: number;
  previousCost?: number;
  previousPrice?: number;
  previousAvgPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  sku: string;
  categoryId: string;
  price: number;
  cost: number;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
}

// Sales types
export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  customerName?: string;
  customerEmail?: string;
  saleDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleFormData {
  productId: string;
  quantity: number;
  unitPrice: number;
  customerName?: string;
  customerEmail?: string;
  saleDate: string;
}

// Purchase types
export interface Purchase {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalAmount: number;
  supplierName: string;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseFormData {
  productId: string;
  quantity: number;
  unitCost: number;
  supplierName: string;
  purchaseDate: string;
}

// Expense types
export interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFormData {
  title: string;
  description?: string;
  amount: number;
  category: string;
  expenseDate: string;
}

// Report types
export interface ReportSummary {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  netProfit: number;
  totalProducts: number;
  lowStockProducts: number;
  topSellingProducts: Array<{
    productName: string;
    totalSold: number;
    revenue: number;
  }>;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  productId?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Modal types
export interface ModalState {
  isOpen: boolean;
  type?: 'product' | 'sale' | 'purchase' | 'expense' | 'delete';
  data?: any;
}

// Filter types
export interface InventoryFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  lowStock?: boolean;
}

export interface SalesFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  customerName?: string;
}

export interface PurchasesFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  supplierName?: string;
}

// New Purchases (supplier-linked) schema types
export type PurchaseStatus = 'paid' | 'unpaid' | 'partial';

export interface PurchaseEntry {
  id: number;
  supplierId: number;
  invoiceNumber: string;
  date: string; // ISO date string
  totalAmount: number;
  paidAmount: number;
  status: PurchaseStatus;
  description?: string;
  createdAt: string;
}

export interface PurchaseEntryFormData {
  supplierId: number;
  invoiceNumber: string;
  date: string; // ISO date string
  totalAmount: number;
  paidAmount?: number;
  status: PurchaseStatus;
  description?: string;
}

export interface PurchaseItemEntry {
  id: number;
  purchaseId: number;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: string;
}

export interface PurchaseItemFormData {
  productId: string;
  quantity: number;
  unitPrice: number;
}

// Supplier Transactions
export type SupplierTransactionType = 'purchase' | 'payment' | 'refund' | 'adjustment';

export interface SupplierTransactionEntry {
  id: number;
  supplierId: number;
  transactionType: SupplierTransactionType;
  amount: number;
  balanceAmount: number;
  referenceId?: number | null;
  description?: string;
  createdAt: string;
}

export interface SupplierTransactionFormData {
  transactionType: SupplierTransactionType;
  amount: number;
  balanceAmount?: number; // optional, defaults to 0 on server
  referenceId?: number | null;
  description?: string;
}

// Customer (sales-linked) schema types
export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  description?: string;
  currentBalance: number;
  receivable: number;
  createdAt: string;
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  description?: string;
}

export type SaleStatus = 'paid' | 'unpaid' | 'partial';

export interface SaleEntry {
  id: number;
  customerId: number;
  invoiceNumber: string;
  date: string; // ISO date string
  totalAmount: number;
  paidAmount: number;
  status: SaleStatus;
  description?: string;
  createdAt: string;
}

export interface SaleEntryFormData {
  customerId: number;
  invoiceNumber: string;
  date: string; // ISO date string
  totalAmount: number;
  paidAmount?: number;
  status: SaleStatus;
  description?: string;
}

export interface SaleItemEntry {
  id: number;
  saleId: number;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: string;
}

export interface SaleItemFormData {
  productId: string;
  quantity: number;
  unitPrice: number;
}

// Customer Transactions
export type CustomerTransactionType = 'sale' | 'payment' | 'refund' | 'adjustment';

export interface CustomerTransactionEntry {
  id: number;
  customerId: number;
  transactionType: CustomerTransactionType;
  amount: number;
  balanceAmount: number;
  referenceId?: number | null;
  description?: string;
  createdAt: string;
}

export interface CustomerTransactionFormData {
  transactionType: CustomerTransactionType;
  amount: number;
  balanceAmount?: number; // optional, defaults to 0 on server
  referenceId?: number | null;
  description?: string;
}

export interface ExpensesFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
}

// Supplier types
export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  description?: string;
  currentBalance: number;
  debt: number;
  createdAt: string;
}

export interface SupplierFormData {
  name: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  description?: string;
}



// Main Account types
export type MainAccountTransactionType = 'debit' | 'credit';
export type MainAccountSourceType = 'supplier' | 'customer' | 'expense' | 'supplier_refund' | 'customer_refund' | 'adjustment' | 'other';

export interface MainAccountEntry {
  id: number;
  transactionType: MainAccountTransactionType;
  sourceType: MainAccountSourceType;
  sourceId?: number | null;
  referenceId?: number | null;
  transactionAmount: number;
  balanceAmount: number;
  description?: string;
  createdAt: string;
}

export interface MainAccountFormData {
  transactionType: MainAccountTransactionType;
  sourceType: MainAccountSourceType;
  sourceId?: number | null;
  referenceId?: number | null;
  transactionAmount: number;
  balanceAmount: number;
  description?: string;
}

export interface SupplierTransactionsFilters {
  fromDate?: string;
  toDate?: string;
  transactionType?: SupplierTransactionType;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

// Customer Transactions Filters (aligns with backend params similar to supplier)
export interface CustomerTransactionsFilters {
  fromDate?: string;
  toDate?: string;
  transactionType?: CustomerTransactionType;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}


// Expense Categories (new backend-aligned)
export interface ExpenseCategoryEntry {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

export interface ExpenseCategoryFormData {
  name: string;
  description?: string;
}

// Expenses (new backend-aligned)
export interface ExpenseEntry {
  id: number;
  categoryId: number;
  title: string;
  expenseDate: string; // ISO date string
  amount: number;
  expenseType: ExpenseType;
  description?: string;
  createdAt: string;
}

export interface ExpenseEntryFormData {
  categoryId: number;
  title: string;
  expenseDate: string; // ISO date string
  amount: number;
  expenseType?: ExpenseType; // defaults to 'expense' if omitted
  description?: string;
}

export type ExpenseType = 'expense' | 'adjustment';

// Main Inventory types
export interface MainInventory {
  id: number;
  productId: string;
  productName?: string;
  productSku?: string;
  transactionType: 'sale' | 'purchase' | 'refund' | 'adjustment' | 'miscelleneous';
  quantity: number;
  stockQuantity: number;
  unitPrice: number;
  costPrice: number;
  sellPrice: number;
  avgPrice: number;
  previousCostPrice: number;
  previousSellPrice: number;
  previousAvgPrice: number;
  supplierId?: number;
  customerId?: number;
  supplierInvoiceNumber?: string;
  customerInvoiceNumber?: string;
  totalAmount: number;
  description?: string;
  createdAt: string;
}

export interface MainInventoryFormData {
  productId: string;
  transactionType: 'sale' | 'purchase' | 'refund' | 'adjustment' | 'miscelleneous';
  quantity: number;
  stockQuantity: number;
  unitPrice: number;
  costPrice: number;
  sellPrice: number;
  avgPrice: number;
  previousCostPrice?: number;
  previousSellPrice?: number;
  previousAvgPrice?: number;
  supplierId?: number;
  customerId?: number;
  supplierInvoiceNumber?: string;
  customerInvoiceNumber?: string;
  totalAmount: number;
  description?: string;
}

