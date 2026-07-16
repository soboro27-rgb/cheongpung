"""
캣피쉬 파일럿 — 회의 화자 참여 프로토타입

마이크 녹음(Enter로 시작/종료) -> faster-whisper STT -> Claude(캣피쉬 코어 프롬프트)
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
import wave
from pathlib import Path

import anthropic
import edge_tts
import numpy as np
import sounddevice as sd
from faster_whisper import WhisperModel
from playsound import playsound

PROMPT_PATH = Path(__file__).parent / "catfish_core_prompt.md"
SAMPLE_RATE = 16000
TTS_VOICE = "ko-KR-InJoonNeural"
MODEL = "claude-opus-4-8"


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


def save_wav(audio: np.ndarray, path: str) -> None:
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(audio.tobytes())


def transcribe(model: WhisperModel, wav_path: str) -> str:
    segments, _ = model.transcribe(wav_path, language="ko")
    return "".join(seg.text for seg in segments).strip()


def ask_catfish(client: anthropic.Anthropic, system_prompt: str, transcript: str) -> tuple[str, str]:
    response = client.messages.create(
        model=MODEL,
        max_tokens=500,
        system=system_prompt,
        messages=[{"role": "user", "content": f"[회의 구간 스크립트]\n{transcript}"}],
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
    communicate = edge_tts.Communicate(text, TTS_VOICE)
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

    print("\n캣피쉬 파일럿 준비 완료. 블루투스 스피커가 Windows 기본 출력 장치인지 확인하세요.")
    print("Ctrl+C로 종료합니다.\n")

    meeting_log: list[str] = []

    while True:
        try:
            audio = record_until_enter()
            if audio.size == 0:
                print("녹음된 내용이 없습니다.\n")
                continue

            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                wav_path = tmp.name
            save_wav(audio, wav_path)

            print("음성 인식 중...")
            transcript = transcribe(whisper_model, wav_path)
            os.unlink(wav_path)

            if not transcript:
                print("인식된 텍스트가 없습니다.\n")
                continue

            print(f"[인식된 내용] {transcript}")
            print("캣피쉬 판단 중...")
            summary, speak_text = ask_catfish(client, system_prompt, transcript)

            if summary and summary != "내용 없음":
                meeting_log.append(f"[{time.strftime('%H:%M:%S')}] {summary}")
                print(f"[요약 기록] {summary}")
            else:
                print("[요약 기록] 내용 없음")

            if speak_text.strip().upper() == "PASS":
                print("[캣피쉬] 조용히 관찰만 합니다. (개입 없음)\n")
                continue

            print(f"[캣피쉬 발화] {speak_text}")
            speak(speak_text)
            print()

        except KeyboardInterrupt:
            print("\n종료합니다.")
            if meeting_log:
                notes_path = save_meeting_notes(meeting_log)
                print(f"회의 요약이 저장되었습니다: {notes_path}")
            break


if __name__ == "__main__":
    main()
