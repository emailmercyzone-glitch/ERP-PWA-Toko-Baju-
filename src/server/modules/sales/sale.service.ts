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
  id: string;
  storeId: string;
  cashierId: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  paidAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  status: 'COMPLETED';
  items: Array<{ variantId: string; sku: string; name: string; quantity: number; unitPrice: number; lineTotal: number }>;
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
const stockMovements: Array<{ storeId: string; variantId: string; delta: number; saleId: string; createdAt: string }> = [];
const audits: Array<{ actorId: string; storeId: string; action: string; entityId: string; createdAt: string }> = [];

export class SaleError extends Error {
  constructor(message: string, public readonly status = 400, public readonly code = 'SALE_INVALID') { super(message); }
}

export function createSale(input: SaleCreateInput): { sale: SaleRecord; replayed: boolean } {
  if (!input.storeId || !input.cashierId || !Array.isArray(input.items) || input.items.length < 1 || input.items.length > 100) {
    throw new SaleError('Toko dan 1–100 item penjualan wajib diisi.');
  }
  if (!input.idempotencyKey || input.idempotencyKey.length > 200) throw new SaleError('Idempotency key wajib diisi.');

  const normalized = new Map<string, number>();
  for (const item of input.items) {
    if (!item || typeof item.variantId !== 'string' || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      throw new SaleError('Varian dan jumlah item tidak valid.');
    }
    normalized.set(item.variantId, (normalized.get(item.variantId) ?? 0) + item.quantity);
  }
  const fingerprint = JSON.stringify({ storeId: input.storeId, cashierId: input.cashierId, items: [...normalized.entries()].sort(), discountAmount: input.discountAmount ?? 0, paymentAmount: input.paymentAmount ?? null, paymentMethod: input.paymentMethod ?? 'CASH' });
  const key = `${input.storeId}:${input.idempotencyKey}`;
  const prior = idempotency.get(key);
  if (prior) {
    if (prior.fingerprint !== fingerprint) throw new SaleError('Idempotency key sudah digunakan untuk transaksi berbeda.', 409, 'IDEMPOTENCY_CONFLICT');
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

  // Validate all items before mutating stock so an invalid line cannot leave a partial sale.
  const now = new Date().toISOString();
  const sale: SaleRecord = {
    id: randomUUID(), storeId: input.storeId, cashierId: input.cashierId, subtotal,
    discountAmount: discount, total, paidAmount: paid,
    paymentStatus: paid === 0 ? 'UNPAID' : paid === total ? 'PAID' : 'PARTIAL',
    status: 'COMPLETED', items: lines, createdAt: now,
  };
  for (const line of lines) catalog[line.variantId].stock[input.storeId] -= line.quantity;
  sales.set(sale.id, sale);
  idempotency.set(key, { fingerprint, saleId: sale.id });
  for (const line of lines) stockMovements.push({ storeId: input.storeId, variantId: line.variantId, delta: -line.quantity, saleId: sale.id, createdAt: now });
  audits.push({ actorId: input.cashierId, storeId: input.storeId, action: 'SALE_CREATED', entityId: sale.id, createdAt: now });
  return { sale, replayed: false };
}

export function getSaleById(id: string): SaleRecord | null { return sales.get(id) ?? null; }
export function getSalesSummary(storeId?: string) {
  const records = [...sales.values()].filter((sale) => !storeId || sale.storeId === storeId);
  return { totalSales: records.reduce((sum, sale) => sum + sale.total, 0), transactions: records.length };
}
