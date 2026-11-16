# ERP PWA Toko Baju UMKM — Spesifikasi Teknis

Versi: 0.5  
Status: Draft Fokus Arsitektur  
Repo: `emailmercyzone-glitch/ERP-PWA-Toko-Baju-`  
Tujuan: Menetapkan keputusan arsitektur inti sebelum implementasi lebih lanjut, agar MVP tetap realistis untuk UMKM dan tidak terjebak membangun ERP korporat yang berat.

> Dokumen ini merangkum keputusan yang sudah dipastikan untuk menjaga keseimbangan antara kecepatan kasir, keamanan, dan stabilitas data. Fokus utama bukan memperluas fitur, melainkan memastikan core workflow retail bisa berjalan dengan benar.

## 1. Ringkasan Keputusan Arsitektur

Keputusan paling sehat untuk MVP saat ini adalah:

- Multi-toko dari awal
- Offline-first sebagai prinsip operasional, bukan fitur tambahan
- Server tetap menjadi sumber kebenaran harga, stok, dan status final transaksi
- UX kasir dipisahkan dari UX owner
- Approval hanya untuk transaksi kritis: diskon besar dan void
- Gemini AI ditunda sampai core workflow stabil
- MVP harus tetap ramping dan realistis untuk UMKM, bukan ERP korporat

## 2. Prinsip Operasional Utama

### 2.1 Offline-first adalah keharusan
Untuk toko baju di area dengan jaringan tidak stabil, offline-first bukan opsi. Ini harus masuk dalam daun keputusan architecture. Saat offline:
- kasir tetap bisa menginput transaksi,
- data disimpan di perangkat lokal,
- transaksi tidak dianggap final sampai sync ke server,
- status transaksi jelas: Menunggu Sinkronisasi, Terkirim, Gagal, atau Butuh Review.

### 2.2 Server adalah sumber kebenaran
Semua keputusan final yang terkait harga, stok, status transaksi, dan validasi bisnis harus disetujui oleh server. Client hanya berperan sebagai interface input dan display state.

### 2.3 UX kasir dan owner beda
- Kasir membutuhkan kecepatan dan fokus pada transaksi.
- Owner membutuhkan ringkasan performa dan kontrol penting.
- UI harus memisahkan kebutuhan ini agar tidak semua fitur dibawa ke satu layar.

### 2.4 Approval hanya untuk tindakan kritis
Approval tidak dipakai untuk seluruh transaksi. Fokusnya terbatas pada kondisi berikut:
1. diskon besar,
2. void / pembatalan transaksi,
3. konflik stok atau status transaksi yang belum jelas.

## 3. Keputusan yang Sudah Disepakati

| Aspek | Keputusan |
|---|---|
| Jumlah toko | Multi-toko dari awal |
| Login | PIN untuk akses cepat dan sederhana |
| Offline | Wajib dalam MVP |
| Validasi final | Server sebagai sumber kebenaran |
| AI Gemini | Ditunda |
| Approval | Hanya untuk kondisi kritis |
| UI | Kasir dan owner dipisah |
| Scope | Realistis untuk UMKM, bukan ERP korporat |

## 4. Risiko Terbesar yang Harus Diputus Sebelum Maju

### 4.1 Adapter database bukan sekadar soal storage
Fleksibilitas adapter terdengar menarik, tetapi pada implementasi nyatanya tidak semua storage memiliki kemampuan yang sama. Ini harus dibedakan secara jelas.

Kita perlu membedakan antara:
- adapter yang mendukung transaksi atomik dan concurrent write,
- adapter yang hanya cocok untuk penyimpanan ringan atau file-based workflow,
- adapter yang hanya cocok sebagai deployment kecil / demo / single-store.

### 4.2 Capability Matrix untuk database adapter
Sebelum menganggap satu adapter setara dengan adapter lain, harus ada matrix capability. Contohnya:

| Capability | PostgreSQL | Google Sheets / GAS | Catatan |
|---|---|---|---|
| Transaksi atomik | Ya | Tidak | Sangat penting untuk stok dan penjualan |
| Concurrent write aman | Ya | Lemah / perlu locking custom | Risiko race condition nyata |
| Audit trail kuat | Ya | Terbatas | Harus disusun manual |
| Backup / restore | Sangat kuat | Terbatas | Beda sangat signifikan |
| Skala multi-cabang | Baik | Terbatas | Tak cocok untuk toko yang terus tumbuh |
| Risiko data corruption | Rendah | Lebih tinggi | Harus diwaspadai |

Kesimpulan yang paling sehat:
- Untuk MVP, PostgreSQL harus diposisikan sebagai sumber kebenaran utama.
- Google Sheets / GAS bisa dipertimbangkan sebagai opsi terbatas untuk deployment kecil, bukan sebagai adapter setara yang menggantikan transaksi multi-user.
- Jika tetap dipakai, itu harus dianggap sebagai deployment khusus dan bukan solusi default untuk multi-toko dengan transaksi real-time.

### 4.3 Offline + stok + harga harus memiliki aturan konflik yang jelas
Ini adalah titik yang paling kritis. Ketiga elemen ini saling bertentangan jika tidak didefinisikan dengan jelas.

Aturan yang disepakati:
- Harga offline disimpan sebagai snapshot dari device saat transaksi dibuat.
- Stok offline dihitung berdasarkan stok terakhir yang diketahui device.
- Saat sync, server mengecek stok dan harga terbaru.
- Jika harga atau stok berubah sejak transaksi dibuat, status transaksi berubah menjadi Butuh Review, bukan final.
- Server tetap memutuskan apakah transaksi diterima, ditolak, atau perlu approval tambahan.

## 5. Alur Offline yang Disarankan

### 5.1 Saat online
- transaksi dibuat biasa,
- data dikirim ke server,
- server validasi harga, stok, dan hak akses,
- transaksi tampil final jika valid.

### 5.2 Saat offline
- kasir tetap bisa mencatat penjualan,
- transaksi disimpan dengan ID unik (idempotency key),
- status awal = Menunggu Sinkronisasi,
- server tidak langsung menganggap transaksi valid.

### 5.3 Saat koneksi kembali
- antrian transaksi dikirim ke server,
- server mengecek stok terbaru, harga berlaku, dan validitas user,
- hasil status:
  - Terkirim
  - Ditolak
  - Butuh Review
  - Gagal

### 5.4 Peraturan penting
- Setiap transaksi offline harus punya ID unik.
- Server harus menyimpan idempotency key untuk menghindari duplikasi.
- Waktu final harus memakai waktu server, sedangkan waktu lokal tetap disimpan untuk audit.
- Device yang sudah offline tetap harus memiliki mekanisme expiry masa validasi sesi, agar tidak memperpanjang sesi tak terbatas.

## 6. Aturan Harga dan Stok

### 6.1 Harga
Saat offline, transaksi menggunakan snapshot harga yang tampil di device. Namun:
- jika harga berubah sebelum sync,
- atau harga yang dibeli tidak sesuai dengan harga server,
- maka transaksi masuk Butuh Review.

### 6.2 Stok
Saat offline, stok yang ditampilkan bisa ketinggalan. Saat sync, server mengecek stok real-time. Jika stok tidak mencukupi:
- transaksi tidak langsung dipaksakan final,
- status masuk Butuh Review,
- manager dapat memutuskan apakah diterima, ditolak, atau ditangani dengan langkah khusus.

### 6.3 Konflik stok yang perlu didefinisikan lebih lanjut
Konflik stok saat ada dua kasir menjual barang yang sama pada waktu bersamaan. Solusi yang paling realistis:
- server mengutamakan validasi final,
- transaksi yang sebelumnya dibuat offline tetap masuk antrian,
- jika konflik terjadi, transaksi yang paling dulu valid di server yang menang,
- transaksi lain masuk Butuh Review atau gagal.

## 7. PIN dan Keamanan Akses

PIN untuk UMKM terbukti cepat dan masuk akal, tetapi harus ditata agar tidak terlalu rapuh.

### 7.1 Aturan minimum yang disarankan
- PIN minimal 6 digit, bukan 4 digit
- lockout setelah beberapa percobaan salah (misal 5 kali)
- cooldown waktu setelah lockout
- logout otomatis saat idle (misal 10–15 menit)
- owner dan kasir punya kebijakan PIN yang berbeda
- PIN tidak boleh menggunakan pola umum seperti 123456, tanggal lahir, atau kombinasi yang jelas

### 7.2 Kompensasi keamanan
Terapkan berikut ini untuk menjaga PIN tetap usable:
- rate limit per device dan per user,
- lockout per device,
- sesi kasir dengan timeout pendek,
- validasi ulang saat kembali online setelah periode offline tertentu.

## 8. Scope MVP yang Lebih Realistis

Daftar fitur MVP yang terlalu berat untuk dikerjakan sekaligus harus dipotong ke urutan prioritas yang lebih masuk akal.

### Fase 0 — inti yang harus jalan dulu
1. Login PIN + role dasar
2. Multi-toko
3. Produk + varian
4. POS online
5. Stok berkurang benar saat valid
6. Histori transaksi

### Fase 1 — yang bikin sistem beda
7. Offline queue + sync
8. Laporan dasar per toko
9. Status transaksi sinkronisasi dan review

### Fase 2 — kontrol operasional
10. Approval diskon besar dan void
11. Audit log sederhana
12. Backup / restore dasar dan teruji

Ini lebih masuk akal daripada menaruh semua hal sekaligus di awal. Core workflow retail harus stabil dulu sebelum menambah kontrol yang kompleks.

## 9. Definisi Bisnis yang Harus Ditetapkan Secepatnya

Beberapa definisi ini berdampak besar pada coding dan laporan:

- Omzet: gross atau net setelah diskon?
- Diskon besar: nominal atau persen? Berapa plafonnya?
- Stok menumpuk: threshold berapa hari?
- Void: beda dengan refund / retur barang?
- Metode pembayaran: cash, QRIS, transfer, split payment?
- Struk: berbasis scanner SKU atau pencarian nama produk?

Tanpa definisi ini, laporan bisa berbeda antara kasir dan owner, dan trust terhadap sistem turun.

## 10. Prinsip Keselamatan Data

Konsep berikut harus dijaga selama pengembangan:
- manual backup tidak sama dengan backup yang bisa dipulihkan dengan benar,
- log yang tidak bisa diverifikasi bukan audit log yang berguna,
- validasi luar tidak boleh menggantikan validasi bisnis yang sebenarnya,
- server harus menjadi satu-satunya penentu final state untuk penjualan dan stok.

## 11. Status MVP yang Sehat

MVP yang realistis harus fokus pada hal berikut:
- proses penjualan utama jalan lancar,
- stok berkurang sesuai transaksi valid,
- offline memiliki status dan aturan review yang jelas,
- approval hanya untuk kejadian kritis,
- owner mendapat ringkasan yang berguna,
- kasir tidak dibebani flow yang terlalu kompleks.

## 12. Catatan Akhir

Tujuan utama produk ini bukan membangun ERP yang berlapis-lapis. Tujuan utamanya adalah membangun sistem toko baju yang:
- adil untuk kasir,
- wajar untuk owner,
- aman secara dasar,
- cukup kuat untuk operasional harian,
- siap berkembang secara bertahap tanpa mengorbankan integritas data.

Dengan keputusan ini, MVP tetap realistis untuk UMKM dan tidak menggantungkan seluruh arsitektur pada adapter yang tidak setara secara kapasitas.
