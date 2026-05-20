export interface ExtractedSpec {
  cpuClock: string | null;
  ram: string | null;
}

/**
 * 검색 결과 텍스트 목록에서 CPU 모델명과 RAM 용량을 추출합니다.
 * HTML 태그를 제거한 순수 텍스트를 넘겨야 합니다.
 */
export function extractSpecFromTexts(texts: string[]): ExtractedSpec {
  const combined = texts.join(" ");

  return {
    cpuClock: extractCpu(combined),
    ram: extractRam(combined),
  };
}

function extractCpu(text: string): string | null {
  // 1순위: 모델번호 직접 표기 — i5-1235U, i7-1165G7, i9-13900K 등
  const direct = text.match(/\bi([3579])[- ]?(\d{3,5}[a-zA-Z0-9]*)/i);
  if (direct) {
    return `i${direct[1]}-${direct[2].toUpperCase()}`;
  }

  // 2순위: 한국어 표기 — "코어i5 12세대", "인텔 i7 10세대"
  // → cpu-parser가 세대 숫자로 매칭할 수 없으므로 모델번호 없이 tier+gen 형식으로 반환
  const korGen = text.match(/(?:코어\s*|인텔\s*)?i([3579])[- ]?\s*(\d+)세대/i);
  if (korGen) {
    return `i${korGen[1]}(${korGen[2]}세대)`;
  }

  return null;
}

function extractRam(text: string): string | null {
  // "16GB", "16 GB", "16GB DDR5", "LPDDR5 16GB" 등
  const match = text.match(/\b(\d+)\s*GB(?:\s*(?:LPDDR|DDR)\d*[Xx]?\d*)?/i);
  if (match) {
    const val = parseInt(match[1], 10);
    // 주변 문맥이 SSD/저장장치일 가능성이 있는 큰 값은 제외
    if (val <= 128) return `${val}G`;
  }
  return null;
}

/** HTML 태그 및 특수문자 제거 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}
