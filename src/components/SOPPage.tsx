import React from 'react';
import { BookOpen, AlertCircle, CheckCircle, Shield, Clock } from 'lucide-react';

export const SOPPage: React.FC = () => {
  return (
    <div className="p-5 pb-32 space-y-7 bg-asphalt-900 min-h-screen">
      <div className="bg-asphalt-800 p-7 rounded-[2.5rem] shadow-2xl border border-asphalt-700 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-brand-500/20 transition-all duration-1000"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black flex items-center gap-4 text-white uppercase tracking-tight">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 shadow-lg">
              <BookOpen className="w-6 h-6 stroke-[2.5px]" />
            </div>
            Panduan SOP
          </h1>
          <p className="text-asphalt-text-400 mt-4 text-[10px] font-black uppercase tracking-[0.2em] px-1">AlfathPulsa - Melayani 24 Jam</p>
        </div>
      </div>

      <div className="space-y-6">
        <section className="bg-asphalt-800 p-6 rounded-[2rem] border border-asphalt-700/50 shadow-xl group hover:border-brand-500/30 transition-all">
          <h2 className="text-sm font-black text-white mb-5 flex items-center gap-3 uppercase tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle className="w-4 h-4" />
            </div>
            1. Standar Layanan
          </h2>
          <ul className="text-[11px] text-asphalt-text-100 space-y-3 list-none font-medium leading-relaxed">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
              <span>Selalu awali dengan <span className="text-emerald-400 font-bold">Senyum, Sapa, dan Salam.</span></span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
              <span>Bersikap <span className="text-emerald-400 font-bold">sopan dan ramah</span> kapan pun, termasuk tengah malam.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
              <span>Konfirmasi kembali nominal dan data sebelum transaksi difinalkan.</span>
            </li>
          </ul>
        </section>

        <section className="bg-asphalt-800 p-6 rounded-[2rem] border border-asphalt-700/50 shadow-xl group hover:border-brand-500/30 transition-all">
          <h2 className="text-sm font-black text-white mb-5 flex items-center gap-3 uppercase tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
            2. Prosedur & Kehadiran
          </h2>
          <ul className="text-[11px] text-asphalt-text-100 space-y-3 list-none font-medium leading-relaxed">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
              <span>Berikan nota kepada setiap nasabah.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
              <span>Lapor segera jika EDC/Jaringan gangguan.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
              <span><span className="font-black text-rose-500">Kehadiran:</span> Wajib lapor Bos minimal 5 jam sebelum shift jika sakit/tidak bisa masuk.</span>
            </li>
          </ul>
        </section>

        <section className="bg-asphalt-800 p-6 rounded-[2rem] border border-asphalt-700/50 shadow-xl group hover:border-brand-500/30 transition-all">
          <h2 className="text-sm font-black text-white mb-5 flex items-center gap-3 uppercase tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
              <AlertCircle className="w-4 h-4" />
            </div>
            3. Penanganan Kas & Uang Besar
          </h2>
          <div className="space-y-4">
            <ul className="text-[11px] text-asphalt-text-100 space-y-3 list-none font-medium leading-relaxed">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                <span>Prinsip: Perputaran kas tunai. <span className="text-rose-500 font-bold">Dilarang BON</span> tanpa izin Bos.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                <span>Lapor transaksi/kendala agar kas sinkron.</span>
              </li>
            </ul>
            
            <div className="bg-asphalt-900/50 p-5 rounded-2xl border border-rose-500/20 space-y-4">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-tight">
                Peringatan Menghitung Uang Nominal Besar:
              </p>
              <ul className="text-[11px] text-asphalt-text-400 space-y-3 list-none font-medium">
                <li className="flex items-start gap-3">
                  <span className="w-4 h-4 rounded-full bg-rose-500/10 flex items-center justify-center text-[8px] font-black text-rose-500 shrink-0">1</span>
                  <span>Lakukan di area tertutup dari pandangan umum.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-4 h-4 rounded-full bg-rose-500/10 flex items-center justify-center text-[8px] font-black text-rose-500 shrink-0">2</span>
                  <span>Wajib hitung ulang <span className="text-rose-500 font-bold">minimal 2x</span> untuk akurasi.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-4 h-4 rounded-full bg-rose-500/10 flex items-center justify-center text-[8px] font-black text-rose-500 shrink-0">3</span>
                  <span>Gunakan mesin hitung jika tersedia. Usahakan disaksikan rekan saat shift ganda.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-4 h-4 rounded-full bg-rose-500/10 flex items-center justify-center text-[8px] font-black text-rose-500 shrink-0">4</span>
                  <span>Simpan di brankas segera. <span className="text-rose-500 font-bold underline">Dilarang meninggalkan uang</span> di meja.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-asphalt-800 p-6 rounded-[2rem] border border-asphalt-700/50 shadow-xl group hover:border-brand-500/30 transition-all">
          <h2 className="text-sm font-black text-white mb-5 flex items-center gap-3 uppercase tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500">
              <Shield className="w-4 h-4" />
            </div>
            4. Keamanan & Tim
          </h2>
          <ul className="text-[11px] text-asphalt-text-100 space-y-3 list-none font-medium leading-relaxed">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0"></div>
              <span>Jaga area kasir rapi & uang di tempat aman.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0"></div>
              <span>Penting: Komunikasi info operasional saat perpindahan shift.</span>
            </li>
          </ul>
        </section>
      </div>

      <div className="text-center py-8">
        <p className="text-[9px] text-asphalt-text-400 font-black uppercase tracking-[0.3em] italic">
          AlfathPulsa - Melayani dengan Jujur
        </p>
      </div>
    </div>
  );
};
