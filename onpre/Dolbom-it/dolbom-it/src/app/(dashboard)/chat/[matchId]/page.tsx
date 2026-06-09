import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { ChatWindow } from "@/components/chat/ChatWindow"
import Image from "next/image"
import { ChevronLeft, MoreVertical } from "lucide-react"
import Link from "next/link"

type Message = {
  id: string
  content: string
  sentAt: string
  sender: { id: string; name: string | null; image: string | null }
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  const { matchId } = await params
  const session = await auth()

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      parent: { select: { id: true, name: true, image: true } },
      caregiver: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      messages: {
        include: { sender: { select: { id: true, name: true, image: true } } },
        orderBy: { sentAt: "asc" },
      },
    },
  })

  if (!match) notFound()

  const userId = session!.user.id
  const isParent = match.parentId === userId
  const isCaregiver = match.caregiver.userId === userId

  if (!isParent && !isCaregiver) redirect("/matches")
  if (match.status !== "MATCHED" && match.status !== "COMPLETED") redirect("/matches")

  const other = isParent ? match.caregiver.user : match.parent

  const messages: Message[] = match.messages.map((m) => ({
    id: m.id,
    content: m.content,
    sentAt: m.sentAt.toISOString(),
    sender: m.sender,
  }))

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
        <Link href="/matches" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="w-10 h-10 rounded-full bg-purple-100 overflow-hidden">
          {other.image ? (
            <Image src={other.image} alt="" width={40} height={40} className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">
              {other.name?.[0] ?? "?"}
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{other.name}</p>
          <p className="text-xs text-green-500">매칭됨</p>
        </div>
        <button className="text-gray-400">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatWindow matchId={matchId} currentUserId={userId} initialMessages={messages} />
      </div>
    </div>
  )
}
