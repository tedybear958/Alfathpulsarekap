import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  
  // Reported recaps for global stats
  const reportedRecaps = useMemo(() => {
    return voucherRecaps.filter(r => r.status === 'reported');
  }, [voucherRecaps]);

  // Months labels moved outside or kept inside if needed for the hook
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Calculate stats per month for executive dashboard
  const monthlyData = useMemo(() => {
    const data: Record<string, { adm: number; exp: number; vou: number; label: string }> = {};
    reportedRecaps.forEach(r => {
      const d = new Date(r.date.replace(/ /g, 'T'));
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!data[key]) {
        data[key] = { adm: 0, exp: 0, vou: 0, label: `${months[d.getMonth()]} ${d.getFullYear()}` };
      }
      data[key].adm += (r.adminSiang + r.adminMalam);
      data[key].exp += r.expenseAmount;
      data[key].vou += (r.voucherSiang + r.voucherMalam);
    });
    return Object.entries(data).sort((a, b) => b[0].localeCompare(a[0]));
  }, [reportedRecaps, months]);

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(() => {
    if (userBranchId) return userBranchId;
    return localStorage.getItem('last_selected_branch') || null;
  });

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  // Cycle Helper
  const getCycle = (dateStr: string) => {
    const d = new Date(dateStr.replace(/ /g, 'T')).getDate();
    if (d <= 5) return { id: 1, label: 'Siklus 1 (Tgl 1-5)' };
    if (d <= 10) return { id: 2, label: 'Siklus 2 (Tgl 6-10)' };
    if (d <= 15) return { id: 3, label: 'Siklus 3 (Tgl 11-15)' };
    if (d <= 20) return { id: 4, label: 'Siklus 4 (Tgl 16-20)' };
    if (d <= 25) return { id: 5, label: 'Siklus 5 (Tgl 21-25)' };
    return { id: 6, label: 'Siklus 6 (Tgl 26-Akhir)' };
  };

  // Sync selected branch to localStorage for boss/mandor
  React.useEffect(() => {
    if (selectedBranchId && (role === 'bos' || role === 'mandor')) {
      localStorage.setItem('last_selected_branch', selectedBranchId);
    }
  }, [selectedBranchId, role]);
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

  // If not loaded, we still define hooks above
  // but we return early only AFTER all hooks are defined if possible.
  // Actually, hooks must be called every render.
  
  // Filter and Group Recaps
  const { groupedRecaps, currentMonthStats } = useMemo(() => {
    if (!selectedBranchId) return { groupedRecaps: [], currentMonthStats: null };
    
    const branchRecaps = voucherRecaps.filter(r => r.branchId === selectedBranchId);
    
    // Filter by selected month/year
    const monthlyRecaps = branchRecaps.filter(r => {
      const d = new Date(r.date.replace(/ /g, 'T'));
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    // Group by cycle
    const cycles: Record<number, { 
      label: string; 
      items: VoucherRecap[]; 
      totalAdm: number; 
      totalVou: number; 
      totalExp: number;
      isReported: boolean;
      allDraft: boolean;
    }> = {};

    monthlyRecaps.forEach(recap => {
      const cycle = getCycle(recap.date);
      if (!cycles[cycle.id]) {
        cycles[cycle.id] = { 
          label: cycle.label, 
          items: [], 
          totalAdm: 0, 
          totalVou: 0, 
          totalExp: 0,
          isReported: true,
          allDraft: true
        };
      }
      cycles[cycle.id].items.push(recap);
      cycles[cycle.id].totalAdm += (recap.adminSiang + recap.adminMalam);
      cycles[cycle.id].totalVou += (recap.voucherSiang + recap.voucherMalam);
      cycles[cycle.id].totalExp += recap.expenseAmount;
      
      if (recap.status === 'draft') cycles[cycle.id].isReported = false;
      if (recap.status !== 'draft') cycles[cycle.id].allDraft = false;
    });

    // Convert to array and sort items within cycles by date
    const sortedCycles = Object.entries(cycles)
      .map(([id, data]) => ({
        id: parseInt(id),
        ...data,
        items: data.items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      }))
      .sort((a, b) => a.id - b.id);

    // Stats for the monthly view
    const stats = {
      totalAdm: monthlyRecaps.reduce((s, r) => s + r.adminSiang + r.adminMalam, 0),
      totalVou: monthlyRecaps.reduce((s, r) => s + r.voucherSiang + r.voucherMalam, 0),
      totalExp: monthlyRecaps.reduce((s, r) => s + r.expenseAmount, 0),
    };

    return { 
      groupedRecaps: sortedCycles, 
      currentMonthStats: stats 
    };
  }, [voucherRecaps, selectedBranchId, selectedMonth, selectedYear]);

  const hasDrafts = useMemo(() => {
    return groupedRecaps.some(c => !c.isReported && c.items.some(i => i.status === 'draft'));
  }, [groupedRecaps]);

  if (!isLoaded) return null;

  // Current form calculations for live preview

  // Sync selected branch to localStorage for boss/mandor

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

  const totalAdmS = groupedRecaps.reduce((sum, c) => sum + c.items.reduce((s, r) => s + r.adminSiang, 0), 0);
  const totalAdmM = groupedRecaps.reduce((sum, c) => sum + c.items.reduce((s, r) => s + r.adminMalam, 0), 0);
  const totalVouS = groupedRecaps.reduce((sum, c) => sum + c.items.reduce((s, r) => s + r.voucherSiang, 0), 0);
  const totalVouM = groupedRecaps.reduce((sum, c) => sum + c.items.reduce((s, r) => s + r.voucherMalam, 0), 0);
  const totalExp = groupedRecaps.reduce((sum, c) => sum + c.totalExp, 0);
  
  const labaBersihAdm = (totalAdmS + totalAdmM) - totalExp;
  const totalVoucher = totalVouS + totalVouM;
  const grandTotal = labaBersihAdm + totalVoucher;

  const monthlyReportedRecaps = useMemo(() => {
    return reportedRecaps.filter(r => {
      const d = new Date(r.date.replace(/ /g, 'T'));
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [reportedRecaps, selectedMonth, selectedYear]);

  const trend = { admin: 'neutral', voucher: 'neutral' };

  const globalTotalAdm = monthlyReportedRecaps.reduce((sum, r) => sum + (r.adminSiang + r.adminMalam), 0);
  const globalTotalExp = monthlyReportedRecaps.reduce((sum, r) => sum + (r.expenseAmount || 0), 0);
  const globalTotalVou = monthlyReportedRecaps.reduce((sum, r) => sum + (r.voucherSiang + r.voucherMalam), 0);
  const globalNetProfit = (globalTotalAdm - globalTotalExp) + globalTotalVou;

  // If Bos/Mandor and no branch selected, show Executive Dashboard
  if ((role === 'bos' || role === 'mandor') && !selectedBranchId) {

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
      <div className="p-4 space-y-7 pb-24 bg-asphalt-900 min-h-screen">
        {/* Executive Header */}
        <div className="flex items-center justify-between px-1">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Pantauan Utama</h2>
            <p className="text-[10px] text-asphalt-text-400 font-black uppercase tracking-[0.2em] leading-none">Statistik Global • Semua Cabang</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-asphalt-800 border border-asphalt-700 flex items-center justify-center text-brand-500 shadow-xl shadow-brand-500/10">
            <TrendingUp className="w-6 h-6 stroke-[2.5px]" />
          </div>
        </div>

        {/* Global Summary & Filter */}
        <div className="space-y-6">
          <div className="bg-asphalt-800 rounded-[2.5rem] p-7 text-white shadow-2xl border border-asphalt-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full -mr-48 -mt-48 blur-[120px] group-hover:bg-brand-500/10 transition-all duration-1000"></div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 opacity-60">
                  <Wallet className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Laba Bersih Global</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase text-brand-400 tracking-widest">{months[selectedMonth]} {selectedYear}</span>
                </div>
              </div>

              {/* Stats Grid - Vertical Focus */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-asphalt-900/40 p-5 rounded-2xl border border-asphalt-700/30">
                  <p className="text-[9px] text-brand-400 font-black uppercase tracking-widest mb-1 leading-none">Admin (Net)</p>
                  <p className="text-2xl font-black text-white tracking-tight">
                    {formatRupiah(globalTotalAdm - globalTotalExp)}
                  </p>
                </div>
                <div className="bg-asphalt-900/40 p-5 rounded-2xl border border-asphalt-700/30">
                  <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-1 leading-none">Voucher</p>
                  <p className="text-2xl font-black text-emerald-500 tracking-tight">
                    {formatRupiah(globalTotalVou)}
                  </p>
                </div>
              </div>

              {/* Grand Total Area */}
              <div className="pt-6 border-t border-white/5 space-y-4">
                <div>
                  <h3 className="text-4xl font-black tracking-tighter text-white">
                    {formatRupiah(globalNetProfit)}
                  </h3>
                  <p className="text-[9px] text-asphalt-text-400 font-black uppercase tracking-[0.2em] mt-2">Total Bersih Semua Cabang</p>
                </div>

                {/* Filter Controls for Global View */}
                <div className="flex items-center gap-2 pt-2">
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="flex-1 bg-asphalt-900/50 border border-asphalt-700 rounded-xl px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-white outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {months.map((m, i) => (
                      <option key={m} value={i}>{m}</option>
                    ))}
                  </select>
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-24 bg-asphalt-900/50 border border-asphalt-700 rounded-xl px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-white outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Performance Overview */}
        <div className="space-y-4">
           <h3 className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-[0.2em] px-2">Kinerja Bulanan</h3>
           <div className="grid grid-cols-1 gap-3">
              {monthlyData.slice(0, 5).map(([key, data]) => (
                <div key={key} className="bg-asphalt-800 p-4 rounded-2xl border border-asphalt-700/50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-tight">{data.label}</p>
                    <p className="text-[8px] text-asphalt-text-500 font-black uppercase tracking-widest mt-1">Admin + Voucher</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-500">{formatRupiah((data.adm - data.exp) + data.vou)}</p>
                    <p className="text-[7px] text-rose-500 font-black uppercase tracking-widest mt-0.5">Exp: -{formatRupiah(data.exp)}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Performance Ranking Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-[0.2em]">Peringkat Performa (Setoran Terakhir)</h3>
            <span className="text-[9px] font-black text-brand-500 bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-xl uppercase tracking-widest">Status Aktif</span>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {topBranches.map((branch, index) => {
              return (
                <motion.button
                  key={branch.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
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
                        {branch.lastReportDate ? `Tgl: ${new Date(branch.lastReportDate.replace(/ /g, 'T')).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}` : 'Belum Ada Laporan'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right relative z-10 space-y-1">
                    <p className="text-md font-black text-white leading-none">{formatRupiah(branch.batchTotal)}</p>
                    <p className="text-[9px] text-brand-500 font-black uppercase tracking-widest leading-none">Setoran Ini</p>
                  </div>
                </motion.button>
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
              <h3 className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-[0.2em] leading-none">Ringkasan Cepat</h3>
              <p className="text-sm font-black text-white mt-1 uppercase tracking-tight leading-none">Arus Pelaporan</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-asphalt-900/50 p-5 rounded-2xl border border-asphalt-700 shadow-inner group">
              <p className="text-[8px] font-black text-asphalt-text-400 uppercase tracking-widest mb-2 leading-none">Cabang Aktif</p>
              <p className="text-2xl font-black text-emerald-500 tracking-tighter leading-none">{branchStats.filter(b => b.isRecentlyActive).length} <span className="text-asphalt-text-400 text-xs">/ {branches.length}</span></p>
            </div>
            <div className="bg-asphalt-900/50 p-5 rounded-2xl border border-asphalt-700 shadow-inner group">
              <p className="text-[8px] font-black text-asphalt-text-400 uppercase tracking-widest mb-2 leading-none">Total Laporan</p>
              <p className="text-2xl font-black text-brand-500 tracking-tighter leading-none">{reportedRecaps.length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedBranch = branches.find(b => b.id === selectedBranchId);

  return (
    <div className="p-3.5 space-y-6 bg-asphalt-900 min-h-screen pb-32">
      {/* Header */}
      <div className="bg-asphalt-800 rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden border border-asphalt-700 group">
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
                  {role === 'bos' ? `${selectedBranch?.name}` : 'Pelaporan'}
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
          <div className="grid grid-cols-1 gap-6 mb-7">
            <div className="space-y-4">
              <div className="flex items-center justify-between group">
                <div>
                  <p className="text-[10px] text-brand-400 font-black uppercase tracking-[0.2em] leading-none mb-1">Total Admin (Net)</p>
                  <p className="text-2xl font-black text-white tracking-tighter">
                    {formatRupiah(role === 'bos' && !selectedBranchId ? (globalTotalAdm - globalTotalExp) : labaBersihAdm)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em] leading-none mb-1">Total Voucher</p>
                  <p className="text-2xl font-black text-emerald-500 tracking-tighter">
                    {formatRupiah(role === 'bos' && !selectedBranchId ? globalTotalVou : totalVoucher)}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-asphalt-text-400 font-black uppercase tracking-[0.2em] leading-none mb-1">Total Bersih</p>
                  <p className="text-3xl font-black text-white tracking-tighter">
                    {formatRupiah(role === 'bos' && !selectedBranchId 
                      ? (globalTotalAdm - globalTotalExp) + globalTotalVou 
                      : labaBersihAdm + totalVoucher)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-brand-400 font-black uppercase tracking-[0.2em] mt-3 leading-none flex items-center justify-end gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
                    {months[selectedMonth]} {selectedYear}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Month/Year Filter */}
          <div className="flex items-center gap-3 pt-6 border-t border-white/5">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="flex-1 bg-asphalt-900/50 border border-asphalt-700 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:ring-1 focus:ring-brand-500"
            >
              {months.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-24 bg-asphalt-900/50 border border-asphalt-700 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:ring-1 focus:ring-brand-500"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
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

                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Keterangan Pengeluaran</label>
                    <input
                      type="text"
                      placeholder="Ex: Token Listrik"
                      className="w-full px-5 py-4.5 text-sm bg-asphalt-900 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-white font-black shadow-inner"
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                    />
                  </div>
                  <div className="w-1/3 space-y-2">
                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Nominal</label>
                    <input
                      type="text"
                      placeholder="0"
                      inputMode="numeric"
                      className="w-full px-5 py-4.5 text-sm bg-asphalt-900 border border-rose-500/30 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none text-rose-500 font-black shadow-inner"
                      value={formatNumberInput(expenseAmount)}
                      onChange={(e) => handleNumericInput(e, setExpenseAmount)}
                    />
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

      {/* Cycles Grouping */}
      <div className="space-y-8">
        {groupedRecaps.length === 0 ? (
          <div className="bg-asphalt-800 rounded-[2.5rem] p-16 text-center border border-asphalt-700/50">
            <FileText className="w-12 h-12 text-asphalt-900 mx-auto mb-4" />
            <p className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest">Belum ada rekapan di bulan ini</p>
          </div>
        ) : (
          groupedRecaps.map((cycle, index) => (
            <motion.div 
              key={cycle.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-8 rounded-full ${cycle.isReported ? 'bg-emerald-500' : 'bg-brand-500 animate-pulse'}`}></div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">{cycle.label}</h3>
                    <p className="text-[9px] font-black text-asphalt-text-400 uppercase tracking-[0.15em] mt-0.5">
                      {cycle.isReported ? 'Setoran Selesai' : 'Sedang Berjalan / Draf'}
                    </p>
                  </div>
                </div>
                {role === 'karyawan' && !cycle.isReported && (
                  <button
                    onClick={() => {
                      // Final logic for cycle reporting can be triggered here if needed
                      // For now we use the global submission, but we can filter here
                      setIsConfirmingReport(true);
                    }}
                    className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                  >
                    Setor Siklus
                  </button>
                )}
              </div>

              {/* Cycle Detail Card */}
              <div className="bg-asphalt-800 rounded-[2.5rem] shadow-2xl border border-asphalt-700/50 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-asphalt-900/50 text-[8px] uppercase font-black text-asphalt-text-400 tracking-[0.1em] border-b border-asphalt-700/50">
                        <th className="pl-6 pr-2 py-3.5 font-black border-r border-asphalt-700/50">Tgl</th>
                        <th className="px-2 py-3.5 font-black border-r border-asphalt-700/50 text-center">Adm Siang</th>
                        <th className="px-2 py-3.5 font-black border-r border-asphalt-700/50 text-center">Adm Malam</th>
                        <th className="px-2 py-3.5 font-black border-r border-asphalt-700/50 text-center">Vou Siang</th>
                        <th className="px-2 py-3.5 font-black border-r border-asphalt-700/50 text-center">Vou Malam</th>
                        {(role !== 'bos' || cycle.items.some(r => r.status === 'reported')) && (
                          <th className="px-3 py-3.5 text-center">Aksi</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-asphalt-700/30">
                      {cycle.items.map((recap) => (
                        <tr key={recap.id} className={`hover:bg-asphalt-900/10 transition-colors group ${recap.status === 'draft' ? 'bg-brand-500/[0.03]' : ''}`}>
                          <td className="pl-6 pr-2 py-4 border-r border-asphalt-700/30">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-white">{new Date(recap.date.replace(/ /g, 'T')).getDate()}</span>
                              <span className="text-[7px] text-asphalt-text-500 font-black uppercase tracking-widest">{months[new Date(recap.date.replace(/ /g, 'T')).getMonth()].slice(0, 3)}</span>
                            </div>
                          </td>
                          <td className="px-2 py-4 text-[10px] font-black text-white/70 border-r border-asphalt-700/30 text-center">
                            {recap.adminSiang.toLocaleString('id-ID')}
                          </td>
                          <td className="px-2 py-4 text-[10px] font-black text-white/70 border-r border-asphalt-700/30 text-center">
                            {recap.adminMalam.toLocaleString('id-ID')}
                          </td>
                          <td className="px-2 py-4 text-[10px] font-black text-emerald-500/80 border-r border-asphalt-700/30 text-center">
                            {recap.voucherSiang.toLocaleString('id-ID')}
                          </td>
                          <td className="px-2 py-4 text-[10px] font-black text-emerald-500/80 border-r border-asphalt-700/30 text-center">
                            {recap.voucherMalam.toLocaleString('id-ID')}
                          </td>
                          <td className="px-3 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {recap.status === 'draft' && role === 'karyawan' && (
                                <>
                                  <button onClick={() => handleEdit(recap)} className="p-1.5 text-asphalt-text-400 hover:text-brand-500"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => setDeleteConfirm({ isOpen: true, id: recap.id, date: recap.date })} className="p-1.5 text-asphalt-text-400 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                </>
                              )}
                              {recap.status === 'reported' && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/30" />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-asphalt-900 border-t border-asphalt-700/50">
                        <td className="pl-6 py-4 text-[9px] font-black text-white uppercase border-r border-asphalt-700/30">Total</td>
                        <td colSpan={2} className="px-2 py-4 text-center text-[10px] font-black text-white border-r border-asphalt-700/30">
                          {formatRupiah(cycle.totalAdm)}
                        </td>
                        <td colSpan={2} className="px-2 py-4 text-center text-[10px] font-black text-emerald-500 border-r border-asphalt-700/30">
                          {formatRupiah(cycle.totalVou)}
                        </td>
                        <td className="px-2 py-4 text-center font-black text-asphalt-text-400 text-[8px]">
                           {cycle.totalExp > 0 && <span className="text-rose-500">Ex: -{formatRupiah(cycle.totalExp)}</span>}
                        </td>
                      </tr>
                      <tr className="bg-asphalt-900/40">
                         <td colSpan={6} className="px-6 py-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black text-asphalt-text-400 uppercase tracking-widest leading-none">Admin Bersih Siklus</span>
                              <span className="text-[12px] font-black text-brand-500 leading-none">{formatRupiah(cycle.totalAdm + cycle.totalVou - cycle.totalExp)}</span>
                            </div>
                         </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Pengeluaran Section */}
      <div className="bg-asphalt-800 rounded-[2.5rem] shadow-2xl border border-asphalt-700/50 overflow-hidden">
        <div className="p-5 border-b border-asphalt-700/50 bg-rose-500/[0.03]">
          <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-rose-500 leading-none">
            Rincian Pengeluaran Bulan Ini
          </h3>
        </div>
        <div className="divide-y divide-asphalt-700/30">
          {groupedRecaps.every(c => c.items.every(r => r.expenseAmount === 0)) ? (
            <div className="p-10 text-center">
              <TrendingDown className="w-8 h-8 text-asphalt-900 mx-auto mb-4" />
              <p className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest">Tidak ada pengeluaran tercatat</p>
            </div>
          ) : (
            groupedRecaps.map(cycle => 
              cycle.items.filter(r => r.expenseAmount > 0).map(recap => (
                <div key={`exp-${recap.id}`} className="p-5 flex items-center justify-between hover:bg-asphalt-900/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-inner group-hover:scale-110 transition-transform">
                      <ArrowDownCircle className="w-5 h-5 stroke-[1.5px]" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-white uppercase tracking-tight leading-tight">{recap.expenseDescription || 'PENGELUARAN UMUM'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[8px] font-black text-asphalt-text-400 uppercase tracking-widest">
                          Tgl {new Date(recap.date.replace(/ /g, 'T')).getDate()} {months[new Date(recap.date.replace(/ /g, 'T')).getMonth()]}
                        </p>
                        <span className="w-1 h-1 rounded-full bg-asphalt-700"></span>
                        <p className="text-[8px] font-black text-brand-500 uppercase tracking-widest">{recap.createdByName.split(' ')[0]}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-rose-500 tracking-tight">-{formatRupiah(recap.expenseAmount)}</p>
                  </div>
                </div>
              ))
            )
          )}
        </div>
        <div className="bg-rose-500 p-5 text-white flex justify-between items-center shadow-inner relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] relative z-10">Total Pengeluaran Bulan Ini</span>
          <span className="text-lg font-black tracking-tighter relative z-10">{formatRupiah(totalExp)}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-asphalt-800 rounded-[2.5rem] p-5 text-white shadow-2xl border border-asphalt-700 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-brand-500/10 transition-all duration-700"></div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 opacity-40">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest group-hover:opacity-100 transition-opacity">Admin Bersih</span>
            </div>
            {trend.admin === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500 stroke-[2.5px]" />}
            {trend.admin === 'down' && <TrendingDown className="w-4 h-4 text-rose-500 stroke-[2.5px]" />}
          </div>
          <p className="text-lg font-black text-white tracking-tighter">{formatRupiah(labaBersihAdm)}</p>
          <p className="text-[8px] text-asphalt-text-400 font-black uppercase tracking-widest mt-1.5 leading-tight">After Deductions</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-asphalt-800 rounded-[2.5rem] p-5 text-white shadow-2xl border border-asphalt-700 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-emerald-500/10 transition-all duration-700"></div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 opacity-40">
              <Wallet className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest group-hover:opacity-100 transition-opacity">Pool</span>
            </div>
            {trend.voucher === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500 stroke-[2.5px]" />}
            {trend.voucher === 'down' && <TrendingDown className="w-4 h-4 text-rose-500 stroke-[2.5px]" />}
          </div>
          <p className="text-lg font-black text-emerald-500 tracking-tighter">{formatRupiah(totalVoucher)}</p>
          <p className="text-[8px] text-asphalt-text-400 font-black uppercase tracking-widest mt-1.5 leading-tight">In Circulation</p>
        </motion.div>
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
              {isSubmitting ? 'MENGIRIM...' : 'SETOR SEMUA DRAF KE BOS'}
            </button>
          </div>
          <div className="mt-6 flex items-start gap-3 px-8">
            <AlertCircle className="w-4 h-4 text-asphalt-text-400 shrink-0 mt-0.5" />
            <p className="text-[9px] text-asphalt-text-400 font-bold uppercase tracking-[0.1em] leading-relaxed">
              Pesan Penting: Laporan yang dikirim tidak dapat ditarik kembali. Pastikan akurasi data sebelum setor.
            </p>
          </div>
        </div>
      ) : (
        <div className="pb-24"></div>
      )}

      <ConfirmModal
        isOpen={isConfirmingReport}
        title="Setor Laporan Ke Bos"
        message={
          <div className="space-y-6">
            <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-[2rem] flex items-start gap-4 shadow-inner">
              <AlertCircle className="w-7 h-7 text-rose-500 shrink-0" />
              <p className="text-[12px] font-black text-rose-500 leading-relaxed uppercase tracking-tight">
                Seluruh data draf akan disetorkan dan <span className="underline">dikunci permanen</span>. Lanjutkan proses setoran?
              </p>
            </div>
          </div>
        }
        confirmText="YA, SETORKAN"
        confirmVariant="primary"
        onConfirm={handleReportToBos}
        onCancel={() => setIsConfirmingReport(false)}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Hapus Data Draf"
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

