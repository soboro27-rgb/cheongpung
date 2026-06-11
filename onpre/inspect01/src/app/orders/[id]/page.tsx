import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { completeOrder } from '@/lib/actions/orders'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'

export default async function OrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ locked?: string }> }) {
  const { id } = await params
  const { locked } = await searchParams
  const session = await getSession()
  const order = await prisma.purchaseOrder.findUnique({
    where: { id: parseInt(id) },
    include: {
      qrCodes: {
        orderBy: { seq: 'asc' },
        include: { inspection: { include: { inspector: true } } },
      },
      createdBy: true,
    },
  })
  if (!order) notFound()

  const allInspected = order.qrCodes.every(q => q.isInspected)
  const isDone = order.status === 'DONE'

  const completeWithId = completeOrder.bind(null, order.id)

  const infoRows: [string, string][] = [
    ['업체명', order.companyName],
    ['ERP 사업자명', order.erpName],
    ['사업자번호', order.bizNumber],
    ['담당자', order.managerName],
    ['연락처', order.contact],
    ['수량', order.quantityDesc || `${order.quantity}대`],
    ['입고일', order.arrivalDate],
    ['예금주', order.depositor],
    ['은행', order.bank],
    ['계좌번호', order.accountNumber],
    ['청구금액', order.chargeAmount ? `${order.chargeAmount.toLocaleString()}원` : '—'],
    ['MEMO', order.memo],
    ['작성일', new Date(order.createdAt).toLocaleDateString('ko-KR')],
    ['진행여부', isDone ? '✓ 완료' : '● 진행중'],
  ]

  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 no-print">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/" className="text-slate-400 hover:text-slate-600 text-sm">← 목록</Link>
          <h1 className="text-lg font-black text-slate-900">{order.companyName}</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${isDone ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {isDone ? '완료' : '진행중'}
          </span>
        </div>

        {locked && (
          <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 mb-5 text-sm text-red-700 font-bold">
            이미 다른 검수자가 완료한 항목입니다. 수정할 수 없습니다.
          </div>
        )}

        {/* 기본정보 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">매입건 기본정보</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3">
            {infoRows.map(([key, val]) => (
              <div key={key}>
                <div className="text-xs text-slate-400 font-medium">{key}</div>
                <div className="text-sm font-semibold text-slate-800">{val || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 검수 리스트 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              검수 리스트
              <span className="ml-2 text-blue-600 font-black">
                {order.qrCodes.filter(q => q.isInspected).length}/{order.qrCodes.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {/* 첫 열: 액션 버튼 고정 */}
                  <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left font-bold text-slate-500 whitespace-nowrap border-r border-slate-200">동작</th>
                  {['순번','제조사','모델명','CPU','RAM','저장장치','VGA','크기','해상도','액정','키보드터치','배터리','특이사항','검수자','아답터','바라시','판정','등급','매입가'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-bold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.qrCodes.map(qr => {
                  const ins = qr.inspection
                  return (
                    <tr key={qr.id} className={`border-b border-slate-100 hover:bg-slate-50 ${!qr.isInspected ? 'bg-yellow-50/50' : ''}`}>
                      {/* 액션 버튼 — sticky 첫 열 */}
                      <td className={`sticky left-0 z-10 px-2 py-2 border-r border-slate-200 ${!qr.isInspected ? 'bg-yellow-50' : 'bg-white'}`}>
                        <div className="flex gap-1">
                          <Link
                            href={`/orders/${order.id}/inspect/${qr.id}`}
                            className={`whitespace-nowrap px-3 py-1.5 rounded text-xs font-bold ${qr.isInspected ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                          >
                            {qr.isInspected ? '수정' : '검수입력'}
                          </Link>
                          {qr.isInspected && (
                            <Link
                              href={`/orders/${order.id}/inspect/${qr.id}/label`}
                              className="whitespace-nowrap px-3 py-1.5 rounded text-xs font-bold bg-green-600 text-white hover:bg-green-700"
                            >
                              라벨
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono font-bold text-slate-500">{String(qr.seq).padStart(3,'0')}</td>
                      <td className="px-3 py-2">{ins?.manufacturer || <span className="text-slate-300">—</span>}</td>
                      <td className="px-3 py-2 max-w-32 truncate">{ins?.model || <span className="text-slate-300">—</span>}</td>
                      <td className="px-3 py-2 max-w-28 truncate">{ins?.cpu || <span className="text-slate-300">—</span>}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{ins?.ram || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{ins?.storage || '—'}</td>
                      <td className="px-3 py-2">{ins?.vga || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{ins?.screenSize || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{ins?.resolution || '—'}</td>
                      <td className="px-3 py-2">{ins?.lcdCondition || '—'}</td>
                      <td className="px-3 py-2">{ins?.keyboardTouch || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {ins ? `${ins.batteryLossPct}% ${ins.battery45Checked ? '(45%확인)' : ''}` : '—'}
                      </td>
                      <td className="px-3 py-2 max-w-32 truncate">{ins?.notes || '—'}</td>
                      <td className="px-3 py-2">{ins?.inspector?.name || '—'}</td>
                      <td className="px-3 py-2 text-center">{ins ? (ins.adapter ? 'O' : 'X') : '—'}</td>
                      <td className="px-3 py-2 text-center">{ins ? (ins.disassembled ? 'O' : 'X') : '—'}</td>
                      <td className="px-3 py-2">
                        {ins ? (
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${ins.defectStatus === 'GOOD' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {ins.defectStatus === 'GOOD' ? '양품' : '불량'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {ins?.grade ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-700">{ins.grade}</span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-medium">
                        {ins?.purchasePrice ? ins.purchasePrice.toLocaleString() + '원' : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex items-center justify-between">
          {/* 엑셀 다운로드 (관리자 전용) */}
          {session?.role === 'ADMIN' && (
            <a
              href={`/api/orders/${order.id}/export`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              📊 엑셀 다운로드
            </a>
          )}

          {/* 검수 완료 버튼 */}
          {!isDone && (
            <form action={completeWithId} className="ml-auto">
              <button
                type="submit"
                disabled={!allInspected}
                className={`px-8 py-3 rounded-lg font-bold text-sm ${allInspected ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                {allInspected ? '✓ 검수 완료 처리' : `검수 미완료 (${order.qrCodes.filter(q => !q.isInspected).length}건 남음)`}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
