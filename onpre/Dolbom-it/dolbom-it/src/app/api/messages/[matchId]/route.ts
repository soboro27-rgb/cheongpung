import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { NextRequest } from "next/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { matchId } = await params

  const messages = await prisma.message.findMany({
    where: { matchId },
    include: { sender: { select: { id: true, name: true, image: true } } },
    orderBy: { sentAt: "asc" },
  })

  return Response.json(messages)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { matchId } = await params
  const { content } = await req.json()

  if (!content?.trim()) return Response.json({ error: "content required" }, { status: 400 })

  const message = await prisma.message.create({
    data: { matchId, senderId: session.user.id, content },
    include: { sender: { select: { id: true, name: true, image: true } } },
  })

  return Response.json(message)
}
