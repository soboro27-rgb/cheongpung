import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Star, Shield, ChevronLeft } from "lucide-react"
import { gradeLabel, gradePass } from "@/lib/utils"
import Link from "next/link"
import type { Certification, Review } from "@/generated/prisma/client"

type ReviewWithReviewer = Review & {
  reviewer: { name: string | null; image: string | null }
}

export default async function CaregiverProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const profile = await prisma.careProfile.findUnique({
    where: { id },
    include: { user: true, certifications: true },
  })

  if (!profile) notFound()

  const reviews = await prisma.review.findMany({
    where: { match: { caregiverId: id } },
    include: { reviewer: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  }) as ReviewWithReviewer[]

  return (
    <div className="pb-8">
      <div className="p-4">
        <Link href="/swipe" className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">뒤로</span>
        </Link>
      </div>

      <div className="relative h-72 bg-gradient-to-br from-pink-100 to-purple-100">
        {profile.user.image ? (
          <Image src={profile.user.image} alt={profile.user.name ?? ""} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">
            {profile.user.name?.[0] ?? "?"}
          </div>
        )}
        {profile.adminVerified && (
          <div className="absolute bottom-4 left-4 bg-blue-500 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium">
            <Shield className="w-4 h-4" />
            국가 인증 케어메이트
          </div>
        )}
      </div>

      <div className="p-5 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.user.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {profile.reviewScore.toFixed(1)} ({profile.reviewCount}개)
              </span>
            </div>
          </div>
          <span className="bg-purple-100 text-purple-700 font-semibold px-3 py-1.5 rounded-full text-sm">
            {gradeLabel(profile.grade as string)}
          </span>
        </div>

        <div className="bg-purple-50 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">시간당 패스</p>
            <p className="text-2xl font-bold text-purple-700">{gradePass(profile.grade as string)}패스</p>
          </div>
          <p className="text-gray-400 text-sm">= {gradePass(profile.grade as string) * 1000}원/시간</p>
        </div>

        {profile.bio && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">자기소개</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {profile.certifications.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">자격증 및 인증</h2>
            <div className="space-y-2">
              {profile.certifications.map((cert: Certification) => (
                <div key={cert.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{cert.type}</p>
                    <p className="text-xs text-gray-400">{cert.issuer}</p>
                  </div>
                  {cert.verified && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">인증됨</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {reviews.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">리뷰 ({reviews.length})</h2>
            <div className="space-y-3">
              {reviews.map((review: ReviewWithReviewer) => (
                <div key={review.id} className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">
                      {"★".repeat(review.score)}{"☆".repeat(5 - review.score)}
                    </span>
                    <span className="text-sm font-medium text-gray-700">{review.reviewer.name}</span>
                  </div>
                  {review.content && <p className="text-sm text-gray-600">{review.content}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
