import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { formatRupiah, formatNumberInput } from '../utils/formatters';
import { VoucherRecap } from '../types';
import { Plus, Trash2, Calendar, Calculator, FileText, TrendingUp, Wallet, ArrowDownCircle, ChevronRight, ArrowLeft, TrendingDown, AlertCircle, Edit2, CheckCircle2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { SuccessToast } from './SuccessToast';

export function VoucherRecaps() {
  const { voucherRecaps, addVoucherRecap, updateVoucherRecap, reportVoucherRecaps, deleteVoucherRecap, isLoaded, branches } = useFinanceStore();
  const { role, branchId: userBranchId } = useAuthStore();
  
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(userBranchId || null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [adminSiang, setAdminSiang] = useState('');
  const [adminMalam, setAdminMalam] = useState('');
  const [voucherSiang, setVoucherSiang] = useState('');
  const [voucherMalam, setVoucherMalam] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmingReport, setIsConfirmingReport] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; date: string }>({
    isOpen: false,
    id: '',
    date: ''
  });

  if (!isLoaded) return null;

  // Current form calculations for live preview
  const currentAdmS = parseInt(adminSiang.replace(/\D/g, ''), 10) || 0;
  const currentAdmM = parseInt(adminMalam.replace(/\D/g, ''), 10) || 0;
  const currentVouS = parseInt(voucherSiang.replace(/\D/g, ''), 10) || 0;
  const currentVouM = parseInt(voucherMalam.replace(/\D/g, ''), 10) || 0;
  const currentExp = parseInt(expenseAmount.replace(/\D/g, ''), 10) || 0;
  
  const currentLabaAdm = (currentAdmS + currentAdmM) - currentExp;
  const currentTotalVou = currentVouS + currentVouM;

  // Filter recaps for the selected branch
  const filteredRecaps = useMemo(() => {
    if (!selectedBranchId) return [];
    const recaps = [...voucherRecaps].filter(r => r.branchId === selectedBranchId);
    
    // Sort by date descending (newest first/at top, oldest at bottom)
    recaps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Boss only sees reported recaps
    if (role === 'bos') {
      return recaps.filter(r => r.status === 'reported');
    }
    
    return recaps;
  }, [voucherRecaps, selectedBranchId, role]);

  // Check if there are any draft recaps for the current branch
  const hasDrafts = useMemo(() => {
    return filteredRecaps.some(r => r.status === 'draft');
  }, [filteredRecaps]);

  // Split into Recent (last 48 hours from submission) and History
  const { recentRecaps, historyRecaps } = useMemo(() => {
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

    return {
      recentRecaps: filteredRecaps.filter(r => {
        // Drafts are always "recent" for the employee
        if (r.status === 'draft') return true;
        return new Date(r.createdAt).getTime() >= fortyEightHoursAgo.getTime();
      }),
      historyRecaps: filteredRecaps.filter(r => {
        if (r.status === 'draft') return false;
        return new Date(r.createdAt).getTime() < fortyEightHoursAgo.getTime();
      })
    };
  }, [filteredRecaps]);

  const [showHistory, setShowHistory] = useState(false);
  const displayRecaps = showHistory ? filteredRecaps : recentRecaps;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleConfirmSave();
  };

  const handleConfirmSave = async () => {
    if (isSubmitting || !selectedBranchId) return;
    setErrorMessage(null);
    
    const admSVal = parseInt(adminSiang.replace(/\D/g, ''), 10) || 0;
    const admMVal = parseInt(adminMalam.replace(/\D/g, ''), 10) || 0;
    const siangVal = parseInt(voucherSiang.replace(/\D/g, ''), 10) || 0;
    const malamVal = parseInt(voucherMalam.replace(/\D/g, ''), 10) || 0;
    const expVal = parseInt(expenseAmount.replace(/\D/g, ''), 10) || 0;

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateVoucherRecap(editingId, {
          date,
          adminSiang: admSVal,
          adminMalam: admMVal,
          voucherSiang: siangVal,
          voucherMalam: malamVal,
          expenseAmount: expVal,
          expenseDescription
        });
      } else {
        // Save as draft for employees, reported for boss (if they could add)
        const status = role === 'karyawan' ? 'draft' : 'reported';
        await addVoucherRecap(date, admSVal, admMVal, siangVal, malamVal, expVal, expenseDescription, '', selectedBranchId, status);
      }
      
      setSuccessMsg(editingId ? "Rekap berhasil diperbarui" : "Rekap berhasil disimpan");
      setShowSuccess(true);
      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      console.error("Failed to save recap", error);
      setErrorMessage("Gagal menyimpan rekap. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAdminSiang('');
    setAdminMalam('');
    setVoucherSiang('');
    setVoucherMalam('');
    setExpenseAmount('');
    setExpenseDescription('');
    setEditingId(null);
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleEdit = (recap: VoucherRecap) => {
    setEditingId(recap.id);
    setDate(recap.date);
    setAdminSiang(recap.adminSiang.toString());
    setAdminMalam(recap.adminMalam.toString());
    setVoucherSiang(recap.voucherSiang.toString());
    setVoucherMalam(recap.voucherMalam.toString());
    setExpenseAmount(recap.expenseAmount.toString());
    setExpenseDescription(recap.expenseDescription);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReportToBos = async () => {
    if (isSubmitting || !selectedBranchId) return;
    setIsSubmitting(true);
    try {
      await reportVoucherRecaps(selectedBranchId);
      setIsConfirmingReport(false);
    } catch (error) {
      console.error("Failed to report recaps", error);
      setErrorMessage("Gagal mengirim laporan ke Bos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations for displayRecaps (Recent by default)
  const totalAdmS = displayRecaps.reduce((sum, r) => sum + r.adminSiang, 0);
  const totalAdmM = displayRecaps.reduce((sum, r) => sum + r.adminMalam, 0);
  const totalVouS = displayRecaps.reduce((sum, r) => sum + r.voucherSiang, 0);
  const totalVouM = displayRecaps.reduce((sum, r) => sum + r.voucherMalam, 0);
  const totalExp = displayRecaps.reduce((sum, r) => sum + (r.expenseAmount || 0), 0);
  
  const labaBersihAdm = (totalAdmS + totalAdmM) - totalExp;
  const totalVoucher = totalVouS + totalVouM;
  const grandTotal = labaBersihAdm + totalVoucher;

  // Trend Analysis (Compare latest batch with previous batch)
  const batches = useMemo(() => {
    if (filteredRecaps.length === 0) return [];
    
    // Sort by createdAt DESC to group by submission time
    const sortedByCreated = [...filteredRecaps].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    const result: VoucherRecap[][] = [];
    let currentBatch: VoucherRecap[] = [];
    let batchRefTime: number | null = null;
    
    // Group recaps submitted within 48 hours of each other as one "batch"
    sortedByCreated.forEach(recap => {
      const time = new Date(recap.createdAt).getTime();
      if (batchRefTime === null || (batchRefTime - time) < (48 * 60 * 60 * 1000)) {
        if (batchRefTime === null) batchRefTime = time;
        currentBatch.push(recap);
      } else {
        result.push(currentBatch);
        currentBatch = [recap];
        batchRefTime = time;
      }
    });
    
    if (currentBatch.length > 0) result.push(currentBatch);
    return result;
  }, [filteredRecaps]);

  const trend = useMemo(() => {
    if (batches.length < 2) return { admin: 'neutral', voucher: 'neutral' };
    
    const batch1 = batches[0]; // Latest batch
    const batch2 = batches[1]; // Previous batch
    
    const b1Adm = batch1.reduce((sum, r) => sum + (r.adminSiang + r.adminMalam - (r.expenseAmount || 0)), 0);
    const b2Adm = batch2.reduce((sum, r) => sum + (r.adminSiang + r.adminMalam - (r.expenseAmount || 0)), 0);
    
    const b1Vou = batch1.reduce((sum, r) => sum + (r.voucherSiang + r.voucherMalam), 0);
    const b2Vou = batch2.reduce((sum, r) => sum + (r.voucherSiang + r.voucherMalam), 0);
    
    return {
      admin: b1Adm > b2Adm ? 'up' : b1Adm < b2Adm ? 'down' : 'neutral',
      voucher: b1Vou > b2Vou ? 'up' : b1Vou < b2Vou ? 'down' : 'neutral'
    };
  }, [batches]);

  // If Bos and no branch selected, show Executive Dashboard
  if (role === 'bos' && !selectedBranchId) {
    // Global Stats Calculation (All Reported Recaps)
    const reportedRecaps = voucherRecaps.filter(r => r.status === 'reported');
    const globalTotalAdm = reportedRecaps.reduce((sum, r) => sum + (r.adminSiang + r.adminMalam), 0);
    const globalTotalExp = reportedRecaps.reduce((sum, r) => sum + (r.expenseAmount || 0), 0);
    const globalTotalVou = reportedRecaps.reduce((sum, r) => sum + (r.voucherSiang + r.voucherMalam), 0);
    const globalNetProfit = (globalTotalAdm - globalTotalExp) + globalTotalVou;

    // Calculate Latest Batch Stats for each branch
    const branchStats = branches.map(branch => {
      const bRecaps = reportedRecaps.filter(r => r.branchId === branch.id);
      // Sort by createdAt to find the latest batch
      const sorted = [...bRecaps].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Group latest batch (within 48h of the very latest)
      const latestTime = sorted.length > 0 ? new Date(sorted[0].createdAt).getTime() : 0;
      const latestBatch = sorted.filter(r => (latestTime - new Date(r.createdAt).getTime()) < (48 * 60 * 60 * 1000));
      
      const batchTotal = latestBatch.reduce((sum, r) => sum + r.total, 0);
      const lastReportDate = sorted.length > 0 ? sorted[0].date : null;
      
      return {
        ...branch,
        batchTotal,
        lastReportDate,
        totalRecaps: bRecaps.length,
        isRecentlyActive: lastReportDate ? (new Date().getTime() - new Date(lastReportDate.replace(/ /g, 'T')).getTime()) < (5 * 24 * 60 * 60 * 1000) : false
      };
    });

    const globalNewRecapTotal = branchStats.reduce((sum, b) => sum + b.batchTotal, 0);

    // Sort branches by batch total (Performance Ranking)
    const topBranches = [...branchStats].sort((a, b) => b.batchTotal - a.batchTotal);

    return (
      <div className="p-2 space-y-6 pb-20">
        {/* Executive Header */}
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Executive Dashboard</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Financial Overview • All Branches</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gradient-to-br from-indigo-600 via-brand-600 to-brand-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-brand-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <Wallet className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Total Rekapan Baru</span>
              </div>
              <h3 className="text-4xl font-black tracking-tighter mb-6">
                {formatRupiah(globalNewRecapTotal)}
              </h3>
              
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/20">
                <div>
                  <p className="text-[9px] text-brand-100 font-bold uppercase tracking-wider mb-1">Total Laba</p>
                  <p className="text-lg font-black">{formatRupiah(globalTotalAdm + globalTotalVou)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-brand-100 font-bold uppercase tracking-wider mb-1">Total Pengeluaran</p>
                  <p className="text-lg font-black text-rose-200">-{formatRupiah(globalTotalExp)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Ranking Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Performa Cabang (Batch Terbaru)</h3>
            <span className="text-[9px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">Top Performer</span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {topBranches.map((branch, index) => {
              const gradients = [
                'from-brand-600 to-indigo-700',
                'from-emerald-500 to-teal-700',
                'from-rose-500 to-pink-700',
                'from-amber-500 to-orange-700',
                'from-violet-600 to-purple-800',
                'from-cyan-500 to-brand-700'
              ];
              const gradient = gradients[index % gradients.length];

              return (
                <button
                  key={branch.id}
                  onClick={() => setSelectedBranchId(branch.id)}
                  className="group relative bg-white rounded-[2rem] p-4 flex items-center justify-between shadow-sm border border-slate-100 hover:shadow-xl hover:border-brand-100 transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                      {index === 0 ? <TrendingUp className="w-7 h-7" /> : <Calculator className="w-7 h-7" />}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-slate-800 tracking-tight">{branch.name}</h4>
                        {branch.isRecentlyActive && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        {branch.lastReportDate ? `Rekap Tanggal: ${new Date(branch.lastReportDate.replace(/ /g, 'T')).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'Belum ada laporan'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{formatRupiah(branch.batchTotal)}</p>
                    <p className="text-[9px] text-brand-600 font-bold uppercase tracking-tighter">Batch Ini</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reporting Status / Quick Insights */}
        <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reporting Insights</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Cabang Aktif</p>
              <p className="text-xl font-black text-emerald-600">{branchStats.filter(b => b.isRecentlyActive).length} / {branches.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Total Laporan</p>
              <p className="text-xl font-black text-brand-600">{reportedRecaps.length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedBranch = branches.find(b => b.id === selectedBranchId);

  return (
    <div className="p-2 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-600 to-indigo-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 opacity-90">
              {role === 'bos' && (
                <button 
                  onClick={() => setSelectedBranchId(null)}
                  className="mr-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <TrendingUp className="w-5 h-5" />
              <h3 className="text-sm font-medium">
                {role === 'bos' ? `Rekap ${selectedBranch?.name}` : 'Halaman Rekap'}
              </h3>
            </div>
            {role === 'karyawan' && selectedBranchId && (
              <button 
                onClick={() => {
                  if (isFormOpen) resetForm();
                  setIsFormOpen(!isFormOpen);
                }}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-all"
              >
                <Plus className={`w-5 h-5 transition-transform ${isFormOpen ? 'rotate-45' : ''}`} />
              </button>
            )}
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {formatRupiah(grandTotal)}
          </p>
          <p className="text-[10px] text-brand-200 uppercase font-bold tracking-wider mt-1">Total Laba</p>
        </div>
      </div>

      {/* Input Form */}
      {isFormOpen && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                <Calculator className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">{editingId ? 'Edit Rekap' : 'Input Rekap Baru'}</h3>
            </div>
            {editingId && (
              <button 
                onClick={resetForm}
                className="text-[10px] font-bold text-rose-500 uppercase hover:text-rose-600"
              >
                Batal Edit
              </button>
            )}
          </div>
          <form id="recap-form" onSubmit={handleSubmit} className="p-5 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-600 font-bold text-center">
                {errorMessage}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tanggal Rekap</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  className="w-full pl-9 pr-3 py-3 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 font-medium"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Admin Siang</label>
                <input
                  type="text"
                  placeholder="Rp 0"
                  inputMode="numeric"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 font-bold"
                  value={formatNumberInput(adminSiang)}
                  onChange={(e) => handleNumericInput(e, setAdminSiang)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Admin Malam</label>
                <input
                  type="text"
                  placeholder="Rp 0"
                  inputMode="numeric"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 font-bold"
                  value={formatNumberInput(adminMalam)}
                  onChange={(e) => handleNumericInput(e, setAdminMalam)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Voucher Siang</label>
                <input
                  type="text"
                  placeholder="Rp 0"
                  inputMode="numeric"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 font-bold"
                  value={formatNumberInput(voucherSiang)}
                  onChange={(e) => handleNumericInput(e, setVoucherSiang)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Voucher Malam</label>
                <input
                  type="text"
                  placeholder="Rp 0"
                  inputMode="numeric"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 font-bold"
                  value={formatNumberInput(voucherMalam)}
                  onChange={(e) => handleNumericInput(e, setVoucherMalam)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-rose-400 uppercase ml-1">Nominal Pengeluaran</label>
                <input
                  type="text"
                  placeholder="Rp 0"
                  inputMode="numeric"
                  className="w-full px-4 py-3 text-sm border border-rose-100 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none bg-rose-50/30 font-bold text-rose-600"
                  value={formatNumberInput(expenseAmount)}
                  onChange={(e) => handleNumericInput(e, setExpenseAmount)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ket. Pengeluaran</label>
                <input
                  type="text"
                  placeholder="Contoh: Bayar Listrik"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 font-medium"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-600 text-white py-4 rounded-2xl text-sm font-black hover:bg-brand-700 active:scale-[0.98] transition-all shadow-lg shadow-brand-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isSubmitting ? 'Menyimpan...' : (editingId ? 'Update Rekap' : 'Simpan ke Daftar')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Excel Style Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
          <div>
            <h3 className="text-[10px] uppercase tracking-widest font-black text-gray-400">
              {showHistory ? 'Seluruh Riwayat Rekap' : 'Rekap Aktif (2 Hari Terakhir)'}
            </h3>
            {!showHistory && recentRecaps.length === 0 && (
              <p className="text-[8px] text-rose-400 font-bold mt-0.5 italic">*Data otomatis diarsipkan setelah 2 hari</p>
            )}
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${
              showHistory 
                ? 'bg-slate-800 text-white' 
                : 'bg-brand-50 text-brand-600 border border-brand-100'
            }`}
          >
            {showHistory ? 'Lihat Aktif' : 'Lihat Semua'}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[8px] uppercase tracking-wider font-black text-gray-400 border-b border-gray-100">
                <th className="px-2 py-3 font-bold border-r border-gray-100">TGL</th>
                <th className="px-2 py-3 font-bold border-r border-gray-100 text-center">ADM S</th>
                <th className="px-2 py-3 font-bold border-r border-gray-100 text-center">ADM M</th>
                <th className="px-2 py-3 font-bold border-r border-gray-100 text-center">VOU S</th>
                <th className="px-2 py-3 font-bold border-r border-gray-100 text-center">VOU M</th>
                <th className="px-2 py-3 text-center">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayRecaps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-xs text-gray-400 italic">
                    {showHistory ? 'Belum ada data rekap.' : 'Tidak ada rekap aktif 2 hari terakhir.'}
                  </td>
                </tr>
              ) : (
                displayRecaps.map((recap) => (
                  <tr key={recap.id} className={`hover:bg-brand-50/30 transition-colors group ${recap.status === 'draft' ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-2 py-3 border-r border-gray-50">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <p className="text-[10px] font-black text-gray-800 leading-none">
                            {new Date(recap.date.replace(/ /g, 'T')).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                          </p>
                          {recap.status === 'draft' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Draft"></span>
                          )}
                        </div>
                        <p className="text-[7px] text-brand-500 font-bold mt-1 truncate max-w-[45px]">
                          {recap.createdByName || 'Admin'}
                        </p>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-[9px] font-bold text-slate-600 border-r border-gray-50 text-center">
                      {recap.adminSiang.toLocaleString('id-ID')}
                    </td>
                    <td className="px-2 py-3 text-[9px] font-bold text-slate-600 border-r border-gray-50 text-center">
                      {recap.adminMalam.toLocaleString('id-ID')}
                    </td>
                    <td className="px-2 py-3 text-[9px] font-bold text-emerald-600 border-r border-gray-50 text-center">
                      {recap.voucherSiang.toLocaleString('id-ID')}
                    </td>
                    <td className="px-2 py-3 text-[9px] font-bold text-emerald-600 border-r border-gray-50 text-center">
                      {recap.voucherMalam.toLocaleString('id-ID')}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {recap.status === 'draft' && role === 'karyawan' && (
                          <>
                            <button 
                              onClick={() => handleEdit(recap)}
                              className="p-1 text-brand-400 hover:text-brand-600 transition-all"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => setDeleteConfirm({ isOpen: true, id: recap.id, date: recap.date })}
                              className="p-1 text-rose-300 hover:text-rose-500 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        {role === 'bos' && (
                          <button 
                            onClick={() => setDeleteConfirm({ isOpen: true, id: recap.id, date: recap.date })}
                            className="p-1 text-rose-300 hover:text-rose-500 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {displayRecaps.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white text-[8px] font-black uppercase">
                  <td className="px-2 py-2.5 border-r border-white/10">TOTAL</td>
                  <td className="px-2 py-2.5 border-r border-white/10 text-center">{totalAdmS.toLocaleString('id-ID')}</td>
                  <td className="px-2 py-2.5 border-r border-white/10 text-center">{totalAdmM.toLocaleString('id-ID')}</td>
                  <td className="px-2 py-2.5 border-r border-white/10 text-center bg-emerald-900/50">{totalVouS.toLocaleString('id-ID')}</td>
                  <td className="px-2 py-2.5 border-r border-white/10 text-center bg-emerald-900/50">{totalVouM.toLocaleString('id-ID')}</td>
                  <td className="px-2 py-2.5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Detail Pengeluaran Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-rose-50/30">
          <h3 className="text-[10px] uppercase tracking-widest font-black text-rose-400">
            {showHistory ? 'Seluruh Pengeluaran' : 'Pengeluaran Aktif (2 Hari Terakhir)'}
          </h3>
        </div>
        <div className="divide-y divide-gray-50">
          {displayRecaps.filter(r => r.expenseAmount > 0).length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-gray-300 italic">Belum ada pengeluaran</p>
            </div>
          ) : (
            displayRecaps.filter(r => r.expenseAmount > 0).map(recap => (
              <div key={`exp-${recap.id}`} className="p-4 flex items-center justify-between hover:bg-rose-50/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                    <ArrowDownCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-700">{recap.expenseDescription || 'Pengeluaran'}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[9px] text-gray-400">{new Date(recap.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                      <span className="text-[8px] text-gray-300">•</span>
                      <p className="text-[9px] text-gray-400 italic">Oleh: {recap.createdByName}</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs font-bold text-rose-600">-{formatRupiah(recap.expenseAmount)}</p>
              </div>
            ))
          )}
        </div>
        <div className="bg-rose-500 p-3 text-white flex justify-between items-center">
          <span className="text-[10px] font-black uppercase">Total Pengeluaran</span>
          <span className="text-xs font-bold">{formatRupiah(totalExp)}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 opacity-60">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Laba Bersih (ADM)</span>
            </div>
            {trend.admin === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
            {trend.admin === 'down' && <TrendingDown className="w-4 h-4 text-rose-400" />}
          </div>
          <p className="text-lg font-black">{formatRupiah(labaBersihAdm)}</p>
          <p className="text-[8px] text-gray-400 mt-1 italic">*Sudah dikurangi pengeluaran</p>
        </div>
        <div className="bg-emerald-900 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 opacity-60">
              <Wallet className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Total Voucher</span>
            </div>
            {trend.voucher === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
            {trend.voucher === 'down' && <TrendingDown className="w-4 h-4 text-rose-400" />}
          </div>
          <p className="text-lg font-black">{formatRupiah(totalVoucher)}</p>
        </div>
      </div>

      {/* Fixed Bottom Action Button (As per Screenshot) */}
      {role === 'karyawan' && hasDrafts && (
        <div className="mt-8 mb-4">
          <div className="bg-brand-600 rounded-[2rem] p-1 shadow-2xl shadow-brand-200">
            <button
              onClick={() => setIsConfirmingReport(true)}
              disabled={isSubmitting}
              className="w-full bg-white text-brand-600 py-5 rounded-[1.8rem] text-sm font-black hover:bg-brand-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <Plus className="w-5 h-5" />
              {isSubmitting ? 'Sedang Mengirim...' : 'Save & Laporkan ke Bos'}
            </button>
          </div>
          <p className="mt-4 text-[10px] text-slate-400 text-center font-bold px-6 leading-relaxed">
            *Laporan yang sudah dikirim ke Bos tidak dapat diubah kembali. Pastikan data di daftar sudah sesuai.
          </p>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmingReport}
        title="Laporkan ke Bos"
        message={
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">
                Seluruh data rekap di daftar akan dikirim ke Bos dan **tidak dapat diubah kembali**.
              </p>
            </div>
            <p className="text-xs text-slate-500">Pastikan Anda sudah mengecek seluruh data pendapatan selama periode ini.</p>
          </div>
        }
        confirmText="Ya, Laporkan"
        confirmVariant="primary"
        onConfirm={handleReportToBos}
        onCancel={() => setIsConfirmingReport(false)}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Hapus Rekap"
        message={`Apakah Anda yakin ingin menghapus rekap tanggal ${new Date(deleteConfirm.date || new Date().toISOString()).toLocaleDateString('id-ID')}?`}
        confirmText="Hapus"
        confirmVariant="danger"
        onConfirm={async () => {
          await deleteVoucherRecap(deleteConfirm.id);
          setDeleteConfirm({ isOpen: false, id: '', date: '' });
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', date: '' })}
      />

      <SuccessToast 
        show={showSuccess} 
        message={successMsg} 
        onClose={() => setShowSuccess(false)} 
      />
    </div>
  );
}

