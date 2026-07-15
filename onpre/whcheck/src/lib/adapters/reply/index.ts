import { WebhookAdapter } from "./webhook";
import { GoogleSheetsAdapter } from "./google-sheets";
import type { ReplyAdapter } from "./interface";

export function createReplyAdapter(type: string, ref: string, secret?: string): ReplyAdapter {
  if (type === "WEBHOOK") return new WebhookAdapter(ref, secret ?? undefined);
  if (type === "GOOGLE_SHEET") return new GoogleSheetsAdapter(ref);
  throw new Error(`Unknown return target type: ${type}`);
}

export { type ReplyAdapter, type ReplyPayload } from "./interface";
