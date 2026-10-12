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
  errorDetail?: string;
}

// 카카오 알림톡 옵션. KAKAO_PF_ID(채널 발신프로필) + KAKAO_TEMPLATE_ID 가 둘 다 있을 때만 알림톡으로 보낸다.
// 알림톡 실패(카톡 미사용 번호 등) 시 Solapi가 text 본문으로 SMS/LMS 대체발송한다.
// 템플릿 변수: #{본문}(사용자가 쓴 안부 문구), #{토큰}(버튼 링크 https://<도메인>/r/#{토큰} 에 사용)
export interface AlimtalkOpts {
  token: string;
  body: string;
}

function alimtalkConfig() {
  const pfId = process.env.KAKAO_PF_ID;
  const templateId = process.env.KAKAO_TEMPLATE_ID;
  return pfId && templateId ? { pfId, templateId } : null;
}

export async function sendSms(to: string, text: string, alimtalk?: AlimtalkOpts): Promise<SmsResult> {
  if (isMockSms()) {
    console.log(`[mock ${alimtalk && alimtalkConfig() ? "alimtalk" : "sms"}] to ${to}\n${text}`);
    return { ok: true, providerMsgId: `mock-${randomUUID()}` };
  }

  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const from = process.env.SOLAPI_SENDER;
  if (!apiKey || !apiSecret || !from) {
    console.error(
      `[sms] SMS_NOT_CONFIGURED (missing: ${[
        !apiKey && "SOLAPI_API_KEY",
        !apiSecret && "SOLAPI_API_SECRET",
        !from && "SOLAPI_SENDER",
      ]
        .filter(Boolean)
        .join(", ")})`
    );
    return { ok: false, errorCode: "SMS_NOT_CONFIGURED" };
  }

  const date = new Date().toISOString();
  const salt = randomUUID().replace(/-/g, "");
  const signature = createHmac("sha256", apiSecret).update(date + salt).digest("hex");

  const kakao = alimtalk ? alimtalkConfig() : null;
  const message: Record<string, unknown> = { to, from, text };
  if (kakao && alimtalk) {
    message.kakaoOptions = {
      pfId: kakao.pfId,
      templateId: kakao.templateId,
      variables: { "#{본문}": alimtalk.body, "#{토큰}": alimtalk.token },
    };
  }

  try {
    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
      },
      body: JSON.stringify({ message }),
    });
    const data = (await res.json()) as { messageId?: string; errorCode?: string; errorMessage?: string };
    if (!res.ok) {
      console.error(`[sms] send failed HTTP ${res.status}:`, JSON.stringify(data));
    }
    return res.ok
      ? { ok: true, providerMsgId: data.messageId }
      : { ok: false, errorCode: data.errorCode ?? `HTTP_${res.status}`, errorDetail: data.errorMessage };
  } catch (e) {
    console.error("[sms] send threw:", e);
    return { ok: false, errorCode: String(e) };
  }
}
