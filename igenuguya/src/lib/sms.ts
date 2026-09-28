import { createHmac, randomUUID } from "crypto";

// 발송은 Solapi SMS/LMS. 길이에 따라 Solapi가 SMS/LMS를 자동 판별한다.
// MOCK_SMS=true 면 실제로 보내지 않고 로그만 남긴다(로컬 개발용).
export function isMockSms(): boolean {
  return process.env.MOCK_SMS === "true";
}

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const n = digits.startsWith("82") ? "0" + digits.slice(2) : digits;
  return /^01[016789]\d{7,8}$/.test(n) ? n : null;
}

// 문자에 스미싱 오인 우려를 줄이는 안심 문구 + 링크를 붙여 최종 발송 본문을 만든다.
// 사용자가 본문을 자유롭게 고쳐도 이 안심 문구는 항상 포함되도록 여기서 고정한다.
export function buildMessageWithLink(text: string, link: string): string {
  return `${text}\n\n(결제·개인정보 입력 없는 안전한 링크예요)\n답변하기: ${link}`;
}

export interface SmsResult {
  ok: boolean;
  providerMsgId?: string;
  errorCode?: string;
}

export async function sendSms(to: string, text: string): Promise<SmsResult> {
  if (isMockSms()) {
    console.log(`[mock sms] to ${to}\n${text}`);
    return { ok: true, providerMsgId: `mock-${randomUUID()}` };
  }

  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const from = process.env.SOLAPI_SENDER;
  if (!apiKey || !apiSecret || !from) return { ok: false, errorCode: "SMS_NOT_CONFIGURED" };

  const date = new Date().toISOString();
  const salt = randomUUID().replace(/-/g, "");
  const signature = createHmac("sha256", apiSecret).update(date + salt).digest("hex");

  try {
    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
      },
      body: JSON.stringify({ message: { to, from, text } }),
    });
    const data = (await res.json()) as { messageId?: string; errorCode?: string };
    return res.ok
      ? { ok: true, providerMsgId: data.messageId }
      : { ok: false, errorCode: data.errorCode ?? `HTTP_${res.status}` };
  } catch (e) {
    return { ok: false, errorCode: String(e) };
  }
}
