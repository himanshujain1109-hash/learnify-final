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
      const base64 = result.split(',')[1];
      let mimeType = file.type;
      if (!mimeType) {
        if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (file.name.endsWith('.docx'))
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else mimeType = 'text/plain';
      }
      setSelectedFile({
        file,
        base64,
        mimeType,
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

  const handlePresetSelect = (content: string) => {
    setTextNotes(content);
    setInputTab('paste');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !textNotes.trim()) return;

    // Pick teacher persona matching voice
    const teacherPersona =
      voice === 'male'
        ? TEACHER_PERSONAS.find(t => t.id === 'marcus') || TEACHER_PERSONAS[0]
        : TEACHER_PERSONAS.find(t => t.id === 'clara') || TEACHER_PERSONAS[0];

    // Compute slide count based on duration (approx 1.5 - 2 mins per slide)
    const targetSlideCount = Math.max(3, Math.min(10, Math.round(duration / 1.5)));

    await onGenerate({
      textNotes: textNotes.trim() || undefined,
      fileData: selectedFile
        ? {
            base64: selectedFile.base64,
            mimeType: selectedFile.mimeType,
            fileName: selectedFile.file.name,
          }
        : undefined,
      teacherPersona,
      teachingStyle: 'socratic',
      slideCount: targetSlideCount,
      language,
      level,
      duration,
      voice,
    });
  };

  const canSubmit = Boolean(selectedFile || textNotes.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Create Teacher Video Lecture
              </h2>
              <p className="text-xs text-slate-500">
                Transform notes into interactive slides, infographics, and spoken teacher audio
              </p>
            </div>
          </div>
          {!isGenerating && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Loading Overlay if Generating */}
        {isGenerating ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-5 flex-1 bg-white">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-7 h-7 animate-bounce" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-base font-bold text-slate-900">Generating Video Lecture</h3>
              <p className="text-xs text-indigo-600 font-mono font-semibold animate-pulse">{generationStep}</p>
              <p className="text-xs text-slate-500">
                Building structured presentation slides, bullet points, classroom infographics, and teacher explanation.
              </p>
            </div>

            <div className="w-full max-w-xs bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <motion.div
                className="h-full bg-indigo-600 rounded-full"
                animate={{ width: ['20%', '50%', '80%', '98%'] }}
                transition={{ duration: 10, ease: 'easeInOut' }}
              />
            </div>
          </div>
        ) : (
          /* Main Configuration Form */
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 bg-white">
            {/* Section 1: Study Material */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                1. Upload or Paste Notes
              </label>

              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                <button
                  type="button"
                  onClick={() => setInputTab('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    inputTab === 'upload'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Sample Topics
                </button>
              </div>

              {/* Upload Tab */}
              {inputTab === 'upload' && (
                <div>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer bg-slate-50/80 hover:bg-indigo-50/30 transition-all group"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf,.docx,.txt,.md"
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mx-auto mb-2 transition-colors" />
                    <p className="text-sm font-bold text-slate-800">
                      {selectedFile ? selectedFile.file.name : 'Click to browse or drop file here'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports PDF, DOCX, TXT, and Markdown files (up to 20MB)
                    </p>
                  </div>

                  {selectedFile && (
                    <div className="mt-2 flex items-center justify-between px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900">
                      <span className="font-semibold truncate">Attached: {selectedFile.file.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-slate-400 hover:text-rose-600 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Paste Tab */}
              {inputTab === 'paste' && (
                <div>
                  <textarea
                    value={textNotes}
                    onChange={(e) => setTextNotes(e.target.value)}
                    placeholder="Paste lecture notes, study guide, syllabus outline, textbook chapter excerpt..."
                    rows={6}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1 px-1">
                    <span>{textNotes.trim().split(/\s+/).filter(Boolean).length} words</span>
                    {textNotes && (
                      <button
                        type="button"
                        onClick={() => setTextNotes('')}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Preset Sample Topics Tab */}
              {inputTab === 'preset' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_NOTES.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset.content)}
                      className="p-3 text-left rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 truncate">
                          {preset.title}
                        </p>
                        <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-medium shrink-0 ml-1">
                          {preset.category.split(' ')[0]}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        {preset.summary}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: 4 Specified Controls */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Lecture Settings
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* a) Language: Hindi, English, Hinglish */}
                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Languages className="w-3.5 h-3.5 text-indigo-600" />
                    Language
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['English', 'hindi', 'hinglish'] as LectureLanguage[]).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setLanguage(lang)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                          language === lang
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* b) Level of Understanding: Beginner, Intermediate, Advanced */}
                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                    Level of Understanding
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['beginner', 'intermediate', 'advanced'] as UnderstandingLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setLevel(lvl)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                          level === lvl
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* c) Duration: 5, 10, 15 minutes */}
                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Duration
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[5, 10, 15].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDuration(mins)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                          duration === mins
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* d) Voice: Male, Female */}
                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                    Teacher Voice
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['female', 'male'] as VoiceGender[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVoice(v)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize border transition-all flex items-center justify-center gap-1.5 ${
                          voice === v
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>{v === 'female' ? 'Dr. Clara (Female)' : 'Prof. Marcus (Male)'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Video Lecture</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
