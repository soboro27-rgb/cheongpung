"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pw }),
    });
    if (res.ok) { router.push("/admin"); router.refresh(); }
    else { const d = await res.json(); setErr(d.error ?? "로그인 실패"); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-700">whcheck</h1>
        <p className="text-center text-gray-500 text-sm mb-6">관리자 로그인</p>
        {err && <p className="text-red-500 text-sm mb-4 text-center">{err}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">비밀번호</label>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <button type="submit"
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700">
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
