/**
 * Offline IndexedDB Storage & Background Sync Queue
 * Toko Baju UMKM ERP PWA (v40.1)
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { JualRequestPayload, JualResponseData } from '../types/erp';
import { executeAPIMode } from './apiEngine';

interface OfflineDB extends DBSchema {
  offline_sales_queue: {
    key: string; // request_id or transaction_id
    value: {
      id: string;
      request_id: string;
      payload: JualRequestPayload;
      timestamp: string;
      status: 'QUEUED' | 'SYNCED' | 'FAILED';
      retryCount: number;
      error?: string;
    };
    indexes: { 'by-status': string };
  };
  cached_masters: {
    key: string;
    value: {
      type: string;
      data: any;
      updatedAt: string;
    };
  };
}

const DB_NAME = 'erp_baju_offline_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

export function getOfflineDB() {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('offline_sales_queue')) {
          const store = db.createObjectStore('offline_sales_queue', { keyPath: 'id' });
          store.createIndex('by-status', 'status');
        }
        if (!db.objectStoreNames.contains('cached_masters')) {
          db.createObjectStore('cached_masters', { keyPath: 'type' });
        }
      },
    });
  }
  return dbPromise;
}

// Save a sale to offline queue
export async function queueOfflineSale(payload: JualRequestPayload): Promise<string> {
  const db = await getOfflineDB();
  const requestId = `offline-req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const id = payload.transaction_id || `TRX-OFFLINE-${Date.now()}`;

  await db.put('offline_sales_queue', {
    id,
    request_id: requestId,
    payload: {
      ...payload,
      transaction_id: id,
    },
    timestamp: new Date().toISOString(),
    status: 'QUEUED',
    retryCount: 0,
  });

  return id;
}

// Get all pending offline sales
export async function getPendingOfflineSales() {
  const db = await getOfflineDB();
  return db.getAllFromIndex('offline_sales_queue', 'by-status', 'QUEUED');
}

// Sync all queued offline sales to the server/API Engine
export async function syncOfflineSalesQueue(): Promise<{
  successCount: number;
  failedCount: number;
  results: { id: string; success: boolean; message?: string }[];
}> {
  const db = await getOfflineDB();
  const queuedItems = await db.getAllFromIndex('offline_sales_queue', 'by-status', 'QUEUED');

  let successCount = 0;
  let failedCount = 0;
  const results: { id: string; success: boolean; message?: string }[] = [];

  for (const item of queuedItems) {
    try {
      const response = executeAPIMode({
        mode: 'jual',
        request_id: item.request_id,
        payload: item.payload,
      });

      if (response.ok && response.data) {
        // Mark as synced
        item.status = 'SYNCED';
        await db.put('offline_sales_queue', item);
        successCount++;
        results.push({ id: item.id, success: true });
      } else {
        item.retryCount += 1;
        item.error = response.error?.message || 'Gagal sinkronisasi';
        if (item.retryCount >= 5) {
          item.status = 'FAILED';
        }
        await db.put('offline_sales_queue', item);
        failedCount++;
        results.push({ id: item.id, success: false, message: item.error });
      }
    } catch (err: any) {
      item.retryCount += 1;
      item.error = err?.message || 'Network exception';
      await db.put('offline_sales_queue', item);
      failedCount++;
      results.push({ id: item.id, success: false, message: item.error });
    }
  }

  return { successCount, failedCount, results };
}

// Clear synced records older than 7 days
export async function cleanupOldSyncedRecords() {
  const db = await getOfflineDB();
  const all = await db.getAll('offline_sales_queue');
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  for (const item of all) {
    if (item.status === 'SYNCED') {
      const itemTime = new Date(item.timestamp).getTime();
      if (now - itemTime > sevenDays) {
        await db.delete('offline_sales_queue', item.id);
      }
    }
  }
}
