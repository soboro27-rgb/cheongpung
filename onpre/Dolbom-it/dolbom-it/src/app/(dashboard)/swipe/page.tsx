import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SwipeDeck } from "@/components/swipe/SwipeDeck"
import { distanceKm } from "@/lib/utils"
import { Wallet } from "lucide-react"
import Link from "next/link"
import type { CareProfile, User, Certification } from "@/generated/prisma/client"

type CareProfileWithUser = CareProfile & {
  user: Pick<User, "id" | "name" | "image" | "lat" | "lng">
  certifications: Certification[]
}

export default async function SwipePage() {
  const session = await auth()
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } })

  const lat = user?.lat ?? 37.5665
  const lng = user?.lng ?? 126.9780
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
