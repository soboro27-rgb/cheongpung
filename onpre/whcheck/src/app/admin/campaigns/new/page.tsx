"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCampaignPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", messageText: "", expiresAt: "", returnTargetType: "WEBHOOK",
    returnTargetRef: "", returnTargetSecret: "",
  });
  const [err, setErr] = useState("");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { const d = await res.json(); router.push(`/admin/campaigns/${d.id}`); }
    else { const d = await res.json(); setErr(d.error ?? "오류"); }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin" className="text-gray-400 hover:text-gray-700 text-sm">← 목록</a>
        <h1 className="text-2xl font-bold">새 캠페인</h1>
      </div>
      {err && <p className="text-red-500 text-sm mb-4">{err}</p>}
      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <Field label="캠페인명 *">
          <input value={form.name} onChange={e => set("name", e.target.value)}
            className="input" required placeholder="예) 2024년 12월 배송 주소 확인" />
        </Field>
        <Field label="알림톡 안내 메시지 *">
          <textarea value={form.messageText} onChange={e => set("messageText", e.target.value)}
            rows={4} className="input resize-none" required
            placeholder="수취인에게 전달할 메시지를 입력하세요. #{link} 변수에 확인 링크가 삽입됩니다." />
        </Field>
        <Field label="만료일시 *">
          <input type="datetime-local" value={form.expiresAt} onChange={e => set("expiresAt", e.target.value)}
            className="input" required />
        </Field>
        <Field label="회신 저장소 유형 *">
          <select value={form.returnTargetType} onChange={e => set("returnTargetType", e.target.value)} className="input">
            <option value="WEBHOOK">웹훅 (POST)</option>
            <option value="GOOGLE_SHEET">구글 시트</option>
          </select>
        </Field>
        <Field label={form.returnTargetType === "WEBHOOK" ? "웹훅 URL *" : "구글 시트 ID *"}>
          <input value={form.returnTargetRef} onChange={e => set("returnTargetRef", e.target.value)}
            className="input" required
            placeholder={form.returnTargetType === "WEBHOOK" ? "https://..." : "스프레드시트 ID"} />
        </Field>
        {form.returnTargetType === "WEBHOOK" && (
          <Field label="웹훅 서명 시크릿 (선택)">
            <input value={form.returnTargetSecret} onChange={e => set("returnTargetSecret", e.target.value)}
              className="input" placeholder="HMAC 서명용 시크릿" />
          </Field>
        )}
        <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700">
          캠페인 생성
        </button>
      </form>
      <style>{`.input { width:100%; border:1px solid #e5e7eb; border-radius:8px; padding:8px 12px; font-size:14px; outline:none; } .input:focus { border-color:#3b82f6; box-shadow:0 0 0 2px #bfdbfe; }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>{children}</div>;
}
