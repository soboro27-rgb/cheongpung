import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "보안·법적 고지",
  description:
    "캐피시AI의 데이터 처리 정책과 법적 고지 사항을 안내합니다.",
};

export default function SecurityPage() {
  return (
    <>
      <section className="section">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <span className="eyebrow">Security &amp; Legal</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            데이터 보안 및 법적 고지
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted">
            캐피시AI를 회의실에 도입하기 전, 아래 데이터 처리 방식과
            법적 고지 사항을 확인해 주시기 바랍니다.
          </p>
        </div>
      </section>

      <section className="border-t border-white/5 pb-4 pt-4">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <div className="card border-lime-mint/40 p-7 sm:p-9">
            <h2 className="text-lg font-bold text-lime-mint">
              데이터 처리 원칙
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-text-primary">
              당사는 회의 콘텐츠에 접근하지 않으며, 고객의 LLM 계정으로
              직접 라우팅합니다. 캐피시AI는 데이터 처리자가 아니며,
              회의 음성·텍스트 데이터는 당사 서버를 거치지 않습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="section border-t border-white/5">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="card p-7">
              <span className="eyebrow">Consent</span>
              <h2 className="mt-3 text-lg font-bold">사전 동의 절차</h2>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                회의를 기록·처리하기에 앞서, 회의 참석자 전원의 사전 고지 및
                동의 절차가 반드시 필요합니다. 고객사는 캐피시AI 사용
                전 참석자 전원에게 사용 목적과 범위를 안내해야 합니다.
              </p>
            </div>

            <div className="card p-7">
              <span className="eyebrow">Legal Notice</span>
              <h2 className="mt-3 text-lg font-bold">법적 증거능력 관련 고지</h2>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                캐피시AI는 법적 증거로서의 효력을 보장하지 않으며,
                회의 중 오간 내용을 바탕으로 객관적인 기록을 남기는
                도구입니다.
              </p>
            </div>

            <div className="card p-7">
              <span className="eyebrow">No Judgement</span>
              <h2 className="mt-3 text-lg font-bold">판단하지 않는 원칙</h2>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                캐피시AI는 회의 내용의 옳고 그름을 판단하지 않습니다.
                정리하는 범위는 사실관계 확인까지이며, 결론과 판단은 회의
                참석자들의 몫으로 남겨둡니다.
              </p>
            </div>

            <div className="card p-7">
              <span className="eyebrow">Data Routing</span>
              <h2 className="mt-3 text-lg font-bold">직접 라우팅 구조</h2>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                수집된 음성은 고객사가 이미 계약한 LLM 계정(MS Copilot,
                Claude Enterprise 등)으로 직접 전달됩니다. 자세한 데이터
                흐름은 작동 원리 페이지를 참고해 주세요.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
