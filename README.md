<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/dafe3fcc-2299-44be-b20a-3bf4ab01dccf

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Real MP4 video export

The "Notes → Video" player renders live in the browser (slides + teacher
avatar + Web Speech API narration) — that view never produced an actual
downloadable video file.

There's now a **Download Video** button next to Stop, in the player, that
renders a real, shareable `.mp4` (narrated slides, assembled with
moviepy/FFmpeg) via a small Python sidecar in [`video-service/`](video-service).

To use it locally:

```bash
cd video-service
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000
```

Then, back in the project root, make sure `.env.local` (or `.env`) has:

```bash
VIDEO_SERVICE_URL=http://localhost:8000
```

and start the app as usual (`npm run dev`). See
[`video-service/README.md`](video-service/README.md) for how it works and how
to deploy it (it needs FFmpeg + a persistent process, so it must be deployed
separately from Vercel — Render/Railway/Fly all work).
