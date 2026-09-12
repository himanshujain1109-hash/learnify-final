import { LectureData } from '../types';

export interface VideoJobStatus {
  job_id: string;
  status: 'queued' | 'processing' | 'done' | 'error' | 'unknown';
  message?: string;
  video_url?: string;
}

export interface VideoExportOptions {
  voice?: 'male' | 'female' | 'default';
  language?: string;
  level?: string;
}

async function readJsonSafely(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/** Kicks off real MP4 rendering for a lecture that has already been generated. */
export async function startVideoExport(
  lecture: LectureData,
  options: VideoExportOptions = {},
): Promise<{ job_id: string }> {
  const response = await fetch('/api/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lecture,
      voice: options.voice || lecture.voiceGender || 'default',
      language: options.language || lecture.language || 'English',
      level: options.level || lecture.level || 'intermediate',
    }),
  });

  const data = await readJsonSafely(response);
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to start video export.');
  }
  return data;
}

export async function getVideoJobStatus(jobId: string): Promise<VideoJobStatus> {
  const response = await fetch(`/api/generate-video/${jobId}`);
  const data = await readJsonSafely(response);
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to check video export status.');
  }
  return data;
}

/** Polls a rendering job until it finishes (done or error), reporting progress. */
export async function pollVideoJob(
  jobId: string,
  onProgress?: (status: VideoJobStatus) => void,
  config: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<VideoJobStatus> {
  const intervalMs = config.intervalMs ?? 3000;
  const timeoutMs = config.timeoutMs ?? 20 * 60 * 1000;
  const startedAt = Date.now();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const status = await getVideoJobStatus(jobId);
    onProgress?.(status);

    if (status.status === 'done' || status.status === 'error') {
      return status;
    }
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error('Video export timed out. Please try again.');
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/** Triggers a browser download of the rendered MP4 at `videoUrl`. */
export function downloadVideo(videoUrl: string, filename = 'lecture.mp4') {
  const link = document.createElement('a');
  link.href = videoUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
