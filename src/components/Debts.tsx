import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { formatRupiah, formatDate, formatNumberInput } from '../utils/formatters';
import { Users, Plus, Trash2, ArrowDownToLine, ArrowUpFromLine, ArrowLeft, Search, CheckCircle2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { SuccessToast } from './SuccessToast';

export function Debts() {
  const store = useFinanceStore();
  const { role, branchId } = useAuthStore();
  const [newPersonName, setNewPersonName] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'latest'>('latest');

  const [amountInput, setAmountInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [typeInput, setTypeInput] = useState<'add' | 'pay'>('add');

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

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'person' | 'detail'; personId: string; detailId?: string; name: string }>({
    isOpen: false,
    type: 'person',
    personId: '',
    name: ''
  });

  // Optimize calculations with useMemo
  const debtsWithTotals = useMemo(() => {
    return store.debts.map(person => ({
      ...person,
      totalDebt: store.getPersonTotalDebt(person)
    }));
  }, [store.debts, store.getPersonTotalDebt]);

  const filteredDebts = useMemo(() => {
    return debtsWithTotals
      .filter(d => d.personName.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'name') return a.personName.localeCompare(b.personName);
        if (sortBy === 'amount') return b.totalDebt - a.totalDebt;
        return 0; 
      });
  }, [debtsWithTotals, searchQuery, sortBy]);

  const branchDebtData = useMemo(() => {
    if (role !== 'bos' || branchId) return [];
    
    return [...store.branches]
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .map(branch => {
        const branchDebts = debtsWithTotals.filter(d => d.branchId === branch.id);
        const branchTotal = branchDebts.reduce((sum, d) => sum + d.totalDebt, 0);
        return { ...branch, branchTotal };
      });
  }, [role, branchId, store.branches, debtsWithTotals]);

  const isBosGlobal = role === 'bos' && !branchId;
  const totalDebtAll = useMemo(() => 
    filteredDebts.reduce((sum, p) => sum + p.totalDebt, 0)
  , [filteredDebts]);

  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [isAddingDetail, setIsAddingDetail] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPersonName.trim() && !isAddingPerson) {
      setIsAddingPerson(true);
      try {
        await store.addDebtPerson(newPersonName);
        setSuccessMsg(`Pelanggan ${newPersonName} berhasil ditambah`);
        setShowSuccess(true);
        setNewPersonName('');
      } finally {
        setIsAddingPerson(false);
      }
    }
  };

  const selectedPerson = store.debts.find(d => d.id === selectedPersonId);

  const handleAddDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId || !amountInput || !descInput || isAddingDetail) return;
    
    const val = parseInt(amountInput.replace(/\D/g, ''), 10);
    if (!isNaN(val) && val > 0) {
      setIsAddingDetail(true);
      try {
        await store.addDebtDetail(selectedPersonId, val, descInput, typeInput);
        setSuccessMsg(`Transaksi ${typeInput === 'add' ? 'Bon' : 'Bayar'} berhasil`);
        setShowSuccess(true);
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
                      className="w-1/3 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white font-medium"
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
                        className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white font-medium"
                        value={formatNumberInput(amountInput)}
                        onChange={(e) => handleNumericInput(e, setAmountInput)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Keterangan (ex: Rokok, Pulsa)"
                      className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white"
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

        <SuccessToast 
          show={showSuccess} 
          message={successMsg} 
          onClose={() => setShowSuccess(false)} 
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Summary Header */}
      <div className="bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900 rounded-[2rem] p-7 text-white shadow-xl shadow-rose-200/50 relative overflow-hidden border border-rose-500/20">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-100/80">Status Keuangan</p>
              <p className="text-xs font-bold text-white">Piutang Aktif</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-rose-100 uppercase tracking-wider opacity-80">
              {isBosGlobal ? 'Total Bon (Semua Cabang)' : 'Total Bon Cabang Ini'}
            </h3>
            <p className="text-4xl font-black tracking-tighter">
              {formatRupiah(totalDebtAll)}
            </p>
          </div>
          
          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[...Array(Math.min(3, filteredDebts.length))].map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-rose-700 bg-rose-400/50 backdrop-blur-sm"></div>
                ))}
              </div>
              <p className="text-[10px] text-rose-100 font-bold">
                {filteredDebts.length} Pelanggan Terdaftar
              </p>
            </div>
            <div className="px-2 py-1 bg-rose-500/30 rounded-lg backdrop-blur-sm border border-white/10">
              <p className="text-[9px] font-black text-white uppercase">Terverifikasi</p>
            </div>
          </div>
        </div>
      </div>

      {isBosGlobal && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-brand-600 rounded-full"></div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Total Bon Antar Cabang</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {branchDebtData.map(branch => {
              return (
                <div key={branch.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:border-brand-200 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                      <Users className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-black text-gray-700 uppercase">{branch.name}</h4>
                  </div>
                  <p className="text-sm font-black text-rose-600">{formatRupiah(branch.branchTotal)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-rose-600 rounded-full"></div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Daftar Pelanggan</h3>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-[10px] font-bold text-gray-500 bg-gray-100 border-none rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-rose-500"
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
              <form onSubmit={handleAddPerson} className="flex gap-2">
                <div className="relative flex-1">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nama Pelanggan Baru"
                    className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none bg-white font-bold shadow-sm placeholder:font-medium"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isAddingPerson}
                  className="px-6 py-3 bg-brand-600 text-white rounded-2xl text-sm font-black hover:bg-brand-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-brand-200 flex items-center justify-center min-w-[100px]"
                >
                  {isAddingPerson ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'TAMBAH'
                  )}
                </button>
              </form>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama pelanggan..."
                  className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none bg-white font-medium shadow-sm"
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
                  placeholder="Cari nama pelanggan..."
                  className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none bg-white font-medium shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {filteredDebts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-sm font-bold text-gray-400">Tidak ada data pelanggan.</p>
                {role === 'karyawan' && !branchId && (
                  <p className="text-xs text-rose-500 mt-2 font-medium px-10">Anda belum ditempatkan di cabang mana pun. Hubungi Bos.</p>
                )}
              </div>
            ) : (
              filteredDebts.map((person) => {
                const total = person.totalDebt;
                const initials = person.personName.substring(0, 2).toUpperCase();
                
                // Varied colors for avatars
                const colors = [
                  'from-brand-500 to-brand-600',
                  'from-rose-500 to-rose-600',
                  'from-emerald-500 to-emerald-600',
                  'from-amber-500 to-amber-600',
                  'from-indigo-500 to-indigo-600',
                  'from-purple-500 to-purple-600'
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
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-black text-gray-900 leading-tight truncate">{person.personName}</h3>
                          {(role === 'bos' || role === 'mandor') && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-brand-50 text-brand-600 rounded-md uppercase tracking-wider border border-brand-100">
                              {store.branches.find(b => b.id === person.branchId)?.name || 'Tanpa Cabang'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400">
                            {person.details.length} Transaksi
                          </span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span className="text-[10px] font-bold text-gray-400">
                            ID: {person.id.substring(0, 5).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className={`text-sm font-black ${total > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                          {formatRupiah(total)}
                        </p>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, type: 'person', personId: person.id, name: person.personName })}
                          className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
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
        title={deleteConfirm.type === 'person' ? 'Hapus Pelanggan' : 'Hapus Transaksi'}
        message={`Apakah Anda yakin ingin menghapus ${deleteConfirm.type === 'person' ? 'pelanggan' : 'transaksi'} ${deleteConfirm.name}? Data yang dihapus tidak dapat dikembalikan.`}
        onConfirm={() => {
          if (deleteConfirm.type === 'person') {
            store.deleteDebtPerson(deleteConfirm.personId);
            if (selectedPersonId === deleteConfirm.personId) setSelectedPersonId(null);
            setSuccessMsg("Pelanggan berhasil dihapus");
          } else if (deleteConfirm.detailId) {
            store.deleteDebtDetail(deleteConfirm.personId, deleteConfirm.detailId);
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
