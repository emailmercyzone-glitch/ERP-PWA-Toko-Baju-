import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import type { AuthUser } from '../auth/auth.service';

export const reportRoutes = Router();
reportRoutes.use(requireAuth);

function canAccessStore(user: AuthUser, storeId: string): boolean {
  return user.role === 'OWNER' || user.storeIds.includes(storeId);
}

reportRoutes.get('/dashboard', (req, res) => {
  const user = res.locals.authUser as AuthUser;
  const storeId = req.query.storeId as string | undefined;
  if (storeId && !canAccessStore(user, storeId)) {
    return res.status(403).json({ success: false, code: 'STORE_FORBIDDEN', message: 'Kamu tidak punya akses ke toko ini.' });
  }

  const totalSalesToday = 1250000;
  const totalTransactions = 24;
  const bestSeller = 'Kaos Polos';
  const lowStockCount = 3;
  const pendingSync = 2;

  return res.json({
    success: true,
    data: { totalSalesToday, totalTransactions, bestSeller, lowStockCount, pendingSync },
  });
});

reportRoutes.get('/sales', (req, res) => {
  const user = res.locals.authUser as AuthUser;
  const storeId = req.query.storeId as string | undefined;
  if (storeId && !canAccessStore(user, storeId)) {
    return res.status(403).json({ success: false, code: 'STORE_FORBIDDEN', message: 'Kamu tidak punya akses ke toko ini.' });
  }

  return res.json({
    success: true,
    data: {
      rows: [{ date: '2026-11-15', total: 1250000, transactions: 24 }],
    },
  });
});

reportRoutes.get('/stock', (req, res) => {
  const user = res.locals.authUser as AuthUser;
  const storeId = req.query.storeId as string | undefined;
  if (storeId && !canAccessStore(user, storeId)) {
    return res.status(403).json({ success: false, code: 'STORE_FORBIDDEN', message: 'Kamu tidak punya akses ke toko ini.' });
  }

  return res.json({
    success: true,
    data: [
      { sku: 'BJU-001-S', qty: 12, status: 'OK' },
      { sku: 'BJU-001-M', qty: 7, status: 'LOW' },
    ],
  });
});
