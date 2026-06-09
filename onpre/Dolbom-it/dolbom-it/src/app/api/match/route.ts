import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { gradePass } from "@/lib/utils"

// 부모가 케어메이트를 수락 (PENDING 생성 or 양쪽 매칭 확정)
export async function POST(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { caregiverId } = await request.json()
  if (!caregiverId) return Response.json({ error: "caregiverId required" }, { status: 400 })

  const parentId = session.user.id

  const caregiver = await prisma.careProfile.findUnique({ where: { id: caregiverId } })
  if (!caregiver) return Response.json({ error: "Caregiver not found" }, { status: 404 })

  const passRequired = gradePass(caregiver.grade)

  const parent = await prisma.user.findUnique({ where: { id: parentId } })
  if (!parent || parent.passBalance < passRequired) {
    return Response.json({ error: "패스 잔액이 부족합니다" }, { status: 400 })
  }

  const existing = await prisma.match.findUnique({
    where: { parentId_caregiverId: { parentId, caregiverId } },
  })

  if (existing) return Response.json({ error: "이미 매칭 요청이 있습니다" }, { status: 409 })

  const match = await prisma.match.create({
    data: { parentId, caregiverId, status: "PENDING" },
  })

  return Response.json({ match, message: "케어메이트에게 수락 요청을 보냈습니다" })
}

// 케어메이트가 매칭 수락/거절
export async function PATCH(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { matchId, action } = await request.json()
  if (!matchId || !["accept", "reject"].includes(action)) {
    return Response.json({ error: "matchId and action(accept|reject) required" }, { status: 400 })
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { caregiver: true, parent: true },
  })

  if (!match) return Response.json({ error: "Match not found" }, { status: 404 })
  if (match.caregiver.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
  if (match.status !== "PENDING") {
    return Response.json({ error: "이미 처리된 매칭입니다" }, { status: 409 })
  }

  if (action === "reject") {
    await prisma.match.update({ where: { id: matchId }, data: { status: "CANCELLED" } })
    return Response.json({ message: "매칭을 거절했습니다" })
  }

  const passAmount = gradePass(match.caregiver.grade)

  const [updatedMatch] = await prisma.$transaction([
    prisma.match.update({
      where: { id: matchId },
      data: { status: "MATCHED", passAmount, matchedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: match.parentId },
      data: { passBalance: { decrement: passAmount } },
    }),
    prisma.passTransaction.create({
      data: {
        userId: match.parentId,
        type: "SPEND",
        amount: passAmount,
        balanceAfter: match.parent.passBalance - passAmount,
        matchId,
      },
    }),
  ])

  return Response.json({ match: updatedMatch, message: "매칭이 확정되었습니다!" })
}
