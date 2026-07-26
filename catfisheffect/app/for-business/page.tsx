import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "도입 안내",
  description:
    "캐피시AI 보이스 스피커 도입 가격, 지원 LLM 벤더, 파일럿 프로그램 안내.",
};

const VENDORS = [
  {
    name: "MS Copilot",
    desc: "Microsoft 365 Copilot 계약 기업 대상 우선 지원",
  },
  {
    name: "Claude Enterprise",
    desc: "Claude Enterprise 계약 기업 대상 우선 지원",
  },
];

const PRICING_ITEMS = [
  { label: "하드웨어 납품가", value: "대당 15만 ~ 25만원 (B2B)" },
  { label: "연동 유지보수", value: "선택적 계약 (이연수익형)" },
  { label: "초기 지원 벤더", value: "MS Copilot, Claude Enterprise" },
  { label: "기타 벤더", value: "별도 문의" },
];

const PILOT_STEPS = [
  { step: "01", title: "문의 접수", desc: "회사명, 담당자, 현재 LLM 벤더 등 기본 정보를 남겨주세요." },
  { step: "02", title: "회의실 환경 확인", desc: "회의실 규모와 사용 중인 LLM 계약 현황을 함께 확인합니다." },
  { step: "03", title: "파일럿 진행", desc: "선정된 회의실에 기기를 설치하고 일정 기간 시범 운영합니다." },
  { step: "04", title: "도입 검토", desc: "파일럿 결과를 바탕으로 정식 도입 규모와 계약 조건을 협의합니다." },
];

export default function ForBusinessPage() {
  return (
    <>
      <section className="section">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <span className="eyebrow">For Business</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            도입 안내
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted">
            기존 LLM 계약을 그대로 활용하는 BYO-LLM 구조이므로, 별도의 AI
            사용료 없이 하드웨어와 연동만으로 도입할 수 있습니다.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-white/5 pb-4 pt-4">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <div className="card divide-y divide-white/5 overflow-hidden">
            {PRICING_ITEMS.map((item) => (
              <div
                key={item.label}
                className="grid grid-cols-1 gap-1 px-6 py-4 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-4"
              >
                <span className="text-sm font-semibold text-text-muted">
                  {item.label}
                </span>
                <span className="text-sm text-text-primary">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vendors */}
      <section className="section border-t border-white/5">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <span className="eyebrow">Supported LLM Vendors</span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
            초기 지원 LLM 벤더
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {VENDORS.map((v) => (
              <div key={v.name} className="card p-7">
                <h3 className="text-lg font-bold text-lime-mint">
                  {v.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-text-muted">
            그 외 벤더는 별도 문의 바랍니다.
          </p>
        </div>
      </section>

      {/* Pilot program */}
      <section className="section border-t border-white/5 bg-smoke-blue-dark/30">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <span className="eyebrow">Pilot Program</span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
            파일럿 프로그램 안내
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-muted">
            정식 도입 전, 회의실 환경에서 실제 사용성을 검증하는 파일럿
            프로그램을 운영하고 있습니다.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PILOT_STEPS.map((s) => (
              <div key={s.step} className="card p-6">
                <span className="text-2xl font-extrabold text-smoke-blue-light">
                  {s.step}
                </span>
                <h3 className="mt-3 text-base font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-t border-white/5">
        <div className="mx-auto max-w-content px-5 text-center sm:px-8">
          <h2 className="text-2xl font-bold sm:text-3xl">
            파일럿을 시작할 준비가 되셨나요?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-text-muted">
            회사명과 담당자 연락처만 남겨주시면 담당자가 확인 후 연락드립니다.
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
