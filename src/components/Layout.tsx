import React, { useState } from 'react';
import { LayoutDashboard, Users, Store, Download, LogOut, UserCog, PiggyBank, Ticket, ShoppingBag, AlertCircle, X, Palette, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { logout } from '../firebase';

import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, ThemeColor } from '../store/themeStore';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'debts' | 'savings' | 'deposits' | 'team' | 'vouchers';
  setActiveTab: (tab: 'dashboard' | 'debts' | 'savings' | 'deposits' | 'team' | 'vouchers') => void;
  role?: 'bos' | 'mandor' | 'karyawan' | null;
}

export function Layout({ children, activeTab, setActiveTab, role }: LayoutProps) {
  const { isInstallable, installApp } = usePWAInstall();
  const { theme, setTheme } = useThemeStore();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const { branchId, user } = useAuthStore();
  const { branches, error, setError, announcement } = useFinanceStore();
  const branchName = branchId ? branches.find(b => b.id === branchId)?.name : null;

  // Apply theme to document element
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const themes: { id: ThemeColor; color: string; label: string }[] = [
    { id: 'blue', color: 'bg-blue-500', label: 'Biru' },
    { id: 'emerald', color: 'bg-emerald-500', label: 'Hijau' },
    { id: 'rose', color: 'bg-rose-500', label: 'Merah' },
    { id: 'amber', color: 'bg-amber-500', label: 'Oranye' },
    { id: 'indigo', color: 'bg-indigo-500', label: 'Ungu' },
    { id: 'slate', color: 'bg-slate-500', label: 'Abu-abu' },
  ];

  return (
    <div className="min-h-[100dvh] bg-gray-100 flex justify-center" data-theme={theme}>
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
        <header className="bg-brand-700 text-white sticky top-0 z-20 px-5 py-4 pt-safe flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-black px-3 py-1.5 rounded-lg flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-[10px] font-black text-white tracking-tighter uppercase">AP</span>
            </div>
            <div>
              <h1 className="text-base font-bold leading-none">{user?.displayName || 'AlfathPulsa'}</h1>
              <p className="text-[10px] text-brand-200 mt-1 font-medium">
                {role === 'bos' ? (branchId ? `Bos - ${branchName || branchId}` : 'Bos - Pusat') : 
                 role === 'mandor' ? `Mandor - ${branchName || branchId || '...'}` : 
                 branchId ? `Karyawan - ${branchName || branchId}` : 'Karyawan (Belum Ada Cabang)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              title="Ganti Tema"
            >
              <Palette className="w-4 h-4 text-white" />
            </button>
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
        
        {/* Running Text / Announcement */}
        {announcement && (
          <div className="bg-white border-b border-gray-100 flex items-center overflow-hidden h-9 shadow-sm">
            <div className="bg-brand-600 self-stretch px-3 flex items-center z-10 shadow-[4px_0_8px_rgba(0,0,0,0.1)]">
              <AlertCircle className="w-3.5 h-3.5 text-white animate-pulse" />
              <span className="ml-1.5 text-[9px] font-black text-white uppercase tracking-tighter">INFO</span>
            </div>
            <div className="flex-1 overflow-hidden relative flex items-center h-full bg-brand-50/50">
              <div className="flex whitespace-nowrap animate-marquee py-1">
                <span className="text-[11px] font-bold text-brand-900 px-8">
                  {announcement}
                </span>
                {/* Duplicate for seamless loop */}
                <span className="text-[11px] font-bold text-brand-900 px-8">
                  {announcement}
                </span>
                <span className="text-[11px] font-bold text-brand-900 px-8">
                  {announcement}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Theme Picker Overlay */}
        {showThemePicker && (
          <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex flex-col justify-end">
            <div className="bg-white rounded-t-[32px] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between mb-6 text-gray-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
                    <Palette className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold">Pilih Tema Aplikasi</h3>
                </div>
                <button onClick={() => setShowThemePicker(false)} className="p-2 bg-gray-100 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id); setShowThemePicker(false); }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                      theme === t.id ? 'border-brand-600 bg-brand-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center`}>
                      {theme === t.id && <Check className="w-5 h-5 text-white" />}
                    </div>
                    <span className={`text-[10px] font-bold ${theme === t.id ? 'text-brand-700' : 'text-gray-500'}`}>
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
          {children}
          <div className="px-5 py-4 text-center">
            <p className="text-[8px] text-gray-300 font-mono">v2026.04.08.01 - AlfathPulsa</p>
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200 z-30 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
          <div className="flex justify-around items-center h-16 mb-safe">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                activeTab === 'dashboard' ? 'text-brand-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <LayoutDashboard className={`w-6 h-6 ${activeTab === 'dashboard' ? 'fill-brand-50' : ''}`} />
              <span className="text-[10px] font-bold">Beranda</span>
            </button>
            
            {(role === 'bos' || role === 'karyawan' || role === 'mandor') && (
              <button
                onClick={() => setActiveTab('debts')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  activeTab === 'debts' ? 'text-brand-700' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Users className={`w-6 h-6 ${activeTab === 'debts' ? 'fill-brand-50' : ''}`} />
                <span className="text-[10px] font-bold">Bon / Hutang</span>
              </button>
            )}

            {(role === 'bos' || role === 'karyawan' || role === 'mandor') && (
              <button
                onClick={() => setActiveTab('savings')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  activeTab === 'savings' ? 'text-brand-700' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <PiggyBank className={`w-6 h-6 ${activeTab === 'savings' ? 'fill-brand-50' : ''}`} />
                <span className="text-[10px] font-bold">Tabungan</span>
              </button>
            )}

            {(role === 'bos' || role === 'karyawan' || role === 'mandor') && (
              <button
                onClick={() => setActiveTab('deposits')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  activeTab === 'deposits' ? 'text-brand-700' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Store className={`w-6 h-6 ${activeTab === 'deposits' ? 'fill-brand-50' : ''}`} />
                <span className="text-[10px] font-bold">Setoran</span>
              </button>
            )}

            {(role === 'bos' || role === 'karyawan' || role === 'mandor') && (
              <button
                onClick={() => setActiveTab('vouchers')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  activeTab === 'vouchers' ? 'text-brand-700' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Ticket className={`w-6 h-6 ${activeTab === 'vouchers' ? 'fill-brand-50' : ''}`} />
                <span className="text-[10px] font-bold">Rekap</span>
              </button>
            )}

            {role === 'bos' && (
              <button
                onClick={() => setActiveTab('team')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  activeTab === 'team' ? 'text-brand-700' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <UserCog className={`w-6 h-6 ${activeTab === 'team' ? 'fill-brand-50' : ''}`} />
                <span className="text-[10px] font-bold">Tim</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}

