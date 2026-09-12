import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Play,
  BrainCircuit,
  Layers,
  Trash2,
  Clock,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { LectureData } from '../types';

interface LearnifyStudyMaterialProps {
  lectures: LectureData[];
  onOpenLecture: (lecture: LectureData, tab?: 'presentation' | 'quiz' | 'flashcards' | 'notes' | 'tutor') => void;
  onAddMaterial: () => void;
  onDeleteLecture: (lectureId: string) => void;
}

export const LearnifyStudyMaterial: React.FC<LearnifyStudyMaterialProps> = ({
  lectures,
  onOpenLecture,
  onAddMaterial,
  onDeleteLecture,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const subjects = ['all', ...Array.from(new Set(lectures.map(l => l.subject || 'General')))];

  const filteredLectures = lectures.filter(l => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.overviewSummary || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === 'all' || (l.subject || 'General') === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 pb-20 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#6366f1] block mb-1">
              Your Knowledge Vault
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
              Study Material
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              Manage your generated lectures, study guides, flashcard decks, and quizzes.
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

        {/* Search & Subject Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search topics, questions, or keywords..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-transparent rounded-xl focus:outline-none placeholder:text-slate-400 text-slate-900"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {subjects.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSubject(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-colors ${
                  selectedSubject === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        {filteredLectures.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
            <p className="text-slate-500 text-sm">No study materials match your search.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('all');
              }}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLectures.map(lecture => (
              <div
                key={lecture.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded text-[11px]">
                      {lecture.subject || 'Study Guide'}
                    </span>
                    <span className="font-mono text-slate-400 text-xs">
                      {lecture.slides?.length || 0} Slides
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 line-clamp-1">
                    {lecture.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                    {lecture.overviewSummary}
                  </p>

                  <div className="flex items-center gap-3 mt-4 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      <BrainCircuit className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{lecture.quizzes?.length || 4} Quizzes</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-amber-500" />
                      <span>{lecture.flashcards?.length || 6} Cards</span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => onOpenLecture(lecture, 'presentation')}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch Video</span>
                  </button>

                  <button
                    onClick={() => onOpenLecture(lecture, 'notes')}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 transition-colors"
                    title="Read Study Notes"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteLecture(lecture.id)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
