import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { completeOrder, addQrRow, deleteQrRow } from '@/lib/actions/orders'
import { saveStamping } from '@/lib/actions/inspect'
import DeleteOrderButton from './DeleteOrderButton'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'

const DEFECT_LABEL: Record<string, { label: string; cls: string }> = {
  MODEL: { label: '모델', cls: 'bg-green-100 text-green-700' },
  DEFECT: { label: '불량', cls: 'bg-red-100 text-red-700' },
  PARTS: { label: '부품', cls: 'bg-orange-100 text-orange-700' },
  GOOD:  { label: '양품', cls: 'bg-green-100 text-green-700' }, // 레거시 호환
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ locked?: string; noauth?: string }>
}) {
  const { id } = await params
  const { locked, noauth } = await searchParams
  const session = await getSession()

  const order = await prisma.purchaseOrder.findUnique({
    where: { id: parseInt(id) },
    include: {
      qrCodes: {
        orderBy: { seq: 'asc' },
        include: { inspection: { include: { inspector: true, stampedBy: true } } },
      },
      createdBy: true,
    },
  })
  if (!order) notFound()

  const allInspected = order.qrCodes.every(q => q.isInspected)
  const isDone = order.status === 'DONE'
  const isFinalOrAdmin = session?.role === 'FINAL_INSPECTOR' || session?.role === 'ADMIN'

  const completeWithId = completeOrder.bind(null, order.id)
  const addRowAction = addQrRow.bind(null, order.id)

  const infoRows: [string, string][] = [
    ['업체명', order.companyName],
    ['ERP 사업자명', order.erpName],
    ['사업자번호', order.bizNumber],
    ['담당자', order.managerName],
    ['연락처', order.contact],
    ['수량', `${order.qrCodes.length}대${order.quantityDesc ? ` (${order.quantityDesc})` : ''}`],
    ['입고일', order.arrivalDate],
    ['예금주', order.depositor],
    ['은행', order.bank],
    ['계좌번호', order.accountNumber],
    ['청구금액', order.chargeAmount ? `${order.chargeAmount.toLocaleString()}원` : '—'],
    ['MEMO', order.memo],
    ['작성일', new Date(order.createdAt).toLocaleDateString('ko-KR')],
    ['진행여부', isDone ? '✓ 완료' : '● 진행중'],
  ]

  const stampedCount = order.qrCodes.filter(q => q.inspection?.isStamped).length
  const inspectedCount = order.qrCodes.filter(q => q.isInspected).length

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
        {noauth && (
          <div className="bg-orange-50 border border-orange-300 rounded-lg px-4 py-3 mb-5 text-sm text-orange-700 font-bold">
            스탬핑은 최종검수자 계정만 가능합니다.
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
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-3">
              <span>
                검수 리스트
                <span className="ml-2 text-blue-600 font-black">{inspectedCount}/{order.qrCodes.length}</span>
              </span>
              {isFinalOrAdmin && (
                <span className="text-violet-600 font-black">
                  스탬핑 {stampedCount}/{inspectedCount}
                </span>
              )}
            </div>
            {session?.role === 'ADMIN' && !isDone && (
              <form action={addRowAction}>
                <button type="submit" className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-bold border border-blue-200">
                  + 행 추가
                </button>
              </form>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left font-bold text-slate-500 whitespace-nowrap border-r border-slate-200">동작</th>
                  {['순번','제조사','모델명','CPU','RAM','저장장치','VGA','크기','해상도','액정','키보드터치','배터리','특이사항','검수자','아답터','바라시'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-bold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                  <th className="px-3 py-2 text-left font-bold text-violet-500 whitespace-nowrap">판정</th>
                  <th className="px-3 py-2 text-left font-bold text-violet-500 whitespace-nowrap">등급</th>
                  <th className="px-3 py-2 text-left font-bold text-violet-500 whitespace-nowrap">매입가</th>
                  <th className="px-3 py-2 text-left font-bold text-violet-500 whitespace-nowrap">
                    {session?.role === 'FINAL_INSPECTOR' ? '저장 / 스탬퍼' : '스탬퍼'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.qrCodes.map(qr => {
                  const ins = qr.inspection
                  const canStampRow = session?.role === 'FINAL_INSPECTOR' && qr.isInspected
                  const stampFormId = `stamp-${qr.id}`
                  const stampAction = saveStamping.bind(null, qr.id, order.id)
                  const defectInfo = ins?.defectStatus ? DEFECT_LABEL[ins.defectStatus] : null

                  return (
                    <tr
                      key={qr.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 ${
                        !qr.isInspected ? 'bg-yellow-50/50' : ins?.isStamped ? 'bg-violet-50/20' : ''
                      }`}
                    >
                      {/* 동작 — sticky */}
                      <td className={`sticky left-0 z-10 px-2 py-2 border-r border-slate-200 ${
                        !qr.isInspected ? 'bg-yellow-50' : ins?.isStamped ? 'bg-violet-50/60' : 'bg-white'
                      }`}>
                        <div className="flex gap-1 flex-wrap">
                          {session?.role !== 'FINAL_INSPECTOR' && (
                            <Link
                              href={`/orders/${order.id}/inspect/${qr.id}`}
                              className={`whitespace-nowrap px-3 py-1.5 rounded text-xs font-bold ${
                                qr.isInspected
                                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {qr.isInspected ? '수정' : '검수입력'}
                            </Link>
                          )}
                          {qr.isInspected && (
                            <Link
                              href={`/orders/${order.id}/inspect/${qr.id}/label`}
                              className="whitespace-nowrap px-3 py-1.5 rounded text-xs font-bold bg-green-600 text-white hover:bg-green-700"
                            >
                              라벨
                            </Link>
                          )}
                          {/* 스탬핑 상태 뱃지 */}
                          {qr.isInspected && (
                            <span className={`whitespace-nowrap px-2.5 py-1.5 rounded text-xs font-bold ${
                              ins?.isStamped
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              {ins?.isStamped ? '스탬핑완료' : '미스탬핑'}
                            </span>
                          )}
                          {session?.role === 'ADMIN' && !qr.isInspected && !isDone && (
                            <form action={deleteQrRow.bind(null, qr.id, order.id)}>
                              <button type="submit" className="whitespace-nowrap px-2 py-1.5 rounded text-xs font-bold text-red-400 hover:text-red-600 hover:bg-red-50">
                                삭제
                              </button>
                            </form>
                          )}
                        </div>
                      </td>

                      {/* 스펙 컬럼들 */}
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

                      {/* 판정 */}
                      <td className="px-2 py-1.5">
                        {canStampRow ? (
                          <select
                            name="defectStatus"
                            form={stampFormId}
                            defaultValue={ins?.defectStatus && ins.defectStatus !== 'GOOD' ? ins.defectStatus : 'MODEL'}
                            className="border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-violet-400 bg-white"
                          >
                            <option value="MODEL">모델</option>
                            <option value="DEFECT">불량</option>
                            <option value="PARTS">부품</option>
                          </select>
                        ) : ins?.isStamped && defectInfo ? (
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${defectInfo.cls}`}>
                            {defectInfo.label}
                          </span>
                        ) : ins ? (
                          <span className="text-xs text-slate-300">—</span>
                        ) : '—'}
                      </td>

                      {/* 등급 */}
                      <td className="px-2 py-1.5">
                        {canStampRow ? (
                          <select
                            name="grade"
                            form={stampFormId}
                            defaultValue={ins?.grade ?? ''}
                            className="border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-violet-400 bg-white"
                          >
                            <option value="">—</option>
                            {['S','A','B','C'].map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        ) : ins?.isStamped && ins.grade ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-700">{ins.grade}</span>
                        ) : '—'}
                      </td>

                      {/* 매입가 */}
                      <td className="px-2 py-1.5">
                        {canStampRow ? (
                          <input
                            type="number"
                            name="purchasePrice"
                            form={stampFormId}
                            defaultValue={ins?.purchasePrice ?? 0}
                            min={0}
                            className="border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-violet-400 w-24 bg-white"
                          />
                        ) : ins?.isStamped && ins.purchasePrice ? (
                          <span className="font-medium">{ins.purchasePrice.toLocaleString()}원</span>
                        ) : '—'}
                      </td>

                      {/* 저장 / 스탬퍼 */}
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {canStampRow ? (
                          <div className="flex flex-col gap-1">
                            <form id={stampFormId} action={stampAction}>
                              <button
                                type="submit"
                                className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded text-xs font-bold"
                              >
                                저장
                              </button>
                            </form>
                            {ins?.isStamped && (
                              <span className="text-xs text-slate-400">{ins.stampedBy?.name}</span>
                            )}
                          </div>
                        ) : ins?.isStamped ? (
                          <span className="text-xs text-violet-600 font-medium">{ins.stampedBy?.name || '—'}</span>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-between">
          {session?.role === 'ADMIN' ? (
            <div className="flex items-center gap-3">
              <a
                href={`/api/orders/${order.id}/export`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                📊 엑셀 다운로드
              </a>
              <DeleteOrderButton orderId={order.id} />
            </div>
          ) : <div />}

          {!isDone && session?.role === 'ADMIN' && (
            <form action={completeWithId}>
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
