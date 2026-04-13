import React, { useState } from 'react';
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

  const [amountInput, setAmountInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [typeInput, setTypeInput] = useState<'deposit' | 'withdraw'>('deposit');

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'person' | 'transaction'; personId: string; transactionId?: string; name: string }>({
    isOpen: false,
    type: 'person',
    personId: '',
    name: ''
  });

  if (!store.isLoaded) return null;

  const [isAddingPerson, setIsAddingPerson] = useState(false);

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

  const filteredSavings = store.savings.filter(s => s.personName.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalAllSavings = store.getTotalSavings();

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-3xl shadow-lg border border-emerald-400 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <PiggyBank className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Total Semua Tabungan</p>
        </div>
        <p className="text-3xl font-bold tracking-tight">{formatRupiah(totalAllSavings)}</p>
        <p className="text-[10px] text-emerald-100 mt-2 opacity-80">Akumulasi dari {store.savings.length} penabung</p>
      </div>

      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-gray-900">Daftar Penabung</h3>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {canEdit && (
          <div className="p-4 border-b border-gray-50 space-y-3">
            <form onSubmit={handleAddPerson} className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <PiggyBank className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nama Penabung Baru"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 font-medium"
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
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 font-medium"
                    value={newPersonPhone}
                    onChange={(e) => setNewPersonPhone(e.target.value)}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isAddingPerson}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isAddingPerson ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Tambah Penabung'
                )}
              </button>
            </form>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari penabung..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {!canEdit && (
          <div className="p-4 border-b border-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari penabung..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="divide-y divide-gray-50">
          {filteredSavings.length === 0 ? (
            <div className="text-center py-10">
              <PiggyBank className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Tidak ada data penabung.</p>
              {role === 'karyawan' && !branchId && (
                <p className="text-xs text-rose-500 mt-2">Anda belum ditempatkan di cabang mana pun. Hubungi Bos.</p>
              )}
            </div>
          ) : (
            filteredSavings.map((person) => {
              const total = store.getPersonTotalSavings(person);
              const initials = person.personName.substring(0, 2).toUpperCase();
              return (
                <div key={person.id} className="flex items-center p-3 hover:bg-gray-50 transition-colors group">
                  <div 
                    className="flex-1 flex items-center gap-3 cursor-pointer min-w-0"
                    onClick={() => setSelectedPersonId(person.id)}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-gray-900 leading-tight">{person.personName}</h3>
                          {(role === 'bos' || role === 'mandor') && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded whitespace-nowrap">
                              {store.branches.find(b => b.id === person.branchId)?.name || 'Tanpa Cabang'}
                            </span>
                          )}
                        </div>
                        {person.phone && (
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">{person.phone}</p>
                        )}
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {person.transactions.length} transaksi
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className={`text-sm font-bold ${total > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {formatRupiah(total)}
                      </p>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, type: 'person', personId: person.id, name: person.personName })}
                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
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
