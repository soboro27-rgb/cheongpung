const LEGEND = [
  { label: "오디오 신호", color: "#7cffb2", style: "solid" },
  { label: "제어 / GPIO", color: "#5c7285", style: "dashed" },
  { label: "전원", color: "#f2a154", style: "dotted" },
  { label: "RF / 무선 링크", color: "#8fa6bb", style: "dashed" },
] as const;

export default function InternalBlockDiagram() {
  return (
    <div className="card overflow-hidden p-2">
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 1560 820"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="AI 보이스 캣피쉬 스피커 내부 전자 부품 블록 다이어그램"
          className="h-auto min-w-[900px] w-full"
        >
          <defs>
            <marker id="arrowAccent" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" fill="#7cffb2" />
            </marker>
            <marker id="arrowMuted" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" fill="#5c7285" />
            </marker>
            <marker id="arrowRf" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" fill="#8fa6bb" />
            </marker>
          </defs>

          {/* puck boundary */}
          <rect x="14" y="52" width="1034" height="608" rx="36" fill="none" stroke="#3a4854" strokeWidth="1.5" strokeDasharray="3 6" />
          <text x="40" y="78" fontFamily="ui-monospace, Consolas, monospace" fontSize="12" fontWeight="700" letterSpacing="0.08em" fill="#8894a0">PUCK 내부 · Ø58 × H32mm</text>
          <text x="1110" y="78" fontFamily="ui-monospace, Consolas, monospace" fontSize="12" fontWeight="700" letterSpacing="0.08em" fill="#8894a0">하드웨어 범위 밖 (고객 소유)</text>

          {/* MIC cluster */}
          <circle cx="110" cy="160" r="66" fill="none" stroke="#5c7285" strokeWidth="1.2" opacity="0.5" />
          <circle cx="110" cy="160" r="6" fill="#7cffb2" />
          <g fill="#7cffb2">
            <circle cx="110" cy="100" r="6" />
            <circle cx="160" cy="130" r="6" />
            <circle cx="160" cy="190" r="6" />
            <circle cx="110" cy="220" r="6" />
            <circle cx="60" cy="190" r="6" />
            <circle cx="60" cy="130" r="6" />
          </g>
          <text x="110" y="256" textAnchor="middle" fontFamily="ui-monospace, Consolas, monospace" fontSize="12" fontWeight="700" fill="#eef1f3">MIC1–MIC6</text>
          <text x="110" y="272" textAnchor="middle" fontSize="11" fill="#8894a0">PDM 마이크 어레이 (360°)</text>

          {/* U2 */}
          <rect x="230" y="130" width="200" height="64" rx="10" fill="#1a232c" stroke="#3a4854" strokeWidth="1.3" />
          <text x="250" y="156" fontFamily="ui-monospace, Consolas, monospace" fontSize="12" fontWeight="700" fill="#7cffb2">U2</text>
          <text x="250" y="176" fontSize="12.5" fontWeight="600" fill="#eef1f3">원거리 음성 전처리</text>

          {/* U1 hub */}
          <rect x="560" y="250" width="220" height="100" rx="12" fill="#212e3a" stroke="#7cffb2" strokeWidth="1.4" />
          <text x="580" y="282" fontFamily="ui-monospace, Consolas, monospace" fontSize="13" fontWeight="700" fill="#7cffb2">U1</text>
          <text x="580" y="304" fontSize="13.5" fontWeight="700" fill="#eef1f3">BT/BLE 오디오 SoC</text>
          <text x="580" y="323" fontSize="11" fill="#8894a0">페어링 · 스트리밍 · 상태 제어 허브</text>

          {/* SW1 */}
          <rect x="610" y="90" width="120" height="54" rx="10" fill="#1a232c" stroke="#3a4854" strokeWidth="1.3" />
          <text x="626" y="112" fontFamily="ui-monospace, Consolas, monospace" fontSize="12" fontWeight="700" fill="#7cffb2">SW1</text>
          <text x="626" y="130" fontSize="12" fontWeight="600" fill="#eef1f3">터치 버튼</text>

          {/* ANT1 */}
          <path d="M800,262 C812,246 800,236 816,220" fill="none" stroke="#8fa6bb" strokeWidth="1.6" />
          <text x="820" y="222" fontFamily="ui-monospace, Consolas, monospace" fontSize="11" fontWeight="700" fill="#8fa6bb">ANT1</text>

          {/* LED group */}
          <rect x="830" y="260" width="190" height="100" rx="10" fill="#1a232c" stroke="#3a4854" strokeWidth="1.3" />
          <text x="850" y="288" fontFamily="ui-monospace, Consolas, monospace" fontSize="12" fontWeight="700" fill="#7cffb2">LED1–3</text>
          <text x="850" y="308" fontSize="12.5" fontWeight="600" fill="#eef1f3">상태 표시 라이트파이프 링</text>
          <text x="850" y="326" fontSize="11" fill="#8894a0">대기 / 듣는중 / 응답중</text>

          {/* SPK1 */}
          <rect x="590" y="430" width="160" height="64" rx="10" fill="#1a232c" stroke="#3a4854" strokeWidth="1.3" />
          <text x="608" y="456" fontFamily="ui-monospace, Consolas, monospace" fontSize="12" fontWeight="700" fill="#7cffb2">SPK1</text>
          <text x="608" y="476" fontSize="12.5" fontWeight="600" fill="#eef1f3">모노 스피커</text>

          {/* U3 */}
          <rect x="230" y="430" width="200" height="64" rx="10" fill="#1a232c" stroke="#3a4854" strokeWidth="1.3" />
          <text x="250" y="456" fontFamily="ui-monospace, Consolas, monospace" fontSize="12" fontWeight="700" fill="#f2a154">U3</text>
          <text x="250" y="476" fontSize="12.5" fontWeight="600" fill="#eef1f3">PMIC / 충전 IC</text>

          {/* J1 */}
          <rect x="40" y="430" width="140" height="54" rx="10" fill="#1a232c" stroke="#3a4854" strokeWidth="1.3" />
          <text x="56" y="452" fontFamily="ui-monospace, Consolas, monospace" fontSize="12" fontWeight="700" fill="#f2a154">J1</text>
          <text x="56" y="470" fontSize="12" fontWeight="600" fill="#eef1f3">USB-C (전원)</text>

          {/* BT1 */}
          <rect x="230" y="560" width="200" height="64" rx="10" fill="#1a232c" stroke="#3a4854" strokeWidth="1.3" />
          <text x="250" y="586" fontFamily="ui-monospace, Consolas, monospace" fontSize="12" fontWeight="700" fill="#f2a154">BT1</text>
          <text x="250" y="606" fontSize="12.5" fontWeight="600" fill="#eef1f3">Li-Po 배터리 (~320mAh)</text>

          {/* external: Host & LLM */}
          <rect x="1140" y="270" width="280" height="92" rx="10" fill="#141b21" stroke="#3a4854" strokeWidth="1.3" strokeDasharray="2 3" />
          <text x="1160" y="298" fontSize="12.5" fontWeight="700" fill="#eef1f3">고객사 노트북 / 회의실 PC</text>
          <text x="1160" y="317" fontSize="11" fill="#8894a0">BT HFP 페어링 · 컴패니언 클라이언트</text>
          <text x="1160" y="335" fontSize="11" fill="#8894a0">고객 소유 자산</text>

          <rect x="1140" y="440" width="280" height="110" rx="10" fill="#141b21" stroke="#3a4854" strokeWidth="1.3" strokeDasharray="2 3" />
          <text x="1160" y="468" fontSize="12.5" fontWeight="700" fill="#eef1f3">고객사 LLM 계정</text>
          <text x="1160" y="487" fontSize="11" fill="#8894a0">MS Copilot / Claude Enterprise /</text>
          <text x="1160" y="503" fontSize="11" fill="#8894a0">Gemini Workspace</text>
          <text x="1160" y="527" fontSize="10.5" fill="#f2a154">당사 서버 미경유</text>

          {/* connections */}
          <line x1="180" y1="160" x2="226" y2="160" stroke="#7cffb2" strokeWidth="1.6" markerEnd="url(#arrowAccent)" />
          <text x="186" y="150" fontSize="10.5" fill="#8894a0">PDM ×6</text>

          <path d="M430,162 L470,162 L470,300 L556,300" fill="none" stroke="#7cffb2" strokeWidth="1.6" markerEnd="url(#arrowAccent)" />
          <text x="478" y="235" fontSize="10.5" fill="#8894a0">I2S</text>

          <line x1="670" y1="144" x2="670" y2="246" stroke="#5c7285" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#arrowMuted)" />
          <text x="680" y="200" fontSize="10.5" fill="#8894a0">GPIO IRQ</text>

          <line x1="784" y1="310" x2="826" y2="310" stroke="#5c7285" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#arrowMuted)" />
          <text x="788" y="300" fontSize="10.5" fill="#8894a0">SPI/PWM</text>

          <line x1="670" y1="354" x2="670" y2="426" stroke="#7cffb2" strokeWidth="1.6" markerEnd="url(#arrowAccent)" />
          <text x="680" y="392" fontSize="10.5" fill="#8894a0">I2S out</text>

          <line x1="184" y1="457" x2="226" y2="462" stroke="#f2a154" strokeWidth="1.6" strokeDasharray="1 4" strokeLinecap="round" markerEnd="url(#arrowMuted)" />
          <text x="188" y="447" fontSize="10.5" fill="#8894a0">5V IN</text>

          <line x1="310" y1="426" x2="310" y2="198" stroke="#f2a154" strokeWidth="1.6" strokeDasharray="1 4" strokeLinecap="round" markerEnd="url(#arrowMuted)" />
          <text x="318" y="320" fontSize="10.5" fill="#8894a0">3.3V</text>

          <path d="M420,430 L420,392 L590,392 L590,354" fill="none" stroke="#f2a154" strokeWidth="1.6" strokeDasharray="1 4" strokeLinecap="round" markerEnd="url(#arrowMuted)" />
          <text x="430" y="382" fontSize="10.5" fill="#8894a0">3.3V / 1.8V (LED·SPK 포함, 배선 간략화)</text>

          <line x1="330" y1="560" x2="330" y2="498" stroke="#f2a154" strokeWidth="1.6" strokeDasharray="1 4" strokeLinecap="round" markerEnd="url(#arrowMuted)" />
          <text x="338" y="535" fontSize="10.5" fill="#8894a0">VBAT 3.7V</text>

          <line x1="784" y1="285" x2="1136" y2="300" stroke="#8fa6bb" strokeWidth="1.6" strokeDasharray="1 3 6 3" markerEnd="url(#arrowRf)" />
          <text x="900" y="272" fontSize="11" fontWeight="600" fill="#8fa6bb">BT HFP / BLE (무선)</text>

          <line x1="1280" y1="362" x2="1280" y2="436" stroke="#c7ced4" strokeWidth="1.6" markerEnd="url(#arrowMuted)" />
          <text x="1290" y="404" fontSize="10.5" fill="#8894a0">API 호출</text>
        </svg>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 px-4 py-4">
        {LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-2 text-xs text-text-muted">
            <span
              className="inline-block h-0 w-5 border-t-2"
              style={{
                borderColor: item.color,
                borderTopStyle: item.style === "solid" ? "solid" : item.style,
              }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
