import { prisma } from "@/lib/prisma";
import type { AssetCategory, MatchStatus } from "@/generated/prisma";

export interface MatchResult {
  assetMasterId: bigint | null;
  matchStatus: MatchStatus;
  matchScore: number;
  matchNote: string;
}

/**
 * 1순위: cpuClock + ram 두 값이 모두 있으면 specSummary로 매칭
 * 2순위: modelCode 정확 매칭
 * 3순위: aliases 포함 매칭
 * 4순위: modelDisplayName 부분 매칭
 * 5순위: UNMATCHED
 */
export async function matchAssetLine(
  rawModelName: string,
  category: AssetCategory,
  cpuClock?: string | null,
  ram?: string | null
): Promise<MatchResult> {
  // ── 1순위: CPU_CLOCK + RAM 동시 매칭 ───────────────────
  if (cpuClock?.trim() && ram?.trim()) {
    const cpuNorm = cpuClock.trim();
    const ramNorm = ram.trim();

    const bySpec = await prisma.assetMaster.findMany({
      where: {
        category,
        specSummary: {
          contains: cpuNorm,
          mode: "insensitive",
        },
      },
    });

    const ramMatched = bySpec.filter(
      (a) =>
        a.specSummary?.toLowerCase().includes(ramNorm.toLowerCase()) ?? false
    );

    if (ramMatched.length === 1) {
      return {
        assetMasterId: ramMatched[0].id,
        matchStatus: "EXACT",
        matchScore: 0.95,
        matchNote: `CPU(${cpuNorm}) + RAM(${ramNorm}) 매칭`,
      };
    }
    if (ramMatched.length > 1) {
      // 여러 건 → 모델명으로 추가 필터
      const withModel = ramMatched.filter((a) =>
        a.modelDisplayName
          .toLowerCase()
          .includes(rawModelName.toLowerCase().slice(0, 5))
      );
      const best = withModel[0] ?? ramMatched[0];
      return {
        assetMasterId: best.id,
        matchStatus: "SIMILAR",
        matchScore: 0.85,
        matchNote: `CPU(${cpuNorm}) + RAM(${ramNorm}) 다중 매칭 (${ramMatched.length}건) → 최상위 선택`,
      };
    }
    // CPU+RAM 매칭 실패 → 하위 순위로 계속
  }

  // ── 2순위: modelCode 정확 매칭 ─────────────────────────
  const normalized = rawModelName.trim().toUpperCase().replace(/\s+/g, "-");
  const byCode = await prisma.assetMaster.findFirst({
    where: { modelCode: { equals: normalized, mode: "insensitive" } },
  });
  if (byCode) {
    return {
      assetMasterId: byCode.id,
      matchStatus: "EXACT",
      matchScore: 1.0,
      matchNote: `modelCode 정확 매칭: ${byCode.modelCode}`,
    };
  }

  // ── 3순위: aliases 매칭 ────────────────────────────────
  const all = await prisma.assetMaster.findMany({ where: { category } });
  const byAlias = all.find((a) =>
    a.aliases.some(
      (alias) => alias.toLowerCase() === rawModelName.toLowerCase()
    )
  );
  if (byAlias) {
    return {
      assetMasterId: byAlias.id,
      matchStatus: "EXACT",
      matchScore: 0.98,
      matchNote: `alias 매칭: ${rawModelName}`,
    };
  }

  // ── 4순위: modelDisplayName / specSummary 부분 매칭 ────
  const tokens = rawModelName
    .toLowerCase()
    .split(/[\s,/-]+/)
    .filter((t) => t.length >= 3);

  let best: (typeof all)[0] | null = null;
  let bestScore = 0;

  for (const asset of all) {
    const haystack = [
      asset.modelDisplayName,
      asset.specSummary ?? "",
      asset.modelCode,
    ]
      .join(" ")
      .toLowerCase();

    const matched = tokens.filter((t) => haystack.includes(t)).length;
    const score = tokens.length > 0 ? matched / tokens.length : 0;

    if (score > bestScore) {
      bestScore = score;
      best = asset;
    }
  }

  if (best && bestScore >= 0.5) {
    return {
      assetMasterId: best.id,
      matchStatus: "SIMILAR",
      matchScore: bestScore * 0.8,
      matchNote: `부분 매칭 (${Math.round(bestScore * 100)}%): ${best.modelDisplayName}`,
    };
  }

  // ── 5순위: UNMATCHED ────────────────────────────────────
  return {
    assetMasterId: null,
    matchStatus: "UNMATCHED",
    matchScore: 0,
    matchNote: "매칭 실패 — 이력 기준가 0원 적용",
  };
}
