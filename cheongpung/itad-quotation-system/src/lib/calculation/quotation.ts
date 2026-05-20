import type { AssetCategory, Grade, Region, DataErasure } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";
import { calculateBasePrice } from "./base-price";
import { getMarketCoefficient, getCustomerCoefficient } from "./market-adjust";
import { calculateProcessingCost } from "./processing-cost";
import {
  getGradeCoefficient,
  getAgeCoefficient,
  getRegionCoefficient,
} from "./coefficients";

export interface AssetLineInput {
  id: bigint;
  assetMasterId: bigint | null;
  category: AssetCategory;
  grade: Grade;
  manufactureYear: number | null;
  quantity: number;
}

export interface QuotationOptions {
  targetMarginRate: number;
  historyWindowMonths: 6 | 12 | 24 | 0;
  riskBufferRate: number;
}

export interface CalculatedLine {
  assetLineId: bigint;
  basePrice: number;
  c1Grade: number;
  c2Age: number;
  c3Market: number;
  c4Region: number;
  c5Customer: number;
  finalUnitPrice: number;
  quantity: number;
  subtotal: number;
  historyCount: number;
  matchScore: number;
}

export interface QuotationCalcResult {
  baseAmount: number;
  marketAdjustment: number;
  costLogistics: number;
  costErasure: number;
  costInspection: number;
  costTotal: number;
  marginRate: number;
  marginAmount: number;
  riskBufferRate: number;
  riskBufferAmount: number;
  finalAmount: number;
  confidenceScore: number;
  lines: CalculatedLine[];
}

export async function calculateQuotation(
  bidRequestId: bigint,
  options: QuotationOptions
): Promise<QuotationCalcResult> {
  const request = await prisma.bidRequest.findUniqueOrThrow({
    where: { id: bidRequestId },
    include: { assetLines: true },
  });

  const windowMonths =
    options.historyWindowMonths === 0 ? 120 : options.historyWindowMonths;
  const c4Region = getRegionCoefficient(request.pickupRegion);
  const c5Customer = await getCustomerCoefficient(request.customerId);

  const lines = await Promise.all(
    request.assetLines.map((line) =>
      _calcLine(line, windowMonths, c4Region, c5Customer, request.customerId)
    )
  );

  const baseAmount = lines.reduce((s, l) => s + l.basePrice * l.quantity, 0);
  const linesTotal = lines.reduce((s, l) => s + l.subtotal, 0);

  const marketAdjustment = linesTotal - baseAmount;

  const processing = calculateProcessingCost({
    totalUnits: lines.reduce((s, l) => s + l.quantity, 0),
    region: request.pickupRegion,
    dataErasure: request.dataErasure,
    hasServers: request.assetLines.some((l) => l.category === "SERVER"),
  });

  const hasLargeServers = request.assetLines.some(
    (l) => l.category === "SERVER" && l.quantity > 5
  );
  const isSmallOrder = linesTotal < 10_000_000;

  let adjustedMarginRate = options.targetMarginRate;
  if (hasLargeServers) adjustedMarginRate += 0.02;
  if (isSmallOrder) adjustedMarginRate -= 0.02;
  adjustedMarginRate = Math.max(0.05, Math.min(0.25, adjustedMarginRate));

  const marginAmount = Math.round(
    (linesTotal + marketAdjustment) * adjustedMarginRate
  );

  const avgHistoryCount =
    lines.reduce((s, l) => s + l.historyCount, 0) / Math.max(1, lines.length);
  const unknownSpecRatio =
    lines.filter((l) => l.basePrice === 0).length / Math.max(1, lines.length);

  let riskRate = options.riskBufferRate;
  if (avgHistoryCount < 5) riskRate += 0.05;
  else if (avgHistoryCount < 10) riskRate += 0.02;
  riskRate += unknownSpecRatio * 0.1;
  riskRate = Math.min(0.2, riskRate);

  const riskBufferAmount = Math.round(linesTotal * riskRate);

  const finalAmount = Math.max(
    0,
    linesTotal - processing.total - marginAmount - riskBufferAmount
  );

  const totalHistoryCount = lines.reduce((s, l) => s + l.historyCount, 0);
  const confidenceScore = _confidenceScore(
    totalHistoryCount,
    unknownSpecRatio,
    lines.reduce((s, l) => s + l.matchScore, 0) / Math.max(1, lines.length)
  );

  return {
    baseAmount,
    marketAdjustment,
    costLogistics: processing.logistics,
    costErasure: processing.erasure,
    costInspection: processing.inspection,
    costTotal: processing.total,
    marginRate: adjustedMarginRate,
    marginAmount,
    riskBufferRate: riskRate,
    riskBufferAmount,
    finalAmount,
    confidenceScore,
    lines,
  };
}

async function _calcLine(
  line: { id: bigint; assetMasterId: bigint | null; category: AssetCategory; grade: Grade; manufactureYear: number | null; quantity: number; matchScore: number | null },
  windowMonths: number,
  c4Region: number,
  c5Customer: number,
  customerId: bigint
): Promise<CalculatedLine> {
  const c1Grade = getGradeCoefficient(line.grade);
  const c2Age = getAgeCoefficient(line.manufactureYear);

  let basePrice = 0;
  let c3Market = 1.0;
  let historyCount = 0;
  let matchScore = line.matchScore ?? 0;

  if (line.assetMasterId) {
    const bp = await calculateBasePrice(
      line.assetMasterId,
      windowMonths,
      customerId
    );
    basePrice = bp.price;
    historyCount = bp.sampleCount;

    const market = await getMarketCoefficient(line.assetMasterId);
    c3Market = market.coefficient;
  }

  const finalUnitPrice = Math.round(
    basePrice * c1Grade * c2Age * c3Market * c4Region * c5Customer
  );
  const subtotal = finalUnitPrice * line.quantity;

  return {
    assetLineId: line.id,
    basePrice,
    c1Grade,
    c2Age,
    c3Market,
    c4Region,
    c5Customer,
    finalUnitPrice,
    quantity: line.quantity,
    subtotal,
    historyCount,
    matchScore,
  };
}

export async function saveQuotation(
  bidRequestId: bigint,
  result: QuotationCalcResult
): Promise<bigint> {
  const now = new Date();
  const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayCount = await prisma.quotation.count({
    where: { createdAt: { gte: todayStart } },
  });
  const quotationNumber = `Q-${datePart}-${String(todayCount + 1).padStart(3, "0")}`;
  const validUntil = addDays(new Date(), 14);

  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber,
      bidRequestId,
      baseAmount: result.baseAmount,
      marketAdjustment: result.marketAdjustment,
      costTotal: result.costTotal,
      costLogistics: result.costLogistics,
      costErasure: result.costErasure,
      costInspection: result.costInspection,
      marginRate: result.marginRate,
      marginAmount: result.marginAmount,
      riskBufferRate: result.riskBufferRate,
      riskBufferAmount: result.riskBufferAmount,
      finalAmount: result.finalAmount,
      confidenceScore: result.confidenceScore,
      validUntil,
      status: "CALCULATED",
      quotationLines: {
        create: result.lines.map((l) => ({
          assetLineId: l.assetLineId,
          basePrice: l.basePrice,
          c1Grade: l.c1Grade,
          c2Age: l.c2Age,
          c3Market: l.c3Market,
          c4Region: l.c4Region,
          c5Customer: l.c5Customer,
          finalUnitPrice: l.finalUnitPrice,
          quantity: l.quantity,
          subtotal: l.subtotal,
          historyCount: l.historyCount,
          matchScore: l.matchScore,
        })),
      },
    },
  });

  return quotation.id;
}

function _confidenceScore(
  totalHistoryCount: number,
  unknownSpecRatio: number,
  avgMatchScore: number
): number {
  let score = 0;
  score += Math.min(40, totalHistoryCount * 0.5);
  score += 20; // 시세 데이터 없으면 0점이지만 초기엔 중립
  score += avgMatchScore * 30;
  score += (1 - unknownSpecRatio) * 10;
  return Math.round(Math.min(100, score));
}
