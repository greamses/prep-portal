"""
PrepBoard's "Delayed" voice: Kokoro-82M (Apache 2.0) on a Hugging Face
Gradio Space, on ZeroGPU when the account has it, otherwise on the free CPU.

A shared GPU is lent to each request, so a sentence can wait in a queue first:
that is why PrepBoard calls this voice "Delayed".

API (Gradio):  POST /gradio_api/call/tts  {"data": [text, voice]}  -> event id
               GET  /gradio_api/call/tts/<event id>  -> SSE; "complete" carries the MP3 file
"""
import gradio as gr
import numpy as np
import torch

# ZeroGPU when the Space has it; on free CPU hardware the same code runs on the CPU
try:
    import spaces
    GPU = spaces.GPU
except Exception:  # no "spaces" package: a plain CPU Space
    def GPU(**_):
        return lambda f: f
from kokoro import KModel, KPipeline

VOICES = [
    "af_heart", "af_bella", "af_nicole", "am_michael", "am_fenrir",
    "bf_emma", "bf_isabella", "bm_george", "bm_fable",
]

# the model goes to the GPU when one is lent (ZeroGPU allows .to("cuda") at start-up)
model = KModel().to("cuda" if torch.cuda.is_available() else "cpu").eval()
# the pipelines only turn text into phonemes here; the model above speaks them
pipes = {lang: KPipeline(lang_code=lang, model=False) for lang in "ab"}
for v in VOICES:
    pipes[v[0]].load_voice(v)


@GPU(duration=30)
def speak(ps, ref_s):
    return model(ps, ref_s.to(model.device), 1.0).cpu().numpy()


def tts(text, voice):
    voice = voice if voice in VOICES else "af_heart"
    text = (text or "").strip()[:1200]
    if not text:
        raise gr.Error("text is empty")
    pipe = pipes[voice[0]]
    pack = pipe.load_voice(voice)
    parts = []
    for _, ps, _ in pipe(text, voice, 1.0):
        parts.append(speak(ps, pack[len(ps) - 1]))
    if not parts:
        raise gr.Error("nothing to say")
    return 24000, np.concatenate(parts)


demo = gr.Interface(
    fn=tts,
    inputs=[gr.Textbox(label="Text"), gr.Dropdown(VOICES, value="af_heart", label="Voice")],
    outputs=gr.Audio(label="Speech", format="mp3"),
    title="PrepBoard voice",
    api_name="tts",
)
demo.queue(max_size=40).launch()
