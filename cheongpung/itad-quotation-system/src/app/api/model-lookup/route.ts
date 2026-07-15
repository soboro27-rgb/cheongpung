import { NextRequest, NextResponse } from "next/server";
import { extractSpecFromTexts, stripHtml } from "@/lib/model-lookup/spec-extractor";
import { matchAssetLine } from "@/lib/matching/asset-matcher";
import { prisma } from "@/lib/prisma";
import type { AssetCategory } from "@/generated/prisma";

export interface ModelLookupResponse {
  cpuClock: string | null;
  ram: string | null;
  storage: string | null;
  source: string;
  query: string;
  matched: {
    assetMasterId: string;
    modelDisplayName: string;
    specSummary: string | null;
    retailPriceKrw: number | null;
    matchNote: string;
    matchScore: number;
  } | null;
}

interface NaverSearchItem {
  title: string;
  description: string;
}

interface NaverSearchResponse {
  items: NaverSearchItem[];
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const categoryParam = req.nextUrl.searchParams.get("category") as AssetCategory | null;

  if (!q || q.length < 3) {
    return NextResponse.json({ error: "모델명을 3자 이상 입력하세요." }, { status: 400 });
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  const query = encodeURIComponent(`${q} CPU 스펙 사양`);
  const naverUrl = `https://openapi.naver.com/v1/search/webkr.json?query=${query}&display=5`;

  const naverRes = await fetch(naverUrl, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    next: { revalidate: 3600 },
  });

  if (!naverRes.ok) {
    return NextResponse.json(
      { error: `네이버 API 오류: ${naverRes.status}` },
      { status: 502 }
    );
  }

  const data = (await naverRes.json()) as NaverSearchResponse;
  const texts = (data.items ?? []).flatMap((item) => [
    stripHtml(item.title),
    stripHtml(item.description),
  ]);

  const spec = extractSpecFromTexts(texts);

  // 카테고리가 있으면 AssetMaster 매칭 시도
  let matched: ModelLookupResponse["matched"] = null;
  if (categoryParam) {
    const matchResult = await matchAssetLine(q, categoryParam, spec.cpuClock, spec.ram);
    if (matchResult.assetMasterId) {
      const asset = await prisma.assetMaster.findUnique({
        where: { id: matchResult.assetMasterId },
        select: { id: true, modelDisplayName: true, specSummary: true, retailPriceKrw: true },
      });
      if (asset) {
        matched = {
          assetMasterId: asset.id.toString(),
          modelDisplayName: asset.modelDisplayName,
          specSummary: asset.specSummary,
          retailPriceKrw: asset.retailPriceKrw ? Number(asset.retailPriceKrw) : null,
          matchNote: matchResult.matchNote,
          matchScore: matchResult.matchScore,
        };
      }
    }
  }

  return NextResponse.json({
    cpuClock: spec.cpuClock,
    ram: spec.ram,
    storage: spec.storage,
    source: "naver_webkr",
    query: q,
    matched,
  } satisfies ModelLookupResponse);
}
