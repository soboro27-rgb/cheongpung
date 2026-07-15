"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type State = "loading" | "verify" | "confirm" | "modify" | "done" | "already" | "expired" | "error";

export default function RecipientPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>("loading");
  const [phone4, setPhone4] = useState("");
  const [data, setData] = useState<{ name: string; address: string } | null>(null);
  const [newAddr, setNewAddr] = useState("");
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState("");

  // Step 1: check token status
  useEffect(() => {
    fetch(`/api/r/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === "CONFIRMED" || d.status === "MODIFIED") setState("already");
        else if (d.status === "EXPIRED") setState("expired");
        else setState("verify");
      })
      .catch(() => setState("error"));
  }, [token]);

  async function verify() {
    setErr("");
    const res = await fetch(`/api/r/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone4 }),
    });
    const d = await res.json();
    if (res.ok) { setData(d); setState("confirm"); }
    else setErr(d.error ?? "인증 실패");
  }

  async function submit(action: "CONFIRMED" | "MODIFIED") {
    if (!consent) { setErr("개인정보 처리에 동의해 주세요."); return; }
    setErr("");
    const res = await fetch(`/api/r/${token}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, newAddress: action === "MODIFIED" ? newAddr : undefined }),
    });
    const d = await res.json();
    if (res.ok) setState("done");
    else setErr(d.error ?? "제출 실패");
  }

  const Box = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-12 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6">{children}</div>
    </div>
  );

  if (state === "loading") return <Box><p className="text-center text-gray-400">로딩 중...</p></Box>;
  if (state === "already") return (
    <Box>
      <h2 className="font-bold text-lg mb-2 text-center">이미 응답 완료</h2>
      <p className="text-gray-500 text-sm text-center">이미 주소를 확인하셨습니다. 개인정보는 안전하게 파기되었습니다.</p>
    </Box>
  );
  if (state === "expired") return (
    <Box>
      <h2 className="font-bold text-lg mb-2 text-center text-red-500">링크 만료</h2>
      <p className="text-gray-500 text-sm text-center">응답 기간이 종료되었습니다.</p>
    </Box>
  );
  if (state === "error") return (
    <Box><p className="text-center text-red-500">오류가 발생했습니다. 다시 시도해 주세요.</p></Box>
  );

  if (state === "verify") return (
    <Box>
      <h2 className="font-bold text-xl mb-1 text-center">배송 주소 확인</h2>
      <p className="text-gray-500 text-sm text-center mb-6">본인 확인을 위해 전화번호 끝 4자리를 입력해 주세요.</p>
      {err && <p className="text-red-500 text-sm mb-3 text-center">{err}</p>}
      <input
        type="tel"
        maxLength={4}
        value={phone4}
        onChange={e => setPhone4(e.target.value.replace(/\D/g, ""))}
        placeholder="전화번호 끝 4자리"
        className="w-full border rounded-xl px-4 py-3 text-center text-2xl tracking-widest mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        onClick={verify}
        disabled={phone4.length !== 4}
        className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 disabled:opacity-40"
      >
        확인
      </button>
    </Box>
  );

  if (state === "confirm") return (
    <Box>
      <h2 className="font-bold text-xl mb-1">안녕하세요, {data?.name}님</h2>
      <p className="text-gray-500 text-sm mb-4">아래 배송 주소가 맞으면 확인을, 아니면 수정해 주세요.</p>
      <div className="bg-blue-50 rounded-xl p-4 mb-4 text-sm text-blue-900 font-medium">{data?.address}</div>
      {err && <p className="text-red-500 text-sm mb-3">{err}</p>}
      <label className="flex items-start gap-2 text-xs text-gray-500 mb-4 cursor-pointer">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
        주소 확인 결과가 발송사(고객사)에 전달되며, 이 플랫폼에는 개인정보가 영구 보관되지 않음에 동의합니다.
      </label>
      <div className="flex gap-2">
        <button
          onClick={() => { setConsent(false); setState("modify"); }}
          className="flex-1 border border-gray-300 text-gray-700 rounded-xl py-3 text-sm font-semibold hover:bg-gray-50"
        >
          주소 수정
        </button>
        <button
          onClick={() => submit("CONFIRMED")}
          className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700"
        >
          맞아요 ✓
        </button>
      </div>
    </Box>
  );

  if (state === "modify") return (
    <Box>
      <h2 className="font-bold text-xl mb-1">주소 수정</h2>
      <p className="text-gray-500 text-sm mb-4">정확한 배송 주소를 입력해 주세요.</p>
      <p className="text-xs text-gray-400 mb-1">기존 주소</p>
      <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-500">{data?.address}</div>
      <p className="text-xs text-gray-700 font-medium mb-1">새 주소 *</p>
      <textarea
        value={newAddr}
        onChange={e => setNewAddr(e.target.value)}
        rows={3}
        placeholder="새 주소를 입력하세요"
        className="w-full border rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
      />
      {err && <p className="text-red-500 text-sm mb-3">{err}</p>}
      <label className="flex items-start gap-2 text-xs text-gray-500 mb-4 cursor-pointer">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
        주소 수정 결과가 발송사(고객사)에 전달되며, 이 플랫폼에는 개인정보가 영구 보관되지 않음에 동의합니다.
      </label>
      <div className="flex gap-2">
        <button
          onClick={() => setState("confirm")}
          className="flex-1 border border-gray-300 text-gray-700 rounded-xl py-3 text-sm font-semibold"
        >
          돌아가기
        </button>
        <button
          onClick={() => submit("MODIFIED")}
          disabled={newAddr.trim().length < 5}
          className="flex-1 bg-green-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-700 disabled:opacity-40"
        >
          수정 제출
        </button>
      </div>
    </Box>
  );

  if (state === "done") return (
    <Box>
      <div className="text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="font-bold text-xl mb-2">제출 완료</h2>
        <p className="text-gray-500 text-sm">소중한 정보를 안전하게 전달했습니다.<br />개인정보는 즉시 파기됩니다.</p>
      </div>
    </Box>
  );

  return null;
}
