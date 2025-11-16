import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { DashboardLayout } from '@/layout/DashboardLayout';
import { AuthLayout } from '@/layout/AuthLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Homepage } from '@/routes/Homepage';
import { Login } from '@/routes/Login';
import { Dashboard } from '@/routes/Dashboard';
import { Inventory } from '@/routes/Inventory';
import { Sales } from '@/routes/Sales';
import { Purchases } from '@/routes/Purchases';
import { PurchaseSupplier } from '@/routes/PurchaseSupplier';
import { SalesCustomer } from '@/routes/SalesCustomer';
import { Expenses } from '@/routes/Expenses';
import { Reports } from '@/routes/Reports';
import { ReportsPurchase } from '@/routes/ReportsPurchase';
import { ReportsSales } from '@/routes/ReportsSales';
import MainAccountReport from '@/routes/reports/MainAccountReport';
import MainInventoryReport from '@/routes/reports/MainInventoryReport';
import { Settings } from '@/routes/Settings';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : 
        <AuthLayout>
          <Login />
        </AuthLayout>
      } />

      {/* Protected routes */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/" element={<Homepage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/sales/customers/:customerId" element={<SalesCustomer />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/purchases/suppliers/:supplierId" element={<PurchaseSupplier />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/purchase" element={<ReportsPurchase />} />
        <Route path="/reports/sales" element={<ReportsSales />} />
        <Route path="/reports/main-account" element={<MainAccountReport />} />
        <Route path="/reports/main-inventory" element={<MainInventoryReport />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
