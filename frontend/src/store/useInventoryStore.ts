import { create } from 'zustand';
import type { Product, InventoryFilters } from '@/lib/types';

interface InventoryState {
  products: Product[];
  filteredProducts: Product[];
  filters: InventoryFilters;
  isLoading: boolean;
  error: string | null;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  setFilters: (filters: Partial<InventoryFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  applyFilters: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  filteredProducts: [],
  filters: {},
  isLoading: false,
  error: null,

  setProducts: (products) => {
    set({ products });
    get().applyFilters();
  },

  addProduct: (product) => {
    const { products } = get();
    const newProducts = [...products, product];
    set({ products: newProducts });
    get().applyFilters();
  },

  updateProduct: (id, updatedProduct) => {
    const { products } = get();
    const newProducts = products.map(p => 
      p.id === id ? { ...p, ...updatedProduct } : p
    );
    set({ products: newProducts });
    get().applyFilters();
  },

  removeProduct: (id) => {
    const { products } = get();
    const newProducts = products.filter(p => p.id !== id);
    set({ products: newProducts });
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
    const { products, filters } = get();
    let filtered = [...products];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= filters.maxPrice!);
    }

    if (filters.lowStock) {
      filtered = filtered.filter(p => p.quantity <= p.minQuantity);
    }

    set({ filteredProducts: filtered });
  },
}));
