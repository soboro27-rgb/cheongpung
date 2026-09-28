import { useCallback, useEffect, useState } from "react";
import { api, type BatchDetail } from "../api";
import { go } from "../useHashRoute";

function Group({ title, color, names }: { title: string; color: string; names: string[] }) {
  return (
    <div className="group">
      <h3 className="group-title" style={{ color }}>
        {title} ({names.length})
      </h3>
      <p className="group-names">{names.length ? names.join(", ") : "-"}</p>
    </div>
  );
}

function ReplyGroup({ contacts }: { contacts: { name: string; replyMessage: string | null }[] }) {
  return (
    <div className="group">
      <h3 className="group-title" style={{ color: "var(--brand-primary)" }}>
        메시지를 남겼어요 ({contacts.length})
      </h3>
      {contacts.length === 0 && <p className="group-names">-</p>}
      {contacts.map((c, i) => (
        <div key={i} className="reply-card">
          <p className="reply-name">{c.name}</p>
          <p className="reply-text">{c.replyMessage}</p>
        </div>
      ))}
    </div>
  );
}

export default function Detail({ id }: { id: number }) {
  const [detail, setDetail] = useState<BatchDetail | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.getBatch(id).then(setDetail).catch((e: Error) => setErr(e.message));
  }, [id]);

  useEffect(load, [load]);

  async function remind() {
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const r = await api.remind(id);
      setMsg(`${r.total}명에게 다시 물어봤어요.`);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "보내지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  if (!detail) {
    return <div className="center">{err || "불러오는 중이에요..."}</div>;
  }

  const names = (statuses: string[]) => detail.contacts.filter((c) => statuses.includes(c.status)).map((c) => c.name);
  const kept = detail.contacts.filter((c) => c.status === "KEEP");
  const canRemind = detail.contacts.some((c) => c.status === "SENT" && !c.reminderSent);

  return (
    <div className="screen">
      <h1 className="title">답변 현황</h1>
      <p className="lead">{new Date(detail.createdAt).toLocaleString("ko-KR")}에 보냈어요.</p>

      <div style={{ marginTop: 24 }}>
        <ReplyGroup contacts={kept} />
        <Group title="정리해 주세요라고 답했어요" color="var(--color-text-subtle)" names={names(["RELEASE"])} />
        <Group title="아직 답이 없어요" color="var(--color-warning)" names={names(["SENT"])} />
        {names(["FAILED"]).length > 0 && (
          <Group title="문자를 보내지 못했어요" color="var(--color-danger)" names={names(["FAILED"])} />
        )}
      </div>
      <p className="note">'정리해 주세요'라고 답한 분도 삭제는 내 폰에서 직접 해 주세요.</p>
      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}

      <div className="cta-bar">
        <div className="cta-inner">
          {canRemind ? (
            <button className="btn btn-primary" disabled={busy} onClick={remind}>
              {busy ? "보내는 중이에요..." : "답 없는 분께 한 번 더 물어보기"}
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={() => go("/")}>
              처음으로
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
