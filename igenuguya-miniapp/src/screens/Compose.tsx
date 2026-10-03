import { useState } from "react";
import { IAP } from "@apps-in-toss/web-framework";
import { api, ApiError, CREDIT_PACK_SIZE, CREDIT_PACK_SKU } from "../api";
import { replace } from "../useHashRoute";
import type { Person } from "./Pick";

const DEFAULT_MESSAGE =
  "안녕하세요, 오래된 연락처를 정리해 드리는 '이게누구야'입니다. 저장해두신 연락처 중 계속 연락하고 싶은 분들을 다시 한번 확인해 드리고 있어요. 여전히 반가운 분이시라면 답장 한 줄 남겨주시고, 편하게 정리해 주셔도 괜찮으시면 아래 링크에서 알려주세요.";

export default function Compose({
  selected,
  onSent,
}: {
  selected: Map<string, Person>;
  onSent: () => void;
}) {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [sending, setSending] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [err, setErr] = useState("");
  const [needsCredits, setNeedsCredits] = useState<{ freeRemaining: number; creditsNeeded: number } | null>(null);

  async function send() {
    setSending(true);
    setErr("");
    try {
      const r = await api.createBatch(message, [...selected.values()]);
      onSent();
      replace(`/batch/${r.batchId}`);
    } catch (e) {
      if (e instanceof ApiError && e.payload.code === "INSUFFICIENT_CREDITS") {
        setNeedsCredits({
          freeRemaining: e.payload.freeRemaining ?? 0,
          creditsNeeded: e.payload.creditsNeeded ?? 0,
        });
      }
      setErr(e instanceof Error ? e.message : "보내지 못했어요.");
      setSending(false);
    }
  }

  function buyCredits() {
    setPurchasing(true);
    setErr("");
    const cleanup = IAP.createOneTimePurchaseOrder({
      options: {
        sku: CREDIT_PACK_SKU,
        // 여기서는 검증하지 않고 즉시 승인한다 — 실제 검증·지급은 onEvent에서 한다
        // (앱인토스 공식 권장 패턴).
        processProductGrant: () => true,
      },
      onEvent: async (event) => {
        cleanup?.();
        try {
          await api.redeemCredits(event.data.orderId, CREDIT_PACK_SKU);
          setNeedsCredits(null);
          await send();
        } catch (e) {
          setErr(e instanceof Error ? e.message : "충전 확인에 실패했어요.");
        } finally {
          setPurchasing(false);
        }
      },
      onError: () => {
        cleanup?.();
        setPurchasing(false);
      },
    });
    // 구형 토스 앱(인앱결제 미지원 버전)에서는 결제창 없이 undefined만 돌아온다.
    if (!cleanup) {
      setErr("토스 앱 버전이 오래되어 인앱결제를 열 수 없어요. 토스 앱을 최신 버전으로 업데이트한 뒤 다시 시도해 주세요.");
      setPurchasing(false);
    }
  }

  return (
    <div className="screen">
      <h1 className="title">이렇게 보낼게요</h1>
      <p className="lead">{selected.size}명에게 문자로 전해요. 문구는 바꿀 수 있어요.</p>

      <textarea
        className="message"
        value={message}
        maxLength={500}
        onChange={(e) => setMessage(e.target.value)}
        aria-label="보낼 문구"
      />
      <p className="note">
        문자 끝에 "결제·개인정보 입력 없는 안전한 링크예요"라는 안내와 답변 링크가 자동으로 붙어요. 받는
        분은 링크에서 '메시지 남기기' 또는 '정리해 주세요' 중 하나를 눌러요.
      </p>
      <p className="note">
        고른 분의 이름과 번호는 문자 발송과 답변 확인에만 쓰여요.
      </p>

      {needsCredits && (
        <div className="paywall">
          <p className="paywall-title">무료 한도를 다 쓰셨어요</p>
          <p className="note">
            오늘 무료로 보낼 수 있는 분은 {needsCredits.freeRemaining}명이고, {needsCredits.creditsNeeded}건 더
            보내려면 발송권이 필요해요.
          </p>
          <button className="btn btn-secondary" disabled={purchasing} onClick={buyCredits}>
            {purchasing ? "처리 중이에요..." : `발송권 ${CREDIT_PACK_SIZE}건 충전하기 (1,000원)`}
          </button>
        </div>
      )}
      {err && <p className="error">{err}</p>}

      <div className="cta-bar">
        <div className="cta-inner">
          <button className="btn btn-primary" disabled={sending || purchasing || !message.trim()} onClick={send}>
            {sending ? "보내는 중이에요..." : `${selected.size}명에게 문자 보내기`}
          </button>
        </div>
      </div>
    </div>
  );
}
