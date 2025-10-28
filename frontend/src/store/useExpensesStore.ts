import { create } from 'zustand';
import type { Expense, ExpensesFilters } from '@/lib/types';

interface ExpensesState {
  expenses: Expense[];
  filteredExpenses: Expense[];
  filters: ExpensesFilters;
  isLoading: boolean;
  error: string | null;
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
  setFilters: (filters: Partial<ExpensesFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  applyFilters: () => void;
}

export const useExpensesStore = create<ExpensesState>((set, get) => ({
  expenses: [],
  filteredExpenses: [],
  filters: {},
  isLoading: false,
  error: null,

  setExpenses: (expenses) => {
    set({ expenses });
    get().applyFilters();
  },

  addExpense: (expense) => {
    const { expenses } = get();
    const newExpenses = [...expenses, expense];
    set({ expenses: newExpenses });
    get().applyFilters();
  },

  updateExpense: (id, updatedExpense) => {
    const { expenses } = get();
    const newExpenses = expenses.map(e => 
      e.id === id ? { ...e, ...updatedExpense } : e
    );
    set({ expenses: newExpenses });
    get().applyFilters();
  },

  removeExpense: (id) => {
    const { expenses } = get();
    const newExpenses = expenses.filter(e => e.id !== id);
    set({ expenses: newExpenses });
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
    const { expenses, filters } = get();
    let filtered = [...expenses];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(searchLower) ||
        e.description?.toLowerCase().includes(searchLower) ||
        e.category.toLowerCase().includes(searchLower)
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter(e => e.expenseDate >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(e => e.expenseDate <= filters.endDate!);
    }

    if (filters.category) {
      filtered = filtered.filter(e => e.category === filters.category);
    }

    set({ filteredExpenses: filtered });
  },
}));
