# 05. 데이터베이스 스키마

PostgreSQL + Prisma ORM 사용. 이 문서의 스키마를 그대로 `prisma/schema.prisma`로 옮길 수 있도록 작성.

## 전체 관계 요약

```
CUSTOMER ───┬──< BID_REQUEST ──< ASSET_LINE >── ASSET_MASTER ──< SALES_HISTORY
            │                                                ──< BID_HISTORY
            │                                                ──< MARKET_PRICE
            └──< BID_REQUEST ── QUOTATION ──< QUOTATION_LINE
                                          └──< APPROVAL_LOG

USER ──< BID_REQUEST (sales_rep)
     ──< APPROVAL_LOG (approver)
```

## Prisma 스키마

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// 마스터 데이터
// ============================================================

model Customer {
  id          BigInt   @id @default(autoincrement())
  name        String   @db.VarChar(200)
  sector      Sector
  region      Region
  taxId       String?  @unique @db.VarChar(20) @map("tax_id")
  contactName String?  @db.VarChar(100) @map("contact_name")
  contactEmail String? @db.VarChar(200) @map("contact_email")
  contactPhone String? @db.VarChar(50) @map("contact_phone")

  winRate     Float    @default(0) @map("win_rate")
  totalDeals  Int      @default(0) @map("total_deals")

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  bidRequests   BidRequest[]
  salesHistories SalesHistory[]
  bidHistories  BidHistory[]

  @@index([sector])
  @@index([region])
  @@map("customers")
}

model AssetMaster {
  id               BigInt   @id @default(autoincrement())
  category         AssetCategory
  brand            String   @db.VarChar(100)
  modelCode        String   @unique @db.VarChar(100) @map("model_code")
  modelDisplayName String   @db.VarChar(200) @map("model_display_name")
  specSummary      String?  @db.VarChar(500) @map("spec_summary")
  specJson         Json?    @map("spec_json")

  releaseYear      Int?     @map("release_year")
  retailPriceKrw   Decimal? @db.Decimal(15, 0) @map("retail_price_krw")
  depreciationRate Float    @default(0.20) @map("depreciation_rate")
  lifecycleMonths  Int      @default(60) @map("lifecycle_months")

  aliases          String[] @default([])

  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  assetLines       AssetLine[]
  salesHistories   SalesHistory[]
  bidHistories     BidHistory[]
  marketPrices     MarketPrice[]

  @@index([category])
  @@index([brand])
  @@index([modelCode])
  @@map("asset_masters")
}

model User {
  id           BigInt   @id @default(autoincrement())
  email        String   @unique @db.VarChar(200)
  name         String   @db.VarChar(100)
  role         UserRole @default(SALES_REP)
  isActive     Boolean  @default(true) @map("is_active")

  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  bidRequests  BidRequest[] @relation("SalesRep")
  approvalLogs ApprovalLog[]

  @@map("users")
}

// ============================================================
// 거래 트랜잭션
// ============================================================

model BidRequest {
  id           BigInt   @id @default(autoincrement())
  customerId   BigInt   @map("customer_id")
  salesRepId   BigInt   @map("sales_rep_id")

  bidType      BidType  @map("bid_type")
  pickupDate   DateTime @map("pickup_date") @db.Date
  pickupRegion Region   @map("pickup_region")
  dataErasure  DataErasure @map("data_erasure")
  leadTimeDays Int      @default(14) @map("lead_time_days")

  notes        String?  @db.Text

  status       BidRequestStatus @default(DRAFT)

  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  customer     Customer @relation(fields: [customerId], references: [id])
  salesRep     User     @relation("SalesRep", fields: [salesRepId], references: [id])
  assetLines   AssetLine[]
  quotations   Quotation[]

  @@index([customerId])
  @@index([salesRepId])
  @@index([status])
  @@map("bid_requests")
}

model AssetLine {
  id               BigInt   @id @default(autoincrement())
  bidRequestId     BigInt   @map("bid_request_id")
  assetMasterId    BigInt?  @map("asset_master_id")

  rawModelName     String   @db.VarChar(300) @map("raw_model_name")
  category         AssetCategory
  manufactureYear  Int?     @map("manufacture_year")
  grade            Grade    @default(UNKNOWN)
  quantity         Int

  matchStatus      MatchStatus @default(PENDING) @map("match_status")
  matchScore       Float?   @map("match_score")
  matchNote        String?  @db.Text @map("match_note")

  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  bidRequest       BidRequest @relation(fields: [bidRequestId], references: [id], onDelete: Cascade)
  assetMaster      AssetMaster? @relation(fields: [assetMasterId], references: [id])
  quotationLines   QuotationLine[]

  @@index([bidRequestId])
  @@index([assetMasterId])
  @@index([matchStatus])
  @@map("asset_lines")
}

// ============================================================
// 이력·시세 (학습 베이스)
// ============================================================

model SalesHistory {
  id            BigInt   @id @default(autoincrement())
  assetMasterId BigInt   @map("asset_master_id")
  customerId    BigInt?  @map("customer_id")

  unitPrice     Decimal  @db.Decimal(15, 0) @map("unit_price")
  quantity      Int
  grade         Grade
  yearDiff      Int      @map("year_diff")
  region        Region

  soldAt        DateTime @map("sold_at") @db.Date
  source        String?  @db.VarChar(100)

  createdAt     DateTime @default(now()) @map("created_at")

  assetMaster   AssetMaster @relation(fields: [assetMasterId], references: [id])
  customer      Customer?   @relation(fields: [customerId], references: [id])

  @@index([assetMasterId, soldAt])
  @@index([customerId])
  @@map("sales_histories")
}

model BidHistory {
  id            BigInt   @id @default(autoincrement())
  assetMasterId BigInt   @map("asset_master_id")
  customerId    BigInt   @map("customer_id")

  bidPrice      Decimal  @db.Decimal(15, 0) @map("bid_price")
  wonPrice      Decimal? @db.Decimal(15, 0) @map("won_price")
  isWinner      Boolean  @default(false) @map("is_winner")
  bidderCount   Int?     @map("bidder_count")

  bidDate       DateTime @map("bid_date") @db.Date

  createdAt     DateTime @default(now()) @map("created_at")

  assetMaster   AssetMaster @relation(fields: [assetMasterId], references: [id])
  customer      Customer    @relation(fields: [customerId], references: [id])

  @@index([assetMasterId, bidDate])
  @@index([customerId])
  @@map("bid_histories")
}

model MarketPrice {
  id            BigInt   @id @default(autoincrement())
  assetMasterId BigInt   @map("asset_master_id")

  source        MarketSource
  price         Decimal  @db.Decimal(15, 0)
  currency      String   @default("KRW") @db.VarChar(3)
  trend         MarketTrend @default(STABLE)

  snapshotAt    DateTime @map("snapshot_at")

  createdAt     DateTime @default(now()) @map("created_at")

  assetMaster   AssetMaster @relation(fields: [assetMasterId], references: [id])

  @@index([assetMasterId, snapshotAt])
  @@map("market_prices")
}

// ============================================================
// 견적
// ============================================================

model Quotation {
  id              BigInt   @id @default(autoincrement())
  quotationNumber String   @unique @db.VarChar(50) @map("quotation_number")
  bidRequestId    BigInt   @map("bid_request_id")

  baseAmount      Decimal  @db.Decimal(15, 0) @map("base_amount")
  marketAdjustment Decimal @db.Decimal(15, 0) @map("market_adjustment")
  costTotal       Decimal  @db.Decimal(15, 0) @map("cost_total")
  costLogistics   Decimal  @db.Decimal(15, 0) @map("cost_logistics")
  costErasure     Decimal  @db.Decimal(15, 0) @map("cost_erasure")
  costInspection  Decimal  @db.Decimal(15, 0) @map("cost_inspection")

  marginRate      Float    @map("margin_rate")
  marginAmount    Decimal  @db.Decimal(15, 0) @map("margin_amount")
  riskBufferRate  Float    @map("risk_buffer_rate")
  riskBufferAmount Decimal @db.Decimal(15, 0) @map("risk_buffer_amount")

  finalAmount     Decimal  @db.Decimal(15, 0) @map("final_amount")
  confidenceScore Int      @map("confidence_score")

  validUntil      DateTime @map("valid_until") @db.Date

  status          QuotationStatus @default(CALCULATED)

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  bidRequest      BidRequest @relation(fields: [bidRequestId], references: [id])
  quotationLines  QuotationLine[]
  approvalLogs    ApprovalLog[]

  @@index([bidRequestId])
  @@index([status])
  @@map("quotations")
}

model QuotationLine {
  id               BigInt   @id @default(autoincrement())
  quotationId      BigInt   @map("quotation_id")
  assetLineId      BigInt   @map("asset_line_id")

  basePrice        Decimal  @db.Decimal(15, 0) @map("base_price")

  c1Grade          Float    @map("c1_grade")
  c2Age            Float    @map("c2_age")
  c3Market         Float    @map("c3_market")
  c4Region         Float    @map("c4_region")
  c5Customer       Float    @map("c5_customer")

  finalUnitPrice   Decimal  @db.Decimal(15, 0) @map("final_unit_price")
  quantity         Int
  subtotal         Decimal  @db.Decimal(15, 0)

  historyCount     Int      @map("history_count")
  matchScore       Float    @map("match_score")

  createdAt        DateTime @default(now()) @map("created_at")

  quotation        Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  assetLine        AssetLine @relation(fields: [assetLineId], references: [id])

  @@index([quotationId])
  @@index([assetLineId])
  @@map("quotation_lines")
}

model ApprovalLog {
  id            BigInt   @id @default(autoincrement())
  quotationId   BigInt   @map("quotation_id")
  approverId    BigInt   @map("approver_id")
  approverRole  UserRole @map("approver_role")

  action        ApprovalAction
  comment       String?  @db.Text

  actedAt       DateTime @default(now()) @map("acted_at")

  quotation     Quotation @relation(fields: [quotationId], references: [id])
  approver      User      @relation(fields: [approverId], references: [id])

  @@index([quotationId])
  @@map("approval_logs")
}

// ============================================================
// Enums
// ============================================================

enum AssetCategory {
  LAPTOP
  DESKTOP
  SERVER
  MONITOR
  NETWORK
  STORAGE
  GPU
  OTHER
}

enum Grade {
  A
  B
  C
  DEFECTIVE
  UNKNOWN
}

enum BidType {
  PUBLIC
  DESIGNATED
  PRIVATE
}

enum Region {
  SEOUL
  CHUNGCHEONG
  YEONGNAM
  HONAM
  GANGWON_JEJU
}

enum DataErasure {
  PHYSICAL
  SOFTWARE
  NONE
}

enum Sector {
  FINANCIAL
  PUBLIC
  EDUCATION
  HEALTHCARE
  CORPORATE
  OTHER
}

enum MatchStatus {
  PENDING
  EXACT
  SIMILAR
  CATEGORY_AVG
  UNMATCHED
}

enum MarketSource {
  DANAWA
  AUCTION
  GMARKET
  EBAY
  MANUAL
}

enum MarketTrend {
  UP
  STABLE
  DOWN
}

enum BidRequestStatus {
  DRAFT
  IN_PROGRESS
  CALCULATED
  SUBMITTED
  WON
  LOST
  CANCELLED
}

enum QuotationStatus {
  DRAFT
  CALCULATED
  PENDING_APPROVAL
  APPROVED
  REJECTED
  EXPIRED
}

enum UserRole {
  SALES_REP
  TEAM_LEADER
  DIRECTOR
  ADMIN
}

enum ApprovalAction {
  SUBMITTED
  APPROVED
  REJECTED
  COMMENTED
  REVOKED
}
```

## 마이그레이션 순서

```bash
# 1. PostgreSQL 데이터베이스 생성
createdb itad_quotation

# 2. .env 파일에 DATABASE_URL 설정
DATABASE_URL="postgresql://user:password@localhost:5432/itad_quotation"

# 3. 첫 마이그레이션
pnpm prisma migrate dev --name init

# 4. Prisma 클라이언트 생성
pnpm prisma generate
```

## 시드 데이터 (Phase 2에서 생성)

### 1. 사용자
- 영업담당자 3명 (계영근 외 2명)
- 팀장 1명
- 본부장 1명
- 관리자 1명

### 2. 자산 마스터 (대표 모델 100여 종)

카테고리별 분포:
- 노트북: 30종 (LG gram, Samsung Galaxy Book, HP EliteBook 등)
- 데스크탑: 25종 (HP ProDesk, Dell OptiPlex, Lenovo ThinkCentre 등)
- 서버: 20종 (Dell PowerEdge, HPE ProLiant, Lenovo ThinkSystem 등)
- 모니터: 10종
- 네트워크/스토리지: 10종
- GPU: 5종 (RTX 5090, RTX A6000 등)

### 3. 고객사 (대표 15곳)
- 새마을금고 중앙회/지역연합회
- 시중은행 (국민·우리·신한·하나)
- 공공기관 (행안부 산하 등)
- 대기업 (SK·LG·삼성 계열)

### 4. 매각 거래 이력 (500건 이상)
- 최근 24개월 분포
- 각 자산 마스터당 평균 5건 이상
- 가격대는 실제 시장가 기준

### 5. 시세 데이터 (자산당 30일치)

## 인덱스 전략

성능에 중요한 쿼리:

```sql
-- 이력 기준가 산출 쿼리 (가장 빈번)
SELECT * FROM sales_histories
WHERE asset_master_id = ? AND sold_at >= ?
ORDER BY sold_at DESC;
-- 인덱스: (asset_master_id, sold_at)

-- 모델 매칭 검색
SELECT * FROM asset_masters
WHERE model_code LIKE ? OR ? = ANY(aliases);
-- 인덱스: model_code, aliases (GIN)

-- 고객사 거래 통계
SELECT * FROM bid_histories
WHERE customer_id = ?;
-- 인덱스: customer_id
```

추가 인덱스 검토 시점: 데이터 1만 건 이상 누적 후.

## 백업 정책

- 일일 자동 백업 (PostgreSQL pg_dump)
- 주간 풀백업 (오프사이트 보관)
- 견적 데이터는 영구 보관 (감사 추적용)
- `deletedAt`이 채워진 레코드도 1년간 유지

## 향후 확장 고려사항

- 다국가 통화 지원 (`currency` 컬럼 추가됨)
- 자산 사진 첨부 (`AssetLine.photos` 배열 추가 가능)
- 견적 버전 관리 (`Quotation.version` 컬럼 추가)
- 자동 학습 모델 결과 저장 (`Quotation.mlAdjustment` 컬럼)
