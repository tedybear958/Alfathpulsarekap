import React from 'react';
import { LayoutDashboard, Users, Wallet, Store, Download, LogOut, UserCog, PiggyBank, Ticket, ShoppingBag, AlertCircle, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { logout } from '../firebase';

import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'debts' | 'savings' | 'deposits' | 'team' | 'vouchers' | 'shopping';
  setActiveTab: (tab: 'dashboard' | 'debts' | 'savings' | 'deposits' | 'team' | 'vouchers' | 'shopping') => void;
  role?: 'bos' | 'mandor' | 'karyawan' | null;
}

export function Layout({ children, activeTab, setActiveTab, role }: LayoutProps) {
  const { isInstallable, installApp } = usePWAInstall();
  const { branchId, user } = useAuthStore();
  const { branches, error, setError } = useFinanceStore();
  const branchName = branchId ? branches.find(b => b.id === branchId)?.name : null;

  return (
    <div className="min-h-[100dvh] bg-gray-100 flex justify-center">
      <div className="w-full max-w-md bg-slate-50 h-[100dvh] flex flex-col relative shadow-2xl overflow-hidden">
        {/* Global Error Display */}
        {error && (
          <div
            className="absolute top-20 left-4 right-4 z-50 bg-rose-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-tight">Terjadi Kesalahan</p>
              <p className="text-[10px] opacity-90 truncate">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header */}
        <header className="bg-blue-700 text-white sticky top-0 z-20 px-5 py-4 pt-safe flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-none">{user?.displayName || 'ALFATHPulsa'}</h1>
              <p className="text-[10px] text-blue-200 mt-1 font-medium">
                {role === 'bos' ? (branchId ? `Bos - ${branchName || branchId}` : 'Bos - Pusat') : 
                 role === 'mandor' ? `Mandor - ${branchName || branchId || '...'}` : 
                 branchId ? `Karyawan - ${branchName || branchId}` : 'Karyawan (Belum Ada Cabang)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isInstallable && (
              <button
                onClick={installApp}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-full text-xs font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            )}
            <button
              onClick={logout}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4 text-white" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
          {children}
          <div className="px-5 py-4 text-center">
            <p className="text-[8px] text-gray-300 font-mono">v2026.04.08.01 - ALFATHPulsa</p>
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200 z-30 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
          <div className="flex justify-around items-center h-16 mb-safe">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                activeTab === 'dashboard' ? 'text-blue-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <LayoutDashboard className={`w-6 h-6 ${activeTab === 'dashboard' ? 'fill-blue-50' : ''}`} />
              <span className="text-[10px] font-bold">Beranda</span>
            </button>
            
            {(role === 'bos' || role === 'karyawan' || role === 'mandor') && (
              <button
                onClick={() => setActiveTab('debts')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  activeTab === 'debts' ? 'text-blue-700' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Users className={`w-6 h-6 ${activeTab === 'debts' ? 'fill-blue-50' : ''}`} />
                <span className="text-[10px] font-bold">Bon / Hutang</span>
              </button>
            )}

            {(role === 'bos' || role === 'karyawan' || role === 'mandor') && (
              <button
                onClick={() => setActiveTab('savings')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  activeTab === 'savings' ? 'text-blue-700' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <PiggyBank className={`w-6 h-6 ${activeTab === 'savings' ? 'fill-blue-50' : ''}`} />
                <span className="text-[10px] font-bold">Tabungan</span>
              </button>
            )}

            {(role === 'bos' || role === 'karyawan' || role === 'mandor') && (
              <button
                onClick={() => setActiveTab('deposits')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  activeTab === 'deposits' ? 'text-blue-700' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Store className={`w-6 h-6 ${activeTab === 'deposits' ? 'fill-blue-50' : ''}`} />
                <span className="text-[10px] font-bold">Setoran</span>
              </button>
            )}

            {(role === 'bos' || role === 'karyawan' || role === 'mandor') && (
              <button
                onClick={() => setActiveTab('vouchers')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  activeTab === 'vouchers' ? 'text-blue-700' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Ticket className={`w-6 h-6 ${activeTab === 'vouchers' ? 'fill-blue-50' : ''}`} />
                <span className="text-[10px] font-bold">Rekap</span>
              </button>
            )}

            {(role === 'bos' || role === 'karyawan' || role === 'mandor') && (
              <button
                onClick={() => setActiveTab('shopping')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  activeTab === 'shopping' ? 'text-blue-700' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <ShoppingBag className={`w-6 h-6 ${activeTab === 'shopping' ? 'fill-blue-50' : ''}`} />
                <span className="text-[10px] font-bold">Belanja</span>
              </button>
            )}

            {role === 'bos' && (
              <button
                onClick={() => setActiveTab('team')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  activeTab === 'team' ? 'text-blue-700' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <UserCog className={`w-6 h-6 ${activeTab === 'team' ? 'fill-blue-50' : ''}`} />
                <span className="text-[10px] font-bold">Tim</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}

