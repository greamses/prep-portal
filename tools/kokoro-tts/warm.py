"""Run at image build: download the model, every voice and the English G2P data once."""
from app import VOICES, pipeline

for lang in ("a", "b"):
    p = pipeline(lang)
    for v in sorted(VOICES):
        if v[0] == lang:
            p.load_voice(v)
    # one short sentence pulls in the dictionaries (and spaCy's small English model)
    for _ in p("Hello there.", voice="af_heart" if lang == "a" else "bf_emma"):
        pass
print("kokoro warm: ok")
