import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { formatRupiah, formatNumberInput } from '../utils/formatters';
import { VoucherRecap } from '../types';
import { Plus, Trash2, Calendar, Calculator, FileText, TrendingUp, Wallet, ArrowDownCircle, ChevronRight, ArrowLeft, TrendingDown, AlertCircle, Edit2, CheckCircle2, Send } from 'lucide-react';
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
      <div className="p-5 space-y-7 pb-24 bg-asphalt-900 min-h-screen">
        {/* Executive Header */}
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Board Overview</h2>
            <p className="text-[10px] text-asphalt-text-400 font-black uppercase tracking-[0.2em] leading-none">Global Stats • All Branches</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 shadow-lg shadow-brand-500/10">
            <TrendingUp className="w-7 h-7 stroke-[2.5px]" />
          </div>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-1 gap-5">
          <div className="bg-asphalt-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-asphalt-700">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-brand-500/20 transition-all duration-1000"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 opacity-60">
                <Wallet className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Rekapan Baru</span>
              </div>
              <h3 className="text-5xl font-black tracking-tighter mb-8 text-white">
                {formatRupiah(globalNewRecapTotal)}
              </h3>
              
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-asphalt-700">
                <div className="space-y-1">
                  <p className="text-[9px] text-asphalt-text-400 font-black uppercase tracking-widest leading-none">Total Laba</p>
                  <p className="text-xl font-black text-white leading-none">{formatRupiah(globalTotalAdm + globalTotalVou)}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[9px] text-asphalt-text-400 font-black uppercase tracking-widest leading-none">Total Pengeluaran</p>
                  <p className="text-xl font-black text-rose-500 leading-none">-{formatRupiah(globalTotalExp)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Ranking Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-[0.2em]">Top Performance (Latest Batch)</h3>
            <span className="text-[9px] font-black text-brand-500 bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-xl uppercase tracking-widest">Active Pulse</span>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {topBranches.map((branch, index) => {
              return (
                <button
                  key={branch.id}
                  onClick={() => setSelectedBranchId(branch.id)}
                  className="group relative bg-asphalt-800 rounded-[2.5rem] p-5 flex items-center justify-between shadow-2xl border border-asphalt-700/50 hover:bg-asphalt-900/40 hover:border-brand-500/40 transition-all duration-300 active:scale-[0.98] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute -right-4 -bottom-4 text-asphalt-900 font-black text-6xl group-hover:text-asphalt-700/20 transition-colors pointer-events-none italic opacity-20">
                    {index + 1 < 10 ? `0${index + 1}` : index + 1}
                  </div>
                  
                  <div className="flex items-center gap-5 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl bg-asphalt-900 border border-asphalt-700 flex items-center justify-center text-brand-500 shadow-inner group-hover:scale-110 group-hover:text-white group-hover:bg-brand-500 transition-all duration-500`}>
                      {index === 0 ? <TrendingUp className="w-7 h-7 stroke-[2.5px]" /> : <Calculator className="w-7 h-7" />}
                    </div>
                    <div className="text-left space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-white tracking-tight uppercase leading-none">{branch.name}</h4>
                        {branch.isRecentlyActive && (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border-2 border-asphalt-800"></span>
                        )}
                      </div>
                      <p className="text-[9px] text-asphalt-text-400 font-black uppercase tracking-widest leading-none">
                        {branch.lastReportDate ? `Tgl: ${new Date(branch.lastReportDate.replace(/ /g, 'T')).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}` : 'No Reports'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right relative z-10 space-y-1">
                    <p className="text-md font-black text-white leading-none">{formatRupiah(branch.batchTotal)}</p>
                    <p className="text-[9px] text-brand-500 font-black uppercase tracking-widest leading-none">Current Batch</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reporting Status / Quick Insights */}
        <div className="bg-asphalt-800 rounded-[2.5rem] p-8 border border-asphalt-700 shadow-2xl relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-emerald-500 to-rose-500"></div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-asphalt-900 flex items-center justify-center text-asphalt-text-400 border border-asphalt-700 shadow-inner">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-[0.2em] leading-none">Quick Insights</h3>
              <p className="text-sm font-black text-white mt-1 uppercase tracking-tight leading-none">Reporting Feed</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-asphalt-900/50 p-5 rounded-2xl border border-asphalt-700 shadow-inner group">
              <p className="text-[8px] font-black text-asphalt-text-400 uppercase tracking-widest mb-2 leading-none">Active Branches</p>
              <p className="text-2xl font-black text-emerald-500 tracking-tighter leading-none">{branchStats.filter(b => b.isRecentlyActive).length} <span className="text-asphalt-text-400 text-xs">/ {branches.length}</span></p>
            </div>
            <div className="bg-asphalt-900/50 p-5 rounded-2xl border border-asphalt-700 shadow-inner group">
              <p className="text-[8px] font-black text-asphalt-text-400 uppercase tracking-widest mb-2 leading-none">Total Reports</p>
              <p className="text-2xl font-black text-brand-500 tracking-tighter leading-none">{reportedRecaps.length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedBranch = branches.find(b => b.id === selectedBranchId);

  return (
    <div className="p-5 space-y-7 bg-asphalt-900 min-h-screen">
      {/* Header */}
      <div className="bg-asphalt-800 rounded-[2.5rem] p-7 text-white shadow-2xl relative overflow-hidden border border-asphalt-700 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-24 -mt-24 blur-[100px] group-hover:bg-brand-500/20 transition-all duration-1000"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              {role === 'bos' && (
                <button 
                  onClick={() => setSelectedBranchId(null)}
                  className="w-11 h-11 flex items-center justify-center bg-asphalt-900 border border-asphalt-700 rounded-2xl hover:bg-asphalt-700 text-brand-500 transition-all active:scale-95 shadow-lg shadow-black/20"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5px]" />
                </button>
              )}
              <div className="w-11 h-11 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 shadow-lg shadow-brand-500/10">
                <TrendingUp className="w-6 h-6 stroke-[2.5px]" />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-asphalt-text-400 leading-none">Financial</h3>
                <p className="text-sm font-black text-white mt-1 uppercase tracking-tight leading-none">
                  {role === 'bos' ? `${selectedBranch?.name}` : 'Reporting'}
                </p>
              </div>
            </div>
            {role === 'karyawan' && selectedBranchId && (
              <button 
                onClick={() => {
                  if (isFormOpen) resetForm();
                  setIsFormOpen(!isFormOpen);
                }}
                className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all active:scale-95 shadow-xl ${
                  isFormOpen 
                    ? 'bg-rose-500 border-rose-400 text-white shadow-rose-500/20' 
                    : 'bg-brand-500 border-brand-400 text-white shadow-brand-500/20'
                }`}
              >
                <Plus className={`w-6 h-6 stroke-[3px] transition-transform duration-300 ${isFormOpen ? 'rotate-45' : ''}`} />
              </button>
            )}
          </div>
          <div>
            <p className="text-4xl font-black tracking-tighter text-white">
              {formatRupiah(grandTotal)}
            </p>
            <p className="text-[10px] text-brand-400 font-black uppercase tracking-[0.2em] mt-3 leading-none flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
              Total Laba {role === 'bos' ? 'Diterima' : 'Dihasilkan'}
            </p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      {isFormOpen && (
        <div className="bg-asphalt-800 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-asphalt-700 overflow-hidden animate-in fade-in slide-in-from-top-6 duration-500">
          <div className="p-7 border-b border-asphalt-700 flex items-center justify-between bg-asphalt-900/40">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-asphalt-900 border border-asphalt-700 flex items-center justify-center text-brand-500 shadow-inner">
                <Calculator className="w-6 h-6 stroke-[1.5px]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight leading-none">{editingId ? 'Koreksi Data' : 'Tambah Baru'}</h3>
                <p className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest mt-1 leading-none">Voucher Reporting</p>
              </div>
            </div>
            {editingId && (
              <button 
                onClick={resetForm}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all border border-rose-500/20"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
          <form id="recap-form" onSubmit={handleSubmit} className="p-8 space-y-7">
            {errorMessage && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[11px] text-rose-500 font-black text-center uppercase tracking-widest leading-relaxed">
                {errorMessage}
              </div>
            )}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">Periode Tanggal</label>
              <div className="relative group">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-500 transition-transform group-focus-within:scale-110" />
                <input
                  type="date"
                  className="w-full pl-14 pr-5 py-4.5 text-sm bg-asphalt-900 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-white font-black shadow-inner appearance-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">Admin Siang</label>
                <input
                  type="text"
                  placeholder="Rp 0"
                  inputMode="numeric"
                  className="w-full px-5 py-4.5 text-sm bg-asphalt-900 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-white font-black shadow-inner placeholder:text-asphalt-text-400/30"
                  value={formatNumberInput(adminSiang)}
                  onChange={(e) => handleNumericInput(e, setAdminSiang)}
                  required
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">Admin Malam</label>
                <input
                  type="text"
                  placeholder="Rp 0"
                  inputMode="numeric"
                  className="w-full px-5 py-4.5 text-sm bg-asphalt-900 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-white font-black shadow-inner placeholder:text-asphalt-text-400/30"
                  value={formatNumberInput(adminMalam)}
                  onChange={(e) => handleNumericInput(e, setAdminMalam)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">Voucher Siang</label>
                <input
                  type="text"
                  placeholder="Rp 0"
                  inputMode="numeric"
                  className="w-full px-5 py-4.5 text-sm bg-asphalt-900 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-500 font-black shadow-inner placeholder:text-emerald-500/20"
                  value={formatNumberInput(voucherSiang)}
                  onChange={(e) => handleNumericInput(e, setVoucherSiang)}
                  required
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">Voucher Malam</label>
                <input
                  type="text"
                  placeholder="Rp 0"
                  inputMode="numeric"
                  className="w-full px-5 py-4.5 text-sm bg-asphalt-900 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-500 font-black shadow-inner placeholder:text-emerald-500/20"
                  value={formatNumberInput(voucherMalam)}
                  onChange={(e) => handleNumericInput(e, setVoucherMalam)}
                  required
                />
              </div>
            </div>

            <div className="bg-rose-500/5 rounded-3xl p-6 border border-rose-500/10 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Nominal Out</label>
                  <input
                    type="text"
                    placeholder="Rp 0"
                    inputMode="numeric"
                    className="w-full px-5 py-4.5 text-sm bg-asphalt-900 border border-rose-500/30 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none text-rose-500 font-black shadow-inner placeholder:text-rose-500/30"
                    value={formatNumberInput(expenseAmount)}
                    onChange={(e) => handleNumericInput(e, setExpenseAmount)}
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">Label Out</label>
                  <input
                    type="text"
                    placeholder="Ex: Token"
                    className="w-full px-5 py-4.5 text-sm bg-asphalt-900 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-white font-black shadow-inner placeholder:text-asphalt-text-400/30"
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-brand-500 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-brand-600 active:scale-[0.98] transition-all shadow-[0_20px_40px_-12px_rgba(45,115,255,0.4)] disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {editingId ? <CheckCircle2 className="w-6 h-6 stroke-[3px]" /> : <Plus className="w-6 h-6 stroke-[3px]" />}
                {isSubmitting ? 'MEMPROSES DATA...' : (editingId ? 'KONFIRMASI PERUBAHAN' : 'MASUKKAN KE DAFTAR')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Spreadsheet Feed */}
      <div className="bg-asphalt-800 rounded-[2.5rem] shadow-2xl border border-asphalt-700/50 overflow-hidden">
        <div className="p-7 border-b border-asphalt-700/50 flex items-center justify-between bg-asphalt-900/20">
          <div>
            <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-asphalt-text-400 leading-none">
              {showHistory ? 'All-Time Logs' : 'Live Reporting Feed'}
            </h3>
            {!showHistory && recentRecaps.length === 0 && (
              <p className="text-[9px] text-rose-500 font-black mt-2 uppercase tracking-widest">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse mr-1.5"></span>
                Archived Log System Active
              </p>
            )}
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`h-11 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border shadow-lg ${
              showHistory 
                ? 'bg-asphalt-900 text-brand-500 border-brand-500/30' 
                : 'bg-brand-500 text-white border-brand-400 shadow-brand-500/20'
            }`}
          >
            {showHistory ? 'Active Only' : 'Show All'}
          </button>
        </div>
        
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-asphalt-900/50 text-[9px] uppercase font-black text-asphalt-text-400 tracking-[0.15em] border-b border-asphalt-700/50">
                <th className="pl-7 pr-3 py-4 font-black border-r border-asphalt-700/50">Date</th>
                <th className="px-3 py-4 font-black border-r border-asphalt-700/50 text-center">Adm S</th>
                <th className="px-3 py-4 font-black border-r border-asphalt-700/50 text-center">Adm M</th>
                <th className="px-3 py-4 font-black border-r border-asphalt-700/50 text-center">Vou S</th>
                <th className="px-3 py-4 font-black border-r border-asphalt-700/50 text-center">Vou M</th>
                <th className="px-4 py-4 text-center">Act</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-asphalt-700/30">
              {displayRecaps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest">
                    <FileText className="w-12 h-12 text-asphalt-900 mx-auto mb-4" />
                    No Record Detected In This Range
                  </td>
                </tr>
              ) : (
                displayRecaps.map((recap) => (
                  <tr key={recap.id} className={`hover:bg-asphalt-900/10 transition-colors group ${recap.status === 'draft' ? 'bg-brand-500/[0.03]' : ''}`}>
                    <td className="pl-7 pr-3 py-4.5 border-r border-asphalt-700/30">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-black text-white leading-none uppercase tracking-tight">
                            {new Date(recap.date.replace(/ /g, 'T')).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                          </p>
                          {recap.status === 'draft' && (
                            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse border border-asphalt-800 shadow-lg shadow-brand-500/40"></span>
                          )}
                        </div>
                        <p className="text-[8px] text-brand-500 font-black uppercase tracking-widest truncate max-w-[50px] leading-none mt-1 opacity-70">
                          {recap.createdByName || 'USER'}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-4.5 text-[10px] font-black text-white/80 border-r border-asphalt-700/30 text-center shadow-inner">
                      {recap.adminSiang.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-4.5 text-[10px] font-black text-white/80 border-r border-asphalt-700/30 text-center">
                      {recap.adminMalam.toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-4.5 text-[10px] font-black text-emerald-500 border-r border-asphalt-700/30 text-center bg-emerald-500/[0.02]">
                      {recap.voucherSiang.toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-4.5 text-[10px] font-black text-emerald-500 border-r border-asphalt-700/30 text-center bg-emerald-500/[0.02]">
                      {recap.voucherMalam.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-4.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {recap.status === 'draft' && role === 'karyawan' && (
                          <>
                            <button 
                              onClick={() => handleEdit(recap)}
                              className="w-8 h-8 flex items-center justify-center text-asphalt-text-400 hover:text-brand-500 hover:bg-brand-500/10 rounded-lg transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => setDeleteConfirm({ isOpen: true, id: recap.id, date: recap.date })}
                              className="w-8 h-8 flex items-center justify-center text-asphalt-text-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {role === 'bos' && (
                          <button 
                            onClick={() => setDeleteConfirm({ isOpen: true, id: recap.id, date: recap.date })}
                            className="w-8 h-8 flex items-center justify-center text-asphalt-text-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
                <tr className="bg-asphalt-900/80 text-white text-[10px] font-black uppercase tracking-widest">
                  <td className="pl-7 pr-3 py-5 border-r border-white/5">TOTAL</td>
                  <td className="px-3 py-5 border-r border-white/5 text-center group-hover:text-brand-500">{(totalAdmS).toLocaleString('id-ID')}</td>
                  <td className="px-3 py-5 border-r border-white/5 text-center">{(totalAdmM).toLocaleString('id-ID')}</td>
                  <td className="px-3 py-5 border-r border-white/5 text-center text-emerald-500 bg-emerald-500/10">{(totalVouS).toLocaleString('id-ID')}</td>
                  <td className="px-3 py-5 border-r border-white/5 text-center text-emerald-500 bg-emerald-500/10">{(totalVouM).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-5 text-center bg-asphalt-900 shadow-xl">
                    <ChevronRight className="w-4 h-4 text-brand-500 mx-auto" />
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Detail Pengeluaran Section */}
      <div className="bg-asphalt-800 rounded-[2.5rem] shadow-2xl border border-asphalt-700/50 overflow-hidden">
        <div className="p-7 border-b border-asphalt-700/50 bg-rose-500/[0.03]">
          <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-rose-500 leading-none">
            {showHistory ? 'Expense Archive' : 'Active Burn Logs'}
          </h3>
        </div>
        <div className="divide-y divide-asphalt-700/30">
          {displayRecaps.filter(r => r.expenseAmount > 0).length === 0 ? (
            <div className="p-12 text-center">
              <TrendingDown className="w-10 h-10 text-asphalt-900 mx-auto mb-4" />
              <p className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest">No Operational Expenses Logged</p>
            </div>
          ) : (
            displayRecaps.filter(r => r.expenseAmount > 0).map(recap => (
              <div key={`exp-${recap.id}`} className="p-6 flex items-center justify-between hover:bg-asphalt-900/20 transition-all group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-inner group-hover:scale-110 transition-transform">
                    <ArrowDownCircle className="w-6 h-6 stroke-[1.5px]" />
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-white uppercase tracking-tight">{recap.expenseDescription || 'GENERAL EXPENSE'}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-[9px] font-black text-asphalt-text-400 uppercase tracking-widest">
                        {new Date(recap.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </p>
                      <span className="w-1 h-1 rounded-full bg-asphalt-700"></span>
                      <p className="text-[9px] font-black text-brand-500 uppercase tracking-widest">{recap.createdByName.split(' ')[0]}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-rose-500 tracking-tight">-{formatRupiah(recap.expenseAmount)}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="bg-rose-500 p-6 text-white flex justify-between items-center shadow-inner relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] relative z-10">Burn Rate Total</span>
          <span className="text-lg font-black tracking-tighter relative z-10">{formatRupiah(totalExp)}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-asphalt-800 rounded-[2.5rem] p-6 text-white shadow-2xl border border-asphalt-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-brand-500/10 transition-all duration-700"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5 opacity-40">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest group-hover:opacity-100 transition-opacity">Net Laba</span>
            </div>
            {trend.admin === 'up' && <TrendingUp className="w-5 h-5 text-emerald-500 stroke-[2.5px]" />}
            {trend.admin === 'down' && <TrendingDown className="w-5 h-5 text-rose-500 stroke-[2.5px]" />}
          </div>
          <p className="text-xl font-black text-white tracking-tighter">{formatRupiah(labaBersihAdm)}</p>
          <p className="text-[8px] text-asphalt-text-400 font-black uppercase tracking-widest mt-2">After Deductions</p>
        </div>
        <div className="bg-asphalt-800 rounded-[2.5rem] p-6 text-white shadow-2xl border border-asphalt-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-emerald-500/10 transition-all duration-700"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5 opacity-40">
              <Wallet className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest group-hover:opacity-100 transition-opacity">Voucher Pool</span>
            </div>
            {trend.voucher === 'up' && <TrendingUp className="w-5 h-5 text-emerald-500 stroke-[2.5px]" />}
            {trend.voucher === 'down' && <TrendingDown className="w-5 h-5 text-rose-500 stroke-[2.5px]" />}
          </div>
          <p className="text-xl font-black text-emerald-500 tracking-tighter">{formatRupiah(totalVoucher)}</p>
          <p className="text-[8px] text-asphalt-text-400 font-black uppercase tracking-widest mt-2">Active Circulation</p>
        </div>
      </div>

      {/* Fixed Bottom Action Button */}
      {role === 'karyawan' && hasDrafts ? (
        <div className="mt-12 pb-20">
          <div className="bg-asphalt-800 rounded-[2.8rem] p-1.5 shadow-2xl shadow-brand-500/20 border border-brand-500/20 group">
            <button
              onClick={() => setIsConfirmingReport(true)}
              disabled={isSubmitting}
              className="w-full bg-brand-500 text-white py-6 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-brand-600 active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-xl group-hover:shadow-brand-500/40"
            >
              <Send className="w-6 h-6 stroke-[2.5px]" />
              {isSubmitting ? 'UPLOADING...' : 'SAVE & PUBLISH TO BOS'}
            </button>
          </div>
          <div className="mt-6 flex items-start gap-3 px-8">
            <AlertCircle className="w-4 h-4 text-asphalt-text-400 shrink-0 mt-0.5" />
            <p className="text-[9px] text-asphalt-text-400 font-bold uppercase tracking-[0.1em] leading-relaxed">
              Pesan Penting: Laporan yang dipublikasikan tidak dapat ditarik kembali. Periksa akurasi data sebelum mengirim.
            </p>
          </div>
        </div>
      ) : (
        <div className="pb-24"></div>
      )}

      <ConfirmModal
        isOpen={isConfirmingReport}
        title="Publish Laporan"
        message={
          <div className="space-y-6">
            <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-[2rem] flex items-start gap-4 shadow-inner">
              <AlertCircle className="w-7 h-7 text-rose-500 shrink-0" />
              <p className="text-[12px] font-black text-rose-500 leading-relaxed uppercase tracking-tight">
                Seluruh data draft akan dipublikasikan dan <span className="underline">dikunci permanen</span>. Lanjutkan?
              </p>
            </div>
          </div>
        }
        confirmText="YA, PUBLISH"
        confirmVariant="primary"
        onConfirm={handleReportToBos}
        onCancel={() => setIsConfirmingReport(false)}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Drop Record"
        message={`Hapus data rekap tanggal ${new Date(deleteConfirm.date || new Date().toISOString()).toLocaleDateString('id-ID')} secara permanen dari basis data?`}
        confirmText="HAPUS"
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

