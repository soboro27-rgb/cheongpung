export interface CpuInfo {
  tier: string;         // "i3", "i5", "i7", "i9", "Ryzen 5" 등
  generation: number;   // 3, 4, 12 등 (정수 세대)
  generationStr: string; // "12세대"
  raw: string;          // 원본 입력값
}

/**
 * Intel Core 모델번호에서 세대 추출
 *
 * 규칙:
 *   5자리 번호 → 앞 2자리가 세대 (예: 1235U → 12세대, 10100 → 10세대)
 *   4자리 번호 → 첫 1자리가 세대 (예: 4770K → 4세대, 9700K → 9세대)
 *   3자리 번호 → 첫 1자리가 세대 (예: 380M → 3세대) — 초기 모델
 */
function extractIntelGeneration(modelNum: string): number | null {
  const digits = modelNum.replace(/[^0-9]/g, "");
  if (digits.length >= 5) return parseInt(digits.slice(0, 2), 10);
  if (digits.length === 4) return parseInt(digits[0], 10);
  if (digits.length === 3) return parseInt(digits[0], 10);
  return null;
}

/**
 * CPU 모델 문자열 → CpuInfo 파싱
 *
 * 지원 형식:
 *   Intel: "i5-1235U", "i7 1165G7", "i3-10100", "i9-13900K"
 *   DB 직접 표기: "i5-1.6GHz(12세대)" — specSummary에 이미 세대가 있는 경우
 *   AMD Ryzen: "Ryzen 5 5600X", "ryzen7-3700X" (제한적 지원)
 */
export function parseCpuInfo(cpuClock: string): CpuInfo | null {
  const raw = cpuClock;
  const s = cpuClock.trim().toLowerCase().replace(/\s+/g, "");

  // DB 형식 직접 표기: i5-1.6GHz(12세대), i5(12세대) 등
  const dbStyle = s.match(/i([3579]).*?\((\d+)세대\)/);
  if (dbStyle) {
    const gen = parseInt(dbStyle[2], 10);
    return { tier: `i${dbStyle[1]}`, generation: gen, generationStr: `${gen}세대`, raw };
  }

  // Intel Core: i5-1235U, i7-1165G7, i3-10100
  const intel = s.match(/i([3579])[- ]?(\d{3,5}[a-z0-9]*)/);
  if (intel) {
    const tier = `i${intel[1]}`;
    const gen = extractIntelGeneration(intel[2]);
    if (gen !== null && gen >= 1 && gen <= 20) {
      return { tier, generation: gen, generationStr: `${gen}세대`, raw };
    }
  }

  // AMD Ryzen: Ryzen 5 5600X → 숫자 앞자리 1자리가 세대 (Zen 세대 기준)
  const amd = s.match(/ryzen([3579])[- ]?(\d{4})/);
  if (amd) {
    const gen = parseInt(amd[2][0], 10);
    return { tier: `Ryzen ${amd[1]}`, generation: gen, generationStr: `${gen}세대`, raw };
  }

  return null;
}

/**
 * RAM 표기 정규화: "16GB" → "16G", "512MB" → "512M"
 */
export function normalizeRam(ram: string): string {
  return ram.trim().toUpperCase().replace(/GB$/i, "G").replace(/MB$/i, "M");
}
