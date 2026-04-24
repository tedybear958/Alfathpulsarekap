import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { formatRupiah, formatDate, formatNumberInput } from '../utils/formatters';
import { Users, Plus, Trash2, ArrowDownToLine, ArrowUpFromLine, ArrowLeft, Search, CheckCircle2, History as HistoryIcon } from 'lucide-react';
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

  const canEdit = role === 'bos' || !!branchId;
  const canDelete = !!branchId; // Hanya karyawan/mandor di cabang yang bisa hapus

  if (selectedPerson) {
    const totalDebt = store.getPersonTotalDebt(selectedPerson);
    
    return (
      <div className="flex flex-col min-h-full bg-asphalt-900 pb-40">
        <header className="bg-asphalt-800 px-5 py-4 flex items-center gap-4 shadow-xl border-b border-asphalt-700/50 sticky top-0 z-20">
          <button 
            onClick={() => setSelectedPersonId(null)}
            className="p-2.5 -ml-2 bg-asphalt-700/50 hover:bg-asphalt-700 rounded-2xl transition-all text-asphalt-text-100"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5px]" />
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-black text-white uppercase tracking-tight">{selectedPerson.personName}</h2>
            <p className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest">Detail Piutang</p>
          </div>
        </header>

        <div className="p-5 space-y-6">
          <div className="bg-asphalt-800 p-8 rounded-[2.5rem] shadow-2xl border border-asphalt-700/50 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            <p className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-[0.2em] mb-3 relative z-10">Total Hutang</p>
            <p className={`text-4xl font-black tracking-tighter relative z-10 transition-transform duration-500 group-hover:scale-110 ${totalDebt > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {formatRupiah(totalDebt)}
            </p>
          </div>

          {canEdit && (
            <div className="bg-asphalt-800 rounded-[2.5rem] shadow-2xl border border-asphalt-700/50 overflow-hidden">
              <div className="p-6 bg-asphalt-900/40 border-b border-asphalt-700/50">
                <form onSubmit={handleAddDetail} className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <select
                      className="px-4 py-3.5 text-xs bg-asphalt-800 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-white font-black uppercase tracking-widest"
                      value={typeInput}
                      onChange={(e) => setTypeInput(e.target.value as 'add' | 'pay')}
                    >
                      <option value="add">BON</option>
                      <option value="pay">BAYAR</option>
                    </select>
                    <div className="relative col-span-2">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-asphalt-text-400 text-xs font-black">Rp</span>
                      <input
                        type="text"
                        placeholder="0"
                        inputMode="numeric"
                        className="w-full pl-10 pr-4 py-3.5 text-sm bg-asphalt-800 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-white font-black"
                        value={formatNumberInput(amountInput)}
                        onChange={(e) => handleNumericInput(e, setAmountInput)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Keterangan (ex: Rokok, Pulsa)"
                      className="flex-1 px-5 py-3.5 text-sm bg-asphalt-800 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-white font-medium"
                      value={descInput}
                      onChange={(e) => setDescInput(e.target.value)}
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={isAddingDetail}
                      className={`w-14 h-14 rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg active:scale-95 disabled:opacity-50 ${typeInput === 'add' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'}`}
                    >
                      {isAddingDetail ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Plus className="w-6 h-6 text-white stroke-[3px]" />
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <div className="divide-y divide-asphalt-700/50">
                {selectedPerson.details.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center opacity-20">
                    <HistoryIcon className="w-12 h-12 text-asphalt-text-400 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-asphalt-text-400">Belum ada aktivitas</p>
                  </div>
                ) : (
                  [...selectedPerson.details].reverse().map((detail) => (
                    <div key={detail.id} className="p-5 flex items-center gap-4 hover:bg-asphalt-700/20 transition-all group">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${detail.type === 'add' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                        {detail.type === 'add' ? <ArrowUpFromLine className="w-5 h-5" /> : <ArrowDownToLine className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white truncate uppercase tracking-tight">{detail.description}</p>
                        <p className="text-[9px] font-bold text-asphalt-text-400 uppercase tracking-widest mt-0.5">{formatDate(detail.date)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-base font-black ${detail.type === 'add' ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {detail.type === 'add' ? '+' : '-'}{formatRupiah(detail.amount)}
                        </p>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteConfirm({ isOpen: true, type: 'detail', personId: selectedPerson.id, detailId: detail.id, name: detail.description })}
                            className="text-[9px] font-black text-rose-500/50 hover:text-rose-500 uppercase tracking-widest mt-1 transition-all"
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
            <div className="bg-asphalt-800 rounded-[2.5rem] shadow-2xl border border-asphalt-700/50 overflow-hidden">
              <div className="divide-y divide-asphalt-700/50">
                {selectedPerson.details.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center opacity-20">
                    <HistoryIcon className="w-12 h-12 text-asphalt-text-400 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-asphalt-text-400">Belum ada aktivitas</p>
                  </div>
                ) : (
                  [...selectedPerson.details].reverse().map((detail) => (
                    <div key={detail.id} className="p-5 flex items-center gap-4 hover:bg-asphalt-700/20 transition-all">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${detail.type === 'add' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                        {detail.type === 'add' ? <ArrowUpFromLine className="w-5 h-5" /> : <ArrowDownToLine className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white truncate uppercase tracking-tight">{detail.description}</p>
                        <p className="text-[9px] font-bold text-asphalt-text-400 uppercase tracking-widest mt-0.5">{formatDate(detail.date)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-base font-black ${detail.type === 'add' ? 'text-rose-500' : 'text-emerald-500'}`}>
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
    <div className="p-5 space-y-7 bg-asphalt-900 min-h-full pb-40">
      {/* Summary Header */}
      <div className="bg-asphalt-800 rounded-[2.5rem] p-7 border border-asphalt-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-rose-500/20 transition-all duration-1000"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-rose-900/20 rounded-full blur-[100px]"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-rose-500 font-black text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 border border-white/10">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-asphalt-text-400">Status Piutang</p>
              <div className="bg-rose-500/10 text-rose-500 text-[10px] font-black px-2 py-0.5 rounded-lg border border-rose-500/20 inline-block uppercase tracking-tighter mt-1">
                Limit: Aktif
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-[0.25em]">
              {isBosGlobal ? 'Piutang Global' : 'Piutang Cabang'}
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-rose-500">Rp</span>
              <p className="text-4xl font-black tracking-tighter text-white">
                {totalDebtAll.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          
          <div className="pt-6 border-t border-asphalt-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {[...Array(Math.min(3, filteredDebts.length))].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-xl border-2 border-asphalt-800 bg-asphalt-700 flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-br from-asphalt-700 to-asphalt-600 rounded-lg"></div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-asphalt-text-100 font-black uppercase tracking-tight">
                {filteredDebts.length} Pelanggan
              </p>
            </div>
            <button className="bg-asphalt-700/50 text-asphalt-text-400 hover:text-white p-2 rounded-xl border border-asphalt-700 transition-all">
              <HistoryIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-rose-500" />
            </div>
            <h3 className="text-xs font-black text-asphalt-text-100 uppercase tracking-[0.2em]">Daftar Pelanggan</h3>
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-[10px] font-black text-asphalt-text-400 bg-asphalt-800 border border-asphalt-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-rose-500 uppercase tracking-widest"
          >
            <option value="latest">TERBARU</option>
            <option value="name">NAMA A-Z</option>
            <option value="amount">SALDO</option>
          </select>
        </div>

        <div className="bg-asphalt-800 rounded-[2.5rem] shadow-2xl border border-asphalt-700/50 overflow-hidden">
          <div className="p-6 bg-asphalt-900/40 border-b border-asphalt-700/50 space-y-5">
            {canEdit && (
              <form onSubmit={handleAddPerson} className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-asphalt-text-400">@</span>
                  <input
                    type="text"
                    placeholder="Nama Pelanggan Baru"
                    className="w-full pl-10 pr-4 py-3.5 text-sm bg-asphalt-800 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-white font-black placeholder:text-asphalt-text-400/50"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isAddingPerson}
                  className="w-14 h-14 bg-brand-500 text-white rounded-2xl flex items-center justify-center hover:bg-brand-600 active:scale-95 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50"
                >
                  {isAddingPerson ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Plus className="w-6 h-6 stroke-[3px]" />
                  )}
                </button>
              </form>
            )}

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-asphalt-text-400" />
              <input
                type="text"
                placeholder="Cari nama pelanggan..."
                className="w-full pl-11 pr-4 py-3.5 text-sm bg-asphalt-800 border border-asphalt-700 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none text-white font-medium placeholder:text-asphalt-text-400/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="divide-y divide-asphalt-700/50">
            {filteredDebts.length === 0 ? (
              <div className="text-center py-20 bg-asphalt-800/50">
                <div className="w-20 h-20 bg-asphalt-900 rounded-[2rem] flex items-center justify-center mx-auto mb-5 border border-asphalt-700/50">
                  <Users className="w-10 h-10 text-asphalt-700" />
                </div>
                <p className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest">Tidak ada data pelanggan</p>
                {role === 'karyawan' && !branchId && (
                  <p className="text-[10px] text-rose-500 mt-4 px-10 font-bold uppercase tracking-tighter">Silahkan hubungi Bos untuk penempatan Cabang.</p>
                )}
              </div>
            ) : (
              filteredDebts.map((person) => {
                const total = person.totalDebt;
                const initials = person.personName.substring(0, 2).toUpperCase();
                
                const colors = [
                  'from-brand-500 to-brand-600',
                  'from-rose-500 to-rose-600',
                  'from-emerald-500 to-emerald-600'
                ];
                const colorIndex = person.personName.length % colors.length;
                const avatarColor = colors[colorIndex];

                return (
                  <div key={person.id} className="flex items-center p-5 hover:bg-asphalt-700/20 transition-all group active:bg-asphalt-700/40">
                    <div 
                      className="flex-1 flex items-center gap-4 cursor-pointer min-w-0"
                      onClick={() => setSelectedPersonId(person.id)}
                    >
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg border border-white/10 group-hover:scale-110 transition-all duration-300`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-black text-white leading-tight truncate uppercase tracking-tight">{person.personName}</h3>
                          {(role === 'bos' || role === 'mandor') && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-brand-500/10 text-brand-500 rounded-md uppercase tracking-wider border border-brand-500/20">
                              {store.branches.find(b => b.id === person.branchId)?.name || 'Central'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-asphalt-text-400 uppercase tracking-widest">
                            {person.details.length} Aktivitas
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                      <div className="text-right">
                        <p className={`text-base font-black ${total > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {formatRupiah(total)}
                        </p>
                      </div>
                      {canDelete && (
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, type: 'person', personId: person.id, name: person.personName })}
                          className="p-2.5 text-asphalt-text-400 hover:text-rose-500 bg-asphalt-700/30 hover:bg-asphalt-700 rounded-xl transition-all"
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
