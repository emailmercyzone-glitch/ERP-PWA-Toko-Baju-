/**
 * Express entry point for the ERP PWA.
 * This API still uses the demo in-memory database; do not expose it as a production ERP.
 */
import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { executeAPIMode } from './src/services/apiEngine';
import { askGeminiAdvisor } from './src/services/geminiService';
import { db } from './src/services/db';

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const dirname = path.dirname(fileURLToPath(import.meta.url));

// Basic hardening headers. CSP is intentionally not set until all frontend assets
// and third-party integrations have been audited for a compatible policy.
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  if (isProduction) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use(express.json({ limit: '256kb', strict: true }));

// Process-local limiter is a baseline only (not shared between replicas).
type RateEntry = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateEntry>();
function rateLimit(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = `${req.ip}:${req.path}`;
    let entry = rateBuckets.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      rateBuckets.set(key, entry);
    }
    entry.count += 1;
    res.setHeader('RateLimit-Limit', String(limit));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, limit - entry.count)));
    if (entry.count > limit) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      res.status(429).json({ ok: false, error: { code: 'RATE_LIMITED', message: 'Terlalu banyak permintaan. Coba lagi nanti.' } });
      return;
    }
    next();
  };
}
// Bound map growth from clients with changing IPs; expired entries are pruned periodically.
const pruneTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateBuckets) if (entry.resetAt <= now) rateBuckets.delete(key);
}, 60_000);
pruneTimer.unref();

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]!);
}

app.get('/api/health', (_req, res) => res.json({ ok: true, mode: isProduction ? 'production' : 'development' }));

// API Executor: validate the outer envelope before it reaches the business engine.
app.post('/api/exec', rateLimit(120, 60_000), (req: Request, res: Response) => {
  const body: unknown = req.body;
  if (!isRecord(body) || typeof body.mode !== 'string' || body.mode.length > 64 ||
      typeof body.request_id !== 'string' || body.request_id.length < 1 || body.request_id.length > 128 ||
      !isRecord(body.payload)) {
    res.status(400).json({
      ok: false,
      request_id: isRecord(body) && typeof body.request_id === 'string' ? body.request_id.slice(0, 128) : 'REQ-INVALID',
      data: null,
      error: { code: 'VAL_001', message: 'Format request tidak valid.' }
    });
    return;
  }

  try {
    res.json(executeAPIMode(body as Parameters<typeof executeAPIMode>[0]));
  } catch {
    // Avoid returning exception details or request payloads to clients.
    res.status(500).json({
      ok: false,
      request_id: body.request_id,
      data: null,
      error: { code: 'INTERNAL_001', message: 'Terjadi kesalahan internal.' }
    });
  }
});

app.post('/api/gemini/advisor', rateLimit(15, 60_000), async (req: Request, res: Response) => {
  const body: unknown = req.body;
  if (!isRecord(body) || (body.query !== undefined && typeof body.query !== 'string') ||
      (body.toko_id !== undefined && typeof body.toko_id !== 'string')) {
    res.status(400).json({ ok: false, error: { code: 'VAL_001', message: 'Format permintaan AI tidak valid.' } });
    return;
  }
  const query = typeof body.query === 'string' ? body.query.trim() : 'Berikan analisis performa penjualan hari ini.';
  const tokoId = typeof body.toko_id === 'string' ? body.toko_id : 'TKO1';
  if (query.length > 2000 || !/^(TKO[1-4]|GDG|ALL)$/.test(tokoId)) {
    res.status(400).json({ ok: false, error: { code: 'VAL_001', message: 'Query terlalu panjang atau toko tidak valid.' } });
    return;
  }
  try {
    const answer = await askGeminiAdvisor(query, tokoId);
    res.json({ ok: true, answer });
  } catch {
    res.status(502).json({ ok: false, error: { code: 'AI_001', message: 'Layanan AI sedang tidak tersedia.' } });
  }
});

app.get('/api/print/receipt/:trxId', (req, res) => {
  const trxId = req.params.trxId;
  const trx = db.transaksiPenjualan.find((item) => item.transaction_id === trxId);
  if (!trx) return res.status(404).send('Transaksi tidak ditemukan.');
  const details = db.transaksiDetail.filter((item) => item.transaction_id === trxId);
  const toko = db.masterToko.find((item) => item.toko_id === trx.toko_id);
  const money = (amount: number) => Number(amount || 0).toLocaleString('id-ID');
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Struk ${escapeHtml(trxId)}</title>
  <style>body{font-family:monospace;font-size:12px;width:280px;margin:0 auto;padding:10px;background:#fff;color:#000}.center{text-align:center}.bold{font-weight:bold}.line{border-bottom:1px dashed #000;margin:6px 0}.flex{display:flex;justify-content:space-between}</style></head>
  <body onload="window.print()"><div class="center bold">${escapeHtml(toko?.nama || 'TOKO BAJU UMKM')}</div><div class="center">${escapeHtml(toko?.alamat || '')}</div>
  <div class="line"></div><div>No: ${escapeHtml(trxId)}</div><div>Tgl: ${escapeHtml(trx.tanggal)}</div><div>Kasir: ${escapeHtml(trx.kasir_id)}</div><div class="line"></div>
  ${details.map((item) => `<div>${escapeHtml(item.sku)}</div><div class="flex"><span>${escapeHtml(item.qty)} x ${money(item.harga_jual_satuan)}</span><span>${money(item.qty * item.harga_jual_satuan)}</span></div>`).join('')}
  <div class="line"></div><div class="flex"><span>Subtotal:</span><span>Rp ${money(trx.subtotal_barang)}</span></div>
  ${trx.diskon_amount ? `<div class="flex"><span>Diskon:</span><span>-Rp ${money(trx.diskon_amount)}</span></div>` : ''}
  ${trx.pajak_amount ? `<div class="flex"><span>Pajak:</span><span>Rp ${money(trx.pajak_amount)}</span></div>` : ''}
  <div class="line"></div><div class="flex bold"><span>TOTAL:</span><span>Rp ${money(trx.total)}</span></div><div class="line"></div><div class="center">Terima kasih atas kunjungan Anda!</div></body></html>`;
  res.type('html').send(html);
});

// This endpoint currently renders a static document template, not a persisted invoice.
app.get('/api/dokumen/pdf/:tipe/:id', (req, res) => {
  const { tipe, id } = req.params;
  if (!/^[a-zA-Z_-]{1,32}$/.test(tipe) || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    return res.status(400).send('Parameter dokumen tidak valid.');
  }
  res.type('html').send(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${escapeHtml(tipe.toUpperCase())} - ${escapeHtml(id)}</title><style>body{font-family:sans-serif;padding:40px;color:#1e293b;max-width:800px;margin:auto}.title{font-size:24px;font-weight:bold}</style></head><body onload="window.print()"><div class="title">${escapeHtml(tipe.toUpperCase())}</div><p>Nomor: ${escapeHtml(id)}</p><p>Template dokumen demo. Data belum diambil dari database.</p></body></html>`);
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'custom' });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      try {
        const template = await vite.transformIndexHtml(req.originalUrl, `<!doctype html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="theme-color" content="#0f172a"><title>ERP PWA Toko Baju UMKM</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`);
        res.status(200).type('html').send(template);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });
  } else {
    const distPath = path.resolve(dirname, 'dist');
    app.use(express.static(distPath, { index: false, maxAge: '1d' }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distPath, 'index.html'), (error) => { if (error) next(error); });
    });
  }

  // Consistent parser / route errors without exposing stack traces.
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = isRecord(error) && typeof error.status === 'number' ? error.status : 500;
    res.status(status).json({ ok: false, error: { code: status === 413 ? 'PAYLOAD_TOO_LARGE' : 'INTERNAL_001', message: status < 500 ? 'Request tidak valid.' : 'Terjadi kesalahan internal.' } });
  });
  app.listen(PORT, () => console.log(`ERP PWA server listening on port ${PORT}`));
}

startServer().catch((error) => {
  console.error('Failed to start ERP server:', error instanceof Error ? error.message : 'unknown error');
  process.exitCode = 1;
});
