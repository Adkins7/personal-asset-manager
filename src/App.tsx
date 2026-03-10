import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import FinancialAssets from './pages/FinancialAssets';
import Liabilities from './pages/Liabilities';
import OtherAssets from './pages/OtherAssets';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { useAuthStore } from './store/useAuthStore';

function App() {
  // @ts-ignore
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-emerald-600 text-xl font-semibold">正在加载系统...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        
        <Route path="/" element={user ? <MainLayout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="assets/financial" element={<FinancialAssets />} />
          <Route path="assets/liabilities" element={<Liabilities />} />
          <Route path="assets/other" element={<OtherAssets />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
