const VENDORS = ["MS Copilot", "Claude Enterprise", "Gemini Workspace"];

export default function DataFlowDiagram() {
  return (
    <div className="card p-6 sm:p-10">
      <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:gap-0">
        {/* Node 1: meeting room */}
        <div className="flex-1 rounded-xl border border-smoke-blue-light/30 bg-bg-dark/60 p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-lime-mint">
            Step 1
          </p>
          <p className="mt-2 text-base font-bold">회의실 캣피쉬 스피커</p>
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            버튼 호출 · 음성 픽업
          </p>
        </div>

        {/* Arrow 1 */}
        <FlowArrow label="당사 서버 미경유" />

        {/* Node 2: customer LLM */}
        <div className="flex-1 rounded-xl border border-lime-mint/40 bg-bg-dark/60 p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-lime-mint">
            Step 2
          </p>
          <p className="mt-2 text-base font-bold">고객사 자체 LLM 계정</p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {VENDORS.map((v) => (
              <span
                key={v}
                className="rounded-full border border-smoke-blue-light/40 px-2.5 py-1 text-[11px] text-text-muted"
              >
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Arrow 2 */}
        <FlowArrow label="처리 결과 회신" />

        {/* Node 3: back to room */}
        <div className="flex-1 rounded-xl border border-smoke-blue-light/30 bg-bg-dark/60 p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-lime-mint">
            Step 3
          </p>
          <p className="mt-2 text-base font-bold">회의실로 응답 전달</p>
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            요약 · 액션 아이템 · 정해진 질문
          </p>
        </div>
      </div>

      <p className="mt-8 text-center text-xs leading-relaxed text-text-muted">
        캣피쉬이펙트는 데이터 처리자가 아닙니다. 회의 콘텐츠는 당사 서버를
        거치지 않고 고객의 LLM 계정으로 직접 라우팅됩니다.
      </p>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center px-2 py-1 lg:w-28">
      <span className="mb-1 text-center text-[10px] font-medium text-text-muted lg:mb-1.5">
        {label}
      </span>
      {/* horizontal on desktop */}
      <svg
        viewBox="0 0 100 20"
        className="hidden h-4 w-full text-lime-mint lg:block"
        fill="none"
      >
        <line
          x1="2"
          y1="10"
          x2="90"
          y2="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 5"
        />
        <path d="M84 4 L94 10 L84 16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* vertical on mobile */}
      <svg
        viewBox="0 0 20 60"
        className="block h-10 w-4 text-lime-mint lg:hidden"
        fill="none"
      >
        <line
          x1="10"
          y1="2"
          x2="10"
          y2="50"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 5"
        />
        <path d="M4 44 L10 54 L16 44" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
