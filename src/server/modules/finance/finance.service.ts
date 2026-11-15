import { randomUUID } from 'node:crypto';

type Entry = { id: string; storeId: string; name: string; totalAmount: number; remainingAmount: number; dueDate?: string; status: 'OPEN' | 'PARTIAL' | 'PAID'; createdAt: string; payments: Array<{ id: string; amount: number; method: string; recordedBy: string; createdAt: string }> };
const receivables = new Map<string, Entry>();
const payables = new Map<string, Entry>();
export class FinanceError extends Error { constructor(message: string, public readonly status = 400, public readonly code = 'FINANCE_INVALID') { super(message); } }
function create(map: Map<string, Entry>, input: { storeId: string; name: string; totalAmount: number; dueDate?: string }) {
  if (!input.storeId || !input.name || !Number.isSafeInteger(input.totalAmount) || input.totalAmount <= 0) throw new FinanceError('Cabang, nama pihak, dan nominal positif wajib diisi.');
  const record: Entry = { id: randomUUID(), storeId: input.storeId, name: input.name, totalAmount: input.totalAmount, remainingAmount: input.totalAmount, dueDate: input.dueDate, status: 'OPEN', createdAt: new Date().toISOString(), payments: [] };
  map.set(record.id, record); return record;
}
export function createReceivable(input: Parameters<typeof create>[1]) { return create(receivables, input); }
export function createPayable(input: Parameters<typeof create>[1]) { return create(payables, input); }
function addPayment(map: Map<string, Entry>, id: string, amount: number, method: string, actor: string) {
  const entry = map.get(id); if (!entry) throw new FinanceError('Tagihan tidak ditemukan.', 404, 'ENTRY_NOT_FOUND');
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > entry.remainingAmount) throw new FinanceError('Nominal pembayaran harus positif dan tidak melebihi sisa tagihan.', 409, 'PAYMENT_INVALID');
  entry.remainingAmount -= amount; entry.status = entry.remainingAmount === 0 ? 'PAID' : 'PARTIAL';
  entry.payments.push({ id: randomUUID(), amount, method, recordedBy: actor, createdAt: new Date().toISOString() }); return entry;
}
export function payReceivable(id: string, amount: number, method: string, actor: string) { return addPayment(receivables, id, amount, method, actor); }
export function payPayable(id: string, amount: number, method: string, actor: string) { return addPayment(payables, id, amount, method, actor); }
export function listReceivables(storeId?: string) { return [...receivables.values()].filter((x) => !storeId || x.storeId === storeId); }
export function listPayables(storeId?: string) { return [...payables.values()].filter((x) => !storeId || x.storeId === storeId); }
export function financeSnapshot() { return { receivables: listReceivables(), payables: listPayables() }; }
export function restoreFinance(snapshot: { receivables: Entry[]; payables: Entry[] }) { receivables.clear(); payables.clear(); for (const x of snapshot.receivables) receivables.set(x.id, x); for (const x of snapshot.payables) payables.set(x.id, x); }
