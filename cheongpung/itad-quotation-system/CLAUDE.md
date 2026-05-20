# Claude Code 작업 지침서

이 파일은 Claude Code가 이 프로젝트에서 작업할 때 따라야 할 규칙과 가이드라인을 정의합니다. 모든 코드 생성·수정 작업은 이 문서의 원칙을 우선합니다.

## 프로젝트 컨텍스트

ITAD(IT Asset Disposition) 매각 견적 자동화 시스템. 한국 B2B 시장 대상. 사용자는 코어테일 내부 영업담당자.

## 사양 문서 (반드시 참조)

작업 전 항상 관련 사양 문서를 먼저 읽고 시작합니다.

- `docs/01-workflow.md` — 전체 업무 플로우
- `docs/02-input-screen.md` — 입력 화면 UI 사양
- `docs/03-calculation.md` — **견적 산출 공식 (가장 중요)**
- `docs/04-result-screen.md` — 견적서 결과 화면
- `docs/05-database.md` — DB 스키마

## 기술 스택 (확정)

```
Frontend  : Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
Backend   : Next.js API Routes (Route Handlers)
Database  : PostgreSQL 15+
ORM       : Prisma
Auth      : NextAuth.js (이후 단계)
Charts    : Recharts
PDF       : Puppeteer (Phase 6)
Excel     : SheetJS (xlsx)
File parse: papaparse (CSV)
Validation: Zod
Forms     : react-hook-form
```

다른 라이브러리를 추가할 때는 반드시 이유를 설명하고 승인을 받으세요.

## 코딩 규칙

### 일반

- 모든 코드는 TypeScript로 작성. `any` 사용 금지. 불가피한 경우 `unknown` 사용 후 타입 가드.
- 변수·함수명은 영어, 주석과 사용자 화면 텍스트는 한국어.
- 통화 표시는 항상 `Intl.NumberFormat('ko-KR')` 사용. 천 단위 콤마 필수.
- 날짜는 `date-fns` 사용, 표시는 `yyyy-MM-dd` 형식.
- 금액 계산은 절대 `number` 부동소수점 연산 금지. `decimal.js` 또는 정수(원 단위) 사용.

### 파일 구조

```
src/
├── app/                       # Next.js App Router
│   ├── (dashboard)/          # 인증 후 화면 그룹
│   │   ├── quotations/       # 견적 관련 화면
│   │   ├── assets/           # 자산 마스터 관리
│   │   └── history/          # 이력 조회
│   ├── api/                  # API Routes
│   │   ├── quotations/
│   │   ├── assets/
│   │   └── customers/
│   └── layout.tsx
├── components/
│   ├── ui/                   # shadcn/ui 기본 컴포넌트
│   ├── quotation/            # 견적 관련 도메인 컴포넌트
│   └── layout/               # 헤더·사이드바
├── lib/
│   ├── prisma.ts             # Prisma 클라이언트 싱글톤
│   ├── calculation/          # 견적 산출 로직 (핵심)
│   │   ├── coefficients.ts   # C1~C5 계수
│   │   ├── base-price.ts     # 이력 기준가
│   │   ├── market-adjust.ts  # 시세 보정
│   │   ├── risk-buffer.ts    # 리스크 보수
│   │   └── quotation.ts      # 최종 견적가 계산
│   ├── matching/             # 모델명 정규화 매칭
│   └── utils.ts
└── types/
    └── quotation.ts          # 공통 타입
```

### 견적 계산 로직 규칙 (매우 중요)

견적 계산은 시스템의 핵심이므로 다음을 엄격히 지킵니다.

1. **계산 함수는 순수함수로 작성**. DB 조회와 계산을 분리. 테스트 가능해야 함.
2. **모든 중간 계산값을 반환**. 최종 견적가만 반환하지 말고, 적용된 모든 계수와 단계별 금액을 객체로 반환.
3. **계산 결과는 DB에 모두 저장**. `QuotationLine` 테이블의 c1~c4 컬럼에 적용 계수를 저장하여 역추적 가능하게 함.
4. **계수 테이블은 하드코딩 금지**. `Coefficient` 테이블 또는 별도 설정 파일로 분리하여 추후 변경 가능하게 함.
5. **단위 테스트 필수**. 계산 함수마다 최소 5개 케이스(정상/경계/이력없음/스펙미상/대량) 테스트.

### UI 규칙

- 모든 화면은 반응형 (최소 1280px, 권장 1440px+).
- 색상은 shadcn/ui 기본 토큰 사용. 커스텀 색상 정의 금지.
- 등급 표시는 일관된 색상 매핑: A=green, B=amber, C=red, 미상=gray.
- 금액 표시 컴포넌트는 `<CurrencyDisplay>` 공통 컴포넌트로 통일.
- 로딩 상태는 Skeleton 컴포넌트, 에러는 Alert 컴포넌트 사용.

### DB 규칙

- 모든 테이블에 `id`, `createdAt`, `updatedAt` 필수.
- 삭제는 soft delete (`deletedAt` 컬럼).
- 금액 컬럼은 `Decimal(15, 0)` (원 단위 정수, 천조원까지).
- 외래키는 항상 명시적 정의. CASCADE 신중히 사용.
- 인덱스: `BidRequest.customerId`, `AssetLine.bidRequestId`, `SalesHistory.assetMasterId + soldAt` 필수.

## 작업 진행 방식

### 새 기능 작업 시작 시 체크리스트

1. 관련 `docs/*.md` 파일을 먼저 읽기
2. 영향받는 DB 테이블 확인 (`docs/05-database.md`)
3. 작업 계획을 영근님에게 먼저 보고 (어떤 파일을 만들고 수정할지)
4. 승인 후 작업 시작
5. 작업 완료 후 변경된 파일 목록 보고

### 중요 결정 시 반드시 물어보기

- 견적 계산 공식 변경
- DB 스키마 변경 (마이그레이션 발생)
- 새 라이브러리 추가
- 기존 컴포넌트 인터페이스 변경

### 자동으로 진행해도 되는 작업

- 사양 문서대로 신규 화면 구현
- 타입 정의 추가
- 단위 테스트 작성
- 코드 리팩토링 (동작 변경 없는 한)
- 문서 업데이트

## 작업 우선순위 (Phase 1부터 순서대로)

### Phase 1: 기반 구축 (현재 단계)

작업 순서:

1. `pnpm create next-app@latest .` (또는 `npx`) — TypeScript, Tailwind, App Router, src 디렉토리 선택, ESLint 활성
2. shadcn/ui 초기화: `npx shadcn@latest init`
3. Prisma 설치 및 초기화: `pnpm add -D prisma && pnpm add @prisma/client && npx prisma init`
4. PostgreSQL 로컬 설정 (Docker Compose 권장)
5. `docs/05-database.md` 기준 Prisma 스키마 작성
6. 첫 마이그레이션 실행
7. 기본 레이아웃 (헤더 + 사이드바) 구현

각 단계 완료 후 영근님에게 확인 받고 다음으로.

## 도메인 용어 (헷갈리지 말 것)

| 용어 | 영문 | 정의 |
|---|---|---|
| 매각 요청 | BidRequest | 고객사가 매각하고 싶은 자산 리스트 1건 |
| 자산 라인 | AssetLine | 매각 요청 내의 개별 품목 행 |
| 자산 마스터 | AssetMaster | 표준화된 모델 사전 (정규화 기준) |
| 견적 | Quotation | 매각 요청에 대한 산출 결과 1건 |
| 견적 라인 | QuotationLine | 견적 내의 품목별 산출 결과 |
| 이력 기준가 | basePrice (P₀) | 과거 매각가 가중평균 |
| 등급 계수 | C1 (gradeCoefficient) | A/B/C 등급별 계수 |
| 연식 계수 | C2 (ageCoefficient) | 제조 연식별 계수 |
| 시세 계수 | C3 (marketCoefficient) | 시장 시세 대비 계수 |
| 지역 계수 | C4 (regionCoefficient) | 수도권/지방 계수 |
| 기관 계수 | C5 (customerCoefficient) | 고객사 낙찰률 기반 |
| 처리비용 | processingCost | 물류·파쇄·검수 비용 |
| 목표 마진 | targetMargin | 코어테일 영업 이익 |
| 리스크 보수 | riskBuffer | 불확실성 차감액 |
| 신뢰도 | confidenceScore | 산출 근거 충실도 (0~100) |

## 영근님에 대한 컨텍스트

- 19년차 B2B 영업·IT 유통 전문가
- 코어테일에서 NVIDIA DGX/AI 하드웨어 유통 담당
- 자체 블로그(소보로씨) 운영 중
- 코딩은 self-taught, HTML/Python/Git 기본 가능
- 비즈니스 맥락 이해도가 매우 높으므로, 도메인 설명보다는 기술 의사결정의 trade-off 설명에 집중할 것

## 절대 하지 말 것

- 사양 문서와 다른 임의 구현
- 견적 계산 로직을 단일 함수에 몰아넣기
- 금액을 `number` 타입의 부동소수점으로 계산
- 한국어 UI에 영어 텍스트 혼용 ("Save" 대신 "저장")
- 테스트 없이 견적 계산 로직 머지
- DB 마이그레이션을 무단 실행
- 영근님과 상의 없이 기술 스택 변경
