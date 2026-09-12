import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, CheckCircle2, Lock, Mail, ArrowLeft } from 'lucide-react';
import { authService, GoogleUserProfile } from '../services/authService';

interface LearnifyLoginPageProps {
  onLoginSuccess: (user: GoogleUserProfile) => void;
  onNavigateHome: () => void;
  initialMode?: 'login' | 'signup';
}

export const LearnifyLoginPage: React.FC<LearnifyLoginPageProps> = ({
  onLoginSuccess,
  onNavigateHome,
  initialMode = 'login',
}) => {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const targetEmail = email.trim() || 'himanshujain1109@gmail.com';
    const targetName = isSignUp
      ? (name.trim() || targetEmail.split('@')[0])
      : (name.trim() || (targetEmail.includes('himanshu') ? 'himanshu' : targetEmail.split('@')[0]));

    setIsLoading(true);
    try {
      // Simulate quick natural auth transition
      await new Promise((r) => setTimeout(r, 350));
      const user = await authService.signInWithGoogle(targetEmail, targetName);
      onLoginSuccess(user);
    } catch (err) {
      setErrorMessage('Could not sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLoginHimanshu = async () => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const user = await authService.signInWithGoogle('himanshujain1109@gmail.com', 'Himanshu Jain');
      onLoginSuccess(user);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navbar matching Learnify AI */}
      <header className="w-full border-b border-slate-100 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
            aria-label="Learnify AI Home"
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

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSignUp(false)}
              className={`text-sm font-semibold transition-colors ${
                !isSignUp ? 'text-slate-950 font-bold' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Main Form Center Column matching Screenshot 2 */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-12 sm:py-16 max-w-xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          {/* Eyebrow */}
          <p className="text-xs font-black tracking-widest text-[#6366f1] uppercase mb-3">
            {isSignUp ? 'CREATE YOUR WORKSPACE' : 'WELCOME BACK'}
          </p>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            {isSignUp ? 'Join Learnify.' : 'Log in to Learnify.'}
          </h1>

          {/* Subtitle */}
          <p className="text-base text-slate-600 mt-2 mb-8 font-normal">
            {isSignUp
              ? 'Start your personalized AI-guided study space today.'
              : 'Continue your learning workspace.'}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Himanshu"
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-sm sm:text-base"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-sm sm:text-base"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-600 font-semibold">{errorMessage}</p>
            )}

            {/* Primary Action Button: Log in → */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-sm sm:text-base inline-flex items-center gap-2 transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50"
              >
                <span>{isLoading ? 'Signing in...' : isSignUp ? 'Create account →' : 'Log in →'}</span>
              </button>
            </div>
          </form>

          {/* Toggle link below form */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
              }}
              className="text-slate-600 hover:text-slate-950 font-semibold transition-colors text-left"
            >
              {isSignUp ? 'Already have an account? Log in' : 'New here? Create your account'}
            </button>

            {/* Quick 1-click preset login for instant testing */}
            <button
              type="button"
              onClick={handleQuickLoginHimanshu}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 px-3 py-1.5 rounded-xl transition-colors w-fit"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Continue as Himanshu</span>
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
