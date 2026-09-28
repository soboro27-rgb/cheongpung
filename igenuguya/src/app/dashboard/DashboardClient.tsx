"use client";
import { useState } from "react";

interface Friend {
  uuid: string;
  nickname: string;
  thumbnailUrl?: string;
}

interface BatchSummary {
  id: number;
  messageText: string;
  createdAt: string;
  total: number;
  keep: number;
  release: number;
  pending: number;
}

interface BatchDetail {
  summary: { total: number; pending: number; keep: number; release: number; failed: number };
  contacts: { id: number; nickname: string; status: string; reminderSentAt: string | null }[];
}

function BatchCard({ b }: { b: BatchSummary }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<BatchDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch(`/api/batches/${b.id}`);
    if (res.ok) setDetail(await res.json());
  }

  async function toggle() {
    if (!open && !detail) await load();
    setOpen(!open);
  }

  async function remind() {
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/batches/${b.id}/remind`, { method: "POST" });
    const d = await res.json();
    setMsg(res.ok ? `${d.total}명에게 리마인드를 보냈어요` : d.error ?? "실패");
    await load();
    setBusy(false);
  }

  const group = (statuses: string[]) => detail?.contacts.filter((c) => statuses.includes(c.status)) ?? [];
  const canRemind = group(["SENT"]).some((c) => !c.reminderSentAt);

  const Group = ({ title, color, list }: { title: string; color: string; list: { id: number; nickname: string }[] }) => (
    <div className="mb-3">
      <p className={`text-xs font-semibold mb-1 ${color}`}>{title} ({list.length})</p>
      <p className="text-sm text-gray-700">{list.length ? list.map((c) => c.nickname).join(", ") : "-"}</p>
    </div>
  );

  return (
    <div className="border rounded-xl px-4 py-3 text-sm">
      <button onClick={toggle} className="w-full text-left">
        <p className="text-gray-400 text-xs mb-1">{new Date(b.createdAt).toLocaleString("ko-KR")}</p>
        <div className="flex gap-4 text-xs">
          <span>총 {b.total}명</span>
          <span className="text-blue-600">유지 {b.keep}</span>
          <span className="text-gray-500">정리동의 {b.release}</span>
          <span className="text-yellow-600">응답대기 {b.pending}</span>
        </div>
      </button>
      {open && detail && (
        <div className="mt-4 pt-4 border-t">
          <Group title="계속 연락하고 싶어요" color="text-blue-600" list={group(["KEEP"])} />
          <Group title="정리해도 좋아요 (최종 삭제는 본인 폰에서 직접)" color="text-gray-600" list={group(["RELEASE"])} />
          <Group title="아직 응답 없음" color="text-yellow-600" list={group(["SENT", "PENDING"])} />
          {canRemind && (
            <button
              onClick={remind}
              disabled={busy}
              className="mt-1 border border-yellow-400 text-yellow-700 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-yellow-50 disabled:opacity-50"
            >
              {busy ? "보내는 중..." : "응답 없는 친구에게 리마인드 1회 보내기"}
            </button>
          )}
          {msg && <p className="text-xs text-green-600 mt-2">{msg}</p>}
        </div>
      )}
    </div>
  );
}

const DEFAULT_MESSAGE =
  "안녕하세요, 연락처 정리 서비스 '이게누구야'입니다. 저장된 연락처를 한번 정리해보고 있는데, 계속 인연을 이어가고 싶으신지 대신 여쭤봐달라고 요청하셨어요. 편하게 답변 주시면 그대로 전달해드릴게요.";

export default function DashboardClient({
  nickname,
  batches,
}: {
  nickname: string;
  batches: BatchSummary[];
}) {
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [sentInfo, setSentInfo] = useState<{ total: number; failedCount: number } | null>(null);

  async function loadFriends() {
    setLoadingFriends(true);
    setErr("");
    try {
      const res = await fetch("/api/friends");
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "친구목록 조회 실패");
      setFriends(d.friends);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "친구목록 조회 실패");
    } finally {
      setLoadingFriends(false);
    }
  }

  function toggle(uuid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
  }

  async function sendBatch() {
    if (!friends || selected.size === 0) return;
    setSending(true);
    setErr("");
    setSentInfo(null);
    try {
      const targets = friends.filter((f) => selected.has(f.uuid));
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageText: message, friends: targets }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "발송 실패");
      setSentInfo({ total: d.total, failedCount: d.failedCount });
      setSelected(new Set());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "발송 실패");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold">이게누구야</h1>
          <p className="text-sm text-gray-500">{nickname}님, 안녕하세요</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="text-sm text-gray-400 hover:text-gray-600">로그아웃</button>
        </form>
      </div>

      <section className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <h2 className="font-semibold mb-4">1. 친구 불러오기</h2>
        {!friends && (
          <button
            onClick={loadFriends}
            disabled={loadingFriends}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {loadingFriends ? "불러오는 중..." : "카카오 친구목록 불러오기"}
          </button>
        )}
        {err && <p className="text-red-500 text-sm mt-3">{err}</p>}

        {friends && (
          <>
            <p className="text-xs text-gray-400 mb-3">
              총 {friends.length}명 조회됨 (카카오 정책상 친구목록 제공에 동의한 친구만 표시됩니다)
            </p>
            <div className="max-h-72 overflow-y-auto border rounded-xl divide-y">
              {friends.map((f) => (
                <label key={f.uuid} className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selected.has(f.uuid)}
                    onChange={() => toggle(f.uuid)}
                  />
                  <span className="text-sm">{f.nickname}</span>
                </label>
              ))}
              {friends.length === 0 && (
                <p className="text-sm text-gray-400 px-4 py-6 text-center">조회된 친구가 없습니다.</p>
              )}
            </div>
          </>
        )}
      </section>

      {friends && (
        <section className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h2 className="font-semibold mb-4">2. 안부 확인 메시지</h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full border rounded-xl px-4 py-3 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={sendBatch}
            disabled={sending || selected.size === 0}
            className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-40"
          >
            {sending ? "발송 중..." : `선택한 ${selected.size}명에게 정리 메시지 보내기`}
          </button>
          {sentInfo && (
            <p className="text-sm text-green-600 mt-3">
              {sentInfo.total}명 중 {sentInfo.total - sentInfo.failedCount}명 발송 성공
              {sentInfo.failedCount > 0 && `, ${sentInfo.failedCount}명 실패`}
            </p>
          )}
        </section>
      )}

      <section className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold mb-4">지난 정리 요청</h2>
        {batches.length === 0 && <p className="text-sm text-gray-400">아직 보낸 요청이 없습니다.</p>}
        <div className="space-y-3">
          {batches.map((b) => (
            <BatchCard key={b.id} b={b} />
          ))}
        </div>
      </section>
    </div>
  );
}
