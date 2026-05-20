import { NextRequest, NextResponse } from "next/server";
import { extractSpecFromTexts, stripHtml } from "@/lib/model-lookup/spec-extractor";

export interface ModelLookupResponse {
  cpuClock: string | null;
  ram: string | null;
  source: string;
  query: string;
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

  // 네이버 웹 검색 — 모델명 + "CPU 스펙 사양" 검색
  const query = encodeURIComponent(`${q} CPU 스펙 사양`);
  const naverUrl = `https://openapi.naver.com/v1/search/webkr.json?query=${query}&display=5`;

  const naverRes = await fetch(naverUrl, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    next: { revalidate: 3600 }, // 같은 모델은 1시간 캐시
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

  const result: ModelLookupResponse = {
    cpuClock: spec.cpuClock,
    ram: spec.ram,
    source: "naver_webkr",
    query: q,
  };

  return NextResponse.json(result);
}
