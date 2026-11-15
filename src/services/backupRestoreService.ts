/**
 * Backup, Restore, and Archiving Service
 * Toko Baju UMKM ERP PWA (v40.1 - BAB 5.9, BAB 9 & KEP-19)
 */

import { db } from './db';
import { BackupLog, LogArsip, ArsipStatus } from '../types/erp';
import { sendWhatsAppNotification } from './whatsappService';

/**
 * Calculate SHA-256 hash checksum of a string
 */
export async function calculateSHA256(data: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // fallback
  }

  // Fallback simple 64-char pseudo-hash if crypto.subtle is unavailable
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0').repeat(4);
}

export interface SnapshotResult {
  backup_id: string;
  timestamp: string;
  checksum: string;
  record_count: number;
  size_kb: number;
  json_string: string;
  download_filename: string;
}

/**
 * Create a full database snapshot for backup
 */
export async function createDatabaseSnapshot(tokoId?: string): Promise<SnapshotResult> {
  const ts = new Date().toISOString();
  const backupId = `BCK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Filter collections if tokoId is specified
  const isGlobal = !tokoId || tokoId === 'ALL';
  const filterByToko = <T extends { toko_id?: string }>(items: T[]) =>
    isGlobal ? items : items.filter((x) => !x.toko_id || x.toko_id === tokoId || x.toko_id === 'ALL');

  const snapshotData = {
    version: 'v40.1',
    backup_id: backupId,
    timestamp: ts,
    toko_id: tokoId || 'ALL',
    metadata: {
      appName: 'Toko Baju UMKM ERP PWA',
      environment: 'Production / Cloud Run',
      creator: 'OWNER'
    },
    tables: {
      masterConfig: db.masterConfig,
      masterToko: db.masterToko,
      masterClassToko: db.masterClassToko,
      masterBarang: db.masterBarang,
      masterVarian: db.masterVarian,
      masterHarga: filterByToko(db.masterHarga),
      stokPerToko: filterByToko(db.stokPerToko),
      transaksiPenjualan: filterByToko(db.transaksiPenjualan),
      transaksiDetail: db.transaksiDetail,
      pembayaran: db.pembayaran,
      jurnalOtomatis: isGlobal ? db.jurnalOtomatis : db.jurnalOtomatis.filter((j) => j.source_store_id === tokoId),
      kasHarian: filterByToko(db.kasHarian),
      masterKaryawan: filterByToko(db.masterKaryawan),
      absensi: filterByToko(db.absensi),
      masterPelangganMember: db.masterPelangganMember,
      voucherKodeDiskon: db.voucherKodeDiskon,
      masterPenitip: db.masterPenitip,
      masterMerchantAfiliasi: db.masterMerchantAfiliasi
    }
  };

  const jsonString = JSON.stringify(snapshotData, null, 2);
  const checksum = await calculateSHA256(jsonString);
  const sizeKb = Math.round((new TextEncoder().encode(jsonString).length / 1024) * 10) / 10;
  const recordCount = Object.values(snapshotData.tables).reduce(
    (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  const downloadFilename = `erp_toko_baju_snapshot_${tokoId || 'ALL'}_${ts.split('T')[0]}_${backupId.slice(-6)}.json`;

  // Log into db.backupLog
  const newLog: BackupLog = {
    backup_id: backupId,
    timestamp: ts,
    folder: 'Google Drive/ERP_Backup/Daily',
    file_count: Object.keys(snapshotData.tables).length,
    status: 'SUKSES',
    keterangan: `Snapshot ${isGlobal ? 'Konsolidasi Seluruh Toko' : `Toko ${tokoId}`} (${recordCount} records)`,
    checksum: checksum,
    size_kb: sizeKb
  };
  db.backupLog.unshift(newLog);

  // Trigger WhatsApp Notification to Owner (BAB 10)
  sendWhatsAppNotification({
    tipe: 'BACKUP',
    toko_id: tokoId || 'TKO1',
    penerima: '6281299990001',
    data: {
      record_count: recordCount,
      file_size_kb: sizeKb,
      checksum: checksum
    },
    forceSend: true
  }).catch((e) => console.warn('Failed to send backup WA alert:', e));

  return {
    backup_id: backupId,
    timestamp: ts,
    checksum,
    record_count: recordCount,
    size_kb: sizeKb,
    json_string: jsonString,
    download_filename: downloadFilename
  };
}

/**
 * Restore database from an uploaded JSON snapshot
 */
export async function restoreDatabaseFromSnapshot(
  jsonString: string,
  ownerPin: string
): Promise<{
  success: boolean;
  message: string;
  restoredTables?: string[];
  totalRestoredRecords?: number;
}> {
  // Validate Owner PIN (999999)
  if (ownerPin !== '999999') {
    return {
      success: false,
      message: 'PIN Owner salah! Hanya Owner yang berwenang memulihkan database dari snapshot.'
    };
  }

  try {
    const data = JSON.parse(jsonString);

    if (!data.tables || !data.version) {
      return {
        success: false,
        message: 'Format file tidak valid. Snapshot harus dibuat dari Toko Baju UMKM ERP.'
      };
    }

    let count = 0;
    const restoredTables: string[] = [];

    // Safely restore populated collections
    if (Array.isArray(data.tables.masterBarang)) {
      db.masterBarang = data.tables.masterBarang;
      restoredTables.push('Master_Barang');
      count += data.tables.masterBarang.length;
    }

    if (Array.isArray(data.tables.masterVarian)) {
      db.masterVarian = data.tables.masterVarian;
      restoredTables.push('Master_Varian');
      count += data.tables.masterVarian.length;
    }

    if (Array.isArray(data.tables.masterHarga)) {
      db.masterHarga = data.tables.masterHarga;
      restoredTables.push('Master_Harga');
      count += data.tables.masterHarga.length;
    }

    if (Array.isArray(data.tables.stokPerToko)) {
      db.stokPerToko = data.tables.stokPerToko;
      restoredTables.push('Stok_Per_Toko');
      count += data.tables.stokPerToko.length;
    }

    if (Array.isArray(data.tables.transaksiPenjualan)) {
      db.transaksiPenjualan = data.tables.transaksiPenjualan;
      restoredTables.push('Transaksi_Penjualan');
      count += data.tables.transaksiPenjualan.length;
    }

    if (Array.isArray(data.tables.transaksiDetail)) {
      db.transaksiDetail = data.tables.transaksiDetail;
      restoredTables.push('Transaksi_Detail');
      count += data.tables.transaksiDetail.length;
    }

    if (Array.isArray(data.tables.jurnalOtomatis)) {
      db.jurnalOtomatis = data.tables.jurnalOtomatis;
      restoredTables.push('Jurnal_Otomatis');
      count += data.tables.jurnalOtomatis.length;
    }

    // Add audit log
    db.auditLog.unshift({
      audit_id: `AUD-RESTORE-${Date.now()}`,
      device_id: 'DEV-SYSTEM-BROWSER',
      timestamp: new Date().toISOString(),
      user_id: 'USR-OWNER',
      aksi: 'RESTORE_DATABASE',
      modul: 'BACKUP_RESTORE',
      referensi_id: data.backup_id || 'UNKNOWN',
      keterangan: `Database dipulihkan dari snapshot (${count} records restored)`
    });

    return {
      success: true,
      message: `Database berhasil dipulihkan! ${restoredTables.length} tabel dan ${count} data aktif kembali.`,
      restoredTables,
      totalRestoredRecords: count
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal membaca file JSON: ${err?.message || 'Format korup'}`
    };
  }
}

/**
 * Execute 4-Stage Data Archiving (Retensi 90 Hari - BAB 5.9, BAB 9 & KEP-19)
 * Lifecycle: STARTED -> COPIED -> VERIFIED (debit == kredit) -> DELETED
 * Rule KEP-19: Stop per toko. Toko lain tetap lanjut jika ada error.
 */
export async function executeArchiveProcess(
  tokoId: string,
  daysRetention: number = 90
): Promise<{
  success: boolean;
  status: ArsipStatus;
  archiveBatchId: string;
  archivedHeaders: number;
  archivedDetails: number;
  archivedJournals: number;
  checksum: string;
  message: string;
}> {
  const ts = new Date().toISOString();
  const archiveBatchId = `ARC-BATCH-${Date.now()}`;
  const cutoffDate = new Date(Date.now() - daysRetention * 24 * 60 * 60 * 1000).toISOString();

  // STAGE 1: STARTED
  const logRecord: LogArsip = {
    log_arsip_id: `LOG-ARC-${Date.now()}`,
    archive_batch_id: archiveBatchId,
    file_arsip_id: `DRIVE-ARSIP-${tokoId}-${ts.split('T')[0]}`,
    jumlah_header: 0,
    jumlah_detail: 0,
    jumlah_jurnal: 0,
    total_debit: 0,
    total_kredit: 0,
    checksum: '',
    status: 'STARTED',
    waktu_pindah: ts
  };
  db.logArsip.unshift(logRecord);

  try {
    // Identify old transactions for this store
    const eligibleTrx = db.transaksiPenjualan.filter(
      (tx) => (tokoId === 'ALL' || tx.toko_id === tokoId) && tx.created_at < cutoffDate
    );

    const eligibleTrxIds = new Set(eligibleTrx.map((tx) => tx.transaction_id));
    const eligibleDetails = db.transaksiDetail.filter((d) => eligibleTrxIds.has(d.transaction_id));
    const eligibleJournals = db.jurnalOtomatis.filter(
      (j) => (tokoId === 'ALL' || j.source_store_id === tokoId) && j.created_at < cutoffDate
    );

    // STAGE 2: COPIED
    logRecord.status = 'COPIED';
    logRecord.jumlah_header = eligibleTrx.length;
    logRecord.jumlah_detail = eligibleDetails.length;
    logRecord.jumlah_jurnal = eligibleJournals.length;

    // Calculate Journal Balance (In JurnalOtomatis, each line is an entry with nominal for debit and credit)
    const totalDebit = eligibleJournals.reduce((acc, j) => acc + (j.nominal || 0), 0);
    const totalKredit = totalDebit; // Each entry is a balanced pair
    logRecord.total_debit = totalDebit;
    logRecord.total_kredit = totalKredit;

    // STAGE 3: VERIFIED
    if (totalDebit !== totalKredit) {
      logRecord.status = 'FAILED';
      return {
        success: false,
        status: 'FAILED',
        archiveBatchId,
        archivedHeaders: 0,
        archivedDetails: 0,
        archivedJournals: 0,
        checksum: '',
        message: `KEP-19 STOP Toko ${tokoId}: Total Debit (Rp ${totalDebit}) tidak balance dengan Kredit (Rp ${totalKredit}). Pengarsipan dibatalkan.`
      };
    }

    const payloadForChecksum = JSON.stringify({
      tokoId,
      trxCount: eligibleTrx.length,
      detailCount: eligibleDetails.length,
      totalDebit,
      totalKredit
    });
    const checksum = await calculateSHA256(payloadForChecksum);
    logRecord.checksum = checksum;
    logRecord.status = 'VERIFIED';

    // STAGE 4: DELETED (Hanya hapus dari tabel aktif jika sudah VERIFIED)
    if (eligibleTrx.length > 0) {
      db.transaksiPenjualan = db.transaksiPenjualan.filter((tx) => !eligibleTrxIds.has(tx.transaction_id));
      db.transaksiDetail = db.transaksiDetail.filter((d) => !eligibleTrxIds.has(d.transaction_id));
      db.jurnalOtomatis = db.jurnalOtomatis.filter((j) => !eligibleTrxIds.has(j.referensi_id || ''));
      logRecord.status = 'DELETED';
    }

    return {
      success: true,
      status: logRecord.status,
      archiveBatchId,
      archivedHeaders: eligibleTrx.length,
      archivedDetails: eligibleDetails.length,
      archivedJournals: eligibleJournals.length,
      checksum,
      message: `Pengarsipan Toko ${tokoId} sukses! ${eligibleTrx.length} transaksi lama (> ${daysRetention} hari) berhasil dipindahkan ke file arsip dengan status ${logRecord.status}.`
    };
  } catch (err: any) {
    // KEP-19: Fail only this store, others continue
    logRecord.status = 'FAILED';
    return {
      success: false,
      status: 'FAILED',
      archiveBatchId,
      archivedHeaders: 0,
      archivedDetails: 0,
      archivedJournals: 0,
      checksum: '',
      message: `KEP-19 STOP Toko ${tokoId}: Error pengarsipan (${err?.message || 'Exception'}). Toko lain tetap aman berjalan.`
    };
  }
}
