import React, { useState } from 'react';
import { db } from '../services/db';
import { askGeminiAdvisor } from '../services/geminiService';
import { executeAPIMode } from '../services/apiEngine';
import { Role } from '../types/erp';
import {
  Sparkles,
  TrendingUp,
  BarChart3,
  Settings,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Send
} from 'lucide-react';

interface OwnerGeminiDashboardProps {
  currentRole: Role;
  currentStoreId: string;
}

export const OwnerGeminiDashboard: React.FC<OwnerGeminiDashboardProps> = ({ currentRole, currentStoreId }) => {
  const [activeTab, setActiveTab] = useState<'advisor' | 'metrics' | 'settings' | 'import'>('advisor');

  // Gemini Query State
  const [aiQuery, setAiQuery] = useState('Analisis performa omzet dan rekomendasi penanganan stok mati hari ini.');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Settings State
  const [managerHpp, setManagerHpp] = useState(false);
  const [npwpMode, setNpwpMode] = useState('NPWP_PEMILIK');
  const [message, setMessage] = useState<string | null>(null);

  // CSV Importer State
  const [csvContent, setCsvContent] = useState('SKU,Nama,Harga,Stok\nOWN-ERG-TSH-001,Kaos Import,120000,50');

  const handleRunAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAiLoading(true);
    setAiResponse(null);

    const res = await askGeminiAdvisor(aiQuery, currentStoreId);
    setAiResponse(res);
    setIsAiLoading(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const setObj = db.settingBisnis.find((s) => s.toko_id === currentStoreId);
    if (setObj) {
      setObj.manager_boleh_lihat_hpp = managerHpp;
      setObj.npwp_mode = npwpMode as any;
    }
    setMessage('Pengaturan Bisnis ERP berhasil diperbarui!');
  };

  const handleCsvImport = () => {
    const res = executeAPIMode({
      mode: 'import_csv',
      request_id: `req-imp-${Date.now()}`,
      payload: { file_url: 'data.csv', tipe: 'BARANG', toko_id: currentStoreId }
    });

    if (res.ok && res.data) {
      const data = res.data as any;
      setMessage(`Import CSV Selesai! ${data.sukses} Baris Sukses, ${data.gagal} Baris Gagal.`);
    }
  };

  const sales = db.transaksiPenjualan.filter((t) => t.payment_status === 'PAID');
  const totalOmzetAll = sales.reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Tab Nav */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('advisor')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === 'advisor' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Gemini AI Advisor (Aturan P-08)</span>
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === 'metrics' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Metrik Omzet Semua Toko</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Pengaturan Bisnis (KEP-22)</span>
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === 'import' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Import CSV Master</span>
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* TAB 1: GEMINI AI ADVISOR */}
      {activeTab === 'advisor' && (
        <div className="space-y-6">
          <form onSubmit={handleRunAiQuery} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Asisten Cerdas Gemini AI untuk Owner ERP</span>
              </h3>
              <span className="text-xs text-slate-400">
                Allowlist Functions: 4/4 Active
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300">Tanyakan Analisis Strategis atau Rekomendasi Stok:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isAiLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shrink-0 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAiLoading ? 'Menganalisis...' : 'Tanya AI'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* AI Response Display */}
          {aiResponse && (
            <div className="bg-slate-900 border border-indigo-800/80 rounded-2xl p-5 space-y-3 shadow-2xl">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Hasil Analisis Gemini Advisor:</span>
              </div>
              <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans bg-slate-950 p-4 rounded-xl border border-slate-800">
                {aiResponse}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: METRICS */}
      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <div className="text-xs text-slate-400">Total Omzet Konsolidasi (4 Toko)</div>
            <div className="text-xl font-black font-mono text-emerald-400">
              Rp {totalOmzetAll.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <div className="text-xs text-slate-400">Total Transaksi</div>
            <div className="text-xl font-black font-mono text-white">
              {sales.length} Transaksi
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <div className="text-xs text-slate-400">Stok Mati / Overstock</div>
            <div className="text-xl font-black font-mono text-amber-400">
              {db.stokPerToko.filter((s) => s.stok_sistem > 20).length} SKU
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <div className="text-xs text-slate-400">Kas Harian Fisik</div>
            <div className="text-xl font-black font-mono text-indigo-400">
              Rp {(totalOmzetAll * 0.4).toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
            Pengaturan Wewenang &amp; Pajak (v40.1)
          </h3>

          <div className="space-y-4 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <div className="font-semibold text-slate-200">Manager Boleh Lihat HPP (KEP-22)</div>
                <div className="text-[11px] text-slate-400">Default: False. Jika true, Manager bisa melihat HPP &amp; profit toko dia.</div>
              </div>
              <input
                type="checkbox"
                checked={managerHpp}
                onChange={(e) => setManagerHpp(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 w-4 h-4"
              />
            </label>

            <div>
              <label className="text-slate-400 block mb-1">Mode NPWP Pengusaha</label>
              <select
                value={npwpMode}
                onChange={(e) => setNpwpMode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              >
                <option value="NPWP_PEMILIK">NPWP_PEMILIK (Gunakan NPWP Pemilik untuk Semua Toko)</option>
                <option value="NPWP_TOKO">NPWP_TOKO (NPWP Berbeda Per Toko)</option>
                <option value="TIDAK_PAKE">TIDAK_PAKE (Non-PKP / Belum Pakai NPWP)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition text-xs"
          >
            Simpan Pengaturan
          </button>
        </form>
      )}

      {/* TAB 4: IMPORT CSV */}
      {activeTab === 'import' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            <span>Import Batch Master Data CSV (Barang / Varian / Harga)</span>
          </h3>

          <div className="space-y-2 text-xs">
            <label className="text-slate-400 block">Isi File CSV Contoh:</label>
            <textarea
              rows={4}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
            />
          </div>

          <button
            onClick={handleCsvImport}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition text-xs"
          >
            Jalankan Import CSV
          </button>
        </div>
      )}
    </div>
  );
};
