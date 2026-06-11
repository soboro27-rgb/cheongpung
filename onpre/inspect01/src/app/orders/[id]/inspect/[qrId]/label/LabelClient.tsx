'use client'
import Link from 'next/link'

type LabelData = {
  qrString: string
  seq: number
  companyName: string
  arrivalDate: string
  manufacturer: string
  model: string
  cpu: string
  ram: string
  storage: string
  vga: string
  screenSize: string
  resolution: string
  lcdCondition: string
  keyboardTouch: string
  batteryLossPct: number
  battery45Checked: boolean
  adapter: boolean
  disassembled: boolean
  notes: string
  defectStatus: string
  grade: string
  purchasePrice: number
  inspectorName: string
  qrImageUrl: string
  backUrl: string
}

export default function LabelClient({ data }: { data: LabelData }) {
  const specRows = [
    ['제조사', data.manufacturer],
    ['모델명', data.model],
    ['CPU', data.cpu],
    ['RAM', data.ram],
    ['저장장치', data.storage],
    ['VGA', data.vga],
    ['크기', data.screenSize],
    ['해상도', data.resolution],
    ['액정', data.lcdCondition],
    ['키보드/터치', data.keyboardTouch],
    [`배터리손실`, `${data.batteryLossPct}%${data.battery45Checked ? ' (45%확인)' : ''}`],
    ['아답터', data.adapter ? 'O' : 'X'],
    ['바라시', data.disassembled ? 'O' : 'X'],
  ]

  return (
    <>
      {/* 화면 UI */}
      <div className="no-print min-h-screen p-6" style={{ background: '#F1F5F9' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link href={data.backUrl} style={{ color: '#64748B', fontSize: '13px', textDecoration: 'none' }}>
                ← 목록으로
              </Link>
              <span style={{ fontWeight: 900, color: '#0F172A' }}>라벨 출력 미리보기</span>
            </div>
            <button
              onClick={() => window.print()}
              style={{
                background: '#2563EB', color: '#fff', fontWeight: 700,
                padding: '8px 24px', borderRadius: '8px', border: 'none',
                cursor: 'pointer', fontSize: '14px',
              }}
            >
              🖨️ 인쇄
            </button>
          </div>
          <p style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', marginBottom: '12px' }}>
            인쇄 설정: 95×90mm 라벨 용지 / 여백 없음 / 머리글·바닥글 없음
          </p>
          <div style={{ background: '#fff', border: '2px dashed #CBD5E1', padding: '16px', borderRadius: '8px', display: 'inline-block' }}>
            <LabelSticker specRows={specRows} data={data} />
          </div>
        </div>
      </div>

      {/* 인쇄 전용 영역 */}
      <div className="print-label">
        <LabelSticker specRows={specRows} data={data} />
      </div>
    </>
  )
}

function LabelSticker({ specRows, data }: { specRows: string[][]; data: LabelData }) {
  return (
    <div style={{
      width: '95mm',
      height: '90mm',
      fontFamily: "'Malgun Gothic', sans-serif",
      fontSize: '7pt',
      border: '1px solid #334155',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      {/* 헤더 */}
      <div style={{
        background: '#1E293B', color: '#fff',
        padding: '2.5px 6px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: 900, fontSize: '9.5pt', letterSpacing: '-0.3px' }}>월드와이드메모리(주)</span>
        <span style={{ fontSize: '7.5pt', opacity: 0.7 }}>매입검수 라벨 No.{String(data.seq).padStart(3, '0')}</span>
      </div>

      {/* 바디 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* 좌: 스펙 (54%) */}
        <div style={{ width: '54%', borderRight: '1px solid #CBD5E1', padding: '3px 5px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {specRows.map(([label, val]) => (
                <tr key={label}>
                  <td style={{
                    padding: '1px 4px 1px 0',
                    color: '#64748B', fontWeight: 700,
                    width: '38%', fontSize: '7pt', whiteSpace: 'nowrap',
                  }}>{label}</td>
                  <td style={{ padding: '1px 0', fontWeight: 600, fontSize: '7.5pt', wordBreak: 'break-all' }}>{val || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 우: QR + 평가 + 메타 (46%) */}
        <div style={{ width: '46%', padding: '3px 5px', display: 'flex', flexDirection: 'column', gap: '3px' }}>

          {/* QR + 특이사항 */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.qrImageUrl} alt="QR" style={{ width: '52px', height: '52px', display: 'block' }} />
            </div>
            <div style={{
              flex: 1, fontSize: '6.5pt', color: '#1E293B',
              background: '#F8FAFC', border: '1px solid #E2E8F0',
              borderRadius: '3px', padding: '3px', lineHeight: 1.5,
              minHeight: '52px', wordBreak: 'break-all',
            }}>
              <div style={{ color: '#64748B', fontWeight: 700, fontSize: '6pt', marginBottom: '2px' }}>특이사항</div>
              {data.notes || '없음'}
            </div>
          </div>

          {/* 판정 + 등급 + 매입가 */}
          <div style={{ border: '1.5px solid #1E293B', borderRadius: '3px', padding: '3px 4px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px' }}>
              <div>
                <div style={{ color: '#64748B', fontSize: '6.5pt', fontWeight: 700 }}>판정</div>
                <div style={{
                  fontWeight: 900, fontSize: '10.5pt',
                  color: data.defectStatus === 'GOOD' ? '#16A34A' : '#DC2626',
                  lineHeight: 1,
                }}>
                  {data.defectStatus === 'GOOD' ? '양품' : '불량'}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '6px' }}>
                <div style={{ color: '#64748B', fontSize: '6.5pt', fontWeight: 700 }}>등급</div>
                <div style={{ fontWeight: 900, fontSize: '18pt', color: '#1E40AF', lineHeight: 1 }}>
                  {data.grade || '—'}
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '2px' }}>
              <span style={{ color: '#64748B', fontSize: '6.5pt', fontWeight: 700 }}>매입가 </span>
              <span style={{ fontWeight: 700, fontSize: '8.5pt' }}>
                {data.purchasePrice ? data.purchasePrice.toLocaleString() + '원' : '—'}
              </span>
            </div>
          </div>

          {/* 하단 메타 */}
          <div style={{ fontSize: '6.5pt', color: '#94A3B8', lineHeight: 1.5, marginTop: 'auto' }}>
            <div>매입처: {data.companyName}</div>
            <div>입고일: {data.arrivalDate || '—'}</div>
            <div>검수자: {data.inspectorName || '—'}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '6pt', wordBreak: 'break-all', color: '#CBD5E1' }}>
              {data.qrString}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
