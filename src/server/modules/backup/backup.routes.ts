import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import type { AuthUser } from '../auth/auth.service';
import { financeSnapshot, restoreFinance } from '../finance/finance.service';
import { getInventorySnapshot, restoreInventorySnapshot, getAllSales, restoreSalesSnapshot, getStockMovements } from '../sales/sale.service';
import { getReturns, getStocktakes } from '../stock/inventory.service';
import { randomUUID } from 'node:crypto';

type Snapshot = { schemaVersion: 1; createdAt: string; inventory: ReturnType<typeof getInventorySnapshot>; sales: ReturnType<typeof getAllSales>; finance: ReturnType<typeof financeSnapshot>; movements: ReturnType<typeof getStockMovements>; stocktakes: ReturnType<typeof getStocktakes>; returns: ReturnType<typeof getReturns> };
const backups = new Map<string, Snapshot>();
export const backupRoutes = Router(); backupRoutes.use(requireAuth);
backupRoutes.post('/create', (req, res) => {
  const user = res.locals.authUser as AuthUser;
  if (user.role !== 'OWNER') return res.status(403).json({ success: false, code: 'ROLE_FORBIDDEN', message: 'Hanya owner yang dapat membuat backup.' });
  const snapshot: Snapshot = { schemaVersion: 1, createdAt: new Date().toISOString(), inventory: getInventorySnapshot(), sales: getAllSales(), finance: financeSnapshot(), movements: getStockMovements(), stocktakes: getStocktakes(), returns: getReturns() };
  const backupId = randomUUID(); backups.set(backupId, snapshot);
  return res.status(201).json({ success: true, message: 'Backup logis dibuat di memori server (sementara).', data: { backupId, createdAt: snapshot.createdAt, schemaVersion: snapshot.schemaVersion } });
});
backupRoutes.get('/:id', (req, res) => {
  const user = res.locals.authUser as AuthUser; if (user.role !== 'OWNER') return res.status(403).json({ success: false, code: 'ROLE_FORBIDDEN' });
  const snapshot = backups.get(req.params.id); if (!snapshot) return res.status(404).json({ success: false, code: 'BACKUP_NOT_FOUND' });
  return res.json({ success: true, data: snapshot });
});
backupRoutes.post('/restore', (req, res) => {
  const user = res.locals.authUser as AuthUser; if (user.role !== 'OWNER') return res.status(403).json({ success: false, code: 'ROLE_FORBIDDEN', message: 'Hanya owner yang dapat restore.' });
  const { backupId, confirm } = req.body ?? {}; const snapshot = backups.get(backupId);
  if (confirm !== true) return res.status(400).json({ success: false, code: 'CONFIRMATION_REQUIRED', message: 'Kirim confirm: true untuk konfirmasi restore.' });
  if (!snapshot) return res.status(404).json({ success: false, code: 'BACKUP_NOT_FOUND', message: 'Backup tidak ditemukan.' });
  try {
    restoreInventorySnapshot(snapshot.inventory.map(({ storeId, variantId, quantity }) => ({ storeId, variantId, quantity })));
    restoreSalesSnapshot(snapshot.sales); restoreFinance(snapshot.finance);
    return res.json({ success: true, message: 'Data bisnis berhasil dipulihkan dari snapshot in-memory.', data: { backupId, restoredAt: new Date().toISOString() } });
  } catch { return res.status(400).json({ success: false, code: 'BACKUP_INVALID', message: 'Snapshot tidak valid; restore dibatalkan.' }); }
});
