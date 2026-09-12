import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Square,
  Play,
  Pause,
  Upload,
  Sparkles,
  Download,
  Video,
  Volume2,
  VolumeX,
  RotateCcw,
  LogIn,
  LogOut,
  User,
  History,
  Trash2,
  ChevronDown,
  Layers,
  FolderOpen,
  Presentation,
  BrainCircuit,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  Share2
} from 'lucide-react';
import {
  LectureData,
  TeacherPersona,
  ClassroomTheme,
  LectureSpeed,
} from './types';
import { DEMO_LECTURE, TEACHER_PERSONAS } from './data/sampleLectures';
import { speechService } from './services/speechService';
import { authService, GoogleUserProfile } from './services/authService';
import { ClassroomBoard } from './components/ClassroomBoard';
import { TeacherAvatar } from './components/TeacherAvatar';
import { VideoPlayerControls } from './components/VideoPlayerControls';
import { LectureCompanion } from './components/LectureCompanion';
import { InteractiveQuiz } from './components/InteractiveQuiz';
import { FlashcardsViewer } from './components/FlashcardsViewer';
import { StudyNotesGuide } from './components/StudyNotesGuide';
import { UploadStudio, LectureLanguage, UnderstandingLevel, VoiceGender } from './components/UploadStudio';
import { ExportModal } from './components/ExportModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { LearnifyNavbar, ActivePageView } from './components/LearnifyNavbar';
import { LearnifyLandingPage } from './components/LearnifyLandingPage';
import { LearnifyDashboard } from './components/LearnifyDashboard';
import { LearnifyStudyMaterial } from './components/LearnifyStudyMaterial';

type LearnifyTab = 'presentation' | 'quiz' | 'flashcards' | 'notes' | 'tutor';

export default function App() {
  const [currentUser, setCurrentUser] = useState<GoogleUserProfile | null>(authService.getCurrentUser());
  const [currentView, setCurrentView] = useState<ActivePageView>(
    currentUser ? 'dashboard' : 'landing'
  );

  const [lecture, setLecture] = useState<LectureData>(DEMO_LECTURE);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [activeTeacher, setActiveTeacher] = useState<TeacherPersona>(TEACHER_PERSONAS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speed, setSpeed] = useState<LectureSpeed>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isSoundEffects, setIsSoundEffects] = useState(true);
  const [theme, setTheme] = useState<ClassroomTheme>('whiteboard');
  const [teacherViewMode, setTeacherViewMode] = useState<'podium' | 'bubble' | 'board_only'>('podium');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<LearnifyTab>('presentation');

  // Dynamic animation and highlighting states
  const [activeBulletId, setActiveBulletId] = useState<string | undefined>(undefined);
  const [currentGesture, setCurrentGesture] = useState<'pointing' | 'explaining' | 'writing' | 'questioning' | 'nodding'>('explaining');
  const [activeSubtitle, setActiveSubtitle] = useState<string>('');

  // Storage & Modals
  const [savedLectures, setSavedLectures] = useState<LectureData[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const currentSegmentIndexRef = useRef(0);
  const segmentTimerRef = useRef<any>(null);

  // Safe slides fallback ensuring array access never throws
  const safeSlides = Array.isArray(lecture?.slides) && lecture.slides.length > 0 ? lecture.slides : DEMO_LECTURE.slides;
  const safeSlideIndex = Math.max(0, Math.min(safeSlides.length - 1, currentSlideIndex));
  const currentSlide = safeSlides[safeSlideIndex] || safeSlides[0] || DEMO_LECTURE.slides[0];

  // Helper to show brief toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initialize and subscribe to Auth & Saved Lectures
  useEffect(() => {
    const unsub = authService.subscribe(user => {
      setCurrentUser(user);
      const userLectures = authService.getSavedLectures();
      if (userLectures.length === 0) {
        // Seed default sample matching Screenshot 1 (Data Structures)
        authService.saveLecture(DEMO_LECTURE);
        setSavedLectures([DEMO_LECTURE]);
      } else {
        setSavedLectures(userLectures);
      }
    });

    const initial = authService.getSavedLectures();
    if (initial.length === 0) {
      authService.saveLecture(DEMO_LECTURE);
      setSavedLectures([DEMO_LECTURE]);
    } else {
      setSavedLectures(initial);
    }

    return unsub;
  }, []);

  // Helper to format mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate elapsed progress
  const totalDuration = safeSlides.reduce((acc, s) => acc + (s.estimatedDurationSeconds || 35), 0);
  const elapsedBeforeCurrent = safeSlides
    .slice(0, safeSlideIndex)
    .reduce((acc, s) => acc + (s.estimatedDurationSeconds || 35), 0);
  const progressPercent = totalDuration > 0 ? Math.min(100, (elapsedBeforeCurrent / totalDuration) * 100) : 0;

  // Stop video function: halts speech synthesis, resets timers and active state
  const handleStopVideo = useCallback(() => {
    setIsPlaying(false);
    setIsSpeaking(false);
    speechService.stop();
    if (segmentTimerRef.current) {
      clearTimeout(segmentTimerRef.current);
      segmentTimerRef.current = null;
    }
    currentSegmentIndexRef.current = 0;
    setActiveSubtitle('');
    setActiveBulletId(undefined);
    showToast('Video stopped');
  }, []);

  // Play narration and segment stepping
  const playSlideSpeech = useCallback((slideIndex: number, startSegmentIdx = 0) => {
    const targetSlide = safeSlides[slideIndex];
    if (!targetSlide) return;

    if (segmentTimerRef.current) {
      clearTimeout(segmentTimerRef.current);
    }

    const segments = targetSlide.scriptSegments || [{ text: targetSlide.teacherScript, teacherGesture: 'explaining' }];
    currentSegmentIndexRef.current = startSegmentIdx;

    const playNextSegment = () => {
      if (!isPlaying) return;

      const currentIdx = currentSegmentIndexRef.current;
      if (currentIdx >= segments.length) {
        setIsSpeaking(false);
        speechService.playSlideChime();

        if (slideIndex < safeSlides.length - 1) {
          setCurrentSlideIndex(slideIndex + 1);
        } else {
          setIsPlaying(false);
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
          });
          showToast('Lecture complete!');
        }
        return;
      }

      const segment = segments[currentIdx];
      setActiveSubtitle(segment.text);
      setActiveBulletId(segment.focusBulletId);
      setCurrentGesture(segment.teacherGesture || 'explaining');
      setIsSpeaking(true);

      if (segment.focusBulletId) {
        speechService.playChalkClick();
      }

      speechService.speak(segment.text, {
        gender: activeTeacher.voiceGender,
        language: lecture.language || 'English',
        rate: activeTeacher.speechRate * speed,
        pitch: activeTeacher.speechPitch,
        onEnd: () => {
          currentSegmentIndexRef.current += 1;
          segmentTimerRef.current = setTimeout(() => {
            playNextSegment();
          }, 350 / speed);
        },
      });
    };

    playNextSegment();
  }, [safeSlides, lecture.language, isPlaying, activeTeacher, speed]);

  useEffect(() => {
    if (isPlaying) {
      playSlideSpeech(safeSlideIndex, 0);
    } else {
      speechService.stop();
      setIsSpeaking(false);
      if (segmentTimerRef.current) {
        clearTimeout(segmentTimerRef.current);
      }
    }
  }, [safeSlideIndex, isPlaying, playSlideSpeech]);

  // Stop video when leaving video view or changing tabs
  const handleNavigate = (view: ActivePageView) => {
    if (isPlaying) {
      handleStopVideo();
    }
    setCurrentView(view);
  };

  const togglePlay = () => {
    if (isPlaying) {
      speechService.pause();
      setIsPlaying(false);
      setIsSpeaking(false);
    } else {
      setIsPlaying(true);
    }
  };

  const handleReplay = () => {
    speechService.stop();
    setCurrentSlideIndex(0);
    setIsPlaying(true);
  };

  const handlePrevSlide = () => {
    if (safeSlideIndex > 0) {
      speechService.stop();
      setCurrentSlideIndex(prev => Math.max(0, prev - 1));
    }
  };

  const handleNextSlide = () => {
    if (safeSlideIndex < safeSlides.length - 1) {
      speechService.stop();
      setCurrentSlideIndex(prev => Math.min(safeSlides.length - 1, prev + 1));
    }
  };

  const handleSeek = (percent: number) => {
    const targetSlideIndex = Math.min(
      safeSlides.length - 1,
      Math.floor((percent / 100) * safeSlides.length)
    );
    speechService.stop();
    setCurrentSlideIndex(targetSlideIndex);
  };

  const handleSpeedChange = (newSpeed: LectureSpeed) => {
    setSpeed(newSpeed);
    speechService.setPlaybackRate(newSpeed);
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    speechService.setMuted(nextMute);
  };

  const handleToggleSoundEffects = () => {
    const nextVal = !isSoundEffects;
    setIsSoundEffects(nextVal);
    speechService.setSoundEffectsEnabled(nextVal);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcut listener: Space for Play/Pause, S or Esc to Stop video
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyS' || e.key === 'Escape') {
        e.preventDefault();
        handleStopVideo();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextSlide();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, safeSlideIndex, safeSlides.length, handleStopVideo]);

  // Generate Lecture Handler
  const handleGenerateLecture = async (data: {
    textNotes?: string;
    fileData?: { base64: string; mimeType: string; fileName: string };
    teacherPersona: TeacherPersona;
    teachingStyle: string;
    slideCount: number;
    language: LectureLanguage;
    level: UnderstandingLevel;
    duration: number;
    voice: VoiceGender;
  }) => {
    setIsGenerating(true);
    setGenerationStep('Analyzing notes & topic structure...');

    try {
      setTimeout(() => setGenerationStep('Building slides with bullet points & infographics...'), 2000);
      setTimeout(() => setGenerationStep(`Synthesizing ${data.language} teacher script & gestures...`), 5000);

      const res = await fetch('/api/generate-lecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errPayload = await res.json().catch(() => null);
        throw new Error(errPayload?.error || `Generation failed with HTTP status ${res.status}`);
      }

      const resData = await res.json();
      // Handle both nested and root response payloads safely
      const rawGenerated = resData?.lecture?.slides ? resData.lecture : resData;
      const generated: LectureData = (rawGenerated && Array.isArray(rawGenerated.slides) && rawGenerated.slides.length > 0
        ? rawGenerated
        : DEMO_LECTURE) as LectureData;

      setLecture(generated);
      setActiveTeacher(data.teacherPersona);
      setCurrentSlideIndex(0);

      // Save to user library
      authService.saveLecture(generated);
      setSavedLectures(authService.getSavedLectures());

      setIsUploadOpen(false);
      setCurrentView('video');
      setActiveTab('presentation');
      showToast(`Created video lecture: "${generated.title}"`);
    } catch (err: any) {
      console.error('Lecture generation error:', err);
      showToast(err?.message ? `Notice: ${err.message}` : 'Could not generate lecture from AI. Using sample preview.');
      setIsUploadOpen(false);
      setCurrentView('video');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleOpenLecture = (
    targetLecture: LectureData,
    tab: LearnifyTab = 'presentation'
  ) => {
    handleStopVideo();
    const actual = ((targetLecture as any)?.lecture?.slides ? (targetLecture as any).lecture : targetLecture) as LectureData;
    if (actual && Array.isArray(actual.slides) && actual.slides.length > 0) {
      setLecture(actual);
    }
    setCurrentSlideIndex(0);
    setActiveTab(tab);
    setCurrentView('video');
  };

  const handleDeleteLecture = (lectureId: string) => {
    const updated = authService.deleteLecture(lectureId);
    setSavedLectures(updated);
    showToast('Removed from study library');
  };

  const handleSelectSlide = (index: number) => {
    speechService.stop();
    setCurrentSlideIndex(index);
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Global Navigation Bar matching Screenshot 1 & 2 */}
      <LearnifyNavbar
        currentView={currentView}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={() => {
          authService.signOut();
          setCurrentUser(null);
          setCurrentView('landing');
          showToast('Signed out');
        }}
        onAddMaterial={() => setIsUploadOpen(true)}
      />

      {/* 2. Toast Notifications */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3. View Switcher */}
      {currentView === 'landing' && (
        /* Landing Page View matching Screenshot 1 */
        <LearnifyLandingPage
          onOpenDashboard={() => setCurrentView('dashboard')}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenCreateVideo={() => {
            setCurrentView('video');
            setIsUploadOpen(true);
          }}
        />
      )}

      {currentView === 'dashboard' && (
        /* Dashboard View matching Screenshot 2 */
        <LearnifyDashboard
          currentUser={currentUser}
          savedLectures={savedLectures}
          onAddMaterial={() => setIsUploadOpen(true)}
          onCreateVideo={() => {
            setCurrentView('video');
            setIsUploadOpen(true);
          }}
          onOpenLecture={handleOpenLecture}
          onDeleteLecture={handleDeleteLecture}
        />
      )}

      {currentView === 'material' && (
        /* Study Material View */
        <LearnifyStudyMaterial
          lectures={savedLectures.length > 0 ? savedLectures : [lecture]}
          onOpenLecture={handleOpenLecture}
          onAddMaterial={() => setIsUploadOpen(true)}
          onDeleteLecture={handleDeleteLecture}
        />
      )}

      {currentView === 'video' && (
        /* Full PPT Presentation Video Lecture View */
        <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col pb-16">
          {/* Sub-Header Toolbar with Breadcrumb, Title, and Video Stoppage option */}
          <div className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleNavigate('dashboard')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Return to Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <div className="hidden sm:block h-4 w-px bg-slate-800" />

              <div className="truncate max-w-xs sm:max-w-md">
                <h2 className="text-xs sm:text-sm font-black text-white truncate">
                  {lecture.title}
                </h2>
                <p className="text-[10px] text-indigo-400 font-mono">
                  {lecture.subject || 'Interactive Lecture'} • Slide {safeSlideIndex + 1} of {safeSlides.length}
                </p>
              </div>
            </div>

            {/* Top Bar Quick Action Controls */}
            <div className="flex items-center gap-2">
              {/* Prominent Video Stoppage Button */}
              <button
                onClick={handleStopVideo}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                title="Stop Video (Halt Playback & Audio [S / Esc])"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop Video</span>
              </button>

              {/* Export Video */}
              <button
                onClick={() => setIsExportOpen(true)}
                className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 items-center gap-1.5 transition-colors"
              >
                <Video className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export</span>
              </button>

              {/* Create / Upload New */}
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Video</span>
              </button>
            </div>
          </div>

          {/* Main Studio Viewport */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-4">
            {/* Learnify Navigation Tabs */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 border-b border-slate-800">
              <button
                onClick={() => setActiveTab('presentation')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === 'presentation'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
                }`}
              >
                <Presentation className="w-4 h-4 text-indigo-200" />
                <span>PPT Video Lecture</span>
              </button>

              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === 'quiz'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
                }`}
              >
                <BrainCircuit className="w-4 h-4 text-emerald-400" />
                <span>Practice Quiz</span>
                {lecture.quizzes && lecture.quizzes.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded-full font-mono font-bold">
                    {lecture.quizzes.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('flashcards')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === 'flashcards'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
                }`}
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Flashcards</span>
                {lecture.flashcards && lecture.flashcards.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full font-mono font-bold">
                    {lecture.flashcards.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === 'notes'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>Study Notes</span>
              </button>

              <button
                onClick={() => setActiveTab('tutor')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === 'tutor'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span>Ask AI Tutor</span>
              </button>
            </div>

            {/* Tab View: 1. Presentation Video */}
            {activeTab === 'presentation' && (
              <div className="flex flex-col gap-4">
                {/* 16:9 Classroom Video Player Container */}
                <div
                  ref={videoContainerRef}
                  className={`relative w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col ${
                    isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'aspect-[16/9] min-h-[440px]'
                  }`}
                >
                  {/* Active Video Stage Area */}
                  <div className="relative flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Main Classroom Board (Plain white PPT slide with 2D visuals) */}
                    <div className="flex-1 h-full relative overflow-hidden bg-slate-100 p-2 sm:p-3">
                      <ClassroomBoard
                        slide={currentSlide}
                        theme={theme}
                        activeBulletId={activeBulletId}
                        isSpeaking={isSpeaking}
                        teacherGesture={currentGesture}
                      />
                    </div>

                    {/* Teacher Avatar Section (Physical teacher explaining in class) */}
                    {teacherViewMode === 'podium' && (
                      <div className="hidden lg:flex w-52 shrink-0 bg-slate-900 border-l border-slate-800 flex-col items-center justify-end p-4 backdrop-blur-md">
                        <TeacherAvatar
                          teacher={activeTeacher}
                          isSpeaking={isSpeaking}
                          gesture={currentGesture}
                          mode="podium"
                        />
                      </div>
                    )}

                    {/* Bubble Mode (Floating avatar on top right) */}
                    {teacherViewMode === 'bubble' && (
                      <div className="absolute top-4 right-4 z-20">
                        <TeacherAvatar
                          teacher={activeTeacher}
                          isSpeaking={isSpeaking}
                          gesture={currentGesture}
                          mode="bubble"
                        />
                      </div>
                    )}

                    {/* Subtitle / Caption Ticker */}
                    {activeSubtitle && (
                      <div className="absolute bottom-2 left-4 right-4 z-20 pointer-events-none flex justify-center">
                        <div className="max-w-2xl bg-slate-950/95 border border-slate-700 text-slate-100 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-center shadow-xl backdrop-blur-md leading-snug">
                          <span className="text-indigo-400 font-bold mr-1.5">
                            {activeTeacher.name.split(' ')[0]}:
                          </span>
                          "{activeSubtitle}"
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Video Player Transport Bar with Stop Video Option */}
                  <VideoPlayerControls
                    isPlaying={isPlaying}
                    onTogglePlay={togglePlay}
                    onStopVideo={handleStopVideo}
                    onPrevSlide={handlePrevSlide}
                    onNextSlide={handleNextSlide}
                    onReplay={handleReplay}
                    currentSlideIndex={safeSlideIndex}
                    totalSlides={safeSlides.length}
                    progressPercent={progressPercent}
                    onSeek={handleSeek}
                    currentTimeStr={formatTime(elapsedBeforeCurrent)}
                    totalTimeStr={formatTime(totalDuration)}
                    speed={speed}
                    onSpeedChange={handleSpeedChange}
                    isMuted={isMuted}
                    onToggleMute={handleToggleMute}
                    isSoundEffects={isSoundEffects}
                    onToggleSoundEffects={handleToggleSoundEffects}
                    teacherViewMode={teacherViewMode}
                    onTeacherViewModeChange={setTeacherViewMode}
                    theme={theme}
                    onThemeChange={setTheme}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={handleToggleFullscreen}
                  />
                </div>

                {/* Slide Navigation Ribbon */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Slide Sequence ({safeSlides.length} Slides)
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Click any slide to jump directly
                    </span>
                  </div>

                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {safeSlides.map((slide, idx) => {
                      const isActive = idx === safeSlideIndex;
                      return (
                        <button
                          key={slide.id || idx}
                          onClick={() => handleSelectSlide(idx)}
                          className={`flex-shrink-0 w-36 sm:w-44 text-left p-2.5 rounded-xl border transition-all ${
                            isActive
                              ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                              : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="font-bold text-indigo-400">Slide {idx + 1}</span>
                            <span className="font-mono text-slate-500">
                              {Math.round(slide.estimatedDurationSeconds || 30)}s
                            </span>
                          </div>
                          <p className="text-xs font-bold truncate text-slate-200">
                            {slide.topicTitle}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {slide.bullets?.[0]?.heading || 'Slide concept'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab View: 2. Practice Quiz */}
            {activeTab === 'quiz' && (
              <InteractiveQuiz
                questions={lecture.quizzes || []}
                lessonTitle={lecture.title}
              />
            )}

            {/* Tab View: 3. Flashcards */}
            {activeTab === 'flashcards' && (
              <FlashcardsViewer
                flashcards={lecture.flashcards || []}
                lessonTitle={lecture.title}
              />
            )}

            {/* Tab View: 4. Study Notes */}
            {activeTab === 'notes' && (
              <StudyNotesGuide lecture={{ ...lecture, slides: safeSlides }} />
            )}

            {/* Tab View: 5. AI Tutor & Doubts */}
            {activeTab === 'tutor' && (
              <LectureCompanion
                lecture={{ ...lecture, slides: safeSlides }}
                currentSlideIndex={safeSlideIndex}
                onSelectSlide={handleSelectSlide}
                teacher={activeTeacher}
                onPlaySentence={(sIdx, text) => {
                  setCurrentSlideIndex(sIdx);
                  setActiveSubtitle(text);
                  speechService.speak(text, {
                    gender: activeTeacher.voiceGender,
                    language: lecture.language || 'English',
                    rate: activeTeacher.speechRate * speed,
                    pitch: activeTeacher.speechPitch,
                  });
                  setIsSpeaking(true);
                }}
              />
            )}
          </main>
        </div>
      )}

      {/* 4. Modals */}
      <UploadStudio
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onGenerate={handleGenerateLecture}
        isGenerating={isGenerating}
        generationStep={generationStep}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        lecture={lecture}
        videoElement={videoContainerRef.current}
      />

      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        savedCount={savedLectures.length}
        onAuthSuccess={user => {
          setCurrentUser(user);
          showToast(`Welcome back, ${user.name}`);
        }}
        onSignOut={() => {
          authService.signOut();
          setCurrentUser(null);
          setCurrentView('landing');
          showToast('Signed out');
        }}
      />
    </div>
  );
}
