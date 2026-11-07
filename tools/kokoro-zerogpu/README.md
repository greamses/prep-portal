---
title: PrepBoard Voice
colorFrom: yellow
colorTo: blue
sdk: gradio
app_file: app.py
pinned: false
license: apache-2.0
---

# PrepBoard voice: "Delayed" (Kokoro-82M on ZeroGPU)

The free, queued voice for PrepBoard on www.prepportal.com.ng.
Kokoro-82M by hexgrad, Apache 2.0. Hardware: ZeroGPU (Settings, then Hardware).

The Prep Portal server calls `/gradio_api/call/tts` with `{"data": [text, voice]}`.
Set `HF_SPACE_URL` (this Space's `https://<user>-<space>.hf.space` address) and
`HF_TOKEN` (a read token, so the GPU time comes out of this account's free
daily allowance) on the Prep Portal server.
