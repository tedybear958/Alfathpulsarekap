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
import { SOPPage } from './components/SOPPage';
import { NotificationManager } from './components/NotificationManager';
import { useAuthStore } from './store/authStore';
import { initFinanceStoreListeners } from './hooks/useFinanceStore';

export default function App() {
  const { user, isAuthLoaded, role } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'debts' | 'savings' | 'deposits' | 'team' | 'vouchers' | 'sop'>('dashboard');

  useEffect(() => {
    if (user && role) {
      initFinanceStoreListeners();
    }
  }, [user, role]);

  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Memuat AlfathPulsa...</span>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} role={role}>
      <NotificationManager />
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'debts' && <Debts />}
      {activeTab === 'savings' && <Savings />}
      {activeTab === 'deposits' && <Deposits />}
      {activeTab === 'vouchers' && <VoucherRecaps />}
      {activeTab === 'team' && role === 'bos' && <Team />}
      {activeTab === 'sop' && <SOPPage />}
    </Layout>
  );
}


