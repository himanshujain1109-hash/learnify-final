# Remix Teacher — Video Rendering Service

This service is intentionally separate from the main Express/Vite app because
real MP4 rendering (TTS + image generation + moviepy/FFmpeg assembly) is
long-running, Python-based, and needs real job files on disk — none of which
work in a serverless function.

It exposes two ways to create a video job:

- `POST /api/video/jobs` — original flow: upload a `.pptx`/`.pdf`/`.txt` file;
  the service extracts the text and generates its own curriculum/script.
- `POST /api/video/lecture-jobs` — **used by the Remix Teacher app.** Takes the
  lecture JSON that `/api/generate-lecture` already produced (slides,
  bullets, teacher script) and renders it straight to video, skipping
  extraction/curriculum-generation entirely.

Both flows share the same status/result endpoints:

- `GET /api/video/jobs/{job_id}` — poll status (`queued` / `processing` /
  `done` / `error`), plus a `video_url` once done.
- `GET /api/video/jobs/{job_id}/video` — the rendered `output.mp4`.

The main app's `server.ts` proxies all of this under `/api/generate-video*`,
so the browser only ever talks to the Express app on the same origin — it
never calls this service directly. That avoids CORS entirely in production.

## Local run

```bash
cd video-service
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000
```

Health check: `GET http://localhost:8000/health`

Then, in the project root, set (`.env`, alongside `GEMINI_API_KEY`):

```bash
VIDEO_SERVICE_URL=http://localhost:8000
```

and run the app as usual (`npm run dev`). The "Download Video" button in the
lecture player will now call this service through the Express server.

No TTS engine or FFmpeg install is strictly required to get *a* video:
`tts.py` falls back to a silent narration track if `pyttsx3`/`espeak` aren't
available, and `imageio-ffmpeg` bundles its own FFmpeg binary for moviepy.
Installing `espeak-ng`/`espeak` (Linux) gives you real spoken narration
instead of silence.

## Deploy

Deploy this folder to a Python-friendly host that supports long-running
processes — Render, Railway, or Fly.io all work with the included
`Dockerfile`. Vercel (where the main app's `api/` functions run) **cannot**
run this service.

Environment variables:

- `FRONTEND_URL` — comma-separated list of origins allowed to call this
  service directly (not required if everything goes through the Express
  proxy, but useful if you ever expose it publicly).
- `MAX_FILE_MB` — upload size limit for the file-based flow (default `20`).

Then set `VIDEO_SERVICE_URL` on the Express app's deployment to this
service's public URL.

## Important

Generated jobs live on this service's own disk under `jobs/`. For a
production system where videos must survive restarts/redeploys, replace the
local `jobs/` directory with object storage such as S3/Cloudinary/Supabase
Storage.
