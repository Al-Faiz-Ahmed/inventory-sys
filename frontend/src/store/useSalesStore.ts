import { create } from 'zustand';
import type { Sale, SalesFilters } from '@/lib/types';

interface SalesState {
  sales: Sale[];
  filteredSales: Sale[];
  filters: SalesFilters;
  isLoading: boolean;
  error: string | null;
  setSales: (sales: Sale[]) => void;
  addSale: (sale: Sale) => void;
  updateSale: (id: string, sale: Partial<Sale>) => void;
  removeSale: (id: string) => void;
  setFilters: (filters: Partial<SalesFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  applyFilters: () => void;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  sales: [],
  filteredSales: [],
  filters: {},
  isLoading: false,
  error: null,

  setSales: (sales) => {
    set({ sales });
    get().applyFilters();
  },

  addSale: (sale) => {
    const { sales } = get();
    const newSales = [...sales, sale];
    set({ sales: newSales });
    get().applyFilters();
  },

  updateSale: (id, updatedSale) => {
    const { sales } = get();
    const newSales = sales.map(s => 
      s.id === id ? { ...s, ...updatedSale } : s
    );
    set({ sales: newSales });
    get().applyFilters();
  },

  removeSale: (id) => {
    const { sales } = get();
    const newSales = sales.filter(s => s.id !== id);
    set({ sales: newSales });
    get().applyFilters();
  },

  setFilters: (newFilters) => {
    const { filters } = get();
    const updatedFilters = { ...filters, ...newFilters };
    set({ filters: updatedFilters });
    get().applyFilters();
  },

  clearFilters: () => {
    set({ filters: {} });
    get().applyFilters();
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  applyFilters: () => {
    const { sales, filters } = get();
    let filtered = [...sales];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(s => 
        s.productName.toLowerCase().includes(searchLower) ||
        s.customerName?.toLowerCase().includes(searchLower) ||
        s.customerEmail?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter(s => s.saleDate >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(s => s.saleDate <= filters.endDate!);
    }

    if (filters.customerName) {
      filtered = filtered.filter(s => 
        s.customerName?.toLowerCase().includes(filters.customerName!.toLowerCase())
      );
    }

    set({ filteredSales: filtered });
  },
}));
