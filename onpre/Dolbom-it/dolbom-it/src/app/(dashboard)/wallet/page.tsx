import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ChargeButton } from "./ChargeButton"
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react"
import type { PassTransaction } from "@/generated/prisma/client"

export default async function WalletPage() {
  const session = await auth()
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } })
  const transactions = await prisma.passTransaction.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  return (
    <div className="p-5 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">돌봄패스 지갑</h1>

      <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-3xl p-6 text-white space-y-2">
        <p className="text-purple-200 text-sm">현재 잔액</p>
        <p className="text-4xl font-bold">
          {user?.passBalance ?? 0}
          <span className="text-2xl ml-1">패스</span>
        </p>
        <p className="text-purple-200 text-sm">≈ {((user?.passBalance ?? 0) * 1000).toLocaleString()}원</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[10, 30, 50].map((amount) => (
          <ChargeButton key={amount} amount={amount} />
        ))}
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm text-gray-600">
        <p className="font-semibold text-gray-800">등급별 패스 소모</p>
        <div className="space-y-1">
          <p>일반 케어메이트 — 5패스/시간</p>
          <p>전문 케어메이트 — 10패스/시간</p>
          <p>마스터 케어메이트 — 15패스/시간</p>
        </div>
        <p className="text-xs text-gray-400 pt-1">매칭 확정 후 24시간 이내 취소 시 전액 환불</p>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 mb-3">사용 내역</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">내역이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx: PassTransaction) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      tx.type === "CHARGE"
                        ? "bg-green-50"
                        : tx.type === "REFUND"
                        ? "bg-blue-50"
                        : "bg-red-50"
                    }`}
                  >
                    {tx.type === "CHARGE" && <ArrowDownLeft className="w-4 h-4 text-green-600" />}
                    {tx.type === "REFUND" && <RefreshCw className="w-4 h-4 text-blue-600" />}
                    {tx.type === "SPEND" && <ArrowUpRight className="w-4 h-4 text-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {tx.type === "CHARGE" ? "충전" : tx.type === "REFUND" ? "환불" : "사용"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${tx.type === "SPEND" ? "text-red-500" : "text-green-600"}`}>
                    {tx.type === "SPEND" ? "-" : "+"}
                    {tx.amount}패스
                  </p>
                  <p className="text-xs text-gray-400">잔액 {tx.balanceAfter}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
