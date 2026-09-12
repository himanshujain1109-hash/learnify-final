import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Upload,
  FileText,
  Sparkles,
  BookOpen,
  Check,
  X,
  Volume2,
  Clock,
  GraduationCap,
  Languages,
  BrainCircuit,
  UserCheck
} from 'lucide-react';
import { TeacherPersona } from '../types';
import { TEACHER_PERSONAS, PRESET_NOTES } from '../data/sampleLectures';

export type LectureLanguage = 'hindi' | 'English' | 'hinglish';
export type UnderstandingLevel = 'beginner' | 'intermediate' | 'advanced';
export type VoiceGender = 'male' | 'female';

interface UploadStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: {
    textNotes?: string;
    fileData?: { base64: string; mimeType: string; fileName: string };
    teacherPersona: TeacherPersona;
    teachingStyle: string;
    slideCount: number;
    language: LectureLanguage;
    level: UnderstandingLevel;
    duration: number;
    voice: VoiceGender;
  }) => Promise<void>;
  isGenerating: boolean;
  generationStep: string;
}

export const UploadStudio: React.FC<UploadStudioProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  generationStep,
}) => {
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [textNotes, setTextNotes] = useState('');
  const [inputTab, setInputTab] = useState<'upload' | 'paste' | 'preset'>('upload');

  // 4 Explicit User-Specified Controls:
  // a) language: hindi, English, hinglish
  const [language, setLanguage] = useState<LectureLanguage>('English');
  // b) level of understanding: beginner, intermediate, advanced
  const [level, setLevel] = useState<UnderstandingLevel>('intermediate');
  // c) duration: 5-15 minutes
  const [duration, setDuration] = useState<number>(5);
  // d) voice: male, female
  const [voice, setVoice] = useState<VoiceGender>('female');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      setSelectedFile({
        file,
        base64,
        mimeType: file.type || 'application/octet-stream',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handlePresetSelect = (preset: typeof PRESET_NOTES[0]) => {
    setTextNotes(preset.content);
    setSelectedFile(null);
    setInputTab('paste');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !textNotes.trim()) {
      return;
    }

    // Pick teacher persona matching voice gender
    const teacher = TEACHER_PERSONAS.find(t => t.voiceGender === voice) || TEACHER_PERSONAS[0];

    // Compute slides count from duration (5 min -> 4 slides, 15 min -> 8 slides)
    const calculatedSlideCount = Math.max(3, Math.min(8, Math.round(duration * 0.65)));

    await onGenerate({
      textNotes: textNotes.trim() || undefined,
      fileData: selectedFile
        ? {
            base64: selectedFile.base64,
            mimeType: selectedFile.mimeType,
            fileName: selectedFile.file.name,
          }
        : undefined,
      teacherPersona: teacher,
      teachingStyle: level === 'beginner' ? 'intuitive_analogies' : level === 'advanced' ? 'first_principles' : 'concept_breakdown',
      slideCount: calculatedSlideCount,
      language,
      level,
      duration,
      voice,
    });
  };

  const canSubmit = Boolean(selectedFile || textNotes.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Create Teacher Video Lecture
              </h2>
              <p className="text-xs text-slate-400">
                Transform notes into interactive slides, infographics, and teacher voiceover
              </p>
            </div>
          </div>
          {!isGenerating && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Loading Overlay if Generating */}
        {isGenerating ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-5 flex-1">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-7 h-7 animate-bounce" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-base font-bold text-white">Generating Video Lecture</h3>
              <p className="text-xs text-emerald-400 font-mono animate-pulse">{generationStep}</p>
              <p className="text-[11px] text-slate-400">
                Building structured slides, bullet points, classroom infographics, and teacher explanation.
              </p>
            </div>

            <div className="w-full max-w-xs bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="h-full bg-emerald-400 rounded-full"
                animate={{ width: ['20%', '50%', '80%', '98%'] }}
                transition={{ duration: 10, ease: 'easeInOut' }}
              />
            </div>
          </div>
        ) : (
          /* Main Configuration Form */
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Section 1: Study Material */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                1. Upload or Paste Notes
              </label>

              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-2.5">
                <button
                  type="button"
                  onClick={() => setInputTab('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    inputTab === 'upload'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload PDF / Doc
                </button>
                <button
                  type="button"
                  onClick={() => setInputTab('paste')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    inputTab === 'paste'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Paste Text Notes
                </button>
                <button
                  type="button"
                  onClick={() => setInputTab('preset')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    inputTab === 'preset'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Sample Topics
                </button>
              </div>

              {inputTab === 'upload' && (
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    selectedFile
                      ? 'border-emerald-500/80 bg-emerald-950/20'
                      : 'border-slate-700 hover:border-emerald-500/50 bg-slate-800/40 hover:bg-slate-800/70'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.docx,.doc,.txt,.md"
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                        <FileText className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-white">{selectedFile.file.name}</p>
                      <p className="text-[11px] text-emerald-400">
                        {(selectedFile.file.size / 1024).toFixed(1)} KB • Ready to convert
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="w-6 h-6 text-emerald-400 mb-1" />
                      <p className="text-xs font-semibold text-slate-200">
                        Click to select PDF or Document (or drag & drop here)
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Accepts PDF, Word (.docx), Markdown, or text files
                      </p>
                    </div>
                  )}
                </div>
              )}

              {inputTab === 'paste' && (
                <div>
                  <textarea
                    rows={4}
                    value={textNotes}
                    onChange={e => setTextNotes(e.target.value)}
                    placeholder="Paste textbook sections, lecture notes, or key topic points here..."
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono leading-relaxed resize-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{textNotes.length} characters</span>
                    <span>AI structures notes into slides & infographics</span>
                  </div>
                </div>
              )}

              {inputTab === 'preset' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRESET_NOTES.map(preset => (
                    <div
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset)}
                      className="p-2.5 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/60 rounded-xl cursor-pointer transition-all"
                    >
                      <span className="text-[9px] uppercase font-bold text-emerald-400">
                        {preset.category}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate mt-0.5">
                        {preset.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {preset.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Instructions (Language, Level, Duration, Voice) */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Video Instructions & Preferences
              </label>

              {/* a) Language Selection */}
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold mb-1.5">
                  <Languages className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Language</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'hindi' as LectureLanguage, label: 'Hindi (हिन्दी)', desc: 'पूर्ण हिन्दी व्याख्यान' },
                    { id: 'English' as LectureLanguage, label: 'English', desc: 'Global English speech' },
                    { id: 'hinglish' as LectureLanguage, label: 'Hinglish', desc: 'Hindi + English mix' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLanguage(item.id)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        language === item.id
                          ? 'bg-emerald-500/20 border-emerald-400 text-white ring-1 ring-emerald-400/40'
                          : 'bg-slate-800/50 border-slate-700/80 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{item.label}</span>
                        {language === item.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* b) Level of Understanding */}
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold mb-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Level of Understanding</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'beginner' as UnderstandingLevel, label: 'Beginner', desc: 'Simple analogies & intuition' },
                    { id: 'intermediate' as UnderstandingLevel, label: 'Intermediate', desc: 'Standard syllabus rigor' },
                    { id: 'advanced' as UnderstandingLevel, label: 'Advanced', desc: 'Deep analytical nuances' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLevel(item.id)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        level === item.id
                          ? 'bg-emerald-500/20 border-emerald-400 text-white ring-1 ring-emerald-400/40'
                          : 'bg-slate-800/50 border-slate-700/80 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{item.label}</span>
                        {level === item.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Row for Duration (c) and Voice (d) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* c) Duration (5 - 15 minutes) */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Duration</span>
                    </div>
                    <span className="text-emerald-400 font-bold font-mono">{duration} Minutes</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[5, 8, 10, 15].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDuration(mins)}
                        className={`py-1.5 rounded-lg border text-center text-xs font-bold transition-all ${
                          duration === mins
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-slate-800/50 border-slate-700/80 text-slate-400 hover:text-white'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* d) Voice (Male, Female) */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold mb-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Voiceover Teacher</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'female' as VoiceGender, label: 'Female Teacher', name: 'Dr. Clara Vance' },
                      { id: 'male' as VoiceGender, label: 'Male Teacher', name: 'Prof. Marcus Hayes' },
                    ].map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVoice(v.id)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          voice === v.id
                            ? 'bg-emerald-500/20 border-emerald-400 text-white ring-1 ring-emerald-400/40'
                            : 'bg-slate-800/50 border-slate-700/80 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{v.label}</span>
                          {voice === v.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{v.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400">
                Creates slides, infographics, voiceover & teacher visuals
              </span>

              <button
                type="submit"
                disabled={!canSubmit}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Video Lecture</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
