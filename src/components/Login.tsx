import React from 'react';
import { loginWithGoogle } from '../firebase';

export function Login() {
  return (
    <div className="min-h-screen bg-asphalt-900 flex flex-col justify-center py-12 px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-asphalt-800 px-8 py-5 rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-asphalt-700 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent"></div>
            <span className="text-white font-black tracking-tighter text-3xl relative z-10">AlfathPulsa</span>
          </div>
        </div>
        <h2 className="mt-8 text-center text-[10px] font-black text-asphalt-text-400 uppercase tracking-[0.3em]">
          Manajemen Keuangan
        </h2>
        <p className="mt-2 text-center text-xs text-asphalt-text-400 font-medium">
          Sistem Manajemen Keuangan Agen BRILink
        </p>
      </div>

      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-asphalt-800 py-10 px-6 shadow-2xl rounded-[3rem] border border-asphalt-700 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            <div className="text-center">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Selamat Datang</h3>
              <p className="text-[10px] text-asphalt-text-400 font-bold uppercase tracking-widest mt-1">Gunakan akun Google yang terdaftar</p>
            </div>

            <button
              onClick={loginWithGoogle}
              className="w-full flex justify-center items-center gap-3 py-4.5 px-4 border-2 border-brand-500/30 rounded-2xl shadow-lg text-xs font-black text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all active:scale-[0.98] uppercase tracking-widest"
            >
              Masuk dengan Google
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-asphalt-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-asphalt-800 text-[9px] font-black text-asphalt-text-400 uppercase tracking-widest">Akses Terbatas</span>
              </div>
            </div>

            <div className="bg-asphalt-900 shadow-inner rounded-2xl p-5 border border-asphalt-700/50">
              <p className="text-[10px] text-center text-asphalt-text-400 leading-relaxed font-medium">
                Aplikasi ini hanya dapat diakses oleh <span className="text-brand-500 font-black">KARYAWAN</span>, <span className="text-emerald-500 font-black">MANDOR</span>, dan <span className="text-asphalt-text-100 font-black">BOS</span> yang telah terdaftar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
