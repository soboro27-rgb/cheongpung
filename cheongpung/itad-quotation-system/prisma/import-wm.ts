import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function toCategory(daebun: string, jungbun: string): string {
  const d = daebun.toUpperCase();
  if (d === "APPLE") {
    if (jungbun.includes("맥북")) return "LAPTOP";
    if (jungbun.includes("아이맥") || jungbun.includes("맥 미니") || jungbun.includes("맥 스튜디오") || jungbun.includes("맥 프로")) return "DESKTOP";
    return "OTHER";
  }
  if (d.includes("노트북")) return "LAPTOP";
  if (d.includes("데스크탑") || d.includes("워크스테이션")) return "DESKTOP";
  if (d.includes("서버")) return "SERVER";
  if (d.includes("모니터")) return "MONITOR";
  if (d === "SSD" || d === "HDD") return "STORAGE";
  if (d === "VGA") return "GPU";
  return "OTHER";
}

function toBrand(daebun: string): string {
  if (daebun.toUpperCase() === "APPLE") return "Apple";
  if (["SSD","HDD","RAM","CPU","BOARD","VGA"].includes(daebun.toUpperCase())) return "기타";
  return daebun;
}

async function main() {
  const filePath = path.resolve("C:/Users/sobor/Desktop/db/매입단가등록WM-2026-05-13 0824.csv");
  let text = fs.readFileSync(filePath, "utf-8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const lines = text.split(/\r?\n/).filter(Boolean);
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(",");
    return {
      gubun: cols[0]?.trim(),
      daebun: cols[1]?.trim(),
      jungbun: cols[2]?.trim(),
      code: cols[4]?.trim(),
      name: cols[5]?.trim(),
      spec: cols[6]?.trim(),
      price: parseInt(cols[7]?.trim() || "0", 10),
    };
  }).filter((r) => r.code && r.name && r.price > 0);

  // 품목코드 기준 홈페이지 > 딜러 > 재고원가 우선
  const priority: Record<string, number> = { 홈페이지: 3, 딜러: 2, 재고원가: 1 };
  const codeMap = new Map<string, typeof rows[0]>();
  for (const r of rows) {
    const ex = codeMap.get(r.code);
    if (!ex || (priority[r.gubun] || 0) > (priority[ex.gubun] || 0)) {
      codeMap.set(r.code, r);
    }
  }

  const unique = Array.from(codeMap.values());
  console.log(`유니크 품목수: ${unique.length}개 → DB 저장 시작`);

  const now = new Date();
  let done = 0;

  for (const r of unique) {
    try {
      const category = toCategory(r.daebun, r.jungbun) as any;
      const brand = toBrand(r.daebun);

      const asset = await prisma.assetMaster.upsert({
        where: { modelCode: r.code },
        update: { modelDisplayName: r.name, specSummary: r.spec || null },
        create: {
          category,
          brand,
          modelCode: r.code,
          modelDisplayName: r.name,
          specSummary: r.spec || null,
          retailPriceKrw: r.price,
          aliases: [r.name, r.spec].filter(Boolean) as string[],
        },
      });

      await prisma.marketPrice.create({
        data: {
          assetMasterId: asset.id,
          source: "MANUAL",
          price: r.price,
          currency: "KRW",
          trend: "STABLE",
          snapshotAt: now,
        },
      });

      // 매입단가를 기준 이력가로 SalesHistory에도 삽입
      // 등급·지역 미상 → B급/서울 기준, source="WM_PRICE_LIST"로 구분
      await prisma.salesHistory.create({
        data: {
          assetMasterId: asset.id,
          unitPrice: r.price,
          quantity: 1,
          grade: "B",
          yearDiff: 0,
          region: "SEOUL",
          soldAt: now,
          source: "WM_PRICE_LIST",
        },
      });

      done++;
      if (done % 50 === 0) process.stdout.write(`\r진행: ${done}/${unique.length}`);
    } catch {
      // 중복 등 에러는 스킵
    }
  }

  console.log(`\n\n완료!`);
  console.log(`자산 마스터 등록: ${done}개`);
  console.log(`시세 데이터 등록: ${done}개`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
