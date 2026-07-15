import type { AlimtalkAdapter, AlimtalkMessage, AlimtalkResult } from "./interface";

export class SolapiAdapter implements AlimtalkAdapter {
  constructor(
    private apiKey: string,
    private apiSecret: string,
    private pfId: string,      // 발신프로필 key
    private templateId: string
  ) {}

  async send(messages: AlimtalkMessage[]): Promise<AlimtalkResult[]> {
    // Solapi REST API: https://docs.solapi.com
    const results: AlimtalkResult[] = [];
    for (const msg of messages) {
      try {
        const body = {
          message: {
            to: msg.to,
            kakaoOptions: {
              pfId: this.pfId,
              templateId: this.templateId,
              variables: msg.variables,
            },
          },
        };
        const res = await fetch("https://api.solapi.com/messages/v4/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `HMAC-SHA256 apiKey=${this.apiKey}, date=${new Date().toISOString()}, salt=${crypto.randomUUID()}, signature=PLACEHOLDER`,
          },
          body: JSON.stringify(body),
        });
        const data = await res.json() as { messageId?: string; errorCode?: string };
        results.push({ success: res.ok, providerMsgId: data.messageId, errorCode: data.errorCode });
      } catch (e) {
        results.push({ success: false, errorCode: String(e) });
      }
    }
    return results;
  }
}

// Mock adapter for development / testing
export class MockAlimtalkAdapter implements AlimtalkAdapter {
  async send(messages: AlimtalkMessage[]): Promise<AlimtalkResult[]> {
    console.log(`[MockAlimtalk] Would send ${messages.length} messages`);
    return messages.map(() => ({ success: true, providerMsgId: `mock-${crypto.randomUUID()}` }));
  }
}
