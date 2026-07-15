"use client";
import { useState } from "react";

export default function UploadSection({ campaignId }: { campaignId: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function upload() {
    if (!file) return;
    setLoading(true); setErr(""); setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/campaigns/${campaignId}/upload`, { method: "POST", body: fd });
    setLoading(false);
    if (res.ok) setResult(await res.json());
    else { const d = await res.json(); setErr(d.error ?? "업로드 실패"); }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
      <h2 className="font-semibold mb-3">수취인 명단 업로드</h2>
      <p className="text-xs text-gray-400 mb-3">
        업로드된 개인정보(이름·전화번호·주소)는 우리 서버에 영구 저장되지 않습니다. TTL이 설정된 임시 저장소에만 보관됩니다.
      </p>
      <div className="flex gap-3 items-center">
        <a href="/api/excel-template" className="text-blue-600 text-sm underline">템플릿 다운로드</a>
        <input type="file" accept=".xlsx,.xls,.csv"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="text-sm flex-1" />
        <button onClick={upload} disabled={!file || loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40">
          {loading ? "업로드 중..." : "업로드"}
        </button>
      </div>
      {err && <p className="text-red-500 text-sm mt-2">{err}</p>}
      {result && (
        <p className="text-green-600 text-sm mt-2">
          완료: {result.inserted}건 등록, {result.skipped}건 건너뜀(중복)
        </p>
      )}
    </div>
  );
}
