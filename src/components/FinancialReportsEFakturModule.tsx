import React, { useState } from 'react';
import { db, todayYYYYMMDD } from '../services/db';
import { Role } from '../types/erp';
import {
  FileSpreadsheet,
  Download,
  Calculator,
  PieChart,
  Building,
  CheckCircle2,
  FileText,
  DollarSign
} from 'lucide-react';

interface FinancialReportsEFakturModuleProps {
  currentStoreId: string;
  currentRole: Role;
}

export const FinancialReportsEFakturModule: React.FC<FinancialReportsEFakturModuleProps> = ({
  currentStoreId,
  currentRole,
}) => {
  const [reportType, setReportType] = useState<'PL' | 'EFAKTUR' | 'PENITIP_AFF'>('PL');
  const [periode, setPeriode] = useState('2026-11');
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  // Filter Sales Transactions
  const sales = db.transaksiPenjualan.filter(
    (t) => (currentStoreId === 'ALL' || t.toko_id === currentStoreId) && t.payment_status === 'PAID'
  );

  // Financial Calculations
  const omzetBarang = sales.reduce((acc, s) => acc + s.subtotal_barang, 0);
  const diskonTotal = sales.reduce((acc, s) => acc + s.diskon_amount, 0);
  const omzetBersih = Math.max(0, omzetBarang - diskonTotal);
  const pajakPpDipungut = sales.reduce((acc, s) => acc + s.pajak_amount, 0);
  const deliveryTotal = sales.reduce((acc, s) => acc + s.delivery_amount, 0);
  const packagingTotal = sales.reduce((acc, s) => acc + s.packaging_amount, 0);

  // Estimated HPP & Gross Profit
  const details = db.transaksiDetail.filter((d) => sales.some((s) => s.transaction_id === d.transaction_id));
  const totalHPP = details.reduce((acc, d) => acc + d.qty * d.hpp_satuan, 0);
  const grossProfit = omzetBersih - totalHPP;

  // Expenses & Net Profit
  const totalOperasional = db.pengeluaranOperasional
    .filter((o) => currentStoreId === 'ALL' || o.toko_id === currentStoreId)
    .reduce((acc, o) => acc + o.nominal, 0);
  const netProfit = grossProfit - totalOperasional;

  // PPh Final 0.5% (Pajak 2 Omzet Kumulatif)
  const tarifPphFinal = 0.005;
  const pphFinal05 = Math.round(omzetBersih * tarifPphFinal);

  // Generate e-Faktur Coretax CSV String
  const generateEFakturCSV = () => {
    let csv = 'FK;KD_JENIS_TRANSAKSI;FG_PENGGANTI;NOMOR_FAKTUR;MASA_PAJAK;TAHUN_PAJAK;TANGGAL_FAKTUR;NPWP_PEMBELI;NAMA_PEMBELI;ALAMAT_PEMBELI;JUMLAH_DPP;JUMLAH_PPN\n';
    sales.forEach((s, idx) => {
      const cust = db.masterPelangganMember.find((c) => c.customer_id === s.customer_id);
      const npwpPembeli = cust?.npwp_pembeli || '00.000.000.0-000.000';
      const namaPembeli = cust?.nama || 'Customer UMKM POS';
      const noFaktur = `010.000-26.${(idx + 1).toString().padStart(8, '0')}`;

      csv += `FK;01;0;${noFaktur};11;2026;${s.tanggal};${npwpPembeli};${namaPembeli};Jl. Pembeli No 1;${s.subtotal_kena_pajak};${s.pajak_amount}\n`;
    });
    return csv;
  };

  const handleDownloadEFakturCSV = () => {
    const csvContent = generateEFakturCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `eFaktur_Coretax_DJP_${currentStoreId}_${periode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadMsg(`File CSV e-Faktur Coretax DJP (${sales.length} Faktur) berhasil di-download!`);
  };

  const handleDownloadPLCSV = () => {
    let csv = 'Laporan Laba Rugi ERP Toko Baju UMKM\n';
    csv += `Periode;${periode}\n`;
    csv += `Toko;${currentStoreId}\n\n`;
    csv += `Komponen;Nominal (Rp)\n`;
    csv += `Omzet Barang Kotor;${omzetBarang}\n`;
    csv += `Diskon Penjualan;-${diskonTotal}\n`;
    csv += `Omzet Penjualan Bersih;${omzetBersih}\n`;
    csv += `HPP (Harga Pokok Penjualan);-${totalHPP}\n`;
    csv += `Laba Kotor (Gross Profit);${grossProfit}\n`;
    csv += `Beban Operasional Toko;-${totalOperasional}\n`;
    csv += `Laba Bersih Sebelum Pajak (Net Profit);${netProfit}\n`;
    csv += `Estimasi PPh Final 0.5% (Pajak 2);${pphFinal05}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Laba_Rugi_${currentStoreId}_${periode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadMsg(`Laporan Laba Rugi P&L CSV (${periode}) berhasil di-download!`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Subtab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setReportType('PL')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            reportType === 'PL' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Laporan Laba Rugi (P&amp;L)</span>
        </button>
        <button
          onClick={() => setReportType('EFAKTUR')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            reportType === 'EFAKTUR' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>e-Faktur Coretax DJP (Pajak 1 &amp; 2)</span>
        </button>
        <button
          onClick={() => setReportType('PENITIP_AFF')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            reportType === 'PENITIP_AFF' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Rekap Komisi Penitip &amp; Affiliate</span>
        </button>
      </div>

      {downloadMsg && (
        <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{downloadMsg}</span>
        </div>
      )}

      {/* REPORT 1: LABA RUGI P&L */}
      {reportType === 'PL' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-400" />
                <span>Laporan Laba Rugi Konsolidasi (P&amp;L Income Statement)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Toko: <strong>{currentStoreId}</strong> · Periode: <strong>{periode}</strong>
              </p>
            </div>

            <button
              onClick={handleDownloadPLCSV}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor P&amp;L (CSV)</span>
            </button>
          </div>

          {/* Statement Grid */}
          <div className="space-y-3 font-mono text-xs max-w-3xl">
            <div className="flex justify-between py-2 border-b border-slate-800 text-slate-300">
              <span>(+) Omzet Penjualan Barang Kotor</span>
              <span className="font-bold">Rp {omzetBarang.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800 text-rose-400">
              <span>(-) Diskon Penjualan &amp; Voucher</span>
              <span>-Rp {diskonTotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-700 font-bold text-white text-sm bg-slate-950 px-3 rounded-lg">
              <span>(=) Omzet Penjualan Bersih</span>
              <span className="text-indigo-300">Rp {omzetBersih.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800 text-amber-400">
              <span>(-) HPP (Harga Pokok Penjualan Produk OWN)</span>
              <span>-Rp {totalHPP.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-700 font-bold text-slate-200 text-sm bg-slate-950 px-3 rounded-lg">
              <span>(=) Laba Kotor (Gross Profit)</span>
              <span className="text-emerald-400">Rp {grossProfit.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800 text-rose-400">
              <span>(-) Total Beban Operasional Toko</span>
              <span>-Rp {totalOperasional.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-indigo-600 font-black text-base text-white bg-slate-950 px-4 rounded-xl shadow-inner">
              <span>(=) LABA BERSIH (NET PROFIT):</span>
              <span className={netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                Rp {netProfit.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: E-FAKTUR CORETAX DJP */}
      {reportType === 'EFAKTUR' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>Form &amp; Ekspor e-Faktur Coretax DJP (Pajak 1 &amp; Pajak 2)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Pajak 1 (PPN 11% Struk) &amp; Pajak 2 (PPh Final 0.5% Omzet Kumulatif &gt; Rp 500 Juta)
              </p>
            </div>

            <button
              onClick={handleDownloadEFakturCSV}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Format Coretax DJP (CSV)</span>
            </button>
          </div>

          {/* Tax Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="font-bold text-slate-200">Pajak 1: PPN 11% (Di Struk Penjualan)</div>
              <div className="text-slate-400">Total Transaksi Dipungut PPN: {sales.length} Transaksi</div>
              <div className="font-bold font-mono text-emerald-400 text-base">
                Total PPN Dipungut: Rp {pajakPpDipungut.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="font-bold text-slate-200">Pajak 2: PPh Final 0.5% (Umkm Coretax DJP)</div>
              <div className="text-slate-400">Dasar Pengenaan Pajak (Omzet Bersih): Rp {omzetBersih.toLocaleString('id-ID')}</div>
              <div className="font-bold font-mono text-indigo-400 text-base">
                Estimasi PPh Final 0.5%: Rp {pphFinal05.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: PENITIP & AFFILIATE */}
      {reportType === 'PENITIP_AFF' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-400" />
            <span>Rekap Utang Settlement Penitip (CNS) &amp; Merchant AFF</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950">
                  <th className="p-3">ID Mitra</th>
                  <th className="p-3">Nama Mitra</th>
                  <th className="p-3">Jenis Tipe</th>
                  <th className="p-3 text-right">Penjualan Kotor</th>
                  <th className="p-3 text-right">Komisi Toko</th>
                  <th className="p-3 text-right">Hutang Bersih Mitra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 text-indigo-300 font-bold">PNT-001</td>
                  <td className="p-3 font-sans text-slate-200">Ibu Hajah Maryam</td>
                  <td className="p-3 text-slate-400">KONSINYASI (CNS)</td>
                  <td className="p-3 text-right">Rp 350.000</td>
                  <td className="p-3 text-right text-emerald-400">Rp 70.000 (20%)</td>
                  <td className="p-3 text-right font-bold text-white">Rp 280.000</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 text-indigo-300 font-bold">MRC-001</td>
                  <td className="p-3 font-sans text-slate-200">PT Fashion Affiliate Merchant</td>
                  <td className="p-3 text-slate-400">MERCHANT (AFF)</td>
                  <td className="p-3 text-right">Rp 180.000</td>
                  <td className="p-3 text-right text-emerald-400">Rp 36.000 (20%)</td>
                  <td className="p-3 text-right font-bold text-white">Rp 144.000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
