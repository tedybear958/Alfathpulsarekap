import React, { useState } from 'react';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { ShoppingRequest, ShoppingCatalog } from '../types';
import { ShoppingBag, CheckCircle2, Trash2, Plus, X, ChevronDown, ChevronUp, Store, Save, AlertCircle } from 'lucide-react';

const DEFAULT_PROVIDERS = ['Telkomsel', 'Indosat', 'XL', 'Axis', 'Tri', 'Smartfren'];

export const ShoppingList: React.FC = () => {
  const { role, branchId } = useAuthStore();
  const { 
    shoppingRequests, 
    shoppingCatalog,
    addShoppingRequest, 
    updateShoppingRequestStatus, 
    updateShoppingRequestItems,
    deleteShoppingRequest,
    updateShoppingCatalog,
    deleteShoppingCatalog,
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<'requests' | 'catalog'>('requests');
  const [selectedItems, setSelectedItems] = useState<{ provider: string, quota: string }[]>([]);
  const [newProvider, setNewProvider] = useState('');
  const [newOption, setNewOption] = useState('');
  const [editingCatalog, setEditingCatalog] = useState<ShoppingCatalog | null>(null);
  const [expandedProviders, setExpandedProviders] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Bos State for editing pcs
  const [editingRequestPcs, setEditingRequestPcs] = useState<string | null>(null);
  const [tempPcsData, setTempPcsData] = useState<Record<number, number>>({});

  const handleAddItem = (provider: string, quota: string) => {
    setSelectedItems([...selectedItems, { provider, quota }]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleSubmitRequest = async () => {
    if (selectedItems.length === 0) return;
    if (!branchId && role !== 'bos') {
      setErrorMsg('Anda tidak terdaftar di cabang manapun.');
      return;
    }
    
    // If bos is testing, use a dummy branch or let them select (for now just use their branchId if any, or block)
    const targetBranchId = branchId || 'pusat';

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await addShoppingRequest(targetBranchId, selectedItems);
      setSelectedItems([]);
    } catch (error: any) {
      setErrorMsg('Gagal mengirim pesanan. Silakan coba lagi.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCatalog = async () => {
    if (!newProvider.trim()) return;
    try {
      await updateShoppingCatalog(newProvider, []);
      setNewProvider('');
    } catch (error: any) {
      setErrorMsg('Gagal menambah provider.');
      console.error(error);
    }
  };

  const handleAddOption = async (catalog: ShoppingCatalog) => {
    if (!newOption.trim()) return;
    try {
      const currentOptions = catalog.options || [];
      const updatedOptions = [...currentOptions, newOption.trim()];
      await updateShoppingCatalog(catalog.provider, updatedOptions);
      setNewOption('');
      setEditingCatalog(null);
    } catch (error: any) {
      setErrorMsg(`Gagal menambah opsi: ${error.message || 'Error tidak diketahui'}`);
      console.error(error);
    }
  };

  const handleRemoveOption = async (catalog: ShoppingCatalog, optionToRemove: string) => {
    try {
      const currentOptions = catalog.options || [];
      const updatedOptions = currentOptions.filter(opt => opt !== optionToRemove);
      await updateShoppingCatalog(catalog.provider, updatedOptions);
    } catch (error: any) {
      setErrorMsg(`Gagal menghapus opsi: ${error.message || 'Error tidak diketahui'}`);
      console.error(error);
    }
  };

  const toggleProvider = (provider: string) => {
    setExpandedProviders(prev => 
      prev.includes(provider) ? prev.filter(p => p !== provider) : [...prev, provider]
    );
  };

  const startEditingPcs = (request: ShoppingRequest) => {
    setEditingRequestPcs(request.id);
    const initialPcs: Record<number, number> = {};
    request.items.forEach((item, index) => {
      if (item.pcs !== undefined) {
        initialPcs[index] = item.pcs;
      }
    });
    setTempPcsData(initialPcs);
  };

  const savePcs = async (request: ShoppingRequest) => {
    try {
      const updatedItems = request.items.map((item, index) => ({
        ...item,
        pcs: tempPcsData[index] !== undefined ? tempPcsData[index] : item.pcs
      }));
      await updateShoppingRequestItems(request.id, updatedItems);
      setEditingRequestPcs(null);
      setTempPcsData({});
    } catch (error) {
      setErrorMsg('Gagal menyimpan jumlah PCS.');
      console.error(error);
    }
  };

  const displayCatalogs = Array.from(new Set([...DEFAULT_PROVIDERS, ...shoppingCatalog.map(c => c.provider)]))
    .map(providerName => {
      return shoppingCatalog.find(c => c.provider === providerName) || {
        id: `temp-${providerName}`,
        provider: providerName,
        options: []
      };
    });

  const availableCatalogs = shoppingCatalog.filter(c => c.options && c.options.length > 0);

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Belanja</h1>
          <p className="text-sm text-gray-500">Daftar pesanan voucher & kartu</p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {role === 'bos' && (
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'requests' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pesanan Cabang
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'catalog' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Katalog Provider
          </button>
        </div>
      )}

      {activeTab === 'catalog' && role === 'bos' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Tambah Provider Baru</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newProvider}
                onChange={(e) => setNewProvider(e.target.value)}
                placeholder="Misal: Telkomsel, XL, Indosat..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSaveCatalog}
                disabled={!newProvider.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {displayCatalogs.map(catalog => (
              <div key={catalog.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 flex items-center justify-between bg-gray-50">
                  <h4 className="font-semibold text-gray-900">{catalog.provider}</h4>
                  <button 
                    onClick={() => !catalog.id.startsWith('temp-') && deleteShoppingCatalog(catalog.id)} 
                    className={`p-1.5 rounded-lg transition-colors ${catalog.id.startsWith('temp-') ? 'text-gray-300 cursor-not-allowed' : 'text-rose-500 hover:bg-rose-50'}`}
                    disabled={catalog.id.startsWith('temp-')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(catalog.options || []).map(opt => (
                      <span key={opt} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {opt}
                        <button onClick={() => handleRemoveOption(catalog, opt)} className="hover:bg-blue-200 p-0.5 rounded-full ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  {editingCatalog?.id === catalog.id ? (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder="Misal: 5GB 3 Hari"
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleAddOption(catalog)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => { setEditingCatalog(null); setNewOption(''); }}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingCatalog(catalog)}
                      className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Tambah Opsi Kuota
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Form Buat Pesanan (Karyawan/Mandor) */}
          {(role === 'karyawan' || role === 'mandor') && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Buat Daftar Belanja</h3>
              
              <div className="space-y-2 mb-4">
                {availableCatalogs.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Katalog kosong. Hubungi Bos untuk mengisi katalog.</p>
                ) : (
                  availableCatalogs.map((group) => (
                    <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleProvider(group.provider)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{group.provider}</span>
                        {expandedProviders.includes(group.provider) ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      
                      {expandedProviders.includes(group.provider) && (
                        <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white">
                          {(group.options || []).map((opt) => (
                            <button
                              key={opt}
                              onClick={() => handleAddItem(group.provider, opt)}
                              className="text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {selectedItems.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Barang yang dipilih:</h4>
                  <ul className="space-y-2 mb-4">
                    {selectedItems.map((item, index) => (
                      <li key={index} className="flex items-center justify-between bg-blue-50/50 px-3 py-2 rounded-lg">
                        <span className="text-sm font-medium text-gray-900">{item.provider} - {item.quota}</span>
                        <button onClick={() => handleRemoveItem(index)} className="text-rose-500 p-1 hover:bg-rose-50 rounded-md">
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={handleSubmitRequest}
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Daftar Pesanan */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Daftar Pesanan</h3>
            
            {shoppingRequests.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Belum ada pesanan belanja.</p>
              </div>
            ) : (
              shoppingRequests.map((request) => (
                <div key={request.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${request.status === 'completed' ? 'border-emerald-200' : 'border-orange-200'}`}>
                  <div className={`p-3 flex items-center justify-between ${request.status === 'completed' ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                    <div className="flex items-center gap-2">
                      <Store className={`w-4 h-4 ${request.status === 'completed' ? 'text-emerald-600' : 'text-orange-600'}`} />
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{request.branchName}</h4>
                        <p className="text-[10px] text-gray-500">{new Date(request.createdAt).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      request.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {request.status === 'completed' ? 'Selesai' : 'Menunggu'}
                    </span>
                  </div>
                  
                  <div className="p-4">
                    <ul className="space-y-3">
                      {request.items.map((item, index) => (
                        <li key={index} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                          <span className="text-sm text-gray-700">{item.provider} - {item.quota}</span>
                          
                          {role === 'bos' && editingRequestPcs === request.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={tempPcsData[index] || ''}
                                onChange={(e) => setTempPcsData({...tempPcsData, [index]: parseInt(e.target.value) || 0})}
                                placeholder="pcs"
                                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-500">pcs</span>
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-gray-900">
                              {item.pcs !== undefined ? `${item.pcs} pcs` : <span className="text-gray-400 italic font-normal">? pcs</span>}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                      {role === 'bos' && request.status === 'pending' && (
                        <>
                          {editingRequestPcs === request.id ? (
                            <button
                              onClick={() => savePcs(request)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center gap-1"
                            >
                              <Save className="w-3.5 h-3.5" /> Simpan PCS
                            </button>
                          ) : (
                            <button
                              onClick={() => startEditingPcs(request)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100"
                            >
                              Isi Jumlah (PCS)
                            </button>
                          )}
                          <button
                            onClick={() => updateShoppingRequestStatus(request.id, 'completed')}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Tandai Selesai
                          </button>
                        </>
                      )}
                      
                      {((role === 'bos') || (role === 'mandor' && request.status === 'pending')) && (
                        <button
                          onClick={() => deleteShoppingRequest(request.id)}
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-medium hover:bg-rose-100 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
