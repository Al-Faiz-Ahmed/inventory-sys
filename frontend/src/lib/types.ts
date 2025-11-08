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