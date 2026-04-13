import React, { useState } from 'react';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { formatRupiah, formatDate, formatNumberInput } from '../utils/formatters';
import { Users, Plus, Trash2, ArrowDownToLine, ArrowUpFromLine, ArrowLeft, Search } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export function Debts() {
  const store = useFinanceStore();
  const { role, branchId } = useAuthStore();
  const [newPersonName, setNewPersonName] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [amountInput, setAmountInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [typeInput, setTypeInput] = useState<'add' | 'pay'>('add');

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'person' | 'detail'; personId: string; detailId?: string; name: string }>({
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
        await store.addDebtPerson(newPersonName);
        setNewPersonName('');
      } finally {
        setIsAddingPerson(false);
      }
    }
  };

  const selectedPerson = store.debts.find(d => d.id === selectedPersonId);

  const [isAddingDetail, setIsAddingDetail] = useState(false);

  const handleAddDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId || !amountInput || !descInput || isAddingDetail) return;
    
    const val = parseInt(amountInput.replace(/\D/g, ''), 10);
    if (!isNaN(val) && val > 0) {
      setIsAddingDetail(true);
      try {
        await store.addDebtDetail(selectedPersonId, val, descInput, typeInput);
        setAmountInput('');
        setDescInput('');
      } finally {
        setIsAddingDetail(false);
      }
    }
  };

  const canEdit = !!branchId;

  if (selectedPerson) {
    const totalDebt = store.getPersonTotalDebt(selectedPerson);
    
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
            <p className="text-[10px] text-gray-500">Detail Transaksi</p>
          </div>
        </header>

        <div className="p-4 space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
            <p className="text-xs text-gray-500 mb-1">Total Hutang Saat Ini</p>
            <p className={`text-3xl font-bold tracking-tight ${totalDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatRupiah(totalDebt)}
            </p>
          </div>

          {canEdit && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                <form onSubmit={handleAddDetail} className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      className="w-1/3 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                      value={typeInput}
                      onChange={(e) => setTypeInput(e.target.value as 'add' | 'pay')}
                    >
                      <option value="add">Bon</option>
                      <option value="pay">Bayar</option>
                    </select>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                      <input
                        type="text"
                        placeholder="0"
                        inputMode="numeric"
                        className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                        value={formatNumberInput(amountInput)}
                        onChange={(e) => setAmountInput(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Keterangan (ex: Rokok, Pulsa)"
                      className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={descInput}
                      onChange={(e) => setDescInput(e.target.value)}
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={isAddingDetail}
                      className={`px-4 py-2.5 text-white rounded-xl font-medium flex items-center justify-center transition-colors disabled:opacity-50 ${typeInput === 'add' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                    >
                      {isAddingDetail ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <div className="divide-y divide-gray-50">
                {selectedPerson.details.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-8">Belum ada transaksi.</p>
                ) : (
                  [...selectedPerson.details].reverse().map((detail) => (
                    <div key={detail.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${detail.type === 'add' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {detail.type === 'add' ? <ArrowUpFromLine className="w-4 h-4" /> : <ArrowDownToLine className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{detail.description}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(detail.date)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${detail.type === 'add' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {detail.type === 'add' ? '+' : '-'}{formatRupiah(detail.amount)}
                        </p>
                        {canEdit && (
                          <button
                            onClick={() => setDeleteConfirm({ isOpen: true, type: 'detail', personId: selectedPerson.id, detailId: detail.id, name: detail.description })}
                            className="text-[10px] text-gray-400 hover:text-red-500 mt-1 inline-block"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {!canEdit && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-50">
                {selectedPerson.details.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-8">Belum ada transaksi.</p>
                ) : (
                  [...selectedPerson.details].reverse().map((detail) => (
                    <div key={detail.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${detail.type === 'add' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {detail.type === 'add' ? <ArrowUpFromLine className="w-4 h-4" /> : <ArrowDownToLine className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{detail.description}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(detail.date)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${detail.type === 'add' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {detail.type === 'add' ? '+' : '-'}{formatRupiah(detail.amount)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title={deleteConfirm.type === 'person' ? 'Hapus Pelanggan' : 'Hapus Transaksi'}
          message={`Apakah Anda yakin ingin menghapus ${deleteConfirm.type === 'person' ? 'pelanggan' : 'transaksi'} ${deleteConfirm.name}? Data yang dihapus tidak dapat dikembalikan.`}
          onConfirm={() => {
            if (deleteConfirm.type === 'person') {
              store.deleteDebtPerson(deleteConfirm.personId);
              if (selectedPersonId === deleteConfirm.personId) setSelectedPersonId(null);
            } else if (deleteConfirm.detailId) {
              store.deleteDebtDetail(deleteConfirm.personId, deleteConfirm.detailId);
            }
          }}
          onCancel={() => setDeleteConfirm({ isOpen: false, type: 'person', personId: '', name: '' })}
        />
      </div>
    );
  }

  const filteredDebts = store.debts.filter(d => d.personName.toLowerCase().includes(searchQuery.toLowerCase()));

  const isBosGlobal = role === 'bos' && !branchId;
  const totalDebtAll = filteredDebts.reduce((sum, p) => sum + store.getPersonTotalDebt(p), 0);

  return (
    <div className="p-4 space-y-5">
      {/* Summary Header */}
      <div className="bg-gradient-to-br from-rose-600 to-rose-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1 opacity-90">
            <Users className="w-4 h-4" />
            <h3 className="text-sm font-medium">
              {isBosGlobal ? 'Total Bon (Semua Cabang)' : 'Total Bon Cabang Ini'}
            </h3>
          </div>
          <p className="text-3xl font-bold tracking-tight mb-1">
            {formatRupiah(totalDebtAll)}
          </p>
          <p className="text-[10px] text-rose-200 font-medium">
            Akumulasi dari {filteredDebts.length} pelanggan
          </p>
        </div>
      </div>

      {isBosGlobal && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">Total Bon Antar Cabang</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {store.branches.map(branch => {
              const branchDebts = store.debts.filter(d => d.branchId === branch.id);
              const branchTotal = branchDebts.reduce((sum, d) => sum + store.getPersonTotalDebt(d), 0);
              
              return (
                <div key={branch.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-900">{branch.name}</h4>
                  <p className="text-sm font-bold text-rose-600">{formatRupiah(branchTotal)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-gray-900">Daftar Pelanggan</h3>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {canEdit && (
          <div className="p-4 border-b border-gray-50 space-y-3">
            <form onSubmit={handleAddPerson} className="flex gap-2">
              <div className="relative flex-1">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nama Pelanggan Baru"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 font-medium"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isAddingPerson}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
              >
                {isAddingPerson ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Tambah'
                )}
              </button>
            </form>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari pelanggan..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
                placeholder="Cari pelanggan..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="divide-y divide-gray-50">
          {filteredDebts.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Tidak ada data pelanggan.</p>
              {role === 'karyawan' && !branchId && (
                <p className="text-xs text-rose-500 mt-2">Anda belum ditempatkan di cabang mana pun. Hubungi Bos.</p>
              )}
            </div>
          ) : (
            filteredDebts.map((person) => {
              const total = store.getPersonTotalDebt(person);
              const initials = person.personName.substring(0, 2).toUpperCase();
              return (
                <div key={person.id} className="flex items-center p-3 hover:bg-gray-50 transition-colors group">
                  <div 
                    className="flex-1 flex items-center gap-3 cursor-pointer min-w-0"
                    onClick={() => setSelectedPersonId(person.id)}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-gray-900 leading-tight">{person.personName}</h3>
                        {(role === 'bos' || role === 'mandor') && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded whitespace-nowrap">
                            {store.branches.find(b => b.id === person.branchId)?.name || 'Tanpa Cabang'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {person.details.length} transaksi
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className={`text-sm font-bold ${total > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
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
        title={deleteConfirm.type === 'person' ? 'Hapus Pelanggan' : 'Hapus Transaksi'}
        message={`Apakah Anda yakin ingin menghapus ${deleteConfirm.type === 'person' ? 'pelanggan' : 'transaksi'} ${deleteConfirm.name}? Data yang dihapus tidak dapat dikembalikan.`}
        onConfirm={() => {
          if (deleteConfirm.type === 'person') {
            store.deleteDebtPerson(deleteConfirm.personId);
            if (selectedPersonId === deleteConfirm.personId) setSelectedPersonId(null);
          } else if (deleteConfirm.detailId) {
            store.deleteDebtDetail(deleteConfirm.personId, deleteConfirm.detailId);
          }
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: 'person', personId: '', name: '' })}
      />
    </div>
  );
}
