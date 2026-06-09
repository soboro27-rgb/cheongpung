import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SwipeDeck } from "@/components/swipe/SwipeDeck"
import { JobRequestDeck } from "@/components/swipe/JobRequestDeck"
import { distanceKm } from "@/lib/utils"
import { Wallet, Briefcase } from "lucide-react"
import Link from "next/link"
import type { CareProfile, User, Certification } from "@/generated/prisma/client"

type CareProfileWithUser = CareProfile & {
  user: Pick<User, "id" | "name" | "image" | "lat" | "lng">
  certifications: Certification[]
}

export default async function SwipePage() {
  const session = await auth()
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } })
  const role = session!.user.role

  const lat = user?.lat ?? 37.5665
  const lng = user?.lng ?? 126.9780

  // 케어메이트: 들어온 매칭 요청 목록
  if (role === "CAREGIVER") {
    const careProfile = await prisma.careProfile.findUnique({
      where: { userId: user!.id },
    })

    const pendingMatches = careProfile
      ? await prisma.match.findMany({
          where: { caregiverId: careProfile.id, status: "PENDING" },
          include: {
            parent: { select: { id: true, name: true, image: true, lat: true, lng: true, passBalance: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : []

    const requests = pendingMatches.map((m) => ({
      id: m.id,
      status: m.status,
      createdAt: m.createdAt.toISOString(),
      parent: {
        id: m.parent.id,
        name: m.parent.name,
        image: m.parent.image,
        passBalance: m.parent.passBalance,
      },
      distanceKm:
        m.parent.lat && m.parent.lng
          ? distanceKm(lat, lng, m.parent.lat, m.parent.lng)
          : 0,
    }))

    return (
      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">돌봄 요청 🧸</h1>
            <p className="text-gray-400 text-sm">부모님의 돌봄 요청을 확인하세요</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
            <Briefcase className="w-4 h-4" />
            케어메이트
          </div>
        </div>

        <JobRequestDeck initialRequests={requests} />
      </div>
    )
  }

  // 부모: 케어메이트 스와이프
  const radiusKm = 5

  const careProfiles = await prisma.careProfile.findMany({
    where: { isActive: true },
    include: {
      user: { select: { id: true, name: true, image: true, lat: true, lng: true } },
      certifications: true,
    },
  }) as CareProfileWithUser[]

  const nearby = careProfiles
    .filter((cp: CareProfileWithUser) => {
      if (!cp.user.lat || !cp.user.lng) return false
      if (cp.user.id === session!.user.id) return false
      return distanceKm(lat, lng, cp.user.lat, cp.user.lng) <= radiusKm
    })
    .map((cp: CareProfileWithUser) => ({
      id: cp.id,
      bio: cp.bio,
      passPerHour: cp.passPerHour,
      grade: cp.grade as string,
      reviewScore: cp.reviewScore,
      reviewCount: cp.reviewCount,
      adminVerified: cp.adminVerified,
      distanceKm: distanceKm(lat, lng, cp.user.lat!, cp.user.lng!),
      user: { id: cp.user.id, name: cp.user.name, image: cp.user.image },
    }))
    .sort(
      (a: { distanceKm: number }, b: { distanceKm: number }) => a.distanceKm - b.distanceKm
    )

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">돌봄잇 🧸</h1>
          <p className="text-gray-400 text-sm">내 근처 케어메이트</p>
        </div>
        <Link
          href="/wallet"
          className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium"
        >
          <Wallet className="w-4 h-4" />
          {user?.passBalance ?? 0}패스
        </Link>
      </div>

      <SwipeDeck initialCaregivers={nearby} />
    </div>
  )
}
