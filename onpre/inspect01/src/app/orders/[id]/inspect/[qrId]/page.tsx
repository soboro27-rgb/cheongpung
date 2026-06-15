import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { saveInspection } from '@/lib/actions/inspect'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'

export default async function InspectPage({
  params,
}: {
  params: Promise<{ id: string; qrId: string }>
}) {
  const { id, qrId } = await params
  const session = await getSession()

  const qr = await prisma.qRCode.findUnique({
    where: { id: parseInt(qrId) },
    include: {
      purchaseOrder: true,
      inspection: { include: { inspector: true, stampedBy: true } },
    },
  })
  if (!qr || qr.purchaseOrderId !== parseInt(id)) notFound()

  const ins = qr.inspection
  const order = qr.purchaseOrder
  const action = saveInspection.bind(null, qr.id, order.id)

  // 다른 검수자가 이미 완료한 경우 읽기전용
  if (ins && ins.inspectorId !== Number(session?.userId)) {
    return (
      <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-5">
            <Link href={`/orders/${id}`} className="text-slate-400 hover:text-slate-600 text-sm">← 매입건</Link>
            <h1 className="text-lg font-black text-slate-900">검수 결과 (1차)</h1>
            <code className="text-xs bg-slate-200 px-2 py-0.5 rounded font-mono text-slate-600">{qr.qrString}</code>
          </div>

          <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 mb-5 flex items-center gap-3">
            <span className="text-amber-600 font-bold text-sm">🔒 이미 완료된 1차 검수입니다</span>
            <span className="text-amber-500 text-xs">
              검수자: <strong>{ins.inspector.name}</strong> · {new Date(ins.inspectedAt).toLocaleString('ko-KR')}
            </span>
          </div>

          <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden" style={{ fontFamily: 'monospace' }}>
            <div className="bg-slate-800 text-white px-4 py-2 text-xs font-bold flex justify-between">
              <span>월드와이드메모리(주) 매입검수 라벨</span>
              <span>{qr.qrString}</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
              {[
                ['제조사', ins.manufacturer], ['모델명', ins.model], ['CPU', ins.cpu],
                ['RAM', ins.ram], ['저장장치', ins.storage], ['VGA', ins.vga],
                ['화면크기', ins.screenSize], ['해상도', ins.resolution], ['액정', ins.lcdCondition],
                ['키보드/터치', ins.keyboardTouch], ['배터리손실%', String(ins.batteryLossPct)],
                ['45%방전확인', ins.battery45Checked ? '확인' : '미확인'],
                ['아답터', ins.adapter ? 'O' : 'X'], ['바라시', ins.disassembled ? 'O' : 'X'],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <span className="text-slate-400 font-bold w-24 flex-shrink-0">{label}</span>
                  <span className="text-slate-800">{value || '—'}</span>
                </div>
              ))}
              {ins.notes && (
                <div className="col-span-2 flex gap-2 mt-1 border-t border-slate-100 pt-2">
                  <span className="text-slate-400 font-bold w-24 flex-shrink-0">특이사항</span>
                  <span className="text-slate-800 whitespace-pre-wrap">{ins.notes}</span>
                </div>
              )}
            </div>
            {ins.isStamped && (
              <div className="border-t border-slate-200 p-4 bg-violet-50">
                <div className="text-xs font-bold text-violet-600 mb-2">2차 검수 (스탬핑) 완료</div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="flex gap-2">
                    <span className="text-slate-400 font-bold w-12 flex-shrink-0">판정</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${ins.defectStatus === 'GOOD' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {ins.defectStatus === 'GOOD' ? '양품' : '불량'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-400 font-bold w-8 flex-shrink-0">등급</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-black">{ins.grade || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-400 font-bold w-12 flex-shrink-0">매입가</span>
                    <span className="text-slate-800 font-bold">{ins.purchasePrice.toLocaleString()}원</span>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  스탬퍼: <strong className="text-slate-600">{ins.stampedBy?.name}</strong> · {ins.stampedAt ? new Date(ins.stampedAt).toLocaleString('ko-KR') : ''}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  const specFields: { label: string; name: string; list?: string[]; placeholder?: string }[] = [
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

  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-5">
          <Link href={`/orders/${id}`} className="text-slate-400 hover:text-slate-600 text-sm">← 매입건</Link>
          <h1 className="text-lg font-black text-slate-900">1차 검수 입력</h1>
          <code className="text-xs bg-slate-200 px-2 py-0.5 rounded font-mono text-slate-600">{qr.qrString}</code>
        </div>

        <form action={action}>
          {/* 라벨 스티커 레이아웃 */}
          <div className="bg-white rounded-xl border-2 border-slate-300 overflow-hidden mb-5" style={{ fontFamily: 'monospace' }}>
            <div className="bg-slate-800 text-white px-4 py-2 text-xs font-bold flex justify-between">
              <span>월드와이드메모리(주) 매입검수 라벨</span>
              <span>{qr.qrString}</span>
            </div>

            <div className="flex gap-0">
              {/* 좌측: 스펙 필드 */}
              <div className="w-1/2 border-r border-slate-200 p-4 space-y-2.5">
                {specFields.map(f => (
                  <div key={f.name} className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 w-20 flex-shrink-0">{f.label}</label>
                    <input
                      type="text" name={f.name}
                      defaultValue={ins ? (ins as Record<string, unknown>)[f.name] as string : ''}
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

                {/* 키보드터치 */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500 w-20 flex-shrink-0">키보드/터치</label>
                  <select name="keyboardTouch" defaultValue={ins?.keyboardTouch || ''}
                    className="flex-1 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400">
                    <option value="">—</option>
                    {['정상','불량','없음'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                {/* 배터리 */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500 w-20 flex-shrink-0">배터리손실%</label>
                  <input type="number" name="batteryLossPct" step="0.1" min="0" max="100"
                    defaultValue={ins?.batteryLossPct || 0}
                    className="w-20 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400" />
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    <input type="checkbox" name="battery45Checked" defaultChecked={ins?.battery45Checked} className="rounded" />
                    45%방전확인
                  </label>
                </div>
              </div>

              {/* 우측: 특이사항 + 아답터/바라시 */}
              <div className="w-1/2 p-4 flex flex-col gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">특이사항 / 불량내역</label>
                  <textarea name="notes" rows={6} defaultValue={ins?.notes || ''}
                    placeholder="특이사항, 불량 내용 자유 작성..."
                    className="w-full border border-slate-200 rounded px-3 py-2 text-xs resize-none focus:outline-none focus:border-blue-400 h-full" />
                </div>

                <div className="border-t border-slate-200 pt-3 space-y-3">
                  <OXField label="아답터" name="adapter" defaultVal={ins?.adapter} />
                  <OXField label="바라시" name="disassembled" defaultVal={ins?.disassembled} />

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 w-16">검수자</span>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded">{session?.name}</span>
                  </div>

                  <div className="mt-2 p-2 rounded bg-violet-50 border border-violet-200">
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
            <Link href={`/orders/${id}`} className="border border-slate-300 text-slate-600 px-6 py-3 rounded-lg text-sm hover:bg-slate-50">
              취소
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}

function OXField({ label, name, defaultVal }: { label: string; name: string; defaultVal?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-slate-500 w-16">{label}</span>
      <div className="flex gap-2">
        {[['O', true], ['X', false]].map(([display, val]) => (
          <label key={String(display)} className="cursor-pointer">
            <input type="radio" name={name} value={String(display)} defaultChecked={defaultVal === val} className="sr-only" />
            <span className={`px-3 py-1 rounded text-xs font-bold border ${defaultVal === val ? (display === 'O' ? 'bg-blue-600 text-white border-blue-600' : 'bg-red-500 text-white border-red-500') : 'bg-white text-slate-400 border-slate-200'}`}>
              {String(display)}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
