import { LectureData } from '../types';

// The Python "video-service" (FastAPI) that actually renders a narrated
// MP4: real text-to-speech audio synced to real rendered slide images via
// ffmpeg/moviepy. Run it with:
//   cd video-service && pip install -r requirements.txt && uvicorn server:app --reload --port 8000
const VIDEO_API = (
  (import.meta as any).env?.VITE_VIDEO_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');

export interface RenderProgress {
  status: 'idle' | 'queued' | 'processing' | 'done' | 'error';
  message: string;
  videoUrl?: string;
}

export class VideoRenderService {
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private cancelled = false;

  public cancel() {
    this.cancelled = true;
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  /**
   * Sends the already-authored lecture (title + slides with real
   * teacherScript narration) to the video-service, which converts each
   * slide into TTS audio + a rendered visual frame and muxes them into a
   * single downloadable MP4 with real narration audio -- unlike the
   * in-browser canvas recorder, which cannot capture speechSynthesis
   * audio and only produces a silent .webm.
   */
  public async renderNarratedVideo(
    lecture: LectureData,
    voice: string,
    onProgress: (progress: RenderProgress) => void
  ): Promise<string> {
    this.cancelled = false;

    onProgress({
      status: 'queued',
      message: 'Uploading lecture script to the narration & rendering service...',
    });

    let jobId: string;
    try {
      const res = await fetch(`${VIDEO_API}/api/video/render-lecture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecture, voice }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Could not start video rendering.');
      }
      jobId = data.job_id;
    } catch (err: any) {
      const message =
        err?.message === 'Failed to fetch'
          ? `Could not reach the video-service at ${VIDEO_API}. Make sure it is running (see video-service/README.md).`
          : err?.message || 'Could not start video rendering.';
      onProgress({ status: 'error', message });
      throw new Error(message);
    }

    return new Promise((resolve, reject) => {
      const poll = async () => {
        if (this.cancelled) {
          if (this.pollTimer) clearInterval(this.pollTimer);
          return;
        }
        try {
          const res = await fetch(`${VIDEO_API}/api/video/jobs/${jobId}`);
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || 'Could not check render status.');
          }

          if (data.status === 'done') {
            if (this.pollTimer) clearInterval(this.pollTimer);
            const videoUrl = `${VIDEO_API}${data.video_url}`;
            onProgress({ status: 'done', message: data.message || 'Video ready.', videoUrl });
            resolve(videoUrl);
          } else if (data.status === 'error') {
            if (this.pollTimer) clearInterval(this.pollTimer);
            const message = data.message || 'Video rendering failed.';
            onProgress({ status: 'error', message });
            reject(new Error(message));
          } else {
            onProgress({
              status: 'processing',
              message: data.message || 'Rendering narrated slides...',
            });
          }
        } catch (err: any) {
          if (this.pollTimer) clearInterval(this.pollTimer);
          const message = err?.message || 'Lost connection to the video-service.';
          onProgress({ status: 'error', message });
          reject(new Error(message));
        }
      };

      poll();
      this.pollTimer = setInterval(poll, 2500);
    });
  }
}

export const videoRenderService = new VideoRenderService();
