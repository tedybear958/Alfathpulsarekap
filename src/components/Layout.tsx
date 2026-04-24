import React, { useState } from 'react';
import { LayoutDashboard, Users, Store, Download, LogOut, UserCog, PiggyBank, Ticket, ShoppingBag, AlertCircle, X, Palette, Check, BookOpen, FileText } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { logout } from '../firebase';

import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, ThemeColor } from '../store/themeStore';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'debts' | 'savings' | 'deposits' | 'team' | 'vouchers' | 'sop' | 'salary-slips';
  setActiveTab: (tab: 'dashboard' | 'debts' | 'savings' | 'deposits' | 'team' | 'vouchers' | 'sop' | 'salary-slips') => void;
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
    <div className="min-h-[100dvh] bg-asphalt-900 flex justify-center" data-theme={theme}>
      <div className="w-full max-w-md bg-asphalt-900 h-[100dvh] flex flex-col relative shadow-2xl overflow-hidden text-asphalt-text-100">
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
        <header className="bg-asphalt-900 text-white sticky top-0 z-20 px-5 py-6 pt-safe flex items-center justify-between border-b border-asphalt-800">
          <div className="flex items-center gap-3">
            <div className="bg-brand-500 p-2 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20">
              <span className="text-[10px] font-black text-white tracking-tighter uppercase">AP</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none">{user?.displayName || 'AlfathPulsa'}</h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-[10px] text-asphalt-text-400 font-bold uppercase tracking-wider">
                  {role === 'bos' ? (branchId ? `Bos - ${branchName}` : 'Bos - Pusat') : 
                   role === 'mandor' ? `Mandor - ${branchName}` : 
                   branchId ? `Karyawan - ${branchName}` : 'Karyawan'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('sop')}
                className="p-2.5 bg-asphalt-800 hover:bg-asphalt-700 rounded-2xl transition-all border border-asphalt-700/50"
                title="Panduan SOP"
              >
                <BookOpen className="w-5 h-5 text-asphalt-text-100" />
              </button>
            <button
              onClick={logout}
              className="p-2.5 bg-asphalt-800 hover:bg-asphalt-700 rounded-2xl transition-all border border-asphalt-700/50"
              title="Keluar"
            >
              <LogOut className="w-5 h-5 text-rose-500" />
            </button>
          </div>
        </header>
        
        {/* Running Text / Announcement */}
        {announcement && (
          <div className="bg-asphalt-800 border-b border-asphalt-700 flex items-center overflow-hidden h-10 shadow-lg">
            <div className="bg-brand-500 self-stretch px-4 flex items-center z-10 shadow-[8px_0_15px_rgba(0,0,0,0.3)]">
              <AlertCircle className="w-4 h-4 text-white animate-pulse" />
              <span className="ml-2 text-[10px] font-black text-white uppercase tracking-tighter">INFO</span>
            </div>
            <div className="flex-1 overflow-hidden relative flex items-center h-full bg-asphalt-900/50">
              <div className="flex whitespace-nowrap animate-marquee py-1">
                <span className="text-xs font-black text-white px-10 uppercase tracking-wide">
                  {announcement}
                </span>
                {/* Duplicate for seamless loop */}
                <span className="text-xs font-black text-white px-10 uppercase tracking-wide">
                  {announcement}
                </span>
                <span className="text-xs font-black text-white px-10 uppercase tracking-wide">
                  {announcement}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Theme Picker Overlay */}
        {showThemePicker && (
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-md flex flex-col justify-end">
            <div className="bg-asphalt-800 rounded-t-[3rem] p-8 pb-14 shadow-2xl animate-in slide-in-from-bottom duration-500 border-t border-asphalt-700">
              <div className="flex items-center justify-between mb-8 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/20">
                    <Palette className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Pilih Aksen Warna</h3>
                    <p className="text-[10px] text-asphalt-text-400 font-bold uppercase tracking-widest mt-0.5">Personalisasi tampilan Anda</p>
                  </div>
                </div>
                <button onClick={() => setShowThemePicker(false)} className="p-3 bg-asphalt-900 rounded-2xl border border-asphalt-700 hover:bg-asphalt-700 transition-all">
                  <X className="w-5 h-5 text-asphalt-text-400" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id); setShowThemePicker(false); }}
                    className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] border-2 transition-all ${
                      theme === t.id ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10' : 'border-asphalt-700 bg-asphalt-900 hover:border-asphalt-600'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full ${t.color} flex items-center justify-center shadow-inner relative`}>
                      {theme === t.id && <Check className="w-6 h-6 text-white stroke-[4px]" />}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${theme === t.id ? 'text-brand-500' : 'text-asphalt-text-400'}`}>
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-24 scroll-smooth no-scrollbar">
          {children}
          <div className="px-5 py-6 text-center">
            <p className="text-[9px] text-asphalt-text-400 font-black uppercase tracking-[0.4em] opacity-30">AlfathPulsa v2.0</p>
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 max-w-md w-full bg-asphalt-900/90 backdrop-blur-xl border-t border-asphalt-800 z-30 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex justify-around items-center h-20 px-2">
            
            {/* Beranda */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1.5 transition-all active:scale-90 ${
                activeTab === 'dashboard' ? 'text-brand-500' : 'text-asphalt-text-400 hover:text-asphalt-text-100'
              }`}
            >
              <div className="relative">
                <LayoutDashboard className={`w-6 h-6 ${activeTab === 'dashboard' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {activeTab === 'dashboard' && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full"></div>
                )}
              </div>
              <span className={`text-[10px] font-black tracking-tight uppercase ${activeTab === 'dashboard' ? 'text-brand-500' : 'opacity-70'}`}>Beranda</span>
            </button>
            
            {/* Dompet */}
            <button
              onClick={() => setActiveTab('savings')}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1.5 transition-all active:scale-90 ${
                activeTab === 'savings' || activeTab === 'debts' ? 'text-brand-500' : 'text-asphalt-text-400 hover:text-asphalt-text-100'
              }`}
            >
              <div className="relative">
                <PiggyBank className={`w-6 h-6 ${activeTab === 'savings' || activeTab === 'debts' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {(activeTab === 'savings' || activeTab === 'debts') && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full"></div>
                )}
              </div>
              <span className={`text-[10px] font-black tracking-tight uppercase ${activeTab === 'savings' || activeTab === 'debts' ? 'text-brand-500' : 'opacity-70'}`}>Tabungan</span>
            </button>

            {/* Aktivitas (Riwayat) */}
            <button
              onClick={() => setActiveTab('vouchers')}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1.5 transition-all active:scale-90 ${
                activeTab === 'vouchers' ? 'text-brand-500' : 'text-asphalt-text-400 hover:text-asphalt-text-100'
              }`}
            >
              <div className="relative">
                <Ticket className={`w-6 h-6 ${activeTab === 'vouchers' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {activeTab === 'vouchers' && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full"></div>
                )}
              </div>
              <span className={`text-[10px] font-black tracking-tight uppercase ${activeTab === 'vouchers' ? 'text-brand-500' : 'opacity-70'}`}>Rekapan</span>
            </button>

            {/* Akun/Tim */}
            <button
              onClick={() => setActiveTab('team')}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1.5 transition-all active:scale-90 ${
                activeTab === 'team' || activeTab === 'sop' ? 'text-brand-500' : 'text-asphalt-text-400 hover:text-asphalt-text-100'
              }`}
            >
              <div className="relative">
                <Users className={`w-6 h-6 ${activeTab === 'team' || activeTab === 'sop' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {(activeTab === 'team' || activeTab === 'sop') && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full"></div>
                )}
              </div>
              <span className={`text-[10px] font-black tracking-tight uppercase ${activeTab === 'team' || activeTab === 'sop' ? 'text-brand-500' : 'opacity-70'}`}>Akun</span>
            </button>
            
          </div>
        </nav>
      </div>
    </div>
  );
}

