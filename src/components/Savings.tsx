import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { formatRupiah, formatDate, formatNumberInput } from '../utils/formatters';
import { PiggyBank, Plus, Trash2, ArrowDownToLine, ArrowUpFromLine, ArrowLeft, Search, CheckCircle2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { SuccessToast } from './SuccessToast';

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

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'person' | 'transaction'; personId: string; transactionId?: string; name: string }>({
    isOpen: false,
    type: 'person',
    personId: '',
    name: ''
  });

  const [activeMainTab, setActiveMainTab] = useState<'savers' | 'history'>('savers');

  // Optimize calculations with useMemo
  const savingsWithTotals = useMemo(() => {
    return store.savings.map(person => ({
      ...person,
      totalSavings: store.getPersonTotalSavings(person)
    }));
  }, [store.savings, store.getPersonTotalSavings]);

  const globalTransactionHistory = useMemo(() => {
    const allTxs = store.savings.flatMap(person => 
      person.transactions.map(tx => ({
        ...tx,
        personId: person.id,
        personName: person.personName,
        branchId: person.branchId
      }))
    );
    return allTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [store.savings]);

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
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPersonName.trim() && !isAddingPerson) {
      setIsAddingPerson(true);
      try {
        await store.addSavingCustomer(newPersonName, newPersonPhone);
        setSuccessMsg(`Nasabah ${newPersonName} berhasil ditambah`);
        setShowSuccess(true);
        setNewPersonName('');
        setNewPersonPhone('');
      } finally {
        setIsAddingPerson(false);
      }
    }
  };

  const selectedPerson = store.savings.find(s => s.id === selectedPersonId);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId || !amountInput || !descInput || isAddingTransaction) return;
    
    const val = parseInt(amountInput.replace(/\D/g, ''), 10);
    if (!isNaN(val) && val > 0) {
      setIsAddingTransaction(true);
      try {
        await store.addSavingTransaction(selectedPersonId, val, descInput, typeInput);
        setSuccessMsg(`Transaksi ${typeInput === 'deposit' ? 'Nabung' : 'Tarik'} berhasil`);
        setShowSuccess(true);
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
      <div className="flex flex-col min-h-full bg-asphalt-900 pb-32">
        <header className="bg-asphalt-800 px-5 py-4 flex items-center gap-4 shadow-xl border-b border-asphalt-700/50 sticky top-0 z-20">
          <button 
            onClick={() => setSelectedPersonId(null)}
            className="p-2.5 -ml-2 bg-asphalt-700/50 hover:bg-asphalt-700 rounded-2xl transition-all text-asphalt-text-100"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5px]" />
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-black text-white uppercase tracking-tight">{selectedPerson.personName}</h2>
            <p className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest leading-none mt-0.5">{selectedPerson.phone || 'GOPAY USER'}</p>
          </div>
        </header>

        <div className="p-5 space-y-6">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-500/20 text-center text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-emerald-100/80 uppercase tracking-[0.25em] mb-2">Total Tabungan</p>
              <p className="text-4xl font-black tracking-tighter">
                {formatRupiah(totalSavings)}
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="bg-asphalt-800 rounded-[2.5rem] shadow-2xl border border-asphalt-700/50 overflow-hidden">
              <div className="p-6 bg-asphalt-900/40 border-b border-asphalt-700/50">
                <form onSubmit={handleAddTransaction} className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <select
                      className="px-4 py-3.5 text-xs bg-asphalt-800 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-white font-black uppercase tracking-widest"
                      value={typeInput}
                      onChange={(e) => setTypeInput(e.target.value as 'deposit' | 'withdraw')}
                    >
                      <option value="deposit">NABUNG</option>
                      <option value="withdraw">TARIK</option>
                    </select>
                    <div className="relative col-span-2">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-asphalt-text-400 text-xs font-black">Rp</span>
                      <input
                        type="text"
                        placeholder="0"
                        inputMode="numeric"
                        className="w-full pl-10 pr-4 py-3.5 text-sm bg-asphalt-800 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-white font-black"
                        value={formatNumberInput(amountInput)}
                        onChange={(e) => handleNumericInput(e, setAmountInput)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Keterangan (ex: Tabungan Lebaran)"
                      className="flex-1 px-5 py-3.5 text-sm bg-asphalt-800 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-white font-medium"
                      value={descInput}
                      onChange={(e) => setDescInput(e.target.value)}
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={isAddingTransaction}
                      className={`w-14 h-14 rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg active:scale-95 disabled:opacity-50 ${typeInput === 'deposit' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'}`}
                    >
                      {isAddingTransaction ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Plus className="w-6 h-6 text-white stroke-[3px]" />
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <div className="overflow-x-auto">
                {selectedPerson.transactions.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center opacity-20">
                    <PiggyBank className="w-12 h-12 text-asphalt-text-400 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-asphalt-text-400">Belum ada transaksi</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-asphalt-900/40 border-b border-asphalt-700/50 text-[9px] font-black text-asphalt-text-400 uppercase tracking-widest">
                        <th className="p-4 whitespace-nowrap">Tanggal</th>
                        <th className="p-4">Keterangan</th>
                        <th className="p-4 text-right">In/Out</th>
                        <th className="p-4 text-right">Saldo</th>
                        <th className="p-1"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-asphalt-700/50 text-xs">
                      {(() => {
                        let runningBalance = 0;
                        const txsWithBalance = [...selectedPerson.transactions].map(tx => {
                          if (tx.type === 'deposit') runningBalance += tx.amount;
                          else runningBalance -= tx.amount;
                          return { ...tx, balance: runningBalance };
                        });
                        
                        return txsWithBalance.reverse().map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-asphalt-700/20 transition-all group">
                            <td className="p-4 whitespace-nowrap">
                              <p className="text-white font-bold">{formatDate(transaction.date).split(' ')[0]}</p>
                              <p className="text-[9px] text-asphalt-text-400">{formatDate(transaction.date).split(' ')[1]}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-black text-white uppercase tracking-tight line-clamp-1">{transaction.description}</p>
                              {transaction.createdByName && (
                                <p className="text-[8px] text-brand-500 font-black uppercase tracking-widest mt-0.5">{transaction.createdByName}</p>
                              )}
                            </td>
                            <td className={`p-4 text-right font-black ${transaction.type === 'deposit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {transaction.type === 'deposit' ? '+' : '-'}{formatRupiah(transaction.amount)}
                            </td>
                            <td className="p-4 text-right font-black text-white">
                              {formatRupiah(transaction.balance)}
                            </td>
                            <td className="p-2 text-center">
                              {canEdit && (
                                <button
                                  onClick={() => setDeleteConfirm({ isOpen: true, type: 'transaction', personId: selectedPerson.id, transactionId: transaction.id, name: transaction.description })}
                                  className="p-1.5 text-asphalt-text-400 hover:text-rose-500 transition-all"
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
            <div className="bg-asphalt-800 rounded-[2.5rem] shadow-2xl border border-asphalt-700/50 overflow-hidden">
              <div className="overflow-x-auto">
                {selectedPerson.transactions.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center opacity-20">
                    <PiggyBank className="w-12 h-12 text-asphalt-text-400 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-asphalt-text-400">Belum ada transaksi</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-asphalt-900/40 border-b border-asphalt-700/50 text-[9px] font-black text-asphalt-text-400 uppercase tracking-widest">
                        <th className="p-4 whitespace-nowrap">Tanggal</th>
                        <th className="p-4">Keterangan</th>
                        <th className="p-4 text-right">In/Out</th>
                        <th className="p-4 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-asphalt-700/50 text-xs text-white">
                      {(() => {
                        let runningBalance = 0;
                        const txsWithBalance = [...selectedPerson.transactions].map(tx => {
                          if (tx.type === 'deposit') runningBalance += tx.amount;
                          else runningBalance -= tx.amount;
                          return { ...tx, balance: runningBalance };
                        });
                        return txsWithBalance.reverse().map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-asphalt-700/20 transition-all">
                            <td className="p-4 whitespace-nowrap text-asphalt-text-100 font-bold">
                              {formatDate(transaction.date)}
                            </td>
                            <td className="p-4">
                              <p className="font-black uppercase tracking-tight">{transaction.description}</p>
                              {transaction.createdByName && (
                                <p className="text-[8px] text-brand-500 font-black uppercase tracking-widest mt-0.5">{transaction.createdByName}</p>
                              )}
                            </td>
                            <td className={`p-4 text-right font-black ${transaction.type === 'deposit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {transaction.type === 'deposit' ? '+' : '-'}{formatRupiah(transaction.amount)}
                            </td>
                            <td className="p-4 text-right font-black">
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

        <SuccessToast 
          show={showSuccess} 
          message={successMsg} 
          onClose={() => setShowSuccess(false)} 
        />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-7 bg-asphalt-900 min-h-full pb-32">
      {/* Summary Header */}
      <div className="bg-asphalt-800 rounded-[2.5rem] p-7 border border-asphalt-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-emerald-500 font-black text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-white/10">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-asphalt-text-400">Total Tabungan</p>
              <div className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2 py-0.5 rounded-lg border border-emerald-500/20 inline-block uppercase tracking-tighter mt-1">
                Asset: Aktif
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-[0.25em]">
              Tabungan Terkumpul
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-emerald-500">Rp</span>
              <p className="text-4xl font-black tracking-tighter text-white">
                {totalAllSavings.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          
          <div className="pt-6 border-t border-asphalt-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {[...Array(Math.min(3, filteredSavings.length))].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-xl border-2 border-asphalt-800 bg-asphalt-700 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700"></div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-asphalt-text-100 font-black uppercase tracking-tight">
                {filteredSavings.length} Nasabah
              </p>
            </div>
            <div className="px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <p className="text-[8px] font-black text-emerald-500 uppercase">Terjamin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <div className="flex bg-asphalt-800 p-1.5 rounded-2xl border border-asphalt-700/50 shadow-lg">
            <button
              onClick={() => setActiveMainTab('savers')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${activeMainTab === 'savers' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-asphalt-text-400 hover:text-white'}`}
            >
              NASABAH
            </button>
            <button
              onClick={() => setActiveMainTab('history')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${activeMainTab === 'history' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-asphalt-text-400 hover:text-white'}`}
            >
              RIWAYAT
            </button>
          </div>
          {activeMainTab === 'savers' && (
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-[10px] font-black text-asphalt-text-400 bg-asphalt-800 border border-asphalt-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 uppercase tracking-widest"
            >
              <option value="latest">TERBARU</option>
              <option value="name">A-Z</option>
              <option value="amount">SALDO</option>
            </select>
          )}
        </div>

        <div className="bg-asphalt-800 rounded-[2.5rem] shadow-2xl border border-asphalt-700/50 overflow-hidden">
          {activeMainTab === 'savers' ? (
            <>
              {canEdit && (
                <div className="p-6 bg-asphalt-900/40 border-b border-asphalt-700/50 space-y-5">
                  <form onSubmit={handleAddPerson} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <PiggyBank className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-asphalt-text-400" />
                        <input
                          type="text"
                          placeholder="Nama Nasabah"
                          className="w-full pl-10 pr-4 py-3.5 text-sm bg-asphalt-800 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-white font-black placeholder:text-asphalt-text-400/30"
                          value={newPersonName}
                          onChange={(e) => setNewPersonName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="tel"
                          placeholder="No. Telepon"
                          inputMode="numeric"
                          className="w-full px-4 py-3.5 text-sm bg-asphalt-800 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-white font-black placeholder:text-asphalt-text-400/30"
                          value={newPersonPhone}
                          onChange={(e) => setNewPersonPhone(e.target.value)}
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isAddingPerson}
                      className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                    >
                      {isAddingPerson ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Plus className="w-5 h-5 stroke-[3px]" />
                          <span>NASABAH BARU</span>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-asphalt-text-400" />
                    <input
                      type="text"
                      placeholder="Cari nama nasabah..."
                      className="w-full pl-11 pr-4 py-3.5 text-sm bg-asphalt-800 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-white font-medium"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="divide-y divide-asphalt-700/50">
                {filteredSavings.length === 0 ? (
                  <div className="text-center py-20 bg-asphalt-800/50">
                    <div className="w-20 h-20 bg-asphalt-900 rounded-[2rem] flex items-center justify-center mx-auto mb-5 border border-asphalt-700/50">
                      <PiggyBank className="w-10 h-10 text-asphalt-700" />
                    </div>
                    <p className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest">Tidak ada data nasabah</p>
                  </div>
                ) : (
                  filteredSavings.map((person) => {
                    const total = person.totalSavings;
                    const initials = person.personName.substring(0, 2).toUpperCase();
                    const colors = ['from-emerald-500 to-emerald-600', 'from-brand-500 to-brand-600', 'from-rose-500 to-rose-600'];
                    const colorIndex = person.personName.length % colors.length;
                    const avatarColor = colors[colorIndex];

                    return (
                      <div key={person.id} className="flex items-center p-5 hover:bg-asphalt-700/20 transition-all group active:bg-asphalt-700/40">
                        <div className="flex-1 flex items-center gap-4 cursor-pointer min-w-0" onClick={() => setSelectedPersonId(person.id)}>
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg border border-white/10 group-hover:scale-110 transition-all duration-300`}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-black text-white leading-tight truncate uppercase tracking-tight">{person.personName}</h3>
                              {(role === 'bos' || role === 'mandor') && (
                                <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md uppercase tracking-wider border border-emerald-500/20">
                                  {store.branches.find(b => b.id === person.branchId)?.name || 'Central'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {person.phone && <p className="text-[9px] text-asphalt-text-400 font-black tracking-widest">{person.phone}</p>}
                              {person.phone && <span className="w-1 h-1 bg-asphalt-700 rounded-full"></span>}
                              <p className="text-[9px] text-asphalt-text-400 font-black tracking-widest uppercase">{person.transactions.length} Aktivitas</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-5 shrink-0">
                          <div className="text-right">
                            <p className={`text-base font-black ${total > 0 ? 'text-emerald-500' : 'text-white'}`}>
                              {formatRupiah(total)}
                            </p>
                          </div>
                          {canEdit && (
                            <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'person', personId: person.id, name: person.personName })} className="p-2.5 text-asphalt-text-400 hover:text-rose-500 bg-asphalt-700/30 rounded-xl transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="divide-y divide-asphalt-700/50">
              {globalTransactionHistory.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest">Belum ada riwayat transaksi</p>
                </div>
              ) : (
                globalTransactionHistory.map((tx) => (
                  <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-asphalt-700/20 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${tx.type === 'deposit' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                        {tx.type === 'deposit' ? <ArrowDownToLine className="w-5 h-5" /> : <ArrowUpFromLine className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-0.5">
                          <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">{tx.personName}</h4>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${tx.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                            {tx.type === 'deposit' ? 'NABUNG' : 'TARIK'}
                          </span>
                        </div>
                        <p className="text-[10px] text-asphalt-text-400 font-medium truncate">{tx.description}</p>
                        <p className="text-[8px] text-brand-500 font-black uppercase tracking-widest mt-1">
                          {formatDate(tx.date)} • {tx.createdByName || 'SYSTEM'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-black ${tx.type === 'deposit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </p>
                      {(role === 'bos' || role === 'mandor') && tx.branchId && (
                        <p className="text-[8px] font-black text-asphalt-text-400 uppercase tracking-tighter mt-1">
                          {store.branches.find(b => b.id === tx.branchId)?.name || 'Pusat'}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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
            setSuccessMsg("Penabung berhasil dihapus");
          } else if (deleteConfirm.transactionId) {
            store.deleteSavingTransaction(deleteConfirm.personId, deleteConfirm.transactionId);
            setSuccessMsg("Transaksi berhasil dihapus");
          }
          setShowSuccess(true);
          setDeleteConfirm({ isOpen: false, type: 'person', personId: '', name: '' });
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: 'person', personId: '', name: '' })}
      />

      <SuccessToast 
        show={showSuccess} 
        message={successMsg} 
        onClose={() => setShowSuccess(false)} 
      />
    </div>
  );
}
