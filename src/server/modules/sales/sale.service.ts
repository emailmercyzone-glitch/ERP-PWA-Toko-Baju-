export type SaleStatus = 'COMPLETED' | 'VOID_PENDING' | 'VOIDED' | 'NEEDS_REVIEW';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
export type OfflineStatus = 'ONLINE' | 'PENDING_SYNC' | 'SYNCED' | 'FAILED' | 'NEEDS_REVIEW';

export type SaleItemInput = {
  variantId: string;
  quantity: number;
  unitPrice?: number;
};

export type SaleCreateInput = {
  storeId: string;
  cashierId: string;
  items: SaleItemInput[];
  discountAmount?: number;
  paymentMethod?: string;
  paymentAmount?: number;
  idempotencyKey?: string;
};

export type SaleRecord = {
  id: string;
  storeId: string;
  cashierId: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  paidAmount: number;
  status: SaleStatus;
  paymentStatus: PaymentStatus;
  offlineStatus: OfflineStatus;
  idempotencyKey: string;
  items: Array<{
    variantId: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

const productCatalog: Record<string, { variantId: string; productName: string; variantName: string; sku: string; price: number; stock: Record<string, number> }> = {
  'v-1': {
    variantId: 'v-1',
    productName: 'Kaos Polos',
    variantName: 'Putih / S',
    sku: 'BJU-001-S',
    price: 85000,
    stock: {
      'store-1': 12,
      'store-2': 8,
    },
  },
  'v-2': {
    variantId: 'v-2',
    productName: 'Kaos Polos',
    variantName: 'Putih / M',
    sku: 'BJU-001-M',
    price: 85000,
    stock: {
      'store-1': 7,
      'store-2': 10,
    },
  },
};

const salesStore: SaleRecord[] = [];

export function createSale(input: SaleCreateInput): SaleRecord {
  const { storeId, cashierId, items, discountAmount = 0, paymentMethod = 'CASH', paymentAmount, idempotencyKey } = input;

  if (!storeId || !cashierId || !Array.isArray(items) || items.length === 0) {
    throw new Error('storeId, cashierId, dan items wajib diisi.');
  }

  const validItems: Array<{ variantId: string; quantity: number; unitPrice: number; lineTotal: number }> = [];
  let subtotal = 0;

  for (const item of items) {
    const product = productCatalog[item.variantId];
    if (!product) {
      throw new Error(`Variant tidak ditemukan: ${item.variantId}`);
    }

    const qty = Number(item.quantity ?? 0);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error(`Quantity tidak valid untuk variant ${item.variantId}`);
    }

    const available = product.stock[storeId] ?? 0;
    if (qty > available) {
      throw new Error(`Stok tidak cukup untuk ${product.productName} (${product.variantName}). Tersedia: ${available}`);
    }

    const unitPrice = item.unitPrice ?? product.price;
    const lineTotal = unitPrice * qty;

    validItems.push({
      variantId: item.variantId,
      quantity: qty,
      unitPrice,
      lineTotal,
    });

    subtotal += lineTotal;
  }

  const safeDiscount = Math.max(0, Number(discountAmount ?? 0));
  const total = Math.max(0, subtotal - safeDiscount);
  const finalPayment = Number(paymentAmount ?? total);
  const paidAmount = Math.max(0, finalPayment);

  const paymentStatus = paidAmount >= total ? 'PAID' : 'PARTIAL';

  const saleId = `sale-${crypto.randomUUID()}`;
  const saleKey = idempotencyKey ?? `${storeId}:${cashierId}:${saleId}`;

  const sale: SaleRecord = {
    id: saleId,
    storeId,
    cashierId,
    subtotal,
    discountAmount: safeDiscount,
    total,
    paidAmount,
    status: 'COMPLETED',
    paymentStatus,
    offlineStatus: 'ONLINE',
    idempotencyKey: saleKey,
    items: validItems,
  };

  salesStore.push(sale);

  for (const item of validItems) {
    const product = productCatalog[item.variantId];
    if (product && product.stock[storeId] !== undefined) {
      product.stock[storeId] = product.stock[storeId] - item.quantity;
    }
  }

  return sale;
}

export function getSaleById(id: string): SaleRecord | null {
  return salesStore.find((sale) => sale.id === id) ?? null;
}

export function getSalesSummary(): { totalSales: number; transactions: number } {
  const totalSales = salesStore.reduce((sum, sale) => sum + sale.total, 0);
  return {
    totalSales,
    transactions: salesStore.length,
  };
}
