import Image from "next/image";
import Link from "next/link";

const VALUES = [
  {
    title: "이미 쓰는 LLM 그대로",
    desc: "MS Copilot, Claude Enterprise, Gemini Workspace 등 고객사가 이미 계약한 LLM 계정에 그대로 연결됩니다. 별도 AI 계약이나 신규 학습 비용이 없습니다.",
  },
  {
    title: "원터치 회의 호출",
    desc: "회의실 테이블 위 버튼 하나로 시작됩니다. 로그인도, 앱 실행도 없이 회의가 시작되는 순간 조용히 함께합니다.",
  },
  {
    title: "판단 없이 관찰만",
    desc: "옳고 그름을 가리지 않습니다. 회의에서 오간 사실관계를 정리하고, 필요할 때만 정해진 방식으로 질문을 던져 논의를 환기합니다.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="section relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(124,255,178,0.08),_transparent_55%)]" />
        <div className="mx-auto grid max-w-content items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-8">
          <div>
            <span className="eyebrow">AI Voice Catfish Speaker</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl">
              형식에 파문을 일으키다
            </h1>
            <p className="mt-3 text-sm font-medium uppercase tracking-[0.2em] text-text-muted">
              Stir the still water.
            </p>
            <p className="mt-6 max-w-md text-base leading-relaxed text-text-muted">
              회의실에 놓는 퍽(puck)형 블루투스 AI 음성 트리거 하드웨어. 자체
              LLM 없이, 고객사가 이미 계약한 LLM을 물리적 버튼 하나로
              호출·연동합니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="btn-cta">
                파일럿 문의하기
              </Link>
              <Link href="/how-it-works" className="btn-outline">
                작동 원리 보기
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="card overflow-hidden">
              <Image
                src="/images/puck-speaker-angles.svg"
                alt="AI 보이스 캣피쉬 스피커 0도, 90도, 45도 각도 렌더링"
                width={1000}
                height={620}
                priority
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="section border-t border-white/5">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <span className="eyebrow">Why Catfish Effect</span>
          <h2 className="mt-3 max-w-xl text-2xl font-bold sm:text-3xl">
            회의의 본질에 집중하도록 돕습니다
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v, i) => (
              <div key={v.title} className="card p-7">
                <span className="text-xs font-bold text-lime-mint">
                  0{i + 1}
                </span>
                <h3 className="mt-3 text-lg font-bold">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand story */}
      <section className="section border-t border-white/5 bg-smoke-blue-dark/30">
        <div className="mx-auto grid max-w-content items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
          <div className="relative flex items-center justify-center py-8">
            <div className="absolute h-64 w-64 rounded-full border border-smoke-blue-light/30" />
            <div className="absolute h-44 w-44 rounded-full border border-smoke-blue-light/30" />
            <div className="absolute h-24 w-24 rounded-full border border-lime-mint/30" />
            <svg
              viewBox="-20 0 470 140"
              className="relative h-20 w-auto sm:h-24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="storyBodyGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#7CFFB2" />
                  <stop offset="100%" stopColor="#38495a" />
                </linearGradient>
              </defs>
              <path
                d="M 40 70 C 60 20, 150 5, 250 15 C 295 20, 325 35, 335 70 C 325 105, 295 120, 250 125 C 150 135, 60 120, 40 70 Z"
                fill="url(#storyBodyGrad)"
              />
              <path d="M 40 70 L -10 40 L 5 70 L -10 100 Z" fill="#7CFFB2" />
              <path
                d="M 333 55 C 375 42, 405 32, 435 28"
                stroke="#7CFFB2"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 335 70 C 378 70, 410 72, 440 75"
                stroke="#7CFFB2"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                opacity="0.85"
              />
              <path
                d="M 333 85 C 373 98, 403 108, 425 122"
                stroke="#7CFFB2"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                opacity="0.7"
              />
              <circle cx="270" cy="55" r="5" fill="#0b0f13" />
            </svg>
          </div>

          <div>
            <span className="eyebrow">Brand Story</span>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
              메기 효과, 정체된 회의에 던지는 건설적인 파문
            </h2>
            <p className="mt-5 text-base leading-relaxed text-text-muted">
              경직되고 형식적인 회의는 잔잔한 물과 같습니다. 캣피쉬이펙트는
              그 물에 메기 한 마리를 풀어놓듯, 정체된 논의에 건설적인 자극을
              더합니다.
            </p>
            <p className="mt-4 text-base leading-relaxed text-text-muted">
              &ldquo;메기 효과&rdquo;는 정체된 조직이나 상황에 적절한 자극을
              줘 활력을 만든다는 경영학 용어에서 착안했습니다. 캣피쉬이펙트는
              회의를 대신 판단하지 않습니다. 다만 형식에 갇힌 논의가 다시
              흐르도록, 조용히 그러나 분명하게 파문을 일으킵니다.
            </p>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="section border-t border-white/5">
        <div className="mx-auto max-w-content px-5 text-center sm:px-8">
          <h2 className="text-2xl font-bold sm:text-3xl">
            회의실 파일럿을 시작해보세요
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-text-muted">
            기존 LLM 계약을 그대로 활용하는 파일럿 프로그램을 운영 중입니다.
            도입 문의를 남겨주시면 담당자가 연락드립니다.
          </p>
          <div className="mt-8">
            <Link href="/contact" className="btn-cta">
              파일럿 문의하기
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
