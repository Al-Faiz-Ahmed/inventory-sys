import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";
import type {
  AuthResponse,
  LoginCredentials,
  User,
  Product,
  Sale,
  Purchase,
  Expense,
  ReportSummary,
  ReportFilters,
  PaginatedResponse,
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
    if (error.response?.status === 401) {
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
    const response: AxiosResponse<ApiEnvelope<AuthResponse>> = await api.post(
      "/auth/login",
      credentials
    );
    return unwrap(response);
  },

  getMe: async (): Promise<User> => {
    const response: AxiosResponse<ApiEnvelope<User>> = await api.get("/auth/me");
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
    product: Omit<Product, "id" | "createdAt" | "updatedAt">
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
  getPurchases: async (): Promise<Purchase[]> => {
    const response: AxiosResponse<ApiEnvelope<Purchase[]>> = await api.get("/purchases");
    return unwrap(response);
  },

  getPurchase: async (id: string): Promise<Purchase> => {
    const response: AxiosResponse<ApiEnvelope<Purchase>> = await api.get(`/purchases/${id}`);
    return unwrap(response);
  },

  createPurchase: async (
    purchase: Omit<Purchase, "id" | "createdAt" | "updatedAt">
  ): Promise<Purchase> => {
    const response: AxiosResponse<ApiEnvelope<Purchase>> = await api.post(
      "/purchases",
      purchase
    );
    return unwrap(response);
  },

  updatePurchase: async (
    id: string,
    purchase: Partial<Purchase>
  ): Promise<Purchase> => {
    const response: AxiosResponse<ApiEnvelope<Purchase>> = await api.put(
      `/purchases/${id}`,
      purchase
    );
    return unwrap(response);
  },

  deletePurchase: async (id: string): Promise<void> => {
    const response: AxiosResponse<ApiEnvelope<null>> = await api.delete(`/purchases/${id}`);
    unwrap(response);
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

// Helper to unwrap ApiEnvelope and throw on error for consumers
function unwrap<T>(response: AxiosResponse<ApiEnvelope<T>>): T {
  const body = response.data;
  if (body.error) {
    const msg = body.message || 'Request failed';
    throw new Error(msg);
  }
  return body.data as T;
}
