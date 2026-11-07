---
title: PrepBoard Voice
colorFrom: yellow
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
license: apache-2.0
---

# PrepBoard voice (Kokoro-82M)

The free text-to-speech voice for PrepBoard on www.prepportal.com.ng.
Kokoro-82M by hexgrad, Apache 2.0.

- `GET /health`: wakes the host and loads the model.
- `POST /tts` `{"text","voice","speed"}` with `Authorization: Bearer $KOKORO_TOKEN`: returns MP3.

Set the secret `KOKORO_TOKEN` on the host, and the same value as `KOKORO_TOKEN`
(with the host's address as `KOKORO_URL`) on the Prep Portal server.

The same image runs on Google Cloud Run (it listens on `$PORT`).
