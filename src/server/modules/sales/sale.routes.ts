import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { createSale, getSaleById, SaleError, type SaleCreateInput } from './sale.service';
import type { AuthUser } from '../auth/auth.service';

export const saleRoutes = Router();
saleRoutes.use(requireAuth);

function canAccessStore(user: AuthUser, storeId: string): boolean {
  return user.role === 'OWNER' || user.storeIds.includes(storeId);
}

saleRoutes.post('/', (req, res) => {
  const user = res.locals.authUser as AuthUser;
  const body = req.body ?? {};
  if (typeof body.storeId !== 'string' || !Array.isArray(body.items)) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'storeId dan items wajib diisi.' });
  }
  if (!canAccessStore(user, body.storeId)) {
    return res.status(403).json({ success: false, code: 'STORE_FORBIDDEN', message: 'Kamu tidak punya akses ke toko ini.' });
  }
  if (!['OWNER', 'MANAGER', 'CASHIER'].includes(user.role)) {
    return res.status(403).json({ success: false, code: 'ROLE_FORBIDDEN', message: 'Peran ini tidak dapat membuat penjualan.' });
  }
  const input: SaleCreateInput = {
    storeId: body.storeId,
    cashierId: user.id,
    items: body.items,
    discountAmount: body.discountAmount,
    paymentMethod: body.paymentMethod,
    paymentAmount: body.paymentAmount,
    idempotencyKey: req.header('Idempotency-Key') ?? body.idempotencyKey,
  };
  try {
    const result = createSale(input);
    return res.status(result.replayed ? 200 : 201).json({ success: true, replayed: result.replayed, data: result.sale });
  } catch (error) {
    if (error instanceof SaleError) return res.status(error.status).json({ success: false, code: error.code, message: error.message });
    return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Penjualan gagal diproses.' });
  }
});

saleRoutes.get('/:id', (req, res) => {
  const user = res.locals.authUser as AuthUser;
  const sale = getSaleById(req.params.id);
  if (!sale) return res.status(404).json({ success: false, code: 'SALE_NOT_FOUND', message: 'Transaksi tidak ditemukan.' });
  if (!canAccessStore(user, sale.storeId)) return res.status(403).json({ success: false, code: 'STORE_FORBIDDEN', message: 'Kamu tidak punya akses ke toko ini.' });
  return res.json({ success: true, data: sale });
});
