import { randomUUID } from 'node:crypto';
import { applyStockDelta, getInventorySnapshot, getStockQuantity, getStockMovements, restoreInventorySnapshot, type StockMovement } from '../sales/sale.service';

type CountLine = { variantId: string; countedQuantity: number; reason?: string };
type Stocktake = { id: string; storeId: string; status: 'POSTED'; createdBy: string; createdAt: string; items: Array<{ variantId: string; systemQuantity: number; countedQuantity: number; difference: number; reason?: string }> };
type ReturnRecord = { id: string; saleId: string; storeId: string; createdBy: string; reason: string; status: 'COMPLETED'; totalAmount: number; items: Array<{ saleItemId: string; variantId: string; quantity: number; condition: 'SELLABLE' | 'DAMAGED'; amount: number }>; createdAt: string };
const stocktakes: Stocktake[] = [];
const returns: ReturnRecord[] = [];
const stocktakeKeys = new Set<string>();
const returnKeys = new Set<string>();

export class InventoryError extends Error { constructor(message: string, public readonly status = 400, public readonly code = 'INVENTORY_INVALID') { super(message); } }
export function createStocktake(input: { storeId: string; createdBy: string; items: CountLine[]; idempotencyKey: string }) {
  if (!input.storeId || !input.createdBy || !input.idempotencyKey || !Array.isArray(input.items) || !input.items.length || input.items.length > 500) throw new InventoryError('Data opname tidak lengkap.');
  const key = `${input.storeId}:${input.idempotencyKey}`;
  if (stocktakeKeys.has(key)) throw new InventoryError('Kunci idempotensi opname sudah digunakan.', 409, 'IDEMPOTENCY_CONFLICT');
  const normalized = new Map<string, number>();
  for (const item of input.items) {
    if (!item || typeof item.variantId !== 'string' || !Number.isSafeInteger(item.countedQuantity) || item.countedQuantity < 0) throw new InventoryError('Jumlah hitung stok harus bilangan bulat nol atau lebih.');
    normalized.set(item.variantId, item.countedQuantity);
  }
  const rows = [...normalized].map(([variantId, countedQuantity]) => {
    const systemQuantity = getStockQuantity(input.storeId, variantId);
    if (systemQuantity === null) throw new InventoryError(`Varian tidak ditemukan: ${variantId}`, 404, 'VARIANT_NOT_FOUND');
    return { variantId, systemQuantity, countedQuantity, difference: countedQuantity - systemQuantity, reason: input.items.find((row) => row.variantId === variantId)?.reason };
  });
  const id = randomUUID(); const now = new Date().toISOString();
  // All rows are validated before applying adjustments.
  for (const row of rows) if (row.difference !== 0) applyStockDelta(input.storeId, row.variantId, row.difference, 'STOCKTAKE', id, input.createdBy, now);
  const record: Stocktake = { id, storeId: input.storeId, status: 'POSTED', createdBy: input.createdBy, createdAt: now, items: rows };
  stocktakes.push(record); stocktakeKeys.add(key); return record;
}
export function getStocktakes() { return [...stocktakes]; }
export function getReturns() { return [...returns]; }
export function createReturn(input: { saleId: string; storeId: string; createdBy: string; reason: string; idempotencyKey: string; items: Array<{ saleItemId: string; variantId: string; quantity: number; condition: 'SELLABLE' | 'DAMAGED' }> }, sales: Array<{ id: string; storeId: string; items: Array<{ variantId: string; quantity: number; unitPrice: number; lineTotal: number }> }>) {
  if (!input.saleId || !input.storeId || !input.createdBy || !input.idempotencyKey || !input.items?.length) throw new InventoryError('Data retur tidak lengkap.');
  const key = `${input.storeId}:${input.idempotencyKey}`;
  if (returnKeys.has(key)) throw new InventoryError('Kunci idempotensi retur sudah digunakan.', 409, 'IDEMPOTENCY_CONFLICT');
  const sale = sales.find((row) => row.id === input.saleId);
  if (!sale || sale.storeId !== input.storeId) throw new InventoryError('Penjualan tidak ditemukan di toko ini.', 404, 'SALE_NOT_FOUND');
  const alreadyReturned = new Map<string, number>();
  for (const record of returns) if (record.saleId === sale.id) for (const item of record.items) alreadyReturned.set(item.saleItemId, (alreadyReturned.get(item.saleItemId) ?? 0) + item.quantity);
  const rows = input.items.map((item) => {
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0 || !['SELLABLE', 'DAMAGED'].includes(item.condition)) throw new InventoryError('Item retur tidak valid.');
    const original = sale.items.find((line) => line.variantId === item.variantId);
    if (!original) throw new InventoryError('Item bukan bagian dari penjualan ini.');
    const saleItemId = item.saleItemId;
    const previous = alreadyReturned.get(saleItemId) ?? 0;
    if (item.quantity + previous > original.quantity) throw new InventoryError('Jumlah retur melebihi jumlah yang pernah dijual.', 409, 'RETURN_EXCEEDS_SALE');
    return { saleItemId, variantId: item.variantId, quantity: item.quantity, condition: item.condition, amount: original.unitPrice * item.quantity };
  });
  const id = randomUUID(); const now = new Date().toISOString();
  for (const row of rows) if (row.condition === 'SELLABLE') applyStockDelta(input.storeId, row.variantId, row.quantity, 'RETURN', id, input.createdBy, now);
  const record: ReturnRecord = { id, saleId: sale.id, storeId: input.storeId, createdBy: input.createdBy, reason: input.reason ?? '', status: 'COMPLETED', totalAmount: rows.reduce((sum, item) => sum + item.amount, 0), items: rows, createdAt: now };
  returns.push(record); returnKeys.add(key); return record;
}
export function inventorySnapshot() { return getInventorySnapshot(); }
export function stockMovementSnapshot(): StockMovement[] { return getStockMovements(); }
export function restoreInventory(data: Array<{ storeId: string; variantId: string; quantity: number }>) { restoreInventorySnapshot(data); }
