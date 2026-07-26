import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "제품",
  description:
    "캐피시AI 보이스 스피커 하드웨어 스펙, 각도별 렌더링, 기능 로드맵.",
};

const SPECS = [
  { label: "형태", value: "퍽(disc)형" },
  { label: "사이즈", value: "Ø58mm × H32mm" },
  { label: "무게", value: "약 85g" },
  { label: "마이크", value: "6홀 마이크 어레이 (360도 픽업)" },
  { label: "상태 표시", value: "측면 LED 상태링 (대기 / 듣는중 / 응답중)" },
  { label: "충전", value: "하단 USB-C" },
  { label: "연결", value: "블루투스 HFP(핸즈프리 프로파일)" },
  { label: "컬러", value: "스모크블루 바디 + 라임민트 포인트" },
];

const ROADMAP = [
  {
    stage: "1단계",
    title: "조용한 기록자",
    status: "MVP",
    desc: "회의 시작 전 참석자 전원 동의 절차를 거친 뒤, 음성을 텍스트로 변환해 요약과 액션 아이템을 정리합니다. 개입 없이 기록에 집중하는 단계입니다.",
  },
  {
    stage: "2단계",
    title: "질문형 개입",
    status: "트리거 기반",
    desc: "정해진 트리거 조건에서만 제한적으로 질문을 던집니다. 예: “이 결정에 대한 리스크는 검토됐나요?” 처럼, 논의를 환기하는 정해진 형태의 개입만 수행합니다.",
  },
  {
    stage: "3단계",
    title: "장기 로드맵",
    status: "신중 접근",
    desc: "보다 자유로운 형태의 참여 방식을 신중하게 검토하는 장기 단계입니다. 판단하지 않는다는 원칙 위에서, 개입 범위를 점진적으로 논의합니다.",
  },
];

export default function ProductPage() {
  return (
    <>
      <section className="section">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <span className="eyebrow">Product</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            캐피시AI 보이스 스피커
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted">
            회의실 테이블 위에 놓는 퍽형 하드웨어입니다. 자체 LLM을 탑재하지
            않고, 고객사가 이미 계약한 LLM 계정을 물리적 버튼 하나로 호출해
            연동합니다.
          </p>
        </div>
      </section>

      {/* Renders */}
      <section className="border-t border-white/5 pb-4 pt-4">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <div className="grid gap-5 lg:grid-cols-5">
            <div className="card overflow-hidden lg:col-span-3">
              <Image
                src="/images/puck-speaker-design.svg"
                alt="캐피시AI 보이스 스피커 탑뷰 및 사이드뷰 디자인"
                width={900}
                height={560}
                className="h-auto w-full"
              />
            </div>
            <div className="card overflow-hidden lg:col-span-2">
              <Image
                src="/images/puck-speaker-angles.svg"
                alt="캐피시AI 보이스 스피커 0도, 90도, 45도 각도별 렌더링"
                width={1000}
                height={620}
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Spec table */}
      <section className="section border-t border-white/5">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <span className="eyebrow">Hardware Spec</span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
            하드웨어 스펙
          </h2>
          <div className="card mt-8 divide-y divide-white/5 overflow-hidden">
            {SPECS.map((spec) => (
              <div
                key={spec.label}
                className="grid grid-cols-1 gap-1 px-6 py-4 sm:grid-cols-[160px_1fr] sm:items-center sm:gap-4 sm:py-4"
              >
                <span className="text-sm font-semibold text-text-muted">
                  {spec.label}
                </span>
                <span className="text-sm text-text-primary">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="section border-t border-white/5 bg-smoke-blue-dark/30">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <span className="eyebrow">Feature Roadmap</span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
            기능 로드맵
          </h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {ROADMAP.map((step) => (
              <div key={step.stage} className="card flex flex-col p-7">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-lime-mint">
                    {step.stage}
                  </span>
                  <span className="rounded-full border border-smoke-blue-light/40 px-2.5 py-1 text-[11px] font-medium text-text-muted">
                    {step.status}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-t border-white/5">
        <div className="mx-auto max-w-content px-5 text-center sm:px-8">
          <h2 className="text-2xl font-bold sm:text-3xl">
            도입을 검토 중이신가요?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-text-muted">
            가격, 지원 LLM 벤더, 파일럿 프로그램에 대한 안내는 도입 안내
            페이지에서 확인하실 수 있습니다.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/for-business" className="btn-cta">
              도입 안내 보기
            </Link>
            <Link href="/how-it-works" className="btn-outline">
              작동 원리 보기
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
