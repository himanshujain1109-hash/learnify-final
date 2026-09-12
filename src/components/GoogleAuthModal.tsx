import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, LogOut, Check, Sparkles, Video, Mail, Shield, UserCheck, ArrowRight } from 'lucide-react';
import { authService, GoogleUserProfile } from '../services/authService';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: GoogleUserProfile | null;
  savedCount: number;
  onAuthSuccess: (user: GoogleUserProfile) => void;
  onSignOut: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  savedCount,
  onAuthSuccess,
  onSignOut,
}) => {
  const [emailInput, setEmailInput] = useState('hjtj2234@gmail.com');
  const [nameInput, setNameInput] = useState('himanshu');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  if (!isOpen) return null;

  const handleGoogleQuickSignIn = async (defaultEmail?: string, defaultName?: string) => {
    setIsLoading(true);
    try {
      await new Promise(r => setTimeout(r, 450));
      const user = await authService.signInWithGoogle(
        defaultEmail || emailInput || 'hjtj2234@gmail.com',
        defaultName || nameInput || 'himanshu'
      );
      onAuthSuccess(user);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    handleGoogleQuickSignIn(emailInput.trim(), nameInput.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 text-slate-900"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          /* Logged In Profile View */
          <div className="space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xl border border-indigo-200 shadow-xs">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">{currentUser.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500">{currentUser.email}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Member since {new Date(currentUser.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Video className="w-4 h-4 text-indigo-600" />
                <span className="text-xs text-slate-700 font-bold">Saved Study Materials</span>
              </div>
              <span className="text-sm font-black text-indigo-600 font-mono">{savedCount}</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Your video lectures, plain white PPT presentation slides, 2D diagrams, and interactive quizzes are securely synced.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs shadow-sm transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto mb-1">
                <div className="w-8 h-8 rounded-xl bg-[#6366f1] text-white flex items-center justify-center font-black text-base">
                  L
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {activeTab === 'signin' ? 'Welcome to Learnify AI' : 'Create Learnify Account'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Sign in to create, save, and study your personalized video lectures and notes.
              </p>
            </div>

            {/* Switch Tab */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('signin')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'signin'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'signup'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Fast 1-Click Sign-in (Defaults to Himanshu as in screenshot) */}
            <button
              onClick={() => handleGoogleQuickSignIn('hjtj2234@gmail.com', 'himanshu')}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-slate-900 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isLoading ? 'Signing In...' : 'Continue as himanshu'}</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                or with custom email
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Custom Email Form */}
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="e.g. himanshu"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="hjtj2234@gmail.com"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !emailInput.trim()}
                className="w-full py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-40"
              >
                {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="pt-1 flex items-center gap-1.5 justify-center text-[11px] text-slate-400">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              <span>Free account • Synced to browser storage</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
