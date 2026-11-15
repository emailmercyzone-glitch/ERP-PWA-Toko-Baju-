import { Router } from 'express';

export const reportRoutes = Router();

reportRoutes.get('/dashboard', async (_req, res) => {
  res.json({
    success: true,
    data: {
      totalSalesToday: 1250000,
      totalTransactions: 24,
      bestSeller: 'Kaos Polos',
      lowStockCount: 3,
      pendingSync: 2,
    },
  });
});

reportRoutes.get('/sales', async (_req, res) => {
  res.json({
    success: true,
    data: {
      rows: [
        { date: '2026-11-15', total: 1250000, transactions: 24 },
      ],
    },
  });
});

reportRoutes.get('/stock', async (_req, res) => {
  res.json({
    success: true,
    data: [
      { sku: 'BJU-001-S', qty: 12, status: 'OK' },
      { sku: 'BJU-001-M', qty: 7, status: 'LOW' },
    ],
  });
});
