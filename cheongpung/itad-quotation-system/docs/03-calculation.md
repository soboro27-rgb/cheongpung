# 03. 견적 산출 공식

이 문서는 시스템의 핵심 비즈니스 로직을 정의합니다. 모든 견적 계산 코드는 이 문서를 100% 준수해야 합니다.

## 최종 공식 (요약)

```
[품목별]
  단위 견적가 = P₀ × C₁ × C₂ × C₃ × C₄ × C₅
  품목 소계 = 단위 견적가 × 수량

[전체]
  품목 합계 = Σ(품목 소계)
  최종 견적가 = 품목 합계 − 처리비용 − 목표마진 − 리스크보수
```

## 변수 정의

| 변수 | 명칭 | 산출 방법 | 범위 |
|---|---|---|---|
| P₀ | 이력 기준가 | 과거 매각가 시간가중평균 | 양의 정수 (원) |
| C₁ | 등급 계수 | 자산 상태별 고정값 | 0.15 ~ 1.00 |
| C₂ | 연식 계수 | 제조 연식별 고정값 | 0.25 ~ 1.00 |
| C₃ | 시세 계수 | 외부 시세 트렌드 기반 | 0.80 ~ 1.15 |
| C₄ | 지역 계수 | 반입 지역별 고정값 | 0.88 ~ 1.00 |
| C₅ | 기관 계수 | 고객사 낙찰률 기반 | 0.95 ~ 1.05 |

## ① 이력 기준가 P₀

### 산출 함수

```typescript
async function calculateBasePrice(
  assetMasterId: number,
  windowMonths: number = 12,
  customerId?: number
): Promise<{ price: number; sampleCount: number; confidence: number }> {
  // 1. 동일 AssetMaster의 SalesHistory 조회
  const histories = await prisma.salesHistory.findMany({
    where: {
      assetMasterId,
      soldAt: { gte: subMonths(new Date(), windowMonths) }
    }
  });

  // 2. 시간가중치 계산 (최근일수록 높게)
  // weight = exp(-elapsedDays / 180)  (180일 반감기)
  const now = new Date();
  const weighted = histories.map(h => {
    const daysAgo = differenceInDays(now, h.soldAt);
    const timeWeight = Math.exp(-daysAgo / 180);
    const customerWeight = (customerId && h.customerId === customerId) ? 1.5 : 1.0;
    return {
      price: h.unitPrice,
      weight: timeWeight * customerWeight
    };
  });

  // 3. 가중평균
  const totalWeight = weighted.reduce((s, x) => s + x.weight, 0);
  const totalValue = weighted.reduce((s, x) => s + x.price * x.weight, 0);
  const price = totalWeight > 0 ? Math.round(totalValue / totalWeight) : 0;

  // 4. 신뢰도 (샘플 수 + 가중치 합)
  const confidence = Math.min(100, histories.length * 5 + totalWeight * 10);

  return { price, sampleCount: histories.length, confidence };
}
```

### 폴백 정책

샘플 수가 부족할 때의 단계적 폴백:

1. **정확한 모델 매칭** (`assetMasterId` 완전 일치): 5건 이상이면 사용
2. **유사 스펙 매칭** (동일 카테고리·세대): 1차에서 미달 시
3. **카테고리 평균** (LAPTOP/DESKTOP/SERVER): 2차에서 미달 시
4. **모두 실패**: 영업담당자에게 수동 입력 요청

각 폴백 단계마다 신뢰도가 감소합니다 (-20, -40, -60 점).

## ② 등급 계수 C₁

### 고정값 테이블

| 등급 | 계수 | 정의 |
|---|---|---|
| A | 1.00 | 미사용 또는 사용감 거의 없음, 외관·기능 모두 정상 |
| B | 0.75 | 일반 사용감 있음, 기능 정상 |
| C | 0.45 | 외관 손상 또는 일부 기능 이상, 부품 활용 가능 |
| 불량 | 0.15 | 파손, 기능 불가, 자재 가치만 |
| 미상 (?) | 0.50 | 등급 미확인, 보수적 계수 적용 + 리스크 보수 가산 |

### 구현

```typescript
const GRADE_COEFFICIENTS = {
  A: 1.00,
  B: 0.75,
  C: 0.45,
  DEFECTIVE: 0.15,
  UNKNOWN: 0.50,
} as const;

function getGradeCoefficient(grade: Grade): number {
  return GRADE_COEFFICIENTS[grade];
}
```

**중요**: 등급 계수 변경 시 모든 견적 재계산 영향이 크므로, 변경은 운영팀 승인 필수.

## ③ 연식 계수 C₂

### 산출 방식

제조 연식과 견적 산출 시점의 차이(연수)로 계산.

| 연수 차이 | 계수 | 비고 |
|---|---|---|
| 0년 (당해년도) | 1.00 | |
| 1년 | 0.85 | |
| 2년 | 0.70 | |
| 3년 | 0.55 | |
| 4년 | 0.45 | |
| 5년 | 0.35 | |
| 6년 이상 | 0.25 | 자재 가치 수준 |
| 미상 | 0.40 | 보수적 적용 |

### 구현

```typescript
function getAgeCoefficient(manufactureYear: number | null): number {
  if (manufactureYear === null) return 0.40;
  const ageYears = new Date().getFullYear() - manufactureYear;
  const table = [1.00, 0.85, 0.70, 0.55, 0.45, 0.35, 0.25];
  return table[Math.min(ageYears, 6)];
}
```

**카테고리별 보정** (Phase 2 이후):
- 서버 장비는 감가가 완만 (계수에 +0.05)
- 노트북은 감가가 빠름 (계수에 -0.05)

## ④ 시세 계수 C₃

### 산출 방식

외부 시세 (다나와, eBay 등)의 최근 30일 트렌드 분석.

```typescript
async function getMarketCoefficient(
  assetMasterId: number
): Promise<{ coefficient: number; trend: 'UP' | 'STABLE' | 'DOWN'; source: string }> {
  // 1. 최근 30일 시세 스냅샷 조회
  const snapshots = await prisma.marketPrice.findMany({
    where: {
      assetMasterId,
      snapshotAt: { gte: subDays(new Date(), 30) }
    },
    orderBy: { snapshotAt: 'asc' }
  });

  if (snapshots.length < 3) {
    // 데이터 부족 시 중립값
    return { coefficient: 1.00, trend: 'STABLE', source: 'insufficient_data' };
  }

  // 2. 선형 회귀로 추세 계산
  const slope = calculateLinearRegressionSlope(snapshots);
  const avgPrice = snapshots.reduce((s, x) => s + x.price, 0) / snapshots.length;
  const trendRate = slope / avgPrice;  // 일평균 변화율

  // 3. 30일 누적 변화율을 계수로 변환
  const totalChange = trendRate * 30;

  let coefficient: number;
  let trend: 'UP' | 'STABLE' | 'DOWN';

  if (totalChange > 0.05) {
    coefficient = Math.min(1.15, 1.00 + totalChange);
    trend = 'UP';
  } else if (totalChange < -0.05) {
    coefficient = Math.max(0.80, 1.00 + totalChange);
    trend = 'DOWN';
  } else {
    coefficient = 1.00 + totalChange;  // 0.95 ~ 1.05
    trend = 'STABLE';
  }

  return { coefficient, trend, source: snapshots[0].source };
}
```

### 시세 데이터 소스

| 소스 | 가중치 | 수집 방법 |
|---|---|---|
| 다나와 중고 | 0.5 | 일일 크롤링 |
| 옥션·G마켓 | 0.3 | 일일 크롤링 |
| eBay (해외) | 0.2 | API |

수집 실패 시 직전 캐시 사용 (최대 7일).

## ⑤ 지역 계수 C₄

### 고정값 테이블

| 지역 | 계수 | 이유 |
|---|---|---|
| 수도권 (서울·경기·인천) | 1.00 | 기준 |
| 충청권 | 0.97 | 물류비 +3% |
| 영남권 | 0.95 | 물류비 +5% |
| 호남권 | 0.93 | 물류비 +7% |
| 강원·제주 | 0.88 | 물류비 +12%, 처리 인프라 부족 |

## ⑥ 기관 계수 C₅

### 산출 방식

고객사의 과거 낙찰률을 기반으로 계산.

```typescript
async function getCustomerCoefficient(customerId: number): Promise<number> {
  const winRate = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { winRate: true, totalDeals: true }
  });

  // 거래 이력 5건 미만이면 중립
  if (!winRate || winRate.totalDeals < 5) return 1.00;

  // 낙찰률 50% 기준으로 ±0.05 조정
  if (winRate.winRate >= 0.80) return 1.05;
  if (winRate.winRate >= 0.60) return 1.02;
  if (winRate.winRate >= 0.40) return 1.00;
  if (winRate.winRate >= 0.20) return 0.97;
  return 0.95;
}
```

## ⑦ 품목 합산

```typescript
function calculateLineSubtotal(line: AssetLine, coefficients: Coefficients): number {
  const unitPrice = line.basePrice
    * coefficients.c1
    * coefficients.c2
    * coefficients.c3
    * coefficients.c4
    * coefficients.c5;

  return Math.round(unitPrice * line.quantity);
}

function calculateLinesTotal(lines: CalculatedLine[]): number {
  return lines.reduce((sum, line) => sum + line.subtotal, 0);
}
```

## ⑧ 처리비용 (Processing Cost)

```typescript
interface ProcessingCostInput {
  totalUnits: number;
  region: Region;
  dataErasure: 'PHYSICAL' | 'SOFTWARE' | 'NONE';
  hasServers: boolean;
}

function calculateProcessingCost(input: ProcessingCostInput): {
  logistics: number;
  erasure: number;
  inspection: number;
  total: number;
} {
  // 1. 물류비
  const logisticsPerUnit = {
    SEOUL: 5000,
    CHUNGCHEONG: 7000,
    YEONGNAM: 9000,
    HONAM: 11000,
    GANGWON_JEJU: 15000,
  };
  let logistics = logisticsPerUnit[input.region] * input.totalUnits;
  if (input.hasServers) logistics *= 1.5; // 서버 운송 가산

  // 2. 데이터 삭제 비용
  const erasureCost = {
    PHYSICAL: 6000,
    SOFTWARE: 3000,
    NONE: 0,
  };
  const erasure = erasureCost[input.dataErasure] * input.totalUnits;

  // 3. 검수·보관 인건비 (대당 고정)
  const inspection = 3500 * input.totalUnits;

  return {
    logistics,
    erasure,
    inspection,
    total: logistics + erasure + inspection,
  };
}
```

## ⑨ 목표 마진 (Target Margin)

```typescript
function calculateTargetMargin(
  linesTotal: number,
  marketAdjustment: number,
  marginRate: number,  // 사용자 설정 (기본 0.12)
  options: { hasLargeServers: boolean; isSmallOrder: boolean }
): number {
  let adjustedRate = marginRate;

  // 대형 서버 포함 시 마진 +2%p
  if (options.hasLargeServers) adjustedRate += 0.02;

  // 소액 주문 (1천만원 미만) 시 마진 -2%p
  if (options.isSmallOrder) adjustedRate -= 0.02;

  // 마진 범위 제한
  adjustedRate = Math.max(0.05, Math.min(0.25, adjustedRate));

  return Math.round((linesTotal + marketAdjustment) * adjustedRate);
}
```

## ⑩ 리스크 보수 (Risk Buffer)

```typescript
interface RiskFactors {
  averageHistoryCount: number;  // 품목 평균 이력 건수
  unknownSpecRatio: number;     // 스펙 미상 비율 (0~1)
  marketVolatility: number;     // 시세 변동성 (0~1)
}

function calculateRiskBuffer(
  linesTotal: number,
  factors: RiskFactors,
  userRiskRate: number  // 사용자 설정 (기본 0.05)
): number {
  let riskRate = userRiskRate;

  // 이력 부족
  if (factors.averageHistoryCount < 5) riskRate += 0.05;
  else if (factors.averageHistoryCount < 10) riskRate += 0.02;

  // 스펙 미상 비중
  riskRate += factors.unknownSpecRatio * 0.10;

  // 시세 변동성
  riskRate += factors.marketVolatility * 0.05;

  // 최대 20%로 제한
  riskRate = Math.min(0.20, riskRate);

  return Math.round(linesTotal * riskRate);
}
```

## 신뢰도 점수 (Confidence Score)

```typescript
function calculateConfidenceScore(input: {
  totalHistoryCount: number;      // 전 품목 이력 합계
  marketDataFreshness: number;    // 시세 데이터 최신성 (일)
  matchAccuracy: number;          // 매칭 정확도 평균 (0~1)
  unknownSpecRatio: number;       // 스펙 미상 비율
}): number {
  let score = 0;

  // 이력 풍부도 (40점 만점)
  score += Math.min(40, input.totalHistoryCount * 0.5);

  // 시세 신선도 (20점 만점)
  if (input.marketDataFreshness <= 1) score += 20;
  else if (input.marketDataFreshness <= 7) score += 15;
  else if (input.marketDataFreshness <= 30) score += 8;

  // 매칭 정확도 (30점 만점)
  score += input.matchAccuracy * 30;

  // 스펙 명확성 (10점 만점)
  score += (1 - input.unknownSpecRatio) * 10;

  return Math.round(Math.min(100, score));
}
```

### 신뢰도 등급

| 점수 | 등급 | 표시 색상 |
|---|---|---|
| 80~100 | 매우 높음 | green |
| 60~79 | 높음 | green |
| 40~59 | 보통 | amber |
| 20~39 | 낮음 | red |
| 0~19 | 매우 낮음 | red |

## 전체 견적 산출 통합 함수

```typescript
interface QuotationInput {
  bidRequestId: number;
  options: {
    targetMarginRate: number;
    historyWindowMonths: 6 | 12 | 24 | 0;  // 0 = all
    marketAdjustMode: 'AUTO' | 'DOMESTIC_ONLY' | 'MANUAL';
    riskBufferRate: number;
  };
}

interface QuotationResult {
  quotationId: number;
  baseAmount: number;
  marketAdjustment: number;
  processingCost: ProcessingCostBreakdown;
  targetMargin: number;
  riskBuffer: number;
  finalAmount: number;
  confidenceScore: number;
  lines: QuotationLineResult[];
}

async function calculateQuotation(input: QuotationInput): Promise<QuotationResult> {
  // 1. BidRequest 및 AssetLine 로드
  const request = await loadBidRequest(input.bidRequestId);

  // 2. 각 자산 라인별 단위가 산출
  const lines = await Promise.all(request.assetLines.map(line =>
    calculateLine(line, input.options, request.customerId, request.pickupRegion)
  ));

  // 3. 합계
  const linesTotal = lines.reduce((sum, l) => sum + l.subtotal, 0);

  // 4. 시세 보정 (이미 라인에 반영되어 있음, 표시용 분리)
  const marketAdjustment = calculateMarketAdjustmentDisplay(lines);

  // 5. 처리비용
  const processingCost = calculateProcessingCost({
    totalUnits: lines.reduce((s, l) => s + l.quantity, 0),
    region: request.pickupRegion,
    dataErasure: request.dataErasure,
    hasServers: lines.some(l => l.category === 'SERVER'),
  });

  // 6. 목표 마진
  const targetMargin = calculateTargetMargin(
    linesTotal,
    marketAdjustment,
    input.options.targetMarginRate,
    {
      hasLargeServers: lines.some(l => l.category === 'SERVER' && l.quantity > 5),
      isSmallOrder: linesTotal < 10_000_000,
    }
  );

  // 7. 리스크 보수
  const riskBuffer = calculateRiskBuffer(
    linesTotal,
    extractRiskFactors(lines),
    input.options.riskBufferRate
  );

  // 8. 최종 견적가
  const finalAmount = linesTotal - processingCost.total - targetMargin - riskBuffer;

  // 9. 신뢰도
  const confidenceScore = calculateConfidenceScore(extractConfidenceInputs(lines));

  // 10. DB 저장
  const saved = await saveQuotation({
    bidRequestId: input.bidRequestId,
    baseAmount: linesTotal,
    marketAdjustment,
    costTotal: processingCost.total,
    margin: targetMargin,
    riskBuffer,
    finalAmount,
    confidenceScore,
    lines,
  });

  return saved;
}
```

## 테스트 케이스 (필수)

각 함수마다 다음 케이스를 단위 테스트:

### 정상 케이스
- LG gram 노트북 A급 42대, 수도권, 이력 18건 → 예상 금액 범위 검증

### 경계 케이스
- 등급 미상 자산만 100대 → 보수적 계수 적용 확인
- 6년 이상 노후 서버 → C₂ = 0.25 적용 확인
- 시세 데이터 0건 → C₃ = 1.00 (중립) 적용 확인

### 예외 케이스
- 자산 0건 → 에러 발생
- 음수 수량 → 검증 단계에서 차단
- 매우 큰 수량 (10,000대 이상) → 정상 처리 (오버플로우 없음)

### 결정론 검증
- 동일 입력으로 10회 호출 → 모두 동일 결과
- 시간 의존성은 mock 처리

## 변경 이력 추적

모든 견적은 산출 시점의 계수값을 `Quotation` 및 `QuotationLine` 테이블에 저장합니다. 계수 테이블이 변경되어도 과거 견적의 산출 근거는 보존됩니다.

```typescript
// QuotationLine 테이블 저장 예시
{
  quotationId: 14,
  assetLineId: 87,
  basePrice: 385000,       // 산출 당시 P₀
  c1Grade: 1.00,            // 산출 당시 등급 계수
  c2Age: 0.85,
  c3Market: 1.03,
  c4Region: 1.00,
  c5Customer: 1.02,
  finalUnitPrice: 343587,
  subtotal: 14430654,
}
```
