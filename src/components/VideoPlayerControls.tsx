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
  User,
  Layout,
  Gauge,
  Palette
} from 'lucide-react';
import { ClassroomTheme, LectureSpeed } from '../types';

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
  teacherViewMode: 'podium' | 'bubble' | 'board_only';
  onTeacherViewModeChange: (mode: 'podium' | 'bubble' | 'board_only') => void;
  theme: ClassroomTheme;
  onThemeChange: (theme: ClassroomTheme) => void;
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
  teacherViewMode,
  onTeacherViewModeChange,
  theme,
  onThemeChange,
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
    <div className="w-full bg-slate-900/95 border-t border-slate-700/80 px-4 py-2.5 flex flex-col gap-2 backdrop-blur-md select-none">
      {/* Video Progress Scrubber Bar */}
      <div
        className="group relative w-full h-2.5 bg-slate-800 rounded-full cursor-pointer hover:h-3.5 transition-all flex items-center"
        onClick={handleProgressBarClick}
      >
        {/* Filled Progress */}
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 rounded-full relative"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Scrubber Knob */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Slide Markers */}
        {totalSlides > 1 &&
          Array.from({ length: totalSlides - 1 }).map((_, i) => {
            const markerPos = ((i + 1) / totalSlides) * 100;
            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-0.5 bg-slate-950/80 pointer-events-none"
                style={{ left: `${markerPos}%` }}
                title={`Slide ${i + 2}`}
              />
            );
          })}
      </div>

      {/* Main Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-slate-300">
        {/* Left: Play/Pause, Stop, Slide navigation, Time */}
        <div className="flex items-center gap-2">
          {/* Main Play / Pause */}
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition-transform active:scale-95 shadow-lg"
            title={isPlaying ? 'Pause (Space)' : 'Play Lecture (Space)'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
          </button>

          {/* Video Stoppage Option */}
          {onStopVideo && (
            <button
              onClick={onStopVideo}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 flex items-center justify-center transition-all active:scale-95 shadow"
              title="Stop Video (Halt Playback & Audio [S / Esc])"
              aria-label="Stop Video"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          {/* Replay current slide */}
          <button
            onClick={onReplay}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            title="Replay Current Slide"
            aria-label="Replay current slide"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Previous Slide */}
          <button
            onClick={onPrevSlide}
            disabled={currentSlideIndex <= 0}
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors"
            title="Previous Slide"
            aria-label="Previous slide"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Next Slide */}
          <button
            onClick={onNextSlide}
            disabled={currentSlideIndex >= totalSlides - 1}
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors"
            title="Next Slide"
            aria-label="Next slide"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Timestamp */}
          <div className="text-xs font-mono font-medium text-slate-400 ml-1">
            <span className="text-slate-100 font-semibold">{currentTimeStr}</span> / {totalTimeStr}
          </div>

          {/* Slide Indicator Badge */}
          <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 bg-slate-800 rounded border border-slate-700/60 text-emerald-400 font-semibold">
            Slide {currentSlideIndex + 1}/{totalSlides}
          </span>
        </div>

        {/* Right: Audio, Speed, View Mode, Theme & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Classroom Sound Effects Toggle */}
          <button
            onClick={onToggleSoundEffects}
            className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
              isSoundEffects ? 'text-amber-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
            }`}
            title={isSoundEffects ? 'Classroom SFX Active (Chalk & Chimes)' : 'Classroom SFX Muted'}
            aria-label="Classroom sound effects"
          >
            {isSoundEffects ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>

          {/* Audio Mute/Unmute */}
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Playback Speed dropdown */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60 text-xs">
            {speeds.map(s => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  speed === s
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Playback Speed ${s}x`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Teacher View Mode Selector */}
          <div className="hidden md:flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
            <button
              onClick={() => onTeacherViewModeChange('podium')}
              className={`p-1 rounded text-xs transition-colors ${
                teacherViewMode === 'podium'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Side Podium View (Teacher beside board)"
            >
              <User className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onTeacherViewModeChange('bubble')}
              className={`p-1 rounded text-xs transition-colors ${
                teacherViewMode === 'bubble'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Floating Avatar View (Corner bubble)"
            >
              <Layout className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Classroom Board Theme Toggle */}
          <div className="hidden sm:flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60 text-xs">
            <button
              onClick={() => onThemeChange('blackboard')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                theme === 'blackboard' ? 'bg-slate-700 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Blackboard Slate Theme"
            >
              Chalk
            </button>
            <button
              onClick={() => onThemeChange('whiteboard')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                theme === 'whiteboard' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Modern Dry-Erase Whiteboard Theme"
            >
              White
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
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
