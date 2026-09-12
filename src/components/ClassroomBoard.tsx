import React from 'react';
import { motion } from 'motion/react';
import { LectureSlide, ClassroomTheme } from '../types';
import { VisualDiagramViewer } from './VisualDiagramViewer';
import {
  Lightbulb,
  AlertCircle,
  BookOpen,
  Target,
  Sparkles,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface ClassroomBoardProps {
  slide: LectureSlide;
  theme?: ClassroomTheme;
  activeBulletId?: string;
  isSpeaking: boolean;
  teacherGesture?: string;
}

export const ClassroomBoard: React.FC<ClassroomBoardProps> = ({
  slide,
  activeBulletId,
  isSpeaking,
}) => {
  // 2D Callout icon mapping
  const getCalloutIcon = (type?: string) => {
    switch (type) {
      case 'exam_tip':
        return <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'mental_model':
        return <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'common_mistake':
        return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      default:
        return <Target className="w-4 h-4 text-indigo-600 shrink-0" />;
    }
  };

  return (
    <div
      id="classroom-ppt-slide"
      className="relative w-full h-full flex flex-col justify-between p-5 sm:p-7 md:p-8 bg-white text-slate-900 border border-slate-200 shadow-lg select-none rounded-2xl overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
    >
      {/* PPT Slide Header Banner */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold tracking-wider uppercase">
            Slide {slide.slideNumber} of {slide.totalSlides}
          </span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {slide.chapterTitle}
          </span>
        </div>

        {/* 2D Core Formula / Shorthand Chip */}
        {slide.blackboardSummarySnippet && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100/90 text-slate-800 border border-slate-200">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-sans">
              Key Axiom:
            </span>
            <span>{slide.blackboardSummarySnippet}</span>
          </div>
        )}
      </div>

      {/* Slide Title & Subtitle */}
      <div className="my-2 sm:my-3">
        <motion.h2
          key={slide.id + '-title'}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight"
        >
          {slide.topicTitle}
        </motion.h2>
        <p className="text-xs sm:text-sm mt-1 text-slate-600 font-medium">
          {slide.subtitle}
        </p>
      </div>

      {/* Main PPT Slide Grid: Bullets (Left) & 2D Visuals (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 flex-1 items-center my-1 overflow-y-auto pr-1">
        {/* Bullets Column (7 cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          {(slide.bullets || []).map((bullet, idx) => {
            const isHighlighted = activeBulletId === bullet.id;

            return (
              <motion.div
                key={bullet.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07 }}
                className={`relative p-3 sm:p-3.5 rounded-xl border transition-all duration-300 ${
                  isHighlighted
                    ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-200 text-indigo-950 shadow-sm'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`w-5 h-5 rounded-md text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border ${
                      isHighlighted
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {bullet.heading}
                      </h4>
                      {bullet.highlightKeyword && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100/80 text-indigo-800 border border-indigo-200">
                          {bullet.highlightKeyword}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-normal">
                      {bullet.content}
                    </p>
                    {bullet.emphasis && (
                      <p className="text-[11px] font-semibold text-indigo-700 mt-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 shrink-0 text-indigo-500" />
                        <span>{bullet.emphasis}</span>
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* 2D Callout Box */}
          {slide.calloutBox && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 sm:p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-2.5 shadow-sm"
            >
              {getCalloutIcon(slide.calloutBox.type)}
              <div className="text-xs">
                <span className="font-bold text-amber-950 uppercase tracking-wide">
                  {slide.calloutBox.title}:{' '}
                </span>
                <span className="text-amber-900 font-medium leading-relaxed">
                  {slide.calloutBox.text}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: 2D Visual Infographic Diagram (5 cols) */}
        <div className="lg:col-span-5 h-full flex flex-col justify-center">
          <VisualDiagramViewer diagram={slide.visualDiagram} theme="whiteboard" />
        </div>
      </div>

      {/* PPT Slide Footer */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 font-medium">
          <FileText className="w-3 h-3 text-slate-400" />
          <span>Interactive PPT Presentation</span>
        </span>
        <span className="font-medium">
          Slide {slide.slideNumber} / {slide.totalSlides}
        </span>
      </div>
    </div>
  );
};
