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
  User,
  History,
  Trash2,
  ChevronDown,
  Layers,
  FolderOpen,
  Presentation,
  BrainCircuit,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Sparkle,
  Loader2
} from 'lucide-react';
import {
  LectureData,
  TeacherPersona,
  LectureSpeed,
} from './types';
import { DEMO_LECTURE, TEACHER_PERSONAS, PRESET_NOTES } from './data/sampleLectures';
import { speechService } from './services/speechService';
import { authService, GoogleUserProfile } from './services/authService';
import { startVideoExport, pollVideoJob, downloadVideo } from './services/videoExportService';
import { ClassroomBoard } from './components/ClassroomBoard';
import { TeacherAvatar } from './components/TeacherAvatar';
import { VideoPlayerControls } from './components/VideoPlayerControls';
import { InteractiveQuiz } from './components/InteractiveQuiz';
import { FlashcardsViewer } from './components/FlashcardsViewer';
import { StudyNotesGuide } from './components/StudyNotesGuide';
import { UploadStudio, LectureLanguage, UnderstandingLevel, VoiceGender } from './components/UploadStudio';
import { LearnifyDashboard } from './components/LearnifyDashboard';
import { LearnifyLandingPage } from './components/LearnifyLandingPage';
import { LearnifyLoginPage } from './components/LearnifyLoginPage';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  ArrowLeft,
  Plus
} from 'lucide-react';

export type ActiveView = 'landing' | 'login' | 'dashboard' | 'video' | 'material';
type ActiveTab = 'presentation' | 'notes' | 'quiz' | 'flashcards';

export default function App() {
  const [currentUser, setCurrentUser] = useState<GoogleUserProfile | null>(authService.getCurrentUser());
  const [currentView, setCurrentView] = useState<ActiveView>(authService.getCurrentUser() ? 'dashboard' : 'landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [lecture, setLecture] = useState<LectureData>(DEMO_LECTURE);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [activeTeacher, setActiveTeacher] = useState<TeacherPersona>(TEACHER_PERSONAS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speed, setSpeed] = useState<LectureSpeed>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isSoundEffects, setIsSoundEffects] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('presentation');

  // Highlighting & gestures
  const [activeBulletId, setActiveBulletId] = useState<string | undefined>(undefined);
  const [currentGesture, setCurrentGesture] = useState<'pointing' | 'explaining' | 'writing' | 'questioning' | 'nodding'>('explaining');
  const [activeSubtitle, setActiveSubtitle] = useState<string>('');

  // Storage & Modals
  const [savedLectures, setSavedLectures] = useState<LectureData[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real MP4 export (distinct from the live in-browser Play/Pause presentation)
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [videoExportMessage, setVideoExportMessage] = useState('');

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const currentSegmentIndexRef = useRef(0);
  const segmentTimerRef = useRef<any>(null);
  const isPlayingRef = useRef(false);

  // Synchronize isPlayingRef with state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Safe slides fallback ensuring array access never throws
  const safeSlides = Array.isArray(lecture?.slides) && lecture.slides.length > 0 ? lecture.slides : DEMO_LECTURE.slides;
  const safeSlideIndex = Math.max(0, Math.min(safeSlides.length - 1, currentSlideIndex));
  const currentSlide = safeSlides[safeSlideIndex] || safeSlides[0] || DEMO_LECTURE.slides[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Initialize and load saved lectures from localStorage
  useEffect(() => {
    const unsub = authService.subscribe(user => {
      setCurrentUser(user);
      const userLectures = authService.getSavedLectures();
      if (userLectures.length === 0) {
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

  // Stop video function: halts speech synthesis, resets timers, slide, and active state
  const handleStopVideo = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsSpeaking(false);
    speechService.stop();
    if (segmentTimerRef.current) {
      clearTimeout(segmentTimerRef.current);
      segmentTimerRef.current = null;
    }
    currentSegmentIndexRef.current = 0;
    setCurrentSlideIndex(0);
    setActiveSubtitle('');
    setActiveBulletId(undefined);
    setCurrentGesture('explaining');
    showToast('Video stopped');
  }, []);

  // Renders and downloads a real, shareable MP4 of the current lecture
  // (narration + slides), via the video-service sidecar. This is separate
  // from the live Play/Pause presentation, which never produces a file.
  const handleExportVideo = useCallback(async () => {
    if (isExportingVideo) return;
    setIsExportingVideo(true);
    setVideoExportMessage('Starting video render…');
    try {
      const { job_id } = await startVideoExport(lecture, {
        voice: lecture.voiceGender,
        language: lecture.language,
        level: lecture.level,
      });

      const finalStatus = await pollVideoJob(job_id, (status) => {
        setVideoExportMessage(status.message || `Status: ${status.status}`);
      });

      if (finalStatus.status === 'done' && finalStatus.video_url) {
        downloadVideo(finalStatus.video_url, `${(lecture.title || 'lecture').replace(/\s+/g, '-').toLowerCase()}.mp4`);
        showToast('Video downloaded!');
      } else {
        showToast(finalStatus.message || 'Video export failed.');
      }
    } catch (error: any) {
      console.error('Video export failed:', error);
      showToast(error?.message || 'Video export failed. Is video-service running?');
    } finally {
      setIsExportingVideo(false);
      setVideoExportMessage('');
    }
  }, [isExportingVideo, lecture]);

  // Pause video function: pauses speech, preserves current slide & segment
  const handlePauseVideo = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsSpeaking(false);
    speechService.stop();
    if (segmentTimerRef.current) {
      clearTimeout(segmentTimerRef.current);
      segmentTimerRef.current = null;
    }
    showToast('Playback paused');
  }, []);

  // Play narration and segment stepping
  const playSlideSpeech = useCallback((slideIndex: number, startSegmentIdx = 0) => {
    const targetSlide = safeSlides[slideIndex];
    if (!targetSlide) return;

    if (segmentTimerRef.current) {
      clearTimeout(segmentTimerRef.current);
      segmentTimerRef.current = null;
    }

    const segments = targetSlide.scriptSegments || [{ text: targetSlide.teacherScript, teacherGesture: 'explaining' }];
    currentSegmentIndexRef.current = startSegmentIdx;

    const playNextSegment = () => {
      if (!isPlayingRef.current) return;

      const currentIdx = currentSegmentIndexRef.current;
      if (currentIdx >= segments.length) {
        setIsSpeaking(false);
        speechService.playSlideChime();

        if (slideIndex < safeSlides.length - 1) {
          currentSegmentIndexRef.current = 0;
          setCurrentSlideIndex(slideIndex + 1);
        } else {
          isPlayingRef.current = false;
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
          if (!isPlayingRef.current) return;
          currentSegmentIndexRef.current += 1;
          segmentTimerRef.current = setTimeout(() => {
            if (isPlayingRef.current) {
              playNextSegment();
            }
          }, 350 / speed);
        },
      });
    };

    playNextSegment();
  }, [safeSlides, lecture.language, activeTeacher, speed]);

  useEffect(() => {
    if (isPlaying) {
      playSlideSpeech(safeSlideIndex, currentSegmentIndexRef.current);
    } else {
      speechService.stop();
      setIsSpeaking(false);
      if (segmentTimerRef.current) {
        clearTimeout(segmentTimerRef.current);
        segmentTimerRef.current = null;
      }
    }
  }, [safeSlideIndex, isPlaying, playSlideSpeech]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      handlePauseVideo();
    } else {
      isPlayingRef.current = true;
      setIsPlaying(true);
    }
  }, [handlePauseVideo]);

  const handleReplay = useCallback(() => {
    handlePauseVideo();
    currentSegmentIndexRef.current = 0;
    setCurrentSlideIndex(safeSlideIndex);
    setTimeout(() => {
      isPlayingRef.current = true;
      setIsPlaying(true);
    }, 60);
  }, [handlePauseVideo, safeSlideIndex]);

  const handlePrevSlide = useCallback(() => {
    if (safeSlideIndex > 0) {
      handlePauseVideo();
      currentSegmentIndexRef.current = 0;
      setCurrentSlideIndex(safeSlideIndex - 1);
      setTimeout(() => {
        isPlayingRef.current = true;
        setIsPlaying(true);
      }, 60);
    }
  }, [handlePauseVideo, safeSlideIndex]);

  const handleNextSlide = useCallback(() => {
    if (safeSlideIndex < safeSlides.length - 1) {
      handlePauseVideo();
      currentSegmentIndexRef.current = 0;
      setCurrentSlideIndex(safeSlideIndex + 1);
      setTimeout(() => {
        isPlayingRef.current = true;
        setIsPlaying(true);
      }, 60);
    }
  }, [handlePauseVideo, safeSlideIndex, safeSlides.length]);

  const handleSeek = useCallback((percent: number) => {
    const targetSeconds = (percent / 100) * totalDuration;
    let accumulated = 0;
    for (let i = 0; i < safeSlides.length; i++) {
      const slideDuration = safeSlides[i].estimatedDurationSeconds || 35;
      if (accumulated + slideDuration >= targetSeconds || i === safeSlides.length - 1) {
        handlePauseVideo();
        currentSegmentIndexRef.current = 0;
        setCurrentSlideIndex(i);
        setTimeout(() => {
          isPlayingRef.current = true;
          setIsPlaying(true);
        }, 60);
        break;
      }
      accumulated += slideDuration;
    }
  }, [handlePauseVideo, safeSlides, totalDuration]);

  const handleSpeedChange = (newSpeed: LectureSpeed) => {
    setSpeed(newSpeed);
    speechService.setPlaybackRate(newSpeed);
    if (isPlaying) {
      playSlideSpeech(safeSlideIndex, currentSegmentIndexRef.current);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    speechService.setMuted(nextMuted);
  };

  const handleToggleSoundEffects = () => {
    const nextSFX = !isSoundEffects;
    setIsSoundEffects(nextSFX);
    speechService.setSoundEffectsEnabled(nextSFX);
    showToast(nextSFX ? 'Sound effects enabled' : 'Sound effects muted');
  };

  const handleToggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyS' || e.code === 'Escape') {
        if (isPlaying) {
          e.preventDefault();
          handleStopVideo();
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevSlide();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextSlide();
      } else if (e.code === 'KeyM') {
        handleToggleMute();
      } else if (e.code === 'KeyF') {
        handleToggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, safeSlideIndex, safeSlides.length, togglePlay, handleStopVideo, handlePrevSlide, handleNextSlide]);

  // Handle generation of new lecture
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
    setGenerationStep('Analyzing notes and outlining pedagogical structure...');

    try {
      const stepTimer1 = setTimeout(() => {
        setGenerationStep('Formulating classroom PPT slides & 2D diagrams...');
      }, 2500);

      const stepTimer2 = setTimeout(() => {
        setGenerationStep('Synthesizing teacher script & key axioms...');
      }, 5500);

      const response = await fetch('/api/generate-lecture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!response.ok) {
        throw new Error(`Generation failed with status ${response.status}`);
      }

      const result = await response.json();
      if (!result.lecture) {
        throw new Error('No lecture received from generator.');
      }

      handleStopVideo();
      setLecture(result.lecture);
      setActiveTeacher(data.teacherPersona);
      setCurrentSlideIndex(0);
      setIsUploadOpen(false);

      // Save to savedLectures list
      authService.saveLecture(result.lecture);
      setSavedLectures(authService.getSavedLectures());

      showToast(`Generated: "${result.lecture.title}"`);
    } catch (err: any) {
      console.error('Lecture generation error:', err);
      showToast('Generation issue: loaded fallback lecture notes.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Switch to a different lecture
  const handleSelectLecture = (target: LectureData, switchToVideo: boolean = false) => {
    handleStopVideo();
    setLecture(target);
    setCurrentSlideIndex(0);
    setIsLibraryOpen(false);
    if (switchToVideo) {
      setCurrentView('video');
      setTimeout(() => {
        setIsPlaying(true);
      }, 150);
    }
    showToast(`Loaded "${target.title}"`);
  };

  // Delete lecture
  const handleDeleteLecture = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    authService.deleteLecture(id);
    const updated = authService.getSavedLectures();
    setSavedLectures(updated);
    if (lecture.id === id) {
      if (updated.length > 0) {
        setLecture(updated[0]);
        setCurrentSlideIndex(0);
      } else {
        authService.saveLecture(DEMO_LECTURE);
        setSavedLectures([DEMO_LECTURE]);
        setLecture(DEMO_LECTURE);
        setCurrentSlideIndex(0);
      }
    }
    showToast('Study material removed');
  };

  const handleAuthSuccess = (user: GoogleUserProfile) => {
    setCurrentUser(user);
    const userLectures = authService.getSavedLectures();
    if (userLectures.length > 0) {
      setSavedLectures(userLectures);
      setLecture(userLectures[0]);
    }
    setCurrentView('dashboard');
    showToast(`Signed in as ${user.name}`);
  };

  const handleSignOut = () => {
    handleStopVideo();
    authService.signOut();
    setCurrentUser(null);
    setCurrentView('login');
    showToast('Signed out successfully');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full shadow-lg border border-slate-700 animate-in fade-in slide-in-from-top-3">
          {toastMessage}
        </div>
      )}

      {/* Landing Page View */}
      {currentView === 'landing' && (
        <LearnifyLandingPage
          onOpenDashboard={() => setCurrentView(currentUser ? 'dashboard' : 'login')}
          onOpenLogin={() => setCurrentView('login')}
          onOpenSignUp={() => setCurrentView('login')}
        />
      )}

      {/* Login Dashboard View */}
      {currentView === 'login' && (
        <LearnifyLoginPage
          onLoginSuccess={(u) => {
            setCurrentUser(u);
            const userLectures = authService.getSavedLectures();
            if (userLectures.length > 0) {
              setSavedLectures(userLectures);
              setLecture(userLectures[0]);
            }
            setCurrentView('dashboard');
            showToast(`Welcome back, ${u.name}`);
          }}
          onNavigateHome={() => setCurrentView('landing')}
        />
      )}

      {/* Modern White Top Navigation Bar for Authenticated Views */}
      {currentView !== 'landing' && currentView !== 'login' && (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-2xs transition-colors">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-4 sm:gap-6">
              <button
                onClick={() => {
                  handleStopVideo();
                  setCurrentView(currentUser ? 'dashboard' : 'landing');
                }}
                className="flex items-center gap-2.5 group text-left focus:outline-none"
                title="Go to Dashboard"
              >
                <div className="w-9 h-9 rounded-xl bg-[#6366f1] text-white flex items-center justify-center font-black text-lg shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
                  L
                </div>
                <div className="flex items-baseline">
                  <span className="text-xl font-black tracking-tight text-slate-900">
                    Learnify
                  </span>
                  <span className="text-xl font-bold tracking-tight text-[#6366f1] ml-1">
                    AI
                  </span>
                </div>
              </button>

              {/* Desktop Navigation Tabs */}
              <nav className="hidden md:flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={() => {
                    handleStopVideo();
                    setCurrentView('dashboard');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    currentView === 'dashboard'
                      ? 'text-indigo-600 bg-indigo-50/90 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    handleStopVideo();
                    setCurrentView('material');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    currentView === 'material'
                      ? 'text-indigo-600 bg-indigo-50/90 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Study Material</span>
                </button>

                <button
                  onClick={() => setCurrentView('video')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    currentView === 'video'
                      ? 'text-indigo-600 bg-indigo-50/90 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Notes → Video</span>
                  <span className="text-[10px] uppercase font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                    AI
                  </span>
                </button>
              </nav>
            </div>

            {/* Quick Actions & User Login Status */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Library / Saved Lectures Drawer Button */}
              <div className="relative">
                <button
                  onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                  title="View Saved Lectures"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Lectures</span>
                  <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold">
                    {savedLectures.length}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Saved Lectures Dropdown Menu */}
                {isLibraryOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <span className="text-xs font-bold text-slate-800">Your Lecture Library</span>
                      <span className="text-[10px] text-slate-500">{savedLectures.length} saved</span>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                      {savedLectures.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectLecture(item, true)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                            lecture.id === item.id
                              ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-bold truncate">{item.title}</p>
                            <p className="text-[10px] text-slate-500 truncate font-normal">
                              {item.subject} • {item.slides?.length || 0} slides
                            </p>
                          </div>
                          {savedLectures.length > 1 && (
                            <button
                              onClick={(e) => handleDeleteLecture(item.id, e)}
                              className="p-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete lecture"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Action: Create / Upload Lecture */}
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add material</span>
                <span className="sm:hidden">Add</span>
              </button>

              {/* User Profile / Log In */}
              {currentUser ? (
                <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                    title="Account Settings"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold border border-indigo-200">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden lg:inline">{currentUser.name}</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCurrentView('login')}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 text-[#6366f1] border border-indigo-200 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Sub-Navigation Bar */}
          <div className="md:hidden flex items-center justify-around border-t border-slate-200/80 bg-slate-50/90 mt-2.5 -mx-4 -mb-2.5 py-2 px-2 text-xs font-bold text-slate-600">
            <button
              onClick={() => {
                handleStopVideo();
                setCurrentView('dashboard');
              }}
              className={`flex items-center gap-1 py-1 px-2 rounded-lg ${
                currentView === 'dashboard' ? 'text-indigo-600 bg-white shadow-xs font-bold' : ''
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => {
                handleStopVideo();
                setCurrentView('material');
              }}
              className={`flex items-center gap-1 py-1 px-2 rounded-lg ${
                currentView === 'material' ? 'text-indigo-600 bg-white shadow-xs font-bold' : ''
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Study Material</span>
            </button>
            <button
              onClick={() => setCurrentView('video')}
              className={`flex items-center gap-1 py-1 px-2 rounded-lg ${
                currentView === 'video' ? 'text-indigo-600 bg-white shadow-xs font-bold' : ''
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Notes → Video</span>
            </button>
          </div>
        </header>
      )}

      {/* Main Container Switching between Dashboard, Video, and Study Material views */}
      {currentView === 'dashboard' && (
        <LearnifyDashboard
          currentUser={currentUser}
          savedLectures={savedLectures}
          onAddMaterial={() => setIsUploadOpen(true)}
          onCreateVideo={() => {
            setCurrentView('video');
            setIsUploadOpen(true);
          }}
          onOpenLecture={(selectedLec, tab) => {
            handleStopVideo();
            setLecture(selectedLec);
            setCurrentSlideIndex(0);
            if (tab && tab !== 'presentation') {
              setActiveTab(tab as any);
              setCurrentView('material');
            } else {
              setActiveTab('presentation');
              setCurrentView('video');
              setTimeout(() => setIsPlaying(true), 150);
            }
          }}
          onDeleteLecture={(id) => handleDeleteLecture(id)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      )}

      {currentView === 'material' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
          {/* Active Material Header Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
                <span className="text-slate-300">•</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                  {lecture.subject || 'Study Guide'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {lecture.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {lecture.slides?.length || 0} slide topics • {lecture.quizzes?.length || 0} quiz questions • {lecture.flashcards?.length || 0} flashcards
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCurrentView('video');
                  setTimeout(() => setIsPlaying(true), 150);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Video Lecture</span>
              </button>
            </div>
          </div>

          {/* Unified Study Deck Tabs */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('notes')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === 'notes'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Study Notes & Review</span>
              </button>

              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === 'quiz'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <BrainCircuit className="w-4 h-4" />
                <span>Practice Quiz</span>
                {lecture.quizzes && lecture.quizzes.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full font-mono font-bold">
                    {lecture.quizzes.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('flashcards')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === 'flashcards'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Flashcards</span>
                {lecture.flashcards && lecture.flashcards.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full font-mono font-bold">
                    {lecture.flashcards.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('presentation')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === 'presentation'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Presentation className="w-4 h-4" />
                <span>Slide Script & Focus</span>
              </button>
            </div>

            {/* Tab 1: Study Notes */}
            {activeTab === 'notes' && (
              <StudyNotesGuide lecture={lecture} />
            )}

            {/* Tab 2: Interactive Practice Quiz */}
            {activeTab === 'quiz' && (
              <InteractiveQuiz questions={lecture.quizzes || []} lessonTitle={lecture.title} />
            )}

            {/* Tab 3: Flashcards */}
            {activeTab === 'flashcards' && (
              <FlashcardsViewer flashcards={lecture.flashcards || []} lessonTitle={lecture.title} />
            )}

            {/* Tab 4: Slide Script & Focus */}
            {activeTab === 'presentation' && (
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      Slide {safeSlideIndex + 1} of {safeSlides.length}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {currentSlide.topicTitle}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-medium">
                      Duration: ~{currentSlide.estimatedDurationSeconds || 35}s
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Spoken Teacher Narration:
                    </span>
                    <p className="text-sm text-slate-800 leading-relaxed font-normal">
                      "{currentSlide.teacherScript}"
                    </p>
                  </div>

                  {currentSlide.calloutBox && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950">
                      <strong className="font-bold text-indigo-700">
                        [{currentSlide.calloutBox.title || 'Key Focus'}]:{' '}
                      </strong>
                      <span>{currentSlide.calloutBox.text}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {currentView === 'video' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
          {/* Lecture Meta Header Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleStopVideo();
                    setCurrentView('dashboard');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors mr-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                  {lecture.subject || 'Lecture'}
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Audience: {lecture.targetAudience || 'Students'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {lecture.title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Play/Pause */}
              <button
                onClick={togglePlay}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Lecture</span>
                  </>
                )}
              </button>

              {/* Stop Video Button */}
              <button
                onClick={handleStopVideo}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                title="Stop Video (Halt Playback & Audio)"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>

              {/* Export real MP4 (narration + slides rendered server-side) */}
              <button
                onClick={handleExportVideo}
                disabled={isExportingVideo}
                className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
                title={videoExportMessage || 'Render and download this lecture as an MP4 file'}
              >
                {isExportingVideo ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{videoExportMessage || 'Rendering…'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Video</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 16:9 Presentation Video Stage Container */}
          <div
            ref={videoContainerRef}
            className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white flex flex-col transition-all ${
              isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'aspect-[16/9] min-h-[460px]'
            }`}
          >
            {/* Active Stage: Board (Left) + Teacher Podium (Right) */}
            <div className="relative flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-50">
              {/* Main Presentation Board (Plain white PPT slide with 2D Infographics) */}
              <div className="flex-1 h-full relative overflow-hidden p-2 sm:p-3">
                <ClassroomBoard
                  slide={currentSlide}
                  theme="whiteboard"
                  activeBulletId={activeBulletId}
                  isSpeaking={isSpeaking}
                  teacherGesture={currentGesture}
                />
              </div>

              {/* Professorial Teacher Podium Section */}
              <div className="hidden lg:flex w-56 shrink-0 bg-white border-l border-slate-200 flex-col items-center justify-end p-4 shadow-xs">
                <TeacherAvatar
                  teacher={activeTeacher}
                  isSpeaking={isSpeaking}
                  gesture={currentGesture}
                  mode="podium"
                />
              </div>

              {/* Synchronized Subtitles / Caption Ticker Bar */}
              {activeSubtitle && (
                <div className="absolute bottom-3 left-4 right-4 z-20 pointer-events-none flex justify-center">
                  <div className="max-w-2xl bg-white/95 border border-slate-200 text-slate-800 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-center shadow-lg backdrop-blur-md leading-snug">
                    <span className="text-indigo-600 font-bold mr-1.5">
                      {activeTeacher.name.split(' ')[0]}:
                    </span>
                    "{activeSubtitle}"
                  </div>
                </div>
              )}
            </div>

            {/* Video Player Transport Controls Bar */}
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
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
            />
          </div>

          {/* Slide Sequence Navigation Carousel */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Slide Sequence ({safeSlides.length} slides)
              </span>
              <span className="text-[11px] text-slate-500">
                Click any slide card to jump directly
              </span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {safeSlides.map((slide, sIdx) => {
                const isActive = sIdx === safeSlideIndex;
                return (
                  <button
                    key={slide.id || sIdx}
                    onClick={() => {
                      handleStopVideo();
                      setCurrentSlideIndex(sIdx);
                      setTimeout(() => {
                        setIsPlaying(true);
                      }, 100);
                    }}
                    className={`min-w-[170px] sm:min-w-[200px] p-3 text-left rounded-xl border transition-all shrink-0 ${
                      isActive
                        ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-200 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-bold text-indigo-600">Slide {sIdx + 1}</span>
                      <span>~{slide.estimatedDurationSeconds || 35}s</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {slide.topicTitle}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {slide.chapterTitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unified White Study Suite Tabs */}
          <div className="space-y-4">
            {/* Tab Navigation Buttons */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('presentation')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === 'presentation'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Presentation className="w-4 h-4" />
                <span>Slide Script & Focus</span>
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === 'notes'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Study Notes & Review</span>
              </button>

              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === 'quiz'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <BrainCircuit className="w-4 h-4" />
                <span>Practice Quiz</span>
                {lecture.quizzes && lecture.quizzes.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full font-mono font-bold">
                    {lecture.quizzes.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('flashcards')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === 'flashcards'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Flashcards</span>
                {lecture.flashcards && lecture.flashcards.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full font-mono font-bold">
                    {lecture.flashcards.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab 1: Slide Script & Focus */}
            {activeTab === 'presentation' && (
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      Current Slide {safeSlideIndex + 1} of {safeSlides.length}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {currentSlide.topicTitle}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-medium">
                      Duration: ~{currentSlide.estimatedDurationSeconds || 35}s
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Spoken Teacher Narration:
                    </span>
                    <p className="text-sm text-slate-800 leading-relaxed font-normal">
                      "{currentSlide.teacherScript}"
                    </p>
                  </div>

                  {currentSlide.calloutBox && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950">
                      <strong className="font-bold text-indigo-700">
                        [{currentSlide.calloutBox.title || 'Key Focus'}]:{' '}
                      </strong>
                      <span>{currentSlide.calloutBox.text}</span>
                    </div>
                  )}

                  {currentSlide.blackboardSummarySnippet && (
                    <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-800">
                      <span className="font-sans text-slate-500 mr-2 text-[11px] uppercase tracking-wider font-normal">
                        Axiom / Formula:
                      </span>
                      <span>{currentSlide.blackboardSummarySnippet}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Study Notes */}
            {activeTab === 'notes' && (
              <StudyNotesGuide lecture={lecture} />
            )}

            {/* Tab 3: Interactive Practice Quiz */}
            {activeTab === 'quiz' && (
              <InteractiveQuiz questions={lecture.quizzes || []} lessonTitle={lecture.title} />
            )}

            {/* Tab 4: Flashcards */}
            {activeTab === 'flashcards' && (
              <FlashcardsViewer flashcards={lecture.flashcards || []} lessonTitle={lecture.title} />
            )}
          </div>
        </main>
      )}

      {/* Upload Studio Modal (White UI) */}
      <UploadStudio
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onGenerate={handleGenerateLecture}
        isGenerating={isGenerating}
        generationStep={generationStep}
      />

      {/* Google Auth & Login Dashboard Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        savedCount={savedLectures.length}
        onAuthSuccess={handleAuthSuccess}
        onSignOut={handleSignOut}
      />
    </div>
  );
}
