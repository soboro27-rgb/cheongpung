'use client'
import { useActionState } from 'react'
import { login } from '@/lib/actions/auth'

function WDLogo({ size = 80 }: { size?: number }) {
  const h = Math.round(size * 56 / 78)
  return (
    <svg width={size} height={h} viewBox="0 0 78 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="loginWg" x1="0" y1="0" x2="78" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7DD3F8" />
          <stop offset="40%" stopColor="#2196F3" />
          <stop offset="100%" stopColor="#0C3A8A" />
        </linearGradient>
      </defs>
      {/* W shape */}
      <polygon
        points="0,4 10,4 18,44 26,16 34,16 42,44 50,4 50,52 42,52 34,24 26,24 18,52 8,52"
        fill="url(#loginWg)"
      />
      {/* D outer */}
      <path d="M50,4 L62,4 Q78,4 78,28 Q78,52 62,52 L50,52 Z" fill="url(#loginWg)" />
      {/* D inner cutout */}
      <path d="M55,12 Q70,12 70,28 Q70,44 55,44 Z" fill="white" opacity="0.88" />
    </svg>
  )
}

const coreValues = [
  {
    title: '실용',
    desc: '매입단가표를 공개하여 안전하고 투명한 시스템으로 최상의 조건으로 거래합니다.',
  },
  {
    title: '순환',
    desc: '가치가 남아있는 제품을 선별하여 가치 극대화 이후 다시 시장으로 순환합니다.',
  },
  {
    title: '상생',
    desc: 'IT리사이클 유통시장 생태계를 조성하여 유익하고 건강한 가치를 창출합니다.',
  },
]

export default function LoginPage() {
  const [state, action, pending] = useActionState(
    async (_: { error?: string } | null, formData: FormData) => {
      const result = await login(formData)
      return result || null
    },
    null
  )

  return (
    <div className="min-h-screen flex">
      {/* ── 왼쪽: 브랜드 패널 ── */}
      <div
        className="hidden md:flex flex-col justify-between px-12 py-12"
        style={{
          flex: '0 0 58%',
          background: 'linear-gradient(160deg, #0D2248 0%, #091730 60%, #071020 100%)',
        }}
      >
        {/* 상단: 로고 + 브랜드명 */}
        <div>
          <div className="flex items-center gap-4 mb-10">
            <WDLogo size={72} />
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#7DD3F8', letterSpacing: '0.15em' }}>
                WORLD MEMORY
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', letterSpacing: '0.12em', marginTop: '2px' }}>
                WORLDWIDE MEMORY CO., LTD.
              </div>
            </div>
          </div>

          <div style={{ width: '48px', height: '3px', background: 'linear-gradient(90deg, #2196F3, #7DD3F8)', borderRadius: '2px', marginBottom: '24px' }} />

          <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#F1F5F9', lineHeight: 1.3, marginBottom: '8px' }}>
            매입검수 플랫폼
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>
            WWM Inspection System v2 — 검수 데이터 관리 및<br />
            QR 라벨 출력 통합 플랫폼
          </p>
        </div>

        {/* 중간: Core Values */}
        <div>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '20px', fontWeight: 600, letterSpacing: '0.05em' }}>
            월드메모리가 추구하는 Core Value는 &lsquo;정직&rsquo;과 &lsquo;신뢰&rsquo;입니다.
          </p>
          <div className="flex gap-4">
            {coreValues.map(v => (
              <div
                key={v.title}
                style={{
                  flex: 1,
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                {/* 제목 원형 배지 영역 */}
                <div
                  style={{
                    background: '#0B2A5A',
                    padding: '16px 12px 14px',
                    textAlign: 'center',
                    borderBottom: '2px solid #1E3A6E',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1565C0, #0D3B80)',
                      border: '2px solid #2196F3',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: 900, color: '#E0F2FE' }}>{v.title}</span>
                  </div>
                </div>
                {/* 설명 */}
                <div
                  style={{
                    background: '#0F2040',
                    padding: '12px',
                    border: '1px solid #1E3A6E',
                    borderTop: 'none',
                    borderRadius: '0 0 12px 12px',
                  }}
                >
                  <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.65, textAlign: 'center' }}>
                    {v.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 하단: 저작권 */}
        <div style={{ fontSize: '11px', color: '#334155' }}>
          © {new Date().getFullYear()} 월드와이드메모리(주). All rights reserved.
        </div>
      </div>

      {/* ── 오른쪽: 로그인 폼 ── */}
      <div
        className="flex flex-col items-center justify-center px-10 py-12"
        style={{
          flex: 1,
          background: '#F8FAFC',
          minWidth: 0,
        }}
      >
        {/* 모바일용 로고 */}
        <div className="md:hidden flex flex-col items-center mb-8">
          <WDLogo size={60} />
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#1565C0', letterSpacing: '0.12em' }}>WORLD MEMORY</div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>매입검수 플랫폼</div>
          </div>
        </div>

        <div className="w-full" style={{ maxWidth: '360px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginBottom: '6px' }}>로그인</h1>
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>계정 정보를 입력하여 시스템에 접속하세요</p>
          </div>

          <form action={action}>
            {state?.error && (
              <div
                className="mb-5 p-3.5 rounded-xl text-sm"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
              >
                {state.error}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', letterSpacing: '0.04em' }}
              >
                아이디
              </label>
              <input
                name="loginId"
                type="text"
                required
                autoFocus
                placeholder="로그인 아이디"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #E2E8F0',
                  fontSize: '14px',
                  color: '#1E293B',
                  background: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#2196F3')}
                onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', letterSpacing: '0.04em' }}
              >
                비밀번호
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #E2E8F0',
                  fontSize: '14px',
                  color: '#1E293B',
                  background: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#2196F3')}
                onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '10px',
                background: pending ? '#93C5FD' : 'linear-gradient(135deg, #1976D2, #1565C0)',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 800,
                border: 'none',
                cursor: pending ? 'not-allowed' : 'pointer',
                letterSpacing: '0.04em',
                boxShadow: '0 4px 14px rgba(21, 101, 192, 0.35)',
                transition: 'opacity 0.15s',
              }}
            >
              {pending ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div
            style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid #E2E8F0',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '11px', color: '#CBD5E1', lineHeight: 1.7 }}>
              WWM Inspection System v2<br />
              <span style={{ color: '#E2E8F0' }}>월드와이드메모리(주)</span> 전용 시스템입니다.<br />
              계정 문의는 시스템 관리자에게 연락하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
