import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LectureData, LectureSlide, TeacherPersona } from '../types';
import {
  FileText,
  Layers,
  MessageSquare,
  Send,
  Sparkles,
  Volume2
} from 'lucide-react';
import { speechService } from '../services/speechService';

interface LectureCompanionProps {
  lecture: LectureData;
  currentSlideIndex: number;
  onSelectSlide: (index: number) => void;
  teacher: TeacherPersona;
  onPlaySentence?: (slideIndex: number, sentenceText: string) => void;
}

export const LectureCompanion: React.FC<LectureCompanionProps> = ({
  lecture,
  currentSlideIndex,
  onSelectSlide,
  teacher,
  onPlaySentence,
}) => {
  const [activeTab, setActiveTab] = useState<'slides' | 'script' | 'ask'>('slides');
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState<Array<{ q: string; a: string; time: string }>>([]);

  const slides = Array.isArray(lecture?.slides) && lecture.slides.length > 0 ? lecture.slides : [];
  const safeIdx = slides.length > 0 ? Math.max(0, Math.min(slides.length - 1, currentSlideIndex)) : 0;
  const currentSlide = slides[safeIdx] || {
    id: 'empty',
    slideNumber: 1,
    totalSlides: 1,
    topicTitle: lecture?.title || 'Slide Concept',
    subtitle: '',
    bullets: [],
    teacherScript: '',
  };

  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAsking) return;

    const userQ = question.trim();
    setQuestion('');
    setIsAsking(true);

    try {
      const res = await fetch('/api/ask-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQ,
          currentSlide,
          lectureTitle: lecture.title,
          teacherPersona: teacher,
        }),
      });

      const data = await res.json();
      const answer = data.answer || "That's a thoughtful question! Let's examine how this connects to our core principles.";

      setQaHistory(prev => [
        {
          q: userQ,
          a: answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);

      speechService.speak(answer, {
        gender: teacher.voiceGender,
        language: lecture.language || 'English',
        rate: teacher.speechRate,
        pitch: teacher.speechPitch,
      });
    } catch (err) {
      console.error('Ask teacher error:', err);
      const fallbackAns = `Regarding "${userQ}": on this slide, focus particularly on how ${currentSlide.topicTitle} connects to our main concept.`;
      setQaHistory(prev => [
        {
          q: userQ,
          a: fallbackAns,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);
      speechService.speak(fallbackAns, {
        gender: teacher.voiceGender,
        language: lecture.language || 'English',
        rate: teacher.speechRate,
      });
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl select-none">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('slides')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'slides'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Slides & Notes ({slides.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'script'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Teacher Script</span>
          </button>

          <button
            onClick={() => setActiveTab('ask')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'ask'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask Teacher</span>
            {qaHistory.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] flex items-center justify-center font-bold">
                {qaHistory.length}
              </span>
            )}
          </button>
        </div>

        <span className="text-xs font-medium text-slate-400">
          Instructor: <span className="text-slate-200 font-semibold">{teacher.name}</span>
        </span>
      </div>

      {/* Tab 1: All Slides & Outline */}
      {activeTab === 'slides' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[320px] overflow-y-auto pr-1">
          {slides.map((slide, idx) => {
            const isCurrent = idx === safeIdx;
            return (
              <div
                key={slide.id || idx}
                onClick={() => onSelectSlide(idx)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-emerald-950/20 border-emerald-400 shadow-md ring-1 ring-emerald-400/40'
                    : 'bg-slate-800/40 border-slate-700/70 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                      Slide {slide.slideNumber || idx + 1} of {slides.length}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ~{slide.estimatedDurationSeconds || 30}s
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-2">{slide.topicTitle}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {slide.subtitle}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{slide.bullets?.length || 0} Key Points</span>
                  <span className="font-semibold uppercase text-emerald-400">
                    {slide.visualDiagram?.type || 'Infographic'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Spoken Teacher Script */}
      {activeTab === 'script' && (
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          {slides.map((slide, sIdx) => {
            const isCurrent = sIdx === safeIdx;

            return (
              <div
                key={slide.id}
                className={`p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-slate-800/90 border-emerald-500/50 shadow-md'
                    : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <button
                    onClick={() => onSelectSlide(sIdx)}
                    className="flex items-center gap-2 text-left"
                  >
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Slide {slide.slideNumber}
                    </span>
                    <span className="text-xs font-bold text-white">{slide.topicTitle}</span>
                  </button>
                </div>

                <div className="space-y-1.5 pl-1">
                  {(slide.scriptSegments || [{ text: slide.teacherScript }]).map((seg, segIdx) => (
                    <div
                      key={segIdx}
                      onClick={() => onPlaySentence && onPlaySentence(sIdx, seg.text)}
                      className="group flex items-start gap-2 p-1.5 rounded-lg hover:bg-slate-800/70 cursor-pointer text-xs transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-slate-300 group-hover:text-white leading-relaxed">
                        {seg.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Interactive Teacher Q&A */}
      {activeTab === 'ask' && (
        <div className="space-y-3">
          <form onSubmit={handleAskSubmit} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder={`Ask ${teacher.name.split(' ')[0]} a question about "${currentSlide.topicTitle}"...`}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={isAsking || !question.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-40 transition-colors"
            >
              {isAsking ? (
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Ask</span>
            </button>
          </form>

          {/* Q&A Stream */}
          <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
            {qaHistory.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Type any question above to get a spoken teacher explanation for this slide.
              </div>
            ) : (
              qaHistory.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-800/70 border border-slate-700/80 rounded-xl space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-emerald-300">
                      Q: {item.q}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">{item.time}</span>
                  </div>
                  <div className="flex items-start gap-2 pt-1 border-t border-slate-700/60">
                    <span className="text-xs font-bold text-amber-400 shrink-0">
                      {teacher.name.split(' ')[0]}:
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
