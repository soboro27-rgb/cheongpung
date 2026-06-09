import { auth, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Image from "next/image"
import { Shield, Star, LogOut } from "lucide-react"
import { gradeLabel } from "@/lib/utils"

export default async function MyProfilePage() {
  const session = await auth()
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    include: { careProfile: { include: { certifications: true } } },
  })

  return (
    <div className="p-5 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">내 프로필</h1>

      {/* 프로필 카드 */}
      <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-purple-100 overflow-hidden shrink-0">
          {user?.image ? (
            <Image src={user.image} alt="" width={64} height={64} className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {user?.name?.[0] ?? "?"}
            </div>
          )}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
          <p className="text-gray-400 text-sm">{user?.email}</p>
          <span className="inline-block mt-1 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
            {user?.role === "PARENT" ? "부모" : user?.role === "CAREGIVER" ? "케어메이트" : "관리자"}
          </span>
        </div>
      </div>

      {/* 케어메이트 프로필 */}
      {user?.careProfile && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">케어메이트 정보</h2>
            {user.careProfile.adminVerified && (
              <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                <Shield className="w-3 h-3" />
                인증됨
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
              {gradeLabel(user.careProfile.grade as string)}
            </span>
            <span className="flex items-center gap-1 text-gray-600">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              {user.careProfile.reviewScore.toFixed(1)} ({user.careProfile.reviewCount})
            </span>
          </div>
          {user.careProfile.bio && (
            <p className="text-sm text-gray-600">{user.careProfile.bio}</p>
          )}
        </div>
      )}

      {/* 로그아웃 */}
      <form
        action={async () => {
          "use server"
          await signOut({ redirectTo: "/login" })
        }}
      >
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-3 rounded-2xl font-medium hover:bg-gray-200 transition"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </form>
    </div>
  )
}
