"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type State = "loading" | "ask" | "reply" | "done" | "already" | "error";

export default function RecipientPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>("loading");
  const [data, setData] = useState<{ senderNickname: string; messageText: string } | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/r/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setState("error"); return; }
        if (d.status === "KEEP" || d.status === "RELEASE") { setState("already"); return; }
        setData({ senderNickname: d.senderNickname, messageText: d.messageText });
        setState("ask");
      })
      .catch(() => setState("error"));
  }, [token]);

  async function respond(action: "KEEP" | "RELEASE", message?: string) {
    setErr("");
    setSending(true);
    try {
      const res = await fetch(`/api/r/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, message }),
      });
      const d = await res.json();
      if (res.ok) setState("done");
      else setErr(d.error ?? "제출 실패");
    } finally {
      setSending(false);
    }
  }

  const Box = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6">{children}</div>
    </div>
  );

  const AppIntro = () => (
    <div className="mt-6 pt-4 border-t border-gray-100 text-center">
      <p className="text-xs text-gray-400 leading-relaxed">
        나도 오래된 연락처를 정리하고 싶다면?
        <br />
        '이게누구야'는 누구나 쓸 수 있는 서비스예요.
      </p>
      <a
        href="intoss://igenuguya-miniapp"
        className="inline-block mt-2 text-xs text-blue-500 font-semibold"
      >
        이게누구야 열어보기 →
      </a>
    </div>
  );

  if (state === "loading") return <Box><p className="text-center text-gray-400">로딩 중...</p></Box>;

  if (state === "error") return (
    <Box><p className="text-center text-red-500">유효하지 않거나 만료된 링크입니다.</p></Box>
  );

  if (state === "already") return (
    <Box>
      <h2 className="font-bold text-lg mb-2 text-center">이미 응답 완료</h2>
      <p className="text-gray-500 text-sm text-center">소중한 답변 감사합니다.</p>
      <AppIntro />
    </Box>
  );

  if (state === "done") return (
    <Box>
      <div className="text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="font-bold text-xl mb-2">답변이 전달되었어요</h2>
        <p className="text-gray-500 text-sm">소중한 답변 감사합니다.</p>
      </div>
      <AppIntro />
    </Box>
  );

  if (state === "reply") return (
    <Box>
      <h2 className="font-bold text-lg mb-1 text-center">메시지 남기기</h2>
      <p className="text-gray-500 text-xs text-center mb-4">남겨주신 메시지를 그대로 전달해드릴게요.</p>
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={4}
        maxLength={300}
        placeholder="오랜만이에요! 저도 계속 연락하고 싶어요 :)"
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      {err && <p className="text-red-500 text-sm mb-3 text-center">{err}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => setState("ask")}
          className="flex-1 border border-gray-300 text-gray-700 rounded-xl py-3 text-sm font-semibold hover:bg-gray-50"
        >
          돌아가기
        </button>
        <button
          onClick={() => respond("KEEP", reply)}
          disabled={sending || !reply.trim()}
          className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-40"
        >
          {sending ? "보내는 중..." : "보내기"}
        </button>
      </div>
    </Box>
  );

  return (
    <Box>
      <h2 className="font-bold text-lg mb-1 text-center">이게누구야</h2>
      <p className="text-gray-500 text-xs text-center mb-6">연락처 정리 서비스</p>
      <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm text-blue-900 leading-relaxed whitespace-pre-line">
        {data?.messageText}
      </div>
      {err && <p className="text-red-500 text-sm mb-3 text-center">{err}</p>}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setState("reply")}
          className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700"
        >
          메시지 남기기
        </button>
        <button
          onClick={() => respond("RELEASE")}
          disabled={sending}
          className="w-full border border-gray-300 text-gray-700 rounded-xl py-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-40"
        >
          정리해 주세요
        </button>
      </div>
    </Box>
  );
}
