import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";
import type {
  AuthResponse,
  LoginCredentials,
  User,
  Product,
  ProductCategory,
  ProductFormData,
  Category,
  CategoryFormData,
  
  Sale,
  Purchase,
  Expense,
  Supplier,
  SupplierFormData,
  ReportSummary,
  ReportFilters,
  PurchaseEntry,
  PurchaseEntryFormData,
  PurchaseItemEntry,
  SupplierTransactionEntry,
  SupplierTransactionFormData,
  MainAccountEntry,
  MainAccountFormData,
  SupplierTransactionsFilters,
} from "../../../shared/types";
import type { ApiEnvelope } from "../../../shared/error";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: "http://localhost:4000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on login endpoint - let it handle the error naturally
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');
    
    if (error.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response: AxiosResponse<ApiEnvelope<AuthResponse>> = await api.post(
        "/auth/login",
        credentials
      );
      return unwrap(response);
    } catch (error: any) {
      // Handle axios errors - axios treats 4xx/5xx as errors
      // Check if we got an ApiEnvelope response (our backend format)
      if (error.response?.data && typeof error.response.data === 'object') {
        const envelope = error.response.data as ApiEnvelope<AuthResponse>;
        // If it has the ApiEnvelope structure with error field, extract the message
        if (envelope.error !== undefined) {
          const errorMsg = envelope.message || envelope.error?.message || 'Login failed';
          const apiError = new Error(errorMsg);
          (apiError as any).response = error.response;
          throw apiError;
        }
      }
      // For network errors or other axios errors, use the axios error message
      throw error;
    }
  },

  getMe: async (): Promise<User> => {
    const response: AxiosResponse<ApiEnvelope<User>> = await api.get("/auth/me");
    return unwrap(response);
  },
};

// Main Account API
export const mainAccountApi = {
  list: async (filters?: {
    fromDate?: string;
    toDate?: string;
    transactionType?: 'debit' | 'credit';
    sourceType?: 'supplier' | 'customer' | 'expense' | 'supplier_refund' | 'customer_refund' | 'adjustment' | 'other';
    minAmount?: number;
    maxAmount?: number;
    sourceId?: number;
    referenceId?: number;
  }): Promise<MainAccountEntry[]> => {
    const response: AxiosResponse<ApiEnvelope<MainAccountEntry[]>> = await api.get(
      `/main-account`,
      { params: filters }
    );
    return unwrap(response);
  },
  create: async (entry: MainAccountFormData): Promise<MainAccountEntry> => {
    const response: AxiosResponse<ApiEnvelope<MainAccountEntry>> = await api.post(
      `/main-account`,
      entry
    );
    return unwrap(response);
  },
};

// Categories API
export const categoriesApi = {
  getCategories: async (): Promise<Category[]> => {
    const response: AxiosResponse<ApiEnvelope<Category[]>> = await api.get("/categories");
    return unwrap(response);
  },

  getCategory: async (id: string): Promise<Category> => {
    const response: AxiosResponse<ApiEnvelope<Category>> = await api.get(`/categories/${id}`);
    return unwrap(response);
  },

  createCategory: async (
    category: CategoryFormData
  ): Promise<Category> => {
    const response: AxiosResponse<ApiEnvelope<Category>> = await api.post(
      "/categories",
      category
    );
    return unwrap(response);
  },

  updateCategory: async (
    id: string,
    category: Partial<CategoryFormData>
  ): Promise<Category> => {
    const response: AxiosResponse<ApiEnvelope<Category>> = await api.put(
      `/categories/${id}`,
      category
    );
    return unwrap(response);
  },

  deleteCategory: async (id: string): Promise<void> => {
    const response: AxiosResponse<ApiEnvelope<null>> = await api.delete(`/categories/${id}`);
    unwrap(response);
  },

  getCategoryProducts: async (id: string): Promise<Product[]> => {
    const response: AxiosResponse<ApiEnvelope<Product[]>> = await api.get(`/categories/${id}/products`);
    return unwrap(response);
  },
};

// Inventory API
export const inventoryApi = {
  getProducts: async (): Promise<Product[]> => {
    const response: AxiosResponse<ApiEnvelope<Product[]>> = await api.get("/inventory");
    return unwrap(response);
  },

  getProduct: async (id: string): Promise<Product> => {
    const response: AxiosResponse<ApiEnvelope<Product>> = await api.get(`/inventory/${id}`);
    return unwrap(response);
  },

  createProduct: async (
    product: ProductFormData
  ): Promise<Product> => {
    const response: AxiosResponse<ApiEnvelope<Product>> = await api.post(
      "/inventory",
      product
    );
    return unwrap(response);
  },

  updateProduct: async (
    id: string,
    product: Partial<Product>
  ): Promise<Product> => {
    const response: AxiosResponse<ApiEnvelope<Product>> = await api.put(
      `/inventory/${id}`,
      product
    );
    return unwrap(response);
  },

  deleteProduct: async (id: string): Promise<void> => {
    const response: AxiosResponse<ApiEnvelope<null>> = await api.delete(`/inventory/${id}`);
    unwrap(response);
  },
};

// Sales API
export const salesApi = {
  getSales: async (): Promise<Sale[]> => {
    const response: AxiosResponse<ApiEnvelope<Sale[]>> = await api.get("/sales");
    return unwrap(response);
  },

  getSale: async (id: string): Promise<Sale> => {
    const response: AxiosResponse<ApiEnvelope<Sale>> = await api.get(`/sales/${id}`);
    return unwrap(response);
  },

  createSale: async (
    sale: Omit<Sale, "id" | "createdAt" | "updatedAt">
  ): Promise<Sale> => {
    const response: AxiosResponse<ApiEnvelope<Sale>> = await api.post("/sales", sale);
    return unwrap(response);
  },

  updateSale: async (id: string, sale: Partial<Sale>): Promise<Sale> => {
    const response: AxiosResponse<ApiEnvelope<Sale>> = await api.put(`/sales/${id}`, sale);
    return unwrap(response);
  },

  deleteSale: async (id: string): Promise<void> => {
    const response: AxiosResponse<ApiEnvelope<null>> = await api.delete(`/sales/${id}`);
    unwrap(response);
  },
};

// Purchases API
export const purchasesApi = {
  getPurchases: async (filters?: { supplierId?: number }): Promise<PurchaseEntry[]> => {
    const response: AxiosResponse<ApiEnvelope<PurchaseEntry[]>> = await api.get("/purchases", { params: filters });
    return unwrap(response);
  },

  getPurchase: async (id: number): Promise<PurchaseEntry> => {
    const response: AxiosResponse<ApiEnvelope<PurchaseEntry>> = await api.get(`/purchases/${id}`);
    return unwrap(response);
  },

  createPurchase: async (
    purchase: PurchaseEntryFormData
  ): Promise<PurchaseEntry> => {
    const response: AxiosResponse<ApiEnvelope<PurchaseEntry>> = await api.post(
      "/purchases",
      purchase
    );
    return unwrap(response);
  },

  updatePurchase: async (
    id: number,
    purchase: Partial<PurchaseEntryFormData>
  ): Promise<PurchaseEntry> => {
    const response: AxiosResponse<ApiEnvelope<PurchaseEntry>> = await api.put(
      `/purchases/${id}`,
      purchase
    );
    return unwrap(response);
  },

  deletePurchase: async (id: number): Promise<void> => {
    const response: AxiosResponse<ApiEnvelope<null>> = await api.delete(`/purchases/${id}`);
    unwrap(response);
  },

  // Purchase Items (nested)
  getPurchaseItems: async (
    purchaseId: number,
  ): Promise<PurchaseItemEntry[]> => {
    const response: AxiosResponse<ApiEnvelope<PurchaseItemEntry[]>> = await api.get(
      `/purchases/${purchaseId}/items`
    );
    return unwrap(response);
  },
  createPurchaseItem: async (
    purchaseId: number,
    item: { productId: string; quantity: number; unitPrice: number }
  ): Promise<PurchaseItemEntry> => {
    const response: AxiosResponse<ApiEnvelope<PurchaseItemEntry>> = await api.post(
      `/purchases/${purchaseId}/items`,
      item
    );
    return unwrap(response);
  },
};

// Expenses API
export const expensesApi = {
  getExpenses: async (): Promise<Expense[]> => {
    const response: AxiosResponse<ApiEnvelope<Expense[]>> = await api.get("/expenses");
    return unwrap(response);
  },

  getExpense: async (id: string): Promise<Expense> => {
    const response: AxiosResponse<ApiEnvelope<Expense>> = await api.get(`/expenses/${id}`);
    return unwrap(response);
  },

  createExpense: async (
    expense: Omit<Expense, "id" | "createdAt" | "updatedAt">
  ): Promise<Expense> => {
    const response: AxiosResponse<ApiEnvelope<Expense>> = await api.post(
      "/expenses",
      expense
    );
    return unwrap(response);
  },

  updateExpense: async (
    id: string,
    expense: Partial<Expense>
  ): Promise<Expense> => {
    const response: AxiosResponse<ApiEnvelope<Expense>> = await api.put(
      `/expenses/${id}`,
      expense
    );
    return unwrap(response);
  },

  deleteExpense: async (id: string): Promise<void> => {
    const response: AxiosResponse<ApiEnvelope<null>> = await api.delete(`/expenses/${id}`);
    unwrap(response);
  },
};

// Product Categories API
export const productCategoriesApi = {
  getCategories: async (): Promise<ProductCategory[]> => {
    const response: AxiosResponse<ApiEnvelope<ProductCategory[]>> = await api.get(
      "/product-categories"
    );
    return unwrap(response);
  },

  getCategory: async (id: string): Promise<ProductCategory> => {
    const response: AxiosResponse<ApiEnvelope<ProductCategory>> = await api.get(
      `/product-categories/${id}`
    );
    return unwrap(response);
  },
};

// Suppliers API
export const suppliersApi = {
  getSuppliers: async (): Promise<Supplier[]> => {
    const response: AxiosResponse<ApiEnvelope<Supplier[]>> = await api.get("/suppliers");
    return unwrap(response);
  },

  getSupplier: async (id: number): Promise<Supplier> => {
    const response: AxiosResponse<ApiEnvelope<Supplier>> = await api.get(`/suppliers/${id}`);
    return unwrap(response);
  },

  createSupplier: async (
    supplier: SupplierFormData
  ): Promise<Supplier> => {
    const response: AxiosResponse<ApiEnvelope<Supplier>> = await api.post(
      "/suppliers",
      supplier
    );
    return unwrap(response);
  },

  updateSupplier: async (
    id: number,
    supplier: Partial<SupplierFormData>
  ): Promise<Supplier> => {
    const response: AxiosResponse<ApiEnvelope<Supplier>> = await api.put(
      `/suppliers/${id}`,
      supplier
    );
    return unwrap(response);
  },

  deleteSupplier: async (id: number): Promise<void> => {
    const response: AxiosResponse<ApiEnvelope<null>> = await api.delete(`/suppliers/${id}`);
    unwrap(response);
  },
};

// Reports API
export const reportsApi = {
  getSummary: async (filters?: ReportFilters): Promise<ReportSummary> => {
    const response: AxiosResponse<ApiEnvelope<ReportSummary>> = await api.get(
      "/reports/summary",
      {
        params: filters,
      }
    );
    return unwrap(response);
  },
};

export default api;

// Supplier Transactions API
export const supplierTransactionsApi = {
  list: async (supplierId: number, filters?: SupplierTransactionsFilters): Promise<SupplierTransactionEntry[]> => {
    const response: AxiosResponse<ApiEnvelope<SupplierTransactionEntry[]>> = await api.get(
      `/suppliers/${supplierId}/transactions`,
      { params: filters }
    );
    return unwrap(response);
  },
  create: async (
    supplierId: number,
    tx: SupplierTransactionFormData
  ): Promise<SupplierTransactionEntry> => {
    const response: AxiosResponse<ApiEnvelope<SupplierTransactionEntry>> = await api.post(
      `/suppliers/${supplierId}/transactions`,
      tx
    );
    return unwrap(response);
  },
  update: async (
    supplierId: number,
    transactionId: number,
    tx: Partial<SupplierTransactionFormData>
  ): Promise<SupplierTransactionEntry> => {
    const response: AxiosResponse<ApiEnvelope<SupplierTransactionEntry>> = await api.put(
      `/suppliers/${supplierId}/transactions/${transactionId}`,
      tx
    );
    return unwrap(response);
  },
  delete: async (supplierId: number, transactionId: number): Promise<void> => {
    const response: AxiosResponse<ApiEnvelope<null>> = await api.delete(
      `/suppliers/${supplierId}/transactions/${transactionId}`
    );
    unwrap(response);
  },
};

// Helper to unwrap ApiEnvelope and throw on error for consumers
function unwrap<T>(response: AxiosResponse<ApiEnvelope<T>>): T {
  const body = response.data;
  if (body.error) {
    const msg = body.message || body.error.message || 'Request failed';
    const error = new Error(msg);
    (error as any).errorDetails = body.error;
    throw error;
  }
  if (body.data === null) {
    throw new Error('No data returned from server');
  }
  return body.data as T;
}
