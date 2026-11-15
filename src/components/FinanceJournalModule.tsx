import React, { useState } from 'react';
import { db, todayYYYYMMDD } from '../services/db';
import { executeAPIMode } from '../services/apiEngine';
import { Role } from '../types/erp';
import {
  Wallet,
  BookOpen,
  DollarSign,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Building,
  Clock,
  MessageSquare
} from 'lucide-react';
import { sendWhatsAppNotification } from '../services/whatsappService';

interface FinanceJournalModuleProps {
  currentStoreId: string;
  currentRole: Role;
}

export const FinanceJournalModule: React.FC<FinanceJournalModuleProps> = ({ currentStoreId, currentRole }) => {
  const [activeSubTab, setActiveSubTab] = useState<'tutup_kas' | 'operasional' | 'settlement' | 'jurnal' | 'absensi'>('tutup_kas');

  // Tutup Kas Form State
  const [kasFisik, setKasFisik] = useState<number>(500000);
  const [penjelasanSelisih, setPenjelasanSelisih] = useState('');

  // Operasional Form State
  const [operasionalKet, setOperasionalKet] = useState('Beli Kantong Plastik & Solasi');
  const [operasionalNominal, setOperasionalNominal] = useState<number>(75000);
  const [operasionalKategori, setOperasionalKategori] = useState('PERLENGKAPAN');

  // Absensi State
  const [absenShift, setAbsenShift] = useState('SHIFT_PAGI (08:00)');
  const [absenCatatan, setAbsenCatatan] = useState('');

  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Submit Tutup Kas
  const handleTutupKasSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const res = executeAPIMode({
      mode: 'tutup_kas',
      request_id: `req-tutup-${Date.now()}`,
      payload: {
        toko_id: currentStoreId,
        kas_fisik: kasFisik,
        penjelasan_selisih: penjelasanSelisih
      }
    });

    if (res.ok) {
      const data = res.data as any;
      sendWhatsAppNotification({
        tipe: 'TUTUP_KAS',
        toko_id: currentStoreId,
        penerima: '6281299990001',
        data: {
          toko_id: currentStoreId,
          toko_nama: db.masterToko.find((t) => t.toko_id === currentStoreId)?.nama || currentStoreId,
          kasir_nama: currentRole === 'KASIR' ? 'Siti Rahmawati' : 'Manager Budi',
          total_omzet: kasFisik,
          total_tunai: kasFisik,
          total_fisik: kasFisik,
          selisih: data.selisih || 0
        },
        forceSend: true
      });

      setMessage({
        text: `Tutup Kas ${data.kas_harian_id} berhasil disimpan & Notifikasi WhatsApp otomatis terkirim ke Owner! Selisih: Rp ${data.selisih?.toLocaleString('id-ID')}`
      });
    } else {
      setMessage({ text: res.error?.message || 'Gagal Tutup Kas', isError: true });
    }
  };

  // Submit Operasional
  const handleOperasionalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const isGede = operasionalNominal > 200000;
    const tipeOp = operasionalNominal <= 50000 ? 'KAS_KECIL' : (operasionalNominal <= 200000 ? 'OPERASIONAL_KECIL' : 'OPERASIONAL_GEDE');

    const res = executeAPIMode({
      mode: 'bayar',
      request_id: `req-op-${Date.now()}`,
      payload: {
        jenis: tipeOp,
        nominal: operasionalNominal,
        referensi_id: `REF-OP-${Date.now()}`
      }
    });

    if (res.ok) {
      setMessage({
        text: `Pengeluaran ${tipeOp} sebesar Rp ${operasionalNominal.toLocaleString('id-ID')} tercatat.` + (isGede ? ' (Butuh Approval Owner)' : '')
      });
    } else {
      setMessage({ text: res.error?.message || 'Gagal mencatat operasional', isError: true });
    }
  };

  // Submit Absensi
  const handleAbsensiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const ts = new Date().toISOString();
    db.absensi.push({
      absensi_id: `ABS-${currentStoreId}-${Date.now()}`,
      karyawan_id: currentRole === 'KASIR' ? 'KRY-KAS-1' : 'KRY-MGR-1',
      toko_id: currentStoreId,
      tanggal: todayYYYYMMDD(),
      check_in: ts,
      shift: absenShift,
      status: 'ON_TIME',
      lembur_jam: 0,
      catatan: absenCatatan,
      created_at: ts, created_by: 'KARYAWAN', updated_at: ts, updated_by: 'KARYAWAN'
    });

    setMessage({ text: `Check-In Absensi Toko ${currentStoreId} Berhasil pada ${new Date().toLocaleTimeString('id-ID')}!` });
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Subtab navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('tutup_kas')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeSubTab === 'tutup_kas' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Tutup Kas Harian</span>
        </button>
        <button
          onClick={() => setActiveSubTab('operasional')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeSubTab === 'operasional' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Kas Kecil &amp; Operasional</span>
        </button>
        <button
          onClick={() => setActiveSubTab('settlement')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeSubTab === 'settlement' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Settlement Penitip &amp; Merchant</span>
        </button>
        <button
          onClick={() => setActiveSubTab('jurnal')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeSubTab === 'jurnal' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Jurnal Otomatis</span>
        </button>
        <button
          onClick={() => setActiveSubTab('absensi')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeSubTab === 'absensi' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Absensi Karyawan</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            message.isError
              ? 'bg-rose-950/80 border-rose-800 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
          }`}
        >
          {message.isError ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* SUBTAB 1: TUTUP KAS */}
      {activeSubTab === 'tutup_kas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleTutupKasSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Wallet className="w-4 h-4 text-indigo-400" />
              <span>Input Tutup Kas Harian ({currentStoreId})</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Hitungan Kas Fisik Amplop/Laci (Rp)</label>
                <input
                  type="number"
                  value={kasFisik}
                  onChange={(e) => setKasFisik(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-base"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Penjelasan Jika Ada Selisih Kas</label>
                <textarea
                  rows={2}
                  value={penjelasanSelisih}
                  onChange={(e) => setPenjelasanSelisih(e.target.value)}
                  placeholder="Contoh: Kembalian kurang Rp 5.000 atau selisih uang receh"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan &amp; Tutup Kas Harian</span>
            </button>
          </form>

          {/* Kas History */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Riwayat Tutup Kas</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {db.kasHarian.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">Belum ada data tutup kas.</div>
              ) : (
                db.kasHarian.map((k) => (
                  <div key={k.kas_harian_id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex justify-between items-center font-bold text-slate-200">
                      <span>{k.toko_id} - {k.tanggal}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${k.selisih === 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                        {k.status}
                      </span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px] text-slate-400">
                      <span>Fisik: Rp {k.kas_fisik.toLocaleString('id-ID')}</span>
                      <span>Selisih: Rp {k.selisih.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: OPERASIONAL */}
      {activeSubTab === 'operasional' && (
        <form onSubmit={handleOperasionalSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Receipt className="w-4 h-4 text-indigo-400" />
            <span>Pengeluaran Kas Kecil &amp; Operasional</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Kategori Pengeluaran</label>
              <select
                value={operasionalKategori}
                onChange={(e) => setOperasionalKategori(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              >
                <option value="PERLENGKAPAN">PERLENGKAPAN &amp; LAKBAN</option>
                <option value="KONSUMSI">KONSUMSI / MINUMAN</option>
                <option value="KEBERSIHAN">KEBERSIHAN / PLASTIK</option>
                <option value="UTILITAS">PLN / AIR / INTERNET</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Keterangan Pengeluaran</label>
              <input
                type="text"
                value={operasionalKet}
                onChange={(e) => setOperasionalKet(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Nominal (Rp)</label>
              <input
                type="number"
                value={operasionalNominal}
                onChange={(e) => setOperasionalNominal(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
          </div>

          <div className="bg-indigo-950/60 border border-indigo-800/80 p-3 rounded-xl text-[11px] text-indigo-200">
            📌 <strong>Kategori Limit:</strong> Kas Kecil (0-50rb), Operasional Kecil (50.001-200rb), Operasional Gede (&gt; 200rb + Approve Owner).
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition text-xs"
          >
            Simpan Pengeluaran
          </button>
        </form>
      )}

      {/* SUBTAB 3: SETTLEMENT PENITIP & MERCHANT */}
      {activeSubTab === 'settlement' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building className="w-4 h-4 text-indigo-400" />
            <span>Settlement Hutang Penitip (CNS) &amp; Merchant AFF</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="font-bold text-slate-200">Penitip Konsinyasi (Ibu Maryam)</div>
              <div className="text-slate-400">Total Penjualan Kotor: Rp 350.000</div>
              <div className="text-slate-400">Komisi Toko (20%): Rp 70.000</div>
              <div className="font-bold font-mono text-indigo-400">Utang Bersih Penitip: Rp 280.000</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="font-bold text-slate-200">Merchant AFF (PT Fashion Affiliate)</div>
              <div className="text-slate-400">Total Penjualan Kotor: Rp 180.000</div>
              <div className="text-slate-400">Komisi Toko dari Merchant (20%): Rp 36.000</div>
              <div className="font-bold font-mono text-indigo-400">Utang Merchant: Rp 144.000</div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: JURNAL OTOMATIS */}
      {activeSubTab === 'jurnal' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Jurnal Otomatis ERP (General Ledger)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Records: {db.jurnalOtomatis.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/50">
                  <th className="p-3">ID Jurnal</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Akun Debit</th>
                  <th className="p-3">Akun Kredit</th>
                  <th className="p-3 text-right">Nominal</th>
                  <th className="p-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {db.jurnalOtomatis.map((j) => (
                  <tr key={j.jurnal_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 text-indigo-300 font-bold">{j.jurnal_id}</td>
                    <td className="p-3 text-slate-400">{j.tanggal}</td>
                    <td className="p-3 text-emerald-400">{j.akun_debit}</td>
                    <td className="p-3 text-rose-400">{j.akun_kredit}</td>
                    <td className="p-3 text-right font-bold text-white">
                      Rp {j.nominal.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 font-sans text-slate-300">{j.keterangan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 5: ABSENSI */}
      {activeSubTab === 'absensi' && (
        <form onSubmit={handleAbsensiSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <span>Check-In Absensi Harian Toko ({currentStoreId})</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Shift Kerja</label>
              <select
                value={absenShift}
                onChange={(e) => setAbsenShift(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              >
                <option value="SHIFT_PAGI">SHIFT PAGI (08:00 - 16:00)</option>
                <option value="SHIFT_SIANG">SHIFT SIANG (14:00 - 22:00)</option>
                <option value="SHIFT_FULL">SHIFT FULL DAY</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Catatan Kehadiran</label>
              <input
                type="text"
                value={absenCatatan}
                onChange={(e) => setAbsenCatatan(e.target.value)}
                placeholder="Misal: Hadir On-time"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            <span>Check-In Sekarang</span>
          </button>
        </form>
      )}
    </div>
  );
};
