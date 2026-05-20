import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";

export interface MarketCoefficientResult {
  coefficient: number;
  trend: "UP" | "STABLE" | "DOWN";
  source: string;
}

export async function getMarketCoefficient(
  assetMasterId: bigint
): Promise<MarketCoefficientResult> {
  const snapshots = await prisma.marketPrice.findMany({
    where: {
      assetMasterId,
      snapshotAt: { gte: subDays(new Date(), 30) },
    },
    orderBy: { snapshotAt: "asc" },
  });

  if (snapshots.length < 3) {
    return { coefficient: 1.0, trend: "STABLE", source: "insufficient_data" };
  }

  const prices = snapshots.map((s) => s.price.toNumber());
  const slope = _linearRegressionSlope(prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const trendRate = slope / avgPrice;
  const totalChange = trendRate * 30;

  let coefficient: number;
  let trend: "UP" | "STABLE" | "DOWN";

  if (totalChange > 0.05) {
    coefficient = Math.min(1.15, 1.0 + totalChange);
    trend = "UP";
  } else if (totalChange < -0.05) {
    coefficient = Math.max(0.8, 1.0 + totalChange);
    trend = "DOWN";
  } else {
    coefficient = 1.0 + totalChange;
    trend = "STABLE";
  }

  return { coefficient, trend, source: snapshots[0].source };
}

export async function getCustomerCoefficient(
  customerId: bigint
): Promise<number> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { winRate: true, totalDeals: true },
  });

  if (!customer || customer.totalDeals < 5) return 1.0;

  if (customer.winRate >= 0.8) return 1.05;
  if (customer.winRate >= 0.6) return 1.02;
  if (customer.winRate >= 0.4) return 1.0;
  if (customer.winRate >= 0.2) return 0.97;
  return 0.95;
}

function _linearRegressionSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const sumX = (n * (n - 1)) / 2;
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((acc, y, i) => acc + i * y, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}
