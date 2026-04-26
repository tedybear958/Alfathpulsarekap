import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { FileText, Plus, Trash2, Check, Clock, User, Calendar, CreditCard, ArrowLeft, Download, Send } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { SalarySlip, UserProfile } from '../types';
import { formatRupiah, formatNumberInput } from '../utils/formatters';
import { checkIsBos } from '../utils/authUtils';
import { ConfirmModal } from './ConfirmModal';
import { SuccessToast } from './SuccessToast';

export function SalarySlips() {
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, role, branchId: currentUserBranchId, isAuthLoaded } = useAuthStore();
  const { branches } = useFinanceStore();
  
  const uid = user?.uid;
  const currentUserName = user?.displayName || 'Pengguna';
  
  const [isAdding, setIsAdding] = useState(false);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Slip gaji berhasil disimpan!');
  
  // Form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [baseSalary, setBaseSalary] = useState('');
  const [bonus, setBonus] = useState('0');
  const [deductions, setDeductions] = useState('0');

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  const isBos = checkIsBos(user, role);
  // Bos Pusat (Global) adalah Bos tanpa branchId
  const isGlobalBos = isBos && !currentUserBranchId;

  const [batchMonth, setBatchMonth] = useState(new Date().getMonth() + 1);
  const [batchYear, setBatchYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!isAuthLoaded) return;
    
    if (!uid) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let q;
    
    if (isBos) {
      if (isGlobalBos) {
        q = query(collection(db, 'salarySlips'));
      } else {
        q = query(collection(db, 'salarySlips'), where('branchId', '==', currentUserBranchId));
      }
    } else {
      q = query(collection(db, 'salarySlips'), where('userId', '==', uid));
    }

    const unsub = onSnapshot(q, (snapshot) => {
      if (!isMounted) return;
      const slipsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SalarySlip));
      // Sort by year desc, then month desc
      const sortedData = [...slipsData].sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.month - a.month;
      });
      setSlips(sortedData);
      setIsLoading(false);
    }, (error) => {
      if (!isMounted) return;
      console.error("FULL FIRESTORE ERROR IN SALARY SLIPS:", error);
      handleFirestoreError(error, OperationType.GET, 'salarySlips');
      setIsLoading(false);
    });

    if (isBos) {
      let usersQuery;
      if (isGlobalBos) {
        usersQuery = query(collection(db, 'users'));
      } else {
        usersQuery = query(collection(db, 'users'), where('branchId', '==', currentUserBranchId));
      }

      const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
        if (!isMounted) return;
        const usersData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
        setUsers(usersData.filter(u => u.role !== 'bos'));
      }, (error) => {
        if (!isMounted) return;
        console.error("Error fetching users for salary slips:", error);
        handleFirestoreError(error, OperationType.GET, 'users-for-slips');
      });
      return () => { isMounted = false; unsub(); unsubUsers(); };
    }

    return () => { isMounted = false; unsub(); };
  }, [isBos, isGlobalBos, currentUserBranchId, uid, isAuthLoaded]);

  const handleBatchGenerate = async () => {
    if (!isBos || users.length === 0) return;
    setIsGeneratingBatch(true);
    
    try {
      let createdCount = 0;
      for (const targetUser of users) {
        // Cek apakah sudah ada slip untuk user ini di bulan/tahun ini
        const exists = slips.find(s => s.userId === targetUser.uid && s.month === batchMonth && s.year === batchYear);
        
        if (!exists) {
          const salaryBase = targetUser.baseSalary || 2000000; // Default 2jt jika belum ada
          const branch = branches.find(b => b.id === targetUser.branchId);
          
          await addDoc(collection(db, 'salarySlips'), {
            userId: targetUser.uid,
            userName: targetUser.name,
            role: targetUser.role,
            branchId: targetUser.branchId || null,
            branchName: branch?.name || null,
            month: batchMonth,
            year: batchYear,
            baseSalary: salaryBase,
            bonus: 0,
            deductions: 0,
            netSalary: salaryBase,
            status: 'pending',
            createdAt: new Date().toISOString(),
            createdBy: uid,
            createdByName: currentUserName
          });
          createdCount++;
        }
      }
      
      if (createdCount > 0) {
        setSuccessMessage("Makan sate di pinggir jalan, rasanya enak bikin ketagihan. Gajian masal sudah dijalankan, karyawan senang dapur pun aman! 🔥");
        setShowSuccess(true);
      } else {
        alert("Semua karyawan sudah punya slip gaji untuk bulan ini!");
      }
      setIsGeneratingBatch(false);
    } catch (error) {
      console.error("Error batch generating:", error);
      handleFirestoreError(error, OperationType.CREATE, 'salarySlips-batch');
      setIsGeneratingBatch(false);
    }
  };

  const handleAddSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !baseSalary || !uid) return;

    const userToSalary = users.find(u => u.uid === selectedUserId);
    if (!userToSalary) return;

    const baseVal = parseInt(baseSalary.replace(/\D/g, ''), 10);
    const bonusVal = parseInt(bonus.replace(/\D/g, ''), 10) || 0;
    const dedVal = parseInt(deductions.replace(/\D/g, ''), 10) || 0;
    const netSalary = baseVal + bonusVal - dedVal;

    const branch = branches.find(b => b.id === userToSalary.branchId);

    try {
      await addDoc(collection(db, 'salarySlips'), {
        userId: userToSalary.uid,
        userName: userToSalary.name,
        role: userToSalary.role,
        branchId: userToSalary.branchId || null,
        branchName: branch?.name || null,
        month,
        year,
        baseSalary: baseVal,
        bonus: bonusVal,
        deductions: dedVal,
        netSalary,
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: uid,
        createdByName: currentUserName
      });
      
      setIsAdding(false);
      setSelectedUserId('');
      setBaseSalary('');
      setBonus('0');
      setDeductions('0');
      setSuccessMessage("Buah manggis di atas peti, dimakan satu manis sekali. Slip gaji sudah rapi, tinggal bayar biar happy! 💰");
      setShowSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'salarySlips');
    }
  };

  const handleStatusChange = async (slipId: string, newStatus: 'paid') => {
    try {
      await updateDoc(doc(db, 'salarySlips', slipId), {
        status: newStatus,
        paidAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `salarySlips/${slipId}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    
    if (deleteConfirm.id === 'ALL') {
      try {
        const querySnapshot = await getDocs(collection(db, 'salarySlips'));
        const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, 'salarySlips', d.id)));
        await Promise.all(deletePromises);
        setDeleteConfirm({ isOpen: false, id: '', name: '' });
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'salarySlips-all');
      }
      return;
    }

    try {
      await deleteDoc(doc(db, 'salarySlips', deleteConfirm.id));
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `salarySlips/${deleteConfirm.id}`);
    }
  };

  const getMonthName = (m: number) => {
    return new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, m - 1, 1));
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-6 bg-asphalt-900 min-h-screen pb-40">
      {/* Mini Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20 text-brand-500">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-tight">Slip Gaji</h3>
            <p className="text-[10px] text-asphalt-text-400 font-bold uppercase tracking-widest">{slips.length} Tersedia</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isBos && slips.length > 0 && !isAdding && (
            <button
              onClick={() => setDeleteConfirm({ isOpen: true, id: 'ALL', name: 'SEMUA SLIP GAJI' })}
              className="px-3 py-2 bg-asphalt-800 text-rose-500 border border-asphalt-700/50 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-asphalt-700 transition-all"
            >
              BERSIHKAN
            </button>
          )}
          {isBos && !isAdding && (
             <button
              onClick={() => setIsGeneratingBatch(!isGeneratingBatch)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg ${
                isGeneratingBatch ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-asphalt-800 text-brand-500 border border-asphalt-700 shadow-brand-500/10'
              }`}
            >
              <Send className="w-4 h-4" />
              GAJIAN MASAL
            </button>
          )}
          {isBos && !isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-brand-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-brand-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              BUAT
            </button>
          )}
        </div>
      </div>

      {isBos && isGeneratingBatch && !isAdding && (
        <div className="bg-asphalt-800 rounded-[2.5rem] p-7 shadow-2xl border border-amber-500/30 animate-in fade-in slide-in-from-top duration-500">
           <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Send className="w-4 h-4 text-amber-500" />
              Gajian Masal Karyawan
            </h3>
            <button onClick={() => setIsGeneratingBatch(false)} className="text-asphalt-text-400 p-2"><ArrowLeft className="w-5 h-5" /></button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">Pilih Bulan</label>
              <select
                value={batchMonth}
                onChange={(e) => setBatchMonth(parseInt(e.target.value))}
                className="w-full px-5 py-4 bg-asphalt-900 border border-asphalt-700 rounded-2xl text-sm text-white font-bold outline-none uppercase tracking-widest"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{getMonthName(m).toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">Pilih Tahun</label>
              <select
                value={batchYear}
                onChange={(e) => setBatchYear(parseInt(e.target.value))}
                className="w-full px-5 py-4 bg-asphalt-900 border border-asphalt-700 rounded-2xl text-sm text-white font-bold outline-none uppercase tracking-widest"
              >
                {[batchYear - 1, batchYear, batchYear + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-[11px] text-asphalt-text-400 font-medium mb-6 px-1">
            Fitur ini akan membuat draf slip gaji untuk <span className="text-white font-bold">{users.length} karyawan</span> yang belum memiliki slip di bulan {getMonthName(batchMonth)} {batchYear}.
          </p>

          <button
            onClick={handleBatchGenerate}
            disabled={isLoading}
            className="w-full py-4.5 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {isLoading ? 'MEMPROSES...' : '🔥 GENERATE SEMUA SLIP'}
          </button>
        </div>
      )}

      {isAdding && (
        <div className="bg-asphalt-800 rounded-[2.5rem] p-7 shadow-2xl border border-asphalt-700 animate-in slide-in-from-bottom duration-500">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Buat Slip Gaji</h3>
            <button onClick={() => setIsAdding(false)} className="text-asphalt-text-400 p-2"><ArrowLeft className="w-5 h-5" /></button>
          </div>

                  <form onSubmit={handleAddSlip} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">Pilih Anggota</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="w-full px-5 py-4 bg-asphalt-900 border border-asphalt-700 rounded-2xl text-sm text-white font-bold focus:ring-2 focus:ring-brand-500 outline-none uppercase tracking-widest"
              >
                <option value="">-- Pilih Karyawan/Mandor --</option>
                {users.map(u => (
                  <option key={u.uid} value={u.uid}>{(u.name || 'TANPA NAMA').toUpperCase()} ({(u.role || 'ROLE').toUpperCase()})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">Bulan</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="w-full px-5 py-4 bg-asphalt-900 border border-asphalt-700 rounded-2xl text-sm text-white font-bold outline-none uppercase tracking-widest"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{getMonthName(m).toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">Tahun</label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full px-5 py-4 bg-asphalt-900 border border-asphalt-700 rounded-2xl text-sm text-white font-bold outline-none uppercase tracking-widest"
                >
                  {[year - 1, year, year + 1].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">Gaji Pokok</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-asphalt-text-400 text-xs font-black">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  className="w-full pl-12 pr-5 py-4 bg-asphalt-900 border border-asphalt-700 rounded-2xl text-sm text-white font-black outline-none focus:ring-2 focus:ring-brand-500 shadow-inner"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(formatNumberInput(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">Bonus</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full px-5 py-4 bg-asphalt-900 border border-asphalt-700 rounded-2xl text-sm text-emerald-500 font-black outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                  value={bonus}
                  onChange={(e) => setBonus(formatNumberInput(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">Potongan</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full px-5 py-4 bg-asphalt-900 border border-asphalt-700 rounded-2xl text-sm text-rose-500 font-black outline-none focus:ring-2 focus:ring-rose-500 shadow-inner"
                  value={deductions}
                  onChange={(e) => setDeductions(formatNumberInput(e.target.value))}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4.5 bg-brand-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-brand-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-brand-500/20"
            >
              SIMPAN SLIP GAJI
            </button>
          </form>
        </div>
      )}

      {/* Slips List */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <Calendar className="w-5 h-5 text-brand-500" />
          <h3 className="text-sm font-black text-white uppercase tracking-tight">Riwayat Gaji</h3>
        </div>

        <div className="space-y-4">
          {slips.length === 0 ? (
            <div className="bg-asphalt-800 rounded-[2.5rem] p-10 text-center border border-asphalt-700/50">
              <FileText className="w-12 h-12 text-asphalt-900 mx-auto mb-4" />
              <p className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest">Belum ada slip gaji tersedia.</p>
            </div>
          ) : (
            slips.map((slip) => (
              <div key={slip.id} className="bg-asphalt-800 rounded-3xl border border-asphalt-700/50 shadow-xl overflow-hidden group">
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border border-white/10 ${
                        slip.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {slip.status === 'paid' ? <Check className="w-5 h-5 stroke-[3px]" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-tight">{slip.userName || 'Karyawan'}</h4>
                        <p className="text-[9px] text-asphalt-text-400 font-bold uppercase tracking-widest mt-0.5">
                          {getMonthName(slip.month)} {slip.year}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isBos && (
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, id: slip.id, name: `${slip.userName} (${getMonthName(slip.month)})` })}
                          className="p-2 text-asphalt-text-400 hover:text-rose-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-asphalt-900/40 p-3 rounded-xl border border-asphalt-700 shadow-inner">
                      <p className="text-[7px] text-asphalt-text-400 uppercase font-black tracking-widest mb-1 opacity-60">Gaji Pokok</p>
                      <p className="text-[11px] font-black text-white">{formatRupiah(slip.baseSalary)}</p>
                    </div>
                    <div className="bg-asphalt-900/40 p-3 rounded-xl border border-asphalt-700 shadow-inner">
                      <p className="text-[7px] text-asphalt-text-400 uppercase font-black tracking-widest mb-1 opacity-60">Diterima</p>
                      <p className="text-[11px] font-black text-emerald-500">{formatRupiah(slip.netSalary)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest border ${
                        slip.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {slip.status === 'paid' ? 'LUNAS' : 'PENDING'}
                      </span>
                    </div>
                    
                    {isBos && slip.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(slip.id, 'paid')}
                        className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-1.5"
                      >
                       <Check className="w-3 h-3 stroke-[3px]" />
                       BAYAR
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Hapus Slip Gaji"
        message={`Apakah Anda yakin ingin menghapus slip gaji ${deleteConfirm.name}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
      />
      {showSuccess && <SuccessToast show={showSuccess} message={successMessage} onClose={() => setShowSuccess(false)} />}
    </div>
  );
}
