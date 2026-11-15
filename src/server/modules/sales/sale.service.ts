import { randomUUID } from 'node:crypto';

export type SaleItemInput = { variantId: string; quantity: number };
export type SaleCreateInput = {
  storeId: string;
  cashierId: string;
  items: SaleItemInput[];
  discountAmount?: number;
  paymentMethod?: 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT' | 'CREDIT' | 'OTHER';
  paymentAmount?: number;
  idempotencyKey: string;
};
export type SaleRecord = {
  id: string; storeId: string; cashierId: string; subtotal: number; discountAmount: number;
  total: number; paidAmount: number; paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  status: 'COMPLETED'; items: Array<{ variantId: string; sku: string; name: string; quantity: number; unitPrice: number; lineTotal: number }>;
  createdAt: string;
};
type CatalogItem = { sku: string; name: string; basePrice: number; stock: Record<string, number> };
const catalog: Record<string, CatalogItem> = {
  'v-1': { sku: 'BJU-001-S', name: 'Kaos Polos - Putih / S', basePrice: 85000, stock: { 'store-1': 12, 'store-2': 8 } },
  'v-2': { sku: 'BJU-001-M', name: 'Kaos Polos - Putih / M', basePrice: 85000, stock: { 'store-1': 7, 'store-2': 10 } },
};
const storeAdjustment: Record<string, number> = { 'store-1': 0, 'store-2': 5 };
const sales = new Map<string, SaleRecord>();
const idempotency = new Map<string, { fingerprint: string; saleId: string }>();
export type StockMovement = { id: string; storeId: string; variantId: string; delta: number; balanceAfter: number; referenceType: string; referenceId: string; actorId: string; createdAt: string };
const movements: StockMovement[] = [];

export class SaleError extends Error {
  constructor(message: string, public readonly status = 400, public readonly code = 'SALE_INVALID') { super(message); }
}

export function createSale(input: SaleCreateInput): { sale: SaleRecord; replayed: boolean } {
  if (!input.storeId || !input.cashierId || !Array.isArray(input.items) || input.items.length < 1 || input.items.length > 100) throw new SaleError('Toko dan 1–100 item penjualan wajib diisi.');
  if (!input.idempotencyKey || input.idempotencyKey.length > 200) throw new SaleError('Idempotency key wajib diisi.');
  const normalized = new Map<string, number>();
  for (const item of input.items) {
    if (!item || typeof item.variantId !== 'string' || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) throw new SaleError('Varian dan jumlah item tidak valid.');
    normalized.set(item.variantId, (normalized.get(item.variantId) ?? 0) + item.quantity);
  }
  const fingerprint = JSON.stringify({ storeId: input.storeId, cashierId: input.cashierId, items: [...normalized.entries()].sort(), discountAmount: input.discountAmount ?? 0, paymentAmount: input.paymentAmount ?? null, paymentMethod: input.paymentMethod ?? 'CASH' });
  const key = `${input.storeId}:${input.idempotencyKey}`;
  const prior = idempotency.get(key);
  if (prior) {
    if (prior.fingerprint !== fingerprint) throw new SaleError('Idempotency key sudah dipakai untuk transaksi berbeda.', 409, 'IDEMPOTENCY_CONFLICT');
    const existing = sales.get(prior.saleId);
    if (existing) return { sale: existing, replayed: true };
  }
  const adjustment = storeAdjustment[input.storeId];
  if (adjustment === undefined) throw new SaleError('Toko tidak ditemukan.', 404, 'STORE_NOT_FOUND');
  const lines: SaleRecord['items'] = [];
  let subtotal = 0;
  for (const [variantId, quantity] of normalized) {
    const item = catalog[variantId];
    if (!item) throw new SaleError(`Varian tidak ditemukan: ${variantId}`, 404, 'VARIANT_NOT_FOUND');
    const available = item.stock[input.storeId] ?? 0;
    if (quantity > available) throw new SaleError(`Stok ${item.name} tidak cukup. Tersedia ${available}.`, 409, 'INSUFFICIENT_STOCK');
    const unitPrice = Math.round(item.basePrice * (1 + adjustment / 100));
    const lineTotal = unitPrice * quantity;
    subtotal += lineTotal;
    lines.push({ variantId, sku: item.sku, name: item.name, quantity, unitPrice, lineTotal });
  }
  const discount = input.discountAmount ?? 0;
  if (!Number.isSafeInteger(discount) || discount < 0 || discount > subtotal) throw new SaleError('Diskon tidak valid.');
  const total = subtotal - discount;
  const paid = input.paymentAmount ?? total;
  if (!Number.isSafeInteger(paid) || paid < 0 || paid > total) throw new SaleError('Nominal pembayaran tidak valid.');
  const now = new Date().toISOString();
  const sale: SaleRecord = { id: randomUUID(), storeId: input.storeId, cashierId: input.cashierId, subtotal, discountAmount: discount, total, paidAmount: paid, paymentStatus: paid === 0 ? 'UNPAID' : paid === total ? 'PAID' : 'PARTIAL', status: 'COMPLETED', items: lines, createdAt: now };
  for (const line of lines) applyStockDelta(input.storeId, line.variantId, -line.quantity, 'SALE', sale.id, input.cashierId, now);
  sales.set(sale.id, sale);
  idempotency.set(key, { fingerprint, saleId: sale.id });
  return { sale, replayed: false };
}

export function getSaleById(id: string): SaleRecord | null { return sales.get(id) ?? null; }
export function getAllSales(): SaleRecord[] { return [...sales.values()]; }
export function getSalesSummary(storeId?: string) {
  const records = [...sales.values()].filter((sale) => !storeId || sale.storeId === storeId);
  return { totalSales: records.reduce((sum, sale) => sum + sale.total, 0), transactions: records.length };
}
export function getInventorySnapshot() {
  return Object.entries(catalog).flatMap(([variantId, item]) => Object.entries(item.stock).map(([storeId, quantity]) => ({ variantId, sku: item.sku, name: item.name, storeId, quantity })));
}
export function getStockQuantity(storeId: string, variantId: string): number | null {
  const item = catalog[variantId];
  return item ? (item.stock[storeId] ?? 0) : null;
}
export function applyStockDelta(storeId: string, variantId: string, delta: number, referenceType: string, referenceId: string, actorId: string, at = new Date().toISOString()): StockMovement {
  const item = catalog[variantId];
  if (!item) throw new SaleError(`Varian tidak ditemukan: ${variantId}`, 404, 'VARIANT_NOT_FOUND');
  const current = item.stock[storeId];
  if (current === undefined) throw new SaleError('Stok toko tidak ditemukan.', 404, 'STOCK_NOT_FOUND');
  const next = current + delta;
  if (!Number.isSafeInteger(delta) || next < 0) throw new SaleError('Perubahan stok tidak valid atau membuat stok minus.', 409, 'INSUFFICIENT_STOCK');
  item.stock[storeId] = next;
  const movement = { id: randomUUID(), storeId, variantId, delta, balanceAfter: next, referenceType, referenceId, actorId, createdAt: at };
  movements.push(movement);
  return movement;
}
export function getStockMovements(): StockMovement[] { return [...movements]; }
export function restoreInventorySnapshot(snapshot: Array<{ storeId: string; variantId: string; quantity: number }>) {
  for (const row of snapshot) {
    if (!catalog[row.variantId] || !Number.isSafeInteger(row.quantity) || row.quantity < 0 || !storeAdjustment[row.storeId]) throw new Error('Snapshot stok tidak valid.');
  }
  for (const row of snapshot) catalog[row.variantId].stock[row.storeId] = row.quantity;
}
export function restoreSalesSnapshot(snapshot: SaleRecord[]) {
  sales.clear(); idempotency.clear();
  for (const sale of snapshot) sales.set(sale.id, sale);
}
