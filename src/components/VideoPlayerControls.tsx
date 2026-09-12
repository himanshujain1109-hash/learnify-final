import React from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Bell,
  BellOff,
} from 'lucide-react';
import { LectureSpeed } from '../types';

interface VideoPlayerControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStopVideo?: () => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onReplay: () => void;
  currentSlideIndex: number;
  totalSlides: number;
  progressPercent: number;
  onSeek: (percent: number) => void;
  currentTimeStr: string;
  totalTimeStr: string;
  speed: LectureSpeed;
  onSpeedChange: (speed: LectureSpeed) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isSoundEffects: boolean;
  onToggleSoundEffects: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const VideoPlayerControls: React.FC<VideoPlayerControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onStopVideo,
  onPrevSlide,
  onNextSlide,
  onReplay,
  currentSlideIndex,
  totalSlides,
  progressPercent,
  onSeek,
  currentTimeStr,
  totalTimeStr,
  speed,
  onSpeedChange,
  isMuted,
  onToggleMute,
  isSoundEffects,
  onToggleSoundEffects,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const speeds: LectureSpeed[] = [0.75, 1, 1.25, 1.5, 2];

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * 100);
  };

  return (
    <div className="w-full bg-white border-t border-slate-200 px-4 py-3 flex flex-col gap-2.5 select-none transition-colors">
      {/* Video Progress Scrubber Bar */}
      <div
        className="group relative w-full h-2 bg-slate-100 hover:h-3 rounded-full cursor-pointer transition-all flex items-center border border-slate-200/70"
        onClick={handleProgressBarClick}
        title="Seek presentation"
      >
        {/* Filled Progress */}
        <div
          className="h-full bg-indigo-600 group-hover:bg-indigo-500 rounded-full relative transition-all"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Scrubber Knob */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 border-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Slide Markers */}
        {totalSlides > 1 &&
          Array.from({ length: totalSlides - 1 }).map((_, i) => {
            const markerPos = ((i + 1) / totalSlides) * 100;
            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-0.5 bg-slate-300 pointer-events-none"
                style={{ left: `${markerPos}%` }}
                title={`Slide ${i + 2}`}
              />
            );
          })}
      </div>

      {/* Main Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-slate-700">
        {/* Left: Play/Pause, Stop, Slide navigation, Time */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Main Play / Pause Button */}
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
            title={isPlaying ? 'Pause (Space)' : 'Play Lecture (Space)'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          {/* Prominent Video Stoppage Button */}
          {onStopVideo && (
            <button
              onClick={onStopVideo}
              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
              title="Stop Video (Halt Playback & Audio [S / Esc])"
              aria-label="Stop Video"
            >
              <Square className="w-3 h-3 fill-rose-600 text-rose-600" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          )}

          {/* Replay current slide */}
          <button
            onClick={onReplay}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            title="Replay Current Slide"
            aria-label="Replay current slide"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Previous Slide */}
          <button
            onClick={onPrevSlide}
            disabled={currentSlideIndex <= 0}
            className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none text-slate-600 hover:text-slate-900 transition-colors"
            title="Previous Slide (Left Arrow)"
            aria-label="Previous slide"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Next Slide */}
          <button
            onClick={onNextSlide}
            disabled={currentSlideIndex >= totalSlides - 1}
            className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none text-slate-600 hover:text-slate-900 transition-colors"
            title="Next Slide (Right Arrow)"
            aria-label="Next slide"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Timestamp */}
          <div className="text-xs font-mono font-medium text-slate-500 ml-1">
            <span className="text-slate-900 font-bold">{currentTimeStr}</span> / {totalTimeStr}
          </div>

          {/* Slide Indicator Badge */}
          <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 bg-slate-100 rounded-lg border border-slate-200 text-slate-700 font-bold">
            Slide {currentSlideIndex + 1}/{totalSlides}
          </span>
        </div>

        {/* Right: Audio, Speed, SFX & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Classroom Sound Effects Toggle */}
          <button
            onClick={onToggleSoundEffects}
            className={`p-1.5 rounded-xl transition-colors text-xs flex items-center gap-1 ${
              isSoundEffects ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:bg-slate-100'
            }`}
            title={isSoundEffects ? 'Classroom Chime Active' : 'Sound Effects Muted'}
            aria-label="Classroom sound effects"
          >
            {isSoundEffects ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>

          {/* Audio Mute/Unmute */}
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Playback Speed dropdown */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-xs">
            {speeds.map(s => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-1.5 py-0.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  speed === s
                    ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title={`Playback Speed ${s}x`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
