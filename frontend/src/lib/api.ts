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
} from "./types";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
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
    const response: AxiosResponse<AuthResponse> = await api.post(
      "/auth/login",
      credentials
    );
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response: AxiosResponse<User> = await api.get("/auth/me");
    return response.data;
  },
};

// Inventory API
export const inventoryApi = {
  getProducts: async (): Promise<Product[]> => {
    const response: AxiosResponse<Product[]> = await api.get("/inventory");
    return response.data;
  },

  getProduct: async (id: string): Promise<Product> => {
    const response: AxiosResponse<Product> = await api.get(`/inventory/${id}`);
    return response.data;
  },

  createProduct: async (
    product: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<Product> => {
    const response: AxiosResponse<Product> = await api.post(
      "/inventory",
      product
    );
    return response.data;
  },

  updateProduct: async (
    id: string,
    product: Partial<Product>
  ): Promise<Product> => {
    const response: AxiosResponse<Product> = await api.put(
      `/inventory/${id}`,
      product
    );
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/inventory/${id}`);
  },
};

// Sales API
export const salesApi = {
  getSales: async (): Promise<Sale[]> => {
    const response: AxiosResponse<Sale[]> = await api.get("/sales");
    return response.data;
  },

  getSale: async (id: string): Promise<Sale> => {
    const response: AxiosResponse<Sale> = await api.get(`/sales/${id}`);
    return response.data;
  },

  createSale: async (
    sale: Omit<Sale, "id" | "createdAt" | "updatedAt">
  ): Promise<Sale> => {
    const response: AxiosResponse<Sale> = await api.post("/sales", sale);
    return response.data;
  },

  updateSale: async (id: string, sale: Partial<Sale>): Promise<Sale> => {
    const response: AxiosResponse<Sale> = await api.put(`/sales/${id}`, sale);
    return response.data;
  },

  deleteSale: async (id: string): Promise<void> => {
    await api.delete(`/sales/${id}`);
  },
};

// Purchases API
export const purchasesApi = {
  getPurchases: async (): Promise<Purchase[]> => {
    const response: AxiosResponse<Purchase[]> = await api.get("/purchases");
    return response.data;
  },

  getPurchase: async (id: string): Promise<Purchase> => {
    const response: AxiosResponse<Purchase> = await api.get(`/purchases/${id}`);
    return response.data;
  },

  createPurchase: async (
    purchase: Omit<Purchase, "id" | "createdAt" | "updatedAt">
  ): Promise<Purchase> => {
    const response: AxiosResponse<Purchase> = await api.post(
      "/purchases",
      purchase
    );
    return response.data;
  },

  updatePurchase: async (
    id: string,
    purchase: Partial<Purchase>
  ): Promise<Purchase> => {
    const response: AxiosResponse<Purchase> = await api.put(
      `/purchases/${id}`,
      purchase
    );
    return response.data;
  },

  deletePurchase: async (id: string): Promise<void> => {
    await api.delete(`/purchases/${id}`);
  },
};

// Expenses API
export const expensesApi = {
  getExpenses: async (): Promise<Expense[]> => {
    const response: AxiosResponse<Expense[]> = await api.get("/expenses");
    return response.data;
  },

  getExpense: async (id: string): Promise<Expense> => {
    const response: AxiosResponse<Expense> = await api.get(`/expenses/${id}`);
    return response.data;
  },

  createExpense: async (
    expense: Omit<Expense, "id" | "createdAt" | "updatedAt">
  ): Promise<Expense> => {
    const response: AxiosResponse<Expense> = await api.post(
      "/expenses",
      expense
    );
    return response.data;
  },

  updateExpense: async (
    id: string,
    expense: Partial<Expense>
  ): Promise<Expense> => {
    const response: AxiosResponse<Expense> = await api.put(
      `/expenses/${id}`,
      expense
    );
    return response.data;
  },

  deleteExpense: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },
};

// Reports API
export const reportsApi = {
  getSummary: async (filters?: ReportFilters): Promise<ReportSummary> => {
    const response: AxiosResponse<ReportSummary> = await api.get(
      "/reports/summary",
      {
        params: filters,
      }
    );
    return response.data;
  },
};

export default api;
