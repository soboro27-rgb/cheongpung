import { getAnonymousKey } from "@apps-in-toss/web-framework";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:3000";

let token: string | null = null;

export class ApiError extends Error {}

async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) headers.Authorization = `Bearer ${await ensureToken()}`;
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/m${path}`, { ...init, headers });
  } catch {
    throw new ApiError("서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? "요청에 실패했어요.");
  return data as T;
}

async function ensureToken(): Promise<string> {
  if (token) return token;
  const key = await getAnonymousKey();
  if (!key || typeof key === "string") throw new ApiError("토스 앱에서 다시 열어 주세요.");
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

export const api = {
  listBatches: () => request<{ batches: BatchSummary[] }>("/batches").then((r) => r.batches),
  getBatch: (id: number) => request<BatchDetail>(`/batches/${id}`),
  createBatch: (messageText: string, contacts: { name: string; phone: string }[]) =>
    request<{ batchId: number; total: number; failedCount: number }>("/batches", {
      method: "POST",
      body: JSON.stringify({ messageText, contacts }),
    }),
  remind: (id: number) =>
    request<{ total: number; failedCount: number }>(`/batches/${id}/remind`, { method: "POST" }),
};
