"""
캐피시AI 코어 프롬프트 v2 텍스트 시뮬레이션 — 5인 1시간 회의 시나리오

마이크/블루투스 없이, scenario_5person_1hour.md의 세그먼트를 순서대로
catfish_pilot.py의 ask_catfish()와 동일한 방식(누적 meeting_log + 경과 시간)으로
Claude에 넘겨 SUMMARY/SPEAK을 받고 simulation_log_*.md로 저장한다.
결과는 trigger_evaluation_rubric.md 기준표로 채점한다.

사전 준비: ANTHROPIC_API_KEY 환경변수 설정
"""

import os
import re
import sys
import time
from pathlib import Path

import anthropic

PROMPT_PATH = Path(__file__).parent / "catfish_core_prompt_v2.md"
SCENARIO_PATH = Path(__file__).parent / "scenario_5person_1hour.md"
MODEL = "claude-opus-5"

SEGMENT_HEADER = re.compile(r"^##\s*S(\d+)\s*\|\s*(\d+)-(\d+)\s*$", re.MULTILINE)


def load_system_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8").strip()


def parse_scenario(text: str) -> list[tuple[int, int, int, str]]:
    """(세그먼트 번호, 시작분, 종료분, 스크립트) 리스트로 분리."""
    matches = list(SEGMENT_HEADER.finditer(text))
    segments = []
    for i, m in enumerate(matches):
        seg_num, start_min, end_min = int(m.group(1)), int(m.group(2)), int(m.group(3))
        body_start = m.end()
        body_end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        script = text[body_start:body_end].strip()
        segments.append((seg_num, start_min, end_min, script))
    return segments


def ask_catfish(
    client: anthropic.Anthropic,
    system_prompt: str,
    transcript: str,
    meeting_log: list[str],
    elapsed_minutes: int,
) -> tuple[str, str]:
    context_blocks: list[str] = []
    if meeting_log:
        meeting_summary = "\n".join(meeting_log)
        context_blocks.append(f"[지금까지의 회의 요약]\n{meeting_summary}")
    context_blocks.append(f"[현재까지 경과 시간] 약 {elapsed_minutes}분")
    context_blocks.append(f"[회의 구간 스크립트]\n{transcript}")
    user_content = "\n\n".join(context_blocks)

    response = client.messages.create(
        model=MODEL,
        max_tokens=500,
        system=system_prompt,
        messages=[{"role": "user", "content": user_content}],
    )
    text = "".join(b.text for b in response.content if b.type == "text").strip()

    summary = ""
    speak_text = "PASS"
    for line in text.splitlines():
        line = line.strip()
        if line.upper().startswith("SUMMARY:"):
            summary = line.split(":", 1)[1].strip()
        elif line.upper().startswith("SPEAK:"):
            speak_text = line.split(":", 1)[1].strip()
    return summary, speak_text


def main() -> None:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ANTHROPIC_API_KEY 환경변수가 설정되어 있지 않습니다.")
        sys.exit(1)

    system_prompt = load_system_prompt()
    scenario_text = SCENARIO_PATH.read_text(encoding="utf-8")
    segments = parse_scenario(scenario_text)
    if not segments:
        print("시나리오에서 세그먼트를 찾지 못했습니다 (## S1 | 0-4 형식 확인).")
        sys.exit(1)

    client = anthropic.Anthropic()
    meeting_log: list[str] = []
    log_lines: list[str] = ["# 캐피시AI 시뮬레이션 로그\n"]

    for seg_num, start_min, end_min, script in segments:
        print(f"--- SEGMENT {seg_num} ({start_min}~{end_min}분) ---")
        summary, speak_text = ask_catfish(client, system_prompt, script, meeting_log, end_min)

        if summary and summary != "내용 없음":
            meeting_log.append(f"[{end_min}분] {summary}")
        if speak_text.strip().upper() != "PASS":
            meeting_log.append(f"[{end_min}분] (캐피시AI 발화) {speak_text}")

        print(f"[SUMMARY] {summary or '내용 없음'}")
        print(f"[SPEAK] {speak_text}\n")

        log_lines.append(f"## SEGMENT {seg_num} ({start_min}~{end_min}분)\n")
        log_lines.append(f"**스크립트:**\n```\n{script}\n```\n")
        log_lines.append(f"**SUMMARY:** {summary or '내용 없음'}\n")
        log_lines.append(f"**SPEAK:** {speak_text}\n")

    out_path = Path(__file__).parent / f"simulation_log_{time.strftime('%Y%m%d_%H%M%S')}.md"
    out_path.write_text("\n".join(log_lines), encoding="utf-8")
    print(f"전체 로그 저장: {out_path}")


if __name__ == "__main__":
    main()
