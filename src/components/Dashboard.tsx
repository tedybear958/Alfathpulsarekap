import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { formatRupiah, formatNumberInput, formatDate } from '../utils/formatters';
import { Building2, Plus, Trash2, Landmark, Receipt, Coins, Edit3, Check, Send, PiggyBank } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export function Dashboard() {
  const store = useFinanceStore();
  const { role, branchId } = useAuthStore();
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

  const totalBank = store.getTotalBankBalance();
  const totalDebt = store.getTotalDebt();
  const totalSavings = store.getTotalSavings();
  
  // Logic for Bos: Show overall stats
  // Logic for Branch: Show branch-specific stats
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
    } else if (bankInput === '') {
      await store.updateBankBalance(id, 0);
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
    <div className="p-4 space-y-5">
      {/* Announcement Editor for Bos */}
      {isBosGlobal && (
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-amber-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Pesan Running Text</h3>
            </div>
            {!isEditingAnnouncement ? (
              <button 
                onClick={() => { setAnnouncementInput(store.announcement); setIsEditingAnnouncement(true); }}
                className="text-[10px] font-bold text-brand-600 px-3 py-1 bg-brand-50 rounded-full hover:bg-brand-100"
              >
                Ubah Pesan
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditingAnnouncement(false)}
                  className="text-[10px] font-bold text-gray-400 px-3 py-1"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveAnnouncement}
                  disabled={isSavingAnnouncement}
                  className="text-[10px] font-bold text-white px-3 py-1 bg-brand-600 rounded-full shadow-sm disabled:opacity-50"
                >
                  {isSavingAnnouncement ? '...' : 'Simpan'}
                </button>
              </div>
            )}
          </div>
          
          {isEditingAnnouncement ? (
            <textarea
              className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none resize-none min-h-[80px]"
              placeholder="Masukkan pesan untuk karyawan (misal: INFO: Pastikan teliti sebelum klik!...)"
              value={announcementInput}
              onChange={(e) => setAnnouncementInput(e.target.value)}
            />
          ) : (
            <div className="bg-amber-50/50 p-3 rounded-2xl border border-dashed border-amber-200">
              <p className="text-sm italic text-gray-600 leading-relaxed">
                {store.announcement || 'Belum ada pesan running text. Tambahkan pesan untuk memotivasi atau mengingatkan karyawan.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Balance Card (Banking Style) */}
      <div className="bg-gradient-to-br from-brand-700 to-brand-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1 opacity-90">
            <Coins className="w-4 h-4" />
            <h3 className="text-sm font-medium">
              {isBosGlobal ? 'Total Keseluruhan (Fisik + Non-Fisik)' : `Sisa Uang Fisik (${myBranch?.name || 'Laci'})`}
            </h3>
          </div>
          <p className="text-3xl font-bold tracking-tight mb-5">
            {formatRupiah(isBosGlobal ? totalGlobalCapital : cashInHand)}
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-500/30">
            <div className="w-full">
              <p className="text-xs text-brand-200 mb-1.5">
                {isBosGlobal ? 'Total Modal Non-Fisik' : 'Modal Non-Fisik'}
              </p>
              {isEditingFixed ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-200 text-xs">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="w-full pl-7 pr-2 py-1.5 bg-brand-800/50 border border-brand-400/50 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
                      value={formatNumberInput(fixedInput)}
                      onChange={(e) => handleNumericInput(e, setFixedInput)}
                      autoFocus
                    />
                  </div>
                  <button 
                    onClick={handleSaveFixed} 
                    disabled={isSavingFixed}
                    className="p-1.5 bg-white text-brand-700 rounded-lg hover:bg-brand-50 transition-colors disabled:opacity-50"
                  >
                    {isSavingFixed ? (
                      <div className="w-4 h-4 border-2 border-brand-700 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{formatRupiah(isBosGlobal ? totalAllBranchesNonPhysicalCapital : effectiveFixedBalance)}</p>
                  {role === 'bos' && !isBosGlobal && (
                    <button onClick={() => { setFixedInput(effectiveFixedBalance.toString()); setIsEditingFixed(true); }} className="text-brand-200 hover:text-white p-1">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {!isBosGlobal && (
              <div className="w-full border-l border-brand-500/30 pl-4">
                <p className="text-xs text-brand-200 mb-1.5">Modal Fisik</p>
                <p className="text-sm font-semibold">{formatRupiah(myBranch?.physicalCapital || 0)}</p>
              </div>
            )}
            {isBosGlobal && (
              <div className="w-full border-l border-brand-500/30 pl-4">
                <p className="text-xs text-brand-200 mb-1.5">Total Modal Fisik</p>
                <p className="text-sm font-semibold">{formatRupiah(totalAllBranchesPhysicalCapital)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Branch Details for Bos */}
      {isBosGlobal && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Building2 className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-gray-900">Rincian Modal & Fisik Per Cabang</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {branchData.map(branch => {
              const branchBankTotal = branch.branchBankTotal;
              const branchDebtTotal = branch.branchDebtTotal;
              const branchCash = branch.branchCash;

              return (
                <div key={branch.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <h4 className="text-sm font-bold text-gray-900">{branch.name}</h4>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Sisa Uang Fisik</p>
                      <p className="text-sm font-bold text-brand-600">{formatRupiah(branchCash)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Modal Non-Fisik</p>
                      <p className="text-xs font-bold text-gray-700">{formatRupiah(branch.branchNonPhysicalCapital)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Modal Fisik</p>
                      <p className="text-xs font-bold text-orange-600">{formatRupiah(branch.branchPhysicalCapital)}</p>
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
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <Landmark className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Total di Bank</span>
            </div>
            <p className="text-sm font-bold text-gray-900">{formatRupiah(currentBankTotal)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-rose-600 mb-1">
              <Receipt className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Total Bon</span>
            </div>
            <p className="text-sm font-bold text-gray-900">{formatRupiah(currentDebtTotal)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center col-span-2">
            <div className="flex items-center gap-2 text-brand-600 mb-1">
              <PiggyBank className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Total Tabungan</span>
            </div>
            <p className="text-sm font-bold text-gray-900">{formatRupiah(totalSavings)}</p>
          </div>
        </div>
      )}

      {/* Bank Accounts List - Hidden for Bos Global as requested */}
      {!isBosGlobal && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-gray-900">Rekening Bank</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50">
              <form onSubmit={handleAddBank} className="space-y-3">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nama Bank</label>
                  <input
                    type="text"
                    placeholder="Contoh: BCA, BRI, Mandiri"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none bg-white font-medium shadow-sm"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nominal Saldo</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">Rp</span>
                    <input
                      type="text"
                      placeholder="0"
                      inputMode="numeric"
                      className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none bg-white font-bold shadow-sm"
                      value={formatNumberInput(newBankBalance)}
                      onChange={(e) => handleNumericInput(e, setNewBankBalance)}
                      required
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isAddingBank}
                  className="w-full py-3.5 bg-brand-600 text-white rounded-2xl hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-bold shadow-md shadow-brand-200 disabled:opacity-50"
                >
                  {isAddingBank ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  <span>{isAddingBank ? 'Menyimpan...' : 'Tambah Rekening'}</span>
                </button>
              </form>
            </div>

            <div className="divide-y divide-gray-50">
              {store.bankBalances.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                  <Landmark className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs">Belum ada rekening bank.</p>
                </div>
              ) : (
                store.bankBalances.map((bank) => (
                  <div key={bank.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 group-hover:bg-brand-100 transition-colors">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{bank.bankName}</p>
                        <p className="text-[10px] text-gray-400">Terakhir update: {formatDate(bank.updatedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          className={`w-32 pl-7 pr-2 py-1.5 text-sm font-bold rounded-lg transition-all text-right ${
                            editingBankId === bank.id 
                              ? 'bg-white border-brand-200 ring-2 ring-brand-100 outline-none text-gray-900' 
                              : 'bg-gray-50 border-transparent text-gray-700'
                          }`}
                          value={editingBankId === bank.id ? formatNumberInput(bankInput) : (bank.balance === 0 ? '0' : formatNumberInput(bank.balance))}
                          onChange={(e) => handleNumericInput(e, setBankInput)}
                          onFocus={() => {
                            setEditingBankId(bank.id);
                            setBankInput(bank.balance.toString());
                          }}
                          placeholder="0"
                        />
                      </div>
                      {editingBankId === bank.id ? (
                        <button
                          onClick={() => handleSaveBankBalance(bank.id)}
                          className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-sm"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, id: bank.id, name: bank.bankName })}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Hapus Rekening"
        message={`Apakah Anda yakin ingin menghapus rekening ${deleteConfirm.name}? Data yang dihapus tidak dapat dikembalikan.`}
        onConfirm={() => store.deleteBankBalance(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}
