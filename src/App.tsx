/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Debts } from './components/Debts';
import { Savings } from './components/Savings';
import { Deposits } from './components/Deposits';
import { VoucherRecaps } from './components/VoucherRecaps';
import { Login } from './components/Login';
import { Team } from './components/Team';
import { useAuthStore } from './store/authStore';
import { initFinanceStoreListeners, stopFinanceStoreListeners } from './hooks/useFinanceStore';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'debts' | 'savings' | 'deposits' | 'team' | 'vouchers'>('dashboard');
  const { user, isAuthLoaded, role, branchId } = useAuthStore();

  useEffect(() => {
    if (user && role) {
      initFinanceStoreListeners();
    } else {
      stopFinanceStoreListeners();
    }
    return () => {
      stopFinanceStoreListeners();
    };
  }, [user, role, branchId]);

  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Role-based rendering logic
  // Bos sees everything
  // Mandor sees all except Team
  // Karyawan sees Dashboard, Debts, and Savings
  
  const renderContent = () => {
    if (role === 'mandor') {
      return (
        <>
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'debts' && <Debts />}
          {activeTab === 'savings' && <Savings />}
          {activeTab === 'deposits' && <Deposits />}
          {activeTab === 'vouchers' && <VoucherRecaps />}
        </>
      );
    }
    
    if (role === 'karyawan') {
      return (
        <>
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'debts' && <Debts />}
          {activeTab === 'savings' && <Savings />}
          {activeTab === 'deposits' && <Deposits />}
          {activeTab === 'vouchers' && <VoucherRecaps />}
        </>
      );
    }

    // Bos
    return (
      <>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'debts' && <Debts />}
        {activeTab === 'savings' && <Savings />}
        {activeTab === 'deposits' && <Deposits />}
        {activeTab === 'vouchers' && <VoucherRecaps />}
        {activeTab === 'team' && <Team />}
      </>
    );
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} role={role}>
      {renderContent()}
    </Layout>
  );
}


