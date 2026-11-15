/**
 * Canonical ERP Data Dictionary & API Contract Types
 * BLUEPRINT ERP PWA + GAS — TOKO BAJU UMKM (v40 + v40.1 Patch)
 */

// --------------------------------------------------
// ENUM TYPES
// --------------------------------------------------
export type Role = 'OWNER' | 'MANAGER' | 'KASIR' | 'GUDANG';
export type EmployeeType = 'KASIR' | 'SPG' | 'GUDANG' | 'MANAGER';
export type JenisBarang = 'OWN' | 'CNS' | 'AFF';
export type SyncStatus = 'PENDING_SYNC' | 'SENT' | 'UNKNOWN' | 'SYNCED' | 'FAILED' | 'ARCHIVED';
export type StatusRangkaian = 'BELUM_UTUH' | 'SELESAI_UTUH';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED' | 'VOID';
export type TransactionStatus = 'DRAFT' | 'PENDING_PAYMENT' | 'PAID' | 'VOID_REQUESTED' | 'VOID' | 'RETUR_REQUESTED' | 'SELESAI';
export type PaymentMethod = 'TUNAI' | 'QRIS' | 'TRANSFER' | 'DP';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type ApprovalType = 'VOID' | 'DISKON' | 'TRANSFER' | 'OPNAME' | 'DARURAT' | 'PELUNASAN' | 'PO' | 'RETUR';
export type TransferStatus = 'DIMINTA' | 'DISETUJUI' | 'DIKIRIM' | 'DITERIMA' | 'DITOLAK' | 'DIBATALKAN';
export type OpnameStatus = 'DRAFT' | 'COUNTING' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'POSTED';
export type ReturStatus = 'DIAJUKAN' | 'DISETUJUI' | 'DITOLAK' | 'BARANG_DITERIMA' | 'SELESAI';
export type JenisRetur = 'TUKAR_SAMA' | 'TUKAR_BEDA' | 'REFUND';
export type JenisVoucher = 'STEMPEL' | 'PROMO' | 'RETUR';
export type PriceType = 'NORMAL' | 'RESELLER' | 'PROMO';
export type SalesChannel = 'TOKO' | 'SHOPEE' | 'TIKTOK' | 'WA' | 'WEBSITE';
export type PajakSkema = 'PPH_FINAL_05' | 'NORMAL' | 'TIDAK_PAKE';
export type ArsipStatus = 'STARTED' | 'COPIED' | 'VERIFIED' | 'DELETED' | 'FAILED';
export type ClassToko = 'A' | 'B' | 'C' | 'D';
export type PembelianPoStatus = 'DRAFT' | 'APPROVED' | 'SENT' | 'RECEIVED' | 'CANCELLED';
export type ReturBeliStatus = 'DIAJUKAN' | 'DISETUJUI' | 'DIKIRIM' | 'DIJAWAB' | 'SELESAI' | 'DITOLAK';
export type KomplainStatus = 'BARU' | 'DIPROSES' | 'SELESAI' | 'DITOLAK';
export type PreorderStatus = 'DP' | 'LUNAS' | 'BATAL' | 'DIAMBIL';
export type GajiStatus = 'DRAFT' | 'DIBAYAR';
export type NotifikasiWaTipe =
  | 'BUKA_KAS' | 'STOK_HABIS' | 'TRANSFER_APPROVE' | 'PIUTANG_JATUH_TEMPO'
  | 'SETTLEMENT_PENITIP' | 'ORDER_MARKETPLACE' | 'RETUR_APPROVE' | 'GAJI_THR'
  | 'TUTUP_KAS' | 'BACKUP' | 'PIN_SALAH' | 'SYNC_GAGAL' | 'SYNC_UNKNOWN';
export type StokMovementTipe = 'JUAL' | 'BELI' | 'TRANSFER' | 'OPNAME' | 'RETUR';
export type MemberTier = 'BARU' | 'LANGGANAN' | 'SULTAN';
export type PenitipTanggungRusak = 'PENITIP' | 'TOKO';
export type BayarJenis =
  | 'PIUTANG' | 'HUTANG_SUPPLIER' | 'UTANG_PENITIP' | 'HUTANG_MERCHANT_AFF'
  | 'KOMISI_AFFILIATE' | 'SETORAN' | 'OPERASIONAL_KECIL' | 'OPERASIONAL_GEDE' | 'KAS_KECIL';
export type KasHarianStatus = 'DRAFT' | 'TUTUP' | 'SELISIH';
export type KasKecilStatus = 'DRAFT' | 'TUTUP';
export type VerifiedStatus = 'BELUM_VERIFIKASI' | 'TERVERIFIKASI' | 'DITOLAK';
export type FailedReason = 'FAILED_CONFLICT' | 'FAILED_VALIDATION';
export type OpnameAlasan = 'HILANG' | 'RUSAK' | 'SALAH_INPUT' | 'SALAH_KIRIM' | 'DICURI';
export type TipeDokumen = 'INVOICE' | 'KWITANSI' | 'SURAT_JALAN' | 'QUOTATION' | 'RETUR';
export type NpwpMode = 'NPWP_PEMILIK' | 'NPWP_TOKO' | 'TIDAK_PAKE';

// Audit Mixin (+4 columns on all tables)
export interface AuditMixin {
  created_at: string; // ISO 8601
  created_by: string;
  updated_at: string;
  updated_by: string;
}

// Sync Header Mixin (+6 columns)
export interface SyncHeaderMixin {
  source_store_id: string;
  sync_batch_id: string;
  sync_status: SyncStatus;
  received_at?: string;
  payload_hash: string;
  created_at_sync: string;
  status_rangkaian?: StatusRangkaian;
  failed_reason?: FailedReason;
  failed_detail?: string;
}

// Sync Detail Mixin (+4 columns)
export interface SyncDetailMixin {
  source_store_id: string;
  sync_batch_id: string;
  payload_hash: string;
  created_at_sync: string;
}

// --------------------------------------------------
// MASTER TABLES
// --------------------------------------------------

export interface MasterBarang extends AuditMixin {
  barang_id: string; // e.g. BRG-001
  nama_manusia: string;
  style_code: string; // ERG-CLN-JNS-001
  merek_id: string;
  kategori_id: string;
  foto_url?: string;
  aktif: boolean;
}

export interface MasterVarian extends AuditMixin {
  sku: string; // e.g. OWN-ERG-CLN-JNS-001-BLU-35
  barang_id: string;
  warna_id: string;
  ukuran_id: string;
  jenis_barang: JenisBarang;
  penitip_id?: string;
  merchant_id?: string;
  barcode_code128: string;
  aktif: boolean;
}

export interface FotoBarang extends AuditMixin {
  foto_id: string;
  barang_id: string;
  foto_url: string;
  urutan: number;
  is_utama: boolean;
}

export interface MasterMerek extends AuditMixin {
  merek_id: string;
  kode_3: string;
  nama: string;
  aktif: boolean;
}

export interface MasterMerchantAfiliasi extends AuditMixin {
  merchant_id: string;
  kode_3: string;
  nama: string;
  wa: string;
  rekening?: string;
  komisi_persen: number; // e.g. 0.20 = 20%
  tempo_bayar_hari: number; // default 7
  aktif: boolean;
}

export interface MasterKategori extends AuditMixin {
  kategori_id: string;
  kode_3: string;
  nama: string;
  aktif: boolean;
}

export interface MasterWarna extends AuditMixin {
  warna_id: string;
  kode_3: string;
  nama: string;
  aktif: boolean;
}

export interface MasterUkuran extends AuditMixin {
  ukuran_id: string;
  kode_3: string;
  nama: string;
  tipe_ukuran: 'ANGKA' | 'HURUF';
  aktif: boolean;
}

export interface MasterToko extends AuditMixin {
  toko_id: string; // TKO1..TKO4, GDG, ALL
  nama: string;
  alamat: string;
  class_id?: string; // Null for GDG
  npwp_toko_id?: string;
  jam_tutup: string;
  wa_start: string;
  wa_end: string;
  aktif: boolean;
}

export interface MasterClassToko extends AuditMixin {
  class_id: string; // A/B/C/D/ALL
  nama: string;
  deskripsi?: string;
}

export interface MasterSettingPajakPerClass extends AuditMixin {
  class_id: string;
  persen_pajak: number; // 0.11 default
  pajak_skema: PajakSkema;
  default_toggle: boolean;
  kasir_boleh_ubah: boolean;
  delivery_kena_pajak: boolean;
  packaging_kena_pajak: boolean;
  pajak_wajib_tampil: boolean;
  price_includes_tax: boolean;
  aktif: boolean;
}

export interface MasterNpwpPemilik extends AuditMixin {
  npwp_id: string;
  nama_wp: string;
  jenis_npwp: string;
  nomor_npwp: string;
  alamat: string;
  no_pkp?: string;
}

export interface MasterNpwpToko extends AuditMixin {
  npwp_toko_id: string;
  toko_id: string;
  nama_wp: string;
  jenis_npwp: string;
  nomor_npwp: string;
  alamat: string;
  no_pkp?: string;
}

export interface MasterSupplier extends AuditMixin {
  supplier_id: string;
  nama: string;
  wa: string;
  rekening?: string;
  tempo_hari: number;
  lead_time_hari: number;
  rating?: number;
}

export interface MasterPenitip extends AuditMixin {
  penitip_id: string;
  nama: string;
  wa: string;
  komisi_persen: number; // 0.20
  settlement_type: 'MINGGUAN' | 'BULANAN' | 'PER_TRANSAKSI';
  masa_titip_hari: number; // 90
  tanggung_rusak: PenitipTanggungRusak;
}

export interface MasterPelangganMember extends AuditMixin {
  customer_id: string;
  nama: string;
  wa: string;
  tgl_lahir?: string;
  tier: MemberTier;
  stempel_count: number;
  total_transaksi: number;
  total_omzet: number;
  npwp_pembeli?: string;
  jenis_npwp_pembeli?: string;
  alamat_npwp?: string;
}

export interface MasterHarga extends AuditMixin {
  harga_id: string;
  sku: string;
  toko_id: string; // "ALL" or store ID
  class_id: string; // "ALL" or class ID
  harga_normal: number;
  harga_reseller: number;
  harga_promo?: number;
  promo_mulai?: string;
  promo_selesai?: string;
  aktif: boolean;
  version: number;
}

export interface MasterKaryawan extends AuditMixin {
  karyawan_id: string;
  nama: string;
  employee_type: EmployeeType;
  toko_id: string;
  wa: string;
  gaji_type: 'HARIAN' | 'BULANAN';
  gaji_pokok: number;
  insentif_per_pcs: number; // default 1000
  bonus_target_pcs?: number;
  bonus_target_nominal?: number;
  split_kasir_pct?: number; // 0..1 (e.g. 1.0 or 0.7)
  split_spg_pct?: number; // 0..1 (e.g. 0.0 or 0.3)
  shift?: string;
  aktif: boolean;
}

export interface UserPengguna extends AuditMixin {
  user_id: string;
  karyawan_id?: string;
  email?: string; // Required for OWNER
  role: Role;
  toko_id: string;
  aktif: boolean;
}

export interface DeviceToko extends AuditMixin {
  device_id: string;
  toko_id: string;
  nama_device: string;
  paired_at?: string;
  status: 'BELUM_PAIRING' | 'SUDAH_PAIRING' | 'DILEPAS';
  last_seen?: string;
}

export interface SettingPIN extends AuditMixin {
  pin_id: string;
  karyawan_id: string;
  pin_hash: string;
  salt: string;
  failed_count: number;
  locked_until?: string;
}

export interface SettingBisnis extends AuditMixin {
  setting_id: string;
  toko_id: string;
  metode_bayar_aktif: string[]; // JSON string array
  npwp_mode: NpwpMode;
  pajak_skema: PajakSkema;
  batas_bebas: number; // 500.000.000
  tarif_pph: number; // 0.005
  form_omzet_cns: { mode: 'BRUTO' | 'NETTO'; potong_komisi: boolean; potong_diskon: boolean };
  form_omzet_aff: { mode: 'BRUTO' | 'NETTO'; potong_komisi: boolean; potong_diskon: boolean };
  pkp_status: 'PKP' | 'NON_PKP';
  tgl_pkp?: string;
  manager_boleh_lihat_hpp: boolean;
  manager_boleh_lihat_laba: boolean;
}

export interface MasterConfig extends AuditMixin {
  config_id: string;
  key: string;
  value: string;
  deskripsi?: string;
}

export interface OngkirZone {
  zona: string;
  tipe: 'FLAT' | 'PER_KG' | 'PER_KM';
  nilai: number;
}

export interface MasterKurir extends AuditMixin {
  kurir_id: string;
  nama: string;
  tipe_ongkir: 'PER_KG' | 'FLAT' | 'PER_KM';
  ongkir_json: OngkirZone[];
  fee_cod_persen: number;
  fee_cod_min: number;
  cod_aktif: boolean;
  aktif: boolean;
}

export interface MasterPrinter extends AuditMixin {
  printer_id: string;
  toko_id: string;
  nama: string;
  jenis: 'THERMAL_58MM' | 'THERMAL_80MM' | 'A4' | 'PDF';
  koneksi: 'BLUETOOTH' | 'USB' | 'WIFI';
  auto_cut: boolean;
  copy_count: number;
  font_size: 'S' | 'M' | 'L';
  aktif: boolean;
}

export interface MasterScanner extends AuditMixin {
  scanner_id: string;
  toko_id: string;
  nama: string;
  jenis: 'KAMERA_HP' | 'SCANNER_USB' | 'SCANNER_BLUETOOTH';
  aktif: boolean;
}

export interface MasterAffiliate extends AuditMixin {
  affiliate_id: string;
  nama: string;
  wa: string;
  rekening?: string;
  komisi_type: 'PERSEN' | 'FLAT';
  komisi_nilai: number;
  min_payout: number;
  tgl_payout: string;
  aktif: boolean;
}

export interface MasterKomplainJenis extends AuditMixin {
  komplain_jenis_id: string;
  jenis: string;
  solusi_default: string;
  aktif: boolean;
}

// --------------------------------------------------
// TRANSAKSI & DOKUMEN TABLES
// --------------------------------------------------

export interface TransaksiPenjualan extends AuditMixin, SyncHeaderMixin {
  transaction_id: string; // e.g. TRX-TKO1-20261113-0001
  tanggal: string;
  toko_id: string;
  kasir_id: string;
  customer_id?: string;
  voucher_id?: string;
  bundle_id?: string;
  affiliate_id?: string; // Promoter
  preorder_id?: string;
  class_toko_saat_transaksi: ClassToko;
  price_type: PriceType;
  subtotal_barang: number;
  diskon_amount: number;
  subtotal_kena_pajak: number;
  pajak_rate: number;
  pajak_amount: number;
  price_includes_tax: boolean;
  delivery_amount: number;
  packaging_amount: number;
  total: number;
  is_split: boolean;
  payment_status: PaymentStatus;
  transaction_status: TransactionStatus;
  status_rangkaian: StatusRangkaian;
  sales_channel: SalesChannel;
  penerima_nama?: string;
  penerima_alamat?: string;
  penerima_wa?: string;
  kurir_id?: string;
  resi?: string;
  catatan?: string;
}

export interface TransaksiDetail extends AuditMixin, SyncDetailMixin {
  detail_id: string;
  transaction_id: string;
  sku: string;
  qty: number;
  harga_jual_satuan: number;
  diskon_satuan: number;
  jenis_barang: JenisBarang;
  komisi_kasir: number; // total raw insentif for this line before split
  komisi_penitip: number; // for CNS
  komisi_toko_dari_merchant: number; // for AFF_PRODUCT
  komisi_promoter: number; // for AFF_PROMOTER
  hpp_satuan: number;
  spg_id?: string;
}

export interface Pembayaran extends AuditMixin, SyncHeaderMixin {
  pembayaran_id: string;
  transaction_id?: string;
  invoice_id?: string;
  kwitansi_id?: string;
  referensi_id?: string;
  referensi_type?: BayarJenis;
  metode: PaymentMethod;
  nominal: number;
  bukti_url?: string;
  status_verifikasi: VerifiedStatus;
  verified_by?: string;
  verified_at?: string;
  catatan?: string;
}

export interface TransaksiApproval extends AuditMixin {
  transaksi_approval_id: string;
  transaction_id: string;
  approval_id: string;
  tipe: ApprovalType;
}

export interface DokumenQuotation extends AuditMixin {
  quotation_id: string;
  toko_id: string;
  customer_id: string;
  nomor_manusia: string;
  tanggal: string;
  berlaku_sampai: string;
  status: 'DRAFT' | 'DIKIRIM' | 'DITERIMA' | 'DITOLAK';
  total: number;
  qr_url?: string;
}

export interface DokumenQuotationDetail extends AuditMixin {
  quotation_detail_id: string;
  quotation_id: string;
  sku: string;
  qty: number;
  harga_jual_satuan: number;
  subtotal: number;
}

export interface DokumenInvoice extends AuditMixin {
  invoice_id: string;
  quotation_id?: string;
  transaction_id?: string;
  toko_id: string;
  customer_id: string;
  nomor_manusia: string;
  tanggal: string;
  jatuh_tempo: string;
  npwp_penjual?: string;
  npwp_pembeli?: string;
  total: number;
  sudah_dibayar: number;
  sisa: number;
  status: PaymentStatus;
  qr_url?: string;
}

export interface DokumenInvoiceDetail extends AuditMixin {
  invoice_detail_id: string;
  invoice_id: string;
  sku: string;
  qty: number;
  harga_jual_satuan: number;
  diskon_satuan: number;
  subtotal: number;
}

export interface DokumenKwitansi extends AuditMixin {
  kwitansi_id: string;
  invoice_id?: string;
  transaction_id?: string;
  nomor_manusia: string;
  tanggal_terima: string;
  jumlah: number;
  terbilang: string;
  untuk_pembayaran: string;
  metode: PaymentMethod;
  penerima: string;
  npwp_penjual?: string;
  qr_url?: string;
}

export interface DokumenSuratJalan extends AuditMixin {
  sj_id: string;
  transaction_id?: string;
  toko_id: string;
  nomor_manusia: string;
  tanggal_kirim: string;
  dari: string;
  kepada: string;
  kurir?: string;
  resi?: string;
  total_koli: number;
  status: 'DIKIRIM' | 'DITERIMA';
  qr_url?: string;
}

export interface DokumenRetur extends AuditMixin {
  dok_retur_id: string;
  retur_id: string;
  nomor_manusia: string;
  tanggal: string;
  isi: string;
  qr_url?: string;
}

export interface ReturJual extends AuditMixin, SyncHeaderMixin {
  retur_id: string;
  transaction_id: string;
  detail_id?: string;
  tanggal: string;
  jenis_retur: JenisRetur;
  alasan: string;
  foto_url?: string;
  nominal_refund: number;
  voucher_id?: string;
  status: ReturStatus;
  approval_id?: string;
}

export interface ReturBeli extends AuditMixin, SyncHeaderMixin {
  retur_beli_id: string;
  po_id: string;
  supplier_id: string;
  tanggal: string;
  alasan: string;
  qty: number;
  foto_url?: string;
  status: ReturBeliStatus;
  jawaban_supplier?: string;
  nominal?: number;
}

export interface TransferStok extends AuditMixin, SyncHeaderMixin {
  transfer_id: string;
  toko_asal: string;
  toko_tujuan: string;
  tanggal: string;
  status: TransferStatus;
  alasan: string;
  approval_id?: string;
}

export interface TransferStokDetail extends AuditMixin, SyncDetailMixin {
  transfer_detail_id: string;
  transfer_id: string;
  sku: string;
  qty: number;
  qty_diterima: number;
}

export interface PembelianPO extends AuditMixin, SyncHeaderMixin {
  po_id: string;
  supplier_id: string;
  gudang_id: string;
  nomor_manusia: string;
  tanggal: string;
  target_datang: string;
  total: number;
  status: PembelianPoStatus;
  approval_id?: string;
  alasan?: string;
}

export interface PembelianPODetail extends AuditMixin, SyncDetailMixin {
  po_detail_id: string;
  po_id: string;
  sku: string;
  qty: number;
  harga_beli: number;
  subtotal: number;
}

export interface PenerimaanBarang extends AuditMixin {
  penerimaan_id: string;
  po_id: string;
  gudang_id: string;
  tanggal: string;
  qty_datang: number;
  qty_cacat: number;
  qty_bagus: number;
  foto_cacat_url?: string;
  hutang_id?: string;
}

export interface Opname extends AuditMixin, SyncHeaderMixin {
  opname_id: string;
  toko_id?: string;
  gudang_id?: string;
  tanggal: string;
  jenis: 'KECIL' | 'GEDE' | 'DADAKAN';
  status: OpnameStatus;
  approval_id?: string;
}

export interface OpnameDetail extends AuditMixin, SyncDetailMixin {
  opname_detail_id: string;
  opname_id: string;
  sku: string;
  stok_sistem: number;
  stok_fisik: number;
  selisih: number;
  alasan: OpnameAlasan;
  foto_url?: string;
}

export interface PreOrderIndent extends AuditMixin {
  preorder_id: string;
  customer_id: string;
  sku: string;
  tanggal: string;
  dp_amount: number;
  estimasi_datang?: string;
  status: PreorderStatus;
  wa_notified: boolean;
  transaction_id?: string;
}

export interface BundlePaket extends AuditMixin {
  bundle_id: string;
  nama: string;
  harga_bundle: number;
  aktif: boolean;
  mulai: string;
  selesai: string;
}

export interface BundlePaketDetail extends AuditMixin {
  bundle_detail_id: string;
  bundle_id: string;
  sku: string;
  qty: number;
}

export interface VoucherKodeDiskon extends AuditMixin {
  voucher_id: string;
  customer_id?: string;
  kode: string;
  jenis_voucher: JenisVoucher;
  nominal?: number;
  persen?: number;
  min_belanja?: number;
  mulai: string;
  selesai: string;
  kuota: number;
  terpakai: number;
  aktif: boolean;
}

export interface Komplain extends AuditMixin {
  komplain_id: string;
  transaction_id: string;
  customer_id: string;
  tanggal: string;
  jenis: string;
  solusi: string;
  foto_url?: string;
  status: KomplainStatus;
  approval_id?: string;
}

// --------------------------------------------------
// STOK & FINANCIAL TABLES
// --------------------------------------------------

export interface StokPerToko extends AuditMixin {
  stok_id: string;
  sku: string;
  toko_id: string;
  stok_sistem: number;
  stok_fisik_terakhir: number;
  min_stok: number;
  terakhir_opname?: string;
}

export interface StokMovement extends AuditMixin, SyncHeaderMixin {
  movement_id: string;
  sku: string;
  toko_id: string;
  transaction_id?: string;
  tipe: StokMovementTipe;
  qty: number; // +/-
  saldo_setelah: number;
  referensi_id: string;
}

export interface KasModalAwal extends AuditMixin {
  modal_id: string;
  toko_id: string;
  tanggal: string;
  modal_awal: number;
  kasir_id: string;
}

export interface KasHarian extends AuditMixin, SyncHeaderMixin {
  kas_harian_id: string;
  toko_id: string;
  kasir_id: string;
  tanggal: string;
  tunai_masuk: number;
  pengeluaran: number;
  setoran: number;
  kas_fisik: number;
  selisih: number;
  status: KasHarianStatus;
  penjelasan_selisih?: string;
}

export interface KasKecil extends AuditMixin {
  kas_kecil_id: string;
  toko_id: string;
  tanggal: string;
  saldo_awal: number;
  saldo_akhir: number;
  status: KasKecilStatus;
}

export interface KasKecilDetail extends AuditMixin {
  kas_kecil_detail_id: string;
  kas_kecil_id: string;
  tanggal: string;
  keterangan: string;
  nominal: number;
  kasir_id: string;
}

export interface PengeluaranOperasional extends AuditMixin {
  operasional_id: string;
  toko_id: string;
  kasir_id: string;
  tanggal: string;
  tipe: 'KECIL' | 'GEDE';
  kategori?: string;
  keterangan: string;
  nominal: number;
  foto_bukti_url?: string;
  alasan?: string;
  approval_id?: string;
}

export interface PiutangDP extends AuditMixin, SyncHeaderMixin {
  piutang_id: string;
  customer_id: string;
  invoice_id?: string;
  transaction_id?: string;
  total: number;
  sudah_bayar: number;
  sisa: number;
  jatuh_tempo?: string;
  status: PaymentStatus;
  aging_hari: number;
}

export interface HutangSupplier extends AuditMixin, SyncHeaderMixin {
  hutang_id: string;
  supplier_id: string;
  po_id: string;
  total: number;
  sudah_bayar: number;
  sisa: number;
  jatuh_tempo?: string;
  status: PaymentStatus;
  aging_hari: number;
}

export interface UtangPenitip extends AuditMixin, SyncHeaderMixin {
  utang_penitip_id: string;
  penitip_id: string;
  transaction_id?: string;
  total_kotor: number;
  komisi_toko: number;
  utang: number;
  settlement_id?: string;
  status: PaymentStatus;
}

export interface UtangMerchantAFF extends AuditMixin, SyncHeaderMixin {
  utang_merchant_aff_id: string;
  merchant_id: string;
  transaction_id: string;
  total_kotor: number;
  komisi_toko_dari_merchant: number;
  utang_merchant: number;
  jatuh_tempo: string;
  status: PaymentStatus;
}

export interface KomisiAfiliasi extends AuditMixin, SyncHeaderMixin {
  komisi_aff_id: string;
  affiliate_id: string;
  transaction_id: string;
  nominal: number;
  payout_id?: string;
  status: PaymentStatus;
}

export interface KomisiSpgKasir extends AuditMixin {
  insentif_id: string;
  karyawan_id: string;
  spg_id?: string;
  periode: string; // YYYY-MM
  total_pcs: number;
  nominal_kasir: number;
  nominal_spg: number;
  bonus_target: number;
  status: GajiStatus;
}

export interface InsentifDetail extends AuditMixin, SyncDetailMixin {
  insentif_detail_id: string;
  insentif_id: string;
  transaction_id: string;
  sku: string;
  pcs: number;
  nominal_kasir: number;
  nominal_spg: number;
}

export interface JurnalOtomatis extends AuditMixin, SyncHeaderMixin {
  jurnal_id: string;
  transaction_id?: string;
  referensi_id?: string;
  tanggal: string;
  akun_debit: string;
  akun_kredit: string;
  nominal: number;
  keterangan: string;
  source_type: string;
  source_id: string;
}

export interface SummaryHarian extends AuditMixin {
  summary_id: string;
  toko_id: string;
  tanggal: string;
  omzet_barang: number;
  omzet_delivery: number;
  omzet_packaging: number;
  pajak_dipungut: number;
  jumlah_transaksi: number;
  pcs: number;
  stok_mati_count: number;
  kas_tunai: number;
  kas_qris: number;
  kas_transfer: number;
  kas_selisih: number;
  qris_pending: number;
}

export interface Absensi extends AuditMixin {
  absensi_id: string;
  karyawan_id: string;
  toko_id: string;
  tanggal: string;
  check_in: string;
  check_out?: string;
  shift: string;
  status: 'ON_TIME' | 'TELAT' | 'TELAT_BERAT' | 'IZIN_SAKIT' | 'IZIN' | 'TIDAK_HADIR';
  lembur_jam: number;
  catatan?: string;
}

export interface Gaji extends AuditMixin {
  gaji_id: string;
  karyawan_id: string;
  periode: string; // YYYY-MM
  gaji_pokok: number;
  insentif: number;
  bonus_target: number;
  potongan_telat: number;
  potongan_kas: number;
  potongan_izin: number;
  lembur: number;
  total: number;
  status: GajiStatus;
}

export interface SlipGaji extends AuditMixin {
  slip_id: string;
  gaji_id: string;
  file_url: string;
}

export interface Approval extends AuditMixin, SyncHeaderMixin {
  approval_id: string;
  requested_by: string;
  approved_by?: string; // string literal 'SYSTEM' or user_id
  tipe: ApprovalType;
  referensi_id: string;
  nominal: number;
  alasan: string;
  status: ApprovalStatus;
  requested_at: string;
  decided_at?: string;
  expired_at: string;
  catatan?: string;
}

export interface AuditLog {
  audit_id: string;
  user_id: string;
  device_id: string;
  timestamp: string;
  aksi: string;
  modul: string;
  referensi_id: string;
  before_json?: string;
  after_json?: string;
  ip?: string;
  keterangan?: string;
}

export interface LogSync {
  log_sync_id: string;
  toko_id: string;
  timestamp: string;
  sync_batch_id: string;
  jumlah_baris: number;
  status: SyncStatus;
  alasan?: string;
  payload_hash: string;
}

export interface LogSyncPusat {
  log_sync_pusat_id: string;
  toko_id: string;
  timestamp: string;
  sync_batch_id: string;
  transaction_id_list: string;
  payload_hash: string;
  received_at: string;
  status: SyncStatus;
}

export interface LogArsip {
  log_arsip_id: string;
  archive_batch_id: string;
  file_arsip_id: string;
  jumlah_header: number;
  jumlah_detail: number;
  jumlah_jurnal: number;
  total_debit: number;
  total_kredit: number;
  checksum: string;
  status: ArsipStatus;
  waktu_pindah: string;
}

export interface BackupLog {
  backup_id: string;
  timestamp: string;
  folder: string;
  file_count: number;
  status: 'SUKSES' | 'GAGAL';
  keterangan?: string;
  checksum?: string;
  size_kb?: number;
  download_json?: string;
}

export interface AIInsight {
  insight_id: string;
  skill_id: string;
  tanggal: string;
  toko_id: string;
  hasil: string;
  status: 'DRAFT' | 'DIBACA';
}

export interface NotifikasiWA {
  notif_id: string;
  toko_id: string;
  timestamp: string;
  tipe: NotifikasiWaTipe;
  penerima: string;
  isi: string;
  status_kirim: 'TERKIRIM' | 'GAGAL';
  aksi_url?: string;
}

export interface IdempotencyLog {
  idem_id: string;
  request_id: string;
  transaction_id?: string;
  payload_hash: string;
  endpoint: string;
  response_json: string;
  created_at: string;
  expires_at: string;
}

// --------------------------------------------------
// API CONTRACT CONTRACTS & DATA TRANSFER OBJECTS
// --------------------------------------------------

export interface APIWarning {
  code: string;
  message: string;
}

export interface APIRequestEnvelope<T = unknown> {
  mode: string;
  request_id: string;
  device_id?: string;
  pin_session?: string;
  payload: T;
}

export interface APIResponseEnvelope<T = unknown> {
  ok: boolean;
  request_id: string;
  data: T | null;
  error: { code: string; message: string } | null;
}

// Mode Specific Payloads
export interface JualItemPayload {
  sku: string;
  qty: number;
  harga_jual_satuan: number;
  spg_id?: string;
}

export interface JualMetodeBayarPayload {
  metode: PaymentMethod;
  nominal: number;
  bukti_url?: string;
}

export interface JualRequestPayload {
  transaction_id?: string;
  toko_id: string;
  kasir_id: string;
  customer_id?: string;
  voucher_kode?: string;
  affiliate_id?: string;
  preorder_id?: string;
  price_type: PriceType;
  sales_channel: SalesChannel;
  items: JualItemPayload[];
  diskon_amount?: number;
  diskon_approval_id?: string;
  delivery_amount: number;
  packaging_amount: number;
  pajak_toggle: boolean;
  pajak_rate: number;
  price_includes_tax: boolean;
  metode_bayar: JualMetodeBayarPayload[];
  penerima?: { nama: string; alamat: string; wa: string };
  catatan?: string;
}

export interface JualResponseData {
  transaction_id: string;
  nomor_manusia: string;
  subtotal_barang: number;
  diskon_amount: number;
  diskon_approval_id: string | null;
  subtotal_kena_pajak: number;
  pajak_amount: number;
  delivery_amount: number;
  packaging_amount: number;
  total: number;
  kembalian: number;
  struk_url: string;
  sync_status: SyncStatus;
  payment_status: PaymentStatus;
  warning?: APIWarning[];
}

// --------------------------------------------------
// TEST CASE VERIFICATION MATRIX (TC-001 to TC-042)
// --------------------------------------------------

export interface TestCaseResult {
  id: string; // TC-001..TC-042
  title: string;
  expected: string;
  passed: boolean;
  details: string;
}
