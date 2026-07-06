const crypto = require("crypto");

function buildAuthHeader(apiKey, apiSecret) {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

// 카톡 문의를 팔렌시아님 휴대폰으로 SMS 전달 (Solapi 사용)
async function notifyInquiry({ utterance, matchedProject }) {
  const { SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER, NOTIFY_PHONE } = process.env;

  if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET || !SOLAPI_SENDER || !NOTIFY_PHONE) {
    console.log("[notify] Solapi 환경변수 미설정 — 콘솔 로그만 남김:", { utterance, matchedProject });
    return { skipped: true };
  }

  const text = `[카톡문의${matchedProject ? " - " + matchedProject : ""}] ${utterance}`.slice(0, 2000);

  const res = await fetch("https://api.solapi.com/messages/v4/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: buildAuthHeader(SOLAPI_API_KEY, SOLAPI_API_SECRET),
    },
    body: JSON.stringify({
      message: { to: NOTIFY_PHONE, from: SOLAPI_SENDER, text },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[notify] Solapi 발송 실패:", data);
  }
  return data;
}

module.exports = { notifyInquiry, buildAuthHeader };
