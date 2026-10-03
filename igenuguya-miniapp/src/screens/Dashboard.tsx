import { useEffect, useState } from "react";
import { api, type ContactRow, type ContactSummary } from "../api";

function Group({
  title,
  color,
  rows,
}: {
  title: string;
  color: string;
  rows: ContactRow[];
}) {
  return (
    <div className="group">
      <h3 className="group-title" style={{ color }}>
        {title} ({rows.length})
      </h3>
      {rows.length === 0 && <p className="group-names">-</p>}
      {rows.map((c) => (
        <div key={c.id} className="reply-card">
          <p className="reply-name">
            {c.name}
            <span className="card-date" style={{ display: "inline", marginLeft: 8 }}>
              {new Date(c.sentAt).toLocaleDateString("ko-KR")}
            </span>
          </p>
          {c.replyMessage && <p className="reply-text">{c.replyMessage}</p>}
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<ContactSummary | null>(null);
  const [contacts, setContacts] = useState<ContactRow[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .getAllContacts()
      .then((r) => {
        setSummary(r.summary);
        setContacts(r.contacts);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  if (!contacts || !summary) {
    return <div className="center">{err || "불러오는 중이에요..."}</div>;
  }

  const by = (statuses: string[]) => contacts.filter((c) => statuses.includes(c.status));

  return (
    <div className="screen">
      <h1 className="title">전체 현황</h1>
      <p className="lead">지금까지 보낸 모든 안부 확인 문자를 한눈에 모아봤어요.</p>

      <div className="stats" style={{ marginTop: 16 }}>
        <span>총 {summary.total}명</span>
        <span className="stat-keep">유지 {summary.keep}</span>
        <span className="stat-release">정리동의 {summary.release}</span>
        <span className="stat-pending">응답대기 {summary.pending}</span>
        {summary.failed > 0 && <span className="error" style={{ margin: 0 }}>실패 {summary.failed}</span>}
      </div>

      <div style={{ marginTop: 24 }}>
        <Group title="메시지를 남겼어요" color="var(--brand-primary)" rows={by(["KEEP"])} />
        <Group title="정리해 주세요라고 답했어요" color="var(--color-text-subtle)" rows={by(["RELEASE"])} />
        <Group title="아직 답이 없어요" color="var(--color-warning)" rows={by(["SENT", "PENDING"])} />
        {summary.failed > 0 && (
          <Group title="문자를 보내지 못했어요" color="var(--color-danger)" rows={by(["FAILED"])} />
        )}
      </div>
      <p className="note">'정리해 주세요'라고 답한 분도 삭제는 내 폰에서 직접 해 주세요.</p>
      {err && <p className="error">{err}</p>}
    </div>
  );
}
