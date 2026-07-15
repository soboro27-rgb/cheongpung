import { createHmac } from "crypto";
import type { ReplyAdapter, ReplyPayload } from "./interface";

export class WebhookAdapter implements ReplyAdapter {
  constructor(private url: string, private secret?: string) {}

  async send(payload: ReplyPayload): Promise<void> {
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (this.secret) {
      const sig = createHmac("sha256", this.secret).update(body).digest("hex");
      headers["X-Whcheck-Signature"] = `sha256=${sig}`;
    }

    const res = await fetch(this.url, { method: "POST", headers, body });
    if (!res.ok) throw new Error(`Webhook failed: ${res.status} ${await res.text()}`);
  }
}
