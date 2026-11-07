# PrepBoard's free voice: Kokoro-82M on CPU.
# Builds in the cloud (Hugging Face or Google Cloud Build) — nothing runs on your laptop.
FROM python:3.11-slim

# espeak-ng: Kokoro's fallback for words its dictionary does not know
RUN apt-get update && apt-get install -y --no-install-recommends espeak-ng && rm -rf /var/lib/apt/lists/*

# Hugging Face Spaces run as user 1000
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user PATH=/home/user/.local/bin:$PATH HF_HOME=/home/user/.cache/huggingface PYTHONUNBUFFERED=1
WORKDIR /home/user/app

COPY --chown=user requirements.txt .
# the CPU-only build of torch is a fraction of the size of the default one
RUN pip install --no-cache-dir --user torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir --user -r requirements.txt

COPY --chown=user app.py warm.py ./
# bake the model, the voices and the English dictionaries into the image, so a
# cold start does not have to download them first
RUN python warm.py

EXPOSE 7860
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-7860} --workers 1"]
