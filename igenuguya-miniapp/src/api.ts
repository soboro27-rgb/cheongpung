import { getAnonymousKey } from "@apps-in-toss/web-framework";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:3000";

let token: string | null = null;

export interface ApiErrorPayload {
  error?: string;
  code?: string;
  freeRemaining?: number;
  creditsAvailable?: number;
  creditsNeeded?: number;
}

export class ApiError extends Error {
  payload: ApiErrorPayload;
  constructor(payload: ApiErrorPayload) {
    super(payload.error ?? "요청에 실패했어요.");
    this.payload = payload;
  }
}

async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) headers.Authorization = `Bearer ${await ensureToken()}`;
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/m${path}`, { ...init, headers });
  } catch {
    throw new ApiError({ error: "서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요." });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data as ApiErrorPayload);
  return data as T;
}

async function ensureToken(): Promise<string> {
  if (token) return token;
  const key = await getAnonymousKey();
  if (!key || typeof key === "string") throw new ApiError({ error: "토스 앱에서 다시 열어 주세요." });
  const { token: t } = await request<{ token: string }>(
    "/session",
    { method: "POST", body: JSON.stringify({ anonKey: key.hash }) },
    false,
  );
  token = t;
  return t;
}

export interface BatchSummary {
  id: number;
  createdAt: string;
  total: number;
  keep: number;
  release: number;
  pending: number;
  failed: number;
}

export interface BatchDetail {
  id: number;
  messageText: string;
  createdAt: string;
  contacts: { id: number; name: string; status: string; reminderSent: boolean; replyMessage: string | null }[];
}

export interface Account {
  freeRemaining: number;
  freeDailyLimit: number;
  credits: number;
}

// 콘솔에 등록된 IAP 상품(발송권 10건, 1,000원)의 sku.
export const CREDIT_PACK_SKU = "ait.0000078387.6c3bc475.f0886f6c5d.0573601637";
export const CREDIT_PACK_SIZE = 10;

export const api = {
  listBatches: () =>
    request<{ batches: BatchSummary[]; account?: Account }>("/batches").then((r) => ({
      batches: r.batches,
      account: r.account,
    })),
  getBatch: (id: number) => request<BatchDetail>(`/batches/${id}`),
  createBatch: (messageText: string, contacts: { name: string; phone: string }[]) =>
    request<{ batchId: number; total: number; failedCount: number }>("/batches", {
      method: "POST",
      body: JSON.stringify({ messageText, contacts }),
    }),
  remind: (id: number) =>
    request<{ total: number; failedCount: number }>(`/batches/${id}/remind`, { method: "POST" }),
  redeemCredits: (orderId: string | undefined, sku: string) =>
    request<{ credits: number }>("/iap/redeem", {
      method: "POST",
      body: JSON.stringify({ orderId, sku }),
    }),
};
