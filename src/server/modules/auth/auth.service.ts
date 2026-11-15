import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export type UserRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'WAREHOUSE';
export type AuthUser = {
  id: string;
  name: string;
  role: UserRole;
  storeIds: string[];
};

type DemoUser = AuthUser & { pin: string };
type Session = { userId: string; expiresAt: number };

// Demo identities are intentionally unavailable unless explicitly enabled.
// Replace this in-memory store with database-backed users before deployment.
const demoUsers: DemoUser[] = process.env.ERP_DEMO_AUTH === 'true' ? [
  { id: 'owner-1', name: 'Owner Demo', role: 'OWNER', pin: '123456', storeIds: ['store-1', 'store-2'] },
  { id: 'cashier-1', name: 'Kasir Demo', role: 'CASHIER', pin: '111111', storeIds: ['store-1'] },
  { id: 'manager-1', name: 'Manager Demo', role: 'MANAGER', pin: '222222', storeIds: ['store-2'] },
  { id: 'warehouse-1', name: 'Gudang Demo', role: 'WAREHOUSE', pin: '333333', storeIds: ['store-1'] },
] : [];

const users = new Map<string, { user: AuthUser; salt: Buffer; pinHash: Buffer }>();
for (const { pin, ...user } of demoUsers) {
  const salt = randomBytes(16);
  users.set(user.id, { user, salt, pinHash: scryptSync(pin, salt, 64) });
}

const sessions = new Map<string, Session>();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export function getUserById(userId: string): AuthUser | null {
  return users.get(userId)?.user ?? null;
}

export function verifyUserPin(userId: string, pin: string): boolean {
  const record = users.get(userId);
  if (!record || !/^\d{4,8}$/.test(pin)) return false;
  const candidate = scryptSync(pin, record.salt, 64);
  return timingSafeEqual(candidate, record.pinHash);
}

export function issueSessionToken(userId: string): string {
  const token = randomBytes(32).toString('base64url');
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

export function getUserForSession(token: string): AuthUser | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return getUserById(session.userId);
}

export function revokeSession(token: string): void {
  sessions.delete(token);
}

export function isDemoAuthEnabled(): boolean {
  return process.env.ERP_DEMO_AUTH === 'true';
}
