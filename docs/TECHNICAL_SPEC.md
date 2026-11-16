# ERP PWA Toko Baju UMKM — Spesifikasi Teknis

Versi: 0.4  
Status: Draft Publik  
Repo: `emailmercyzone-glitch/ERP-PWA-Toko-Baju-`  
Tujuan: Menjabarkan arah produk, kebutuhan bisnis, dan arsitektur teknis awal dari sistem ERP PWA untuk UMKM toko baju.

> Dokumen ini berfungsi sebagai spesifikasi arah kerja dan kesepakatan produk awal. Fokus utama adalah menyederhanakan proses operasional, menjaga keamanan dasar, dan memastikan sistem bisa digunakan secara cepat oleh kasir, owner, dan manager.

## 1. Ringkasan Proyek

ERP PWA Toko Baju UMKM adalah platform operasional retail yang dirancang untuk membantu usaha pakaian dan toko fashion menjalankan aktivitas harian seperti:
- penjualan,
- stok,
- laporan kas dan produk,
- transaksi offline,
- proses approval dasar,
- monitoring cabang / toko.

Aplikasi ini ditujukan untuk toko baju kecil sampai menengah yang membutuhkan sistem operasional sederhana namun tetap bisa tumbuh seiring kebutuhan bisnis.

## 2. Tujuan Produk

Tujuan utama aplikasi:
- mempercepat proses transaksi di kasir,
- memudahkan pengelolaan stok per cabang,
- menyediakan laporan dasar penjualan dan performa toko,
- menjaga data tetap aman dan dapat dipulihkan,
- memungkinkan operasional tetap berjalan saat jaringan terganggu,
- mengurangi beban kerja administrasi yang berkepanjangan.

## 3. Prinsip Utama

### 3.1 Offline-first
Sistem harus tetap dapat digunakan saat koneksi internet terputus atau tidak stabil. Saat offline:
- kasir tetap bisa mencatat transaksi,
- data disimpan di perangkat lokal,
- status transaksi ditampilkan secara jelas,
- transaksi diproses ulang saat koneksi kembali.

### 3.2 Sederhana dan cepat
UI dan alur kerja harus terasa seperti aplikasi kasir modern, bukan software ERP yang terlalu kompleks dan membingungkan.

### 3.3 Keamanan dasar
Sistem harus memiliki perlindungan dasar seperti:
- validasi input,
- sanitasi input server-side,
- batasan rate limiting,
- log aktivitas penting,
- tidak membocorkan detail internal ke client.

### 3.4 Database fleksibel
Aplikasi didesain agar backend dapat beradaptasi dengan berbagai jenis penyimpanan, termasuk:
- PostgreSQL,
- Google Apps Script / Google Sheets,
- atau solusi lain sesuai kebutuhan deployment.

## 4. Target Pengguna

### 4.1 Owner
- melihat ringkasan toko dan cabang,
- mengawasi performa penjualan,
- mengecek stok berisiko,
- menyetujui tindakan sensitif.

### 4.2 Manager
- mengawasi cabang tertentu,
- menilai performa dan kebutuhan stok,
- mengecek aktivitas operasional.

### 4.3 Kasir
- input transaksi,
- proses pembayaran,
- cetak/lihat struk,
- menangani transaksi harian.

### 4.4 Gudang
- kelola stok masuk dan keluar,
- memvalidasi penerimaan barang,
- meninjau pergerakan stok.

## 5. Fitur MVP

Fitur utama yang masuk dalam MVP:
1. Login dengan PIN
2. Multi-toko
3. Produk dan varian
4. Harga per produk dan cabang
5. Stok per cabang
6. POS penjualan
7. Pembayaran
8. Cek stok saat checkout
9. History transaksi
10. Laporan dasar penjualan dan stok
11. Queue transaksi offline
12. Backup dan restore dasar
13. Approval dasar
14. Audit log sederhana

Fitur yang tidak wajib di MVP:
- Gemini AI
- payroll detail
- e-faktur / PPN kompleks
- konsinyasi penuh
- modul bisnis sangat kompleks
- banyak approval yang menghambat operasional harian

## 6. Scope Produk yang Disederhanakan

### 6.1 POS dan penjualan
Fungsi utama:
- cari produk,
- tambah ke keranjang,
- ubah kuantitas,
- hitung total otomatis,
- pilih metode pembayaran,
- simpan transaksi,
- lihat/cetak struk.

### 6.2 Stok
Fungsi utama:
- lihat stok per cabang,
- penerimaan barang,
- pengurangan stok saat penjualan,
- opname stok,
- mutasi antar cabang.

### 6.3 Laporan
Laporan yang disediakan minimal:
- omzet harian per toko,
- jumlah transaksi,
- produk terlaris,
- stok menipis,
- trend penjualan.

## 7. Workflow Approval

Approval disarankan hanya digunakan pada kondisi yang benar-benar penting, misalnya:
1. diskon besar,
2. void / pembatalan transaksi,
3. transaksi dengan risiko operasional tinggi.

Tujuan:
- menjaga alur kasir tetap cepat,
- tetap memberikan pengawasan untuk transaksi kritis.

## 8. Offline-first dan Sinkronisasi

### 8.1 Saat online
- transaksi dibuat dan dikirim ke server secara langsung.

### 8.2 Saat offline
- transaksi disimpan di perangkat lokal,
- status transaksi ditampilkan,
- item dapat tetap diproses.

### 8.3 Saat koneksi kembali
- antrian transaksi dikirim ulang ke server,
- server memvalidasi data,
- status final keputusan ada di server.

### 8.4 Status transaksi yang disarankan
- Draft
- Menunggu kirim
- Terkirim
- Gagal
- Butuh review

## 9. Keamanan Dasar

Keamanan minimal yang disarankan:
- PIN tidak disimpan dalam bentuk plaintext,
- session login memiliki masa berlaku,
- percobaan PIN salah dibatasi,
- input user diproses dan divalidasi di server,
- akses per cabang dibatasi,
- error internal tidak dibocorkan ke client,
- secret seperti API key tidak disimpan di frontend.

## 10. Arsitektur Sistem

```text
Frontend PWA (React + TypeScript)
├─ UI POS dan dashboard
├─ IndexedDB untuk antrian offline
├─ cache lokal dan state UI
└─ akses API

Backend API (Express / Node.js)
├─ autentikasi dan otorisasi dasar
├─ validasi request
├─ logika bisnis produk dan penjualan
├─ approval dasar
├─ laporan sederhana
├─ backup dan audit
└─ integrasi AI opsional

Storage Layer
├─ PostgreSQL (opsi utama untuk deployment serius)
├─ Google Apps Script / Google Sheets (opsi fleksibel)
├─ penyimpanan lain sesuai kebutuhan
└─ adapter yang bisa disesuaikan
```

## 11. Data dan Model Bisnis

Sistem harus bekerja dengan model data yang terstruktur, termasuk:
- master barang,
- master toko,
- master harga,
- stok per toko,
- pelanggan / member,
- transaksi penjualan,
- detail transaksi,
- approval,
- log audit,
- backup / restore.

Model bisnis yang penting:
- satu produk bisa memiliki banyak varians,
- satu toko bisa memiliki stok sendiri,
- harga bisa berbeda antar toko atau kelas toko,
- transaksi harus memiliki traceability dan audit trail.

## 12. Kriteria Sukses MVP

MVP dianggap selesai dan layak untuk diuji bila:
- kasir dapat menjual dengan lancar online maupun offline,
- stok berubah dengan benar saat transaksi valid,
- transaksi tidak duplikat saat retry,
- laporan dasar dapat ditampilkan,
- backup dapat dibuat dan dipulihkan,
- approval untuk diskon besar dan void berfungsi,
- owner mampu melihat ringkasan performa bisnis.

## 13. UX yang Disarankan

### 13.1 Untuk kasir
Antarmuka kasir harus fokus pada:
- pencarian produk,
- penambahan ke keranjang,
- hitung total otomatis,
- pembayaran,
- struk.

### 13.2 Untuk owner
Owner perlu melihat:
- omzet hari ini,
- jumlah transaksi,
- stok berisiko,
- ringkasan toko dan cabang.

### 13.3 Untuk laporan
Laporan dibuat dalam format ringkas dan mudah dibaca, bukan laporan akuntansi yang terlalu kompleks.

## 14. Prioritas Implementasi

Urutan implementasi yang disarankan:
1. login dasar + role + multi-toko,
2. produk + stok + harga,
3. POS + pembayaran + validasi,
4. transaksi offline + queue sync,
5. laporan dasar,
6. approval dasar,
7. backup dan restore,
8. fitur tambahan setelah core stabil.

## 15. Fitur yang Ditunda

Fitur yang disarankan ditunda sampai MVP stabil:
- Gemini AI,
- modul payroll detail,
- laporan keuangan kompleks,
- e-faktur formal,
- integrasi WhatsApp yang terlalu berlebihan,
- ERP framework yang terlalu rumit untuk kebutuhan UMKM.

## 16. Status Saat Ini

Saat ini, repo ini berstatus sebagai:
- prototype,
- MVP foundation,
- belum sepenuhnya production-ready,
- masih cocok untuk pengembangan internal, evaluasi, dan iterasi awal.

## 17. Catatan Akhir

Tujuan utama produk ini bukan membangun ERP yang “terlalu besar” atau “terlalu kompleks”. Target utamanya adalah membuat sistem toko baju yang:
- mudah dipakai,
- cepat dalam operasional harian,
- aman secara dasar,
- jelas bagi owner dan kasir,
- siap berkembang saat kebutuhan bisnis meningkat.

Dengan pendekatan ini, sistem tetap relevan untuk usaha kecil dan menengah tanpa membebani pengguna dengan lapisan teknologi yang terlalu rumit di tahap awal.
