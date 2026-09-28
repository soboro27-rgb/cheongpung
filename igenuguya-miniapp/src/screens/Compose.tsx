import { useState } from "react";
import { api } from "../api";
import { replace } from "../useHashRoute";
import type { Person } from "./Pick";

const DEFAULT_MESSAGE =
  "안녕하세요, 저장된 연락처 정리를 도와드리는 '이게누구야'입니다. 지금 연락드린 고객님과 여전히 인연을 이어가고 싶으신지 제가 대신 여쭤보고 있어요. 불필요한 관계시라면 정리해 드리고, 오랜만에 반가운 연락이시면 메시지를 남겨주셔도 됩니다.";

export default function Compose({
  selected,
  onSent,
}: {
  selected: Map<string, Person>;
  onSent: () => void;
}) {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  async function send() {
    setSending(true);
    setErr("");
    try {
      const r = await api.createBatch(message, [...selected.values()]);
      onSent();
      replace(`/batch/${r.batchId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "보내지 못했어요.");
      setSending(false);
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
      {err && <p className="error">{err}</p>}

      <div className="cta-bar">
        <div className="cta-inner">
          <button className="btn btn-primary" disabled={sending || !message.trim()} onClick={send}>
            {sending ? "보내는 중이에요..." : `${selected.size}명에게 문자 보내기`}
          </button>
        </div>
      </div>
    </div>
  );
}
