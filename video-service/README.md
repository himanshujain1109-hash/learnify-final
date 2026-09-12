# Notes-to-Video Service

Ported over from the `learnify-ai-upgraded-v2` project's `video-service`,
which already has a real, working narrated-video pipeline. It's plugged
into this app (the Learnify AI Lecture Companion) so the "Render Narrated
Lecture Video" export option produces an actual MP4 instead of the old
silent, in-browser `.webm` canvas recording.

It's a small Python/FastAPI service that turns a script into a video by:

1. Generating real text-to-speech audio for each slide/scene (`tts.py`, via
   `pyttsx3`; falls back to a silent placeholder track if no TTS engine is
   available on the machine, so a job never hard-fails).
2. Rendering a matching visual frame for each slide/scene (`visual.py`, via
   Pillow) — title, bullet takeaways, and a diagram (flow, tree, chart,
   table, etc).
3. Muxing each audio+image pair into a slide clip and concatenating them
   into one `output.mp4` (`assemble.py`, via MoviePy/ffmpeg).

This is intentionally a separate service from the Node/Vite app because
video rendering is long-running and needs Python + ffmpeg, not just
Node.

## Two ways it's used

- **Upload a PPTX/PDF/TXT** (`POST /api/video/jobs`): extracts the text,
  writes a curriculum with a local LLM (Ollama) or an offline fallback
  generator, then renders it. This is the flow ported over unchanged from
  Learnify AI.
- **Render an already-authored lecture** (`POST /api/video/render-lecture`):
  used by the Learnify AI Lecture Companion's "Render Narrated Lecture Video"
  export option. The frontend already has Gemini-generated, real per-slide
  narration (`teacherScript`) and diagrams, so this path skips the LLM
  step entirely and goes straight to TTS + visuals + assembly.

Both flows share the same job queue, status polling, and video download
endpoints:

- `GET /api/video/jobs/{job_id}` — status + metadata
- `GET /api/video/jobs/{job_id}/video` — the finished `output.mp4`

## Local run

```bash
cd video-service
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

uvicorn server:app --host 0.0.0.0 --port 8000
```

Health check: `GET http://localhost:8000/health`

The frontend (see the project root `.env.example`) expects:
`VITE_VIDEO_API_URL=http://localhost:8000`

### System dependencies

- **ffmpeg** must be available (MoviePy/`imageio-ffmpeg` bundles one, but
  installing a system ffmpeg avoids platform-specific edge cases).
- **pyttsx3** uses your OS's native TTS voices (SAPI5 on Windows,
  NSSpeechSynthesizer on macOS, `espeak`/`espeak-ng` on Linux — install
  `espeak-ng` if you're on Linux and want real narration instead of the
  silent fallback track).

## Deploy

Deploy this folder to a Python-friendly host (Render, Railway, Fly.io,
etc). Set:

- `OLLAMA_HOST` (optional; only used by the upload-a-document flow)
- `LOCAL_LLM_MODEL` (optional; defaults to `qwen2.5:7b`)
- `ENABLE_OFFLINE_FALLBACK` (optional; defaults to `true`)
- `FRONTEND_URL` — comma-separated list of allowed origins for CORS
- `MAX_FILE_MB` (optional; defaults to `20`)

Then set `VITE_VIDEO_API_URL` on the frontend deployment to this service's
public URL and redeploy.

## Important

Generated jobs are kept on local disk under `jobs/`. For a production
deployment where videos need to survive restarts/redeploys, swap that for
object storage (S3, Cloudinary, Supabase Storage, etc).
