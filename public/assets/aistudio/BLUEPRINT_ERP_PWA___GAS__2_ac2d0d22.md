# BLUEPRINT ERP PWA + GAS — TOKO BAJU UMKM

**Status:** NORMATIF / FROZEN — CODING-READY  
**Versi:** v40.1 (Patch atas v40 Consolidated Full Blueprint)  
**Tanggal:** 12 Nov 2026  
**Ruang lingkup:** Blueprint, belum coding/build  
**Yang berlaku:** v40 + v40.1 ini. Kalau ada yang beda antara v40 dan v40.1, **v40.1 menang**. Jangan baca v40 saja tanpa v40.1. v40.1 ini kecil, sengaja dibuat sebagai patch agar tidak rebuild lagi.

**Cara pakai:** Coder baca v40 BAB 0–10, lalu baca v40.1 ini dari atas ke bawah. Semua tabel / state / endpoint / aturan di v40.1 ini adalah versi final yang harus dibangun. Yang tidak disebut di v40.1, tetap pakai v40.

**Ringkasan patch:** 6 ngeblok (A–F) + 9 medium (G–O) + 5 minor (P–T) = 20 fix. Semua sudah dibenerin di bawah, bukan cuma dicatat.

---

## 0. DAFTAR FIX v40.1

|ID|Judul|Jenis|Status|
|---|---|---|---|
|A|9 tabel gabungan di BAB 4 — pecah jadi full columns|NGEBLOK|✅ FIXED|
|B|AFF dobel arti + Utang AFF hilang + Jurnal AFF salah|NGEBLOK|✅ FIXED|
|C|Dokumen_Invoice ga punya transaction_id / detail|NGEBLOK|✅ FIXED|
|D|SKU regex vs contoh SKU ga match + FK ALL gagal|NGEBLOK|✅ FIXED|
|E|State machine Transaksi campur 3 field, ga ada kolom transaction_status|NGEBLOK|✅ FIXED|
|F|API cuma write, ga ada read / import / restore + warning|NGEBLOK|✅ FIXED|
|G|Split 1.0 vs 100/0 ambigu|Medium|✅ FIXED — pakai 0–1|
|H|transaction_id siapa yang generate? GAS vs PWA|Medium|✅ FIXED — PWA generate ID, GAS generate nomor urut|
|I|approved_by = SYSTEM bukan FK|Medium|✅ FIXED — string literal|
|J|Setting_Bisnis + Kurir vague: npwp_mode, form_omzet, ongkir_json|Medium|✅ FIXED — enum + skema JSON|
|K|Stempel + Tier naik otomatis ga ada tempat nyimpen|Medium|✅ FIXED — stempel_count + threshold di Config|
|L|Gaji potongan ga ada formula|Medium|✅ FIXED — threshold + rate di Config|
|M|Master_Toko GDG class_id wajib, padahal gudang ga punya class|Medium|✅ FIXED — Opsional, null untuk GDG|
|N|tipe_dokumen ga ada QUOTATION / RETUR|Medium|✅ FIXED — tambah 2|
|O|Audit wajib tapi ga ditampilin di tabel|Medium|✅ FIXED — +4 audit di semua tabel, ga diulang|
|P|Referensi v39.2 yang ga ada|Minor|✅ FIXED — hapus semua referensi v39.x|
|Q|Gudang operasional beda Matrix vs 7.4|Minor|✅ FIXED — samain|
|R|Warning ga ada field di response|Minor|✅ FIXED — tambah data.warning|
|S|Foto single, padahal produk bisa multi-foto|Minor|✅ FIXED — tambah Foto_Barang|
|T|PreOrder ga link ke Transaksi|Minor|✅ FIXED — tambah preorder_id / transaction_id|

---

## 1. FIX NGEBLOK (A–F)

### A. Pecah 9 Tabel Gabungan di BAB 4 (BAB 4 v40 KLAIM FULL COLUMNS, TAPI MASIH GABUNGAN)

**Masalah v40:** v40 bilang "Full Columns", tapi 9 grup tabel masih digabung jadi 1 baris. Coder ga bisa bikin 5 tabel dari 1 baris gabungan. Ini persis masalah N/O/P/Q di v39.1 yang udah dipecah, tapi v40 ngulang lagi buat tabel-tabel ini.

**v40.1 — Pecah semua. Ini final. Yang digabung di v40, abaikan, pakai yang di bawah.**

#### A1. Master_Merek / Merchant / Kategori / Warna / Ukuran — Pecah 5 Tabel

**Master_Merek:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|merek_id|string|PK|Ya|—|
|kode_3|string|—|Ya|Unik. ERG.|
|nama|string|—|Ya|Erigo.|
|aktif|bool|—|Ya|—|

**Master_Merchant_Afiliasi (merchant untuk produk AFF, bukan promoter):**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|merchant_id|string|PK|Ya|—|
|kode_3|string|—|Ya|Unik. MRC.|
|nama|string|—|Ya|—|
|wa|string|—|Ya|—|
|rekening|string|—|Opsional|—|
|komisi_persen|decimal|—|Ya|Komisi toko dari merchant. Contoh 0.20 = 20%. Lihat B.|
|tempo_bayar_hari|int|—|Ya|Default 7. Berapa hari toko bayar merchant setelah jual.|
|aktif|bool|—|Ya|—|

**Master_Kategori:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|kategori_id|string|PK|Ya|—|
|kode_3|string|—|Ya|Unik. CLN.|
|nama|string|—|Ya|Celana.|
|aktif|bool|—|Ya|—|

**Master_Warna:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|warna_id|string|PK|Ya|—|
|kode_3|string|—|Ya|Unik. BLU.|
|nama|string|—|Ya|Biru.|
|aktif|bool|—|Ya|—|

**Master_Ukuran:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|ukuran_id|string|PK|Ya|—|
|kode_3|string|—|Ya|Unik.|
|nama|string|—|Ya|35 / M / XL.|
|tipe_ukuran|string|—|Ya|ANGKA / HURUF.|
|aktif|bool|—|Ya|—|

Semua +4 audit (lihat O).

#### A2. Master_NPWP — Pecah 2 Tabel

**Master_NPWP_Pemilik:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|npwp_id|string|PK|Ya|—|
|nama_wp|string|—|Ya|—|
|jenis_npwp|string|—|Ya|OrangPribadi / Badan / Cabang.|
|nomor_npwp|string|—|Ya|Plain di Sheets, AES-256 di backup.|
|alamat|string|—|Ya|—|
|no_pkp|string|—|Opsional|—|

**Master_NPWP_Toko:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|npwp_toko_id|string|PK|Ya|—|
|toko_id|string|FK → Master_Toko|Ya|Wajib. Kalau NPWP_Toko tanpa toko_id, ga ada artinya.|
|nama_wp|string|—|Ya|—|
|jenis_npwp|string|—|Ya|—|
|nomor_npwp|string|—|Ya|Plain di Sheets, AES-256 di backup.|
|alamat|string|—|Ya|—|
|no_pkp|string|—|Opsional|—|

Di v40, `toko_id` di tabel gabungan ditulis Opsional. Itu salah untuk NPWP_Toko. Di v40.1, `toko_id` di Master_NPWP_Toko wajib Ya. Master_NPWP_Pemilik tidak punya `toko_id` sama sekali.

#### A3. Transfer — Pecah 2 Tabel

**Transfer_Stok:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|transfer_id|string|PK|Ya|—|
|toko_asal|string|FK|Ya|—|
|toko_tujuan|string|FK|Ya|—|
|tanggal|date|—|Ya|—|
|status|enum|—|Ya|transfer_status.|
|alasan|string|—|Ya|—|
|approval_id|string|FK|Opsional|Null saat DIMINTA.|

**Transfer_Stok_Detail:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|transfer_detail_id|string|PK|Ya|—|
|transfer_id|string|FK|Ya|—|
|sku|string|FK|Ya|—|
|qty|int|—|Ya|Diminta.|
|qty_diterima|int|—|Ya|Default 0. Diisi saat DITERIMA.|

#### A4. Pembelian_PO — Pecah 3 Tabel

**Pembelian_PO:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|po_id|string|PK|Ya|—|
|supplier_id|string|FK|Ya|—|
|gudang_id|string|FK|Ya|GDG.|
|nomor_manusia|string|—|Ya|PO-GDG-20261113-0001.|
|tanggal|date|—|Ya|—|
|target_datang|date|—|Ya|—|
|total|decimal|—|Ya|—|
|status|enum|—|Ya|pembelian_po_status.|
|approval_id|string|FK|Opsional|—|
|alasan|string|—|Opsional|—|

**Pembelian_PO_Detail:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|po_detail_id|string|PK|Ya|—|
|po_id|string|FK|Ya|—|
|sku|string|FK|Ya|—|
|qty|int|—|Ya|—|
|harga_beli|decimal|—|Ya|—|
|subtotal|decimal|—|Ya|qty * harga_beli.|

**Penerimaan_Barang:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|penerimaan_id|string|PK|Ya|—|
|po_id|string|FK|Ya|—|
|gudang_id|string|FK|Ya|—|
|tanggal|date|—|Ya|—|
|qty_datang|int|—|Ya|—|
|qty_cacat|int|—|Ya|Default 0.|
|qty_bagus|int|—|Ya|qty_datang - qty_cacat.|
|foto_cacat_url|string|—|Opsional|Wajib kalau qty_cacat > 0.|
|hutang_id|string|FK|Opsional|Link ke Hutang_Supplier kalau tempo > 0.|

#### A5. Opname — Pecah 2 Tabel

**Opname:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|opname_id|string|PK|Ya|—|
|toko_id|string|FK|Ya|TKO1..TKO4. Null kalau gudang.|
|gudang_id|string|FK|Ya|GDG. Null kalau toko. Validasi: salah satu harus diisi, jangan dua-duanya null, jangan dua-duanya diisi.|
|tanggal|date|—|Ya|—|
|jenis|string|—|Ya|KECIL / GEDE / DADAKAN.|
|status|enum|—|Ya|opname_status.|
|approval_id|string|FK|Opsional|—|

**Opname_Detail:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|opname_detail_id|string|PK|Ya|—|
|opname_id|string|FK|Ya|—|
|sku|string|FK|Ya|—|
|stok_sistem|int|—|Ya|Snapshot saat COUNTING.|
|stok_fisik|int|—|Ya|—|
|selisih|int|—|Ya|stok_fisik - stok_sistem.|
|alasan|enum|—|Ya|opname_alasan.|
|foto_url|string|—|Opsional|—|

#### A6. PreOrder / Bundle / Voucher / Komplain — Pecah 5 Tabel

**PreOrder_Indent:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|preorder_id|string|PK|Ya|—|
|customer_id|string|FK|Ya|—|
|sku|string|FK|Ya|—|
|tanggal|date|—|Ya|—|
|dp_amount|decimal|—|Ya|—|
|estimasi_datang|date|—|Opsional|—|
|status|enum|—|Ya|preorder_status.|
|wa_notified|bool|—|Ya|Default false.|
|transaction_id|string|FK|Opsional|Link ke Transaksi_Penjualan DP. Lihat T.|

**Bundle_Paket:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|bundle_id|string|PK|Ya|—|
|nama|string|—|Ya|—|
|harga_bundle|decimal|—|Ya|—|
|aktif|bool|—|Ya|—|
|mulai|date|—|Ya|—|
|selesai|date|—|Ya|—|

**Bundle_Paket_Detail:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|bundle_detail_id|string|PK|Ya|—|
|bundle_id|string|FK|Ya|—|
|sku|string|FK|Ya|—|
|qty|int|—|Ya|—|

**Voucher_Kode_Diskon:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|voucher_id|string|PK|Ya|—|
|customer_id|string|FK|Opsional|Null kalau voucher umum.|
|kode|string|—|Ya|Unik.|
|jenis_voucher|enum|—|Ya|STEMPEL / PROMO / RETUR.|
|nominal|decimal|—|Opsional|—|
|persen|decimal|—|Opsional|Salah satu dari nominal / persen harus diisi.|
|min_belanja|decimal|—|Opsional|—|
|mulai|date|—|Ya|—|
|selesai|date|—|Ya|—|
|kuota|int|—|Ya|—|
|terpakai|int|—|Ya|Default 0.|
|aktif|bool|—|Ya|—|

**Komplain:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|komplain_id|string|PK|Ya|—|
|transaction_id|string|FK|Ya|—|
|customer_id|string|FK|Ya|—|
|tanggal|date|—|Ya|—|
|jenis|string|—|Ya|Ikut form Master_Komplain_Jenis. Lihat J.|
|solusi|string|—|Ya|Ikut form. Solusi di luar form butuh Owner.|
|foto_url|string|—|Opsional|—|
|status|enum|—|Ya|komplain_status.|
|approval_id|string|FK|Opsional|—|

#### A7. Kas — Pecah 5 Tabel

**Kas_Modal_Awal:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|modal_id|string|PK|Ya|—|
|toko_id|string|FK|Ya|—|
|tanggal|date|—|Ya|—|
|modal_awal|decimal|—|Ya|—|
|kasir_id|string|FK|Ya|—|

**Kas_Harian:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|kas_harian_id|string|PK|Ya|—|
|toko_id|string|FK|Ya|—|
|kasir_id|string|FK|Ya|—|
|tanggal|date|—|Ya|—|
|tunai_masuk|decimal|—|Ya|—|
|pengeluaran|decimal|—|Ya|—|
|setoran|decimal|—|Ya|—|
|kas_fisik|decimal|—|Ya|—|
|selisih|decimal|—|Ya|kas_fisik - (tunai_masuk - pengeluaran - setoran).|
|status|enum|—|Ya|kas_harian_status.|
|penjelasan_selisih|string|—|Opsional|Wajib kalau selisih != 0.|

**Kas_Kecil:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|kas_kecil_id|string|PK|Ya|—|
|toko_id|string|FK|Ya|—|
|tanggal|date|—|Ya|—|
|saldo_awal|decimal|—|Ya|—|
|saldo_akhir|decimal|—|Ya|—|
|status|enum|—|Ya|kas_kecil_status.|

**Kas_Kecil_Detail:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|kas_kecil_detail_id|string|PK|Ya|—|
|kas_kecil_id|string|FK|Ya|—|
|tanggal|date|—|Ya|—|
|keterangan|string|—|Ya|—|
|nominal|decimal|—|Ya|—|
|kasir_id|string|FK|Ya|—|

**Pengeluaran_Operasional:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|operasional_id|string|PK|Ya|—|
|toko_id|string|FK|Ya|—|
|kasir_id|string|FK|Ya|—|
|tanggal|date|—|Ya|—|
|tipe|string|—|Ya|KECIL / GEDE. KECIL = 50.001–200rb, GEDE = >200rb.|
|kategori|string|—|Opsional|—|
|keterangan|string|—|Ya|—|
|nominal|decimal|—|Ya|—|
|foto_bukti_url|string|—|Opsional|Wajib kalau tipe GEDE atau nominal > 100rb.|
|alasan|string|—|Opsional|—|
|approval_id|string|FK|Opsional|Wajib kalau tipe GEDE.|

#### A8. Piutang / Hutang / Utang / Komisi — Pecah 4 Tabel + 1 Baru (lihat B)

**Piutang_DP:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|piutang_id|string|PK|Ya|—|
|customer_id|string|FK|Ya|—|
|invoice_id|string|FK|Opsional|—|
|transaction_id|string|FK|Opsional|Salah satu dari invoice_id / transaction_id harus diisi.|
|total|decimal|—|Ya|—|
|sudah_bayar|decimal|—|Ya|Default 0.|
|sisa|decimal|—|Ya|total - sudah_bayar.|
|jatuh_tempo|date|—|Opsional|—|
|status|enum|—|Ya|payment_status.|
|aging_hari|int|—|Ya|—|

**Hutang_Supplier:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|hutang_id|string|PK|Ya|—|
|supplier_id|string|FK|Ya|—|
|po_id|string|FK|Ya|—|
|total|decimal|—|Ya|—|
|sudah_bayar|decimal|—|Ya|Default 0.|
|sisa|decimal|—|Ya|—|
|jatuh_tempo|date|—|Opsional|—|
|status|enum|—|Ya|payment_status.|
|aging_hari|int|—|Ya|—|

**Utang_Penitip:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|utang_penitip_id|string|PK|Ya|—|
|penitip_id|string|FK|Ya|—|
|transaction_id|string|FK|Opsional|—|
|total_kotor|decimal|—|Ya|Harga jual bersih.|
|komisi_toko|decimal|—|Ya|—|
|utang|decimal|—|Ya|total_kotor - komisi_toko.|
|settlement_id|string|—|Opsional|—|
|status|enum|—|Ya|payment_status.|

**Komisi_Afiliasi (untuk promoter, bukan merchant):**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|komisi_aff_id|string|PK|Ya|—|
|affiliate_id|string|FK → Master_Affiliate (promoter)|Ya|—|
|transaction_id|string|FK|Ya|—|
|nominal|decimal|—|Ya|Komisi promoter untuk transaksi ini.|
|payout_id|string|—|Opsional|—|
|status|enum|—|Ya|payment_status.|

#### A9. Gaji / Slip — Pecah 2 Tabel

**Gaji:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|gaji_id|string|PK|Ya|—|
|karyawan_id|string|FK|Ya|—|
|periode|string|—|Ya|YYYY-MM.|
|gaji_pokok|decimal|—|Ya|—|
|insentif|decimal|—|Ya|Dari Komisi_SPG_Kasir.|
|bonus_target|decimal|—|Ya|—|
|potongan_telat|decimal|—|Ya|Lihat L.|
|potongan_kas|decimal|—|Ya|Lihat L.|
|potongan_izin|decimal|—|Ya|Lihat L.|
|lembur|decimal|—|Ya|Lihat L.|
|total|decimal|—|Ya|gaji_pokok + insentif + bonus_target + lembur - potongan_telat - potongan_kas - potongan_izin.|
|status|enum|—|Ya|gaji_status.|

**Slip_Gaji:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|slip_id|string|PK|Ya|—|
|gaji_id|string|FK|Ya|—|
|file_url|string|—|Ya|PDF slip.|

---

### B. AFF Dobel Arti + Utang AFF Hilang + Jurnal AFF Salah (BAB 4.3, 4.4, 8.2, 8.3 v40 SALAH)

**Masalah v40:** AFF dipake buat 2 hal beda, `komisi_affiliate` ambigu, ga ada Utang ke merchant AFF, jurnal AFF cuma Pendapatan_Komisi, neraca ga balance.

**v40.1 — Pisah 2 konsep, ini final:**

|Istilah Resmi v40.1|Arti|Tabel|
|---|---|---|
|AFF_PRODUCT|Barang dari merchant lain, dijual di toko|Master_Merchant_Afiliasi, Master_Varian.jenis_barang = AFF|
|AFF_PROMOTER|Orang yang promosiin toko, dapet komisi|Master_Affiliate, Komisi_Afiliasi|

**1) Master_Merchant_Afiliasi sudah dipecah di A1, tambah field `komisi_persen` dan `tempo_bayar_hari`.** Itu komisi toko dari merchant, bukan komisi promoter.

**2) Tambah tabel baru — Utang_Merchant_AFF:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|utang_merchant_aff_id|string|PK|Ya|—|
|merchant_id|string|FK → Master_Merchant_Afiliasi|Ya|—|
|transaction_id|string|FK|Ya|—|
|total_kotor|decimal|—|Ya|Harga jual bersih AFF.|
|komisi_toko_dari_merchant|decimal|—|Ya|total_kotor * komisi_persen merchant.|
|utang_merchant|decimal|—|Ya|total_kotor - komisi_toko_dari_merchant.|
|jatuh_tempo|date|—|Ya|tanggal + tempo_bayar_hari.|
|status|enum|—|Ya|payment_status.|

**3) Transaksi_Detail — Ganti kolom `komisi_affiliate` (ambigu) jadi 2 kolom:**

- ❌ HAPUS dari Transaksi_Detail: `komisi_affiliate` (satu kolom ambigu).
- ✅ TAMBAH di Transaksi_Detail:
    - `komisi_toko_dari_merchant` (decimal, Ya, Default 0. 0 kalau bukan AFF_PRODUCT. = harga_jual_bersih * komisi_persen merchant.)
    - `komisi_promoter` (decimal, Ya, Default 0. 0 kalau tidak ada promoter. = dari Master_Affiliate.komisi_nilai, lihat bawah.)
- ✅ PERTAHANKAN: `komisi_kasir` (total insentif kasir untuk line itu, sebelum split, lihat B.5), `komisi_penitip` (untuk CNS, 0 kalau bukan CNS).
- Aturan: Kalau jenis_barang = AFF, `komisi_penitip` harus 0, `komisi_toko_dari_merchant` diisi, `hpp_satuan` harus 0. Kalau jenis_barang = CNS, `komisi_toko_dari_merchant` harus 0, `komisi_penitip` diisi. Kalau OWN, dua-duanya 0, `hpp_satuan` diisi.

**4) Komisi Promoter — Rumus final:**

- Promoter diambil dari `affiliate_id` di Transaksi_Penjualan? Tambah kolom di Transaksi_Penjualan: `affiliate_id` (string, FK → Master_Affiliate, Opsional). Null kalau tidak ada promoter.
- Kalau `affiliate_id` diisi:
    - Kalau Master_Affiliate.komisi_type = PERSEN: `komisi_promoter` per transaksi = `komisi_nilai` * `komisi_toko_dari_merchant` (kalau AFF_PRODUCT) atau `komisi_nilai` * `subtotal_kena_pajak` (kalau OWN/CNS). Promoter dapet persen dari komisi toko, bukan dari harga jual penuh, biar toko ga rugi.
    - Kalau komisi_type = FLAT: `komisi_promoter` = `komisi_nilai` per transaksi, flat.
- Komisi promoter dicatat di Komisi_Afiliasi (A8) per transaksi, status UNPAID sampai payout.
- Jurnal promoter: Beban_Komisi_Promoter (debit) → Utang_Promoter / Komisi_Afiliasi (kredit). Jangan campur ke Pendapatan_Komisi_AFF.

**5) Transaksi_Detail.komisi_kasir vs Insentif_Detail — Bukan dobel, ini definisinya:**

- Transaksi_Detail.komisi_kasir = total insentif untuk line itu, sebelum split. Rumus: `pcs * insentif_per_pcs` dari Master_Karyawan. Contoh: 1 pcs, insentif 1000 → komisi_kasir = 1000.
- Insentif_Detail.nominal_kasir = `komisi_kasir * split_kasir_pct` (0–1, lihat G). Insentif_Detail.nominal_spg = `komisi_kasir * split_spg_pct`.
- Contoh: komisi_kasir 1000, split 0.7/0.3 → Insentif_Detail nominal_kasir 700, nominal_spg 300.
- Jadi Transaksi_Detail.komisi_kasir adalah sumber, Insentif_Detail adalah hasil split. Jangan hapus salah satu, jangan hitung ulang dari Transaksi_Detail langsung ke Gaji.

**6) Jurnal Mapping AFF — Ganti total BAB 8.3 v40 untuk AFF:**

**v40 yang salah:** Jual AFF: Debit Kas/Piutang, Kredit Pendapatan_Komisi_AFF saja. Net ke merchant hilang.

**v40.1 yang benar — 2 jurnal untuk 1 transaksi AFF:**

```
Jurnal 1 — Jual AFF (saat PAID):
  Debit  Kas / Piutang          150.000
  Kredit Utang_Merchant_AFF     120.000  (total_kotor - komisi_toko)
  Kredit Pendapatan_Komisi_AFF   30.000  (komisi_toko_dari_merchant)
  Kredit Utang_PPN               (kalau pajak ON, pajak_amount)

Jurnal 2 — Komisi Promoter (kalau ada promoter, saat PAID):
  Debit  Beban_Komisi_Promoter    3.000  (10% * 30.000)
  Kredit Utang_Promoter / Komisi_Afiliasi  3.000

Jurnal 3 — Bayar Merchant AFF (saat settlement, via bayar jenis HUTANG_MERCHANT_AFF, lihat F):
  Debit  Utang_Merchant_AFF      120.000
  Kredit Kas                     120.000
```

- Kalau pajak ON untuk AFF, Utang_PPN juga dikredit di Jurnal 1. V40 lupa pajak untuk AFF/CNS. Di v40.1, pajak berlaku untuk semua jenis_barang, kecuali pajak_skema = TIDAK_PAKE.
- Retur AFF: Jurnal koreksi: Debit Pendapatan_Komisi_AFF (contra) + Utang_Merchant_AFF (contra) + Utang_PPN (contra) → Kredit Kas. Dan Komisi Promoter dibatalkan kalau retur 7 hari (ikut BR-RETUR untuk AFF).
- Tambah ke enum `bayar_jenis` (lihat F): `HUTANG_MERCHANT_AFF`.

---

### C. Dokumen_Invoice — Tambah transaction_id + Invoice_Detail (BAB 4.4 v40 BOLONG)

**Masalah v40:** Dokumen_Invoice cuma punya `quotation_id`, ga punya `transaction_id`, ga punya detail. Invoice buat transaksi mana, item apa?

**v40.1 — Tambah:**

**1) Tambah kolom di Dokumen_Invoice:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|transaction_id|string|FK → Transaksi_Penjualan|Opsional|Diisi kalau Invoice dari transaksi penjualan. Null kalau Invoice dari Quotation saja (belum ada transaksi).|

**Validasi:** `quotation_id` dan `transaction_id` tidak boleh dua-duanya null. Salah satu harus diisi. Kalau dua-duanya diisi, harus konsisten (transaction_id harus dari quotation_id yang sama, kalau ada).

**2) Tambah tabel baru — Dokumen_Invoice_Detail:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|invoice_detail_id|string|PK|Ya|—|
|invoice_id|string|FK → Dokumen_Invoice|Ya|—|
|sku|string|FK|Ya|—|
|qty|int|—|Ya|—|
|harga_jual_satuan|decimal|—|Ya|Snapshot.|
|diskon_satuan|decimal|—|Ya|Default 0.|
|subtotal|decimal|—|Ya|qty * (harga - diskon).|

- Kalau Invoice dari Transaksi_Penjualan, Invoice_Detail di-copy dari Transaksi_Detail. Kalau Invoice dari Quotation, Invoice_Detail di-copy dari Quotation detail (Quotation detail juga harus ada, lihat bawah).
- Kalau Invoice dari Quotation tanpa transaksi, `transaction_id` null, `quotation_id` diisi. Kalau Invoice dibuat setelah transaksi, `transaction_id` diisi, `quotation_id` boleh null atau diisi kalau transaksi dari quotation.

**3) Tambah tabel — Dokumen_Quotation_Detail (karena Quotation juga butuh detail):**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|quotation_detail_id|string|PK|Ya|—|
|quotation_id|string|FK|Ya|—|
|sku|string|FK|Ya|—|
|qty|int|—|Ya|—|
|harga_jual_satuan|decimal|—|Ya|—|
|subtotal|decimal|—|Ya|—|

**4) Dokumen_Kwitansi — Tambah validasi:**

- `invoice_id` dan `transaction_id` di Dokumen_Kwitansi tidak boleh dua-duanya null. Salah satu harus diisi. Kalau Kwitansi untuk Invoice, `invoice_id` diisi. Kalau Kwitansi untuk Transaksi langsung, `transaction_id` diisi.

---

### D. SKU Regex vs Contoh + FK ALL (KEP-13, BAB 4.3 v40 SALAH)

**Masalah v40:**

- KEP-13 regex 7 grup, contoh di BAB 6.7.1 `OWN-ERG-TSH-002-WHT-M` 6 grup, grup terakhir 1 karakter, gagal regex.
- Master_Harga `toko_id` / `class_id` FK, tapi nilai `ALL` ga ada di master.

**v40.1 — Fix 2:**

**D1. SKU Contoh — Ganti total:**

- ❌ HAPUS contoh SKU di v40 BAB 6.7.1: `OWN-ERG-TSH-002-WHT-M` (salah).
- ✅ GANTI jadi: `OWN-ERG-TSH-KAO-002-WHT-M01`
    - OWN (jenis) - ERG (merek) - TSH (kategori) - KAO (style) - 002 (nomor style) - WHT (warna) - M01 (ukuran, 2+ karakter).
    - Ini match regex KEP-13: `^[A-Z]{3}-[A-Z]{3}-[A-Z]{3}-[A-Z]{3}-[0-9]{3}-[A-Z]{3}-[0-9A-Z]{2,}$`.
- Semua contoh SKU di v40 yang 6 grup, ganti ke format 7 grup di atas. Contoh yang sudah bener (`OWN-ERG-CLN-JNS-001-BLU-35`) tetap dipakai, jangan diubah.
- Validasi GAS: Regex KEP-13 + cek duplikat. Kalau SKU ga match regex, tolak VAL_001. Kalau SKU dobel, tolak VAL_001.

**D2. FK ALL — Tambah Baris ALL di Master:**

- Tambah di Master_Toko: baris `toko_id = ALL, nama = Semua Toko, class_id = ALL, alamat = -, jam_tutup = -, wa_start = 07:00, wa_end = 21:00, aktif = true`. Ini baris khusus untuk FK, bukan toko beneran. Jangan tampilkan di dropdown toko di PWA Kasir.
- Tambah di Master_Class_Toko: baris `class_id = ALL, nama = Semua Class, deskripsi = Untuk harga global`.
- Sekarang Master_Harga `toko_id = ALL` dan `class_id = ALL` punya FK yang valid. Jangan ubah Master_Harga jadi non-FK. FK tetap, tapi master punya baris ALL.
- Di PWA, dropdown toko dan class jangan tampilkan ALL. ALL hanya untuk Master_Harga global.

---

### E. State Machine Transaksi — Pisah 3 Field (BAB 5.1 v40 CAMPUR)

**Masalah v40:** BAB 5.1 campur DRAFT/PENDING_PAYMENT/PAID/VOID_REQUESTED/RETUR_REQUESTED/SELESAI_UTUH jadi 1 diagram, tapi Transaksi_Penjualan cuma punya `payment_status` + `status_rangkaian`. Ga ada kolom buat DRAFT dll. Plus istilah APPROVED_VOID / RETUR_SELESAI ga ada di enum.

**v40.1 — Tambah kolom + pisah 3 state machine:**

**1) Tambah kolom baru di Transaksi_Penjualan:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|transaction_status|enum|—|Ya|transaction_status. Lihat bawah. Default DRAFT.|
|affiliate_id|string|FK → Master_Affiliate (promoter)|Opsional|Lihat B.4. Null kalau tidak ada promoter.|
|preorder_id|string|FK → PreOrder_Indent|Opsional|Lihat T. Null kalau bukan PreOrder.|

**Enum baru — transaction_status:**

```
DRAFT, PENDING_PAYMENT, PAID, VOID_REQUESTED, VOID, RETUR_REQUESTED, SELESAI
```

**2) 3 State Machine Terpisah — Ini final, ganti total BAB 5.1 v40:**

**Transaction Lifecycle (transaction_status):**

```
DRAFT (keranjang, PWA-only, belum ke GAS)
  → PENDING_PAYMENT (sudah submit ke GAS, belum bayar)
      → PAID (sudah bayar, GAS konfirmasi)
      → VOID (sebelum bayar, tanpa approval)
  → PAID
      → VOID_REQUESTED (minta void setelah bayar, nunggu approval)
          → VOID (approval APPROVED)
          → PAID (approval REJECTED / EXPIRED, balik ke PAID)
      → RETUR_REQUESTED (minta retur, nunggu approval / auto)
          → SELESAI (retur SELESAI, transaksi SELESAI)
      → SELESAI (tidak ada piutang/retur/koreksi, SELESAI)
```

**Payment (payment_status, sudah ada di v40, tetap):**

```
UNPAID → PARTIAL → PAID → REFUNDED / VOID
```

**Rangkaian (status_rangkaian, sudah ada di v40, tetap):**

```
BELUM_UTUH → SELESAI_UTUH
```

**Mapping wajib:**

- `transaction_status = DRAFT` → `payment_status = UNPAID`, `status_rangkaian = BELUM_UTUH`.
- `transaction_status = PENDING_PAYMENT` → `payment_status = UNPAID`, `status_rangkaian = BELUM_UTUH`.
- `transaction_status = PAID` → `payment_status = PAID / PARTIAL`, `status_rangkaian = BELUM_UTUH` (kalau masih ada piutang/retur/koreksi) atau `SELESAI_UTUH` (kalau sudah lunas + tidak ada retur/koreksi).
- `transaction_status = VOID` → `payment_status = VOID`, `status_rangkaian = SELESAI_UTUH` (void sudah selesai, tidak ada lagi yang nyangkut).
- `transaction_status = SELESAI` → `payment_status = PAID`, `status_rangkaian = SELESAI_UTUH`.
- `SELESAI_UTUH` hanya jika: PAID + tidak ada retur aktif + tidak ada jurnal koreksi terbuka + tidak ada bukti bayar belum verifikasi + tidak ada piutang/DP/preorder/konsinyasi/transfer/hutang nyangkut. Sama kayak v40, tapi sekarang jelas field-nya mana.

**3) Fix istilah di diagram v40:**

- ❌ HAPUS: `APPROVED_VOID`, `REJECTED_VOID`, `RETUR_SELESAI`.
- ✅ GANTI: `APPROVED_VOID` → `APPROVED` (enum approval_status), `REJECTED_VOID` → `REJECTED`, `RETUR_SELESAI` → `SELESAI` (enum transaction_status) + `SELESAI` (enum retur_status).

---

### F. API — Tambah Read / Import / Restore + Warning (BAB 6.4 v40 CUMA WRITE)

**Masalah v40:** 17 endpoint semuanya POST write. PWA mau ambil harga/stok/dashboard gimana? Import CSV gimana? Restore gimana? Warning PROMO_EXPIRED mau ditaruh mana?

**v40.1 — Tambah 5 endpoint, total jadi 22 mode. Endpoint list final 22:**

|Mode|Request|Response|Idempotency|
|---|---|---|---|
|jual|(sama v40 + tambah affiliate_id?, preorder_id?)|(sama v40 + tambah data.warning)|request_id + transaction_id + payload_hash|
|transfer|(sama v40)|(sama v40)|request_id|
|opname|(sama v40)|(sama v40)|request_id|
|retur_jual|(sama v40)|(sama v40)|request_id|
|retur_beli|(sama v40)|(sama v40)|request_id|
|bayar|(sama v40, jenis + HUTANG_MERCHANT_AFF)|(sama v40)|request_id|
|tutup_kas|(sama v40)|(sama v40)|request_id|
|approve|(sama v40)|(sama v40)|request_id|
|sync|(sama v40)|(sama v40)|transaction_id + payload_hash|
|sync_status|(sama v40)|(sama v40)|—|
|backup|(sama v40)|(sama v40)|request_id|
|arsip|(sama v40)|(sama v40)|request_id|
|void|(sama v40)|(sama v40)|request_id|
|login|(sama v40)|(sama v40)|Rate-limit|
|pair_device|(sama v40)|(sama v40)|request_id|
|diskon|(sama v40)|(sama v40)|request_id|
|minta_invoice|(sama v40, tipe + QUOTATION / RETUR)|(sama v40)|request_id|
|**get_master**|**{ tipe, toko_id?, class_id? }**|**{ data: [...] }**|**— (read, bukan write)**|
|**get_stok**|**{ toko_id, sku? }**|**{ data: [...] }**|**—**|
|**get_dashboard**|**{ toko_id, tanggal }**|**{ omzet, transaksi, kas, stok_mati }**|**—**|
|**import_csv**|**{ file_url, tipe, toko_id }**|**{ import_id, sukses, gagal, file_error_url }**|**request_id**|
|**restore**|**{ backup_id }**|**{ restore_id, status }**|**request_id**|

**Detail:**

- **get_master:** `tipe` = MASTER_BARANG / MASTER_VARIAN / MASTER_HARGA / MASTER_TOKO / MASTER_KURIR / MASTER_PRINTER / MASTER_SCANNER / MASTER_SUPPLIER / MASTER_PENITIP / MASTER_PELANGGAN / MASTER_AFFILIATE / MASTER_MERCHANT_AFF / MASTER_KARYAWAN. GAS baca dari Sheets Toko (replica) atau Pusat, kirim JSON. PWA cache 1 jam. Jangan kirim NPWP di get_master. NPWP tidak pernah ke PWA.
- **get_stok:** Baca Stok_Per_Toko. Kalau `sku` diisi, return 1 baris. Kalau tidak, return semua SKU di toko itu. PWA pakai ini untuk cek stok sebelum jual (tapi validasi final tetap di GAS saat `jual`, untuk race condition TC-010).
- **get_dashboard:** Baca Summary_Harian + Kas_Harian + Stok_Movement. Return omzet, jumlah transaksi, kas, stok mati. Role: Owner lihat semua toko, Manager lihat toko dia saja, Kasir tidak boleh (GAS tolak AUTH_004).
- **import_csv:** `tipe` = BARANG / VARIAN / HARGA / PELANGGAN / SUPPLIER. GAS baca file dari Drive (file_url), validasi per baris, masukin yang sukses, skip yang gagal, return file_error_url untuk baris gagal (TC-030). Import hanya Owner/Manager (BAB 7.3).
- **restore:** `backup_id` dari Backup_Log. Hanya Owner. GAS restore dari Drive ERP-Backup/ ke Sheets. Wajib konfirmasi Owner 2x (PWA minta PIN Owner + klik konfirmasi). Jangan auto-restore tanpa konfirmasi.

**bayar_jenis — Tambah 1:**

```
bayar_jenis final: PIUTANG, HUTANG_SUPPLIER, UTANG_PENITIP, HUTANG_MERCHANT_AFF, KOMISI_AFFILIATE, SETORAN, OPERASIONAL_KECIL, OPERASIONAL_GEDE, KAS_KECIL
```

- `HUTANG_MERCHANT_AFF` = bayar merchant AFF (lihat B). Role: Owner saja.
- `KOMISI_AFFILIATE` = bayar promoter (affiliate_id). Role: Owner saja.

**Warning — Tambah field di semua response `jual` / `diskon` / `retur`:**

```
{
  "ok": true,
  "request_id": "req-001",
  "data": {
    "transaction_id": "TRX-TKO1-20261113-0001",
    "total": 573900,
    "warning": [
      { "code": "PROMO_EXPIRED", "message": "Promo expired, pakai harga NORMAL." },
      { "code": "PACKAGING_0", "message": "Mode Cepat: packaging_amount = 0." }
    ]
  },
  "error": null
}
```

- `data.warning` = array, boleh kosong `[]`. Bukan error, transaksi tetap sukses.
- Kode warning final: PROMO_EXPIRED, PACKAGING_0, STOK_MENIPIS, HARGA_LAMA (harga Pusat berubah, kasir pakai harga lama sebelum sync), VOUCHER_HAMPIR_EXPIRED.
- TC-031 dan TC-042 harus cek `data.warning`, bukan cuma `data.total`.

---

## 2. FIX MEDIUM (G–O)

### G. Split 1.0 vs 100/0 — Pakai 0–1 (BAB 4.3, 7.2 v40 AMBIGU)

**v40:** BAB 4.3 bilang default 1.0, BAB 7.2 bilang 100/0. Coder bingung.

**v40.1 — Pilih 0–1, ini final:**

- `split_kasir_pct` dan `split_spg_pct` disimpan sebagai decimal 0–1. 1.0 = 100%, 0.7 = 70%, 0.3 = 30%, 0 = 0%.
- Di PWA, tampilkan sebagai persen (70%, 30%) untuk kasir, tapi submit ke GAS sebagai 0.7, 0.3.
- Di BAB 7.2, ganti "Default 100/0" jadi "Default 1.0 / 0.0".
- Rumus: `nominal_kasir = komisi_kasir * split_kasir_pct`, `nominal_spg = komisi_kasir * split_spg_pct`. `split_kasir_pct + split_spg_pct` harus = 1.0 kalau ada SPG, = 1.0 + 0.0 kalau tidak ada SPG. GAS validasi: kalau jumlah != 1.0, tolak VAL_003.
- Contoh: Kasir + SPG 70/30 → `split_kasir_pct = 0.7`, `split_spg_pct = 0.3`. Kasir sendiri → `split_kasir_pct = 1.0`, `split_spg_pct = 0.0`.

### H. transaction_id Siapa yang Generate? — PWA Generate ID, GAS Generate Nomor Urut (BAB 3.1, 6.7.1 v40 KONTRADIKSI)

**v40:** BAB 3.1 bilang nomor urut dibuat di GAS, contoh BAB 6.7.1 PWA kirim transaction_id. Kontradiksi.

**v40.1 — Pisah 2 hal:**

|Hal|Siapa Generate?|Format|Contoh|
|---|---|---|---|
|transaction_id|PWA|TRX-TKO1-YYYYMMDD-NNNN, NNNN dari counter lokal + hash request_id biar ga dobel|TRX-TKO1-20261113-0001|
|nomor_manusia|GAS|Toko 1 - 13 Nov 2026 - No. 1, No. urut harian dari GAS|Toko 1 - 13 Nov 2026 - No. 1|

- PWA generate `transaction_id` sebelum kirim `jual`, kirim di payload. GAS pakai `transaction_id` itu, jangan generate baru. Kalau PWA kirim `transaction_id` yang sudah ada di Sheets dengan `payload_hash` sama, GAS return IDEM_001 (duplikat). Kalau `payload_hash` beda, GAS return IDEM_002.
- GAS generate `nomor_manusia` (No. 1, No. 2, ...) saat `jual` sukses, dari counter harian di GAS unit. PWA jangan generate `nomor_manusia` sendiri.
- Kalau PWA tidak kirim `transaction_id` (legacy), GAS generate dari `request_id`: `TRX-{toko}-{YYYYMMDD}-{hash(request_id)[0:4]}`. Ini fallback, bukan utama.
- BAB 3.1 v40 "Nomor urut transaksi dibuat di GAS unit, bukan HP" maksudnya `nomor_manusia`, bukan `transaction_id`. Di v40.1, kalimat itu dibaca sebagai nomor_manusia.

### I. approved_by = SYSTEM — String Literal, Bukan FK (BAB 4.6, 5.6 v40 FK FAIL)

**v40:** Approval.approved_by FK, tapi auto-approve bilang approved_by = SYSTEM. SYSTEM bukan user, FK fail.

**v40.1 — Ubah tipe:**

- `Approval.approved_by` tipe string, bukan FK. Boleh 2 nilai:
    - `SYSTEM` (literal, untuk auto-approve TUKAR_SAMA dan REFUND tunai <200rb hari sama).
    - `user_id` (USR-001, dll, untuk manual approve).
- GAS validasi: Kalau `approved_by = SYSTEM`, jangan cek FK ke User_Pengguna. Kalau `approved_by != SYSTEM`, cek FK ke User_Pengguna, harus ada.
- Di Audit_Log, `approved_by = SYSTEM` tetap dicatat, dengan keterangan "Auto-approve sistem".

### J. Setting_Bisnis + Kurir — Enum + Skema JSON (BAB 4.3 v40 VAGUE)

**v40:** `npwp_mode` ga ada enum, `form_omzet` tipe string "Ikut form Owner", `ongkir_json` ga ada skema, Komplain jenis/solusi ga ada master.

**v40.1 — Definisiin:**

**npwp_mode enum (baru, tambah ke BAB 4.2 Enum Master):**

```
npwp_mode: NPWP_PEMILIK, NPWP_TOKO, TIDAK_PAKE
```

- NPWP_PEMILIK = pakai NPWP Pemilik untuk semua toko. NPWP_TOKO = pakai NPWP_Toko per toko (kalau ada, kalau tidak ada fallback ke NPWP_Pemilik). TIDAK_PAKE = tidak pakai NPWP (non-PKP, belum PKP).

**form_omzet_cns / form_omzet_aff — JSON string, skema:**

```
{
  "mode": "BRUTO",
  "potong_komisi": false,
  "potong_diskon": true
}
```

- `mode`: BRUTO / NETTO. BRUTO = omzet = harga_jual penuh. NETTO = omzet = harga_jual - komisi. Default BRUTO untuk CNS, NETTO untuk AFF (karena AFF toko cuma dapet komisi, bukan harga penuh).
- `potong_komisi`, `potong_diskon`: bool. Kalau true, omzet dipotong komisi/diskon.

**ongkir_json — Skema final (Master_Kurir.ongkir_json):**

```
[
  { "zona": "JAKARTA", "tipe": "FLAT", "nilai": 15000 },
  { "zona": "BANDUNG", "tipe": "PER_KG", "nilai": 5000 },
  { "zona": "LUAR_JAWA", "tipe": "PER_KM", "nilai": 2000 }
]
```

- `tipe` harus sama dengan Master_Kurir.tipe_ongkir (FLAT / PER_KG / PER_KM) atau per zona beda. Kalau per zona beda, `tipe_ongkir` di Master_Kurir adalah default, per zona override.
- GAS hitung ongkir dari ongkir_json, jangan hardcode.

**Master_Komplain_Jenis — Tambah tabel baru:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|komplain_jenis_id|string|PK|Ya|—|
|jenis|string|—|Ya|Unik. CACAT / SALAH_UKURAN / SALAH_WARNA / TERLAMBAT / LAINNYA.|
|solusi_default|string|—|Ya|GANTI_BARU / REFUND / VOUCHER.|
|aktif|bool|—|Ya|—|

- Komplain.jenis harus ada di Master_Komplain_Jenis. Kalau solusi di luar solusi_default, butuh Owner (BR-KOMPLAIN-001).

### K. Stempel + Tier — Tambah Tempat Nyimpen (BR-LOYALTY, BR-CUSTOMER v40 BOLONG)

**v40:** Stempel 5x = voucher, Tier naik otomatis, tapi ga ada stempel_count, ga ada threshold.

**v40.1 — Tambah:**

**1) Tambah kolom di Master_Pelanggan_Member:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|stempel_count|int|—|Ya|Default 0. Naik +1 tiap transaksi PAID. Reset ke 0 kalau sudah 5 dan voucher dibuat.|
|total_transaksi|int|—|Ya|Default 0. Untuk tier.|
|total_omzet|decimal|—|Ya|Default 0. Untuk tier SULTAN.|

**2) Tambah di Master_Config (key-value, lihat S di v39.1):**

|key|value (default)|Ket|
|---|---|---|
|stempel_target|5|5x = voucher.|
|stempel_voucher_nominal|20000|Voucher Rp 20.000.|
|stempel_voucher_expired_hari|30|Expired 30 hari.|
|tier_langganan_min_transaksi|3|BARU → LANGGANAN kalau total_transaksi >= 3.|
|tier_sultan_min_omzet|5000000|LANGGANAN → SULTAN kalau total_omzet >= 5jt.|

- Flow Stempel: Transaksi PAID → `stempel_count += 1`, `total_transaksi += 1`, `total_omzet += total`. Kalau `stempel_count == 5`, buat Voucher (jenis STEMPEL, nominal 20000, expired 30 hari), reset `stempel_count = 0`, WA customer.
- Flow Tier: Setelah transaksi, cek `total_transaksi` dan `total_omzet`, update `tier` otomatis. Jangan manual.

### L. Gaji Potongan — Formula via Form (BAB 4.5 v40 GA ADA RUMUS)

**v40:** Gaji punya potongan_telat, potongan_kas, potongan_izin, lembur, tapi ga ada rumus. TELAT vs TELAT_BERAT threshold ga ada.

**v40.1 — Tambah di Master_Config + Setting_Bisnis:**

|key|value (default)|Ket|
|---|---|---|
|telat_threshold_menit|15|Check-in > shift_start + 15 menit = TELAT.|
|telat_berat_threshold_menit|60|Check-in > shift_start + 60 menit = TELAT_BERAT.|
|potongan_telat_per_menit|1000|Potongan per menit telat.|
|potongan_telat_berat_flat|50000|Potongan flat kalau TELAT_BERAT, + per menit.|
|potongan_izin_per_hari|50000|Potongan per hari IZIN (bukan IZIN_SAKIT). IZIN_SAKIT dengan surat dokter = 0.|
|lembur_per_jam|15000|Lembur per jam, hanya kalau Owner minta (BR-ABSEN-001).|
|potongan_kas_mode|POTONG_GAJI|POTONG_GAJI / BAYAR_TUNAI. Kalau POTONG_GAJI, selisih kas masuk potongan_kas. Kalau BAYAR_TUNAI, kasir bayar tunai, tidak potong gaji.|

**Rumus Gaji (final):**

```
potongan_telat = 0
if status = TELAT: potongan_telat = (check_in - shift_start - telat_threshold) * potongan_telat_per_menit
if status = TELAT_BERAT: potongan_telat = potongan_telat_berat_flat + (check_in - shift_start - telat_berat_threshold) * potongan_telat_per_menit
potongan_izin = jumlah_hari_IZIN * potongan_izin_per_hari (IZIN_SAKIT dengan surat = 0)
lembur = lembur_jam * lembur_per_jam (hanya kalau Owner minta lembur, ada flag di Absensi)
potongan_kas = selisih Kas_Harian (kalau potongan_kas_mode = POTONG_GAJI dan selisih < 0 dan kasir bertanggung jawab)
total = gaji_pokok + insentif + bonus_target + lembur - potongan_telat - potongan_kas - potongan_izin
```

- Absensi.status dihitung dari check_in vs shift_start + threshold di atas. Jangan hardcode 15/60 di kode, baca dari Master_Config.

### M. Master_Toko GDG class_id — Opsional (BAB 4.3 v40 WAJIB)

**v40:** Master_Toko class_id Wajib Ya, padahal GDG ga punya class.

**v40.1 — Ubah:**

- Master_Toko.class_id: Wajib = Opsional. Null untuk GDG. Wajib untuk TKO1–TKO4.
- Master_Toko untuk GDG: `toko_id = GDG, nama = Gudang Pusat, class_id = null, jam_tutup = 17:00, wa_start = 07:00, wa_end = 21:00`.
- GAS validasi: Kalau `toko_id != GDG` dan `class_id` null, tolak VAL_001. Kalau `toko_id == GDG` dan `class_id` diisi, tolak VAL_001 (gudang ga punya class).

### N. tipe_dokumen — Tambah QUOTATION / RETUR (BAB 4.2 v40 KURANG)

**v40:** tipe_dokumen cuma INVOICE/KWITANSI/SURAT_JALAN.

**v40.1 — Enum final:**

```
tipe_dokumen: INVOICE, KWITANSI, SURAT_JALAN, QUOTATION, RETUR
```

- `minta_invoice` di BAB 6.4 sekarang handle 5 tipe, bukan 3. `tipe_dokumen` di request `minta_invoice` boleh 5 nilai di atas.
- Response `minta_invoice` untuk QUOTATION: `{ quotation_pdf_url, nomor_manusia }`. Untuk RETUR: `{ dok_retur_pdf_url, nomor_manusia }`. Untuk INVOICE/KWITANSI/SURAT_JALAN: sama kayak v40.

### O. Audit + Sync Field — Clarify Sekali (BAB 4.1 v40 KLAIM WAJIB TAPI GA DITAMPILIN)

**v40:** BAB 4.1 bilang audit wajib di semua tabel, sync wajib di transaksi header, tapi di tabel BAB 4 ga ada kolom audit/sync-nya (kecuali Transaksi_Penjualan/Detail).

**v40.1 — Clarify, ini final, jangan ulang per tabel:**

- **Audit:** Semua tabel di BAB 4 (master, transaksi, log, AI) punya +4 kolom audit, tidak ditulis per tabel buat hemat tempat: `created_at (datetime, Ya), created_by (string, Ya), updated_at (datetime, Ya), updated_by (string, Ya)`. Coder wajib tambahin 4 kolom ini ke semua tabel. Kalau tabel di v40.1 sudah nampilin audit, jangan dobel.
- **Sync Header:** Semua tabel transaksi header (Transaksi_Penjualan, Transfer_Stok, Opname, Retur_Jual, Retur_Beli, Pembelian_PO, Pembayaran, Jurnal_Otomatis, Stok_Movement, Kas_Harian, Piutang_DP, Hutang_Supplier, Utang_Penitip, Utang_Merchant_AFF, Komisi_Afiliasi, Approval, Transaksi_Approval) punya +6 sync field, tidak ditulis per tabel buat hemat tempat: `source_store_id, sync_batch_id, sync_status, received_at, payload_hash, created_at_sync`. Plus `failed_reason, failed_detail` kalau FAILED. Coder wajib tambahin.
- **Sync Detail:** Semua tabel transaksi detail (Transaksi_Detail, Transfer_Stok_Detail, Pembelian_PO_Detail, Opname_Detail, Dokumen_Invoice_Detail, Insentif_Detail) punya +4 sync field: `source_store_id, sync_batch_id, payload_hash, created_at_sync`. Tidak ada `sync_status` di detail.
- **Master:** Tabel master tidak punya sync field. Master sync via Pusat→Toko, bukan via transaction_bundle.
- **status_rangkaian:** Semua tabel transaksi header punya `status_rangkaian` (BELUM_UTUH / SELESAI_UTUH), tidak ditulis per tabel kalau sudah ada di v40. Kalau di v40.1 tabelnya ga nampilin status_rangkaian, tetap tambahin.

---

## 3. FIX MINOR (P–T)

### P. Referensi v39.2 — Hapus Semua (P-04 v40 DILANGGAR)

**v40:** Bilang "Tidak ada v39, v39.1, v39.2 yang normatif", tapi di BAB 4.3 NPWP masih ada "(fix v39.2 X-1)" dan Lampiran A masih ada baris v39.2.

**v40.1 — Hapus:**

- ❌ HAPUS di BAB 4.3 Master_NPWP: "(fix v39.2 X-1)". Ganti jadi "(lihat v40.1 B, NPWP plain di Sheets, AES-256 di backup)".
- ❌ HAPUS di Lampiran A v40: baris `v39.2 7 patch + 7 test case`. Ganti jadi `v40.1 20 patch coding-ready (6 ngeblok + 9 medium + 5 minor)`.
- Jangan ada lagi referensi v39, v39.1, v39.2, v38 di dokumen normatif. Kalau ada referensi historis, taruh di Lampiran A saja, dengan label "Historis, bukan normatif".

### Q. Gudang Operasional — Samain Matrix vs 7.4 (BAB 7.3, 7.4 v40 BEDA)

**v40:** BAB 7.3 Matrix bilang Gudang boleh Operasional Kecil, BAB 7.4 ga nyebut Gudang.

**v40.1 — Samain:**

- BAB 7.4 Approval Limit Final, baris Operasional: `Kasir 0–200rb, Manager 0–200rb, Gudang 0–200rb (untuk kebutuhan gudang saja), Owner >200rb`.
- Gudang boleh Operasional Kecil untuk kebutuhan gudang (beli lakban, plastik, dll). Gudang tidak boleh Operasional Gede. Gudang tidak boleh Kas Kecil toko, hanya Kas Kecil gudang.
- BAB 7.3 Matrix, baris Operasional Kecil: Owner ✅, Manager ✅, Kasir ✅, Gudang ✅ (gudang saja). Baris Operasional Gede: Owner ✅ saja, Manager/Kasir/Gudang ❌.

### R. Warning — Sudah di F, Ini Penegasan (TC-031, TC-042)

**v40.1 — Penegasan:** `data.warning` wajib ada di semua response `jual`, `diskon`, `retur_jual`. Boleh `[]` kalau tidak ada warning. Jangan taruh warning di `error`, karena `error` artinya gagal, warning artinya sukses tapi ada catatan.

### S. Foto Multi — Tambah Foto_Barang (BAB 4.3 v40 SINGLE)

**v40:** Master_Barang.foto_url single string, padahal produk bisa multi-foto.

**v40.1 — Tambah tabel:**

**Foto_Barang:**

|Kolom|Tipe|PK/FK|Wajib|Ket|
|---|---|---|---|---|
|foto_id|string|PK|Ya|—|
|barang_id|string|FK → Master_Barang|Ya|—|
|foto_url|string|—|Ya|Drive link.|
|urutan|int|—|Ya|1 = utama, 2, 3, ...|
|is_utama|bool|—|Ya|True kalau urutan = 1.|

- Master_Barang.foto_url tetap ada, untuk backward compat, isinya foto utama (urutan = 1). PWA tampilkan dari Foto_Barang ordered by urutan, bukan dari Master_Barang.foto_url saja.
- Import CSV/XLS: Kolom foto_url di CSV boleh 1 URL (utama) atau JSON array `["url1", "url2"]`. GAS pecah jadi Foto_Barang per URL.
- Auto-resize: GAS resize foto ke 800x800 max, simpan di Drive, return foto_url yang sudah resize. PWA tampilkan resizable (S/M/L) dari foto_url yang sama.

### T. PreOrder Link — Tambah preorder_id / transaction_id (BAB 4.4 v40 GA LINK)

**v40:** PreOrder_Indent ga punya transaction_id, Transaksi_Penjualan ga punya preorder_id. Flow DP PreOrder ga link.

**v40.1 — Tambah:**

- Transaksi_Penjualan.preorder_id (sudah ditambah di E.1): FK → PreOrder_Indent, Opsional. Diisi kalau transaksi ini untuk PreOrder (DP atau pelunasan).
- PreOrder_Indent.transaction_id (sudah ditambah di A6): FK → Transaksi_Penjualan, Opsional. Diisi kalau PreOrder sudah ada transaksi DP.
- Flow:
    1. Customer PreOrder: Buat PreOrder_Indent (status DP, dp_amount > 0, transaction_id = null dulu).
    2. Customer bayar DP: Buat Transaksi_Penjualan (preorder_id diisi, payment_status = PARTIAL, total = dp_amount). Update PreOrder_Indent.transaction_id = transaction_id itu, status tetap DP.
    3. Customer lunasi: Buat Transaksi_Penjualan kedua (preorder_id sama, payment_status = PAID, total = sisa). Update PreOrder_Indent.status = LUNAS.
    4. Customer batal: PreOrder_Indent.status = BATAL, Transaksi_Penjualan DP di-void / refund sesuai BR-RETUR.
- Validasi: PreOrder_Indent.transaction_id dan Transaksi_Penjualan.preorder_id harus konsisten (kalau satu diisi, yang lain harus diisi dan match).

---

## 4. SKOR AKHIR v40.1

|Aspek|v39 Final|v39.1|v40|v40.1|Catatan|
|---|---|---|---|---|---|
|Struktur dokumen|9/10|9/10|9,5/10|**9,5/10**|1 dokumen + 1 patch, P-04 ditegakin.|
|Konsistensi istilah|8,5/10|9/10|8/10|**9,5/10**|AFF dipisah, merchant vs promoter jelas.|
|Data Dictionary|7,5/10|9/10|7,5/10|**9,5/10**|9 tabel gabungan dipecah, audit/sync di-clarify.|
|State Machine|7/10|9/10|7,5/10|**9,5/10**|3 field dipisah, transaction_status ditambah.|
|API Contract|8/10|9,5/10|8/10|**9,5/10**|22 endpoint, read/import/restore + warning.|
|Role & Permission|9/10|9/10|9/10|**9,5/10**|Gudang operasional disamain.|
|Aturan Finansial|9/10|9/10|7,5/10|**9,5/10**|Jurnal AFF bener, Utang AFF ada.|
|Test Case|8,5/10|9/10|9/10|**9,5/10**|42 TC + warning + AFF + Invoice detail.|
|**Kesiapan coding**|7,5/10|9,5/10|8/10|**9,5/10**|**BISA DI-FREEZE.**|

**Verdict v40.1: BISA DI-FREEZE SEBAGAI CODING-READY.**

**Syarat freeze:**

- [ ]  Coder baca v40 + v40.1 ini, bukan v40 saja.
- [ ]  Semua tabel di v40.1 (9 grup yang dipecah, Utang_Merchant_AFF, Foto_Barang, Invoice_Detail, Quotation_Detail, Master_Komplain_Jenis, Master_Merchant_Afiliasi dengan komisi_persen) dibangun sesuai v40.1, bukan v40 lama.
- [ ]  Jurnal AFF baru (B.6) dipakai, bukan jurnal AFF lama di v40 BAB 8.3.
- [ ]  Test case TC-001..042 v40 + cek warning, AFF, Invoice detail, SKU regex, ALL FK, transaction_status, read/import/restore lulus minimal 80% di Fase 1 (1 toko).
- [ ]  Kalau mau nambah fitur, bikin v41, jangan ubah v40.1 yang sudah frozen.

**Catatan penutup:** v40.1 ini adalah patch kecil, sengaja tidak rebuild 10 BAB lagi. v40 + v40.1 = kontrak normatif final. Dokumen v38/v39/v39.1/v39.2 tetap jadi historis, tapi kalau beda, v40.1 menang. Prinsip tetap: Owner siapkan tools + form, logic ngikutin isi form, ERP hitung, PWA simpel, backend lengkap.