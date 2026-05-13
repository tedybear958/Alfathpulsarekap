import React, { useState } from 'react';
import { LayoutDashboard, Users, Store, Download, LogOut, UserCog, PiggyBank, Ticket, ShoppingBag, AlertCircle, X, Palette, Check, BookOpen, FileText } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { logout } from '../firebase';

import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, ThemeColor } from '../store/themeStore';
import { checkIsBos, checkIsMandor } from '../utils/authUtils';

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
    <div className="min-h-[100dvh] bg-[#0B111D] flex justify-center selection:bg-brand-500/30" data-theme={theme}>
      <div className="w-full md:max-w-3xl lg:max-w-5xl xl:max-w-7xl bg-[#0B111D] h-[100dvh] flex flex-col relative shadow-2xl overflow-hidden text-asphalt-text-100 md:border-x md:border-asphalt-800/30">
        {/* Global Error Display */}
        {error && (
          <div
            className="absolute top-24 left-4 right-4 z-50 bg-rose-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4"
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
        <header className="bg-[#0B111D] text-white sticky top-0 z-20 px-5 pt-[env(safe-area-inset-top,1.5rem)] pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20 ring-2 ring-brand-500/10 active:scale-95 transition-transform">
                <span className="text-sm font-black text-white tracking-widest uppercase">AP</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0B111D] rounded-full flex items-center justify-center border-2 border-[#0B111D]">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight leading-none text-white/95 uppercase">{user?.displayName || 'AlfathPulsa'}</h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                <p className="text-[9px] text-asphalt-text-400 font-extrabold uppercase tracking-[0.1em]">
                  {checkIsBos(user, role) ? (branchId ? `BOS • ${branchName}` : 'BOS PUSAT') : 
                   checkIsMandor(role) ? `MANDOR • ${branchName || 'SEMUA'}` : 
                   branchId ? `KARYAWAN • ${branchName}` : 'KARYAWAN'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowThemePicker(true)}
              className="w-10 h-10 flex items-center justify-center bg-asphalt-800/50 hover:bg-asphalt-700 rounded-xl transition-all border border-asphalt-700/50 active:scale-90"
              title="Pilih Tema"
            >
              <Palette className="w-4.5 h-4.5 text-brand-500" />
            </button>
            <button
              onClick={logout}
              className="w-10 h-10 flex items-center justify-center bg-asphalt-800/50 hover:bg-asphalt-700 rounded-xl transition-all border border-asphalt-700/50 active:scale-90"
              title="Keluar"
            >
              <LogOut className="w-4.5 h-4.5 text-rose-500" />
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
        <main className="flex-1 overflow-y-auto pb-24 scroll-smooth no-scrollbar relative">
          {children}
          <div className="px-5 py-6 text-center">
            <p className="text-[9px] text-asphalt-text-400 font-black uppercase tracking-[0.4em] opacity-30">AlfathPulsa v2.0</p>
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 md:relative max-w-md md:max-w-full w-full bg-[#0B111D]/80 backdrop-blur-2xl border-t border-asphalt-800/30 z-30 pb-safe shadow-[0_-15px_50px_rgba(0,0,0,0.6)]">
          <div className="flex justify-around items-center h-[4.5rem] px-3 relative">
            
            {/* Nav background indicator */}
            {/* We'll use layoutId for smooth sliding effect if we wanted a shared background, 
                but here we'll animate individual items for a more "clickable" feel */}

            {/* Beranda */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1.5 transition-all group active:scale-90 ${
                activeTab === 'dashboard' ? 'text-brand-500' : 'text-asphalt-text-400 opacity-60'
              }`}
            >
              <div className="relative">
                <LayoutDashboard 
                  className={`w-5.5 h-5.5 transition-colors duration-300 ${activeTab === 'dashboard' ? 'stroke-[2.5px]' : 'stroke-2'}`} 
                />
              </div>
              <span className={`text-[9px] font-black tracking-widest uppercase`}>
                Beranda
              </span>
            </button>
            
            {/* Dompet / Tabungan */}
            {role !== 'mandor' && (
              <button
                onClick={() => setActiveTab('savings')}
                className={`flex flex-col items-center justify-center flex-1 h-full space-y-1.5 transition-all group active:scale-90 ${
                  activeTab === 'savings' || activeTab === 'debts' ? 'text-brand-500' : 'text-asphalt-text-400 opacity-60'
                }`}
              >
                <div className="relative">
                  <PiggyBank 
                    className={`w-5.5 h-5.5 transition-colors duration-300 ${activeTab === 'savings' || activeTab === 'debts' ? 'stroke-[2.5px]' : 'stroke-2'}`} 
                  />
                </div>
                <span className={`text-[9px] font-black tracking-widest uppercase`}>
                  Tabungan
                </span>
              </button>
            )}

            {/* Rekapan */}
            <button
              onClick={() => setActiveTab('vouchers')}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1.5 transition-all group active:scale-90 ${
                activeTab === 'vouchers' ? 'text-brand-500' : 'text-asphalt-text-400 opacity-60'
              }`}
            >
              <div className="relative">
                <Ticket 
                  className={`w-5.5 h-5.5 transition-colors duration-300 ${activeTab === 'vouchers' ? 'stroke-[2.5px]' : 'stroke-2'}`} 
                />
              </div>
              <span className={`text-[9px] font-black tracking-widest uppercase`}>
                Rekapan
              </span>
            </button>

            {/* Slip Gaji (For Karyawan/Mandor only) */}
            {!checkIsBos(user, role) && (
              <button
                onClick={() => setActiveTab('salary-slips')}
                className={`flex flex-col items-center justify-center flex-1 h-full space-y-1.5 transition-all group active:scale-90 ${
                  activeTab === 'salary-slips' ? 'text-brand-500' : 'text-asphalt-text-400 opacity-60'
                }`}
              >
                <div className="relative">
                  <FileText 
                    className={`w-5.5 h-5.5 transition-colors duration-300 ${activeTab === 'salary-slips' ? 'stroke-[2.5px]' : 'stroke-2'}`} 
                  />
                </div>
                <span className={`text-[9px] font-black tracking-widest uppercase`}>
                  Gaji
                </span>
              </button>
            )}

            {/* Akun (For Bos) */}
            {checkIsBos(user, role) && (
              <button
                onClick={() => setActiveTab('team')}
                className={`flex flex-col items-center justify-center flex-1 h-full space-y-1.5 transition-all group active:scale-90 ${
                  activeTab === 'team' || activeTab === 'sop' ? 'text-brand-500' : 'text-asphalt-text-400 opacity-60'
                }`}
              >
                <div className="relative">
                  <Users 
                    className={`w-5.5 h-5.5 transition-colors duration-300 ${activeTab === 'team' || activeTab === 'sop' ? 'stroke-[2.5px]' : 'stroke-2'}`} 
                  />
                </div>
                <span className={`text-[9px] font-black tracking-widest uppercase`}>
                  Akun
                </span>
              </button>
            )}
            
          </div>
        </nav>
      </div>
    </div>
  );
}

