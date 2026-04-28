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
import { SalarySlips } from './components/SalarySlips';
import { NotificationManager } from './components/NotificationManager';
import { useAuthStore } from './store/authStore';
import { initFinanceStoreListeners } from './hooks/useFinanceStore';
import { checkIsBos, checkIsMandor } from './utils/authUtils';
import { AlertCircle } from 'lucide-react';
import { logout } from './firebase';

export default function App() {
  const { user, isAuthLoaded, role, branchId } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'debts' | 'savings' | 'deposits' | 'team' | 'vouchers' | 'sop' | 'salary-slips'>('dashboard');

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

  const isBos = checkIsBos(user, role);
  const isMandor = checkIsMandor(role);

  // If user is logged in but has no role assigned yet (and it's not the initial load)
  if (isAuthLoaded && user && !role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-asphalt-900 p-6 text-center">
        <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 mb-6 border border-rose-500/20">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">Akses Tertunda</h2>
        <p className="mt-3 text-sm text-asphalt-text-400 font-medium max-w-xs leading-relaxed">
          Akun Anda ({user.email}) belum diaktifkan oleh Bos atau belum diberikan jabatan. 
          Silahkan hubungi Bos untuk mendapatkan akses.
        </p>
        <button 
          onClick={() => logout()}
          className="mt-8 px-8 py-3 bg-asphalt-800 text-white rounded-xl text-xs font-black uppercase tracking-widest border border-asphalt-700"
        >
          Keluar & Ganti Akun
        </button>
      </div>
    );
  }

  // If Karyawan has no branch assigned, they can't do much
  if (isAuthLoaded && user && role === 'karyawan' && !branchId && activeTab !== 'sop' && activeTab !== 'salary-slips') {
    // We still allow them to see the layout but maybe a warning inside?
    // Actually, "mental" might be they are stuck here.
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} role={role}>
      <NotificationManager />
      {activeTab === 'dashboard' && (
        <Dashboard 
          onNavigate={(tab) => setActiveTab(tab as any)} 
        />
      )}
      {activeTab === 'debts' && <Debts />}
      {activeTab === 'savings' && <Savings />}
      {activeTab === 'deposits' && <Deposits />}
      {activeTab === 'vouchers' && <VoucherRecaps />}
      {activeTab === 'team' && isBos && <Team />}
      {activeTab === 'sop' && <SOPPage />}
      {activeTab === 'salary-slips' && <SalarySlips />}
    </Layout>
  );
}


