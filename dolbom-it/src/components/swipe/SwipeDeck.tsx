"use client"

import { useState } from "react"
import { SwipeCard } from "./SwipeCard"
import { X, Heart, RotateCcw } from "lucide-react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

type Caregiver = {
  id: string
  bio: string | null
  passPerHour: number
  grade: string
  reviewScore: number
  reviewCount: number
  adminVerified: boolean
  distanceKm: number
  user: { id: string; name: string | null; image: string | null }
}

export function SwipeDeck({ initialCaregivers }: { initialCaregivers: Caregiver[] }) {
  const [caregivers, setCaregivers] = useState(initialCaregivers)
  const [dismissed, setDismissed] = useState<Caregiver[]>([])
  const router = useRouter()

  async function handleSwipeRight(caregiver: Caregiver) {
    setCaregivers((prev) => prev.filter((c) => c.id !== caregiver.id))
    setDismissed((prev) => [caregiver, ...prev])

    const res = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caregiverId: caregiver.id }),
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? "오류가 발생했습니다")
      return
    }
    toast.success(`${caregiver.user.name}에게 수락 요청을 보냈습니다!`)
  }

  function handleSwipeLeft(caregiver: Caregiver) {
    setCaregivers((prev) => prev.filter((c) => c.id !== caregiver.id))
    setDismissed((prev) => [caregiver, ...prev])
  }

  function handleUndo() {
    if (dismissed.length === 0) return
    const [last, ...rest] = dismissed
    setDismissed(rest)
    setCaregivers((prev) => [last, ...prev])
  }

  if (caregivers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
        <p className="text-5xl">🔍</p>
        <p className="text-gray-600 font-medium">근처 케어메이트를 모두 확인했어요</p>
        <button
          onClick={() => router.refresh()}
          className="text-purple-600 font-medium underline underline-offset-2"
        >
          다시 불러오기
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* 카드 덱 */}
      <div className="relative w-full max-w-sm h-[520px]">
        {caregivers
          .slice(0, 3)
          .reverse()
          .map((cg, i) => (
            <SwipeCard
              key={cg.id}
              caregiver={cg}
              isTop={i === caregivers.slice(0, 3).length - 1}
              onSwipeLeft={() => handleSwipeLeft(cg)}
              onSwipeRight={() => handleSwipeRight(cg)}
            />
          ))}
      </div>

      {/* 버튼 */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => caregivers[0] && handleSwipeLeft(caregivers[0])}
          className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition"
        >
          <X className="w-7 h-7" />
        </button>

        <button
          onClick={handleUndo}
          disabled={dismissed.length === 0}
          className="w-10 h-10 bg-white rounded-full shadow flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 transition"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={() => caregivers[0] && handleSwipeRight(caregivers[0])}
          className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:opacity-90 transition"
        >
          <Heart className="w-7 h-7 fill-white" />
        </button>
      </div>

      <p className="text-gray-400 text-sm">{caregivers.length}명의 케어메이트</p>
    </div>
  )
}
