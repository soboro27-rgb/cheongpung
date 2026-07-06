"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

export function ChargeButton({ amount }: { amount: number }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCharge() {
    setLoading(true)
    const res = await fetch("/api/pass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    })
    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      toast.success(data.message)
      router.refresh()
    } else {
      toast.error(data.error ?? "충전 실패")
    }
  }

  return (
    <button
      onClick={handleCharge}
      disabled={loading}
      className="bg-white border-2 border-purple-200 text-purple-700 font-semibold py-3 rounded-2xl hover:bg-purple-50 transition disabled:opacity-50 text-sm"
    >
      {loading ? "..." : `+${amount}패스`}
      <p className="text-xs font-normal text-gray-400 mt-0.5">{(amount * 1000).toLocaleString()}원</p>
    </button>
  )
}
