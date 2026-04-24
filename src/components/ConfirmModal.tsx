import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary';
}

export function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Hapus',
  confirmVariant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-asphalt-900/80 backdrop-blur-md">
      <div className="bg-asphalt-800 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-asphalt-700">
        <div className="p-8">
          <div className="flex flex-col items-center text-center gap-6">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10 ${
              confirmVariant === 'danger' ? 'bg-rose-500/20 text-rose-500' : 'bg-brand-500/20 text-brand-500'
            }`}>
              <AlertTriangle className="w-10 h-10 stroke-[1.5px]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white leading-tight mb-3 uppercase tracking-tight">{title}</h3>
              <div className="text-[12px] text-asphalt-text-400 font-medium leading-relaxed px-2">{message}</div>
            </div>
          </div>
        </div>
        <div className="px-8 pb-8 flex flex-col gap-3">
          <button
            onClick={() => {
              onConfirm();
            }}
            className={`w-full py-4.5 text-[10px] font-black text-white rounded-2xl transition-all shadow-lg active:scale-[0.98] uppercase tracking-[0.25em] ${
              confirmVariant === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/20'
            }`}
          >
            {confirmText === 'Hapus' ? 'YA, HAPUS SEKARANG' : confirmText.toUpperCase()}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4.5 text-[10px] font-black text-asphalt-text-400 bg-asphalt-900 border border-asphalt-700 rounded-2xl hover:bg-asphalt-700 transition-all uppercase tracking-[0.25em]"
          >
            BATALKAN
          </button>
        </div>
      </div>
    </div>
  );
}
