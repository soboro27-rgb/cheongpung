"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Send } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  content: string
  sentAt: string
  sender: { id: string; name: string | null; image: string | null }
}

type Props = {
  matchId: string
  currentUserId: string
  initialMessages: Message[]
}

export function ChatWindow({ matchId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/messages/${matchId}`)
    if (!res.ok) return
    const data: Message[] = await res.json()
    setMessages(data)
  }, [matchId])

  // Supabase 미설정 시 폴링으로 실시간 대체
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      // Supabase 실시간 구독
      import("@/lib/supabase").then(({ supabase }) => {
        const channel = supabase
          .channel(`match:${matchId}`)
          .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `match_id=eq.${matchId}`,
          }, (payload) => {
            const msg = payload.new as Message
            setMessages((prev) =>
              prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
            )
          })
          .subscribe()
        return () => { supabase.removeChannel(channel) }
      })
    } else {
      // 폴링 (2초 간격)
      const timer = setInterval(fetchMessages, 2000)
      return () => clearInterval(timer)
    }
  }, [matchId, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return

    setSending(true)
    setInput("")

    const res = await fetch(`/api/messages/${matchId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    })

    if (res.ok) {
      const newMsg: Message = await res.json()
      setMessages((prev) => [...prev, newMsg])
    } else {
      setInput(text)
    }
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMine = msg.sender.id === currentUserId
          return (
            <div key={msg.id} className={cn("flex gap-2 items-end", isMine && "flex-row-reverse")}>
              {!isMine && (
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden shrink-0">
                  {msg.sender.image ? (
                    <Image src={msg.sender.image} alt="" width={32} height={32} className="object-cover" />
                  ) : (
                    <span className="text-sm">{msg.sender.name?.[0] ?? "?"}</span>
                  )}
                </div>
              )}
              <div
                className={cn(
                  "max-w-[70%] px-4 py-2 rounded-2xl text-sm",
                  isMine
                    ? "bg-purple-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                )}
              >
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 p-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="메시지를 입력하세요..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white disabled:opacity-40 hover:bg-purple-700 transition shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
