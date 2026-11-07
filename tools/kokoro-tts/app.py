"""
PrepBoard's free voice: Kokoro-82M (Apache 2.0) behind one small HTTP API.

    GET  /health          -> {"ok": true}  (also wakes a sleeping host and loads the model)
    POST /tts             {"text": "...", "voice": "af_heart", "speed": 1.0}
                          -> audio/mpeg (mono, 24 kHz, 64 kbps)

Send "Authorization: Bearer <KOKORO_TOKEN>" when the host has KOKORO_TOKEN set
(it always should in production: the Prep Portal server is the only caller).
The same container runs on a Hugging Face Docker Space (port 7860) or Google
Cloud Run (it reads $PORT).
"""
import os
import threading

import lameenc
import numpy as np
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from kokoro import KModel, KPipeline

TOKEN = os.environ.get("KOKORO_TOKEN", "")
SAMPLE_RATE = 24000

# American (a…) and British (b…) English voices, the best-graded ones first
VOICES = {
    "af_heart", "af_bella", "af_nicole", "af_sarah", "af_aoede", "af_kore",
    "am_michael", "am_fenrir", "am_puck", "am_echo",
    "bf_emma", "bf_isabella", "bf_alice", "bf_lily",
    "bm_george", "bm_fable", "bm_lewis", "bm_daniel",
}

app = FastAPI()
_lock = threading.Lock()
_model = None
_pipes = {}


def pipeline(lang: str) -> KPipeline:
    """One model in memory, shared by the American and the British pipeline."""
    global _model
    with _lock:
        if _model is None:
            _model = KModel().eval()
        if lang not in _pipes:
            _pipes[lang] = KPipeline(lang_code=lang, model=_model)
        return _pipes[lang]


class Req(BaseModel):
    text: str
    voice: str = "af_heart"
    speed: float = 1.0


def to_mp3(audio: np.ndarray) -> bytes:
    pcm = (np.clip(audio, -1.0, 1.0) * 32767).astype(np.int16).tobytes()
    enc = lameenc.Encoder()
    enc.set_bit_rate(64)
    enc.set_in_sample_rate(SAMPLE_RATE)
    enc.set_channels(1)
    enc.set_quality(2)
    return enc.encode(pcm) + enc.flush()


@app.get("/health")
def health():
    pipeline("a")
    return {"ok": True}


@app.post("/tts")
def tts(req: Req, authorization: str | None = Header(default=None)):
    if TOKEN and authorization != f"Bearer {TOKEN}":
        raise HTTPException(status_code=401, detail="unauthorised")
    text = (req.text or "").strip()[:1200]
    if not text:
        raise HTTPException(status_code=400, detail="text is empty")
    voice = req.voice if req.voice in VOICES else "af_heart"
    speed = min(1.4, max(0.7, float(req.speed or 1.0)))
    pipe = pipeline(voice[0])  # 'a' American, 'b' British
    parts = []
    for _, _, audio in pipe(text, voice=voice, speed=speed):
        if audio is None:
            continue
        parts.append(audio.numpy() if hasattr(audio, "numpy") else np.asarray(audio))
    if not parts:
        raise HTTPException(status_code=422, detail="nothing to say")
    return Response(content=to_mp3(np.concatenate(parts)), media_type="audio/mpeg")
