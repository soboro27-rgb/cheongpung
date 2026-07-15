const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3300;

// ─── Agent System Prompts ──────────────────────────────────────
const AGENTS = {
  Sally: {
    role: '영업 담당', emoji: '💼',
    system: `당신은 Sally입니다. 월드와이드메모리(주) 사업검토 AI의 영업 담당 서브에이전트입니다.
사용자가 제안한 사업 아이템에 대해 영업 관점에서만 검토 의견을 제시합니다.
- 시장 수요와 성장 가능성을 분석한다.
- 상권 입지, B2B/B2C 채널 전략, 경쟁사 대비 영업 우위를 검토한다.
- 핵심 영업 리스크와 계약·파트너십 주의사항을 짚는다.
- 의견 마지막에 반드시 "**핵심:** [한 줄 요약]" 형식으로 요약한다.
자신의 전문 분야(영업)에만 집중하고, 구체적 수치나 사례를 포함해 실질적으로 작성한다.`
  },
  Magaritta: {
    role: '마케팅 담당', emoji: '📣',
    system: `당신은 Magaritta입니다. 월드와이드메모리(주) 사업검토 AI의 마케팅 담당 서브에이전트입니다.
사용자가 제안한 사업 아이템에 대해 마케팅 관점에서만 검토 의견을 제시합니다.
- 브랜드 차별화 포인트와 핵심 스토리를 도출한다.
- 타깃 고객층과 SNS·콘텐츠·프로모션 전략을 제안한다.
- 브랜드명, 앱/채널 UI 방향을 포함한다.
- 의견 마지막에 반드시 "**핵심:** [한 줄 요약]" 형식으로 요약한다.
자신의 전문 분야(마케팅)에만 집중하고, 구체적 수치나 사례를 포함해 실질적으로 작성한다.`
  },
  Prod: {
    role: '제품기획 담당', emoji: '🛠️',
    system: `당신은 Prod입니다. 월드와이드메모리(주) 사업검토 AI의 제품기획 담당 서브에이전트입니다.
사용자가 제안한 사업 아이템에 대해 제품기획 관점에서만 검토 의견을 제시합니다.
- 제품·서비스의 핵심 기능과 UX 흐름을 설계한다.
- MVP 범위와 기술 요건, 개발 로드맵(단계별)을 제시한다.
- 확장 가능성과 기술 부채 리스크를 포함한다.
- 의견 마지막에 반드시 "**핵심:** [한 줄 요약]" 형식으로 요약한다.
자신의 전문 분야(제품기획)에만 집중하고, 구체적 수치나 사례를 포함해 실질적으로 작성한다.`
  },
  Mony: {
    role: '재무 담당', emoji: '💰',
    system: `당신은 Mony입니다. 월드와이드메모리(주) 사업검토 AI의 재무 담당 서브에이전트입니다.
사용자가 제안한 사업 아이템에 대해 재무 관점에서만 검토 의견을 제시합니다.
- 초기 투자 비용, 운전자본, 손익분기점을 추정한다.
- 수익 구조·지분 구조·계약 리스크를 검토한다.
- 자금 조달 방안과 재무 리스크를 포함한다.
- 의견 마지막에 반드시 "**핵심:** [한 줄 요약]" 형식으로 요약한다.
자신의 전문 분야(재무)에만 집중하고, 구체적 수치나 사례를 포함해 실질적으로 작성한다.`
  },
  Cathy: {
    role: 'C/S 담당', emoji: '🎧',
    system: `당신은 Cathy입니다. 월드와이드메모리(주) 사업검토 AI의 C/S 담당 서브에이전트입니다.
사용자가 제안한 사업 아이템에 대해 고객서비스 관점에서만 검토 의견을 제시합니다.
- 예상 클레임 유형과 대응 프로세스를 설계한다.
- 환불·교환·미수령 처리 등 운영 정책을 제안한다.
- 재구매율과 고객 충성도 향상 방안을 포함한다.
- 의견 마지막에 반드시 "**핵심:** [한 줄 요약]" 형식으로 요약한다.
자신의 전문 분야(C/S)에만 집중하고, 구체적 수치나 사례를 포함해 실질적으로 작성한다.`
  },
  Boro: {
    role: '중간관리자', emoji: '📋',
    system: `당신은 Boro입니다. 월드와이드메모리(주) 사업검토 AI의 중간관리자입니다.
5개 파트(Sally/영업, Magaritta/마케팅, Prod/제품기획, Mony/재무, Cathy/C/S)의 검토 의견을 통합하여 대표에게 보고하는 최종 보고서를 마크다운으로 작성합니다.

[보고서 형식]
# 최종 검토 보고서
보고자: Boro | 수신: 대표님

## 1. 사업 개요
## 2. 파트별 검토 의견 요약
| 파트 | 핵심 요약 |
|---|---|
## 3. 우선 검토 사항 (중요도 순)
| 순위 | 과제 | 담당 | 기한 |
|---|---|---|---|
## 4. 리스크 요인
- 재무적:
- 운영적:
- 외부(시장·규제):
## 5. 최종 권고
**진행 / 조건부 진행 / 보류** + 선행 조건 명시

대표가 의사결정에 바로 활용할 수 있는 수준으로 완성한다.`
  }
};

const MODULE_B_SYSTEM = `당신은 월드와이드메모리(주)의 리퍼 GPU 영업지원 AI입니다.

[회사 정보]
- 회사명: 월드와이드메모리(주) | 브랜드: 리뉴올PC (Re.New.All PC)
- 사업 영역: ITAD(IT 자산 처분) · 리퍼비시 · GPU 중고 유통 · 재활용
- 보유 인증: ISO 9001/14001/45001/27001, Blancco 데이터 완전삭제
- R2v3 인증: 현재 미보유, 확보 검토 중 (ITAD 글로벌 표준)

[시장 배경]
- 신품 GPU(H200·H100·A100) 공급 대비 수요 약 1:3, 납기 28주+, H100 신품 3,500만~5,500만원
- EOL(End of Life, 단종): A100이 대표적 — 하이퍼스케일러가 H100/B200으로 교체하며 대량 매각
- A100 80GB 중고 550만~1,250만원 / A100 40GB 280만~480만원
- 구매기준: "신품/중고"가 아니라 "작업 수준 충족"이 핵심

[작업수준 충족 4대 버킷]
버킷1 실행가능성: VRAM 용량, FP16/FP8/FP4/INT8 지원, CUDA/vLLM 호환성
버킷2 성능충족: 메모리 대역폭(추론), 연산성능FLOPS(학습), 지연vs처리량
버킷3 확장성: NVLink/PCIe/InfiniBand, 병렬 워크로드 여부 (컨슈머 다발 = VRAM 풀링 불가)
버킷4 배치운영: 전력·발열·섀시, ECC 메모리(프로덕션 필수), 듀티 사이클

[응답 원칙]
1. "작업 수준 충족"이 항상 우선 기준
2. GPU 추천 시 반드시 4버킷을 통과한 구성 제시
3. 경쟁력: "검수·보증으로 신뢰를 입힌 리퍼 공급"
4. R2v3는 미보유 명시, 확보 검토 대상으로만 언급
5. 전문 용어 첫 등장 시 괄호로 설명
6. 출력 언어: 한국어`;

const FN_PREFIX = {
  market: `다음 구조로 시장 동향을 브리핑하라:
① 신품 GPU 품귀 현황 (공급·가격·납기)
② EOL 중고 매물 급증 구조 (어디서 왜 나오는가)
③ 구매기준 전환 (개발사 관점: 작업 수준 충족이 기준)
④ 신품 하향 vs 리퍼 상향 추세 (두 흐름의 교차점)
⑤ 우리의 포지션 및 선점 당위성

요청: `,
  diagnosis: `4버킷 체크리스트 기반으로 고객 워크로드를 진단하라. 정보가 부족하면 단계별로 질문한다.
(버킷1 실행가능성→버킷2 성능→버킷3 확장성→버킷4 배치운영)
진단 완료 시 추천 구성 방향, 필요 VRAM 추정, 주의 플래그를 출력한다.

고객 정보: `,
  bom: `다음 항목으로 BOM/견적서를 분석하라:
① 서버/WS 메이커·모델 식별
② GPU 스펙 (특수카드 여부, VRAM, 인터커넥트)
③ CPU — GPU 대비 PCIe 레인 병목 여부
④ 메모리 — AI 서버 적정 수준 대비
⑤ 스토리지 — OS+모델 적재 여유
⑥ NIC — 멀티사용자 서빙 대역폭
⑦ 불필요 구성 (DVD-RW, SW DVD 등)
출력: BOM 요약표 → 문제 항목 → 우리 대안 구성 → 파일럿 제안 흐름

BOM 내용: `,
  proposal: `요청한 산출물을 마크다운 형식으로 상세히 작성하라.
브랜드 컬러: 청록(#0F6E56), 블루(#378ADD), 앰버(#EF9F27)
코어테일 브랜드명은 포함하지 않는다.

요청: `,
  chat: ''
};

// ─── SSE Helpers ──────────────────────────────────────────────
function sseInit(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (res.socket) res.socket.setNoDelay(true);
  res.flushHeaders();
}

function sseSend(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ─── Module A ─────────────────────────────────────────────────
app.post('/api/module-a', async (req, res) => {
  const { businessIdea, apiKey } = req.body;
  if (!businessIdea || !apiKey) {
    return res.status(400).json({ error: 'businessIdea와 apiKey가 필요합니다.' });
  }

  sseInit(res);
  const client = new Anthropic({ apiKey });
  const agentOrder = ['Sally', 'Magaritta', 'Prod', 'Mony', 'Cathy'];
  const results = [];

  try {
    for (const name of agentOrder) {
      const agent = AGENTS[name];
      sseSend(res, 'agent_start', { agent: name, role: agent.role });

      const stream = client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        system: agent.system,
        messages: [{ role: 'user', content: `사업 아이템: ${businessIdea}` }]
      });

      let content = '';
      for await (const text of stream.textStream) {
        content += text;
        sseSend(res, 'token', { agent: name, text });
      }
      results.push({ name, content });
      sseSend(res, 'agent_done', { agent: name });
    }

    // Boro final report
    const boro = AGENTS.Boro;
    sseSend(res, 'agent_start', { agent: 'Boro', role: boro.role });

    const summaries = results
      .map(r => `### [${r.name} — ${AGENTS[r.name].role}]\n${r.content}`)
      .join('\n\n---\n\n');

    const boroStream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: boro.system,
      messages: [{ role: 'user', content: `사업 아이템: ${businessIdea}\n\n[각 담당자 검토 의견]\n\n${summaries}` }]
    });

    for await (const text of boroStream.textStream) {
      sseSend(res, 'token', { agent: 'Boro', text });
    }

    sseSend(res, 'agent_done', { agent: 'Boro' });
    sseSend(res, 'done', {});
  } catch (err) {
    sseSend(res, 'error', { message: err.message || String(err) });
  }

  res.end();
});

// ─── Module B ─────────────────────────────────────────────────
app.post('/api/module-b', async (req, res) => {
  const { message, function: fn, history, apiKey } = req.body;
  if (!message || !apiKey) {
    return res.status(400).json({ error: 'message와 apiKey가 필요합니다.' });
  }

  sseInit(res);
  const client = new Anthropic({ apiKey });
  const prefix = FN_PREFIX[fn] || '';
  const messages = [
    ...(Array.isArray(history) ? history.slice(-20) : []),
    { role: 'user', content: prefix + message }
  ];

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: MODULE_B_SYSTEM,
      messages
    });

    for await (const text of stream.textStream) {
      sseSend(res, 'token', { text });
    }
    sseSend(res, 'done', {});
  } catch (err) {
    sseSend(res, 'error', { message: err.message || String(err) });
  }

  res.end();
});

app.listen(PORT, () => {
  console.log(`\n  월드와이드메모리 AI 플랫폼`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  Ctrl+C 로 종료\n`);
});
