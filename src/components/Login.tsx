import React from 'react';
import { loginWithGoogle } from '../firebase';
import { Wallet } from 'lucide-react';

export function Login() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Wallet className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          ALFATHPulsa
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sistem Manajemen Keuangan Agen BRILink
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <button
            onClick={loginWithGoogle}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
          >
            Masuk dengan Akun Google
          </button>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Akses Terbatas</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-center text-gray-500">
              Aplikasi ini hanya dapat diakses oleh Karyawan, Mandor, dan Bos yang telah terdaftar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
