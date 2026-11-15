import { randomUUID } from 'node:crypto';

export type OfflineQueueStatus = 'PENDING' | 'SYNCED' | 'FAILED' | 'NEEDS_REVIEW';

export type OfflineQueueItem = {
  id: string;
  storeId: string;
  entityType: 'sale';
  payload: Record<string, unknown>;
  status: OfflineQueueStatus;
  retryCount: number;
  createdAt: string;
  syncedAt?: string;
};

const offlineQueue = new Map<string, OfflineQueueItem>();

export function enqueueOfflineSale(payload: Record<string, unknown>, storeId: string): OfflineQueueItem {
  const id = randomUUID();
  const item: OfflineQueueItem = {
    id,
    storeId,
    entityType: 'sale',
    payload,
    status: 'PENDING',
    retryCount: 0,
    createdAt: new Date().toISOString(),
  };
  offlineQueue.set(id, item);
  return item;
}

export function getOfflineQueueStatus(): { total: number; pending: number; synced: number; failed: number; needsReview: number } {
  const all = [...offlineQueue.values()];
  return {
    total: all.length,
    pending: all.filter((item) => item.status === 'PENDING').length,
    synced: all.filter((item) => item.status === 'SYNCED').length,
    failed: all.filter((item) => item.status === 'FAILED').length,
    needsReview: all.filter((item) => item.status === 'NEEDS_REVIEW').length,
  };
}

export function syncOfflineQueue(): { synced: number; failed: number; needsReview: number; total: number } {
  let synced = 0;
  let failed = 0;
  let needsReview = 0;

  for (const item of offlineQueue.values()) {
    if (item.status === 'SYNCED') {
      synced += 1;
      continue;
    }

    if (item.status === 'FAILED') {
      failed += 1;
      continue;
    }

    if (item.status === 'NEEDS_REVIEW') {
      needsReview += 1;
      continue;
    }

    item.retryCount += 1;
    item.status = 'SYNCED';
    item.syncedAt = new Date().toISOString();
    synced += 1;
  }

  return { synced, failed, needsReview, total: offlineQueue.size };
}
