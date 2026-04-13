import React, { useState } from 'react';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { formatRupiah, formatDate, formatNumberInput } from '../utils/formatters';
import { Send, Trash2, CheckCircle2, Clock, Search, Filter, AlertCircle, Share2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { DepositAnalytics } from './DepositAnalytics';

export function Deposits() {
  const store = useFinanceStore();
  const { role, branchId } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [historyLimit, setHistoryLimit] = useState(10);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'received' | 'verified'>('all');

  const [setorAmount, setSetorAmount] = useState('');
  const [setorDesc, setSetorDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingDeposit, setEditingDeposit] = useState<{ branchId: string; depositId: string; amount: string } | null>(null);
  const [completingDeposit, setCompletingDeposit] = useState<{ branchId: string; depositId: string; amount: string; atmName: string } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; branchId: string; depositId: string; name: string }>({
    isOpen: false,
    branchId: '',
    depositId: '',
    name: ''
  });

  if (!store.isLoaded) return null;

  const myBranch = store.branches.find(b => b.id === branchId);

  const handleTabChange = (tab: 'active' | 'history') => {
    setActiveTab(tab);
    setFilterStatus('all');
    setHistoryLimit(10);
  };

  // Flatten all deposits from all branches, filtered by branch if not bos/mandor
  const allDeposits = store.branches
    .filter(branch => role === 'bos' || role === 'mandor' || branch.id === branchId)
    .flatMap(branch => 
      branch.deposits.map(dep => ({
        ...dep,
        branchName: branch.name,
        branchId: branch.id
      }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredDeposits = allDeposits.filter(dep => {
    const matchesSearch = dep.branchName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         dep.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dep.createdByName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by tab
    const matchesTab = activeTab === 'active' 
      ? (dep.status === 'pending' || dep.status === 'received')
      : (dep.status === 'verified');

    const matchesStatus = filterStatus === 'all' || dep.status === filterStatus;
    return matchesSearch && matchesStatus && matchesTab;
  });

  const displayedDeposits = activeTab === 'active' 
    ? filteredDeposits 
    : filteredDeposits.slice(0, historyLimit);

  const stats = (role === 'bos' || role === 'mandor') ? store.getTotalAllBranches() : (myBranch ? store.getBranchStats(myBranch) : { totalSetor: 0, sisaSetor: 0, berhasilDisetor: 0 });

  const hasPending = allDeposits.some(d => d.status === 'pending');
  const primaryAmount = role === 'mandor' ? stats.sisaSetor : stats.berhasilDisetor;
  const primaryLabel = role === 'mandor' ? 'Uang Belum Setor (Aktif)' : (role === 'bos' ? 'Total Setoran Berhasil (Hari Ini)' : `Total Setoran Berhasil (${myBranch?.name || 'Cabang'})`);

  const handleSetor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId || !setorAmount || !setorDesc || isSubmitting) return;
    const val = parseInt(setorAmount.replace(/\D/g, ''), 10);
    if (val > 0) {
      setIsSubmitting(true);
      try {
        await store.addBranchDeposit(branchId, val, 0, 'Mandor', setorDesc);
        setSetorAmount('');
        setSetorDesc('');
      } catch (error) {
        console.error("Failed to add deposit", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="p-4 space-y-5">
      <DepositAnalytics />

      {/* Summary Header */}
      <div className={`bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden transition-all duration-500 ${role === 'mandor' && stats.sisaSetor > 0 ? 'ring-4 ring-emerald-400 ring-offset-4 ring-offset-white' : ''}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1 opacity-90">
            <Send className={`w-4 h-4 ${role === 'mandor' && stats.sisaSetor > 0 ? 'animate-bounce' : ''}`} />
            <h3 className="text-sm font-medium">
              {primaryLabel}
            </h3>
          </div>
          <p className={`text-3xl font-bold tracking-tight mb-4 transition-all ${role === 'mandor' && stats.sisaSetor > 0 ? 'scale-105 origin-left' : ''}`}>
            {formatRupiah(primaryAmount)}
          </p>
          <div className="grid grid-cols-2 gap-4 border-t border-emerald-500/50 pt-4">
            <div>
              <p className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">Total Uang Masuk (Hari Ini)</p>
              <p className="text-sm font-bold">{formatRupiah(stats.totalSetor)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">
                {role === 'mandor' ? 'Setoran Berhasil' : 'Uang Belum Setor (Aktif)'}
              </p>
              <p className={`text-sm font-bold ${role === 'mandor' ? 'text-white' : 'text-rose-300'}`}>
                {formatRupiah(role === 'mandor' ? stats.berhasilDisetor : stats.sisaSetor)}
              </p>
            </div>
          </div>

          {role === 'mandor' && (
            <button
              onClick={() => {
                if (allDeposits.length === 0) return;

                const latestDate = new Date(allDeposits[0].date);
                latestDate.setHours(0, 0, 0, 0);
                
                const today = latestDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
                const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                
                // Group by Bank for Verified
                const bankGroups: Record<string, { total: number, branches: Record<string, number> }> = {};
                // Group by Branch for Unset (Pending/Received)
                const unSetGroups: Record<string, number> = {};
                
                allDeposits
                  .filter(d => {
                    const dDate = new Date(d.date);
                    dDate.setHours(0, 0, 0, 0);
                    return dDate.getTime() === latestDate.getTime();
                  })
                  .forEach(d => {
                    if (d.status === 'verified') {
                      const bank = d.atmName || 'BANK LAIN';
                      if (!bankGroups[bank]) {
                        bankGroups[bank] = { total: 0, branches: {} };
                      }
                      bankGroups[bank].total += d.berhasilDisetor;
                      bankGroups[bank].branches[d.branchName] = (bankGroups[bank].branches[d.branchName] || 0) + d.berhasilDisetor;
                    } else {
                      unSetGroups[d.branchName] = (unSetGroups[d.branchName] || 0) + d.totalSetor;
                    }
                  });

                let message = `*🏦 LAPORAN SETORAN BANK*\n`;
                message += `━━━━━━━━━━━━━━━━━━\n\n`;

                if (Object.keys(bankGroups).length > 0) {
                  Object.entries(bankGroups).forEach(([bank, data]) => {
                    message += `*Setor Ke ${bank.toUpperCase()}*\n`;
                    message += `*Total total:* *${formatRupiah(data.total)}*\n\n`;
                    
                    Object.entries(data.branches)
                      .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' }))
                      .forEach(([branch, amount]) => {
                        message += `${branch} # *${formatRupiah(amount)}*\n`;
                      });
                    message += `\n━━━━━━━━━━━━━━━━━━\n\n`;
                  });
                }

                if (Object.keys(unSetGroups).length > 0) {
                  message += `*⚠️ BELUM SETOR (FISIK)*\n`;
                  let totalUnset = 0;
                  Object.entries(unSetGroups)
                    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' }))
                    .forEach(([branch, amount]) => {
                      message += `${branch} # *${formatRupiah(amount)}*\n`;
                      totalUnset += amount;
                    });
                  message += `*Total:* *${formatRupiah(totalUnset)}*\n`;
                  message += `\n━━━━━━━━━━━━━━━━━━\n\n`;
                }

                message += `📅 _${today} - ${time}_ \n`;
                message += `_ALFATH PULSA GROUP_`;

                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
              }}
              className="mt-4 w-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border border-white/30 transition-all active:scale-[0.98]"
            >
              <Share2 className="w-4 h-4" />
              Share Laporan Gabungan Terbaru
            </button>
          )}
        </div>
      </div>

      {/* Input Form for Karyawan/Mandor */}
      {(role === 'karyawan' || role === 'mandor') && myBranch && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Input Setoran Baru</h3>
              <p className="text-[10px] text-gray-400 font-medium">Kirim laporan setoran ke Mandor/Pusat</p>
            </div>
          </div>
          <div className="p-5">
            <form onSubmit={handleSetor} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nominal Setoran</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">Rp</span>
                  <input
                    type="text"
                    placeholder="0"
                    inputMode="numeric"
                    className="w-full pl-10 pr-4 py-3.5 text-base border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 font-bold shadow-inner"
                    value={formatNumberInput(setorAmount)}
                    onChange={(e) => setSetorAmount(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Keterangan</label>
                <input
                  type="text"
                  placeholder="Contoh: Setoran Pagi, Setoran Hasil Penjualan"
                  className="w-full px-4 py-3.5 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 font-medium shadow-inner"
                  value={setorDesc}
                  onChange={(e) => setSetorDesc(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'Mengirim...' : 'Kirim Setoran'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-bold text-gray-900">Daftar Setoran</h3>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => handleTabChange('active')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeTab === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              AKTIF
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              RIWAYAT
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari cabang, karyawan, atau keterangan..."
              className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white shadow-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {activeTab === 'active' && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterStatus === 'all' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'bg-white text-gray-500 border border-gray-100'}`}
              >
                Semua Aktif
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all relative ${filterStatus === 'pending' ? 'bg-orange-500 text-white shadow-md shadow-orange-100' : 'bg-white text-gray-500 border border-gray-100'}`}
              >
                Pending
                {hasPending && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white"></span>
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilterStatus('received')}
                className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterStatus === 'received' ? 'bg-blue-500 text-white shadow-md shadow-blue-100' : 'bg-white text-gray-500 border border-gray-100'}`}
              >
                Diterima Mandor
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Deposits Feed */}
      <div className="space-y-4 pb-10">
        {displayedDeposits.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-200" />
            </div>
            <p className="text-sm font-medium text-gray-400">
              {activeTab === 'active' ? 'Tidak ada setoran aktif.' : 'Tidak ada riwayat setoran.'}
            </p>
          </div>
        ) : (
          <>
            {displayedDeposits.map((deposit) => {
            const totalSetor = deposit.totalSetor ?? 0;
            const berhasilDisetor = deposit.berhasilDisetor ?? 0;
            const sisaSetor = deposit.sisaSetor ?? (totalSetor - berhasilDisetor);

            return (
              <div key={deposit.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group">
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  deposit.status === 'pending' ? 'bg-orange-400' : 
                  deposit.status === 'received' ? 'bg-blue-400' : 'bg-emerald-500'
                }`}></div>

                <div className="p-5">
                  {/* Header: Branch & Status */}
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        deposit.status === 'pending' ? 'bg-orange-50 text-orange-600' : 
                        deposit.status === 'received' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        <Send className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-gray-900">{deposit.branchName}</h4>
                          {deposit.status === 'pending' && (
                            <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium">{formatDate(deposit.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-emerald-600 leading-none mb-1">{formatRupiah(totalSetor)}</p>
                      {deposit.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 uppercase tracking-tighter">
                          MENUNGGU MANDOR
                        </span>
                      ) : deposit.status === 'received' ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-tighter">
                          DITERIMA MANDOR
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-tighter">
                          SETORAN SELESAI
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Flow Logic Visualization (3 Steps) */}
                  <div className="flex items-center gap-2 mb-5 px-1">
                    {/* Step 1: Karyawan Input */}
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="h-1 rounded-full bg-emerald-500"></div>
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">1. Input</span>
                    </div>
                    {/* Step 2: Mandor Receive */}
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className={`h-1 rounded-full ${deposit.status !== 'pending' ? 'bg-emerald-500' : 'bg-gray-100'}`}></div>
                      <span className={`text-[8px] font-black uppercase tracking-tighter ${deposit.status !== 'pending' ? 'text-emerald-600' : 'text-gray-300'}`}>2. Terima</span>
                    </div>
                    {/* Step 3: Mandor Complete */}
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className={`h-1 rounded-full ${deposit.status === 'verified' ? 'bg-emerald-500' : 'bg-gray-100'}`}></div>
                      <span className={`text-[8px] font-black uppercase tracking-tighter ${deposit.status === 'verified' ? 'text-emerald-600' : 'text-gray-300'}`}>3. Selesai</span>
                    </div>
                  </div>

                  {/* Message & Info */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold shadow-sm shrink-0">
                        {deposit.createdByName?.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Pesan dari {deposit.createdByName}</p>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed italic">
                          "{deposit.description}"
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 pt-3 border-t border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span className="font-medium">Tujuan:</span>
                          <span className="font-bold text-slate-700">{deposit.destination || 'Mandor'}</span>
                        </div>
                        {deposit.status !== 'pending' && (
                          <div className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Diterima: {deposit.receivedByName}
                          </div>
                        )}
                      </div>
                      {deposit.status === 'verified' && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <span className="font-medium">ATM/Bank:</span>
                            <span className="font-bold text-emerald-600">{deposit.atmName || '-'}</span>
                          </div>
                          <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Selesai: {deposit.completedByName}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verified Details */}
                  {deposit.status === 'verified' && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50">
                        <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Masuk Rekening</p>
                        <p className="text-xs font-black text-emerald-700">{formatRupiah(berhasilDisetor)}</p>
                      </div>
                      <div className={`rounded-xl p-3 border ${sisaSetor > 0 ? 'bg-rose-50 border-rose-100/50' : 'bg-slate-50 border-slate-100/50'}`}>
                        <p className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${sisaSetor > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Sisa Uang</p>
                        <p className={`text-xs font-black ${sisaSetor > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                          {sisaSetor > 0 ? `-${formatRupiah(sisaSetor)}` : 'Lunas'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {(role === 'bos' || role === 'mandor') && (
                    <div className="space-y-3 pt-2">
                      {deposit.status === 'pending' && (
                        <button
                          onClick={() => store.receiveBranchDeposit(deposit.branchId, deposit.id)}
                          className="w-full bg-blue-600 text-white py-3.5 rounded-2xl text-xs font-bold hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Terima Uang Fisik
                        </button>
                      )}
                      
                      {deposit.status === 'received' && (
                        <div className="space-y-3">
                          <button
                            onClick={() => {
                              setCompletingDeposit({ 
                                branchId: deposit.branchId, 
                                depositId: deposit.id, 
                                amount: totalSetor.toString(),
                                atmName: ''
                              });
                            }}
                            className="w-full bg-emerald-600 text-white py-3.5 rounded-2xl text-xs font-bold hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Setor ke ATM & Selesai
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        {role === 'mandor' && (
                          <button
                            onClick={() => {
                              const date = new Date(deposit.date).toLocaleString('id-ID', { 
                                day: '2-digit', month: 'long', year: 'numeric', 
                                hour: '2-digit', minute: '2-digit' 
                              });
                              const statusText = deposit.status === 'pending' ? '⏳ PENDING' : 
                                               deposit.status === 'received' ? '✅ DITERIMA MANDOR' : '💰 SETORAN SELESAI';
                              
                              const message = `*LAPORAN SETORAN MANDOR*\n` +
                                `--------------------------\n` +
                                `📍 *Cabang:* ${deposit.branchName}\n` +
                                `📅 *Tanggal:* ${date}\n` +
                                `💵 *Nominal:* ${formatRupiah(totalSetor)}\n` +
                                `📝 *Ket:* ${deposit.description}\n` +
                                `📊 *Status:* ${statusText}\n` +
                                `--------------------------\n` +
                                `🎯 *Tujuan:* ${deposit.destination || 'Mandor'}\n` +
                                (deposit.status === 'verified' ? `🏦 *ATM/Bank:* ${deposit.atmName || '-'}\n` : '') +
                                (deposit.status === 'verified' ? `✅ *Masuk Rek:* ${formatRupiah(berhasilDisetor)}\n` : '') +
                                (deposit.status === 'verified' && sisaSetor > 0 ? `⚠️ *Sisa Uang:* ${formatRupiah(sisaSetor)}\n` : '') +
                                `--------------------------\n` +
                                `_Laporan otomatis dari ALFATHPulsa_`;
                              
                              window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                            }}
                            className="flex-1 bg-emerald-50 text-emerald-600 py-3 rounded-2xl text-xs font-bold hover:bg-emerald-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-emerald-100"
                          >
                            <Share2 className="w-4 h-4" />
                            Share WhatsApp
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingDeposit({ branchId: deposit.branchId, depositId: deposit.id, amount: berhasilDisetor.toString() });
                          }}
                          className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl text-xs font-bold hover:bg-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          Edit Nominal
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, branchId: deposit.branchId, depositId: deposit.id, name: deposit.description })}
                          className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Inline Completion Form */}
                {completingDeposit?.depositId === deposit.id && (
                  <div className="p-5 bg-emerald-50 border-t border-emerald-100 animate-in fade-in slide-in-from-top-2">
                    <h5 className="text-[10px] font-black text-emerald-700 mb-4 uppercase tracking-widest">Detail Setoran ATM/Bank:</h5>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-emerald-600 uppercase ml-1">Nama ATM / Bank</label>
                        <input
                          type="text"
                          placeholder="Contoh: ATM Mandiri Sudirman"
                          className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                          value={completingDeposit.atmName}
                          onChange={(e) => setCompletingDeposit({ ...completingDeposit, atmName: e.target.value })}
                          autoFocus
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-emerald-600 uppercase ml-1">Jumlah yang Berhasil Masuk</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-bold">Rp</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="w-full pl-8 pr-3 py-3 bg-white border border-emerald-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                            value={formatNumberInput(completingDeposit.amount)}
                            onChange={(e) => setCompletingDeposit({ ...completingDeposit, amount: e.target.value.replace(/\D/g, '') })}
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            const val = parseInt(completingDeposit.amount.replace(/\D/g, ''), 10);
                            if (!isNaN(val) && completingDeposit.atmName) {
                              store.completeBranchDeposit(completingDeposit.branchId, completingDeposit.depositId, val, completingDeposit.atmName);
                              setCompletingDeposit(null);
                            }
                          }}
                          className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-xs font-bold shadow-md shadow-emerald-100"
                        >
                          Konfirmasi Selesai
                        </button>
                        <button
                          onClick={() => setCompletingDeposit(null)}
                          className="bg-white text-gray-500 px-5 py-3 rounded-xl text-xs font-bold border border-gray-200"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inline Edit Form */}
                {editingDeposit?.depositId === deposit.id && (
                  <div className="p-5 bg-blue-50 border-t border-blue-100 animate-in fade-in slide-in-from-top-2">
                    <p className="text-[10px] font-bold text-blue-700 mb-3 uppercase tracking-wider">Update Nominal Masuk Rekening:</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 text-xs font-bold">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="w-full pl-8 pr-3 py-3 bg-white border border-blue-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                          value={formatNumberInput(editingDeposit.amount)}
                          onChange={(e) => setEditingDeposit({ ...editingDeposit, amount: e.target.value.replace(/\D/g, '') })}
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => {
                          const val = parseInt(editingDeposit.amount.replace(/\D/g, ''), 10);
                          if (!isNaN(val)) {
                            store.updateBranchDepositAmount(editingDeposit.branchId, editingDeposit.depositId, val);
                          }
                          setEditingDeposit(null);
                        }}
                        className="bg-blue-600 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-md shadow-blue-100"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setEditingDeposit(null)}
                        className="bg-white text-gray-500 px-5 py-3 rounded-xl text-xs font-bold border border-gray-200"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {activeTab === 'history' && filteredDeposits.length > historyLimit && (
            <button
              onClick={() => setHistoryLimit(prev => prev + 10)}
              className="w-full py-4 bg-white border border-gray-100 rounded-2xl text-xs font-bold text-blue-600 hover:bg-gray-50 transition-all shadow-sm"
            >
              Tampilkan Lebih Banyak ({filteredDeposits.length - historyLimit} lagi)
            </button>
          )}
        </>
      )}
    </div>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Hapus Setoran"
        message={`Apakah Anda yakin ingin menghapus setoran "${deleteConfirm.name}"? Data yang dihapus tidak dapat dikembalikan.`}
        onConfirm={() => {
          store.deleteBranchDeposit(deleteConfirm.branchId, deleteConfirm.depositId);
          setDeleteConfirm({ isOpen: false, branchId: '', depositId: '', name: '' });
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, branchId: '', depositId: '', name: '' })}
      />
    </div>
  );
}
