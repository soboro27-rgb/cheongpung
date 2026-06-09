import { signIn } from "@/lib/auth"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect("/swipe")

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-sm text-center space-y-8">
        {/* 로고 */}
        <div className="space-y-2">
          <div className="text-6xl">🧸</div>
          <h1 className="text-3xl font-bold text-gray-900">돌봄잇</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            국가 인증 돌보미를<br />내 근처에서 즉시 매칭
          </p>
        </div>

        {/* 로그인 버튼 */}
        <form
          action={async () => {
            "use server"
            await signIn("kakao", { redirectTo: "/swipe" })
          }}
        >
          <button
            type="submit"
            className="w-full bg-[#FEE500] text-[#3C1E1E] font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 hover:brightness-95 transition text-base"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.477 3 2 6.477 2 11c0 2.9 1.605 5.46 4.05 7.02L5 21l4.27-2.2A11.1 11.1 0 0012 19c5.523 0 10-3.477 10-8S17.523 3 12 3z" />
            </svg>
            카카오로 시작하기
          </button>
        </form>

        <p className="text-xs text-gray-400">
          로그인 시 서비스 이용약관 및 개인정보처리방침에 동의합니다
        </p>
      </div>
    </div>
  )
}
