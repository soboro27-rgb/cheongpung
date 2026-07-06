import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Home, MessageCircle, Wallet, User } from "lucide-react"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white shadow-sm">
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* 하단 탭 네비게이션 */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 flex justify-around py-3 z-50">
        <NavItem href="/swipe" icon={<Home className="w-5 h-5" />} label="홈" />
        <NavItem href="/matches" icon={<MessageCircle className="w-5 h-5" />} label="매칭" />
        <NavItem href="/wallet" icon={<Wallet className="w-5 h-5" />} label="패스" />
        <NavItem href="/profile" icon={<User className="w-5 h-5" />} label="프로필" />
      </nav>
    </div>
  )
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 text-gray-400 hover:text-purple-600 transition"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  )
}
