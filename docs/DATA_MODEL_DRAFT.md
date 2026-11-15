# Rancangan Skema Data MVP — Draft Diskusi

**Status:** Rancangan logis, belum migration siap production  
**Versi:** 0.1  
**Terkait:** [`TECHNICAL_SPEC.md`](./TECHNICAL_SPEC.md)

Dokumen ini menerjemahkan arah produk yang disepakati ke rancangan tabel awal. Ini masih rancangan logis, bukan SQL yang boleh langsung diterapkan. Adapter penyimpanan pertama belum dipilih; sintaks, transaksi, constraint, dan backup harus disesuaikan serta diuji pada adapter tersebut.

## 1. Keputusan desain

- Semua tabel operasional memiliki `store_id` atau relasi jelas ke toko.
- Owner dapat mengakses semua toko; akses staf ditentukan oleh penugasan toko.
- Harga dihitung dari harga dasar, penyesuaian persentase toko, dan opsional harga khusus produk/varian per toko.
- Harga dan deskripsi barang saat transaksi disalin sebagai snapshot ke item penjualan agar histori tidak berubah.
- Penjualan offline memakai ID transaksi yang dibuat perangkat dan kunci idempotensi. Data di perangkat bukan catatan final server sampai diterima.
- Perubahan stok dicatat sebagai gerakan stok; saldo saat ini merupakan hasil/representasi yang diperbarui bersama gerakan itu.
- Uang disimpan sebagai angka integer rupiah, bukan floating-point.
- Data PIN hanya berupa hash credential; tidak masuk ke backup sebagai PIN asli.

## 2. Notasi

- `PK`: primary key.
- `FK`: foreign key.
- `UNIQUE`: nilai harus unik.
- `NULL`: boleh kosong.
- Timestamp disimpan dalam UTC.
- Jenis ID boleh UUID atau ID unik lain selama seluruh adapter menjamin tidak bentrok. ID transaksi offline harus dapat dibuat tanpa server.

## 3. Tabel identitas dan toko

### `stores`

| Kolom | Tipe logis | Catatan |
|---|---|---|
| `id` | ID, PK | ID cabang |
| `code` | teks, UNIQUE | Kode pendek, mis. `TKO1` |
| `name` | teks | Nama yang tampil |
| `address` | teks, NULL | Alamat |
| `active` | boolean | Cabang aktif |
| `price_adjustment_percent` | decimal | Penyesuaian bawaan cabang; mis. 5 berarti +5% |
| `created_at`, `updated_at` | timestamp | Riwayat |

### `users`

| Kolom | Tipe logis | Catatan |
|---|---|---|
| `id` | ID, PK | ID pengguna |
| `name` | teks | Nama staf |
| `pin_hash` | teks | Hash PIN; tidak pernah plaintext |
| `role` | enum/teks tervalidasi | `OWNER`, `MANAGER`, `CASHIER`, `WAREHOUSE` |
| `active` | boolean | Status pengguna |
| `failed_pin_attempts` | integer | Untuk penguncian sementara |
| `locked_until` | timestamp, NULL | Waktu buka kunci |
| `created_at`, `updated_at` | timestamp | Riwayat |

### `user_stores`

| Kolom | Tipe logis | Catatan |
|---|---|---|
| `user_id` | ID, PK bagian, FK users | Pengguna |
| `store_id` | ID, PK bagian, FK stores | Cabang yang boleh diakses |
| `is_default` | boolean | Cabang awal setelah login |

Owner memiliki akses lintas toko melalui peran; penugasan toko eksplisit dapat tetap dipakai untuk mencatat toko default. Semua akses lintas toko harus diputuskan oleh backend, bukan filter UI.

### `user_sessions`

| Kolom | Tipe logis | Catatan |
|---|---|---|
| `id` | ID, PK | Sesi |
| `user_id` | ID, FK users | Pemilik sesi |
| `token_hash` | teks, UNIQUE | Hanya hash token sesi yang disimpan |
| `expires_at` | timestamp | Kedaluwarsa |
| `revoked_at` | timestamp, NULL | Logout/pencabutan |
| `created_at` | timestamp | Dibuat |

Sesi lokal offline perlu desain terpisah: akses offline dibatasi ke perangkat yang sudah dipercaya, tidak menyimpan PIN plaintext, dan akses sensitif memerlukan autentikasi server saat online.

## 4. Tabel produk dan harga

### `products`

| Kolom | Tipe logis | Catatan |
|---|---|---|
| `id` | ID, PK | ID produk |
| `sku` | teks, UNIQUE | SKU produk/style bila sesuai |
| `name` | teks | Nama produk |
| `category` | teks, NULL | Kategori sederhana |
| `active` | boolean | Status |
| `created_at`, `updated_at` | timestamp | Riwayat |

### `product_variants`

| Kolom | Tipe logis | Catatan |
|---|---|---|
| `id` | ID, PK | ID varian |
| `product_id` | ID, FK products | Produk induk |
| `sku` | teks, UNIQUE | SKU varian |
| `barcode` | teks, UNIQUE, NULL | Barcode bila tersedia |
| `variant_name` | teks, NULL | Nama ringkas |
| `color`, `size` | teks, NULL | Warna/ukuran |
| `active` | boolean | Status |

### `variant_prices`

| Kolom | Tipe logis | Catatan |
|---|---|---|
| `variant_id` | ID, PK bagian, FK product_variants | Varian |
| `store_id` | ID, PK bagian, FK stores | Cabang; harga khusus cabang |
| `base_price` | integer | Harga dasar untuk varian |
| `override_price` | integer, NULL | Jika diisi, menggantikan harga hitungan otomatis |
| `updated_by` | ID, FK users | Pengubah |
| `updated_at` | timestamp | Waktu perubahan |

Rumus harga normal: `override_price` jika tersedia; jika tidak, `round(base_price * (1 + store.price_adjustment_percent / 100))`. Aturan pembulatan harus sama di seluruh adapter dan dicatat pada pengujian. Bila kebutuhan bisnis menghendaki harga dasar per produk, bukan per varian, kolom `base_price` dapat dipindah ke `products`; keputusan ini perlu dibuat sebelum migration.

## 5. Tabel stok

### `stock_balances`

| Kolom | Tipe logis | Catatan |
|---|---|---|
| `store_id` | ID, PK bagian, FK stores | Cabang |
| `variant_id` | ID, PK bagian, FK product_variants | Varian |
| `quantity` | integer | Saldo saat ini, tidak negatif kecuali aturan bisnis mengizinkan |
| `updated_at` | timestamp | Pembaruan terakhir |

### `stock_movements`

| Kolom | Tipe logis | Catatan |
|---|---|---|
| `id` | ID, PK | Gerakan stok |
| `store_id` | ID, FK stores | Cabang |
| `variant_id` | ID, FK product_variants | Varian |
| `movement_type` | teks tervalidasi | `SALE`, `RETURN`, `RECEIPT`, `STOCKTAKE`, `TRANSFER_IN`, `TRANSFER_OUT`, `ADJUSTMENT` |
| `quantity_delta` | integer | Positif menambah, negatif mengurangi |
| `balance_after` | integer | Saldo sesudah gerakan |
| `reference_type`, `reference_id` | teks | Penjualan/retur/opname/transfer terkait |
| `note` | teks, NULL | Alasan singkat |
| `created_by` | ID, FK users | Petugas |
| `created_at` | timestamp | Waktu |

Gerakan stok dan saldo harus diperbarui secara atomik pada adapter yang mendukung transaksi. Untuk adapter tanpa transaksi penuh, implementasi wajib mendefinisikan cara mencegah saldo dan riwayat berbeda.

## 6. Tabel penjualan dan pembayaran

### `sales`

| Kolom | Tipe logis | Catatan |
|---|---|---|
| `id` | ID, PK | Dibuat client agar transaksi dapat diantri offline |
| `store_id` | ID, FK stores | Cabang transaksi |
| `cashier_id` | ID, FK users | Kasir |
| `status` | teks tervalidasi | `COMPLETED`, `VOID_PENDING`, `VOIDED`, `NEEDS_REVIEW` |
| `sync_status` | teks tervalidasi | Server: `RECEIVED`, `NEEDS_REVIEW`; status lokal queue disimpan IndexedDB |
| `subtotal` | integer | Jumlah item sebelum diskon |
| `discount_amount` | integer | Diskon |
| `total` | integer | Total akhir yang disimpan sebagai snapshot |
| `paid_amount` | integer | Total pembayaran yang dicatat |
| `payment_status` | teks tervalidasi | `UNPAID`, `PARTIAL`, `PAID`, `REFUNDED` |
| `client_created_at` | timestamp | Waktu perangkat; untuk urutan/konteks, tidak menggantikan waktu server |
| `server_received_at` | timestamp, NULL | Waktu diterima server |
| `idempotency_key` | teks | UNIQUE bersama `store_id` |
| `payload_hash` | teks | Mendeteksi penggunaan ulang key dengan isi transaksi berbeda |
| `created_at` | timestamp | Waktu server |

### `sale_items`

| Kolom | Tipe logis | Catatan |
|---|---|---|
| `id` | ID, PK | Item |
| `sale_id` | ID, FK sales | Penjualan |
| `variant_id` | ID, FK product_variants | Varian |
| `sku_snapshot` | teks | SKU saat dijual |
| `name_snapshot` | teks | Nama saat dijual |
| `quantity` | integer positif | Jumlah |
| `unit_price` | integer | Harga satuan pada saat jual, termasuk harga cabang |
| `discount_amount` | integer | Diskon item jika ada |
| `line_total` | integer | Total item |

### `payments`

| Kolom | Tipe logis | Catatan |
|---|---|---|
| `id` | ID, PK | Pembayaran |
| `sale_id` | ID, FK sales, NULL | Penjualan terkait jika pembayaran penjualan |
| `receivable_id` | ID, FK receivables, NULL | Tagihan pelanggan jika pembayaran cicilan |
| `store_id` | ID, FK stores | Cabang penerima |
| `method` | teks tervalidasi | Tunai, QRIS, transfer, dan metode yang diaktifkan |
| `amount` | integer positif | Nominal |
| `verification_status` | teks | `NOT_REQUIRED`, `PENDING`, `CONFIRMED`, `REJECTED` |
| `reference_note` | teks, NULL | Referensi yang aman, bukan data rahasia |
| `recorded_by` | ID, FK users | Petugas |
| `created_at` | timestamp | Waktu |

Constraint logis: tepat salah satu dari `sale_id` atau `receivable_id` diisi untuk pembayaran MVP, kecuali kebutuhan pembayaran lain ditambahkan secara eksplisit.

### `approvals`

| Kolom | Tipe logis | Catatan |
|---|---|---|
| `id` | ID, PK | Approval |
| `store_id` | ID, FK stores | Cabang |
| `requested_by` | ID, FK users | Peminta |
| `decided_by` | ID, FK users, NULL | Penyetuju/penolak |
| `target_type`, `target_id` | teks | Mis. sale |
| `reason` | teks | Alasan |
| `status` | teks | `PENDING`, `APPROVED`, `REJECTED` |
| `created_at`, `decided_at` | timestamp | Waktu |

Gunakan hanya untuk diskon besar dan pembatalan transaksi sesuai aturan yang dikonfigurasi.

## 7. Retur

### `returns`

Kolom utama: `id` PK, `sale_id` FK, `store_id` FK, `created_by` FK, `reason`, `resolution` (`EXCHANGE`, `REFUND`, `STORE_CREDIT` jika disetujui), `status`, `total_amount`, `created_at`.

### `return_items`

Kolom utama: `id` PK, `return_id` FK, `sale_item_id` FK, `variant_id` FK, `quantity`, `unit_price_snapshot`, `condition` (`SELLABLE`, `DAMAGED`), `stock_movement_id` FK nullable, `created_at`.

Jumlah retur kumulatif tidak boleh melebihi jumlah item yang dijual dikurangi jumlah yang sudah diretur. Barang `SELLABLE` menambah stok; `DAMAGED` tidak menambah stok jual. Refund tercatat sebagai pembayaran keluar/retur yang dapat ditelusuri; jangan menghapus atau mengubah penjualan asal.

## 8. Piutang dan utang

### `receivables` (piutang pelanggan)

Kolom utama: `id` PK, `store_id` FK, `sale_id` FK UNIQUE, `customer_name` teks (atau customer_id jika modul pelanggan ditambahkan), `total_amount`, `due_date` nullable, `status` (`OPEN`, `PARTIAL`, `PAID`, `CANCELLED`), `created_at`.

Pembayaran piutang ditambahkan sebagai baris di `payments` dengan `receivable_id`; saldo tersisa dihitung dari total dikurangi pembayaran yang dikonfirmasi. Bila perlu cache `remaining_amount`, nilainya harus diperbarui atomik dan dapat direkonsiliasi dari histori pembayaran.

### `payables` (utang pemasok)

Kolom utama: `id` PK, `store_id` FK, `supplier_name` teks (atau supplier_id), `reference_note`, `total_amount`, `due_date` nullable, `status` (`OPEN`, `PARTIAL`, `PAID`, `CANCELLED`), `created_at`.

### `payable_payments`

Kolom utama: `id` PK, `payable_id` FK, `amount`, `method`, `recorded_by` FK, `created_at`.

Pembayaran pemasok harus memiliki histori terpisah. Total pembayaran tidak boleh melebihi saldo, kecuali dicatat sebagai pengembalian dana yang eksplisit.

## 9. Stok opname

### `stocktakes`

Kolom utama: `id` PK, `store_id` FK, `created_by` FK, `status` (`DRAFT`, `POSTED`, `NEEDS_REVIEW`), `note`, `created_at`, `posted_at` nullable.

### `stocktake_items`

Kolom utama: `id` PK, `stocktake_id` FK, `variant_id` FK, `system_quantity`, `counted_quantity`, `difference`, `reason`, `created_at`.

Pada saat posting, simpan snapshot stok sistem, catat selisih, buat gerakan `STOCKTAKE`, dan perbarui saldo. Perubahan saldo harus atomik. Selisih besar diberi `NEEDS_REVIEW`; sesuai usulan produk, koreksi tetap tercatat agar stok sesuai hitungan, sementara owner/manager mendapat penanda untuk memeriksa.

## 10. Dokumen

Untuk tahap awal, dokumen dapat dirender dari sumber transaksi tanpa tabel `documents` terpisah. Jika perlu menyimpan metadata cetak:

### `document_records` (opsional)

`id`, `store_id`, `document_type` (`RECEIPT`, `INVOICE`, `PAYMENT_RECEIPT`, `DELIVERY_NOTE`, `RETURN_NOTE`), `reference_type`, `reference_id`, `document_number`, `created_by`, `created_at`.

Dokumen memuat snapshot nomor/nama/alamat toko dan data transaksi yang diperlukan. Nomor dokumen harus unik per toko dan jenis/periode sesuai aturan yang disepakati. Isi dokumen dibuat dari data nyata, termasuk penanda transaksi yang belum tersinkron bila dicetak offline.

## 11. Sinkronisasi offline

### Di perangkat (IndexedDB)

`offline_sales_queue` menyimpan: `sale_id`, `store_id`, `client_created_at`, `schema_version`, `payload`, `status` (`PENDING`, `SENDING`, `SYNCED`, `FAILED`, `NEEDS_REVIEW`), `retry_count`, `last_error_code`, `server_received_at`.

Queue adalah data milik perangkat; tidak harus menjadi tabel backend. Backend menyimpan penjualan yang diterima serta hasil idempotency.

### Backend `idempotency_records`

Kolom: `store_id`, `idempotency_key`, `payload_hash`, `response_json` atau referensi hasil, `created_at`; UNIQUE (`store_id`, `idempotency_key`). Retensi key harus sekurangnya selama periode retry offline yang ditetapkan.

Jika key sama dan payload sama, kembalikan hasil transaksi semula. Jika key sama tetapi payload berbeda, tolak dan tandai untuk pemeriksaan.

## 12. Audit dan laporan

### `audit_logs`

Kolom: `id` PK, `user_id` FK nullable untuk aksi sistem, `store_id` FK nullable, `action`, `entity_type`, `entity_id`, `created_at`, `summary` tanpa PIN/token/secret.

Laporan dasar sebaiknya dihitung dari sales, payments, stock movements, returns, dan stocktakes. Laporan yang disimpan/cached hanya optimasi; data transaksi sumber tetap otoritatif.

## 13. Backup dan restore

Backup meliputi data bisnis, produk/harga, cabang, pengguna/role, stok, transaksi, pembayaran, retur, tagihan, opname, approval, dan audit yang dibutuhkan. Jangan mengekspor PIN plaintext, token sesi aktif, atau API secret. Hash credential perlu kebijakan eksplisit; rekomendasi awal adalah ekspor hash hanya jika pemulihan pengguna memang diizinkan, jika tidak buat pengguna login ulang/reset PIN setelah restore.

Backup/restore dijalankan melalui alat yang sesuai adapter terpilih. Restore perlu konfirmasi, validasi file, dan backup kondisi sebelum restore. Prosedur wajib diuji secara berkala.

## 14. Constraint dan aturan konsistensi wajib

1. UNIQUE: store code, user/store assignment, SKU, barcode jika ada, stock balance per store/variant, idempotency key per store, nomor dokumen dalam cakupan yang dipilih.
2. FK untuk semua relasi transaksi; jangan menghapus produk/toko yang sudah punya transaksi—nonaktifkan saja.
3. Kuantitas item, harga, nominal pembayaran, dan jumlah retur harus tervalidasi positif/non-negatif sesuai makna kolom.
4. Penjualan + item + pembayaran + gerakan stok + idempotency result ditulis sebagai satu operasi konsisten pada adapter yang mendukung transaksi.
5. Pembayaran, retur, dan gerakan stok tidak dihapus untuk memperbaiki kesalahan; gunakan reversal/record pembalik yang bisa diaudit.
6. Scope toko dicek di server untuk setiap read/write, termasuk ID yang dikirim client.
7. Client tidak menjadi penentu harga akhir online. Saat offline, harga snapshot dari cache disimpan dan server menentukan status final/review saat sync.
8. Jam perangkat tidak dipercaya untuk urutan audit; gunakan waktu penerimaan server untuk waktu resmi.

## 15. Belum diputuskan sebelum migration SQL

Rancangan SQL final jangan dibuat sebelum hal berikut disepakati:

1. Adapter pertama yang akan didukung (GAS/Sheets memiliki kemampuan transaksi dan constraint berbeda dari PostgreSQL).
2. Apakah harga dasar berada pada produk atau varian; rancangan ini sementara menaruhnya di varian.
3. Nilai persentase cabang, aturan pembulatan, dan apakah override harga SKU/toko diperlukan sejak awal.
4. Kebijakan harga offline: pertahankan snapshot dan minta review, atau blokir barang jika cache terlalu lama.
5. Batas diskon/refund/opname besar, tanpa menambahkan approval untuk operasi normal.
6. Identitas customer/supplier: nama bebas cukup untuk awal, atau perlu data master terpisah.
7. Apakah saldo toko sebagai solusi retur benar-benar dibutuhkan.
8. Format nomor transaksi/dokumen dan kebutuhan pencetakan offline.

**Langkah berikutnya:** setelah adapter pertama dan tujuh aturan bisnis di atas disepakati, terjemahkan rancangan ini ke migration adapter tersebut dan tambahkan test untuk transaksi, retur, pembayaran, opname, serta sinkronisasi offline.
