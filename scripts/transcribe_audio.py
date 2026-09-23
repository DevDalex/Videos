import json
import os
from pathlib import Path

from faster_whisper import WhisperModel

video_id = os.environ["VIDEO_ID"]

candidates = [
    Path("audio.media"),
    Path("audio.mp3"),
    Path("audio.webm"),
    Path("audio.m4a"),
    Path("audio.mp4"),
]

audio_path = next((path for path in candidates if path.exists()), None)
if audio_path is None:
    raise SystemExit("No downloaded audio file was found")

info_path = Path("audio.info.json")
title = None

if info_path.exists():
    try:
        title = json.loads(info_path.read_text("utf-8")).get("title")
    except Exception:
        title = None

model_name = os.environ.get("WHISPER_MODEL", "base")
model = WhisperModel(model_name, device="cpu", compute_type="int8")

segments_iter, info = model.transcribe(
    str(audio_path),
    vad_filter=True,
    beam_size=5
)

segments = []
parts = []

for segment in segments_iter:
    text = segment.text.strip()
    if not text:
        continue

    start_ms = int(segment.start * 1000)
    end_ms = int(segment.end * 1000)

    segments.append({
        "startMs": start_ms,
        "endMs": end_ms,
        "durationMs": max(0, end_ms - start_ms),
        "text": text,
    })
    parts.append(text)

text = " ".join(parts).strip()

if not text:
    raise SystemExit("Whisper returned an empty transcript")

result = {
    "ok": True,
    "videoId": video_id,
    "title": title,
    "language": getattr(info, "language", None),
    "generated": True,
    "source": "whisper-audio",
    "segments": segments,
    "text": text,
}

Path("transcript.json").write_text(
    json.dumps(result, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
Path("transcript.txt").write_text(text + "\n", encoding="utf-8")

print(json.dumps({
    "ok": True,
    "videoId": video_id,
    "source": "whisper-audio",
    "language": result["language"],
    "segments": len(segments),
    "characters": len(text),
}))
