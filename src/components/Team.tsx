import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Shield, UserCog, User as UserIcon, Trash2, Store, Plus, Check, Phone, Send, AlertCircle } from 'lucide-react';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { UserProfile } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { sendWhatsAppMessage } from '../services/whatsappService';

export function Team() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { branches, addBranch, deleteBranch, setError } = useFinanceStore();
  const [newBranchName, setNewBranchName] = useState('');
  
  const [editingBranch, setEditingBranch] = useState<{ id: string; capital: string; physicalCapital: string } | null>(null);
  const [editingPhone, setEditingPhone] = useState<{ uid: string; phone: string } | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<{ total: number; success: number; failed: number } | null>(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'user' | 'branch'; id: string; name: string }>({
    isOpen: false,
    type: 'user',
    id: '',
    name: ''
  });

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
          await sendWhatsAppMessage(user.phone, message);
          setBroadcastStatus(prev => prev ? { ...prev, success: prev.success + 1 } : null);
        }
      } catch (error) {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1 opacity-90">
            <UserCog className="w-5 h-5" />
            <h3 className="text-sm font-medium">Manajemen Tim & Cabang</h3>
          </div>
          <p className="text-2xl font-bold tracking-tight mt-2">
            {users.length} Anggota | {branches.length} Cabang
          </p>
          <p className="text-xs text-blue-200 mt-1">
            Atur jabatan, penempatan cabang, dan daftar cabang toko.
          </p>
        </div>
      </div>

      {/* Broadcast Test Section */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900">Tes Broadcast WhatsApp</h3>
          </div>
          {isBroadcasting && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Mengirim...</span>
            </div>
          )}
        </div>
        
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Gunakan fitur ini untuk mengetes apakah semua nomor yang terdaftar sudah bisa menerima pesan dari bot Fonnte.
        </p>

        {broadcastStatus && (
          <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">
                Selesai: {broadcastStatus.success} Berhasil, {broadcastStatus.failed} Gagal
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleBroadcastTest}
          disabled={isBroadcasting}
          className="w-full py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>Kirim Pesan Tes ke Semua Nomor</span>
        </button>
      </div>

      {/* Branch Management Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Store className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-gray-900">Daftar Cabang</h3>
        </div>
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <form onSubmit={handleAddBranch} className="flex gap-2">
              <input
                type="text"
                placeholder="Nama Cabang Baru"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                required
              />
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1">
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </form>
          </div>
          
          <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
            {branches.length === 0 ? (
              <p className="text-center text-[10px] text-gray-400 py-4">Belum ada cabang.</p>
            ) : (
              branches.map(branch => (
                <div key={branch.id} className="p-3 flex flex-col gap-2 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-[10px] font-bold">
                        {branch.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-gray-700">{branch.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingBranch({ 
                          id: branch.id, 
                          capital: (branch.capital || 0).toString(),
                          physicalCapital: (branch.physicalCapital || 0).toString()
                        })}
                        className="p-1.5 text-blue-400 hover:text-blue-600 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, type: 'branch', id: branch.id, name: branch.name })}
                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pl-9 pr-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-gray-500">Modal Non-Fisik:</p>
                      {editingBranch?.id === branch.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            className="w-24 px-2 py-0.5 text-[10px] border border-blue-200 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                            value={editingBranch.capital.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                            onChange={(e) => setEditingBranch({ ...editingBranch, capital: e.target.value.replace(/\D/g, '') })}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <p className="text-[10px] font-bold text-blue-600">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(branch.capital || 0)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-gray-500">Modal Fisik:</p>
                      {editingBranch?.id === branch.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            className="w-24 px-2 py-0.5 text-[10px] border border-blue-200 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                            value={editingBranch.physicalCapital.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                            onChange={(e) => setEditingBranch({ ...editingBranch, physicalCapital: e.target.value.replace(/\D/g, '') })}
                          />
                          <button 
                            onClick={() => handleUpdateBranchCapital(branch.id, editingBranch.capital, editingBranch.physicalCapital)} 
                            className="p-1 bg-blue-600 text-white rounded"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] font-bold text-orange-600">
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
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <UserIcon className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-gray-900">Anggota Tim</h3>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {users.map((user) => (
              <div key={user.uid} className="p-4 flex flex-col gap-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    user.role === 'bos' ? 'bg-purple-100 text-purple-600' :
                    user.role === 'mandor' ? 'bg-orange-100 text-orange-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {user.role === 'bos' ? <Shield className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{user.name}</h3>
                    <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.uid, e.target.value as any)}
                      disabled={user.email === 'alfathpulsa27@gmail.com'}
                      className={`text-xs font-bold rounded-lg px-2 py-1.5 border-0 outline-none cursor-pointer ${
                        user.role === 'bos' ? 'bg-purple-50 text-purple-700' :
                        user.role === 'mandor' ? 'bg-orange-50 text-orange-700' :
                        'bg-blue-50 text-blue-700'
                      }`}
                    >
                      <option value="karyawan">Karyawan</option>
                      <option value="mandor">Mandor</option>
                      <option value="bos">Bos</option>
                    </select>
                    {user.email !== 'alfathpulsa27@gmail.com' && (
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, type: 'user', id: user.uid, name: user.name })}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Tim"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {(user.role === 'karyawan' || user.role === 'mandor' || user.role === 'bos') && (
                  <div className="space-y-2 pl-14">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 font-medium w-16">Penempatan:</span>
                      <div className="flex-1 flex items-center gap-2 max-w-[250px]">
                        <select
                          value={pendingBranchChanges[user.uid] !== undefined ? pendingBranchChanges[user.uid] : (user.branchId || '')}
                          onChange={(e) => handleBranchChange(user.uid, e.target.value)}
                          className={`text-xs rounded-lg px-2 py-1.5 border-0 outline-none flex-1 transition-all ${
                            pendingBranchChanges[user.uid] !== undefined ? 'bg-blue-50 ring-2 ring-blue-100' : 'bg-gray-100'
                          }`}
                        >
                          <option value="">-- {user.role === 'bos' ? 'Pusat (Global)' : 'Belum Ditempatkan'} --</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                        {pendingBranchChanges[user.uid] !== undefined && (
                          <button
                            onClick={() => handleSaveBranchChange(user.uid)}
                            className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 font-medium w-16">WhatsApp:</span>
                      <div className="flex-1 flex items-center gap-2 max-w-[250px]">
                        {editingPhone?.uid === user.uid ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="62812345678"
                              className="flex-1 px-2 py-1.5 text-xs bg-white border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                              value={editingPhone.phone}
                              onChange={(e) => setEditingPhone({ ...editingPhone, phone: e.target.value.replace(/\D/g, '') })}
                              autoFocus
                            />
                            <button
                              onClick={() => handlePhoneChange(user.uid, editingPhone.phone)}
                              className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingPhone({ uid: user.uid, phone: user.phone || '' })}
                            className="flex-1 flex items-center justify-between px-2 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-700 hover:bg-gray-200 transition-all group"
                          >
                            <span className={user.phone ? 'font-medium' : 'text-gray-400 italic'}>
                              {user.phone || 'Belum diatur'}
                            </span>
                            <Phone className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />
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
        title={deleteConfirm.type === 'user' ? 'Hapus Anggota Tim' : 'Hapus Cabang'}
        message={`Apakah Anda yakin ingin menghapus ${deleteConfirm.type === 'user' ? 'anggota' : 'cabang'} ${deleteConfirm.name}? Data yang dihapus tidak dapat dikembalikan.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: 'user', id: '', name: '' })}
      />
    </div>
  );
}
