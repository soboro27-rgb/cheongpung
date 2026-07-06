import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { matchId, score, content } = await request.json()
  if (!matchId || !score || score < 1 || score > 5) {
    return Response.json({ error: "matchId, score(1-5) required" }, { status: 400 })
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { caregiver: true },
  })

  if (!match) return Response.json({ error: "Match not found" }, { status: 404 })
  if (match.parentId !== session.user.id) return Response.json({ error: "Forbidden" }, { status: 403 })
  if (match.status !== "COMPLETED") return Response.json({ error: "완료된 돌봄만 리뷰할 수 있습니다" }, { status: 400 })

  const review = await prisma.review.create({
    data: { matchId, reviewerId: session.user.id, score, content },
  })

  const allReviews = await prisma.review.findMany({
    where: { match: { caregiverId: match.caregiverId } },
    select: { score: true },
  })
  const avg =
    allReviews.reduce((sum: number, r: { score: number }) => sum + r.score, 0) / allReviews.length

  await prisma.careProfile.update({
    where: { id: match.caregiverId },
    data: {
      reviewScore: Math.round(avg * 10) / 10,
      reviewCount: allReviews.length,
      grade: avg >= 4.5 ? "MASTER" : avg >= 3.5 ? "PRO" : "BASIC",
    },
  })

  return Response.json({ review })
}
