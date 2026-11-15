import React, { useState } from 'react';
import { db } from '../services/db';
import { executeAPIMode } from '../services/apiEngine';
import { Role } from '../types/erp';
import { BarcodeLabelPrinterModal } from './BarcodeLabelPrinterModal';
import {
  Boxes,
  ArrowRightLeft,
  ClipboardList,
  ShoppingBag,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building2,
  Tag,
  Printer
} from 'lucide-react';

interface StokGudangModuleProps {
  currentStoreId: string;
  currentRole: Role;
}

export const StokGudangModule: React.FC<StokGudangModuleProps> = ({ currentStoreId, currentRole }) => {
  const [activeSubTab, setActiveSubTab] = useState<'stok' | 'transfer' | 'opname' | 'po'>('stok');

  // Transfer Form State
  const [trfTokoTujuan, setTrfTokoTujuan] = useState('TKO2');
  const [trfSku, setTrfSku] = useState('OWN-ERG-CLN-JNS-001-BLU-35');
  const [trfQty, setTrfQty] = useState(5);

  // Opname Form State
  const [opnameSku, setOpnameSku] = useState('OWN-ERG-CLN-JNS-001-BLU-35');
  const [opnameFisik, setOpnameFisik] = useState(18);
  const [opnameAlasan, setOpnameAlasan] = useState('RUSAK');

  // PO Form State
  const [poSupplierId, setPoSupplierId] = useState('SUP-001');
  const [poTotalNominal, setPoTotalNominal] = useState(1500000);

  // Label Printer State
  const [isLabelPrinterOpen, setIsLabelPrinterOpen] = useState(false);
  const [selectedLabelSku, setSelectedLabelSku] = useState<string | undefined>();

  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Filter Stock List
  const stokList = db.stokPerToko.filter((s) => s.toko_id === currentStoreId);

  // Submit Transfer Stok
  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const res = executeAPIMode({
      mode: 'transfer',
      request_id: `req-trf-${Date.now()}`,
      payload: {
        dari: currentStoreId,
        ke: trfTokoTujuan,
        items: [{ sku: trfSku, qty: trfQty }],
        alasan: 'Mutasi Stok Antar Toko'
      }
    });

    if (res.ok) {
      setMessage({ text: `Permintaan Transfer ${(res.data as any)?.transfer_id} berhasil dibuat!` });
    } else {
      setMessage({ text: res.error?.message || 'Gagal membuat transfer', isError: true });
    }
  };

  // Submit Stock Opname
  const handleCreateOpname = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const res = executeAPIMode({
      mode: 'opname',
      request_id: `req-opn-${Date.now()}`,
      payload: {
        toko_id: currentStoreId,
        items: [{ sku: opnameSku, stok_fisik: opnameFisik, alasan: opnameAlasan }]
      }
    });

    if (res.ok) {
      const data = res.data as any;
      setMessage({
        text: `Stock Opname berhasil dibuat. Selisih: Rp ${data.selisih_total?.toLocaleString('id-ID')}. Status: ${data.status}`
      });
    } else {
      setMessage({ text: res.error?.message || 'Gagal membuat opname', isError: true });
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Sub Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('stok')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'stok' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Stok Per Toko</span>
          </button>
          <button
            onClick={() => setActiveSubTab('transfer')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'transfer' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transfer Stok</span>
          </button>
          <button
            onClick={() => setActiveSubTab('opname')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'opname' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Stock Opname</span>
          </button>
          <button
            onClick={() => setActiveSubTab('po')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'po' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>PO Pembelian Supplier</span>
          </button>
        </div>

        <span className="hidden sm:inline-block text-xs font-mono text-slate-400">
          Location: {currentStoreId}
        </span>
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

      {/* SUBTAB 1: STOK TABLE */}
      {activeSubTab === 'stok' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-indigo-400" />
              <span>Daftar Stok Real-Time ({currentStoreId})</span>
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedLabelSku(undefined);
                  setIsLabelPrinterOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl shadow-md transition"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Cetak Batch Label Stiker</span>
              </button>
              <span className="text-xs text-slate-400 font-mono">
                Total SKU: {stokList.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/50">
                  <th className="p-3">SKU</th>
                  <th className="p-3">Nama Baju</th>
                  <th className="p-3">Jenis</th>
                  <th className="p-3 text-right">Stok Sistem</th>
                  <th className="p-3 text-right">Min Stok</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Aksi Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {stokList.map((s) => {
                  const varian = db.masterVarian.find((v) => v.sku === s.sku);
                  const barang = db.masterBarang.find((b) => b.barang_id === varian?.barang_id);

                  return (
                    <tr key={s.stok_id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-bold text-indigo-300">{s.sku}</td>
                      <td className="p-3 font-sans text-slate-200">{barang?.nama_manusia || 'Baju'}</td>
                      <td className="p-3">
                        <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-semibold">
                          {varian?.jenis_barang}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-white">
                        {varian?.jenis_barang === 'AFF' ? 'Direct Supplier' : s.stok_sistem}
                      </td>
                      <td className="p-3 text-right text-slate-400">{s.min_stok}</td>
                      <td className="p-3">
                        {varian?.jenis_barang !== 'AFF' && s.stok_sistem <= s.min_stok ? (
                          <span className="text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded">
                            STOK MENIPIS
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                            AMAN
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedLabelSku(s.sku);
                            setIsLabelPrinterOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg transition font-sans"
                        >
                          <Printer className="w-3 h-3 text-indigo-400" />
                          <span>Cetak Tag</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: TRANSFER STOK */}
      {activeSubTab === 'transfer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleCreateTransfer} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
              <span>Buat Permintaan Transfer Stok</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Toko Asal</label>
                <input
                  type="text"
                  disabled
                  value={currentStoreId}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Toko Tujuan</label>
                <select
                  value={trfTokoTujuan}
                  onChange={(e) => setTrfTokoTujuan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  <option value="TKO1">TKO1 - Toko 1 Mall</option>
                  <option value="TKO2">TKO2 - Toko 2 Pasar</option>
                  <option value="TKO3">TKO3 - Toko 3 Digital</option>
                  <option value="TKO4">TKO4 - Toko 4 Outlet</option>
                  <option value="GDG">GDG - Gudang Pusat</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Pilih SKU Baju</label>
                <select
                  value={trfSku}
                  onChange={(e) => setTrfSku(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none"
                >
                  {db.masterVarian.filter((v) => v.jenis_barang !== 'AFF').map((v) => (
                    <option key={v.sku} value={v.sku}>{v.sku}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Jumlah Qty (Pcs)</label>
                <input
                  type="number"
                  min={1}
                  value={trfQty}
                  onChange={(e) => setTrfQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Permintaan Transfer</span>
            </button>
          </form>

          {/* List Existing Transfers */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Riwayat Transfer Stok</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {db.transferStok.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">Belum ada riwayat transfer.</div>
              ) : (
                db.transferStok.map((t) => (
                  <div key={t.transfer_id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex justify-between items-center font-bold text-slate-200">
                      <span>{t.transfer_id}</span>
                      <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">
                        {t.status}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Dari <strong>{t.toko_asal}</strong> ke <strong>{t.toko_tujuan}</strong> · {t.tanggal}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: STOCK OPNAME */}
      {activeSubTab === 'opname' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleCreateOpname} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <ClipboardList className="w-4 h-4 text-indigo-400" />
              <span>Input Stock Opname (Fisik vs Sistem)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">SKU Barang</label>
                <select
                  value={opnameSku}
                  onChange={(e) => setOpnameSku(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none"
                >
                  {db.masterVarian.map((v) => (
                    <option key={v.sku} value={v.sku}>{v.sku}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Jumlah Hasil Hitung Fisik (Pcs)</label>
                <input
                  type="number"
                  value={opnameFisik}
                  onChange={(e) => setOpnameFisik(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Alasan Selisih</label>
                <select
                  value={opnameAlasan}
                  onChange={(e) => setOpnameAlasan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  <option value="RUSAK">RUSAK</option>
                  <option value="HILANG">HILANG</option>
                  <option value="SALAH_INPUT">SALAH INPUT</option>
                  <option value="SALAH_KIRIM">SALAH KIRIM</option>
                  <option value="DICURI">DICURI</option>
                </select>
              </div>
            </div>

            <div className="bg-indigo-950/60 border border-indigo-800/80 p-3 rounded-xl text-[11px] text-indigo-200">
              💡 <strong>Aturan Approval Opname (v40.1):</strong> Manager &le; 500rb &amp; &le; 2 pcs. Owner &gt; 500rb ATAU &gt; 2 pcs ATAU barang mahal (&gt; 500rb).
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan &amp; Verifikasi Opname</span>
            </button>
          </form>

          {/* Opname Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Aturan Threshold &amp; Log Opname</h3>
            <p className="text-xs text-slate-400">
              Opname yang membutuhkan persetujuan Owner otomatis masuk ke antrean Approval.
            </p>
          </div>
        </div>
      )}

      {/* SUBTAB 4: PO PEMBELIAN SUPPLIER */}
      {activeSubTab === 'po' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Pembelian PO Supplier Gudang</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Pilih Supplier</label>
              <select
                value={poSupplierId}
                onChange={(e) => setPoSupplierId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              >
                {db.masterSupplier.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.nama} (Tempo: {s.tempo_hari} hari)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Total Nominal PO (Rp)</label>
              <input
                type="number"
                value={poTotalNominal}
                onChange={(e) => setPoTotalNominal(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
          </div>

          <div className="bg-indigo-950/60 border border-indigo-800/80 p-3 rounded-xl text-[11px] text-indigo-200">
            📌 <strong>Wewenang PO:</strong> Gudang dapat menyetujui PO &lt; Rp 2.000.000. PO &ge; Rp 2.000.000 membutuhkan approval Owner.
          </div>
        </div>
      )}

      {/* Barcode Label Printer Modal */}
      <BarcodeLabelPrinterModal
        isOpen={isLabelPrinterOpen}
        onClose={() => setIsLabelPrinterOpen(false)}
        initialSku={selectedLabelSku}
        currentStoreId={currentStoreId}
      />
    </div>
  );
};
