import React from 'react';
import { BookOpen, AlertCircle, CheckCircle, Shield, Clock } from 'lucide-react';

export const SOPPage: React.FC = () => {
  return (
    <div className="p-5 pb-24 space-y-6">
      <div className="bg-brand-700 text-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          Panduan SOP Agen
        </h1>
        <p className="text-brand-100 mt-2">AlfathPulsa - Melayani 24 Jam</p>
      </div>

      <div className="space-y-4">
        <section className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-brand-600" />
            1. Standar Layanan
          </h2>
          <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
            <li>Selalu awali dengan Senyum, Sapa, dan Salam.</li>
            <li>Bersikap sopan dan ramah kapan pun, termasuk tengah malam.</li>
            <li>Konfirmasi kembali nominal dan data sebelum transaksi difinalkan.</li>
          </ul>
        </section>

        <section className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-600" />
            2. Prosedur & Kehadiran
          </h2>
          <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
            <li>Berikan nota kepada setiap nasabah.</li>
            <li>Lapor segera jika EDC/Jaringan gangguan.</li>
            <li><span className="font-bold text-red-600">Kehadiran:</span> Wajib lapor Bos minimal 5 jam sebelum shift jika sakit/tidak bisa masuk.</li>
          </ul>
        </section>

        <section className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-brand-600" />
            3. Penanganan Kas & Uang Besar
          </h2>
          <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
            <li>Prinsip: Perputaran kas tunai. Dilarang BON tanpa izin Bos.</li>
            <li>Lapor transaksi/kendala agar kas sinkron.</li>
            <li className="list-none mt-2">
              <span className="font-bold text-brand-700">Peringatan Menghitung Uang Nominal Besar:</span>
              <ul className="list-decimal list-inside ml-4 mt-1 space-y-1">
                <li>Lakukan di area tertutup dari pandangan umum.</li>
                <li>Wajib hitung ulang minimal 2x untuk akurasi.</li>
                <li>Jika tersedia, gunakan mesin hitung. Jika manual, usahakan disaksikan rekan saat shift ganda.</li>
                <li>Simpan di brankas/tempat terkunci segera setelah dihitung. Dilarang meninggalkan uang besar di meja.</li>
              </ul>
            </li>
          </ul>
        </section>

        <section className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600" />
            4. Keamanan & Tim
          </h2>
          <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
            <li>Jaga area kasir rapi & uang di tempat aman.</li>
            <li>Penting: Komunikasi info operasional saat perpindahan shift.</li>
          </ul>
        </section>
      </div>

      <div className="text-center text-xs text-gray-400 font-mono italic">
        AlfathPulsa - Melayani dengan Jujur, Cepat, dan Terpercaya.
      </div>
    </div>
  );
};
