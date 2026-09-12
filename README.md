<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/c7d84bb0-f98f-426c-8942-31c48c6732ba

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Real Narrated Lecture Video Export

The "Export" modal has a **Render Narrated Lecture Video (.mp4)** option
that produces a real video with actual text-to-speech narration synced to
rendered slide visuals (as opposed to the "Quick Preview Video (.webm, no
audio)" option, which is an instant but silent in-browser canvas
recording). This uses a small Python service in [`video-service/`](./video-service),
ported over from the working `learnify-ai-upgraded-v2` video pipeline.

To use it, run it alongside the app:

```bash
cd video-service
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000
```

By default the frontend looks for it at `http://localhost:8000` — set
`VITE_VIDEO_API_URL` in `.env.local` if you run it somewhere else. See
[`video-service/README.md`](./video-service/README.md) for details,
system dependencies (ffmpeg, a TTS engine), and deployment notes.

If the video-service isn't running, the "Render Narrated Lecture Video"
option will show a clear connection error and the app otherwise works
normally — it's an optional add-on, not a hard dependency.
