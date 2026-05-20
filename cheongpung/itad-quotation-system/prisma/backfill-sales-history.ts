/**
 * 백필 스크립트: MarketPrice(WM_PRICE_LIST)는 있으나 SalesHistory가 없는
 * AssetMaster 항목에 기준 이력가를 삽입합니다.
 *
 * 실행: npx tsx prisma/backfill-sales-history.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // SalesHistory가 한 건도 없는 AssetMaster id 목록을 MarketPrice 기준으로 수집
  const targets = await prisma.marketPrice.findMany({
    where: {
      source: "MANUAL",
      assetMaster: {
        salesHistories: { none: {} },
      },
    },
    select: {
      assetMasterId: true,
      price: true,
      snapshotAt: true,
    },
    distinct: ["assetMasterId"],
  });

  console.log(`SalesHistory 미등록 항목: ${targets.length}건 → 백필 시작`);

  let done = 0;
  let skipped = 0;

  for (const t of targets) {
    try {
      await prisma.salesHistory.create({
        data: {
          assetMasterId: t.assetMasterId,
          unitPrice: t.price,
          quantity: 1,
          grade: "B",
          yearDiff: 0,
          region: "SEOUL",
          soldAt: t.snapshotAt,
          source: "WM_PRICE_LIST",
        },
      });
      done++;
      if (done % 100 === 0) process.stdout.write(`\r진행: ${done}/${targets.length}`);
    } catch {
      skipped++;
    }
  }

  console.log(`\n\n완료!`);
  console.log(`삽입 성공: ${done}건`);
  if (skipped > 0) console.log(`스킵(오류): ${skipped}건`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
