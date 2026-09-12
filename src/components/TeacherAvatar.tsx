import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { TeacherPersona } from '../types';
import { Sparkles, Volume2 } from 'lucide-react';

interface TeacherAvatarProps {
  teacher: TeacherPersona;
  isSpeaking: boolean;
  gesture?: 'pointing' | 'explaining' | 'writing' | 'questioning' | 'nodding';
  mode?: 'podium' | 'bubble' | 'minimal';
}

export const TeacherAvatar: React.FC<TeacherAvatarProps> = ({
  teacher,
  isSpeaking,
  gesture = 'explaining',
  mode = 'podium',
}) => {
  const [mouthOpen, setMouthOpen] = useState(false);
  const [blink, setBlink] = useState(false);

  // Mouth movement simulation while speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(false);
      return;
    }
    const interval = setInterval(() => {
      setMouthOpen(prev => !prev);
    }, 140);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Periodic natural eye blinking
  useEffect(() => {
    const blinkTimer = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3800);
    return () => clearInterval(blinkTimer);
  }, []);

  const isFemale = teacher.voiceGender === 'female';
  const isClara = teacher.avatarStyle === 'clara';
  const isMarcus = teacher.avatarStyle === 'marcus';
  const isMaya = teacher.avatarStyle === 'maya';
  const isAlan = teacher.avatarStyle === 'alan';

  // Hair color & attire colors
  const jacketColor = isClara
    ? '#065F46' // Forest green blazer
    : isMarcus
    ? '#312E81' // Indigo academic suit
    : isMaya
    ? '#9A3412' // Terracotta warm cardigan
    : '#1E293B'; // Slate academic vest

  const shirtColor = isClara ? '#F0FDF4' : isMarcus ? '#EEF2FF' : isMaya ? '#FEF3C7' : '#F8FAFC';
  const hairColor = isClara ? '#451A03' : isMarcus ? '#374151' : isMaya ? '#18181B' : '#64748B';
  const skinTone = isMarcus ? '#8D5B4C' : isMaya ? '#C68642' : '#F5D0C5';

  if (mode === 'bubble') {
    return (
      <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-full px-3.5 py-1.5 shadow-xl">
        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-400/80 bg-slate-800">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="48" fill="#1E293B" />
            <circle cx="50" cy="42" r="22" fill={skinTone} />
            {/* Hair */}
            <path
              d={isFemale ? 'M28,40 Q50,15 72,40 Q70,22 50,20 Q30,22 28,40 Z' : 'M30,35 Q50,18 70,35 Q65,22 50,22 Q35,22 30,35 Z'}
              fill={hairColor}
            />
            {/* Eyes */}
            <circle cx="43" cy="40" r={blink ? 0.5 : 2.5} fill="#1E293B" />
            <circle cx="57" cy="40" r={blink ? 0.5 : 2.5} fill="#1E293B" />
            {/* Mouth */}
            <path
              d={mouthOpen ? 'M44,52 Q50,60 56,52 Z' : 'M45,52 Q50,55 55,52'}
              stroke="#B91C1C"
              strokeWidth="2"
              fill={mouthOpen ? '#7F1D1D' : 'none'}
            />
          </svg>
          {isSpeaking && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-ping" />
          )}
        </div>
        <div className="text-left">
          <p className="text-xs font-semibold text-slate-100 leading-none">{teacher.name}</p>
          <p className="text-[10px] text-emerald-400/90 font-medium">Live Explaining</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[240px]">
      {/* Speaking Aura / Classroom Status */}
      <div className="flex items-center gap-2 mb-2 px-3 py-1 bg-slate-900/80 border border-slate-700/60 rounded-full backdrop-blur-sm">
        <div className="flex items-center gap-1">
          {isSpeaking ? (
            <motion.div
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]"
            />
          ) : (
            <div className="w-2 h-2 rounded-full bg-slate-500" />
          )}
          <span className="text-[11px] font-semibold text-slate-200">
            {isSpeaking ? 'Teaching...' : 'Listening'}
          </span>
        </div>
        {isSpeaking && (
          <div className="flex items-center gap-0.5 ml-1">
            <span className="w-0.5 h-2 bg-emerald-400 animate-pulse" />
            <span className="w-0.5 h-3.5 bg-emerald-400 animate-pulse delay-75" />
            <span className="w-0.5 h-2.5 bg-emerald-400 animate-pulse delay-150" />
          </div>
        )}
      </div>

      {/* Interactive Animated Teacher SVG Figure */}
      <div className="relative w-44 h-56 flex items-end justify-center">
        {/* Glow behind teacher */}
        <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full pointer-events-none" />

        <svg
          viewBox="0 0 200 240"
          className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]"
        >
          <defs>
            <linearGradient id="podiumGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="chalkGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>

          {/* Teacher Torso / Jacket */}
          <path
            d="M55,140 C55,115 75,105 100,105 C125,105 145,115 145,140 L155,230 L45,230 Z"
            fill={jacketColor}
          />

          {/* Shirt / Inner Collar */}
          <polygon points="100,105 85,140 115,140" fill={shirtColor} />
          {/* Tie or Scarf */}
          {isMarcus || isAlan ? (
            <polygon points="98,120 102,120 104,155 100,165 96,155" fill="#DC2626" />
          ) : (
            <path d="M92,120 Q100,135 108,120 Q100,130 92,120 Z" fill="#F59E0B" />
          )}

          {/* Left Arm (holding notes or rested) */}
          <motion.path
            animate={
              gesture === 'explaining'
                ? { d: 'M55,120 Q30,140 45,170' }
                : { d: 'M55,120 Q40,150 50,180' }
            }
            transition={{ duration: 0.5 }}
            stroke={jacketColor}
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
          />
          {/* Left Hand */}
          <circle cx="45" cy="170" r="8" fill={skinTone} />

          {/* Right Arm with Dynamic Gesture */}
          {gesture === 'pointing' && (
            <g>
              {/* Arm pointing towards blackboard (up-right) */}
              <motion.path
                animate={{ d: 'M145,120 Q165,85 190,55' }}
                stroke={jacketColor}
                strokeWidth="16"
                strokeLinecap="round"
                fill="none"
              />
              {/* Hand with pointer stick */}
              <circle cx="190" cy="55" r="7" fill={skinTone} />
              {/* Teacher Laser / Chalk Pointer */}
              <line x1="190" y1="55" x2="215" y2="35" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
              <circle cx="215" cy="35" r="4" fill="#EF4444" className="animate-ping" />
            </g>
          )}

          {gesture === 'writing' && (
            <g>
              {/* Arm reaching to write */}
              <motion.path
                animate={{ d: 'M145,120 Q170,110 185,100' }}
                stroke={jacketColor}
                strokeWidth="16"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="185" cy="100" r="7" fill={skinTone} />
              {/* Piece of White Chalk */}
              <line x1="185" y1="100" x2="198" y2="92" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
            </g>
          )}

          {gesture === 'questioning' && (
            <g>
              {/* Hand on chin */}
              <motion.path
                animate={{ d: 'M145,120 Q155,110 115,85' }}
                stroke={jacketColor}
                strokeWidth="16"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="115" cy="85" r="7" fill={skinTone} />
            </g>
          )}

          {(gesture === 'explaining' || gesture === 'nodding') && (
            <g>
              {/* Welcoming open palm gesture */}
              <motion.path
                animate={
                  isSpeaking
                    ? { d: ['M145,120 Q175,135 165,160', 'M145,120 Q180,130 170,150', 'M145,120 Q175,135 165,160'] }
                    : { d: 'M145,120 Q170,140 160,165' }
                }
                transition={{ repeat: Infinity, duration: 2 }}
                stroke={jacketColor}
                strokeWidth="16"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="165" cy="160" r="8" fill={skinTone} />
            </g>
          )}

          {/* Neck */}
          <rect x="91" y="76" width="18" height="25" fill={skinTone} rx="4" />

          {/* Teacher Head */}
          <motion.g
            animate={
              gesture === 'nodding'
                ? { y: [0, 4, 0, 4, 0] }
                : isSpeaking
                ? { y: [0, -1.5, 0, 1.5, 0] }
                : { y: 0 }
            }
            transition={{ repeat: isSpeaking ? Infinity : 0, duration: 2.2 }}
          >
            {/* Hair Back */}
            {isFemale ? (
              <path
                d="M60,65 C55,20 145,20 140,65 C145,85 140,110 135,115 C130,85 125,75 120,70 C80,70 75,85 65,115 C60,110 55,85 60,65 Z"
                fill={hairColor}
              />
            ) : (
              <path
                d="M68,55 C65,22 135,22 132,55 C135,68 132,80 128,75 C72,75 68,68 68,55 Z"
                fill={hairColor}
              />
            )}

            {/* Face Oval */}
            <ellipse cx="100" cy="62" rx="26" ry="30" fill={skinTone} />

            {/* Hair Front Styling */}
            {isClara && (
              <path d="M74,48 Q100,28 126,48 Q118,36 100,36 Q82,36 74,48 Z" fill={hairColor} />
            )}
            {isMarcus && (
              <path d="M72,44 Q100,32 128,44 Q120,38 100,38 Q80,38 72,44 Z" fill={hairColor} />
            )}
            {isMaya && (
              <path d="M72,50 Q100,30 128,50 Q124,35 100,34 Q76,35 72,50 Z" fill={hairColor} />
            )}
            {isAlan && (
              <path d="M70,42 Q100,28 130,42 Q125,32 100,32 Q75,32 70,42 Z" fill={hairColor} />
            )}

            {/* Eyebrows */}
            <path
              d={gesture === 'questioning' ? 'M85,46 Q92,44 97,48' : 'M86,47 Q92,45 97,47'}
              stroke={hairColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M103,47 Q108,45 114,47"
              stroke={hairColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Glasses (Marcus & Alan) */}
            {(isMarcus || isAlan) && (
              <g stroke="#334155" strokeWidth="2" fill="none">
                <rect x="83" y="49" width="14" height="11" rx="2.5" />
                <rect x="103" y="49" width="14" height="11" rx="2.5" />
                <line x1="97" y1="54" x2="103" y2="54" />
                <line x1="83" y1="54" x2="77" y2="52" />
                <line x1="117" y1="54" x2="123" y2="52" />
              </g>
            )}

            {/* Eyes */}
            {blink ? (
              <g stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round">
                <line x1="86" y1="54" x2="94" y2="54" />
                <line x1="106" y1="54" x2="114" y2="54" />
              </g>
            ) : (
              <g fill="#0F172A">
                <circle cx="90" cy="54" r="3.2" />
                <circle cx="110" cy="54" r="3.2" />
                {/* Eye glint */}
                <circle cx="91.2" cy="53" r="1" fill="#FFFFFF" />
                <circle cx="111.2" cy="53" r="1" fill="#FFFFFF" />
              </g>
            )}

            {/* Nose */}
            <path d="M99,57 Q101,64 98,66 L103,66" stroke="#C2847A" strokeWidth="1.8" strokeLinecap="round" fill="none" />

            {/* Animated Mouth (Speaking Lip-Sync) */}
            {mouthOpen ? (
              <g>
                <ellipse cx="100" cy="74" rx="7" ry="5.5" fill="#881337" />
                {/* Upper teeth */}
                <path d="M95,71 Q100,73 105,71" stroke="#FFFFFF" strokeWidth="2" fill="none" />
                {/* Tongue */}
                <ellipse cx="100" cy="77" rx="4" ry="2.5" fill="#F43F5E" />
              </g>
            ) : (
              <path
                d="M93,73 Q100,78 107,73"
                stroke="#9F1239"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            )}
          </motion.g>

          {/* Wooden Classroom Podium with Microphone */}
          <path
            d="M30,195 L170,195 L180,240 L20,240 Z"
            fill="url(#podiumGrad)"
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Podium Wood Grain Accents */}
          <line x1="30" y1="202" x2="170" y2="202" stroke="#64748B" strokeWidth="1" />
          <line x1="40" y1="216" x2="160" y2="216" stroke="#334155" strokeWidth="1" />

          {/* Podium Badge / University Crest */}
          <circle cx="100" cy="216" r="9" fill="#0F172A" stroke="#CBD5E1" strokeWidth="1" />
          <text x="100" y="219" fontSize="7" fill="#FDE047" textAnchor="middle" fontWeight="bold">🎓</text>

          {/* Goose-neck Gooseneck Mic */}
          <path d="M45,195 Q40,175 52,165" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <ellipse cx="53" cy="163" rx="4" ry="2.5" fill="#334155" stroke="#CBD5E1" strokeWidth="1" />
        </svg>
      </div>

      {/* Teacher Nameplate */}
      <div className="w-full text-center mt-1 px-2 py-1 bg-slate-900/90 border border-slate-700/80 rounded-lg shadow-lg">
        <p className="text-xs font-bold text-slate-100 truncate">{teacher.name}</p>
        <p className="text-[10px] text-emerald-400/90 truncate">{teacher.title}</p>
      </div>
    </div>
  );
};
