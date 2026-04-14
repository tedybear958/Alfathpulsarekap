import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SuccessToastProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

export function SuccessToast({ show, message, onClose }: SuccessToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-xs"
        >
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-5 py-4 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black tracking-tight leading-tight">Berhasil!</p>
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mt-0.5 truncate">
                {message}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
