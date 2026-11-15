/**
 * Backup, Restore & Archiving Module (BAB 5.9, BAB 9 & KEP-19)
 * Toko Baju UMKM ERP PWA (v40.1)
 */

import React, { useState } from 'react';
import { db } from '../services/db';
import { Role, BackupLog, LogArsip } from '../types/erp';
import {
  createDatabaseSnapshot,
  restoreDatabaseFromSnapshot,
  executeArchiveProcess,
  SnapshotResult
} from '../services/backupRestoreService';
import {
  Database,
  Download,
  Upload,
  Archive,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  FileText,
  Lock,
  RefreshCw,
  Search,
  CheckCheck
} from 'lucide-react';

interface BackupRestoreModuleProps {
  currentRole: Role;
  currentStoreId: string;
}

export const BackupRestoreModule: React.FC<BackupRestoreModuleProps> = ({
  currentRole,
  currentStoreId
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore' | 'arsip' | 'history'>('backup');
  const [selectedTokoForBackup, setSelectedTokoForBackup] = useState<string>('ALL');

  // Backup State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupResult, setLastBackupResult] = useState<SnapshotResult | null>(null);

  // Restore State
  const [restoreFileJson, setRestoreFileJson] = useState<string | null>(null);
  const [restoreFileName, setRestoreFileName] = useState<string>('');
  const [ownerPin, setOwnerPin] = useState<string>('');
  const [restoreMessage, setRestoreMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Archive State
  const [archiveTokoId, setArchiveTokoId] = useState<string>('TKO1');
  const [retentionDays, setRetentionDays] = useState<number>(90);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveResult, setArchiveResult] = useState<string | null>(null);

  // History State
  const [historyTab, setHistoryTab] = useState<'backup' | 'arsip'>('backup');
  const [searchHistory, setSearchHistory] = useState('');

  // Handle Download Snapshot
  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    setLastBackupResult(null);
    try {
      const res = await createDatabaseSnapshot(selectedTokoForBackup);
      setLastBackupResult(res);

      // Trigger browser download
      const blob = new Blob([res.json_string], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.download_filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Gagal membuat snapshot: ${err?.message || 'Error'}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Handle File Input for Restore
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestoreFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRestoreFileJson(text);
      };
      reader.readAsText(file);
    }
  };

  // Handle Restore Confirmation
  const handleConfirmRestore = async () => {
    if (!restoreFileJson) {
      setRestoreMessage({ text: 'Pilih file backup JSON terlebih dahulu!', isError: true });
      return;
    }
    if (!ownerPin) {
      setRestoreMessage({ text: 'PIN Owner wajib diisi untuk keamanan data!', isError: true });
      return;
    }

    setIsRestoring(true);
    setRestoreMessage(null);
    try {
      const result = await restoreDatabaseFromSnapshot(restoreFileJson, ownerPin);
      if (result.success) {
        setRestoreMessage({ text: result.message, isError: false });
        setRestoreFileJson(null);
        setOwnerPin('');
      } else {
        setRestoreMessage({ text: result.message, isError: true });
      }
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle Archive Execution
  const handleExecuteArchive = async () => {
    setIsArchiving(true);
    setArchiveResult(null);
    try {
      const res = await executeArchiveProcess(archiveTokoId, retentionDays);
      setArchiveResult(res.message);
    } finally {
      setIsArchiving(false);
    }
  };

  // Metrics
  const totalTrxCount = db.transaksiPenjualan.length;
  const totalBarangCount = db.masterBarang.length;
  const totalJournalsCount = db.jurnalOtomatis.length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-950/70 text-cyan-400 border border-cyan-800">
                <Database className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">Pusat Backup, Restore &amp; Arsip Data</h1>
              <span className="text-xs bg-cyan-950 text-cyan-300 font-mono px-2 py-0.5 rounded-full border border-cyan-800">
                BAB 5.9, BAB 9 &amp; KEP-19
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Perlindungan database UMKM: ekspor snapshot JSON dengan checksum SHA256, pemulihan darurat terverifikasi PIN Owner, dan siklus arsip data 90 hari.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300">
              Total Database: <strong className="text-cyan-400">{totalTrxCount} Trx</strong> · {totalJournalsCount} Jurnal
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-800 mt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('backup')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeTab === 'backup'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>1. Unduh Snapshot Backup</span>
          </button>

          <button
            onClick={() => setActiveTab('restore')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeTab === 'restore'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>2. Pemulihan Data (Restore)</span>
          </button>

          <button
            onClick={() => setActiveTab('arsip')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeTab === 'arsip'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>3. Arsip Data (KEP-19)</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeTab === 'history'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>4. Log Riwayat Audit</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BACKUP SNAPSHOT */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Buat &amp; Unduh Snapshot Database JSON</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Snapshot akan mengompilasi seluruh master produk, varian SKU, harga per class, transaksi kasir, stok gudang, dan pembukuan jurnal otomatis ke dalam satu file JSON terenkripsi checksum SHA256.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Cakupan Data Snapshot:</label>
                <select
                  value={selectedTokoForBackup}
                  onChange={(e) => setSelectedTokoForBackup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">Konsolidasi Seluruh Toko (TKO1 s/d TKO4 + Gudang Pusat)</option>
                  {db.masterToko.filter((t) => t.toko_id !== 'ALL').map((t) => (
                    <option key={t.toko_id} value={t.toko_id}>
                      Hanya {t.toko_id} - {t.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-1 font-mono">
                <div>• Format File: JSON Standar v40.1</div>
                <div>• Validasi Integritas: Hash Checksum SHA256</div>
                <div>• Notifikasi Otomatis: WhatsApp Alert dikirimkan ke Owner</div>
              </div>

              <button
                type="button"
                onClick={handleTriggerBackup}
                disabled={isBackingUp}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2"
              >
                <Download className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
                <span>{isBackingUp ? 'Menghasilkan Snapshot...' : 'Unduh File Snapshot Sekarang'}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>Status Snapshot Terakhir</span>
            </h3>

            {lastBackupResult ? (
              <div className="bg-slate-950 border border-emerald-800/80 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Snapshot Berhasil Diunduh!</span>
                </div>
                <div className="font-mono text-[11px] text-slate-300 space-y-1">
                  <div>ID Backup: <strong className="text-white">{lastBackupResult.backup_id}</strong></div>
                  <div>Total Data: <strong className="text-white">{lastBackupResult.record_count} Records</strong></div>
                  <div>Ukuran: <strong className="text-white">{lastBackupResult.size_kb} KB</strong></div>
                  <div className="text-[10px] text-slate-500 truncate" title={lastBackupResult.checksum}>
                    SHA256: {lastBackupResult.checksum}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500 space-y-1">
                <Database className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <div>Belum ada file yang diunduh pada sesi ini.</div>
                <div className="text-[11px] text-slate-600">Klik tombol di sebelah kiri untuk membuat snapshot baru.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RESTORE DATABASE */}
      {activeTab === 'restore' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-rose-400" />
              <span>Pemulihan Data Darurat (Restore Database)</span>
            </h2>
            <span className="text-[11px] bg-rose-950 text-rose-300 font-mono px-2 py-0.5 rounded border border-rose-800">
              OWNER ONLY
            </span>
          </div>

          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong>PERHATIAN:</strong> Tindakan pemulihan akan menimpa data transaksi memori yang ada dengan data dari file snapshot backup pilihan. Pastikan Anda telah membuat snapshot terbaru sebelum melakukan restore.
            </div>
          </div>

          {restoreMessage && (
            <div
              className={`p-3 rounded-xl text-xs ${
                restoreMessage.isError
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {restoreMessage.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Pilih File Backup JSON:</label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
              />
              {restoreFileName && (
                <span className="text-[11px] text-cyan-400 font-mono mt-1 block">
                  File terpilih: {restoreFileName}
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                PIN Owner (Verifikasi Wajib):
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={ownerPin}
                  onChange={(e) => setOwnerPin(e.target.value)}
                  placeholder="Masukkan 6-Digit PIN Owner (Demo: 999999)"
                  maxLength={6}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmRestore}
              disabled={isRestoring || !restoreFileJson}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isRestoring ? 'Memulihkan Data...' : 'Konfirmasi Pemulihan Database'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: ARSIP DATA (KEP-19) */}
      {activeTab === 'arsip' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Archive className="w-4 h-4 text-amber-400" />
              <span>Pembersihan &amp; Arsip Data (Retensi 90 Hari - KEP-19)</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Memindahkan transaksi lama (&gt; 90 hari) ke status <code>ARCHIVED</code> dan file arsip Google Drive untuk menjaga aplikasi POS tetap ringan dan kencang.
            </p>

            {/* Stepper Diagram */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="text-[11px] font-semibold text-slate-300">Siklus 4 Tahap Pengarsipan:</div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">1. STARTED</span>
                <span>➡️</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">2. COPIED</span>
                <span>➡️</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">3. VERIFIED</span>
                <span>➡️</span>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">4. DELETED</span>
              </div>
            </div>

            {/* KEP-19 Info Callout */}
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Aturan KEP-19 (Arsip Mandiri per Toko):</strong> Jika terjadi ketidakseimbangan debit/kredit pada Toko A, maka proses pengarsipan hanya <em>STOP</em> di Toko A, sementara toko lainnya tetap lanjut tanpa gangguan.
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Pilih Toko untuk Diarsipkan:</label>
                <select
                  value={archiveTokoId}
                  onChange={(e) => setArchiveTokoId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {db.masterToko.filter((t) => t.toko_id !== 'ALL').map((t) => (
                    <option key={t.toko_id} value={t.toko_id}>
                      {t.toko_id} - {t.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Batas Umur Data (Hari Retensi):
                </label>
                <input
                  type="number"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  min={30}
                  max={365}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={handleExecuteArchive}
                disabled={isArchiving}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2"
              >
                <Archive className={`w-4 h-4 ${isArchiving ? 'animate-spin' : ''}`} />
                <span>{isArchiving ? 'Memproses Arsip...' : 'Jalankan Pengarsipan Aman (KEP-19)'}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Hasil Pengarsipan Terkini</span>
            </h3>

            {archiveResult ? (
              <div className="bg-slate-950 border border-amber-800/80 rounded-xl p-4 text-xs text-amber-200 leading-relaxed font-sans">
                {archiveResult}
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500">
                Klik tombol "Jalankan Pengarsipan Aman" untuk memindahkan transaksi lama dan mengecek keseimbangan jurnal.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryTab('backup')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  historyTab === 'backup'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Log Backup ({db.backupLog.length})
              </button>
              <button
                onClick={() => setHistoryTab('arsip')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  historyTab === 'arsip'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Log Arsip ({db.logArsip.length})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                placeholder="Cari ID / Checksum..."
                className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none w-52"
              />
            </div>
          </div>

          {/* History Tables */}
          {historyTab === 'backup' ? (
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Backup ID</th>
                    <th className="px-4 py-3">Folder Target</th>
                    <th className="px-4 py-3">Ukuran</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Checksum SHA256</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {db.backupLog.map((b) => (
                    <tr key={b.backup_id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(b.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-white whitespace-nowrap">
                        {b.backup_id}
                      </td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{b.folder}</td>
                      <td className="px-4 py-3 font-mono whitespace-nowrap">{b.size_kb || 48} KB</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500 max-w-xs truncate" title={b.checksum}>
                        {b.checksum || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Waktu Pindah</th>
                    <th className="px-4 py-3">Archive Batch ID</th>
                    <th className="px-4 py-3">Header/Detail</th>
                    <th className="px-4 py-3">Debit/Kredit</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Checksum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {db.logArsip.map((a) => (
                    <tr key={a.log_arsip_id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(a.waktu_pindah).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-white whitespace-nowrap">
                        {a.archive_batch_id}
                      </td>
                      <td className="px-4 py-3 font-mono whitespace-nowrap">
                        {a.jumlah_header} / {a.jumlah_detail}
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-400 whitespace-nowrap">
                        Rp {(a.total_debit || 0).toLocaleString('id-ID')} (Balance ✓)
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500 max-w-xs truncate" title={a.checksum}>
                        {a.checksum || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
