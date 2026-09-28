import { isMockMode } from "@/lib/kakao";

export default function HomePage() {
  const mock = isMockMode();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="text-5xl mb-4">📇</div>
        <h1 className="text-2xl font-bold mb-2">이게누구야</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          카카오톡 친구 중 계속 인연을 이어가고 싶은지,
          <br />
          정리해도 괜찮은지 플랫폼이 대신 물어봐드려요.
          <br />
          삭제는 항상 본인이 최종 결정합니다.
        </p>
        <a
          href="/api/auth/kakao/login"
          className="inline-block w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl py-3 font-semibold transition-colors"
        >
          카카오로 시작하기
        </a>
        {mock && (
          <a
            href="/api/auth/dev-login"
            className="inline-block w-full mt-3 border border-dashed border-gray-300 text-gray-500 rounded-xl py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            🧪 목업 데이터로 미리보기 (카카오 심사 전 화면 확인용)
          </a>
        )}
      </div>
    </div>
  );
}
