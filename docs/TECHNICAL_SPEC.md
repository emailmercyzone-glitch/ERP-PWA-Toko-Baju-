# ERP PWA Toko Baju UMKM — Spesifikasi Produk & Teknis

**Versi:** 0.4 — draft untuk diskusi  
**Status:** Arah produk disepakati; aturan operasional di bawah mengikuti rekomendasi awal dan masih bisa disesuaikan  
**Repo:** `emailmercyzone-glitch/ERP-PWA-Toko-Baju-`

> Dokumen ini menjelaskan aplikasi yang ingin dibangun, bukan klaim bahwa fitur-fitur tersebut sudah selesai. Tujuannya membuat sistem yang sederhana dipakai UMKM: transaksi tetap jalan saat internet putus, data aman, dan backup/pemulihan mudah dilakukan.

## 1. Arah yang sudah disepakati

| Topik | Kesepakatan |
|---|---|
| Pengguna | Sistem multi-toko/cabang |
| Login | PIN |
| Akses owner | Owner dapat melihat dan mengelola semua toko |
| Harga | Harga dapat berbeda mengikuti lokasi toko; toko memiliki pengaturan persentase kenaikan otomatis |
| Penyimpanan data | Pengguna/deployment dapat memilih teknologi penyimpanan yang didukung, misalnya PostgreSQL atau GAS/Google Sheets |
| Penjualan offline | Wajib: transaksi disimpan di IndexedDB ketika jaringan putus dan disinkronkan saat online kembali |
| Gemini AI | Ditunda sampai fitur inti stabil |
| Tampilan | Minimalis, bersih, terasa premium, dan mudah dimengerti; hindari jargon dan workflow berlapis |

## 2. Tujuan produk

Aplikasi membantu pemilik dan staf toko baju mengelola pekerjaan harian tanpa pengalaman seperti memakai software perusahaan besar.

Fokus utama:

- Kasir dapat mencari barang, menjual, menerima pembayaran, dan mencetak struk dengan cepat.
- Stok dan penjualan tercatat per toko.
- Owner dapat melihat ringkasan seluruh toko; staf melihat toko yang ditugaskan.
- Penjualan tetap dapat dicatat saat offline.
- Retur, tagihan pelanggan/pemasok, opname, dan dokumen operasional dapat dikelola tanpa istilah yang membingungkan.
- Data dapat dibackup dan dipulihkan dengan langkah yang jelas.

## 3. Fitur yang ditargetkan untuk versi awal

1. Login PIN dan pengaturan pengguna.
2. Multi-toko serta pembatasan akses staf per toko.
3. Produk, varian, barcode, harga, dan persentase harga per toko.
4. Stok per toko, penerimaan barang, opname, dan mutasi stok dasar.
5. POS, metode pembayaran, histori transaksi, serta struk.
6. Penjualan offline melalui IndexedDB dan sinkronisasi otomatis.
7. Retur dasar.
8. Piutang pelanggan dan utang pemasok dengan pencatatan pembayaran.
9. Laporan penjualan, stok, dan hasil opname.
10. Dokumen cetak sesuai kebutuhan operasional: struk, kwitansi, invoice/tagihan, dan surat jalan.
11. Backup dan restore.
12. Persetujuan sederhana untuk diskon besar dan pembatalan transaksi yang telah selesai.

Gemini, payroll mendalam, e-Faktur, dan otomatisasi WhatsApp ditunda sampai alur utama stabil dan kebutuhan bisnisnya dikonfirmasi.

## 4. Pengguna dan akses toko

Peran awal dibuat sesederhana mungkin:

| Peran | Akses yang disarankan |
|---|---|
| Owner | Semua toko, ringkasan gabungan, pengaturan harga/toko/pengguna, backup, dan persetujuan penting. |
| Manager | Toko yang ditugaskan, laporan toko tersebut, pengelolaan operasional, dan persetujuan sesuai kewenangan. |
| Kasir | POS, pembayaran, struk, dan transaksi di toko yang ditugaskan. |
| Gudang | Stok dan pergerakan barang di toko/gudang yang ditugaskan. |

Aturan penting:

- Owner dapat berpindah melihat toko mana pun dan melihat ringkasan gabungan.
- Pengguna non-owner hanya dapat membuka toko yang diberikan kepadanya.
- Peran dan toko aktif dibaca dari sesi login yang diverifikasi server, bukan dipercaya dari pilihan bebas di browser.
- PIN disimpan dalam bentuk hash di server, bukan teks biasa. Percobaan PIN salah dibatasi dan sesi memiliki masa berlaku.
- Untuk tetap bisa memakai aplikasi offline, perangkat yang sudah pernah login secara online boleh dibuka kembali dengan PIN yang telah terdaftar di perangkat. PIN tidak dikirim atau disimpan sebagai teks biasa. Server tetap memvalidasi transaksi saat sinkronisasi.

## 5. Harga berbeda per lokasi

Model harga yang disarankan agar pemilik tidak perlu mengisi harga satu per satu untuk setiap cabang:

1. Produk memiliki **harga dasar**.
2. Setiap toko dapat memiliki **persentase penyesuaian harga** (misalnya toko tertentu lebih mahal karena biaya lokasi).
3. Harga jual toko dihitung otomatis dari harga dasar dan persentase toko.
4. Jika diperlukan, owner dapat menetapkan **harga khusus untuk produk tertentu di toko tertentu**, yang mengesampingkan hasil perhitungan otomatis.
5. Transaksi menyimpan snapshot harga yang benar-benar dipakai pada saat penjualan, agar histori transaksi tidak berubah ketika pengaturan harga diedit kemudian.

Rumus awal yang diusulkan: `harga toko = harga dasar × (1 + persentase penyesuaian toko)`. Aturan pembulatan ke rupiah ditetapkan konsisten di semua toko.

Persentase dan harga khusus hanya dapat diubah oleh owner (atau peran yang secara eksplisit diberi izin). Perubahan harga dicatat agar owner tahu kapan dan oleh siapa perubahan dibuat.

## 6. Alur penjualan offline-first

### Saat online

1. Kasir memilih toko yang menjadi wewenangnya.
2. Cari/scan barang, masukkan ke keranjang, dan pilih pembayaran.
3. Server memvalidasi harga, stok, akses, dan isi transaksi.
4. Jika berhasil, transaksi tersimpan dan struk dapat dicetak.

### Saat offline

1. Kasir tetap membuat dan menyelesaikan alur penjualan di PWA.
2. Aplikasi menggunakan data produk/harga yang terakhir tersimpan di perangkat.
3. Transaksi dan snapshot harga disimpan di IndexedDB dengan ID unik; status layar menyatakan **“Tersimpan di perangkat — menunggu sinkronisasi”**.
4. Struk dapat dicetak, dengan penanda bahwa transaksi masih menunggu sinkronisasi.
5. Ketika jaringan kembali, aplikasi otomatis mengirim antrian. ID unik mencegah transaksi yang sama terkirim dua kali.
6. Server memeriksa transaksi. Aplikasi memperbarui status menjadi **“Terkirim”**, **“Perlu dicek”**, atau **“Gagal — perlu tindakan”**.

### Jika stok atau data berbeda saat sinkronisasi

Offline berarti stok perangkat mungkin sudah ketinggalan, terutama jika cabang lain atau perangkat lain juga menjual. Transaksi lokal tidak boleh hilang atau diam-diam dihapus. Server mencatat transaksi yang diterima; bila ada konflik stok atau aturan bisnis, transaksi diberi status **“Perlu dicek”** untuk owner/manager, dengan rincian yang bisa dipahami. Sistem tidak menjanjikan stok global real-time ketika perangkat terputus dari server.

### Aturan aman untuk offline

- Antrian menyimpan data transaksi yang diperlukan saja, bukan secret atau PIN.
- Retry tidak boleh membuat transaksi atau pengurangan stok ganda.
- Harga yang ditampilkan dan digunakan ketika offline mengikuti cache toko; transaksi menyimpan harga tersebut. Jika harga telah berubah di server, kebijakan konfirmasi perlu ditampilkan tanpa mengubah histori secara diam-diam.
- Pembayaran tunai dapat dicatat offline. Pembayaran non-tunai yang perlu konfirmasi bank/gateway tidak boleh dianggap terverifikasi hanya karena kasir menandainya di perangkat.
- Retur, pembayaran utang/piutang, mutasi, dan perubahan stok sebaiknya dilakukan saat online pada tahap awal; bila kelak perlu offline, alurnya dirancang dan diuji tersendiri.

## 7. Retur

Alur retur yang sederhana:

1. Pilih transaksi asal dan barang yang dikembalikan.
2. Masukkan jumlah, alasan singkat, dan hasil penyelesaian: tukar barang, refund, atau saldo toko (jika fitur saldo toko disetujui).
3. Tandai kondisi barang: **layak dijual lagi** atau **rusak/tidak layak jual**.
4. Barang layak dijual kembali masuk stok toko; barang rusak dicatat terpisah dan tidak menambah stok jual.
5. Catat refund atau saldo/tukar sebagai transaksi yang terhubung ke retur asal.
6. Cetak bukti retur bila diperlukan.

**Aturan yang disarankan:** retur biasa dicatat tanpa approval tambahan. Minta approval hanya untuk refund bernilai besar, transaksi yang tidak ditemukan, atau kasus di luar aturan retur. Batas nominal dan jangka waktu retur dapat diatur kemudian.

## 8. Piutang pelanggan dan utang pemasok

Piutang/utang bukan sekadar catatan nama dan nominal; perlu ada histori pembayaran supaya sisa tagihan dapat dipercaya.

- **Piutang pelanggan:** tagihan berasal dari penjualan yang belum dibayar penuh. Setiap pembayaran berikutnya dicatat dan mengurangi sisa tagihan.
- **Utang pemasok:** tagihan berasal dari penerimaan/pembelian barang. Pembayaran dicatat bertahap dan mengurangi saldo utang.
- Masing-masing menampilkan total, sudah dibayar, sisa, tanggal, jatuh tempo (bila ada), dan status **Belum lunas/Lunas**.
- Pembayaran harus terhubung ke tagihan asal dan tidak boleh membuat jumlah yang sudah dibayar melebihi saldo, kecuali ada proses pengembalian uang yang eksplisit.
- Kwitansi dapat dicetak untuk pembayaran atau pelunasan.

## 9. Stok dan stok opname

- Stok selalu dicatat terpisah per toko dan varian/SKU.
- Penjualan, penerimaan, retur layak jual, dan mutasi menjadi riwayat perubahan stok.
- Saat opname, petugas mengisi jumlah fisik; sistem menampilkan jumlah menurut aplikasi dan selisihnya.
- Petugas dapat memilih alasan sederhana seperti salah hitung, rusak, atau hilang.
- Setelah opname disimpan, koreksi stok langsung diterapkan agar angka toko kembali sesuai hasil hitung dan tercatat di riwayat.
- Selisih yang sangat besar dibanding stok/nilai barang ditandai untuk pemeriksaan owner/manager. Batasnya dapat diatur; tidak perlu menahan semua opname kecil dengan approval.
- Laporan opname menampilkan toko, tanggal, petugas, stok sebelum, stok fisik, selisih, alasan, dan status pemeriksaan.

## 10. Dokumen cetak

Dokumen dibuat dari data transaksi nyata, bukan angka contoh:

- **Struk:** bukti penjualan untuk pelanggan.
- **Kwitansi:** bukti pembayaran atau pelunasan piutang/utang.
- **Invoice/tagihan:** rincian jumlah yang perlu dibayar pelanggan.
- **Surat jalan:** rincian barang yang dikirim ke pelanggan atau dipindahkan antartoko.
- **Bukti retur/opname:** tersedia bila dibutuhkan untuk pencatatan.

Tahap awal cukup menyediakan halaman yang rapi dan siap cetak dari browser. Dokumen transaksi offline harus diberi penanda menunggu sinkronisasi. Format PDF unduhan dapat ditambahkan tanpa mengubah sumber datanya.

## 11. Laporan yang mudah dibaca

Owner:

- omzet dan jumlah transaksi hari ini, per toko atau gabungan;
- metode pembayaran dan transaksi yang belum lunas;
- produk paling laku;
- stok rendah/menumpuk;
- hasil opname dan selisih yang perlu dicek;
- transaksi offline yang belum tersinkron.

Manager:

- ringkasan penjualan, stok, dan opname untuk toko yang ditugaskan.

Kasir/gudang:

- histori transaksi atau stok yang dibutuhkan untuk pekerjaannya.

Di layar gunakan istilah sehari-hari dan penjelasan singkat. Detail teknis hanya ditampilkan jika memang membantu menyelesaikan masalah.

## 12. Backup dan pemulihan

**Rekomendasi:** backup mencakup seluruh data bisnis dan pengaturan yang diperlukan agar aplikasi bisa berjalan kembali:

- toko/cabang, pengguna dan peran (tanpa PIN dalam bentuk asli), produk, varian, harga, stok, transaksi, pembayaran, retur, tagihan, opname, dan riwayat penting;
- konfigurasi bisnis yang tidak berupa secret.

Backup tidak menyertakan PIN asli, token sesi aktif, atau API secret. Credential tetap tersimpan sebagai hash; setelah restore, owner perlu memeriksa akses dan mungkin meminta pengguna login ulang.

Fitur backup/restore harus dibuat mengikuti penyimpanan yang dipilih. File backup perlu akses terbatas dan perlindungan yang sesuai. Restore sebaiknya memberi konfirmasi jelas, menyimpan backup sebelum menimpa data, dan menyediakan cara memeriksa hasil pemulihan.

## 13. Pilihan penyimpanan data

Pengguna/deployment dapat memilih penyimpanan yang tersedia, misalnya PostgreSQL atau GAS/Google Sheets. Agar tetap realistis:

- Pemilihan dilakukan saat setup/deployment, bukan oleh kasir di aplikasi setiap hari.
- Logika POS dan tampilan tidak bergantung langsung pada teknologi penyimpanan.
- Setiap pilihan yang benar-benar didukung wajib lulus uji transaksi, multi-toko, sinkronisasi offline, backup, dan restore.
- Tidak semua penyimpanan punya kapasitas, kecepatan, transaksi bersamaan, dan proses backup yang sama.
- Jangan mengklaim suatu adapter sudah didukung sebelum implementasi dan pengujiannya tersedia. Data in-memory saat ini hanya untuk demo.
- Rekomendasi praktis: buat adapter pertama yang paling sesuai dengan lingkungan pengguna, lalu tambah pilihan berikutnya setelah adapter pertama stabil. Mendukung banyak penyimpanan sekaligus dari hari pertama dapat menambah kompleksitas dan memperlambat penyelesaian fitur inti.

## 14. Keamanan yang perlu tetap sederhana bagi pengguna

- PIN di-hash di server, tidak disimpan sebagai teks biasa.
- Ada pembatasan percobaan PIN salah dan masa berlaku sesi.
- Hak akses per toko diperiksa di server untuk setiap operasi penting.
- Request divalidasi dan transaksi tidak boleh tersimpan setengah jalan.
- Penjualan yang dikirim ulang tidak menggandakan transaksi.
- Error disampaikan dengan bahasa sederhana tanpa membocorkan detail teknis atau data rahasia.
- Kunci Gemini, bila nanti dipakai, hanya berada di server.
- Perangkat lokal yang dipakai bersama perlu memiliki logout/kunci layar dan penghapusan data sesi yang jelas.

## 15. Arah tampilan

- **Kasir:** layar utama fokus pada cari/scan barang, keranjang, total, pembayaran, dan struk. Tindakan utama mudah dijangkau di tablet.
- **Owner:** ringkasan bisnis dan cabang, lalu detail hanya jika diminta.
- **Laporan:** angka penting dan grafik sederhana; istilah keuangan dijelaskan dengan bahasa umum.
- Gaya visual minimalis, bersih, rapi, terasa premium, dan konsisten.
- Inspirasi visual yang disebutkan—dashboard bank digital untuk owner, POS modern untuk kasir, dan laporan yang terstruktur—adalah arah desain, bukan menyalin tampilan/identitas produk lain.

## 16. Tahapan pengerjaan yang disarankan

1. Kunci alur pengguna dan aturan sederhana: harga cabang, retur, pembayaran, serta kasus offline.
2. Implementasikan PIN, sesi, dan akses multi-toko.
3. Implementasikan produk, harga dasar + persentase toko, dan stok.
4. Implementasikan POS online dan transaksi offline IndexedDB beserta sinkronisasi/idempotency.
5. Tambahkan pembayaran, retur, piutang/utang, opname, dan laporan dasar.
6. Tambahkan struk, kwitansi, invoice, dan surat jalan dari data nyata.
7. Lengkapi backup/restore dan uji pemulihan untuk adapter yang didukung.
8. Setelah alur inti stabil, evaluasi Gemini dan fitur lanjutan.

## 17. Keputusan operasional yang direkomendasikan

Bagian ini menetapkan default yang masuk akal agar rancangan berikutnya tidak kosong. Nilainya masih dapat diubah oleh pemilik proyek:

| Topik | Rekomendasi awal |
|---|---|
| Offline queue | Hanya penjualan pada tahap pertama. Sinkron otomatis, ID unik, retry aman; konflik stok/harga masuk status “Perlu dicek”, bukan dihapus. |
| Retur dan stok | Barang layak jual kembali ke stok; barang rusak masuk catatan stok rusak dan tidak dijual. Retur biasa tanpa approval; refund besar/kasus khusus perlu pemeriksaan. |
| Piutang/utang | Catat sebagai tagihan dengan histori pembayaran dan saldo tersisa, bukan catatan saja. |
| Stok opname | Selisih kecil langsung memperbarui stok dan tercatat; selisih besar ditandai untuk pemeriksaan, bukan menahan semua opname. |
| Harga per toko | Harga dasar + persentase penyesuaian toko; harga khusus SKU/toko menjadi override opsional. Harga transaksi disimpan sebagai snapshot. |
| Backup/restore | Backup seluruh data bisnis dan konfigurasi non-secret untuk adapter yang dipakai. Jangan sertakan PIN asli, secret, atau sesi aktif. Uji restore sebelum mengandalkannya. |
| Database | Pilihan adapter ditentukan saat deployment. Implementasikan dan uji satu adapter lebih dulu; tambahkan adapter lain berdasarkan kebutuhan pengguna. |

## 18. Hal yang masih perlu dikonfirmasi nanti

Agar tidak membebani diskusi sekarang, hal-hal berikut dapat ditetapkan saat rancangan modul:

- Persentase kenaikan harga awal dan aturan pembulatan.
- Batas “diskon besar” dan “refund besar”.
- Berapa lama pelanggan dapat mengajukan retur.
- Apakah saldo toko sebagai pengganti refund benar-benar dibutuhkan.
- Daftar metode pembayaran dan cara memverifikasi QRIS/transfer.
- Adapter penyimpanan pertama yang akan dibuat.
- Format dan identitas yang wajib ada pada dokumen cetak.
- Masa berlaku sesi PIN dan kebijakan perangkat kasir bersama.

