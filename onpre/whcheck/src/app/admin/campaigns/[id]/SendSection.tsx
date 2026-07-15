"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SendSection({ campaignId, campaignStatus }: { campaignId: number; campaignStatus: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [err, setErr] = useState("");
  const router = useRouter();

  async function sendAll() {
    if (!confirm("미발송·실패 대상에게 알림톡을 발송하시겠습니까?")) return;
    setLoading(true); setErr(""); setResult(null);
    const res = await fetch(`/api/campaigns/${campaignId}/send`, { method: "POST" });
    setLoading(false);
    if (res.ok) { setResult(await res.json()); router.refresh(); }
    else { const d = await res.json(); setErr(d.error ?? "발송 실패"); }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold mb-3">알림톡 발송</h2>
      <p className="text-xs text-gray-400 mb-3">
        발송 시 전화번호는 중개사(알림톡 발송사)에만 전달되며, 우리 서버 로그에는 마스킹 처리됩니다.
      </p>
      {err && <p className="text-red-500 text-sm mb-2">{err}</p>}
      {result && <p className="text-green-600 text-sm mb-2">발송 {result.sent}건 성공, {result.failed}건 실패</p>}
      <button onClick={sendAll} disabled={loading || campaignStatus === "EXPIRED"}
        className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-40">
        {loading ? "발송 중..." : "미발송·실패 대상 발송"}
      </button>
    </div>
  );
}
