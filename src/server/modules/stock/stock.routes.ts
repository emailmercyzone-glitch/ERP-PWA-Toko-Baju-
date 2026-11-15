import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import type { AuthUser } from '../auth/auth.service';
import { createReturn, createStocktake, getReturns, getStocktakes, InventoryError, inventorySnapshot } from './inventory.service';
import { getAllSales, getInventorySnapshot } from '../sales/sale.service';

export const stockRoutes = Router();
stockRoutes.use(requireAuth);
function canAccess(user: AuthUser, storeId: string) { return user.role === 'OWNER' || user.storeIds.includes(storeId); }
stockRoutes.get('/:storeId', (req, res) => {
  const user = res.locals.authUser as AuthUser; const { storeId } = req.params;
  if (!canAccess(user, storeId)) return res.status(403).json({ success: false, code: 'STORE_FORBIDDEN', message: 'Akses toko ditolak.' });
  return res.json({ success: true, data: inventorySnapshot().filter((item) => item.storeId === storeId).map((item) => ({ variantId: item.variantId, sku: item.sku, qty: item.quantity })) });
});
stockRoutes.post('/opname', (req, res) => {
  const user = res.locals.authUser as AuthUser; const body = req.body ?? {};
  if (!['OWNER', 'MANAGER', 'WAREHOUSE'].includes(user.role)) return res.status(403).json({ success: false, code: 'ROLE_FORBIDDEN', message: 'Peran ini tidak dapat melakukan stok opname.' });
  if (!canAccess(user, body.storeId)) return res.status(403).json({ success: false, code: 'STORE_FORBIDDEN', message: 'Akses toko ditolak.' });
  try { const result = createStocktake({ ...body, createdBy: user.id, idempotencyKey: req.header('Idempotency-Key') ?? body.idempotencyKey }); return res.status(201).json({ success: true, data: result }); }
  catch (error) { if (error instanceof InventoryError) return res.status(error.status).json({ success: false, code: error.code, message: error.message }); throw error; }
});
stockRoutes.post('/returns', (req, res) => {
  const user = res.locals.authUser as AuthUser; const body = req.body ?? {};
  if (!['OWNER', 'MANAGER', 'CASHIER'].includes(user.role)) return res.status(403).json({ success: false, code: 'ROLE_FORBIDDEN', message: 'Peran ini tidak dapat memproses retur.' });
  if (!canAccess(user, body.storeId)) return res.status(403).json({ success: false, code: 'STORE_FORBIDDEN', message: 'Akses toko ditolak.' });
  try { const result = createReturn({ ...body, createdBy: user.id, idempotencyKey: req.header('Idempotency-Key') ?? body.idempotencyKey }, getAllSales()); return res.status(201).json({ success: true, data: result }); }
  catch (error) { if (error instanceof InventoryError) return res.status(error.status).json({ success: false, code: error.code, message: error.message }); throw error; }
});
stockRoutes.get('/opname/list', (_req, res) => res.json({ success: true, data: getStocktakes() }));
stockRoutes.get('/returns/list', (_req, res) => res.json({ success: true, data: getReturns() }));
