export type SessionUser = {
  userId: string;
  role: string;
  toko_id: string;
};

export type SessionRecord = SessionUser & {
  token: string;
  expiresAt: number;
};

const sessions = new Map<string, SessionRecord>();

export function createSession(user: SessionUser): SessionRecord {
  const token = globalThis.crypto?.randomUUID?.() ?? `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const record: SessionRecord = {
    ...user,
    token,
    expiresAt: Date.now() + 12 * 60 * 60 * 1000,
  };
  sessions.set(token, record);
  return record;
}

export function getSession(token?: string): SessionRecord | null {
  if (!token) return null;
  const record = sessions.get(token);
  if (!record) return null;
  if (record.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return record;
}

export function revokeSession(token?: string): void {
  if (!token) return;
  sessions.delete(token);
}
