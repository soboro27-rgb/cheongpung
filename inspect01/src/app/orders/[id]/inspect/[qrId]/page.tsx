import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { saveInspection } from '@/lib/actions/inspect'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import InspectForm from './InspectForm'

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

  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-5">
          <Link href={`/orders/${id}`} className="text-slate-400 hover:text-slate-600 text-sm">← 매입건</Link>
          <h1 className="text-lg font-black text-slate-900">1차 검수 입력</h1>
          <code className="text-xs bg-slate-200 px-2 py-0.5 rounded font-mono text-slate-600">{qr.qrString}</code>
        </div>

        <InspectForm
          action={action}
          orderId={order.id}
          qrString={qr.qrString}
          inspectorName={session?.name ?? ''}
          initialValues={{
            manufacturer: ins?.manufacturer ?? '',
            model: ins?.model ?? '',
            cpu: ins?.cpu ?? '',
            ram: ins?.ram ?? '',
            storage: ins?.storage ?? '',
            vga: ins?.vga ?? '',
            screenSize: ins?.screenSize ?? '',
            resolution: ins?.resolution ?? '',
            lcdCondition: ins?.lcdCondition ?? '',
            keyboardTouch: ins?.keyboardTouch ?? '',
            batteryLossPct: ins?.batteryLossPct ?? 0,
            battery45Checked: ins?.battery45Checked ?? false,
            notes: ins?.notes ?? '',
            adapter: ins ? ins.adapter : undefined,
            disassembled: ins ? ins.disassembled : undefined,
          }}
        />
      </main>
    </div>
  )
}
