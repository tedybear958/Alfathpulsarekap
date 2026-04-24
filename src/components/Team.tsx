import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Shield, UserCog, User as UserIcon, Trash2, Store, Plus, Check, Phone, Send } from 'lucide-react';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { UserProfile } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { sendWhatsAppMessage } from '../services/whatsappService';

export function Team() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { branchId, role: currentUserRole } = useAuthStore();
  const { branches, addBranch, deleteBranch } = useFinanceStore();
  const [newBranchName, setNewBranchName] = useState('');
  
  const [editingBranch, setEditingBranch] = useState<{ id: string; capital: string; physicalCapital: string } | null>(null);
  const [editingPhone, setEditingPhone] = useState<{ uid: string; phone: string } | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<{ total: number; success: number; failed: number } | null>(null);

  const isBos = currentUserRole === 'bos';
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'user' | 'branch'; id: string; name: string }>({
    isOpen: false,
    type: 'user',
    id: '',
    name: ''
  });

  const handleCopyEmails = () => {
    const emails = users
      .filter(u => u.role === 'karyawan' || u.role === 'mandor')
      .map(u => u.email)
      .filter(Boolean)
      .join(', ');
    navigator.clipboard.writeText(emails);
    alert('Daftar email berhasil disalin ke clipboard!');
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
      setUsers(usersData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const handlePhoneChange = async (uid: string, phone: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { phone });
      setEditingPhone(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleBroadcastTest = async () => {
    const targets = users.filter(u => u.phone);
    if (targets.length === 0) {
      alert("Tidak ada nomor WhatsApp yang terdaftar.");
      return;
    }

    setIsBroadcasting(true);
    setBroadcastStatus({ total: targets.length, success: 0, failed: 0 });

    const message = `*TES BROADCAST ALFATHPulsa*\n\n` +
      `Halo! Ini adalah pesan tes dari sistem ALFATHPulsa untuk memastikan nomor Anda sudah terdaftar dengan benar.\n\n` +
      `Waktu: ${new Date().toLocaleString('id-ID')}\n` +
      `_Pesan ini dikirim secara otomatis._`;

    for (const user of targets) {
      try {
        if (user.phone) {
          const result = await sendWhatsAppMessage(user.phone, message);
          if (result.status === true || result.status === 'true') {
            setBroadcastStatus(prev => prev ? { ...prev, success: prev.success + 1 } : null);
          } else {
            console.error(`Fonnte rejected message to ${user.name}:`, result);
            setBroadcastStatus(prev => prev ? { ...prev, failed: prev.failed + 1 } : null);
          }
        }
      } catch (error: any) {
        console.error(`Failed to send to ${user.name}:`, error);
        setBroadcastStatus(prev => prev ? { ...prev, failed: prev.failed + 1 } : null);
      }
    }

    setIsBroadcasting(false);
    setTimeout(() => setBroadcastStatus(null), 5000);
  };

  const handleRoleChange = async (uid: string, newRole: 'bos' | 'mandor' | 'karyawan') => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const [pendingBranchChanges, setPendingBranchChanges] = useState<Record<string, string>>({});

  const handleBranchChange = async (uid: string, newBranchId: string) => {
    setPendingBranchChanges(prev => ({ ...prev, [uid]: newBranchId }));
  };

  const handleSaveBranchChange = async (uid: string) => {
    const newBranchId = pendingBranchChanges[uid];
    try {
      await updateDoc(doc(db, 'users', uid), { branchId: newBranchId || null });
      setPendingBranchChanges(prev => {
        const next = { ...prev };
        delete next[uid];
        return next;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      if (deleteConfirm.type === 'user') {
        await deleteDoc(doc(db, 'users', deleteConfirm.id));
      } else {
        await deleteBranch(deleteConfirm.id);
      }
      setDeleteConfirm({ isOpen: false, type: 'user', id: '', name: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${deleteConfirm.type === 'user' ? 'users' : 'branches'}/${deleteConfirm.id}`);
    }
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBranchName.trim()) {
      addBranch(newBranchName);
      setNewBranchName('');
    }
  };

  const handleUpdateBranchCapital = async (branchId: string, capital: string, physicalCapital: string) => {
    const capVal = parseInt(capital.replace(/\D/g, ''), 10);
    const physVal = parseInt(physicalCapital.replace(/\D/g, ''), 10);
    
    if (!isNaN(capVal)) {
      await useFinanceStore.getState().updateBranchCapital(branchId, capVal);
    }
    if (!isNaN(physVal)) {
      await useFinanceStore.getState().updateBranchPhysicalCapital(branchId, physVal);
    }
    setEditingBranch(null);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-7 bg-asphalt-900 min-h-screen">
      {/* Header */}
      <div className="bg-asphalt-800 rounded-[2.5rem] p-7 text-white shadow-2xl relative overflow-hidden group border border-asphalt-700">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-brand-500/20 transition-all duration-1000"></div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-asphalt-900 flex items-center justify-center border border-white/10 shadow-lg text-brand-500">
              <UserCog className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-asphalt-text-400 leading-none">Manajemen</h3>
              <p className="text-sm font-black text-white mt-1 uppercase tracking-tight leading-none">Tim & Cabang</p>
            </div>
          </div>
          <div>
            <p className="text-3xl font-black tracking-tighter text-white">
              {users.length} <span className="text-asphalt-text-400 text-lg">Anggota</span> | {branches.length} <span className="text-asphalt-text-400 text-lg">Cabang</span>
            </p>
            <p className="text-[10px] text-brand-400 font-black uppercase tracking-[0.15em] mt-2">
              Atur jabatan, penempatan cabang, dan modal operasional.
            </p>
          </div>
        </div>
      </div>

      {/* Broadcast Test Section */}
      <div className="bg-asphalt-800 rounded-[2.5rem] p-7 shadow-2xl border border-asphalt-700/50 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Tes WhatsApp</h3>
              <p className="text-[10px] text-asphalt-text-400 font-black uppercase tracking-widest mt-0.5 leading-none">Verifikasi Nomor Bot</p>
            </div>
          </div>
          {isBroadcasting && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-2.5 h-2.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[9px] font-black text-emerald-500 uppercase">Proses...</span>
            </div>
          )}
        </div>
        
        <p className="text-[10px] text-asphalt-text-400 leading-relaxed font-medium uppercase tracking-widest px-1">
          Tes apakah semua nomor sudah bisa menerima pesan dari sistem Fonnte.
        </p>

        {broadcastStatus && (
          <div className="bg-asphalt-900 p-4 rounded-2xl border border-asphalt-700 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-emerald-500 stroke-[3px]" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                Berhasil: {broadcastStatus.success} | Gagal: {broadcastStatus.failed}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={handleBroadcastTest}
          disabled={isBroadcasting}
          className="w-full py-4.5 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
          KIRIM PESAN TES MASAL
        </button>
      </div>

      {/* Branch Management Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <Store className="w-5 h-5 text-brand-500" />
          <h3 className="text-sm font-black text-white uppercase tracking-tight">Daftar Cabang</h3>
        </div>
        
        <div className="bg-asphalt-800 rounded-[2.5rem] shadow-2xl border border-asphalt-700/50 overflow-hidden">
          <div className={`p-6 border-b border-asphalt-700/50 bg-asphalt-900/40 ${!isBos ? 'opacity-50 pointer-events-none' : ''}`}>
            <form onSubmit={handleAddBranch} className="flex gap-3">
              <input
                type="text"
                placeholder="Nama Cabang Baru"
                disabled={!isBos}
                className="flex-1 px-5 py-4 text-sm bg-asphalt-900 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-white font-bold shadow-inner placeholder:text-asphalt-text-400/30"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                required
              />
              <button type="submit" className="px-6 py-4 bg-brand-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-brand-500/20">
                <Plus className="w-5 h-5" />
                <span>TAMBAH</span>
              </button>
            </form>
          </div>
          
          <div className="divide-y divide-asphalt-700/50 max-h-80 overflow-y-auto no-scrollbar">
            {branches.length === 0 ? (
              <div className="p-10 text-center">
                <Store className="w-10 h-10 text-asphalt-800 mx-auto mb-3" />
                <p className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest">Belum ada cabang terdaftar.</p>
              </div>
            ) : (
              branches.map(branch => (
                <div key={branch.id} className="p-5 flex flex-col gap-4 hover:bg-asphalt-900/20 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-asphalt-900 border border-asphalt-700 flex items-center justify-center text-brand-500 text-xs font-black shadow-inner">
                        {branch.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-black text-white uppercase tracking-tight">{branch.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isBos && (
                        <button
                          onClick={() => setEditingBranch({ 
                            id: branch.id, 
                            capital: (branch.capital || 0).toString(),
                            physicalCapital: (branch.physicalCapital || 0).toString()
                          })}
                          className="w-10 h-10 flex items-center justify-center text-asphalt-text-400 hover:text-brand-500 hover:bg-brand-500/10 rounded-xl transition-all"
                        >
                          <Shield className="w-5 h-5" />
                        </button>
                      )}
                      {isBos && (
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, type: 'branch', id: branch.id, name: branch.name })}
                          className="w-10 h-10 flex items-center justify-center text-asphalt-text-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pl-14">
                    <div className="bg-asphalt-900/40 p-3 rounded-2xl border border-asphalt-700/50">
                      <p className="text-[9px] text-asphalt-text-400 uppercase font-black tracking-widest mb-1.5">Modal Non-Fisik</p>
                      {editingBranch?.id === branch.id ? (
                        <input
                          type="text"
                          className="w-full bg-asphalt-800 border border-brand-500/30 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                          value={editingBranch.capital.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                          onChange={(e) => setEditingBranch({ ...editingBranch, capital: e.target.value.replace(/\D/g, '') })}
                          autoFocus
                        />
                      ) : (
                        <p className="text-sm font-black text-brand-500 tracking-tight">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(branch.capital || 0)}
                        </p>
                      )}
                    </div>

                    <div className="bg-asphalt-900/40 p-3 rounded-2xl border border-asphalt-700/50 relative overflow-hidden">
                      <p className="text-[9px] text-asphalt-text-400 uppercase font-black tracking-widest mb-1.5">Modal Fisik</p>
                      {editingBranch?.id === branch.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            className="flex-1 bg-asphalt-800 border border-brand-500/30 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                            value={editingBranch.physicalCapital.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                            onChange={(e) => setEditingBranch({ ...editingBranch, physicalCapital: e.target.value.replace(/\D/g, '') })}
                          />
                          <button 
                            onClick={() => handleUpdateBranchCapital(branch.id, editingBranch.capital, editingBranch.physicalCapital)} 
                            className="p-1.5 bg-brand-500 text-white rounded-lg shadow-lg active:scale-90 transition-all"
                          >
                            <Check className="w-4 h-4 stroke-[3px]" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm font-black text-emerald-500 tracking-tight">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(branch.physicalCapital || 0)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <UserIcon className="w-5 h-5 text-brand-500" />
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Anggota Tim</h3>
          </div>
          {isBos && (
            <button
              onClick={handleCopyEmails}
              className="text-[9px] font-black text-brand-500 uppercase tracking-widest px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-xl hover:bg-brand-500/20 transition-all"
            >
              Copy Semua Email
            </button>
          )}
        </div>

        <div className="bg-asphalt-800 rounded-[2.5rem] shadow-2xl border border-asphalt-700/50 overflow-hidden">
          <div className="divide-y divide-asphalt-700/50">
            {users.map((user) => (
              <div key={user.uid} className="p-6 flex flex-col gap-6 hover:bg-asphalt-900/20 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border border-white/10 ${
                    user.role === 'bos' ? 'bg-purple-500/10 text-purple-500' :
                    user.role === 'mandor' ? 'bg-orange-500/10 text-orange-500' :
                    'bg-brand-500/10 text-brand-500'
                  }`}>
                    {user.role === 'bos' ? <Shield className="w-7 h-7" /> : <UserIcon className="w-7 h-7" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black text-white uppercase tracking-tight truncate">{user.name}</h3>
                    <p className="text-[10px] text-asphalt-text-400 font-bold tracking-widest uppercase truncate mt-0.5">{user.email}</p>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.uid, e.target.value as any)}
                      disabled={!isBos || user.email === 'alfathpulsa27@gmail.com'}
                      className={`text-[10px] font-black rounded-xl px-4 py-3 border border-asphalt-700 outline-none cursor-pointer uppercase tracking-widest transition-all ${
                        user.role === 'bos' ? 'bg-purple-500/10 text-purple-500' :
                        user.role === 'mandor' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-brand-500/10 text-brand-500'
                      }`}
                    >
                      <option value="karyawan">KARYAWAN</option>
                      <option value="mandor">MANDOR</option>
                      <option value="bos">BOS</option>
                    </select>
                    {isBos && user.email !== 'alfathpulsa27@gmail.com' && (
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, type: 'user', id: user.uid, name: user.name })}
                        className="w-11 h-11 flex items-center justify-center text-asphalt-text-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-asphalt-700"
                        title="Hapus Tim"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {(user.role === 'karyawan' || user.role === 'mandor' || user.role === 'bos') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pl-18 pr-2">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">Penempatan Cabang</label>
                      <div className="flex items-center gap-3">
                        <select
                          value={pendingBranchChanges[user.uid] !== undefined ? pendingBranchChanges[user.uid] : (user.branchId || '')}
                          onChange={(e) => handleBranchChange(user.uid, e.target.value)}
                          disabled={!isBos}
                          className={`text-xs font-black rounded-2xl px-5 py-4 border border-asphalt-700 outline-none flex-1 transition-all shadow-inner uppercase tracking-widest ${
                            pendingBranchChanges[user.uid] !== undefined ? 'bg-brand-500/10 text-brand-500 ring-2 ring-brand-500/20' : 'bg-asphalt-900 text-white'
                          }`}
                        >
                          <option value="">-- {user.role === 'bos' ? 'Pusat (Global)' : 'Pilih Cabang'} --</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>
                          ))}
                        </select>
                        {pendingBranchChanges[user.uid] !== undefined && (
                          <button
                            onClick={() => handleSaveBranchChange(user.uid)}
                            className="h-14 w-14 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg active:scale-90 flex items-center justify-center shrink-0"
                          >
                            <Check className="w-6 h-6 stroke-[3px]" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-asphalt-text-400 uppercase tracking-widest ml-1">WhatsApp (Fonnte)</label>
                      <div className="flex items-center gap-3">
                        {editingPhone?.uid === user.uid ? (
                          <>
                            <input
                              type="text"
                              placeholder="62812345678"
                              className="flex-1 px-5 py-4 text-xs bg-asphalt-900 border border-brand-500/30 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 text-white font-black shadow-inner"
                              value={editingPhone.phone}
                              onChange={(e) => setEditingPhone({ ...editingPhone, phone: e.target.value.replace(/\D/g, '') })}
                              autoFocus
                            />
                            <button
                              onClick={() => handlePhoneChange(user.uid, editingPhone.phone)}
                              className="h-14 w-14 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg active:scale-90 flex items-center justify-center shrink-0"
                            >
                              <Check className="w-6 h-6 stroke-[3px]" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setEditingPhone({ uid: user.uid, phone: user.phone || '' })}
                            className="flex-1 flex items-center justify-between px-5 py-4 bg-asphalt-900 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white hover:bg-asphalt-700 transition-all group border border-asphalt-700 shadow-inner"
                          >
                            <span className={user.phone ? 'text-white' : 'text-asphalt-text-400 italic'}>
                              {user.phone || 'BELUM DIATUR'}
                            </span>
                            <Phone className="w-4 h-4 text-asphalt-text-400 group-hover:text-brand-500 transition-colors" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.type === 'user' ? 'Hapus Anggota' : 'Hapus Cabang'}
        message={`Apakah Anda yakin ingin menghapus ${deleteConfirm.type === 'user' ? 'anggota' : 'cabang'} ${deleteConfirm.name}? Data yang dihapus tidak dapat dikembalikan.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: 'user', id: '', name: '' })}
      />
    </div>
  );
}
