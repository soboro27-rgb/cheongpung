export type { AssetCategory, Grade, BidType, Region, DataErasure, Sector, MatchStatus, MarketSource, MarketTrend, BidRequestStatus, QuotationStatus, UserRole, ApprovalAction } from "@/generated/prisma";

export interface CoefficientSet {
  c1Grade: number;
  c2Age: number;
  c3Market: number;
  c4Region: number;
  c5Customer: number;
}

export interface QuotationLineResult {
  assetLineId: bigint;
  rawModelName: string;
  category: string;
  quantity: number;
  basePrice: number;
  coefficients: CoefficientSet;
  finalUnitPrice: number;
  subtotal: number;
  historyCount: number;
  matchScore: number;
}

export interface ProcessingCostBreakdown {
  logistics: number;
  erasure: number;
  inspection: number;
  total: number;
}

export interface QuotationSummary {
  quotationId: bigint;
  quotationNumber: string;
  baseAmount: number;
  marketAdjustment: number;
  processingCost: ProcessingCostBreakdown;
  marginRate: number;
  marginAmount: number;
  riskBufferRate: number;
  riskBufferAmount: number;
  finalAmount: number;
  confidenceScore: number;
  lines: QuotationLineResult[];
}

export type ConfidenceLevel = "매우높음" | "높음" | "보통" | "낮음" | "매우낮음";

export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 80) return "매우높음";
  if (score >= 60) return "높음";
  if (score >= 40) return "보통";
  if (score >= 20) return "낮음";
  return "매우낮음";
}
