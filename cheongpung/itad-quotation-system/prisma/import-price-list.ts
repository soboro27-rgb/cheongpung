import "dotenv/config";
import fs from "fs";
import { PrismaClient, AssetCategory } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DIRECT_CATEGORY: Record<string, AssetCategory> = {
  VGA: "GPU",
  모니터: "MONITOR",
  서버: "SERVER",
  HDD: "STORAGE",
  SSD: "STORAGE",
};

function mapCategory(brand: string, mid: string): AssetCategory {
  if (DIRECT_CATEGORY[brand]) return DIRECT_CATEGORY[brand];
  if (brand === "APPLE") {
    if (mid.includes("맥북") || mid.toLowerCase().includes("macbook")) return "LAPTOP";
    if (
      mid.includes("아이맥") ||
      mid.includes("맥미니") ||
      mid.includes("맥 미니") ||
      mid.includes("맥프로") ||
      mid.includes("맥 프로") ||
      mid.includes("맥스튜디오") ||
      mid.includes("맥 스튜디오")
    )
      return "DESKTOP";
    return "OTHER";
  }
  return "OTHER";
}

function mapBrand(brand: string, mid: string): string {
  if (brand === "APPLE") return "Apple";
  if (["CPU", "VGA", "RAM", "BOARD"].includes(brand)) return mid || brand;
  return brand;
}

function parseKstDate(s: string): Date {
  const y = parseInt(s.slice(0, 4));
  const m = parseInt(s.slice(4, 6)) - 1;
  const d = parseInt(s.slice(6, 8));
  if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date();
  return new Date(y, m, d);
}

async function main() {
  const CSV_PATH = "C:/Users/sobor/Desktop/db/매입단가등록WM-2026-05-13 0824.csv";
  const raw = fs.readFileSync(CSV_PATH, "utf8").replace(/^﻿/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const headers = lines[0].split(",").map((h) => h.trim());

  const rows = lines.slice(1).map((line) => {
    const vals = line.split(",");
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? "").trim()]));
  });

  const filtered = rows.filter((r) => r["구분"] === "홈페이지" && parseInt(r["단가"]) > 1);
  console.log(`전체 ${rows.length}행 → 홈페이지+단가>1: ${filtered.length}행\n`);

  // 기존 MANUAL 시세 삭제 (중복 방지)
  const { count: deleted } = await prisma.marketPrice.deleteMany({ where: { source: "MANUAL" } });
  if (deleted > 0) console.log(`기존 MANUAL 시세 ${deleted}건 삭제\n`);

  let assetCreated = 0;
  let assetUpdated = 0;
  let priceCreated = 0;
  let skipped = 0;

  for (const row of filtered) {
    const modelCode = row["품목코드"];
    const modelName = row["품목명"];
    const spec = row["규격"];
    const brandRaw = row["대분류"];
    const midRaw = row["중분류"];
    const price = parseInt(row["단가"]);
    const dateStr = row["적용시작일"];

    if (!modelCode || !modelName || isNaN(price)) {
      skipped++;
      continue;
    }

    const category = mapCategory(brandRaw, midRaw);
    const brand = mapBrand(brandRaw, midRaw);
    const snapshotAt = parseKstDate(dateStr);
    const specSummary = spec && spec !== modelName ? spec.slice(0, 500) : undefined;

    try {
      const existing = await prisma.assetMaster.findUnique({
        where: { modelCode },
        select: { id: true },
      });

      let assetId: bigint;

      if (existing) {
        await prisma.assetMaster.update({
          where: { modelCode },
          data: { retailPriceKrw: price, modelDisplayName: modelName },
        });
        assetId = existing.id;
        assetUpdated++;
      } else {
        const created = await prisma.assetMaster.create({
          data: { category, brand, modelCode, modelDisplayName: modelName, specSummary, retailPriceKrw: price },
          select: { id: true },
        });
        assetId = created.id;
        assetCreated++;
      }

      await prisma.marketPrice.create({
        data: {
          assetMasterId: assetId,
          source: "MANUAL",
          price,
          currency: "KRW",
          trend: "STABLE",
          snapshotAt,
        },
      });
      priceCreated++;
    } catch (e) {
      console.error(`오류 [${modelCode}]:`, e);
      skipped++;
    }
  }

  console.log("완료:");
  console.log(`  AssetMaster 신규: ${assetCreated}건`);
  console.log(`  AssetMaster 업데이트: ${assetUpdated}건`);
  console.log(`  MarketPrice 생성: ${priceCreated}건`);
  console.log(`  스킵: ${skipped}건`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
