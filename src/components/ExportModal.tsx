import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LectureData, TeacherPersona } from '../types';
import { videoExportService, VideoRecordProgress } from '../services/videoExportService';
import { videoRenderService, RenderProgress } from '../services/videoRenderService';
import {
  Download,
  FileText,
  Video,
  Printer,
  Copy,
  Check,
  X,
  Sparkles,
  Share2,
  Loader2,
  Film,
  Play,
  Mic
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lecture: LectureData;
  teacher: TeacherPersona;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  lecture,
  teacher,
}) => {
  const [copied, setCopied] = useState(false);
  const [recordProgress, setRecordProgress] = useState<VideoRecordProgress>({
    status: 'idle',
    currentSlide: 1,
    totalSlides: lecture.slides.length,
    percent: 0,
    message: '',
  });
  const [renderProgress, setRenderProgress] = useState<RenderProgress>({
    status: 'idle',
    message: '',
  });

  if (!isOpen) return null;

  const handleStartRenderNarratedVideo = async () => {
    setRenderProgress({ status: 'queued', message: 'Starting narrated render...' });
    try {
      await videoRenderService.renderNarratedVideo(
        lecture,
        teacher.voiceGender === 'male' ? 'male' : 'female',
        (progress) => setRenderProgress(progress)
      );
    } catch (err: any) {
      // Progress state already carries the error message via onProgress.
      console.error('Narrated video render failed:', err);
    }
  };

  const handleCancelRender = () => {
    videoRenderService.cancel();
    setRenderProgress({ status: 'idle', message: '' });
  };

  const handleStartRecordVideo = async () => {
    try {
      setRecordProgress({
        status: 'rendering',
        currentSlide: 1,
        totalSlides: lecture.slides.length,
        percent: 0,
        message: 'Initializing HD Canvas & MediaRecorder engine...',
      });

      const blob = await videoExportService.renderLectureToVideo(
        lecture,
        teacher,
        (progress) => setRecordProgress(progress)
      );

      // Trigger automatic download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lecture.title.replace(/\s+/g, '_')}_Teacher_Video.webm`;
      a.click();
    } catch (err: any) {
      console.error('Video recording failed:', err);
      setRecordProgress({
        status: 'error',
        currentSlide: 1,
        totalSlides: lecture.slides.length,
        percent: 0,
        message: err.message || 'Failed to record lecture video.',
      });
    }
  };

  const handleCancelRecord = () => {
    videoExportService.cancel();
    setRecordProgress({
      status: 'idle',
      currentSlide: 1,
      totalSlides: lecture.slides.length,
      percent: 0,
      message: '',
    });
  };

  const handlePrintHandout = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${lecture.title} - Lecture Handout</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 40px; color: #1e293b; max-width: 850px; margin: 0 auto; }
          h1 { color: #0f172a; margin-bottom: 4px; font-size: 26px; }
          .meta { color: #64748b; font-size: 14px; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; }
          .slide { margin-bottom: 36px; padding: 24px; border: 1px solid #cbd5e1; border-radius: 12px; page-break-inside: avoid; }
          .slide-title { font-size: 18px; color: #0f172a; font-weight: bold; margin-bottom: 4px; }
          .slide-sub { color: #475569; font-size: 13px; margin-bottom: 16px; }
          .bullet { margin-bottom: 10px; }
          .bullet-head { font-weight: bold; color: #0f172a; }
          .script-box { background: #f8fafc; border-left: 4px solid #10b981; padding: 12px 16px; margin-top: 14px; font-size: 13px; border-radius: 4px; }
          .callout { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px 14px; margin-top: 12px; font-size: 12px; }
          .terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
          .term-card { background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 12px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Print / Save as PDF</button>
        </div>
        <h1>${lecture.title}</h1>
        <div class="meta">
          <strong>Instructor:</strong> ${teacher.name} (${teacher.title})<br/>
          <strong>Subject:</strong> ${lecture.subject} | <strong>Estimated Duration:</strong> ~${Math.round(lecture.totalDurationSeconds / 60)} minutes
        </div>
        <p><strong>Executive Overview:</strong> ${lecture.overviewSummary}</p>

        <h2>Classroom Slide Deck & Spoken Lecture Notes</h2>
        ${lecture.slides
          .map(
            s => `
          <div class="slide">
            <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #059669;">Slide ${s.slideNumber} of ${s.totalSlides} • ${s.chapterTitle}</div>
            <div class="slide-title">${s.topicTitle}</div>
            <div class="slide-sub">${s.subtitle}</div>
            ${s.blackboardSummarySnippet ? `<div style="font-family: monospace; background: #0f172a; color: #fde047; padding: 6px 10px; border-radius: 6px; font-size: 12px; margin-bottom: 12px;">Chalkboard Note: ${s.blackboardSummarySnippet}</div>` : ''}
            <div>
              ${s.bullets
                .map(
                  b => `
                <div class="bullet">
                  <span class="bullet-head">• ${b.heading}:</span> ${b.content}
                  ${b.emphasis ? `<span style="color: #059669; font-weight: 600; font-size: 12px;"> (${b.emphasis})</span>` : ''}
                </div>
              `
                )
                .join('')}
            </div>
            ${
              s.calloutBox
                ? `
              <div class="callout">
                <strong>[${s.calloutBox.title || s.calloutBox.type}]:</strong> ${s.calloutBox.text}
              </div>
            `
                : ''
            }
            <div class="script-box">
              <strong>Spoken Teacher Explanation:</strong><br/>
              "${s.teacherScript}"
            </div>
          </div>
        `
          )
          .join('')}

        <h2>Key Scientific Terms Glossary</h2>
        <div class="terms-grid">
          ${(lecture.keyTermsGlossary || [])
            .map(
              t => `
            <div class="term-card">
              <strong>${t.term}</strong><br/>
              ${t.definition}
            </div>
          `
            )
            .join('')}
        </div>

        ${
          lecture.suggestedReviewQuestions?.length
            ? `
          <h2>Exam Review & Practice Questions</h2>
          <ol>
            ${lecture.suggestedReviewQuestions.map(q => `<li>${q}</li>`).join('')}
          </ol>
        `
            : ''
        }
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleCopyTranscript = () => {
    let fullText = `${lecture.title}\nInstructor: ${teacher.name}\n\n`;
    lecture.slides.forEach(s => {
      fullText += `=== Slide ${s.slideNumber}: ${s.topicTitle} ===\n`;
      fullText += `Subtitle: ${s.subtitle}\n\n`;
      fullText += `Key Bullets:\n`;
      s.bullets.forEach(b => {
        fullText += `- ${b.heading}: ${b.content}\n`;
      });
      fullText += `\nTeacher Spoken Script:\n"${s.teacherScript}"\n\n`;
    });

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTranscript = () => {
    let fullText = `# ${lecture.title}\nInstructor: ${teacher.name} (${teacher.title})\nSubject: ${lecture.subject}\n\n`;
    fullText += `## Executive Summary\n${lecture.overviewSummary}\n\n`;
    lecture.slides.forEach(s => {
      fullText += `### Slide ${s.slideNumber}: ${s.topicTitle}\n`;
      fullText += `*${s.subtitle}*\n\n`;
      s.bullets.forEach(b => {
        fullText += `* **${b.heading}:** ${b.content}\n`;
      });
      if (s.calloutBox) {
        fullText += `\n> **${s.calloutBox.title}:** ${s.calloutBox.text}\n`;
      }
      fullText += `\n**Spoken Teacher Lecture Script:**\n> "${s.teacherScript}"\n\n---\n\n`;
    });

    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lecture.title.replace(/\s+/g, '_')}_Lecture_Transcript.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Export Lecture Materials</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recording in progress state */}
        {recordProgress.status === 'rendering' || recordProgress.status === 'encoding' ? (
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">
                    Recording Lecture Video (.webm)
                  </p>
                  <p className="text-xs text-emerald-300/80">{recordProgress.message}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {recordProgress.percent}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-200"
                style={{ width: `${recordProgress.percent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>HD 720p 30fps Canvas Rendering</span>
              <button
                onClick={handleCancelRecord}
                className="text-rose-400 hover:text-rose-300 font-medium transition-colors"
              >
                Cancel Recording
              </button>
            </div>
          </div>
        ) : recordProgress.status === 'completed' ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/60 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Video Rendered Successfully!</p>
                  <p className="text-xs text-emerald-300/80">
                    File was downloaded automatically as .webm
                  </p>
                </div>
              </div>
              <button
                onClick={handleStartRecordVideo}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition-colors"
              >
                Re-record
              </button>
            </div>
            {recordProgress.videoUrl && (
              <video
                src={recordProgress.videoUrl}
                controls
                className="w-full rounded-lg border border-slate-700 max-h-48 bg-black object-contain"
              />
            )}
          </div>
        ) : recordProgress.status === 'error' ? (
          <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center justify-between text-xs">
            <span className="text-rose-300">{recordProgress.message}</span>
            <button
              onClick={handleStartRecordVideo}
              className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-medium"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Narrated MP4 render progress / result */}
        {renderProgress.status === 'queued' || renderProgress.status === 'processing' ? (
          <div className="p-4 bg-violet-950/30 border border-violet-500/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">
                    Rendering Narrated Lecture (.mp4)
                  </p>
                  <p className="text-xs text-violet-300/80">{renderProgress.message}</p>
                </div>
              </div>
              <button
                onClick={handleCancelRender}
                className="text-rose-400 hover:text-rose-300 text-[11px] font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : renderProgress.status === 'done' ? (
          <div className="p-4 bg-violet-950/40 border border-violet-500/60 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500 text-slate-950 flex items-center justify-center font-bold">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Narrated Video Ready!</p>
                  <p className="text-xs text-violet-300/80">Real AI voiceover, synced to rendered slides</p>
                </div>
              </div>
              {renderProgress.videoUrl && (
                <a
                  href={renderProgress.videoUrl}
                  download={`${lecture.title.replace(/\s+/g, '_')}_Narrated.mp4`}
                  className="px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 text-xs font-semibold hover:bg-violet-500/30 transition-colors"
                >
                  Download
                </a>
              )}
            </div>
            {renderProgress.videoUrl && (
              <video
                src={renderProgress.videoUrl}
                controls
                className="w-full rounded-lg border border-slate-700 max-h-48 bg-black object-contain"
              />
            )}
          </div>
        ) : renderProgress.status === 'error' ? (
          <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center justify-between text-xs">
            <span className="text-rose-300">{renderProgress.message}</span>
            <button
              onClick={handleStartRenderNarratedVideo}
              className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-medium"
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="space-y-3">
          {/* Option -1: Render Narrated MP4 via the video-service (real AI voiceover) */}
          <div
            onClick={
              renderProgress.status === 'queued' || renderProgress.status === 'processing'
                ? undefined
                : handleStartRenderNarratedVideo
            }
            className="p-3.5 bg-gradient-to-r from-violet-950/40 to-slate-800/60 hover:bg-slate-800 border border-violet-500/40 hover:border-violet-400 rounded-xl cursor-pointer transition-all flex items-center justify-between group shadow-lg shadow-violet-950/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-fuchsia-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-violet-500/30">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                    Render Narrated Lecture Video (.mp4)
                  </p>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                    Real AI Voice
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Sends the script to the video-service for real text-to-speech narration muxed with rendered slides
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-violet-400 group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Option 0: Record & Download Full Video (silent, in-browser, no setup needed) */}
          <div
            onClick={recordProgress.status === 'rendering' ? undefined : handleStartRecordVideo}
            className="p-3.5 bg-gradient-to-r from-emerald-950/40 to-slate-800/60 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 rounded-xl cursor-pointer transition-all flex items-center justify-between group shadow-lg shadow-emerald-950/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/30">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Quick Preview Video (.webm, no audio)
                  </p>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Instant
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Silent in-browser animated preview only — use "Render Narrated Lecture Video" above for real voice audio
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Option 1: Print / PDF Handout */}
          <div
            onClick={handlePrintHandout}
            className="p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/60 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Print / Save Slides Handout as PDF
                </p>
                <p className="text-xs text-slate-400">
                  Formatted classroom study deck with diagrams, bullet points, and notes
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Option 2: Download Markdown Transcript */}
          <div
            onClick={handleDownloadTranscript}
            className="p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/60 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                  Download Full Lecture Script (.md)
                </p>
                <p className="text-xs text-slate-400">
                  Word-for-word teacher speech and study guide in Markdown format
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Option 3: Copy to Clipboard */}
          <div
            onClick={handleCopyTranscript}
            className="p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/60 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  {copied ? 'Copied to Clipboard!' : 'Copy Entire Lecture to Clipboard'}
                </p>
                <p className="text-xs text-slate-400">
                  Quick copy for note-taking apps, Notion, or student messaging
                </p>
              </div>
            </div>
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
