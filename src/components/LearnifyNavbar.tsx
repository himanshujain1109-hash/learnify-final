import React from 'react';
import { Sparkles, Video, BookOpen, LayoutDashboard, LogOut, User, Plus } from 'lucide-react';
import { GoogleUserProfile } from '../services/authService';

export type ActivePageView = 'landing' | 'dashboard' | 'material' | 'video';

interface LearnifyNavbarProps {
  currentView: ActivePageView;
  onNavigate: (view: ActivePageView) => void;
  currentUser: GoogleUserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onAddMaterial: () => void;
}

export const LearnifyNavbar: React.FC<LearnifyNavbarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onOpenAuth,
  onSignOut,
  onAddMaterial,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo matching Learnify AI */}
        <div className="flex items-center gap-6 sm:gap-8">
          <button
            onClick={() => onNavigate(currentUser ? 'dashboard' : 'landing')}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
            aria-label="Learnify AI Home"
          >
            {/* Purple rounded square icon with 'L' */}
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

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'dashboard'
                  ? 'text-indigo-600 bg-indigo-50/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => onNavigate('material')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'material'
                  ? 'text-indigo-600 bg-indigo-50/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              Study Material
            </button>

            <button
              onClick={() => onNavigate('video')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                currentView === 'video'
                  ? 'text-indigo-600 bg-indigo-50/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <span>Notes → Video</span>
              <span className="text-[10px] uppercase font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                AI
              </span>
            </button>
          </nav>
        </div>

        {/* Right Side Controls & Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Add Button (visible on mobile / desktop) */}
          <button
            onClick={onAddMaterial}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80 transition-colors"
            title="Add notes or PDF"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add material</span>
          </button>

          {currentUser ? (
            /* Logged-In User Menu matching Screenshot */
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
                title="Account Settings"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold border border-indigo-200">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline">Hi, {currentUser.name}</span>
              </button>

              <button
                onClick={onSignOut}
                className="text-sm font-semibold text-slate-500 hover:text-rose-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
                title="Logout"
              >
                Logout
              </button>
            </div>
          ) : (
            /* Logged-Out Controls */
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg transition-colors"
              >
                Login
              </button>
              <button
                onClick={onOpenAuth}
                className="text-sm font-bold text-white bg-[#6366f1] hover:bg-[#4f46e5] px-4 py-1.5 rounded-xl transition-all shadow-sm shadow-indigo-200"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200/80 bg-slate-50/90 py-2 px-2 text-xs font-bold text-slate-600">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex items-center gap-1 py-1 px-2 rounded-lg ${
            currentView === 'dashboard' ? 'text-indigo-600 bg-white shadow-xs' : ''
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => onNavigate('material')}
          className={`flex items-center gap-1 py-1 px-2 rounded-lg ${
            currentView === 'material' ? 'text-indigo-600 bg-white shadow-xs' : ''
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Study Material</span>
        </button>
        <button
          onClick={() => onNavigate('video')}
          className={`flex items-center gap-1 py-1 px-2 rounded-lg ${
            currentView === 'video' ? 'text-indigo-600 bg-white shadow-xs' : ''
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Notes → Video</span>
        </button>
      </div>
    </header>
  );
};
