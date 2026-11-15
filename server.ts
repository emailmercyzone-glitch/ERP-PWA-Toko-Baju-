/**
 * Full-Stack Express Entry Point
 * Toko Baju UMKM ERP PWA + GAS (v40.1)
 */

import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { executeAPIMode } from './src/services/apiEngine';
import { askGeminiAdvisor } from './src/services/geminiService';
import { db } from './src/services/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --------------------------------------------------
// API ENDPOINTS
// --------------------------------------------------

// 1. Core GAS API Executor Endpoint (22 Modes)
app.post('/api/exec', (req: Request, res: Response) => {
  try {
    const result = executeAPIMode(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      request_id: req.body?.request_id || 'REQ-ERR',
      data: null,
      error: { code: 'INTERNAL_001', message: err?.message || 'Server error' }
    });
  }
});

// 2. Gemini AI Advisor Proxy
app.post('/api/gemini/advisor', async (req: Request, res: Response) => {
  try {
    const { query, toko_id } = req.body;
    const answer = await askGeminiAdvisor(query || 'Berikan analisis performa penjualan hari ini.', toko_id || 'TKO1');
    res.json({ ok: true, answer });
  } catch (err: any) {
    res.json({ ok: false, error: err?.message || 'Error AI' });
  }
});

// 3. Receipt Thermal Print HTML Endpoint
app.get('/api/print/receipt/:trxId', (req: Request, res: Response) => {
  const trxId = req.params.trxId;
  const trx = db.transaksiPenjualan.find((t) => t.transaction_id === trxId);
  const details = db.transaksiDetail.filter((d) => d.transaction_id === trxId);
  const toko = db.masterToko.find((t) => t.toko_id === trx?.toko_id);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Struk ${trxId}</title>
  <style>
    body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; background: #fff; color: #000; }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .line { border-bottom: 1px dashed #000; margin: 6px 0; }
    .flex { display: flex; justify-content: space-between; }
  </style>
</head>
<body onload="window.print()">
  <div class="center bold">${toko?.nama || 'TOKO BAJU UMKM'}</div>
  <div class="center">${toko?.alamat || 'Jl. Utama Mall Lt. 2'}</div>
  <div class="center">WA: 0812-3456-7890</div>
  <div class="line"></div>
  <div>No: ${trxId}</div>
  <div>Tgl: ${trx?.tanggal || new Date().toLocaleDateString('id-ID')}</div>
  <div>Kasir: ${trx?.kasir_id || 'Kasir 1'}</div>
  <div class="line"></div>
  ${details.map((d) => `
    <div>${d.sku}</div>
    <div class="flex">
      <span>${d.qty} x ${d.harga_jual_satuan.toLocaleString('id-ID')}</span>
      <span>${(d.qty * d.harga_jual_satuan).toLocaleString('id-ID')}</span>
    </div>
  `).join('')}
  <div class="line"></div>
  <div class="flex"><span>Subtotal:</span><span>Rp ${(trx?.subtotal_barang || 0).toLocaleString('id-ID')}</span></div>
  ${trx?.diskon_amount ? `<div class="flex"><span>Diskon:</span><span>-Rp ${trx.diskon_amount.toLocaleString('id-ID')}</span></div>` : ''}
  ${trx?.pajak_amount ? `<div class="flex"><span>Pajak 1 (11%):</span><span>Rp ${trx.pajak_amount.toLocaleString('id-ID')}</span></div>` : ''}
  ${trx?.delivery_amount ? `<div class="flex"><span>Delivery:</span><span>Rp ${trx.delivery_amount.toLocaleString('id-ID')}</span></div>` : ''}
  ${trx?.packaging_amount ? `<div class="flex"><span>Packaging:</span><span>Rp ${trx.packaging_amount.toLocaleString('id-ID')}</span></div>` : ''}
  <div class="line"></div>
  <div class="flex bold"><span>TOTAL:</span><span>Rp ${(trx?.total || 0).toLocaleString('id-ID')}</span></div>
  <div class="line"></div>
  <div class="center">Terima Kasih Atas Kunjungan Anda!</div>
  <div class="center">Barang yang sudah dibeli dapat ditukar max 3 hari.</div>
</body>
</html>
  `;
  res.send(html);
});

// 4. Document Generator Endpoint (Invoice, Kwitansi, Surat Jalan, Quotation)
app.get('/api/dokumen/pdf/:tipe/:id', (req: Request, res: Response) => {
  const { tipe, id } = req.params;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${tipe.toUpperCase()} - ${id}</title>
  <style>
    body { font-family: sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #334155; padding-bottom: 20px; }
    .title { font-size: 24px; font-weight: bold; color: #0f172a; }
    .table { width: 100%; border-collapse: collapse; margin-top: 30px; }
    .table th, .table td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
    .table th { background-color: #f1f5f9; }
    .right { text-align: right; }
    .total { margin-top: 20px; font-size: 18px; font-weight: bold; text-align: right; }
  </style>
</head>
<body onload="window.print()">
  <div class="header">
    <div>
      <div class="title">CV MERPATI INDAH BUSBANA (ERP)</div>
      <div>NPWP: 01.234.567.8-012.000 (Snapshot Master_NPWP)</div>
      <div>Grand Indonesia Lt. 2 No. 15, Jakarta</div>
    </div>
    <div style="text-align: right;">
      <div class="title">${tipe.toUpperCase()}</div>
      <div>Nomor: ${tipe.substring(0, 3).toUpperCase()}-TKO1-20261113-0001</div>
      <div>Tanggal: ${new Date().toLocaleDateString('id-ID')}</div>
    </div>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>No</th>
        <th>Deskripsi / SKU</th>
        <th>Qty</th>
        <th>Harga Satuan</th>
        <th class="right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>OWN-ERG-CLN-JNS-001-BLU-35 (Erigo Celana Jeans Slim Fit)</td>
        <td>1</td>
        <td>Rp 250.000</td>
        <td class="right">Rp 250.000</td>
      </tr>
    </tbody>
  </table>

  <div class="total">
    Total Pembayaran: Rp 250.000
  </div>

  <div style="margin-top: 50px; display: flex; justify-content: space-between;">
    <div>
      <div>Penerima / Hormat Kami,</div>
      <div style="height: 60px;"></div>
      <div>( _____________________ )</div>
    </div>
    <div style="text-align: right;">
      <div>Kasir / Manager,</div>
      <div style="height: 60px;"></div>
      <div>( Budi Manager )</div>
    </div>
  </div>
</body>
</html>
  `;
  res.send(html);
});

// --------------------------------------------------
// VITE DEV SERVER MIDDLEWARE MOUNTING
// --------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await vite.transformIndexHtml(url, `
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ERP PWA Toko Baju UMKM</title>
    <meta name="description" content="Aplikasi ERP PWA + GAS v40.1 lengkap untuk Toko Baju UMKM dengan POS Kasir, Gudang, Sync, Approval, Kas & Jurnal, Retur, Opname, dan Gemini AI Insights." />
    <meta property="og:title" content="ERP PWA Toko Baju UMKM" />
    <meta property="og:description" content="Aplikasi ERP PWA + GAS v40.1 lengkap untuk Toko Baju UMKM." />
    <meta property="og:type" content="website" />
    <meta name="theme-color" content="#0f172a" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body class="bg-slate-900 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
        `);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 ERP Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
