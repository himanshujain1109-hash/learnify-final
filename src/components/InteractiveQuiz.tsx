import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { QuizQuestion } from '../types';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  ArrowRight,
  BrainCircuit
} from 'lucide-react';

interface InteractiveQuizProps {
  questions?: QuizQuestion[];
  lessonTitle: string;
}

export const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({
  questions = [],
  lessonTitle,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Array<{ selected: number; correct: boolean }>>([]);

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-sm">
        <BrainCircuit className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">No Quiz Available Yet</h3>
        <p className="text-xs text-slate-500 mt-1">
          Generate or load a lecture to unlock interactive practice questions.
        </p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctAnswerIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setUserAnswers(prev => [...prev, { selected: idx, correct: isCorrect }]);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
    setUserAnswers([]);
  };

  const percentScore = Math.round((score / questions.length) * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 select-none">
      {/* Quiz Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
            Interactive Practice Quiz
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
            Test Your Knowledge: {lessonTitle}
          </h3>
        </div>

        {!isFinished && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {isFinished ? (
        /* Results Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8 space-y-4 max-w-md mx-auto"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 shadow-sm">
            <Trophy className="w-8 h-8 text-indigo-600" />
          </div>

          <div>
            <h4 className="text-xl font-extrabold text-slate-900">Quiz Completed!</h4>
            <p className="text-sm text-slate-500 mt-0.5">
              You scored <span className="font-bold text-indigo-600">{score}</span> out of{' '}
              <span className="font-bold">{questions.length}</span> ({percentScore}%)
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 text-left space-y-1.5">
            <p className="font-bold text-slate-800">
              {percentScore >= 75
                ? '🌟 Outstanding Mastery!'
                : percentScore >= 50
                ? '👍 Good Effort! Review key slides to reach 100%.'
                : '💡 Keep Practicing! Try reviewing the presentation video again.'}
            </p>
            <p className="text-[11px] text-slate-500">
              Immediate feedback reinforces conceptual memory and long-term retention.
            </p>
          </div>

          <button
            onClick={handleRestart}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 mx-auto shadow-md transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Quiz</span>
          </button>
        </motion.div>
      ) : (
        /* Active Question */
        <div className="space-y-5">
          <div className="space-y-1">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Question {currentIndex + 1}
            </p>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {currentQ.question}
            </h4>
          </div>

          {/* Options List */}
          <div className="space-y-2.5">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = selectedOption === optIdx;
              const isCorrectAnswer = optIdx === currentQ.correctAnswerIndex;

              let optionStyle =
                'bg-slate-50/70 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-800';

              if (isAnswered) {
                if (isCorrectAnswer) {
                  optionStyle =
                    'bg-emerald-50 border-emerald-500 text-emerald-950 font-medium ring-1 ring-emerald-500/30';
                } else if (isSelected && !isCorrectAnswer) {
                  optionStyle =
                    'bg-rose-50 border-rose-400 text-rose-950 font-medium ring-1 ring-rose-400/30';
                } else {
                  optionStyle = 'bg-slate-50/40 border-slate-200 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={isAnswered}
                  className={`w-full p-3 sm:p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${optionStyle}`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border ${
                      isAnswered && isCorrectAnswer
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : isAnswered && isSelected && !isCorrectAnswer
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="text-xs sm:text-sm leading-relaxed flex-1 pt-0.5">
                    {option}
                  </span>
                  {isAnswered && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  {isAnswered && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box on Answer */}
          <AnimatePresence>
            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  selectedOption === currentQ.correctAnswerIndex
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {selectedOption === currentQ.correctAnswerIndex
                      ? 'Correct!'
                      : 'Key Explanation:'}
                  </span>
                </div>
                <p>{currentQ.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next Button */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
              >
                <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
