/**
 * WhatsApp Notification Gateway Service
 * Toko Baju UMKM ERP PWA (v40.1 - BAB 10 & KEP-09)
 */

import { db } from './db';
import { NotifikasiWA, NotifikasiWaTipe } from '../types/erp';

export interface SendWAParams {
  tipe: NotifikasiWaTipe;
  toko_id: string;
  penerima: string; // phone number (e.g. "081234567890" or "6281234567890")
  data: Record<string, any>;
  aksi_url?: string;
  forceSend?: boolean; // bypass KEP-09 07-21 window for testing
}

export interface WAGatewayConfig {
  provider: 'DIRECT_WA_ME' | 'FONNTE' | 'WABLAS';
  apiKey: string;
  senderNumber: string;
  webhookUrl?: string;
}

// Default storage for gateway config
let currentConfig: WAGatewayConfig = {
  provider: 'DIRECT_WA_ME',
  apiKey: '',
  senderNumber: '6281234567890',
  webhookUrl: 'https://api.fonnte.com/send'
};

export function getWAGatewayConfig(): WAGatewayConfig {
  try {
    const saved = localStorage.getItem('erp_wa_config');
    if (saved) {
      currentConfig = JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return currentConfig;
}

export function saveWAGatewayConfig(config: WAGatewayConfig) {
  currentConfig = config;
  try {
    localStorage.setItem('erp_wa_config', JSON.stringify(config));
  } catch {
    // ignore
  }
}

/**
 * Clean Indonesian phone number into standard 62xxx international format
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * KEP-09:
 * Laporan tutup kas kirim segera, tanpa batas.
 * Notifikasi non-darurat 07–21 WIB.
 * Darurat (void, PIN salah, gagal sync) selalu kirim 24 jam.
 */
export function checkKEP09Window(tipe: NotifikasiWaTipe): { allowed: boolean; reason?: string } {
  const isEmergency = [
    'PIN_SALAH',
    'SYNC_GAGAL',
    'SYNC_UNKNOWN',
    'TUTUP_KAS',
    'STOK_HABIS'
  ].includes(tipe);

  if (isEmergency) {
    return { allowed: true };
  }

  // Check current local hour (07:00 - 21:00)
  const currentHour = new Date().getHours();
  if (currentHour < 7 || currentHour >= 21) {
    return {
      allowed: false,
      reason: `Aturan KEP-09: Notifikasi non-darurat (${tipe}) dibatasi antara jam 07:00 - 21:00 WIB untuk menjaga kenyamanan penerima.`
    };
  }

  return { allowed: true };
}

/**
 * Generate official notification message according to Toko Baju UMKM standard templates
 */
export function generateWAMessage(tipe: NotifikasiWaTipe, data: Record<string, any>): string {
  const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  switch (tipe) {
    case 'BUKA_KAS':
      return `*[ERP Toko Baju]* 🟢 *BUKA KAS HARIAN*
Toko: ${data.toko_nama || data.toko_id}
Kasir: ${data.kasir_nama || 'Kasir Bertugas'}
Modal Awal: Rp ${(data.modal_awal || 0).toLocaleString('id-ID')}
Waktu Buka: ${nowStr}
Catatan: Siap melayani pelanggan toko dengan ramah dan teliti.`;

    case 'TUTUP_KAS':
      return `*[ERP Toko Baju]* 🔴 *LAPORAN TUTUP KAS RESMI*
Toko: ${data.toko_nama || data.toko_id}
Kasir: ${data.kasir_nama || 'Kasir Bertugas'}
Total Transaksi: ${data.total_trx || 0} struk
Total Omzet: Rp ${(data.total_omzet || 0).toLocaleString('id-ID')}
Kas Masuk Tunai: Rp ${(data.total_tunai || 0).toLocaleString('id-ID')}
Uang Fisik Kasir: Rp ${(data.total_fisik || 0).toLocaleString('id-ID')}
Selisih Kas: Rp ${(data.selisih || 0).toLocaleString('id-ID')} ${data.selisih === 0 ? '(SEIMBANG ✓)' : '(SELISIH ⚠️)'}
Waktu Tutup: ${nowStr}`;

    case 'STOK_HABIS':
      return `*[ERP Toko Baju]* ⚠️ *PERINGATAN STOK MENIPIS*
Toko: ${data.toko_nama || data.toko_id}
SKU: ${data.sku}
Nama Produk: ${data.nama_barang || 'Apparel'}
Sisa Stok: *${data.sisa_qty || 0} pcs*
Ambang Batas: 2 pcs
Tindakan: Harap segera buat permintaan Transfer Stok dari Gudang Pusat!`;

    case 'TRANSFER_APPROVE':
      return `*[ERP Toko Baju]* 📦 *PERSETUJUAN TRANSFER STOK*
No. Transfer: ${data.transfer_id}
Dari Toko: ${data.dari_toko} ➡️ Ke Toko: ${data.ke_toko}
Jumlah: ${data.total_qty || 0} pcs (${data.total_sku || 1} SKU)
Total Nilai: Rp ${(data.total_nilai || 0).toLocaleString('id-ID')}
Penyetuju: ${data.approver_nama || 'Manager / Owner'}
Status: *DISETUJUI & SIAP DIKIRIM*`;

    case 'PIUTANG_JATUH_TEMPO':
      return `*[ERP Toko Baju]* ⏳ *PENGINGAT JATUH TEMPO PIUTANG*
Yth. Bpk/Ibu ${data.customer_nama},
No. Invoice: ${data.invoice_no}
Sisa Tagihan: *Rp ${(data.sisa_tagihan || 0).toLocaleString('id-ID')}*
Jatuh Tempo: ${data.jatuh_tempo}
Mohon kesediaannya untuk melakukan pembayaran melalui rekening resmi Toko Baju UMKM. Terima kasih atas kerja samanya.`;

    case 'SETTLEMENT_PENITIP':
      return `*[ERP Toko Baju]* 🤝 *REKAP KONSINYASI PENITIP*
Mitra: Yth. Ibu/Bpk ${data.penitip_nama}
Periode: ${data.periode || 'Bulan Ini'}
Barang Terjual: ${data.total_pcs || 0} pcs
Omzet Terjual: Rp ${(data.omzet || 0).toLocaleString('id-ID')}
Bagi Hasil Toko (${data.bagi_hasil_pct || 20}%): Rp ${(data.bagi_hasil || 0).toLocaleString('id-ID')}
*HAK BERSIH PENITIP: Rp ${(data.bersih || 0).toLocaleString('id-ID')}*
Status: Siap Ditransfer ke Rekening Mitra.`;

    case 'ORDER_MARKETPLACE':
      return `*[ERP Toko Baju]* 🛍️ *PESANAN BARU MARKETPLACE*
Channel: ${data.channel || 'SHOPEE / TIKTOK'}
Order ID: ${data.order_id}
Total Belanja: Rp ${(data.total || 0).toLocaleString('id-ID')}
Daftar Item: ${data.items_summary || '1 pcs Baju Pilihan'}
Kurir Pengiriman: ${data.kurir || 'JNE / GoSend'}
Status: Harap segera diproses dan dipacking sebelum pukul 15.00 WIB.`;

    case 'RETUR_APPROVE':
      return `*[ERP Toko Baju]* 🔄 *PERSETUJUAN RETUR BARANG*
No. Retur: ${data.retur_id}
Pelanggan: ${data.customer_nama}
Alasan Retur: ${data.alasan}
Jenis Penyelesaian: ${data.jenis_retur || 'Tukar Ukuran'}
Disetujui Oleh: ${data.approver_nama || 'Manager Toko'}`;

    case 'GAJI_THR':
      return `*[ERP Toko Baju]* 💰 *SLIP GAJI BULANAN KARYAWAN*
Yth. Rekan ${data.karyawan_nama}
Periode: ${data.periode}
Gaji Pokok: Rp ${(data.gaji_pokok || 0).toLocaleString('id-ID')}
Insentif Penjualan: Rp ${(data.insentif || 0).toLocaleString('id-ID')}
Bonus & Lembur: Rp ${(data.bonus_lembur || 0).toLocaleString('id-ID')}
Potongan (Kasbon/Telat): Rp ${(data.potongan || 0).toLocaleString('id-ID')}
-----------------------------------------
*TOTAL DITERIMA (TAKE HOME PAY): Rp ${(data.gaji_bersih || 0).toLocaleString('id-ID')}*
Status: DIBAYAR LUNAS ✓
Terima kasih atas dedikasi dan kerja keras Anda bersama Toko Baju UMKM.`;

    case 'BACKUP':
      return `*[ERP Toko Baju]* 💾 *LAPORAN SNAPSHOT BACKUP DATABASE*
Target: Google Drive Cloud Backup (Fase 1)
Waktu Backup: ${nowStr}
Status: *BERHASIL 100%*
Total Record Tersimpan: ${data.record_count || 120} data
Ukuran File: ${data.file_size_kb || 48} KB
Hash Checksum SHA256: ${data.checksum || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
Data aman dan terarsip dengan baik.`;

    case 'PIN_SALAH':
      return `*[ERP Toko Baju]* 🚨 *ALERT KEAMANAN: PERCOBAAN PIN SALAH!*
Toko: ${data.toko_nama || data.toko_id}
Terminal Device: ${data.device_nama || 'Kasir 1'}
Target Karyawan: ${data.karyawan_nama || 'Kasir/Manager'}
Jumlah Percobaan Gagal: *${data.failed_count || 3}x berturut-turut*
Waktu: ${nowStr}
Tindakan: Akses terminal sementara dibekukan. Harap hubungi Owner!`;

    case 'SYNC_GAGAL':
      return `*[ERP Toko Baju]* ⚠️ *PERINGATAN: SYNC PUSAT GAGAL*
Toko: ${data.toko_nama || data.toko_id}
Batch ID: ${data.batch_id}
Penyebab: ${data.error_msg || 'Koneksi internet terputus atau timeout'}
Waktu Kejadian: ${nowStr}
Status: Transaksi tetap aman tersimpan di IndexedDB lokal dan akan dicoba kembali otomatis.`;

    case 'SYNC_UNKNOWN':
      return `*[ERP Toko Baju]* ❓ *ALERT STATUS SYNC UNKNOWN*
Toko: ${data.toko_nama || data.toko_id}
Batch ID: ${data.batch_id}
Keterangan: Server Google Sheets tidak mengembalikan response dalam 30 detik.
Tindakan: Sistem memanggil endpoint sync_status untuk verifikasi apakah batch sudah tercatat.`;

    default:
      return `*[ERP Toko Baju]* Informasi Toko: ${JSON.stringify(data)}`;
  }
}

/**
 * Generate WhatsApp Direct Click-to-Chat URL
 */
export function getClickToChatUrl(phone: string, text: string): string {
  const formattedPhone = formatPhoneNumber(phone);
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;
}

/**
 * Send WhatsApp Notification (Writes to db.notifikasiWA, returns ClickToChat link & webhook status)
 */
export async function sendWhatsAppNotification(params: SendWAParams): Promise<{
  success: boolean;
  notif_id: string;
  messageText: string;
  clickToChatUrl: string;
  kep09Warning?: string;
  error?: string;
}> {
  // Check KEP-09 time window
  const windowCheck = checkKEP09Window(params.tipe);
  let kep09Warning: string | undefined;

  if (!windowCheck.allowed && !params.forceSend) {
    kep09Warning = windowCheck.reason;
  }

  const messageText = generateWAMessage(params.tipe, params.data);
  const clickToChatUrl = getClickToChatUrl(params.penerima, messageText);
  const notifId = `NOTIF-WA-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const newRecord: NotifikasiWA = {
    notif_id: notifId,
    toko_id: params.toko_id,
    timestamp: new Date().toISOString(),
    tipe: params.tipe,
    penerima: formatPhoneNumber(params.penerima),
    isi: messageText,
    status_kirim: 'TERKIRIM',
    aksi_url: params.aksi_url || clickToChatUrl
  };

  // Prepend to database
  db.notifikasiWA.unshift(newRecord);

  // If Fonnte / Wablas API key is configured, simulate or trigger external HTTP POST
  const cfg = getWAGatewayConfig();
  if (cfg.provider === 'FONNTE' && cfg.apiKey) {
    try {
      fetch(cfg.webhookUrl || 'https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: cfg.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: formatPhoneNumber(params.penerima),
          message: messageText
        })
      }).catch((e) => console.warn('External WA Gateway webhook call:', e));
    } catch {
      // ignore
    }
  }

  return {
    success: true,
    notif_id: notifId,
    messageText,
    clickToChatUrl,
    kep09Warning
  };
}
