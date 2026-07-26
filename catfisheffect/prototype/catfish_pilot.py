"""
캐피시AI 파일럿 — 회의 화자 참여 프로토타입

마이크 녹음(Enter로 시작/종료) -> faster-whisper STT -> Claude(캐피시AI 코어 프롬프트)
-> edge-tts -> 블루투스 스피커(Windows 기본 출력 장치) 재생

사전 준비:
- 블루투스 스피커를 Windows 기본 출력 장치로 설정해둘 것
- ANTHROPIC_API_KEY 환경변수 설정
"""

import asyncio
import os
import sys
import tempfile
import time
from pathlib import Path

import anthropic
import edge_tts
import numpy as np
import sounddevice as sd
from faster_whisper import WhisperModel
from playsound import playsound

PROMPT_PATH = Path(__file__).parent / "catfish_core_prompt_v2.md"
SAMPLE_RATE = 16000
MAX_CHUNK_SECONDS = 25
TTS_VOICE = "ko-KR-SunHiNeural"
TTS_RATE = "+2%"
MODEL = "claude-opus-4-8"
INTRO_MESSAGE = (
    "안녕하세요, 캐피시입니다. 오늘 회의에 함께하겠습니다. "
    "내용은 판단하지 않고, 필요할 때만 짧게 말씀드리겠습니다."
)
OUTRO_MESSAGE = (
    "오늘 회의 수고 많으셨습니다. 논의된 내용은 정리해서 공유해드리겠습니다."
)


def load_system_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8").strip()


def record_until_enter() -> np.ndarray:
    input("녹음을 시작하려면 Enter를 누르세요... ")
    frames: list[np.ndarray] = []

    def callback(indata, frame_count, time_info, status):
        frames.append(indata.copy())

    print("녹음 중... 다시 Enter를 누르면 종료합니다.")
    with sd.InputStream(samplerate=SAMPLE_RATE, channels=1, dtype="int16", callback=callback):
        input()

    if not frames:
        return np.zeros((0,), dtype=np.int16)
    return np.concatenate(frames, axis=0).flatten()


def transcribe(model: WhisperModel, audio: np.ndarray) -> str:
    """녹음이 길어도 안전하도록 MAX_CHUNK_SECONDS 단위로 잘라서 STT를 돌립니다.

    긴 오디오를 통째로 넘기면 faster-whisper의 feature extractor가 비정상적으로
    큰 배열을 할당하려다 메모리 부족으로 크래시하는 문제가 있어(수십 GB 요구),
    청크로 나눠서 우회합니다.
    """
    audio_float = audio.astype(np.float32) / 32768.0
    chunk_size = MAX_CHUNK_SECONDS * SAMPLE_RATE

    texts: list[str] = []
    for start in range(0, len(audio_float), chunk_size):
        chunk = audio_float[start : start + chunk_size]
        if chunk.size == 0:
            continue
        segments, _ = model.transcribe(chunk, language="ko")
        texts.append("".join(seg.text for seg in segments))

    return "".join(texts).strip()


def ask_catfish(
    client: anthropic.Anthropic, system_prompt: str, transcript: str, meeting_log: list[str]
) -> tuple[str, str]:
    if meeting_log:
        meeting_summary = "\n".join(meeting_log)
        user_content = (
            f"[지금까지의 회의 요약]\n{meeting_summary}\n\n[회의 구간 스크립트]\n{transcript}"
        )
    else:
        user_content = f"[회의 구간 스크립트]\n{transcript}"

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


def save_meeting_notes(log: list[str]) -> Path:
    out_path = Path(__file__).parent / f"meeting_notes_{time.strftime('%Y%m%d_%H%M%S')}.md"
    out_path.write_text(
        "# 회의 요약\n\n" + "\n".join(f"- {line}" for line in log) + "\n",
        encoding="utf-8",
    )
    return out_path


async def synthesize(text: str, mp3_path: str) -> None:
    communicate = edge_tts.Communicate(text, TTS_VOICE, rate=TTS_RATE)
    await communicate.save(mp3_path)


def speak(text: str) -> None:
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        mp3_path = tmp.name
    asyncio.run(synthesize(text, mp3_path))
    playsound(mp3_path)
    os.unlink(mp3_path)


def main() -> None:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ANTHROPIC_API_KEY 환경변수가 설정되어 있지 않습니다.")
        print("console.anthropic.com 에서 API 키를 발급받아 설정해주세요.")
        sys.exit(1)

    system_prompt = load_system_prompt()
    client = anthropic.Anthropic()

    print("STT 모델 로딩 중 (최초 실행 시 다운로드로 시간이 걸릴 수 있습니다)...")
    whisper_model = WhisperModel("small", device="cpu", compute_type="int8")

    print("\n캐피시AI 파일럿 준비 완료. 블루투스 스피커가 Windows 기본 출력 장치인지 확인하세요.")
    print("Ctrl+C로 종료합니다.\n")

    print(f"[캐피시AI 발화] {INTRO_MESSAGE}")
    speak(INTRO_MESSAGE)
    print()

    meeting_log: list[str] = []

    while True:
        try:
            audio = record_until_enter()
            if audio.size == 0:
                print("녹음된 내용이 없습니다.\n")
                continue

            print("음성 인식 중...")
            transcript = transcribe(whisper_model, audio)

            if not transcript:
                print("인식된 텍스트가 없습니다.\n")
                continue

            print(f"[인식된 내용] {transcript}")
            print("캐피시AI 판단 중...")
            summary, speak_text = ask_catfish(client, system_prompt, transcript, meeting_log)

            if summary and summary != "내용 없음":
                meeting_log.append(f"[{time.strftime('%H:%M:%S')}] {summary}")
                print(f"[요약 기록] {summary}")
            else:
                print("[요약 기록] 내용 없음")

            if speak_text.strip().upper() == "PASS":
                print("[캐피시AI] 조용히 관찰만 합니다. (개입 없음)\n")
                continue

            print(f"[캐피시AI 발화] {speak_text}")
            speak(speak_text)
            print()

        except KeyboardInterrupt:
            print("\n종료합니다.")
            print(f"[캐피시AI 발화] {OUTRO_MESSAGE}")
            speak(OUTRO_MESSAGE)
            if meeting_log:
                notes_path = save_meeting_notes(meeting_log)
                print(f"회의 요약이 저장되었습니다: {notes_path}")
            break


if __name__ == "__main__":
    main()
