export interface ReplyPayload {
  token: string;
  status: "CONFIRMED" | "MODIFIED";
  originalAddress: string;
  newAddress?: string;
  consentAt: string; // ISO timestamp
  respondedAt: string;
}

export interface ReplyAdapter {
  send(payload: ReplyPayload): Promise<void>;
}
