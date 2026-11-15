# ERP PWA Toko Baju UMKM — Draft Spesifikasi Teknis

**Status:** Draft untuk diskusi (v0.1)  
**Terakhir diperbarui:** 2026-11-15  
**Repository:** `emailmercyzone-glitch/ERP-PWA-Toko-Baju-`  
**Tujuan:** Dokumen bersama untuk menyepakati ruang lingkup produk dan arah teknis sebelum perubahan implementasi yang lebih besar.

> Ini adalah draft untuk diskusi, bukan klaim bahwa aplikasi saat ini sudah memenuhi kebutuhan ini. Item yang ditandai **Saat Ini** adalah hasil observasi dari snapshot repo; item yang ditandai **Diusulkan** adalah keputusan atau kebutuhan yang perlu disepakati. Penggunaan di produksi dengan data finansial, payroll, atau pelanggan yang nyata belum layak sampai masalah keamanan dan persistensi ditangani.

## 1. Ringkasan eksekutif

Proyek ini bertujuan untuk menyediakan ERP/POS yang ramah mobile dan dapat diinstal untuk UMKM toko baju. Rilis pertama harus memprioritaskan operasi penjualan dan stok yang dapat diandalkan. Modul lain seperti payroll, konsinyasi, voucher, WhatsApp, insight AI, dan laporan lanjutan harus mengikuti setelah fondasi transaksi dan data stabil.

**Prinsip produk yang diusulkan:** database server yang persisten adalah sumber kebenaran. Klien yang mendukung mode offline boleh mengantri operasi yang diizinkan, tetapi tidak boleh secara mandiri menetapkan status final pembayaran, approval, atau stok.

## 2. Snapshot repo saat ini

- **Saat ini:** Frontend React + TypeScript, Vite, Express server, plugin PWA, dependensi IndexedDB, dan integrasi SDK Gemini sudah ada di repo.
- **Saat ini:** `server.ts` meng-dispatch `/api/exec` ke engine API ala GAS dan mengekpos route Gemini serta dokumen/receipt.
- **Saat ini:** engine bisnis memakai `ERPDatabase` yang di-seed di memori; data tidak bertahan saat proses restart dan tidak dibagikan antar instance.
- **Saat ini:** nilai demo PIN dan perilaku login ada di seed/business logic. Itu bukan credential yang layak untuk sistem yang dipakai di deployment.
- **Saat ini:** service Gemini masih punya fallback browser-side `VITE_GEMINI_API_KEY`. Secret tidak boleh diekspos melalui variabel client Vite; ini harus dihapus sebelum rilis.
- **Saat ini:** banyak mode bisnis masih berupa prototype atau placeholder. Keberadaan itu bukan bukti fitur selesai atau siap produksi.
- **Branch saat ini:** hardening dasar boundary API dan dokumentasi setup sudah ditambah di `security-and-production-baseline`; storage in-memory dan batasan autentikasi demo masih tetap ada.

## 3. Tujuan dan bukan tujuan

### Tujuan rilisan yang bisa dipakai (diusulkan)

1. Merekam penjualan dan pembayaran tanpa kehilangan data saat restart.
2. Menjaga produk, varian, stok per toko, dan pergerakan stok yang bisa diaudit.
3. Mendukung alur owner, manager, kasir, dan gudang dengan permission yang dipaksakan server.
4. Menyediakan PWA mobile/tablet yang dapat dipakai serta antrian transaksi offline yang aman dan terbatas.
5. Menyediakan laporan operasional dasar berdasarkan data yang persisten.
6. Mendukung backup dan restore dengan proses yang terdokumentasi dan teruji.

### Bukan tujuan pada rilisan awal (diusulkan)

- Payroll lengkap, e-Faktur/tax, settlement konsinyasi, dan accounting afiliasi.
- Integrasi WhatsApp otomatis atau provider payment yang nyata.
- Keputusan bisnis otomatis yang dihasilkan AI atau tindakan bisnis mandiri.
- Multi-region atau jaminan ketersediaan tinggi.
- Menganggap browser storage sebagai database otoritatif.

## 4. Pengguna dan permission

Role yang diusulkan (permission harus diberlakukan di API, bukan hanya disembunyikan di UI):

| Role | Tanggung jawab utama | Batasan yang perlu disepakati |
|---|---|---|
| Owner | Mengatur toko/pengguna; melihat laporan; menyetujui operasi sensitif; mengelola backup | Apakah owner juga boleh melakukan aksi kasir |
| Manager | Mengawasi toko; menyetujui operasi tertentu; melihat laporan toko | Visibilitas HPP/laba dan batas approval |
| Kasir | Membuat penjualan, mencatat pembayaran, melihat data produk/stok yang diizinkan | Tidak boleh menyetujui diskon/void sendiri |
| Gudang | Menerima/mengirim/menghitung stok dan melihat stok gudang | Tidak punya akses payroll, data NPWP pelanggan, atau laporan finansial |

**Keputusan yang perlu ditetapkan:** Apakah pengguna dibagi antar toko, dan apakah permission dibatasi per toko atau per beberapa toko?

## 5. Kebutuhan MVP yang diusulkan

### Kebutuhan fungsional

- **FR-01 Produk:** menampilkan/menelusuri produk dan varian; menjaga SKU, barcode, harga, dan status aktif.
- **FR-02 Persediaan:** menampilkan stok per toko; merekam penerimaan, penjualan, transfer, dan opname sebagai pergerakan stok yang bisa diaudit.
- **FR-03 POS:** membuat penjualan dengan beberapa item; menghitung total di server; menolak kuantitas tidak valid dan stok tidak cukup.
- **FR-04 Pembayaran:** merekam satu atau beberapa metode pembayaran; membedakan status pending/unverified dan verified.
- **FR-05 Idempotency:** operasi yang diulang dari client tidak akan menghasilkan penjualan ganda; harus ada kunci idempotency dan perilaku konflik yang jelas.
- **FR-06 Approval:** workflow approval yang dapat dikonfigurasi untuk void, diskon, transfer, dan penyesuaian stok, termasuk riwayat aktor dan keputusan.
- **FR-07 Offline:** mengantri penjualan dengan kunci idempotency yang stabil; tampilkan status queued/syncing/synced/failed; sediakan retry dan resolusi konflik yang aman.
- **FR-08 Laporan:** total penjualan dasar, jumlah transaksi, dan ringkasan stok yang difilter berdasarkan toko dan rentang tanggal yang berwenang.
- **FR-09 Audit:** merekam aktor, operasi, waktu, toko, dan target untuk operasi sensitif tanpa menyimpan PIN, token, atau secret.
- **FR-10 Recovery:** membuat dan memulihkan backup database yang terverifikasi; dokumentasikan recovery point dan recovery time expectation.

### Kriteria penerimaan untuk MVP

- Penjualan yang sudah disetujui dan pergerakan stok tetap tersedia setelah restart aplikasi.
- Request yang tidak valid ditolak tanpa menulis sebagian data ke penjualan, pembayaran, jurnal, atau stok.
- Mengulang kunci idempotency yang sudah diterima tidak menambah penjualan atau mengurangi stok lagi.
- Pengguna tidak bisa menjalankan aksi di luar role/store scope yang diverifikasi oleh server.
- Penjualan yang diqueue saat offline jelas melaporkan hasil final dari server dan tidak terlihat terselesaikan tanpa konfirmasi.
- Backup dapat dipulihkan di lingkungan non-produksi dan dicek terhadap integritas yang terdokumentasi.

## 6. Arsitektur yang diusulkan

```text
PWA (React / TypeScript)
  ├─ Client API online ───────────────┐
  ├─ IndexedDB: antrian offline terbatas │
  └─ UI / cache lokal                 │
                                      ▼
Express API (TypeScript)
  ├─ parsing request dan validasi schema
  ├─ autentikasi dan otorisasi
  ├─ service bisnis / transaction boundary
  ├─ audit dan idempotency handling
  └─ integrasi server-side (Gemini, integrasi masa depan)
                                      │
                                      ▼
Database relasional persisten (diusulkan: PostgreSQL)
  ├─ migration dan constraint
  ├─ record transaksi/pembayaran/stok
  └─ proses backup dan restore
```

**Default yang diusulkan:** PostgreSQL sebagai sumber kebenaran yang dibagi di lingkungan deployment. SQLite bisa dipertimbangkan untuk local development atau pilot single-device hanya setelah kebutuhan deployment dan concurrency disepakati. Implementasi in-memory saat ini harus diperlakukan sebagai data demo, bukan data yang otomatis diasumsikan sebagai record otoritatif.

**Keputusan yang perlu dibuat:** pilih ORM/query layer (misalnya Prisma atau Drizzle) dan target hosting setelah tim menilai kebutuhan operasi.

## 7. Garis besar model data (diusulkan)

Entitas relasional utama:

- `users`, `credentials`, `roles` / assignment role, `stores`, dan permission yang bersifat scoped.
- `products`, `variants`, `prices`, `stock_balances`, dan `stock_movements` yang bersifat append-only.
- `sales`, `sale_items`, `payments`, dan `approvals`.
- `idempotency_records` dan `audit_events`.
- `offline_sync_events` atau record serupa yang menangani rekonsiliasi client.

Invarian penting:

- Gunakan transaction database untuk penjualan, pembayaran, pergerakan stok, dan penulisan ledger terkait.
- Simpan uang sebagai integer unit minor (rupiah integer) kecuali model mata uang yang terdokumentasi memerlukan pendekatan berbeda.
- Terapkan unik identifier dan kunci idempotency di layer database.
- Simpan histori pergerakan stok; jangan memakai balance dari client sebagai sumber kebenaran.
- Definisikan aturan penghapusan/retensi untuk data pelanggan dan karyawan.

## 8. Arah kontrak API (diusulkan)

Gunakan endpoint yang terversi dan berorientasi resource, bukan terus memperluas dispatcher generik yang tidak terdokumentasi. Kontrak `/api/exec` yang ada bisa dipertahankan untuk transisi sementara sambil fitur migrasi ke struktur baru.

| Method dan path | Tujuan | Otorisasi (usulan awal) |
|---|---|---|
| `POST /api/v1/auth/login` | Autentikasi user/PIN | Publik, dibatasi rate-limit |
| `POST /api/v1/auth/logout` | Batalkan session | Terautentikasi |
| `GET /api/v1/me` | Mengembalikan actor dan scope toko yang diizinkan | Terautentikasi |
| `GET /api/v1/products` | Mencari produk dan varian | Terautentikasi |
| `GET /api/v1/stores/:storeId/stock` | Membaca stok toko yang berwenang | Scoped per toko |
| `POST /api/v1/sales` | Membuat penjualan dengan idempotency key | Kasir/manager/owner, scoped per toko |
| `POST /api/v1/approvals` | Membuat request approval | Policy role/action |
| `POST /api/v1/approvals/:id/decision` | Menyetujui atau menolak | Approver yang berwenang; tanpa self-approval jika policy mengharuskan |
| `GET /api/v1/reports/sales` | Membaca laporan penjualan | Policy owner/manager |
| `POST /api/v1/gemini/advisor` | Meminta teks saran | Terautentikasi, rate-limited, secret hanya server-side |

Bentuk response error yang diusulkan:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request tidak valid.",
    "request_id": "client-generated-or-server-generated-id",
    "details": []
  }
}
```

Jangan kembalikan stack trace, credential, detail database internal, atau field sensitif pelanggan/karyawan di error.

## 9. Persyaratan keamanan dan privasi

- Ganti PIN demo dan pemilihan role dengan autentikasi server-side yang nyata. Hash credential memakai algoritma hashing yang sesuai dengan work factor; jangan bandingkan input PIN langsung dengan plaintext yang tersimpan.
- Jangan menerima `role` atau `user_id` dari client sebagai bukti identitas. Ambil aktor dan scope toko dari session yang sudah diverifikasi.
- Terapkan otorisasi per aksi bisnis dan scope toko; tambahkan test untuk akses yang ditolak.
- Simpan credensial Gemini hanya di environment/server secrets. Hapus fallback `window.VITE_GEMINI_API_KEY` dan verifikasi asset build tidak menampilkan secret.
- Validasi setiap endpoint/mode dengan schema dan batas eksplisit. Validasi envelope request saja tidak cukup.
- Pakai HTTPS di deployment, pengaturan session/cookie aman (atau desain token yang sudah ditinjau), CSRF protection bila pakai cookie-based auth, dan CSP yang ketat setelah integrasi frontend ditinjau.
- Gunakan shared rate-limit store bila scale horizontal. Konfigurasi trust proxy hanya bila topologi deployment sudah jelas.
- Minimalkan data personal dan finansial yang dikembalikan ke client dan disimpan di log. Definisikan aturan akses, retensi, enkripsi backup, dan prosedur incident response.
- Jangan klaim enkripsi IndexedDB melindungi dari penyerang yang mengendalikan browser/device pengguna; prioritaskan akses perangkat dan otorisasi server-side.

## 10. Aturan offline dan sinkronisasi

- Hanya operasi yang sudah disetujui yang dapat diqueue saat offline; kandidat utama adalah draft transaksi penjualan.
- Setiap operasi yang diqueue wajib punya kunci idempotency yang unik, version schema, waktu pembuatan, dan data bisnis yang diperlukan. Jangan sertakan secret API atau credentials yang dapat dipakai ulang.
- Validasi server tetap otoritatif untuk harga, stok, permission, dan status pembayaran.
- Response sync harus jelas: accepted, already processed, rejected validation, rejected conflict, atau retryable server failure.
- Jangan otomatis retry kesalahan validasi/otorisasi yang bersifat permanen. Lakukan retry untuk gangguan jaringan atau server transient dengan backoff eksponensial terbatas dan jitter.
- Pertahankan hasil asli dan sediakan workflow operator untuk transaksi yang ditolak/berkonflik; jangan membuang antrian secara diam-diam.

## 11. Keandalan, operasi, dan kualitas

Target awal yang diusulkan (harus dikonfirmasi sebelum dianggap komitmen):

- Latensi API: p95 di bawah 500 ms untuk read dasar dan di bawah 2 detik untuk write penjualan standar, tanpa menghitung panggilan AI eksternal.
- Ketersediaan: tentukan target pilot sebelum production; 99.9% tidak otomatis diasumsikan tanpa hosting, monitoring, dan on-call.
- Recovery: definisikan RPO (recovery point objective) dan RTO (recovery time objective) sebelum memilih jadwal backup.
- Automated tests: unit test untuk business rules; integration test terhadap database persisten sementara; API test untuk auth, permission, validasi, idempotency, dan concurrency stok.
- CI: install dependency, typecheck/lint, test, build production, dan pemeriksaan dependency/security.
- Observability: request ID terstruktur, log yang telah redacted, health/readiness endpoint, monitoring error, dan alert untuk database/backup.

## 12. Fase pengembangan (diusulkan)

### Fase 0 — setuju dan dokumentasikan

Pastikan MVP, model role, scope toko, asumsi deployment, dan retensi data disepakati. Catat keputusan di bawah ini sebelum desain schema.

### Fase 1 — fondasi

Tambahkan database persisten, migration, boundary repository/service, autentikasi, otorisasi, validasi schema, dan CI otomatis. Data seed demo harus dipisahkan jelas dari data bisnis nyata.

### Fase 2 — core operasional

Implementasikan produk, pergerakan stok, penjualan POS, pembayaran, idempotency, aturan approval, dan riwayat audit dengan database transaction dan integration tests.

### Fase 3 — offline dan operasional

Implementasikan rekonsiliasi queue offline, backup/restore yang terverifikasi, deployment, monitoring, dan prosedur recovery yang terdokumentasi.

### Fase 4 — modul tambahan

Tambahkan laporan, lalu prioritaskan payroll, konsinyasi, voucher, WhatsApp, dan Gemini berdasarkan nilai bisnis serta kebutuhan legal/security.

### Fase 5 — hardening

Security audit, test, CI/CD, deployment, monitoring, dan validasi production readiness.

## 13. Keputusan yang perlu dibahas

Mohon dijawab atau diedit poin ini sebelum kita anggap ini sebagai kontrak implementasi:

1. Apakah rilisan pertama untuk satu toko atau banyak toko?
2. Login memakai PIN atau akun nyata? Role mana yang wajib untuk MVP?
3. Operasi offline apa yang wajib ada di hari pertama, dan apakah penjualan bisa tetap tertahan sampai rekonsiliasi server?
4. Apakah PostgreSQL diterima sebagai source of truth produksi? Lingkungan hosting yang dimaksud dimana?
5. Apakah harga selalu integer IDR, dan metode pembayaran apa yang harus diverifikasi sebelum penjualan dianggap terbayar?
6. Aturan approval dan separation-of-duties apa yang harus diterapkan untuk diskon, void, transfer, dan opname stok?
7. Data apa yang harus dipertahankan, dan RPO/RTO backup yang diterima?
8. Modul mana yang benar-benar masuk rilisan pertama: POS, stok, kas/jurnal, laporan, payroll, konsinyasi, voucher, WhatsApp, atau AI?
9. Apakah teks saran Gemini diperbolehkan menerima data transaksi/business, dan data apa yang harus dikecualikan?
10. Apakah kontrak `/api/exec` harus dipertahankan untuk transisi atau langsung diganti?

## 14. Catatan perubahan

- **v0.1:** Draft diskusi awal. Menangkap keterbatasan repo dan mengusulkan MVP, arsitektur, kebutuhan, arah API, baseline keamanan, dan keputusan yang perlu disepakati. Tidak ada migrasi autentikasi/persistensi yang diklaim sudah selesai.

## 15. Ringkasan keputusan awal yang disarankan

Supaya implementasi tidak meluas terlalu cepat, saya sarankan kita sepakati ini dulu:

- MVP fokus ke: POS + stok + laporan + approval dasar + auth real
- Database target: PostgreSQL
- Role: Owner, Manager, Kasir, Gudang
- Offline queue: wajib untuk transaksi jual, tapi hanya untuk operasi yang benar-benar aman
- Gemini: masuk setelah core stabil
- `/api/exec` tetap ada hanya sebagai compatibility layer, bukan source of truth untuk arsitektur baru

Kalau setuju, kita bisa lanjut ke tahap berikutnya: membuat spesifikasi yang lebih rinci per modul dan mulai merancang schema database + API contract yang siap dipakai di implementasi.




















































































































































































