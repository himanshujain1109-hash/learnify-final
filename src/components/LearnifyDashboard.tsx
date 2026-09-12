import React from 'react';
import {
  Plus,
  FileText,
  Sparkles,
  Infinity as InfinityIcon,
  ArrowRight,
  Video,
  BookOpen,
  BrainCircuit,
  Layers,
  Trash2,
  Clock,
  CheckCircle2,
  Play
} from 'lucide-react';
import { LectureData } from '../types';
import { GoogleUserProfile } from '../services/authService';

interface LearnifyDashboardProps {
  currentUser: GoogleUserProfile | null;
  savedLectures: LectureData[];
  onAddMaterial: () => void;
  onCreateVideo: () => void;
  onOpenLecture: (lecture: LectureData, tab?: 'presentation' | 'quiz' | 'flashcards' | 'notes' | 'tutor') => void;
  onDeleteLecture: (lectureId: string) => void;
}

export const LearnifyDashboard: React.FC<LearnifyDashboardProps> = ({
  currentUser,
  savedLectures,
  onAddMaterial,
  onCreateVideo,
  onOpenLecture,
  onDeleteLecture,
}) => {
  const userName = currentUser?.name || 'himanshu';

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 pb-20 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 space-y-8">
        {/* 1. Header Row: Welcome back & Add Material button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#6366f1] block mb-1">
              Your Learning Space
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 flex items-center gap-2">
              <span>Welcome back, {userName}</span>
              <span className="text-3xl">👋</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1 font-normal">
              Pick up where you left off or add something new to learn.
            </p>
          </div>

          <button
            onClick={onAddMaterial}
            className="px-5 py-3 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 transition-transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add material</span>
          </button>
        </div>

        {/* 2. Three Metric Cards matching Screenshot 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Study materials count */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              <FileText className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 block leading-tight font-mono">
                {savedLectures.length}
              </span>
              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                Study materials
              </span>
            </div>
          </div>

          {/* Card 2: AI Tutor available */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-[#6366f1] shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 block leading-tight">
                AI
              </span>
              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                Tutor available
              </span>
            </div>
          </div>

          {/* Card 3: Practice anytime */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <InfinityIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 block leading-tight font-mono">
                ∞
              </span>
              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                Practice anytime
              </span>
            </div>
          </div>
        </div>

        {/* 3. Promotional Card: Notes -> Video matching Screenshot 2 */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-indigo-100 shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-[#6366f1] inline-block">
              NEW
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Notes → Video
            </h2>
            <p className="text-sm text-slate-600">
              Turn your PPT, PDF or TXT notes into a narrated learning video.
            </p>
          </div>

          <button
            onClick={onCreateVideo}
            className="px-6 py-3 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-indigo-300 transition-transform active:scale-95 shrink-0"
          >
            <span>Create video</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4. Section: MY LIBRARY matching Screenshot 2 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#6366f1] block">
                My Library
              </span>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Recent study material
              </h2>
            </div>

            <button
              onClick={onAddMaterial}
              className="text-xs sm:text-sm font-bold text-[#6366f1] hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              <span>Upload new</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Conditional Empty vs Populated State */}
          {savedLectures.length === 0 ? (
            /* Dashed Empty State Container matching Screenshot 2 */
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 sm:p-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#6366f1] flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-lg font-black text-slate-900">
                  Your library is ready for its first lesson.
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Upload a PDF, DOCX or TXT file and Learnify AI will turn it into
                  topics you can actually study.
                </p>
              </div>
              <button
                onClick={onAddMaterial}
                className="px-6 py-3 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-sm flex items-center gap-2 shadow-sm shadow-indigo-200 transition-transform active:scale-95"
              >
                <span>Upload my first material</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Populated Library Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedLectures.map(item => {
                const totalMins = Math.ceil((item.totalDurationSeconds || 300) / 60);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                          {item.subject || 'Study Guide'}
                        </span>
                        <div className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>~{totalMins} mins</span>
                        </div>
                      </div>

                      <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 mt-1.5">
                        {item.overviewSummary || 'Comprehensive lessons with PPT slides, 2D visuals, quizzes, and flashcards.'}
                      </p>

                      <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500 font-medium">
                        <span className="bg-slate-100 px-2 py-0.5 rounded">
                          {item.slides?.length || 0} Slides
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded">
                          {item.quizzes?.length || 4} Quizzes
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded">
                          {item.flashcards?.length || 6} Cards
                        </span>
                      </div>
                    </div>

                    {/* Interactive Study Tools Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onOpenLecture(item, 'presentation')}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Watch Video</span>
                      </button>

                      <button
                        onClick={() => onOpenLecture(item, 'quiz')}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-colors"
                        title="Practice Quiz"
                      >
                        <BrainCircuit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onOpenLecture(item, 'flashcards')}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-600 transition-colors"
                        title="Flashcards"
                      >
                        <Layers className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onOpenLecture(item, 'notes')}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 transition-colors"
                        title="Study Notes"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteLecture(item.id)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
