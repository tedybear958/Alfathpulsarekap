import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { formatRupiah, formatDate, formatNumberInput } from '../utils/formatters';
import { PiggyBank, Plus, Trash2, ArrowDownToLine, ArrowUpFromLine, ArrowLeft, Search } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export function Savings() {
  const store = useFinanceStore();
  const { role, branchId } = useAuthStore();
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonPhone, setNewPersonPhone] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'latest'>('latest');

  const [amountInput, setAmountInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [typeInput, setTypeInput] = useState<'deposit' | 'withdraw'>('deposit');

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'person' | 'transaction'; personId: string; transactionId?: string; name: string }>({
    isOpen: false,
    type: 'person',
    personId: '',
    name: ''
  });

  // Optimize calculations with useMemo
  const savingsWithTotals = useMemo(() => {
    return store.savings.map(person => ({
      ...person,
      totalSavings: store.getPersonTotalSavings(person)
    }));
  }, [store.savings, store.getPersonTotalSavings]);

  const filteredSavings = useMemo(() => {
    return savingsWithTotals
      .filter(s => s.personName.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'name') return a.personName.localeCompare(b.personName);
        if (sortBy === 'amount') return b.totalSavings - a.totalSavings;
        return 0;
      });
  }, [savingsWithTotals, searchQuery, sortBy]);

  const totalAllSavings = useMemo(() => store.getTotalSavings(), [store.getTotalSavings]);

  const [isAddingPerson, setIsAddingPerson] = useState(false);

  if (!store.isLoaded) return null;

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPersonName.trim() && !isAddingPerson) {
      setIsAddingPerson(true);
      try {
        await store.addSavingCustomer(newPersonName, newPersonPhone);
        setNewPersonName('');
        setNewPersonPhone('');
      } finally {
        setIsAddingPerson(false);
      }
    }
  };

  const selectedPerson = store.savings.find(s => s.id === selectedPersonId);

  const [isAddingTransaction, setIsAddingTransaction] = useState(false);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId || !amountInput || !descInput || isAddingTransaction) return;
    
    const val = parseInt(amountInput.replace(/\D/g, ''), 10);
    if (!isNaN(val) && val > 0) {
      setIsAddingTransaction(true);
      try {
        await store.addSavingTransaction(selectedPersonId, val, descInput, typeInput);
        setAmountInput('');
        setDescInput('');
      } finally {
        setIsAddingTransaction(false);
      }
    }
  };

  const canEdit = !!branchId;

  if (selectedPerson) {
    const totalSavings = store.getPersonTotalSavings(selectedPerson);
    
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <header className="bg-white px-4 py-3 flex items-center gap-3 shadow-sm sticky top-0 z-10">
          <button 
            onClick={() => setSelectedPersonId(null)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">{selectedPerson.personName}</h2>
            <p className="text-[10px] text-gray-500">{selectedPerson.phone || 'Tidak ada nomor telepon'}</p>
          </div>
        </header>

        <div className="p-4 space-y-4">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-3xl shadow-lg border border-emerald-500 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="relative z-10">
              <p className="text-xs text-emerald-100 mb-1">Total Tabungan Saat Ini</p>
              <p className="text-3xl font-bold tracking-tight">
                {formatRupiah(totalSavings)}
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                <form onSubmit={handleAddTransaction} className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      className="w-1/3 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                      value={typeInput}
                      onChange={(e) => setTypeInput(e.target.value as 'deposit' | 'withdraw')}
                    >
                      <option value="deposit">Nabung</option>
                      <option value="withdraw">Tarik</option>
                    </select>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                      <input
                        type="text"
                        placeholder="0"
                        inputMode="numeric"
                        className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                        value={formatNumberInput(amountInput)}
                        onChange={(e) => setAmountInput(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Keterangan (ex: Tabungan Lebaran)"
                      className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      value={descInput}
                      onChange={(e) => setDescInput(e.target.value)}
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={isAddingTransaction}
                      className={`px-4 py-2.5 text-white rounded-xl font-medium flex items-center justify-center transition-colors disabled:opacity-50 ${typeInput === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                    >
                      {isAddingTransaction ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <div className="overflow-x-auto">
                {selectedPerson.transactions.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-8">Belum ada transaksi.</p>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-500 uppercase tracking-wider">
                        <th className="p-3 font-medium whitespace-nowrap">Tanggal</th>
                        <th className="p-3 font-medium">Keterangan</th>
                        <th className="p-3 font-medium text-right">Masuk</th>
                        <th className="p-3 font-medium text-right">Keluar</th>
                        <th className="p-3 font-medium text-right">Saldo</th>
                        <th className="p-3 font-medium text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                      {(() => {
                        let runningBalance = 0;
                        // Calculate running balance from oldest to newest
                        const txsWithBalance = [...selectedPerson.transactions].map(tx => {
                          if (tx.type === 'deposit') runningBalance += tx.amount;
                          else runningBalance -= tx.amount;
                          return { ...tx, balance: runningBalance };
                        });
                        
                        // Reverse for display (newest first)
                        return txsWithBalance.reverse().map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3 text-gray-500 whitespace-nowrap">
                              {formatDate(transaction.date).split(' ')[0]}
                              <div className="text-[9px] text-gray-400">{formatDate(transaction.date).split(' ')[1]}</div>
                            </td>
                            <td className="p-3">
                              <p className="font-medium text-gray-900">{transaction.description}</p>
                              {transaction.createdByName && (
                                <p className="text-[9px] text-gray-400 mt-0.5">Oleh: {transaction.createdByName}</p>
                              )}
                            </td>
                            <td className="p-3 text-right font-medium text-emerald-600">
                              {transaction.type === 'deposit' ? formatRupiah(transaction.amount) : '-'}
                            </td>
                            <td className="p-3 text-right font-medium text-rose-600">
                              {transaction.type === 'withdraw' ? formatRupiah(transaction.amount) : '-'}
                            </td>
                            <td className="p-3 text-right font-bold text-gray-900">
                              {formatRupiah(transaction.balance)}
                            </td>
                            <td className="p-3 text-center">
                              {canEdit && (
                                <button
                                  onClick={() => setDeleteConfirm({ isOpen: true, type: 'transaction', personId: selectedPerson.id, transactionId: transaction.id, name: transaction.description })}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors inline-flex"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {!canEdit && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                {selectedPerson.transactions.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-8">Belum ada transaksi.</p>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-500 uppercase tracking-wider">
                        <th className="p-3 font-medium whitespace-nowrap">Tanggal</th>
                        <th className="p-3 font-medium">Keterangan</th>
                        <th className="p-3 font-medium text-right">Masuk</th>
                        <th className="p-3 font-medium text-right">Keluar</th>
                        <th className="p-3 font-medium text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                      {(() => {
                        let runningBalance = 0;
                        const txsWithBalance = [...selectedPerson.transactions].map(tx => {
                          if (tx.type === 'deposit') runningBalance += tx.amount;
                          else runningBalance -= tx.amount;
                          return { ...tx, balance: runningBalance };
                        });
                        return txsWithBalance.reverse().map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3 text-gray-500 whitespace-nowrap">
                              {formatDate(transaction.date).split(' ')[0]}
                              <div className="text-[9px] text-gray-400">{formatDate(transaction.date).split(' ')[1]}</div>
                            </td>
                            <td className="p-3">
                              <p className="font-medium text-gray-900">{transaction.description}</p>
                              {transaction.createdByName && (
                                <p className="text-[9px] text-gray-400 mt-0.5">Oleh: {transaction.createdByName}</p>
                              )}
                            </td>
                            <td className="p-3 text-right font-medium text-emerald-600">
                              {transaction.type === 'deposit' ? formatRupiah(transaction.amount) : '-'}
                            </td>
                            <td className="p-3 text-right font-medium text-rose-600">
                              {transaction.type === 'withdraw' ? formatRupiah(transaction.amount) : '-'}
                            </td>
                            <td className="p-3 text-right font-bold text-gray-900">
                              {formatRupiah(transaction.balance)}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title={deleteConfirm.type === 'person' ? 'Hapus Penabung' : 'Hapus Transaksi'}
          message={`Apakah Anda yakin ingin menghapus ${deleteConfirm.type === 'person' ? 'penabung' : 'transaksi'} ${deleteConfirm.name}? Data yang dihapus tidak dapat dikembalikan.`}
          onConfirm={() => {
            if (deleteConfirm.type === 'person') {
              store.deleteSavingCustomer(deleteConfirm.personId);
              if (selectedPersonId === deleteConfirm.personId) setSelectedPersonId(null);
            } else if (deleteConfirm.transactionId) {
              store.deleteSavingTransaction(deleteConfirm.personId, deleteConfirm.transactionId);
            }
          }}
          onCancel={() => setDeleteConfirm({ isOpen: false, type: 'person', personId: '', name: '' })}
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Summary Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 rounded-[2rem] p-7 text-white shadow-xl shadow-emerald-200/50 relative overflow-hidden border border-emerald-500/20">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30">
              <PiggyBank className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/80">Status Tabungan</p>
              <p className="text-xs font-bold text-white">Nasabah Aktif</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-emerald-100 uppercase tracking-wider opacity-80">
              Total Semua Tabungan
            </h3>
            <p className="text-4xl font-black tracking-tighter">
              {formatRupiah(totalAllSavings)}
            </p>
          </div>
          
          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[...Array(Math.min(3, filteredSavings.length))].map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-emerald-700 bg-emerald-400/50 backdrop-blur-sm"></div>
                ))}
              </div>
              <p className="text-[10px] text-emerald-100 font-bold">
                {filteredSavings.length} Penabung Terdaftar
              </p>
            </div>
            <div className="px-2 py-1 bg-emerald-500/30 rounded-lg backdrop-blur-sm border border-white/10">
              <p className="text-[9px] font-black text-white uppercase">Aman & Terjamin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-emerald-600 rounded-full"></div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Daftar Penabung</h3>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-[10px] font-bold text-gray-500 bg-gray-100 border-none rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="latest">Terbaru</option>
              <option value="name">Nama A-Z</option>
              <option value="amount">Saldo Terbesar</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          {canEdit && (
            <div className="p-5 border-b border-gray-50 space-y-4 bg-gray-50/30">
              <form onSubmit={handleAddPerson} className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <PiggyBank className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nama Penabung Baru"
                      className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold shadow-sm placeholder:font-medium"
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      placeholder="Nomor Telepon"
                      inputMode="numeric"
                      className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold shadow-sm placeholder:font-medium"
                      value={newPersonPhone}
                      onChange={(e) => setNewPersonPhone(e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isAddingPerson}
                  className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl text-sm font-black hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  {isAddingPerson ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>TAMBAH PENABUNG</span>
                    </>
                  )}
                </button>
              </form>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama penabung..."
                  className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {!canEdit && (
            <div className="p-5 border-b border-gray-50 bg-gray-50/30">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama penabung..."
                  className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {filteredSavings.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PiggyBank className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-sm font-bold text-gray-400">Tidak ada data penabung.</p>
                {role === 'karyawan' && !branchId && (
                  <p className="text-xs text-rose-500 mt-2 font-medium px-10">Anda belum ditempatkan di cabang mana pun. Hubungi Bos.</p>
                )}
              </div>
            ) : (
              filteredSavings.map((person) => {
                const total = person.totalSavings;
                const initials = person.personName.substring(0, 2).toUpperCase();
                
                // Varied colors for avatars
                const colors = [
                  'from-emerald-500 to-emerald-600',
                  'from-blue-500 to-blue-600',
                  'from-teal-500 to-teal-600',
                  'from-cyan-500 to-cyan-600',
                  'from-indigo-500 to-indigo-600',
                  'from-violet-500 to-violet-600'
                ];
                const colorIndex = person.personName.length % colors.length;
                const avatarColor = colors[colorIndex];

                return (
                  <div key={person.id} className="flex items-center p-4 hover:bg-gray-50/80 transition-all group active:bg-gray-100">
                    <div 
                      className="flex-1 flex items-center gap-4 cursor-pointer min-w-0"
                      onClick={() => setSelectedPersonId(person.id)}
                    >
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-sm font-black text-gray-900 leading-tight truncate">{person.personName}</h3>
                            {(role === 'bos' || role === 'mandor') && (
                              <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md uppercase tracking-wider border border-emerald-100">
                                {store.branches.find(b => b.id === person.branchId)?.name || 'Tanpa Cabang'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {person.phone && (
                              <p className="text-[10px] text-gray-400 font-bold">{person.phone}</p>
                            )}
                            {person.phone && <span className="w-1 h-1 bg-gray-300 rounded-full"></span>}
                            <p className="text-[10px] text-gray-400 font-bold">
                              {person.transactions.length} Transaksi
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className={`text-sm font-black ${total > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                          {formatRupiah(total)}
                        </p>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, type: 'person', personId: person.id, name: person.personName })}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.type === 'person' ? 'Hapus Penabung' : 'Hapus Transaksi'}
        message={`Apakah Anda yakin ingin menghapus ${deleteConfirm.type === 'person' ? 'penabung' : 'transaksi'} ${deleteConfirm.name}? Data yang dihapus tidak dapat dikembalikan.`}
        onConfirm={() => {
          if (deleteConfirm.type === 'person') {
            store.deleteSavingCustomer(deleteConfirm.personId);
            if (selectedPersonId === deleteConfirm.personId) setSelectedPersonId(null);
          } else if (deleteConfirm.transactionId) {
            store.deleteSavingTransaction(deleteConfirm.personId, deleteConfirm.transactionId);
          }
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: 'person', personId: '', name: '' })}
      />
    </div>
  );
}
