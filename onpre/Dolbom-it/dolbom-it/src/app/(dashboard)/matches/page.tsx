import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { MessageCircle, Clock, CheckCircle2 } from "lucide-react"
import type { Match, User, CareProfile, Message } from "@/generated/prisma/client"

type MatchWithRelations = Match & {
  parent: Pick<User, "id" | "name" | "image">
  caregiver: CareProfile & { user: Pick<User, "id" | "name" | "image"> }
  messages: Pick<Message, "content">[]
}

export default async function MatchesPage() {
  const session = await auth()

  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { parentId: session!.user.id },
        { caregiver: { userId: session!.user.id } },
      ],
      status: { in: ["PENDING", "MATCHED", "COMPLETED"] },
    },
    include: {
      parent: { select: { id: true, name: true, image: true } },
      caregiver: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      messages: { orderBy: { sentAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  }) as MatchWithRelations[]

  const userId = session!.user.id

  return (
    <div className="p-5 space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">매칭 목록</h1>

      {matches.length === 0 && (
        <div className="text-center py-20 text-gray-400 space-y-2">
          <MessageCircle className="w-12 h-12 mx-auto opacity-30" />
          <p>아직 매칭이 없어요</p>
          <Link href="/swipe" className="text-purple-600 font-medium underline underline-offset-2">
            케어메이트 찾아보기
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {matches.map((match: MatchWithRelations) => {
          const isParent = match.parentId === userId
          const other = isParent ? match.caregiver.user : match.parent
          const lastMsg = match.messages[0]

          return (
            <Link
              key={match.id}
              href={
                match.status === "MATCHED" || match.status === "COMPLETED"
                  ? `/chat/${match.id}`
                  : "#"
              }
              className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition"
            >
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden shrink-0">
                {other.image ? (
                  <Image src={other.image} alt="" width={48} height={48} className="object-cover" />
                ) : (
                  <span className="text-lg">{other.name?.[0] ?? "?"}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{other.name}</p>
                  <StatusBadge status={match.status as string} />
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {lastMsg?.content ?? "메시지가 없습니다"}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "PENDING")
    return (
      <span className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3" />
        대기중
      </span>
    )
  if (status === "MATCHED")
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        매칭됨
      </span>
    )
  return null
}
