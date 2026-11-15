import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import type { AuthUser } from '../auth/auth.service';
import { enqueueOfflineSale, getOfflineQueueStatus, syncOfflineQueue } from './offline.service';

export const offlineRoutes = Router();
offlineRoutes.use(requireAuth);

function canAccessStore(user: AuthUser, storeId: string): boolean {
  return user.role === 'OWNER' || user.storeIds.includes(storeId);
}

offlineRoutes.get('/status', (req, res) => {
  const user = res.locals.authUser as AuthUser;
  if (user.role !== 'OWNER' && user.role !== 'MANAGER') {
    return res.status(403).json({ success: false, code: 'ROLE_FORBIDDEN', message: 'Hanya owner/manager yang bisa melihat status sync.' });
  }
  return res.json({ success: true, data: getOfflineQueueStatus() });
});

offlineRoutes.post('/sync', (req, res) => {
  const user = res.locals.authUser as AuthUser;
  if (user.role !== 'OWNER' && user.role !== 'MANAGER') {
    return res.status(403).json({ success: false, code: 'ROLE_FORBIDDEN', message: 'Hanya owner/manager yang bisa sync data.' });
  }
  const { storeId, payload } = req.body ?? {};
  if (typeof storeId === 'string' && !canAccessStore(user, storeId)) {
    return res.status(403).json({ success: false, code: 'STORE_FORBIDDEN', message: 'Kamu tidak punya akses ke toko ini.' });
  }

  if (payload) {
    enqueueOfflineSale(payload, storeId ?? user.storeIds[0] ?? 'store-1');
  }

  const result = syncOfflineQueue();
  return res.json({ success: true, message: 'Sync offline selesai.', data: result });
});

offlineRoutes.post('/queue', (req, res) => {
  const user = res.locals.authUser as AuthUser;
  const { storeId, payload } = req.body ?? {};
  if (!storeId || !payload || typeof storeId !== 'string') {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'storeId dan payload wajib diisi.' });
  }
  if (!canAccessStore(user, storeId)) {
    return res.status(403).json({ success: false, code: 'STORE_FORBIDDEN', message: 'Kamu tidak punya akses ke toko ini.' });
  }
  const item = enqueueOfflineSale(payload, storeId);
  return res.status(201).json({ success: true, data: item });
});
