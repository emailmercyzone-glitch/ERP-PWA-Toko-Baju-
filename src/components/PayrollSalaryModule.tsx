import React, { useState } from 'react';
import { db } from '../services/db';
import { Role } from '../types/erp';
import {
  Users,
  DollarSign,
  Download,
  Calendar,
  Clock,
  Printer,
  CheckCircle2,
  FileText,
  MessageSquare
} from 'lucide-react';
import { sendWhatsAppNotification } from '../services/whatsappService';

interface PayrollSalaryModuleProps {
  currentStoreId: string;
  currentRole: Role;
}

export const PayrollSalaryModule: React.FC<PayrollSalaryModuleProps> = ({
  currentStoreId,
  currentRole,
}) => {
  const [periode, setPeriode] = useState('2026-11');
  const [selectedKaryawanId, setSelectedKaryawanId] = useState<string>('KRY-KAS-1');
  const [activeSlipHtml, setActiveSlipHtml] = useState<string | null>(null);

  const karyawanList = db.masterKaryawan.filter((k) => k.aktif);
  const selectedKaryawan = karyawanList.find((k) => k.karyawan_id === selectedKaryawanId) || karyawanList[0];

  // Calculate Salary Formula based on Blueprint BAB 4.5 & v40.1 Patch L:
  // total = gaji_pokok + insentif + bonus_target + lembur - potongan_telat - potongan_kas - potongan_izin
  const gajiPokok = selectedKaryawan?.gaji_pokok || 3500000;
  const totalPcsSold = 45; // sample sales
  const insentifRate = selectedKaryawan?.insentif_per_pcs || 1000;
  const splitPct = selectedKaryawan?.split_kasir_pct ?? 1.0;
  const insentif = Math.round(totalPcsSold * insentifRate * splitPct);

  const bonusTarget = totalPcsSold >= (selectedKaryawan?.bonus_target_pcs || 50) ? (selectedKaryawan?.bonus_target_nominal || 250000) : 0;
  const lemburJam = 4;
  const lemburNominal = lemburJam * 15000; // CFG-012: Rp 15.000 / jam

  // Deductions
  const menitTelat = 20; // sample 20 mins
  const potonganTelat = menitTelat * 1000; // CFG-009: Rp 1.000 / menit
  const potonganKas = 0;
  const potonganIzin = 0;

  const totalGajiBersih = gajiPokok + insentif + bonusTarget + lemburNominal - potonganTelat - potonganKas - potonganIzin;

  const handlePrintSlip = () => {
    window.print();
  };

  const handleSendSlipViaWA = async () => {
    if (!selectedKaryawan) return;
    const res = await sendWhatsAppNotification({
      tipe: 'GAJI_THR',
      toko_id: selectedKaryawan.toko_id,
      penerima: selectedKaryawan.wa,
      data: {
        karyawan_nama: selectedKaryawan.nama,
        periode: periode,
        gaji_pokok: gajiPokok,
        insentif: insentif,
        bonus_lembur: bonusTarget + lemburNominal,
        potongan: potonganTelat + potonganKas + potonganIzin,
        gaji_bersih: totalGajiBersih
      },
      forceSend: true
    });
    window.open(res.clickToChatUrl, '_blank');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #salary-slip-print-area, #salary-slip-print-area * { visibility: visible; }
          #salary-slip-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20mm;
          }
          .print-hidden { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 print-hidden">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>Penggajian Karyawan &amp; Slip Gaji PDF (Home Pusat)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Perhitungan formula otomatis gaji pokok, insentif split kasir/SPG, bonus target, lembur, dan denda telat.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
          />
          <button
            onClick={handleSendSlipViaWA}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-md shrink-0"
            title="Kirim Ringkasan Slip Gaji ke WhatsApp Karyawan"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Kirim via WA</span>
          </button>
          <button
            onClick={handlePrintSlip}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-md shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Slip Gaji</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Karyawan Selector (4 Cols) */}
        <div className="md:col-span-4 space-y-3 print-hidden">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Pilih Karyawan
          </label>
          <div className="space-y-2">
            {karyawanList.map((k) => (
              <button
                key={k.karyawan_id}
                onClick={() => setSelectedKaryawanId(k.karyawan_id)}
                className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                  selectedKaryawanId === k.karyawan_id
                    ? 'bg-slate-800 border-indigo-500 shadow-md'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-white text-xs">{k.nama}</div>
                  <div className="text-[11px] text-slate-400">
                    {k.employee_type} · Toko {k.toko_id}
                  </div>
                </div>
                <span className="text-[10px] bg-slate-950 font-mono text-indigo-300 px-2 py-0.5 rounded border border-slate-800">
                  {k.gaji_type}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Salary Slip Preview (8 Cols) */}
        <div className="md:col-span-8">
          <div
            id="salary-slip-print-area"
            className="bg-white text-black p-6 sm:p-8 rounded-2xl shadow-xl space-y-6 max-w-2xl mx-auto border border-slate-300 select-text font-sans"
          >
            {/* Header Slip */}
            <div className="border-b-2 border-black pb-4 flex justify-between items-start">
              <div>
                <div className="text-base font-black tracking-wider uppercase">CV MERPATI INDAH BUSANA</div>
                <div className="text-xs text-gray-700">Toko Baju UMKM &amp; Gudang Pusat</div>
                <div className="text-[11px] text-gray-500">NPWP: 01.234.567.8-012.000</div>
              </div>
              <div className="text-right">
                <div className="text-base font-black uppercase text-indigo-900">SLIP GAJI KARYAWAN</div>
                <div className="text-xs font-mono font-bold">Periode: {periode}</div>
                <div className="text-[11px] text-gray-600">ID: SLP-{selectedKaryawan?.karyawan_id}-{periode}</div>
              </div>
            </div>

            {/* Employee Info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div>
                <div><strong>Nama:</strong> {selectedKaryawan?.nama}</div>
                <div><strong>ID Karyawan:</strong> {selectedKaryawan?.karyawan_id}</div>
                <div><strong>Jabatan:</strong> {selectedKaryawan?.employee_type}</div>
              </div>
              <div>
                <div><strong>Lokasi Kerja:</strong> Toko {selectedKaryawan?.toko_id}</div>
                <div><strong>Tipe Gaji:</strong> {selectedKaryawan?.gaji_type}</div>
                <div><strong>Status:</strong> AKTIF</div>
              </div>
            </div>

            {/* Salary Breakdown Table */}
            <div className="space-y-4 text-xs font-mono">
              {/* Earnings */}
              <div>
                <div className="font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2 font-sans flex justify-between">
                  <span>PENGHASILAN (EARNINGS)</span>
                  <span>JUMLAH (RP)</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Gaji Pokok ({selectedKaryawan?.gaji_type})</span>
                    <span>Rp {gajiPokok.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Insentif Penjualan ({totalPcsSold} Pcs x Rp {insentifRate} x {splitPct * 100}%)</span>
                    <span>Rp {insentif.toLocaleString('id-ID')}</span>
                  </div>
                  {bonusTarget > 0 && (
                    <div className="flex justify-between">
                      <span>Bonus Target Penjualan</span>
                      <span>Rp {bonusTarget.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {lemburNominal > 0 && (
                    <div className="flex justify-between">
                      <span>Upah Lembur ({lemburJam} Jam x Rp 15.000)</span>
                      <span>Rp {lemburNominal.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Deductions */}
              <div>
                <div className="font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2 font-sans flex justify-between text-rose-700">
                  <span>POTONGAN (DEDUCTIONS)</span>
                  <span>JUMLAH (RP)</span>
                </div>
                <div className="space-y-1 text-gray-700">
                  {potonganTelat > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Potongan Telat ({menitTelat} Menit x Rp 1.000)</span>
                      <span>-Rp {potonganTelat.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {potonganKas > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Potongan Selisih Kas Harian</span>
                      <span>-Rp {potonganKas.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {potonganTelat === 0 && potonganKas === 0 && (
                    <div className="text-gray-500 italic">Tidak ada potongan pada periode ini.</div>
                  )}
                </div>
              </div>

              {/* Net Take Home Pay */}
              <div className="border-t-2 border-black pt-3 flex justify-between items-center text-sm font-black font-sans bg-gray-100 p-3 rounded-lg">
                <span>TOTAL GAJI BERSIH (TAKE HOME PAY):</span>
                <span className="text-base text-indigo-900 font-mono">
                  Rp {totalGajiBersih.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Signature Area */}
            <div className="pt-6 border-t border-gray-300 grid grid-cols-2 text-center text-xs font-sans">
              <div>
                <div>Diterima Oleh,</div>
                <div className="h-14"></div>
                <div className="font-bold">({selectedKaryawan?.nama})</div>
              </div>
              <div>
                <div>Disetujui Oleh,</div>
                <div className="h-14"></div>
                <div className="font-bold">(Budi Manager / Owner)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
