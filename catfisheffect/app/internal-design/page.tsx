import type { Metadata } from "next";
import InternalBlockDiagram from "@/components/InternalBlockDiagram";

export const metadata: Metadata = {
  title: "내부 설계",
  description:
    "AI 보이스 캣피쉬 스피커의 내부 전자 부품 블록 다이어그램, 부품 인덱스, 예시 BOM, 전력 예산. 개념설계 단계 자료입니다.",
};

const COMPONENTS = [
  { ref: "U1", name: "BT/BLE 오디오 SoC", desc: "기기의 두뇌. 페어링, 오디오 스트리밍(HFP), 저전력 대기, 나머지 부품 제어를 총괄하는 허브." },
  { ref: "U2", name: "원거리 음성 전처리 프로세서", desc: "6채널 마이크 입력의 빔포밍, 에코 제거(AEC), 노이즈 억제를 수행해 U1에 정제된 음성만 전달." },
  { ref: "MIC1–6", name: "PDM MEMS 마이크 ×6", desc: "원형 배열로 360도 픽업. 회의실 어느 좌석에서 발언해도 균일하게 포착." },
  { ref: "SPK1", name: "모노 마이크로스피커", desc: "상태음·간단한 음성 피드백 출력용. U1 내장 Class-D 앰프로 직접 구동." },
  { ref: "LED1–3", name: "상태 표시 라이트파이프 링", desc: "대기(스모크블루) · 듣는중(라임민트 점멸) · 응답중(라임민트 고정) 3단계 상태를 시각화." },
  { ref: "SW1", name: "원터치 호출 버튼", desc: "정전용량 터치 센서 + 실리콘 오버레이. 누르는 순간 U1을 깨우고 회의 호출을 트리거." },
  { ref: "U3", name: "PMIC / 충전 IC", desc: "USB-C 입력을 받아 배터리를 충전하고, 각 부품에 필요한 전압 레일을 분배." },
  { ref: "BT1", name: "Li-Po 배터리 팩", desc: "약 320mAh. 퍽 하우징 하단 공간에 맞춘 파우치형 셀." },
  { ref: "J1", name: "USB-C 리셉터클", desc: "전원 전용 포트. 데이터 핀은 사용하지 않아 인증서/펌웨어 노출 표면을 최소화." },
  { ref: "ANT1", name: "BT 안테나", desc: "PCB 트레이스 또는 칩안테나. 하우징 상단 비금속 영역과 배치 조율 필요." },
];

const BOM = [
  { ref: "U1", name: "BT/BLE 오디오 SoC", part: "Qualcomm QCC304x급", iface: "BT Classic(HFP)+BLE, I2S, GPIO", role: "페어링 · 오디오 스트리밍 · 상태 제어 허브" },
  { ref: "U2", name: "원거리 음성 전처리 프로세서", part: "XMOS XVF3800급", iface: "I2S/TDM, I2C", role: "빔포밍 · 에코 제거(AEC) · 노이즈 억제" },
  { ref: "MIC1–6", name: "PDM MEMS 마이크 6ea", part: "Infineon IM69D130급", iface: "PDM", role: "360도 원형 어레이 픽업" },
  { ref: "SPK1", name: "모노 마이크로스피커 8mm", part: "8mm 다이나믹 드라이버", iface: "I2S (SoC 내장 앰프 구동)", role: "상태음 · 간단 음성 피드백" },
  { ref: "LED1–3", name: "상태 표시 LED (라이트파이프)", part: "저전력 3색 LED", iface: "GPIO/PWM", role: "대기 / 듣는중 / 응답중 시각화" },
  { ref: "SW1", name: "원터치 호출 버튼", part: "정전용량 터치 IC + 실리콘 오버레이", iface: "GPIO(IRQ)", role: "회의 호출 트리거 · 웨이크업" },
  { ref: "U3", name: "PMIC / 충전 IC", part: "단일셀 Li-ion 충전+벅레귤레이터 (TI BQ2518x급)", iface: "I2C(옵션), 전원 레일", role: "배터리 충전 · 전원 분배" },
  { ref: "BT1", name: "배터리 팩", part: "Li-Po 3.7V ~320mAh", iface: "2핀 커넥터", role: "무선 구동 전원" },
  { ref: "J1", name: "USB-C 리셉터클", part: "전원 전용 (데이터 핀 미사용)", iface: "VBUS/GND + CC저항", role: "충전 입력" },
  { ref: "ANT1", name: "BT 안테나", part: "PCB 트레이스 또는 칩안테나", iface: "RF", role: "무선 링크" },
];

const POWER_STATS = [
  { label: "활성 청취/스트리밍 전류", value: "90–120", unit: "mA" },
  { label: "대기(딥슬립) 전류", value: "<1", unit: "mA" },
  { label: "배터리 용량", value: "320", unit: "mAh" },
  { label: "예상 연속 사용", value: "2.5–3.5", unit: "hr" },
  { label: "예상 대기 지속", value: "2–3", unit: "주", note: "일 1회 · 1시간 회의 가정" },
];

export default function InternalDesignPage() {
  return (
    <>
      <section className="section">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <span className="eyebrow">Internal Design · Concept Block Diagram</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            내부 전자 설계
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted">
            Ø58 × H32mm 퍽 하우징 안에 들어가는 전자 구성 요소와 신호·전원
            흐름을 정리한 개념 블록 다이어그램입니다. 마이크 어레이, BT/BLE
            SoC, 스피커, 배터리, LED 상태링, USB-C를 조립해 넣는다는 가정으로
            구성했습니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {["Ø58 × H32mm", "~85g", "BT Classic HFP + BLE", "MEMS 마이크 ×6", "LED 상태링 ×3색", "USB-C 전원 전용"].map(
              (chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-smoke-blue-light/40 px-3 py-1.5 font-mono text-xs text-text-muted"
                >
                  {chip}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* Architecture assumption */}
      <section className="border-t border-white/5 pb-4 pt-8">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <div className="rounded-lg border border-smoke-blue-light/25 border-l-4 border-l-lime-mint/60 bg-smoke-blue-dark/50 p-5 text-sm leading-relaxed text-text-muted">
            <b className="text-text-primary">범위에 대한 전제</b> — 퍽
            하드웨어는 음성 입출력과 BT HFP/BLE 통신까지만 담당합니다. 실제
            LLM API 호출은 페어링된 고객사 PC/노트북의 컴패니언 클라이언트에서
            수행되며, 이 구간은 하드웨어 범위 밖입니다. 이 구성은 &ldquo;당사는
            회의 콘텐츠에 접근하지 않는다&rdquo;는 원칙과 일치합니다 — 기기가
            클라우드에 직접 연결되지 않고, 고객이 소유한 PC를 통해서만 고객의
            LLM 계정에 도달합니다.
          </div>
        </div>
      </section>

      {/* Diagram */}
      <section className="section border-t border-white/5">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="eyebrow">01 · 전자 부품 블록 다이어그램</span>
            <span className="text-xs text-text-muted">
              참조 부호(U1, MIC1–6 등)는 아래 부품 인덱스와 대응합니다
            </span>
          </div>
          <div className="mt-6">
            <InternalBlockDiagram />
          </div>
        </div>
      </section>

      {/* Component index */}
      <section className="section border-t border-white/5 bg-smoke-blue-dark/30">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <span className="eyebrow">02 · 부품 인덱스</span>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COMPONENTS.map((c) => (
              <div key={c.ref} className="card p-6">
                <span className="font-mono text-xs font-bold text-lime-mint">
                  {c.ref}
                </span>
                <h3 className="mt-2 text-base font-bold">{c.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOM */}
      <section className="section border-t border-white/5">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="eyebrow">03 · 예시 BOM (Bill of Materials)</span>
            <span className="text-xs text-text-muted">
              부품명은 스펙 참고용 예시이며 최종 소싱 대상이 아닙니다
            </span>
          </div>
          <div className="card mt-8 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr>
                  {["Ref", "구성요소", "예시 부품", "인터페이스", "역할"].map((h) => (
                    <th
                      key={h}
                      className="border-b border-white/10 px-5 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-wider text-text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BOM.map((row) => (
                  <tr key={row.ref} className="border-b border-white/5 last:border-none">
                    <td className="px-5 py-3.5 align-top font-mono text-xs font-bold text-lime-mint">
                      {row.ref}
                    </td>
                    <td className="px-5 py-3.5 align-top font-semibold text-text-primary">
                      {row.name}
                    </td>
                    <td className="px-5 py-3.5 align-top font-mono text-xs text-text-muted">
                      {row.part}
                    </td>
                    <td className="px-5 py-3.5 align-top text-text-muted">
                      {row.iface}
                    </td>
                    <td className="px-5 py-3.5 align-top text-text-muted">
                      {row.role}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Power budget */}
      <section className="section border-t border-white/5 bg-smoke-blue-dark/30">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <span className="eyebrow">04 · 전력 예산 (추정)</span>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {POWER_STATS.map((s) => (
              <div key={s.label} className="card p-5">
                <p className="text-[11px] text-text-muted">{s.label}</p>
                <p className="mt-2 font-mono text-xl font-bold tabular-nums text-text-primary">
                  {s.value}
                  <span className="ml-1 text-xs font-medium text-text-muted">
                    {s.unit}
                  </span>
                </p>
                {s.note && (
                  <p className="mt-2 text-[11px] text-text-muted">{s.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Caveat */}
      <section className="section border-t border-white/5">
        <div className="mx-auto max-w-content px-5 sm:px-8">
          <div className="flex gap-3.5 rounded-xl border border-[#f2a154]/35 bg-[#f2a154]/[0.06] p-5">
            <span className="mt-0.5 shrink-0 rounded border border-[#f2a154]/50 px-1.5 py-0.5 font-mono text-xs font-bold text-[#f2a154]">
              주의
            </span>
            <div className="space-y-2 text-sm leading-relaxed text-text-muted">
              <p>
                이 다이어그램은{" "}
                <b className="text-text-primary">개념설계 단계의 블록 다이어그램</b>
                입니다. 표기된 부품은 스펙을 만족할 것으로 예상되는 예시이며,
                확정 BOM이 아닙니다.
              </p>
              <p>
                실제 부품 선정, PCB 배치, RF 인증(KC 등), 음향 튜닝, 열설계는
                하드웨어 엔지니어링 팀 또는 EMS 파트너의 검증을 거쳐야
                합니다. 전력 수치 역시 실측 프로파일링 전까지는 추정치입니다.
              </p>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-white/5 pt-6 font-mono text-[11px] text-text-muted">
            <span>Catfish Effect · Internal Design Draft v0.1</span>
            <span>검토용 — 확정 스펙 아님</span>
          </div>
        </div>
      </section>
    </>
  );
}
