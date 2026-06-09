import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { distanceKm } from "@/lib/utils"
import type { CareProfile, User, Certification } from "@/generated/prisma/client"

type CareProfileWithUser = CareProfile & {
  user: Pick<User, "id" | "name" | "image" | "lat" | "lng">
  certifications: Certification[]
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get("lat") ?? "37.5665")
  const lng = parseFloat(searchParams.get("lng") ?? "126.9780")
  const radiusKm = parseFloat(searchParams.get("radius") ?? "5")

  const caregivers = await prisma.careProfile.findMany({
    where: { isActive: true },
    include: {
      user: { select: { id: true, name: true, image: true, lat: true, lng: true } },
      certifications: true,
    },
  }) as CareProfileWithUser[]

  const filtered = caregivers
    .filter((cg: CareProfileWithUser) => {
      if (!cg.user.lat || !cg.user.lng) return false
      return distanceKm(lat, lng, cg.user.lat, cg.user.lng) <= radiusKm
    })
    .map((cg: CareProfileWithUser) => ({
      ...cg,
      distanceKm: distanceKm(lat, lng, cg.user.lat!, cg.user.lng!),
    }))
    .sort(
      (a: CareProfileWithUser & { distanceKm: number }, b: CareProfileWithUser & { distanceKm: number }) =>
        a.distanceKm - b.distanceKm
    )

  return Response.json(filtered)
}
