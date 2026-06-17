'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface DiagnosticResult {
  timestamp: string
  manufacturer: string
  model: string
  serial: string
  cpu: string
  ram: string
  storage: string
  vga: string
  resolution: string
  battery_health_pct: number
  battery_cycle_count: number
  disk_health: string
  disk_bad_sector: boolean
}

interface FormFields {
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
  notes: string
  adapter: boolean | undefined
  disassembled: boolean | undefined
}

interface Props {
  action: (formData: FormData) => Promise<void>
  orderId: number
  qrString: string
  inspectorName: string
  initialValues: FormFields
}

const SPEC_FIELDS: Array<{
  label: string
  name: keyof Pick<FormFields, 'manufacturer' | 'model' | 'cpu' | 'ram' | 'storage' | 'vga' | 'screenSize' | 'resolution' | 'lcdCondition'>
  list?: string[]
  placeholder?: string
}> = [
  { label: '제조사', name: 'manufacturer', list: ['Samsung','LG','Lenovo','HP','Dell','ASUS','Apple'], placeholder: 'Samsung' },
  { label: '모델명', name: 'model', placeholder: 'Galaxy Book3 Pro' },
  { label: 'CPU', name: 'cpu', placeholder: 'i7-1355U' },
  { label: 'RAM', name: 'ram', list: ['4GB DDR4','8GB DDR4','16GB DDR4','32GB DDR4'], placeholder: '16GB DDR4' },
  { label: '저장장치', name: 'storage', list: ['256GB SSD','512GB NVMe','1TB NVMe'], placeholder: '512GB NVMe' },
  { label: 'VGA', name: 'vga', placeholder: 'Intel Iris Xe' },
  { label: '해상도(inch)', name: 'screenSize', list: ['13.3"','14"','15.6"','17.3"'], placeholder: '15.6"' },
  { label: '해상도', name: 'resolution', list: ['1920x1080','2560x1440','3840x2160'], placeholder: '1920x1080' },
  { label: '액정', name: 'lcdCondition', list: ['정상','잔상있음','사점1개','불량'], placeholder: '정상' },
]

export default function InspectForm({ action, orderId, qrString, inspectorName, initialValues }: Props) {
  const [fields, setFields] = useState<FormFields>(initialValues)
  const [pendingDiag, setPendingDiag] = useState<DiagnosticResult | null>(null)
  const [applyDone, setApplyDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function setField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as DiagnosticResult
        setPendingDiag(data)
        setApplyDone(false)
      } catch {
        alert('JSON 파일 형식이 올바르지 않습니다.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function applyDiagnostic() {
    if (!pendingDiag) return
    const d = pendingDiag

    const warnings: string[] = []
    if (d.disk_health !== '정상') {
      warnings.push(`[자동] 디스크 헬스 이상 감지 — S.M.A.R.T 경고`)
    }
    if (d.disk_bad_sector) {
      warnings.push(`[자동] 배드섹터 감지됨`)
    }

    const existingNotes = fields.notes.trim()
    const newNotes = warnings.length > 0
      ? (existingNotes ? existingNotes + '\n' + warnings.join('\n') : warnings.join('\n'))
      : existingNotes

    setFields(prev => ({
      ...prev,
      manufacturer: d.manufacturer,
      model: d.model,
      cpu: d.cpu,
      ram: d.ram,
      storage: d.storage,
      vga: d.vga,
      resolution: d.resolution,
      batteryLossPct: +(100 - d.battery_health_pct).toFixed(1),
      notes: newNotes,
    }))

    setPendingDiag(null)
    setApplyDone(true)
  }

  const formattedTimestamp = pendingDiag?.timestamp.replace('T', ' ').slice(0, 19) ?? ''

  return (
    <>
      {/* 확인 모달 */}
      {pendingDiag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="bg-slate-800 text-white px-5 py-3">
              <h2 className="font-bold text-sm">진단 결과 적용 확인</h2>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-500">이 진단 결과를 적용하시겠습니까?</p>
              <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-xs font-mono">
                <Row label="제조사" value={pendingDiag.manufacturer} />
                <Row label="모델명" value={pendingDiag.model} />
                <Row label="시리얼" value={pendingDiag.serial} />
                <Row label="진단시각" value={formattedTimestamp} />
                <div className="border-t border-slate-200 pt-2 space-y-1.5">
                  <Row label="로그인" value={inspectorName} highlight />
                  <Row label="슬롯" value={qrString} highlight />
                </div>
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 rounded p-2 border border-amber-200">
                지금 검수 중인 제품과 일치하는지 확인해주세요.
              </p>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button
                type="button"
                onClick={() => setPendingDiag(null)}
                className="flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={applyDiagnostic}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700"
              >
                확인하고 적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 자동 불러오기 영역 */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            자동 불러오기
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="text-xs text-slate-400">
            USB의 <code className="bg-slate-100 px-1 rounded">inspection_results/</code> 폴더에서 JSON 파일 선택
          </span>
          <span className="text-xs text-amber-600 font-medium ml-auto shrink-0">
            ⚠ 본인 명의 USB만 사용해주세요
          </span>
        </div>
        {applyDone && (
          <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-1.5">
            자동 적용 완료. 항목 확인 후 필요시 수정하고 저장해주세요. USB의 해당 JSON 파일은 사용 후 삭제해주세요.
          </div>
        )}
      </div>

      <form action={action}>
        <div className="bg-white rounded-xl border-2 border-slate-300 overflow-hidden mb-5" style={{ fontFamily: 'monospace' }}>
          <div className="bg-slate-800 text-white px-4 py-2 text-xs font-bold flex justify-between">
            <span>월드와이드메모리(주) 매입검수 라벨</span>
            <span>{qrString}</span>
          </div>

          <div className="flex gap-0">
            {/* 좌측: 스펙 필드 */}
            <div className="w-1/2 border-r border-slate-200 p-4 space-y-2.5">
              {SPEC_FIELDS.map(f => (
                <div key={f.name} className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500 w-20 flex-shrink-0">{f.label}</label>
                  <input
                    type="text"
                    name={f.name}
                    value={fields[f.name] as string}
                    onChange={e => setField(f.name, e.target.value)}
                    list={f.list ? `list-${f.name}` : undefined}
                    placeholder={f.placeholder}
                    className="flex-1 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                  />
                  {f.list && (
                    <datalist id={`list-${f.name}`}>
                      {f.list.map(v => <option key={v} value={v} />)}
                    </datalist>
                  )}
                </div>
              ))}

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 w-20 flex-shrink-0">키보드/터치</label>
                <select
                  name="keyboardTouch"
                  value={fields.keyboardTouch}
                  onChange={e => setField('keyboardTouch', e.target.value)}
                  className="flex-1 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                >
                  <option value="">—</option>
                  {['정상', '불량', '없음'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 w-20 flex-shrink-0">배터리손실%</label>
                <input
                  type="number"
                  name="batteryLossPct"
                  step="0.1" min="0" max="100"
                  value={fields.batteryLossPct}
                  onChange={e => setField('batteryLossPct', parseFloat(e.target.value) || 0)}
                  className="w-20 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                />
                <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    name="battery45Checked"
                    checked={fields.battery45Checked}
                    onChange={e => setField('battery45Checked', e.target.checked)}
                    className="rounded"
                  />
                  45%방전확인
                </label>
              </div>
            </div>

            {/* 우측: 특이사항 + 아답터/바라시 */}
            <div className="w-1/2 p-4 flex flex-col gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 block mb-1.5">특이사항 / 불량내역</label>
                <textarea
                  name="notes"
                  rows={6}
                  value={fields.notes}
                  onChange={e => setField('notes', e.target.value)}
                  placeholder="특이사항, 불량 내용 자유 작성..."
                  className="w-full border border-slate-200 rounded px-3 py-2 text-xs resize-none focus:outline-none focus:border-blue-400 h-full"
                />
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-3">
                <OXField
                  label="아답터" name="adapter"
                  value={fields.adapter}
                  onChange={v => setField('adapter', v)}
                />
                <OXField
                  label="바라시" name="disassembled"
                  value={fields.disassembled}
                  onChange={v => setField('disassembled', v)}
                />

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 w-16">검수자</span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded">{inspectorName}</span>
                </div>

                <div className="p-2 rounded bg-violet-50 border border-violet-200">
                  <p className="text-xs text-violet-600 font-medium">
                    판정·등급·매입가는 최종검수자가 Stamping 단계에서 입력합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg text-sm">
            1차 저장
          </button>
          <Link href={`/orders/${orderId}`} className="border border-slate-300 text-slate-600 px-6 py-3 rounded-lg text-sm hover:bg-slate-50">
            취소
          </Link>
        </div>
      </form>
    </>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-400 w-16 shrink-0">{label}</span>
      <span className={`font-bold ${highlight ? 'text-blue-700' : 'text-slate-800'}`}>{value}</span>
    </div>
  )
}

function OXField({
  label, name, value, onChange,
}: {
  label: string
  name: string
  value: boolean | undefined
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-slate-500 w-16">{label}</span>
      <div className="flex gap-2">
        <label className="cursor-pointer">
          <input
            type="radio" name={name} value="O"
            checked={value === true}
            onChange={() => onChange(true)}
            className="peer sr-only"
          />
          <span className="px-3 py-1 rounded text-xs font-bold border bg-white text-slate-400 border-slate-200 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition-colors">
            O
          </span>
        </label>
        <label className="cursor-pointer">
          <input
            type="radio" name={name} value="X"
            checked={value === false}
            onChange={() => onChange(false)}
            className="peer sr-only"
          />
          <span className="px-3 py-1 rounded text-xs font-bold border bg-white text-slate-400 border-slate-200 peer-checked:bg-red-500 peer-checked:text-white peer-checked:border-red-500 transition-colors">
            X
          </span>
        </label>
      </div>
    </div>
  )
}
