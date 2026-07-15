import { encryptPII, decryptPII } from "./crypto";

export interface PiiPayload {
  name: string;
  phone: string;
  originalAddress: string;
  memo?: string;
}

// 개발: in-memory Map (프로세스 재시작 시 초기화)
// 배포 시: ioredis 클라이언트로 교체
const globalStore = globalThis as unknown as {
  __whcheckPiiStore?: Map<string, { value: string; expiresAt: number }>;
};
if (!globalStore.__whcheckPiiStore) {
  globalStore.__whcheckPiiStore = new Map();
}
const store = globalStore.__whcheckPiiStore;

const KEY = (token: string) => `whcheck:pii:${token}`;

export async function storePII(
  token: string,
  payload: PiiPayload,
  ttlSeconds: number
): Promise<void> {
  const encrypted = encryptPII(JSON.stringify(payload));
  store.set(KEY(token), {
    value: encrypted,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function getPII(token: string): Promise<PiiPayload | null> {
  const entry = store.get(KEY(token));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(KEY(token));
    return null;
  }
  return JSON.parse(decryptPII(entry.value)) as PiiPayload;
}

export async function deletePII(token: string): Promise<void> {
  store.delete(KEY(token));
  if (store.has(KEY(token))) {
    throw new Error(`PII deletion verification failed for token ${token.slice(0, 8)}...`);
  }
}

export async function piiExists(token: string): Promise<boolean> {
  const entry = store.get(KEY(token));
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) { store.delete(KEY(token)); return false; }
  return true;
}
