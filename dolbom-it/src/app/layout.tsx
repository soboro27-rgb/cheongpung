import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Toaster } from "react-hot-toast"
import "./globals.css"

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "돌봄잇 — 동네 돌봄 매칭",
  description: "국가 인증 돌보미를 내 근처에서 즉시 매칭",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
