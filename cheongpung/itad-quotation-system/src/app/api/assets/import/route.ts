import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AssetCategory } from "@/generated/prisma";

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
    const m = mid.toLowerCase();
    if (m.includes("맥북") || m.includes("macbook")) return "LAPTOP";
    if (["아이맥", "맥미니", "맥 미니", "맥프로", "맥 프로", "맥스튜디오", "맥 스튜디오"].some((k) => mid.includes(k)))
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

function parseCsv(text: string): Record<string, string>[] {
  const clean = text.replace(/^﻿/, "");
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = line.split(",");
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? "").trim()]));
  });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 });

  const text = await file.text();
  const rows = parseCsv(text);
  const filtered = rows.filter((r) => r["구분"] === "홈페이지" && parseInt(r["단가"]) > 1);

  if (filtered.length === 0) {
    return NextResponse.json({ error: "처리할 데이터가 없습니다 (구분=홈페이지, 단가>1 조건 확인)" }, { status: 400 });
  }

  const { count: deleted } = await prisma.marketPrice.deleteMany({ where: { source: "MANUAL" } });

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
    const specSummary = spec && spec !== modelName ? spec.slice(0, 500) : null;

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
        data: { assetMasterId: assetId, source: "MANUAL", price, currency: "KRW", trend: "STABLE", snapshotAt },
      });
      priceCreated++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ deleted, assetCreated, assetUpdated, priceCreated, skipped, total: filtered.length });
}
