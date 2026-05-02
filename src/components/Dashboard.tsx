import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { checkIsBos } from '../utils/authUtils';
import { formatRupiah, formatNumberInput, formatDate } from '../utils/formatters';
import { Building2, Plus, Trash2, Landmark, Receipt, Coins, Edit3, Check, Send, PiggyBank, Users, Ticket, Store, BookOpen, MoreHorizontal, History as HistoryIcon, UserCog, X, FileText } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { SuccessToast } from './SuccessToast';

interface ServiceIconProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: string;
}

function ServiceIcon({ icon, label, onClick, badge }: ServiceIconProps) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 group relative"
    >
      <div className="w-16 h-16 bg-asphalt-900/50 border border-asphalt-700/50 rounded-[1.5rem] flex items-center justify-center transition-all group-active:scale-90 group-hover:bg-asphalt-700/50 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="text-brand-500 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
      <span className="text-[10px] font-extrabold text-asphalt-text-400 text-center leading-tight uppercase tracking-tight group-hover:text-asphalt-text-100 transition-colors">
        {label}
      </span>
      {badge && (
        <div className="absolute top-0 right-1 pointer-events-none z-10">
          <div className="bg-rose-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter leading-none shadow-lg shadow-rose-500/20 border-2 border-[#0B111D]">
            {badge}
          </div>
        </div>
      )}
    </button>
  );
}

export function Dashboard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const store = useFinanceStore();
  const { user, role, branchId } = useAuthStore();
  const [isEditingFixed, setIsEditingFixed] = useState(false);
  const [fixedInput, setFixedInput] = useState('');
  
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [announcementInput, setAnnouncementInput] = useState(store.announcement);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  
  const [isSavingFixed, setIsSavingFixed] = useState(false);
  
  const [newBankName, setNewBankName] = useState('');
  const [newBankBalance, setNewBankBalance] = useState('');
  const [isAddingBank, setIsAddingBank] = useState(false);

  const [setorAmount, setSetorAmount] = useState('');
  const [setorDesc, setSetorDesc] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankInput, setBankInput] = useState('');

  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  });

  const totalBank = store.getTotalBankBalance();
  const totalDebt = store.getTotalDebt();
  const totalSavings = store.getTotalSavings();
  
  // Logic for Bos: Show overall stats
  // Logic for Branch: Show branch-specific stats
  const { branches } = store;
  const isBosGlobal = role === 'bos' && !branchId;
  
  // Optimize calculations with useMemo
  const branchData = useMemo(() => {
    if (!store.branches) return [];
    
    return store.branches.map(branch => {
      const branchBanks = (store.bankBalances || []).filter(b => b.branchId === branch.id);
      const branchBankTotal = branchBanks.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);
      const branchDebts = (store.debts || []).filter(d => d.branchId === branch.id);
      const branchDebtTotal = branchDebts.reduce((sum, d) => sum + store.getPersonTotalDebt(d), 0);
      const branchPhysicalCapital = Number(branch.physicalCapital) || 0;
      const branchNonPhysicalCapital = Number(branch.capital) || 0;
      const branchCash = branchNonPhysicalCapital - branchBankTotal - branchDebtTotal;

      return {
        ...branch,
        branchBankTotal,
        branchDebtTotal,
        branchPhysicalCapital,
        branchNonPhysicalCapital,
        branchCash
      };
    });
  }, [store.branches, store.bankBalances, store.debts, store.getPersonTotalDebt]);

  const myBranch = useMemo(() => 
    branchId ? branchData.find(b => b.id === branchId) : null
  , [branchData, branchId]);

  const effectiveFixedBalance = isBosGlobal ? (Number(store.fixedBalance) || 0) : (Number(myBranch?.capital) || 0);
  
  const currentBankTotal = useMemo(() => 
    isBosGlobal 
      ? (store.bankBalances || []).reduce((sum, b) => sum + (Number(b.balance) || 0), 0)
      : (store.bankBalances || []).filter(b => b.branchId === branchId).reduce((sum, b) => sum + (Number(b.balance) || 0), 0)
  , [isBosGlobal, store.bankBalances, branchId]);

  const isBos = checkIsBos(user, role);
    
  const currentDebtTotal = useMemo(() => 
    isBosGlobal
      ? (store.debts || []).reduce((sum, d) => sum + store.getPersonTotalDebt(d), 0)
      : (store.debts || []).filter(d => d.branchId === branchId).reduce((sum, d) => sum + store.getPersonTotalDebt(d), 0)
  , [isBosGlobal, store.debts, branchId, store.getPersonTotalDebt]);

  const cashInHand = effectiveFixedBalance - currentBankTotal - currentDebtTotal;

  const totalAllBranchesPhysicalCapital = useMemo(() => 
    branchData.reduce((sum, b) => sum + b.branchPhysicalCapital, 0), 
  [branchData]);

  const totalAllBranchesNonPhysicalCapital = useMemo(() => 
    branchData.reduce((sum, b) => sum + b.branchNonPhysicalCapital, 0), 
  [branchData]);
  
  const totalGlobalCapital = totalAllBranchesPhysicalCapital + totalAllBranchesNonPhysicalCapital;

  if (!store.isLoaded) return null;

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const value = e.target.value.replace(/\D/g, '');
    setter(value);
    
    // Explicitly set cursor to the end
    const target = e.target;
    requestAnimationFrame(() => {
      const len = target.value.length;
      target.setSelectionRange(len, len);
    });
  };

  const handleSaveFixed = async () => {
    const val = parseInt(fixedInput.replace(/\D/g, ''), 10);
    if (!isNaN(val)) {
      setIsSavingFixed(true);
      try {
        if (role === 'bos' && !branchId) {
          await store.updateFixedBalance(val);
        } else if (branchId) {
          await store.updateBranchCapital(branchId, val);
        }
        setIsEditingFixed(false);
      } catch (error) {
        console.error("Failed to save balance", error);
        store.setError("Gagal menyimpan modal. Pastikan Anda memiliki akses yang sesuai.");
      } finally {
        setIsSavingFixed(false);
      }
    } else {
      setIsEditingFixed(false);
    }
  };

  const handleSaveAnnouncement = async () => {
    setIsSavingAnnouncement(true);
    try {
      await store.updateAnnouncement(announcementInput);
      setIsEditingAnnouncement(false);
    } catch (error) {
      console.error("Failed to save announcement", error);
      store.setError("Gagal menyimpan pengumuman.");
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim() || isAddingBank) return;
    const val = parseInt(newBankBalance.replace(/\D/g, ''), 10);
    if (!isNaN(val)) {
      setIsAddingBank(true);
      try {
        await store.addBankBalance(newBankName, val);
        setNewBankName('');
        setNewBankBalance('');
        setToast({ show: true, message: `Rekening ${newBankName} berhasil ditambahkan` });
      } catch (error) {
        console.error("Failed to add bank", error);
        store.setError("Gagal menambah rekening. Pastikan koneksi internet stabil.");
      } finally {
        setIsAddingBank(false);
      }
    }
  };

  const handleBankBalanceChange = (id: string, value: string) => {
    setBankInput(value.replace(/\D/g, ''));
  };

  const handleSaveBankBalance = async (id: string) => {
    const val = parseInt(bankInput.replace(/\D/g, ''), 10);
    if (!isNaN(val)) {
      await store.updateBankBalance(id, val);
      setToast({ show: true, message: 'Saldo rekening berhasil diperbarui' });
    } else if (bankInput === '') {
      await store.updateBankBalance(id, 0);
      setToast({ show: true, message: 'Saldo rekening berhasil diperbarui menjadi 0' });
    }
    setEditingBankId(null);
  };

  const handleSetor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId || !setorAmount || !setorDesc) return;
    const val = parseInt(setorAmount.replace(/\D/g, ''), 10);
    if (val > 0) {
      store.addBranchDeposit(branchId, val, 0, 'Mandor', setorDesc);
      setSetorAmount('');
      setSetorDesc('');
    }
  };

  return (
    <div className="p-4 space-y-6 pb-32">
      {/* Announcement Editor for Bos */}
      {isBosGlobal && (
        <div className="bg-asphalt-800 rounded-3xl p-4 border border-asphalt-700/50 shadow-xl overflow-hidden relative group transition-all hover:border-brand-500/30">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-brand-500/10 transition-colors"></div>
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-xs font-black text-asphalt-text-100 uppercase tracking-widest">Pesan Running Text</h3>
              </div>
              {!isEditingAnnouncement ? (
                <button 
                  onClick={() => { setAnnouncementInput(store.announcement); setIsEditingAnnouncement(true); }}
                  className="text-[9px] font-black text-brand-500 bg-brand-500/10 px-3 py-1.5 rounded-lg border border-brand-500/20 hover:bg-brand-500/20 transition-all uppercase tracking-tighter"
                >
                  Ubah Pesan
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditingAnnouncement(false)}
                    className="text-[9px] font-black text-asphalt-text-400 px-3 py-1.5 uppercase tracking-tighter"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSaveAnnouncement}
                    disabled={isSavingAnnouncement}
                    className="text-[9px] font-black text-white px-3 py-1.5 bg-brand-500 rounded-lg shadow-lg shadow-brand-500/20 disabled:opacity-50 uppercase tracking-tighter"
                  >
                    {isSavingAnnouncement ? '...' : 'Simpan'}
                  </button>
                </div>
              )}
            </div>
            
            {isEditingAnnouncement ? (
              <textarea
                className="w-full p-3 text-xs bg-asphalt-900 border border-asphalt-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none min-h-[80px] text-asphalt-text-100 transition-all font-medium"
                placeholder="Masukkan pesan untuk karyawan..."
                value={announcementInput}
                onChange={(e) => setAnnouncementInput(e.target.value)}
              />
            ) : (
              <div className="bg-asphalt-900/50 p-3 rounded-xl border border-asphalt-700/50 min-h-[50px] flex items-center">
                <p className="text-xs italic text-asphalt-text-400 leading-relaxed font-medium">
                  {store.announcement || 'Belum ada pesan running text.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Balance Card (GoPay Inspired Card) */}
      <div className="bg-asphalt-800 rounded-[2.5rem] p-6 border border-asphalt-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full -mr-24 -mt-24 blur-[80px] group-hover:bg-brand-500/20 transition-all duration-700"></div>
        <div className="relative z-10 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-brand-500/10 rounded-lg">
                <Coins className="w-3.5 h-3.5 text-brand-500" />
              </div>
              <h3 className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-[0.2em]">
                {isBosGlobal ? 'Total Dana Terkelola' : `Sisa Saldo Tunai`}
              </h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-brand-500">Rp</span>
              <p className="text-4xl font-black tracking-tighter text-white">
                {(isBosGlobal ? totalGlobalCapital : cashInHand).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 pt-5 border-t border-asphalt-700/50">
            <div className="space-y-2">
              <p className="text-[9px] font-black text-asphalt-text-400 uppercase tracking-widest">
                Dana Digital
              </p>
              {isEditingFixed ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-asphalt-text-400 text-[10px] font-bold">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="w-full pl-8 pr-3 py-2 bg-asphalt-900 border border-asphalt-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                      value={formatNumberInput(fixedInput)}
                      onChange={(e) => handleNumericInput(e, setFixedInput)}
                      autoFocus
                    />
                  </div>
                  <button 
                    onClick={handleSaveFixed} 
                    disabled={isSavingFixed}
                    className="p-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-all disabled:opacity-50 shadow-lg shadow-brand-500/20"
                  >
                    {isSavingFixed ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Check className="w-4 h-4 stroke-[3px]" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between group/row">
                  <p className="text-base font-black text-white">{formatRupiah(isBosGlobal ? totalAllBranchesNonPhysicalCapital : effectiveFixedBalance)}</p>
                  {isBos && !isBosGlobal && (
                    <button 
                      onClick={() => { setFixedInput(effectiveFixedBalance.toString()); setIsEditingFixed(true); }} 
                      className="text-asphalt-text-400 hover:text-brand-500 p-2 bg-asphalt-700/50 rounded-lg transition-all opacity-0 group-hover/row:opacity-100"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 pl-6 border-l border-asphalt-700/50">
              <p className="text-[9px] font-black text-asphalt-text-400 uppercase tracking-widest">Dana Fisik</p>
              <p className="text-base font-black text-white">
                {formatRupiah(isBosGlobal ? totalAllBranchesPhysicalCapital : (myBranch?.physicalCapital || 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Services - Asphalt Style Menu */}
      <div className="bg-asphalt-800 rounded-[2.5rem] p-5 border border-asphalt-700/50 shadow-2xl">
        <div className="grid grid-cols-4 gap-y-7">
          <ServiceIcon 
            icon={<Users className="w-6 h-6 text-brand-500" />} 
            label="Hutang / Bon" 
            onClick={() => onNavigate?.('debts')}
          />
          <ServiceIcon 
            icon={<PiggyBank className="w-6 h-6 text-brand-500" />} 
            label="Tabungan" 
            onClick={() => onNavigate?.('savings')}
          />
          <ServiceIcon 
            icon={<Store className="w-6 h-6 text-brand-500" />} 
            label="Setoran" 
            onClick={() => onNavigate?.('deposits')}
          />
          <ServiceIcon 
            icon={<Ticket className="w-6 h-6 text-brand-500" />} 
            label="Rekap Data" 
            onClick={() => onNavigate?.('vouchers')}
          />
          <ServiceIcon 
            icon={<BookOpen className="w-6 h-6 text-brand-500" />} 
            label="Info SOP" 
            onClick={() => onNavigate?.('sop')}
          />
          <ServiceIcon 
            icon={<HistoryIcon className="w-6 h-6 text-brand-500" />} 
            label="Log Aktivitas" 
            onClick={() => {}} 
          />
          <ServiceIcon 
            icon={<UserCog className="w-6 h-6 text-brand-500" />} 
            label="Kelola Tim" 
            onClick={() => onNavigate?.('team')}
          />
          <ServiceIcon 
            icon={<FileText className="w-6 h-6 text-brand-500" />} 
            label="Slip Gaji" 
            onClick={() => onNavigate?.('salary-slips')}
          />
        </div>
      </div>

      {/* States Table Section */}
      {isBosGlobal && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-brand-500" />
            </div>
            <h3 className="text-xs font-black text-asphalt-text-100 uppercase tracking-[0.2em]">Kinerja Cabang</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {branches.map((branch) => {
              const currentBranchData = branchData.find(b => b.id === branch.id);
              if (!currentBranchData) return null;

              return (
                <div key={branch.id} className="bg-asphalt-800 rounded-[2rem] p-4 border border-asphalt-700/50 shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-asphalt-700/50 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
                        <Building2 className="w-5 h-5 text-brand-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">{branch.name}</h4>
                        <p className="text-[10px] text-asphalt-text-400 font-bold uppercase tracking-wider">ID: {branch.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-asphalt-text-400 uppercase font-black tracking-[0.2em] mb-0.5">Physical Cash</p>
                      <p className="text-sm font-black text-brand-500">{formatRupiah(currentBranchData.branchCash)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-asphalt-900/50 p-3 rounded-2xl border border-asphalt-700/30">
                      <p className="text-[8px] text-asphalt-text-400 uppercase font-black tracking-widest mb-1.5 text-center">Digital Capital</p>
                      <p className="text-xs font-black text-asphalt-text-100 text-center">{formatRupiah(currentBranchData.branchNonPhysicalCapital)}</p>
                    </div>
                    <div className="bg-asphalt-900/50 p-3 rounded-2xl border border-asphalt-700/30">
                      <p className="text-[8px] text-asphalt-text-400 uppercase font-black tracking-widest mb-1.5 text-center">Physical Capital</p>
                      <p className="text-xs font-black text-amber-500 text-center">{formatRupiah(currentBranchData.branchPhysicalCapital)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mini Stats - Hidden for Bos Global as requested */}
      {!isBosGlobal && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-asphalt-800 p-4 rounded-3xl border border-asphalt-700/50 shadow-xl flex flex-col justify-center space-y-2 group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-2 text-emerald-500">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                <Landmark className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Bank Saldo</span>
            </div>
            <p className="text-base font-black text-white">{formatRupiah(currentBankTotal)}</p>
          </div>
          <div className="bg-asphalt-800 p-4 rounded-3xl border border-asphalt-700/50 shadow-xl flex flex-col justify-center space-y-2 group hover:border-rose-500/30 transition-all">
            <div className="flex items-center gap-2 text-rose-500">
              <div className="p-1.5 bg-rose-500/10 rounded-lg">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Total Bon</span>
            </div>
            <p className="text-base font-black text-white">{formatRupiah(currentDebtTotal)}</p>
          </div>
          <div className="bg-brand-500 p-4 rounded-[2rem] shadow-xl shadow-brand-500/20 flex flex-col justify-center col-span-2 space-y-2">
            <div className="flex items-center gap-2 text-white/80">
              <PiggyBank className="w-5 h-5 text-white" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tabungan Karyawan</span>
            </div>
            <p className="text-2xl font-black text-white">{formatRupiah(totalSavings)}</p>
          </div>
        </div>
      )}

      {/* Bank Accounts List - Hidden for Bos Global as requested */}
      {!isBosGlobal && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Landmark className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-xs font-black text-asphalt-text-100 uppercase tracking-[0.2em]">Rekening Bank</h3>
          </div>

          <div className="bg-asphalt-800 rounded-[2.5rem] border border-asphalt-700/50 shadow-2xl overflow-hidden">
            {role !== 'bos' && (
              <div className="p-4 bg-asphalt-900/40 border-b border-asphalt-700/50">
                <form onSubmit={handleAddBank} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">Bank</label>
                      <input
                        type="text"
                        placeholder="e.g. BCA"
                        className="w-full pl-4 pr-3 py-3 text-xs bg-asphalt-800 border border-asphalt-700 rounded-xl focus:ring-1 focus:ring-brand-500 outline-none text-white font-bold"
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">Saldo</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        className="w-full pl-4 pr-3 py-3 text-xs bg-asphalt-800 border border-asphalt-700 rounded-xl focus:ring-1 focus:ring-brand-500 outline-none text-white font-bold"
                        value={formatNumberInput(newBankBalance)}
                        onChange={(e) => handleNumericInput(e, setNewBankBalance)}
                        required
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isAddingBank}
                    className="w-full bg-brand-500 hover:bg-brand-600 font-black text-[10px] py-3.5 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                  >
                    {isAddingBank ? 'Sabar...' : 'Tambah Rekening'}
                  </button>
                </form>
              </div>
            )}

            <div className="divide-y divide-asphalt-700/50">
              {store.bankBalances.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-asphalt-text-400">
                  <Landmark className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Belum ada rekening</p>
                </div>
              ) : (
                store.bankBalances.map((bank) => (
                  <div key={bank.id} className="p-3.5 flex items-center justify-between group hover:bg-asphalt-700/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md p-1.5 shrink-0">
                        <span className="text-[8px] font-black text-brand-900 line-clamp-1 text-center leading-none uppercase tracking-tighter">
                          {bank.bankName}
                        </span>
                      </div>
                      {editingBankId === bank.id ? (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-asphalt-text-400 text-[10px] font-bold">Rp</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="w-full pl-8 pr-3 py-2.5 bg-asphalt-900 border border-brand-500 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-brand-500"
                              value={formatNumberInput(bankInput)}
                              onChange={(e) => handleNumericInput(e, setBankInput)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveBankBalance(bank.id)}
                              autoFocus
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSaveBankBalance(bank.id)}
                              className="p-2.5 bg-brand-500 text-white rounded-lg shadow-lg shadow-brand-500/20 active:scale-95 transition-all"
                              title="Simpan"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3px]" />
                            </button>
                            <button
                              onClick={() => setEditingBankId(null)}
                              className="p-2.5 bg-asphalt-700 text-asphalt-text-400 rounded-lg hover:text-white transition-all"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5 stroke-[3px]" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-asphalt-text-400 uppercase tracking-widest truncate max-w-[80px]">{bank.bankName}</p>
                          <p className="text-[13px] font-black text-white">{formatRupiah(bank.balance)}</p>
                        </div>
                      )}
                    </div>
                    
                    {editingBankId !== bank.id && (
                      <div className="flex items-center gap-2 shrink-0 ml-1">
                        {role !== 'bos' && (
                          <button
                            onClick={() => { setBankInput(bank.balance.toString()); setEditingBankId(bank.id); }}
                            className="p-2 text-brand-500 bg-brand-500/10 border border-brand-500/20 rounded-lg transition-all active:scale-90"
                            title="Edit Saldo"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                        {role !== 'bos' && (
                          <button
                            onClick={() => setDeleteConfirm({ isOpen: true, id: bank.id, name: bank.bankName })}
                            className="p-2 text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg transition-all active:scale-90"
                            title="Hapus Rekening"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {!isBosGlobal && (
        <div className="pt-4 pb-12">
          <div className="bg-asphalt-800 rounded-3xl border border-asphalt-700/50 p-6 flex items-center justify-between shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            <div className="relative z-10">
              <h3 className="text-sm font-black text-white mb-1 uppercase tracking-tight">Sudah Melakukan Setoran?</h3>
              <p className="text-[10px] text-asphalt-text-400 font-bold uppercase tracking-wider">Laporkan setoran laci ke Mandor/Bos</p>
            </div>
            <button
              onClick={() => onNavigate?.('deposits')}
              className="relative z-10 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Hapus Rekening"
        message={`Apakah Anda yakin ingin menghapus rekening ${deleteConfirm.name}? Data yang dihapus tidak dapat dikembalikan.`}
        onConfirm={async () => {
          try {
            await store.deleteBankBalance(deleteConfirm.id);
            setToast({ show: true, message: `Rekening ${deleteConfirm.name} berhasil dihapus` });
          } catch (error) {
            console.error("Failed to delete bank", error);
            store.setError("Gagal menghapus rekening.");
          }
          setDeleteConfirm({ isOpen: false, id: '', name: '' });
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
      />

      <SuccessToast 
        show={toast.show} 
        message={toast.message} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
}
