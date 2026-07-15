import { differenceInDays, subMonths } from "date-fns";
import { prisma } from "@/lib/prisma";

export interface BasePriceResult {
  price: number;
  sampleCount: number;
  confidence: number;
  fallbackLevel: 0 | 1 | 2 | 3;
}

export async function calculateBasePrice(
  assetMasterId: bigint,
  windowMonths = 12,
  customerId?: bigint
): Promise<BasePriceResult> {
  const since = subMonths(new Date(), windowMonths);

  const histories = await prisma.salesHistory.findMany({
    where: { assetMasterId, soldAt: { gte: since } },
  });

  if (histories.length >= 5) {
    return _weightedAverage(histories, customerId, 0);
  }

  // 폴백 1: 동일 카테고리 유사 스펙
  const master = await prisma.assetMaster.findUnique({
    where: { id: assetMasterId },
    select: { category: true },
  });
  if (!master) return { price: 0, sampleCount: 0, confidence: 0, fallbackLevel: 3 };

  const similarIds = await prisma.assetMaster.findMany({
    where: { category: master.category, id: { not: assetMasterId } },
    select: { id: true },
  });

  if (similarIds.length > 0) {
    const similarHistories = await prisma.salesHistory.findMany({
      where: {
        assetMasterId: { in: similarIds.map((m) => m.id) },
        soldAt: { gte: since },
      },
    });
    if (similarHistories.length >= 1) {
      const result = _weightedAverage(similarHistories, customerId, 1);
      return { ...result, confidence: Math.max(0, result.confidence - 20) };
    }
  }

  // 폴백 2: 카테고리 전체 평균
  const categoryHistories = await prisma.salesHistory.findMany({
    where: {
      assetMaster: { category: master.category },
      soldAt: { gte: since },
    },
    take: 50,
  });

  if (categoryHistories.length >= 1) {
    const result = _weightedAverage(categoryHistories, customerId, 2);
    return { ...result, confidence: Math.max(0, result.confidence - 40) };
  }

  // 폴백 3: 매입단가표 retailPriceKrw
  const priceRow = await prisma.assetMaster.findUnique({
    where: { id: assetMasterId },
    select: { retailPriceKrw: true },
  });
  if (priceRow?.retailPriceKrw) {
    return { price: Number(priceRow.retailPriceKrw), sampleCount: 0, confidence: 10, fallbackLevel: 3 };
  }

  return { price: 0, sampleCount: 0, confidence: 0, fallbackLevel: 3 };
}

function _weightedAverage(
  histories: { unitPrice: { toNumber: () => number }; soldAt: Date; customerId: bigint | null }[],
  customerId: bigint | undefined,
  fallbackLevel: 0 | 1 | 2 | 3
): BasePriceResult {
  const now = new Date();
  const weighted = histories.map((h) => {
    const daysAgo = differenceInDays(now, h.soldAt);
    const timeWeight = Math.exp(-daysAgo / 180);
    const customerWeight =
      customerId && h.customerId === customerId ? 1.5 : 1.0;
    return { price: h.unitPrice.toNumber(), weight: timeWeight * customerWeight };
  });

  const totalWeight = weighted.reduce((s, x) => s + x.weight, 0);
  const totalValue = weighted.reduce((s, x) => s + x.price * x.weight, 0);
  const price = totalWeight > 0 ? Math.round(totalValue / totalWeight) : 0;
  const confidence = Math.min(100, histories.length * 5 + totalWeight * 10);

  return { price, sampleCount: histories.length, confidence, fallbackLevel };
}
