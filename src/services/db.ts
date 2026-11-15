/**
 * In-Memory & LocalStorage Persisted ERP Database Engine
 * Toko Baju UMKM (v40 + v40.1 Patch)
 */

import {
  MasterBarang,
  MasterVarian,
  FotoBarang,
  MasterMerek,
  MasterMerchantAfiliasi,
  MasterKategori,
  MasterWarna,
  MasterUkuran,
  MasterToko,
  MasterClassToko,
  MasterSettingPajakPerClass,
  MasterNpwpPemilik,
  MasterNpwpToko,
  MasterSupplier,
  MasterPenitip,
  MasterPelangganMember,
  MasterHarga,
  PriceType,
  MasterKaryawan,
  UserPengguna,
  DeviceToko,
  SettingPIN,
  SettingBisnis,
  MasterConfig,
  MasterKurir,
  MasterPrinter,
  MasterScanner,
  MasterAffiliate,
  MasterKomplainJenis,
  TransaksiPenjualan,
  TransaksiDetail,
  Pembayaran,
  TransaksiApproval,
  DokumenQuotation,
  DokumenQuotationDetail,
  DokumenInvoice,
  DokumenInvoiceDetail,
  DokumenKwitansi,
  DokumenSuratJalan,
  DokumenRetur,
  ReturJual,
  ReturBeli,
  TransferStok,
  TransferStokDetail,
  PembelianPO,
  PembelianPODetail,
  PenerimaanBarang,
  Opname,
  OpnameDetail,
  PreOrderIndent,
  BundlePaket,
  BundlePaketDetail,
  VoucherKodeDiskon,
  Komplain,
  StokPerToko,
  StokMovement,
  KasModalAwal,
  KasHarian,
  KasKecil,
  KasKecilDetail,
  PengeluaranOperasional,
  PiutangDP,
  HutangSupplier,
  UtangPenitip,
  UtangMerchantAFF,
  KomisiAfiliasi,
  KomisiSpgKasir,
  InsentifDetail,
  JurnalOtomatis,
  SummaryHarian,
  Absensi,
  Gaji,
  SlipGaji,
  Approval,
  AuditLog,
  LogSync,
  LogSyncPusat,
  LogArsip,
  BackupLog,
  AIInsight,
  NotifikasiWA,
  IdempotencyLog
} from '../types/erp';

// Default timestamp helper
export const nowISO = () => new Date().toISOString();
export const todayYYYYMMDD = () => new Date().toISOString().split('T')[0];

export class ERPDatabase {
  // Master Tables
  masterBarang: MasterBarang[] = [];
  masterVarian: MasterVarian[] = [];
  fotoBarang: FotoBarang[] = [];
  masterMerek: MasterMerek[] = [];
  masterMerchantAfiliasi: MasterMerchantAfiliasi[] = [];
  masterKategori: MasterKategori[] = [];
  masterWarna: MasterWarna[] = [];
  masterUkuran: MasterUkuran[] = [];
  masterToko: MasterToko[] = [];
  masterClassToko: MasterClassToko[] = [];
  settingPajakPerClass: MasterSettingPajakPerClass[] = [];
  masterNpwpPemilik: MasterNpwpPemilik[] = [];
  masterNpwpToko: MasterNpwpToko[] = [];
  masterSupplier: MasterSupplier[] = [];
  masterPenitip: MasterPenitip[] = [];
  masterPelangganMember: MasterPelangganMember[] = [];
  masterHarga: MasterHarga[] = [];
  masterKaryawan: MasterKaryawan[] = [];
  userPengguna: UserPengguna[] = [];
  deviceToko: DeviceToko[] = [];
  settingPIN: SettingPIN[] = [];
  settingBisnis: SettingBisnis[] = [];
  masterConfig: MasterConfig[] = [];
  masterKurir: MasterKurir[] = [];
  masterPrinter: MasterPrinter[] = [];
  masterScanner: MasterScanner[] = [];
  masterAffiliate: MasterAffiliate[] = [];
  masterKomplainJenis: MasterKomplainJenis[] = [];

  // Transaction & Document Tables
  transaksiPenjualan: TransaksiPenjualan[] = [];
  transaksiDetail: TransaksiDetail[] = [];
  pembayaran: Pembayaran[] = [];
  transaksiApproval: TransaksiApproval[] = [];
  dokumenQuotation: DokumenQuotation[] = [];
  dokumenQuotationDetail: DokumenQuotationDetail[] = [];
  dokumenInvoice: DokumenInvoice[] = [];
  dokumenInvoiceDetail: DokumenInvoiceDetail[] = [];
  dokumenKwitansi: DokumenKwitansi[] = [];
  dokumenSuratJalan: DokumenSuratJalan[] = [];
  dokumenRetur: DokumenRetur[] = [];
  returJual: ReturJual[] = [];
  returBeli: ReturBeli[] = [];
  transferStok: TransferStok[] = [];
  transferStokDetail: TransferStokDetail[] = [];
  pembelianPO: PembelianPO[] = [];
  pembelianPODetail: PembelianPODetail[] = [];
  penerimaanBarang: PenerimaanBarang[] = [];
  opname: Opname[] = [];
  opnameDetail: OpnameDetail[] = [];
  preOrderIndent: PreOrderIndent[] = [];
  bundlePaket: BundlePaket[] = [];
  bundlePaketDetail: BundlePaketDetail[] = [];
  voucherKodeDiskon: VoucherKodeDiskon[] = [];
  komplain: Komplain[] = [];

  // Financial & Stock Tables
  stokPerToko: StokPerToko[] = [];
  stokMovement: StokMovement[] = [];
  kasModalAwal: KasModalAwal[] = [];
  kasHarian: KasHarian[] = [];
  kasKecil: KasKecil[] = [];
  kasKecilDetail: KasKecilDetail[] = [];
  pengeluaranOperasional: PengeluaranOperasional[] = [];
  piutangDP: PiutangDP[] = [];
  hutangSupplier: HutangSupplier[] = [];
  utangPenitip: UtangPenitip[] = [];
  utangMerchantAFF: UtangMerchantAFF[] = [];
  komisiAfiliasi: KomisiAfiliasi[] = [];
  komisiSpgKasir: KomisiSpgKasir[] = [];
  insentifDetail: InsentifDetail[] = [];
  jurnalOtomatis: JurnalOtomatis[] = [];
  summaryHarian: SummaryHarian[] = [];

  // Operational & Audit Logs
  absensi: Absensi[] = [];
  gaji: Gaji[] = [];
  slipGaji: SlipGaji[] = [];
  approval: Approval[] = [];
  auditLog: AuditLog[] = [];
  logSync: LogSync[] = [];
  logSyncPusat: LogSyncPusat[] = [];
  logArsip: LogArsip[] = [];
  backupLog: BackupLog[] = [];
  aiInsight: AIInsight[] = [];
  notifikasiWA: NotifikasiWA[] = [];
  idempotencyLog: IdempotencyLog[] = [];

  constructor() {
    this.seedDatabase();
  }

  seedDatabase() {
    const ts = nowISO();

    // 1. Config (Key-Value Global)
    this.masterConfig = [
      { config_id: 'CFG-001', key: 'batch_size', value: '500', deskripsi: 'Ukuran batch sync', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { config_id: 'CFG-002', key: 'retensi_backup_hari', value: '30', deskripsi: 'Hari Simpan Backup Drive', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { config_id: 'CFG-003', key: 'retensi_lokal_hari', value: '7', deskripsi: 'Hari Simpan Lokal Toko', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { config_id: 'CFG-004', key: 'barang_mahal_threshold', value: '500000', deskripsi: 'Batas barang mahal opname (Rp 500rb)', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { config_id: 'CFG-005', key: 'stempel_target', value: '5', deskripsi: 'Target stempel voucher', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { config_id: 'CFG-006', key: 'stempel_voucher_nominal', value: '20000', deskripsi: 'Nilai voucher stempel 5x', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { config_id: 'CFG-007', key: 'telat_threshold_menit', value: '15', deskripsi: 'Batas menit telat biasa', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { config_id: 'CFG-008', key: 'telat_berat_threshold_menit', value: '60', deskripsi: 'Batas menit telat berat', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { config_id: 'CFG-009', key: 'potongan_telat_per_menit', value: '1000', deskripsi: 'Denda per menit telat', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { config_id: 'CFG-010', key: 'potongan_telat_berat_flat', value: '50000', deskripsi: 'Denda flat telat berat', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { config_id: 'CFG-011', key: 'potongan_izin_per_hari', value: '50000', deskripsi: 'Potongan per hari izin tanpa surat', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { config_id: 'CFG-012', key: 'lembur_per_jam', value: '15000', deskripsi: 'Upah lembur per jam', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { config_id: 'CFG-013', key: 'potongan_kas_mode', value: 'POTONG_GAJI', deskripsi: 'Mode ganti selisih kas', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    // 2. Class Toko
    this.masterClassToko = [
      { class_id: 'ALL', nama: 'Semua Class', deskripsi: 'Untuk FK harga global', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { class_id: 'A', nama: 'Class A (Premium Mall)', deskripsi: 'Toko di Mall/Pusat Perbelanjaan', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { class_id: 'B', nama: 'Class B (Pasar Utama)', deskripsi: 'Toko di Ruko Pasar', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { class_id: 'C', nama: 'Class C (Outlet Suburban)', deskripsi: 'Toko pinggir jalan', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { class_id: 'D', nama: 'Class D (Bazaar/Temporary)', deskripsi: 'Event / Pop-up store', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    // 3. Setting Pajak Per Class
    this.settingPajakPerClass = [
      { class_id: 'A', persen_pajak: 0.11, pajak_skema: 'NORMAL', default_toggle: true, kasir_boleh_ubah: true, delivery_kena_pajak: false, packaging_kena_pajak: false, pajak_wajib_tampil: true, price_includes_tax: false, aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { class_id: 'B', persen_pajak: 0.11, pajak_skema: 'NORMAL', default_toggle: false, kasir_boleh_ubah: true, delivery_kena_pajak: false, packaging_kena_pajak: false, pajak_wajib_tampil: true, price_includes_tax: false, aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { class_id: 'C', persen_pajak: 0.11, pajak_skema: 'NORMAL', default_toggle: false, kasir_boleh_ubah: true, delivery_kena_pajak: false, packaging_kena_pajak: false, pajak_wajib_tampil: true, price_includes_tax: false, aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { class_id: 'D', persen_pajak: 0.11, pajak_skema: 'NORMAL', default_toggle: false, kasir_boleh_ubah: true, delivery_kena_pajak: false, packaging_kena_pajak: false, pajak_wajib_tampil: true, price_includes_tax: false, aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    // 4. Toko
    this.masterToko = [
      { toko_id: 'ALL', nama: 'Semua Toko', alamat: '-', class_id: 'ALL', jam_tutup: '-', wa_start: '07:00', wa_end: '21:00', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { toko_id: 'TKO1', nama: 'Toko 1 Mall', alamat: 'Grand Indonesia Lt. 2 No. 15, Jakarta', class_id: 'A', jam_tutup: '22:00', wa_start: '07:00', wa_end: '21:00', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { toko_id: 'TKO2', nama: 'Toko 2 Pasar', alamat: 'Pasar Tanah Abang Blok A No. 88, Jakarta', class_id: 'B', jam_tutup: '17:00', wa_start: '07:00', wa_end: '21:00', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { toko_id: 'TKO3', nama: 'Toko 3 Digital', alamat: 'Hub Digital & Online Order, Bandung', class_id: 'A', jam_tutup: '21:00', wa_start: '07:00', wa_end: '21:00', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { toko_id: 'TKO4', nama: 'Toko 4 Outlet', alamat: 'Jl. Margonda Raya No. 120, Depok', class_id: 'C', jam_tutup: '21:30', wa_start: '07:00', wa_end: '21:00', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { toko_id: 'GDG', nama: 'Gudang Pusat', alamat: 'Kawasan Industri Pergudangan Cikupa, Tangerang', class_id: undefined, jam_tutup: '17:00', wa_start: '07:00', wa_end: '21:00', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    // 5. Setting Bisnis Per Toko
    ['TKO1', 'TKO2', 'TKO3', 'TKO4', 'GDG'].forEach((tokoId) => {
      this.settingBisnis.push({
        setting_id: `SET-${tokoId}`,
        toko_id: tokoId,
        metode_bayar_aktif: ['TUNAI', 'QRIS', 'TRANSFER', 'DP'],
        npwp_mode: 'NPWP_PEMILIK',
        pajak_skema: 'NORMAL',
        batas_bebas: 500000000,
        tarif_pph: 0.005,
        form_omzet_cns: { mode: 'BRUTO', potong_komisi: false, potong_diskon: true },
        form_omzet_aff: { mode: 'NETTO', potong_komisi: true, potong_diskon: true },
        pkp_status: 'NON_PKP',
        manager_boleh_lihat_hpp: false, // KEP-22 default false
        manager_boleh_lihat_laba: false,
        created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM'
      });
    });

    // 6. NPWP Pemilik
    this.masterNpwpPemilik = [
      { npwp_id: 'NPWP-001', nama_wp: 'CV Merpati Indah Busana', jenis_npwp: 'Badan', nomor_npwp: '01.234.567.8-012.000', alamat: 'Jl. Pemuda No. 45, Jakarta Pusat', no_pkp: 'PKP-889922', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    // 7. Master Merek, Merchant, Kategori, Warna, Ukuran
    this.masterMerek = [
      { merek_id: 'MRK-ERG', kode_3: 'ERG', nama: 'Erigo Streetwear', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { merek_id: 'MRK-3SE', kode_3: '3SE', nama: '3Second Casual', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { merek_id: 'MRK-LEA', kode_3: 'LEA', nama: 'Lea Denim Apparel', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    this.masterMerchantAfiliasi = [
      { merchant_id: 'MRC-001', kode_3: 'MRC', nama: 'PT Fashion Affiliate Merchant', wa: '081299887766', rekening: 'BCA 1234567890', komisi_persen: 0.20, tempo_bayar_hari: 7, aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    this.masterKategori = [
      { kategori_id: 'KTG-TSH', kode_3: 'TSH', nama: 'T-Shirt / Kaos', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { kategori_id: 'KTG-CLN', kode_3: 'CLN', nama: 'Celana / Pants', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { kategori_id: 'KTG-JCK', kode_3: 'JCK', nama: 'Jaket / Outerwear', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { kategori_id: 'KTG-DRS', kode_3: 'DRS', nama: 'Gaun / Dress', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    this.masterWarna = [
      { warna_id: 'WRN-WHT', kode_3: 'WHT', nama: 'Putih Clean', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { warna_id: 'WRN-BLK', kode_3: 'BLK', nama: 'Hitam Jet', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { warna_id: 'WRN-BLU', kode_3: 'BLU', nama: 'Biru Indigo', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { warna_id: 'WRN-RED', kode_3: 'RED', nama: 'Merah Marun', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    this.masterUkuran = [
      { ukuran_id: 'UKR-M01', kode_3: 'M01', nama: 'Medium (M)', tipe_ukuran: 'HURUF', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { ukuran_id: 'UKR-L01', kode_3: 'L01', nama: 'Large (L)', tipe_ukuran: 'HURUF', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { ukuran_id: 'UKR-XL1', kode_3: 'XL1', nama: 'Extra Large (XL)', tipe_ukuran: 'HURUF', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { ukuran_id: 'UKR-35', kode_3: '35', nama: 'Size 35', tipe_ukuran: 'ANGKA', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    // 8. Supplier & Penitip & Affiliate Promoter
    this.masterSupplier = [
      { supplier_id: 'SUP-001', nama: 'PT Konveksi Garmen Utama', wa: '081311223344', rekening: 'Mandiri 9900112233', tempo_hari: 14, lead_time_hari: 3, rating: 4.8, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    this.masterPenitip = [
      { penitip_id: 'PNT-001', nama: 'Ibu Hajah Maryam (Penitip Local)', wa: '081577889900', komisi_persen: 0.20, settlement_type: 'MINGGUAN', masa_titip_hari: 90, tanggung_rusak: 'PENITIP', created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    this.masterAffiliate = [
      { affiliate_id: 'AFF-001', nama: 'Rian Influencer Fashion', wa: '081766554433', rekening: 'BCA 5544332211', komisi_type: 'PERSEN', komisi_nilai: 0.10, min_payout: 100000, tgl_payout: '25', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    // 9. Customers
    this.masterPelangganMember = [
      { customer_id: 'CUST-001', nama: 'Budi Santoso', wa: '081234567890', tier: 'LANGGANAN', stempel_count: 2, total_transaksi: 4, total_omzet: 1250000, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { customer_id: 'CUST-002', nama: 'Siska Sultan', wa: '081987654321', tier: 'SULTAN', stempel_count: 4, total_transaksi: 12, total_omzet: 6800000, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    // 10. Master Barang & Varian (Style Codes matching SKU Regex ^[A-Z]{3}-[A-Z]{3}-[A-Z]{3}-[A-Z]{3}-[0-9]{3}-[A-Z]{3}-[0-9A-Z]{2,}$ )
    // Style 1: OWN Kaos
    this.masterBarang.push({
      barang_id: 'BRG-001',
      nama_manusia: 'Erigo Kaos Cotton Combed 30s',
      style_code: 'ERG-TSH-KAO-002',
      merek_id: 'MRK-ERG',
      kategori_id: 'KTG-TSH',
      foto_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop',
      aktif: true,
      created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM'
    });

    const sku1 = 'OWN-ERG-TSH-KAO-002-WHT-M01';
    this.masterVarian.push({
      sku: sku1,
      barang_id: 'BRG-001',
      warna_id: 'WRN-WHT',
      ukuran_id: 'UKR-M01',
      jenis_barang: 'OWN',
      barcode_code128: sku1,
      aktif: true,
      created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM'
    });

    // Style 2: OWN Celana Jeans
    this.masterBarang.push({
      barang_id: 'BRG-002',
      nama_manusia: 'Erigo Celana Jeans Slim Fit',
      style_code: 'ERG-CLN-JNS-001',
      merek_id: 'MRK-ERG',
      kategori_id: 'KTG-CLN',
      foto_url: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=500&auto=format&fit=crop',
      aktif: true,
      created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM'
    });

    const sku2 = 'OWN-ERG-CLN-JNS-001-BLU-35';
    this.masterVarian.push({
      sku: sku2,
      barang_id: 'BRG-002',
      warna_id: 'WRN-BLU',
      ukuran_id: 'UKR-35',
      jenis_barang: 'OWN',
      barcode_code128: sku2,
      aktif: true,
      created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM'
    });

    // Style 3: CNS Jaket Parka
    this.masterBarang.push({
      barang_id: 'BRG-003',
      nama_manusia: '3Second Jaket Parka Casual Konsinyasi',
      style_code: '3SE-JCK-PRK-003',
      merek_id: 'MRK-3SE',
      kategori_id: 'KTG-JCK',
      foto_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop',
      aktif: true,
      created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM'
    });

    const sku3 = 'CNS-3SE-JCK-PRK-003-BLK-L01';
    this.masterVarian.push({
      sku: sku3,
      barang_id: 'BRG-003',
      warna_id: 'WRN-BLK',
      ukuran_id: 'UKR-L01',
      jenis_barang: 'CNS',
      penitip_id: 'PNT-001',
      barcode_code128: sku3,
      aktif: true,
      created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM'
    });

    // Style 4: AFF Dress Floral
    this.masterBarang.push({
      barang_id: 'BRG-004',
      nama_manusia: 'Lea Floral Dress Premium Affiliate',
      style_code: 'LEA-DRS-FLR-004',
      merek_id: 'MRK-LEA',
      kategori_id: 'KTG-DRS',
      foto_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&auto=format&fit=crop',
      aktif: true,
      created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM'
    });

    const sku4 = 'AFF-LEA-DRS-FLR-004-RED-XL1';
    this.masterVarian.push({
      sku: sku4,
      barang_id: 'BRG-004',
      warna_id: 'WRN-RED',
      ukuran_id: 'UKR-XL1',
      jenis_barang: 'AFF',
      merchant_id: 'MRC-001',
      barcode_code128: sku4,
      aktif: true,
      created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM'
    });

    // 11. Master Harga (with toko_id = "ALL", class_id = "ALL")
    this.masterHarga = [
      { harga_id: 'HRG-001', sku: sku1, toko_id: 'ALL', class_id: 'ALL', harga_normal: 120000, harga_reseller: 100000, harga_promo: 99000, promo_mulai: '2026-01-01', promo_selesai: '2026-12-31', aktif: true, version: 1, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { harga_id: 'HRG-002', sku: sku2, toko_id: 'ALL', class_id: 'ALL', harga_normal: 250000, harga_reseller: 220000, harga_promo: 199000, promo_mulai: '2026-01-01', promo_selesai: '2026-12-31', aktif: true, version: 1, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { harga_id: 'HRG-003', sku: sku3, toko_id: 'ALL', class_id: 'ALL', harga_normal: 350000, harga_reseller: 310000, aktif: true, version: 1, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { harga_id: 'HRG-004', sku: sku4, toko_id: 'ALL', class_id: 'ALL', harga_normal: 180000, harga_reseller: 160000, aktif: true, version: 1, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      // Store specific pricing override example for TKO1 Class A
      { harga_id: 'HRG-005', sku: sku2, toko_id: 'TKO1', class_id: 'A', harga_normal: 260000, harga_reseller: 230000, aktif: true, version: 2, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    // 12. Stok Per Toko
    const allSkus = [sku1, sku2, sku3, sku4];
    const storeIds = ['TKO1', 'TKO2', 'TKO3', 'TKO4', 'GDG'];

    storeIds.forEach((tokoId) => {
      allSkus.forEach((sku, idx) => {
        // AFF has no stock balance (0)
        const isAff = sku.startsWith('AFF');
        const qty = isAff ? 0 : (tokoId === 'GDG' ? 500 : (idx === 0 ? 45 : (idx === 1 ? 20 : 15)));
        this.stokPerToko.push({
          stok_id: `STK-${tokoId}-${sku}`,
          sku: sku,
          toko_id: tokoId,
          stok_sistem: qty,
          stok_fisik_terakhir: qty,
          min_stok: isAff ? 0 : 5,
          terakhir_opname: todayYYYYMMDD(),
          created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM'
        });
      });
    });

    // 13. Karyawan & User Pengguna & Setting PIN
    this.masterKaryawan = [
      { karyawan_id: 'KRY-OWNER', nama: 'Owner Utama', employee_type: 'MANAGER', toko_id: 'TKO1', wa: '081100112233', gaji_type: 'BULANAN', gaji_pokok: 15000000, insentif_per_pcs: 0, aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { karyawan_id: 'KRY-MGR-1', nama: 'Budi Manager TKO1', employee_type: 'MANAGER', toko_id: 'TKO1', wa: '081233445566', gaji_type: 'BULANAN', gaji_pokok: 5000000, insentif_per_pcs: 1000, aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { karyawan_id: 'KRY-KAS-1', nama: 'Siti Kasir TKO1', employee_type: 'KASIR', toko_id: 'TKO1', wa: '081344556677', gaji_type: 'BULANAN', gaji_pokok: 3500000, insentif_per_pcs: 1000, split_kasir_pct: 1.0, split_spg_pct: 0.0, aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { karyawan_id: 'KRY-SPG-1', nama: 'Dewi SPG TKO1', employee_type: 'SPG', toko_id: 'TKO1', wa: '081455667788', gaji_type: 'BULANAN', gaji_pokok: 3000000, insentif_per_pcs: 1000, split_kasir_pct: 0.7, split_spg_pct: 0.3, aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { karyawan_id: 'KRY-GDG-1', nama: 'Agus Kepala Gudang', employee_type: 'GUDANG', toko_id: 'GDG', wa: '081566778899', gaji_type: 'BULANAN', gaji_pokok: 4200000, insentif_per_pcs: 0, aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    this.userPengguna = [
      { user_id: 'USR-OWNER', karyawan_id: 'KRY-OWNER', email: 'email.mercyzone@gmail.com', role: 'OWNER', toko_id: 'TKO1', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { user_id: 'USR-MGR-1', karyawan_id: 'KRY-MGR-1', role: 'MANAGER', toko_id: 'TKO1', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { user_id: 'USR-KAS-1', karyawan_id: 'KRY-KAS-1', role: 'KASIR', toko_id: 'TKO1', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { user_id: 'USR-GDG-1', karyawan_id: 'KRY-GDG-1', role: 'GUDANG', toko_id: 'GDG', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    // Demo PINs: Owner = 999999, Manager = 888888, Kasir = 123456, Gudang = 555555
    this.settingPIN = [
      { pin_id: 'PIN-OWNER', karyawan_id: 'KRY-OWNER', pin_hash: '999999', salt: 'salt1', failed_count: 0, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { pin_id: 'PIN-MGR-1', karyawan_id: 'KRY-MGR-1', pin_hash: '888888', salt: 'salt2', failed_count: 0, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { pin_id: 'PIN-KAS-1', karyawan_id: 'KRY-KAS-1', pin_hash: '123456', salt: 'salt3', failed_count: 0, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { pin_id: 'PIN-GDG-1', karyawan_id: 'KRY-GDG-1', pin_hash: '555555', salt: 'salt4', failed_count: 0, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    // Devices
    this.deviceToko = [
      { device_id: 'DEV-TKO1-001', toko_id: 'TKO1', nama_device: 'Kasir Tablet Toko 1', paired_at: ts, status: 'SUDAH_PAIRING', last_seen: ts, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { device_id: 'DEV-GDG-001', toko_id: 'GDG', nama_device: 'Terminal Gudang', paired_at: ts, status: 'SUDAH_PAIRING', last_seen: ts, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    // 14. Master Kurir, Printer, Scanner, Voucher, Komplain Jenis
    this.masterKurir = [
      { kurir_id: 'KUR-JNE', nama: 'JNE Express', tipe_ongkir: 'FLAT', ongkir_json: [{ zona: 'JAKARTA', tipe: 'FLAT', nilai: 15000 }, { zona: 'BANDUNG', tipe: 'PER_KG', nilai: 12000 }], fee_cod_persen: 0.03, fee_cod_min: 5000, cod_aktif: true, aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { kurir_id: 'KUR-GOSEND', nama: 'GoSend Instant', tipe_ongkir: 'PER_KM', ongkir_json: [{ zona: 'JABODETABEK', tipe: 'PER_KM', nilai: 3000 }], fee_cod_persen: 0, fee_cod_min: 0, cod_aktif: false, aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    this.masterPrinter = [
      { printer_id: 'PRN-TKO1-58', toko_id: 'TKO1', nama: 'Thermal Printer 58mm Kasir 1', jenis: 'THERMAL_58MM', koneksi: 'BLUETOOTH', auto_cut: false, copy_count: 1, font_size: 'M', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    this.masterScanner = [
      { scanner_id: 'SCN-TKO1-01', toko_id: 'TKO1', nama: 'Barcode Scanner USB Handheld', jenis: 'SCANNER_USB', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    this.voucherKodeDiskon = [
      { voucher_id: 'VOUCH-STEMPEL-01', kode: 'STEMPEL20K', jenis_voucher: 'STEMPEL', nominal: 20000, min_belanja: 100000, mulai: '2026-01-01', selesai: '2026-12-31', kuota: 100, terpakai: 5, aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { voucher_id: 'VOUCH-PROMO-10', kode: 'DISCOUNT10', jenis_voucher: 'PROMO', persen: 0.10, min_belanja: 150000, mulai: '2026-01-01', selesai: '2026-12-31', kuota: 500, terpakai: 12, aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    this.masterKomplainJenis = [
      { komplain_jenis_id: 'KMP-01', jenis: 'CACAT', solusi_default: 'GANTI_BARU', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' },
      { komplain_jenis_id: 'KMP-02', jenis: 'SALAH_UKURAN', solusi_default: 'REFUND', aktif: true, created_at: ts, created_by: 'SYSTEM', updated_at: ts, updated_by: 'SYSTEM' }
    ];

    // 15. Notifikasi WA Logs (BAB 10 & KEP-09)
    this.notifikasiWA = [
      {
        notif_id: 'NOTIF-WA-001',
        toko_id: 'TKO1',
        timestamp: '2026-11-12T08:30:00.000Z',
        tipe: 'BUKA_KAS',
        penerima: '6281299990001',
        isi: '*[ERP Toko Baju]* 🟢 *BUKA KAS HARIAN*\nToko: Toko Tanah Abang Blok A\nKasir: Siti Rahmawati\nModal Awal: Rp 200.000\nWaktu Buka: 12 Nov 2026, 08:30 WIB\nStatus: Siap melayani pelanggan.',
        status_kirim: 'TERKIRIM',
        aksi_url: 'https://api.whatsapp.com/send?phone=6281299990001'
      },
      {
        notif_id: 'NOTIF-WA-002',
        toko_id: 'TKO2',
        timestamp: '2026-11-12T09:45:00.000Z',
        tipe: 'STOK_HABIS',
        penerima: '6281299990004',
        isi: '*[ERP Toko Baju]* ⚠️ *PERINGATAN STOK MENIPIS*\nToko: Toko Thamrin City Lantai 1\nSKU: DTM-TSH-COT-OVS-001-BLK-M\nNama Produk: Oversized T-Shirt Cotton Combed 24s\nSisa Stok: *1 pcs*\nAmbang Batas: 2 pcs\nTindakan: Harap segera transfer dari Gudang Pusat!',
        status_kirim: 'TERKIRIM',
        aksi_url: 'https://api.whatsapp.com/send?phone=6281299990004'
      },
      {
        notif_id: 'NOTIF-WA-003',
        toko_id: 'TKO1',
        timestamp: '2026-11-12T10:15:00.000Z',
        tipe: 'TRANSFER_APPROVE',
        penerima: '6281299990002',
        isi: '*[ERP Toko Baju]* 📦 *PERSETUJUAN TRANSFER STOK*\nNo. Transfer: TRF-20261112-001\nDari Toko: GDG (Gudang Pusat) ➡️ Ke Toko: TKO1 (Tanah Abang)\nJumlah: 50 pcs\nTotal Nilai: Rp 3.500.000\nPenyetuju: Budi Hartono (Manager Toko 1)\nStatus: *DISETUJUI & SIAP DIKIRIM*',
        status_kirim: 'TERKIRIM',
        aksi_url: 'https://api.whatsapp.com/send?phone=6281299990002'
      },
      {
        notif_id: 'NOTIF-WA-004',
        toko_id: 'TKO1',
        timestamp: '2026-11-12T11:00:00.000Z',
        tipe: 'SETTLEMENT_PENITIP',
        penerima: '6281234567890',
        isi: '*[ERP Toko Baju]* 🤝 *REKAP KONSINYASI PENITIP*\nMitra: Yth. Ibu Maryam (Hijab & Gamis Syari)\nPeriode: November 2026\nBarang Terjual: 10 pcs\nOmzet Terjual: Rp 1.500.000\nBagi Hasil Toko (20%): Rp 300.000\n*HAK BERSIH PENITIP: Rp 1.200.000*\nStatus: Siap Ditransfer.',
        status_kirim: 'TERKIRIM',
        aksi_url: 'https://api.whatsapp.com/send?phone=6281234567890'
      },
      {
        notif_id: 'NOTIF-WA-005',
        toko_id: 'TKO3',
        timestamp: '2026-11-12T12:30:00.000Z',
        tipe: 'PIN_SALAH',
        penerima: '6281299990001',
        isi: '*[ERP Toko Baju]* 🚨 *ALERT KEAMANAN: PERCOBAAN PIN SALAH!*\nToko: Toko ITC Mangga Dua\nTerminal Device: Tablet Kasir Utama\nPercobaan Gagal: *3x berturut-turut*\nWaktu: 12 Nov 2026, 12:30 WIB\nStatus: Akses Terminal Dibekukan Sementara. Harap hubungi Owner!',
        status_kirim: 'TERKIRIM',
        aksi_url: 'https://api.whatsapp.com/send?phone=6281299990001'
      },
      {
        notif_id: 'NOTIF-WA-006',
        toko_id: 'TKO1',
        timestamp: '2026-11-12T13:00:00.000Z',
        tipe: 'GAJI_THR',
        penerima: '6281311223344',
        isi: '*[ERP Toko Baju]* 💰 *SLIP GAJI BULANAN KARYAWAN*\nYth. Rekan Siti Rahmawati\nPeriode: November 2026\nGaji Pokok: Rp 3.200.000\nInsentif Penjualan: Rp 350.000\nBonus & Lembur: Rp 200.000\nPotongan: Rp 50.000\n*TOTAL DITERIMA: Rp 3.700.000*\nStatus: DIBAYAR LUNAS ✓',
        status_kirim: 'TERKIRIM',
        aksi_url: 'https://api.whatsapp.com/send?phone=6281311223344'
      }
    ];

    // 16. Backup & Arsip Logs (BAB 5.9, BAB 9 & KEP-19)
    this.backupLog = [
      {
        backup_id: 'BCK-20261112-001',
        timestamp: '2026-11-12T02:00:00.000Z',
        folder: 'Google Drive/ERP_Backup/Daily',
        file_count: 38,
        status: 'SUKSES',
        keterangan: 'Snapshot Harian Otomatis Seluruh Database (Fase 1)',
        checksum: 'a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7',
        size_kb: 142
      },
      {
        backup_id: 'BCK-20261111-001',
        timestamp: '2026-11-11T02:00:00.000Z',
        folder: 'Google Drive/ERP_Backup/Daily',
        file_count: 38,
        status: 'SUKSES',
        keterangan: 'Snapshot Harian Otomatis Seluruh Database',
        checksum: 'f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2',
        size_kb: 139
      }
    ];

    this.logArsip = [
      {
        log_arsip_id: 'LOG-ARC-202610-001',
        archive_batch_id: 'ARC-BATCH-20261031',
        file_arsip_id: 'DRIVE-FILE-ARSIP-OKT2026',
        jumlah_header: 145,
        jumlah_detail: 390,
        jumlah_jurnal: 290,
        total_debit: 48500000,
        total_kredit: 48500000,
        checksum: 'c4ca4238a0b923820dcc509a6f75849b2847ff8269e120894a4c6a6d610b2a3a',
        status: 'DELETED',
        waktu_pindah: '2026-10-31T23:59:00.000Z'
      }
    ];
  }

  // --------------------------------------------------
  // Helper methods for priority price evaluation
  // --------------------------------------------------
  getHargaForSKU(sku: string, tokoId: string, classId: string, priceType: PriceType): { price: number; warning?: string } {
    const today = todayYYYYMMDD();
    const matches = this.masterHarga.filter((h) => h.sku === sku && h.aktif);

    // Rule prioritas: (toko, class) > (toko, ALL) > (ALL, class) > (ALL, ALL)
    let selected = matches.find((h) => h.toko_id === tokoId && h.class_id === classId);
    if (!selected) selected = matches.find((h) => h.toko_id === tokoId && h.class_id === 'ALL');
    if (!selected) selected = matches.find((h) => h.toko_id === 'ALL' && h.class_id === classId);
    if (!selected) selected = matches.find((h) => h.toko_id === 'ALL' && h.class_id === 'ALL');

    if (!selected) {
      return { price: 100000 }; // fallback default
    }

    if (priceType === 'RESELLER') {
      return { price: selected.harga_reseller };
    }

    if (priceType === 'PROMO') {
      const isPromoActive =
        selected.harga_promo != null &&
        selected.promo_mulai && selected.promo_selesai &&
        selected.promo_mulai <= today && today <= selected.promo_selesai;

      if (isPromoActive && selected.harga_promo) {
        return { price: selected.harga_promo };
      } else {
        return { price: selected.harga_normal, warning: 'PROMO_EXPIRED' };
      }
    }

    return { price: selected.harga_normal };
  }

  // Calculate taxes according to MasterSettingPajakPerClass & price_includes_tax
  calculateTaxAndTotals(
    subtotalBarang: number,
    diskonAmount: number,
    classId: string,
    pajakToggle: boolean,
    deliveryAmount: number,
    packagingAmount: number
  ) {
    const settingPajak = this.settingPajakPerClass.find((s) => s.class_id === classId) || {
      persen_pajak: 0.11,
      price_includes_tax: false
    };

    const subtotalKenaPajak = Math.max(0, subtotalBarang - diskonAmount);
    let dpp = subtotalKenaPajak;
    let pajakAmount = 0;
    const rate = settingPajak.persen_pajak;

    if (pajakToggle) {
      if (settingPajak.price_includes_tax) {
        dpp = Math.round(subtotalKenaPajak / (1 + rate));
        pajakAmount = subtotalKenaPajak - dpp;
      } else {
        pajakAmount = Math.round(subtotalKenaPajak * rate);
      }
    }

    const total = (settingPajak.price_includes_tax ? subtotalKenaPajak : (subtotalKenaPajak + pajakAmount)) + deliveryAmount + packagingAmount;

    return {
      subtotalKenaPajak: dpp,
      pajakRate: rate,
      pajakAmount: pajakAmount,
      priceIncludesTax: settingPajak.price_includes_tax,
      total: Math.round(total)
    };
  }
}

// Global Singleton Instance
export const db = new ERPDatabase();
