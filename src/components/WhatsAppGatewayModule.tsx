/**
 * WhatsApp Notification Gateway Module
 * Toko Baju UMKM ERP PWA (v40.1 - BAB 10 & KEP-09)
 */

import React, { useState } from 'react';
import { db } from '../services/db';
import {
  NotifikasiWA,
  NotifikasiWaTipe,
  Role
} from '../types/erp';
import {
  sendWhatsAppNotification,
  getClickToChatUrl,
  getWAGatewayConfig,
  saveWAGatewayConfig,
  checkKEP09Window,
  generateWAMessage,
  formatPhoneNumber,
  WAGatewayConfig
} from '../services/whatsappService';
import {
  MessageSquare,
  Send,
  ExternalLink,
  ShieldAlert,
  Clock,
  Settings,
  Search,
  Filter,
  CheckCheck,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Phone,
  Store,
  DollarSign,
  Package,
  UserCheck
} from 'lucide-react';

interface WhatsAppGatewayModuleProps {
  currentStoreId: string;
  currentRole: Role;
}

export const WhatsAppGatewayModule: React.FC<WhatsAppGatewayModuleProps> = ({
  currentStoreId,
  currentRole
}) => {
  // Notification history list state
  const [logs, setLogs] = useState<NotifikasiWA[]>([...db.notifikasiWA]);
  const [selectedToko, setSelectedToko] = useState<string>('ALL');
  const [selectedTipe, setSelectedTipe] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Composer Form State
  const [composeTipe, setComposeTipe] = useState<NotifikasiWaTipe>('TUTUP_KAS');
  const [composeTokoId, setComposeTokoId] = useState<string>(currentStoreId);
  const [composePhone, setComposePhone] = useState<string>('6281299990001');
  const [composeRecipientName, setComposeRecipientName] = useState<string>('Bpk. Hendra (Owner)');
  const [composeData, setComposeData] = useState<Record<string, any>>({
    toko_id: currentStoreId,
    toko_nama: db.masterToko.find((t) => t.toko_id === currentStoreId)?.nama || currentStoreId,
    kasir_nama: 'Siti Rahmawati',
    total_trx: 24,
    total_omzet: 3450000,
    total_tunai: 2100000,
    total_fisik: 2100000,
    selisih: 0,
    modal_awal: 200000,
    sku: 'DTM-TSH-COT-OVS-001-BLK-M',
    nama_barang: 'Oversized T-Shirt Cotton Combed 24s',
    sisa_qty: 1,
    customer_nama: 'Ibu Linda (Grosir Solo)',
    invoice_no: 'INV-202611-008',
    sisa_tagihan: 1250000,
    jatuh_tempo: '15 Nov 2026',
    penitip_nama: 'Ibu Maryam (Gamis Syari)',
    periode: 'November 2026',
    total_pcs: 12,
    omzet: 1800000,
    bagi_hasil_pct: 20,
    bagi_hasil: 360000,
    bersih: 1440000,
    karyawan_nama: 'Siti Rahmawati',
    gaji_pokok: 3200000,
    insentif: 350000,
    bonus_lembur: 200000,
    potongan: 50000,
    gaji_bersih: 3700000,
    failed_count: 3,
    device_nama: 'Tablet Kasir Utama'
  });

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [gatewayConfig, setGatewayConfig] = useState<WAGatewayConfig>(getWAGatewayConfig());
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchToko = selectedToko === 'ALL' || log.toko_id === selectedToko;
    const matchTipe = selectedTipe === 'ALL' || log.tipe === selectedTipe;
    const matchSearch =
      log.isi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.penerima.includes(searchQuery) ||
      log.notif_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchToko && matchTipe && matchSearch;
  });

  // Generated preview text
  const previewMessage = generateWAMessage(composeTipe, composeData);
  const kep09Check = checkKEP09Window(composeTipe);

  // Send Action Handler
  const handleSendNotification = async (openWhatsAppDirect: boolean = false) => {
    setFeedbackNotice(null);

    const res = await sendWhatsAppNotification({
      tipe: composeTipe,
      toko_id: composeTokoId,
      penerima: composePhone,
      data: composeData,
      forceSend: true
    });

    setLogs([...db.notifikasiWA]);

    if (openWhatsAppDirect) {
      window.open(res.clickToChatUrl, '_blank');
      setFeedbackNotice(`Pesan dibuka di WhatsApp Web / App untuk nomor ${composePhone}. Catatan tercatat di log.`);
    } else {
      setFeedbackNotice(`Notifikasi [${composeTipe}] berhasil diproses dan disimpan ke Log ERP (ID: ${res.notif_id}).`);
    }
  };

  // Preset Template Select Handler
  const handlePresetSelect = (tipe: NotifikasiWaTipe, defaultPhone: string, defaultName: string) => {
    setComposeTipe(tipe);
    setComposePhone(defaultPhone);
    setComposeRecipientName(defaultName);
  };

  // Save Settings Handler
  const handleSaveSettings = () => {
    saveWAGatewayConfig(gatewayConfig);
    setShowSettingsModal(false);
    setFeedbackNotice('Konfigurasi WhatsApp Gateway berhasil disimpan!');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-950/70 text-emerald-400 border border-emerald-800">
                <MessageSquare className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">WhatsApp Notification Gateway</h1>
              <span className="text-xs bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-800">
                BAB 10 & KEP-09
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pengiriman notifikasi otomatis & manual berformat resmi (13 jenis template) dengan kepatuhan jam operasional KEP-09.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Konfigurasi Gateway</span>
            </button>
          </div>
        </div>

        {/* Rule KEP-09 Banner */}
        <div className="mt-4 p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white">Aturan KEP-09:</strong> Jam kirim non-darurat: <strong>07.00 – 21.00 WIB</strong>. Pesan Darurat (Tutup Kas, PIN Salah, Sync Gagal, Stok Habis) aktif <strong>24 Jam</strong> tanpa batasan.
            </span>
          </div>
          <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
            {kep09Check.allowed ? 'Status: Jam Operasional Aktif' : 'Status: Di Luar Jam Non-Darurat'}
          </span>
        </div>
      </div>

      {/* Feedback Notice */}
      {feedbackNotice && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <span>{feedbackNotice}</span>
          <button onClick={() => setFeedbackNotice(null)} className="text-slate-400 hover:text-white font-bold ml-2">×</button>
        </div>
      )}

      {/* MAIN 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Message Composer & Quick Templates (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Kirim Pesan WhatsApp Resmi</span>
              </h2>
              <span className="text-[11px] text-slate-400">Pilih Template & Data Toko</span>
            </div>

            {/* Quick Action Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400">Template Cepat Siap Pakai:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetSelect('TUTUP_KAS', '6281299990001', 'Bpk. Hendra (Owner)')}
                  className={`p-2 text-left rounded-xl border text-xs transition ${
                    composeTipe === 'TUTUP_KAS'
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    <span>Laporan Tutup Kas</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Ke Owner (24 Jam)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect('STOK_HABIS', '6281299990004', 'Terminal Gudang Pusat')}
                  className={`p-2 text-left rounded-xl border text-xs transition ${
                    composeTipe === 'STOK_HABIS'
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1">
                    <Package className="w-3 h-3 text-amber-400" />
                    <span>Peringatan Stok Tipis</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Ke Tim Gudang Pusat</div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect('SETTLEMENT_PENITIP', '6281234567890', 'Ibu Maryam (Penitip)')}
                  className={`p-2 text-left rounded-xl border text-xs transition ${
                    composeTipe === 'SETTLEMENT_PENITIP'
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-blue-400" />
                    <span>Rekap Konsinyasi</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Ke Mitra Penitip</div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect('GAJI_THR', '6281311223344', 'Siti Rahmawati (Kasir 1)')}
                  className={`p-2 text-left rounded-xl border text-xs transition ${
                    composeTipe === 'GAJI_THR'
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1">
                    <FileSpreadsheet className="w-3 h-3 text-indigo-400" />
                    <span>Slip Gaji Bulanan</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Ke Nomor Karyawan</div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect('PIN_SALAH', '6281299990001', 'Bpk. Hendra (Owner)')}
                  className={`p-2 text-left rounded-xl border text-xs transition ${
                    composeTipe === 'PIN_SALAH'
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                    <span>Alert PIN Salah (Darurat)</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Security Alert 24 Jam</div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect('BACKUP', '6281299990001', 'Bpk. Hendra (Owner)')}
                  className={`p-2 text-left rounded-xl border text-xs transition ${
                    composeTipe === 'BACKUP'
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    <span>Laporan Backup</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Snapshot Cloud Drive</div>
                </button>
              </div>
            </div>

            {/* Detailed Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Pilih Tipe Pesan (13 Enum BAB 10):</label>
                <select
                  value={composeTipe}
                  onChange={(e) => setComposeTipe(e.target.value as NotifikasiWaTipe)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="BUKA_KAS">BUKA_KAS (Operasional Toko)</option>
                  <option value="TUTUP_KAS">TUTUP_KAS (Laporan Omzet Kasir)</option>
                  <option value="STOK_HABIS">STOK_HABIS (Alert Stok Kritis &lt; 2 pcs)</option>
                  <option value="TRANSFER_APPROVE">TRANSFER_APPROVE (Mutasi Antar Toko)</option>
                  <option value="PIUTANG_JATUH_TEMPO">PIUTANG_JATUH_TEMPO (Pengingat Tagihan)</option>
                  <option value="SETTLEMENT_PENITIP">SETTLEMENT_PENITIP (Bagi Hasil Konsinyasi)</option>
                  <option value="ORDER_MARKETPLACE">ORDER_MARKETPLACE (Shopee / TikTok Order)</option>
                  <option value="RETUR_APPROVE">RETUR_APPROVE (Persetujuan Retur)</option>
                  <option value="GAJI_THR">GAJI_THR (Slip Gaji Karyawan)</option>
                  <option value="BACKUP">BACKUP (Laporan Snapshot Database)</option>
                  <option value="PIN_SALAH">PIN_SALAH (Alert Keamanan Darurat)</option>
                  <option value="SYNC_GAGAL">SYNC_GAGAL (Peringatan Sync Putus)</option>
                  <option value="SYNC_UNKNOWN">SYNC_UNKNOWN (Timeout Verifikasi Sync)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Toko Asal:</label>
                <select
                  value={composeTokoId}
                  onChange={(e) => {
                    setComposeTokoId(e.target.value);
                    setComposeData((prev) => ({
                      ...prev,
                      toko_id: e.target.value,
                      toko_nama: db.masterToko.find((t) => t.toko_id === e.target.value)?.nama || e.target.value
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {db.masterToko.filter((t) => t.toko_id !== 'ALL').map((t) => (
                    <option key={t.toko_id} value={t.toko_id}>
                      {t.toko_id} - {t.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Nomor WhatsApp Penerima:</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={composePhone}
                    onChange={(e) => setComposePhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Nama Kontak / Role:</label>
                <input
                  type="text"
                  value={composeRecipientName}
                  onChange={(e) => setComposeRecipientName(e.target.value)}
                  placeholder="Nama Penerima"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleSendNotification(true)}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/40"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka &amp; Kirim di WhatsApp (wa.me)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendNotification(false)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kirim via Gateway Webhook</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WhatsApp Live Bubble Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Preview Chat WhatsApp</span>
              </h3>
              <span className="text-[10px] text-slate-400">Penerima: {composeRecipientName}</span>
            </div>

            {/* Simulated WhatsApp Chat Screen */}
            <div className="bg-[#0b141a] border border-slate-800 rounded-2xl p-4 min-h-[300px] flex flex-col justify-end bg-opacity-95">
              <div className="bg-[#005c4b] text-emerald-50 rounded-2xl rounded-tr-none p-3.5 max-w-[95%] ml-auto shadow-md space-y-2 border border-[#02735e]/40">
                <div className="text-xs font-sans whitespace-pre-wrap leading-relaxed select-all">
                  {previewMessage}
                </div>
                <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-200/70 pt-1">
                  <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
              <span>Nomor Tujuan Internasional:</span>
              <span className="font-mono text-emerald-400 font-semibold">{formatPhoneNumber(composePhone)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Log Riwayat Notifikasi WA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Log Riwayat Pengiriman WhatsApp ({filteredLogs.length} Data)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Pencatatan tabel <code>Notifikasi_WA</code> sesuai skema normatif BAB 4.6 (retensi 90 hari).
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Toko Filter */}
            <select
              value={selectedToko}
              onChange={(e) => setSelectedToko(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="ALL">Semua Toko</option>
              {db.masterToko.filter((t) => t.toko_id !== 'ALL').map((t) => (
                <option key={t.toko_id} value={t.toko_id}>{t.toko_id}</option>
              ))}
            </select>

            {/* Tipe Filter */}
            <select
              value={selectedTipe}
              onChange={(e) => setSelectedTipe(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="ALL">Semua Tipe</option>
              <option value="BUKA_KAS">BUKA_KAS</option>
              <option value="TUTUP_KAS">TUTUP_KAS</option>
              <option value="STOK_HABIS">STOK_HABIS</option>
              <option value="TRANSFER_APPROVE">TRANSFER_APPROVE</option>
              <option value="SETTLEMENT_PENITIP">SETTLEMENT_PENITIP</option>
              <option value="PIN_SALAH">PIN_SALAH</option>
              <option value="GAJI_THR">GAJI_THR</option>
              <option value="BACKUP">BACKUP</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari penerima / isi..."
                className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none w-44"
              />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Toko</th>
                <th className="px-4 py-3">Tipe Enum</th>
                <th className="px-4 py-3">Penerima</th>
                <th className="px-4 py-3">Ringkasan Pesan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredLogs.map((log) => (
                <tr key={log.notif_id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap text-slate-400">
                    {new Date(log.timestamp).toLocaleString('id-ID', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </td>
                  <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                    {log.toko_id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        log.tipe === 'PIN_SALAH' || log.tipe === 'SYNC_GAGAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : log.tipe === 'STOK_HABIS'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {log.tipe}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                    {log.penerima}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-slate-300" title={log.isi}>
                    {log.isi.split('\n')[1] || log.isi}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>{log.status_kirim}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <a
                      href={log.aksi_url || getClickToChatUrl(log.penerima, log.isi)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 border border-slate-700 rounded-lg text-[11px] font-medium transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Buka WA</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gateway Configuration Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>Pengaturan Gateway WhatsApp</span>
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Metode Pengiriman:</label>
                <select
                  value={gatewayConfig.provider}
                  onChange={(e) =>
                    setGatewayConfig({ ...gatewayConfig, provider: e.target.value as any })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="DIRECT_WA_ME">Direct Click-to-Chat (wa.me) - Gratis Tanpa API</option>
                  <option value="FONNTE">Fonnte WhatsApp API Gateway</option>
                  <option value="WABLAS">Wablas WhatsApp Gateway</option>
                </select>
              </div>

              {gatewayConfig.provider !== 'DIRECT_WA_ME' && (
                <>
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">API Token / Secret Key:</label>
                    <input
                      type="password"
                      value={gatewayConfig.apiKey}
                      onChange={(e) => setGatewayConfig({ ...gatewayConfig, apiKey: e.target.value })}
                      placeholder="Masukkan Token Fonnte / Wablas"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Endpoint Webhook URL:</label>
                    <input
                      type="text"
                      value={gatewayConfig.webhookUrl || ''}
                      onChange={(e) => setGatewayConfig({ ...gatewayConfig, webhookUrl: e.target.value })}
                      placeholder="https://api.fonnte.com/send"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Nomor WhatsApp Pengirim Default:</label>
                <input
                  type="text"
                  value={gatewayConfig.senderNumber}
                  onChange={(e) =>
                    setGatewayConfig({ ...gatewayConfig, senderNumber: e.target.value })
                  }
                  placeholder="6281234567890"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-[11px] leading-relaxed">
                Mode <strong>Direct Click-to-Chat (wa.me)</strong> membuka obrolan resmi WhatsApp secara instan dari perangkat kasir/manager tanpa biaya langganan API pihak ketiga.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
