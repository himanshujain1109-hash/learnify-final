import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FlashcardItem } from '../types';
import {
  Rotate3d,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  CheckCircle,
  Layers,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface FlashcardsViewerProps {
  flashcards?: FlashcardItem[];
  lessonTitle: string;
}

export const FlashcardsViewer: React.FC<FlashcardsViewerProps> = ({
  flashcards = [],
  lessonTitle,
}) => {
  const [cards, setCards] = useState<FlashcardItem[]>(flashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());

  // Update cards if flashcards prop updates
  React.useEffect(() => {
    if (flashcards && flashcards.length > 0) {
      setCards(flashcards);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [flashcards]);

  if (!cards || cards.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-sm">
        <Layers className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">No Flashcards Available</h3>
        <p className="text-xs text-slate-500 mt-1">
          Flashcards are automatically extracted when you generate or load a lecture.
        </p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const isCurrentMastered = masteredIds.has(currentCard.id);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + cards.length) % cards.length);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
  };

  const toggleMastered = (id: string) => {
    setMasteredIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
            Active Recall Flashcards
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
            Flashcards: {lessonTitle}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            Card {currentIndex + 1} of {cards.length}
          </span>
          <button
            onClick={handleShuffle}
            title="Shuffle cards"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1"
          >
            <Shuffle className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>
        </div>
      </div>

      {/* Flip Card Container */}
      <div className="max-w-xl mx-auto my-3">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="relative min-h-[220px] sm:min-h-[260px] w-full rounded-2xl border-2 cursor-pointer transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between items-center text-center shadow-sm hover:shadow-md active:scale-[0.99] border-slate-200 bg-gradient-to-b from-white to-slate-50/60 group"
          style={{ perspective: '1000px' }}
        >
          {/* Card Category / Status */}
          <div className="w-full flex items-center justify-between text-xs">
            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              {currentCard.category || 'Key Concept'}
            </span>
            <span className="text-[11px] text-indigo-600 font-bold flex items-center gap-1">
              <Rotate3d className="w-3.5 h-3.5 text-indigo-500 group-hover:rotate-180 transition-transform duration-500" />
              {isFlipped ? 'Answer Side' : 'Click to Flip'}
            </span>
          </div>

          {/* Card Body */}
          <div className="my-auto py-3">
            <AnimatePresence mode="wait">
              {!isFlipped ? (
                <motion.div
                  key="front"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-2"
                >
                  <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Term / Question</p>
                  <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {currentCard.front}
                  </h4>
                </motion.div>
              ) : (
                <motion.div
                  key="back"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-2"
                >
                  <p className="text-xs uppercase font-bold text-emerald-600 tracking-wider">Definition & Insight</p>
                  <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
                    {currentCard.back}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Card Footer */}
          <div className="w-full flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            <span>Tap anywhere to flip</span>
            {isCurrentMastered ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Mastered
              </span>
            ) : (
              <span className="text-slate-400">Not mastered yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between max-w-xl mx-auto pt-4">
        <button
          onClick={handlePrev}
          className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={() => toggleMastered(currentCard.id)}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all ${
            isCurrentMastered
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
              : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <CheckCircle className={`w-4 h-4 ${isCurrentMastered ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>{isCurrentMastered ? 'Marked Mastered' : 'Mark as Mastered'}</span>
        </button>

        <button
          onClick={handleNext}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Mastery Progress Bar */}
      <div className="max-w-xl mx-auto mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Cards Mastered: {masteredIds.size} of {cards.length}</span>
        <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${(masteredIds.size / cards.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
