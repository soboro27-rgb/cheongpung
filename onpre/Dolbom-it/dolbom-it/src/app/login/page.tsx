"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

const TEST_ACCOUNTS = [
  { email: "parent@test.com",  name: "김부모 (부모)",             role: "PARENT" },
  { email: "care1@test.com",   name: "이돌봄 (마스터 케어메이트)", role: "CAREGIVER" },
  { email: "care2@test.com",   name: "박케어 (전문 케어메이트)",   role: "CAREGIVER" },
  { email: "care3@test.com",   name: "최돌봄 (일반 케어메이트)",   role: "CAREGIVER" },
]

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleLogin(loginEmail: string) {
    setLoading(loginEmail)
    setError("")
    try {
      const res = await signIn("credentials", {
        email: loginEmail,
        password: "",
        redirect: false,
      })
      setLoading(null)
      if (res?.ok) {
        router.push("/swipe")
        router.refresh()
      } else {
        setError(res?.error ?? "등록되지 않은 이메일입니다")
      }
    } catch (e) {
      setLoading(null)
      setError("오류: " + String(e))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm space-y-7">
        {/* 로고 */}
        <div className="text-center space-y-2">
          <div className="text-6xl">🧸</div>
          <h1 className="text-3xl font-bold text-gray-900">돌봄잇</h1>
          <p className="text-gray-400 text-sm">국가 인증 돌보미를 내 근처에서 즉시 매칭</p>
        </div>

        {/* 테스트 계정 빠른 로그인 */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">테스트 계정으로 시작</p>
          {TEST_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              onClick={() => handleLogin(acc.email)}
              disabled={loading !== null}
              className="w-full flex items-center justify-between bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 text-gray-700 px-4 py-3 rounded-2xl transition disabled:opacity-50 text-sm"
            >
              <span className="font-medium">{acc.name}</span>
              {loading === acc.email
                ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                : <span className="text-purple-400 text-xs">→</span>
              }
            </button>
          ))}
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-3 text-gray-300">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs">또는 이메일로</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* 이메일 직접 입력 */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleLogin(email) }}
          className="space-y-3"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 입력"
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-300"
          />
          {error && <p className="text-red-500 text-xs px-1">{error}</p>}
          <button
            type="submit"
            disabled={!email || loading !== null}
            className="w-full bg-purple-600 text-white font-semibold py-3 rounded-2xl hover:bg-purple-700 transition disabled:opacity-40"
          >
            {loading === email ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "로그인"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center">MVP 버전 — 비밀번호 없이 이메일만으로 로그인</p>
      </div>
    </div>
  )
}
