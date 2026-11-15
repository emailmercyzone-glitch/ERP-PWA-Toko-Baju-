import { Router } from 'express';

export const offlineRoutes = Router();

offlineRoutes.get('/status', async (_req, res) => {
  res.json({
    success: true,
    data: {
      online: true,
      pendingQueue: 0,
      failedQueue: 0,
    },
  });
});

offlineRoutes.post('/sync', async (_req, res) => {
  res.json({
    success: true,
    message: 'Offline sync processed',
    data: {
      synced: 0,
      failed: 0,
      needsReview: 0,
    },
  });
});
