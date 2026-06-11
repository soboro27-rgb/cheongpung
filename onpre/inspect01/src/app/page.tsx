import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import Link from 'next/link'
import Navbar from './components/Navbar'

export default async function HomePage() {
  const session = await getSession()
  const orders = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      qrCodes: { include: { inspection: true } },
      createdBy: true,
    },
  })

  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 no-print">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-black text-slate-900">매입건 목록</h1>
          {session?.role === 'ADMIN' && (
            <Link
              href="/orders/new"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg"
            >
              + 신규 매입건 등록
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            등록된 매입건이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const total = order.qrCodes.length
              const done = order.qrCodes.filter(q => q.isInspected).length
              const isDone = order.status === 'DONE'
              return (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all p-5 flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-black text-slate-900 text-base">{order.companyName}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${isDone ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {isDone ? '✓ 완료' : '● 진행중'}
                        </span>
                      </div>
                      <div className="text-slate-500 text-xs flex gap-4">
                        <span>수량: {order.quantityDesc || `${order.quantity}대`}</span>
                        <span>입고일: {order.arrivalDate || '—'}</span>
                        <span>담당: {order.managerName || '—'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-blue-600">{done}<span className="text-slate-400 text-lg font-normal">/{total}</span></div>
                      <div className="text-xs text-slate-400">검수 완료</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
