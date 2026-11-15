# ERP PWA Toko Baju UMKM — Spesifikasi Teknis untuk Diskusi

**Versi:** 0.2 (draft)  
**Status:** Bahan diskusi — belum menjadi keputusan final  
**Repo:** `emailmercyzone-glitch/ERP-PWA-Toko-Baju-`  
**Tujuan dokumen:** Menyamakan kebutuhan dan arah produk sebelum kita mengubah arsitektur atau menambah fitur besar.

> Dokumen ini membedakan keputusan yang sudah disampaikan pemilik proyek dari usulan awal. Usulan dapat diubah saat diskusi. Dokumen ini bukan pernyataan bahwa aplikasi saat ini sudah siap produksi.

## 1. Keputusan yang sudah disampaikan

| Topik | Keputusan |
|---|---|
| Jumlah toko | **Multi-toko** |
| Cara login | **PIN** |
| Pilihan database | **Pengguna dapat memilih**, misalnya Google Apps Script/Google Sheets atau PostgreSQL. Pilihan backend penyimpanan belum dikunci. |
| Gemini AI | **Dikerjakan setelah fitur inti stabil** |

## 2. Penjelasan sederhana untuk hal yang belum diputuskan

- **MVP** adalah versi awal yang fokus pada fitur paling penting supaya bisa dipakai dan diuji. Usulan awal: produk, stok, penjualan POS, pembayaran, dan laporan sederhana.
- **Approval** adalah persetujuan atasan untuk tindakan tertentu, misalnya membatalkan transaksi atau memberi diskon besar. Usulan awal: approval dasar masuk MVP agar kontrol transaksi jelas.
- **Offline queue** adalah daftar transaksi yang disimpan sementara di perangkat saat internet putus, lalu dikirim ke server saat koneksi kembali. Usulan awal: sediakan untuk penjualan, tetapi status transaksi baru final setelah server menerima dan memeriksanya.
- **Database yang bisa dipilih** berarti aplikasi punya batas/adapter penyimpanan yang sama, lalu konfigurasi deployment menentukan apakah data disimpan melalui GAS/Google Sheets, PostgreSQL, atau pilihan lain yang didukung. Setiap pilihan bisa berbeda dari sisi biaya, kecepatan, batas kapasitas, dan cara menjalankannya. Tidak harus dipilih sekarang, tetapi perlu dipastikan pilihan tersebut benar-benar didukung sebelum implementasi.

## 3. Kondisi repo saat ini

Berdasarkan snapshot kode yang diperiksa:

- Aplikasi menggunakan React, TypeScript, Vite, Express, dan plugin PWA.
- Engine bisnis saat ini memakai database in-memory yang diisi data contoh; data dapat hilang saat server restart.
- Ada PIN contoh di kode/seed. PIN contoh tersebut tidak boleh dipakai untuk akun sebenarnya.
- Beberapa mode bisnis masih berupa simulasi/prototipe, sehingga keberadaan modul di UI belum berarti alur bisnisnya sudah tuntas.
- Gemini masih ditunda sampai core stabil. Kunci Gemini, bila kelak digunakan, harus tetap di sisi server.
- Branch `security-and-production-baseline` berisi hardening dasar API dan dokumen setup; perubahan tersebut belum mengatasi kebutuhan database persisten dan autentikasi produksi.

## 4. Arah produk yang diusulkan

ERP PWA untuk operasional toko baju yang memiliki beberapa toko/cabang. Pengguna dapat mengelola penjualan, persediaan, dan laporan sesuai toko dan hak aksesnya. Sistem harus tetap dapat dipakai di perangkat mobile/tablet.

### Fokus versi awal yang disarankan

1. Pengguna dan akses toko.
2. Produk, varian, harga, dan stok per toko.
3. POS: keranjang, perhitungan total, dan pencatatan pembayaran.
4. Pergerakan stok dan riwayat transaksi.
5. Laporan penjualan dan stok sederhana.
6. Approval dasar untuk tindakan berisiko, bila aturan bisnis disepakati.
7. Operasi offline terbatas untuk penjualan, bila kebutuhan ini memang wajib.

### Fitur yang disarankan untuk tahap berikutnya

Payroll lanjutan, konsinyasi/afiliasi, WhatsApp gateway, Gemini AI, e-Faktur, dan laporan lanjutan. Urutan akhirnya bisa kita sesuaikan dengan kebutuhan toko.

## 5. Pengguna dan akses

Usulan peran awal:

| Peran | Contoh penggunaan |
|---|---|
| Owner | Mengelola cabang dan pengguna, melihat laporan seluruh cabang, melakukan persetujuan penting. |
| Manager | Mengelola operasi cabang yang ditugaskan dan menyetujui tindakan sesuai batasnya. |
| Kasir | Membuat penjualan dan mencatat pembayaran di cabang yang ditugaskan. |
| Gudang | Melihat dan memperbarui aktivitas stok/gudang sesuai lokasi yang ditugaskan. |

### Aturan akses yang disarankan

- Akun pengguna memiliki PIN dan satu atau lebih cabang yang boleh diakses.
- Server menentukan identitas, peran, serta cabang dari sesi login; aplikasi tidak boleh mempercayai role atau cabang yang dikirim begitu saja oleh browser.
- Pengguna hanya melihat dan mengubah data sesuai kewenangan.
- PIN tidak disimpan sebagai teks biasa. PIN contoh harus dihapus/diganti sebelum penggunaan nyata; perlu pembatasan percobaan salah dan penguncian sementara.

**Perlu dibahas nanti:** Apakah seorang kasir bisa ditugaskan ke lebih dari satu cabang? Apakah owner boleh sekaligus menjadi kasir?

## 6. Perilaku multi-toko

- Data toko, stok, penjualan, dan laporan menyimpan identitas cabang terkait.
- Owner dapat melihat ringkasan seluruh cabang; manager/kasir/gudang hanya melihat cabang yang diizinkan.
- Transfer stok antar cabang dicatat sebagai proses asal dan tujuan, bukan sekadar mengubah angka stok.
- Perubahan harga atau produk yang berlaku lintas cabang harus memiliki aturan yang jelas: global atau khusus cabang.
- Laporan harus bisa difilter berdasarkan cabang dan periode.

## 7. Database yang dapat dipilih

### Kebutuhan yang disepakati

Pengguna ingin dapat memilih cara penyimpanan, bukan dipaksa memakai satu database tertentu. Karena itu, rancangan aplikasi sebaiknya memisahkan logika bisnis dari detail penyimpanan melalui **adapter**.

```text
Aplikasi / layanan bisnis
          │
          ├── Adapter GAS / Google Sheets (jika dipilih dan didukung)
          ├── Adapter PostgreSQL (jika dipilih dan didukung)
          └── Adapter penyimpanan lain di masa depan
```

Semua adapter yang didukung harus mengikuti aturan bisnis dan bentuk data yang konsisten. Pemilihan adapter dilakukan saat konfigurasi deployment, bukan dengan mengirim pilihan database dari browser.

### Catatan sebelum memilih

- PostgreSQL umumnya lebih sesuai untuk transaksi bersamaan dan data yang terus bertambah, tetapi memerlukan server/database yang dikelola.
- GAS/Google Sheets bisa lebih sederhana untuk memulai jika pengguna sudah berada di ekosistem Google, tetapi memiliki batas penggunaan dan karakteristik berbeda dari database relasional.
- Tidak realistis menganggap semua pilihan punya fitur, performa, dan keandalan yang sama. Kita perlu menetapkan daftar adapter yang benar-benar akan dibuat dan diuji.
- Data contoh in-memory saat ini bukan penyimpanan persisten dan tidak memenuhi kebutuhan penggunaan nyata.

**Keputusan tertunda:** adapter mana yang harus didukung pertama kali? Usulan teknis: mulai dengan satu adapter untuk membuat fitur inti stabil, lalu tambah adapter kedua berdasarkan kebutuhan nyata. Ini usulan, bukan keputusan yang sudah dibuat.

## 8. Kebutuhan utama yang diusulkan

- **Produk:** pencarian produk/varian menggunakan nama, SKU, atau barcode.
- **Stok:** stok tercatat per cabang; perubahan stok memiliki alasan dan riwayat.
- **Penjualan:** total dihitung dan diperiksa oleh server; transaksi tidak boleh mengurangi stok dua kali jika request terkirim ulang.
- **Pembayaran:** metode dan nominal dicatat; sistem membedakan pembayaran yang sudah dikonfirmasi dan yang masih perlu verifikasi.
- **Approval:** tindakan yang melewati aturan yang disepakati memerlukan persetujuan pihak berwenang.
- **Laporan:** ringkasan penjualan dan stok bisa dilihat per cabang oleh pengguna yang berhak.
- **Audit:** sistem mencatat siapa melakukan apa dan kapan untuk tindakan sensitif, tanpa menyimpan PIN/token di log.
- **Backup:** mekanisme dan prosedur pemulihan bergantung pada adapter database yang dipilih dan harus diuji.

## 9. Mode offline — usulan untuk dibahas

Jika offline diwajibkan:

1. Aplikasi menyimpan transaksi sementara di perangkat.
2. Transaksi diberi ID unik agar pengiriman ulang tidak membuat transaksi ganda.
3. Saat koneksi kembali, server memeriksa ulang data, harga, stok, dan hak akses.
4. Aplikasi menampilkan hasil: berhasil, perlu ditinjau, atau gagal beserta alasannya.
5. Transaksi offline tidak boleh diam-diam dianggap berhasil/final sebelum mendapat hasil dari server.

**Pertanyaan sederhana:** Kalau internet toko putus, apakah kasir harus tetap bisa membuat transaksi, atau aplikasi boleh menunggu sampai internet kembali?

## 10. Arah API dan keamanan

- Backend menyediakan API untuk login PIN, produk, stok, penjualan, laporan, dan approval.
- Data input diperiksa di server sebelum diproses.
- Semua operasi dibatasi berdasarkan PIN/session, peran, dan cabang.
- Permintaan penjualan memiliki ID unik untuk mencegah duplikasi saat jaringan bermasalah.
- Pesan error tidak membocorkan detail internal atau secret.
- Gemini tidak termasuk core awal. Bila ditambahkan nanti, seluruh panggilan dilakukan melalui server dan kunci API tidak masuk ke bundle browser.

## 11. Kriteria dasar keberhasilan

Versi awal dianggap siap diuji bersama pengguna apabila:

- Data penjualan dan stok tidak hilang setelah restart, untuk adapter yang dinyatakan didukung.
- Data antar cabang terpisah sesuai akses dan dapat diringkas oleh owner.
- Penjualan valid mengurangi stok tepat satu kali.
- Request invalid atau tanpa akses tidak dapat mengubah data.
- PIN tidak disimpan dalam bentuk teks biasa dan percobaan login dibatasi.
- Backup/restore untuk adapter pilihan dapat diuji dengan prosedur yang jelas.
- Fitur yang belum selesai diberi label prototipe dan tidak diklaim siap produksi.

## 12. Tahapan yang disarankan

1. **Sepakati kebutuhan:** pilih fitur awal, aturan cabang, approval, dan kebutuhan offline.
2. **Pilih adapter pertama:** tentukan penyimpanan yang paling dibutuhkan untuk pilot, sambil menjaga rancangan agar adapter lain bisa ditambahkan.
3. **Bangun fondasi:** login PIN yang aman, permission multi-toko, validasi input, database persisten, dan test dasar.
4. **Bangun alur inti:** produk, stok, POS, pembayaran, laporan, serta audit.
5. **Uji di toko:** cek alur nyata, koneksi putus, dan proses backup/pemulihan.
6. **Tambah fitur lanjutan:** setelah core stabil, bahas Gemini dan modul lain.

## 13. Hal yang masih perlu kita putuskan

Kita tidak perlu menjawab semuanya sekaligus. Saya sarankan mulai dari tiga hal ini:

1. **Fitur versi awal:** apakah setuju mulai dari POS + stok + laporan sederhana, dengan approval dasar?
2. **Pilihan penyimpanan pertama:** dari GAS/Google Sheets atau PostgreSQL, mana yang paling ingin dicoba lebih dulu? Pilihan ini tidak menutup kemungkinan menambah pilihan lain kemudian.
3. **Offline:** saat internet putus, apakah kasir wajib tetap bisa menjual?

Hal lain seperti rincian izin, format laporan, batas diskon, dan metode pembayaran bisa dibahas setelah tiga pertanyaan tersebut.

## 14. Catatan perubahan

- **v0.1:** Draft awal untuk diskusi.
- **v0.2:** Memasukkan masukan: sistem multi-toko, login PIN, pilihan database ditentukan pengguna, dan Gemini ditunda sampai core stabil. Menjelaskan istilah MVP, approval, dan offline dengan bahasa sederhana.
