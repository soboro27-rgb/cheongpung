import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { NextRequest } from "next/server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { matchId } = await params
  const { action } = await req.json()

  if (!["complete", "cancel"].includes(action)) {
    return Response.json({ error: "action must be complete or cancel" }, { status: 400 })
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) return Response.json({ error: "Match not found" }, { status: 404 })
  if (match.parentId !== session.user.id) return Response.json({ error: "Forbidden" }, { status: 403 })

  if (action === "complete") {
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "COMPLETED", completedAt: new Date() },
    })
    return Response.json({ message: "돌봄이 완료되었습니다. 리뷰를 남겨주세요!" })
  }

  const parent = await prisma.user.findUnique({ where: { id: match.parentId } })
  const hoursElapsed = match.matchedAt
    ? (Date.now() - match.matchedAt.getTime()) / 3600000
    : 0
  const refundAmount = hoursElapsed < 24 ? match.passAmount : Math.floor(match.passAmount * 0.5)

  await prisma.$transaction([
    prisma.match.update({ where: { id: matchId }, data: { status: "CANCELLED" } }),
    prisma.user.update({
      where: { id: match.parentId },
      data: { passBalance: { increment: refundAmount } },
    }),
    prisma.passTransaction.create({
      data: {
        userId: match.parentId,
        type: "REFUND",
        amount: refundAmount,
        balanceAfter: (parent?.passBalance ?? 0) + refundAmount,
        matchId,
      },
    }),
  ])

  return Response.json({ message: `취소 처리 완료. ${refundAmount}패스 환불됩니다.` })
}
