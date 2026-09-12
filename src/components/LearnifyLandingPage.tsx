import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Check,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Video,
  FileText,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Layers,
  GraduationCap
} from 'lucide-react';

interface LearnifyLandingPageProps {
  onOpenDashboard: () => void;
  onOpenAuth: () => void;
  onOpenCreateVideo: () => void;
}

export const LearnifyLandingPage: React.FC<LearnifyLandingPageProps> = ({
  onOpenDashboard,
  onOpenAuth,
  onOpenCreateVideo,
}) => {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-24 px-4 sm:px-6 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Subtle atmospheric gradient light in background */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-200/30 via-purple-100/40 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Copy & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-600 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>AI-Powered Study Companion</span>
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black tracking-tight leading-[1.08] text-slate-950">
              Study less.{' '}
              <span className="bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent block sm:inline">
                Understand more.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed">
              Learnify AI turns your study material into lessons, quizzes and a
              personal AI tutor — so you can focus on learning, not searching.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenDashboard}
                className="px-6 py-3.5 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-sm sm:text-base flex items-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all"
              >
                <span>Open my dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenAuth}
                className="px-4 py-3 text-sm font-semibold text-slate-600 hover:text-slate-950 transition-colors"
              >
                I already have an account
              </button>
            </div>

            {/* Micro-Features Checklist */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs sm:text-sm font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 font-bold" />
                <span>Simple explanations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 font-bold" />
                <span>Exam-focused</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 font-bold" />
                <span>Learn at your pace</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Mockup Card matching Screenshot 1 */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-[0_20px_50px_rgba(79,70,229,0.1)] border border-slate-100 flex flex-col space-y-5"
            >
              {/* Card Top Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-slate-400">
                    Your Study Space
                  </span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>AI Tutor ready</span>
                </div>
              </div>

              {/* Progress Bar & Topic Title */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-sm font-black text-slate-900">
                    Data Structures
                  </span>
                  <span className="text-indigo-600 font-mono">72%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-[#6366f1] rounded-full"
                    style={{ width: '72%' }}
                  />
                </div>
              </div>

              {/* AI Quote Bubble */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm space-y-1.5">
                <div className="flex items-center gap-1.5 text-indigo-600 font-black text-[11px] uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>Learnify AI</span>
                </div>
                <p className="text-slate-700 italic leading-relaxed">
                  "A stack follows LIFO — like a stack of books. The last book you
                  place is the first one you pick up."
                </p>
              </div>

              {/* Mini Stats Card Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Quiz Score
                  </span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    9 / 10
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Topics
                  </span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    12
                  </span>
                </div>
              </div>

              {/* Mastered Badge */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200/80 px-3 py-1.5 rounded-lg w-fit shadow-2xs">
                <Check className="w-3.5 h-3.5 text-indigo-600" />
                <span>3 topics mastered</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Dark 4-Column Statistics Strip matching Screenshot 1 */}
      <section className="w-full bg-[#0d1117] text-white py-8 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            {/* Stat 1 */}
            <div className="flex flex-col pt-3 md:pt-0 md:px-6">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                3-in-1
              </span>
              <span className="text-xs sm:text-sm text-slate-400 mt-0.5">
                learning toolkit
              </span>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col pt-3 md:pt-0 md:px-6">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                AI
              </span>
              <span className="text-xs sm:text-sm text-slate-400 mt-0.5">
                powered explanations
              </span>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col pt-3 md:pt-0 md:px-6">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                24/7
              </span>
              <span className="text-xs sm:text-sm text-slate-400 mt-0.5">
                study companion
              </span>
            </div>

            {/* Stat 4 */}
            <div className="flex flex-col pt-3 md:pt-0 md:px-6">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                1 place
              </span>
              <span className="text-xs sm:text-sm text-slate-400 mt-0.5">
                for your material
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "WHY LEARNIFY" Section matching Screenshot 1 */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="space-y-3 mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-[#6366f1]">
            Why Learnify
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
            Everything you need to{' '}
            <span className="text-[#6366f1]">learn smarter.</span>
          </h2>
        </div>

        {/* 3 Features Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 01 */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-6 group">
            <div>
              <span className="text-xs font-mono font-bold text-slate-400 block mb-4">
                01
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#6366f1] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">
                Smart lessons
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Turn dense notes and PDFs into clear, teacher-style explanations.
              </p>
            </div>
          </div>

          {/* Card 02 */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-6 group">
            <div>
              <span className="text-xs font-mono font-bold text-slate-400 block mb-4">
                02
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#6366f1] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">
                AI Tutor
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ask questions about your own material and get focused answers.
              </p>
            </div>
          </div>

          {/* Card 03 */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-6 group">
            <div>
              <span className="text-xs font-mono font-bold text-slate-400 block mb-4">
                03
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#6366f1] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">
                Practice quizzes
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Test your understanding with instant, topic-based quizzes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bottom Banner matching Screenshot 1 */}
      <section className="px-4 sm:px-6 pb-20 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-r from-[#312e81] via-[#3730a3] to-[#4338ca] text-white p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-300 block">
              Ready When You Are
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Make your next study session count.
            </h2>
            <p className="text-sm sm:text-base text-indigo-200">
              Upload your first material and let Learnify AI organize the hard work.
            </p>
          </div>

          <button
            onClick={onOpenCreateVideo}
            className="px-6 py-3.5 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-sm sm:text-base flex items-center gap-2 shadow-lg transition-transform active:scale-95 shrink-0"
          >
            <span>Try Learnify AI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-200 text-xs text-slate-500 text-center">
        <p>© 2026 Learnify AI. All-in-one educational platform and video generator.</p>
      </footer>
    </div>
  );
};
