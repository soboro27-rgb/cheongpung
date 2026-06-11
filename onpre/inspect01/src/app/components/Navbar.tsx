import { logout } from '@/lib/actions/auth'
import { getSession } from '@/lib/session'
import Link from 'next/link'

function WDLogo({ size = 36 }: { size?: number }) {
  const h = Math.round(size * 56 / 78)
  return (
    <svg width={size} height={h} viewBox="0 0 78 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="navWg" x1="0" y1="0" x2="78" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6EC6F0" />
          <stop offset="45%" stopColor="#1976D2" />
          <stop offset="100%" stopColor="#0C3A8A" />
        </linearGradient>
      </defs>
      {/* W shape */}
      <polygon
        points="0,4 10,4 18,44 26,16 34,16 42,44 50,4 50,52 42,52 34,24 26,24 18,52 8,52"
        fill="url(#navWg)"
      />
      {/* D outer */}
      <path d="M50,4 L62,4 Q78,4 78,28 Q78,52 62,52 L50,52 Z" fill="url(#navWg)" />
      {/* D inner cutout */}
      <path d="M55,12 Q70,12 70,28 Q70,44 55,44 Z" fill="white" opacity="0.88" />
    </svg>
  )
}

export default async function Navbar() {
  const session = await getSession()
  return (
    <header
      className="text-white flex items-center justify-between no-print"
      style={{ background: '#0B1D3B', padding: '0 24px', height: '56px' }}
    >
      {/* 로고 + 브랜드 */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <WDLogo size={34} />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: '12px', fontWeight: 900, color: '#6CC2EE', letterSpacing: '0.12em' }}>
              WORLD MEMORY
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.03em' }}>
              매입검수 플랫폼
            </div>
          </div>
        </Link>

        {/* 구분선 */}
        <div style={{ width: '1px', height: '28px', background: '#1E3A5F' }} />

        {/* 내비게이션 */}
        <nav className="flex gap-5">
          <Link
            href="/"
            className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
          >
            매입건 목록
          </Link>
          {session?.role === 'ADMIN' && (
            <Link
              href="/orders/new"
              style={{ color: '#38BDF8', fontSize: '13px', fontWeight: 700 }}
              className="hover:opacity-80 transition-opacity"
            >
              + 신규 등록
            </Link>
          )}
        </nav>
      </div>

      {/* 사용자 정보 */}
      <div className="flex items-center gap-3">
        <span className="text-slate-400 text-xs">{session?.name}</span>
        <span
          className="text-xs px-2.5 py-0.5 rounded-full font-bold"
          style={session?.role === 'ADMIN'
            ? { background: '#1E40AF', color: '#93C5FD' }
            : { background: '#1E293B', color: '#64748B' }
          }
        >
          {session?.role === 'ADMIN' ? 'ADMIN' : 'INSPECTOR'}
        </span>
        <form action={logout}>
            <button className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            로그아웃
          </button>
        </form>
      </div>
    </header>
  )
}
