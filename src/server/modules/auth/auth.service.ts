import crypto from 'crypto';

export type UserRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'WAREHOUSE';

export type AuthUser = {
  id: string;
  name: string;
  role: UserRole;
  storeIds: string[];
};

type DemoUser = AuthUser & {
  pin: string;
};

const demoUsers: DemoUser[] = [
  {
    id: 'owner-1',
    name: 'Owner Demo',
    role: 'OWNER',
    pin: '123456',
    storeIds: ['store-1', 'store-2'],
  },
  {
    id: 'cashier-1',
    name: 'Kasir Demo',
    role: 'CASHIER',
    pin: '111111',
    storeIds: ['store-1'],
  },
  {
    id: 'manager-1',
    name: 'Manager Demo',
    role: 'MANAGER',
    pin: '222222',
    storeIds: ['store-2'],
  },
  {
    id: 'warehouse-1',
    name: 'Gudang Demo',
    role: 'WAREHOUSE',
    pin: '333333',
    storeIds: ['store-1'],
  },
];

const PEPPER = 'erp-pwa-toko-baju';

function hashPin(pin: string): string {
  return crypto.pbkdf2Sync(pin, PEPPER, 100_000, 64, 'sha256').toString('hex');
}

export const demoUsersById = Object.fromEntries(
  demoUsers.map((user) => [user.id, { ...user, pin: hashPin(user.pin) }]),
) as Record<string, AuthUser & { pin: string }>;

export function getUserById(userId: string): AuthUser | null {
  const user = demoUsersById[userId];
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    storeIds: user.storeIds,
  };
}

export function verifyUserPin(userId: string, pin: string): boolean {
  const user = demoUsersById[userId];
  if (!user) return false;
  return crypto.timingSafeEqual(
    Buffer.from(hashPin(pin)),
    Buffer.from(user.pin),
  );
}

export function issueSessionToken(userId: string): string {
  return `session_${crypto.randomUUID()}_${userId}`;
}
