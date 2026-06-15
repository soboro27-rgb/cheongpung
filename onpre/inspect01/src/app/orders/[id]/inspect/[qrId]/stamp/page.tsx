import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { saveStamping } from '@/lib/actions/inspect'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'

export default async function StampPage({
  params,
}: {
  params: Promise<{ id: string; qrId: string }>
}) {
  const { id, qrId } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const canStamp = session.role === 'FINAL_INSPECTOR' || session.role === 'ADMIN'

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

  // 1차 검수 미완료
  if (!qr.isInspected || !ins) {
    return (
      <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-5">
            <Link href={`/orders/${id}`} className="text-slate-400 hover:text-slate-600 text-sm">← 매입건</Link>
            <h1 className="text-lg font-black text-slate-900">2차 검수 (스탬핑)</h1>
          </div>
          <div className="bg-orange-50 border border-orange-300 rounded-lg px-5 py-4 text-orange-700 font-bold text-sm">
            1차 검수가 완료되지 않았습니다. 먼저 1차 검수를 완료해 주세요.
          </div>
        </main>
      </div>
    )
  }

  const action = saveStamping.bind(null, qr.id, order.id)

  const specRows = [
    ['제조사', ins.manufacturer], ['모델명', ins.model], ['CPU', ins.cpu],
    ['RAM', ins.ram], ['저장장치', ins.storage], ['VGA', ins.vga],
    ['화면크기', ins.screenSize], ['해상도', ins.resolution], ['액정', ins.lcdCondition],
    ['키보드/터치', ins.keyboardTouch],
    ['배터리손실%', `${ins.batteryLossPct}% ${ins.battery45Checked ? '(45%방전확인)' : ''}`],
    ['아답터', ins.adapter ? 'O' : 'X'],
    ['바라시', ins.disassembled ? 'O' : 'X'],
  ] as [string, string][]

  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-5">
          <Link href={`/orders/${id}`} className="text-slate-400 hover:text-slate-600 text-sm">← 매입건</Link>
          <h1 className="text-lg font-black text-slate-900">2차 검수 (스탬핑)</h1>
          <code className="text-xs bg-slate-200 px-2 py-0.5 rounded font-mono text-slate-600">{qr.qrString}</code>
          {ins.isStamped && (
            <span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full font-bold">스탬핑 완료</span>
          )}
        </div>

        {!canStamp && (
          <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 mb-5 text-sm text-red-700 font-bold">
            최종검수자 계정만 스탬핑할 수 있습니다.
          </div>
        )}

        <div className="grid grid-cols-5 gap-5">
          {/* 좌측: 1차 검수 결과 */}
          <div className="col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-700 text-white px-4 py-2 text-xs font-bold flex justify-between">
              <span>1차 검수 결과</span>
              <span className="text-slate-300">검수자: {ins.inspector.name} · {new Date(ins.inspectedAt).toLocaleString('ko-KR')}</span>
            </div>
            <div className="p-4 space-y-2">
              {specRows.map(([label, value]) => (
                <div key={label} className="flex gap-2 text-xs">
                  <span className="text-slate-400 font-bold w-24 flex-shrink-0">{label}</span>
                  <span className="text-slate-700">{value || '—'}</span>
                </div>
              ))}
              {ins.notes && (
                <div className="flex gap-2 text-xs pt-2 border-t border-slate-100 mt-2">
                  <span className="text-slate-400 font-bold w-24 flex-shrink-0">특이사항</span>
                  <span className="text-slate-700 whitespace-pre-wrap">{ins.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* 우측: 2차 스탬핑 폼 */}
          <div className="col-span-2 flex flex-col gap-4">
            {ins.isStamped && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-xs text-violet-600">
                <div className="font-bold mb-1">이전 스탬핑 정보</div>
                <div>스탬퍼: <strong>{ins.stampedBy?.name}</strong></div>
                <div>{ins.stampedAt ? new Date(ins.stampedAt).toLocaleString('ko-KR') : ''}</div>
              </div>
            )}

            <form action={canStamp ? action : undefined} className="bg-white rounded-xl border-2 border-violet-300 overflow-hidden">
              <div className="bg-violet-700 text-white px-4 py-2 text-xs font-bold">
                최종 판정 입력 (스탬핑)
              </div>

              <div className="p-5 space-y-5">
                {/* 판정 */}
                <div>
                  <span className="text-xs font-bold text-slate-600 block mb-2">판정</span>
                  <div className="flex gap-2">
                    {([
                      ['MODEL',  '모델', 'peer-checked:bg-green-100 peer-checked:text-green-700 peer-checked:border-green-400'],
                      ['DEFECT', '불량', 'peer-checked:bg-red-100 peer-checked:text-red-700 peer-checked:border-red-400'],
                      ['PARTS',  '부품', 'peer-checked:bg-orange-100 peer-checked:text-orange-700 peer-checked:border-orange-400'],
                    ] as [string,string,string][]).map(([val, label, cls]) => (
                      <label key={val} className="cursor-pointer">
                        <input
                          type="radio" name="defectStatus" value={val}
                          defaultChecked={ins.isStamped ? ins.defectStatus === val : val === 'MODEL'}
                          className="peer sr-only"
                        />
                        <span className={`px-4 py-2 rounded-lg text-sm font-bold border-2 bg-white text-slate-300 border-slate-200 transition-colors ${cls}`}>
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 등급 */}
                <div>
                  <span className="text-xs font-bold text-slate-600 block mb-2">등급</span>
                  <div className="flex gap-2">
                    {['S','A','B','C'].map(g => (
                      <label key={g} className="cursor-pointer">
                        <input type="radio" name="grade" value={g}
                          defaultChecked={ins.grade === g}
                          className="peer sr-only" />
                        <span className="w-10 h-10 flex items-center justify-center rounded-full text-sm font-black border-2 bg-white text-slate-400 border-slate-200 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition-colors">
                          {g}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 매입가 */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">매입가</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="purchasePrice"
                      defaultValue={ins.purchasePrice || 0}
                      placeholder="0"
                      className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
                    />
                    <span className="text-sm text-slate-400 whitespace-nowrap">원</span>
                  </div>
                </div>

                {/* 스탬퍼 */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-500 w-16">스탬퍼</span>
                  <span className="text-xs font-bold text-violet-700 bg-violet-100 px-3 py-1 rounded">{session.name}</span>
                </div>
              </div>

              {canStamp && (
                <div className="px-5 pb-5">
                  <button
                    type="submit"
                    className="w-full bg-violet-700 hover:bg-violet-800 text-white font-bold py-3 rounded-lg text-sm"
                  >
                    {ins.isStamped ? '재스탬핑 저장' : '스탬핑 저장'}
                  </button>
                </div>
              )}
            </form>

            <Link
              href={`/orders/${id}`}
              className="text-center border border-slate-300 text-slate-600 px-6 py-2.5 rounded-lg text-sm hover:bg-slate-50"
            >
              ← 목록으로
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
