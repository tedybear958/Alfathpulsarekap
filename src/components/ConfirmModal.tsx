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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              confirmVariant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-bold text-gray-900 leading-none mb-2">{title}</h3>
              <div className="text-sm text-gray-500 leading-relaxed">{message}</div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 flex gap-3 justify-end border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors shadow-sm ${
              confirmVariant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
