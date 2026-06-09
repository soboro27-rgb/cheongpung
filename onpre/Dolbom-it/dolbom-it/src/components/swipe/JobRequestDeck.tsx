"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, X, MapPin, Clock } from "lucide-react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

type JobRequest = {
  id: string
  status: string
  createdAt: string
  parent: { id: string; name: string | null; image: string | null; passBalance: number }
  distanceKm: number
}

export function JobRequestDeck({ initialRequests }: { initialRequests: JobRequest[] }) {
  const [requests, setRequests] = useState(initialRequests)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function handleAction(matchId: string, action: "accept" | "reject") {
    setLoading(matchId)
    const res = await fetch("/api/match", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, action }),
    })
    const data = await res.json()
    setLoading(null)

    if (!res.ok) {
      toast.error(data.error ?? "오류가 발생했습니다")
      return
    }

    setRequests((prev) => prev.filter((r) => r.id !== matchId))

    if (action === "accept") {
      toast.success("매칭을 수락했습니다! 채팅을 시작하세요.")
      router.refresh()
    } else {
      toast("요청을 거절했습니다", { icon: "👋" })
    }
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
        <p className="text-5xl">📭</p>
        <p className="text-gray-600 font-medium">새로운 돌봄 요청이 없어요</p>
        <p className="text-gray-400 text-sm">부모님이 요청을 보내면 여기에 나타나요</p>
        <button
          onClick={() => router.refresh()}
          className="text-purple-600 font-medium underline underline-offset-2 text-sm"
        >
          새로고침
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{requests.length}건의 돌봄 요청이 있어요</p>

      {requests.map((req) => (
        <div
          key={req.id}
          className="bg-white rounded-3xl shadow-md overflow-hidden border border-gray-100"
        >
          {/* 프로필 */}
          <div className="flex items-center gap-4 p-5">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden shrink-0">
              {req.parent.image ? (
                <Image
                  src={req.parent.image}
                  alt={req.parent.name ?? "부모"}
                  width={64}
                  height={64}
                  className="object-cover"
                />
              ) : (
                <span className="text-2xl">{req.parent.name?.[0] ?? "?"}</span>
              )}
            </div>

            <div className="flex-1">
              <p className="font-bold text-gray-900 text-lg">{req.parent.name}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {req.distanceKm.toFixed(1)}km
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(req.createdAt).toLocaleDateString("ko-KR", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <p className="text-xs text-purple-600 font-medium mt-1">
                보유 {req.parent.passBalance}패스
              </p>
            </div>
          </div>

          {/* 수락/거절 버튼 */}
          <div className="flex border-t border-gray-100">
            <button
              onClick={() => handleAction(req.id, "reject")}
              disabled={loading === req.id}
              className="flex-1 py-4 flex items-center justify-center gap-2 text-red-400 hover:bg-red-50 transition disabled:opacity-40 font-medium"
            >
              <X className="w-5 h-5" />
              거절
            </button>
            <div className="w-px bg-gray-100" />
            <button
              onClick={() => handleAction(req.id, "accept")}
              disabled={loading === req.id}
              className="flex-1 py-4 flex items-center justify-center gap-2 text-green-500 hover:bg-green-50 transition disabled:opacity-40 font-medium"
            >
              <Check className="w-5 h-5" />
              수락
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
