import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 돌봄패스 충전 (MVP: 관리자 지급 or 테스트 충전)
export async function POST(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { amount } = await request.json()
  if (!amount || amount <= 0) return Response.json({ error: "amount required" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return Response.json({ error: "User not found" }, { status: 404 })

  const newBalance = user.passBalance + amount

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { passBalance: newBalance },
    }),
    prisma.passTransaction.create({
      data: {
        userId: session.user.id,
        type: "CHARGE",
        amount,
        balanceAfter: newBalance,
      },
    }),
  ])

  return Response.json({ balance: newBalance, message: `${amount}패스가 충전되었습니다` })
}

// 패스 내역 조회
export async function GET(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const transactions = await prisma.passTransaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passBalance: true },
  })

  return Response.json({ balance: user?.passBalance ?? 0, transactions })
}
