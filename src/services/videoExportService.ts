import { LectureData, TeacherPersona } from '../types';

export interface VideoRecordProgress {
  status: 'idle' | 'rendering' | 'encoding' | 'completed' | 'error';
  currentSlide: number;
  totalSlides: number;
  percent: number;
  message: string;
  videoUrl?: string;
  videoBlob?: Blob;
}

export class VideoExportService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isCancelled: boolean = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1280;
    this.canvas.height = 720;
    this.ctx = this.canvas.getContext('2d')!;
  }

  public cancel() {
    this.isCancelled = true;
  }

  public async renderLectureToVideo(
    lecture: LectureData,
    teacher: TeacherPersona,
    onProgress: (progress: VideoRecordProgress) => void
  ): Promise<Blob> {
    this.isCancelled = false;

    if (!window.MediaRecorder) {
      throw new Error('MediaRecorder is not supported in this browser environment.');
    }

    const stream = this.canvas.captureStream(30); // 30 FPS
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.start();

    const totalSlides = lecture.slides.length;
    // Render each slide for a suitable duration (e.g. 5-7 seconds per slide in video mode)
    const secondsPerSlide = 5;
    const fps = 30;
    const framesPerSlide = secondsPerSlide * fps;
    const totalFrames = totalSlides * framesPerSlide;

    let globalFrame = 0;

    for (let sIdx = 0; sIdx < totalSlides; sIdx++) {
      if (this.isCancelled) {
        mediaRecorder.stop();
        throw new Error('Video recording cancelled.');
      }

      const slide = lecture.slides[sIdx];

      onProgress({
        status: 'rendering',
        currentSlide: sIdx + 1,
        totalSlides,
        percent: Math.round((globalFrame / totalFrames) * 90),
        message: `Rendering Slide ${sIdx + 1} of ${totalSlides}: "${slide.topicTitle}"...`,
      });

      for (let f = 0; f < framesPerSlide; f++) {
        if (this.isCancelled) {
          mediaRecorder.stop();
          throw new Error('Video recording cancelled.');
        }

        const slideProgress = f / framesPerSlide;
        this.drawSlideFrame(slide, teacher, sIdx + 1, totalSlides, slideProgress, f);
        globalFrame++;

        // Yield to browser frame
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    }

    onProgress({
      status: 'encoding',
      currentSlide: totalSlides,
      totalSlides,
      percent: 95,
      message: 'Finalizing lecture video stream...',
    });

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(recordedChunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(videoBlob);
        onProgress({
          status: 'completed',
          currentSlide: totalSlides,
          totalSlides,
          percent: 100,
          message: 'Video rendering complete!',
          videoUrl,
          videoBlob,
        });
        resolve(videoBlob);
      };

      mediaRecorder.onerror = (err) => {
        reject(err);
      };

      mediaRecorder.stop();
    });
  }

  private drawSlideFrame(
    slide: any,
    teacher: TeacherPersona,
    slideNum: number,
    totalSlides: number,
    progress: number,
    frameIndex: number
  ) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Blackboard / Canvas Background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle classroom grid
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 40; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Outer frame border (chalkboard wood frame feel)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    // 2. Header Bar
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(`SLIDE ${slideNum} OF ${totalSlides} • ${slide.chapterTitle.toUpperCase()}`, 48, 52);

    // Slide Topic Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(slide.topicTitle, 48, 90);

    // Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(slide.subtitle, 48, 118);

    // 3. Chalkboard Formula Note (if present)
    if (slide.blackboardSummarySnippet) {
      ctx.fillStyle = '#1e293b';
      this.roundRect(ctx, 48, 138, 700, 36, 8, true, false);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`CHALKBOARD AXIOM: ${slide.blackboardSummarySnippet}`, 62, 161);
    }

    // 4. Bullet Points (Animated reveal)
    const bulletsStartY = slide.blackboardSummarySnippet ? 195 : 160;
    const bullets = slide.bullets || [];

    bullets.forEach((b: any, bIdx: number) => {
      const bulletThreshold = bIdx / bullets.length;
      if (progress < bulletThreshold * 0.7) return; // Animated stagger

      const y = bulletsStartY + bIdx * 82;

      // Bullet container
      const isHighlighted = progress >= bulletThreshold && progress < (bIdx + 1) / bullets.length;
      ctx.fillStyle = isHighlighted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.6)';
      ctx.strokeStyle = isHighlighted ? '#10b981' : '#334155';
      ctx.lineWidth = 1;
      this.roundRect(ctx, 48, y, 700, 72, 8, true, true);

      // Bullet tag / heading
      ctx.fillStyle = isHighlighted ? '#34d399' : '#f8fafc';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(`• ${b.heading}`, 64, y + 26);

      // Content
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const truncated = b.content.length > 78 ? b.content.slice(0, 75) + '...' : b.content;
      ctx.fillText(truncated, 64, y + 50);

      // Highlight emphasis tag
      if (b.emphasis) {
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(`[${b.emphasis}]`, 640 - (b.emphasis.length * 6), y + 26);
      }
    });

    // 5. Right Column: Visual Diagram Box
    const diagX = 780;
    const diagY = 52;
    const diagW = 452;
    const diagH = 340;

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    this.roundRect(ctx, diagX, diagY, diagW, diagH, 12, true, true);

    // Diagram title
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(`CONCEPT VISUAL: ${slide.visualDiagram?.title || 'System Flow'}`, diagX + 18, diagY + 30);

    // Render Diagram Nodes
    const diagElements = slide.visualDiagram?.elements || [];
    const nodeCount = Math.min(4, diagElements.length);

    for (let i = 0; i < nodeCount; i++) {
      const el = diagElements[i];
      const nodeY = diagY + 56 + i * 66;

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, diagX + 24, nodeY, diagW - 48, 52, 8, true, true);

      // Step badge
      ctx.fillStyle = '#0ea5e9';
      this.roundRect(ctx, diagX + 36, nodeY + 12, 48, 26, 6, true, false);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(el.badge || `Step ${i + 1}`, diagX + 42, nodeY + 29);

      // Node label & sublabel
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(el.label, diagX + 96, nodeY + 25);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(el.sublabel || '', diagX + 96, nodeY + 42);

      // Down arrow between nodes
      if (i < nodeCount - 1) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('↓', diagX + (diagW / 2) - 4, nodeY + 62);
      }
    }

    // 6. Right Column: Teacher Podium Avatar Box
    const teacherY = 410;
    const teacherH = 175;
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, diagX, teacherY, diagW, teacherH, 12, true, true);

    // Teacher Avatar Circle with animated speaking pulse
    const mouthPulse = Math.sin(frameIndex * 0.3) * 3;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(diagX + 54, teacherY + 60, 30 + Math.abs(mouthPulse) * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Initials
    ctx.fillStyle = '#090d16';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const initials = teacher.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
    ctx.fillText(initials, diagX + 44, teacherY + 67);

    // Teacher details
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(teacher.name, diagX + 102, teacherY + 50);

    ctx.fillStyle = '#34d399';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(`${teacher.title} • Active Lecturer`, diagX + 102, teacherY + 70);

    // Speaking wave animation
    ctx.fillStyle = '#10b981';
    for (let bar = 0; bar < 5; bar++) {
      const barH = 8 + Math.abs(Math.sin((frameIndex + bar * 10) * 0.25)) * 18;
      ctx.fillRect(diagX + 102 + bar * 12, teacherY + 95 - barH / 2, 6, barH);
    }
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('NARRATING LECTURE AUDIO', diagX + 175, teacherY + 98);

    // Teacher Callout Note inside teacher box
    if (slide.calloutBox) {
      ctx.fillStyle = '#1e293b';
      this.roundRect(ctx, diagX + 18, teacherY + 118, diagW - 36, 44, 6, true, false);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(`TIP: ${slide.calloutBox.title || 'Key Focus'}`, diagX + 28, teacherY + 134);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const tipSnippet = slide.calloutBox.text.length > 55 ? slide.calloutBox.text.slice(0, 52) + '...' : slide.calloutBox.text;
      ctx.fillText(tipSnippet, diagX + 28, teacherY + 150);
    }

    // 7. Bottom Subtitles / Narration Bar
    const subH = 92;
    const subY = h - subH - 12;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, 48, subY, w - 96, subH, 12, true, true);

    // Subtitle label
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('TEACHER EXPLANATION (VOICEOVER SUBTITLES)', 68, subY + 24);

    // Active narration text
    ctx.fillStyle = '#f8fafc';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const scriptText = slide.teacherScript || '';
    const charProgress = Math.floor(progress * scriptText.length);
    const displayedScript = scriptText.slice(0, Math.max(40, charProgress));

    // Multi-line wrap
    this.wrapText(ctx, `"${displayedScript}"`, 68, subY + 48, w - 140, 20);

    // 8. Progress Indicator Bar along the very bottom
    const overallProgress = (slideNum - 1 + progress) / totalSlides;
    ctx.fillStyle = '#334155';
    ctx.fillRect(48, h - 16, w - 96, 4);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(48, h - 16, (w - 96) * overallProgress, 4);
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number,
    fill: boolean,
    stroke: boolean
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) {
    const words = text.split(' ');
    let line = '';
    let curY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, curY);
        line = words[n] + ' ';
        curY += lineHeight;
        if (curY > y + lineHeight * 2) {
          // Limit to 2 lines max in subtitle box
          ctx.fillText(line + '...', x, curY);
          return;
        }
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, curY);
  }
}

export const videoExportService = new VideoExportService();
