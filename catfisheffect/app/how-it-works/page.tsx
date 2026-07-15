import type { Metadata } from "next";
import Link from "next/link";
import DataFlowDiagram from "@/components/DataFlowDiagram";

export const metadata: Metadata = {
  title: "작동 원리",
  description:
    "BYO-LLM 데이터 흐름과 캣피쉬이펙트의 개입 원칙을 설명합니다. 당사 서버는 회의 콘텐츠를 경유하지 않습니다.",
};

const PRINCIPLES = [
  {
    title: "판단하지 않습니다",
    desc: "누가 옳고 그른지 가리지 않습니다. 회의에서 오간 발언과 사실관계를 있는 그대로 정리하는 데 집중합니다.",
  },
  {
    title: "정해진 방식으로만 개입합니다",
    desc: "자유롭게 끼어들지 않습니다. 미리 정의된 트리거 조건에서만, 정해진 형태의 질문으로 논의를 환기합니다.",
  },
  {
    title: "질문을 우선합니다",
    desc: "결론을 대신 내려주지 않습니다. “이 부분은 검토됐나요?” 같은 질문을 던져, 결정은 회의 참석자들의 몫으로 남겨둡니다.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="section">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <span className="eyebrow">How It Works</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            작동 원리
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted">
            캣피쉬이펙트는 자체 LLM을 갖지 않습니다. 고객사가 이미 계약한
            LLM 계정을 그대로 호출하는 BYO-LLM(Bring Your Own LLM) 구조로
            동작합니다.
          </p>
        </div>
      </section>

      <section className="border-t border-white/5 pb-4 pt-4">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <DataFlowDiagram />
        </div>
      </section>

      <section className="section border-t border-white/5 bg-smoke-blue-dark/30">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <span className="eyebrow">Intervention Principles</span>
          <h2 className="mt-3 max-w-xl text-2xl font-bold sm:text-3xl">
            캣피쉬의 개입 원칙
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-muted">
            캣피쉬이펙트는 회의에 자극을 주되, 그 방식은 신중하게 설계되어
            있습니다. 세 가지 원칙 위에서 동작합니다.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <div key={p.title} className="card p-7">
                <span className="text-xs font-bold text-lime-mint">
                  0{i + 1}
                </span>
                <h3 className="mt-3 text-lg font-bold">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-t border-white/5">
        <div className="mx-auto max-w-content px-5 text-center sm:px-8">
          <h2 className="text-2xl font-bold sm:text-3xl">
            데이터는 어떻게 처리되나요?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-text-muted">
            데이터 처리 정책과 법적 고지 사항은 보안·법적 고지 페이지에서
            자세히 확인하실 수 있습니다.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/security" className="btn-cta">
              보안·법적 고지 보기
            </Link>
            <Link href="/contact" className="btn-outline">
              파일럿 문의하기
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
