import React, { useState } from 'react';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { ShoppingCatalog } from '../types';
import { ShoppingBag, CheckCircle2, Trash2, Plus, X, ChevronDown, ChevronUp, Clock, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ShoppingList: React.FC = () => {
  const { 
    shoppingRequests, 
    shoppingCatalog,
    addShoppingRequest, 
    updateShoppingRequestStatus, 
    deleteShoppingRequest,
    updateShoppingCatalog,
    deleteShoppingCatalog,
    isLoaded 
  } = useFinanceStore();
  const { role, branchId } = useAuthStore();
  
  const [isAdding, setIsAdding] = useState(false);
  const [isManagingCatalog, setIsManagingCatalog] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ provider: string, quota: string }[]>([]);
  const [expandedProviders, setExpandedProviders] = useState<string[]>([]);

  // Catalog Management State
  const [newProvider, setNewProvider] = useState('');
  const [editingCatalog, setEditingCatalog] = useState<ShoppingCatalog | null>(null);
  const [newOption, setNewOption] = useState('');

  const toggleProvider = (provider: string) => {
    setExpandedProviders(prev => 
      prev.includes(provider) ? prev.filter(p => p !== provider) : [...prev, provider]
    );
  };

  const toggleItem = (provider: string, quota: string) => {
    const exists = selectedItems.find(i => i.provider === provider && i.quota === quota);
    if (exists) {
      setSelectedItems(prev => prev.filter(i => !(i.provider === provider && i.quota === quota)));
    } else {
      setSelectedItems(prev => [...prev, { provider, quota }]);
    }
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0 || !branchId) return;
    await addShoppingRequest(branchId, selectedItems);
    setSelectedItems([]);
    setIsAdding(false);
  };

  const handleSaveCatalog = async () => {
    if (!newProvider.trim()) return;
    await updateShoppingCatalog(newProvider, editingCatalog?.options || []);
    setNewProvider('');
    setEditingCatalog(null);
  };

  const handleAddOption = async (catalog: ShoppingCatalog) => {
    if (!newOption.trim()) return;
    const updatedOptions = [...catalog.options, newOption.trim()];
    await updateShoppingCatalog(catalog.provider, updatedOptions);
    setNewOption('');
  };

  const handleRemoveOption = async (catalog: ShoppingCatalog, optionToRemove: string) => {
    const updatedOptions = catalog.options.filter(opt => opt !== optionToRemove);
    await updateShoppingCatalog(catalog.provider, updatedOptions);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Daftar Belanja</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Order Voucher & Kartu</p>
        </div>
        <div className="flex gap-2">
          {role === 'bos' && (
            <button
              onClick={() => setIsManagingCatalog(true)}
              className="bg-slate-100 text-slate-600 p-3 rounded-2xl active:scale-95 transition-all"
              title="Atur Katalog"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}
          {role !== 'bos' && (
            <button
              onClick={() => {
                setIsAdding(true);
                setExpandedProviders(shoppingCatalog.map(c => c.provider));
              }}
              className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg shadow-emerald-100 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Catalog Management Modal */}
      <AnimatePresence>
        {isManagingCatalog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Atur Katalog Produk</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tambah Provider & Kuota</p>
                </div>
                <button onClick={() => setIsManagingCatalog(false)} className="p-2 bg-white rounded-xl text-slate-400 shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Add New Provider */}
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newProvider}
                    onChange={(e) => setNewProvider(e.target.value)}
                    placeholder="Nama Provider (Contoh: Tsel)"
                    className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                  <button 
                    onClick={handleSaveCatalog}
                    className="bg-emerald-600 text-white px-4 rounded-xl font-black text-xs"
                  >
                    Tambah
                  </button>
                </div>

                {/* List of Providers and Options */}
                <div className="space-y-4">
                  {shoppingCatalog.map(catalog => (
                    <div key={catalog.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{catalog.provider}</span>
                        <button onClick={() => deleteShoppingCatalog(catalog.id)} className="text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {catalog.options.map(opt => (
                          <div key={opt} className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600">{opt}</span>
                            <button onClick={() => handleRemoveOption(catalog, opt)} className="text-slate-300 hover:text-rose-500">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Tambah Kuota (Contoh: 5gb 2h)"
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddOption(catalog);
                            }
                          }}
                          onChange={(e) => setNewOption(e.target.value)}
                          value={editingCatalog?.id === catalog.id ? newOption : ''}
                          onFocus={() => {
                            setEditingCatalog(catalog);
                            setNewOption('');
                          }}
                        />
                        <button 
                          onClick={() => handleAddOption(catalog)}
                          className="bg-slate-800 text-white px-3 rounded-lg text-[10px] font-black"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Request Modal/Overlay */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Pilih Voucher</h3>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Centang yang perlu dibelanja</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-2 bg-white rounded-xl text-slate-400 shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {shoppingCatalog.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-slate-400 text-xs font-bold">Katalog belanja belum diatur oleh Bos.</p>
                  </div>
                ) : (
                  shoppingCatalog.map((group) => (
                    <div key={group.id} className="space-y-3">
                      <button 
                        onClick={() => toggleProvider(group.provider)}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{group.provider}</span>
                        {expandedProviders.includes(group.provider) ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                      </button>
                      
                      <AnimatePresence>
                        {expandedProviders.includes(group.provider) && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="grid grid-cols-2 gap-2 overflow-hidden"
                          >
                            {group.options.map(opt => {
                              const isSelected = selectedItems.find(i => i.provider === group.provider && i.quota === opt);
                              return (
                                <button
                                  key={opt}
                                  onClick={() => toggleItem(group.provider, opt)}
                                  className={`p-3 rounded-xl text-xs font-bold transition-all border-2 text-left flex items-center justify-between ${
                                    isSelected 
                                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                                      : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {opt}
                                  {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button
                  disabled={selectedItems.length === 0}
                  onClick={handleSubmit}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 disabled:opacity-50 active:scale-95 transition-all"
                >
                  Kirim Daftar Belanja ({selectedItems.length})
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List of Requests */}
      <div className="space-y-4">
        {shoppingRequests.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-slate-200" />
            </div>
            <h3 className="text-slate-400 font-bold">Belum ada daftar belanja</h3>
            <p className="text-[10px] text-slate-300 uppercase font-bold tracking-widest mt-1">Semua pesanan akan muncul di sini</p>
          </div>
        ) : (
          shoppingRequests.map((request) => (
            <motion.div
              layout
              key={request.id}
              className={`bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm transition-all ${
                request.status === 'completed' ? 'opacity-60 grayscale-[0.5]' : ''
              }`}
            >
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-emerald-50 rounded-xl">
                      <Store className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">{request.branchName}</h4>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {new Date(request.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {request.items.map((item, idx) => (
                      <div key={idx} className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.provider}</span>
                        <span className="text-xs font-bold text-slate-700">{item.quota}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    request.status === 'completed' 
                      ? 'bg-slate-100 text-slate-400' 
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {request.status === 'completed' ? 'Selesai' : 'Pending'}
                  </span>
                  
                  {role === 'bos' && request.status === 'pending' && (
                    <button
                      onClick={() => updateShoppingRequestStatus(request.id, 'completed')}
                      className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}

                  {(role === 'bos' || (role === 'mandor' && request.status === 'pending')) && (
                    <button
                      onClick={() => deleteShoppingRequest(request.id)}
                      className="p-3 text-slate-300 hover:text-rose-500 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              
              {request.status === 'pending' && (
                <div className="px-5 pb-5">
                  <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="h-full w-1/3 bg-emerald-400/30"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
