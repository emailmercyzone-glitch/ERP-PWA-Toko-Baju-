# BLUEPRINT ERP PWA + GAS — TOKO BAJU UMKM

**Status:** NORMATIF / FROZEN — CODING-READY  
**Versi:** v40 (Consolidated Full Blueprint)  
**Tanggal:** 12 Nov 2026  
**Ruang lingkup:** Blueprint, belum coding/build  
**Yang berlaku:** Dokumen ini, satu-satunya. Tidak ada v39, v39.1, v39.2, atau v38 yang normatif. Dokumen lama bersifat historis (Lampiran A) dan tidak boleh dijadikan acuan coding.

**Cara pakai:** Baca BAB 0 → BAB 10 berurutan. Setiap tabel, state, endpoint, dan aturan di sini adalah final. Kalau coder butuh klarifikasi, klarifikasi masuk ke v40.1 sebagai patch kecil; blueprint ini tidak diubah tanpa versi baru.

---

## DAFTAR ISI

- BAB 0. Prinsip & Ruang Lingkup
    
- BAB 1. Glosarium & Istilah Resmi
    
- BAB 2. Keputusan Final (KEP-01 s/d KEP-23)
    
- BAB 3. Arsitektur & Data Ownership Matrix
    
- BAB 4. Canonical Data Dictionary (Full Schema)
    
- BAB 5. State Machine (8 State)
    
- BAB 6. API Contract (17 Endpoint + JSON)
    
- BAB 7. Role & Permission Matrix
    
- BAB 8. Aturan Finansial Final
    
- BAB 9. Aturan Bisnis Bernomor (BR)
    
- BAB 10. Test Case Wajib (TC-001 s/d TC-042)
    
- Lampiran A. Changelog Historis
    
- Lampiran B. Checklist Coding & Go-Live
    

---

## BAB 0. PRINSIP & RUANG LINGKUP

### 0.1 Prinsip

|ID|Prinsip|Arti di Coding|
|---|---|---|
|P-01|Tampilan simpel, backend lengkap|Depan seperti GoPay / Qasir Pro. Belakang ERP lengkap.|
|P-02|OWN / CNS / AFF dipisah|Stok, jurnal, laporan terpisah per jenis.|
|P-03|UI/UX terpisah dari logika|Logika di GAS + Sheets. UI di PWA.|
|P-04|Satu versi kebenaran|v40 ini. Tidak ada versi paralel.|
|P-05|Tools + Form|Owner isi form. Logic mengikuti form. ERP menghitung.|
|P-06|Fleksibel|Delivery, packaging, pajak, COD, kurir, printer dikonfigurasi via form. Tidak ada tarif baku.|
|P-07|Canggihnya di belakang|Kasir tidak dibebani perhitungan. Semua otomatis.|
|P-08|ERP tampilkan fakta, Gemini beri saran|Gemini tidak pernah ubah data.|
|P-09|Akses by type/authority|Wewenang per jenis aksi, bukan hanya nominal.|
|P-10|Bertahap|Fase 1 dulu, uji 2 minggu, rollout. Gemini terakhir.|

### 0.2 Ruang Lingkup

- **Masuk:** 4 toko (TKO1–TKO4) + 1 gudang (GDG) + Pusat. Kasir, stok, transfer, opname, retur, kas, piutang/hutang, penitip, affiliate, voucher, bundle, preorder, gaji, absensi, pajak laporan, kurir, printer, backup, sync, arsip, dashboard, Gemini via GDrive.
    
- **Tidak masuk:** e-Faktur API langsung (hanya form + export CSV/XML), Rak/Bin gudang, modul clearance korporat, HRD korporat, full neraca (Fase 5).
    

---

## BAB 1. GLOSARIUM & ISTILAH RESMI

Semua dokumen, kode, dan UI wajib pakai kolom "Istilah resmi".

|Istilah resmi|Arti|Istilah lama (dipensiunkan)|
|---|---|---|
|Owner|Role full akses|Pemilik|
|Manager|Role tengah, pegang 1 toko|Admin, Supervisor, Kepala Toko|
|Kasir|Role jualan di POS|—|
|Gudang|Role terima/kirim/opname gudang|Admin Gudang|
|SPG|Employee type, bukan role login|—|
|Toko|Unit TKO1–TKO4|—|
|Gudang Pusat|Unit GDG|—|
|Pusat|Spreadsheet + GAS konsolidasi|—|
|GAS-PUSAT|GAS Pusat, sekaligus Orkestrator|GAS Orkestrator|
|PENDING_SYNC|Transaksi final di toko, belum ACK Pusat|—|
|SENT|Batch dikirim, belum ACK|—|
|UNKNOWN|Kirim, respons terputus|—|
|SYNCED|Sudah ACK Pusat|—|
|FAILED|Gagal sync, lihat failed_reason|FAIL|
|ARCHIVED|Sudah pindah ke arsip|—|
|BELUM_UTUH|Rangkaian belum selesai|BELUM_SELESAI|
|SELESAI_UTUH|Rangkaian selesai penuh|—|
|Pajak 1|PPN/PBJT 11% (default) di struk|Pajak|
|Pajak 2|PPh Final 0,5% dari omzet|Pajak|
|e-Faktur Coretax|Faktur pajak elektronik di Coretax|e-Faktur|
|COD Customer|Customer bayar saat barang datang|COD|
|Bayar Langsung|Supplier tempo 0 hari|COD Supplier|
|Stempel Voucher|Belanja 5x = voucher|Poin|
|Insentif|Per pcs Rp 1.000 + Bonus Target|Komisi SPG|
|Kas Kecil|0–50rb dari amplop|—|
|Operasional Kecil|50.001–200rb langsung bayar|—|
|Operasional Gede|>200rb, approve Owner|—|
|Barcode Code128|Label baju, isi SKU|—|
|QR Code|Struk, katalog, portal|—|
|transaction_id|ID transaksi (= Transaksi_ID)|—|
|payload_hash|Hash isi transaksi|—|

---

## BAB 2. KEPUTUSAN FINAL (KEP-01 s/d KEP-23)

Semua di bawah ini adalah keputusan final. Tidak ada "lihat v39.1" atau "abaikan v39". Coder mengikuti tabel ini.

|ID|Isu|Keputusan Final|
|---|---|---|
|KEP-01|Nomor BAB tabrakan|Struktur final: BAB 0–10 + Lampiran. Nomor stabil.|
|KEP-02|Versi campur|v40 satu-satunya versi normatif.|
|KEP-03|Harga di Barang vs Master_Harga|`Master_Barang` = style (tanpa harga). `Master_Varian` = SKU. Harga hanya di `Master_Harga`.|
|KEP-04|Enum sync|`PENDING_SYNC, SENT, UNKNOWN, SYNCED, FAILED, ARCHIVED`. `FAILED` wajib punya `failed_reason` + `failed_detail`.|
|KEP-05|SPG role atau bukan|SPG = `employee_type`, bukan role login. Split insentif dipilih kasir saat transaksi.|
|KEP-06|Delivery + packaging 2 field vs 1|**Data: 2 field** (`delivery_amount`, `packaging_amount`). PWA boleh tampilkan 1 input gabungan, tapi submit 2 field. Tidak ada split 80/20.|
|KEP-07|Transfer approve|Manager toko asal approve ≤ Rp 2.000.000. Owner approve > Rp 2.000.000 atau lintas class.|
|KEP-08|Manager input izin|Manager boleh input izin kasir di toko yang dia pegang. Owner semua.|
|KEP-09|WA 07–21 vs tutup 22.00|Laporan tutup kas kirim segera, tanpa batas. Notifikasi non-darurat 07–21. Darurat (void, PIN salah, gagal sync) selalu kirim.|
|KEP-10|Opname gap 100–500rb|Manager: ≤ Rp 500.000 **dan** ≤ 2 pcs. Owner: > Rp 500.000 **atau** > 2 pcs **atau** barang mahal (harga jual > `barang_mahal_threshold` di Master_Config, default 500rb).|
|KEP-11|Pajak PBJT vs PPN|Istilah resmi: **Pajak 1**. Default 11%, bisa diubah per class. Pilih PPN atau PBJT per class. Jangan campur istilah.|
|KEP-12|Urutan diskon vs pajak|Diskon dari subtotal barang → pajak dari subtotal setelah diskon → delivery/packaging ditambah setelah pajak.|
|KEP-13|SKU 25 vs 26 karakter|Tidak ada validasi panjang kaku. Regex + cek duplikat. Regex: `^[A-Z]{3}-[A-Z]{3}-[A-Z]{3}-[A-Z]{3}-[0-9]{3}-[A-Z]{3}-[0-9A-Z]{2,}$`|
|KEP-14|`price_includes_tax`|Wajib di `Master_Setting_Pajak_Per_Class` + snapshot di `Transaksi_Penjualan`.|
|KEP-15|Pembayaran split|Tabel `Pembayaran` 1—N. Maks 2 metode. Split direpresentasikan > 1 baris.|
|KEP-16|Approval generik|Tabel `Approval` untuk semua tipe. Link ke transaksi via `Transaksi_Approval` (1 transaksi bisa N approval).|
|KEP-17|Master_Config|Tabel resmi, key-value global.|
|KEP-18|Sync batch unit|Array `transaction_bundle`. `sync_batch_id` per group.|
|KEP-19|Arsip STOP|STOP per toko. Toko lain lanjut.|
|KEP-20|Role Admin|Admin = Manager. Admin Gudang = Gudang. Tidak ada role Admin terpisah.|
|KEP-21|Jenis di Barang vs Varian|Jenis (OWN/CNS/AFF) **di `Master_Varian`**. 1 Style boleh campur jenis. 1 SKU = 1 jenis.|
|KEP-22|Manager lihat HPP|Default tidak. Owner bisa set `manager_boleh_lihat_hpp=true` di `Setting_Bisnis`. Kalau true, Manager lihat HPP/profit toko dia saja. Kasir/Gudang tidak pernah.|
|KEP-23|Absensi Home|Absensi Home = Toko (input), Replica = Pusat. Gaji Home = Pusat (hitung), Replica = Toko (slip read-only).|

---

## BAB 3. ARSITEKTUR & DATA OWNERSHIP MATRIX

### 3.1 Topologi

text

Copy

Download

PWA (HP/Tablet/Laptop) — 4 Toko + 1 Gudang + Owner
        |
        | HTTPS / JSON
        v
GAS-TKO1 + Sheet ERP-TKO1-AKTIF
GAS-TKO2 + Sheet ERP-TKO2-AKTIF
GAS-TKO3 + Sheet ERP-TKO3-AKTIF
GAS-TKO4 + Sheet ERP-TKO4-AKTIF
GAS-GDG  + Sheet ERP-GDG-AKTIF
        |
        | Sync via Orkestrator (GAS-PUSAT), idempotent, ACK
        v
GAS-PUSAT + Sheet ERP-PUSAT (konsolidasi)
        |
        | Arsip via orkestrasi
        v
Drive ERP-Arsip-YYYY-MM/  (arsip bulanan)
Drive ERP-Backup/          (backup, JANGAN dibaca Gemini)
Drive ERP-Gemini/          (agregat untuk Gemini)

**Aturan:**

- GAS per unit. Nomor urut transaksi dibuat di GAS unit, bukan HP.
    
- Orkestrator = GAS-PUSAT, bukan GAS ke-7.
    
- Kuota GAS dihitung per akun Google pengguna, bukan per project. Pisah file = pisah beban, bukan klaim kuota 4x.
    
- Source of truth: Toko = sumber lokal sampai ACK. Pusat = sumber konsolidasi setelah ACK.
    
- Akun project GAS milik Owner (atau akun toko yang dipegang Owner). Kasir tidak pegang akun GAS, kasir PIN.
    

### 3.2 Data Ownership Matrix

|Tabel|Home|Replica|Tulis|Sync|Retensi|
|---|---|---|---|---|---|
|Master_Barang|Pusat|Toko (RO)|Owner|Pusat→Toko|Permanen|
|Master_Varian|Pusat|Toko (RO)|Owner|Pusat→Toko|Permanen|
|Master_Harga|Pusat|Toko (RO)|Owner|Pusat→Toko|Permanen|
|Master_Merek/Kategori/Warna/Ukuran|Pusat|Toko|Owner|Pusat→Toko|Permanen|
|Master_Toko/Class/Pajak_Per_Class|Pusat|Toko|Owner|Pusat→Toko|Permanen|
|Master_NPWP_*|Pusat|Toko (hidden dari Kasir)|Owner|Pusat→Toko|Permanen|
|Master_Supplier/Penitip/Pelanggan/Affiliate|Pusat|Toko|Owner/Manager|Pusat↔Toko|Permanen|
|Master_Karyawan/User/Device/Setting_PIN|Pusat|Toko|Owner|Pusat→Toko|Permanen|
|Master_Kurir/Printer/Scanner/Config/Setting_Bisnis|Pusat|Toko|Owner|Pusat→Toko|Permanen|
|Transaksi_Penjualan + Detail|Toko|Pusat (setelah ACK)|Kasir via GAS Toko|Toko→Pusat|7 hari + arsip|
|Transaksi_Approval|Toko|Pusat|GAS|Toko→Pusat|7 hari + arsip|
|Pembayaran|Toko|Pusat|Kasir|Toko→Pusat|7 hari + arsip|
|Jurnal_Otomatis|Toko|Pusat|GAS|Toko→Pusat|7 hari + arsip|
|Stok_Per_Toko|Toko|Pusat|GAS Toko|Toko→Pusat|Permanen|
|Stok_Movement|Toko|Pusat|GAS Toko|Toko→Pusat|7 hari + arsip|
|Kas_Harian/Kas_Kecil/Kas_Modal_Awal|Toko|Pusat|Kasir/Manager|Toko→Pusat|7 hari + arsip|
|Piutang_DP/Hutang_Supplier/Utang_Penitip|Toko|Pusat|Manager/Owner|Toko→Pusat|Sampai lunas|
|Transfer_Stok|Toko asal+tujuan|Pusat|Manager|Toko↔Pusat|7 hari + arsip|
|Opname|Toko/Gudang|Pusat|Manager/Owner|Toko→Pusat|7 hari + arsip|
|Retur_Jual/Retur_Beli|Toko/Gudang|Pusat|Kasir/Manager/Owner|Toko→Pusat|Sampai selesai|
|Pembelian_PO/Penerimaan_Barang|Gudang|Pusat|Gudang/Owner|Gudang→Pusat|Sampai lunas|
|Voucher/Bundle/PreOrder/Komplain|Toko|Pusat|Kasir/Manager|Toko→Pusat|Sesuai status|
|Komisi_SPG_Kasir/Insentif_Detail|Toko|Pusat|GAS|Toko→Pusat|Permanen|
|Absensi|**Toko**|Pusat|Kasir/Manager|Toko→Pusat|Permanen|
|Gaji/Slip_Gaji|**Pusat**|Toko (RO slip)|Owner/GAS-PUSAT|Pusat→Toko|Permanen|
|Approval|Toko|Pusat|GAS|Toko→Pusat|7 hari + arsip|
|Audit_Log|Toko+Pusat|—|GAS|Toko→Pusat|Permanen|
|Log_Sync/Log_Arsip/Log_Sync_Pusat/Backup_Log|Toko+Pusat|—|GAS|—|90 hari|
|Summary_Harian|Pusat|Toko (RO)|GAS-PUSAT|Pusat→Toko|Permanen|
|AI_Skill/AI_Insight|Pusat|—|Owner|—|Permanen|
|Notifikasi_WA|Toko/Pusat|—|GAS|—|90 hari|
|Idempotency_Log|Toko+Pusat|—|GAS|—|30 hari|

**Aturan tambahan:**

- Kasir tidak boleh tulis langsung ke Sheet Pusat.
    
- Master_Harga di Toko read-only. Perubahan Pusat sampai ke Toko pada sync berikutnya.
    
- Setting_Bisnis (NPWP, pajak, class) read-only di Toko.
    
- Data belum `SELESAI_UTUH` tidak boleh diarsip.
    
- Harga berubah di Pusat 10:00, kasir jual 10:05 sebelum sync pakai harga lama — itu benar, snapshot di `Transaksi_Detail.harga_jual_satuan`.
    

### 3.3 Sync & Arsip Ringkas

- Sync per batch, idempotent via `transaction_id` + `payload_hash`.
    
- Retensi lokal 7 hari setelah `SYNCED` + backup, baru boleh dibersihkan.
    
- Backup Drive: 30 hari default (Master_Config).
    
- Arsip hanya `SELESAI_UTUH`, verifikasi lengkap, resume setelah gagal.
    
- `batch_size` default 500 di `Master_Config`, bukan sakral.
    
- Baca/tulis pakai `getValues()`/`setValues()` per batch, bukan `appendRow`.
    

### 3.4 Gemini

- Baca hanya `ERP-Gemini/` (agregat).
    
- Allowlist 4 fungsi: `get_omzet_harian`, `get_stok_mati`, `get_kas_harian`, `get_barang_terlaris`.
    
- Function Calling: Gemini usul, backend GAS validasi + eksekusi.
    
- API key di Script Properties.
    
- Gemini tidak pernah tulis.
    

---

## BAB 4. CANONICAL DATA DICTIONARY (FULL SCHEMA)

### 4.1 Konvensi

- **Tipe:** `string`, `int`, `decimal(15,2)`, `date` (YYYY-MM-DD), `datetime` (ISO 8601), `bool`, `enum`.
    
- **Nama kolom:** `snake_case`. Tampilan boleh `Title_Case`.
    
- **Audit wajib di semua tabel:** `created_at`, `created_by`, `updated_at`, `updated_by`.
    
- **Sync wajib di tabel transaksi header:** `source_store_id`, `sync_batch_id`, `sync_status`, `received_at`, `payload_hash`, `created_at_sync` (6 field).
    
- **Sync di detail:** 4 field (`source_store_id`, `sync_batch_id`, `payload_hash`, `created_at_sync`). Tidak ada `sync_status` di detail.
    
- **`status_rangkaian`** wajib di tabel transaksi: `BELUM_UTUH | SELESAI_UTUH`.
    
- **`transaction_id` = `Transaksi_ID`** (satu field, dua penulisan; kolom Sheets = `transaction_id`).
    
- **Uang:** `decimal(15,2)`, pembulatan rupiah terdekat di `total`.
    
- **Tidak ada formula rumit di Sheets.** Semua hitung di GAS.
    

### 4.2 Enum Master (Final)

|Enum|Nilai valid|
|---|---|
|jenis_barang|OWN, CNS, AFF|
|role|OWNER, MANAGER, KASIR, GUDANG|
|employee_type|KASIR, SPG, GUDANG, MANAGER|
|sync_status|PENDING_SYNC, SENT, UNKNOWN, SYNCED, FAILED, ARCHIVED|
|status_rangkaian|BELUM_UTUH, SELESAI_UTUH|
|payment_status|UNPAID, PARTIAL, PAID, REFUNDED, VOID|
|payment_method|TUNAI, QRIS, TRANSFER, DP|
|approval_status|PENDING, APPROVED, REJECTED, EXPIRED|
|approval_type|VOID, DISKON, TRANSFER, OPNAME, DARURAT, PELUNASAN, PO, RETUR|
|transfer_status|DIMINTA, DISETUJUI, DIKIRIM, DITERIMA, DITOLAK, DIBATALKAN|
|opname_status|DRAFT, COUNTING, PENDING_APPROVAL, APPROVED, REJECTED, POSTED|
|retur_status|DIAJUKAN, DISETUJUI, DITOLAK, BARANG_DITERIMA, SELESAI|
|jenis_retur|TUKAR_SAMA, TUKAR_BEDA, REFUND|
|jenis_voucher|STEMPEL, PROMO, RETUR|
|price_type|NORMAL, RESELLER, PROMO|
|sales_channel|TOKO, SHOPEE, TIKTOK, WA, WEBSITE|
|pajak_skema|PPH_FINAL_05, NORMAL, TIDAK_PAKE|
|arsip_status|STARTED, COPIED, VERIFIED, DELETED, FAILED|
|class_toko|A, B, C, D|
|pembelian_po_status|DRAFT, APPROVED, SENT, RECEIVED, CANCELLED|
|retur_beli_status|DIAJUKAN, DISETUJUI, DIKIRIM, DIJAWAB, SELESAI, DITOLAK|
|komplain_status|BARU, DIPROSES, SELESAI, DITOLAK|
|preorder_status|DP, LUNAS, BATAL, DIAMBIL|
|gaji_status|DRAFT, DIBAYAR|
|notifikasi_wa_tipe|BUKA_KAS, STOK_HABIS, TRANSFER_APPROVE, PIUTANG_JATUH_TEMPO, SETTLEMENT_PENITIP, ORDER_MARKETPLACE, RETUR_APPROVE, GAJI_THR, TUTUP_KAS, BACKUP, PIN_SALAH, SYNC_GAGAL, SYNC_UNKNOWN|
|stok_movement_tipe|JUAL, BELI, TRANSFER, OPNAME, RETUR|
|member_tier|BARU, LANGGANAN, SULTAN|
|penitip_tanggung_rusak|PENITIP, TOKO|
|ai_skill_level|1, 2, 3|
|bayar_jenis|PIUTANG, HUTANG_SUPPLIER, UTANG_PENITIP, KOMISI_AFFILIATE, SETORAN, OPERASIONAL_KECIL, OPERASIONAL_GEDE, KAS_KECIL|
|kas_harian_status|DRAFT, TUTUP, SELISIH|
|kas_kecil_status|DRAFT, TUTUP|
|verified_status|BELUM_VERIFIKASI, TERVERIFIKASI, DITOLAK|
|failed_reason|FAILED_CONFLICT, FAILED_VALIDATION|
|opname_alasan|HILANG, RUSAK, SALAH_INPUT, SALAH_KIRIM, DICURI|
|tipe_dokumen|INVOICE, KWITANSI, SURAT_JALAN|

### 4.3 Tabel Master (Full Columns)

**Master_Barang** — Home: Pusat. Style, tanpa harga, tanpa jenis.

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|barang_id|string|PK|Ya|BRG-001|
|nama_manusia|string|—|Ya|Contoh "Erigo Celana Jeans"|
|style_code|string|—|Ya|Unik. ERG-CLN-JNS-001|
|merek_id|string|FK|Ya|—|
|kategori_id|string|FK|Ya|—|
|foto_url|string|—|Opsional|—|
|aktif|bool|—|Ya|Default true|

**Master_Varian** — Home: Pusat. SKU, jenis di sini (KEP-21).

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|sku|string|PK|Ya|OWN-ERG-CLN-JNS-001-BLU-35|
|barang_id|string|FK|Ya|—|
|warna_id|string|FK|Ya|—|
|ukuran_id|string|FK|Ya|—|
|jenis_barang|enum|—|Ya|OWN/CNS/AFF|
|penitip_id|string|FK|Conditional|Wajib jika CNS|
|merchant_id|string|FK|Conditional|Wajib jika AFF|
|barcode_code128|string|—|Ya|= sku|
|aktif|bool|—|Ya|—|

**Master_Merek / Master_Merchant_Afiliasi / Master_Kategori / Master_Warna / Master_Ukuran**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|merek_id / merchant_id / kategori_id / warna_id / ukuran_id|string|PK|Ya|—|
|kode_3|string|—|Ya|Unik per tabel|
|nama|string|—|Ya|—|
|tipe_ukuran|string|—|Opsional|Hanya Ukuran: ANGKA/HURUF|
|aktif|bool|—|Ya|—|

**Master_Toko**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|toko_id|string|PK|Ya|TKO1..TKO4, GDG|
|nama|string|—|Ya|"Toko 1 Mall"|
|alamat|string|—|Ya|—|
|class_id|string|FK|Ya|—|
|npwp_toko_id|string|FK|Opsional|Null = pakai NPWP Pemilik|
|jam_tutup|string|—|Ya|HH:MM|
|wa_start|string|—|Ya|HH:MM default 07:00|
|wa_end|string|—|Ya|HH:MM default 21:00|
|aktif|bool|—|Ya|—|

**Master_Class_Toko**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|class_id|string|PK|Ya|A/B/C/D|
|nama|string|—|Ya|—|
|deskripsi|string|—|Opsional|—|

**Master_Setting_Pajak_Per_Class**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|class_id|string|PK, FK|Ya|—|
|persen_pajak|decimal|—|Ya|Default 0.11|
|pajak_skema|enum|—|Ya|PPH_FINAL_05 / NORMAL / TIDAK_PAKE|
|default_toggle|bool|—|Ya|—|
|kasir_boleh_ubah|bool|—|Ya|—|
|delivery_kena_pajak|bool|—|Ya|Default false|
|packaging_kena_pajak|bool|—|Ya|Default false|
|pajak_wajib_tampil|bool|—|Ya|—|
|price_includes_tax|bool|—|Ya|KEP-14|
|aktif|bool|—|Ya|—|

**Master_NPWP_Pemilik / Master_NPWP_Toko** — NPWP tidak tampil di struk.

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|npwp_id / npwp_toko_id|string|PK|Ya|—|
|toko_id|string|FK|Opsional|Hanya NPWP_Toko|
|nama_wp|string|—|Ya|—|
|jenis_npwp|string|—|Ya|OrangPribadi/Badan/Cabang|
|nomor_npwp|string|—|Ya|Plain di Sheets, AES-256 di backup (fix v39.2 X-1)|
|alamat|string|—|Ya|—|
|no_pkp|string|—|Opsional|—|

**Master_Supplier**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|supplier_id|string|PK|Ya|—|
|nama|string|—|Ya|—|
|wa|string|—|Ya|—|
|rekening|string|—|Opsional|—|
|tempo_hari|int|—|Ya|0/7/14/30|
|lead_time_hari|int|—|Ya|—|
|rating|decimal|—|Opsional|Otomatis|

**Master_Penitip**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|penitip_id|string|PK|Ya|—|
|nama|string|—|Ya|—|
|wa|string|—|Ya|—|
|komisi_persen|decimal|—|Ya|0.20|
|settlement_type|string|—|Ya|MINGGUAN/BULANAN/PER_TRANSAKSI|
|masa_titip_hari|int|—|Ya|Default 90|
|tanggung_rusak|enum|—|Ya|PENITIP / TOKO|

**Master_Pelanggan_Member**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|customer_id|string|PK|Ya|—|
|nama|string|—|Ya|—|
|wa|string|—|Ya|Unik|
|tgl_lahir|date|—|Opsional|—|
|tier|enum|—|Ya|BARU/LANGGANAN/SULTAN|
|npwp_pembeli|string|—|Opsional|—|
|jenis_npwp_pembeli|string|—|Opsional|—|
|alamat_npwp|string|—|Opsional|—|

**Master_Harga** — Harga hanya di sini. `toko_id` dan `class_id` **NOT NULL** isi `"ALL"` untuk global.

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|harga_id|string|PK|Ya|—|
|sku|string|FK|Ya|—|
|toko_id|string|FK|**Ya (NOT NULL)**|"ALL" atau TKO1..TKO4|
|class_id|string|FK|**Ya (NOT NULL)**|"ALL" atau A/B/C/D|
|harga_normal|decimal|—|Ya|—|
|harga_reseller|decimal|—|Ya|—|
|harga_promo|decimal|—|Opsional|Null = tidak promo|
|promo_mulai|date|—|Opsional|—|
|promo_selesai|date|—|Opsional|—|
|aktif|bool|—|Ya|—|
|version|int|—|Ya|+1 tiap ubah|

> Tidak ada kolom `price_type` di sini. `price_type` adalah snapshot saat transaksi, disimpan di `Transaksi_Penjualan`.

**Aturan prioritas harga (final):**

1. Filter: `sku = X AND aktif = true AND (toko_id = :toko OR toko_id = 'ALL') AND (class_id = :class OR class_id = 'ALL')`
    
2. Kalau `price_type = PROMO`: filter `harga_promo != null AND promo_mulai <= today <= promo_selesai`. Kalau kosong → fallback `NORMAL` + warning `PROMO_EXPIRED`.
    
3. Urut prioritas: `(toko,class)` > `(toko,ALL)` > `(ALL,class)` > `(ALL,ALL)`.
    
4. Tie-break: `version` tertinggi → `created_at` terbaru → `harga_id`.
    
5. Ambil 1 baris, pakai harga sesuai `price_type`.
    

**Master_Karyawan** — tidak ada `pin_hash`.

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|karyawan_id|string|PK|Ya|—|
|nama|string|—|Ya|—|
|employee_type|enum|—|Ya|KASIR/SPG/GUDANG/MANAGER|
|toko_id|string|FK|Ya|—|
|wa|string|—|Ya|—|
|gaji_type|string|—|Ya|HARIAN/BULANAN|
|gaji_pokok|decimal|—|Ya|—|
|insentif_per_pcs|decimal|—|Ya|Default 1000|
|bonus_target_pcs|int|—|Opsional|—|
|bonus_target_nominal|decimal|—|Opsional|—|
|split_kasir_pct|decimal|—|**Opsional**|Default 1.0 untuk KASIR, null untuk lainnya|
|split_spg_pct|decimal|—|**Opsional**|Default 0 untuk KASIR tanpa SPG|
|shift|string|—|Opsional|—|
|aktif|bool|—|Ya|—|

**User_Pengguna** — email opsional kecuali OWNER.

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|user_id|string|PK|Ya|—|
|karyawan_id|string|FK|Opsional|—|
|email|string|—|**Conditional**|Wajib hanya untuk OWNER (Gmail login). Opsional untuk MANAGER/KASIR/GUDANG (notifikasi saja)|
|role|enum|—|Ya|—|
|toko_id|string|FK|Ya|—|
|aktif|bool|—|Ya|—|

**Device_Toko**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|device_id|string|PK|Ya|—|
|toko_id|string|FK|Ya|—|
|nama_device|string|—|Ya|—|
|paired_at|datetime|—|Opsional|—|
|status|string|—|Ya|BELUM_PAIRING/SUDAH_PAIRING/DILEPAS|
|last_seen|datetime|—|Opsional|—|

**Setting_PIN** — satu-satunya sumber PIN.

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|pin_id|string|PK|Ya|—|
|karyawan_id|string|FK|Ya|1 karyawan = 1 baris aktif|
|pin_hash|string|—|Ya|Hash + salt|
|salt|string|—|Ya|—|
|failed_count|int|—|Ya|Default 0|
|locked_until|datetime|—|Opsional|Null = tidak terkunci|

**Setting_Tampilan** — Home: device (lokal).

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|setting_id|string|PK|Ya|—|
|device_id|string|FK|Ya|—|
|tema/animasi/ukuran_font/mode_hp/ukuran_foto|string|—|Ya|—|

**Setting_Bisnis**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|setting_id|string|PK|Ya|—|
|toko_id|string|FK|Ya|—|
|metode_bayar_aktif|string|—|Ya|JSON array|
|npwp_mode|string|—|Ya|—|
|pajak_skema|enum|—|Ya|—|
|batas_bebas|decimal|—|Ya|Default 500.000.000|
|tarif_pph|decimal|—|Ya|Default 0.005|
|form_omzet_cns / form_omzet_aff|string|—|Ya|Ikut form Owner|
|pkp_status|string|—|Ya|PKP / NON_PKP|
|tgl_pkp|date|—|Opsional|—|
|manager_boleh_lihat_hpp|bool|—|Ya|Default false (KEP-22)|
|manager_boleh_lihat_laba|bool|—|Ya|Default false|

**Master_Config** — key-value global. `config_id` surrogate.

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|config_id|string|PK|Ya|CFG-001, CFG-002, dst|
|key|string|—|Ya|Unique. batch_size, retensi__, folder__, barang_mahal_threshold|
|value|string|—|Ya|—|
|deskripsi|string|—|Opsional|—|

> Tidak ada `jam_tutup` / `wa_start` / `wa_end` di sini. Itu di `Master_Toko`.

**Master_Kurir** — pecah tabel terpisah.

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|kurir_id|string|PK|Ya|—|
|nama|string|—|Ya|—|
|tipe_ongkir|string|—|Ya|PER_KG/FLAT/PER_KM|
|ongkir_json|string|—|Ya|—|
|fee_cod_persen|decimal|—|Ya|Default 0|
|fee_cod_min|decimal|—|Ya|Default 0|
|cod_aktif|bool|—|Ya|—|
|aktif|bool|—|Ya|—|

**Master_Printer**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|printer_id|string|PK|Ya|—|
|toko_id|string|FK|Ya|—|
|nama|string|—|Ya|—|
|jenis|string|—|Ya|THERMAL_58MM/THERMAL_80MM/A4/PDF|
|koneksi|string|—|Ya|BLUETOOTH/USB/WIFI|
|auto_cut|bool|—|Ya|—|
|copy_count|int|—|Ya|—|
|font_size|string|—|Ya|S/M/L|
|aktif|bool|—|Ya|—|

**Master_Scanner**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|scanner_id|string|PK|Ya|—|
|toko_id|string|FK|Ya|—|
|nama|string|—|Ya|—|
|jenis|string|—|Ya|KAMERA_HP/SCANNER_USB/SCANNER_BLUETOOTH|
|aktif|bool|—|Ya|—|

**Master_Affiliate**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|affiliate_id|string|PK|Ya|—|
|nama|string|—|Ya|—|
|wa|string|—|Ya|—|
|rekening|string|—|Opsional|—|
|komisi_type|string|—|Ya|PERSEN/FLAT|
|komisi_nilai|decimal|—|Ya|—|
|min_payout|decimal|—|Ya|—|
|tgl_payout|string|—|Ya|—|
|aktif|bool|—|Ya|—|

### 4.4 Tabel Transaksi (Full Columns)

**Transaksi_Penjualan** — Home: Toko. 6 sync field header. Tidak ada `approval_id` (KEP-16).

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|transaction_id|string|PK|Ya|TRX-TKO1-20261113-0001|
|tanggal|date|—|Ya|—|
|toko_id|string|FK|Ya|—|
|kasir_id|string|FK|Ya|—|
|customer_id|string|FK|Opsional|—|
|voucher_id|string|FK|Opsional|—|
|bundle_id|string|FK|Opsional|—|
|class_toko_saat_transaksi|string|—|Ya|A/B/C/D|
|price_type|enum|—|Ya|NORMAL/RESELLER/PROMO|
|subtotal_barang|decimal|—|Ya|—|
|diskon_amount|decimal|—|Ya|Default 0|
|subtotal_kena_pajak|decimal|—|Ya|—|
|pajak_rate|decimal|—|Ya|—|
|pajak_amount|decimal|—|Ya|—|
|price_includes_tax|bool|—|Ya|Snapshot|
|delivery_amount|decimal|—|Ya|Default 0|
|packaging_amount|decimal|—|Ya|Default 0|
|total|decimal|—|Ya|—|
|is_split|bool|—|Ya|Default false. True jika Pembayaran > 1 baris|
|payment_status|enum|—|Ya|—|
|status_rangkaian|enum|—|Ya|—|
|sales_channel|enum|—|Ya|—|
|penerima_nama/penerima_alamat/penerima_wa|string|—|Opsional|Wajib jika delivery|
|kurir_id|string|FK|Opsional|—|
|resi|string|—|Opsional|—|
|catatan|string|—|Opsional|—|
|source_store_id|string|—|Ya|Sync 1/6|
|sync_batch_id|string|—|Ya|Sync 2/6|
|sync_status|enum|—|Ya|Sync 3/6|
|received_at|datetime|—|Opsional|Sync 4/6. Diisi Pusat saat ACK|
|payload_hash|string|—|Ya|Sync 5/6|
|created_at_sync|datetime|—|Ya|Sync 6/6|
|failed_reason|enum|—|Opsional|Wajib jika `FAILED`|
|failed_detail|string|—|Opsional|—|

**Transaksi_Detail**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|detail_id|string|PK|Ya|—|
|transaction_id|string|FK|Ya|—|
|sku|string|FK|Ya|—|
|qty|int|—|Ya|—|
|harga_jual_satuan|decimal|—|Ya|Snapshot|
|diskon_satuan|decimal|—|Ya|Default 0|
|jenis_barang|enum|—|Ya|OWN/CNS/AFF|
|komisi_kasir|decimal|—|Ya|—|
|komisi_penitip|decimal|—|Ya|—|
|komisi_affiliate|decimal|—|Ya|—|
|hpp_satuan|decimal|—|Ya|Snapshot, 0 untuk CNS/AFF|
|spg_id|string|FK|Opsional|—|
|source_store_id|string|—|Ya|Sync 1/4|
|sync_batch_id|string|—|Ya|Sync 2/4|
|payload_hash|string|—|Ya|Sync 3/4|
|created_at_sync|datetime|—|Ya|Sync 4/4|

**Pembayaran** — `transaction_id` opsional (KEP-15, fix Y).

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|pembayaran_id|string|PK|Ya|—|
|transaction_id|string|FK|**Opsional**|Diisi jika bayar customer|
|invoice_id / kwitansi_id|string|FK|Opsional|—|
|referensi_id|string|—|Opsional|Hutang/operasional/setoran ID|
|referensi_type|enum|—|Opsional|bayar_jenis|
|metode|enum|—|Ya|TUNAI/QRIS/TRANSFER/DP|
|nominal|decimal|—|Ya|—|
|bukti_url|string|—|Opsional|Wajib QRIS/Transfer|
|status_verifikasi|enum|—|Ya|BELUM_VERIFIKASI/TERVERIFIKASI/DITOLAK|
|verified_by|string|FK|Opsional|—|
|verified_at|datetime|—|Opsional|—|
|catatan|string|—|Opsional|—|

> Validasi: `transaction_id` dan `referensi_id` tidak boleh dua-duanya null.

**Transaksi_Approval** — link table (KEP-16). 1 transaksi bisa N approval.

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|transaksi_approval_id|string|PK|Ya|—|
|transaction_id|string|FK|Ya|—|
|approval_id|string|FK|Ya|—|
|tipe|enum|—|Ya|approval_type|

**Dokumen_Quotation**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|quotation_id|string|PK|Ya|—|
|toko_id / customer_id|string|FK|Ya|—|
|nomor_manusia|string|—|Ya|QTN-TKO1-20261113-0001|
|tanggal / berlaku_sampai|date|—|Ya|—|
|status|string|—|Ya|DRAFT/DIKIRIM/DITERIMA/DITOLAK|
|total|decimal|—|Ya|—|
|qr_url|string|—|Opsional|—|

**Dokumen_Invoice**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|invoice_id|string|PK|Ya|—|
|quotation_id|string|FK|Opsional|—|
|toko_id / customer_id|string|FK|Ya|—|
|nomor_manusia|string|—|Ya|INV-TKO1-20261113-0001|
|tanggal / jatuh_tempo|date|—|Ya|—|
|npwp_penjual / npwp_pembeli|string|—|Opsional|**Snapshot**, bukan FK|
|total / sudah_dibayar / sisa|decimal|—|Ya|—|
|status|enum|—|Ya|UNPAID/PARTIAL/PAID|
|qr_url|string|—|Opsional|—|

**Dokumen_Kwitansi**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|kwitansi_id|string|PK|Ya|—|
|invoice_id / transaction_id|string|FK|Opsional|—|
|nomor_manusia|string|—|Ya|KWI-TKO1-20261113-0001|
|tanggal_terima|date|—|Ya|—|
|jumlah|decimal|—|Ya|—|
|terbilang|string|—|Ya|—|
|untuk_pembayaran|string|—|Ya|—|
|metode|enum|—|Ya|—|
|penerima|string|—|Ya|—|
|npwp_penjual|string|—|Opsional|**Snapshot**|
|qr_url|string|—|Opsional|—|

**Dokumen_Surat_Jalan**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|sj_id|string|PK|Ya|—|
|transaction_id / toko_id|string|FK|Ya|—|
|nomor_manusia|string|—|Ya|SJ-TKO1-20261113-0001|
|tanggal_kirim|date|—|Ya|—|
|dari / kepada|string|—|Ya|—|
|kurir / resi|string|—|Opsional|—|
|total_koli|int|—|Ya|—|
|status|string|—|Ya|DIKIRIM/DITERIMA|
|qr_url|string|—|Opsional|—|

**Dokumen_Retur**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|dok_retur_id|string|PK|Ya|—|
|retur_id|string|FK|Ya|—|
|nomor_manusia|string|—|Ya|RTN-DOC-TKO1-20261113-0001|
|tanggal|date|—|Ya|—|
|isi|string|—|Ya|—|
|qr_url|string|—|Opsional|—|

**Retur_Jual**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|retur_id|string|PK|Ya|—|
|transaction_id / detail_id|string|FK|Ya|—|
|tanggal|date|—|Ya|—|
|jenis_retur|enum|—|Ya|TUKAR_SAMA/TUKAR_BEDA/REFUND|
|alasan|string|—|Ya|—|
|foto_url|string|—|Opsional|—|
|nominal_refund|decimal|—|Ya|0 jika TUKAR_SAMA|
|voucher_id|string|FK|Opsional|—|
|status|enum|—|Ya|retur_status|
|approval_id|string|FK|Opsional|—|

**Retur_Beli**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|retur_beli_id|string|PK|Ya|—|
|po_id / supplier_id|string|FK|Ya|—|
|tanggal|date|—|Ya|—|
|alasan|string|—|Ya|—|
|qty|int|—|Ya|—|
|foto_url|string|—|Opsional|—|
|status|enum|—|Ya|retur_beli_status|
|jawaban_supplier|string|—|Opsional|—|
|nominal|decimal|—|Opsional|—|

**Transfer_Stok** + **Transfer_Stok_Detail**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|transfer_id|string|PK|Ya|—|
|toko_asal / toko_tujuan|string|FK|Ya|—|
|tanggal|date|—|Ya|—|
|status|enum|—|Ya|transfer_status|
|alasan|string|—|Ya|—|
|approval_id|string|FK|Opsional|—|
|transfer_detail_id|string|PK|Ya|Detail|
|transfer_id / sku|string|FK|Ya|—|
|qty / qty_diterima|int|—|Ya|—|

**Pembelian_PO** + **Pembelian_PO_Detail** + **Penerimaan_Barang**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|po_id|string|PK|Ya|—|
|supplier_id / gudang_id|string|FK|Ya|—|
|nomor_manusia|string|—|Ya|—|
|tanggal / target_datang|date|—|Ya|—|
|total|decimal|—|Ya|—|
|status|enum|—|Ya|pembelian_po_status|
|approval_id|string|FK|Opsional|—|
|alasan|string|—|Opsional|—|
|po_detail_id|string|PK|Ya|—|
|po_id / sku|string|FK|Ya|—|
|qty / harga_beli / subtotal|int / decimal|—|Ya|—|
|penerimaan_id|string|PK|Ya|—|
|po_id / gudang_id|string|FK|Ya|—|
|tanggal|date|—|Ya|—|
|qty_datang / qty_cacat / qty_bagus|int|—|Ya|—|
|foto_cacat_url|string|—|Opsional|—|
|hutang_id|string|FK|Opsional|—|

**Opname** + **Opname_Detail**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|opname_id|string|PK|Ya|—|
|toko_id / gudang_id|string|FK|Ya|—|
|tanggal|date|—|Ya|—|
|jenis|string|—|Ya|KECIL/GEDE/DADAKAN|
|status|enum|—|Ya|opname_status|
|approval_id|string|FK|Opsional|—|
|opname_detail_id|string|PK|Ya|—|
|opname_id / sku|string|FK|Ya|—|
|stok_sistem / stok_fisik / selisih|int|—|Ya|—|
|alasan|enum|—|Ya|opname_alasan|
|foto_url|string|—|Opsional|—|

**PreOrder_Indent / Bundle_Paket / Bundle_Paket_Detail / Voucher_Kode_Diskon / Komplain**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|preorder_id|string|PK|Ya|—|
|customer_id / sku|string|FK|Ya|—|
|tanggal|date|—|Ya|—|
|dp_amount|decimal|—|Ya|—|
|estimasi_datang|date|—|Opsional|—|
|status|enum|—|Ya|preorder_status|
|wa_notified|bool|—|Ya|—|
|bundle_id|string|PK|Ya|—|
|nama|string|—|Ya|—|
|harga_bundle|decimal|—|Ya|—|
|aktif / mulai / selesai|bool / date|—|Ya|—|
|bundle_detail_id|string|PK|Ya|—|
|bundle_id / sku|string|FK|Ya|—|
|qty|int|—|Ya|—|
|voucher_id|string|PK|Ya|—|
|customer_id|string|FK|Opsional|—|
|kode|string|—|Ya|Unik|
|jenis_voucher|enum|—|Ya|STEMPEL/PROMO/RETUR|
|nominal / persen|decimal|—|Opsional|—|
|min_belanja|decimal|—|Opsional|—|
|mulai / selesai|date|—|Ya|—|
|kuota / terpakai|int|—|Ya|—|
|aktif|bool|—|Ya|—|
|komplain_id|string|PK|Ya|—|
|transaction_id / customer_id|string|FK|Ya|—|
|tanggal / jenis / solusi|date / string|—|Ya|—|
|foto_url|string|—|Opsional|—|
|status|enum|—|Ya|komplain_status|
|approval_id|string|FK|Opsional|—|

### 4.5 Tabel Keuangan & Stok

**Stok_Per_Toko**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|stok_id|string|PK|Ya|—|
|sku / toko_id|string|FK|Ya|—|
|stok_sistem|int|—|Ya|—|
|stok_fisik_terakhir|int|—|Ya|—|
|min_stok|int|—|Ya|—|
|terakhir_opname|date|—|Opsional|—|

**Stok_Movement**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|movement_id|string|PK|Ya|—|
|sku / toko_id|string|FK|Ya|—|
|transaction_id|string|FK|Opsional|—|
|tipe|enum|—|Ya|stok_movement_tipe|
|qty|int|—|Ya|+/-|
|saldo_setelah|int|—|Ya|—|
|referensi_id|string|—|Ya|—|

**Kas_Modal_Awal / Kas_Harian / Kas_Kecil / Kas_Kecil_Detail / Pengeluaran_Operasional**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|modal_id / kas_harian_id / kas_kecil_id / kas_kecil_detail_id / operasional_id|string|PK|Ya|—|
|toko_id / kasir_id / kas_kecil_id|string|FK|Ya|—|
|tanggal|date|—|Ya|—|
|modal_awal / tunai_masuk / pengeluaran / setoran / kas_fisik / selisih / saldo_awal / saldo_akhir|decimal|—|Conditional|Sesuai tabel|
|status|enum|—|Ya|kas_harian_status / kas_kecil_status|
|penjelasan_selisih|string|—|Opsional|—|
|keterangan|string|—|Opsional|—|
|nominal|decimal|—|Ya|Kas Kecil Detail, Operasional|
|foto_bukti_url|string|—|Opsional|Wajib Operasional|
|kategori|string|—|Opsional|Operasional|
|alasan|string|—|Opsional|Operasional|
|approval_id|string|FK|Opsional|—|
|tipe|string|—|Opsional|KECIL/GEDE (Operasional)|

**Piutang_DP / Hutang_Supplier / Utang_Penitip / Komisi_Afiliasi**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|piutang_id / hutang_id / utang_penitip_id / komisi_aff_id|string|PK|Ya|—|
|customer_id / invoice_id / transaction_id / supplier_id / po_id / penitip_id / affiliate_id|string|FK|Ya|Sesuai tabel|
|total / sudah_bayar / sisa|decimal|—|Ya|—|
|jatuh_tempo|date|—|Opsional|—|
|status|enum|—|Ya|payment_status|
|aging_hari|int|—|Ya|—|
|total_kotor / komisi_toko / utang|decimal|—|Ya|Utang_Penitip|
|settlement_id|string|—|Opsional|—|
|nominal|decimal|—|Ya|Komisi_Affiliasi|
|payout_id|string|—|Opsional|—|

**Komisi_SPG_Kasir** — per periode (KEP-16). Tanpa `transaction_id`.

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|insentif_id|string|PK|Ya|—|
|karyawan_id|string|FK|Ya|Kasir|
|spg_id|string|FK|Opsional|—|
|periode|string|—|Ya|YYYY-MM|
|total_pcs|int|—|Ya|—|
|nominal_kasir|decimal|—|Ya|—|
|nominal_spg|decimal|—|Ya|0 jika tidak ada SPG|
|bonus_target|decimal|—|Ya|0 jika tidak capai|
|status|enum|—|Ya|DRAFT/DIBAYAR|

**Insentif_Detail** — audit per transaksi.

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|insentif_detail_id|string|PK|Ya|—|
|insentif_id|string|FK|Ya|—|
|transaction_id|string|FK|Ya|—|
|sku|string|FK|Ya|—|
|pcs|int|—|Ya|—|
|nominal_kasir|decimal|—|Ya|—|
|nominal_spg|decimal|—|Ya|—|

**Jurnal_Otomatis**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|jurnal_id|string|PK|Ya|—|
|transaction_id / referensi_id|string|FK|Opsional|—|
|tanggal|date|—|Ya|—|
|akun_debit / akun_kredit|string|—|Ya|Chart of Accounts|
|nominal|decimal|—|Ya|—|
|keterangan|string|—|Ya|—|
|source_type / source_id|string|—|Ya|—|

**Laporan_Harian (Summary_Harian)** — Home: Pusat.

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|summary_id|string|PK|Ya|—|
|toko_id / tanggal|string / date|FK|Ya|—|
|omzet_barang / omzet_delivery / omzet_packaging / pajak_dipungut|decimal|—|Ya|—|
|jumlah_transaksi / pcs / stok_mati_count|int|—|Ya|—|
|kas_tunai / kas_qris / kas_transfer / kas_selisih / qris_pending|decimal|—|Ya|—|

**Absensi** — Home: Toko.

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|absensi_id|string|PK|Ya|—|
|karyawan_id / toko_id|string|FK|Ya|—|
|tanggal / check_in / check_out|date / datetime|—|Ya|—|
|shift|string|—|Ya|—|
|status|string|—|Ya|ON_TIME/TELAT/TELAT_BERAT/IZIN_SAKIT/IZIN/TIDAK_HADIR|
|lembur_jam|int|—|Ya|—|
|catatan|string|—|Opsional|—|

**Gaji / Slip_Gaji** — Home: Pusat.

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|gaji_id|string|PK|Ya|—|
|karyawan_id|string|FK|Ya|—|
|periode|string|—|Ya|YYYY-MM|
|gaji_pokok / insentif / bonus_target / potongan_telat / potongan_kas / potongan_izin / lembur / total|decimal|—|Ya|—|
|status|enum|—|Ya|gaji_status|
|slip_id|string|PK|Ya|—|
|gaji_id|string|FK|Ya|—|
|file_url|string|—|Ya|PDF slip|

### 4.6 Tabel Sync, Audit & Operasional

**Approval** — conditional approved_by/decided_at (fix G). Tambah `expired_at` (fix G-1).

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|approval_id|string|PK|Ya|—|
|requested_by|string|FK|Ya|—|
|approved_by|string|FK|**Conditional**|Null saat PENDING; wajib saat APPROVED/REJECTED/EXPIRED|
|tipe|enum|—|Ya|approval_type|
|referensi_id|string|—|Ya|—|
|nominal|decimal|—|Ya|—|
|alasan|string|—|Ya|—|
|status|enum|—|Ya|approval_status|
|requested_at|datetime|—|Ya|—|
|decided_at|datetime|—|**Conditional**|Null saat PENDING; wajib saat lainnya|
|expired_at|datetime|—|Ya|`requested_at + 24 jam` (DARURAT) atau `+7 hari`|
|catatan|string|—|Opsional|—|

> EXPIRED effect: approval berubah status saja, objek terkait tidak berubah status. Kasir/Manager request ulang.

**Audit_Log** — append-only.

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|audit_id|string|PK|Ya|—|
|user_id / device_id|string|FK|Ya|—|
|timestamp|datetime|—|Ya|—|
|aksi / modul / referensi_id|string|—|Ya|—|
|before_json / after_json|string|—|Opsional|—|
|ip / keterangan|string|—|Opsional|—|

**Backup_Log**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|backup_id|string|PK|Ya|—|
|timestamp|datetime|—|Ya|—|
|folder|string|—|Ya|—|
|file_count|int|—|Ya|—|
|status|string|—|Ya|SUKSES/GAGAL|
|keterangan|string|—|Opsional|—|

**Log_Sync**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|log_sync_id|string|PK|Ya|—|
|toko_id|string|FK|Ya|—|
|timestamp|datetime|—|Ya|—|
|sync_batch_id|string|—|Ya|—|
|jumlah_baris|int|—|Ya|—|
|status|enum|—|Ya|sync_status|
|alasan|string|—|Opsional|—|
|payload_hash|string|—|Ya|—|

**Log_Sync_Pusat**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|log_sync_pusat_id|string|PK|Ya|—|
|toko_id|string|FK|Ya|—|
|timestamp|datetime|—|Ya|—|
|sync_batch_id|string|—|Ya|—|
|transaction_id_list|string|—|Ya|JSON array|
|payload_hash|string|—|Ya|—|
|received_at|datetime|—|Ya|—|
|status|enum|—|Ya|sync_status|

**Log_Arsip**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|log_arsip_id|string|PK|Ya|—|
|archive_batch_id|string|—|Ya|—|
|file_arsip_id|string|—|Ya|—|
|jumlah_header / jumlah_detail / jumlah_jurnal|int|—|Ya|—|
|total_debit / total_kredit|decimal|—|Ya|Wajib balance|
|checksum|string|—|Ya|—|
|status|enum|—|Ya|arsip_status|
|waktu_pindah|datetime|—|Ya|—|

**AI_Skill**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|skill_id|string|PK|Ya|—|
|nama|string|—|Ya|—|
|instruksi|string|—|Ya|—|
|level|int|—|Ya|1/2/3|
|aktif|bool|—|Ya|—|

**AI_Insight**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|insight_id|string|PK|Ya|—|
|skill_id|string|FK|Ya|—|
|tanggal|date|—|Ya|—|
|toko_id|string|FK|Ya|—|
|hasil|string|—|Ya|—|
|status|string|—|Ya|DRAFT/DIBACA|

**Notifikasi_WA**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|notif_id|string|PK|Ya|—|
|toko_id|string|FK|Ya|—|
|timestamp|datetime|—|Ya|—|
|tipe|enum|—|Ya|notifikasi_wa_tipe|
|penerima|string|—|Ya|—|
|isi|string|—|Ya|—|
|status_kirim|string|—|Ya|TERKIRIM/GAGAL|
|aksi_url|string|—|Opsional|—|

**Idempotency_Log** — retensi 30 hari.

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|idem_id|string|PK|Ya|—|
|request_id|string|—|Ya|—|
|transaction_id|string|—|Opsional|—|
|payload_hash|string|—|Ya|—|
|endpoint|string|—|Ya|—|
|response_json|string|—|Ya|—|
|created_at|datetime|—|Ya|—|
|expires_at|datetime|—|Ya|—|

### 4.7 Relasi Utama

- `Transaksi_Penjualan` 1—N `Transaksi_Detail`, `Pembayaran`, `Jurnal_Otomatis`, `Transaksi_Approval`, `Piutang_DP`, `Retur_Jual`, `Komisi_Afiliasi`, `Insentif_Detail`
    
- `Master_Varian` 1—N `Stok_Per_Toko`, `Master_Harga`
    
- `Pembelian_PO` 1—N `Pembelian_PO_Detail`, `Penerimaan_Barang`, `Hutang_Supplier`
    
- `Transfer_Stok` 1—N `Transfer_Stok_Detail`
    
- `Opname` 1—N `Opname_Detail`
    
- `Approval` 1—1 objek referensi (via `referensi_id`) atau 1—N transaksi (via `Transaksi_Approval`)
    
- `Master_Karyawan` 1—N `Absensi`, `Gaji`, `Komisi_SPG_Kasir`, `Insentif_Detail`
    
- `Master_Toko` 1—N semua transaksi
    

**Aturan:** semua tabel transaksi wajib `status_rangkaian` + 6 sync field header. Tabel master tidak perlu sync field.

---

## BAB 5. STATE MACHINE

### 5.1 Transaksi Penjualan

text

Copy

Download

DRAFT (keranjang)
  → PENDING_PAYMENT
      → PAID (tunai/QRIS/transfer terverifikasi)
      → PARTIAL (DP)
      → VOID (sebelum bayar, tanpa approval)
  → PAID
      → VOID_REQUESTED → APPROVED_VOID / REJECTED_VOID
      → RETUR_REQUESTED → RETUR_SELESAI
      → SELESAI_UTUH (jika tidak ada piutang/retur/koreksi)

**Aturan:**

- VOID setelah bayar wajib `Approval`. < 500rb Manager, ≥ 500rb Owner.
    
- VOID setelah tutup kas: **tidak hapus**, buat `Jurnal_Koreksi` + `Berita Acara`.
    
- `SELESAI_UTUH` hanya jika: PAID + tidak ada retur aktif + tidak ada jurnal koreksi terbuka + tidak ada bukti bayar belum verifikasi + tidak ada piutang/DP/preorder/konsinyasi/transfer/hutang nyangkut.
    

### 5.2 Sync (Final)

text

Copy

Download

PENDING_SYNC
  → SENT (batch dikirim)
      → SYNCED (ACK, hash cocok)
      → FAILED (hash beda / validasi gagal, failed_reason terisi)
      → UNKNOWN (timeout, nunggu konfirmasi)
          → SYNCED (Pusat konfirmasi via transaction_id)
          → FAILED (Pusat bilang belum pernah terima / konflik)
SYNCED
  → ARCHIVED (setelah retensi 7 hari + backup Drive sukses)

**Aturan:**

- **Hanya SYNCED yang bisa ke ARCHIVED.** Tidak ada PENDING_SYNC → ARCHIVED.
    
- Coder larang `if (status == PENDING_SYNC) archive()`. Harus `if (status == SYNCED && umur >= 7 hari && backup_ok) archive()`.
    
- `UNKNOWN` **jangan kirim ulang buta**. Tanya Pusat via `transaction_id`.
    
- `FAILED` hash beda → jangan overwrite, tandai konflik, minta Owner cek.
    
- Batch unit = array `transaction_bundle`. Retur/Approval/Void = bundle sendiri, sync terpisah.
    

### 5.3 Arsip

text

Copy

Download

STARTED → COPIED → VERIFIED → DELETED
              ↓
           FAILED (resume dari status terakhir)

**Aturan:**

- Hanya `SELESAI_UTUH`.
    
- Verifikasi: header + detail + jurnal + debit = kredit + checksum + ID file + waktu pindah.
    
- Gagal di COPIED (belum VERIFIED) → resume dari VERIFIED, jangan copy ulang.
    
- File: `ERP-Arsip-YYYY-MM`. Cek duplikat via `transaction_id` + checksum.
    

### 5.4 Approval

text

Copy

Download

PENDING → APPROVED
       → REJECTED
       → EXPIRED (24 jam DARURAT, 7 hari lainnya)

**Aturan:**

- `approval_type + referensi_id + nominal` tentukan role (BAB 7.4).
    
- Role tidak berhak → tombol tidak tampil, GAS tolak.
    
- EXPIRED → hanya `Approval.status` yang berubah. Objek terkait tidak berubah. Request ulang dengan endpoint yang sama.
    

### 5.5 Pembayaran

text

Copy

Download

UNPAID → PARTIAL → PAID
       → REFUNDED (setelah retur refund)
       → VOID (setelah void transaksi)

**Aturan:**

- Split: `Pembayaran` 1—N. Maks 2 metode. Tidak ada baris metode SPLIT.
    
- QRIS: PAID di ERP, kas cair H+1. `Kas_Harian` catat `qris_pending`.
    
- Transfer > 500rb: `status_verifikasi = BELUM_VERIFIKASI` sampai Owner/Manager verifikasi.
    
- PAID hanya jika total `Pembayaran` = `total` transaksi.
    

### 5.6 Retur (Final)

text

Copy

Download

DIAJUKAN
  → DISETUJUI (auto, TUKAR_SAMA dengan qty & harga sama)  [approved_by = SYSTEM]
  → DISETUJUI (auto, REFUND TUNAI < Rp 200.000 & transaksi asal hari ini & belum tutup kas)  [approved_by = SYSTEM]
  → DISETUJUI (kasir approve, TUKAR_BEDA < Rp 200.000)  [approved_by = kasir_id]
  → DISETUJUI (Manager, TUKAR_BEDA 200–500rb / REFUND lainnya)  [approved_by = manager_id]
  → DISETUJUI (Owner, TUKAR_BEDA >500rb / REFUND >200rb / lintas hari)  [approved_by = owner_id]
  → DITOLAK
  → BARANG_DITERIMA → SELESAI

**Aturan:**

- Auto-approve sistem (`approved_by = 'SYSTEM'`) hanya untuk 2 kasus di atas.
    
- Kasir approve dalam limit (`approved_by = kasir_id`): TUKAR_BEDA < 200rb, transaksi apapun.
    
- CNS: tidak langsung balik stok jual. Nunggu jawaban penitip. 3 hari tidak dijawab = warning Owner.
    
- AFF: komisi batal jika brand setuju retur 7 hari.
    

### 5.7 Transfer

text

Copy

Download

DIMINTA → DISETUJUI → DIKIRIM → DITERIMA
        → DITOLAK
        → DIBATALKAN

**Aturan:**

- DISETUJUI oleh Manager toko asal. Owner jika > 2jt atau lintas class.
    
- DIKIRIM: stok asal dikunci.
    
- DITERIMA: stok asal kurang, stok tujuan tambah, jurnal otomatis.
    
- AFF tidak bisa transfer.
    

### 5.8 Opname

text

Copy

Download

DRAFT → COUNTING → PENDING_APPROVAL → APPROVED → POSTED
                              → REJECTED

**Aturan:**

- Blind count untuk barang rawan. Semi-blind lainnya.
    
- 2 orang wajib. Toko 1 kasir → Owner via video call + foto rak.
    
- Selisih: Manager ≤ 500rb **dan** ≤ 2 pcs. Owner > 500rb **atau** > 2 pcs **atau** barang mahal (> `barang_mahal_threshold`).
    
- Alasan wajib: HILANG/RUSAK/SALAH_INPUT/SALAH_KIRIM/DICURI.
    
- Barang diopname dikunci sampai POSTED.
    
- Tidak ada ubah stok manual tanpa opname.
    

---

## BAB 6. API CONTRACT

### 6.1 Konvensi

- Transport: HTTPS, JSON.
    
- Endpoint: `POST {GAS_URL}/exec` body `{ mode, request_id, device_id, pin_session, payload }`.
    
- Response: `{ ok, request_id, data, error }`.
    
- Semua write wajib `request_id` (UUID v4) + `pin_session` (kecuali `sync` GAS→GAS pakai shared secret).
    
- Semua nominal `decimal(15,2)`.
    

### 6.2 Auth

|Aktor|Metode|Catatan|
|---|---|---|
|Owner|Google OAuth|Session 12 jam|
|Manager/Kasir/Gudang|PIN 6 digit + device|Session 12 jam, auto logout 10 menit idle|
|GAS Toko → GAS Pusat|Shared secret di Script Properties|—|
|Gemini|API key di Script Properties|Hanya baca agregat|

**Aturan:**

- PIN salah 3x: lock 5 menit + WA Owner. 5x: lock 30 menit + reset PIN.
    
- Device pairing: QR 5 menit, Owner approve.
    
- Lepas device: Owner klik, device logout.
    

### 6.3 Error Codes

|Code|Arti|HTTP|
|---|---|---|
|AUTH_001|PIN salah / akun lock|401|
|AUTH_002|Session expired|401|
|AUTH_003|Device tidak paired|403|
|AUTH_004|Role tidak berhak|403|
|VAL_001|Field wajib kosong / format invalid|400|
|VAL_002|Enum tidak valid|400|
|VAL_003|Nominal tidak valid|400|
|STOK_001|Stok tidak cukup|409|
|STOK_002|Barang terkunci opname|409|
|IDEM_001|Duplikat request_id, response lama|200|
|IDEM_002|transaction_id sudah ada, payload_hash beda|409|
|APPROVAL_001|Butuh approval|202|
|APPROVAL_002|Approval tidak valid / ditolak|403|
|SYNC_001|Batch sync timeout|504|
|SYNC_002|payload_hash mismatch|409|
|ARSIP_001|Verifikasi arsip gagal|500|
|CONFIG_001|Setting belum diisi|412|
|INTERNAL_001|Error tak terduga|500|

### 6.4 Endpoint List (17 Mode)

|Mode|Request|Response|Idempotency|
|---|---|---|---|
|jual|`{ transaction_id?, items[], customer_id?, price_type, voucher_kode?, diskon_amount?, diskon_approval_id?, delivery_amount, packaging_amount, pajak_toggle, pajak_rate, price_includes_tax, metode_bayar[], penerima?, catatan? }`|`{ transaction_id, nomor_manusia, subtotal_barang, diskon_amount, diskon_approval_id, subtotal_kena_pajak, pajak_amount, delivery_amount, packaging_amount, total, kembalian, struk_url, sync_status, payment_status }`|request_id + transaction_id + payload_hash|
|transfer|`{ transfer_id?, dari, ke, items[], alasan }`|`{ transfer_id, status, approval_id? }`|request_id|
|opname|`{ opname_id?, toko_id, items[{sku, stok_fisik, alasan, foto_url}] }`|`{ opname_id, selisih_total, status, approval_id? }`|request_id|
|retur_jual|`{ transaction_id, items[], jenis_retur, alasan, foto_url, metode_refund? }`|`{ retur_id, nominal_refund, status, approval_id? }`|request_id|
|retur_beli|`{ po_id, items[], alasan, foto_url }`|`{ retur_beli_id, status, approval_id? }`|request_id|
|bayar|`{ jenis, referensi_id, nominal, bukti_url, catatan? }` (jenis enum bayar_jenis)|`{ bayar_id, status, approval_id? }`|request_id|
|tutup_kas|`{ kas_fisik, penjelasan_selisih? }`|`{ kas_harian_id, selisih, status }`|request_id|
|approve|`{ approval_id, decision, catatan? }`|`{ approval_id, approval_status, objek_status }`|request_id|
|sync|`{ sync_batch_id, source_store_id, bundles[] }` (GAS→GAS)|`{ sync_batch_id, acked[], duplicate[], failed[] }`|transaction_id + payload_hash|
|sync_status|`{ sync_batch_id }`|`{ status, acked[], failed[] }`|—|
|backup|`{}`|`{ backup_id, link }`|request_id|
|arsip|`{ archive_batch_id? }`|`{ archive_batch_id, status }`|request_id|
|**void**|`{ transaction_id, alasan }`|`{ approval_id, approval_status, transaction_status }`|request_id|
|**login**|`{ device_id, pin_hash / gmail_token, role }`|`{ session_token, role, toko_id, user_id, expires_at }`|Rate-limit, bukan write idempotent|
|**pair_device**|`{ device_id, toko_id, qr_token }`|`{ device_id, status }`|request_id|
|**diskon**|`{ transaction_id, diskon_amount, alasan }`|`{ approval_id, approval_status }`|request_id|
|**minta_invoice**|`{ transaction_id, tipe_dokumen }`|`{ invoice_pdf_url, nomor_manusia }`|request_id|

**`bayar.jenis` enum:** `PIUTANG / HUTANG_SUPPLIER / UTANG_PENITIP / KOMISI_AFFILIATE / SETORAN / OPERASIONAL_KECIL / OPERASIONAL_GEDE / KAS_KECIL`.

**`minta_invoice.tipe_dokumen` enum:** `INVOICE / KWITANSI / SURAT_JALAN`.

### 6.5 Idempotency

- Setiap write simpan `request_id` + `transaction_id` + `payload_hash` + `response_json` di `Idempotency_Log`, retensi 30 hari.
    
- `request_id` sama → kembalikan `response_json` lama, `IDEM_001`.
    
- `transaction_id` sama + `payload_hash` beda → `IDEM_002`, jangan overwrite.
    
- Sync: Pusat cek per `transaction_id`. Hash sama = skip + ACK. Hash beda = `FAILED_CONFLICT`.
    

### 6.6 Batch Unit

- Batch unit = array `transaction_bundle`.
    
- 1 `transaction_bundle` = header + details + jurnal + pembayaran (jika ada). **Retur / Approval / Void = bundle terpisah**, tidak dibundel ke transaksi asal.
    
- `sync_batch_id` per group. `batch_size` default 500 di `Master_Config`.
    
- Baca/tulis `getValues()`/`setValues()` sekali per batch.
    

### 6.7 Contoh JSON (Kontrak Wajib)

**6.7.1 `jual` — Request Mode Cepat (diskon dalam limit role)**

json

Copy

Download

{
  "mode": "jual",
  "request_id": "a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab",
  "device_id": "DEV-TKO1-001",
  "pin_session": "sess_abc123",
  "payload": {
    "transaction_id": "TRX-TKO1-20261113-0001",
    "toko_id": "TKO1",
    "kasir_id": "KRY-001",
    "customer_id": null,
    "price_type": "NORMAL",
    "sales_channel": "TOKO",
    "items": [
      { "sku": "OWN-ERG-CLN-JNS-001-BLU-35", "qty": 1, "harga_jual_satuan": 250000 },
      { "sku": "OWN-ERG-TSH-002-WHT-M", "qty": 2, "harga_jual_satuan": 120000 }
    ],
    "voucher_kode": null,
    "diskon_amount": 0,
    "diskon_approval_id": null,
    "delivery_amount": 20000,
    "packaging_amount": 10000,
    "pajak_toggle": true,
    "pajak_rate": 0.11,
    "price_includes_tax": false,
    "metode_bayar": [{ "metode": "TUNAI", "nominal": 573900 }],
    "penerima": null,
    "catatan": null
  }
}

**`jual` — Response Sukses**

json

Copy

Download

{
  "ok": true,
  "request_id": "a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab",
  "data": {
    "transaction_id": "TRX-TKO1-20261113-0001",
    "nomor_manusia": "Toko 1 - 13 Nov 2026 - No. 1",
    "subtotal_barang": 490000,
    "diskon_amount": 0,
    "diskon_approval_id": null,
    "subtotal_kena_pajak": 490000,
    "pajak_amount": 53900,
    "delivery_amount": 20000,
    "packaging_amount": 10000,
    "total": 573900,
    "kembalian": 0,
    "struk_url": "https://drive.google.com/file/d/xxx",
    "sync_status": "PENDING_SYNC",
    "payment_status": "PAID"
  },
  "error": null
}

**`jual` — Request Diskon 15% (butuh approval, sudah punya `diskon_approval_id`)**

json

Copy

Download

{
  "mode": "jual", "request_id": "req-jual-002",
  "device_id": "DEV-TKO1-001", "pin_session": "sess_abc123",
  "payload": {
    "transaction_id": "TRX-TKO1-20261113-0002",
    "toko_id": "TKO1", "kasir_id": "KRY-001",
    "price_type": "NORMAL", "sales_channel": "TOKO",
    "items": [{ "sku": "OWN-ERG-CLN-JNS-001-BLU-35", "qty": 1, "harga_jual_satuan": 500000 }],
    "diskon_amount": 75000,
    "diskon_approval_id": "APR-DISC-001",
    "delivery_amount": 0, "packaging_amount": 0,
    "pajak_toggle": false, "pajak_rate": 0, "price_includes_tax": false,
    "metode_bayar": [{ "metode": "TUNAI", "nominal": 425000 }]
  }
}

**`jual` — Response Diskon (`diskon_approval_id` tidak valid)**

json

Copy

Download

{ "ok": false, "request_id": "req-jual-002", "data": null,
  "error": { "code": "APPROVAL_002", "message": "diskon_approval_id tidak valid atau belum approved untuk transaksi ini." } }

**6.7.2 `jual` — Response Stok Kurang**

json

Copy

Download

{ "ok": false, "request_id": "req-003", "data": null,
  "error": { "code": "STOK_001", "message": "Stok OWN-ERG-CLN-JNS-001-BLU-35 tidak cukup. Sisa 0, diminta 1." } }

**6.7.3 `void` — Response Butuh Approval**

json

Copy

Download

{ "ok": true, "request_id": "req-void-001",
  "data": { "approval_id": "APR-VOID-001", "approval_status": "PENDING", "transaction_status": "PAID" },
  "error": { "code": "APPROVAL_001", "message": "Butuh approval Owner (≥500rb)" } }

**`void` — Response Tanpa Approval (sebelum bayar)**

json

Copy

Download

{ "ok": true, "request_id": "req-void-002",
  "data": { "approval_id": null, "approval_status": null, "transaction_status": "VOID" },
  "error": null }

**6.7.4 `diskon` — Response Butuh Approval**

json

Copy

Download

{ "ok": true, "request_id": "req-disc-001",
  "data": { "approval_id": "APR-DISC-001", "approval_status": "PENDING" },
  "error": { "code": "APPROVAL_001", "message": "Diskon 15% > limit Kasir 5%, butuh Owner." } }

**6.7.5 `login` — Response Sukses**

json

Copy

Download

{ "ok": true, "request_id": "req-login-001",
  "data": { "session_token": "sess_abc123", "role": "KASIR", "toko_id": "TKO1", "user_id": "USR-001", "expires_at": "2026-11-13T22:00:00Z" },
  "error": null }

**`login` — PIN salah 3x**

json

Copy

Download

{ "ok": false, "request_id": "req-login-002", "data": null,
  "error": { "code": "AUTH_001", "message": "PIN salah 3x. Lock 5 menit + WA Owner." } }

**6.7.6 `pair_device` — Response**

json

Copy

Download

{ "ok": true, "request_id": "req-pair-001",
  "data": { "device_id": "DEV-TKO1-002", "status": "SUDAH_PAIRING" }, "error": null }

**6.7.7 `minta_invoice` — Response**

json

Copy

Download

{ "ok": true, "request_id": "req-inv-001",
  "data": { "invoice_pdf_url": "https://drive.google.com/file/d/inv-xxx", "nomor_manusia": "INV-TKO1-20261113-0001" }, "error": null }

> PWA tidak pernah terima NPWP di JSON. Hanya PDF URL.

**6.7.8 `sync` — Request (GAS Toko → GAS Pusat)**

json

Copy

Download

{
  "mode": "sync", "request_id": "req-sync-001",
  "payload": {
    "sync_batch_id": "SYNC-TKO1-20261113-0200-001",
    "source_store_id": "TKO1",
    "bundles": [{
      "transaction_id": "TRX-TKO1-20261113-0001",
      "payload_hash": "a1b2c3...",
      "header": { "tanggal": "2026-11-13", "toko_id": "TKO1", "total": 573900, "payment_status": "PAID", "status_rangkaian": "SELESAI_UTUH" },
      "details": [{ "sku": "OWN-ERG-CLN-JNS-001-BLU-35", "qty": 1, "harga_jual_satuan": 250000 }],
      "pembayaran": [{ "metode": "TUNAI", "nominal": 573900 }],
      "jurnal": [{ "akun_debit": "Kas", "akun_kredit": "Penjualan_OWN", "nominal": 490000 }]
    }]
  }
}

**`sync` — Response**

json

Copy

Download

{ "ok": true, "request_id": "req-sync-001",
  "data": { "sync_batch_id": "SYNC-TKO1-20261113-0200-001", "acked": ["TRX-TKO1-20261113-0001"], "duplicate": [], "failed": [] },
  "error": null }

**`sync` — Response Duplicate**

json

Copy

Download

{ "ok": true, "request_id": "req-sync-001",
  "data": { "sync_batch_id": "SYNC-TKO1-20261113-0200-001", "acked": ["TRX-TKO1-20261113-0001"], "duplicate": ["TRX-TKO1-20261113-0001"], "failed": [] },
  "error": { "code": "IDEM_001", "message": "Duplikat request_id, response dikembalikan." } }

**Endpoint lain** (`transfer`, `opname`, `retur_jual`, `retur_beli`, `bayar`, `tutup_kas`, `approve`, `sync_status`, `backup`, `arsip`) mengikuti pola yang sama: request `{ mode, request_id, device_id, pin_session, payload }`, response `{ ok, request_id, data, error }`.

---

## BAB 7. ROLE & PERMISSION MATRIX

### 7.1 Role Definitions

|Role|Scope|Login|
|---|---|---|
|Owner|Semua toko + Pusat|Gmail|
|Manager|1 toko|PIN + device|
|Kasir|1 toko|PIN + device|
|Gudang|Gudang|PIN + device|
|SPG|Employee type|Tidak login POS|

### 7.2 SPG Resolution

- SPG = `employee_type` di `Master_Karyawan`.
    
- SPG tidak login POS. Split insentif dipilih kasir saat transaksi via `spg_id` di `Transaksi_Detail`.
    
- Split di `Master_Karyawan.split_kasir_pct` / `split_spg_pct`. Default 100/0.
    

### 7.3 Permission Matrix

|Aksi|Owner|Manager|Kasir|Gudang|
|---|---|---|---|---|
|Jual di POS|✅|✅|✅|❌|
|Lihat omzet toko sendiri|✅|✅|❌|❌|
|Lihat omzet semua toko|✅|❌|❌|❌|
|Lihat HPP/profit|✅|⚙ (form, KEP-22)|❌|❌|
|Lihat NPWP|✅|❌|❌|❌|
|Ubah harga/NPWP/pajak/class|✅|❌|❌|❌|
|Ubah setting printer/kurir|✅|❌|❌|❌|
|Void < 500rb|✅|✅|❌|❌|
|Void ≥ 500rb|✅|❌|❌|❌|
|Diskon 0–5%|✅|✅|✅|❌|
|Diskon 5–10%|✅|✅|❌|❌|
|Diskon > 10% / 100%|✅|❌|❌|❌|
|Retur tukar beda < 200rb|✅|✅|✅|❌|
|Retur tukar beda 200–500rb|✅|✅|❌|❌|
|Retur tukar beda > 500rb|✅|❌|❌|❌|
|Refund tunai < 200rb hari sama|✅|✅|✅|❌|
|Refund lainnya|✅|❌|❌|❌|
|Opname selisih ≤ 500rb & ≤ 2 pcs|✅|✅|❌|✅|
|Opname selisih > 500rb / > 2 pcs / barang mahal|✅|❌|❌|❌|
|Transfer approve ≤ 2jt|✅|✅|❌|❌|
|Transfer > 2jt / lintas class|✅|❌|❌|❌|
|PO < 2jt|✅|❌|❌|✅|
|PO ≥ 2jt|✅|❌|❌|❌|
|Kas Kecil 0–50rb|✅|✅|✅|✅|
|Operasional Kecil 50–200rb|✅|✅|✅|✅|
|Operasional Gede > 200rb|✅|❌|❌|❌|
|Input izin kasir|✅|✅ (toko sendiri)|❌|❌|
|Minta lembur|✅|❌|❌|❌|
|Check-in/out|✅|✅|✅|✅|
|Lihat insentif sendiri|✅|✅|✅|✅|
|Lihat insentif orang lain|✅|❌|❌|❌|
|Approve darurat 500rb/hari 1x|✅|❌|❌|❌|
|Backup/restore|✅|❌|❌|❌|
|Audit Log|✅|❌|❌|❌|
|AI Gemini|✅|❌|❌|❌|
|Import CSV/XLS|✅|✅|❌|❌|

⚙ = tergantung `Setting_Bisnis.manager_boleh_lihat_hpp` / `manager_boleh_lihat_laba`.

### 7.4 Approval Limit Final

|Tipe|Kasir|Manager|Owner|
|---|---|---|---|
|Void setelah bayar|❌|< 500rb|≥ 500rb|
|Diskon manual|0–5%|5–10%|0–100% + alasan jika 100%|
|Retur TUKAR_BEDA|< 200rb|200–500rb|> 500rb|
|Retur REFUND|tunai < 200rb hari sama|❌|sisanya|
|Retur TUKAR_SAMA|auto (sistem)|—|—|
|Opname selisih|lapor|≤ 500rb & ≤ 2 pcs|> 500rb / > 2 pcs / barang mahal|
|PO supplier|❌|❌|≥ 2jt (Gudang < 2jt)|
|Transfer|minta|≤ 2jt|> 2jt / lintas class|
|Operasional|0–200rb|0–200rb|> 200rb|
|Darurat|minta|❌|approve 24 jam|

---

## BAB 8. ATURAN FINANSIAL FINAL

### 8.1 Urutan Kalkulasi

text

Copy

Download

1. subtotal_barang      = Σ(qty × harga_jual_satuan)
2. diskon_amount        = voucher + diskon_manual
3. subtotal_kena_pajak  = subtotal_barang - diskon_amount
4. pajak_amount         = pajak_rate × subtotal_kena_pajak   (jika toggle ON)
5. delivery_amount      = input kasir (default 0)
6. packaging_amount     = input kasir (default 0)
7. total                = subtotal_kena_pajak + pajak_amount + delivery_amount + packaging_amount
8. pembulatan           = rupiah terdekat

Jika `price_includes_tax = true`:

text

Copy

Download

subtotal_kotor      = Σ(harga_jual × qty)
dpp                 = subtotal_kotor / (1 + rate)
pajak_amount        = subtotal_kotor - dpp
subtotal_kena_pajak = dpp

**Aturan:**

- Pajak tidak dikenakan delivery/packaging kecuali `delivery_kena_pajak`/`packaging_kena_pajak` = true.
    
- Diskon hanya mengurangi subtotal barang, tidak delivery/packaging.
    
- Pajak dihitung setelah diskon.
    

### 8.2 Komisi CNS & AFF

- **CNS:** `komisi_toko = komisi_persen × (harga_jual - diskon_proporsional)`. `utang_penitip = harga_jual_bersih - komisi_toko`. Tidak ada HPP.
    
- **AFF:** `komisi_affiliate = komisi_persen × harga_jual_bersih`. Tidak ada stok, tidak ada HPP.
    
- **OWN:** `hpp = harga_beli`. `profit = harga_jual_bersih - hpp`.
    

### 8.3 Jurnal Mapping

|Kejadian|Debit|Kredit|
|---|---|---|
|Jual OWN tunai|Kas|Penjualan_OWN|
|Jual OWN tunai|HPP|Persediaan|
|Jual CNS|Kas|Utang_Penitip (net) + Pendapatan_Komisi_CNS|
|Jual AFF|Kas/Piutang|Pendapatan_Komisi_AFF|
|Pajak 1 ON|Kas/Piutang|Utang_PPN|
|Delivery|Kas/Piutang|Pendapatan_Delivery|
|Packaging|Kas/Piutang|Pendapatan_Packaging|
|Diskon|Diskon_Penjualan|Kas/Piutang (contra)|
|Retur refund|Penjualan (contra) + Utang_PPN (contra)|Kas|
|Void setelah tutup kas|Jurnal_Koreksi|—|
|Bayar penitip|Utang_Penitip|Kas|
|Bayar supplier|Hutang_Supplier|Kas|
|Opname kurang|Selisih_Opname|Persediaan|
|Opname lebih|Persediaan|Selisih_Opname|
|Kas kecil|Beban_Kas_Kecil|Kas_Kecil|
|Operasional|Beban_Operasional|Kas|

**Aturan:** Jurnal tidak bisa dihapus, hanya dilawan jurnal koreksi. `Audit_Log` mencatat siapa, kapan, kenapa.

### 8.4 Pajak 1 vs Pajak 2

|Aspek|Pajak 1|Pajak 2|
|---|---|---|
|Dasar|Subtotal setelah diskon|Omzet kumulatif form|
|Tarif default|11%|0,5%|
|Di struk|Ya, jika toggle ON|Tidak|
|Dipungut dari customer|Ya|Tidak|
|Dibayar ke|Negara (PPN)|DJP (PPh Final)|
|Di jurnal|Utang_PPN|Beban_PPh_Final|
|Toggle|Per class, per transaksi|Form Owner|
|Batas bebas|—|Rp 500.000.000 (default)|

### 8.5 Contoh Perhitungan

**Kasus 1 — OWN Class A pajak ON + delivery + packaging:**

text

Copy

Download

Subtotal 250.000, diskon 0, pajak 11% = 27.500, delivery 20.000, packaging 10.000
Total = 307.500

**Kasus 2 — CNS komisi 20%, pajak OFF:**

text

Copy

Download

Harga jual 150.000, komisi toko 30.000, utang penitip 120.000, pajak 0
Total customer bayar = 150.000

**Kasus 3 — Retur refund OWN pajak ON:**

text

Copy

Download

Barang 150.000, pajak proporsional 16.500, refund = 166.500
Delivery/packaging tidak kembali (kecuali salah toko)

---

## BAB 9. ATURAN BISNIS BERNOMOR (BR)

|ID|Aturan|
|---|---|
|BR-ROLE-001|Role: OWNER, MANAGER, KASIR, GUDANG. SPG = employee_type.|
|BR-ROLE-002|Admin = Manager. Admin Gudang = Gudang.|
|BR-VOID-001|Void setelah bayar < 500rb Manager, ≥ 500rb Owner.|
|BR-VOID-002|Void setelah tutup kas: jurnal koreksi + berita acara.|
|BR-DISC-001|Kasir 0–5%, Manager 5–10%, Owner 0–100% + alasan jika 100%. Diskon > limit role butuh `diskon_approval_id` di payload `jual`.|
|BR-RETUR-001|TUKAR_BEDA: < 200rb Kasir, 200–500rb Manager, > 500rb Owner.|
|BR-RETUR-002|REFUND tunai < 200rb hari sama Kasir; selain itu Owner.|
|BR-RETUR-003|TUKAR_SAMA dan REFUND tunai <200rb hari sama = auto-approve sistem (`approved_by = SYSTEM`).|
|BR-RETUR-004|CNS tidak langsung balik stok jual. Nunggu jawaban penitip.|
|BR-INSENTIF-001|Per pcs Rp 1.000 + Bonus Target. Split kasir/SPG sesuai form. Per periode.|
|BR-INSENTIF-002|Insentif cair jika transaksi PAID. Retur potong pcs.|
|BR-LOYALTY-001|Stempel 5x = voucher Rp 20.000, expired 30 hari. Bukan poin.|
|BR-KASKECIL-001|0–50rb Kas Kecil; 50.001–200rb Operasional Kecil; >200rb Operasional Gede + approve Owner.|
|BR-PAJAK-001|Pajak 1 (PPN/PBJT) di struk, toggle per class. Pajak 2 (PPh Final 0,5%) dari omzet.|
|BR-PAJAK-002|Pajak dihitung dari subtotal setelah diskon; delivery/packaging tidak kena pajak default.|
|BR-COD-001|Supplier = Bayar Langsung/Tempo. Customer = COD Customer.|
|BR-PO-001|Gudang buat + approve < 2jt. Owner ≥ 2jt.|
|BR-OPNAME-001|Manager ≤ 500rb **dan** ≤ 2 pcs. Owner > 500rb **atau** > 2 pcs **atau** barang mahal.|
|BR-TRANSFER-001|Manager toko asal approve ≤ 2jt. Owner > 2jt / lintas class.|
|BR-DARURAT-001|Maks 500rb/hari 1x, note wajib, approve 24 jam.|
|BR-SYNC-001|Idempotency via transaction_id + payload_hash.|
|BR-SYNC-002|Retensi lokal 7 hari + backup sebelum hapus.|
|BR-SYNC-003|Hanya SYNCED → ARCHIVED.|
|BR-SYNC-004|UNKNOWN jangan kirim ulang buta. Tanya Pusat via transaction_id.|
|BR-ARSIP-001|Arsip hanya `SELESAI_UTUH`.|
|BR-ARSIP-002|Verifikasi header + detail + jurnal + debit=kredit + checksum.|
|BR-GEMINI-001|Allowlist 4 fungsi. API key di Script Properties.|
|BR-EINVOICE-001|Form + export dibangun, toggle OFF sampai PKP.|
|BR-ABSEN-001|Check-in hanya dari device toko. Lembur hanya jika Owner minta.|
|BR-SPG-001|SPG bukan role login. Split insentif via `spg_id` transaksi.|
|BR-PRINTER-001|Jenis printer per toko. Logic ikut form.|
|BR-KURIR-001|Ongkir + fee COD ikut form Master_Kurir.|
|BR-CUSTOMER-001|Tier: BARU/LANGGANAN/SULTAN. Naik otomatis.|
|BR-KOMPLAIN-001|Jenis + solusi ikut form. Solusi di luar form butuh Owner.|
|BR-HARGA-001|Prioritas: (toko,class) > (toko,ALL) > (ALL,class) > (ALL,ALL).|
|BR-HARGA-002|`Master_Harga.toko_id` dan `class_id` NOT NULL, isi `"ALL"` untuk global.|
|BR-NPWP-001|NPWP plain di Sheets, AES-256 di backup. Tidak ke PWA JSON. PDF URL saja.|
|BR-APPROVAL-001|EXPIRED hanya ubah status Approval. Objek tetap. Request ulang.|
|BR-VOID-003|Void tanpa approval tidak punya ID khusus. Jejak di Audit_Log + Approval.|
|BR-INVOICE-001|NPWP di Invoice/Kwitansi = snapshot, bukan FK.|
|BR-PEMBAYARAN-001|`transaction_id` dan `referensi_id` tidak boleh dua-duanya null.|

---

## BAB 10. TEST CASE WAJIB (TC-001 s/d TC-042)

Semua test case wajib lulus minimal 80% di Fase 1.

|ID|Skenario|Ekspektasi|
|---|---|---|
|TC-001|Jual OWN tunai, pajak OFF, tanpa delivery|Total = subtotal. Stok turun. Jurnal: Kas/Penjualan_OWN + HPP/Persediaan.|
|TC-002|Jual OWN, pajak ON 11%, delivery 20rb, packaging 10rb|Total = subtotal + 11% + 30rb. Jurnal 3 kredit terpisah.|
|TC-003|Split payment tunai 100rb + QRIS 150rb, total 250rb|2 baris Pembayaran. `is_split = true`. Status PAID. QRIS `pending_cair`.|
|TC-004|Retur TUKAR_BEDA selisih 150rb|Kasir approve (`approved_by = kasir_id`). Stok lama balik, stok baru kurang.|
|TC-005|Retur TUKAR_BEDA selisih 300rb|Manager approve.|
|TC-006|Retur REFUND tunai 250rb|Butuh Owner approve.|
|TC-007|Retur CNS, penitip belum jawab|Status DIAJUKAN, stok CNS tidak balik jual. Warning 3 hari.|
|TC-008|Void setelah bayar 300rb|Manager approve. Stok balik, duit balik, struk VOID.|
|TC-009|Void setelah tutup kas|Tidak hapus. Jurnal koreksi + berita acara. Audit Log.|
|TC-010|2 kasir offline jual stok terakhir 1 pcs|Yang submit pertama menang. Kedua `STOK_001`.|
|TC-011|Sync timeout|Status UNKNOWN. Retry tanya Pusat via transaction_id. Tidak double. Tidak ARCHIVED.|
|TC-012|Duplicate ACK, payload_hash sama|Pusat skip + ACK. Tidak bikin baru.|
|TC-013|Arsip gagal di COPIED|Resume dari VERIFIED. Tidak copy ulang.|
|TC-014|Opname selisih 350rb, 1 pcs|Manager approve (≤ 500rb & ≤ 2 pcs).|
|TC-015|Opname selisih 200rb, 3 pcs|Owner approve (> 2 pcs).|
|TC-016|Transfer 5jt|Owner approve.|
|TC-017|PO 1,5jt vs 3jt|1,5jt Gudang; 3jt Owner.|
|TC-018|Kas kecil 40rb vs operasional 100rb|40rb Kas Kecil; 100rb Operasional Kecil.|
|TC-019|Insentif split 70/30|Kasir 7rb, SPG 3rb. Tercatat di `Komisi_SPG_Kasir` + `Insentif_Detail`.|
|TC-020|PPh Final kumulatif|(Omzet kumulatif - batas bebas) × tarif. PPh 22 marketplace dikreditkan.|
|TC-021|e-Faktur OFF vs ON|OFF: kolom hidden. ON: draft + export CSV/XML.|
|TC-022|Orkestrasi: 1 toko gagal sync|Toko itu stop, lainnya lanjut. Log FAILED. Retry 30 menit.|
|TC-023|Arsip: debit ≠ kredit|`ARSIP_001`. Stop. Jangan hapus Pusat.|
|TC-024|PIN salah 3x|Lock 5 menit + WA Owner. `failed_count = 3`, `locked_until` terisi.|
|TC-025|Device hilang, Owner lepas|Device logout, tidak bisa dipakai tanpa pairing.|
|TC-026|Jual AFF|Stok tidak berubah. Komisi affiliate tercatat. Tidak bisa opname/transfer.|
|TC-027|Jual CNS + retur + ganti baru|Stok CNS balik, utang penitip disesuaikan.|
|TC-028|Pajak `price_includes_tax = true`|DPP = total / 1.11. Pajak = total - DPP.|
|TC-029|Voucher stempel vs promo vs retur|`jenis_voucher` membedakan. Expired ikut jenis.|
|TC-030|Import CSV 500 baris, 5 error|495 masuk, 5 di-skip. Laporan + file error.|
|TC-031|Mode Cepat 1 input gabungan delivery|Submit 2 field, `packaging_amount = 0` + warning. Jurnal Delivery = 20rb, Packaging = 0.|
|TC-032|Jenis campur di 1 Style|Style punya Varian OWN + CNS. Stok dipisah per jenis, jurnal dipisah.|
|TC-033|Manager lihat HPP|Default tidak. Owner set `manager_boleh_lihat_hpp=true`, Manager lihat HPP toko dia saja.|
|TC-034|Absensi Home Toko|Kasir check-in di Toko, Absensi tulis di Toko, sync ke Pusat, Gaji hitung di Pusat.|
|TC-035|Login PIN salah 3x berturut|`AUTH_001`, `failed_count = 3`, `locked_until` +5 menit, WA Owner.|
|TC-036|Void ≥500rb tanpa approval|Response `approval_id` + `approval_status = PENDING` + `transaction_status = PAID` + `APPROVAL_001`. Transaksi tetap PAID.|
|TC-037|Approve void ≥500rb|`approve` → APPROVED. Transaksi `payment_status = VOID`. Stok balik. Jurnal koreksi. Audit Log.|
|TC-038|Diskon 15% via `diskon` lalu `jual` dengan `diskon_approval_id`|`diskon` balas approval_id + PENDING. Setelah approve, `jual` dengan `diskon_approval_id` match sukses. Transaksi_Approval 1 baris DISKON.|
|TC-039|1 transaksi: diskon 15% + void besok|Transaksi_Approval 2 baris (DISKON + VOID). Transaksi_Penjualan tidak punya approval_id.|
|TC-040|Pair device baru via QR|`pair_device` → `SUDAH_PAIRING`, `paired_at` terisi. Audit Log. Device bisa login PIN.|
|TC-041|Insentif_Detail SPG beda dalam 1 periode|Komisi_SPG_Kasir 2 baris (2 SPG berbeda), Insentif_Detail 8 baris total.|
|TC-042|Prioritas harga + promo expired|4 baris harga, promo expired → fallback NORMAL + warning `PROMO_EXPIRED`. Prioritas (toko,class) menang.|

---

## LAMPIRAN A. CHANGELOG HISTORIS

**Status:** historis, bukan normatif. Yang berlaku v40.

|Versi|Ringkasan|
|---|---|
|v25|Rebuild BAB 16–23|
|v26|Import + foto|
|v27|Pembayaran, omnichannel, gaji, backup, dashboard gudang, WA, migrasi|
|v28|Supplier, konsinyasi, affiliate, void/diskon, kas kecil|
|v29|Absen, dashboard kasir insentif|
|v30|Pajak laporan, kurir COD|
|v31|Printer/scanner, customer tier, manager, hapus rak/bin|
|v32|Audit forensik 6 tabrakan|
|v33|Audit lapis 2, final freeze|
|v34|e-Faktur form + export|
|v35|Bersihin 5 kalimat lama|
|v36|Arsitektur GAS final|
|v37|Revisi audit BAB 51–55|
|v38|Patch forensic v37|
|v39|Format & konsistensi, canonical dictionary|
|v39.1|26 patch coding-ready|
|v39.2|7 patch + 7 test case|
|**v40**|**Consolidated Full Blueprint — 1 dokumen, 0 override**|

**BAB lama → v40:**

|BAB lama|Isi|v40|
|---|---|---|
|0–1|Prinsip, bisnis|BAB 0, BAB 1|
|2|Arsitektur|BAB 3|
|3|Kode, SKU|BAB 4.3|
|4|9 modul|BAB 9 (BR) + BAB 5 (state)|
|5|Delivery, packaging, pajak|BAB 8|
|6|Harga|BAB 4.3, BR-HARGA|
|7|Stok mati|BR, BAB 5|
|8|Laporan WA|BAB 3.3, BR|
|9|Katalog QR|BAB 3|
|10|Member WA|BAB 4.3, BR-CUSTOMER|
|11|Struk, label|BAB 8, BR|
|12|Dokumen|BAB 4.4|
|13|Workflow|BAB 5|
|14|SOP|BAB 7, BAB 9|
|15|Roadmap|Lampiran B|
|16|NPWP, pajak|BAB 8, BR-PAJAK, BR-NPWP|
|17|Operasional, DP, aging|BAB 4.5, BR|
|18|Komisi, voucher|BAB 4.4, BR-INSENTIF|
|19|Login, akses|BAB 6.2, BAB 7|
|20|Setting|BAB 4.3|
|21|Dashboard, Gemini|BAB 3.4|
|22|Navigasi|BAB 7|
|23|Retur, opname|BAB 5.6, 5.8|
|24|Skema, API|BAB 4, BAB 6, BR-LOYALTY|
|25|Simulasi|BAB 10|
|26|Import|BR, BAB 10|
|27|Foto|BAB 4.3|
|28|Pembayaran|BAB 5.5, BAB 6|
|29|Omnichannel|BAB 4.4, BR|
|30|Gaji, insentif|BAB 4.5, BR-INSENTIF|
|31|Backup|BAB 3.3, BAB 5|
|32|Dashboard gudang|BAB 7|
|33|Notifikasi WA|BAB 3.3, BR|
|34|Migrasi|Lampiran B|
|35|Supplier, PO|BAB 5.7, BR-PO|
|36|Konsinyasi|BAB 5.6, BR-RETUR-004|
|37|Affiliate|BAB 4.4, BR|
|38|Void, diskon|BAB 5.1, BR-VOID, BR-DISC|
|39|Kas kecil|BAB 4.5, BR-KASKECIL|
|40|Absen|BAB 4.5, BR-ABSEN|
|41|Dashboard kasir|BAB 7|
|42|Pajak laporan|BAB 8.4|
|43|Kurir COD|BAB 4.3, BR-KURIR, BR-COD|
|44|Printer, scanner|BAB 4.3, BR-PRINTER|
|45|Customer tier|BR-CUSTOMER, BR-LOYALTY|
|46|Manager|BAB 7|
|47–50|Audit v32–v35|BAB 2 (KEP), BAB 9 (BR)|
|51–55|Arsitektur GAS, sync, arsip, Gemini, ZimaOS|BAB 3, BAB 5, BAB 6|
|56|Penutup|—|

---

## LAMPIRAN B. CHECKLIST CODING & GO-LIVE

### B.1 Sebelum Coding

- □ 
    
    Semua tabel di BAB 4 punya skema final (PK, FK, kolom, enum).
    
- □ 
    
    `Master_Config` terisi: `batch_size`, `retensi_backup_hari`, `retensi_lokal_hari`, `folder_backup`, `folder_arsip`, `folder_gemini`, `barang_mahal_threshold`.
    
- □ 
    
    Data Ownership Matrix disepakati.
    
- □ 
    
    State machine sync/arsip/approval/retur/pembayaran disepakati.
    
- □ 
    
    API contract 17 endpoint + error code disepakati.
    
- □ 
    
    Role & permission matrix disepakati.
    
- □ 
    
    Urutan finansial + jurnal mapping disepakati.
    
- □ 
    
    Test case TC-001..042 disepakati.
    

### B.2 Fase Coding

|Fase|Isi|
|---|---|
|1|Inti toko: master, kasir, stok, transfer, opname, struk, label, sync + arsip infrastruktur|
|2|Uang & penitip: kas, jurnal, portal penitip|
|3|Harga & stok pintar|
|4|Customer & online|
|5|Laporan pro + neraca|
|6|DP, operasional, keamanan|
|7|Komisi, voucher, bundle, preorder|
|8|Login, akses, navigasi|
|9|Setting & performa HP|
|10|Dashboard owner + Gemini (2 skill dulu)|
|11|Navigasi detail 5 tab|
|12|Retur + opname|
|13–23|Modul lanjutan|

**Infrastruktur sync + arsip + orkestrasi jalan bareng Fase 1**, bukan fase tersendiri. Fase 1 wajib pakai 6 spreadsheet + GAS per unit + sync.

### B.3 Checklist Go-Live

- □ 
    
    Master barang di-import, tidak ada SKU dobel.
    
- □ 
    
    Stok awal di-opname, sistem = fisik.
    
- □ 
    
    Harga dicek, tidak ada 0.
    
- □ 
    
    Kasir latihan 10 transaksi, tidak bingung.
    
- □ 
    
    Printer dicoba, struk keluar, barcode scan.
    
- □ 
    
    Backup dicoba, restore dicoba.
    
- □ 
    
    Sync dicoba, ACK diterima, retensi jalan.
    
- □ 
    
    Arsip dicoba, verifikasi debit/kredit balance.
    
- □ 
    
    Test case TC-001..042 lulus minimal 80%.
    

---

**Catatan penutup:** v40 ini adalah **satu dokumen normatif final**. Tidak ada patch terpisah. Tidak ada "lihat v39.1". Semua yang coder butuh ada di sini. Kalau ada klarifikasi baru, masuk **v40.1** sebagai patch kecil (bukan rebuild). Prinsip tetap: Owner siapkan tools + form, logic ngikutin isi form, ERP hitung, PWA simpel, backend lengkap.

**Freeze: v40 siap coding.**