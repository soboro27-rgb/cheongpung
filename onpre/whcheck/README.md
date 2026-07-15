# whcheck — 카카오 알림톡 기반 배송 주소 검증 플랫폼

## 개요

whcheck는 카카오 알림톡을 통해 수취인에게 배송 주소 확인/수정을 요청하고, 그 결과를 웹훅 또는 구글 시트로 전달하는 플랫폼입니다.

### 핵심 설계 원칙 — 개인정보 무저장(No-PII-Storage)

- **이름, 전화번호, 주소**는 우리 서버 DB에 절대 영구 저장되지 않습니다.
- 업로드 시 PII는 AES-256-GCM으로 암호화되어 **Redis에 TTL(캠페인 만료일까지)** 만 보관됩니다.
- 수취인이 응답하거나 TTL이 만료되면 Redis에서 즉시 삭제됩니다.
- DB(PostgreSQL)에는 토큰, 상태, 타임스탬프, 전화번호 해시(SHA-256), 마스킹된 전화번호만 저장됩니다.

---

## 기술 스택

| 항목 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| DB | PostgreSQL + Prisma |
| PII 임시 저장 | Redis (ioredis) |
| 암호화 | AES-256-GCM (Node.js crypto) |
| 인증 | JWT (jose) + HttpOnly 쿠키 |
| 알림톡 | Solapi (개발: MockAdapter) |
| 회신 저장 | 웹훅(HMAC 서명) / 구글 시트 |
| CSS | Tailwind CSS v4 |
| 엑셀 | exceljs |

---

## 빠른 시작

### 1. 패키지 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
# .env.local을 열어 DATABASE_URL, REDIS_URL, PII_ENCRYPTION_KEY 등을 실제 값으로 채우세요.
```

`PII_ENCRYPTION_KEY`는 64자리 16진수(32바이트) 랜덤 값이어야 합니다:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. DB 스키마 적용

```bash
pnpm db:push
```

### 4. 관리자 계정 생성 (시드)

```bash
pnpm seed
# 기본값: admin@whcheck.io / whcheck2024!
# .env.local의 ADMIN_EMAIL, ADMIN_PASSWORD로 커스텀 가능
```

### 5. 개발 서버 실행

```bash
pnpm dev
# http://localhost:3000 → /admin 으로 리다이렉트됩니다.
```

---

## 사용 흐름

1. **관리자 로그인** `/admin/login`
2. **캠페인 생성** — 만료일, 회신 저장소(웹훅 or 구글 시트) 설정
3. **수취인 명단 업로드** — Excel 템플릿 다운로드 후 이름/전화번호/주소 입력해 업로드
   - PII는 Redis에만 저장되고 DB에는 토큰·해시만 기록됩니다.
4. **알림톡 발송** — 수취인 전화번호로 주소 확인 링크 발송
5. **수취인 응답** `/r/[token]` — 전화번호 끝 4자리 인증 후 주소 확인 또는 수정
6. **결과 전달** — 응답 즉시 웹훅/구글 시트로 전송, Redis에서 PII 파기

---

## 환경 변수 설명

| 변수 | 설명 |
|---|---|
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `REDIS_URL` | Redis 연결 URL |
| `PII_ENCRYPTION_KEY` | 64자리 hex (AES-256 키) |
| `PHONE_HASH_SALT` | 전화번호 해시 솔트 |
| `JWT_SECRET` | 세션 JWT 서명 키 |
| `NEXT_PUBLIC_BASE_URL` | 배포 도메인 (알림톡 링크에 사용) |
| `ADMIN_EMAIL` | 시드 관리자 이메일 |
| `ADMIN_PASSWORD` | 시드 관리자 비밀번호 |
| `ALIMTALK_MOCK` | `true`이면 실제 발송 안 함 (개발용) |
| `SOLAPI_API_KEY` | Solapi API 키 |
| `SOLAPI_API_SECRET` | Solapi API 시크릿 |
| `SOLAPI_PF_ID` | 카카오 발신프로필 ID |
| `ALIMTALK_TEMPLATE_ID` | 알림톡 템플릿 ID |
| `ALIMTALK_TEMPLATE_CODE` | 알림톡 템플릿 코드 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | 구글 서비스 계정 JSON (구글 시트 회신 시) |
