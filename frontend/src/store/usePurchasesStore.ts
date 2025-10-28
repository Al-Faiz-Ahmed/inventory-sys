import { create } from 'zustand';
import type { Purchase, PurchasesFilters } from '@/lib/types';

interface PurchasesState {
  purchases: Purchase[];
  filteredPurchases: Purchase[];
  filters: PurchasesFilters;
  isLoading: boolean;
  error: string | null;
  setPurchases: (purchases: Purchase[]) => void;
  addPurchase: (purchase: Purchase) => void;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => void;
  removePurchase: (id: string) => void;
  setFilters: (filters: Partial<PurchasesFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  applyFilters: () => void;
}

export const usePurchasesStore = create<PurchasesState>((set, get) => ({
  purchases: [],
  filteredPurchases: [],
  filters: {},
  isLoading: false,
  error: null,

  setPurchases: (purchases) => {
    set({ purchases });
    get().applyFilters();
  },

  addPurchase: (purchase) => {
    const { purchases } = get();
    const newPurchases = [...purchases, purchase];
    set({ purchases: newPurchases });
    get().applyFilters();
  },

  updatePurchase: (id, updatedPurchase) => {
    const { purchases } = get();
    const newPurchases = purchases.map(p => 
      p.id === id ? { ...p, ...updatedPurchase } : p
    );
    set({ purchases: newPurchases });
    get().applyFilters();
  },

  removePurchase: (id) => {
    const { purchases } = get();
    const newPurchases = purchases.filter(p => p.id !== id);
    set({ purchases: newPurchases });
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
    const { purchases, filters } = get();
    let filtered = [...purchases];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.productName.toLowerCase().includes(searchLower) ||
        p.supplierName.toLowerCase().includes(searchLower)
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter(p => p.purchaseDate >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(p => p.purchaseDate <= filters.endDate!);
    }

    if (filters.supplierName) {
      filtered = filtered.filter(p => 
        p.supplierName.toLowerCase().includes(filters.supplierName!.toLowerCase())
      );
    }

    set({ filteredPurchases: filtered });
  },
}));
