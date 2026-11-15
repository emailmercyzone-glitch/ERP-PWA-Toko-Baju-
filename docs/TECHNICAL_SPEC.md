# ERP PWA Toko Baju UMKM — Spesifikasi Teknis Final Draft

**Versi:** 0.3  
**Status:** Draft final untuk diskusi produk dan arsitektur awal  
**Repo:** `emailmercyzone-glitch/ERP-PWA-Toko-Baju-`  
**Tujuan:** Menyelaraskan produk, UX, dan kebutuhan teknis sebelum implementasi fitur inti.

> Dokumen ini merupakan versi yang lebih sederhana dan lebih berorientasi pada kebutuhan UMKM. Fokus utama adalah product usability, keamanan dasar, data tetap aman, proses penjualan yang cepat, serta sistem yang mudah dioperasikan dan dipulihkan.

## 1. Ringkasan proyek

ERP PWA untuk UMKM toko baju dengan fokus pada operasional harian yang sederhana, cepat, dan jelas. Aplikasi harus memungkinkan toko multi-cabang menggunakan satu sistem dengan akses yang dibatasi sesuai cabang dan peran pengguna.

Tujuan utama aplikasi:

- Penjualan cepat melalui POS.
- Kelola stok per cabang.
- Laporan sederhana per toko dan gabungan.
- Akses data sesuai cabang dan level pengguna.
- Data aman dan bisa dibackup/restore.
- Transaksi tetap bisa diproses saat jaringan terputus.

Aplikasi ini dibuat untuk kalangan terbatas dan data dikelola di server sendiri. Oleh karena itu, fokus utama adalah kemudahan penggunaan, keamanan dasar, dan stabilitas operasional.

## 2. Keputusan yang sudah disepakati

| Aspek | Keputusan |
|---|---|
| Jumlah toko | Multi-toko |
| Login | PIN |
| Database | Pilihan adapter sesuai kebutuhan user / deployment; tidak dipaksa ke satu teknologi di code-level |
| AI Gemini | Ditunda setelah fitur inti stabil |
| Offline penjualan | Wajib di MVP |
| Fokus UI/UX | Minimalis, bersih, premium, sederhana, tidak terlalu banyak istilah teknis |
| Fokus bisnis | Singkat, jelas, tidak terlalu banyak lapisan/proses yang menghambat operasional |

## 3. Prinsip utama sistem

### 3.1 Offline-first untuk penjualan

Aplikasi harus bisa dipakai saat jaringan tidak stabil atau tidak ada internet. Saat itu:

- kasir tetap bisa membuat transaksi dari aplikasi
- transaksi disimpan di perangkat lokal menggunakan IndexedDB
- status transaksi ditampilkan dengan jelas: menunggu kirim, terkirim, gagal
- saat internet kembali, aplikasi otomatis menyinkronkan transaksi ke server
- transaksi baru dinyatakan final setelah server menerima dan memvalidasi

Peran server tetap paling penting. Server memvalidasi harga, stok, hak akses, dan status transaksi. Data lokal adalah pendukung saat offline, bukan sumber kebenaran utama.

### 3.2 Database bukan hal yang dipaksakan

User boleh memilih cara penyimpanan data berdasarkan kebutuhan dan infrastruktur mereka. Rancangan aplikasi harus dibuat agar backend bisa menggunakan pilihan seperti:

- PostgreSQL
- Google Apps Script / Google Sheets (jika memang dipilih)
- penyimpanan lain yang sesuai kebutuhan di masa depan

Yang penting adalah:

- pola bisnis tetap sama untuk semua adapter
- semua pilihan harus memiliki validasi, backup, dan restore yang jelas
- kita tidak mengharuskan user memakai satu teknologi tertentu jika belum ada keputusan kuat

### 3.3 UX sederhana seperti aplikasi sehari-hari

UI aplikasi harus terasa seperti aplikasi kasir modern, bukan software ERP yang terlalu “korporat”.

Contoh arah UX:

- halaman kasir cepat dan fokus ke transaksi
- daftar produk cepat dicari, mudah ditambah ke keranjang
- tombol bayar jelas, proses checkout singkat
- laporan ringkas dan mudah dibaca
- owner melihat ringkasan bisnis dengan cepat
- tidak memakai istilah teknis di layar jika bisa diganti dengan istilah yang umum dipahami

## 4. Ringkasan fitur MVP

Fitur inti yang masuk MVP:

1. Login dengan PIN
2. Multi-toko
3. Produk & varian
4. Harga per produk / cabang
5. Stok per cabang
6. POS penjualan
7. Pembayaran
8. Cek stok saat checkout
9. Histori transaksi
10. Laporan dasar penjualan dan stok
11. Offline queue untuk penjualan
12. Backup dan restore
13. Approval dasar untuk kondisi tertentu
14. Audit sederhana: siapa melakukan apa dan kapan

Fitur yang tidak wajib di MVP:

- Gemini AI
- payroll detail
- e-faktur/PPN kompleks
- konsinyasi/afiliasi penuh
- module bisnis yang terlalu berat dan rumit
- banyak approval yang menghambat kerja harian

## 5. Struktur user dan akses

### 5.1 Peran awal

| Peran | Fokus utama |
|---|---|
| Owner | Overview toko, laporan gabungan, control, approval penting |
| Manager | Mengawasi cabang yang ditugaskan |
| Kasir | Input penjualan, pembayaran, transaksi harian |
| Gudang | Stok dan pergerakan stok |

### 5.2 Aturan keamanan dasar

- PIN hanya ada di server dan disimpan dengan metode aman.
- Setiap login harus menghasilkan sesi yang valid dan memiliki waktu kedaluwarsa.
- Peran dan cabang ditentukan di server, bukan dikirim dari frontend sebagai nilai yang dipercaya.
- Setiap operasi penting harus divalidasi oleh backend.
- Log aktivitas sensitif disimpan tanpa menampilkan PIN, token, atau secret.

## 6. Scope produk yang disederhanakan

### 6.1 POS & penjualan

Fungsi utama:

- cari produk
- tambah ke keranjang
- ubah qty
- hitung total otomatis
- pilih metode pembayaran
- simpan transaksi
- cetak/lihat struk
- transaksi bisa ditahan saat offline dan dikirim setelah online

### 6.2 Stok

Fungsi utama:

- lihat stok per cabang
- penerimaan barang
- penjualan mengurangi stok
- opname sederhana
- mutasi antar cabang jika dibutuhkan

### 6.3 Laporan

Laporan yang cukup di MVP:

- omzet harian per toko
- jumlah transaksi
- produk terlaris
- stok menumpuk
- penjualan per periode

Laporan tidak perlu terlalu kompleks di awal. Yang penting mudah dibaca dan cepat dipahami.

## 7. Approval yang masuk MVP

Untuk menjaga workflow tetap cepat dan tidak terlalu berbelit, approval hanya dilakukan untuk kondisi kritis berikut:

1. **Diskon besar** di atas batas yang telah ditentukan
2. **Void / pembatalan transaksi** yang sudah selesai

Yang tidak perlu masuk MVP:

- approval transfer antar toko
- approval opname stok kecil
- approval untuk beberapa proses operasional kecil lainnya

Tujuannya agar alur kasir tetap lancar, tapi transaksi penting tetap punya kontrol.

### Aturan yang disarankan

- Kasir bisa input transaksi biasa tanpa approval.
- Jika diskon melebihi batas, approval harus masuk.
- Jika transaksi dibatalkan, approval perlu sesuai kebijakan.
- Semua approval dicatat dan bisa dilihat di riwayat.

## 8. Offline-first dan sinkronisasi

### 8.1 Cara kerja

Saat internet tersedia:

- transaksi dibuat biasa
- data dikirim ke server secara langsung

Saat jaringan terputus:

- transaksi ditulis ke IndexedDB
- status ditampilkan: menunggu terkirim
- item tetap bisa ditambah dan dibayar di aplikasi

Saat koneksi kembali:

- aplikasi mengirim antrian transaksi ke server
- server mulai validasi satu per satu
- server mengembalikan status: sukses, gagal, atau butuh review

### 8.2 Status yang disarankan

- Draft (belum dikirim)
- Menunggu kirim
- Terkirim
- Gagal
- Butuh review

### 8.3 Prinsip penting

- transaksi tidak boleh terduplikasi saat retry
- server menjadi penentu final status
- aplikasi tidak menganggap transaksi selesai hanya karena sudah ditulis di perangkat
- ada log yang bisa dilihat untuk klarifikasi jika ada konflik

## 9. Keamanan dasar yang wajib ada

Karena aplikasi akan dipakai untuk bisnis nyata, beberapa hal wajib ada meski tidak terlalu rumit:

- PIN tidak disimpan sebagai plain text
- session login memiliki batas waktu
- percobaan login salah dibatasi
- input user disanitasi di server
- akses per cabang dibatasi
- API tidak membocorkan error internal ke client
- secret seperti API key Gemini hanya ada di sisi server
- backup harus aman dan mudah dipulihkan

## 10. Rancangan arsitektur yang sederhana

```text
Frontend PWA (React + TypeScript)
  ├─ UI POS dan dashboard
  ├─ IndexedDB untuk queue offline
  └─ storage lokal sementara untuk transaksi yang belum terkirim

Backend API (Express / Node.js)
  ├─ autentikasi / session / PIN
  ├─ validasi data
  ├─ logika bisnis produk, stok, penjualan
  ├─ approval dasar
  ├─ laporan sederhana
  └─ backup / restore / log audit

Penyimpanan data (adapter yang bisa dipilih)
  ├─ PostgreSQL (opsi utama untuk deployment serius)
  ├─ GAS / Google Sheets (opsi yang mungkin dipilih user)
  └─ opsi lain di masa depan
```

Arsitektur ini tetap sederhana dan tidak mengharuskan user mempelajari banyak lapisan teknis. Semua logika bisnis tetap di backend; frontend hanya memudahkan input dan tampilan.

## 11. Basis data yang aman dan mudah dikelola

Kebutuhan yang paling penting daripada teknologi spesifik:

- data tidak hilang saat restart server
- transaksi dan stok hasil akhir tersimpan dengan benar
- backup mudah dibuat
- restore dapat diuji dan dipahami
- data dapat dibedakan per cabang
- riwayat transaksi tetap ada

Pemilihan database bisa diputuskan saat deployment, bukan di awal diskusi bisnis. Yang penting adalah aplikasi dibuat agar bisa beradaptasi dengan penyimpanan yang benar-benar dipilih.

## 12. Kriteria sukses MVP

MVP dianggap cukup untuk diuji bila:

- kasir bisa menjual saat online maupun offline
- stok berkurang tepat saat transaksi valid
- transaksi tidak duplikat saat request ulang
- laporan sederhana bisa ditampilkan per toko
- backup dapat dibuat dan restore dapat diuji
- approval untuk diskon besar dan void berfungsi
- admin bisa melihat aktivitas penting dan status transaksi
- UI mudah dipahami dan tidak terlalu berat untuk operator toko

## 13. UX yang disarankan

### 13.1 Untuk kasir

Halaman kasir hanya fokus pada:

- cari produk
- tambah ke keranjang
- bayar
- struk

Semua detail operasional di belakang layar.

### 13.2 Untuk owner

Owner melihat:

- omzet hari ini
- jumlah transaksi
- stok berisiko
- ringkasan toko dan cabang
- status backup dan sum

### 13.3 Untuk laporan

Laporan dibuat seperti dashboard ringkas: 

- total penjualan
- produk paling laku
- stok menumpuk
- trend harian

Tidak memperkenalkan istilah akuntansi yang bikin bingung bila belum perlu.

## 14. Fokus implementasi yang disarankan

Urutan terbaik:

1. Login PIN + role basic + multi-toko
2. Produk + stok + harga
3. POS penjualan + pembayaran + validasi
4. Transaksi offline + queue sync
5. Laporan dasar
6. Approval dasar (diskon besar, void)
7. Backup & restore
8. Fitur tambahan setelah core stabil

## 15. Fitur yang sebaiknya ditunda

- Gemini AI
- modul payroll yang detail
- laporan keuangan kompleks
- e-faktur formal
- integrasi WhatsApp yang terlalu banyak
- pembahasan broad-based ERP framework yang terlalu rumit untuk UMKM

## 16. Keputusan produk yang sudah final untuk saat ini

- Multi-toko: ya
- Login: PIN
- Offline penjualan: wajib di MVP
- Database: dapat dipilih sesuai kebutuhan user / deployment
- Gemini AI: setelah fitur inti stabil
- Approval: hanya untuk diskon besar dan void yang critical
- UI: minimalis, clean, premium, sederhana, tidak terlalu korporat

## 17. Catatan akhir

Target utama ERP PWA ini bukan mencari sistem sekeren atau sekorporat mungkin. Targetnya adalah sistem yang mudah dipakai oleh pemilik toko dan kasir, aman secara sederhana, data aman, mudah backup, mudah restore, dan tetap bisa beroperasi saat jaringan terganggu.

Dengan cara itu, aplikasi tetap punya nilai bisnis nyata, tidak terlalu kompleks di awal, dan siap berkembang saat kebutuhan toko meningkat.
